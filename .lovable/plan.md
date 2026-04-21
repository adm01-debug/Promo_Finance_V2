

## Plano — Provisionamento SCIM completo refletindo `user_empresas` e roles por empresa

### Diagnóstico

A edge function `scim-server` (202 linhas) tem o esqueleto SCIM 2.0 funcionando, mas o **provisionamento real está incompleto** para o pedido "criação/patch de Users e Groups reflete automaticamente `user_empresas` e roles por empresa":

1. **Role hard-coded** — `POST /Users` faz upsert em `user_empresas` com `role: "visualizador"` fixo, ignorando o atributo SCIM `enterprise.department` que provedores (Okta/Azure) enviam exatamente para isso.
2. **PATCH só processa `active`** — não trata `replace` em `enterprise.department`, `name.formatted`, `displayName` ou `emails[primary eq true].value`. Mudança de role pelo IdP não chega ao banco.
3. **PUT sem replace completo** — atualmente só lê `active`; PUT em SCIM exige replace de todos os atributos.
4. **`user_roles` nunca é sincronizado** — `user_empresas.role` é atualizado, mas o RBAC global (`user_roles`) que o `useAuth` lê fica defasado, então o usuário SCIM-provisionado entra como `visualizador` mesmo sendo `admin` na empresa.
5. **Groups são read-only e fake** — só lista `sso_role_mappings`, sem `members`, sem POST/PATCH/DELETE. IdPs que sincronizam grupos (Azure AD com group claims, Okta push groups) recebem 501.
6. **Lookup de usuário por email não escala** — `admin.auth.admin.listUsers()` sem filtro server-side (default 50). Mesmo bug já corrigido no `sso-callback`.
7. **Resolução de role inconsistente com SSO** — `sso-callback` usa `sso_role_mappings` para mapear grupo→role; SCIM ignora essa tabela. Resultado: mesma pessoa entrando por SSO vs. SCIM ganha roles diferentes.
8. **Discovery incompleto** — `Schemas` e `ResourceTypes` ausentes; Okta/Azure travam no setup wizard porque consultam esses endpoints antes de provisionar.

### Mudanças

**Único arquivo:** `supabase/functions/scim-server/index.ts` (rewrite mantendo o contrato externo).

#### A. Discovery completo (público, sem token)

- `GET /scim/v2/ServiceProviderConfig` — manter (já ok).
- `GET /scim/v2/ResourceTypes` — novo. Lista `User` e `Group` com schemas e endpoints.
- `GET /scim/v2/Schemas` e `GET /scim/v2/Schemas/{id}` — novos. Devolvem core User, core Group e extensão `enterprise:2.0:User`.

#### B. Resolução de role unificada (helper compartilhado)

Nova função `resolveRole(admin, providerId, hint)` com prioridade:

1. Se `hint` (vindo de `enterprise.department` ou `displayName` de Group) é valor válido do enum `app_role` (`admin|financeiro|operacional|visualizador`) → usa direto.
2. Senão consulta `sso_role_mappings` filtrando por `provider_id = token.provider_id` e `idp_group = hint` → retorna `app_role`.
3. Fallback: `visualizador`.

Garante que SCIM e `sso-callback` produzem a mesma role para o mesmo grupo do IdP.

#### C. `/Users` provisionamento real

- **POST**:
  - Lookup determinístico por email: `admin.auth.admin.listUsers({ filter: \`email.eq.${email}\` })` com fallback em `profiles.email` via select direto (resolve o bug das 50 contas).
  - Cria `auth.user` se ausente (`email_confirm: true`, `user_metadata.full_name`, `user_metadata.scim_provisioned: true`).
  - Resolve role via `resolveRole(token.provider_id, body['urn:...:enterprise:2.0:User']?.department)`.
  - **Upsert atômico em `user_empresas`** com `provisioned_via='scim'`, `scim_external_id`, `ativo`, `role` resolvida.
  - **Sync `user_roles`**: insere a role resolvida se ainda não existir para o usuário (não remove roles preexistentes — RBAC é aditivo no projeto).
  - Resposta SCIM 201 com schema enterprise populado.
- **PATCH** parser completo de `Operations[]` (`add|replace|remove`):
  - `active` → `user_empresas.ativo`.
  - `urn:ietf:params:scim:schemas:extension:enterprise:2.0:User:department` → re-resolve role e atualiza `user_empresas.role` + sincroniza `user_roles`.
  - `name.formatted` / `displayName` → `profiles.full_name`.
  - `emails[primary eq true].value` → log + 400 se diferente do email atual (auth não permite trocar email via SCIM sem fluxo de confirmação).
  - `externalId` → `user_empresas.scim_external_id`.
  - Op não suportada → 400 com `scimType: "invalidPath"`.
