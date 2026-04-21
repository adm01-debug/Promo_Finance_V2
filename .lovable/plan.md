

## Plano — Sandbox de testes SSO end-to-end

Nova aba **"Sandbox"** em `/admin/sso` que permite ao administrador simular um login SSO completo sem efeitos colaterais (sem criar usuário, sem session). Hoje o backend `sso-test-login` já existe mas não tem UI. Este plano expõe o sandbox e amplia a função para responder se o usuário **seria** criado ou já existe.

### Componentes

**1. Edge function `sso-test-login` ampliada** (`supabase/functions/sso-test-login/index.ts`)
- Aceita opcionalmente `provider_id` no payload.
- Quando presente, com auth Bearer do admin (validação via `getClaims`), busca o provider e usa seus campos reais (`claim_mapping`, `role_mappings`, `default_role`, `allowed_domains`, `auto_provision_users`) — admin não precisa repetir nada.
- Verifica em `auth.users` (via service role) se o email resultante já existe → retorna `user_exists: true|false` e `would_jit_provision: boolean` (existing OR auto_provision).
- Mantém compatibilidade com chamada manual (sem `provider_id`).
- Nunca cria usuário, nunca grava em `sso_login_attempts`, nunca emite token.

**2. Nova aba `SSOSandboxPanel.tsx`** (`src/components/admin/sso/SSOSandboxPanel.tsx`)
- **Seletor de provider** (dropdown com providers ativos via `useSSOProviders`).
- **Botão "Carregar exemplo"** com 3 presets de claims por tipo de IdP (Azure AD, Okta, Google), gerados a partir de `IDP_PRESETS`.
- **Editor JSON** (`<Textarea>` monoespaçado) para `mock_claims` com validação JSON em tempo real e badge "JSON válido / inválido".
- **Toggle "Usar config do provider"**: quando ativo, o backend ignora os campos manuais; quando desativo, mostra editores extras de `claim_mapping`, `default_role`, `allowed_domains` (chips), e `role_mappings` (lista editável grupo→role).
- **Botão "Simular login"** chama `useTestSSOLogin`.
- **Resultado em cards verticais (timeline)** com ícone ✓/✗ por etapa:
  1. Parsing de claims → email, full_name, grupos extraídos.
  2. Validação de domínio → permitido / bloqueado (com domínio mostrado).
  3. Resolução de papel → `default_role` ou grupo casado (mostra qual).
  4. Provisionamento → "Usuário já existe (id mascarado)" / "Seria criado via JIT" / "Bloqueado: auto_provision desabilitado".
  - Bloco final com JSON cru da resposta (collapsible) para debug.
- Toast de sucesso/erro ao simular.

**3. Wiring em `SSOAdmin.tsx`**
- Adiciona `<TabsTrigger value="sandbox">` com ícone `FlaskConical` entre "SCIM" e "Monitoramento".
- `<TabsContent value="sandbox">` renderiza `<SSOSandboxPanel />`.

### Detalhes técnicos

- **Segurança**: `sso-test-login` exige Bearer token e `has_role(uid, 'admin')` quando `provider_id` é fornecido (impede que usuário comum vaze `claim_mapping` de outros). Sem `provider_id`, função fica stateless e pública (já é hoje).
- **Email mascarado**: na resposta de existência, retorna apenas `j****@empresa.com` para evitar enumeração lateral.
- **Sem side effects**: nenhuma escrita em `sso_login_attempts`, `audit_logs`, `auth.users`, `user_roles` ou `user_empresas`.
- **Validação JSON**: erro de parse mostra inline com linha/coluna; botão "Simular" fica disabled.
- **Presets de mock**: por exemplo Azure AD usa `{ email, name, oid, groups: ["admins-grupo"], preferred_username }`; Okta usa `{ email, name, groups }`; Google usa `{ email, name, hd, picture }`.

### Fora de escopo

- Simulação real de OAuth handshake (PKCE/exchange) — o sandbox foca no pós-callback (mapping + JIT), que é onde 95% dos erros acontecem.
- Salvar histórico de simulações.
- Exportar relatório de simulação em PDF.
- Sandbox para SCIM (já há painel separado de tokens).

