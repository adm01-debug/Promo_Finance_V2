# Contexto do projeto para agentes de IA

GERADO AUTOMATICAMENTE por scripts/ai-context/gerar.mjs — não editar à mão; será sobrescrito.
Publicado pelo workflow .github/workflows/contexto.yml em docs/contexto/codigo/ da branch gerada `contexto`. Índice único em docs/contexto/00-INDEX.md. Ler: git fetch origin contexto && git show origin/contexto:docs/contexto/00-INDEX.md Gere local com `node scripts/ai-context/gerar.mjs`. Commit-base: `1d6ef946018032c57c0337064c8fb4c32a66332a` (2026-11-16T17:03:31-03:00).

## Como usar (leia antes de planejar ou executar qualquer tarefa)
1. **Tela/rota/menu** → `rotas.json` (url/vista/menu → arquivo → hooks → tabelas → edges; `rotas_http_backend` para APIs) e `modulos.json` (módulo inteiro + dependências entre módulos).
2. **Hook/serviço/lógica** → `hooks.json`, `logica.json` (quem usa, o que toca, se tem teste).
3. **Edge function / serverless** → `edge-functions.json` (verify_jwt, tabelas, env, quem chama, órfãs).
4. **Banco** → `banco.json` (colunas, RLS, policies, índices, FKs, triggers, cron jobs, buckets, drift migration×types, uso no código) — visão do código; para o banco vivo use o MCP.
5. **Antes de criar arquivo** → `convencoes.json` (onde ficam as coisas, nomenclatura, alias), `componentes.json` (nomes duplicados, órfãos), `grafo.json` (hubs, ciclos de import) e `grafo-graphify.json` (grafo por AST: comunidades, símbolos mais chamados, comunidade de cada arquivo).
6. **CI/scripts/deploy/env/integrações/permissões/flags** → `ferramentas.json` e `scripts.json`.
7. **Antes de abrir PR** → `testes.json` (o que tem e não tem teste, onde os testes ficam), `baseline.json` (alertas, TODOs, hotspots, últimos commits).
Os JSONs são grandes: filtre com `grep`/`jq` pelo caminho/arquivo/tabela da sua tarefa; não carregue tudo.

## Stack
- linguagens: TypeScript (2319), SQL (1096), Markdown (192), JavaScript (68), Python (45), JSON (38), Shell (26), YAML (25)
- linguagem_principal: TypeScript
- framework: React
- backend_http: n/d
- bundler: Vite
- roteador: react-router
- banco: Supabase
- testes: vitest, playwright
- ui: tailwind, radix/shadcn
- estado: react-query
- gerenciador_pacotes: bun
- node: >=18.18.0
- python: n/d
- deploy: vercel
- monorepo: n/d
- pastas_fonte: src

## Números
| item | qtd |
|---|---|
| arquivos_total | 3854 |
| arquivos_codigo | 2430 |
| linhas_codigo | 433287 |
| rotas | 130 |
| rotas_http_backend | 25 |
| vistas_por_id | 0 |
| itens_menu | 119 |
| modulos | 128 |
| componentes | 990 |
| hooks | 273 |
| edge_functions | 106 |
| tabelas | 340 |
| migrations | 1026 |
| cron_jobs | 21 |
| testes | 446 |
| workflows | 19 |
| scripts | 107 |
| docs_md | 192 |

## Onde ficam as coisas
- telas: src/pages (127)
- componentes: src/components (776), src/pages (210), src/hooks (2)
- hooks: src/hooks (237), src/components (27), src/pages (5)
- servicos_logica: src/lib (260), scripts/graphify (7), src/integrations (3)
- testes: co-localizado (__tests__) (257), outro (107), co-localizado (*.test) (42)
- edge_functions: supabase/functions
- migrations: supabase/migrations
- scripts: scripts/integrity (17), scripts/security (16), scripts/ci (13)
- docs: docs (50), (raiz) (19), .github (2)
- nomenclatura: {"componentes":"PascalCase (90%)","hooks":"use + PascalCase","servicos":"camelCase (52%)","edge_functions":"kebab-case (99%)","tabelas":"snake_case (80%)"}
- instruções para agentes no repo: .claude/CLAUDE.md, .github/copilot-instructions.md, AGENTS.md, CLAUDE.md

## Módulos (menu → domínio)
| módulo | itens de menu | telas/rotas | arquivos | hooks locais | edges | tabelas |
|---|---|---|---|---|---|---|
| components/admin | 0 | 0 | 101 | 69 | 10 | 39 |
| components/analytics | 0 | 0 | 6 | 10 | 0 | 12 |
| components/aprovacoes | 0 | 0 | 6 | 15 | 0 | 7 |
| components/asaas | 0 | 0 | 26 | 6 | 2 | 13 |
| components/audit | 0 | 0 | 10 | 3 | 0 | 3 |
| components/auth | 0 | 0 | 15 | 10 | 2 | 8 |
| components/bi | 0 | 0 | 6 | 0 | 0 | 0 |
| components/bitrix | 0 | 0 | 6 | 0 | 0 | 0 |
| components/bling | 0 | 0 | 13 | 33 | 1 | 4 |
| components/boletos | 0 | 0 | 5 | 1 | 0 | 5 |
| components/charts | 0 | 0 | 5 | 0 | 0 | 0 |
| components/clientes | 0 | 0 | 5 | 24 | 1 | 15 |
| components/cobranca | 0 | 0 | 17 | 31 | 3 | 21 |
| components/compliance | 0 | 0 | 16 | 6 | 1 | 5 |
| components/conciliacao | 0 | 0 | 30 | 36 | 3 | 32 |
| components/configuracoes | 0 | 0 | 11 | 6 | 2 | 10 |
| components/contabilidade | 0 | 0 | 106 | 45 | 5 | 29 |
| components/contas-bancarias | 0 | 0 | 6 | 25 | 1 | 19 |
| components/contas-pagar | 0 | 0 | 19 | 33 | 4 | 21 |
| components/contas-receber | 0 | 0 | 34 | 32 | 3 | 25 |
| components/dashboard | 0 | 0 | 26 | 93 | 8 | 40 |
| components/demonstrativos | 0 | 0 | 9 | 22 | 1 | 16 |
| components/empresas | 0 | 0 | 9 | 11 | 0 | 12 |
| components/expert | 0 | 0 | 7 | 8 | 2 | 12 |
| components/fluxo-caixa | 0 | 0 | 11 | 0 | 1 | 2 |
| components/fornecedores | 0 | 0 | 7 | 19 | 1 | 13 |
| components/insights-ia | 0 | 0 | 15 | 14 | 3 | 9 |
| components/integracoes | 0 | 0 | 6 | 1 | 3 | 5 |
| components/layout | 0 | 0 | 27 | 30 | 1 | 14 |
| components/navigation | 0 | 0 | 5 | 3 | 0 | 2 |
| components/nfe | 0 | 0 | 31 | 17 | 2 | 13 |
| components/reforma-tributaria | 0 | 0 | 66 | 24 | 1 | 17 |
| components/relatorios | 0 | 0 | 22 | 27 | 3 | 16 |
| components/security | 0 | 0 | 6 | 5 | 2 | 10 |
| components/shared | 0 | 0 | 15 | 4 | 0 | 6 |
| components/tesouraria | 0 | 0 | 5 | 16 | 1 | 14 |
| components/tributario | 0 | 0 | 50 | 34 | 13 | 30 |
| components/ui | 0 | 0 | 102 | 17 | 0 | 3 |
| hooks | 0 | 0 | 227 | 438 | 59 | 180 |
| hooks/bling | 0 | 0 | 11 | 33 | 1 | 4 |
| hooks/financial | 0 | 0 | 10 | 18 | 1 | 13 |
| lib | 0 | 0 | 67 | 10 | 3 | 9 |
| lib/brazilian-validators | 0 | 0 | 9 | 0 | 0 | 0 |
| lib/contabil | 0 | 0 | 5 | 0 | 0 | 0 |
| lib/export-contabil | 0 | 0 | 8 | 0 | 0 | 0 |
| lib/ofx-parser | 0 | 0 | 6 | 0 | 0 | 0 |
| lib/pdf-generator | 0 | 0 | 5 | 0 | 0 | 0 |
| lib/reforma-tributaria | 0 | 0 | 5 | 0 | 0 | 0 |
| lib/sefaz-contingency | 0 | 0 | 6 | 0 | 0 | 0 |
| lib/sefaz-simulator | 0 | 0 | 6 | 0 | 0 | 0 |
| lib/sped-generator | 0 | 0 | 5 | 0 | 0 | 0 |
| lib/transaction-matcher | 0 | 0 | 6 | 0 | 0 | 0 |
| lib/tributario | 0 | 0 | 118 | 0 | 0 | 11 |
| pages | 58 | 64 | 109 | 356 | 44 | 162 |
| pages/admin | 4 | 15 | 24 | 118 | 14 | 55 |
| pages/auth | 0 | 1 | 2 | 3 | 1 | 2 |
| pages/bloqueios-duplicidade | 0 | 0 | 7 | 1 | 0 | 4 |
| pages/clientes | 2 | 2 | 5 | 48 | 2 | 23 |
| pages/configuracoes | 1 | 4 | 14 | 32 | 1 | 19 |
| pages/dev | 0 | 1 | 1 | 1 | 0 | 0 |
| pages/organizacoes | 1 | 2 | 3 | 36 | 3 | 18 |
| pages/tributario | 33 | 41 | 89 | 100 | 22 | 56 |
| routes | 0 | 0 | 16 | 452 | 64 | 197 |
| types/reforma-tributaria | 0 | 0 | 13 | 0 | 0 | 0 |