- **PUT**: tratado como replace completo aplicando o mesmo pipeline do POST sobre o registro existente; campos ausentes voltam aos defaults SCIM (`active=true`, role via department ou fallback).
- **DELETE**: soft-delete (`ativo=false`) capturando `user_id` e `scim_external_id` **antes** do update para o log ficar completo. **Não** apaga vínculos em outras empresas nem o `auth.user` global.
- **GET list**: parser de filtro mais robusto (`userName eq`, `emails eq`, `externalId eq`, `active eq`, combinação `and`); 400 explícito para filtros não suportados.

#### D. `/Groups` mapeado para `sso_role_mappings` + members reais

Cada grupo SCIM = 1 linha em `sso_role_mappings` do provider do token. **Members do grupo = `user_empresas` da empresa cuja `role` bate com `app_role` do mapping.**

- **GET list**: paginação + filtro `displayName eq`. Cada Group inclui `members: [{ value: link.id, display: profile.email, type: "User" }]`.
- **GET /{id}**: 404 se mapping não pertence a um provider da empresa do token.
- **POST**: cria `sso_role_mappings { provider_id: token.provider_id, idp_group: displayName, app_role: resolveRole(displayName) }`. 400 se token foi emitido sem `provider_id`.
- **PATCH** (operação principal para refletir grupos vindos do IdP):
  - `replace displayName` → renomeia `idp_group`.
  - `add members` → para cada `value` (UUID de `user_empresas` da empresa), seta `role = mapping.app_role` + sync `user_roles`.
  - `remove members` → para cada `value`, faz downgrade da role para `visualizador` (não remove o vínculo — empresa ainda existe pro user).
  - `replace members` → diff: aplica add nos novos, remove nos que saíram.
- **PUT**: replace completo (displayName + members).
- **DELETE**: remove o mapping; **não** mexe em `user_empresas` (preserva acesso histórico).

#### E. Auth + isolamento + log

- Bearer SHA-256 + `expires_at`/`ativo` (já existe).
- Toda query SCIM filtrada por `empresa_id = token.empresa_id` — token de empresa A nunca enxerga recurso de empresa B (mesmo via UUID conhecido).
- `scim_operations_log` recebe entrada para **toda** request (200/201/204/4xx/5xx) com `request_body` e `response_body` truncados, `duration_ms`, `external_id`, `user_id`.

### O que NÃO muda

- Schema do banco: `scim_tokens`, `scim_operations_log`, `user_empresas`, `user_roles`, `sso_role_mappings`, `profiles` ficam intactos.
- `supabase/config.toml`: `[functions.scim-server] verify_jwt = false` já está configurado.
- Hooks frontend (`useScimTokens`, `ScimTokensTab`, `SSOAdmin`) — sem mudanças.
- `sso-callback` — sem mudanças (a função `resolveRole` é interna ao `scim-server`; a tabela `sso_role_mappings` continua sendo o ponto de verdade compartilhado).

### Critério de pronto

1. `POST /Users` com `enterprise.department = "admin"` cria `user_empresas` com `role='admin'` para a empresa do token e adiciona `user_roles` correspondente.
2. `POST /Users` com `department` igual a um `idp_group` cadastrado em `sso_role_mappings` resolve a role via mapping.
3. `PATCH /Users/{id}` com `replace` em `enterprise.department` muda `user_empresas.role` e sincroniza `user_roles`.
4. `PATCH /Users/{id}` com `replace active=false` desativa o vínculo (mantém em outras empresas).
5. `POST /Groups` cria mapping em `sso_role_mappings`; `PATCH add members` aplica a role do grupo aos `user_empresas.id` referenciados.
6. `GET /Groups/{id}` retorna lista real de members baseada em `user_empresas.role`.
7. Token de empresa A não consegue ler/escrever nenhum recurso de empresa B (testado com UUIDs cruzados).
8. `GET /Schemas` e `/ResourceTypes` retornam 200 — Okta passa do setup wizard.
9. JIT funciona com >50 usuários no `auth.users` (sem duplicar).
10. `scim_operations_log` tem 1 linha por request, com `empresa_id` correto.
11. Sem regressão em `useScimTokens` / `ScimTokensTab`.

### Arquivos

- ✏️ `supabase/functions/scim-server/index.ts` — rewrite completo cobrindo discovery, role mapping, PATCH/PUT completos, Groups com members reais e sync de `user_roles`

