

## Plano — SSO empresarial real + SCIM + multi-empresa

Hoje o módulo `/admin/sso` apenas configura provedores na tabela `sso_providers`, mas não há fluxo de login SSO funcional, provisionamento automático de usuários nem suporte multi-tenant. Este plano fecha esses gaps.

### Estado atual

- ✅ Tabelas `sso_providers`, `sso_role_mappings`, `sso_login_attempts` + UI wizard.
- ✅ Edge functions `sso-validate-config`, `sso-generate-metadata`, `sso-test-login`.
- ❌ Sem botão "Entrar com SSO" na página `/auth`.
- ❌ Sem callback OIDC/SAML real → criação de sessão Supabase.
- ❌ `user_roles` é 1-papel-por-usuário (não suporta múltiplas empresas).
- ❌ Sem SCIM 2.0 para sincronização automática de usuários/grupos.

### Escopo (3 frentes)

```text
1. Multi-empresa     → tabela user_empresas (user_id × empresa_id × role)
2. Login SSO real    → botão /auth + edge functions de inicialização/callback
3. SCIM 2.0          → endpoint /scim/v2/* com token, Users + Groups CRUD
```

### 1. Schema (migração nova)

```sql
-- Vínculo many-to-many usuário ↔ empresa com papel por empresa
CREATE TABLE public.user_empresas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'visualizador',
  is_default BOOLEAN DEFAULT false,
  provisioned_via TEXT CHECK (provisioned_via IN ('manual','sso','scim')) DEFAULT 'manual',
  scim_external_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, empresa_id)
);
CREATE INDEX ON user_empresas(user_id);
CREATE INDEX ON user_empresas(empresa_id);

-- Tokens SCIM por provedor SSO (escopo bearer)
CREATE TABLE public.scim_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID REFERENCES sso_providers(id) ON DELETE CASCADE,
  empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,           -- SHA-256 do bearer
  token_prefix TEXT NOT NULL,                -- primeiros 8 chars p/ exibição
  nome TEXT NOT NULL,
  expires_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  ativo BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Log de operações SCIM (auditoria)
CREATE TABLE public.scim_operations_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id UUID REFERENCES scim_tokens(id) ON DELETE SET NULL,
  empresa_id UUID,
  resource_type TEXT,                        -- Users | Groups
  operation TEXT,                            -- create|update|delete|patch|list
  external_id TEXT,
  user_id UUID,
  status_code INT,
  request_body JSONB,
  response_body JSONB,
  duration_ms INT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Vínculo provedor SSO ↔ empresa (1 provider pode atender N empresas)
ALTER TABLE sso_providers ADD COLUMN empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE;
CREATE INDEX ON sso_providers(empresa_id);

-- RLS: admin gerencia tudo; usuário vê apenas seus próprios vínculos
ALTER TABLE user_empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE scim_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE scim_operations_log ENABLE ROW LEVEL SECURITY;

-- Função helper: papel do usuário em uma empresa
CREATE FUNCTION has_role_in_empresa(_user UUID, _empresa UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_empresas
    WHERE user_id = _user AND empresa_id = _empresa AND role = _role
  );
$$;
```

Auditoria via trigger `fn_audit_sso_changes` (já existe) replicada para `user_empresas` e `scim_tokens` (sem o token).

### 2. Login SSO real

**Página `/auth` (ajuste em `Auth.tsx`)**:
- Detecta domínio do e-mail digitado e busca `sso_providers` ativos com domínio em `allowed_domains`.
- Se `force_sso_for_domains=true`, esconde campo de senha.
- Renderiza botões "Entrar com {provider.nome}" usando `provider.preset.logo/cor`.

**Edge functions novas**:

| Função | Verbo | Responsabilidade |
|---|---|---|
| `sso-initiate` | POST | Recebe `{provider_id, empresa_id?}`. Para OIDC: monta authorize URL + PKCE/state em `sso_login_attempts`. Para SAML: monta SAMLRequest assinado. Retorna `redirect_url`. |
| `sso-callback` | GET | Recebe `code+state` (OIDC) ou `SAMLResponse` (SAML). Valida assinatura/JWKS, troca por tokens, extrai claims, faz upsert em `auth.users` + `profiles` + `user_empresas` aplicando `sso_role_mappings`, gera magic link via Admin API e redireciona com sessão. |
| `sso-jit-provision` | helper interno | Lógica compartilhada de provisionamento JIT (just-in-time). |

Padrões: CORS oficial, `verify_jwt=false` no callback (público por natureza), validação Zod, log em `sso_login_attempts`, latência registrada.

### 3. SCIM 2.0

**Endpoint único `scim-server` (edge function)** roteia por path:

```
GET    /scim/v2/ServiceProviderConfig
GET    /scim/v2/Schemas
GET    /scim/v2/ResourceTypes
GET    /scim/v2/Users?filter=...&startIndex=...&count=...
POST   /scim/v2/Users                  → cria + envia convite
GET    /scim/v2/Users/:id
PUT    /scim/v2/Users/:id              → replace
PATCH  /scim/v2/Users/:id              → operations [{op,path,value}]
DELETE /scim/v2/Users/:id              → soft-deactivate (active=false)
GET    /scim/v2/Groups                  → mapeia para sso_role_mappings
POST   /scim/v2/Groups
PATCH  /scim/v2/Groups/:id              → membership add/remove → user_empresas
```

- **Auth**: `Authorization: Bearer <token>` validado contra `scim_tokens.token_hash` (SHA-256). Token vinculado a `empresa_id` → escopo isolado.
- **Schema mapping**: `userName→email`, `name.formatted→full_name`, `active→user_empresas.ativo`, `groups→sso_role_mappings`.
- **Padrão SCIM 2.0**: respostas `application/scim+json`, `Resources/totalResults/itemsPerPage`, erros `{schemas:["urn:ietf:params:scim:api:messages:2.0:Error"], detail, status}`.
- Filtro mínimo: `userName eq "x@y"`, `externalId eq "..."`.
- Log completo em `scim_operations_log` (chunked se >100KB).

### 4. UI nova/atualizada

```
src/pages/admin/SSOAdmin.tsx           +tab "SCIM Tokens"
src/components/admin/sso/
  ScimTokensTab.tsx                   ← gerar/revogar/listar (token mostrado 1x)
  ScimEndpointCard.tsx                ← URL base + bearer + docs colável no IdP
  EmpresaScopePicker.tsx              ← seletor de empresa nos providers/tokens
  SsoLoginButtons.tsx (em Auth.tsx)   ← botões dinâmicos por domínio

src/pages/admin/MinhasEmpresas.tsx     ← lista user_empresas + switcher
src/components/layout/EmpresaSwitcher  ← dropdown no header (já há `useEmpresas`, agora restringe pela RLS)

src/hooks/
  useScimTokens.ts                     CRUD + revoke (mutation rotaciona hash)
  useUserEmpresas.ts                   lista vínculos + switcher de "empresa atual" via localStorage
```

### 5. Integração com `useAuth`

- Após login (qualquer método), `fetchProfile` passa a buscar **lista** `user_empresas` em vez de papel único.
- Novo `currentEmpresaId` em `AuthContext` (default `is_default=true`, fallback primeiro vínculo).
- `hasRole(roles, empresaId?)` aceita escopo opcional; sem `empresaId` usa a empresa atual.
- Componentes existentes que usam `role` continuam funcionando (compat: `role` = papel na empresa atual).

### 6. Segurança

- Tokens SCIM: gerados com `crypto.randomUUID()` + 32 bytes random base64url, mostrados **uma única vez**, persistidos como SHA-256.
- Rate limit por token (60 req/min) reaproveitando padrão de `cnpja_check_rate_limit`.
- Trigger valida que não se cria `user_empresas` com role superior ao do token criador.
- `sso_login_attempts` ganha colunas `state`, `code_verifier_hash`, `expires_at` (5min) para OIDC PKCE.

### 7. Documentação

Aba "Documentação" do `SSOAdmin` ganha 3 novas seções:
- **Onboarding multi-empresa**: como vincular usuários a empresas via SCIM
- **Endpoints SCIM**: tabela com paths e exemplos cURL
- **Mapeamento de grupos**: convenção `<empresa>-<papel>` (ex: `acme-financeiro`)

### Detalhes técnicos

- **OIDC**: usa `oslo` (deno) ou implementação manual JWT/JWKS via `jose`. Discovery cacheado 1h em memória da edge.
- **SAML**: parser/assertion via `samlify` (npm) ou implementação manual (validação de assinatura X.509 + canonicalização). Preferir `samlify` se disponível em Deno; senão validação reduzida MVP.
- **PKCE**: SHA-256 do `code_verifier` armazenado em `sso_login_attempts.code_verifier_hash`; verifier no localStorage do browser → enviado no callback.
- **Magic link p/ Supabase session**: callback chama `supabase.auth.admin.generateLink({type:'magiclink', email})` e redireciona ao `properties.action_link`.
- **SCIM filter parser**: subset (`eq` + `and`), suficiente para Azure AD e Okta.
- **Latência alvo**: callback < 500ms, SCIM list < 200ms.
- **Acessibilidade**: botões SSO com `aria-label="Entrar com {provider}"`, contraste AA.

### Fora de escopo

- Logout SAML SLO (apenas redirect local nesta versão).
- Re-encryption de tokens SCIM antigos (rotacionar via interface).
- SCIM filter complexo (`co`, `sw`, `pr`, paréteses aninhados).
- Just-in-time provisioning de empresas (admin precisa criar a empresa antes; SCIM só cria usuários e vínculos).
- Múltiplos IdPs no mesmo domínio com seleção interativa (escolhe o primeiro `ordem` ASC).