## Rotas (url → arquivo)
- `/` [tela] → src/pages/Index.tsx (protegida)
- `/__especimes` [tela] → src/pages/dev/Especimes.tsx
- `/*` [tela] → src/pages/NotFound.tsx
- `/admin/api` [tela] → src/pages/admin/ApiManagement.tsx (protegida)
- `/admin/auditoria-ia` [tela] → src/pages/admin/AuditoriaIA.tsx (protegida)
- `/admin/bloat-monitor` [tela] → src/pages/admin/AdminBloatMonitor.tsx (protegida)
- `/admin/campos-customizados` [tela] → src/pages/admin/CustomFieldsAdmin.tsx (protegida)
- `/admin/compliance` [tela] → src/pages/admin/ComplianceAuditoria.tsx (protegida)
- `/admin/edge-health` [tela] → src/pages/AdminEdgeHealth.tsx (protegida)
- `/admin/erros-frontend` [tela] → src/pages/admin/AdminErrosFrontend.tsx (protegida)
- `/admin/filtros-compartilhados` [tela] → src/pages/admin/SharedFiltersAdmin.tsx (protegida)
- `/admin/insights-ia` [tela] → src/pages/admin/InsightsIA.tsx (protegida)
- `/admin/insights-ia/anomalia/:id` [tela] → src/pages/admin/AnomaliaDetalhe.tsx (protegida)
- `/admin/scim-audit` [tela] → src/pages/admin/ScimAudit.tsx (protegida)
- `/admin/sre` [tela] → src/pages/admin/SRECommandCenter.tsx (protegida)
- `/admin/sso` [tela] → src/pages/admin/SSOAdmin.tsx (protegida)
- `/admin/sso-events` [tela] → src/pages/admin/SsoEvents.tsx (protegida)
- `/admin/sso-jit-events` [tela] → src/pages/admin/SSOJitEvents.tsx (protegida)
- `/admin/system-health` [tela] → src/pages/AdminSystemHealth.tsx (protegida)
- `/admin/telemetria` [tela] → src/pages/AdminTelemetria.tsx (protegida)
- `/alertas` [tela] → src/pages/Alertas.tsx (protegida)
- `/aprovacoes` [tela] → src/pages/Aprovacoes.tsx (protegida)
- `/asaas` [tela] → src/pages/Asaas.tsx (protegida)
- `/assinatura-digital` [tela] → src/pages/AssinaturaDigital.tsx (protegida)
- `/audit-logs` [tela] → src/pages/AuditLogs.tsx (protegida)
- `/audit-sso-profile-sync` [tela] → src/pages/admin/AuditSsoProfileSync.tsx (protegida)
- `/auth` [tela] → src/pages/Auth.tsx
- `/auth/corporate` [tela] → src/pages/auth/CorporateOnboarding.tsx
- `/benchmarking` [tela] → src/pages/BenchmarkingSetorial.tsx (protegida)
- `/bi` [tela] → src/pages/BI.tsx (protegida)
- `/bitrix24` [tela] → src/pages/Bitrix24.tsx (protegida)
- `/bling` [tela] → src/pages/Bling.tsx (protegida)
- `/boletos` [tela] → src/pages/Boletos.tsx (protegida)
- `/categorias` [tela] → src/pages/Categorias.tsx (protegida)
- `/centro-custos` [tela] → src/pages/CentroCustos.tsx (protegida)
- `/clientes` [tela] → src/pages/Clientes.tsx (protegida)
- `/clientes/portal-tokens` [tela] → src/pages/clientes/PortalTokens.tsx (protegida)
- `/clientes/scoring` [tela] → src/pages/clientes/ScoringClientes.tsx (protegida)
- `/cobrancas` [tela] → src/pages/Cobrancas.tsx (protegida)
- `/compras` [tela] → src/pages/Compras.tsx (protegida)
- `/comprovante-ocr` [tela] → src/pages/ComprovanteOCR.tsx (protegida)
- `/conciliacao` [tela] → src/pages/Conciliacao.tsx (protegida)
- `/configuracoes` [tela] → src/pages/Configuracoes.tsx (protegida)
- `/configuracoes/filtros-salvos` [tela] → src/pages/configuracoes/FiltrosSalvos.tsx (protegida)
- `/configuracoes/notificacoes/historico` [tela] → src/pages/configuracoes/HistoricoNotificacoes.tsx (protegida)
- `/configuracoes/notificacoes/sino` [tela] → src/pages/configuracoes/SinoNotificacoesFiltros.tsx (protegida)
- `/configuracoes/preferencias` [tela] → src/pages/configuracoes/MinhasPreferencias.tsx (protegida)
- `/configuracoes/privacidade` [tela] → src/pages/CentroPrivacidadeLGPD.tsx (protegida)
- `/contabilidade` [tela] → src/pages/Contabilidade.tsx (protegida)
- `/contador/:token` [tela] → src/pages/ContadorReadonly.tsx
- `/contas-bancarias` [tela] → src/pages/ContasBancarias.tsx (protegida)
- `/contas-pagar` [tela] → src/pages/ContasPagar.tsx (protegida)
- `/contas-pagar/bloqueios` [tela] → src/pages/BloqueiosDuplicidade.tsx (protegida)
- `/contas-receber` [tela] → src/pages/ContasReceber.tsx (protegida)
- `/contratos` [tela] → src/pages/Contratos.tsx (protegida)
- `/convite/:token` [tela] → src/pages/organizacoes/AceitarConvite.tsx
- `/dashboard` [tela] → src/pages/Index.tsx (protegida)
- `/dashboard-empresa` [tela] → src/pages/DashboardEmpresa.tsx (protegida)
- `/dashboard-receber` [tela] → src/pages/DashboardReceber.tsx (protegida)
- `/demonstrativos` [tela] → src/pages/Demonstrativos.tsx (protegida)
- `/design-system-debug` [tela] → src/pages/design-system-debug.tsx
- `/empresas` [tela] → src/pages/Empresas.tsx (protegida)
- `/expert` [tela] → src/pages/Expert.tsx (protegida)
- `/financeiro` [tela] → src/pages/Financeiro.tsx (protegida)
- `/fluxo-caixa` [tela] → src/pages/FluxoCaixa.tsx (protegida)
- `/fornecedores` [tela] → src/pages/Fornecedores.tsx (protegida)
- `/integracoes` [tela] → src/pages/Integracoes.tsx (protegida)
- `/inteligencia` [tela] → src/pages/InteligenciaOperacional.tsx (protegida)
- `/metas` [tela] → src/pages/MetasFinanceiras.tsx (protegida)
- `/meu-perfil` [tela] → src/pages/MeuPerfil.tsx (protegida)
- `/movimentacoes` [tela] → src/pages/Movimentacoes.tsx (protegida)
- `/notas-fiscais` [tela] → src/pages/NotasFiscais.tsx (protegida)
- `/orcamento-evento` [tela] → src/pages/OrcamentoEvento.tsx (protegida)
- `/orcamentos` [tela] → src/pages/Orcamentos.tsx (protegida)
- `/organizacoes` [tela] → src/pages/organizacoes/Organizacoes.tsx (protegida)
- `/pagamentos-recorrentes` [tela] → src/pages/PagamentosRecorrentes.tsx (protegida)
- `/pix-hub` [tela] → src/pages/PixHub.tsx (protegida)
- `/reforma-tributaria` [tela] → src/pages/ReformaTributaria.tsx (protegida)
- `/reforma-tributaria/:tab` [tela] → src/pages/ReformaTributaria.tsx (protegida)
- `/relatorios` [tela] → src/pages/Relatorios.tsx (protegida)
- `/reset-password` [tela] → src/pages/ResetPassword.tsx
- `/seguranca` [tela] → src/pages/Seguranca.tsx (protegida)
- `/simulador-antecipacao` [tela] → src/pages/SimuladorAntecipacao.tsx (protegida)
- `/status` [tela] → src/pages/StatusPage.tsx
- `/style-guide` [tela] → src/pages/StyleGuide.tsx (protegida)
- `/tesouraria` [tela] → src/pages/Tesouraria.tsx (protegida)
- `/theme-diagnostics` [tela] → src/pages/ThemeDiagnostics.tsx
- `/tributario` [tela] → src/pages/tributario/DashboardTributario.tsx (protegida)
- `/tributario/arquitetura` [tela] → src/pages/tributario/ArquiteturaModular.tsx (protegida)
- `/tributario/auditoria` [tela] → src/pages/tributario/AuditoriaCompliance.tsx (protegida)
- `/tributario/auditoria-overlay` [tela] → src/pages/tributario/AuditoriaOverlay.tsx (protegida)
- `/tributario/calculadora` [tela] → src/pages/tributario/CalculadoraTributaria.tsx (protegida)
- `/tributario/cashback` [tela] → src/pages/tributario/CashbackSimulador.tsx (protegida)
- `/tributario/catalogos-fiscais` [tela] → src/pages/tributario/CatalogosFiscais.tsx (protegida)
- `/tributario/certificados-digitais` [tela] → src/pages/tributario/CertificadosDigitais.tsx (protegida)
- `/tributario/comparativo` [tela] → src/pages/tributario/ComparativoRegimes.tsx (protegida)
- `/tributario/comparativo-conformidade` [tela] → src/pages/tributario/ComparativoConformidade.tsx (protegida)
- `/tributario/conciliacao` [tela] → src/pages/tributario/ConciliacaoTributaria.tsx (protegida)
- `/tributario/consulta-rapida` [tela] → src/pages/tributario/ConsultaRapidaFiscal.tsx (protegida)
- `/tributario/darf` [tela] → src/pages/tributario/DarfConsolidado.tsx (protegida)
- `/tributario/dashboard` [tela] → src/pages/tributario/DashboardTributario.tsx (protegida)
- `/tributario/fechamento-mensal` [tela] → src/pages/tributario/FechamentoMensal.tsx (protegida)
- `/tributario/folha-encargos` [tela] → src/pages/tributario/FolhaEncargos.tsx (protegida)
- `/tributario/glossario` [tela] → src/pages/tributario/GlossarioTributario.tsx (protegida)
- `/tributario/historico-financeiro` [tela] → src/pages/tributario/HistoricoFinanceiro.tsx (protegida)
- `/tributario/icms-st` [tela] → src/pages/tributario/IcmsStDifal.tsx (protegida)
- `/tributario/importacao-xml` [tela] → src/pages/tributario/ImportacaoXML.tsx (protegida)
- `/tributario/incentivos` [tela] → src/pages/tributario/IncentivosFiscais.tsx (protegida)
- `/tributario/ipi-iss` [tela] → src/pages/tributario/IpiIss.tsx (protegida)
- `/tributario/irpj-csll` [tela] → src/pages/tributario/IrpjCsllLucroReal.tsx (protegida)
- `/tributario/monofasico` [tela] → src/pages/tributario/Monofasico.tsx (protegida)
- `/tributario/nfe-recebidas` [tela] → src/pages/tributario/NfeRecebidas.tsx (protegida)
- `/tributario/obrigacoes` [tela] → src/pages/tributario/ObrigacoesAcessorias.tsx (protegida)
- `/tributario/observabilidade-digest` [tela] → src/pages/tributario/ObservabilidadeDigest.tsx (protegida)
- `/tributario/onboarding` [tela] → src/pages/tributario/OnboardingTributario.tsx (protegida)
- `/tributario/oportunidades-elisao` [tela] → src/pages/tributario/OportunidadesElisao.tsx (protegida)
- `/tributario/per-dcomp` [tela] → src/pages/tributario/PerDcomp.tsx (protegida)
- `/tributario/pf-vinculada` [tela] → src/pages/tributario/PfVinculada.tsx (protegida)
- `/tributario/pis-cofins` [tela] → src/pages/tributario/PisCofinsCreditos.tsx (protegida)
- `/tributario/preferencias-digest` [tela] → src/pages/tributario/PreferenciasDigest.tsx (protegida)
- `/tributario/projecao-reforma` [tela] → src/pages/tributario/ProjecaoReforma.tsx (protegida)
- `/tributario/recomendacao` [tela] → src/pages/tributario/RecomendacaoExecutiva.tsx (protegida)
- `/tributario/relatorios-contabeis` [tela] → src/pages/tributario/RelatoriosContabeis.tsx (protegida)
- `/tributario/retencoes` [tela] → src/pages/tributario/RetencoesFonte.tsx (protegida)
- `/tributario/sefaz-observabilidade` [tela] → src/pages/tributario/SefazObservabilidade.tsx (protegida)
- `/tributario/simulacao-regimes` [tela] → src/pages/tributario/SimulacaoRegimes.tsx (protegida)
- `/tributario/sped` [tela] → src/pages/tributario/SpedExport.tsx (protegida)
- `/tributario/split-payment` [tela] → src/pages/tributario/SplitPayment.tsx (protegida)
- `/usuarios` [tela] → src/pages/Usuarios.tsx (protegida)
- `/vendedores` [tela] → src/pages/Vendedores.tsx (protegida)

