# Prontidão para produção — Promo_Finance_V2

> Auditoria de 12/11/2026 (sessão Claude Code). Linha de base: `main` em `bd5e644` (PR #320). Estado conferido no fechamento: `main` em `68bac76` (PRs #322, #323, #321 e #325 mergeadas), produção `dpl_9Fw6ewRRSxVwnWosXbyMyTcGtuCQ` READY.
> Toda marcação abaixo tem prova (comando, query, log ou request real). Nada marcado como
> "não verificado": o que não pôde ser provado está como **BLOQUEADO** com o erro exato.

## 0. Resultado por critério

| # | critério | status | prova / motivo |
|---|---|---|---|
| 1 | Inventário | OK | seção 1 (rotas, edge functions, tabelas, workflows, integrações) |
| 2 | Cobertura | OK | todo item da seção 1 está OK ou BLOQUEADO |
| 3 | Qualidade | OK (ver nota lint:strict) | seção 2 |
| 4 | GitHub Actions | OK até `821385c` (todos os workflows de push verdes; CI Pipeline 43292483803 success); `68bac76`: nenhum vermelho — Quality Gate & Tests, Unit tests, E2E Critical Gate e E2E Financeiro success; CI Pipeline 43317296949 (Integration tests, E2E Destructive Logout) e Deno 43317297004 na fila do Actions às ~22:45 UTC (fila congestionada pelo job `e2e-quarantine` com `always()` — correção na PR #326, aguardando o dono) | seção 3 |
| 5 | Sem "pela metade" | BLOQUEADO (parcial) | seção 6 — 3 itens corrigidos em produção (#322, #323, #325); restantes dependem de DDL/credencial/decisão de produto |
| 6 | Banco | OK com 1 drift BLOQUEADO | seção 4 |
| 7 | Produção | BLOQUEADO (parcial) | seção 5 — 3 crons falhando, todos dependem de segredo/DDL (dono); teste de RLS como usuário final BLOQUEADO (sem caminho de execução com papel final); `monitorar-erros-frontend` corrigido pela #321 (aplicada ~19:42 UTC, 200 desde 20:00) |
| 8 | Entrega | OK | seção 7 |
| 9 | Relatório | OK | este arquivo |

## 1. Inventário (linha de base de "sem perda de funcionalidade")

Fonte: varredura do código no `bd5e644` (`src/App.tsx`, `supabase/functions/*`, `supabase/migrations/*`,
`.github/workflows/*`) cruzada com o estado real de produção (Supabase `bwwbeyolnnzppeuhgkcd`,
Vercel `promo-finance-v2`).

### 1.1 Rotas/telas — 128 na linha de base (`bd5e644`) + 2 registradas pela #323 (130 no `main` `821385c`)

Status OK = rota registrada, guard correto e página compila. Prova comum: `tsc --noEmit` exit 0, `vite build` exit 0 (bundle contém o chunk lazy de cada página), deploy de produção `dpl_CE8yX9sNzaU2sDgPwMnrkVCTuHvb` READY no commit `bd5e644` e `GET https://promo-finance-v2.vercel.app/` → 200 (SPA; todas as rotas servem o mesmo `index.html` via rewrite). A renderização por rota não é provada por esse 200 — é coberta pelos E2E da CI (`E2E Critical Gate`, `E2E Financeiro`, verdes em 12/11) só nas rotas que eles visitam.

| # | rota | página | guard | registro | status |
|---|---|---|---|---|---|
| 1 | `/auth` | Auth | público | src/App.tsx:178 | OK |
| 2 | `/auth/corporate` | CorporateOnboarding | público | src/App.tsx:179 | OK |
| 3 | `/reset-password` | ResetPassword | público | src/App.tsx:180 | OK |
| 4 | `/contador/:token` | ContadorReadonly | público | src/App.tsx:181 | OK |
| 5 | `/status` | StatusPage | público | src/App.tsx:182 | OK |
| 6 | `/design-system-debug` | DesignSystemDebug | público | src/App.tsx:183 | OK |
| 7 | `/__especimes` | Especimes | público (só DEV) | src/App.tsx:184 | OK |
| 8 | `/theme-diagnostics` | ThemeDiagnostics | público | src/App.tsx:185 | OK |
| 9 | `/` | Index | Protected | src/App.tsx:186 | OK |
| 10 | `/dashboard` | Index | Protected | src/App.tsx:194 | OK |
| 11 | `/dashboard-receber` | DashboardReceber | Protected | src/App.tsx:202 | OK |
| 12 | `/dashboard-empresa` | DashboardEmpresa | Protected | src/App.tsx:210 | OK |
| 13 | `/bi` | BI | Protected | src/App.tsx:218 | OK |
| 14 | `/contas-pagar` | ContasPagar | Protected | src/App.tsx:226 | OK |
| 15 | `/contas-pagar/bloqueios` | BloqueiosDuplicidade | Protected | src/App.tsx:234 | OK |
| 16 | `/contas-receber` | ContasReceber | Protected | src/App.tsx:242 | OK |
| 17 | `/notas-fiscais` | NotasFiscais | Protected | src/App.tsx:250 | OK |
| 18 | `/fluxo-caixa` | FluxoCaixa | Protected | src/App.tsx:258 | OK |
| 19 | `/relatorios` | Relatorios | Protected +MainLayout | src/App.tsx:266 | OK |
| 20 | `/expert` | Expert | Protected | src/App.tsx:276 | OK |
| 21 | `/conciliacao` | Conciliacao | Protected | src/App.tsx:284 | OK |
| 22 | `/cobrancas` | Cobrancas | Protected | src/App.tsx:292 | OK |
| 23 | `/boletos` | Boletos | Protected | src/App.tsx:300 | OK |
| 24 | `/clientes` | Clientes | Protected | src/App.tsx:308 | OK |
| 25 | `/fornecedores` | Fornecedores | Protected | src/App.tsx:316 | OK |
| 26 | `/empresas` | Empresas | Protected +MainLayout | src/App.tsx:324 | OK |
| 27 | `/contas-bancarias` | ContasBancarias | Protected | src/App.tsx:334 | OK |
| 28 | `/centro-custos` | CentroCustos | Protected | src/App.tsx:342 | OK |
| 29 | `/aprovacoes` | Aprovacoes | Protected | src/App.tsx:350 | OK |
| 30 | `/alertas` | Alertas | Protected +MainLayout | src/App.tsx:358 | OK |
| 31 | `/configuracoes` | Configuracoes | Protected +MainLayout | src/App.tsx:368 | OK |
| 32 | `/organizacoes` | OrganizacoesPage | Protected | src/App.tsx:378 | OK |
| 33 | `/convite/:token` | AceitarConvitePage | público | src/App.tsx:386 | OK |
| 34 | `/usuarios` | Usuarios | Protected | src/App.tsx:387 | OK |
| 35 | `/audit-logs` | AuditLogs | Protected | src/App.tsx:395 | OK |
| 36 | `/seguranca` | Seguranca | Protected +MainLayout | src/App.tsx:403 | OK |
| 37 | `/integracoes` | Integracoes | Protected | src/App.tsx:413 | OK |
| 38 | `/demonstrativos` | Demonstrativos | Protected | src/App.tsx:421 | OK |
| 39 | `/contabilidade` | Contabilidade | Protected roles=admin, financeiro | src/App.tsx:429 | OK |
| 40 | `/financeiro` | Financeiro | Protected | src/App.tsx:437 | OK |
| 41 | `/pagamentos-recorrentes` | PagamentosRecorrentes | Protected +MainLayout | src/App.tsx:445 | OK |
| 42 | `/bitrix24` | Bitrix24 | Protected +MainLayout | src/App.tsx:455 | OK |
| 43 | `/reforma-tributaria` | ReformaTributaria | Protected | src/App.tsx:465 | OK |
| 44 | `/reforma-tributaria/:tab` | ReformaTributaria | Protected | src/App.tsx:473 | OK |
| 45 | `/tributario/simulacao-regimes` | SimulacaoRegimes | Protected | src/App.tsx:481 | OK |
| 46 | `/tributario/historico-financeiro` | HistoricoFinanceiroTributario | Protected | src/App.tsx:489 | OK |
| 47 | `/tributario/oportunidades-elisao` | OportunidadesElisao | Protected | src/App.tsx:497 | OK |
| 48 | `/tributario/projecao-reforma` | ProjecaoReformaPage | Protected | src/App.tsx:505 | OK |
| 49 | `/tributario` | DashboardTributario | Protected | src/App.tsx:513 | OK |
| 50 | `/tributario/catalogos-fiscais` | CatalogosFiscaisPage | Protected | src/App.tsx:521 | OK |
| 51 | `/tributario/arquitetura` | ArquiteturaModularPage | Protected | src/App.tsx:529 | OK |
| 52 | `/tributario/auditoria-overlay` | AuditoriaOverlayPage | Protected | src/App.tsx:537 | OK |
| 53 | `/tributario/dashboard` | DashboardTributario | Protected | src/App.tsx:545 | OK |
| 54 | `/tributario/recomendacao` | RecomendacaoExecutiva | Protected | src/App.tsx:553 | OK |
| 55 | `/tributario/pf-vinculada` | PfVinculada | Protected | src/App.tsx:561 | OK |
| 56 | `/tributario/onboarding` | OnboardingTributario | Protected | src/App.tsx:569 | OK |
| 57 | `/tributario/certificados-digitais` | CertificadosDigitais | Protected | src/App.tsx:577 | OK |
| 58 | `/tributario/nfe-recebidas` | NfeRecebidasPage | Protected | src/App.tsx:585 | OK |
| 59 | `/tributario/sefaz-observabilidade` | SefazObservabilidadePage | Protected | src/App.tsx:593 | OK |
| 60 | `/tributario/calculadora` | CalculadoraTributaria | Protected | src/App.tsx:601 | OK |
| 61 | `/asaas` | Asaas | Protected | src/App.tsx:610 | OK |
| 62 | `/bling` | BlingPage | Protected | src/App.tsx:618 | OK |
| 63 | `/vendedores` | Vendedores | Protected | src/App.tsx:626 | OK |
| 64 | `/meu-perfil` | MeuPerfil | Protected | src/App.tsx:634 | OK |
| 65 | `/contratos` | Contratos | Protected | src/App.tsx:642 | OK |
| 66 | `/simulador-antecipacao` | SimuladorAntecipacaoPage | Protected | src/App.tsx:650 | OK |
| 67 | `/assinatura-digital` | AssinaturaDigitalPage | Protected | src/App.tsx:658 | OK |
| 68 | `/comprovante-ocr` | ComprovanteOCRPage | Protected | src/App.tsx:666 | OK |
| 69 | `/movimentacoes` | Movimentacoes | Protected | src/App.tsx:674 | OK |
| 70 | `/tesouraria` | Tesouraria | Protected | src/App.tsx:682 | OK |
| 71 | `/pix-hub` | PixHub | Protected | src/App.tsx:690 | OK |
| 72 | `/orcamento-evento` | OrcamentoEvento | Protected | src/App.tsx:698 | OK |
| 73 | `/benchmarking` | BenchmarkingSetorial | Protected | src/App.tsx:706 | OK |
| 74 | `/admin/telemetria` | AdminTelemetria | Protected roles=admin | src/App.tsx:714 | OK |
| 75 | `/admin/edge-health` | AdminEdgeHealth | Protected roles=admin +MainLayout | src/App.tsx:722 | OK |
| 76 | `/admin/system-health` | AdminSystemHealth | Protected roles=admin +MainLayout | src/App.tsx:732 | OK |
| 77 | `/admin/sre` | SRECommandCenter | Protected roles=admin | src/App.tsx:742 | OK |
| 78 | `/admin/bloat-monitor` | AdminBloatMonitor | Protected roles=admin | src/App.tsx:750 | OK |
| 79 | `/admin/sso` | SSOAdmin | Protected roles=admin | src/App.tsx:758 | OK |
| 80 | `/admin/sso-jit-events` | SSOJitEvents | Protected roles=admin | src/App.tsx:766 | OK |
| 81 | `/admin/scim-audit` | ScimAudit | Protected roles=admin | src/App.tsx:774 | OK |
| 82 | `/audit-sso-profile-sync` | AuditSsoProfileSync | Protected roles=admin | src/App.tsx:782 | OK |
| 83 | `/admin/sso-events` | SsoEvents | Protected roles=admin | src/App.tsx:790 | OK |
| 84 | `/admin/insights-ia` | InsightsIA | Protected roles=admin, financeiro | src/App.tsx:798 | OK |
| 85 | `/admin/insights-ia/anomalia/:id` | AnomaliaDetalhe | Protected roles=admin, financeiro | src/App.tsx:806 | OK |
| 86 | `/admin/compliance` | ComplianceAuditoria | Protected roles=admin | src/App.tsx:814 | OK |
| 87 | `/admin/auditoria-ia` | AuditoriaIA | Protected roles=admin, financeiro | src/App.tsx:822 | OK |
| 88 | `/configuracoes/privacidade` | CentroPrivacidadeLGPD | Protected +MainLayout | src/App.tsx:830 | OK |
| 89 | `/configuracoes/filtros-salvos` | FiltrosSalvos | Protected | src/App.tsx:840 | OK |
| 90 | `/configuracoes/preferencias` | MinhasPreferencias | Protected | src/App.tsx:848 | OK |
| 91 | `/configuracoes/notificacoes/historico` | HistoricoNotificacoes | Protected | src/App.tsx:856 | OK |
| 92 | `/configuracoes/notificacoes/sino` | SinoNotificacoesFiltros | Protected | src/App.tsx:864 | OK |
| 93 | `/admin/filtros-compartilhados` | SharedFiltersAdmin | Protected roles=admin | src/App.tsx:872 | OK |
| 94 | `/admin/api` | ApiManagement | Protected roles=admin | src/App.tsx:880 | OK |
| 95 | `/admin/campos-customizados` | CustomFieldsAdmin | Protected roles=admin | src/App.tsx:888 | OK |
| 96 | `/tributario/split-payment` | SplitPaymentPage | Protected | src/App.tsx:896 | OK |
| 97 | `/tributario/conciliacao` | ConciliacaoTributariaPage | Protected | src/App.tsx:904 | OK |
| 98 | `/tributario/incentivos` | IncentivosFiscaisPage | Protected | src/App.tsx:912 | OK |
| 99 | `/tributario/auditoria` | AuditoriaCompliancePage | Protected | src/App.tsx:920 | OK |
| 100 | `/tributario/comparativo` | ComparativoRegimesPage | Protected | src/App.tsx:928 | OK |
| 101 | `/tributario/cashback` | CashbackSimuladorPage | Protected | src/App.tsx:936 | OK |
| 102 | `/tributario/importacao-xml` | ImportacaoXMLPage | Protected | src/App.tsx:944 | OK |
| 103 | `/tributario/sped` | SpedExportPage | Protected | src/App.tsx:952 | OK |
| 104 | `/tributario/relatorios-contabeis` | RelatoriosContabeisPage | Protected | src/App.tsx:960 | OK |
| 105 | `/tributario/per-dcomp` | PerDcompPage | Protected | src/App.tsx:968 | OK |
| 106 | `/tributario/retencoes` | RetencoesFontePage | Protected | src/App.tsx:976 | OK |
| 107 | `/tributario/fechamento-mensal` | FechamentoMensalPage | Protected | src/App.tsx:984 | OK |
| 108 | `/tributario/glossario` | GlossarioTributario | Protected | src/App.tsx:992 | OK |
| 109 | `/tributario/monofasico` | MonofasicoPage | Protected | src/App.tsx:1000 | OK |
| 110 | `/tributario/folha-encargos` | FolhaEncargosPage | Protected | src/App.tsx:1008 | OK |
| 111 | `/tributario/icms-st` | IcmsStDifalPage | Protected | src/App.tsx:1016 | OK |
| 112 | `/tributario/ipi-iss` | IpiIssPage | Protected | src/App.tsx:1024 | OK |
| 113 | `/tributario/pis-cofins` | PisCofinsCreditosPage | Protected | src/App.tsx:1032 | OK |
| 114 | `/tributario/irpj-csll` | IrpjCsllLucroRealPage | Protected | src/App.tsx:1040 | OK |
| 115 | `/tributario/darf` | DarfConsolidadoPage | Protected | src/App.tsx:1048 | OK |
| 116 | `/tributario/obrigacoes` | ObrigacoesAcessoriasPage | Protected | src/App.tsx:1056 | OK |
| 117 | `/tributario/comparativo-conformidade` | ComparativoConformidadePage | Protected | src/App.tsx:1064 | OK |
| 118 | `/tributario/preferencias-digest` | PreferenciasDigestPage | Protected | src/App.tsx:1072 | OK |
| 119 | `/tributario/observabilidade-digest` | ObservabilidadeDigestPage | Protected | src/App.tsx:1080 | OK |
| 120 | `/inteligencia` | InteligenciaOperacionalPage | Protected | src/App.tsx:1089 | OK |
| 121 | `/metas` | MetasFinanceirasPage | Protected | src/App.tsx:1097 | OK |
| 122 | `/orcamentos` | Orcamentos | Protected | src/App.tsx:1105 | OK |
| 123 | `/categorias` | Categorias | Protected | src/App.tsx:1113 | OK |
| 124 | `/clientes/portal-tokens` | PortalTokensPage | Protected | src/App.tsx:1121 | OK |
| 125 | `/clientes/scoring` | ScoringClientesPage | Protected | src/App.tsx:1129 | OK |
| 126 | `/compras` | Compras | Protected | src/App.tsx:1138 | OK |
| 127 | `/style-guide` | StyleGuide | Protected | src/App.tsx:1146 | OK |
| 128 | `*` | NotFound | público | src/App.tsx:1154 | OK |
| 129 | `/admin/erros-frontend` | AdminErrosFrontend | admin | src/App.tsx:906 (`821385c`, PR #323) | OK |
| 130 | `/tributario/consulta-rapida` | ConsultaRapidaFiscal | autenticado | src/App.tsx:531 (`821385c`, PR #323) | OK |

### 1.2 Edge Functions — 106 pastas em `supabase/functions`

Prova: `supabase_functions_ping` em produção (`bwwbeyolnnzppeuhgkcd`) em 12/11/2026 — status HTTP da função publicada (404 = não publicada). Coluna status = função publicada e respondendo; o estado funcional de `open-finance` (simulada) e `send-push-notification` (sem VAPID) está na seção 6. `edge_function_logs`: 0 linhas com `status_code>=500` ou `level in ('error','fatal')` — atenção: a tabela só tem dados desde 12/11 05:45 UTC e cobre 11 funções instrumentadas; as outras 95 não registram nela.

| # | função | verify_jwt | chamada do front | ping prod | status |
|---|---|---|---|---|---|
| 1 | `aceitar-convite` | true | sim | 200 (149 ms) | OK |
| 2 | `analise-fluxo-ia` | false | sim | 200 (143 ms) | OK |
| 3 | `analise-preditiva` | true | sim | 200 (263 ms) | OK |
| 4 | `analyze-document` | false | sim | 200 (194 ms) | OK |
| 5 | `api-keys-manage` | false | sim | 204 (157 ms) | OK |
| 6 | `asaas-proxy` | false | sim | 200 (203 ms) | OK |
| 7 | `asaas-webhook` | false | não | 200 (205 ms) | OK |
| 8 | `benchmarking-setorial` | false | sim | 200 (184 ms) | OK |
| 9 | `bitrix24-sync` | true | sim | 200 (158 ms) | OK |
| 10 | `bitrix24-webhook` | false | sim | 200 (206 ms) | OK |
| 11 | `bling-proxy` | false | sim | 200 (160 ms) | OK |
| 12 | `bling-webhook` | false | não | 200 (146 ms) | OK |
| 13 | `calcular-health-score-operacional` | true | sim | 200 (171 ms) | OK |
| 14 | `calcular-slo-metrics-diario` | true | não | 200 (168 ms) | OK |
| 15 | `calculo-iva` | true | não | 200 (130 ms) | OK |
| 16 | `categorizar-despesa` | false | sim | 200 (197 ms) | OK |
| 17 | `ci-security-gate-log` | false | não | 200 (133 ms) | OK |
| 18 | `cnpja-lookup` | false | sim | 200 (179 ms) | OK |
| 19 | `comparar-benchmark-setorial` | true | sim | 204 (171 ms) | OK |
| 20 | `compare-schemas` | false | não | 200 (175 ms) | OK |
| 21 | `conciliacao-ia` | true | sim | 200 (94 ms) | OK |
| 22 | `conciliacao-proxy` | true | sim | 200 (300 ms) | OK |
| 23 | `consulta-tributaria` | true | sim | 200 (118 ms) | OK |
| 24 | `contabilizar-evento` | true | sim | 200 (232 ms) | OK |
| 25 | `convidar-contador` | true | sim | 200 (269 ms) | OK |
| 26 | `convidar-usuario` | false | sim | 204 (188 ms) | OK |
| 27 | `copilot-global` | true | sim | 200 (128 ms) | OK |
| 28 | `copilot-tributario` | true | sim | 200 (160 ms) | OK |
| 29 | `decidir-regime` | false | sim | 200 (147 ms) | OK |
| 30 | `detectar-anomalias-financeiras` | true | sim | 200 (174 ms) | OK |
| 31 | `digest-silenciamentos-erro` | false | não | 200 (442 ms) | OK |
| 32 | `enviar-alerta-email` | false | não | 200 (370 ms) | OK |
| 33 | `enviar-bitrix24-tributario` | false | sim | 200 (147 ms) | OK |
| 34 | `enviar-convite-organizacao` | true | sim | 200 (168 ms) | OK |
| 35 | `enviar-digest-conformidade` | true | não | 200 (221 ms) | OK |
| 36 | `enviar-relatorios-tributarios-agendados` | true | não | 200 (460 ms) | OK |
| 37 | `executar-analise-preditiva` | false | não | 200 (105 ms) | OK |
| 38 | `executar-fechamento-tributario` | true | sim | 200 (226 ms) | OK |
| 39 | `executar-regua-cobranca` | false | não | 200 (174 ms) | OK |
| 40 | `executar-relatorios` | false | sim | 200 (175 ms) | OK |
| 41 | `expert-agent` | false | sim | 200 (205 ms) | OK |
| 42 | `exportar-sped-contribuicoes` | true | sim | 200 (145 ms) | OK |
| 43 | `external-data` | false | sim | 200 (292 ms) | OK |
| 44 | `gerar-acoes-recomendadas` | true | sim | 200 (153 ms) | OK |
| 45 | `gerar-alertas` | false | não | 200 (184 ms) | OK |
| 46 | `gerar-alertas-dispatcher` | false | não | 200 (124 ms) | OK |
| 47 | `gerar-alertas-tributarios` | false | não | 200 (141 ms) | OK |
| 48 | `gerar-dre-tributaria` | false | sim | 204 (232 ms) | OK |
| 49 | `gerar-heatmap-tributario` | false | sim | 204 (132 ms) | OK |
| 50 | `gerar-pacote-evidencias` | true | sim | 200 (173 ms) | OK |
| 51 | `gerar-pdf-tributario` | false | sim | 200 (264 ms) | OK |
| 52 | `gerar-relatorio-anual` | true | sim | 200 (194 ms) | OK |
| 53 | `gerar-resumo-executivo-semanal` | true | sim | 200 (320 ms) | OK |
| 54 | `gerar-resumo-financeiro-diario` | true | sim | 200 (133 ms) | OK |
| 55 | `gerar-snapshots-conformidade` | true | não | 200 (290 ms) | OK |
| 56 | `gerar-sped-ecd` | true | sim | 200 (183 ms) | OK |
| 57 | `gerar-sped-ecf` | true | sim | 200 (157 ms) | OK |
| 58 | `get-mapbox-token` | true | não | 200 (150 ms) | OK |
| 59 | `get-vapid-key` | false | sim | 200 (137 ms) | OK |
| 60 | `health` | false | sim | 200 (173 ms) | OK |
| 61 | `insights-relatorio` | false | sim | 200 (198 ms) | OK |
| 62 | `log-sped-bitrix24` | true | sim | 200 (177 ms) | OK |
| 63 | `mcp-query` | false | não | 200 (137 ms) | OK |
| 64 | `monitor-health` | false | não | 404 | BLOQUEADO — não responde em produção (HTTP 404); publicar via `functions-deploy.yml` (dono) |
| 65 | `monitorar-erros-frontend` | false | não | 200 (344 ms) | OK |
| 66 | `n8n-callback` | false | não | 200 (201 ms) | OK |
| 67 | `n8n-dispatch` | true | não | 200 (175 ms) | OK |
| 68 | `nfe-upload-certificado` | true | sim | 200 (282 ms) | OK |
| 69 | `nfe-vinculo-proxy` | true | sim | 200 (278 ms) | OK |
| 70 | `notify-performance-alert` | false | não | 200 (148 ms) | OK |
| 71 | `notify-saved-filter` | true | sim | 200 (318 ms) | OK |
| 72 | `open-finance` | true | sim | 200 (244 ms) | OK |
| 73 | `overlay-rejeicoes-auditoria` | true | sim | 200 (147 ms) | OK |
| 74 | `prever-carga-tributaria` | false | sim | 204 (155 ms) | OK |
| 75 | `processar-fila-cobrancas` | true | sim | 200 (195 ms) | OK |
| 76 | `processar-nf-ocr` | true | sim | 200 (203 ms) | OK |
| 77 | `processar-solicitacao-lgpd` | true | sim | 200 (235 ms) | OK |
| 78 | `projecao-reforma` | true | não | 200 (132 ms) | OK |
| 79 | `relatorio-diario-anomalias` | true | não | 200 (354 ms) | OK |
| 80 | `scim-server` | false | sim | 200 (241 ms) | OK |
| 81 | `sefaz-dfe-dispatcher` | false | não | 200 (271 ms) | OK |
| 82 | `sefaz-dfe-puxar` | false | não | 200 (4908 ms) | OK |
| 83 | `sefaz-manifestar` | true | sim | 200 (434 ms) | OK |
| 84 | `send-device-alert` | false | sim | 200 (363 ms) | OK |
| 85 | `send-push-notification` | false | sim | 200 (181 ms) | OK |
| 86 | `simular-presumido` | true | não | 200 (237 ms) | OK |
| 87 | `simular-real` | true | não | 200 (205 ms) | OK |
| 88 | `simular-simples` | true | não | 200 (213 ms) | OK |
| 89 | `sincronizar-anomalia-bitrix24` | true | sim | 200 (148 ms) | OK |
| 90 | `sso-callback` | false | sim | 200 (255 ms) | OK |
| 91 | `sso-generate-metadata` | true | sim | 200 (194 ms) | OK |
| 92 | `sso-initiate` | false | sim | 200 (245 ms) | OK |
| 93 | `sso-logout` | false | sim | 200 (358 ms) | OK |
| 94 | `sso-test-login` | true | sim | 200 (183 ms) | OK |
| 95 | `sso-validate-config` | true | sim | 200 (163 ms) | OK |
| 96 | `sync-profile-to-bitrix` | true | não | 200 (251 ms) | OK |
| 97 | `upload-anexo` | true | sim | 200 (280 ms) | OK |
| 98 | `validar-token-contador` | false | sim | 200 (158 ms) | OK |
| 99 | `validate-ip-geo` | false | sim | 200 (223 ms) | OK |
| 100 | `verificar-conformidade-fiscal` | true | sim | 200 (124 ms) | OK |
| 101 | `webhook-replay` | false | não | 200 (132 ms) | OK |
| 102 | `webhook-retry-worker` | false | não | 200 (77 ms) | OK |
| 103 | `webhook-simulator` | true | sim | 200 (189 ms) | OK |
| 104 | `whatsapp-ai-analyzer` | true | não | 200 (237 ms) | OK |
| 105 | `whatsapp-ia-proativo` | false | sim | 200 (192 ms) | OK |
| 106 | `whatsapp-webhook` | false | não | 200 (172 ms) | OK |

### 1.3 Tabelas — 272 no schema `public` de produção

Prova: `pg_tables`/`pg_policies` em produção (12/11/2026): 272 tabelas, 0 sem RLS, 0 com RLS sem policy; views 100% `security_invoker`. Gate `supabase db lint` (run 43220341709, step "Run Supabase linter (fail on ERROR)"): `✅ Nenhum ERROR bloqueante de segurança no banco.`

| # | tabela | RLS | policies | refs `.from()` no front | status |
|---|---|---|---|---|---|
| 1 | `acessos_suspeitos` | ativa | 1 | 0 | OK |
| 2 | `acoes_recomendadas` | ativa | 1 | 1 | OK |
| 3 | `acordos_parcelamento` | ativa | 2 | 6 | OK |
| 4 | `alert_configurations` | ativa | 5 | 0 | OK |
| 5 | `alertas` | ativa | 3 | 10 | OK |
| 6 | `alertas_preditivos` | ativa | 1 | 1 | OK |
| 7 | `alertas_tributarios` | ativa | 1 | 4 | OK |
| 8 | `alerts` | ativa | 5 | 0 | OK |
| 9 | `alerts_sent` | ativa | 4 | 0 | OK |
| 10 | `aliquotas_interestaduais` | ativa | 2 | 1 | OK |
| 11 | `aliquotas_internas_uf` | ativa | 2 | 0 | OK |
| 12 | `aliquotas_iss_municipal` | ativa | 2 | 1 | OK |
| 13 | `allowed_countries` | ativa | 2 | 3 | OK |
| 14 | `allowed_ips` | ativa | 1 | 3 | OK |
| 15 | `anexos_financeiros` | ativa | 4 | 3 | OK |
| 16 | `anomalia_detection_runs` | ativa | 1 | 2 | OK |
| 17 | `anomalia_toast_eventos` | ativa | 2 | 2 | OK |
| 18 | `anomalias_detectadas` | ativa | 3 | 18 | OK |
| 19 | `api_keys` | ativa | 2 | 2 | OK |
| 20 | `aprovacao_comentarios` | ativa | 2 | 2 | OK |
| 21 | `apuracoes_irpj_csll` | ativa | 1 | 4 | OK |
| 22 | `apuracoes_tributarias` | ativa | 3 | 10 | OK |
| 23 | `asaas_audit_trail` | ativa | 2 | 0 | OK |
| 24 | `asaas_config` | ativa | 2 | 3 | OK |
| 25 | `asaas_credit_risk_analysis` | ativa | 1 | 0 | OK |
| 26 | `asaas_customers` | ativa | 3 | 1 | OK |
| 27 | `asaas_payment_links` | ativa | 3 | 0 | OK |
| 28 | `asaas_payments` | ativa | 3 | 2 | OK |
| 29 | `asaas_reconciliation_suggestions` | ativa | 3 | 1 | OK |
| 30 | `asaas_sync_queue` | ativa | 2 | 0 | OK |
| 31 | `asaas_transfers` | ativa | 3 | 1 | OK |
| 32 | `audit_logs` | ativa | 3 | 13 | OK |
| 33 | `audit_logs_2026_01` | ativa | 1 | 0 (sem `.from()` literal no front) | BLOQUEADO — tabela solta: a mãe não é particionada (`relkind=r`, 0 em `pg_inherits`); cron `maintain-monthly-partitions` falha (seção 5) |
| 34 | `audit_logs_2026_02` | ativa | 1 | 0 (sem `.from()` literal no front) | BLOQUEADO — tabela solta: a mãe não é particionada (`relkind=r`, 0 em `pg_inherits`); cron `maintain-monthly-partitions` falha (seção 5) |
| 35 | `audit_logs_2026_03` | ativa | 1 | 0 (sem `.from()` literal no front) | BLOQUEADO — tabela solta: a mãe não é particionada (`relkind=r`, 0 em `pg_inherits`); cron `maintain-monthly-partitions` falha (seção 5) |
| 36 | `audit_logs_2026_04` | ativa | 1 | 0 (sem `.from()` literal no front) | BLOQUEADO — tabela solta: a mãe não é particionada (`relkind=r`, 0 em `pg_inherits`); cron `maintain-monthly-partitions` falha (seção 5) |
| 37 | `audit_logs_2026_05` | ativa | 1 | 0 (sem `.from()` literal no front) | BLOQUEADO — tabela solta: a mãe não é particionada (`relkind=r`, 0 em `pg_inherits`); cron `maintain-monthly-partitions` falha (seção 5) |
| 38 | `audit_logs_2026_06` | ativa | 1 | 0 (sem `.from()` literal no front) | BLOQUEADO — tabela solta: a mãe não é particionada (`relkind=r`, 0 em `pg_inherits`); cron `maintain-monthly-partitions` falha (seção 5) |
| 39 | `audit_logs_2026_07` | ativa | 1 | 0 (sem `.from()` literal no front) | BLOQUEADO — tabela solta: a mãe não é particionada (`relkind=r`, 0 em `pg_inherits`); cron `maintain-monthly-partitions` falha (seção 5) |
| 40 | `audit_logs_2026_08` | ativa | 1 | 0 (sem `.from()` literal no front) | BLOQUEADO — tabela solta: a mãe não é particionada (`relkind=r`, 0 em `pg_inherits`); cron `maintain-monthly-partitions` falha (seção 5) |
| 41 | `audit_logs_2026_09` | ativa | 1 | 0 (sem `.from()` literal no front) | BLOQUEADO — tabela solta: a mãe não é particionada (`relkind=r`, 0 em `pg_inherits`); cron `maintain-monthly-partitions` falha (seção 5) |
| 42 | `audit_logs_2026_10` | ativa | 1 | 0 (sem `.from()` literal no front) | BLOQUEADO — tabela solta: a mãe não é particionada (`relkind=r`, 0 em `pg_inherits`); cron `maintain-monthly-partitions` falha (seção 5) |
| 43 | `audit_logs_default` | ativa | 1 | 0 (sem `.from()` literal no front) | BLOQUEADO — tabela solta: a mãe não é particionada (`relkind=r`, 0 em `pg_inherits`); cron `maintain-monthly-partitions` falha (seção 5) |
| 44 | `auditoria_financeira` | ativa | 2 | 3 | OK |
| 45 | `auditoria_tributaria` | ativa | 1 | 0 | OK |
| 46 | `auth_logs` | ativa | 3 | 0 | OK |
| 47 | `benchmarks_setoriais` | ativa | 2 | 0 | OK |
| 48 | `beneficios_fiscais` | ativa | 2 | 0 | OK |
| 49 | `bitrix24_activities` | ativa | 4 | 0 | OK |
| 50 | `bitrix24_stage_mappings` | ativa | 4 | 0 | OK |
| 51 | `bitrix24_tokens` | ativa | 4 | 0 | OK |
| 52 | `bitrix_field_mappings` | ativa | 1 | 2 | OK |
| 53 | `bitrix_oauth_tokens` | ativa | 1 | 0 | OK |
| 54 | `bitrix_sync_logs` | ativa | 1 | 1 | OK |
| 55 | `bitrix_webhook_events` | ativa | 1 | 1 | OK |
| 56 | `bling_sync_logs` | ativa | 2 | 1 | OK |
| 57 | `bling_tokens` | ativa | 1 | 0 | OK |
| 58 | `bling_webhook_events` | ativa | 1 | 1 | OK |
| 59 | `bloat_snapshots` | ativa | 1 | 0 | OK |
| 60 | `blocked_ips` | ativa | 2 | 4 | OK |
| 61 | `bloqueios_duplicidade` | ativa | 1 | 2 | OK |
| 62 | `boletos` | ativa | 2 | 9 | OK |
| 63 | `budgets` | ativa | 1 | 5 | OK |
| 64 | `catalogos_fiscais_cargas` | ativa | 1 | 0 | OK |
| 65 | `catalogos_tributarios_health_history` | ativa | 1 | 0 | OK |
| 66 | `categorias` | ativa | 1 | 5 | OK |
| 67 | `centros_custo` | ativa | 3 | 13 | OK |
| 68 | `ci_security_gate_events` | ativa | 2 | 0 | OK |
| 69 | `clientes` | ativa | 10 | 11 | OK |
| 70 | `cnaes` | ativa | 2 | 1 | OK |
| 71 | `cnpja_cache` | ativa | 1 | 2 | OK |
| 72 | `conciliacoes` | ativa | 1 | 1 | OK |
| 73 | `conciliacoes_parciais` | ativa | 1 | 2 | OK |
| 74 | `configuracoes_aprovacao` | ativa | 3 | 2 | OK |
| 75 | `configuracoes_duplicidade` | ativa | 3 | 3 | OK |
| 76 | `conformidade_snapshots` | ativa | 4 | 3 | OK |
| 77 | `contas_bancarias` | ativa | 1 | 25 | OK |
| 78 | `contas_pagar` | ativa | 3 | 29 | OK |
| 79 | `contas_receber` | ativa | 3 | 62 | OK |
| 80 | `contratos` | ativa | 1 | 4 | OK |
| 81 | `convites` | ativa | 1 | 3 | OK |
| 82 | `convites_contador` | ativa | 2 | 0 | OK |
| 83 | `creditos_tributarios` | ativa | 1 | 10 | OK |
| 84 | `cron_job_logs` | ativa | 1 | 0 | OK |
| 85 | `custom_field_definitions` | ativa | 1 | 4 | OK |
| 86 | `custom_field_values` | ativa | 1 | 0 | OK |
| 87 | `darfs` | ativa | 3 | 2 | OK |
| 88 | `digest_envios_log` | ativa | 2 | 1 | OK |
| 89 | `dispositivos_conhecidos` | ativa | 1 | 6 | OK |
| 90 | `divergencias_conciliacao` | ativa | 1 | 6 | OK |
| 91 | `edge_function_logs` | ativa | 1 | 1 | OK |
| 92 | `elisao_alertas` | ativa | 1 | 1 | OK |
| 93 | `elisao_creditos_auditoria` | ativa | 3 | 4 | OK |
| 94 | `elisao_regras_creditos` | ativa | 3 | 0 | OK |
| 95 | `elisao_simulacoes_regime` | ativa | 1 | 1 | OK |
| 96 | `elisao_tarefas_acionaveis` | ativa | 1 | 3 | OK |
| 97 | `email_verifications` | ativa | 4 | 0 | OK |
| 98 | `empresas` | ativa | 2 | 20 | OK |
| 99 | `empresas_certificados` | ativa | 3 | 2 | OK |
| 100 | `entregas_obrigacoes` | ativa | 5 | 2 | OK |
| 101 | `estrategias_elisao` | ativa | 2 | 0 | OK |
| 102 | `estrategias_elisao_catalogo` | ativa | 1 | 1 | OK |
| 103 | `eventos_contabilizacao_log` | ativa | 1 | 0 | OK |
| 104 | `evidencias_pacotes` | ativa | 1 | 2 | OK |
| 105 | `execucoes_cobranca` | ativa | 2 | 2 | OK |
| 106 | `execucoes_regua_cobranca` | ativa | 1 | 0 | OK |
| 107 | `expert_conversations` | ativa | 2 | 4 | OK |
| 108 | `expert_messages` | ativa | 3 | 3 | OK |
| 109 | `extrato_bancario` | ativa | 2 | 3 | OK |
| 110 | `faixas_simples_nacional` | ativa | 2 | 1 | OK |
| 111 | `faturamento_mensal` | ativa | 1 | 5 | OK |
| 112 | `fechamentos_tributarios` | ativa | 5 | 1 | OK |
| 113 | `feedback_conciliacao_ia` | ativa | 2 | 7 | OK |
| 114 | `fila_cobrancas` | ativa | 3 | 1 | OK |
| 115 | `fluxos_aprovacao_niveis` | ativa | 1 | 2 | OK |
| 116 | `folha_pagamento` | ativa | 1 | 6 | OK |
| 117 | `formas_pagamento` | ativa | 1 | 1 | OK |
| 118 | `fornecedores` | ativa | 4 | 6 | OK |
| 119 | `frontend_error_alert_state` | ativa | 1 | 1 | OK |
| 120 | `frontend_error_logs` | ativa | 3 | 1 | OK |
| 121 | `frontend_error_logs_2026_01` | ativa | 1 | 0 (sem `.from()` literal no front) | BLOQUEADO — tabela solta: a mãe não é particionada (`relkind=r`, 0 em `pg_inherits`); cron `maintain-monthly-partitions` falha (seção 5) |
| 122 | `frontend_error_logs_2026_02` | ativa | 1 | 0 (sem `.from()` literal no front) | BLOQUEADO — tabela solta: a mãe não é particionada (`relkind=r`, 0 em `pg_inherits`); cron `maintain-monthly-partitions` falha (seção 5) |
| 123 | `frontend_error_logs_2026_03` | ativa | 1 | 0 (sem `.from()` literal no front) | BLOQUEADO — tabela solta: a mãe não é particionada (`relkind=r`, 0 em `pg_inherits`); cron `maintain-monthly-partitions` falha (seção 5) |
| 124 | `frontend_error_logs_2026_04` | ativa | 1 | 0 (sem `.from()` literal no front) | BLOQUEADO — tabela solta: a mãe não é particionada (`relkind=r`, 0 em `pg_inherits`); cron `maintain-monthly-partitions` falha (seção 5) |
| 125 | `frontend_error_logs_2026_05` | ativa | 1 | 0 (sem `.from()` literal no front) | BLOQUEADO — tabela solta: a mãe não é particionada (`relkind=r`, 0 em `pg_inherits`); cron `maintain-monthly-partitions` falha (seção 5) |
| 126 | `frontend_error_logs_2026_06` | ativa | 1 | 0 (sem `.from()` literal no front) | BLOQUEADO — tabela solta: a mãe não é particionada (`relkind=r`, 0 em `pg_inherits`); cron `maintain-monthly-partitions` falha (seção 5) |
| 127 | `frontend_error_logs_2026_07` | ativa | 1 | 0 (sem `.from()` literal no front) | BLOQUEADO — tabela solta: a mãe não é particionada (`relkind=r`, 0 em `pg_inherits`); cron `maintain-monthly-partitions` falha (seção 5) |
| 128 | `frontend_error_logs_2026_08` | ativa | 1 | 0 (sem `.from()` literal no front) | BLOQUEADO — tabela solta: a mãe não é particionada (`relkind=r`, 0 em `pg_inherits`); cron `maintain-monthly-partitions` falha (seção 5) |
| 129 | `frontend_error_logs_2026_09` | ativa | 1 | 0 (sem `.from()` literal no front) | BLOQUEADO — tabela solta: a mãe não é particionada (`relkind=r`, 0 em `pg_inherits`); cron `maintain-monthly-partitions` falha (seção 5) |
| 130 | `frontend_error_logs_2026_10` | ativa | 1 | 0 (sem `.from()` literal no front) | BLOQUEADO — tabela solta: a mãe não é particionada (`relkind=r`, 0 em `pg_inherits`); cron `maintain-monthly-partitions` falha (seção 5) |
| 131 | `frontend_error_logs_default` | ativa | 1 | 0 (sem `.from()` literal no front) | BLOQUEADO — tabela solta: a mãe não é particionada (`relkind=r`, 0 em `pg_inherits`); cron `maintain-monthly-partitions` falha (seção 5) |
| 132 | `frontend_error_silence_digest_log` | ativa | 1 | 0 | OK |
| 133 | `frontend_performance_logs` | ativa | 2 | 2 | OK |
| 134 | `geo_blocks` | ativa | 5 | 0 | OK |
| 135 | `glossario_tributario` | ativa | 2 | 1 | OK |
| 136 | `health_scores_operacionais` | ativa | 1 | 1 | OK |
| 137 | `historico_analises_preditivas` | ativa | 2 | 1 | OK |
| 138 | `historico_cobranca` | ativa | 1 | 2 | OK |
| 139 | `historico_cobranca_whatsapp` | ativa | 1 | 3 | OK |
| 140 | `historico_cobrancas_boletos` | ativa | 2 | 3 | OK |
| 141 | `historico_conciliacao_ia` | ativa | 2 | 4 | OK |
| 142 | `historico_relatorios` | ativa | 1 | 1 | OK |
| 143 | `historico_score_saude` | ativa | 1 | 1 | OK |
| 144 | `incentivos_fiscais` | ativa | 2 | 6 | OK |
| 145 | `index_usage_snapshots` | ativa | 1 | 0 | OK |
| 146 | `indices_uso_excecoes` | ativa | 1 | 0 | OK |
| 147 | `integration_secrets` | ativa | 1 | 0 | OK |
| 148 | `integrity_alerts` | ativa | 2 | 1 | OK |
| 149 | `ip_whitelist` | ativa | 5 | 0 | OK |
| 150 | `itens_lista_iss` | ativa | 2 | 1 | OK |
| 151 | `itens_pedido_compra` | ativa | 1 | 1 | OK |
| 152 | `kpis_operacionais` | ativa | 1 | 1 | OK |
| 153 | `lancamentos_contabeis` | ativa | 2 | 5 | OK |
| 154 | `login_attempts` | ativa | 4 | 2 | OK |
| 155 | `logs_baixa_automatica` | ativa | 3 | 1 | OK |
| 156 | `logs_conciliacao_retroativa` | ativa | 3 | 4 | OK |
| 157 | `metas_financeiras` | ativa | 1 | 4 | OK |
| 158 | `mfa_sessions` | ativa | 4 | 0 | OK |
| 159 | `movimentacoes` | ativa | 1 | 4 | OK |
| 160 | `n8n_dispatch_logs` | ativa | 1 | 0 | OK |
| 161 | `n8n_workflow_configs` | ativa | 1 | 0 | OK |
| 162 | `ncms` | ativa | 2 | 1 | OK |
| 163 | `negativacoes` | ativa | 3 | 3 | OK |
| 164 | `new_device_alerts` | ativa | 4 | 1 | OK |
| 165 | `nfe_eventos` | ativa | 1 | 0 | OK |
| 166 | `nfe_recebidas` | ativa | 2 | 2 | OK |
| 167 | `notas_fiscais` | ativa | 2 | 4 | OK |
| 168 | `notas_fiscais_ocr` | ativa | 3 | 0 | OK |
| 169 | `notification_history` | ativa | 1 | 2 | OK |
| 170 | `open_finance_consents` | ativa | 1 | 1 | OK |
| 171 | `operacoes_icms` | ativa | 1 | 0 | OK |
| 172 | `operacoes_tributaveis` | ativa | 1 | 6 | OK |
| 173 | `oportunidades_elisao` | ativa | 1 | 4 | OK |
| 174 | `organizacao_membros` | ativa | 2 | 3 | OK |
| 175 | `organizacoes` | ativa | 4 | 2 | OK |
| 176 | `overlay_rejeicoes_auditoria` | ativa | 4 | 1 | OK |
| 177 | `pagamentos_recorrentes` | ativa | 1 | 5 | OK |
| 178 | `parcelas_acordo` | ativa | 3 | 5 | OK |
| 179 | `partidas_contabeis` | ativa | 1 | 3 | OK |
| 180 | `password_reset_requests` | ativa | 3 | 4 | OK |
| 181 | `password_reset_tokens` | ativa | 4 | 0 | OK |
| 182 | `pedidos_compra` | ativa | 1 | 2 | OK |
| 183 | `per_dcomp` | ativa | 2 | 4 | OK |
| 184 | `performance_alerts` | ativa | 1 | 0 | OK |
| 185 | `permissions` | ativa | 4 | 2 | OK |
| 186 | `pg_stat_statements_baseline` | ativa | 1 | 0 | OK |
| 187 | `pix_templates` | ativa | 3 | 5 | OK |
| 188 | `plano_contas` | ativa | 1 | 9 | OK |
| 189 | `planos_acao` | ativa | 1 | 3 | OK |
| 190 | `portal_cliente_acessos` | ativa | 2 | 1 | OK |
| 191 | `portal_cliente_tokens` | ativa | 1 | 3 | OK |
| 192 | `prejuizos_fiscais` | ativa | 3 | 2 | OK |
| 193 | `profiles` | ativa | 3 | 14 | OK |
| 194 | `projecoes_reforma` | ativa | 1 | 0 | OK |
| 195 | `protestos` | ativa | 3 | 3 | OK |
| 196 | `protocolos_st` | ativa | 2 | 0 | OK |
| 197 | `protocolos_st_ncms` | ativa | 2 | 1 | OK |
| 198 | `protocolos_st_ufs` | ativa | 2 | 1 | OK |
| 199 | `push_subscriptions` | ativa | 1 | 5 | OK |
| 200 | `query_telemetry` | ativa | 3 | 2 | OK |
| 201 | `rate_limit_logs` | ativa | 2 | 2 | OK |
| 202 | `recomendacoes_metas_ia` | ativa | 1 | 1 | OK |
| 203 | `regime_decision_cache` | ativa | 1 | 1 | OK |
| 204 | `regimes_especiais_empresa` | ativa | 1 | 2 | OK |
| 205 | `regimes_simulados` | ativa | 2 | 5 | OK |
| 206 | `regimes_tributarios` | ativa | 1 | 0 | OK |
| 207 | `regras_conciliacao` | ativa | 1 | 13 | OK |
| 208 | `regras_contabilizacao_automatica` | ativa | 2 | 5 | OK |
| 209 | `regras_duplicidade` | ativa | 1 | 0 | OK |
| 210 | `regras_roteamento_financeiro` | ativa | 2 | 0 | OK |
| 211 | `regua_cobranca` | ativa | 3 | 2 | OK |
| 212 | `regua_cobranca_etapas` | ativa | 3 | 0 | OK |
| 213 | `regua_cobranca_status` | ativa | 1 | 2 | OK |
| 214 | `relatorios_agendados` | ativa | 1 | 5 | OK |
| 215 | `relatorios_tributarios_agendados` | ativa | 3 | 6 | OK |
| 216 | `resumos_executivos_semanais` | ativa | 1 | 2 | OK |
| 217 | `retencao_politicas` | ativa | 1 | 0 | OK |
| 218 | `retencoes_fonte` | ativa | 1 | 3 | OK |
| 219 | `risk_rules` | ativa | 5 | 0 | OK |
| 220 | `role_permissions` | ativa | 5 | 4 | OK |
| 221 | `rpc_observability_metrics` | ativa | 1 | 0 | OK |
| 222 | `runtime_error_logs` | ativa | 4 | 0 | OK |
| 223 | `saved_filter_subscriptions` | ativa | 1 | 7 | OK |
| 224 | `saved_filters` | ativa | 5 | 14 | OK |
| 225 | `scim_operations_log` | ativa | 1 | 1 | OK |
| 226 | `scim_setup_checklist` | ativa | 1 | 2 | OK |
| 227 | `scim_tokens` | ativa | 1 | 3 | OK |
| 228 | `security_alerts` | ativa | 1 | 3 | OK |
| 229 | `security_audit_logs` | ativa | 2 | 0 | OK |
| 230 | `security_settings` | ativa | 1 | 6 | OK |
| 231 | `sefaz_dfe_cursor` | ativa | 1 | 0 | OK |
| 232 | `sessoes_conciliacao` | ativa | 2 | 0 | OK |
| 233 | `simulacao_tributos_detalhados` | ativa | 1 | 0 | OK |
| 234 | `simulacoes` | ativa | 1 | 0 | OK |
| 235 | `slo_metrics_diarias` | ativa | 1 | 1 | OK |
| 236 | `slow_query_alerts` | ativa | 1 | 0 | OK |
| 237 | `solicitacoes_aprovacao` | ativa | 1 | 12 | OK |
| 238 | `solicitacoes_lgpd` | ativa | 3 | 2 | OK |
| 239 | `sped_contabil_arquivos` | ativa | 4 | 4 | OK |
| 240 | `split_payment_transacoes` | ativa | 3 | 3 | OK |
| 241 | `sso_login_attempts` | ativa | 1 | 1 | OK |
| 242 | `sso_providers` | ativa | 1 | 5 | OK |
| 243 | `sso_role_mappings` | ativa | 1 | 3 | OK |
| 244 | `sso_sandbox_runs` | ativa | 1 | 3 | OK |
| 245 | `sso_user_groups` | ativa | 1 | 0 | OK |
| 246 | `tax_audit_trail` | ativa | 1 | 0 | OK |
| 247 | `templates_cobranca` | ativa | 3 | 2 | OK |
| 248 | `transacoes_bancarias` | ativa | 1 | 17 | OK |
| 249 | `transferencias` | ativa | 1 | 6 | OK |
| 250 | `ufs` | ativa | 3 | 1 | OK |
| 251 | `user_action_audit` | ativa | 2 | 1 | OK |
| 252 | `user_active_filters` | ativa | 3 | 9 | OK |
| 253 | `user_anomalia_preferences` | ativa | 1 | 4 | OK |
| 254 | `user_demonstrativo_preferences` | ativa | 1 | 3 | OK |
| 255 | `user_devices` | ativa | 5 | 0 | OK |
| 256 | `user_digest_preferences` | ativa | 3 | 2 | OK |
| 257 | `user_empresas` | ativa | 2 | 6 | OK |
| 258 | `user_filter_presets` | ativa | 2 | 3 | OK |
| 259 | `user_onboarding_progress` | ativa | 3 | 3 | OK |
| 260 | `user_passkeys` | ativa | 7 | 0 | OK |
| 261 | `user_roles` | ativa | 5 | 5 | OK |
| 262 | `user_sessions` | ativa | 1 | 6 | OK |
| 263 | `vendedores` | ativa | 1 | 7 | OK |
| 264 | `verificacoes_conformidade` | ativa | 1 | 2 | OK |
| 265 | `webauthn_challenges` | ativa | 5 | 0 | OK |
| 266 | `webauthn_credentials` | ativa | 1 | 6 | OK |
| 267 | `webhook_dlq` | ativa | 2 | 0 | OK |
| 268 | `webhook_events` | ativa | 6 | 0 | OK |
| 269 | `webhook_simulation_results` | ativa | 1 | 1 | OK |
| 270 | `webhook_simulation_runs` | ativa | 2 | 2 | OK |
| 271 | `webhooks_log` | ativa | 2 | 3 | OK |
| 272 | `whatsapp_conversas` | ativa | 1 | 2 | OK |

Criadas em migration mas ausentes em produção (22) — histórico abandonado, **sem perda de funcionalidade**: 0 referências em `src/`, `supabase/functions/` (grep `.from("<tabela>")`) e em `pg_proc.prosrc` de produção (sem uso real). Exceções: `extratos_bancarios_importados` existe em produção como VIEW (a tabela foi substituída); `active_tracking` só aparece num comentário de `check_integrity_invariants`. Status: OK (não fazem parte da linha de base funcional).

| tabela | refs `.from()` no front | DROP em migration |
|---|---|---|
| `account_lockouts` | 0 | não |
| `active_tracking` | 0 | sim |
| `asaas_scheduled_transfers` | 0 | não |
| `audit_log` | 0 | não |
| `auditoria_configuracoes` | 0 | não |
| `boleto_events` | 0 | não |
| `cnpja_rate_limit` | 0 | não |
| `conciliacao_sugestoes` | 0 | não |
| `configuracoes_receber` | 0 | não |
| `contatos_financeiros` | 0 | não |
| `elisao_analise_gap` | 0 | não |
| `entity_versions` | 0 | não |
| `extratos_bancarios_importados` | 0 | sim |
| `known_devices` | 0 | não |
| `lalur_lancamentos` | 0 | não |
| `obrigacoes_acessorias` | 0 | não |
| `ponto_departamentos` | 0 | não |
| `ponto_funcionarios` | 0 | não |
| `ponto_registros` | 0 | não |
| `ponto_sync_log` | 0 | não |
| `registro_duplicidade` | 0 | não |
| `user_preferences` | 0 | não |

### 1.4 Workflows (`.github/workflows`: 19 workflows + `README.md`)

Prova: última execução não cancelada de cada workflow no `main` (API do Actions, 12/11/2026 ~21:45 UTC). `main` atual: `68bac76` (PR #325); runs do push `68bac76` citadas onde já concluíram.

| workflow | gatilhos | última execução no `main` | status |
|---|---|---|---|
| `actionlint.yml` | push main (paths), PR, dispatch | 43167726933 push · success | OK |
| `auto-update-pr-branch.yml` | push main, workflow_run, schedule, dispatch | 43225710766 schedule · success | OK |
| `automation-local.yml` | PR, push main, dispatch | 43292483535 push (`821385c`) · success | OK |
| `ci.yml` | push main, PR | 43292483803 push (`821385c`) · success (antes 43266511057 `6e462aa` success); run do push `68bac76` (43317296949) na fila às ~22:45 UTC, jobs já concluídos todos success | OK |
| `codeql.yml` | push main, PR, schedule semanal | 43239116996 push (`51d0405`) · success | OK |
| `contexto.yml` | push main (paths), PR (paths), schedule 10 min, dispatch | 43221896982 schedule · success (execuções seguintes canceladas por `concurrency`, não por falha) | OK |
| `deno-tests.yml` | push main, PR, dispatch | 43292483724 push (`821385c`) · success | OK |
| `dependency-review.yml` | só PR | 43214628619 pull_request · success | OK |
| `estado-real.yml` | schedule semanal, push main (paths), dispatch | 43177623881 push · success | OK |
| `functions-deploy.yml` | só dispatch | 43183475894 dispatch · success | OK |
| `graphify.yml` | push main (paths), PR (paths), dispatch | 43292483673 push (`821385c`) · success | OK |
| `inventario-estado.yml` | schedule semanal, push/PR (paths), dispatch | 43177624081 push · success | OK |
| `migration-ledger.yml` | só dispatch | 39134497416 dispatch · success | OK |
| `prod-migrate.yml` | só dispatch | 41048078008 dispatch · success | OK |
| `schema-drift.yml` | schedule semanal, dispatch | 42573131688 schedule · success | OK |
| `settings-guard.yml` | schedule diário, dispatch | 43175053162 schedule · success | OK |
| `staging-migrate.yml` | só dispatch | 40908210665 dispatch · success | OK |
| `supabase-admin-ops.yml` | só dispatch | 38429016227 dispatch · success | OK |
| `supabase-linter.yml` | push main (paths), PR, dispatch | 43292483702 push (`821385c`) · success (só roda com mudança em banco/funções) | OK |

Registrados no GitHub sem arquivo no repo (não executam no `main`): `e2e-cloud-probe.yml`
(1 execução em 30/08, branch `hermes/probe-e2e-h102635`) e `tmp-update-bun-lock.yml` (1 execução em
31/10, branch de Copilot). Sem arquivo não há gatilho — não afetam o `main`.

### 1.5 Integrações externas

Prova de uso real = tráfego de produção com resposta de sucesso. Tabelas de integração com 0 registros
(query `count(*)` em 12/11/2026) indicam que a integração nunca foi exercida em produção; testar ponta a
ponta exige conta/credencial do provedor ativada pelo dono.

| integração | env vars (nomes) | prova | status |
|---|---|---|---|
| Supabase externo (Gestão de Clientes) via `external-data` | `EXTERNAL_SUPABASE_URL`, `EXTERNAL_SUPABASE_SERVICE_KEY` | `edge_function_logs` 7d: 4.948 requests, códigos 200/401, 0 erros 5xx | OK |
| SEFAZ DF-e (`sefaz-dfe-dispatcher`) | `SEFAZ_CRON_SECRET`, `NFE_CERT_MASTER_KEY` | 33 execuções 24h, todas `status_code=200`; `nfe_recebidas` = 31 | OK |
| Resend (e-mail de alertas) | `RESEND_API_KEY`, `RESEND_FROM` | `net._http_response` 24h: 24× `{"ok":true,"results":{"email":{"status":200,"ok":true}}}`; 1× `{"email":{"status":429,"ok":false}}` (rate limit do Resend) às 21:10 UTC de 12/11 | OK (1 rate limit pontual) |
| Web Push (`send-push-notification`) | `VAPID_*` | 42× `200 {"success":true,"sent":0,..."Nenhuma subscription ativa"}`; `push_subscriptions` = 0; envio sem `Authorization` VAPID nem criptografia `aes128gcm` (`supabase/functions/send-push-notification/index.ts:121-129`) | BLOQUEADO — com assinante real o push seria rejeitado; nunca exercido |
| SSO (OIDC/SAML) | config no banco | `sso_providers` = 4 | OK |
| Lovable AI Gateway / OpenAI (18 funções de IA) | `LOVABLE_API_KEY`, `OPENAI_API_KEY` | funções publicadas (ping 200); `expert_messages` = 0 | BLOQUEADO — sem uso real em produção; teste exige chamada paga ao provedor (custo) |
| Asaas | `ASAAS_API_KEY`, `ASAAS_WEBHOOK_TOKEN` | `asaas_payments` = 0, `asaas_sync_queue` = 0 | BLOQUEADO — nunca exercida; exige conta Asaas ativa |
| Bling ERP | `BLING_CLIENT_ID/SECRET` | `bling_sync_logs` = 0 | BLOQUEADO — nunca exercida; exige OAuth Bling |
| Bitrix24 | `BITRIX24_*` | `bitrix_sync_logs` = 0 | BLOQUEADO — nunca exercida; exige OAuth Bitrix24 |
| n8n | `N8N_DISPATCH_SECRET`, `N8N_CALLBACK_SECRET` | `n8n_dispatch_logs` = 0 | BLOQUEADO — nunca exercida; exige fluxo n8n ativo apontando para a função e um disparo real |
| CNPJá | `CNPJA_API_KEY` | `cnpja_cache` = 0 | BLOQUEADO — nunca exercida; exige chamada real com `CNPJA_API_KEY` válida (custo por consulta) |
| Open Finance | `OPEN_FINANCE_CLIENT_ID` | função 100% simulada (seção 6) | BLOQUEADO — não há integração real |
| WhatsApp (IA proativa) | via LLM | front só abre `wa.me` | BLOQUEADO — sem provedor de envio configurado |
| Slack / Sentry / Mapbox / Geo-IP / HIBP | `SLACK_WEBHOOK_URL`, `SENTRY_DSN`, `MAPBOX_ACCESS_TOKEN` | sem tráfego observável nesta auditoria (sem acesso aos painéis desses provedores) | BLOQUEADO — prova exige acesso ao painel do provedor |

## 2. Qualidade (build, typecheck, lint, testes)

Ambiente local: Node 22, deps instaladas do `bun.lock` (URLs do mirror privado `*-npm.pkg.dev`
bloqueadas pelo proxy da sessão → trocadas por `registry.npmjs.org` só em memória para o install; lockfile
não alterado).

| verificação | linha de base `bd5e644` | final `68bac76` |
|---|---|---|
| `tsc --noEmit` | exit 0 | exit 0 |
| `npm run lint` (gate da CI, `ci.yml:272`) | exit 0 (0 erros, 74 avisos) | exit 0 (0 erros, 74 avisos — iguais à linha de base) |
| `npm run lint:strict` (`--max-warnings 0`) | exit 1 — 74 avisos herdados: 73× `max-lines` + 1× `react-refresh/only-export-components` | exit 1 — os mesmos 74 avisos herdados |
| `vite build` (com `VITE_SUPABASE_*` definidos) | exit 0 (`✓ built in 7.16s`) | exit 0 |
| `vitest run` | exit 0 — 247 arquivos, **3025 testes** | exit 0 — 248 arquivos, **3028 testes** (+3 da #325) |

Após a #323: `ci.yml` 43266511057 (push `6e462aa`) success; após a #321: 43292483803 (push `821385c`) success. E2E locais no `68bac76` (Playwright, mesmos configs da CI, Chromium do ambiente): `playwright.financeiro.config.ts` 16 passed / 0 failed; `playwright.critical.config.ts` 37 passed / 0 failed / 1 skipped (login real exige credencial). No `main` final `68bac76` (local, 12/11 22:15 UTC): `tsc` exit 0, `npm run lint` exit 0 (74 avisos herdados), `vite build` exit 0, `vitest` 248 arquivos / 3028 testes.

Nenhum teste removido, pulado ou afrouxado. `lint:strict` não é gate da CI; zerar exige quebrar 73
arquivos grandes (refatoração fora do escopo "diff mínimo") → BLOQUEADO por decisão do dono.

## 3. GitHub Actions

Ver 1.4. Nenhuma execução vermelha no `main`. `contexto.yml` (schedule a cada 10 min, `concurrency` com cancelamento) teve execuções canceladas por sobreposição durante a fila congestionada do Actions em 12/11 — cancelamento por `concurrency` não é falha; última conclusão não cancelada: success (43221896982).

## 4. Banco (produção `bwwbeyolnnzppeuhgkcd`)

| verificação | resultado | status |
|---|---|---|
| RLS em toda tabela `public` | 272/272 com `rowsecurity=true`; 0 com RLS sem policy | OK |
| Views | 100% com `security_invoker` | OK |
| Advisors de segurança (ERROR) | API oficial `GET /v1/projects/bwwbeyolnnzppeuhgkcd/advisors/security` (12/11, HTTP 200): **0 ERROR** — 63 WARN `authenticated_security_definer_function_executable`, 7 WARN `anon_security_definer_function_executable`, 2 WARN `materialized_view_in_api`. Também `supabase db lint` na CI (run 43220341709): `✅ Nenhum ERROR bloqueante`; checagens SQL equivalentes ao splinter: `auth_users_exposed` = 0, policies com `user_metadata` = 0, matviews lidas por `anon` = 0, policies `anon` de escrita com `true` = 0 | OK |
| Migrations repo × banco (efeito) | objetos das 12 migrations mais recentes conferidos no banco: funções `normalizar_tipo_partida`, `validar_partidas_dobradas`, `contabilizar_movimentacao(_registro)`, `sincronizar_conta_partida`; triggers `trg_contabilizar_movimentacao`, `trg_sincronizar_conta_partida`; `contas_pagar_status_check` com `parcial`; índice `categorias_empresa_tipo_nome_uq`; cron órfão removido | OK |
| Migrations repo × ledger | ledger tem 391 versões; 13 sem arquivo de mesma versão, mas o conteúdo está nos arquivos consolidados `20261027120000_transferencias_movimentacao_bilateral.sql` (7 versões) e `20261101140000_drop_idle_indexes.sql` (5); `security_invoker_all_views` verificado pelo efeito (100% das views). 631 arquivos do repo fora do ledger por política do repo (DDL via `supabase_db_query`, AGENTS.md §4) | OK |
| Cron `monitor-health-check` | definido em `20261101200000_monitor_health_cron.sql:25`, **ausente** em `cron.job`; a própria migration diz "NÃO aplicar sem aprovação explícita"; a function `monitor-health` também não está publicada (ping 404) | BLOQUEADO — aguardando dono |
| Tabelas de migrations ausentes no banco | 22 (ver 1.3), sem nenhuma referência em código | OK |

## 5. Produção

| verificação | prova | status |
|---|---|---|
| Deploy front | Vercel `dpl_9Fw6ewRRSxVwnWosXbyMyTcGtuCQ` READY, commit `68bac76`; `get_runtime_errors` desde 17:00 UTC: nenhum erro (anteriores: `dpl_2YJKioxK9AG14enSioWDKzuiaxU8` `821385c`, `dpl_8dw192HzBpRkKmFqW13q6gRGean8` `6e462aa`, `dpl_3EBzYSfwDVpZKZZBTmDoh1qb4d5j` `51d0405`) | OK |
| Front no ar | `GET https://promo-finance-v2.vercel.app/` → 200, `<title>Promo Finance \| Sistema Financeiro Corporativo</title>` | OK |
| Erros de runtime Vercel | `get_runtime_errors` 24h: "No runtime errors found" | OK |
| Edge functions | 105/106 publicadas e respondendo (ping); `edge_function_logs` desde 12/11 05:45 UTC (11 funções instrumentadas): 0 linhas 5xx/`error` | OK (exceto `monitor-health`, seção 4) |
| Cron `enviar-digest-conformidade-horario` | 24/24 falhas em 24h desde 31/10/2026: `ERROR: Secret "anon_key" ausente no Vault` (`chave_anon_vault()` linha 11) | BLOQUEADO — criar segredo `anon_key` no Vault (segredo → dono) |
| Cron `refresh-performance-alerts-weekly` | 11/11 falhas desde 30/08 (0 sucesso): `new row for relation "performance_alerts" violates check constraint "performance_alerts_source_check"` | BLOQUEADO — exige ajuste de DDL/função (dono) |
| Cron `maintain-monthly-partitions` | 3/3 falhas (última 01/11): `"audit_logs" is not partitioned` ao criar `audit_logs_2026_11 PARTITION OF`; as 22 tabelas `audit_logs_*`/`frontend_error_logs_*` são soltas (~31 linhas de auditoria fora de `audit_logs`) | BLOQUEADO — exige decisão de DDL (particionar ou remover o job) |
| Cron `monitorar-erros-frontend` | antes: 12/12 → 401 `chamada_nao_autorizada`; PR #321 mergeada pelo dono (`821385c`) e SQL aplicado em produção ~19:42 UTC: `net._http_response` 200 `{"success":true,"alertas":0,"message":"nenhum pico detectado"}` às 20:00, 20:30, 21:00 e 21:30 UTC; `webhook-retry-worker-1min` segue 200 `{"picked":0,...}` | OK |
| `external-data` 401 | 2.337 respostas 401 entre 08:26 e 12:00 de 12/11 (token inválido/expirado, ~500/h) e só 3 esporádicas depois das 12:42; gate `auth.getUser` em `supabase/functions/external-data/index.ts:134-143` responde corretamente | OK |
| Fluxo contas a pagar (prod, transação revertida) | `insert → status=pendente; update parcial → parcial; update pago → pago; delete → 1 linha` | OK |
| Fluxo contas a receber (prod, revertido) | `insert ok; update 1; delete 1` | OK |
| Fluxo movimentação → contabilização automática (prod, revertido) | `insert ok; lancamentos_contabeis novos = 1; delete 1` | OK |
| Login | `auth.users`: último `last_sign_in_at` 2026-11-12 21:39 UTC | OK |
| Teste de RLS como usuário final | `exec_sql` é `SECURITY DEFINER` (`cannot set parameter "role" within security-definer function`) e o proxy da sessão bloqueia `*.supabase.co` (CONNECT 403) | BLOQUEADO — coberto indiretamente pelo gate de RLS (seção 4) |

## 6. "Pela metade" no código de produção

| item | onde | status |
|---|---|---|
| Botões "ocultar/exibir" e "tamanho" do diálogo Configurar Dashboard sem ação | `src/components/dashboard/DashboardExecutivo.tsx:461-462` no `bd5e644` (`() => {}`) | OK — corrigido na PR #322 (mergeada, deploy READY) |
| Rótulos duplicados/errados no Configurar Dashboard e widgets estreitos (regressão da #322) | `DashboardConfigDialog.tsx:98`; grid `md:grid-cols-6` em `DashboardExecutivo.tsx` | OK — corrigido na PR #325 (mergeada `68bac76`, deploy `dpl_9Fw6ewRRSxVwnWosXbyMyTcGtuCQ` READY) |
| Telemetria de erros do front não grava (tela 'Erros do Front-end' sempre vazia) | papel `authenticated` sem `INSERT` em `public.frontend_error_logs`; `src/lib/telemetry.ts:208-227` | BLOQUEADO — exige `GRANT INSERT` (DDL em produção → dono) |
| Itens de menu de admin visíveis a todos os papéis (não-admin cai em 'Acesso restrito') | `src/components/layout/sidebar/SidebarNavGroups.tsx:313` não filtra por `requiredRoles` de `src/lib/navigation.ts` (vale para Segurança, Logs de Auditoria, Eventos JIT e o novo Erros do Front-end) | BLOQUEADO — padrão herdado; mudança de comportamento do menu para decisão do dono |
| Botão SMS "funcionalidade em desenvolvimento" | `src/components/contas-receber/EnviarCobrancaDialog.tsx:68` (usado em `ContasReceber.tsx`) | BLOQUEADO — sem provedor de SMS (custo) |
| Vinculação manual "em desenvolvimento" na baixa automática | `src/components/contas-receber/BaixaAutomaticaDialog.tsx:400` | BLOQUEADO — decisão de produto |
| Filtro de movimentações por conta bancária removido ("coluna não existe") | `src/hooks/useFinancialOperations.ts:76` — a coluna existe em produção; único chamador (`Movimentacoes.tsx:131`) passa `undefined` | BLOQUEADO — junto com a regeneração do `types.ts` |
| Envio de Web Push sem VAPID/criptografia | `supabase/functions/send-push-notification/index.ts:121-129` | BLOQUEADO — reimplementar envio com VAPID (sem assinantes hoje) |
| Painéis duplicados no dashboard (PrevisaoIA, Metas, Alertas de Orçamento no grid e na lateral) | `DashboardExecutivo.tsx:146,186,196` e coluna lateral | BLOQUEADO — decisão de produto |
| Páginas prontas sem rota (inalcançáveis) | `src/pages/admin/AdminErrosFrontend.tsx`, `src/pages/tributario/ConsultaRapidaFiscal.tsx` | OK — corrigido na PR #323 (mergeada `6e462aa`, deploy `dpl_8dw192HzBpRkKmFqW13q6gRGean8` READY) |
| Open Finance simulado (instituições, consentimento, saldos e transações inventados) | `supabase/functions/open-finance/index.ts:195,284,348,392,430`; `src/components/conciliacao/ImportarExtratoDialog.tsx:81-126` (usado em `ContasBancarias.tsx:304` e Conciliação) | BLOQUEADO — exige contrato com provedor Open Finance (custo/arquitetura) |
| Prévia de regras de conciliação com extrato fixo | `src/components/conciliacao/RegrasConciliacaoPanel.tsx:86,110` | BLOQUEADO — decisão de produto (usar extrato real exige definir a fonte) |
| 39 TODOs de campos preenchidos no formulário e não salvos (coluna inexistente) | lista em `src/hooks/*` e `src/components/*` (ex.: `ContaReceberForm.tsx:189` `codigo_barras/link_boleto`, `ContasPagarTableRow.tsx:217` `tags`, `useProtestos.ts:32`) — 23 colunas conferidas em produção: **não existem** | BLOQUEADO — exige DDL em produção (criar colunas) ou decisão de remover os campos (dono) |
| Insert de movimentação descarta `conta_bancaria_id`, `conta_pagar_id`, `conta_receber_id`, `origem` | `src/hooks/useFinancialOperations.ts:105-115` — as colunas **existem** em produção, mas `src/integrations/supabase/types.ts:10973` está desatualizado | BLOQUEADO — tipos oficiais gerados pela API (`/v1/projects/…/types/typescript`) confirmam as colunas; trocar o `types.ts` gera 7 erros de tipo a corrigir antes (`WebhooksLogPanel.tsx:43-44` `event_type`/`status`; `PagamentoRecorrenteForm.tsx:80` enum `tipo_cobranca`; inserts estritos em `useOportunidadesElisao.ts:152`, `usePixTemplates.ts:56`, `useScimChecklist.ts:52`, `useSecurityAlerts.ts:178`) |
| `monitor-health` sem canal de alerta | `supabase/functions/monitor-health/index.ts:9` (TODO) + função não publicada | BLOQUEADO — aguardando dono (ver seção 4) |
| `mockNotasFiscais` exportado e nunca importado | `src/components/nfe/nfe-types.ts:68` | OK — código morto, não alcança a UI (0 imports) |
| Score de crédito "simulated for now" | `src/lib/collection-engine.ts:48` | OK — cálculo real sobre o histórico; só o comentário está desatualizado |
| Badge "Em breve" na exportação SPED | `src/components/reforma-tributaria/ExportacaoSPED.tsx:325` | BLOQUEADO — funcionalidade não implementada (decisão de produto) |
| UUIDs fixos | sandbox SSO/SCIM (`ScimUserJsonGenerator.tsx:50`, `sso/sandbox/types.ts:40-42`) = dados de exemplo de ferramenta de teste; `useSharedFiltersAdmin.ts:212` = sentinela de auditoria de import em lote | OK |
| `tree-view.tsx:207` `onChange={() => {}}` | checkbox só com `showCheckboxes`, que nenhum componente usa | OK |

## 7. Corrigido nesta auditoria

| PR | o que muda | evidência | estado |
|---|---|---|---|
| [#322](https://github.com/adm01-debug/Promo_Finance_V2/pull/322) | Configurar Dashboard: ocultar/exibir e tamanho dos widgets passam a funcionar (`DashboardExecutivo.tsx`) | causa: handlers `() => {}` em `DashboardExecutivo.tsx:461-462`; CI 8/8 obrigatórios verdes (26 check runs + 2 status verdes, 0 falha); local `tsc` 0, `vitest` 3025/3025, `vite build` OK | mergeada (`51d0405`), deploy `dpl_3EBzYSfwDVpZKZZBTmDoh1qb4d5j` READY |
| [#323](https://github.com/adm01-debug/Promo_Finance_V2/pull/323) | Páginas 'Erros do Front-end' (`/admin/erros-frontend`) e 'Consulta Rápida Fiscal' (`/tributario/consulta-rapida`) ganham rota, menu e breadcrumb | páginas sem rota/import no `main`; local `tsc` 0, `vitest` 3025/3025 | mergeada (`6e462aa`), CI `ci.yml` 43266511057 success, deploy `dpl_8dw192HzBpRkKmFqW13q6gRGean8` READY |
| [#321](https://github.com/adm01-debug/Promo_Finance_V2/pull/321) | Crons `monitorar-erros-frontend` e `webhook-retry-worker-1min` enviam o segredo que as functions validam | 12/12 execuções 401; com o segredo certo → 200 (net 199266 e 199467); simulação com rollback: altera os 2 jobs, 2ª execução no-op | mergeada pelo dono (`821385c`); SQL aplicado em produção ~19:42 UTC; cron 200 desde 20:00 UTC |
| [#325](https://github.com/adm01-debug/Promo_Finance_V2/pull/325) | Corrige a regressão de layout da #322 (grid só a partir de 1536px), rótulos duplicados no Configurar Dashboard, mutação do array e config salva inválida; +3 testes | validação adversarial mediu widgets de 146px em 1024px; testes novos falham no código antigo (2/3) e passam no novo; `vitest` 3028/3028 | mergeada (`68bac76`) com os 8/8 checks obrigatórios verdes (inclui `E2E Destructive Logout`; no total 25 check runs + 2 status verdes, 0 falha; `E2E Quarantine (non-blocking)` sem conclusão), deploy `dpl_9Fw6ewRRSxVwnWosXbyMyTcGtuCQ` READY |
| [#324](https://github.com/adm01-debug/Promo_Finance_V2/pull/324) | Este relatório (`docs/prod-readiness.md`) | — | aberta |
| [#326](https://github.com/adm01-debug/Promo_Finance_V2/pull/326) | `ci.yml:654` quarentena E2E `always()` → `!cancelled()` (libera runners presos em CI cancelada) | YAML válido; 1 linha | **aberta, aguardando o dono** (workflow) |

## 8. BLOQUEADO / aguardando o dono

| item | erro exato / motivo | o que falta |
|---|---|---|
| Cron `enviar-digest-conformidade-horario` | `Secret "anon_key" ausente no Vault` desde 31/10 | criar o segredo `anon_key` no Vault do projeto |
| Cron `refresh-performance-alerts-weekly` | `violates check constraint "performance_alerts_source_check"` (11/11) | corrigir a função/constraint (DDL) |
| Cron `maintain-monthly-partitions` | `"audit_logs" is not partitioned` (3/3) | particionar `audit_logs`/`frontend_error_logs` ou remover o job e as 22 tabelas soltas (DDL) |
| Telemetria de erros do front | `authenticated` sem `INSERT` em `frontend_error_logs` | `GRANT INSERT` (DDL) |
| `webhook-retry-worker` publicado diverge do repo | a versão no ar aceita dois segredos internos (Vault `regua_cron_secret` e `internal_jobs`; ambos → 200 em 12/11), o código do repo (`webhook-retry-worker/index.ts:49`) aceita só `internal_jobs` | republicar a função a partir do `main` pelo `functions-deploy.yml` (deploy controlado → dono); o cron já envia `internal_jobs`, então é seguro |
| Menu mostra itens de admin a todos | filtro por papel inexistente no sidebar | decidir e implementar filtro por `requiredRoles` |
| `monitor-health` | função não publicada (404) e cron não agendado; migration exige aprovação | decidir se ativa: publicar via `functions-deploy.yml` + aplicar `20261101200000_monitor_health_cron.sql` + canal de alerta |
| Campos de formulário sem coluna (23 colunas) | colunas ausentes em produção | decidir: criar colunas (DDL) ou remover campos |
| `types.ts` desatualizado | `movimentacoes` tem 6 colunas a mais em produção; `types.ts` do repo tem 4.706 linhas a mais que o gerado (tabelas que não existem em produção) | PR dedicada: regenerar `types.ts` + corrigir os 7 erros de tipo listados na seção 6; reativar o filtro por `conta_bancaria_id` em `useFinancialOperations.ts:76` |
| Open Finance / prévia de conciliação / SPED "Em breve" | simulação ou funcionalidade inexistente | decisão de produto/contrato |
| Integrações sem uso (Asaas, Bling, Bitrix24, n8n, CNPJá, IA, WhatsApp) e sem prova (Slack/Sentry/Mapbox/Geo-IP/HIBP) | as primeiras nunca exercidas em produção (tabelas de log = 0); as últimas sem tráfego observável e sem acesso ao painel do provedor | ativar contas/credenciais e testar com o provedor; acesso aos painéis Slack/Sentry/Mapbox para prova |
| Teste de RLS como usuário final | `cannot set parameter "role" within security-definer function` (`exec_sql`) e proxy da sessão bloqueia `*.supabase.co` (CONNECT 403) | sessão com acesso direto a `*.supabase.co` ou conexão Postgres com papel `authenticated` + JWT de teste |
| Botão SMS em Enviar Cobrança | "funcionalidade em desenvolvimento" (`EnviarCobrancaDialog.tsx:68`); sem provedor de SMS | escolher/contratar provedor de SMS (custo) |
| Vinculação manual na baixa automática | "em desenvolvimento" (`BaixaAutomaticaDialog.tsx:400`) | decisão de produto sobre o fluxo |
| Web Push | envio sem VAPID nem `aes128gcm` (`send-push-notification/index.ts:121-129`); 0 assinantes | reimplementar envio com VAPID antes de ter assinantes |
| Painéis duplicados no dashboard | PrevisaoIA, Metas e Alertas de Orçamento no grid e na lateral (`DashboardExecutivo.tsx:146,186,196`) | decisão de produto: qual posição manter |
| PR #326 — quarentena E2E com `always()` | `ci.yml:654`: job não bloqueante roda até 30 min em CI cancelada e segura runners (fila do Actions de 12/11 com CI horas em `queued`) | revisar e mergear a #326 (`always()` → `!cancelled()`; workflow → dono) |
| Ledger `supabase_migrations.schema_migrations` | 391 versões registradas (máx. `20261101140005`) × 1010 arquivos; as migrations de 12/11 têm efeito conferido no banco mas não estão no ledger (política do repo: DDL via `supabase_db_query`, AGENTS.md §4) | decidir se o ledger deve ser reconciliado (registro das versões sem reaplicar) |
| `lint:strict` | 74 avisos herdados (73× `max-lines`) | decidir se o limite de 400 linhas vira gate |
| PR #293 (Dependabot `mapbox-gl` 3.26.0→3.34.2) | `Dependency Review`: "Dependency review detected incompatible licenses" — `mapbox-gl@^3.34.2` com licença `LicenseRef-bad-see-license-in-license.txt` (fora do `allow-licenses`); E2E vermelhos são de infra do runner (`Playwright does not support chromium on ubuntu26.04-x64`), não do bump | decisão do dono: aceitar a licença proprietária do Mapbox (exceção no `dependency-review.yml`) ou fechar a PR |
