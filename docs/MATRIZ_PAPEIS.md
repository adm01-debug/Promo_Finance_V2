# Matriz papel × rota × acesso a dados

Fonte de verdade derivada do código (atualizar quando mexer em `app_role`,
`ProtectedRoute` ou nas policies RLS). Detalhes do modelo de papéis e da
limitação tenant-agnóstica de `has_role()`: `docs/ADR-003-PAPEIS-POR-EMPRESA.md`.

## Papéis (`public.app_role`)

| Papel          | Definição                                                                                 | Escopo                        |
| -------------- | ----------------------------------------------------------------------------------------- | ----------------------------- |
| `admin`        | Administrador — **global** por construção (sem `empresa_id` em `user_roles`, ver ADR-003) | plataforma                    |
| `financeiro`   | Opera e aprova lançamentos, conciliação, cobrança                                         | empresa (via `user_empresas`) |
| `operacional`  | Cadastros e movimentações sem aprovação                                                   | empresa                       |
| `visualizador` | Somente leitura                                                                           | empresa                       |
| `contador`     | Acesso read-only do contador externo                                                      | empresa (proposto)            |

Papéis de organização (`OrgPapel`, não confundir com `app_role`): `RESPONSAVEL`,
`ADMIN`, `MEMBRO` — ver `src/hooks/useOrganizacoes.ts`.

## Rotas privilegiadas (`src/App.tsx` + `ProtectedRoute`)

Todas as rotas exigem autenticação (`ProtectedRoute`); `requiredRoles` é usado
apenas nas rotas abaixo. Páginas `Admin*` sem `requiredRoles` confiam no papel
via `useAuth().role`/`hasRole` no próprio componente.

| Rota                                                                                     | Requisito                    | Observação                                            |
| ---------------------------------------------------------------------------------------- | ---------------------------- | ----------------------------------------------------- |
| `/admin/*` (`/admin/sso`, `/admin/filtros-compartilhados`, `/admin/campos-customizados`) | `admin`                      | Gate duplo: `ProtectedRoute` + checagem no componente |
| `Admin*` (`AdminEdgeHealth`, `AdminSystemHealth`, `AdminTelemetria`, `AuditLogs`)        | `admin`                      | Telemetria e trilha de auditoria                      |
| `CentroPrivacidadeLGPD`                                                                  | autenticado + papel por ação | Ações sensíveis (exportação/exclusão) reavaliam papel |
| Todas as demais (`/contas-pagar`, `/conciliacao`, `/relatorios`, …)                      | autenticado                  | Autorização fina delegada a RLS + `user_empresas`     |

## Edge Functions — padrão de autorização

| Guard                                              | Função                      | Uso                                                                      |
| -------------------------------------------------- | --------------------------- | ------------------------------------------------------------------------ |
| `exigirUsuarioAutenticado`                         | JWT válido                  | Todas as funções de usuário                                              |
| `exigirVinculoEmpresa` / `exigirUsuarioComEmpresa` | JWT + `user_empresas` ativa | Funções escopo-empresa (~31 chamam `user_empresas`)                      |
| `has_role('admin')`                                | Papel global                | ~17 funções — desvio global conhecido (ADR-003)                          |
| `x-cron-secret` / `x-internal-secret`              | Segredo compartilhado       | Jobs internos (`*_dispatcher`, réguas, sync)                             |
| `x-mcp-secret`                                     | Segredo MCP                 | `mcp-query`                                                              |
| `webhook-auth`                                     | Assinatura por provedor     | `asaas-webhook`, `bling-webhook`, `bitrix24-webhook`, `whatsapp-webhook` |

## Tabelas sensíveis → controle real

O controle de alcance de dados é **RLS + `user_empresas`**, não `has_role`
(tenant-agnóstico). Grupos críticos:

| Grupo           | Tabelas (exemplos)                                                         | Controle                                          |
| --------------- | -------------------------------------------------------------------------- | ------------------------------------------------- |
| Financeiro      | `lancamentos`, `contas_pagar`, `contas_receber`, `movimentacoes_bancarias` | RLS por `empresa_id`                              |
| Fiscal/SEFAZ    | `nfe_documentos`, `sped_*`, `obrigacoes_fiscais`                           | RLS por `empresa_id`                              |
| Identidade      | `profiles`, `user_roles`, `user_empresas`, `user_sessions`                 | RLS por `user_id`/`empresa_id`                    |
| Credenciais     | `asaas_config`, `bling_config`, `certificados_*`                           | service_role só em backend; nunca via client anon |
| Observabilidade | `edge_function_logs`, `frontend_error_logs`, `audit_logs`                  | Leitura `admin` via RPC `SECURITY DEFINER`        |

## Regra de ouro (reafirmando ADR-003)

1. `has_role()` decide **capacidade** (o que pode fazer), nunca **alcance**
   (de qual empresa). Alcance é `user_empresas` + RLS.
2. Toda função nova com escopo de empresa passa por
   `exigirVinculoEmpresa(userId, empresaId, req)` — já tipado no `auth-guard`.