## Rotas HTTP de backend
- `GET /{t}` → scripts/ai-context/cenarios.mjs
- `GET /a` → scripts/ai-context/cenarios.mjs
- `GET /a` → scripts/ai-context/cenarios.mjs
- `POST /b` → scripts/ai-context/cenarios.mjs
- `POST /b` → scripts/ai-context/cenarios.mjs
- `DELETE /c` → scripts/ai-context/cenarios.mjs
- `PUT /d` → scripts/ai-context/cenarios.mjs
- `GET /items` → scripts/ai-context/gerar.unit.mjs
- `GET /u` → scripts/ai-context/cenarios.mjs
- `GET /users` → scripts/ai-context/cenarios.mjs
- `POST /users/:id` → scripts/ai-context/cenarios.mjs
- `GET /x` → scripts/ai-context/cenarios.mjs
- `DJANGO prod` → scripts/data/test_data_migrate_pg_scenarios.py
- `DJANGO prod` → scripts/data/test_data_migrate_pg_scenarios.py
- `DJANGO prod` → scripts/data/test_data_migrate_pg_scenarios.py
- `DJANGO prod` → scripts/data/test_data_migrate_pg_scenarios.py
- `DJANGO prod` → scripts/data/test_data_migrate_pg_scenarios.py
- `DJANGO prod` → scripts/data/test_data_migrate_pg_scenarios.py
- `DJANGO stg` → scripts/data/test_data_migrate_pg_scenarios.py
- `DJANGO stg` → scripts/healthcheck/test_healthcheck_scenarios.py
- `DJANGO stg` → scripts/integrity/test_integrity_pg_scenarios.py
- `DJANGO stg` → scripts/integrity/test_integrity_pg_scenarios.py
- `DJANGO stg` → scripts/integrity/test_integrity_pg_scenarios.py
- `DJANGO stg` → scripts/integrity/test_integrity_pg_scenarios.py
- `DJANGO stg` → scripts/integrity/test_integrity_pg_scenarios.py

## Vistas por id (menu/ViewRouter → arquivo)
- (nenhum)

