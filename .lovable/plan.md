

## Plano — Logout SSO (Single Logout) seguro

Hoje o "Sair" do header só chama `supabase.auth.signOut()` — usuários SSO continuam logados no IdP (Azure AD / Okta / Google Workspace), o que é uma falha de segurança em estações compartilhadas. Este plano fecha o ciclo: encerra a sessão local **e** redireciona para o `end_session_endpoint` do IdP quando o usuário entrou via SSO.

### Estado atual

- `useAuth.signOut()` → apenas `supabase.auth.signOut()` local.
- `Header.tsx` chama `signOut()` e redireciona para `/auth`.
- `sso_providers.slo_url` já existe no schema mas nunca é consumido.
- `user_metadata.sso_provider_id` é gravado em todo login SSO (callback) — permite identificar usuários SSO no logout.
- Tokens IdP (`id_token`) **não** são persistidos hoje, então não temos `id_token_hint` para enviar ao `end_session_endpoint` (a maioria dos IdPs aceita logout sem ele, apenas com `post_logout_redirect_uri`).

### Mudanças

**1. Nova edge function `sso-logout`** (`supabase/functions/sso-logout/index.ts`)
- Recebe `{ provider_id }` autenticado via JWT do usuário.
- Resolve `end_session_endpoint`:
  - OIDC: `provider.slo_url` ou descoberto via `discovery_url` (`end_session_endpoint`).
  - SAML: `provider.slo_url` (HTTP-Redirect binding com `SAMLRequest` LogoutRequest assinado é fora de escopo nesta versão; usa redirect simples).
- Monta URL com `post_logout_redirect_uri=${origin}/auth?slo=ok` e `client_id`.
- Registra evento `logout` em `sso_login_attempts` (success=true, error_code='slo_initiated').
- Retorna `{ logout_url }`.
- `verify_jwt = false` no código + validação manual via `getClaims()` (padrão do projeto).

**2. `useAuth.signOut()` enriquecido** (`src/hooks/useAuth.tsx`)
- Antes de `supabase.auth.signOut()`, lê `user.user_metadata.sso_provider_id`.
- Se existe: invoca `sso-logout`, faz `signOut()` local (revoga sessão Supabase), depois `window.location.href = logout_url` (não usa `navigate` porque o IdP precisa de full redirect).
- Se não existe (login normal): comportamento atual.
- Falha do `sso-logout` não bloqueia: faz logout local e mostra toast "Sessão local encerrada — finalize manualmente no IdP".

**3. `Auth.tsx` — feedback de SLO** (já existente)
- Detecta `?slo=ok` na URL e exibe toast "Você saiu de todas as sessões corporativas".
- Limpa o query param após mostrar.

**4. UI do provider** (`src/components/admin/sso/SSOWizardDialog.tsx`)
- Adicionar campo "URL de logout (SLO)" — opcional para OIDC (usa discovery), recomendado para SAML.
- Tooltip explicando que sem `slo_url` e sem `discovery_url.end_session_endpoint`, o logout só será local.

### Detalhes técnicos

- **Sem `id_token_hint`**: aceitável pelos 3 IdPs principais (Azure, Okta, Google) quando `client_id` + `post_logout_redirect_uri` estão presentes.
- **`post_logout_redirect_uri` allowlist**: o admin precisa cadastrar `${origin}/auth` no IdP (mesma lista do `redirect_uri` do callback). Documentar no `ScimSetupGuide` futuramente — fora desta entrega.
- **Multi-tab**: `onAuthStateChange` propaga o `SIGNED_OUT` para outras abas Supabase. O logout do IdP já é global por natureza.
- **CORS**: `sso-logout` retorna JSON; o redirect final é navegação top-level no browser, sem preocupações de CORS.
- **Auditoria**: além de `sso_login_attempts`, grava em `audit_logs` (`action='LOGOUT'`, `details='SSO SLO via {provider.nome}'`).

### Fora de escopo

- SAML LogoutRequest assinado (HTTP-Redirect/POST binding com `SignatureAlgorithm`) — exige biblioteca XML signing no Deno, complexidade alta.
- Back-channel logout (RP-initiated logout via webhook do IdP avisando o app).
- Revogação ativa de refresh tokens IdP via endpoint de revocation.
- Logout global multi-tenant (usuário em várias empresas — hoje a sessão Supabase é única).

