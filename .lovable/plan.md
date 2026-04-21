

## Plano — Tela de Configuração de SSO Empresarial (OIDC/SAML)

Tela admin em `/admin/sso` para configurar provedores de identidade corporativos (Azure AD, Okta, Google Workspace, OneLogin, JumpCloud, ADFS) via OIDC ou SAML 2.0.

### ⚠️ Aviso importante sobre escopo

A **autenticação SSO real funcional** (validação de token SAML/OIDC, criação de sessão Supabase) tem dois caminhos:

1. **Caminho nativo Lovable Cloud** — apenas SAML é nativamente suportado, e a configuração efetiva é feita pelo **suporte Lovable Cloud** (não há API self-service para criar IdPs SAML por tenant via Edge Function). OIDC corporativo (Azure AD, Okta) **não é nativamente suportado** pelo Lovable Cloud — exigiria conectar uma instância Supabase própria.

2. **Caminho desta tela** — vou construir a **camada de configuração e gestão** (UI + persistência + validação + métricas + claim mapping + domain restriction + audit) que **gerencia a intenção de SSO** e gera os artefatos (Entity ID, ACS URL, metadata XML, callback URLs) que o admin usa para configurar tanto no IdP quanto para abrir ticket no Lovable Cloud (SAML) ou para uma futura migração.

Esta tela entrega **80% do trabalho enterprise** (governança, multi-IdP, claim mapping, auto-provisioning de roles, allowed domains, monitoramento) — a ativação final do handshake fica documentada como passo manual via suporte Lovable Cloud até evolução do produto.

### Escopo desta entrega

**1. Banco de dados** (migração)
- Tabela `sso_providers`:
  - `id`, `nome`, `tipo` (`oidc`|`saml`), `ativo`, `ordem`
  - **OIDC:** `client_id`, `client_secret_ref` (nome do secret), `discovery_url`, `authorization_endpoint`, `token_endpoint`, `userinfo_endpoint`, `jwks_uri`, `scopes[]`
  - **SAML:** `entity_id_idp`, `sso_url`, `slo_url`, `x509_cert`, `metadata_xml`, `name_id_format`, `signature_algorithm`
  - **Comum:** `allowed_domains[]` (ex: `["empresa.com.br"]`), `claim_mapping` JSONB (`{email, full_name, groups, role}`), `default_role` (`visualizador`|`operacional`|`financeiro`|`admin`), `auto_provision_users` bool, `force_sso_for_domains` bool
- Tabela `sso_login_attempts`: `provider_id`, `email`, `success`, `error_code`, `ip`, `user_agent`, `created_at` — para métricas e auditoria
- Tabela `sso_role_mappings`: `provider_id`, `idp_group_or_claim`, `app_role` — mapeamento grupo IdP → role RBAC
- RLS hardenizada: apenas `admin` pode CRUD; service role lê para o handshake
- Trigger `fn_audit_sso_changes` registra em `audit_logs`
- Validação trigger: `force_sso_for_domains` requer `allowed_domains` não vazio

**2. Edge Functions** (3 novas)
- `sso-validate-config` — testa conectividade: faz GET no `discovery_url` (OIDC) ou parseia metadata XML (SAML), valida certs, retorna campos descobertos
- `sso-generate-metadata` — gera **Service Provider Metadata XML** (SAML) ou retorna **redirect URIs** (OIDC) que o admin cola no IdP
- `sso-test-login` — simula fluxo de claim mapping com payload mockado e retorna como o usuário seria criado/mapeado (sem efetivar login)

**3. UI — `/admin/sso`** (página com 4 abas)

**Aba 1 — Provedores configurados**
- Lista cards com: logo do IdP (Azure/Okta/Google ícones), nome, tipo (OIDC/SAML badge), status (ativo/inativo toggle), domínios permitidos, último login bem-sucedido, taxa de sucesso 7d
- Botões: testar conexão, editar, duplicar, excluir, baixar metadata SP
- CTA primário: "+ Adicionar provedor"

**Aba 2 — Wizard de configuração** (Dialog stepper 4 passos)
- **Passo 1 — Tipo:** cards visuais (OIDC vs SAML) + presets rápidos (Azure AD, Okta, Google Workspace, OneLogin, JumpCloud, ADFS, Custom)
- **Passo 2 — Conexão:**
  - OIDC: cola `discovery_url` → botão "Auto-descobrir" preenche todos os endpoints + secret reference
  - SAML: upload do `metadata.xml` do IdP OU cola URL de metadata OU campos manuais (Entity ID, SSO URL, certificado X.509)
- **Passo 3 — Mapeamento:**
  - Editor visual de claim mapping: dropdowns para email/nome/grupos
  - Tabela de role mapping: `[grupo IdP] → [role RBAC]` com preview
  - Domínios permitidos (multi-input com chips)
  - Auto-provisionamento on/off + role default para usuários novos
