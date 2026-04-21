

## Plano — Guia de provisionamento SCIM 2.0 para Azure AD e Okta

O backend SCIM já está 100% funcional: endpoint `/scim/v2/Users` (GET/POST/PUT/PATCH/DELETE) e `/Groups` (GET) com auth Bearer, escopo por empresa, JIT em `auth.users`, vínculo em `user_empresas` (`provisioned_via='scim'`), filtros `eq` para `userName`/`externalId`, audit em `scim_operations_log`, e UI de geração/revogação de tokens.

O que falta para fechar o fluxo de ponta a ponta é **um guia operacional copy-paste** dentro do próprio app, para que o admin configure Azure AD ou Okta sem sair da plataforma.

### Escopo

Adicionar uma nova sub-aba "Como configurar" dentro da aba **SCIM** do `/admin/sso`, com 3 seções tabuladas: Azure AD, Okta e Mapeamento de atributos.

### Arquivos novos

- **`src/components/admin/sso/ScimSetupGuide.tsx`** — guia completo:
  - Card "Endpoint do servidor SCIM" com `Tenant URL` e `Authorization header` (campos somente leitura + botão copiar).
  - Tabs Azure AD / Okta / Mapeamento.
  - Azure AD: passo-a-passo (Enterprise applications → Custom non-gallery → Provisioning Automatic → Tenant URL + Secret Token → Test Connection → Mappings → Scope → Assignments).
  - Okta: passo-a-passo (Create App Integration → Enable SCIM → Integration tab → Base URL + Bearer auth → Test Connector → "To App" actions → Assignments).
  - Mapeamento de atributos: tabela com `userName`, `name.formatted`, `emails`, `externalId`, `active` mapeados para campos do Azure AD/Okta, com badge obrigatório/opcional.
  - Links externos para a documentação oficial.
  - Aviso explicando que novos usuários entram como `visualizador` e que mapeamento de papéis usa `sso_role_mappings`.

### Arquivos editados

- **`src/components/admin/sso/ScimTokensTab.tsx`** — converter o conteúdo atual em sub-aba "Tokens" e adicionar sub-aba "Como configurar" que renderiza `<ScimSetupGuide />`. Manter o select de empresa fora das sub-abas.

### Detalhes técnicos

- O endpoint SCIM já trata todas as operações que Azure AD/Okta enviam (POST/PUT/PATCH/DELETE em `/Users`). Nenhum trabalho de backend é necessário.
- A `Tenant URL` exibida usa `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/scim-server/scim/v2` (mesmo formato já usado em `ScimTokensTab`).
- `ServiceProviderConfig` já é público e responde com `patch.supported=true`, `filter.supported=true`, o que faz o "Test Connection" do Azure AD passar.
- O parser de filtro do servidor já cobre `userName eq` e `externalId eq` — ambos exigidos pelo Azure AD/Okta para idempotência.
- Acessibilidade: todos os botões de copiar têm `aria-label`; tabela usa cabeçalhos semânticos.

### Fora de escopo

- Suporte a operações de Group write via SCIM (atualmente retorna 501; mapeamento de papel continua via `sso_role_mappings` no painel de Providers).
- Webhooks de notificação para sync (Azure AD/Okta operam por polling).
- Suporte a `co`, `sw`, `pr` no parser de filtro SCIM (mantido o subset `eq` + `and`).

