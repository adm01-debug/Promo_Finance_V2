

## Plano — Sincronizar perfil do usuário SSO em cada login

### Diagnóstico

Hoje, em `supabase/functions/sso-callback/index.ts` (`applyPipeline`):

- **Usuário existente (caminho OIDC, linhas 192-208)** já atualiza `full_name` se diferente — mas apenas esse campo, sem trim/normalização e sem auditoria.
- **Caminho SAML (linhas 223-249)** faz a mesma atualização, idem só `full_name`.
- **Demais campos potencialmente úteis** vindos do IdP — `avatar_url` (foto), `telefone` — não são extraídos nem propagados, mesmo que o `claim_mapping` do provider permita.
- O hook `useAuth` carrega `profiles` no `SIGNED_IN`, então qualquer alteração feita no callback aparece na UI logo após o login. O ponto fraco está só no callback.

### Comportamento

Em todo login SSO (OIDC ou SAML), o `sso-callback` deve:

1. Extrair, além de `email`/`full_name`/`groups`, dois campos opcionais novos: `avatar_url` e `phone`.
2. Para cada campo, comparar com o valor atual em `profiles` + `auth.users.user_metadata` e atualizar **somente o que mudou** (diff seletivo, nunca apaga campo já preenchido com valor vazio do IdP).
3. Aplicar `trim()` e ignorar strings vazias.
4. Quando houver pelo menos um campo alterado, gravar 1 registro em `audit_logs` com `action="UPDATE"`, `table_name="profiles"`, `details` listando os campos alterados, `old_data`/`new_data` com os valores anteriores e novos (apenas dos campos que mudaram).
5. Cobrir os 3 caminhos: usuário existente OIDC, usuário existente SAML, e o caso JIT (quando o usuário acabou de ser criado, os dados já entram corretos via `createUser`/trigger `handle_new_user` — só precisa garantir que o `profiles` recebe `avatar_url`/`telefone` se vieram).

### Detalhes técnicos

**1. `claim_mapping` — nada a migrar**

A coluna `sso_providers.claim_mapping` é `jsonb` livre. Hoje o uso é `{ email, full_name, groups }`. Vamos passar a aceitar opcionalmente `{ avatar_url, phone }` no mesmo objeto, sem schema change. Defaults se ausentes:
- `avatar_url` → `picture` (padrão OIDC)
- `phone` → `phone_number` (padrão OIDC)

**2. Helper novo `extractClaim(meta, appMeta, key, fallbackKey)` em `sso-callback/index.ts`**

Centraliza a lógica de pegar `meta[cm[key] || fallbackKey] ?? meta[fallbackKey] ?? appMeta[…]` com `trim()` e retorna `string | null`.

**3. Refator em `applyPipeline`**

Trocar o input de `fullName: string` para um `claims: { fullName: string; avatarUrl: string | null; phone: string | null }`. Os dois call-sites (linha 418 OIDC e 597 SAML) extraem os 3 campos via `extractClaim` e passam o objeto.

**4. Nova função `syncUserProfile(admin, userId, currentUser, currentProfile, claims, providerId)` que:**

- Calcula `diff` comparando cada campo (`full_name`, `avatar_url`, `telefone`) entre claims (não-nulos/vazios) e o que está em `profiles` ou `auth.users.user_metadata`.
- Se `diff` vazio mas `sso_provider_id` no metadata difere → atualiza só metadata.
- Se há diff:
  - `admin.auth.admin.updateUserById(userId, { user_metadata: { ...meta, full_name?, avatar_url?, phone?, sso_provider_id } })`
  - `admin.from("profiles").update({ ...diff }).eq("id", userId)` — só os campos mudados.
  - Insert em `audit_logs` com `action="UPDATE"`, `table_name="profiles"`, `record_id=userId`, `old_data`/`new_data` parciais e `details = "Sincronização SSO ({providerNome}): atualizado {campos}"`.
- Erros engolidos com `console.warn` — sincronização nunca derruba o login.