## Edge functions
- `aceitar-convite` — tabelas: convites, organizacao_membros, organizacoes; chamada por 1 arquivo(s) do front
- `analise-fluxo-ia` (verify_jwt=false) — tabelas: -; chamada por 1 arquivo(s) do front
- `analise-preditiva` — tabelas: clientes, contas_pagar, contas_receber, transacoes_bancarias; chamada por 1 arquivo(s) do front
- `analyze-document` (verify_jwt=false) — tabelas: -; chamada por 2 arquivo(s) do front
- `api-keys-manage` (verify_jwt=false) — tabelas: api_keys, user_empresas; chamada por 1 arquivo(s) do front
- `asaas-proxy` (verify_jwt=false) — tabelas: asaas_audit_trail, asaas_config, asaas_credit_risk_analysis, asaas_customers, asaas_payment_links, asaas_payments, asaas_reconciliation_suggestions, asaas_sync_queue, asaas_transfers, clientes, contas_receber, user_empresas, user_roles; chamada por 4 arquivo(s) do front
- `asaas-webhook` (verify_jwt=false) — tabelas: asaas_audit_trail, asaas_payments, asaas_transfers; chamada por 0 arquivo(s) do front
- `benchmarking-setorial` (verify_jwt=false) — tabelas: -; chamada por 1 arquivo(s) do front
- `bitrix24-sync` — tabelas: bitrix_field_mappings, bitrix_oauth_tokens, bitrix_sync_logs, clientes, contas_receber, elisao_tarefas_acionaveis, empresas; chamada por 3 arquivo(s) do front
- `bitrix24-webhook` (verify_jwt=false) — tabelas: -; chamada por 1 arquivo(s) do front
- `bling-proxy` (verify_jwt=false) — tabelas: bling_tokens, user_roles; chamada por 2 arquivo(s) do front
- `bling-webhook` (verify_jwt=false) — tabelas: alertas; chamada por 0 arquivo(s) do front
- `calcular-health-score-operacional` — tabelas: alertas, apuracoes_tributarias, contas_bancarias, contas_receber, empresas, health_scores_operacionais, solicitacoes_lgpd, transacoes_bancarias, user_empresas; chamada por 1 arquivo(s) do front
- `calcular-slo-metrics-diario` — tabelas: slo_metrics_diarias, vw_edge_health; chamada por 0 arquivo(s) do front — **ÓRFÃ**
- `calculo-iva` — tabelas: -; chamada por 0 arquivo(s) do front — **ÓRFÃ**
- `categorizar-despesa` (verify_jwt=false) — tabelas: -; chamada por 1 arquivo(s) do front
- `ci-security-gate-log` (verify_jwt=false) — tabelas: ci_security_gate_events; chamada por 0 arquivo(s) do front
- `cnpja-lookup` (verify_jwt=false) — tabelas: cnpja_cache; chamada por 1 arquivo(s) do front
- `comparar-benchmark-setorial` — tabelas: empresas, faturamento_mensal, user_empresas; chamada por 1 arquivo(s) do front
- `compare-schemas` (verify_jwt=false) — tabelas: -; chamada por 0 arquivo(s) do front
- `conciliacao-ia` — tabelas: -; chamada por 1 arquivo(s) do front
- `conciliacao-proxy` — tabelas: -; chamada por 1 arquivo(s) do front
- `consulta-tributaria` — tabelas: aliquotas_interestaduais, aliquotas_internas_uf, aliquotas_iss_municipal, beneficios_fiscais, cnaes, ncms, protocolos_st_ncms, protocolos_st_ufs; chamada por 1 arquivo(s) do front
- `contabilizar-evento` — tabelas: eventos_contabilizacao_log, lancamentos_contabeis, partidas_contabeis, regras_contabilizacao_automatica, user_empresas, user_roles; chamada por 1 arquivo(s) do front
- `convidar-contador` — tabelas: convites_contador, user_empresas; chamada por 1 arquivo(s) do front
- `convidar-usuario` (verify_jwt=false) — tabelas: profiles, user_roles; chamada por 1 arquivo(s) do front
- `copilot-global` — tabelas: acoes_recomendadas, alertas, contas_bancarias, contas_pagar, contas_receber, health_scores_operacionais, user_roles; chamada por 1 arquivo(s) do front
- `copilot-tributario` — tabelas: empresas, user_roles; chamada por 1 arquivo(s) do front
- `decidir-regime` (verify_jwt=false) — tabelas: empresas, faturamento_mensal, folha_pagamento, regime_decision_cache, tax_audit_trail; chamada por 1 arquivo(s) do front
- `detectar-anomalias-financeiras` — tabelas: anomalia_detection_runs, anomalias_detectadas, contas_pagar, empresas, movimentacoes, regime_decision_cache, transacoes_bancarias; chamada por 2 arquivo(s) do front
- `digest-silenciamentos-erro` (verify_jwt=false) — tabelas: profiles, user_roles; chamada por 0 arquivo(s) do front, por SQL/cron
- `enviar-alerta-email` (verify_jwt=false) — tabelas: alertas; chamada por 0 arquivo(s) do front
- `enviar-bitrix24-tributario` (verify_jwt=false) — tabelas: user_empresas; chamada por 1 arquivo(s) do front
- `enviar-convite-organizacao` — tabelas: convites, organizacao_membros, organizacoes; chamada por 1 arquivo(s) do front
- `enviar-digest-conformidade` — tabelas: alertas_tributarios, digest_envios_log, empresas, integration_secrets, profiles, user_digest_preferences, user_roles; chamada por 0 arquivo(s) do front, por SQL/cron
- `enviar-relatorios-tributarios-agendados` — tabelas: empresas, relatorios_tributarios_agendados; chamada por 0 arquivo(s) do front — **ÓRFÃ**
- `executar-analise-preditiva` (verify_jwt=false) — tabelas: alertas_preditivos, clientes, contas_pagar, contas_receber, empresas, historico_analises_preditivas, historico_score_saude, metas_financeiras, recomendacoes_metas_ia, transacoes_bancarias, user_empresas; chamada por 0 arquivo(s) do front
- `executar-fechamento-tributario` — tabelas: apuracoes_tributarias, empresas, fechamentos_tributarios, regime_decision_cache, relatorios_tributarios, transacoes_bancarias, user_roles, verificacoes_conformidade; chamada por 1 arquivo(s) do front
- `executar-regua-cobranca` (verify_jwt=false) — tabelas: contas_receber, execucoes_regua_cobranca, regua_cobranca; chamada por 0 arquivo(s) do front, por SQL/cron
- `executar-relatorios` (verify_jwt=false) — tabelas: contas_bancarias, contas_pagar, contas_receber, historico_relatorios, relatorios_agendados, user_empresas; chamada por 1 arquivo(s) do front
- `expert-agent` (verify_jwt=false) — tabelas: -; chamada por 2 arquivo(s) do front
- `exportar-sped-contribuicoes` — tabelas: apuracoes_tributarias, empresas, user_empresas, user_roles; chamada por 1 arquivo(s) do front
- `external-data` (verify_jwt=false) — tabelas: companies, query_telemetry, user_empresas; chamada por 2 arquivo(s) do front
- `gerar-acoes-recomendadas` — tabelas: acoes_recomendadas, alertas_tributarios, anomalias_detectadas, apuracoes_tributarias, empresas, health_scores_operacionais, solicitacoes_lgpd; chamada por 1 arquivo(s) do front
- `gerar-alertas` (verify_jwt=false) — tabelas: alertas, contas_pagar, contas_receber, metas_financeiras; chamada por 0 arquivo(s) do front
- `gerar-alertas-dispatcher` (verify_jwt=false) — tabelas: -; chamada por 0 arquivo(s) do front
- `gerar-alertas-tributarios` (verify_jwt=false) — tabelas: alertas_tributarios, apuracoes_tributarias, benchmarks_setoriais, edge_function_logs, empresas, faturamento_mensal, folha_pagamento, movimentacoes; chamada por 0 arquivo(s) do front
- `gerar-dre-tributaria` (verify_jwt=false) — tabelas: empresas, faturamento_mensal, user_empresas; chamada por 1 arquivo(s) do front
- `gerar-heatmap-tributario` (verify_jwt=false) — tabelas: faturamento_mensal, user_empresas; chamada por 1 arquivo(s) do front
- `gerar-pacote-evidencias` — tabelas: evidencias_pacotes, user_empresas, user_roles; chamada por 2 arquivo(s) do front
- `gerar-pdf-tributario` (verify_jwt=false) — tabelas: empresas, user_empresas; chamada por 1 arquivo(s) do front
- `gerar-relatorio-anual` — tabelas: alertas_tributarios, empresas, user_empresas, user_roles, vw_tributario_dashboard; chamada por 1 arquivo(s) do front
- `gerar-resumo-executivo-semanal` — tabelas: alertas_tributarios, contas_pagar, contas_receber, empresas, relatorios_tributarios_agendados, resumos_executivos_semanais; chamada por 1 arquivo(s) do front
- `gerar-resumo-financeiro-diario` — tabelas: asaas_config, asaas_payments, asaas_sync_queue, empresas; chamada por 1 arquivo(s) do front
- `gerar-snapshots-conformidade` — tabelas: alertas_tributarios, conformidade_snapshots, empresas, entregas_obrigacoes, integration_secrets; chamada por 0 arquivo(s) do front — **ÓRFÃ**
- `gerar-sped-ecd` — tabelas: empresas, lancamentos_contabeis, plano_contas, sped_contabil_arquivos, user_empresas, user_roles; chamada por 1 arquivo(s) do front
- `gerar-sped-ecf` — tabelas: empresas, lancamentos_contabeis, plano_contas, sped_contabil_arquivos, user_empresas, user_roles; chamada por 1 arquivo(s) do front
- `get-mapbox-token` — tabelas: -; chamada por 0 arquivo(s) do front — **ÓRFÃ**
- `get-vapid-key` (verify_jwt=false) — tabelas: -; chamada por 1 arquivo(s) do front
- `health` (verify_jwt=false) — tabelas: asaas_config; chamada por 1 arquivo(s) do front
- `insights-relatorio` (verify_jwt=false) — tabelas: -; chamada por 1 arquivo(s) do front
- `log-sped-bitrix24` — tabelas: audit_logs; chamada por 1 arquivo(s) do front
- `mcp-query` (verify_jwt=false) — tabelas: -; chamada por 0 arquivo(s) do front
- `monitor-health` (verify_jwt=false) — tabelas: alertas, profiles, webhooks_log; chamada por 0 arquivo(s) do front, por SQL/cron
- `monitorar-erros-frontend` (verify_jwt=false) — tabelas: profiles, user_roles; chamada por 0 arquivo(s) do front
- `n8n-callback` (verify_jwt=false) — tabelas: -; chamada por 0 arquivo(s) do front
- `n8n-dispatch` — tabelas: n8n_dispatch_logs, n8n_workflow_configs; chamada por 0 arquivo(s) do front — **ÓRFÃ**
- `nfe-upload-certificado` — tabelas: sefaz_dfe_cursor; chamada por 1 arquivo(s) do front
- `nfe-vinculo-proxy` — tabelas: -; chamada por 1 arquivo(s) do front
- `notify-performance-alert` (verify_jwt=false) — tabelas: query_telemetry; chamada por 0 arquivo(s) do front, por SQL/cron
- `notify-saved-filter` — tabelas: notification_history; chamada por 1 arquivo(s) do front
- `open-finance` — tabelas: contas_bancarias, open_finance_consents, transacoes_bancarias; chamada por 1 arquivo(s) do front
- `overlay-rejeicoes-auditoria` — tabelas: overlay_rejeicoes_auditoria; chamada por 1 arquivo(s) do front
- `prever-carga-tributaria` (verify_jwt=false) — tabelas: faturamento_mensal, user_empresas; chamada por 1 arquivo(s) do front
- `processar-fila-cobrancas` — tabelas: execucoes_cobranca, fila_cobrancas; chamada por 1 arquivo(s) do front
- `processar-nf-ocr` — tabelas: notas_fiscais_ocr; chamada por 1 arquivo(s) do front
- `processar-solicitacao-lgpd` — tabelas: alertas, audit_logs, auditoria_tributaria, profiles, solicitacoes_lgpd; chamada por 1 arquivo(s) do front
- `projecao-reforma` — tabelas: -; chamada por 0 arquivo(s) do front — **ÓRFÃ**
- `relatorio-diario-anomalias` — tabelas: alertas, anomalias_detectadas, profiles, user_roles; chamada por 0 arquivo(s) do front — **ÓRFÃ**
- `scim-server` (verify_jwt=false) — tabelas: profiles, scim_operations_log, scim_tokens, sso_providers, sso_role_mappings, user_empresas, user_roles; chamada por 2 arquivo(s) do front
- `sefaz-dfe-dispatcher` (verify_jwt=false) — tabelas: cron_job_logs, empresas_certificados, sefaz_dfe_cursor; chamada por 0 arquivo(s) do front
- `sefaz-dfe-puxar` (verify_jwt=false) — tabelas: empresas_certificados, query_telemetry, sefaz_dfe_cursor; chamada por 0 arquivo(s) do front
- `sefaz-manifestar` — tabelas: empresas_certificados, nfe_eventos, nfe_recebidas, user_empresas; chamada por 1 arquivo(s) do front
- `send-device-alert` (verify_jwt=false) — tabelas: -; chamada por 1 arquivo(s) do front
- `send-push-notification` (verify_jwt=false) — tabelas: alertas, push_subscriptions; chamada por 4 arquivo(s) do front, por SQL/cron
- `simular-presumido` — tabelas: -; chamada por 0 arquivo(s) do front — **ÓRFÃ**
- `simular-real` — tabelas: -; chamada por 0 arquivo(s) do front — **ÓRFÃ**
- `simular-simples` — tabelas: -; chamada por 0 arquivo(s) do front — **ÓRFÃ**
- `sincronizar-anomalia-bitrix24` — tabelas: anomalias_detectadas; chamada por 1 arquivo(s) do front
- `sso-callback` (verify_jwt=false) — tabelas: audit_logs, profiles, sso_login_attempts, sso_providers, sso_role_mappings, sso_user_groups, user_empresas, user_roles; chamada por 2 arquivo(s) do front
- `sso-generate-metadata` — tabelas: -; chamada por 1 arquivo(s) do front
- `sso-initiate` (verify_jwt=false) — tabelas: sso_login_attempts, sso_providers; chamada por 2 arquivo(s) do front
- `sso-logout` (verify_jwt=false) — tabelas: audit_logs, sso_login_attempts, sso_providers; chamada por 2 arquivo(s) do front
- `sso-test-login` — tabelas: sso_providers, sso_role_mappings, user_roles; chamada por 2 arquivo(s) do front
- `sso-validate-config` — tabelas: -; chamada por 1 arquivo(s) do front
- `sync-profile-to-bitrix` — tabelas: audit_logs, bitrix_oauth_tokens, profiles; chamada por 0 arquivo(s) do front — **ÓRFÃ**
- `upload-anexo` — tabelas: anexos_financeiros, user_empresas; chamada por 1 arquivo(s) do front
- `validar-token-contador` (verify_jwt=false) — tabelas: convites_contador, empresas; chamada por 1 arquivo(s) do front
- `validate-ip-geo` (verify_jwt=false) — tabelas: auth_logs; chamada por 1 arquivo(s) do front
- `verificar-conformidade-fiscal` — tabelas: alertas_tributarios, apuracoes_tributarias, contas_pagar, empresas, regime_decision_cache, relatorios_tributarios_agendados, user_empresas, user_roles, verificacoes_conformidade; chamada por 1 arquivo(s) do front
- `webhook-replay` (verify_jwt=false) — tabelas: webhooks_log; chamada por 0 arquivo(s) do front
- `webhook-retry-worker` (verify_jwt=false) — tabelas: -; chamada por 0 arquivo(s) do front
- `webhook-simulator` — tabelas: webhook_simulation_results, webhook_simulation_runs; chamada por 1 arquivo(s) do front
- `whatsapp-ai-analyzer` — tabelas: historico_cobranca_whatsapp; chamada por 0 arquivo(s) do front, por SQL/cron
- `whatsapp-ia-proativo` (verify_jwt=false) — tabelas: clientes, contas_receber, historico_cobranca_whatsapp, user_empresas; chamada por 2 arquivo(s) do front
- `whatsapp-webhook` (verify_jwt=false) — tabelas: asaas_audit_trail, execucoes_cobranca; chamada por 0 arquivo(s) do front