- **Passo 4 — Validação & ativação:**
  - Botão "Testar configuração" chama `sso-validate-config`
  - Mostra metadata SP gerada para copiar/baixar
  - Mostra **callback URL** com botão de cópia (para colar no IdP)
  - Toggle "Forçar SSO para domínios permitidos" (block password login)

**Aba 3 — Monitoramento & métricas**
- KPIs: total logins SSO 7d/30d, taxa de sucesso %, tempo médio de handshake, usuários únicos
- Gráfico Recharts: logins SSO/senha por dia (linha)
- Tabela últimas 50 tentativas: timestamp, email, provedor, status, erro (se houver)
- Distribuição por provedor (pie chart)

**Aba 4 — Documentação & onboarding**
- Cards passo-a-passo por IdP (Azure AD, Okta, Google) com screenshots-guia textuais
- Snippet de metadata SP pronto para copiar
- **Aviso destacado:** "Após salvar a configuração, abra um ticket no suporte Lovable Cloud com a metadata XML para finalizar a ativação SAML server-side" (com link)
- Link para `/admin/audit-logs?filter=sso` (eventos SSO)

**4. Integrações com sistema existente**
- Na página `/auth`: se houver provedor SSO ativo + email digitado pertence a `allowed_domains`, mostrar banner "Sua organização usa SSO — Entrar com [Provedor]" antes do campo de senha. Se `force_sso_for_domains=true`, esconde campo de senha.
- Hook `useSSO` consumido por `/auth` e `/admin/sso`
- Item no sidebar admin: "SSO Empresarial" (ícone `KeyRound`) sob grupo "Segurança"
- Botão de atalho em `/seguranca` aba "Configurações" → "Configurar SSO"
- Item no command palette (Ctrl+K): "Configurar SSO"

**5. Segurança & compliance**
- Client secrets nunca trafegam para o frontend (referenciados por nome via `sso_providers.client_secret_ref` → resolvidos no Edge Function)
- Quando admin cadastra um secret OIDC, instrui-se a adicionar via Lovable Cloud secrets (vou usar `add_secret` quando necessário durante uso real)
- Certificado X.509 SAML armazenado em texto (público por natureza)
- Toda alteração em `sso_providers` gera registro em `audit_logs` com `_old_data` e `_new_data` redacted (secrets removidos)
- RLS: somente `admin` lê/escreve `sso_providers`; `sso_login_attempts` somente admin
- Rate limit no `sso-validate-config` (5 testes/min por admin)

### Arquivos criados/editados

```
supabase/migrations/{ts}_sso_providers.sql                  (nova tabela + RLS + audit trigger)
supabase/functions/sso-validate-config/index.ts             (descoberta OIDC + parse SAML)
supabase/functions/sso-generate-metadata/index.ts           (gera SP metadata XML)
supabase/functions/sso-test-login/index.ts                  (simula claim mapping)
src/pages/admin/SSOAdmin.tsx                                (página principal, 4 tabs)
src/components/admin/sso/SSOProvidersList.tsx               (aba 1)
src/components/admin/sso/SSOWizardDialog.tsx                (aba 2 - stepper)
src/components/admin/sso/steps/StepTipo.tsx
src/components/admin/sso/steps/StepConexao.tsx
src/components/admin/sso/steps/StepMapeamento.tsx
src/components/admin/sso/steps/StepValidacao.tsx
src/components/admin/sso/SSOMetricsPanel.tsx                (aba 3 - Recharts)
src/components/admin/sso/SSODocumentacao.tsx                (aba 4)
src/components/admin/sso/IdpPresets.ts                      (Azure/Okta/Google defaults)
src/hooks/useSSO.ts                                         (CRUD + métricas + test)
src/components/auth/SSOLoginBanner.tsx                      (banner em /auth)
src/pages/Auth.tsx                                          (editar: integrar banner)
src/App.tsx                                                 (editar: rota /admin/sso)
src/components/layout/Sidebar.tsx                           (editar: item sidebar admin)
```

### Acessibilidade & UX
- Stepper com indicador visual de progresso, botões "Voltar/Avançar" sticky
- Validação Zod em cada step antes de avançar
- Confetti ao completar wizard com sucesso (consistente com onboarding atual)
- Tokens semânticos HSL (sem cores hardcoded)
- Animações Framer Motion nos cards e transições de aba
- Estados de loading (Skeleton) em todas as queries
- Empty state ilustrado quando nenhum provedor configurado

### Testes
- Vitest: validação Zod do schema de provedor, parser de metadata SAML, claim mapping puro
- Smoke test do edge `sso-validate-config` com mock de discovery URL

### Não incluído nesta entrega
- Handshake SAML/OIDC real server-side (depende de evolução do Lovable Cloud ou migração para Supabase próprio com `gotrue` SAML enabled) — documentado como próximo passo
- SCIM 2.0 (provisionamento automático de usuários) — sugerido como tarefa separada P17
- Just-In-Time (JIT) provisioning real — preparado no schema (`auto_provision_users`), mas a criação efetiva do usuário depende do callback server-side acima