**5. Cobertura JIT**

Após `createUser`, se o claim trouxe `avatar_url`/`phone` (não vão por `createUser`), aplicar um `profiles.update` com esses campos. O `full_name` já vai por `handle_new_user` via `raw_user_meta_data`.

### Critério de pronto

1. Usuário SSO já existente com nome alterado no IdP → próximo login atualiza `profiles.full_name` e `auth.users.user_metadata.full_name`.
2. Mesmo usuário recebendo `picture` ou `phone_number` no claim → `profiles.avatar_url` e `profiles.telefone` atualizados.
3. Campo ausente/vazio no IdP **não** apaga valor preenchido no perfil.
4. Sincronização gera registro em `audit_logs` com `table_name=profiles`, listando campos alterados em `old_data`/`new_data`/`details`.
5. Sincronização funciona em OIDC e SAML.
6. JIT com claims `avatar_url`/`phone` cria perfil já com esses campos.
7. Falha em qualquer parte da sincronização não derruba o login (warn no console).
8. Sem migração de schema; sem mudança no frontend (`useAuth` já recarrega `profiles` no `SIGNED_IN`).

### Arquivos

- ✏️ `supabase/functions/sso-callback/index.ts` — novo helper `extractClaim`, nova função `syncUserProfile`, refator de `applyPipeline` para receber objeto `claims`, atualização dos 2 call-sites (OIDC linha ~418, SAML linha ~597) e do branch JIT.

</parameter>
</invoke><lov-plan>

## Plano — Sincronizar atributos do IdP no perfil a cada login SSO

### Diagnóstico

`applyPipeline` em `supabase/functions/sso-callback/index.ts` (linhas 192-250) já tem **a intenção** de atualizar o perfil, mas só cobre `full_name` e tem três limitações:

1. **Apenas `full_name`** é propagado para `auth.users.user_metadata` e `public.profiles`. O IdP normalmente envia também avatar (`picture`) e telefone (`phone_number`/`phoneNumbers[0].value`), mas eles são ignorados.
2. **`claim_mapping`** do provider (`provider.claim_mapping`) só conhece `email`, `full_name`, `groups` (vide handlers OIDC linha 393-403 e SAML linha 582-584). Não há mapeamento explícito para avatar e telefone.
3. **Sem trilha de auditoria**: quando o nome muda no IdP e é sincronizado, o admin não vê esse evento em `/audit-logs`.

A trilha JIT recém-implementada (`sso_jit_provisioning`) só dispara em primeira passagem. Atualizações silenciosas em logins subsequentes ficam invisíveis.

### Comportamento

A cada login SSO de usuário **já existente** (OIDC ou SAML), comparar os claims recebidos contra o estado atual do perfil e:

1. **Atualizar campos divergentes** em `auth.users.user_metadata` e `public.profiles`:
   - `full_name` (já feito) — preservado.
   - `avatar_url` ← claim `picture` (default OIDC) ou mapeado em `claim_mapping.avatar_url`.
   - `telefone` ← claim `phone_number` / `phone` ou mapeado em `claim_mapping.telefone`.
2. **Normalizar valores** antes de comparar: `trim()`, vazio vira `null`, `full_name === email` é tratado como ausente (já é hoje).
3. **Só gravar se houver diferença real** — evita escrita desnecessária e timestamps `updated_at` fantasmas.
4. **Registrar em `audit_logs`** um único evento por sincronização com `table_name = "sso_profile_sync"`, listando os campos que mudaram (chave + valor antigo + valor novo).
5. **Não sobrescrever com vazio**: se o IdP não enviar `picture` num login posterior, o avatar atual fica preservado (sync é "merge", não "replace").

Funciona tanto no caminho OIDC (`applyPipeline` com `existingUserId=null` e `findUserByEmail` retorna match) quanto no SAML finalize (`existingUserId` preenchido pelo broker).

### Detalhes técnicos

**Backend** — único arquivo: `supabase/functions/sso-callback/index.ts`