## Cron jobs (pg_cron / vercel)
- `capture-index-usage-daily` 20 4 * * * (20260729153623_f4950fa7-9942-486b-a971-7d6bd864836c.sql)
- `capture-slow-queries` */15 * * * * (20260711153310_67e3959b-15ec-494d-869f-285ec3a9e765.sql)
- `cleanup-rpc-obs-metrics-daily` 17 3 * * * (20260723123927_a8400102-ff92-427c-acd8-458bf4149ff6.sql)
- `cron-failure-watch` 10 * * * * (20260825130000_fixes_phd_validation.sql)
- `daily-log-cleanup` 40 3 * * * (20260728110011_3239bd8f-24ff-4511-8e42-e028edd7cd87.sql)
- `daily-log-retention` 0 3 * * * (20260825130000_fixes_phd_validation.sql)
- `digest-silenciamentos-erro` 0 11 * * 1 → edge digest-silenciamentos-erro (20260728183119_5fa30fdd-f9ad-40b1-b372-c22b511306f4.sql)
- `enviar-digest-conformidade-horario` 30 * * * * → edge enviar-digest-conformidade (20260726180529_06dcfab8-b837-491e-b01c-84859005e05b.sql)
- `executar-regua-cobranca-diaria` 0 12 * * * (20260822115000_agendar_regua_cobranca.sql)
- `gerar-alertas-vencimento-diario` 0 8 * * * (20260825130000_fixes_phd_validation.sql)
- `gerar-contas-recorrentes-diario` 35 3 * * * (20260825130000_fixes_phd_validation.sql)
- `integrity-invariants-hourly` 5 * * * * (20260722173817_3d8a2d6a-06b3-4eeb-bde3-93eeed3c6c06.sql)
- `maintain-monthly-partitions` 10 3 * * * (20260728110011_3239bd8f-24ff-4511-8e42-e028edd7cd87.sql)
- `monitor-health-check` */30 * * * * → edge monitor-health (20261101200000_monitor_health_cron.sql)
- `monitor-table-bloat-daily` 15 3 * * * (20260712161351_668a148c-f3c1-4a32-a54b-4cf682666699.sql)
- `pgss_baseline_cleanup` 0 4 1 * * (20260712220428_307d75db-6942-4dc3-9416-60e40dce8334.sql)
- `pgss-weekly-baseline` 0 4 * * 0 (20260825130000_fixes_phd_validation.sql)
- `processar-regua-cobranca-diario` 0 9 * * * (20260825130000_fixes_phd_validation.sql)
- `refresh-benchmark-setorial-weekly` 0 3 * * 0 (20260418140233_7d5861e9-57bc-4df3-827b-b9fda80cc806.sql)
- `refresh-performance-alerts-weekly` 45 3 * * * (20260712194623_6779ec03-860d-4d19-89b2-044aa6594ba8.sql)
- `sefaz-observability-hourly` 5 * * * * (20260723120954_26546526-ca79-48e8-b067-571d2d02a16d.sql)

## Integrações externas
- SDKs: Sentry, Supabase, i18next, react-query, zod
- hosts mais citados: ai.gateway.lovable.dev, api.resend.com, www.portalfiscal.inf.br, test.supabase.co, api.supabase.com, app.promo-finance.com, app.test, bwwbeyolnnzppeuhgkcd.supabase.co, exemplo.com, idp.acme, x.supabase.co, ipapi.co, wa.me, www1.nfe.fazenda.gov.br, api.asaas.com
- webhooks recebidos: analise-fluxo-ia, analyze-document, api-keys-manage, asaas-proxy, asaas-webhook, benchmarking-setorial, bitrix24-webhook, bling-proxy, bling-webhook, categorizar-despesa, ci-security-gate-log, cnpja-lookup, compare-schemas, convidar-usuario, decidir-regime, digest-silenciamentos-erro, enviar-alerta-email, enviar-bitrix24-tributario, executar-analise-preditiva, executar-regua-cobranca, executar-relatorios, expert-agent, external-data, gerar-alertas, gerar-alertas-dispatcher, gerar-alertas-tributarios, gerar-dre-tributaria, gerar-heatmap-tributario, gerar-pdf-tributario, get-vapid-key, health, insights-relatorio, mcp-query, monitor-health, monitorar-erros-frontend, n8n-callback, notify-performance-alert, prever-carga-tributaria, scim-server, sefaz-dfe-dispatcher, sefaz-dfe-puxar, send-device-alert, send-push-notification, sso-callback, sso-initiate, sso-logout, validar-token-contador, validate-ip-geo, webhook-replay, webhook-retry-worker, whatsapp-ia-proativo, whatsapp-webhook
- env de integração (só nomes): ASAAS_API_KEY, ASAAS_WEBHOOK_TOKEN, BITRIX24_ACCESS_TOKEN, BITRIX24_CLIENT_ID, BITRIX24_CLIENT_SECRET, BLING_CLIENT_ID, BLING_CLIENT_SECRET, CI_GATE_LOG_SECRET, CNPJA_API_KEY, CONTADOR_INVITE_SECRET, CRON_DISPATCH_SECRET, EDGE_SENTRY_DSN, LOVABLE_API_KEY, MAPBOX_ACCESS_TOKEN, N8N_DISPATCH_SECRET, OPENAI_API_KEY, OPEN_FINANCE_CLIENT_ID, OPEN_FINANCE_CLIENT_SECRET, REGUA_CRON_SECRET, RESEND_API_KEY, RESEND_FROM, SEFAZ_CRON_SECRET, SENTRY_DSN, SENTRY_ENVIRONMENT, SLACK_WEBHOOK_URL, SUPABASE_JWT_SECRET, VITE_BLING_CLIENT_ID, VITE_SENTRY_DSN

## Permissões / papéis
- papéis no código: user (24), system (19), alert (15), admin (14), status (13), assistant (5), region (5), AMBOS (4), ORIGEM (4), dialog (4), img (4), list (4), progressbar (4), DESTINO (3), financeiro (3), presentation (3), RESPONSAVEL (2), anon (2), combobox (2), contador_readonly (2), group (2), separator (2), visualizador (2), MEMBRO (1), agent (1), authenticated (1), button (1), checkbox (1), editor (1), link (1), listitem (1), note (1), operacional (1), radiogroup (1), root (1), service_role (1), sup (1), tool (1), treeitem (1)
- enums de papel: app_role: admin|financeiro|operacional|visualizador|financeiro|operacional|visualizador|financeiro|operacional|visualizador|contador|viewer|manager|operator|viewer; org_papel: RESPONSAVEL|ADMIN|MEMBRO|LEITOR
- guards: src/components/auth/EmpresaGuard.tsx, src/components/auth/ProtectedRoute.tsx, src/components/navigation/UnsavedGuardProvider.tsx · rotas protegidas: 120 · públicas: /__especimes, /*, /auth, /auth/corporate, /contador/:token, /convite/:token, /design-system-debug, /reset-password, /status, /theme-diagnostics
- feature flags: ENABLE_AUTHENTICATED_VISUAL_SNAPSHOTS, ENABLE_PRODUCTION_SIMULATION_AUDIT, FEATURE_X, nova-tela, novo-inbox

## Alertas (baseline.json → alertas)
- rotas_sem_arquivo: 0
- componentes_ambiguos: 0
- menu_sem_destino: 20 — ex.: Apuração IBS/CBS -> apuracao, Auditoria -> auditoria, Calculadora -> calculadora
- edges_orfas: 12 — ex.: calcular-slo-metrics-diario, calculo-iva, enviar-relatorios-tributarios-agendados
- edges_chamadas_sem_pasta: 0
- tabelas_sem_rls: 0
- tabelas_usadas_sem_definicao: 2 — ex.: companies, relatorios_tributarios
- tabelas_com_drift_migration_vs_types: 156 — ex.: acessos_suspeitos, acoes_recomendadas, alertas_preditivos
- rpcs_sem_definicao: 3 — ex.: exec_sql, get_cron_run_history, pg_try_advisory_lock
- componentes_orfaos: 44 — ex.: src/components/admin/FiscalHealthBadge.tsx, src/components/admin/telemetry/AcessosSuspeitosPanel.tsx, src/components/admin/telemetry/CatalogosTributariosHealthPanel.tsx
- componentes_com_nome_duplicado: 35 — ex.: Accordion, AccordionItem, Alertas
- scripts_orfaos: 0
- env_usadas_nao_declaradas: 4 — ex.: DEV, MODE, NODE_ENV
- ciclos_de_import: 7
- possiveis_segredos_no_codigo: 0

## Grafo de código (graphify)
- não gerado neste run. Neste repo NÃO execute `graphify update .` (proibido por AGENTS.md, seção Graphify). O fluxo autorizado é o piloto: `npm run graphify:pilot`, ou `npm run graphify:analyze -- --profile NOME` (revise antes com `npm run graphify:inventory -- --profile NOME`). Resultados privados em graphify-out/piloto-*/; consulte apenas grafo cuja evidencia.json tenha piloto validado e hashes compatíveis com os arquivos atuais.

## Hotspots (arquivos mais alterados, 90 dias)
- package.json (36)
- bun.lock (29)
- .github/workflows/ci.yml (26)
- supabase/config.toml (15)
- supabase/functions/asaas-proxy/index.ts (15)
- .github/workflows/deno-tests.yml (14)
- supabase/functions/mcp-query/index.ts (14)
- env.manifest.json (13)
- .github/workflows/supabase-linter.yml (11)
- PENDENCIAS.md (11)
- RELATORIO_CI.md (11)
- scripts/generate-env-manifest.mjs (11)
- supabase/functions/bling-proxy/index.ts (11)
- supabase/functions/n8n-callback/index.ts (11)
- src/App.tsx (10)