1. **Extrair claims extras nos handlers**:
   - OIDC handler (~linha 393): além de `fullName`, ler `avatarUrl` e `telefone` via mesmo padrão `meta[cm.avatar_url || "picture"] ?? meta.picture ?? appMeta.picture` e `meta[cm.telefone || "phone_number"] ?? meta.phone_number ?? meta.phone`.
   - SAML handler (~linha 582): mesmo padrão sobre `claims`.
   - Passar como campos opcionais `avatarUrl?: string | null; telefone?: string | null` em `applyPipeline`.

2. **Helper `buildProfileSyncDelta`** dentro do arquivo (puro):
   ```ts
   function buildProfileSyncDelta(
     current: { full_name: string | null; avatar_url: string | null; telefone: string | null },
     incoming: { full_name?: string | null; avatar_url?: string | null; telefone?: string | null },
     email: string,
   ): { changes: Record<string, { from: unknown; to: unknown }>; updates: Record<string, string> }
   ```
   Regras:
   - Para cada campo, normaliza `incoming` (trim, vazio→null).
   - `full_name === email` é descartado (compatível com lógica atual).
   - Se `incoming` é `null/undefined`, ignora (não sobrescreve com vazio).
   - Se diferente do `current`, adiciona em `changes` e `updates`.

3. **Refatorar bloco de update** (linhas 196-208 e 236-248):
   - Buscar `current` em `profiles` (`full_name, avatar_url, telefone`) **uma vez**.
   - Calcular delta.
   - Se `Object.keys(updates).length > 0`:
     - `admin.auth.admin.updateUserById(userId, { user_metadata: { ...meta, ...mappedToMeta, sso_provider_id: providerId } })` (mantém `sso_provider_id` sempre alinhado).
     - `admin.from("profiles").update(updates).eq("id", userId)`.
     - Inserir em `audit_logs` com `table_name = "sso_profile_sync"`, `action = "UPDATE"`, `new_data = { provider_id, provider_nome, changes, via }`, `details = "Sincronização SSO ({providerNome}): {n} campo(s) atualizado(s)"`.
   - Caso contrário: nenhum write nem audit.

4. **Update do `sso_provider_id`** continua ocorrendo independente do delta (necessário para `signOut` SSO funcionar).

5. **Falhas no insert de audit** engolidas com `console.warn` (mesmo padrão da trilha JIT).

**Frontend** — `src/components/audit/AuditLogTable.tsx`: adicionar 1 linha em `tableNameLabels`:
```ts
sso_profile_sync: 'Sincronização de Perfil (SSO)',
```

**Sem migrações, sem mudança de schema, sem mudança de RLS**. Colunas já existem em `profiles` (verificado: `full_name`, `avatar_url`, `telefone`).

### Critério de pronto

1. Login SSO de usuário existente em que o IdP envia novo `full_name` → perfil atualizado (`auth.users.user_metadata.full_name` + `profiles.full_name`) e registro em `audit_logs` com `table_name = "sso_profile_sync"` listando `{from, to}`.
2. Mesmo comportamento para `avatar_url` (claim `picture`) e `telefone` (claim `phone_number`).
3. Mapeamento custom: provider com `claim_mapping = { full_name: "displayName", avatar_url: "photoUrl" }` usa essas chaves.
4. Login sem mudanças → nenhum write em `profiles` nem em `audit_logs`.
5. IdP que não envia `picture` num login posterior → avatar atual preservado (não vira `null`).
6. Trilha JIT (`sso_jit_provisioning`) recém-implementada continua funcionando sem regressão na primeira passagem.
7. Filtro `/audit-logs → Tabela: Sincronização de Perfil (SSO)` retorna os eventos de sync.

### Arquivos

- ✏️ `supabase/functions/sso-callback/index.ts` (extração de claims extras + helper `buildProfileSyncDelta` + refator dos 2 blocos de update + audit `sso_profile_sync`).
- ✏️ `src/components/audit/AuditLogTable.tsx` (1 linha em `tableNameLabels`).