## Workflows
- `actionlint.yml` — Workflow Linter (actionlint + zizmor) (pull_request, push, workflow_dispatch)
- `auto-update-pr-branch.yml` — Auto Update PR Branches (push, schedule, workflow_dispatch, workflow_run; cron 11,41 * * * *)
- `automation-local.yml` — Automação local (pull_request, push, workflow_dispatch)
- `ci.yml` — CI Pipeline (pull_request, push, workflow_dispatch)
- `codeql.yml` — CodeQL Analysis (pull_request, push, schedule; cron 17 3 * * 1)
- `contexto.yml` — Contexto para agentes de IA (10 min) (pull_request, push, schedule, workflow_dispatch; cron 7 * * * *)
- `deno-tests.yml` — Deno Edge Function Tests (pull_request, push, workflow_dispatch)
- `dependency-review.yml` — Dependency Review (pull_request)
- `estado-real.yml` — Estado real (CI e edge functions) (push, schedule, workflow_dispatch; cron 38 11 * * 1)
- `functions-deploy.yml` — Deploy controlado de Edge Function (workflow_dispatch)
- `graphify.yml` — Graphify — mapas privados (pull_request, push, workflow_dispatch)
- `inventario-estado.yml` — Inventário do estado real (semanal) (pull_request, push, schedule, workflow_dispatch; cron 41 9 * * 1)
- `migration-ledger.yml` — Migration Ledger Check (workflow_dispatch)
- `prod-migrate.yml` — prod-migrate (workflow_dispatch)
- `schema-drift.yml` — Schema drift (types + migrations) (schedule, workflow_dispatch; cron 0 6 * * 1)
- `settings-guard.yml` — Settings Guard (schedule, workflow_dispatch; cron 19 7 * * *)
- `staging-migrate.yml` — staging-migrate (workflow_dispatch)
- `supabase-admin-ops.yml` — Ops administrativas do Supabase canônico (workflow_dispatch)
- `supabase-linter.yml` — Supabase Linter (RLS/GRANT gate) (pull_request, push, workflow_dispatch)

## Scripts npm
- `maintenance:doctor`: `sh scripts/maintenance/run.sh doctor --root .`
- `maintenance:check`: `sh scripts/maintenance/run.sh check --root . --ref origin/main`
- `maintenance:heal`: `sh scripts/maintenance/run.sh heal --root . --ref origin/main`
- `test:maintenance`: `node --test scripts/maintenance/maintenance.unit.mjs`
- `graphify:inventory`: `python3 scripts/graphify/run.py inventory`
- `graphify:pilot`: `python3 scripts/graphify/run.py pilot`
- `graphify:analyze`: `python3 scripts/graphify/run.py analyze`
- `graphify:sql-inventory`: `python3 scripts/graphify/sql_inventory.py`
- `graphify:code-references`: `python3 scripts/graphify/code_references.py`
- `graphify:edge-inventory`: `python3 scripts/graphify/edge_inventory.py`
- `graphify:quality`: `python3 scripts/graphify/graph_quality.py`
- `graphify:benchmark`: `python3 scripts/graphify/benchmark.py`
- `graphify:test`: `python3 -m unittest discover -s scripts/graphify -p 'test_*.py' -v`
- `dev`: `vite`
- `build`: `vite build`
- `build:dev`: `vite build --mode development`
- `preview`: `vite preview`
- `lint`: `cross-env ESLINT_USE_FLAT_CONFIG=true eslint . --report-unused-disable-directives`
- `lint:strict`: `cross-env ESLINT_USE_FLAT_CONFIG=true eslint . --report-unused-disable-directives --max-warnings 0`
- `lint:fix`: `cross-env ESLINT_USE_FLAT_CONFIG=true eslint . --fix`
- `format`: `prettier --write "src/**/*.{ts,tsx,css,json}" "supabase/functions/**/*.ts"`
- `format:check`: `prettier --check "src/**/*.{ts,tsx,css,json}" "supabase/functions/**/*.ts"`
- `type-check`: `tsc --noEmit`
- `type-check:e2e`: `tsc -p tsconfig.e2e.json`
- `test`: `vitest`
- `test:run`: `cross-env NODE_OPTIONS=--max-old-space-size=8192 vitest run`
- `test:changed`: `cross-env NODE_OPTIONS=--max-old-space-size=8192 vitest run --changed origin/main --passWithNoTests`
- `test:coverage`: `cross-env NODE_OPTIONS=--max-old-space-size=8192 vitest run --coverage`
- `test:ui`: `vitest --ui`
- `test:e2e`: `playwright test`
- `test:e2e:ui`: `playwright test --ui`
- `test:e2e:report`: `playwright show-report`
- `prepare`: `husky`
- `db:migrate`: `supabase db push`
- `db:reset`: `supabase db reset`
- `db:seed`: `supabase db seed`
- `storybook`: `storybook dev -p 6006`
- `build-storybook`: `storybook build`
- `build:types`: `tsc && vite build`
- `scan:secrets`: `gitleaks git --no-banner --redact --baseline-path .gitleaks-baseline.json`
- `scan:secrets:tree`: `gitleaks dir . --no-banner --redact --baseline-path .gitleaks-baseline.json`
- `type-check:strict`: `bash scripts/ci/typecheck-strict-baseline.sh`
- `automation:doctor`: `node scripts/automation.mjs doctor`
- `automation:test`: `node scripts/automation.mjs test`
- `automation:check`: `node scripts/automation.mjs check --ref HEAD`
- `automation:heal`: `node scripts/automation.mjs heal --ref origin/main`
- `automation:nightly`: `node scripts/automation.mjs nightly --ref origin/main`
- `automation:graph`: `node scripts/automation.mjs graph`
- `automation:status`: `node scripts/automation.mjs graph status`
- `automation:install-hooks`: `node scripts/automation.mjs install-hooks`
- `automation:uninstall-hooks`: `node scripts/automation.mjs uninstall-hooks`

## Documentos (raiz e docs/)
- `.github/PULL_REQUEST_TEMPLATE.md` (21 linhas)
- `.github/copilot-instructions.md` (1 linhas)
- `AGENTS.md` — AGENTS.md — Promo_Finance_V2 (67 linhas)
- `AI_RULES.md` — AI_RULES (78 linhas)
- `AUDITORIA.md` — AUDITORIA — Promo Finance V2 (647 linhas)
- `CHANGELOG.md` — Changelog (113 linhas)
- `CLAUDE.md` (1 linhas)
- `CONTRIBUTING.md` — 🤝 Guia de Contribuição (289 linhas)
- `ESTADO_ATUAL.md` — ESTADO ATUAL DO SISTEMA — Promo Finance v2 (778 linhas)
- `EXECAO_RESTYLE_METRONIC_V9.md` — EXCEÇÃO FORMAL: Epic de Restyle Metronic v9 (118 linhas)
- `EXECAO_VELA_DARK.md` — EXCEÇÃO FORMAL: Epic de Restyle Vela-dark (137 linhas)
- `HANDOFF_VELA_DARK.md` — HANDOFF — Epic Vela-dark Promo_Finance_V2 (227 linhas)
- `PENDENCIAS.md` — PENDÊNCIAS — Promo Finance V2 (308 linhas)
- `PLANO_100.md` (560 linhas)
- `PLANO_50.md` — PLANO_50 — 50 etapas de melhoria e correção (484 linhas)
- `README.md` — Promo Finance (63 linhas)
- `RELATORIO_ACEITE_VELA_DARK.md` — RELATÓRIO DE ACEITE — Epic Vela-dark · Promo_Finance_V2 (100 linhas)
- `RELATORIO_CI.md` — RELATÓRIO CI — Promo Finance V2 (339 linhas)
- `RELATORIO_IMPLEMENTACAO_EXAUSTIVO.md` — RELATÓRIO DE IMPLEMENTAÇÃO EXAUSTIVO — Epic Vela-dark (180 linhas)
- `SECURITY.md` — Política de Segurança — Promo Finance V2 (50 linhas)
- `SECURITY_RULES.md` — SECURITY_RULES (101 linhas)
- `docs/ACCESSIBILITY.md` — ♿ Guia de Acessibilidade - Promo Finance (310 linhas)
- `docs/ADR-001-LALAMOVE-FORA-DE-ESCOPO.md` — ADR-001 — Exclusão do módulo de logística/Lalamove (56 linhas)
- `docs/ADR-002-FUNCOES-ESSENCIAIS-PROMO-FINANCE.md` — ADR-002 — Funções essenciais do Promo Finance V2 (56 linhas)
- `docs/ADR-003-PAPEIS-POR-EMPRESA.md` — ADR-003 — Modelo de papéis e escopo de empresa (129 linhas)
- `docs/ARCHITECTURE.md` — Arquitetura — Promo Finance (101 linhas)
- `docs/ARCHITECTURE_GRAPH.md` — Grafo de Arquitetura — Promo Finance V2 (387 linhas)
- `docs/AUDITORIA_PLANEJADO_X_EXECUTADO_2026-10-12.md` — Auditoria exaustiva — Planejado × Executado (Promo Finance V2) (1365 linhas)
- `docs/AUDITORIA_SINCRONIA_2026-09-17.md` — Auditoria de Sincronia — Local ↔ GitHub ↔ Banco (2026-09-17) (79 linhas)
- `docs/AUDITORIA_TECNICA_EXAUSTIVA_2026-09-02_R2_LIVE.md` — Auditoria Técnica Exaustiva R2 (validação live) — Promo Finance V2 (323 linhas)
- `docs/AUTOMACAO_LOCAL.md` — Automação local — Promo_Finance_V2 (177 linhas)
- `docs/COMPONENTS.md` — Documentação dos Componentes UI Aprimorados (456 linhas)
- `docs/CSP_REVISAO.md` — Revisão CSP — Content Security Policy (46 linhas)
- `docs/DATA_MIGRATION.md` — Runbook — Migração de Dados PROD → STAGING (170 linhas)
- `docs/DB_HEALTH.md` — DB_HEALTH — Painel de Saúde do Banco (231 linhas)
- `docs/DEPLOYMENT.md` — Deployment Guide (60 linhas)
- `docs/DIAGRAMA_ER.md` — Diagrama ER — núcleo financeiro (155 linhas)
- `docs/EDGE_FUNCTIONS_CATALOG.md` — Catálogo de Edge Functions (98 linhas)
- `docs/FUNCIONALIDADES_SEM_UI.md` — 🔍 Funcionalidades sem UI completa — Promo Finance (168 linhas)
- `docs/FUNCIONALIDADES_SISTEMA.md` — 📋 Funcionalidades do Sistema — Promo Finance (358 linhas)
- `docs/GAPS_ENTERPRISE.md` — 🌐 Análise de Gaps Enterprise — Promo Finance (325 linhas)
- `docs/GETTING-STARTED.md` — Getting Started - Promo Finance (45 linhas)
- `docs/GRAPHIFY_PLANO_50_ETAPAS.md` — Graphify no Promo Finance V2 — implementação em 50 etapas (402 linhas)
- `docs/GRAPHIFY_VALIDACAO_2026-09-11.md` — Validação Graphify e catálogo canônico — 11/09/2026 (202 linhas)
- `docs/HEALTHCHECK.md` — Healthcheck pós-corte (68 linhas)
- `docs/INVENTARIO_FUNCIONALIDADES.md` — 📋 Inventário Completo de Funcionalidades e Ferramentas (586 linhas)
- `docs/INVENTARIO_REPOSITORIO.md` — 📋 INVENTÁRIO COMPLETO DO PROJETO FINANCEIRO (181 linhas)
- `docs/MATRIZ_PAPEIS.md` — Matriz papel × rota × acesso a dados (62 linhas)
- `docs/MIGRATIONS_ADR.md` — ADR — Migrations Consolidadas (356 migrations) (79 linhas)
- `docs/MIGRATION_CHECKLIST.md` — Checklist de Migração — Schema, RLS/Policies e Índices entre Projetos Supabase (199 linhas)
- `docs/MODULARIZATION_REPORT.md` — Relatório de Modularização (>400 linhas) (41 linhas)
- `docs/N8N_WORKFLOWS.md` — Integração n8n — Triagem, Tarefas e Roteamento por Score (42 linhas)
- `docs/PERFORMANCE.md` — ⚡ Guia de Performance - Promo Finance (315 linhas)
- `docs/PLANO_EXCELENCIA_10_10.md` — Plano de Excelência 10/10 — Promo Finance (72 linhas)
- `docs/PLANO_MELHORIAS_50_ETAPAS_2026-09-13.md` — Plano de Melhorias e Correções — 50 Etapas (741 linhas)
- `docs/PLANO_WORKFLOWS_100_ETAPAS_2026-09-27.md` — Plano de correções e melhorias — GitHub Workflows (100 etapas) (192 linhas)
- `docs/QA_EXHAUSTIVE_REPORT.md` — Relatório QA Exaustivo — 2026-07-22 (68 linhas)
- `docs/QA_VALIDATION_REPORT.md` — QA Validation Report — Auditoria Exaustiva (123 linhas)
- `docs/REAUDITORIA_FINAL.md` — Re-Auditoria Final — Plano 50 Etapas (141 linhas)
- `docs/RECONCILIACAO_ONLINE_2026-08-31.md` — Reconciliação online — 2026-08-31 (137 linhas)
- `docs/RLS_MATRIZ_NEGATIVA.md` — Matriz RLS negativa — o que o banco DEVE negar (137 linhas)
- `docs/RUNBOOK.md` — Runbook Operacional — Promo Finance (234 linhas)
- `docs/SCENARIOS.md` — Scenario Harness (102 linhas)
- `docs/SECURITY.md` — Segurança (57 linhas)
- `docs/SECURITY_DEFINER_ATTESTATION.md` — SECURITY DEFINER — Attestation & Justificativas (214 linhas)
- `docs/STAGING_MIGRATION.md` — Runbook — Migração para Staging (137 linhas)
- `docs/TESTING.md` — Guia de Testes (60 linhas)
- `docs/VALIDACAO_EXAUSTIVA_R2_2026-09-03.md` — Validação Exaustiva R2 — 2026-09-03 (182 linhas)
- `docs/VALIDACAO_SEGURANCA_GATEWAY_2026-08-27.md` — Validação de segurança dos gateways — 2026-08-27 (49 linhas)
- `docs/prod-readiness.md` — Prontidão para produção — Promo_Finance_V2 (861 linhas)
- `docs/testing-architecture.md` — Freight Quest Testing Architecture (38 linhas)
- subpastas de docs/: docs/agentes (9), docs/archive (9), docs/guides (9), docs/execucao-cline (5), docs/runbooks (5), docs/ci (2), docs/contexto (2), docs/migracao (2), docs/adr (1), docs/evidencias (1)
- CHANGELOG topo: [Unreleased]

## Últimos commits
- 2026-11-16 `1d6ef94` chore(db): versiona as 17 colunas que existem em produção e não na cadeia (#387)
- 2026-11-16 `d9ff7e0` fix: alinha o vocabulário de forma de cobrança ao enum do banco (#386)
- 2026-11-16 `38f4896` fix: projeção da Tesouraria usa valor residual, inclui parcial e respeita o filtro de empresa (#384)
- 2026-11-16 `311bf35` fix: Fluxo de Caixa respeita a empresa selecionada, e dispensas de alerta por empresa (#383)
- 2026-11-16 `40876f4` fix: KPIs de contas a receber e a pagar param de inventar o período anterior (#382)
- 2026-11-16 `e314002` chore(db): versiona a DDL que está em produção e não existe no repositório (#380)
- 2026-11-16 `8236365` fix(db): restaura a unicidade NFe → conta a pagar que outro agente derrubou em produção (#385)
- 2026-11-16 `15dc272` fix: NF-e de emitente novo para de falhar — fornecedores ganha empresa_id (#381)
- 2026-11-16 `9003088` chore(test): trava o escopo por empresa do card de duplicidades do dashboard (#369)
- 2026-11-16 `0bb1b7a` chore(test): gate de origem das edge functions cruza config.toml e cobre 16 funções (#368)
- 2026-11-16 `9782d38` fix(edge): corpo JSON malformado responde 422 em vez de 500 em 20 edge functions (#365)
- 2026-11-16 `cf94b6b` fix(db): refresh_mv_benchmark_setorial sai de PUBLIC e para de engolir erro em WHEN OTHERS (#370)
- 2026-11-16 `5272662` fix: estorno contábil de movimentação excluída/alterada, com as 6 correções da revisão da #340 (#366)
- 2026-11-16 `bc42f17` chore(docs): registra a análise do log de produção de 14/11 (#367)
- 2026-11-16 `c4b811d` fix(a11y): filtros do dashboard ganham nome acessível e anel de foco (#364)

## Arquivos deste diretório
- `docs/contexto/codigo/rotas.json`
- `docs/contexto/codigo/modulos.json`
- `docs/contexto/codigo/componentes.json`
- `docs/contexto/codigo/hooks.json`
- `docs/contexto/codigo/edge-functions.json`
- `docs/contexto/codigo/banco.json`
- `docs/contexto/codigo/ferramentas.json`
- `docs/contexto/codigo/scripts.json`
- `docs/contexto/codigo/testes.json`
- `docs/contexto/codigo/logica.json`
- `docs/contexto/codigo/grafo.json`
- `docs/contexto/codigo/grafo-arestas.json`
- `docs/contexto/codigo/convencoes.json`
- `docs/contexto/codigo/grafo-graphify.json`
- `docs/contexto/codigo/baseline.json`
- `docs/contexto/codigo/manifest.json` (commit, data, hashes, erros — único arquivo com data/hora)
