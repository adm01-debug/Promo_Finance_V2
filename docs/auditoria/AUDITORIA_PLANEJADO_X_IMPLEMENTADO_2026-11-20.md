# Auditoria exaustiva — funcionalidades planejadas × implementadas (Promo Finance V2)

Data: 2026-11-20 · HEAD `a406e99` (`main`, PR #476) · Snapshot de produção: branch `contexto` (coleta 2026-11-20 02:21Z, banco `bwwbeyolnnzppeuhgkcd`).

## 0. Escopo e método

- **Documentos auditados:** 130 arquivos Markdown (98 em `docs/`, 15 na raiz, mais `docs/api/openapi.yaml`, `docs/ci/kpi.json`, `docs/auditoria-financeira-20260910/VERIFICACOES.json`, `docs/auditoria-20260912/evidencias.json`). Nenhum documento de planejamento ficou fora; `docs/archive/sql/` (scripts SQL avulsos) foi ignorado por não descrever funcionalidade.
- **Verificação:** cada item foi confrontado com o código em `src/`, `supabase/functions/`, `supabase/migrations/`, `.github/workflows/`, `scripts/`, `e2e/` e com o estado real de produção versionado na branch `contexto` (tabelas, policies, funções, cron, execuções de cron, Edge Functions implantadas, nomes de secrets, lints, métricas). Toda afirmação traz `arquivo:linha` ou comando + resultado.
- **Organização:** 12 frentes paralelas (Anexos A1–A12), uma frente própria de produção (§P) e um workflow de 2ª leitura independente com crítico de completude e refutação adversarial em duas lentes (Anexo W).
- **Status usados:** NÃO IMPLEMENTADO · PARCIAL (existe, mas simulado, desligado, sem backend, sem rota, sem cron ou com parte faltando) · MARCADO FEITO, NÃO ENCONTRADO (doc diz pronto, código não confirma) · QUEBRADO EM PRODUÇÃO · ÓRFÃO (existe e nada usa) · NÃO VERIFICÁVEL (exige banco vivo, painel Vercel/Supabase ou ambiente externo).
- **Limites:** sem MCP do projeto oficial nesta sessão (estado de produção lido do snapshot da branch `contexto`); Vercel respondeu 403; `node_modules` ausente (lint/testes/build não executados); clone raso (histórico anterior a 17/11 via `gh api`).

## 1. Resultado em uma página

| Dimensão | Números |
|---|---|
| Itens verificados item a item (docs) | ≈ 2.400 nas 12 frentes (detalhe por documento nos anexos) |
| `FUNCIONALIDADES_SISTEMA.md` (inventário "100% das features") | 170 linhas: 104 confirmadas · 33 com nome/caminho errado · 27 parciais/simuladas · 4 inexistentes · 2 não verificáveis |
| `INVENTARIO_FUNCIONALIDADES.md` | 280 itens: 237 ok · 22 inexistentes · 17 renomeados · 4 parciais |
| `COMPONENTS.md` (biblioteca de UI documentada) | 56 itens: 21 ok · **30 inexistentes** · 5 parciais |
| `GAPS_ENTERPRISE.md` (71 gaps + roadmap de 21) | 8 implementados · 24 parciais · **39 não implementados**; roadmap 4/9/8 |
| Guias de features e integrações (`docs/guides/**`, N8N, ADR-003, MATRIZ_PAPEIS, OpenAPI, Banco Inter) | 21 não implementados · 27 parciais/mock · 13 desatualizados |
| Planos de etapas (50/100 etapas, 9 planos) | 8 planos: 1.040 etapas → ≈ 290 FEITAS, ≈ 330 PARCIAIS, ≈ 150 NÃO FEITAS, ≈ 180 NÃO VERIFICÁVEIS, 7 "marcadas feitas, não encontradas" |
| Inventário de trabalho inacabado (17/11) | 17 achados: 5 resolvidos · 3 parciais · **9 ainda abertos**; o documento não foi atualizado |
| Código órfão | 12–14 Edge Functions sem invocador · 48 tabelas de produção sem consumidor · 39–47 componentes sem importador · 1 hook órfão |
| Produção | chave de IA e 9 credenciais de integração ausentes · 15 automações sem cron · 1 cron falhando todo dia · 1 cron placeholder (`SELECT 1`) · 1 RPC inexistente · 2 tabelas lidas pelo código que não existem |

**Leitura de negócio:** o núcleo financeiro (contas a pagar/receber, boletos via Asaas, conciliação por arquivo, categorias, centros de custo, tesouraria, contabilidade com partidas dobradas, SPED ECD/ECF, demonstrativos, SSO/SCIM, tributário com simuladores locais) existe e está em produção. O que está documentado como pronto e **não funciona para o usuário** concentra-se em: toda a camada de IA (sem chave em produção), todas as integrações externas exceto Resend (sem credenciais ou sem provedor: Asaas, Bling, Bitrix24, CNPJa, Open Finance, WhatsApp, SMS, SEFAZ de emissão), todas as automações "por cron" de inteligência operacional e relatórios, e um conjunto de telas cujo botão só mostra um aviso (régua na aba Configurações, "Salvar configurações", XML/DANFE da NF-e, SMS, quorum de aprovação, motor anti-duplicidade).

## 2. Funcionalidades descritas como existentes que NÃO existem no código

| # | Funcionalidade (como está no doc) | Documento(s) | Evidência | Anexo |
|---|---|---|---|---|
| N-01 | Dashboard com **drag & drop** (`DraggableDashboardGrid`, `SortableCard`) | FUNCIONALIDADES_SISTEMA §6, INVENTARIO | `find src -iname 'DraggableDashboardGrid*'` → vazio; `grep -rl @dnd-kit src` → 0 (lib só em `package.json:60`) | A1, A2 |
| N-02 | **Observadores de aprovação** (`aprovacao_observadores`) | FUNCIONALIDADES_SISTEMA §9 | `grep -rli observador src supabase/migrations` → 0 | A1 |
| N-03 | **Fila de operações offline** (`useOfflineSync`) | FUNCIONALIDADES_SISTEMA §15 | só `src/lib/offline/fiscal-cache.ts` (cache de consulta); `OfflineBanner.tsx` apenas avisa | A1 |
| N-04 | **7 cron jobs "P13"** (health 07:00, anomalias */30, resumo Dom 18:00, benchmark Seg 03:00, ações 06:00, cleanup 05:55, SLO 23:55) e aba "Automações P13" | FUNCIONALIDADES_SISTEMA §14 | nenhum horário em `cron.schedule` nas migrations; produção (`cron.md`) não tem nenhum; `AutomacoesTab.tsx:25-65` filtra nomes `p13-*` que só existem em JSON mock (`20260518170823:123`) → aba vazia | A1, §P-03 |
| N-05 | Widgets do dashboard: `CockpitCFO`, `SimuladorCenarios`, `RecomendacoesMetasIA`, `CalendarioVencimentos`, `TransacoesRecentes`, `ResumoRapido`, `AnimatedMonthlyChart`, `MetricsCards` | INVENTARIO | `grep -rl` por cada nome em `src/` → vazio; pasta `dashboard/widgets/` não existe | A2 |
| N-06 | **30 componentes de UI** documentados (InteractiveCard, GradientCard, SpotlightCard, StatsCard, FlipCard, FloatingLabelInput, PasswordInput, ValidatedInput, 6 loaders, 3 skeletons, AnimatedStat, TrendIndicator, RichTooltip, ShortcutTooltip, NestedAccordion, Spotlight, ErrorFallback, AsyncBoundary, SuspenseWrapper, SkeletonTransition, RetryWrapper, Dropzone, animações `fade/scale/slide`, `hover-scale`, rota `/showcase`) | COMPONENTS.md | `grep -rlE "export (const\|function) <Nome>" src` → vazio para cada um; `tailwind.config.ts` só `accordion-*` | A2 |
| N-07 | `src/lib/feature-flags.ts`, `contrast-checker.ts`, `ThemeSwitcher.tsx`, `FontSizeControl.tsx`, `TwoFactorVerify.tsx`, `chart-skeleton`, `infinite-scroll`, `pull-to-refresh`, `optimized-table`, `feedback-banner`, `highlight-text` | INVENTARIO | arquivos ausentes (`find`/`ls`) | A2, A11 |
| N-08 | Edge Functions citadas: `orquestrador-elisao`, `importar-xml-nfe`, `exportar-sped` (SPED Fiscal/EFD ICMS-IPI), `webauthn-*`, `assinatura-digital`, edge de PER/DCOMP, edge de auditoria tributária | FUNCIONALIDADES_SISTEMA §7/§8/§10, ARCHITECTURE, P50-archive | `ls supabase/functions` não contém nenhuma; elisão (13 detectores) e XML rodam no navegador (`src/lib/tributario/elisao/`, `useImportacaoXMLNFe.ts:73`); SPED Fiscal sem geração | A1, A2, A9 |
| N-09 | **Assinatura digital** (certificado A1/A3) | FUNCIONALIDADES_SISTEMA §10 | `src/components/documentos/AssinaturaDigital.tsx:52-53` = `setTimeout(1500)` + toast de sucesso; nenhum `invoke`/`from`; rota `/assinatura-digital` existe | A1 |
| N-10 | **Portal do cliente público** (`pages/PortalCliente.tsx`, acesso por token) | FUNCIONALIDADES_SISTEMA §10 | só `/clientes/portal-tokens` (gestão admin); nenhuma rota `/portal/:token` | A1 |
| N-11 | **WebAuthn / passkeys** (login biométrico) | FUNCIONALIDADES_SISTEMA §2, P50-archive 21-22, REVISÃO A04 | 0 edges `webauthn-*`; `WebAuthnManager.tsx:140` "registro temporariamente indisponível"; tabelas `user_passkeys`/`webauthn_challenges` sem consumidor e com 0 linhas em prod | A1, A5, A9, A11 |
| N-12 | **Split de Pix** | FUNCIONALIDADES_SISTEMA §3 | só subtítulo em `PixHub.tsx:29`; `grep -rli split src/components/pix-hub` → 0 | A1 |
| N-13 | **Canal SMS** (régua, cobrança manual) | FUNCIONALIDADES_SISTEMA §4, boletos.md, prod-readiness | `executar-regua-cobranca/index.ts:191` "Canal sem provedor"; `EnviarCobrancaDialog.tsx:68` "SMS: funcionalidade em desenvolvimento" | A1, A3, A4, A11, §P-13 |
| N-14 | **Descontos progressivos** em boletos | boletos.md | `grep -rni "desconto.progressiv" src supabase` → 0 | A3 |
| N-15 | **Agendamento de pagamentos** | contas-pagar-receber.md | nenhuma coluna/tabela/UI de agendamento (`types.ts:4340-4346`) | A3 |
| N-16 | Relatório **"Análise de custos"** | relatorios.md | tipos reais: dre, balanco, inadimplencia, fluxo_caixa, aging | A3 |
| N-17 | **Alerta de saldo baixo** persistido/notificado | fluxo-caixa.md | só visual em `AlertasRuptura.tsx:222-225`; `gerar-alertas` não trata saldo | A3 |
| N-18 | **Séries de NF-e** configuráveis | integrations/overview.md | só coluna `notas_fiscais.serie`; sem config | A3 |
| N-19 | **Respostas rápidas** e **agendamento avulso** no WhatsApp | integrations/overview.md | `grep -rli "quick_repl\|respostas r"` → 0 | A3 |
| N-20 | SDKs documentados `conciliacaoIA.execute/confirmMatch`, `inadimplenciaIA.predict` | conciliacao-bancaria.md, analise-preditiva.md | `grep -rn conciliacaoIA\|inadimplenciaIA src` → 0 | A3 |
| N-21 | Algoritmos **Levenshtein**, **Regressão Logística + Random Forest**, retreino mensal, curva ROC, "acurácia 87,3%", "precisão ~95%" | conciliacao-bancaria.md, analise-preditiva.md | matcher é normalização + `includes` (`transaction-matcher/similarity.ts`); preditiva é prompt Gemini (`analise-preditiva/index.ts:273`); 0 ocorrências de ML/ROC | A3 |
| N-22 | **Open Finance** (consentimento, saldos, extrato 12 meses, renovação) | FUNCIONALIDADES_SISTEMA §5/§10, overview.md, GETTING-STARTED | `open-finance/index.ts:38-60` recusa `create_consent/get_accounts/get_balances/get_transactions/import_transactions` com 503 "não homologado"; sobrou lista fixa de bancos (`:245`) | A1, A3, A10 |
| N-23 | **Banco Inter** (edges `inter-cobranca-*`, tabela `inter_cobrancas`) | agentes/banco-inter-api.md | 0 código | A3 |
| N-24 | n8n: ação `update_driver_approval`, evento `driver_approval`, UI de workflows | N8N_WORKFLOWS.md | `n8n-callback/index.ts:20` enum sem a ação; nenhum chamador de `n8n-dispatch` em `src/`/`functions/` | A3 |
| N-25 | **Webhooks de saída** configuráveis pelo cliente | GAPS_ENTERPRISE, roadmap F1 | `ApiManagement.tsx:206-220` botão `disabled` "ainda não foi implantado"; 0 tabela de endpoints | A4 |
| N-26 | **API pública de dados** autenticada por API key | GAPS_ENTERPRISE, FUNCIONALIDADES_SEM_UI | `api_keys` + `api-keys-manage` existem, mas `grep -rln "api_keys\|x-api-key" supabase/functions` → só a própria função; OpenAPI cobre só webhooks/identidade | A4, A2 |
| N-27 | **Custom fields** nas entidades | GAPS roadmap F1-5 | admin em `/admin/campos-customizados`; 0 formulários leem `custom_field_values` | A4, A11 |
| N-28 | **i18n** EN/ES completo | GAPS roadmap F1-4 | `src/i18n.ts` com 14 chaves; `useTranslation` em 2 arquivos | A4 |
| N-29 | **Multi-moeda**, variação cambial | GAPS | só formatador `src/lib/currency.ts`; 0 colunas de moeda | A4 |
| N-30 | **DMPL/DLPA**, **DFC método indireto** | GAPS | 0 ocorrências; `FluxoCaixaContabil.tsx:308` só método direto | A4 |
| N-31 | **Folha de pagamento/eSocial/DCTFWeb/férias/holerite/ponto** | GAPS | só agregado `total_folha` e lembrete no calendário | A4 |
| N-32 | **Estoque próprio, custeio, inventário, recebimento NF-e, RFQ** | GAPS | 0; estoque só leitura via Bling | A4 |
| N-33 | **Pipeline de vendas, proposta→pedido, catálogo/tabela de preços, comissionamento, CPQ** | GAPS | 0 (`grep comiss src/pages/Vendedores.tsx` → 0) | A4 |
| N-34 | **Timesheet, milestones, WIP**, entidade "projeto" | GAPS | 0 | A4 |
| N-35 | **Aplicações financeiras, hedge, conciliação de cartões, FIDC** | GAPS | 0 | A4 |
| N-36 | **Construtor de relatórios**, ARIMA/Prophet, custom objects, marketplace, field-level security, SOC2/ISO, data residency, PagerDuty, backup self-service, tenant físico, localizações não-BR, IFRS | GAPS | 0 | A4 |
| N-37 | **Fechamento contábil centralizado / bloqueio de período** | GAPS | `grep -rli "periodo_fechado\|bloquear_periodo"` → 0 | A4 |
| N-38 | **Aprovar/rejeitar ordem de compra** | GAPS, Compras | `pedidos_compra` só com insert e listagem (`Compras.tsx`, `PedidoCompraForm.tsx`) | A4 |
| N-39 | **DCTF e PER/DCOMP** na exportação SPED | prod-readiness, código | `ExportacaoSPED.tsx:49-60` `disponivel: false` → badge "Em breve" | A4, A11 |
| N-40 | **Quorum multi-aprovador** (2–5 aprovadores) | INVENTARIO_TRABALHO_INACABADO #6 | `ConfiguracaoAprovacaoCard.tsx:187` aceita 2–5; RPC aprova com 1 clique; sem `aprovacao_assinaturas` | A10 |
| N-41 | **Motor anti-duplicidade configurável** (regras versionadas) | INVENTARIO_TRABALHO_INACABADO #1 | `RegrasDuplicidadeTab.tsx:99` toast "versionadas"; `configuracoes_duplicidade` lida só pela própria tela; índice UNIQUE fixo (#455) não honra a config | A10 |
| N-42 | **"Salvar Configurações" do sistema** (preferências, dias de alerta) | INVENTARIO_TRABALHO_INACABADO #3 | `Configuracoes.tsx:104` só toast; `gerar_alertas_vencimento` fixo em 7 dias | A10 |
| N-43 | **Régua de cobrança na aba padrão de Configurações** | INVENTARIO_TRABALHO_INACABADO #2 | `Configuracoes.tsx:96,305` toggles em `useState`; `grep supabase\|useMutation` → 0 | A10 |
| N-44 | Botões NF-e **Download XML**, **Enviar por e-mail**, **DANFE** (lista) | código | `NFePreview.tsx:188,209`, `NotasFiscaisAbas.tsx:226,233` → `toast.success(...)` sem ação | A11 |
| N-45 | Elisão: **"Sincronizar com Contabilidade"** | código | `NovaSimulacaoElisaoDialog.tsx:91` só `toast.info` | A11 |
| N-46 | Baixa automática: **"Vincular manualmente"** | código | `BaixaAutomaticaDialogCorrespondenciasAutomaticas.tsx:86` "em desenvolvimento" | A11 |
| N-47 | **Staging/sandbox** (projeto, secrets `STAGING_*`, var `REQUIRED_SECRETS`) | PENDENCIAS §2, GAPS | `github_list_actions_secrets` sem `STAGING_*`; `staging-migrate.yml` verde mas inerte | A12, A4 |
| N-48 | **Regras de negócio manuais** (`docs/contexto/regras/manual/regras.md`) | README do manual, AGENTS | pasta só com README + template; gerador registra o gap (`generate.py:1675`) | A12, A10 |
| N-49 | **Monitor externo de uptime, post-mortems, ensaio de DR, registro de rotação de secrets, backup de Storage** | runbooks | nenhum artefato (`ls docs/postmortems` inexistente; tabelas de rotação vazias) | A6 |
| N-50 | **Graphify**: `graph.json`, CLI `graphify query`, auto-sync N8N 15 min | GRAPHIFY_PLANO, AGENTS §8 | `graphify-out/` só `GRAPH_REPORT.md` (de 2026-10-06) + `manifest.json`; `which graphify` → vazio; 0 artefatos de N8N | A6 |
| N-51 | **Dockerfile multi-stage**, **Workbox**, `tsconfig.strict.json`, `CODE_OF_CONDUCT.md`, `HERMES.md`, Storybook | CHANGELOG, CONTRIBUTING, AI_RULES, HANDOFF | arquivos/deps ausentes; scripts `storybook` órfãos em `package.json:43-44` | A12 |
| N-52 | Edge `simular-regimes`, contrato `fetch_external_report` em `external-data`, `migrate-helper` | RUNBOOK, TECHNICAL_AUDIT_RESILIENCE | não existem (o último removido de propósito) | A6, A9 |
| N-53 | **Revisão obrigatória** em PR, linear history, SHA pinning, rulesets | PLANO_MELHORIAS 35, PLANO_WORKFLOWS | `github-settings-baseline.json:12` `required_approving_review_count: 0`; `allowed_actions: all`, rulesets 0, repo público | A5, A6 |
| N-54 | Testes para `conciliacao-ia`, `categorizar-despesa`, `detectar-anomalias-financeiras`, `calculo-iva`, `prever-carga-tributaria`, `processar-fila-cobrancas`, `bling-proxy`, `nfe-upload-certificado` | PLANO_MELHORIAS 39/41/42/43 | pastas só com `index.ts` | A5 |
| N-55 | 13 docs/scripts prometidos pelo plano de migração (`docs/migracao/ORDEM.md`, `RETRO.md`, `smoke.md`, `webhooks.md`, `scripts/db-diff/`, `probe-functions.sh`, `check-migration-name.sh`, `_archive/`…), migrations E30–E42 (`20260826060000…120000`), `tipo_cobranca 'cartao'` | PLANO-CORRECOES-100, PLANO-CORRECAO-60 | arquivos inexistentes; marcadores sem DDL em `20260825200000`/`20260826030000` | A8 |
| N-56 | Catálogo das 180 rotinas SQL, validação dos 158 triggers, `VALIDATE CONSTRAINT faixas_simples_reparticao_soma_chk`, REVOKE TRUNCATE de `authenticated`, `supabase/seed.sql`, orçamento de bundle | planos arquivados | sem artefato; constraint `NOT VALID` em `20260825250000:49`; `db:seed` aponta para arquivo ausente | A9 |
| N-57 | Drawer mobile como diálogo acessível (role, focus trap, Escape), metadados `og:` próprios, canonical | PLANO_AUDITORIA_FRONTEND_CONTRATOS | `MobileSidebarDrawer.tsx` sem `role="dialog"`; `index.html:27,30` ainda promobrindes/lovable | A9 |
| N-58 | Nonce anti-replay em webhooks, taxonomia 400×422, sunset v1, manifesto endpoint/schema/teste | PLANO_AUDITORIA_FRONTEND_CONTRATOS | `_shared/webhook-auth.ts` sem timestamp/nonce; 19 handlers em 400 | A9 |

## 3. Funcionalidades PARCIAIS: existem, mas simuladas, desligadas, sem backend ou pela metade

| # | Funcionalidade | O que existe | O que falta | Evidência | Anexo |
|---|---|---|---|---|---|
| S-01 | **Emissão, cancelamento, inutilização e contingência de NF-e (SEFAZ própria)** | formulários completos; emissão/cancelamento reais só via Bling (`bling-proxy criar_nfe/enviar_nfe_sefaz/cancelar_nfe`) | integração SEFAZ homologada; decisão/ADR (nenhum ADR sobre NF-e) | `NovaNFeForm.tsx:82-86`, `CancelamentoNFe.tsx:75-82`, `InutilizacaoNFe.tsx:88`, `ContingenciaNFe.tsx:113,174` "integração SEFAZ ainda precisa ser homologada"; `grep -rl "enviNFe\|nfeAutorizacao" supabase/functions` → 0 | A1, A3, A9, A11 |
| S-02 | **Monitor SEFAZ, analytics e alertas de rejeição** | telas | fonte real: `checkSefazHealth` devolve `online: null` (`sefaz-contingency/state.ts:107-134`); `SefazAnalytics.tsx` sem fonte de dados; contingência em `localStorage` | A1, A3 |
| S-03 | **Simulador SEFAZ** (`src/lib/sefaz-simulator/handlers.ts` com `Math.random`) | ainda no repo (só como tipo) | remover ou isolar | A3, A9 |
| S-04 | **EXPERT Agent "15 tools"** | 15 ações `[ACTION]` por convenção textual no prompt (`expert-agent/index.ts:34-79`) parseadas em `useExpertActions.ts` | tool-calling nativo; e a chave de IA em produção (§P-01) | A1, A3 |
| S-05 | **Copilot global SSE** | resposta em "stream simulado em uma única mensagem" (`copilot-global/index.ts:286`) | streaming real | A9 |
| S-06 | **WhatsApp IA proativo / cobrança automatizada** | gera link `wa.me` e grava `historico_cobranca_whatsapp` `status:'gerado'` | envio real (provedor), persistência das credenciais (`WhatsAppConfigPanel.tsx:12-13` só `useState`) | `whatsapp-ia-proativo/index.ts:497-498,672-700` | A3, §P-12 |
| S-07 | **Régua de cobrança** | e-mail via Resend; WhatsApp = link; SMS inexistente; cron SQL diário falha (§P-04); `execucoes_regua_cobranca = 0` em prod | canais reais e cron funcional | A1, A3, §P |
| S-08 | **Fila de cobranças** | botão e edge | RPC `processar_fila_cobrancas` não existe em produção (§P-06) | §P |
| S-09 | **Benchmarking setorial** (dashboard/BI) | painel | dados de mercado e 2 indicadores da empresa **hardcoded** (`BenchmarkingSetorial.tsx:20-29,129,137`); `comparar-benchmark-setorial` usa faixas internas porque `benchmarks_setoriais` está vazia | A11 |
| S-10 | **Prévia de regras de conciliação** | painel | `mockExtrato` fixo (`RegrasConciliacaoPanel.tsx:86-110`) | A11, A4 |
| S-11 | **Status page pública** | rota `/status` consumindo `health` | `uptime90d: 99.98`, `latencyMs`, `incidents24h: 0` fixos (`StatusPage.tsx:36-38`) | A4 |
| S-12 | **Web Push** | helpers VAPID | envio real: `send-push-notification/index.ts:122-129` "fallback" POST cru sem cifra | A4 |
| S-13 | **E-mails transacionais** (alertas, digests, convites, relatório de anomalias) | código Resend | modo "simulado" se `RESEND_API_KEY` ausente (`enviar-alerta-email/index.ts:51-69`, `relatorio-diario-anomalias:231-237`, `enviar-digest-conformidade:319-414`, `enviar-convite-organizacao:167`); `RESEND_API_KEY` **existe** em produção | A11 |
| S-14 | **Relatórios agendados** (financeiros) | `executar-relatorios` gera JSON em `historico_relatorios` | e-mail, PDF/Excel, cron (só tributário envia e-mail, e sem cron) | A3, §P-03 |
| S-15 | **Baixa automática por extrato** | dialog | grava `conta_bancaria_id: ''`, engole falhas (`BaixaAutomaticaDialog.tsx:149-192`) | A10 #5 |
| S-16 | **Conciliação automática** | fluxo | conta/marca como conciliada antes de persistir (`conciliacao-page-helpers.ts:240-255`) | A10 #16 |
| S-17 | **Cobrança Asaas** | criação e registro local corrigidos (#424/#441) | `asaas-webhook/index.ts:107` evento sem linha local marcado processado; sem teste de `criar_cobranca`; e `ASAAS_API_KEY` ausente em prod (§P-02) | A10 #4 |
| S-18 | **DRE tributária** | edge | `gerar-dre-tributaria/index.ts:58` descarta `error` → falha vira "sem faturamento"; não há tabela `dre_tributaria` | A10 #11, A1 |
| S-19 | **Obrigações acessórias no dashboard da Reforma** | componente | tudo "atrasado", 0%, botões sem handler; `routeMap` sem `obrigacoes` (`DashboardReformaTributaria.tsx:57-70,208`) — a página `/tributario/obrigacoes` funciona | A10 #7 |
| S-20 | **Relatórios tributários agendados, alertas tributários, SLO diário** | edges | nenhum invocador/cron (repo e produção); painéis afirmam "roda às 06:00"/"23:55" (`CronJobsStatus.tsx:155`, `SLOPanel.tsx:99`) | A10 #8/#9/#17, §P-03 |
| S-21 | **Health Score, anomalias, ações recomendadas, resumo semanal, benchmark** | edges + botões manuais | sem cron em produção; tabelas com 0–4 linhas | §P-03 |
| S-22 | **Análise preditiva agendada** (`executar-analise-preditiva`) | edge | sem invocador | A11, §P |
| S-23 | **DF-e SEFAZ** (`sefaz-dfe-dispatcher` → `sefaz-dfe-puxar`) | cron em prod (15 min) | `empresas_certificados = 0` em prod → nada a baixar; cron criado fora de migration | §P-09/P-11 |
| S-24 | **Bitrix24** | sync inbound de contatos/empresas; outbound só status de pagamento | handler do webhook é `async () => undefined` (`bitrix24-webhook/index.ts:161-164`); sem escrita de clientes; credenciais ausentes em prod; `bitrix_oauth_tokens = 0` | A3, §P-02 |
| S-25 | **Bling** | proxy/webhook completos | credenciais ausentes em prod; `bling_tokens = 0`; "webhooks de extrato" são de pedidos/estoque | A1, §P-02 |
| S-26 | **Consulta CNPJ** (onboarding) | RPC restaurada (#438) | `CNPJA_API_KEY` ausente em prod → 500 | §P-02 |
| S-27 | **Contabilidade dupla** | motor + triggers | sem `UNIQUE (origem, origem_id)` em `lancamentos_contabeis` (J2); idempotência sem `empresa_id` (`contabilizar-evento/index.ts:99-104`); `gerar_lancamento_contabil_automatico` SECURITY DEFINER sem `search_path` ainda em prod | A4, §P-17 |
| S-28 | **Consolidação multi-empresa** | "Consolidado (Todas)" = soma simples; `EmpresaScopeContext.tsx:136` ainda `ids[0]` | eliminações intercompany; agregação real | A4, A5 |
| S-29 | **Ordem de compra** | criar/listar | aprovar/rejeitar, recebimento, vínculo com contas a pagar | A4 |
| S-30 | **Custom fields, i18n, timezone por usuário, SoD, audit log imutável, DR, SLA, OLAP, DW, sandbox, workflow builder** | parcial | ver A4 (24 gaps PARCIAIS) | A4 |
| S-31 | **Papéis por empresa (ADR-003)** | `user_empresas.role` existe | ADR "proposto"; 7/9 edges mantêm desvio `has_role('admin')`; 261 policies com `has_role(auth.uid(),'admin')` | A3 |
| S-32 | **Protestos/negativações** | CRUD manual | integração SERASA/cartório | A1 |
| S-33 | **Importação CSV/Excel genérica** (`DataImporter`) | importadores específicos (OFX/CSV extrato, plano de contas, SPED) | wizard genérico | A1 |
| S-34 | **PER/DCOMP, auditoria tributária, importação XML, elisão** | CRUD/parsers no front | edges prometidas; SPED Fiscal | A1 |
| S-35 | **Modo consolidado, acordos de parcelamento (fire-and-forget), queryKeys com empresaId** | parciais | ver A5 (15 etapas PARCIAIS) | A5 |
| S-36 | **Zod em 100% das edges / zod v4** | gate aceita baseline 3 (`scim-server`, `sso-callback`, `sso-logout`); 44 edges em `deno.land/x/zod@v3.22.4` | cobrir 3 funções; migrar v3→v4 | A4, A12 |
| S-37 | **Gates de banco no CI** | 4 gates | condicionais a `DATABASE_URL` com `--mode summary`: passam verde sem rodar (`ci.yml:305,313-371`) | A6, A9 |
| S-38 | **`lint:strict` e Vitest 1× no CI** (marcadas ✅) | CI roda `bun run lint` (`ci.yml:296`) e Vitest 2× (`:445,457`) | gate `lint:strict` | A6 |
| S-39 | **CSP** | enforce | `unsafe-eval`, `img-src https:`, sem nonce, sem `report-to`, origens `lovable.*` (`vercel.json`) | A10 |
| S-40 | **Backup/PITR/restore** | runbook | "Restore testado: NÃO", PITR "a confirmar" (`docs/SECURITY.md:28-38`) | A10, A9 |
| S-41 | **Health check** | edge | ainda usa `SUPABASE_SERVICE_ROLE_KEY` e pinga Asaas/Bling no probe público (CHANGELOG diz removido); realtime copia status do DB (`health/index.ts:30,69,105`) | A12, A9 |
| S-42 | **Testes Deno no CI** | `deno-tests.yml` | unit-tests roda diretório inteiro (`deno-tests.yml:124-129`), inclusive `contract-coverage_test.ts`; só lint/check usam lista fixa | A9 |
| S-43 | **Drift repo × produção** | 1045 migrations aplicadas | 272 colunas só em prod (17 versionadas), tipos 0, replay não roda em CI, `supabase-js@2.49.4` em 98 edges | A8, A9 |
| S-44 | **RLS** | hardened | `fornecedores` sem RLS por `empresa_id` (policies `owner_*`); `creditos_tributarios` com policy ALL filtrando por `empresa_id` ativa/admin mas sem restrição por papel — lacuna de autorização, não de isolamento (`20260825230000_initplan_rls_e67.sql:254-258`, reforçada por `empresa_acessivel` em `20260902240000_fix_rls_gaps_pos_pr54.sql:95-131`); anon pode inserir em `frontend_error_logs` | A9, A10, A4, §P-17 |
| S-45 | **Auth das edges** | guards revisados | `validate-ip-geo` pré-login com service_role (por desenho, com rate-limit); `scim-server` protegido por Bearer próprio (`scim_tokens` hash + ativo + expiração, `index.ts:1047-1064`) — não é gap; 6 P1 (`gerar-alertas-dispatcher`, 5 cron-inline); `monitorar-erros-frontend` config × código divergentes | A6 |
| S-46 | **Reset de senha com aprovação, lockout, dispositivos, IP/Geo** | existem | tabelas `geo_blocks`, `ip_whitelist`, `user_devices` sem tela/edge; docs citam tabelas dropadas (`account_lockouts`, `known_devices`) | A1, A11 |
| S-47 | **Menu lateral por papel** | `requiredRoles` só em `navigation.ts` | `SidebarNavGroups.tsx` não filtra (`grep requiredRoles` → 0) | A4 |
| S-48 | **Dashboard**: painéis duplicados grid+lateral, tamanhos P/M iguais, config em localStorage | — | decisão de produto | A4 |
| S-49 | **`/inteligencia`** | HealthScore + Ações | falta `AnomaliasDetectadasPanel` por empresa; "meus resumos" filtra por empresa, não por usuário; sem `/relatorios/agendados` nem histórico de envios tributários | A2 |
| S-50 | **Restyle Vela Dark** | tokens/keyframes/variants | `--ch1..5` usados em `chartColors.ts` e não definidos em `index.css`; `ui/chart.tsx` não tematizado; `Outfit` ainda carregada; rota legada `/design-system-debug` ativa; deps mortas `next-themes`/`ogl`; nomenclatura "Quantum-Sentinel" pendente de decisão; 177 hex em `src/` | A12 |

## 4. Planos de etapas: o que ficou por executar

Contagens por plano (detalhe etapa a etapa nos anexos). "N/V" = não verificável sem banco/painel.

| Plano | Etapas | Feitas | Parciais | Não feitas | Marcadas feitas, não encontradas | N/V | Anexo |
|---|---:|---:|---:|---:|---:|---:|---|
| `PLANO_MELHORIAS_50_ETAPAS_2026-09-13` | 50 | 32 | 15 | 3 (35 revisão obrigatória, 42 testes IA, 50 deriva do AGENTS.md) | 0 | 0 | A5 |
| `REVISAO_PLANO_IMPLEMENTACOES_2026-09-12` — matriz 100 | 100 | 20 | 42 | 7 (016, 017, 042, 045 `webhook-financeiro`, 076 `lint:strict`, 086, 100) | 0 | 31 | A5 |
| idem — C50 / G50 / F100 | 50 / 50 / 100 | 7 / 38 / 27 | 23 / 8 / 58 | 5 / 2 / 8 | 0 | 15 / 2 / 7 | A5 |
| `PLANO_WORKFLOWS_100_ETAPAS_2026-09-27` | 100 | 40 | 26 | 30 | 2 (25 Vitest 1×, 46 `lint:strict`) | 2 | A6 |
| `GRAPHIFY_PLANO_50_ETAPAS` | 50 | 36 | 3 | 11 | 0 | 0 | A6 |
| `execucao-cline/INDICE` (100) | 100 | 10 verificáveis | — | 4 | — | 78 "pendente" no próprio índice | A6 |
| `PLANO_AUDITORIA_FINANCEIRA_100_ETAPAS` + STATUS 17/11 | — | ver §7 | | | | | A7 |
| `AUDITORIA_PLANEJADO_X_EXECUTADO_2026-10-12` | — | ver §7 | | | | | A7 |
| `migracao/PLANO-CORRECOES-100-ETAPAS` | 100 | 23 | 31 | 15 | 0 (+4 divergentes) | 27 | A8 |
| `migracao/PLANO-CORRECAO-60-ETAPAS` | 60 | 10 | 15 | 13 | 1 (+1 divergente) | 20 | A8 |
| `archive/AUDITORIA_EXAUSTIVA_PLANO_100_ETAPAS_2026-08-26` | 100 | 36 | 33 | 10 | 0 | 21 | A9 |
| `archive/PLANO_CORRECAO_MELHORIAS_50_ETAPAS` | 50 | 14 | 17 | 6 | 0 | 13 | A9 |
| `archive/PLANO_AUDITORIA_FRONTEND_CONTRATOS_100_ETAPAS` | 100 | 31 | 27 | 16 | 3 | 23 | A9 |
| `archive/HANDOFF_CLINE` | 13 | 5 | 6 | 1 | 1 | 0 | A9 |
| raiz `PLANO_100.md` / `AUDITORIA.md` | 43 | 30 | 6 | 3 (E-026 gates CI, E-028 PITR, E-039 supabase-js) | 0 | 1 | A9 |
| raiz `PLANO_50.md` | 50 | 29 | 14 | 4 | 0 | 3 | A9 |
| `PLANO_EXCELENCIA_10_10` | 18 | 12 | 4 (#1 `any`, #3 TODOs, #7 Zod baseline 3, #13 bundle) | 0 | 0 | 2 | A4 |
| `prod-readiness` (pendências de 14/11) | 44 | 21 | 2 | 13 | 5 divergentes | 6 | A4 |
| `GAPS_ENTERPRISE` roadmap P16→P25 | 21 | 4 | 9 | 8 | 0 | 0 | A4 |
| `FUNCIONALIDADES_SEM_UI` roadmap P16 | 9 | 6 | 3 | 0 | 0 | 0 | A2 |
| `PENDENCIAS.md` (raiz) | 13 | 3 | 2 | 2 | 0 | 6 | A12 |
| `archive/mapa-integracao-20261112` | 64 | 27 (+9 superados) | 2 | 7 (recharts 3, vitest 5, supabase-js Edge, guard views, open-finance) | 1 (PR #131 "não mesclar" foi mergeada) | 18 | A9 |

**Pendências que se repetem em 3 ou mais planos (prioridade natural):**
1. Gates de banco do CI condicionais a `DATABASE_URL` (`ci.yml:313,328,347,408,415`): passam sem rodar — 6 planos.
2. `@supabase/supabase-js@2.49.4` em 98 Edge Functions — 5 planos.
3. Documentação obsoleta (catálogo "87 funções", CHANGELOG 2025, CONTRIBUTING npm, ARCHITECTURE `src/services`/`orquestrador-elisao`, TESTING 80% vs gate 66%) — 5 planos.
4. Open Finance sem provedor — 4 planos.
5. Decisão NF-e (homologar SEFAZ própria × usar Bling × demonstração), sem ADR — 4 planos.
6. `deno coverage` com piso e trava ausentes (unit-tests já cobre o diretório inteiro) — 3 planos.
7. Backup/PITR nunca confirmado nem restore testado — 3 planos.
8. `fornecedores` sem RLS por `empresa_id` — 2 planos + auditoria.
9. Constraint `faixas_simples_reparticao_soma_chk` `NOT VALID` — 2 planos.
10. Chave anon literal em `supabase/migrations/20260905130000:23` — 3 planos.

## 5. Código órfão (existe, nada usa)

| Tipo | Itens | Evidência | Anexo |
|---|---|---|---|
| Edge Functions sem invocador (front, edge, SQL ou cron, repo e produção) | `calcular-slo-metrics-diario`, `enviar-relatorios-tributarios-agendados`, `relatorio-diario-anomalias`, `executar-analise-preditiva`, `gerar-alertas-dispatcher`, `sync-profile-to-bitrix`, `n8n-dispatch`, `get-mapbox-token`, `calculo-iva`, `projecao-reforma`, `simular-simples`, `simular-presumido`, `simular-real` (os 5 últimos são cópias mortas do motor que roda no navegador) | `edge-functions.json` `orfa=true`/sem chamadores; `grep -rl` por nome em `src/`, `functions/`, `migrations/` → 0; todas implantadas ACTIVE em produção | A11, §P-08 |
| Hooks | `useGlobalFilterSync.ts` (só teste; e só emite toast) | 231 hooks verificados | A11 |
| Componentes de negócio sem importador | `BitrixWebhookPanel` (único leitor de `bitrix_webhook_events`), `SefazStatusPanel`, `FiscalHealthBadge`, `SpedEcdDownloadStep`, `KPIComparativo`, `tributario/pf/ResultadoPf`, `EmpresaSwitcher`, `EmpresaActionPicker`, `PermissionGate.hoc`, `RechartsExample` + 31–33 arquivos do kit `ui/` | `componentes.json` `orfao=true` + grep de importadores | A11, §P-14 |
| Tabelas sem nenhum consumidor (nem app nem SQL) | `alerts_sent`, `bitrix24_stage_mappings`, `bitrix24_tokens`, `custom_field_values`, `email_verifications`, `mfa_sessions`, `operacoes_icms`, `projecoes_reforma`, `regras_duplicidade`, `regua_cobranca_etapas`, `risk_rules`, `security_audit_logs`, `simulacao_tributos_detalhados`, `user_passkeys`, `webauthn_challenges`, `webhook_events` | `banco.json` `nao_usada=true` + grep `.from('x')` → 0 + 0 DML em migrations | A11 §6a, §P-10 |
| Tabelas só com DML em SQL, invisíveis ao app | `alert_configurations`, `geo_blocks`, `ip_whitelist`, `user_devices`, `password_reset_tokens`, `regimes_tributarios`, `runtime_error_logs`, `acessos_suspeitos`, telemetria de banco (6), `catalogos_fiscais_cargas`, `catalogos_tributarios_health_history`, `cnpja_rate_limit`, `drivers` (+3 filhas, módulo Lalamove que o ADR-001 manda não recuperar e ainda está em produção), `estrategias_elisao`, `frontend_error_silence_digest_log`, `retencao_politicas`, `sessoes_conciliacao`, `simulacoes` | A11 §6b | A11 |
| Dependências/scripts mortos | `next-themes`, `ogl`, `@dnd-kit/*` (sem uso), scripts `storybook`/`build-storybook`, `db:seed` (sem `seed.sql`), `usePrefetchRoutes.ts` + `.tsx` duplicados, `src/components/ui/resizable.tsx` stub | `package.json`, `ls src/hooks \| uniq -d` | A12, A9, A11 |
| Secret consumido só por código morto | `MAPBOX_ACCESS_TOKEN` (apenas `get-mapbox-token`, órfã) | A11 | A11 |

## 6. Documentação que descreve um sistema diferente do real (resumo)

Não é "não implementado", mas engana quem planeja: nomes de arquivos, tabelas, hooks e números errados. Detalhe item a item nos anexos A1, A2, A3, A6, A8, A10, A12.

- **Nomes errados em `FUNCIONALIDADES_SISTEMA.md`:** 33 linhas (ex.: `useAuditLog`→`useLogAudit`, `useScoreCliente`→`useScoringClientes`, `useFavorites`→`useRecentItems`, `transferencias_bancarias`→`transferencias`, `conciliacao_itens`→`conciliacoes_parciais`, `aprovacoes`→`solicitacoes_aprovacao`, `enviar-push-notification`→`send-push-notification`, `previsao-tributaria-ia`→`prever-carga-tributaria`, `pages/Privacidade.tsx`→`CentroPrivacidadeLGPD.tsx`, `pages/SystemHealth.tsx`→`AdminSystemHealth.tsx`); métricas do cabeçalho (54 páginas/51 edges/102 migrations/1.012 testes) contra 130 rotas/106 edges/1048 migrations/≈2.700 testes; "Lovable Cloud", "Vite 5", "Abril 2026".
- **Tabelas dropadas ainda citadas:** `account_lockouts`, `known_devices`, `obrigacoes_acessorias`, `entity_versions` (dropadas em `20261117190000`); `dre_tributaria`, `aprovacao_observadores`, `cobrancas`, `nfe_vinculo`, `metricas_aprendizado_ia` nunca existiram.
- **Papéis:** docs dizem 4 (ou 5) papéis; enum `app_role` tem 8 (`admin, manager, operator, viewer, financeiro, operacional, visualizador, contador`).
- **Stack:** AGENTS.md, AI_RULES, HANDOFF, INVENTARIO_REPOSITORIO citam React 18 / Vite 5-6 / Router 6 / `next-themes`; real: React 19.3, Vite 8.3, Router 7.18, `ThemeContext` próprio. AGENTS.md: "105 Edge Functions" (106), "meta 2689 testes" (≈2.700 em 282 arquivos), "auto-sync N8N em 15 min" sem artefato.
- **Catálogos e matrizes defasados:** `EDGE_FUNCTIONS_CATALOG.md` (87 de 106), `MATRIZ_AUTH_EDGE` (verify_jwt 4/99 vs 54/52 reais; 50 funções mudaram), `MATRIZ_PAPEIS` (7 tabelas com nome errado; rotas em `adminRoutes.tsx`, não `App.tsx`), `docs/agentes/github-ci.md` (diz que settings-guard não existe; 14 workflows vs 19), `RUNBOOK.md` (stack Lovable, 87 fns, 356 migrations, `simular-regimes`), `MIGRATION_CHECKLIST`/`MIGRATIONS_ADR`/`DB_HEALTH` (356/1034 vs 1048), `REMOTE_ONLY_MIGRATIONS_STRATEGY` (as 5 "só remotas" estão no repo; `20260827102000` citada não existe), `adr/0001` "Aceito" mas superado pelas reconciliações de nov/2026 (catálogo de elisão, partições, matview) sem ADR novo.
- **Docs de outro projeto/placeholder:** `docs/testing-architecture.md` intitulado "Freight Quest"; `GETTING-STARTED` com 3 links YouTube `...`; `SECURITY.md` "PGP Key: [link]"; `CONTRIBUTING` com URLs `seu-usuario/promo-finance`, Node 20/npm e fluxo fork que contradiz o AGENTS.md; `index.html` com `og:url promobrindes.com.br` e `og:image lovable.dev`.
- **CHANGELOG `[Unreleased]`:** 2 itens marcados feitos e inexistentes (`health` reduzido a liveness; Dockerfile), Workbox e `tsconfig.strict.json` que não existem, caminho errado de `AUDITORIA_..._R2_LIVE.md`, números 105/571.
- **Inventário de trabalho inacabado (17/11):** 17/17 achados sem status atualizado no documento, embora 5 tenham sido resolvidos por PRs #423/#424/#425/#438/#451.
- **Docs na raiz que deveriam ter ido para `docs/`:** `EXECAO_RESTYLE_METRONIC_V9`, `EXECAO_VELA_DARK`, `HANDOFF_VELA_DARK`, `RELATORIO_ACEITE_VELA_DARK`, `PENDENCIAS`, `RELATORIO_CI`, `RELATORIO_IMPLEMENTACAO_EXAUSTIVO`, `PLANO_50/100`, `AUDITORIA`, `ESTADO_ATUAL` (as próprias exceções previam a mudança).

## P. Repositório × produção (snapshot do banco oficial `bwwbeyolnnzppeuhgkcd`, branch `contexto`, coleta 2026-11-20 02:21Z)

Fonte: `git show origin/contexto:docs/contexto/supabase/{cron.md,cron-runs.md,edge-functions.md,vault.md,tables.md,functions.md,stats.md,lints.md,policies.md,migrations.md}` e `docs/contexto/codigo/{edge-functions.json,banco.json,componentes.json}`. Comparações feitas nesta sessão por `comm`/`jq`/`grep` (comandos no texto).

| # | Item | Status | Evidência | Efeito no negócio |
|---|---|---|---|---|
| P-01 | Chave da IA (`LOVABLE_API_KEY`) ausente nos secrets de Edge em produção | NÃO CONFIGURADO (NÃO VERIFICADO em runtime) | Lista de 31 secrets em `edge-functions.md` §Secrets não contém `LOVABLE_API_KEY`; 18 funções fazem `Deno.env.get('LOVABLE_API_KEY')` e lançam erro sem ela (`supabase/functions/expert-agent/index.ts:148-151`, `conciliacao-ia/index.ts:141`) | Expert/Copilot, conciliação IA, OCR de NF, categorização, análise preditiva, resumo semanal, health score, ações recomendadas, decidir regime, convite de contador e WhatsApp IA falham em produção |
| P-02 | Secrets de integrações ausentes em produção: `ASAAS_API_KEY`, `BLING_CLIENT_ID/SECRET`, `BITRIX24_DOMAIN/ACCESS_TOKEN/CLIENT_ID`, `CNPJA_API_KEY`, `OPENAI_API_KEY`, `OPEN_FINANCE_CLIENT_ID`, `MAPBOX_ACCESS_TOKEN`, `SLACK_WEBHOOK_URL` | NÃO CONFIGURADO | Mesma lista de secrets; consumidores: `asaas-proxy/index.ts:169`, `bling-proxy/index.ts:704-773` (retorna "não configurados"), `bitrix24-sync/index.ts:37,68`, `cnpja-lookup/index.ts:215-217` (500 "CNPJA_API_KEY não configurada"), `whatsapp-ai-analyzer/index.ts:48`, `monitor-health`/`monitorar-erros-frontend`/`digest-silenciamentos-erro` (Slack). Vault tem só `integration_secret_asaas`/`integration_secret_bling` (não lidos por essas funções) | Asaas, Bling, Bitrix24, consulta CNPJ, análise IA de WhatsApp e alertas Slack não operam em produção; `stats.md`: `bling_tokens = 0`, `bitrix_oauth_tokens = 0`, `asaas_payments = 0`, `open_finance_consents = 0` |
| P-03 | Automações descritas como cron sem job em produção | NÃO IMPLEMENTADO | `cron.md` tem 32 jobs; nenhum invoca `calcular-health-score-operacional`, `detectar-anomalias-financeiras`, `gerar-resumo-executivo-semanal`, `gerar-acoes-recomendadas`, `benchmarking-setorial`/`comparar-benchmark-setorial`, `calcular-slo-metrics-diario`, `gerar-alertas-tributarios`, `enviar-relatorios-tributarios-agendados`, `executar-analise-preditiva`, `executar-relatorios`, `gerar-resumo-financeiro-diario`, `relatorio-diario-anomalias`, `executar-fechamento-tributario`, `processar-fila-cobrancas`, `gerar-alertas-dispatcher`. `edge-functions.json`: `chamada_por_sql_ou_cron=false` para todas | Anomalias, health score, resumo semanal, ações recomendadas, SLO, alertas e relatórios tributários agendados, relatórios agendados e análise preditiva só rodam se alguém clicar; `stats.md`: `anomalias_detectadas = 0`, `acoes_recomendadas = 0`, `resumos_executivos_semanais = 0`, `slo_metrics_diarias = 0`, `health_scores_operacionais = 4` |
| P-04 | Job `processar-regua-cobranca-diario` (09:00) falha todo dia | QUEBRADO EM PRODUÇÃO | `cron-runs.md` job 24: 17, 18 e 19/11 `failed` — `ERROR: Sem permissão para esta empresa … processar_regua_cobranca(uuid,boolean) line 6` (função exige usuário com empresa; cron roda como `postgres`) | Régua de cobrança via SQL nunca executa; só o job 2 (`invocar_regua_cobranca` → edge) roda, e `execucoes_regua_cobranca = 0` em `stats.md` |
| P-05 | Job `enviar-digest-conformidade-diario` (08:00) é placeholder descontinuado | OK | `cron.md` job 43: comando `SELECT 1`; a migration `20260726180529_06dcfab8*.sql:1-8` o desativou e moveu o envio para o job horário (`enviar-digest-conformidade-horario`, job 42), que respeita a frequência em `user_digest_preferences` (`enviar-digest-conformidade/index.ts:248-275`) e executa `succeeded` de hora em hora | O job diário é resíduo inofensivo; o digest é enviado pelo job horário conforme a preferência de frequência |
| P-06 | Fila de cobranças: RPC inexistente em produção | QUEBRADO EM PRODUÇÃO | `supabase/functions/processar-fila-cobrancas/index.ts:31` chama `supabase.rpc('processar_fila_cobrancas')`; `git ls-tree origin/contexto:docs/contexto/supabase/functions/public/ \| grep fila` → vazio; `functions.md` 0 ocorrências; definida só em `supabase/migrations/20260317001356_*.sql` (migration marcada aplicada, função ausente) | Botão "processar fila" em `src/hooks/useReguaCobranca.ts:157` falha; `fila_cobrancas` nunca drena |
| P-07 | Tabelas lidas pelo código que não existem em produção | QUEBRADO | `banco.json.tabelas_usadas_no_codigo_sem_definicao = ["relatorios_tributarios"]`; `tables.md` não contém `relatorios_tributarios`; `supabase/functions/executar-fechamento-tributario/index.ts:31` lê `relatorios_tributarios` (o `companies` do `banco.json` é consultado via cliente externo em `supabase/functions/external-data/index.ts:239`, dentro do escopo `EXTERNAL_SUPABASE_*`, fora do schema financeiro) | Fechamento tributário grava/lê tabela inexistente |
| P-08 | 12 Edge Functions implantadas e ativas sem nenhum invocador (front, edge, SQL ou cron) | ÓRFÃS | `edge-functions.json` `orfa=true`: `calcular-slo-metrics-diario`, `calculo-iva`, `enviar-relatorios-tributarios-agendados`, `gerar-snapshots-conformidade`*, `get-mapbox-token`, `n8n-dispatch`, `projecao-reforma`, `relatorio-diario-anomalias`, `simular-presumido`, `simular-real`, `simular-simples`, `sync-profile-to-bitrix` (*tem cron em prod criado fora de migration, job 40) | Código mantido e implantado (versões 111–118) sem efeito para o usuário |
| P-09 | Cron jobs de produção criados fora das migrations | DRIFT | `cron.md` 32 jobs × `banco.json.cron_jobs` 22 nomes: `sefaz-dfe-dispatcher-15min`, `webhook-retry-worker-1min`, `monitorar-erros-frontend`, `gerar-snapshots-conformidade-mensal`, `auditar-acessos-cross-tenant`, `detect-query-regressions-5min`, `cleanup-*`, `recarregar-seeds-fiscais-diario`, `snapshot-table-bloat-daily` não têm `cron.schedule` versionado; `refresh-benchmark-setorial-weekly` está versionado e não existe em prod | Replay/staging não reproduzem a automação real |
| P-10 | 48 tabelas de produção sem nenhum consumidor no código | SEM FUNCIONALIDADE (ver correção no Anexo/linha 297 e Frente 6: ~12 têm consumidor via RPC/cron — órfãs de fato ≈ 36) | `banco.json` `nao_usada=true` (excluídos nomes de teste/partições): `regras_duplicidade`, `workflow_aprovacoes`*, `regua_cobranca_etapas`, `custom_field_values`, `user_passkeys`, `webauthn_challenges`, `mfa_sessions`, `estrategias_elisao`, `elisao_regras_creditos`, `projecoes_reforma`, `simulacoes`, `risk_rules`, `geo_blocks`, `ip_whitelist`, `alert_configurations`, `alerts`, `alerts_sent`, `bitrix24_tokens`, `bitrix24_stage_mappings`, `bitrix24_activities`, `conciliacao_bancaria`, `sessoes_conciliacao`, `operacoes_icms`, `protocolos_st`, `regimes_tributarios`, `email_verifications`, `password_reset_tokens`, `security_audit_logs`, `runtime_error_logs`, `webhook_events`, `acessos_suspeitos`, `drivers`, `user_devices`, `simulacao_tributos_detalhados`, `catalogos_fiscais_cargas`, `catalogos_tributarios_health_history`, `retencao_politicas`, `frontend_error_silence_digest_log`, `index_usage_snapshots`, `indices_uso_excecoes`, `pg_stat_statements_baseline`, `bloat_snapshots`, `slow_query_alerts`, `rpc_observability_metrics`, `performance_alerts`, `cnpja_rate_limit`, `users`, `storage.objects` (*`workflow_aprovacoes` não existe em prod: 0 em `tables.md`) | Funcionalidades cujo esquema existe mas nada grava/lê pelo app (detalhe por tabela no Anexo A11 §6) |
| P-11 | Funcionalidades possivelmente nunca usadas em produção (tabelas com 0 linhas estimadas) | SEM USO (nÃO VERIFICADO — contagem estimada) | `stats.md` usa `c.reltuples` estimado (`scripts/supabase_snapshot/snapshot.py:903` `GREATEST(c.reltuples,0)`, coluna renderizada como `linhas (~)` em `:1694-1700`), não contagem real: `contratos`, `api_keys`, `scim_tokens`, `empresas_certificados`, `entregas_obrigacoes`, `fluxos_aprovacao_niveis`, `historico_cobranca_whatsapp`, `user_passkeys`, `custom_field_definitions`, `configuracoes_duplicidade`, `empresas`; valores reais exigem `COUNT(*)` ou ANLYZE | Conclusões de "nunca usadas" e "NF-e/DF-e impossíveis sem certificado" não sustentadas até obter contagem efetiva; manter como suspeita, não como fato |
| P-12 | Canal WhatsApp "IA proativa" não envia mensagem | PARCIAL (link manual) | `supabase/functions/whatsapp-ia-proativo/index.ts:497-498,672-700`: gera `https://wa.me/<numero>?text=` e grava `historico_cobranca_whatsapp` com `status: 'gerado'`; nenhuma chamada HTTP a provedor (Evolution/Meta); `executar-regua-cobranca/index.ts:183-189` delega a essa função | A régua "automática" por WhatsApp apenas produz links; ninguém recebe nada sem clique humano |
| P-13 | Canal SMS da régua de cobrança | NÃO IMPLEMENTADO | `executar-regua-cobranca/index.ts:191` → `Canal ${canal} sem provedor ou contato configurado`; front oferece SMS (`ReguaCobrancaConfig.tsx:30`, `EnviarCobrancaDialog.tsx:68` "em desenvolvimento") | Etapas de régua configuradas com SMS nunca disparam |
| P-14 | 39 componentes de produto sem importador | ÓRFÃOS | `componentes.json` `orfao=true`: inclui `integracoes/BitrixWebhookPanel.tsx`, `nfe/SefazStatusPanel.tsx`, `admin/FiscalHealthBadge.tsx`, `contabilidade/SpedEcdDownloadStep.tsx`, `reforma-tributaria/KPIComparativo.tsx`, `tributario/pf/ResultadoPf.tsx`, `layout/EmpresaSwitcher.tsx`, `empresa/EmpresaActionPicker.tsx` + 31 do kit `ui/` | Telas documentadas (ex.: painel de webhooks Bitrix no INVENTARIO) existem como código mas não aparecem em nenhuma rota |
| P-15 | Views e RPCs usadas pelo front | OK | 14 views de prod cobrem todas as `vw_*` referenciadas em `src/`; 53 RPCs chamadas pelo código, 52 existem em `functions.md` (exceção P-06) | — |
| P-16 | Migrations: repo × produção | OK | 1045 versões em `migrations.md` = 1045 arquivos com timestamp (+ `001/002/003`); `comm` sem diferença nos dois sentidos | Todas as migrations do repo constam como aplicadas; drift restante é de objetos criados fora de migration (P-09) e de funções não materializadas (P-06) |
| P-17 | Lints de produção | 1 ALTA | `lints.md`: `public.gerar_lancamento_contabil_automatico()` SECURITY DEFINER sem `SET search_path` (função que `prod-readiness` SEC-02 mandava dropar); 25 policies `USING (true)` restantes são catálogos fiscais de leitura, service_role e `frontend_error_anon_insert` (anon pode inserir em `frontend_error_logs`) | — |
| P-18 | Vercel (variáveis do front, domínio) | NÃO VERIFICÁVEL | `curl https://api.vercel.com/v9/projects` via proxy → 403 `invalidToken` | Checagem de `VITE_*` e do domínio `app.promo-finance.com` pendente |


## 7. Auditoria financeira e planejado × executado de 12/10 e 10/09 (frente A7)

Este anexo verificou se os cruzamentos *planejado × executado* feitos pela própria equipe em 12/10 e 10/09 continuam válidos hoje, ponto a ponto. É a frente mais granular (≈330 itens de negócio financeiro).

| Área | Novo (achado nesta rodada) | Persiste (apesar de PR que corrigiu parte) |
|---|---|---|
| **Boletos (Asaas)** | — | Insert local do boleto ainda quebra: `useBoletos.ts:109` grava `status:'gerado'`, e `chk_boletos_status` em produção só aceita `pendente/enviado/pago/vencido/cancelado` (`ctx:tables/public/boletos.md:68`). As colunas `asaas_id`/`external_provider` foram criadas (#424), mas o CHECK não foi ajustado: a cobrança nasce no Asaas e nunca é salva localmente. |
| **Régua de cobrança** | Cron 24 (`processar-regua-cobranca-diario`) **falha todo dia** desde 17/11 — "Sem permissão para esta empresa" (`cron-runs.md`). A função exige um `empresa_id` que o cron, rodando como `postgres`, não fornece. | Envio por WhatsApp continua sendo link `wa.me`, não envio real. |
| **Relatórios contábeis** | Razão/diário, DRE e balanço por competência, pré-validação do SPED e verificação de integrações comparam o literal `'D'/'C'` com o que o banco grava hoje (`debito`/`credito`), em `demonstrativos-competencia.ts:159`, `useRazaoDiarioData.ts:53`, `usePreValidacaoSped.ts:107`. O resultado é que esses relatórios somam **zero** mesmo com lançamentos reais no banco. | — |
| **Segurança** | Chaves de API do Asaas (`asaas_config`) podem ser lidas por **qualquer papel** vinculado à empresa, não só admin/financeiro. `executar-relatorios` roda sem filtro de empresa quando o relatório não tem `empresa_id`. `gerar_lancamento_contabil_automatico()` é SECURITY DEFINER sem `search_path` fixo (lint ALTA em produção). | — |
| **Gravações em colunas inexistentes** | — | `processar-nf-ocr`, `executar-analise-preditiva`, `calcular-health-score-operacional` (coluna `detalhes`) e `whatsapp-ai-analyzer` (coluna `ia_sentimento`) continuam tentando gravar em colunas que não existem em produção — essas chamadas falham silenciosamente ou com erro. |

**Funcionalidades de negócio pedidas explicitamente:**

| Funcionalidade | Existe? | Evidência |
|---|---|---|
| Quorum de aprovação (2–5 aprovadores) | **NÃO** | `aprovadores_obrigatorios` é salvo e nunca lido; a RPC de aprovação libera o pagamento com um único aprovador, sem checar quórum nem se quem aprova é diferente de quem pediu |
| Baixa automática via webhook Asaas | **NÃO** | o webhook grava `asaas_payments`/`asaas_transfers`, mas nenhum trigger baixa o título em `contas_receber` nem gera movimentação |
| Lançamento bancário (saldo) por operação | **PARCIAL** | só transferências entre contas geram movimentação de saldo; pagar, receber e conciliar não tocam `movimentacoes` |
| Motor anti-duplicidade | **SIM, com homologação pendente** | índices únicos criados pela PR #455 em contas a pagar/receber + tela de bloqueios; a configuração fina (fuzzy, tolerância) ainda não tem motor |

**Resultado do cruzamento planejado × executado desde as auditorias de 12/10 e 10/09:** aproximadamente **90 itens foram corrigidos** desde então (55 migrations do ledger aplicadas, 7 de 9 RPCs criadas, 18/18 views com `security_invoker`, policies sem filtro de empresa caindo de 47 para 12). Continuam pendentes **≈65 itens parciais** e **≈200 itens não feitos** — a maior parte é homologação de integrações nunca ativadas (Asaas, Bling, Bitrix24, Open Finance, SEFAZ de emissão) e funcionalidades de ciclo de vida de título (estorno, cancelamento com motivo, parcelamento, exportação real para XLSX/CNAB). Nenhum item que os documentos afirmam como "feito" foi encontrado ausente no código — a única divergência é a etapa do `REAUDITORIA_FINAL` sobre o ADR-003, marcada ✅ enquanto o documento da decisão continua "proposto".

*(Detalhe completo, item a item com evidência, no Anexo A7.)*

## 9. Refutação adversarial: o que foi corrigido

Cada um dos 123 achados mais relevantes das seções 2 e 3 (mais os de produção) passou por duas tentativas independentes de refutação (uma lendo só o código sob outro nome/pasta, outra cruzando histórico de commits e o snapshot de produção). Resultado: **2 achados eram falsos** (removidos abaixo), **17 foram rebaixados ou precisados** (o item existe mais do que o texto original dizia) e **78 ganharam uma correção de texto pequena** (linha, nome de arquivo ou contagem errados, mas a conclusão se manteve). A tabela cheia está no Anexo W.

### 9.1 Achados removidos (estavam errados)

| Era chamado de | Na verdade |
|---|---|
| "Testes Deno no CI usam lista fixa de 15–19 funções" | **Falso.** O job `unit-tests` do `deno-tests.yml:124-129` roda o diretório `supabase/functions/` inteiro (64 arquivos de teste, incluindo `contract-coverage_test.ts`); a lista fixa existe só para o passo de `deno lint`/type-check, não para a execução dos testes. |
| "Job `enviar-digest-conformidade-diario` (`SELECT 1`) é uma automação quebrada" | **Era um resíduo inofensivo.** A migration `20260726180529` desativou esse job de propósito e moveu o envio para o job horário (`enviar-digest-conformidade-horario`, job 42), que respeita a preferência de frequência de cada usuário e está `succeeded` de hora em hora. |

### 9.2 Achados precisados (existe mais do que o texto dizia)

| Item | O que o texto original não via |
|---|---|
| Split de Pix | Existe UI de split (Asaas) em `NovaCobrancaDialog.tsx:42-44,206-213`, mas a Edge Function `asaas-proxy` **descarta o campo** ao montar o payload (`index.ts:398-460`): o usuário configura o split e a cobrança é criada sem ele — é uma funcionalidade quebrada, não ausente. |
| Desconto progressivo em boletos | Existe desconto de uma faixa por antecipação (`asaas-proxy/index.ts:445-451` + UI em `NovaCobrancaDialog.tsx:36-40`). Falta só o escalonamento em múltiplas faixas. |
| Agendamento de pagamentos | Existe `pagamentos_recorrentes` com cron diário (`gerar-contas-recorrentes-diario`, ativo em produção) e UI em `/pagamentos-recorrentes`. O que falta é agendar um pagamento avulso para data futura, não recorrência. |
| "Análise de custos" (relatório) | Não existe como tipo de relatório agendado, mas existe como tela (`CentroCustosArvoreOrcadoVsRealizado`, orçado × realizado por centro de custo). |
| Alerta de saldo baixo | Além do aviso visual, há persistência em `alertas_preditivos` via `executar-analise-preditiva` (sob demanda) e um template de e-mail "ruptura" sem chamador. Falta o alerta por limiar configurável e o disparo automático. |
| Recebimento de NF-e (DF-e) | **Existe e roda em produção**: `sefaz-dfe-puxar`/`sefaz-dfe-dispatcher`/`sefaz-manifestar` ACTIVE, cron de 15 em 15 min funcionando, grava em `nfe_recebidas`/`nfe_eventos`. O que falta nesse domínio é estoque próprio, custeio, inventário e RFQ — não o recebimento de NF-e. |
| Fechamento de período contábil | Existe fechamento **tributário** mensal (`fechamentos_tributarios` + edge `executar-fechamento-tributario`, com dados em produção). Falta é o bloqueio de lançamentos contábeis em período fechado e o fechamento contábil geral (não tributário). |
| DCTF/PER-DCOMP | A exportação SPED de fato não gera os arquivos (`disponivel:false`), mas existe um módulo de **cadastro e acompanhamento** de pedidos PER/DCOMP (`usePerDcomp.ts`, tabela `per_dcomp`, `PerDcompPanel.tsx`). Falta só gerar o arquivo na exportação. |
| Botões "Download XML"/"DANFE" | No preview da NF-e, só "Download XML" e "Enviar e-mail" são falsos — o botão de DANFE do preview funciona (abre `DANFEGenerator`). Na lista de notas, os dois (XML e DANFE) são falsos, mas a aba Bling da mesma tela oferece download real. |
| Graphify (`graph.json`, CLI) | O pipeline existe sob outro nome: `.github/workflows/graphify.yml` roda no push para `main` e executa `scripts/graphify/run.py` com 5 scripts e matriz de 11 perfis; a CLI está fixada como `graphifyy==0.9.97` (nome com dois "y"). |
| Edges "duplicadas" do motor tributário | `simular-simples`, `simular-presumido` e `simular-real` estão `ACTIVE` em produção (não são lixo morto implantado por engano) — são cópias paralelas ao motor que roda no navegador, mas publicadas e vivas. |
| Revisão obrigatória em PR | Confirmado ausente, mas o **SHA pinning já é seguido na prática** em 100% das actions dos workflows, mesmo sem a regra exigir. |
| Testes para `conciliacao-ia`/`categorizar-despesa`/etc. | As pastas só têm `index.ts`, mas a cobertura existe em outro lugar: `analise-fluxo-ia/auth_test.ts` testa o handler de `categorizar-despesa`, e `src/lib/__tests__/edge-functions.security.test.ts` tem a asserção de auth de `processar-fila-cobrancas`. |
| Orçamento de bundle no CI | **Existe**: `.github/workflows/ci.yml:477-498` tem um gate de tamanho de bundle (THRESHOLD_KB=600 por chunk) que falha o CI. |
| Nonce/timestamp anti-replay em webhooks | Confirmado ausente em `webhook-auth.ts`, mas existe deduplicação anti-replay **por evento** (`processWithIdempotency`, usado nos 4 webhooks de entrada) — não é timestamp/janela, mas evita reprocessar o mesmo evento. O manifesto endpoint/schema/teste também já existe (`docs/contract-conformance.json`, PR #471). |
| Webhook Bitrix24 vazio | O *handler de eventos* (`bitrix24-webhook`) é mesmo um `async () => undefined`, mas o **sync por pull** (`bitrix24-sync`, ações `sync_contacts`/`sync_companies`) escreve clientes de verdade — só está inoperante por falta de credenciais, não por falta de código. |
| 48 tabelas "sem consumidor" | Pelo menos 12 têm consumidor real: 7 via RPC (`performance_alerts`, `cnpja_rate_limit`, `acessos_suspeitos`, `catalogos_tributarios_health_history`, `catalogos_fiscais_cargas`, `retencao_politicas`, `frontend_error_silence_digest_log`) e 5 alimentadas por cron todo dia em produção com dezenas de milhares de linhas (`slow_query_alerts` ~14,1 mil, `index_usage_snapshots` ~49,6 mil, `bloat_snapshots` ~21,6 mil). São "sem tela", não "sem uso" — a lista de órfãs de fato cai de 48 para ≈36. |

## 10. O que o código revela além dos documentos (3 varreduras independentes)

Três agentes releram o código do zero, sem olhar os achados já escritos, cruzando cron, secrets e canais de envio com o snapshot de produção. 104 itens no total (Anexo W, tabelas C6/C7/C8); os mais relevantes para decisão:

**Automações (cron) — 31 achados.** Além da régua (já citada), **3 jobs de produção são placeholder** e não fazem o que o nome promete: `integrity-invariants-hourly` (`run_integrity_cycle()` sempre devolve `status:'ok'` sem checar nada), `recarregar-seeds-fiscais-diario` (recarga "diária" de alíquotas por UF é um stub) e `enviar-digest-conformidade-diario` (item corrigido na seção 9.1, mas o job em si continua sendo `SELECT 1`). Dois jobs mensais (`gerar-snapshots-conformidade-mensal`, job 40) chamam Edge Functions com `verify_jwt` ligado sem enviar `Authorization` — risco real de 401 silencioso, não confirmado sem logs. A tela "Automações" do admin (`AutomacoesTab.tsx`) lista 6 automações `p13-*` (health score, anomalias, resumo semanal, benchmark, ações recomendadas, limpeza) que nunca tiveram job agendado — a tela sempre mostrará "nunca executado". A documentação (`FUNCIONALIDADES_SISTEMA.md`, `GAPS_ENTERPRISE.md`) afirma "6 Cron Jobs P13 ✅ ativos", o que é falso.

**Secrets ausentes em produção — 41 achados, 25 secrets confirmados ausentes.** A chave de IA (`LOVABLE_API_KEY`) derruba 13 funções com erro 500 direto (Copilot Global, Expert Agent, Copilot Tributário, análise preditiva, análise de documentos, análise de fluxo de caixa, categorização de despesa, insights de relatório, OCR de nota fiscal, ações recomendadas, resumo executivo semanal, benchmarking setorial) e degrada mais 3 sem quebrar (decidir regime, health score, WhatsApp proativo). `ASAAS_API_KEY`, as 4 credenciais do Bitrix24 e as 2 do Bling derrubam toda a integração correspondente. `CNPJA_API_KEY`, `OPENAI_API_KEY`, `MAPBOX_ACCESS_TOKEN` e `SLACK_WEBHOOK_URL` também estão ausentes. Observação de segurança (revisada no review): os 3 webhooks de entrada (Bling, Bitrix24, WhatsApp) são fail-closed via `webhook-auth.ts:140-148` (503 `secret_not_configured`) quando o segredo não existe — a ausência derruba a integração, mas não abre bypass de autenticação (confirmação do segredo em produção não verificada via tabela `integration_secrets`).

**Canais de envio — 32 achados.** Confirma e detalha o que as frentes de documentação já achavam, com um ponto novo importante: a régua de cobrança e a fila de cobranças **marcam WhatsApp como "enviado"** mesmo sem nenhuma entrega real (`whatsapp-ia-proativo` responde 200 com um link, e quem chama trata 200 como sucesso) — é um falso positivo de entrega, não apenas um canal fraco. O simulador de webhooks (`webhook-simulator`) está publicado e pode injetar eventos fabricados de pagamento no fluxo real do Asaas/Bling se usado incorretamente em produção. O simulador antigo da SEFAZ (`Math.random`) ainda está no bundle, dormente (sem chamador) — risco de reativação acidental.

## 11. Crítico de cobertura: o que ficou fora da varredura original e um padrão sistêmico novo

Um agente dedicado verificou se algum documento de planejamento tinha escapado das 12 frentes. Dos ≈159 arquivos relevantes, só ficaram sem citação os que estão **fora da pasta `docs/`**: a pasta `.lovable/` na raiz (≈47 especificações de funcionalidade e um roadmap de "16 lotes, 100%") e `analise-prs/` na raiz (distinta de `docs/archive/analise-prs/`, já coberta). Ambas foram auditadas agora.

**Padrão novo, sistêmico:** pelo menos 4 funcionalidades descritas nas especificações do Lovable (`COV-001` a `COV-004`) têm sua migration **registrada como aplicada** no ledger de produção (`ctx:migrations.md`), mas o objeto que ela deveria criar — uma função ou trigger — **não existe** no banco real (`ctx:functions/public/`): revogação de assinaturas de filtro órfãs, trilha de auditoria tributária automática, validação de preferências de anomalia e anti-spam de assinatura de filtro. É diferente de "não implementado": o código e a migration existem no repositório, o ledger diz que rodou, e mesmo assim o efeito não está no banco. Vale uma varredura dedicada "toda migration aplicada que cria função/trigger × existência real em produção" — não coberta por nenhuma das 12 frentes.

Outros achados do crítico: o roadmap do Lovable superestima 2 tabelas e uma rota que não existem (`tributario_faturamento_mensal`/`folha_mensal` → os nomes reais são `faturamento_mensal`/`folha_pagamento`; não há rota `/tributario/aliquotas`); a matriz de conformidade de contratos (`docs/contract-conformance.json`) relata **88/88 funções com validação de corpo (100%)**, mas o próprio script gerador tem um regex que não reconhece `req.clone().json()`, usado por `scim-server`/`sso-callback`/`sso-logout` — o "100%" é falso por limitação da ferramenta, não por essas 3 funções realmente não validarem; e `docs/agentes/mapa-repo.md` cita duas PRs como "abertas" que já foram mescladas ou fechadas.

**Correção de números que os próprios relatórios não haviam uniformizado** (sinalizada pelo crítico, aplicada aqui): jobs de cron ativos em produção = **33** (não 31 ou 32, snapshots de momentos diferentes do mesmo dia); secrets ausentes em produção — todos os itens antes marcados "NÃO VERIFICÁVEL SEM BANCO" nas frentes A4/A7/A12 (`LOVABLE_API_KEY`, `CNPJA_API_KEY`, `ASAAS_API_KEY`, credenciais do Bitrix24) **são, de fato, verificáveis** pelo snapshot `contexto` e estão confirmados ausentes; Edge Functions = **106** (as citações de "105" são do próprio `AGENTS.md`, desatualizado); migrations = **1.045 aplicadas** no ledger de produção e **1.048 arquivos** no repositório (duas métricas diferentes, ambas corretas); tabelas = **247** em `types.ts` gerado e **262** listadas em produção (bases diferentes); o refresh semanal do benchmark setorial não é "automação faltando" — a matview e a função foram **removidas de propósito** em `20261118003500`; e o ADR-001 (módulo Lalamove fora de escopo) está **cumprido** — os 14 objetos listados não existem em produção nem em `types.ts` — só dois resíduos nominais (`trigger_bitrix24_sync`, `get_active_uapi_token`) continuam no código sem efeito, já registrados na seção 7.

---

# Anexos — relatórios por frente (evidência item a item)


---

## Anexo — A1 — Auditoria de `docs/FUNCIONALIDADES_SISTEMA.md` contra o código

Repo: `/home/user/Promo_Finance_V2` (HEAD local, 2026-11-20). Somente leitura. Toda linha das 14 tabelas de funcionalidades (seções 2–15, 170 linhas) foi verificada; a tabela "Métricas do Projeto" (9 linhas) está na seção 3 deste arquivo.

Comandos-base usados em todas as linhas:
- Arquivo/componente: `find src supabase -iname '<Nome>*'` + `grep -rE "export (const|function) <nome>" src`
- Edge: `ls supabase/functions` (109 entradas = 106 funções + `_shared/` + `fuzz_test.ts` + `stress_test.ts`)
- Tabela: `grep -lE "CREATE TABLE( IF NOT EXISTS)? (public\.)?<t>\b" supabase/migrations/*.sql`, `grep -lE "DROP TABLE..."`, e presença em `src/integrations/supabase/types.ts` (seção `Tables`)
- Rota: `grep -ohE 'path="[^"]+"' src/App.tsx src/routes/*.tsx | sort -u` (130 rotas)
- Cron: `grep -rn "cron\.schedule" supabase/migrations/*.sql` (+ `-A3` para chamadas multi-linha)

Legenda: **NÃO IMPLEMENTADO** = não existe nada equivalente · **PARCIAL** = existe, mas simulado, desligado, sem backend ou com parte da descrição ausente · **RENOMEADO** = existe com outro nome/caminho (doc desatualizado, funcionalidade OK).

## 1. Itens NÃO IMPLEMENTADOS, PARCIAIS ou RENOMEADOS

| Seção | Item (como no doc) | Status | Evidência (comando + resultado, ou arquivo:linha) | O que falta |
|---|---|---|---|---|
| 2 | WebAuthn biométrico — `useWebAuthn`, `webauthn-*` edges | PARCIAL | `ls supabase/functions \| grep webauthn` → vazio; `grep -rlE "webauthn\|passkey" supabase/functions` → 0 arquivos. Hook existe: `src/hooks/useWebAuthn.ts:171,273` usa `navigator.credentials` e grava direto em `webauthn_credentials` (`:97,188,299`). | Edges `webauthn-*` não existem; registro/asserção sem verificação server-side (challenge/attestation validados só no cliente). |
| 2 | Account lockout — `account_lockouts` table | RENOMEADO | `supabase/migrations/20261117190000_drop_tabelas_residuo_lovable.sql:22` → `DROP TABLE IF EXISTS public.account_lockouts`. Função real `check_login_lockout` (migration `20260825110000_reconciliar_schema_v3_completo.sql`) lê `login_attempts` e `blocked_ips`. | Atualizar doc: tabelas `login_attempts` + `blocked_ips`. |
| 2 | Known devices — `KnownDevicesPanel` | RENOMEADO | Tabela `known_devices` dropada em `20261117190000_...sql:33`. `src/components/security/KnownDevicesPanel.tsx:6` → `useDeviceDetection`; `src/hooks/useDeviceDetection.ts:93-199` usa `dispositivos_conhecidos` e `new_device_alerts`. | Doc deve citar `dispositivos_conhecidos`. |
| 2 | Audit logs — `useAuditLog` | RENOMEADO | `src/hooks/useAuditLog.ts:14` → `export function useLogAudit()`; não há export `useAuditLog`. | Nome do hook no doc. |
| 2 | XSS sanitization — `lib/sanitize.ts` | RENOMEADO | `ls src/lib \| grep -iE "sanit\|escape\|xss"` → vazio. `escapeHtml` é função local: `src/components/ui/rich-text-editor.tsx:412`. | Não existe módulo `lib/sanitize.ts`; helper não é compartilhado. |
| 3 | Pix Hub — "Templates, QR Code, Pix Copia & Cola, split" | PARCIAL | `grep -niE split src/pages/PixHub.tsx` → só linha 29 (subtítulo de marketing); `grep -rliE split src/components/pix-hub` → 0. QR vem do ASAAS (`PixRecebimento.tsx:198 payment.pix_qrcode`). | Split de Pix não implementado. |
| 3 | Transferências — `transferencias_bancarias` table | RENOMEADO | `CREATE TABLE ... transferencias_bancarias` → 0 migrations; tabela real `transferencias` (`20260317000749_...sql`, presente em types.ts; view `vw_transferencias_painel`). | Nome da tabela. |
| 3 | Centros de custo — `pages/CentrosCusto.tsx` | RENOMEADO | `find src -iname 'CentrosCusto*'` → vazio; existe `src/pages/CentroCustos.tsx` (+ `CentroCustosArvoreOrcadoVsRealizado.tsx`). | Nome do arquivo. |
| 4 | Régua de cobrança — "Email/WhatsApp/SMS" | PARCIAL | `grep -noiE "'(email\|whatsapp\|sms)'" supabase/functions/executar-regua-cobranca/index.ts supabase/functions/processar-fila-cobrancas/index.ts` → só `'email'` (:166, :61, :102) e `'whatsapp'` (:183, :75). SMS só aparece no front (`ReguaCobrancaConfig.tsx:30`). | Canal SMS sem execução no backend. |
| 4 | Protestos & negativações — "Fluxo SERASA/Cartório" | PARCIAL | `src/pages/Cobrancas.tsx:36,207` → `NegativacoesProtestosPanel`; hooks `useNegativacoes.ts:9,33,73` (tabela `negativacoes`) e `useProtestos`. `grep -rliE "serasa\|protesto" supabase/functions` → só `whatsapp-ai-analyzer`. | É registro manual (CRUD); não há integração com SERASA/cartório. |
| 4 | Fila de cobranças — `useCobrancas` | RENOMEADO | `src/hooks/useCobrancas.ts` existe mas exporta `useContasVencidas`, `useCobrancaKPIs`, `useAgingData`, `useTopDevedores`, `useEtapasCobranca`, `useUpdateEtapaCobranca` (:51-313); nenhum `useCobrancas`. | Nome do hook. |
| 4 | Scoring de clientes — `useScoreCliente` | RENOMEADO | `find src -iname 'useScoreCliente*'` → vazio; existe `src/hooks/useScoringClientes.ts` (lê `clientes`:71,143,160 e `contas_receber`:80). Coluna `clientes.score` confirmada em types.ts e `20260509153322_...sql`. | Nome do hook. |
| 5 | Extrato bancário — "Upload OFX/CSV + Open Finance" | PARCIAL | `src/components/conciliacao/ImportarExtratoDialog.tsx:48-57`: caminho Open Finance "fingia" extrato; agora `toast.error('Open Finance não homologado')` (:57). OFX/CSV funcionam. | Open Finance real (provedor homologado). |
| 5 | Conciliações parciais — `conciliacao_itens` | RENOMEADO | `CREATE TABLE ... conciliacao_itens` → 0; tabela real `conciliacoes_parciais` (types.ts). | Nome da tabela. |
| 5 | Webhooks de extrato — `bling_webhook_events` | PARCIAL | Tabela existe (3 migrations), mas `supabase/functions/bling-webhook/index.ts` trata eventos de ERP (ex.: `:356-359 processEstoqueEvent / saldo_abaixo_minimo`); `grep -noiE "extrato" bling-webhook/index.ts` → 0. | Não há webhook de extrato bancário; é webhook Bling (pedidos/estoque/NF). |
| 6 | Cenários Monte Carlo — `MonteCarloCenarios.tsx` | RENOMEADO | `find` → vazio; existe `src/components/fluxo-caixa/SimulacaoMonteCarlo.tsx` (usado em `pages/FluxoCaixa.tsx`). | Nome do arquivo. |
| 6 | Top clientes/centros — `TopClientesWidget` | RENOMEADO | `grep -rhoE "function Top[A-Za-z]+" src` → `TopClientesLeaderboard`, `TopCentrosCustoChart` (`src/components/dashboard/TopClientesLeaderboard.tsx`). | Nome do componente. |
| 6 | Drag & drop layout — `DraggableDashboardGrid.tsx` | NÃO IMPLEMENTADO | `find src -iname 'DraggableDashboardGrid*'` → vazio; `grep -rlE "DndContext\|useSortable\|useDraggable" src` → 0; `grep -rliE "drag\|dnd\|sortable" src/components/dashboard src/components/dashboard-empresa` → 0. `@dnd-kit/core` só em `package.json:60`. | Customização por arrastar não existe. |
| 7 | Apuração mensal/trimestral — `pages/ApuracoesTributarias.tsx` | RENOMEADO | `find src -iname 'ApuracoesTributarias*'` → vazio. Tabela `apuracoes_tributarias` existe; UI em `src/components/reforma-tributaria/ApuracaoMensal.tsx`, `pages/tributario/FechamentoMensal.tsx`. | Caminho no doc. |
| 7 | PER/DCOMP — "Edge dedicada" | PARCIAL | `grep -rlE "per_dcomp\|perdcomp" supabase/functions` → 0. Existem página `pages/tributario/PerDcomp.tsx`, `PerDcompPanel.tsx` e tabela `per_dcomp` (types.ts). | Não há edge; é CRUD de front. |
| 7 | Regimes especiais — `regimes_especiais` | RENOMEADO | `CREATE TABLE ... regimes_especiais\b` → 0; tabela real `regimes_especiais_empresa` (`20260106105751_...sql`). | Nome da tabela. |
| 7 | Estratégias de elisão — "9 motores paralelos", `orquestrador-elisao` edge | PARCIAL | `ls supabase/functions \| grep elisao` → vazio; `grep -rliE elisao supabase/functions` → 0. Motores existem no front: `ls src/lib/tributario/elisao` → 11 `detectar-*.ts` (bonificacao, deliberacao-lucros, depreciacao-acelerada, drawback, holding, jcp, lei-bem, ms-lc224, pat, recuperacao-pis-cofins, reintegra); página `pages/tributario/OportunidadesElisao.tsx`. | Edge orquestradora não existe; cálculo roda no navegador (11 motores, não 9). |
| 7 | Auditoria tributária — "Edge dedicada" | PARCIAL | Tabela `auditoria_tributaria` existe (3 migrations). `grep -rlE auditoria_tributaria supabase/functions --include=index.ts` → `processar-solicitacao-lgpd`, `gerar-pacote-evidencias`, `bitrix24-sync`, `gerar-alertas-tributarios` (escrevem nela); nenhuma edge dedicada. | Doc promete edge própria; não existe. |
| 7 | Importação XML NFe — `importar-xml-nfe` edge | RENOMEADO | `ls supabase/functions \| grep xml` → vazio. Implementação client-side: `src/hooks/useImportacaoXMLNFe.ts:73` (`DOMParser`), página `pages/tributario/ImportacaoXML.tsx`, rota `/tributario/importacao-xml`. | Não há edge; parser roda no browser. |
| 7 | Exportação SPED — "Contribuições + Fiscal", `exportar-sped` edge | PARCIAL | Edges reais: `exportar-sped-contribuicoes`, `gerar-sped-ecd`, `gerar-sped-ecf`. Nenhuma edge para EFD-ICMS/IPI (SPED Fiscal); `pages/tributario/SpedExport.tsx:18` só cita "SPED Fiscal" no subtítulo. | Edge `exportar-sped` não existe; SPED Fiscal sem geração. |
| 7 | DRE Tributária — `dre_tributaria` table | PARCIAL | `grep -lE "CREATE TABLE.*dre_" supabase/migrations/*.sql` → 0; types.ts só tem view `vw_dre_mensal`. Edge `gerar-dre-tributaria/index.ts:48-75` calcula em memória a partir de `faturamento_mensal`/`empresas`, não persiste. | Tabela `dre_tributaria` não existe. |
| 7 | Heatmap anual — `HeatmapTributario.tsx` | RENOMEADO | Arquivo real: `src/components/tributario/dashboard/HeatmapTributarioAnual.tsx` (+ edge `gerar-heatmap-tributario`). | Nome do arquivo. |
| 7 | Previsão IA 3 meses — `previsao-tributaria-ia` | RENOMEADO | `ls supabase/functions \| grep previsao` → vazio; edge real `prever-carga-tributaria` (`index.ts:174` "3 meses"). | Nome da edge. |
| 7 | Obrigações acessórias — `obrigacoes_acessorias` | RENOMEADO | Tabela dropada em `20261117190000_...sql:35`. Página `pages/tributario/ObrigacoesAcessorias.tsx` usa `useEntregasObrigacoes` (`entregas_obrigacoes`, `useEntregasObrigacoes.ts:64,90`) e `conformidade_snapshots`. | Doc deve citar `entregas_obrigacoes`. |
| 8 | Emissão NFe — "Geração + assinatura digital" | PARCIAL (desligado) | `src/components/nfe/NovaNFeForm.tsx:83-84`: `toast.error('Emissão indisponível: a integração SEFAZ ainda precisa ser homologada...')`; `:92` "Esta tela não transmite NF-e". `grep -rliE "enviNFe\|nfeAutorizacao" supabase/functions` → 0. Simulador antigo em `src/lib/sefaz-simulator/handlers.ts:28-111` (`Math.random`, `delay`). | Integração SEFAZ real (autorização, assinatura XML). |
| 8 | Cancelamento NFe | PARCIAL (desligado) | `src/components/nfe/CancelamentoNFe.tsx:75-82` → `handleCancelar` só dispara `toast.error('Cancelamento indisponível: ... homologada')`. | Evento de cancelamento real. |
| 8 | Contingência — "Modo offline SEFAZ" | PARCIAL | `ContingenciaNFe.tsx:112-113` status indisponível; `:173-174` "Transmissão indisponível: ... homologada"; `:306,315` "Integração SEFAZ não homologada". | Transmissão pós-contingência inexistente; só muda estado local. |
| 8 | Alertas de rejeição | PARCIAL | `AlertasRejeicao.tsx:325-326`: "Enquanto a comunicação não estiver homologada, nada é monitorado aqui." | Fonte real de rejeições. |
| 8 | SEFAZ Monitor — "Status em tempo real" | PARCIAL | `SefazMonitor.tsx:89` chama `checkSefazHealth()`; `src/lib/sefaz-contingency/state.ts:110-124`: "Não há consulta real ... devolve `online: null`". `sefaz-monitor/SefazMetricsCards.tsx:33` "`null` enquanto nenhuma verificação real aconteceu". | Consulta real ao status SEFAZ. |
| 8 | SEFAZ Analytics — "Taxa rejeição/aprovação" | PARCIAL | `grep -nE "from\('\|useQuery\|invoke\(" src/components/nfe/SefazAnalytics.tsx` → 0 (componente sem fonte de dados; depende de rejeições que não chegam, ver linha acima). | Dados reais de autorização/rejeição. |
| 9 | Workflow multi-aprovador — `aprovacoes` table | RENOMEADO | `CREATE TABLE ... aprovacoes\b` → 0; tabelas reais `solicitacoes_aprovacao`, `fluxos_aprovacao_niveis`, `configuracoes_aprovacao`, `aprovacao_comentarios` (types.ts). | Nome das tabelas. |
| 9 | Observadores — `aprovacao_observadores` | NÃO IMPLEMENTADO | `grep -rliE observador src supabase/migrations` → 0 arquivos; tabela ausente de types.ts e migrations. | Funcionalidade inexistente. |
| 9 | Notificações — "Push + email + in-app", `useNotifications` | PARCIAL | `find src -iname 'useNotifications*'` → vazio (`ls src/hooks \| grep -i notif` → só `usePushNotifications.ts`). Aprovações: `grep -rlE solicitacoes_aprovacao supabase/functions` → só `enviar-alerta-email`. | Hook não existe; para aprovações só e-mail; push/in-app são genéricos (`usePushNotifications`, `useRealtimeAlertas`). |
| 10 | Open Finance — `open-finance` edge | PARCIAL (simulado) | `supabase/functions/open-finance/index.ts:31` "(sandbox)"; `:244-245` "// For now, return a simulated list of major Brazilian banks". Front bloqueia: `ImportarExtratoDialog.tsx:55` "Não há provedor de Open Finance homologado". | Provedor real. |
| 10 | Assinatura digital — "Certificado A1/A3", `assinatura-digital` edge | PARCIAL (simulado) | `ls supabase/functions \| grep assinatura` → vazio. `src/components/documentos/AssinaturaDigital.tsx` (128 linhas, só `useState`): envio = `await new Promise(r => setTimeout(r, 1500)); toast.success('Documento enviado para assinatura!')` (:52-53). Nenhum `invoke`/`from`. Rota `/assinatura-digital` existe. | Tela é mock; nenhum backend, certificado ou provedor. (`nfe-upload-certificado` é só certificado NFe.) |
| 10 | Portal cliente — `pages/PortalCliente.tsx`, "Acesso público via token" | PARCIAL | `find src -iname 'PortalCliente*'` → só `components/clientes/PortalClientePanel.tsx`; `grep -n portal src/App.tsx src/routes/*.tsx` → só `/clientes/portal-tokens` (admin). Tabelas `portal_cliente_tokens`/`portal_cliente_acessos` existem (`usePortalCliente.ts:12-80`). | Não há rota pública (`/portal/:token`) nem página do cliente; só gestão de tokens. |
| 11 | EXPERT Agent — "gemini-2.5-flash + 15 tools" | PARCIAL | `supabase/functions/expert-agent/index.ts:184` `model: 'google/gemini-2.5-flash'` ✓; `grep -ci tool index.ts` → 0; `grep -cE "name:" ` → 0 (244 linhas, chat simples via `ai.gateway.lovable.dev`:177). | Nenhuma tool definida (0, não 15). |
| 11 | Previsão tributária — `previsao-tributaria-ia` | RENOMEADO | Igual à seção 7: edge real `prever-carga-tributaria`. | Nome. |
| 11 | Resumo executivo semanal — "Cron Dom 18:00" | PARCIAL | Edge `gerar-resumo-executivo-semanal` existe. `grep -lE "cron\.schedule" supabase/migrations/*.sql \| xargs grep -lE "'0 18 \* \* 0'"` → 0; `grep -lE gerar-resumo-executivo-semanal supabase/migrations/*.sql \| xargs grep -l cron.schedule` → 0. | Agendamento não existe no repo (se roda, é externo/N8N — NÃO VERIFICADO). |
| 12 | Detector de anomalias — "(cron 30min)" | PARCIAL | Edge `detectar-anomalias-financeiras` ✓ com 5 `tipo_anomalia` (conciliacao_atrasada, conta_pagar_alta, movimentacao_outlier, mudanca_regime_brusca, pagamento_duplicado). Único job `*/30 * * * *` é `monitor-health-check` (`20261101200000_monitor_health_cron.sql:25-30`); nenhuma migration agenda a edge. | Cron de anomalias inexistente. |
| 12 | Push notifications — `enviar-push-notification` | RENOMEADO | Edge real `send-push-notification`; `20260913120000_corrige_credenciais_automacoes_internas.sql:296` "A real chama-se send-push-notification"; trigger `fn_notificar_alerta_critico_push` (:312,347). VAPID via `get-vapid-key` (`usePushNotifications.ts:19`). | Nome da edge. |
| 12 | Quick create — `QuickCreateMenu.tsx` | RENOMEADO | Arquivos reais: `src/components/quick-create/QuickCreateModal.tsx`, `src/components/layout/sidebar/QuickCreateButton.tsx`. | Nome. |
| 12 | Favoritos — `useFavorites` | RENOMEADO | `find src -iname 'useFavorites*'` → vazio. Favoritos vivem em `useRecentItems` (`src/components/layout/sidebar/RecentAndFavorites.tsx:21` `{ favoriteItems, toggleFavorite, isFavorite } = useRecentItems()`), persistidos em localStorage (:25). | Nome do hook; só páginas (não registros). |
| 13 | Centro Privacidade LGPD — `pages/Privacidade.tsx` | RENOMEADO | Arquivo real `src/pages/CentroPrivacidadeLGPD.tsx`; rota `/configuracoes/privacidade` ✓. | Nome. |
| 14 | /admin/system-health — "5 abas", `pages/SystemHealth.tsx` | RENOMEADO | Arquivo real `src/pages/AdminSystemHealth.tsx`; rota ✓. Abas: `grep -oE 'TabsTrigger value="[a-z-]+"'` → overview, anomalias, auditoria, automacoes, resumos, slo (6, não 5). | Nome e nº de abas. |
| 14 | Automações P13 — "6 cron jobs visíveis", `AutomacoesTab.tsx` | PARCIAL | `AutomacoesTab.tsx:25-65` filtra `P13_JOB_NAMES` = p13-cleanup-acoes-expiradas, p13-detectar-anomalias, p13-gerar-acoes-recomendadas, p13-health-score-diario, p13-refresh-benchmark, p13-resumo-executivo-semanal. `grep -rhoE "p13-[a-z-]+" supabase/migrations/` → só 2 nomes, dentro de JSON mock da versão antiga de `get_cron_jobs` (`20260518170823_...sql:123-124`, "Return mock data if extension is missing"). `get_cron_jobs` atual (`20260728110753_...sql:58-62`) lê `cron.job` real. | Nenhum job `p13-*` agendado → aba lista vazio em produção. |
| 14 | Cron jobs (6) — "health 07:00 · anomalias */30min · resumo Dom 18:00 · benchmark Seg 03:00 · ações 06:00 · cleanup 05:55 · SLO 23:55" | NÃO IMPLEMENTADO | Para cada horário: `grep -lE cron.schedule supabase/migrations/*.sql \| xargs grep -lE "'<cron>'"` → `0 7 * * *`: 0 · `*/30 * * * *`: só monitor-health-check · `0 18 * * 0`: 0 · `0 3 * * 1`: 0 · `0 6 * * *`: 0 · `55 5 * * *`: 0 · `55 23 * * *`: 0. Edges `calcular-health-score-operacional`, `detectar-anomalias-financeiras`, `gerar-resumo-executivo-semanal`, `gerar-acoes-recomendadas`, `calcular-slo-metrics-diario`, `comparar-benchmark-setorial` não aparecem em nenhuma migration com `cron.schedule`. `refresh-benchmark-setorial-weekly` (Dom 03:00) foi agendado em `20260418140233` e desagendado em `20261118003500_...sql:88`. Jobs reais no repo: cron-failure-watch, daily-log-retention, enviar-digest-conformidade-diario/-horario, digest-silenciamentos-erro, gerar-alertas-vencimento-diario, gerar-contas-recorrentes-diario, marcar-contas-vencidas, monitor-health-check, pgss-weekly-baseline, processar-regua-cobranca-diario, capture-slow-queries (entre outros de manutenção). | Nenhum dos 7 jobs descritos existe; lista do doc é de outra geração do produto. |
| 14 | RLS hardening P15 — "Migração P15" | PARCIAL | `grep -liE "\bP15\b" supabase/migrations/*.sql` → 0. RLS confirmada mesmo assim: `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` + `CREATE POLICY` para `notas_fiscais_ocr` (5 arquivos), `resumos_executivos_semanais` (3), `acoes_recomendadas` (3). | Não há migration identificável como "P15"; proteção existe. |
| 15 | PWA install prompt — `PWAInstallPrompt.tsx` | RENOMEADO | Arquivos reais `src/components/pwa/InstallPWA.tsx`, `src/components/pwa/PWAInstallBanner.tsx`. | Nome. |
| 15 | Offline sync — "Fila de operações offline", `useOfflineSync` | NÃO IMPLEMENTADO | `ls src/hooks src/lib \| grep -i offline` → só `src/lib/offline/fiscal-cache.ts` (exporta `TTL`, `chaveConsulta`; cache de consulta tributária usado por `useConsultaTributaria.ts`). `src/components/offline/OfflineBanner.tsx` só avisa. Nenhuma fila/replay de operações. | Fila de operações offline não existe. |
| 15 | Network status — `NetworkStatus.tsx` | RENOMEADO | `src/components/ui/network-status-indicator.tsx` + `src/hooks/useNetworkStatus.ts:27`. | Nome. |
| 15 | Export CSV/PDF — `useExportData` | RENOMEADO | `find src -iname 'useExportData*'` → vazio; `src/lib/export-utils.ts` exporta `exportToCSV`, `exportToJSON`, `exportToPDF` (+ BOM: 3 ocorrências de `FEFF/BOM`). jsPDF em 23 arquivos de `src`. | Nome (é lib, não hook). |
| 15 | Importação CSV/Excel — "Wizard de mapeamento", `DataImporter.tsx` | PARCIAL | `find src -iname 'DataImporter*'` → vazio. Importadores específicos: `conciliacao/ImportarExtratoDialog.tsx` + `ExtratoPreviewStep.tsx` (OFX/CSV com mapeamento), `contabilidade/ImportarPlanoContasDialog.tsx`, wizards SPED; `xlsx` vendorizado em package.json. | Não há importador genérico CSV/Excel para as entidades financeiras. |
| 15 | Virtual lists — `VirtualizedTable` | RENOMEADO | `find src -iname 'VirtualizedTable*'` → vazio; `react-window` usado em `src/hooks/useVirtualRows.ts`, `src/pages/Movimentacoes.tsx`, `src/pages/ContasPagar/components/List.tsx`. | Nome. |
| 15 | Filtros avançados — `AdvancedFilters.tsx` | RENOMEADO | Arquivo real `src/components/ui/advanced-filters.tsx`. | Nome. |
| 15 | Filtros salvos — `SavedFiltersDropdown.tsx` | RENOMEADO | Arquivo real `src/components/shared/SavedFiltersBar.tsx` (+ `pages/configuracoes/FiltrosSalvos.tsx`, rota `/configuracoes/filtros-salvos`). | Nome. |
| 15 | Bulk actions — `BulkActionsBar.tsx` | RENOMEADO | Arquivo real `src/components/ui/bulk-actions-bar.tsx` (+ `pages/ConciliacaoBulkActionsBar.tsx`). | Nome. |
| 15 | Search debounce — `SearchInput.tsx` | RENOMEADO | Arquivo real `src/components/ui/search-input.tsx` (`debounceMs = 300` em :40 ✓). | Nome. |
| 15 | Navegação inteligente — "`BackButton` + `parentRouteMap`" | RENOMEADO | `grep -rn parentRouteMap src` → 0. `BackButton.tsx:7` usa `useSmartBack`; `useSmartBack.ts:52` → `resolveParentRoute(location.pathname)`. | Nome do mapa. |

Itens **não verificáveis por código** (processo/estética, contados à parte): seção 15 "A11y WCAG AA — Auditoria periódica" e "Premium aesthetic — Design system global".

Observações sobre itens contados como confirmados, mas com detalhe divergente:
- 2 "HIBP check — Manual config": implementado no cliente (`PasswordStrengthIndicator.tsx:36` → `api.pwnedpasswords.com/range/`); a configuração do Supabase Auth não é verificável no repo.
- 2 "RLS hardening — Todas as 130+ tabelas": não auditado policy a policy; `types.ts` tem 247 tabelas e o gate `scripts/security/test-canonical-db-gates.mjs` existe.
- 3 "Versionamento — VersionHistory.tsx": componente lê `audit_logs` (:29); tabela `entity_versions` foi dropada (`20261117190000:32`).
- 7 "Relatório anual PDF — jsPDF + autoTable, 4 seções, `gerar-relatorio-anual`": edge existe e é chamada por `useRelatorioAnual.ts:16`; `grep -o "jspdf\|autoTable" gerar-relatorio-anual/index.ts` → 0 (PDF não é gerado na edge).
- 14 "Edge Health — Tab 1": aba chama-se `overview`; `vw_edge_health` usada em `AdminSystemHealth.tsx` ✓.

## 2. Contagem final (170 linhas de funcionalidades, seções 2–15)

| Status | Qtd | % |
|---|---|---|
| Confirmado (existe como descrito) | 104 | 61% |
| RENOMEADO (existe com outro nome/caminho) | 33 | 19% |
| PARCIAL (simulado, desligado, sem backend ou incompleto) | 27 | 16% |
| NÃO IMPLEMENTADO | 4 | 2% |
| Não verificável por código | 2 | 1% |

Por seção (linhas · confirmadas / renomeadas / parciais / não impl. / n.v.):
2 Autenticação: 13 · 8/4/1/0/0 · 3 Financeiro: 14 · 11/2/1/0/0 · 4 Cobranças: 9 · 5/2/2/0/0 · 5 Conciliação: 7 · 4/1/2/0/0 · 6 Dashboards: 11 · 8/2/0/1/0 · 7 Tributário: 29 · 18/6/5/0/0 · 8 NFe & SEFAZ: 8 · 2/0/6/0/0 · 9 Aprovações: 4 · 1/1/1/1/0 · 10 Integrações: 11 · 8/0/3/0/0 · 11 IA: 12 · 9/1/2/0/0 · 12 Inteligência op.: 10 · 6/3/1/0/0 · 13 LGPD: 7 · 6/1/0/0/0 · 14 Observabilidade: 13 · 9/1/2/1/0 · 15 UX: 22 · 9/9/1/1/2.

NÃO IMPLEMENTADOS (4): Drag & drop do dashboard (§6) · Observadores de aprovação (§9) · Os 7 cron jobs listados (§14) · Fila offline `useOfflineSync` (§15).

## 3. Métricas do cabeçalho × realidade

| Métrica | Doc | Real (comando) |
|---|---|---|
| Páginas (rotas) | 54 | 130 rotas únicas (`grep -ohE 'path="[^"]+"' src/App.tsx src/routes/*.tsx \| sort -u \| wc -l`); `ls src/pages/*.tsx \| wc -l` = 89 (124 entradas incl. subpastas) |
| Edge Functions | 51 | 106 (`ls supabase/functions \| wc -l` = 109 = 106 funções + `_shared` + `fuzz_test.ts` + `stress_test.ts`) |
| Tabelas Supabase | 130+ | 247 em `types.ts` (`awk '/Tables: \{/,/Views: \{/' ... \| grep -c "^      [a-z_]+: {"`) |
| Hooks customizados | 130+ | 289 arquivos `use*.ts(x)` em `src/hooks` (`find src/hooks -name 'use*.ts*' \| wc -l`) |
| Pastas de componentes | 60+ | 75 (`find src/components -mindepth 1 -maxdepth 1 -type d \| wc -l`) |
| Migrações SQL | 102 | 1048 (`ls supabase/migrations/*.sql \| wc -l`) |
| Testes unitários | 1.012 | 2689 `it/test(` em 308 arquivos `*.test.ts(x)` (bate com a meta 2689 do AGENTS.md) |
| Erros TypeScript | 0 | não executado nesta auditoria (somente leitura) |
| Stack "Vite 5" | — | `package.json`: `"vite": "^8.3.8"` (AGENTS.md diz Vite 6) |

Também desatualizado no rodapé/arquitetura: "51 edges", "6 Cron Jobs P13", "Lovable Cloud" (projeto hoje é Supabase `bwwbeyolnnzppeuhgkcd` + Vercel), "Abril 2026".

---

## Anexo — A2 — Auditoria docs × código: INVENTARIO_FUNCIONALIDADES, FUNCIONALIDADES_SEM_UI, COMPONENTS, ARCHITECTURE(+GRAPH)

Base: HEAD local de `/home/user/Promo_Finance_V2` em 2026-11-20. Só itens NÃO CONFIRMADOS aparecem nas tabelas (confirmados entram só na contagem final). Métodos: `test -e`, `find src -name`, `grep -lE "CREATE TABLE[^;]*<t>" supabase/migrations/*.sql` + `src/integrations/supabase/types.ts`, `grep -lE "FUNCTION[^(]*<fn>" supabase/migrations/*.sql` + checagem do último `DROP FUNCTION`, `grep -ohE 'path="[^"]+"' src/App.tsx src/routes/*.tsx` (130 rotas). Tabelas de bibliotecas npm e componentes Radix ignoradas.

---

## (a) docs/INVENTARIO_FUNCIONALIDADES.md

| Doc | Item | Status | Evidência | O que falta |
|---|---|---|---|---|
| INV | Autenticação › Verificação 2FA `src/components/auth/TwoFactorVerify.tsx` | INEXISTENTE | `find src -name TwoFactorVerify.tsx` → vazio; `ls src/components/auth` → `TwoFactorSetup.tsx`, `MFASettings.tsx`; verify em `src/hooks/useMFA.ts` | Arquivo não existe; fluxo de verificação vive em `useMFA.ts`/`TwoFactorSetup.tsx` |
| INV | Autenticação › Bloqueio por IP `src/pages/Auth.tsx (validateIp)` | RENOMEADO | `grep validateIp src/pages/Auth.tsx` → 0; existe em `src/pages/Auth.hooks.ts:78,249` e `src/hooks/useAuthValidation.ts`; edge `supabase/functions/validate-ip-geo/index.ts` | Doc aponta arquivo errado |
| INV | Autenticação › "Roles do Sistema" = 4 (`admin, financeiro, operacional, visualizador`) | PARCIAL | `types.ts` Enums `app_role`: `admin, manager, operator, viewer, financeiro, operacional, visualizador, contador` (8 valores) | Doc desatualizado: enum tem 8 papéis |
| INV | Contas a Receber › Etapas de Cobrança "Enum DB `etapa_cobranca`" | PARCIAL | `CREATE TYPE … etapa_cobranca` em `supabase/migrations/20251214170739_*.sql`; porém colunas `etapa_cobranca` em `types.ts:4536,17581` são `string \| null` (não referenciam `Enums`) | NÃO VERIFICADO se o enum ainda é usado pelas colunas em produção |
| INV | Dashboard Executivo › Métricas Cards `src/components/dashboard/DashboardExecutivo/MetricsCards.tsx` | INEXISTENTE | `find src -name MetricsCards.tsx` → vazio; `DashboardExecutivo` é arquivo (`src/components/dashboard/DashboardExecutivo.tsx`), não pasta; KPIs em `HeroKPICards.tsx`/`SecondaryKPICards.tsx` | Caminho fictício; equivalente provável não confirmado |
| INV | Dashboard › Gráfico Mensal `src/components/dashboard/widgets/AnimatedMonthlyChart.tsx` | INEXISTENTE | `ls src/components/dashboard/` sem pasta `widgets/`; nenhum arquivo com esse nome | — |
| INV | Dashboard › Transações Recentes `widgets/TransacoesRecentes.tsx` | INEXISTENTE | `grep -rl TransacoesRecentes src/` → vazio | — |
| INV | Dashboard › Calendário Vencimentos `widgets/CalendarioVencimentos.tsx` | INEXISTENTE | `grep -rl CalendarioVencimentos src/` → vazio (existe só `case 'vencimentos'` em `DashboardExecutivo.tsx`) | — |
| INV | Dashboard › Metas Financeiras `widgets/MetasFinanceiras.tsx` | RENOMEADO | Existe `src/components/dashboard/MetasFinanceirasPanel.tsx` e página `src/pages/MetasFinanceiras.tsx` | Caminho errado |
| INV | Dashboard › Resumo Rápido `widgets/ResumoRapido.tsx` | INEXISTENTE | `grep -rl ResumoRapido src/` → vazio | — |
| INV | Dashboard › Cockpit CFO `src/components/dashboard/CockpitCFO.tsx` | INEXISTENTE | `grep -rli cockpit src/` → vazio | — |
| INV | Dashboard › Simulador Cenários `src/components/dashboard/SimuladorCenarios.tsx` | INEXISTENTE | Só `src/components/reforma-tributaria/SimuladorCenariosTributarios.tsx` (domínio tributário, não dashboard) | — |
| INV | Dashboard › Dashboard Configurável `DraggableDashboardGrid.tsx` | INEXISTENTE | `find` → vazio; `@dnd-kit/*` está em `package.json:60-62` mas `grep -rl @dnd-kit src/` → 0 usos | Dependência instalada sem uso |
| INV | Dashboard › Cards Ordenáveis `SortableCard.tsx` | INEXISTENTE | `grep -rl SortableCard src/` → vazio | — |
| INV | Dashboard › Recomendações Metas IA `RecomendacoesMetasIA.tsx` | INEXISTENTE | `grep -rlE "Recomendacoes[A-Za-z]*Metas" src/` → vazio | — |
| INV | BI › Painel BI `src/pages/BI/index.tsx` | RENOMEADO | Existe `src/pages/BI.tsx` (+ `BI.helpers.ts`, `BIFuturista.tsx`); rota `path="/bi"` | — |
| INV | BI › Filtros BI `src/pages/BI/components/Filters.tsx` | INEXISTENTE | Pasta `src/pages/BI/` não existe; `ls src/components/bi` → `BICharts.tsx, BIDrillDown.tsx, BIKpis.tsx` (sem Filters) | — |
| INV | BI › Gráficos BI `src/pages/BI/components/Charts.tsx` | RENOMEADO | `src/components/bi/BICharts.tsx` | — |
| INV | BI › Métricas BI `src/pages/BI/components/Metrics.tsx` | RENOMEADO | `src/components/bi/BIKpis.tsx` | — |
| INV | Cobrança › PIX QR Code `src/components/cobranca/PixQRCodeDialog.tsx` | RENOMEADO | `src/components/asaas/PixQrCodeDialog.tsx` | Pasta e caixa diferentes |
| INV | Layout › Sidebar `src/components/layout/Sidebar.tsx` | RENOMEADO | `ls src/components/layout` → `ResponsiveSidebar.tsx` + pasta `sidebar/` (`SidebarNavGroups.tsx`, …) | — |
| INV | Animações › `src/components/animations/PageTransition.tsx` | RENOMEADO | `src/components/animations/` não existe; há `src/components/layout/PageTransition.tsx` e `src/components/layout/transitions/PageTransition.tsx` | Linha duplica a de Layout |
| INV | Animações › List Animations `src/components/animations/ListAnimation.tsx` | INEXISTENTE | pasta ausente; `grep -rl ListAnimation src/` → vazio | — |
| INV | Animações › Motion Components `src/components/animations/Motion.tsx` | RENOMEADO | `src/components/motion/{AnimatedNumber,StatCard,index}.tsx` | — |
| INV | Acessibilidade › Font Size Control `src/components/accessibility/FontSizeControl.tsx` | INEXISTENTE | `ls src/components/accessibility/` → só `SkipLinks.tsx` | — |
| INV | Acessibilidade › Keyboard Nav `src/components/accessibility/KeyboardNav.tsx` | RENOMEADO | Só hook `src/hooks/useKeyboardNavigation.ts`; sem componente | — |
| INV | Acessibilidade › Contrast Checker `src/lib/contrast-checker.ts` | INEXISTENTE | `ls src/lib \| grep -i contrast` → vazio | — |
| INV | Tema › Theme Switcher `src/components/theme/ThemeSwitcher.tsx` | INEXISTENTE | `ls src/components/theme/` → `ThemeContext.ts, ThemeProvider.tsx`; `setTheme(` chamado inline em `src/components/layout/Header.tsx` e `command-palette/commandPaletteManagement.ts` | Sem componente dedicado |
| INV | PWA › Offline Storage `src/lib/offline-storage.ts` | RENOMEADO | `ls src/lib/offline/` → `fiscal-cache.ts` (escopo só fiscal) | Não é storage genérico |
| INV | Banco › Função `confirmar_conciliacao()` | RENOMEADO/REMOVIDA | `supabase/migrations/20260902170000_fix_rpcs_security_definer_sem_escopo.sql:41,48` → `DROP FUNCTION … confirmar_conciliacao(…)` (2 assinaturas); substituta `confirmar_conciliacao_manual` em `20260913140000_rpcs_atomicas_fluxos_multi_passo.sql:41`; `grep confirmar_conciliacao src/` (fora types) → 0 | Doc cita função dropada |
| INV | Banco › Função `get_user_role()` | PARCIAL | Criada só em `20251214170739_*.sql`, nunca dropada; ausente em `types.ts` Functions; `20260825110000_reconciliar_schema_v3_completo.sql:2660` cria `get_user_roles(user_id)` (plural) | NÃO VERIFICADO se ainda existe em produção; sucessora é `get_user_roles` |
| INV | Utilitários › Feature Flags `src/lib/feature-flags.ts` | INEXISTENTE | `find src -iname "*feature-flag*"` → vazio | — |
| INV | Utilitários › React Query Config `src/lib/react-query.ts` | RENOMEADO | `src/lib/queryClient.ts` | — |
| INV | UI custom › Chart Skeleton `src/components/ui/chart-skeleton.tsx` | INEXISTENTE | `ls src/components/ui \| grep -i skeleton` → `loading-skeleton.tsx, skeleton.tsx`; há `dashboard/DashboardSkeleton.tsx` | — |
| INV | UI custom › Feedback Banner `ui/feedback-banner.tsx` | INEXISTENTE | `grep -rl FeedbackBanner src/` → vazio | — |
| INV | UI custom › Highlight Text `ui/highlight-text.tsx` | INEXISTENTE | `ls src/components/ui \| grep -i highlight` → vazio | — |
| INV | UI custom › Infinite Scroll `ui/infinite-scroll.tsx` | INEXISTENTE | `grep -rlE "InfiniteScroll\|useInfiniteScroll" src/` → vazio | — |
| INV | UI custom › Optimized Table `ui/optimized-table.tsx` | INEXISTENTE | Só `ui/data-table.tsx`, `ui/table.tsx` | — |
| INV | UI custom › Pull to Refresh `ui/pull-to-refresh.tsx` | INEXISTENTE | `grep -rl PullToRefresh src/` → vazio | — |
| INV | UI custom › Skip Link `ui/skip-link.tsx` | RENOMEADO | `src/components/accessibility/SkipLinks.tsx` | — |
| INV | UI custom › Virtualized List `ui/virtualized-list.tsx` | RENOMEADO | Sem componente; virtualização via hook `src/hooks/useVirtualRows.ts` e `react-window` em `src/pages/ContasPagar/components/List.tsx`, `src/pages/Movimentacoes.tsx` | — |
| INV | UI custom › Virtualized Table `ui/virtualized-table.tsx` | RENOMEADO | idem acima | — |
| INV | Testes › Integration Tests `src/__tests__/integration/` | RENOMEADO | `ls src/__tests__/` → só `validators.test.ts`; cenários em `src/test/scenarios/`, a11y em `src/test/a11y/` | — |
| INV | Testes › Edge Function Tests "Vitest · `supabase/functions/__tests__/`" | RENOMEADO/PARCIAL | Pasta não existe; 26 `*.test.ts` colocados por função (`find supabase/functions -name "*.test.ts"`); `vitest.config.ts:36` inclui só `src/**`; rodam via `.github/workflows/deno-tests.yml` (Deno, não Vitest) | Ferramenta e caminho errados |

**Contagem (a):** 280 itens auditados (linhas das tabelas funcionais, incl. 42 tabelas, 15 funções SQL, 14 edges) · **237 confirmados** · **4 parciais** · **17 renomeados** · **22 inexistentes**. Tabelas: 42/42 existem (CREATE em migration, sem DROP posterior, presentes em `types.ts`). Edge Functions: 14/14 existem em `supabase/functions/<nome>/index.ts` (o doc cita 14; há 108 hoje). Funções SQL: 13/15 ativas (`has_role`, `log_audit`, `gerar_contas_recorrentes`, `gerar_alertas_vencimento`, `get_cron_jobs`, `delete_cron_job`, `toggle_cron_job` foram dropadas e recriadas depois — ok).

---

## (b) docs/FUNCIONALIDADES_SEM_UI.md

| Doc | Item | Status | Evidência | O que falta |
|---|---|---|---|---|
| SEM_UI | §1 `useBudget`: "298 linhas · 0 componentes consomem · localStorage" | DESATUALIZADO | `wc -l src/hooks/useBudget.ts` → 158; consumidores: `src/pages/Orcamentos.tsx`, `src/components/dashboard/AlertasOrcamento.tsx`, `src/pages/orcamentos.types.ts` | Premissa do doc já não vale (P16 #1 entregue) |
| SEM_UI | P16 #3 `/inteligencia` consolidando `HealthScoreCard` + `CentroAcoesInteligentes` + `AnomaliasDetectadasPanel` (versão usuário, por empresa) | PARCIAL | Rota `src/routes/geralRoutes.tsx:148`; `src/pages/InteligenciaOperacional.tsx:57,66` renderiza `HealthScoreCard` e `CentroAcoesInteligentes`; `grep -i anomalia` na página → 0. `AnomaliasDetectadasPanel` só em `src/pages/admin/InsightsIA.tsx` e `src/pages/AdminSystemHealth.tsx` (rota `/admin/insights-ia` com `requiredRoles={['admin','financeiro']}`, `adminRoutes.tsx:177`) | Falta anomalias (filtradas por empresa) em `/inteligencia` |
| SEM_UI | P16 #5 "Meus resumos semanais" em `/relatorios` (filtrar por usuário) | PARCIAL | `src/pages/Relatorios.tsx:371` renderiza `RelatoriosResumosSemanais`; `src/hooks/useResumosExecutivos.ts:26-30` filtra `resumos_executivos_semanais` por `empresa_id`, não por usuário | Filtro é por empresa; "meus" (por usuário) não existe |
| SEM_UI | P16 #6 "Histórico de envios" em `/relatorios/agendados` | PARCIAL | Rota `/relatorios/agendados` não existe (só `path="/relatorios"`); `src/components/relatorios/RelatoriosAgendados.tsx:187,237` tem aba `historico` (execuções via `historico_relatorios`). Envios tributários: `supabase/functions/enviar-relatorios-tributarios-agendados/index.ts:183` só faz `update ultimo_envio_em/proximo_envio_em` em `relatorios_tributarios_agendados`; sem tabela de log de envios; UI só em `src/components/tributario/dashboard/RelatoriosAgendadosCard.tsx` e `AdminSystemHealth.tsx` | Sem rota dedicada e sem histórico de envios tributários |
| SEM_UI | §3 `enviar-relatorios-tributarios-agendados` → painel "Histórico de envios" | PARCIAL | idem acima | Log de envios por destinatário não existe |
| SEM_UI | §3 `detectar-anomalias-financeiras` → "usuário financeiro deveria ver anomalias da própria empresa" | PARCIAL | Painel só sob `/admin/insights-ia` (`requiredRoles ['admin','financeiro']`, `src/routes/adminRoutes.tsx:175-177`) e `/admin/system-health`; `src/pages/configuracoes/HistoricoNotificacoes.tsx:35` mapeia `anomalias_detectadas → '/admin/insights-ia'` | Financeiro acessa via rota admin; nada em `/inteligencia` |
| SEM_UI | §⚠ `api-keys-manage` "requer deploy da Edge Function" | CONFIRMADO NO REPO / DEPLOY NÃO VERIFICADO | `supabase/functions/api-keys-manage/{index.ts,index.test.ts}`; `supabase/config.toml:214 [functions.api-keys-manage]`; invocada em `src/hooks/useApiKeys.ts:43`; rota `/admin/api` em `adminRoutes.tsx:247` | Estado do deploy em produção não é verificável pelo repo |

Confirmados (não listados): P16 #1 `/orcamentos` (`src/pages/Orcamentos.tsx` usa `useBudget`); #2 as 11 rotas `/tributario/{split-payment,conciliacao,incentivos,auditoria,comparativo,cashback,importacao-xml,sped,relatorios-contabeis,per-dcomp,retencoes}` existem em `src/routes/tributarioRoutes.tsx`, cada página em `src/pages/tributario/*.tsx` renderiza o painel correspondente (`SpedExport.tsx`→`ExportacaoSPED`, etc.), e todas estão em `sidebarFiscalNavGroup.ts`, `commandPaletteNavigation.ts` e `src/lib/navigation.ts` (1 ocorrência cada); #4 aba `scoring` em `src/pages/Clientes.tsx:223` + rota `/clientes/scoring` (`src/pages/clientes/ScoringClientes.tsx`); #7 `/clientes/portal-tokens` (`src/pages/clientes/PortalTokens.tsx` usa `PortalClientePanel`); #8 `src/hooks/useDashboardConfig.ts:51-62` — `alertas-preditivos` e `metas` com `visible: true` em `DEFAULT_WIDGETS`; #9 `/tributario/fechamento-mensal` (`src/pages/tributario/FechamentoMensal.tsx` renderiza `AssistenteFechamentoMensal`); `/metas` (`src/pages/MetasFinanceiras.tsx`); contador WhatsApp: `src/hooks/useWhatsAppUnreadCount.ts` usado em `src/components/layout/sidebar/SidebarNavGroups.tsx`; `gerar-resumo-executivo-semanal` exposto em `/relatorios`; `whatsapp-ia-proativo`/`processar-solicitacao-lgpd`/`calcular-slo-metrics-diario` existem.

**Contagem (b):** 32 itens (9 roadmap + 11 painéis + 7 "pouco descobríveis" + 4 edges + `api-keys-manage`) · **26 confirmados** · **6 parciais/desatualizados** · **0 inexistentes**.

---

## (c) docs/COMPONENTS.md

| Doc | Item | Status | Evidência | O que falta |
|---|---|---|---|---|
| COMP | `InteractiveCard` | INEXISTENTE | `grep -rlE "export (const\|function) InteractiveCard" src/` → vazio; `ui/card.tsx` só Card base | — |
| COMP | `GradientCard` | INEXISTENTE | idem | — |
| COMP | `SpotlightCard` | INEXISTENTE | idem | — |
| COMP | `StatsCard` | INEXISTENTE | Alternativas: `src/components/motion/StatCard.tsx`, `KpiCard`, `HeroKPICard` (APIs diferentes) | — |
| COMP | `FlipCard` | INEXISTENTE | grep → vazio | — |
| COMP | `FloatingLabelInput` | INEXISTENTE | `ls src/components/ui` → `input.tsx, currency-input.tsx, phone-input.tsx, tag-input.tsx, search-input.tsx` | — |
| COMP | `PasswordInput` (showStrength) | INEXISTENTE | Só `src/components/auth/PasswordStrengthIndicator.tsx` | — |
| COMP | `ValidatedInput` | INEXISTENTE | grep → vazio (`ui/input.tsx:15` tem props `error`/`success`, sem `validationState`) | — |
| COMP | Toast helpers `toast.success/error/warning/info/loading/promise` de `@/hooks/use-toast` | PARCIAL | `src/hooks/use-toast.ts:17` exporta `toast({title, description, variant, duration})` (wrapper sonner); sem métodos `.success/.warning/.info/.loading/.promise`; `src/components/ui/sonner.tsx:1` reexporta `toast` do sonner (esse tem `.success/.promise`) | API documentada não existe no hook citado |
| COMP | `SpinnerLoader` | INEXISTENTE | `grep -rhoE "export … [A-Za-z]*(Spinner\|Loader)" src/components/ui` → só `LoadingSkeleton, LoadingDots, PageLoading, TableShimmerSkeleton` | — |
| COMP | `PulseLoader` | INEXISTENTE | idem (`PulseDot` existe em `micro-interactions.tsx`, API diferente) | — |
| COMP | `BarLoader` | INEXISTENTE | idem | — |
| COMP | `ProgressLoader` | INEXISTENTE | idem (só `ui/progress.tsx`) | — |
| COMP | `FullPageLoader` | INEXISTENTE | idem (`PageLoading` em `loading-skeleton.tsx`, sem `logo`) | — |
| COMP | `OverlayLoader` | INEXISTENTE | idem | — |
| COMP | `SkeletonCard` | INEXISTENTE | `ui/skeleton.tsx` exporta só `Skeleton`; `loading-skeleton.tsx` → `LoadingSkeleton, PageLoading, TableShimmerSkeleton` | — |
| COMP | `SkeletonProfile` | INEXISTENTE | idem | — |
| COMP | `SkeletonGroup` | INEXISTENTE | idem | — |
| COMP | `AnimatedCounter` (prop `variant="default\|flip\|slide\|glow"`) | PARCIAL | `src/components/ui/micro-interactions.tsx:9-16` props `value, duration, formatter` — sem `variant` | Prop documentada não existe |
| COMP | `AnimatedStat` | INEXISTENTE | grep → vazio (alt. `motion/AnimatedNumber.tsx`, `motion/StatCard.tsx`) | — |
| COMP | `TrendIndicator` | INEXISTENTE | grep → vazio (só `TrendBarChart`, `TrendTable`) | — |
| COMP | `RichTooltip` | INEXISTENTE | `ui/tooltip.tsx` só Radix base; `info-tooltip.tsx` ok | — |
| COMP | `ShortcutTooltip` | INEXISTENTE | grep → vazio | — |
| COMP | `FAQAccordion` (prop `variant`) | PARCIAL | Existe em `src/components/ui/collapse.tsx:240-243` com props `items, allowMultiple, className` — sem `variant`; é Accordion custom de `collapse.tsx`, não o Radix de `ui/accordion.tsx` | Prop `variant` ausente |
| COMP | `NestedAccordion` | INEXISTENTE | grep → vazio | — |
| COMP | `Spotlight` (command palette) | INEXISTENTE | Só `export function CommandPalette` em `src/components/command-palette/`; `useCommandMenu` existe em `ui/command.hooks.ts` | Nome/API diferentes |
| COMP | `ErrorBoundary` (prop `showDetails`) | PARCIAL | `src/components/error/ErrorBoundary.tsx:11-12` props `fallback`, `onError`; `grep -c showDetails` → 0 | Prop `showDetails` ausente |
| COMP | `ErrorFallback` (variant full/inline/minimal) | INEXISTENTE | `src/components/error/` só `ErrorBoundary.tsx`; grep export `ErrorFallback` → vazio | — |
| COMP | `AsyncBoundary` | INEXISTENTE | grep → vazio | — |
| COMP | `SuspenseWrapper` | INEXISTENTE | grep → vazio | — |
| COMP | `SkeletonTransition` | INEXISTENTE | grep → vazio | — |
| COMP | `RetryWrapper` | INEXISTENTE | Só hook `useRetry` | — |
| COMP | `Dropzone` (variant default/compact/minimal) | INEXISTENTE | `ui/file-upload.tsx` exporta `FileUpload, SimpleFileInput` | — |
| COMP | Animações `animate-fade-in/out, scale-in/out, slide-in-right/out-right`, `hover-scale`, `story-link` | PARCIAL | `tailwind.config.ts` bloco `animation` só `accordion-down`, `accordion-up` (+ plugin `tailwindcss-animate`); `grep -rn "hover-scale\|story-link" src/index.css src/styles/ tailwind.config.ts` → 0 | 6 keyframes e 2 utilitários não definidos |
| COMP | Rota `/showcase` ("veja todos os componentes") | INEXISTENTE | Não há `path="/showcase"`; existe `path="/style-guide"` → `src/pages/StyleGuide.tsx` | Link do doc quebrado |

Confirmados (não listados): Card base; `Input` `variant`/`inputSize` (`ui/input.tsx:8-9`); `SearchInput`; `Badge` variants `success/warning/info` (`ui/badge.variants.ts:14-16`); `NotificationBadge`, `CountBadge` (`ui/badge.tsx`), `StatusBadge` (`ui/status-badge.tsx`); `Skeleton animated` (`ui/skeleton.tsx:8`); `EmptyState` com `illustration`/`variant` (`ui/empty-state.tsx:20-21`), `NoResults`, `ErrorState`; `InfoTooltip`; `TabsList variant`, `TabsTrigger icon/badge`, `TabsContent animation` (`ui/tabs.tsx:14,45-46,100`), `AnimatedTabs`, `VerticalTabs`; `AccordionItem variant`, `AccordionTrigger icon/iconPosition` (`ui/accordion.tsx:17,42-43`); `useCommandMenu`; `ErrorBoundary` (base); `FileUpload`.

**Contagem (c):** 56 itens · **21 confirmados** · **5 parciais** · **30 inexistentes** · 0 renomeados. O título "47 componentes UI aprimorados" não bate com o código (`ls src/components/ui | wc -l` → 97 arquivos, mas 30 dos 47 documentados não existem).

---

## (d) docs/ARCHITECTURE.md e docs/ARCHITECTURE_GRAPH.md

| Doc | Item | Status | Evidência | O que falta |
|---|---|---|---|---|
| ARCH | Camada 3 "Acesso a dados (`src/services`)" | INEXISTENTE | `ls -d src/services` → not found; `ls -d src/*/` → `__tests__ components config contexts hooks integrations lib pages routes styles test types`; acesso a dados vive em `src/hooks/*` + `src/integrations/supabase/` | Camada descrita não existe |
| ARCH | "Leituras de single record usam **sempre** `.maybeSingle()`" | PARCIAL | `grep -rn "\.maybeSingle()" src/` → 70; `grep -rn "\.single()" src/` → 100 | Regra não é "sempre" |
| ARCH | Edge `gerar-alertas-tributarios` "com retry+timeout" | PARCIAL | `supabase/functions/gerar-alertas-tributarios/index.ts:4,46-54` → `withRetry` (backoff); `grep -nE "timeout\|AbortSignal"` → 0 | Timeout não implementado |
| ARCH | Elisão "9 estratégias paralelas" | PARCIAL (divergente) | `ls src/lib/tributario/elisao/` → 13 `detectar-*.ts`; `orquestrador-elisao.ts` referencia 13 detectores distintos | Número desatualizado (13, não 9) |
| ARCH | "Página `/tributario/elisao`" | RENOMEADO | Rota real `path="/tributario/oportunidades-elisao"` | Caminho errado |
| ARCH | "RBAC 4 papéis: admin, financeiro, operacional, visualizador" | PARCIAL | Enum `app_role` em `types.ts` tem 8 valores (`admin, manager, operator, viewer, financeiro, operacional, visualizador, contador`) | Doc desatualizado |
| ARCH | "HIBP ativo em signup" | PARCIAL / NÃO VERIFICADO | `grep -rniE "hibp\|pwned"` → só front: `src/components/auth/PasswordStrengthIndicator.tsx`, `src/components/configuracoes/SecurityStatusBanner.tsx`; 0 em `supabase/` | Ativação server-side (Auth settings) não é verificável no repo |
| ARCH | Link `./TECHNICAL_AUDIT_RESILIENCE.md` | INEXISTENTE | `test -e docs/TECHNICAL_AUDIT_RESILIENCE.md` → não existe | Link quebrado |
| ARCH | Referências `mem://…` (6 ocorrências) | NÃO VERIFICÁVEL | Não há `mem://` no repo; são memórias do Lovable | — |
| GRAPH | §2.2 "SCIM (dentro de `auth/`)" | RENOMEADO | `ls src/components/auth \| grep -i scim` → vazio; arquivos em `src/components/admin/sso/Scim*.tsx` | Localização errada |
| GRAPH | §2.3 "`hooks/bling/*` — Bling ERP (11 hooks)" | PARCIAL (divergente) | `ls src/hooks/bling \| grep -c ^use` → 9 arquivos; `grep -rhoE "export … use[A-Za-z]+" src/hooks/bling` → 33 hooks | Contagem não bate |
| GRAPH | §4.2 tabela `cobrancas` | INEXISTENTE | `types.ts` Tables sem `cobrancas`; existem `fila_cobrancas, execucoes_cobranca, execucoes_regua_cobranca, templates_cobranca, regua_cobranca*`; 0 `CREATE TABLE … cobrancas\b` em migrations | — |
| GRAPH | §4.2 `historico_boletos` | RENOMEADO | Existe `historico_cobrancas_boletos` | — |
| GRAPH | §4.2 `nfe_vinculo` | INEXISTENTE | Tables `nfe_*` → só `nfe_eventos, nfe_recebidas`; 0 migrations | Vínculo NF-e é via edge `nfe-vinculo-proxy`/hook `useNfeVinculo`, sem tabela própria |
| GRAPH | §4.2 `certificados_digitais` | RENOMEADO | Existe `empresas_certificados` | — |
| GRAPH | §4.2 `sped_contabil` | RENOMEADO | Existe `sped_contabil_arquivos` | — |
| GRAPH | §4.2 `metricas_aprendizado_ia` | INEXISTENTE | `grep -oE "^      (metricas\|ia_)[a-z_]*: \{" types.ts` → vazio; 0 migrations | — |
| GRAPH | §4.2 `sso_configs` | RENOMEADO | Existem `sso_providers, sso_role_mappings, sso_user_groups, sso_login_attempts, sso_sandbox_runs` | — |
| GRAPH | §4.2 `digest_preferences` | RENOMEADO | Existe `user_digest_preferences` (+ `digest_envios_log`) | — |
| GRAPH | §4.2 `snapshots_conformidade` | RENOMEADO | Existe `conformidade_snapshots` | — |
| GRAPH | §4.2 `entrega_obrigacoes` | RENOMEADO | Existe `entregas_obrigacoes` | — |
| GRAPH | §4.2 `audit_log` | RENOMEADO | Existe `audit_logs` (e `security_audit_logs`, `user_action_audit`) | — |
| GRAPH | §4.1 "106 views totais, 30 com security_invoker" | PARCIAL (divergente) | `types.ts` Views → 18; nomes distintos de `CREATE VIEW` em migrations → 36; `security_invoker` aparece em 119 linhas de migrations | Números não reproduzíveis pelo repo |
| GRAPH | §5 paridade motor "86 casos" | NÃO VERIFICADO | `src/lib/tributario/__tests__/paridade-motor-edge.test.ts` existe (202 linhas, 2 `it` + 4 `it.each`); contagem de casos não extraível por grep | — |

Confirmados (não listados): ARCH — stack, Bling/Asaas/Bitrix24/Resend (`supabase/functions/{bling,asaas}-*`, 15 funções com Resend), `fn_auditoria_financeira` (2 migrations) → `auditoria_financeira`, `alertas_tributarios`, `frontend_error_logs`, `oportunidades_elisao`, `apuracoes_irpj_csll` (todas em `types.ts` e migrations), Realtime `postgres_changes` em `src/hooks/useAlertasTributarios.ts:99-103`, sino (`SinoNotificacoes*`), `orquestrador-elisao.ts`, `ExportRelatorioAvancadoPDF.tsx`, ErrorBoundary global (`src/App.tsx:100`) reportando telemetria (`ErrorBoundary.tsx:5-6,46` → `frontend_error_logs`), axe-core (`package.json:98,135` `axe-core`/`vitest-axe`, `src/test/a11y/`), `src/lib/tributario`, `src/lib/financeiro`, `vw_contas_pagar_painel` (15 migrations, em `types.ts`), `SET search_path` (232 migrations), `get_cron_run_history`, `log_audit`, lockout (`AccountLockoutBanner`, `get_lockout_details`, `account_lockouts` em `20251231132405_*.sql`), IP/Geo (`security_settings.restrict_by_ip`, `enable_geo_restriction`), `external-data` contrato `tabela/search/page/limit` (`index.ts:173-186`) e `fallback: true` (`:219`), `LOVABLE_API_KEY` (22 funções). Interceptor Supabase: `src/integrations/supabase/client.ts:20` "Proxy para interceptar chamadas e adicionar breadcrumbs" + `src/lib/error-tracking.ts`; breadcrumbs de navegação: `src/components/navigation/ContextualBreadcrumbs.tsx`. GRAPH — 55/55 diretórios de componentes, 49/49 hooks, 11/11 `_shared` (incl. `exigirUsuario`/`exigirChamadaInterna` em `auth-guard.ts:100,274`, `validatePayload` em `validation.ts:19`), 66/66 edge functions, 23/34 tabelas, 1048 migrations (≥571), 247 tabelas em `types.ts` (≥130), 265 arquivos em `src/hooks` (≈264), `shared-logic.ts`↔`tributario-logic.ts`, docs referenciados (`PLANO_MELHORIAS_50_ETAPAS_2026-09-13.md`, `EDGE_FUNCTIONS_CATALOG.md`, `SECURITY.md`, `src/lib/arquitetura/`).

**Contagem (d):** ARCHITECTURE.md — 40 itens · **31 confirmados** · **5 parciais** · **1 renomeado** · **2 inexistentes** · 1 não verificável. ARCHITECTURE_GRAPH.md — 228 itens · **213 confirmados** · **3 parciais** · **9 renomeados** · **3 inexistentes** · 1 não verificado.

---

## Totais

| Documento | Auditados | Confirmados | Parciais | Renomeados | Inexistentes |
|---|---:|---:|---:|---:|---:|
| INVENTARIO_FUNCIONALIDADES.md | 280 | 237 | 4 | 17 | 22 |
| FUNCIONALIDADES_SEM_UI.md | 32 | 26 | 6 | 0 | 0 |
| COMPONENTS.md | 56 | 21 | 5 | 0 | 30 |
| ARCHITECTURE.md | 40 | 31 | 5 | 1 | 2 (+1 não verificável) |
| ARCHITECTURE_GRAPH.md | 228 | 213 | 3 | 9 | 3 (+1 não verificado) |

---

## Anexo — A3 — Auditoria: guias de features, integrações, n8n/automação, papéis, OpenAPI, Banco Inter

Só itens NÃO IMPLEMENTADO / PARCIAL (inclui simulado/mock) / RENOMEADO (desatualizado). Itens confirmados no código foram omitidos das tabelas e contados no fim. Caminhos relativos a `/home/user/Promo_Finance_V2`.

## 1. docs/guides/features/boletos.md

| Doc | Item | Status | Evidência | O que falta |
|---|---|---|---|---|
| boletos.md | Emissão — "Integração com bancos" | PARCIAL | `src/hooks/useBoletos.ts:127-128` lança erro se `provider !== 'asaas'`; único caminho é `asaas-proxy` (`supabase/functions/asaas-proxy/index.ts:392-476`); `useBoletos.types.ts:50` `provider?: 'asaas'` | Nenhum banco direto; só Asaas. Doc deveria dizer "via Asaas" |
| boletos.md | Emissão — "Geração de código de barras" | PARCIAL | `useBoletos.ts:125-126` "O sistema não fabrica linha/código local"; `src/components/boletos/BoletoBarcode.tsx` só renderiza o que o Asaas devolve | Geração é do provedor, não do sistema |
| boletos.md | Cobrança — "Email/WhatsApp/SMS" | PARCIAL | `supabase/functions/executar-regua-cobranca/index.ts:166-192` trata só `email` e `whatsapp`, demais caem em "Canal sem provedor"; WhatsApp → `whatsapp-ia-proativo/index.ts:689-695` só insere `historico_cobranca_whatsapp` com `status:'gerado'` (zero `fetch` a provedor); SMS só ícone em `src/components/cobranca/ReguaCobrancaConfig.tsx:30` e CHECK em `supabase/migrations/20260822113000_reconciliar_execucoes_regua_cobranca.sql:7` | Envio real de WhatsApp e SMS |
| boletos.md | Cobrança — "Descontos progressivos" | NÃO IMPLEMENTADO | `grep -rni "desconto_progressiv\|desconto progressivo\|descontoProgressivo" src supabase` = 0 | Tudo |

## 2. docs/guides/features/contas-pagar-receber.md

| Doc | Item | Status | Evidência | O que falta |
|---|---|---|---|---|
| contas-pagar-receber.md | "Agendamento de pagamentos" | NÃO IMPLEMENTADO | `grep -rli "pagamento.*agendad\|agendar.*pagamento\|agendarPagamento" src` = 0; `contas_pagar` só tem `data_pagamento`/`forma_pagamento` (`src/integrations/supabase/types.ts:4340-4346`), sem coluna de agendamento; nenhuma tabela `*agend*` além de `relatorios_agendados` | Modelo + UI + job de pagamento agendado |

## 3. docs/guides/features/expert-ai.md

| Doc | Item | Status | Evidência | O que falta |
|---|---|---|---|---|
| expert-ai.md | "Categorização automática" como capacidade do Expert | RENOMEADO | Não existe na tela Expert (`grep categoriz src/components/expert/` = 0); categorização é edge separada `categorizar-despesa` consumida por `src/hooks/useCategorizacaoIA.ts` e por `conciliacao-ia`/`asaas-proxy`/`bling-proxy` | Doc atribui ao Expert o que é módulo à parte |
| expert-ai.md (e `docs/FUNCIONALIDADES_SISTEMA.md:233`, `docs/GAPS_ENTERPRISE.md:295`: "15 tools") | "15 tools" do expert-agent | RENOMEADO/PARCIAL | `supabase/functions/expert-agent/index.ts` não declara nenhuma tool (`grep "tools\|functionDeclarations\|name: '"` = 0); chamada ao gateway Lovable sem `tools` (`index.ts:177-186`, modelo `google/gemini-2.5-flash`). O que existe são **15 "ações" em prompt** `[ACTION]{...}[/ACTION]` (`index.ts:34-79`, "### 1" a "### 15") parseadas no front (`src/hooks/useExpertActions.ts` — 15 `case`) | Não é tool-calling nativo; são ações por convenção textual. Contagem 15 bate, natureza não |

## 4. docs/guides/features/relatorios.md

| Doc | Item | Status | Evidência | O que falta |
|---|---|---|---|---|
| relatorios.md | Tipo "Análise de custos" | NÃO IMPLEMENTADO | `grep -rli "analise.de.custos\|analise_custos\|AnaliseCustos\|RelatorioCustos" src` = 0; tipos reais no front: dre, balanco, inadimplencia, fluxo_caixa, aging | Relatório de custos |
| relatorios.md | Agendamento — "Email automático" | PARCIAL | `supabase/functions/executar-relatorios/index.ts:124-132` só gera dados e insere `historico_relatorios` (`status:'gerado'`); zero `email`/`Resend`/`invoke` no arquivo. Só relatórios **tributários** enviam e-mail (`enviar-relatorios-tributarios-agendados/index.ts:87-89`, Resend) | Envio por e-mail dos relatórios financeiros agendados |
| relatorios.md | Agendamento — "Formato: PDF, Excel" | PARCIAL | `relatorios_agendados` não tem coluna de formato (types.ts:13485-13509: destinatarios, frequencia, tipo_relatorio); agendado grava JSON em `dados_relatorio`. PDF só manual (`src/components/relatorios/ExportRelatorioAvancadoPDF.tsx`) e no tributário (pdf-lib); Excel só exportação manual | PDF/Excel na execução agendada |

## 5. docs/guides/features/fluxo-caixa.md

| Doc | Item | Status | Evidência | O que falta |
|---|---|---|---|---|
| fluxo-caixa.md | "Alertas de saldo baixo" | PARCIAL | Só visual na tela: `src/components/fluxo-caixa/AlertasRuptura.tsx:222-225` (saldo projetado < 0). `supabase/functions/gerar-alertas/index.ts` não gera alerta de saldo (`grep saldo` = 0); `grep "saldo_baixo\|saldo_minimo" supabase/migrations` = 0 | Alerta persistido/notificado (push/e-mail) e limiar configurável |

## 6. docs/guides/features/notas-fiscais.md

| Doc | Item | Status | Evidência | O que falta |
|---|---|---|---|---|
| notas-fiscais.md | Emissão NFe passos 1-5 ("Transmitir à SEFAZ") | PARCIAL | Tela nativa desligada: `src/components/nfe/NovaNFeForm.tsx:84,92,254` "Emissão indisponível: a integração SEFAZ ainda precisa ser homologada". Nenhuma edge de autorização SEFAZ (`grep -rl "nfeAutorizacao\|enviNFe" supabase/functions src/lib` = 0). Emissão real só via Bling: `bling-proxy` ações `criar_nfe`/`enviar_nfe_sefaz` (`src/hooks/useBlingNFe.ts:231,246`, `src/hooks/bling/useNFe.ts:25,35`) | Emissão própria SEFAZ; doc não cita Bling |
| notas-fiscais.md | Cancelamento (24h, motivo, envio automático à SEFAZ) | PARCIAL | `src/components/nfe/CancelamentoNFe.tsx:69-82` recusa com toast "Cancelamento indisponível…" (antes usava simulador). Cancelamento real só via Bling `cancelar_nfe` (`useBlingNFe.ts:272`). Simulador `src/lib/sefaz-simulator/handlers.ts:28-30,64,87,99,111` (`Math.random`, delays) ainda no repo, hoje só importado como tipo (`CancelamentoNFe.tsx:19`, `SefazStatusPanel.tsx:14`, `InutilizacaoNFe.tsx:74-80` também recusa) | Cancelamento SEFAZ direto; remover simulador |

## 7. docs/guides/features/conciliacao-bancaria.md

| Doc | Item | Status | Evidência | O que falta |
|---|---|---|---|---|
| conciliacao-bancaria.md | Algoritmo "Levenshtein Distance" | NÃO IMPLEMENTADO (RENOMEADO) | `grep -rli levenshtein src supabase/functions` = 0. Similaridade real: normalização NFD + `includes` + palavras-chave (`src/lib/transaction-matcher/similarity.ts:3-94`); match IA é prompt LLM Gemini (`supabase/functions/conciliacao-ia/index.ts:140-142,185`) | Doc descreve algoritmo que não existe |
| conciliacao-bancaria.md | Pesos "Valor +40 / Data +30 (±3 dias +20) / Descrição +20-30; threshold 60%" | PARCIAL (divergente) | Local `DEFAULT_CONFIG` (`src/lib/transaction-matcher/types.ts:55-65`): valorExato 50, valorProximo 30, nomeExato 40, nomeParcial 25, dataProxima 20, documento 30, cnpj 60, `toleranciaDias: 5`, `scoreMinimo: 45`. IA (`conciliacao-ia/index.ts:62-67`): 40/30/20/10 **no prompt**, confiança alta ≥80 / média ≥60 (`:239`) | Alinhar números do doc ao código |
| conciliacao-bancaria.md | "Janela de dias ±3" e "Confiança mínima 60%" (Configurações) | PARCIAL (divergente) | `src/components/conciliacao/ConfiguracaoConciliacaoPanel.tsx:44-46,72-74`: `tolerancia_centavos 0.5`, `periodo_tolerancia_dias 5`; não há campo de confiança mínima (`grep confianca` = 0) | Campo de confiança mínima na UI ou corrigir doc |
| conciliacao-bancaria.md | "Confirmar >90%, revisar 70-90%" | PARCIAL (divergente) | Faixas reais 80/60 (`conciliacao-ia/index.ts:89-90,239`) | Corrigir doc |
| conciliacao-bancaria.md | Categorização "aprende com confirmações" | PARCIAL | Feedback gravado em `feedback_conciliacao_ia` e usado só em métricas/insights (`src/hooks/useHistoricoConciliacaoIA.ts:81,143`, `useMetricasAprendizadoIA.ts`, `useInsightsIA.ts:26`); regras são manuais (`regras_conciliacao`, `useRegrasConciliacao.ts`); nenhum retreino/ajuste de modelo | Realimentação efetiva do matcher |
| conciliacao-bancaria.md | Relatório "Tempo médio de processamento" | NÃO IMPLEMENTADO | `grep -n tempo src/components/conciliacao/ConciliacaoDashboard.tsx` = 0 (há `taxaAcertoIA` :71) | Métrica |
| conciliacao-bancaria.md | API `conciliacaoIA.execute({extratoId, threshold})` / `conciliacaoIA.confirmMatch(matchId)` | NÃO IMPLEMENTADO | `grep -rn "conciliacaoIA\|confirmMatch" src` = 0. Real: `supabase.functions.invoke('conciliacao-ia')` e `invokeEdge('conciliacao-proxy', {action:'desfazer'})` (`src/hooks/useConciliacao.ts:249-256`) | Doc inventa SDK |
| conciliacao-bancaria.md | "Precisão ~95%" | NÃO VERIFICADO | Nenhuma métrica fixa no código; só `taxaAcertoIA` calculada por feedback | Remover número sem fonte |

## 8. docs/guides/features/analise-preditiva.md

| Doc | Item | Status | Evidência | O que falta |
|---|---|---|---|---|
| analise-preditiva.md | "Regressão Logística + Random Forest, 15 features, retreino mensal, acurácia 87,3%" | NÃO IMPLEMENTADO | `supabase/functions/analise-preditiva/index.ts:266-273` e `executar-analise-preditiva/index.ts:189-196` chamam `google/gemini-2.5-flash` via gateway Lovable com prompt; `grep -rli "random forest\|logistic\|retrein\|retrain" src supabase/functions` = 0 (hits só em logística Bling/importação XML) | Não há modelo ML; é LLM |
| analise-preditiva.md | Variáveis cadastrais "Score de crédito externo", "Setor", "Canais de contato", "Sazonalidade" | NÃO IMPLEMENTADO | `grep -n "score_credito\|serasa\|setor\|canal" analise-preditiva/index.ts` = 0; prompt recebe contas_receber/pagar, clientes(score), transacoes_bancarias, metas (`executar-analise-preditiva/index.ts:48-67`) | Fontes de dados externas |
| analise-preditiva.md | Score por cliente 0-30/31-60/61-100 (BAIXO/MÉDIO/ALTO) | RENOMEADO/PARCIAL | Saída é por **empresa**: `score_saude_financeira 0-100`, `clientes_risco` (lista), alertas `critico/alto/medio/baixo` (`analise-preditiva/index.ts:188-248`); `clientes.score` existe (types.ts:3794) mas faixas 30/60 não aparecem (`grep "<= 30\|>= 60"` = 0) | Score individual por cliente com faixas |
| analise-preditiva.md | Dashboard "Precisão do modelo", "ROC curve" | NÃO IMPLEMENTADO | `grep -rli "roc\b\|auc\b\|precisao\|acuracia" src/components/dashboard/PrevisaoIA.tsx src/hooks/useAlertasPreditivos.ts` = 0 | Métricas de modelo |
| analise-preditiva.md | Alertas "transições de categoria" / "score crescente" | PARCIAL (NÃO VERIFICADO) | Existe `alertas_preditivos` + `src/components/dashboard/AlertasPreditivosPanel.tsx`, `useInadimplenciaSegmentada.ts:273`; lógica de transição não localizada | Confirmar/implementar transição |
| analise-preditiva.md | API `inadimplenciaIA.predict({clienteId, valorTransacao})` | NÃO IMPLEMENTADO | `grep -rn inadimplenciaIA src` = 0 | Doc inventa SDK |
| analise-preditiva.md | Monitoramento "Precisão mensal / Calibração trimestral / Retreino <85%" | NÃO IMPLEMENTADO | Sem modelo, sem retreino (ver 1ª linha) | — |

## 9. docs/guides/integrations/overview.md

| Doc | Item | Status | Evidência | O que falta |
|---|---|---|---|---|
| overview.md | Bitrix24 — "Configurar em Settings > Integrações" | RENOMEADO | `src/pages/Integracoes.tsx:177-189` só tem abas open-finance, whatsapp, api-docs, credentials, simulation; Bitrix tem UI própria em `src/components/bitrix/` (BitrixConfigTab, BitrixMappingTab, BitrixSyncLogsTab) | Atualizar caminho |
| overview.md | Bitrix24 — "Sync bidirecional de clientes" | PARCIAL | Inbound `sync_contacts`/`sync_companies` (`supabase/functions/bitrix24-sync/index.ts:399-557`); outbound só `export_payment_status` → `crm.deal.update` (`:670`); `grep "crm.contact.add\|crm.contact.update"` = 0 | Escrita de clientes no Bitrix |
| overview.md | Bitrix24 — "Webhooks em tempo real" | PARCIAL | `supabase/functions/bitrix24-webhook/index.ts:161-164` valida e registra idempotência, mas handler é `async () => undefined` — evento não é processado | Processar eventos recebidos |
| overview.md | Bitrix24 — "CPF/CNPJ → UF_CRM_XXX" | PARCIAL | `grep -n "UF_CRM\|cnpj\|cpf" bitrix24-sync/index.ts` = 0; só mapeamento dinâmico via `bitrix_field_mappings` (`:243`) | Mapeamento fixo não existe; doc deve apontar para tabela |
| overview.md | SEFAZ — "Séries de notas" | NÃO IMPLEMENTADO | Nenhuma tabela/config de séries em types.ts (só coluna `notas_fiscais.serie`, :10168); `grep serie src/components/nfe/*Config*.tsx` = 0 | Configuração de séries |
| overview.md | SEFAZ — "Contingência ativada", "Contingência SVCAN/SVCRS" | PARCIAL (mock) | `src/components/nfe/ContingenciaNFe.tsx:49-55` + `src/lib/sefaz-contingency/storage.ts:19,42,50,91` só `localStorage`; `grep -rli "SVCAN\|SVCRS" supabase/functions` = 0 | Contingência real no backend |
| overview.md | SEFAZ Emissão — "Validação automática / Retry em caso de falha / Cancelamento até 24h" | NÃO IMPLEMENTADO | Emissão própria desligada (`NovaNFeForm.tsx:84`), cancelamento recusa (`CancelamentoNFe.tsx:75-82`); retry/backoff existe só para **recepção DF-e** (`sefaz-dfe-dispatcher/index.ts:3,119,158`) | Emissão SEFAZ nativa |
| overview.md | SEFAZ Monitoramento — "Status em tempo real / Fila / Taxa de rejeição / Tempo médio" | PARCIAL (mock) | `src/components/nfe/SefazMonitor.tsx:42` lê `getSefazHealthStatus()` (localStorage); `SefazAnalytics.tsx:35` usa `src/lib/sefaz-event-logger.ts` (array em memória, `:35`). Dados reais só para DF-e: `src/hooks/useSefazObservability.ts:38,54` (`v_sefaz_observability`, `integrity_alerts`) | Métricas de emissão reais |
| overview.md | Open Finance — "Autorizar no app do banco / Consentimento 12 meses / Renovação automática" | NÃO IMPLEMENTADO | `supabase/functions/open-finance/index.ts:38-60`: `ACOES_SEM_PROVEDOR` recusa `create_consent/get_accounts/get_balances/get_transactions/import_transactions` com `MENSAGEM_SEM_PROVEDOR` ("Open Finance não homologado"); `createConsent` lança erro (`:335-340`). Mock de saldo/extrato **já removido** (comentário `:39-47`); só sobrou lista hardcoded de bancos em `get_institutions` (`:245-293`). Secrets `OPEN_FINANCE_CLIENT_ID`/`OPEN_FINANCE_REDIRECT_URI` referenciados sem provedor. UI `src/components/integracoes/OpenFinancePanel.tsx` existe | Provedor homologado (Pluggy/Belvo/direto) |
| overview.md | Open Finance — "Saldo em tempo real / Extrato 12 meses / Pagamentos agendados / Limites de crédito" | NÃO IMPLEMENTADO | Idem acima; `grep "agendad\|limite" open-finance/index.ts` = 0 | Tudo |
| overview.md | WhatsApp — Setup "Meta Business / Número / Templates aprovados / Webhook" | PARCIAL | `src/components/integracoes/WhatsAppConfigPanel.tsx:12-13` guarda `phoneId`/`accessToken` em `useState` e não persiste (nenhum `from(`/`upsert`); nenhuma secret `WHATSAPP_*`/`META_*`/`EVOLUTION_*` em `Deno.env.get` (grep em `supabase/functions`); webhook `whatsapp-webhook` existe com HMAC (`index.ts:43-45`) | Persistir credenciais e conectar provedor |
| overview.md | WhatsApp — "Cobrança automatizada" | PARCIAL (sem envio) | `whatsapp-ia-proativo/index.ts:513-700` ação `enviar-mensagem` só insere `historico_cobranca_whatsapp` `status:'gerado'` (`:689-695`); `grep -rln "graph.facebook.com\|evolution\|sendText" supabase/functions` = 0 | Envio real |
| overview.md | WhatsApp — "Status de leitura" | PARCIAL | Webhook mapeia `read/delivered` (`whatsapp-webhook/index.ts:116`), mas sem envio real nenhum status chega | Depende do envio |
| overview.md | WhatsApp — "Respostas rápidas" | NÃO IMPLEMENTADO | `grep -rli "respostas r[áa]pidas\|quick_repl\|quickRepl" src` = 0 | Tudo |
| overview.md | WhatsApp — "Agendamento de mensagens" | PARCIAL | Só agendamento via régua/fila (`fila_cobrancas`, `processar-fila-cobrancas`); sem agendamento avulso de mensagem (`grep "agendad\|scheduled" src/hooks/useWhatsApp*.ts` = 0) | Agendamento avulso |
| overview.md | Integrações existentes **sem seção no doc**: Bling, Asaas, CNPJa, Resend, n8n, SEFAZ DF-e | RENOMEADO (doc incompleto) | Edges: `bling-proxy`/`bling-webhook` (+`BLING_CLIENT_ID/SECRET`, UI `src/pages/Bling.tsx`), `asaas-proxy`/`asaas-webhook` (+`ASAAS_API_KEY`/`ASAAS_WEBHOOK_TOKEN`, `src/hooks/useAsaas.ts`), `cnpja-lookup` (+`CNPJA_API_KEY`, `src/hooks/useCnpjaLookup.ts`), `RESEND_API_KEY` em 14 funções, `n8n-dispatch`/`n8n-callback` (sem UI), `sefaz-dfe-*` (+`SEFAZ_CRON_SECRET`, `NFE_CERT_MASTER_KEY`) | Documentar |

## 10. docs/N8N_WORKFLOWS.md

| Doc | Item | Status | Evidência | O que falta |
|---|---|---|---|---|
| N8N_WORKFLOWS.md | Dispatch `POST /functions/v1/n8n-dispatch` e exemplo `supabase.functions.invoke("n8n-dispatch", {body})` | PARCIAL | Edge existe, mas exige header `x-n8n-secret` = `N8N_DISPATCH_SECRET` (`supabase/functions/n8n-dispatch/index.ts:98-99`, 401 sem ele); o exemplo do doc não envia header | Doc omite autenticação |
| N8N_WORKFLOWS.md | Callback ação `update_driver_approval` | NÃO IMPLEMENTADO | `supabase/functions/n8n-callback/index.ts:20` `z.enum(['create_task','create_alert','log'])` | Ação não existe |
| N8N_WORKFLOWS.md | Callback "Header opcional `x-n8n-secret`" | RENOMEADO | Autenticação primária é HMAC `x-n8n-signature: sha256=<hex>` (`n8n-callback/index.ts:107-113`); `x-n8n-secret` é fallback transitório com aviso de migração (`:153-157`); obrigatório, não opcional | Atualizar doc |
| N8N_WORKFLOWS.md | Evento `driver_approval` / `payload: driver` | NÃO IMPLEMENTADO | Nenhum chamador de `n8n-dispatch` em `src/` ou `supabase/functions/` (grep = 0); `driver_approval` só em migrations; módulo descomissionado em `supabase/migrations/20260824124500_descomissionar_modulo_lalamove.sql`; tabela `driver_approvals` ausente em types.ts | Nenhum evento é emitido hoje |
| N8N_WORKFLOWS.md | `create_task` "Revisar motorista" com `driver_id` | RENOMEADO | `create_task` grava `bitrix24_activities` com `subject/order_id/deal_id` (`n8n-callback/index.ts:173-178`); `driver_id` só em `create_alert` (`:190`) | Payload do exemplo não bate |
| N8N_WORKFLOWS.md | Cadastro de workflow | PARCIAL | Só via SQL em `n8n_workflow_configs`; nenhuma UI (`grep -rln n8n src` só `types.ts` e `src/lib/arquitetura/modulos.ts`) | Tela de cadastro |

## 11. docs/AUTOMACAO_LOCAL.md

| Doc | Item | Status | Evidência | O que falta |
|---|---|---|---|---|
| AUTOMACAO_LOCAL.md | Cadeia noturna "`repo-automation nightly` → `central.mjs`" | NÃO VERIFICADO | `central.mjs` não existe no repo (`grep -rn central.mjs scripts/` = 0; só citado no doc :29). `.tools/repo-automation/` é gitignored (`.gitignore:75-76`) | Doc já avisa que o timer está fora do repo; o nome do core não é verificável |
| AUTOMACAO_LOCAL.md | Hooks preservados "incluindo commit-msg" | PARCIAL | `.husky/commit-msg` não existe (só `pre-commit`, `pre-push`) | Ajustar doc |
| AUTOMACAO_LOCAL.md | "Workflows anteriores preservados: 16" | RENOMEADO (desatualizado) | `.github/workflows/` tem 20 arquivos: além dos 16 listados, `automation-local.yml` (o novo), `auto-update-pr-branch.yml`, `settings-guard.yml`, `README.md` | Listar os 2 workflows faltantes |

Confirmados: todos os ~90 scripts da tabela de inventário existem; `scripts/automation.mjs`, `scripts/automation.config.json`, 3 suites, `graphify.local.json`, aliases `automation:*` em `package.json:49-57`, workflow `automation-local.yml:37-39` (`doctor --static` + `test`).

## 12. docs/ADR-003-PAPEIS-POR-EMPRESA.md

| Doc | Item | Status | Evidência | O que falta |
|---|---|---|---|---|
| ADR-003 | "`user_empresas` é o único vínculo real" / papéis por empresa não existem | RENOMEADO (desatualizado) | `user_empresas.role app_role NOT NULL DEFAULT 'visualizador'` (`supabase/migrations/20260531123734_e923a347-4d43-4af5-b68f-db154ca7f62b.sql:6`; `types.ts:16426`); front já usa `roleAtual` = role do vínculo da empresa atual (`src/hooks/useAuth.tsx:21-22`, `src/hooks/usePermissions.ts:14-15`) | ADR ignora papel-por-empresa já existente no vínculo |
| ADR-003 | Recomendação (b): remover desvio `if (!isAdmin)` das 9 funções | NÃO IMPLEMENTADO (status "proposto") | 7/9 mantêm o desvio: `calcular-health-score-operacional/index.ts:227-242`, `comparar-benchmark-setorial:75-81`, `contabilizar-evento:70-80`, `gerar-dre-tributaria:42-48`, `gerar-heatmap-tributario:100-106`, `gerar-pdf-tributario:91-97`, `prever-carga-tributaria:70-76`. 2/9 trocaram por `exigirAdminOuVinculo` (`gerar-acoes-recomendadas:49`, `gerar-resumo-executivo-semanal:197`), que também libera admin global lendo `user_roles` direto (`_shared/auth-guard.ts:448-470`) | Decisão do dono + aplicar (b) |
| ADR-003 | Teste de contrato "falha o build quando o desvio reaparece" | PARCIAL | `_shared/contract-coverage_test.ts:256` "has_role nao vira desvio **novo**" — só bloqueia funções novas; as 7 conhecidas são toleradas (`:241`) | Baseline a zerar |
| ADR-003 | "Policies RLS com has_role('admin') entram em segunda rodada" | NÃO IMPLEMENTADO | 261 ocorrências de `has_role(auth.uid(), 'admin')` em `supabase/migrations/` | Rodada não iniciada |

## 13. docs/MATRIZ_PAPEIS.md

| Doc | Item | Status | Evidência | O que falta |
|---|---|---|---|---|
| MATRIZ_PAPEIS.md | Papéis `app_role`: 5 listados; `contador` "proposto" | RENOMEADO | Enum real tem 8: `admin, manager, operator, viewer, financeiro, operacional, visualizador, contador` (`types.ts:19269-19277`; `manager/operator/viewer` em `migrations/20260712223143_stub-app-role-values.sql:4-6` e `20260711164723:7`); `contador` existe desde `20260518164611:5` | Documentar os 3 stubs e `contador` como existente |
| MATRIZ_PAPEIS.md | Rotas privilegiadas em "`src/App.tsx` + ProtectedRoute" | RENOMEADO | `grep requiredRoles src/App.tsx` = 0; estão em `src/routes/adminRoutes.tsx:85-177`; há rota com `requiredRoles={['admin','financeiro']}` (`:177`) não documentada; `CentroPrivacidadeLGPD` está em `contabilRoutes.tsx:53` | Atualizar arquivo e rotas |
| MATRIZ_PAPEIS.md | Guard `webhook-auth` usado por `asaas-webhook` | RENOMEADO | `asaas-webhook/index.ts:40` usa header próprio `asaas-access-token`; `webhook-auth` é importado por `whatsapp-webhook`, `bling-webhook`, `bitrix24-webhook`, `webhook-simulator` | Corrigir linha |
| MATRIZ_PAPEIS.md | Contagens "~31 funções chamam user_empresas", "~17 has_role" | PARCIAL | 26 funções com `user_empresas`, 13 com `rpc('has_role')` (grep em `supabase/functions/*/index.ts`); `x-cron-secret` em 10, `x-internal-secret` em 1 | Atualizar números |
| MATRIZ_PAPEIS.md | Tabelas `lancamentos`, `movimentacoes_bancarias`, `nfe_documentos`, `obrigacoes_fiscais`, `bling_config`, `certificados_*`, `sped_*` | RENOMEADO | Não existem em `types.ts` (0 ocorrências). Reais: `lancamentos_contabeis`, `transacoes_bancarias`/`movimentacoes`/`extrato_bancario`, `notas_fiscais`/`nfe_recebidas`/`nfe_eventos`, `entregas_obrigacoes`, `bling_tokens`, `empresas_certificados`, `sped_contabil_arquivos` (único `sped_*`) | Corrigir nomes |

## 14. docs/api/openapi.yaml

| Doc | Item | Status | Evidência | O que falta |
|---|---|---|---|---|
| openapi.yaml | `/n8n-callback` — "Autenticado pelo header x-n8n-secret", parâmetro `required: true` (`:316-324`) | RENOMEADO (desatualizado) | Código: HMAC `x-n8n-signature` primário, `x-n8n-secret` fallback deprecado (`n8n-callback/index.ts:107-113,153-157`) | Documentar `x-n8n-signature` |
| openapi.yaml | Edges públicas (`verify_jwt = false`) sem documentação | PARCIAL (contagem) | `supabase/config.toml`: 52 funções com `verify_jwt = false`; documentadas entre elas: 10 (asaas-webhook, bling-webhook, bitrix24-webhook, whatsapp-webhook, n8n-callback, sso-initiate, sso-callback, scim-server, validar-token-contador, get-vapid-key) → **42 não documentadas** (ex.: `sso-logout`, `mcp-query`, `asaas-proxy`, `bling-proxy`, `expert-agent`, `external-data`, `sefaz-dfe-*`, `webhook-replay`) | Documentar ou justificar |
| openapi.yaml | `/health` sem `security` (público) | NÃO VERIFICADO | `health` não aparece na lista `verify_jwt = false` do `config.toml`; código trata anônimo (`health/index.ts:9-12,31`) | Confirmar flag no deploy |

Endpoints documentados sem implementação: **0** (os 16 paths / 11 edges existem; métodos e campos de `sso-initiate` (`:53-54,81,96`), `validar-token-contador` (`:15,93-111`), `asaas-webhook` (`:40`), `get-vapid-key`, `get-mapbox-token`, SCIM (`GET/POST/PATCH/PUT/DELETE` em Users/Groups) batem).

## 15. docs/agentes/banco-inter-api.md

| Doc | Item | Status | Evidência | O que falta |
|---|---|---|---|---|
| banco-inter-api.md | Integração Banco Inter (edges `inter-cobranca-emitir`/`inter-cobranca-webhook`, tabela `inter_cobrancas`, secrets `INTER_*`) | NÃO IMPLEMENTADO (plano) | `ls supabase/functions | grep ^inter` = vazio; `grep -rn "INTER_CLIENT_ID\|inter-cobranca\|inter_cobrancas" supabase src` = 0. Únicas menções a "Inter": lista hardcoded de bancos em `open-finance/index.ts:287-290`, código `077` em `src/hooks/useBankAccounts.ts` e `src/lib/barcode-parser.ts` | Tudo — coerente com o próprio doc ("hoje não existe nenhuma integração") |
| banco-inter-api.md | Pré-requisito "mTLS já existe em `_shared/sefaz/pfx.ts` e `sefaz-dfe-puxar/index.ts:189`" | NÃO VERIFICADO | Não auditado nesta rodada | Confirmar `Deno.createHttpClient` |

## Contagens por documento

| Documento | Itens checados | OK | Não implementado | Parcial/mock | Renomeado/desatualizado | Não verificado |
|---|---|---|---|---|---|---|
| boletos.md | 6 | 2 | 1 | 3 | 0 | 0 |
| contas-pagar-receber.md | 9 | 8 | 1 | 0 | 0 | 0 |
| expert-ai.md (+ "15 tools") | 9 | 7 | 0 | 0 | 2 | 0 |
| relatorios.md | 8 | 5 | 1 | 2 | 0 | 0 |
| fluxo-caixa.md | 5 | 4 | 0 | 1 | 0 | 0 |
| notas-fiscais.md | 7 | 5 | 0 | 2 | 0 | 0 |
| conciliacao-bancaria.md | 18 | 10 | 3 | 4 | 0 | 1 |
| analise-preditiva.md | 12 | 5 | 5 | 2 | 0 | 0 |
| integrations/overview.md | 25 | 8 | 6 | 9 | 2 | 0 |
| N8N_WORKFLOWS.md | 9 | 3 | 2 | 2 | 2 | 0 |
| AUTOMACAO_LOCAL.md | ~100 | ~97 | 0 | 1 | 1 | 1 |
| ADR-003 | 8 | 4 | 2 | 1 | 1 | 0 |
| MATRIZ_PAPEIS.md | 14 | 9 | 0 | 1 | 4 | 0 |
| openapi.yaml | 16 paths + 2 | 16 | 0 | 1 (42 edges públicas sem doc) | 1 | 1 |
| banco-inter-api.md | 2 | 0 | 1 | 0 | 0 | 1 |

---

## Anexo — A4 — Auditoria planejado × implementado: GAPS_ENTERPRISE · PLANO_EXCELENCIA_10_10 · prod-readiness

Base conferida: `main` em `a406e993` (19/11/2026, PR #476), repositório local somente leitura. Toda evidência é `arquivo:linha` ou `comando → resultado` no repo. O que depende do banco/infra de produção (aplicação de migration, cron, tráfego de integração) está marcado **NÃO VERIFICÁVEL no repo** — não foi assumido como feito.

Legenda de status: **IMPLEMENTADO** (existe e cobre o gap) · **PARCIAL** (existe algo, falta o essencial listado) · **NÃO IMPLEMENTADO** (nada no código).

---

## Doc 1 — `docs/GAPS_ENTERPRISE.md` (71 gaps + 21 itens de roadmap)

### 1.1 Os 71 gaps

| Doc | Domínio/Seção | Item | Status | Evidência | O que falta |
|---|---|---|---|---|---|
| GAPS | 1. Multi-empresa | Consolidação contábil multi-empresa (eliminação intercompany) | PARCIAL | `src/components/contabilidade/dre-balanco/DreBalancoToolbar.tsx:120` opção "Consolidado (Todas)" (soma simples); `src/components/tesouraria/ConsolidacaoMultiCNPJ.tsx` (saldos); `src/components/tesouraria/FluxoInterEmpresas.tsx:8` lê `transferencias` | Eliminação de saldos/resultados intercompany; consolidação contábil com ajustes |
| GAPS | 1. Multi-empresa | Conversão multi-moeda automática (USD/EUR + variação cambial) | NÃO IMPLEMENTADO | `grep -rli "taxa_cambio\|variacao_cambial\|exchange_rate" src supabase` → só `src/lib/currency.ts:6` (tipo `CurrencyCode` para formatação) e `src/components/ui/currency-input.tsx`; `grep -n "moeda" src/integrations/supabase/types.ts` → 0 colunas | Coluna de moeda nas transações, tabela de cotações, variação cambial contabilizada |
| GAPS | 1. Multi-empresa | Plano de contas unificado vs por empresa (toggle) | PARCIAL | Plano de contas por `empresa_id` + `src/components/contabilidade/ImportarPlanoContasDialog.tsx:28-29` (modelo CSV), `PlanoContasTab.tsx:110` | Toggle "plano único para o grupo"; plano-modelo compartilhado |
| GAPS | 1. Multi-empresa | Fechamento contábil centralizado matriz/filial | NÃO IMPLEMENTADO | `grep -rli "periodo_fechado\|periodos_contabeis\|bloquear_periodo"` → 0; só fechamento **tributário** (`src/hooks/useFechamentoTributario.ts`, `supabase/functions/executar-fechamento-tributario`) | Bloqueio de período contábil, fechamento em lote por grupo |
| GAPS | 2. Contabilidade | Contabilidade dupla automática | IMPLEMENTADO | `supabase/functions/contabilizar-evento/index.ts` (272 l.); triggers `validar_partidas_dobradas` (`supabase/migrations/20261112003647_validar_partidas_dobradas_ativa.sql:39`) e `contabilizar_movimentacao` (`20261112023354_contabilizacao_automatica_movimentacoes.sql`); regras por categoria (`20261116170000_estorno_contabil_movimentacao_origem.sql:104-134`); UI `src/components/contabilidade/ContabilizacaoAutomaticaTab.tsx` | Robustez: índice único `(origem, origem_id)` ausente (J2 do prod-readiness) |
| GAPS | 2. Contabilidade | Razão geral, livro diário, balancete | IMPLEMENTADO | `src/components/contabilidade/RazaoDiarioTab.tsx`, `razao-diario/RazaoList.tsx`, `razao-diario/DiarioTable.tsx`, `BalanceteTab.tsx`, `balancete/BalanceteTable.tsx`; correção do `fn_balancete` em `20261113181100_balancete_tipo_partida_debito_credito.sql` | — (aplicação da 20261113181100 em prod NÃO VERIFICÁVEL no repo) |
| GAPS | 2. Contabilidade | SPED ECD | IMPLEMENTADO | `supabase/functions/gerar-sped-ecd/index.ts` (353 l.) + `layout.ts` com registros 0000/0001/0007/0020/I001/I010/I030/I050/I051/I150/I155/I200/I250/J001/J005/J100/J150/J900/9999 + `layout_test.ts`; `src/components/contabilidade/SpedEcdWizard.tsx`, `SpedEcdDownloadStep.tsx`, `PreValidacaoSpedPanel.tsx` | — |
| GAPS | 2. Contabilidade | SPED ECF | IMPLEMENTADO | `supabase/functions/gerar-sped-ecf/index.ts` (391 l.) + `layout.ts` com blocos 0, C, J, K, L, M, N + `layout_test.ts`; `src/components/contabilidade/SpedEcfWizard.tsx`, `SpedEcfHistorico.tsx` | — |
| GAPS | 2. Contabilidade | DRE contábil | IMPLEMENTADO | `src/components/demonstrativos/DREStatement.tsx:32` (`useDemonstrativosContabeis`, fonte competência) ; `src/components/contabilidade/dre-balanco/`; `src/pages/Demonstrativos.tsx:50` toggle de fonte | — |
| GAPS | 2. Contabilidade | Balanço Patrimonial | IMPLEMENTADO | `src/components/demonstrativos/BalancoPatrimonial.tsx:29`; `src/components/contabilidade/dre-balanco/BalancoView.tsx:219`; `BalancoDesequilibrioIndicator.tsx` | — |
| GAPS | 2. Contabilidade | DFC método indireto | PARCIAL | `src/components/demonstrativos/FluxoCaixaContabil.tsx:308` "Demonstração pelo Método Direto (CPC 03)"; `:392` "segue rigorosamente o método direto" | Método indireto (partindo do lucro líquido) |
| GAPS | 2. Contabilidade | DMPL/DLPA | NÃO IMPLEMENTADO | `grep -rli "DMPL\|DLPA\|mutac" src` → 0 | Demonstrativo inteiro |
| GAPS | 3. Estoque | Gestão de estoque própria | NÃO IMPLEMENTADO | Só leitura via Bling: `src/components/bling/BlingEstoquePanel.tsx`, `src/hooks/bling/useEstoque.ts`; 0 tabelas de estoque em `supabase/migrations` fora dos dumps de reconciliação | Módulo de estoque próprio |
| GAPS | 3. Estoque | Custeio (PEPS/UEPS/médio) | NÃO IMPLEMENTADO | `grep -rli "PEPS\|UEPS\|custo_medio\|custeio" src supabase/migrations` → 0 | Tudo |
| GAPS | 3. Estoque | Inventário cíclico/rotativo | NÃO IMPLEMENTADO | `grep -rli "inventario" src/pages src/components` → 0 | Tudo |
| GAPS | 3. Estoque | Ordem de Compra com workflow de aprovação | PARCIAL | `src/pages/Compras.tsx` (309 l.): lista `pedidos_compra` com `itens_pedido_compra` (`:55-57`), badges `pendente_aprovacao`/`aprovado` (`:83-87`), KPI "Aguardando aprovação" (`:162`); `src/components/compras/PedidoCompraForm.tsx:97-106` cria pedido com `status: 'pendente_aprovacao'` e `empresa_id` obrigatório (`:41`); RLS de escrita em `20261113181200_rls_escrita_compras_transacoes_bancarias.sql` | **Não há ação de aprovar/rejeitar**: `grep -rn "pedidos_compra" src` → só o form (insert) e a listagem; sem alçada, sem recebimento, sem vínculo com contas a pagar |
| GAPS | 3. Estoque | Recebimento de mercadorias (NFe entrada → estoque) | NÃO IMPLEMENTADO | `grep -rli "recebimento.*mercadoria\|nfe_entrada\|entrada_estoque" src supabase` → 0 | Tudo |
| GAPS | 3. Estoque | Cotação de fornecedores (RFQ) | NÃO IMPLEMENTADO | `grep -rli "cotacao_fornecedor\|RFQ" src supabase/migrations` → 0 | Tudo |
| GAPS | 4. Folha & RH | Folha de pagamento completa | NÃO IMPLEMENTADO | `src/hooks/useHistoricoFinanceiro.ts:1,25-33` ("CRUD Faturamento + Folha mensal", `FolhaRow.total_folha` agregado) | Cálculo CLT/INSS/FGTS/IRRF |
| GAPS | 4. Folha & RH | eSocial | NÃO IMPLEMENTADO | Só item de calendário de obrigações: `src/lib/tributario/obrigacoes/catalogo.ts:70-78` ("eSocial — folha mensal") | Geração/envio de eventos S-1000..S-5013 |
| GAPS | 4. Folha & RH | DCTFWeb / DARF folha | NÃO IMPLEMENTADO | DARF existente é tributário (`src/lib/tributario/darf/consolidar.ts`); obrigação só como lembrete no catálogo | Apuração de DARF de folha e DCTFWeb |
| GAPS | 4. Folha & RH | Férias, 13º, rescisões | NÃO IMPLEMENTADO | `grep -rli "rescis\|decimo_terceiro\|ferias" src supabase/functions` → 0 | Tudo |
| GAPS | 4. Folha & RH | Holerite digital | NÃO IMPLEMENTADO | `grep -rli "holerite" src` → 0 | Tudo |
| GAPS | 4. Folha & RH | Ponto eletrônico | NÃO IMPLEMENTADO | Tabelas `ponto_departamentos/funcionarios/registros/sync_log` só em migration antiga, ausentes em prod e com 0 refs (`docs/prod-readiness.md:580-582`) | Tudo |
| GAPS | 5. CRM & Vendas | Pipeline de vendas próprio | NÃO IMPLEMENTADO | Só espelho do Bitrix24: `src/components/bitrix/BitrixDealsTab.tsx:18-32` (`bitrix_deal_id`, `deals`) | Pipeline nativo |
| GAPS | 5. CRM & Vendas | Cotação/Proposta → pedido | NÃO IMPLEMENTADO | `src/pages/Orcamentos.tsx:29-45` lê `budgets` (orçamento financeiro, não proposta comercial); 0 "proposta_comercial" | Tudo |
| GAPS | 5. CRM & Vendas | Catálogo de produtos + tabela de preços por cliente | NÃO IMPLEMENTADO | Só `src/hooks/bling/useProdutos.ts` (Bling) | Catálogo e tabelas de preço próprios |
| GAPS | 5. CRM & Vendas | Comissionamento de vendedores | NÃO IMPLEMENTADO | `grep -n "comissao" src/integrations/supabase/types.ts` → 0; `grep -i comiss src/pages/Vendedores.tsx` → 0 | Regras, apuração e pagamento de comissão |
| GAPS | 5. CRM & Vendas | CPQ | NÃO IMPLEMENTADO | `grep -rli "\bCPQ\b" src` → 0 | Tudo |
| GAPS | 6. Projetos | Project Accounting (orçado vs realizado por projeto) | PARCIAL | `src/pages/OrcamentoEvento.tsx:38-41` (orçado × realizado por `centros_custo`), `src/pages/CentroCustosArvoreOrcadoVsRealizado.tsx` | Entidade "projeto" (hoje é centro de custo), ciclo de vida, orçamento por fase |
| GAPS | 6. Projetos | Timesheet → faturamento por horas | NÃO IMPLEMENTADO | `grep -rli "timesheet\|apontamento_horas" src supabase` → 0 | Tudo |
| GAPS | 6. Projetos | Milestones / faturamento por entrega | NÃO IMPLEMENTADO | `grep -rli "milestone" src supabase` → 0 | Tudo |
| GAPS | 6. Projetos | Margem de contribuição por projeto | PARCIAL | `src/pages/OrcamentoEvento.tsx:74` (`margem: gastoReceber - gastoPagar` por centro de custo) | Margem de contribuição formal (custos variáveis) por projeto |
| GAPS | 6. Projetos | WIP accounting | NÃO IMPLEMENTADO | 0 ocorrências | Tudo |
| GAPS | 7. Tesouraria | Aplicações financeiras com marcação a mercado | NÃO IMPLEMENTADO | `grep -rli "aplicacao_financeira\|CDB\|LCI\|marcacao" src supabase/migrations` → 0 | Tudo |
| GAPS | 7. Tesouraria | Hedge cambial / derivativos | NÃO IMPLEMENTADO | `grep -rli "hedge\|derivativ" src supabase/migrations` → 0 | Tudo |
| GAPS | 7. Tesouraria | Cash pooling intercompany | PARCIAL | `src/components/tesouraria/FluxoInterEmpresas.tsx:8` (transferências entre empresas) e `ConsolidacaoMultiCNPJ.tsx` (saldos consolidados) | Varredura automática de saldos, conta-corrente intercompany, juros |
| GAPS | 7. Tesouraria | Conciliação automática de cartões (taxas adquirente) | NÃO IMPLEMENTADO | `grep -rli "adquirente\|taxa_cartao\|conciliacao_cart" src supabase/migrations` → 0; só `src/components/asaas/CobrancaCardForm.tsx` (captura de cartão na cobrança) | Tudo |
| GAPS | 7. Tesouraria | Antecipação automática de recebíveis (FIDC) | PARCIAL | `src/pages/SimuladorAntecipacao.tsx` + `src/components/simuladores/simulador-antecipacao.utils.ts:5` (simulação); `src/components/asaas/AntecipacaoDialog.tsx` (antecipação via Asaas) | FIDC, antecipação automática por regra |
| GAPS | 7. Tesouraria | Política de crédito automatizada (limite por cliente) | PARCIAL | `clientes.limite_credito` (`src/components/clientes/ClienteFormFields.tsx:219`), `src/hooks/useScoringClientes.ts:72,161` (score + atualização de limite), `src/components/cobranca/previsao/risco.ts` | Bloqueio automático de venda/título acima do limite |
| GAPS | 8. BI | Cubo OLAP / drill-down ilimitado | PARCIAL | `src/components/bi/BIDrillDown.tsx`, `src/components/dashboard-empresa/EmpresaDrillDown.tsx` (drill fixo) | Cubo/dimensões livres |
| GAPS | 8. BI | Dashboards 100% customizáveis | PARCIAL | `src/components/dashboard/DashboardConfigDialog.tsx:56-57` (exibir/ocultar, tamanhos P/M/G), `src/hooks/useDashboardConfig.ts:143` (persistência por usuário em localStorage) | Criar widgets/métricas próprias; persistência no banco |
| GAPS | 8. BI | Construtor de relatórios visual | NÃO IMPLEMENTADO | `src/pages/Relatorios.tsx:250-261` tipos fixos (`fluxo`, `dre`); `grep -rli "report.?builder\|relatorios_personalizados" src supabase/migrations` → 0 | Tudo |
| GAPS | 8. BI | Conector ODBC/REST para Power BI/Tableau | PARCIAL | `supabase/functions/mcp-query/index.ts:1-10` (gateway SQL read-only por `x-mcp-secret`) + PostgREST nativo do Supabase | Conector/driver documentado, credencial por cliente, DSN ODBC |
| GAPS | 8. BI | Data warehouse histórico >2 anos | PARCIAL | Particionamento mensal + `drop_old_partitions(p_table, p_retention_months)` (`supabase/migrations/20260825110000_reconciliar_schema_v3_completo.sql:1080`); 8 migrations com snapshot/materialized view | DW separado; política de retenção explícita por domínio |
| GAPS | 8. BI | Forecasting ARIMA/Prophet | NÃO IMPLEMENTADO | `supabase/functions/analise-preditiva/index.ts:273` `model: 'google/gemini-2.5-flash'` (LLM); `grep -rli "arima\|prophet\|holt" src/lib src/hooks supabase/functions` → 0 | Modelo estatístico |
| GAPS | 9. Segurança | SSO corporativo (SAML 2.0, OIDC, Azure AD, Okta) | IMPLEMENTADO | `supabase/functions/sso-initiate/index.ts:78-84` (SAML via Supabase nativo; OIDC com discovery + PKCE), `sso-callback/`, `sso-generate-metadata/`, `sso-validate-config/`, `sso-test-login/`, `sso-logout/`; `src/pages/admin/SSOAdmin.tsx:52` (Azure AD/Okta/Google), rota `/admin/sso` (`src/routes/adminRoutes.tsx:135`); `sso_providers = 4` em prod (`docs/prod-readiness.md` §1.5) | `sso-callback` e `sso-logout` sem Zod (`scripts/security/zod-coverage.sh` → baseline 3) |
| GAPS | 9. Segurança | SCIM 2.0 | IMPLEMENTADO | `supabase/functions/scim-server/index.ts` (1.155 l.; Users + Groups, ServiceProviderConfig/ResourceTypes/Schemas, provisioning em `user_empresas`/`user_roles`); `src/pages/admin/ScimAudit.tsx` (`/admin/scim-audit`, `adminRoutes.tsx:151`); `docs/api/openapi.yaml:559+` | `scim-server` sem Zod (baseline) |
| GAPS | 9. Segurança | Field-level security | NÃO IMPLEMENTADO | Só máscara de IP na UI (`src/components/admin/IpMaskToggle.tsx`, `src/hooks/useIpMaskPreference.ts`); 0 "permissoes_campo/column_permission" | Permissão por campo em RLS/UI |
| GAPS | 9. Segurança | Segregação de funções (SoD) | PARCIAL | Alçadas de aprovação (`src/hooks/useAprovacoes.ts:76,93`, `src/components/aprovacoes/ConfiguracaoAprovacaoCard.tsx`, `src/pages/Aprovacoes.tsx`) + RBAC 4 papéis (`scim-server/index.ts:11`) | Matriz de conflitos de funções, bloqueio de combinação de papéis |
| GAPS | 9. Segurança | SOC 2 Type II / ISO 27001 | NÃO IMPLEMENTADO | `grep -rli "soc ?2\|iso.?27001" src docs` → 0 (fora do próprio GAPS) | Processo de certificação |
| GAPS | 9. Segurança | Data residency | NÃO IMPLEMENTADO | 0 ocorrências | Tudo |
| GAPS | 9. Segurança | Audit log imutável (hash) | PARCIAL | `REVOKE UPDATE, DELETE, TRUNCATE ON public.audit_logs FROM authenticated` (`supabase/migrations/20260728172037_…sql:44`, `20261116151000_grants_authenticated_audit_por_coluna.sql:23`) | Cadeia de hash/assinatura (`grep -rli "prev_hash\|hash_chain\|row_hash"` → 0) |
| GAPS | 10. i18n | i18n completo (PT-BR/EN/ES) | PARCIAL | `src/i18n.ts` (i18next; pt/en/es com **14 chaves** no namespace `common`, 80 linhas), `src/main.tsx:5` importa; troca de idioma pt/en em `src/components/layout/Header.tsx:70,157-160`; `grep -rl useTranslation src` → **2 arquivos** (Header, SidebarNavGroups) | Extração das strings de todas as telas; arquivos de tradução; ES no seletor |
| GAPS | 10. i18n | Multi-moeda em todos os módulos | NÃO IMPLEMENTADO | Ver gap "Conversão multi-moeda": só formatação (`src/lib/currency.ts`) | Tudo |
| GAPS | 10. i18n | Localizações fiscais não-BR | NÃO IMPLEMENTADO | `supabase/functions/calculo-iva/index.ts:7-12` é IVA dual CBS/IBS (Reforma BR); `grep -rli "mexico\|VAT\b" src supabase/functions` → 0 | Tudo |
| GAPS | 10. i18n | IFRS reporting | NÃO IMPLEMENTADO | `grep -rli "IFRS" src supabase/migrations` → 0; só CPC 03 (`FluxoCaixaContabil.tsx:308`) | Tudo |
| GAPS | 10. i18n | Timezone por usuário | PARCIAL | Preferência `fusoHorario` em `src/components/configuracoes/SistemaTab.tsx:168-169` e `src/pages/Configuracoes.tsx:91` (default `America/Sao_Paulo`) | Persistência no banco e uso na formatação de datas (`grep -rn fusoHorario src` → só configurações) |
| GAPS | 11. Plataforma | API pública REST documentada (OpenAPI 3.0) | PARCIAL | `docs/api/openapi.yaml` (3.0.3, 16 paths: 4 webhooks inbound, n8n-callback, sso-*, scim, validar-token-contador, health, get-vapid-key, get-mapbox-token); `supabase/functions/api-keys-manage/index.ts` + tabela `api_keys` com `key_hash` (`supabase/migrations/20260728164001_…sql:90-107`); `src/pages/admin/ApiManagement.tsx` (`/admin/api`) | **Nenhuma função autentica por `api_keys`** (`grep -rln "api_keys\|x-api-key" supabase/functions` → só `api-keys-manage`); não há endpoints REST de dados financeiros para terceiros; o OpenAPI diz na própria descrição que as ~90 funções internas estão fora do contrato |
| GAPS | 11. Plataforma | Webhooks de saída configuráveis pelo cliente | NÃO IMPLEMENTADO | `src/pages/admin/ApiManagement.tsx:206-220`: "Nenhum webhook configurado", botão **disabled** com title "O cadastro de endpoints ainda não foi implantado"; 0 tabela `webhook_endpoints`; o que existe é saída fixa para n8n (`supabase/functions/n8n-dispatch/index.ts:1-4`, `n8n_workflow_configs`) e Slack/Resend internos | Cadastro de endpoints, assinatura HMAC, retries, catálogo de eventos |
| GAPS | 11. Plataforma | App marketplace / plugins | NÃO IMPLEMENTADO | `grep -rli "marketplace\|plugin" src/pages src/components` → só `ui/carousel.tsx` (lib) | Tudo |
| GAPS | 11. Plataforma | Workflow builder visual no-code | PARCIAL | Regras parametrizáveis: `src/components/configuracoes/RegrasRoteamentoTab.tsx`, `ReguaCobrancaTab.tsx`, alçadas (`ConfiguracaoAprovacaoCard.tsx`), motor externo n8n (`n8n-dispatch`) | Builder visual, condições/ações genéricas |
| GAPS | 11. Plataforma | Custom fields por entidade | PARCIAL | Tabelas `custom_field_definitions`/`custom_field_values` (`supabase/migrations/20260519124706_…sql:2,17`); `src/pages/admin/CustomFieldsAdmin.tsx` (CRUD de definições por `entity_type`, rota `/admin/campos-customizados` em `adminRoutes.tsx:255`) | **Nenhum formulário renderiza/grava valores**: `grep -rn "custom_field_values\|useCustomFields" src` → só `types.ts`; campos definidos não aparecem em cliente/fornecedor/etc. |
| GAPS | 11. Plataforma | Custom objects | NÃO IMPLEMENTADO | `grep -rli "custom_object\|custom_tables" src supabase/migrations` → 0 | Tudo |
| GAPS | 11. Plataforma | Sandbox separado de produção | PARCIAL | `.github/workflows/staging-migrate.yml:38-41` preparado para `STAGING_DB_URL/PROJECT_REF/ANON_KEY` (condicionais); `docs/prod-readiness.md` §9.4: "não há banco descartável (branch/staging)"; `src/components/admin/sso/sandbox/` é simulador de claims SSO, não ambiente | Projeto Supabase de staging + deploy de preview apontando para ele |
| GAPS | 12. Operações | SLA contratual com créditos | PARCIAL | `src/pages/StatusPage.tsx:197-202` texto "SLA Enterprise … 99.5%"; `docs/runbooks/UPTIME_OBSERVABILIDADE.md` | Contrato, medição de uptime real, créditos |
| GAPS | 12. Operações | Disaster Recovery (RPO/RTO documentados) | PARCIAL | `docs/runbooks/BACKUP_DR.md` (RPO até 24h sem PITR; cenários A…; gaps: confirmar plano PITR, Storage sem réplica) | RTO numérico, teste de restore documentado, réplica do Storage |
| GAPS | 12. Operações | Backup point-in-time self-service | NÃO IMPLEMENTADO | `grep -rli "backup\|restore\|PITR" src/pages/admin src/components/admin` → 0 (só `AnomaliasFiltersBar.tsx` por coincidência de termo) | Tudo |
| GAPS | 12. Operações | Status page pública | PARCIAL | Rota `/status` (`src/App.tsx:39,68`), `StatusPage.tsx:25-27` consome edge `health` (checa DB/Asaas/Bling: `supabase/functions/health/index.ts:41-67`) | `uptime90d: 99.98`, `latencyMs` e `incidents24h: 0` **fixos no código** (`StatusPage.tsx:36-38`); sem histórico de incidentes nem domínio `status.promofinance.com` |
| GAPS | 12. Operações | On-call / PagerDuty | NÃO IMPLEMENTADO | Canais são só Slack + Resend: `supabase/functions/notify-performance-alert/index.ts:84-99`, `monitor-health/index.ts:132-138`; `grep -rli pagerduty src supabase` → 0 | Integração PagerDuty/Opsgenie, escala de plantão |
| GAPS | 12. Operações | Tenant isolation físico | NÃO IMPLEMENTADO | Isolamento é lógico via RLS `empresa_acessivel(empresa_id)` (AGENTS.md §4) | Tudo |

**Contagem dos 71 gaps:** IMPLEMENTADO **8** · PARCIAL **24** · NÃO IMPLEMENTADO **39**.
Por domínio (I/P/N): Multi-empresa 0/2/2 · Contabilidade 6/1/1 · Estoque 0/1/5 · Folha 0/0/6 · CRM 0/0/5 · Projetos 0/2/3 · Tesouraria 0/3/3 · BI 0/4/2 · Segurança 2/2/3 · i18n 0/2/3 · Plataforma 0/4/3 · Operações 0/3/3.

### 1.2 Roadmap P16 → P25 (21 itens)

| Doc | Fase | Item | Status | Evidência | O que falta |
|---|---|---|---|---|---|
| GAPS | Fase 1 | 1. SSO SAML 2.0 / OIDC + Azure AD / Okta | IMPLEMENTADO | `supabase/functions/sso-initiate/index.ts:78-84`, `src/pages/admin/SSOAdmin.tsx` | Zod em `sso-callback`/`sso-logout` |
| GAPS | Fase 1 | 2. SCIM 2.0 | IMPLEMENTADO | `supabase/functions/scim-server/index.ts` (1.155 l.), `src/pages/admin/ScimAudit.tsx` | Zod em `scim-server` |
| GAPS | Fase 1 | 3. API pública REST + OpenAPI 3.0 + webhooks de saída | PARCIAL | `docs/api/openapi.yaml` (só inbound/identidade/util); `api-keys-manage`; webhooks de saída = placeholder disabled (`ApiManagement.tsx:206-220`) | Endpoints de dados autenticados por API key; webhooks de saída |
| GAPS | Fase 1 | 4. i18n completo (EN/ES) + multi-moeda na visualização | PARCIAL | `src/i18n.ts` (14 chaves, 2 componentes); `src/lib/currency.ts` formata 8 moedas | Traduzir as telas; moeda por registro |
| GAPS | Fase 1 | 5. Custom fields por entidade | PARCIAL | Admin + tabelas; 0 formulários consumindo | Renderização/gravação nas entidades |
| GAPS | Fase 1 | 6. Status page pública + SLA 99.5% | PARCIAL | `/status` com texto SLA 99.5% (`StatusPage.tsx:200`); métricas fixas (`:36-38`) | Uptime/incidentes reais, domínio público |
| GAPS | Fase 2 | 7. Contabilidade dupla automática | IMPLEMENTADO | `contabilizar-evento`, triggers 20261112* | Índice único anti-duplicata (J2) |
| GAPS | Fase 2 | 8. SPED ECD + ECF | IMPLEMENTADO | `gerar-sped-ecd/`, `gerar-sped-ecf/` + wizards | — |
| GAPS | Fase 2 | 9. DRE contábil + Balanço + DFC indireto | PARCIAL | DRE e Balanço ok (`demonstrativos/`); DFC só método direto (`FluxoCaixaContabil.tsx:308`) | DFC indireto |
| GAPS | Fase 2 | 10. Consolidação multi-empresa com eliminação intercompany | PARCIAL | Soma "Consolidado (Todas)" (`DreBalancoToolbar.tsx:120`), saldos (`ConsolidacaoMultiCNPJ.tsx`) | Eliminações |
| GAPS | Fase 2 | 11. Multi-moeda real com variação cambial | NÃO IMPLEMENTADO | 0 colunas/cotações | Tudo |
| GAPS | Fase 3 | 12. Folha de pagamento + eSocial | NÃO IMPLEMENTADO | Só agregado `total_folha` e lembrete no catálogo de obrigações | Tudo |
| GAPS | Fase 3 | 13. Estoque próprio + custeio + ordem de compra | PARCIAL | Só PO básico sem aprovação (`Compras.tsx`, `PedidoCompraForm.tsx`) | Estoque, custeio, aprovação de PO |
| GAPS | Fase 3 | 14. Project accounting + timesheet + milestones | PARCIAL | Só orçado×realizado por centro de custo (`OrcamentoEvento.tsx`) | Projeto, timesheet, milestones |
| GAPS | Fase 3 | 15. Pipeline de vendas próprio + comissionamento | NÃO IMPLEMENTADO | Só `BitrixDealsTab.tsx`; 0 comissão | Tudo |
| GAPS | Fase 4 | 16. Workflow builder visual no-code | PARCIAL | Regras de roteamento/alçada/régua + n8n | Builder visual |
| GAPS | Fase 4 | 17. App marketplace + plugins | NÃO IMPLEMENTADO | 0 | Tudo |
| GAPS | Fase 4 | 18. Hedge cambial + TRM | NÃO IMPLEMENTADO | 0 | Tudo |
| GAPS | Fase 4 | 19. Tenant isolation físico + SOC 2 + ISO 27001 | NÃO IMPLEMENTADO | 0 | Tudo |
| GAPS | Fase 4 | 20. Sandbox self-service | NÃO IMPLEMENTADO | `staging-migrate.yml` só preparado; sem projeto de staging (prod-readiness §9.4) | Ambiente + self-service |
| GAPS | Fase 4 | 21. Localizações fiscais não-BR | NÃO IMPLEMENTADO | 0 | Tudo |

**Contagem roadmap (21):** IMPLEMENTADO **4** · PARCIAL **9** · NÃO IMPLEMENTADO **8**. Fase 1 fechou 2/6 (SSO, SCIM); Fase 2 fechou 2/5 (contabilidade dupla, SPED); Fases 3 e 4 sem item concluído.

---

## Doc 2 — `docs/PLANO_EXCELENCIA_10_10.md` (só pendentes/parciais e divergências)

| Doc | Seção | Item | Status | Evidência | O que falta |
|---|---|---|---|---|---|
| PLANO | Fase 1 | #1 Erradicar `: any` (doc: "4 ocorrências reais") | PARCIAL | `grep -rn ": any\b" src` (excl. testes) → **1**: `src/components/bling/BlingFinanceiroPanelFinanceiro.tsx:43` `contas: any` | 1 ocorrência para chegar ao "zero any" do DoD |
| PLANO | Fase 1 | #3 TODO/FIXME = 0 (doc marca `[x]`) | PARCIAL (regrediu) | `grep -rn "TODO\|FIXME" src supabase/functions` → 2 TODOs reais: `src/hooks/useOrganizacoes.ts:259`, `src/hooks/useBulkActions.ts:266` (os outros 7 hits são a palavra "TODOS" em comentários) | Resolver os 2 TODOs |
| PLANO | Fase 1 | #4 Modularizar arquivos > 700 linhas (doc `[~]`) | IMPLEMENTADO (na prática) | `find src … | awk '$1>700'` → só `src/integrations/supabase/types.ts` (19.645, gerado) e `src/components/ui/sidebar.tsx` (733, shadcn vendor) | Nada de código próprio; marcar `[x]` no doc |
| PLANO | Fase 2 | #5 Cobertura ≥ 85% (doc `[~]`) | NÃO VERIFICADO | `vitest.config.ts` sem `thresholds` (grep → só `exclude`); 282 arquivos `*.test.ts(x)` e 2.689 `it(`/`test(` | Threshold de cobertura configurado e número medido |
| PLANO | Fase 2 | #6 E2E ≥ 25 specs (doc "24, meta fecha com visual-theme") | IMPLEMENTADO | `find e2e -name "*.e2e.ts"` → **28**; `e2e/visual-theme.e2e.ts` existe | Marcar meta atingida |
| PLANO | Fase 2 | #7 Zod em 100% das Edge Functions (doc: "0 sem Zod, gate trava regressão") | PARCIAL (regrediu) | `bash scripts/security/zod-coverage.sh` → "Sem validação Zod: 3 — scim-server, sso-callback, sso-logout · ✅ Sem regressão (baseline 3)"; gate em `.github/workflows/ci.yml:255` | O gate aceita baseline 3, não 0; cobrir as 3 funções |
| PLANO | Fase 3 | #12 CSP (doc: Report-Only; "promover para enforce após 30 dias") | IMPLEMENTADO | `vercel.json:39` `Content-Security-Policy` (enforce, não Report-Only) | — (ação futura do doc já executada) |
| PLANO | Fase 4 | #13 Bundle analyzer + rotas > 200KB para `React.lazy` (doc `[~]`) | PARCIAL | `vite.config.ts:6,50-51` visualizer sob `ANALYZE=1`; 118 `lazy(` em `src/routes/*Pages.ts` (todas as páginas lazy) | Evidência do mapeamento de chunks > 200KB (não há relatório no repo) |
| PLANO | Baseline | Testes "1.012 casos / 80 arquivos" e demais métricas da tabela | DESATUALIZADO | Hoje 282 arquivos de teste, 2.689 casos (`grep it(`), 1.017+ migrations, 105 pastas de edge function | Atualizar baseline |

Itens `[x]` conferidos e **confirmados** no código (não listados acima): #2 (`src/lib/console-guard.ts`; único `console.log` restante é JSDoc em `src/lib/tributario/projecao-reforma.ts:158`), #8 (`supabase/tests/sql/rls_multi_empresa.sql` + `ci.yml:323`), #9 (`docs/SECURITY_DEFINER_ATTESTATION.md`), #10 (`docs/RUNBOOK.md`), #11 (`_shared/rate-limit.ts` importado em 19 functions), #16 (`src/lib/queryClient.ts:84` `DOMAIN_QUERY_CONFIG`), #17 (`/admin/sre` em `src/routes/adminRoutes.tsx:119`), #18 (`docs/EDGE_FUNCTIONS_CATALOG.md`, `docs/MIGRATIONS_ADR.md`). #14/#15 são auditorias de banco, NÃO VERIFICÁVEIS no repo.

**Contagem PLANO:** 18 itens numerados → confirmados 10 · parciais/regredidos 4 (#1, #3, #7, #13) · concluído mas doc desatualizado 2 (#4, #6) · não verificável/sem métrica 2 (#5, #14-15 agrupados).

---

## Doc 3 — `docs/prod-readiness.md` (itens pendentes/BLOQUEADO na versão de 14/11 × estado atual do repo)

### 3.1 Pendências do doc que **hoje estão resolvidas no repositório** (aplicação em produção NÃO VERIFICÁVEL daqui)

| Doc | Seção | Item | Status | Evidência | O que falta |
|---|---|---|---|---|---|
| PROD | §8 / §9.2 J1 | #338 balancete zerado (DDL aguardava dono) | IMPLEMENTADO (repo) | `supabase/migrations/20261113181100_balancete_tipo_partida_debito_credito.sql` | Confirmar no ledger de prod |
| PROD | §8 / SEC-01 | #339 RLS de escrita em `pedidos_compra`, `itens_pedido_compra`, `transacoes_bancarias` | IMPLEMENTADO (repo) | `20261113181200_rls_escrita_compras_transacoes_bancarias.sql` | Confirmar no ledger de prod |
| PROD | §7 / §8 | #344 `empresa_id` no `PedidoCompraForm` | IMPLEMENTADO | `src/components/compras/PedidoCompraForm.tsx:41` (zod obrigatório), `:99` (insert), `:153-160` (select de empresa) | — |
| PROD | §8 / DB-02 | #340 estorno contábil de movimentação | IMPLEMENTADO (repo) | `20261116170000_estorno_contabil_movimentacao_origem.sql` | Confirmar no ledger de prod |
| PROD | §8 | #345 `marcar_contas_vencidas()` + cron | IMPLEMENTADO (repo) | `20261117010000_marcar_contas_vencidas.sql` | Confirmar cron em prod |
| PROD | §9.5 / §8 | #348 GRANTs `authenticated` em `audit_logs`, `frontend_error_logs`, `planos_acao` (403 no app) | IMPLEMENTADO (repo) | `20261116151000_grants_authenticated_audit_por_coluna.sql:22-32` | Confirmar no ledger de prod |
| PROD | §6 / §8 | Telemetria de erros do front sem `GRANT INSERT` | IMPLEMENTADO (repo) | mesma migration `:30-31` (`GRANT INSERT (error_message, …) ON frontend_error_logs TO authenticated`) | idem |
| PROD | §7 / J3 | #337 dry-run da Contabilização Automática respondia 400 | IMPLEMENTADO | `src/components/contabilidade/contabilizacao-automatica/buildDryRunPayload.test.ts`; `supabase/functions/contabilizar-evento/index.ts:143-160` (dry_run não grava) | — |
| PROD | §8 / CI-4 | #342 paridade do `schema-drift` (518 falsos pendentes) | IMPLEMENTADO | `.github/workflows/schema-drift.yml:197-209` (lista de exclusão replicada do prod-migrate) | Confirmar run verde (NÃO VERIFICÁVEL no repo) |
| PROD | §8 / CI-1 | #333 guard `security_invoker` do `prod-migrate` (`estrategias_elisao_catalogo`) | IMPLEMENTADO | `.github/workflows/prod-migrate.yml:307-326`; além disso `20261117000000_catalogo_elisao_volta_a_ser_tabela.sql` | — |
| PROD | §8 | PR #293 Dependabot `mapbox-gl` (licença) | IMPLEMENTADO | `.github/workflows/dependency-review.yml:40-46` `allow-dependencies-licenses: pkg:npm/mapbox-gl`; `package.json:117` `"mapbox-gl": "^3.35.0"` | — |
| PROD | §8 | E2E Critical Gate bloqueado por IP do runner (`allowed_ips`) | IMPLEMENTADO (repo) | `20261116120000_login_allowlist_permissiva_sem_regras.sql:16-29,76` (`is_ip_allowed_for_login` permissiva sem regra ativa) | Confirmar E2E verde em prod |
| PROD | §8 / §1.3 | Particionamento de `audit_logs`/`frontend_error_logs` (22 tabelas soltas; decisão do dono) | IMPLEMENTADO (decidido: remover) | `20261118003500_drop_particoes_orfas_e_views_mortas.sql:1-20` ("Autorizado pelo dono em 2026-11-18") | — |
| PROD | §6 / §8 | `monitor-health` sem canal de alerta (TODO) | IMPLEMENTADO | `supabase/functions/monitor-health/index.ts:8-11,132-138` (Slack + Resend) | — |
| PROD | §6 / §8 | Vinculação manual "em desenvolvimento" na baixa automática | IMPLEMENTADO/REMOVIDO | `grep -n -i "desenvolvimento\|vincula" src/components/contas-receber/BaixaAutomaticaDialog.tsx` → 0 | — (texto não existe mais) |
| PROD | §9.3 DB-14 | `contabilizar-evento` grava partidas sem `empresa_id` | IMPLEMENTADO | `supabase/functions/contabilizar-evento/index.ts:186`; backfill `20261116230000_backfill_empresa_id_partidas_contabeis.sql` | — |
| PROD | §9.3 J4 | dry-run grava log `sem_regra` | IMPLEMENTADO | `contabilizar-evento/index.ts:143-151` (`if (!body.dry_run)`) | — |
| PROD | §9.3 FE-02 | troca de usuário herda config do dashboard | IMPLEMENTADO | `src/hooks/useDashboardConfig.ts:143` chave `${STORAGE_KEY}-${user.id}` | — |
| PROD | §9.3 DB-06 | `sincronizar_conta_partida` não sincroniza em UPDATE | IMPLEMENTADO (repo) | `20261112023354_…sql:33-35` trigger `BEFORE INSERT OR UPDATE OF conta_id, conta_contabil_id` | Versão em prod NÃO VERIFICÁVEL |
| PROD | §9.3 DB-03 | contabilização ignora `movimentacoes.categoria_id` | PARCIAL | `20261116170000_…sql:104-134` resolve regra por categoria, mas `v_categoria` vem de `contas_pagar`/`contas_receber` (`:104-106`); 0 referência direta a `movimentacoes.categoria_id` | Ler a categoria da própria movimentação |
| PROD | §8 | Lockout RLS Grupo B (#346) | IMPLEMENTADO | `20261114083000_rls_policies_alerts_risk_rules.sql` (doc já marcava resolvido) | — |

### 3.2 Pendências do doc que **continuam pendentes** no código

| Doc | Seção | Item | Status | Evidência | O que falta |
|---|---|---|---|---|---|
| PROD | §6 / §8 | Menu mostra itens de admin a todos os papéis | NÃO IMPLEMENTADO | `grep -n "requiredRoles" src/components/layout/sidebar/SidebarNavGroups.tsx` → 0 (só `src/lib/navigation.ts:16,114-130` define); `SidebarNavGroups.tsx:197` usa `useAuth` apenas para `user` | Filtrar grupos/itens por `requiredRoles` (decisão de produto pendente no doc) |
| PROD | §6 / §8 | Botão SMS "funcionalidade em desenvolvimento" | NÃO IMPLEMENTADO | `src/components/contas-receber/EnviarCobrancaDialog.tsx:68` `toast.info('SMS: funcionalidade em desenvolvimento')` | Provedor de SMS (custo) ou remover o botão |
| PROD | §6 / §8 / §1.5 | Web Push sem VAPID nem `aes128gcm` | PARCIAL | `supabase/functions/send-push-notification/index.ts:25-76` tem helpers VAPID, mas o envio real em `:122-129` diz "Real Web Push requires complex encryption, so we'll use a fallback" e faz POST cru no endpoint | Envio com assinatura VAPID + payload cifrado |
| PROD | §6 / §8 | Painéis duplicados no dashboard (grid + lateral) | NÃO IMPLEMENTADO | `src/components/dashboard/DashboardExecutivo.tsx:125/352` (PrevisaoIA), `:165/355` (Metas), `:175/361` (AlertasOrcamento); existe `__tests__/DashboardExecutivo.duplicidades.test.tsx` | Decisão de produto (doc) |
| PROD | §6 / §8 / §1.5 | Open Finance 100% simulado | PARCIAL (mitigado) | `supabase/functions/open-finance/index.ts:38-50`: ações de leitura/importação simuladas agora são **recusadas**; `getParticipatingInstitutions` segue lista fixa (`:245`) | Provedor real (contrato/custo) |
| PROD | §6 / §8 | Prévia de regras de conciliação com extrato fixo | NÃO IMPLEMENTADO | `src/components/conciliacao/RegrasConciliacaoPanel.tsx:86` `const mockExtrato = [` | Decisão de produto (fonte do extrato real) |
| PROD | §6 / §8 | 7 campos de `extratos_importacoes` sem tabela | NÃO IMPLEMENTADO (contornado) | `grep -rln extratos_importacoes supabase/migrations` → 0; `src/hooks/useConciliacaoPage.ts:164-165` documenta que a tabela não existe e não grava cabeçalho | Criar a tabela ou remover os campos |
| PROD | §6 / §8 | Badge "Em breve" na exportação SPED (Reforma Tributária) | NÃO IMPLEMENTADO | `src/components/reforma-tributaria/ExportacaoSPED.tsx:53,59` dois tipos `disponivel: false`; badge em `:325` | Decisão de produto |
| PROD | §4 / §8 / SEC-02 | `DROP FUNCTION gerar_lancamento_contabil_automatico` não executado em prod | NÃO VERIFICÁVEL | Só `20261112023354_…sql:149` (versão já no ledger); nenhuma migration nova reaplica o DROP (`grep -n gerar_lancamento_contabil_automatico supabase/migrations/202611[1-2]*` → só a original) | Executar/versionar o DROP (dono) |
| PROD | §9.2 J2 | Duas chamadas simultâneas a `contabilizar-evento` geram dois lançamentos (índice único) | NÃO IMPLEMENTADO | Só índice **não único** `idx_lanc_origem (origem, origem_id)` (`20260421123700_…sql:26`, `20261117204500_indices_financeiros_ausentes.sql:80`); `20261117232000_indices_anti_duplicata_contas.sql` cobre contas a pagar/receber, não lançamentos | `UNIQUE (origem, origem_id)` em `lancamentos_contabeis` |
| PROD | §9.3 SEC-06 | Idempotência da `contabilizar-evento` sem filtro de empresa | NÃO IMPLEMENTADO | `supabase/functions/contabilizar-evento/index.ts:99-104` filtra `tipo_evento`, `evento_id`, `status` — sem `empresa_id` | Adicionar `.eq('empresa_id', …)` |
| PROD | §9.3 SEC-05 | Policy em `creditos_tributarios` sem restrição por papel | NÃO IMPLEMENTADO | policy ALL `"Access by empresa_id"` (`20260825230000_initplan_rls_e67.sql:254-258`) exige vínculo ativo com a empresa ou admin, mas permite operação a outros papéis da mesma empresa; `20260902240000_fix_rls_gaps_pos_pr54.sql:95-131` aplica `empresa_acessivel` às quatro operações | Restringir por papel (admin/financeiro) sem criar policy nova que combine por OR |
| PROD | §9.3 DB-08 | `itens_pedido_compra.valor_total` estático | NÃO IMPLEMENTADO | `grep -rn itens_pedido_compra supabase/migrations/202611[1-2]*` sem trigger/generated | Coluna gerada ou trigger |
| PROD | §9.3 DB-13 | `categoria_id` sem FK em 3 tabelas | PARCIAL | `20261113163037_colunas_campos_formulario.sql:115` adiciona FK em 1 coluna; nada depois | FKs nas demais |
| PROD | §9.3 DB-05/DB-12 | Índice de categorias não normaliza caixa/espaços | NÃO IMPLEMENTADO | Só `20261112024404_categorias_nome_unico.sql:3` | Índice sobre `lower(btrim(regexp_replace(nome,…)))` |
| PROD | §9.3 FE-01 | Tamanhos Pequeno/Médio iguais no dashboard | NÃO IMPLEMENTADO | `src/components/dashboard/DashboardExecutivo.tsx:37-38` `sm: '2xl:col-span-1', md: '2xl:col-span-1'` | Diferenciar classes |
| PROD | §9.3 FE-03 | `type-check` não cobre arquivos de teste | NÃO VERIFICADO | `tsconfig.app.json` `include: ["src"]`; `tsconfig.json:29-32` exclui `e2e`; não reproduzido nesta sessão | Reproduzir com `tsc -p tsconfig.app.json --listFiles` |
| PROD | §9.3 DB-07/DB-09/DB-11/SEC-04 | Lançamento sem partidas aceito; CHECK nas colunas novas; idempotência sem índice; FKs aceitam outra empresa | NÃO VERIFICADO | Nenhuma migration pós-14/11 cita esses objetos pelo nome; exigem leitura das funções em prod | Auditoria de banco (fora do repo) |
| PROD | §8 | `webhook-retry-worker` publicado diverge do repo (2 segredos) | NÃO VERIFICÁVEL | Repo: `supabase/functions/webhook-retry-worker/index.ts:50` usa `exigirChamadaInterna(req)`; versão publicada não é visível daqui | Republicar via `functions-deploy.yml` |
| PROD | §1.5 / §8 | Integrações nunca exercidas (Asaas, Bling, Bitrix24, n8n, CNPJá, IA, WhatsApp) e sem prova (Slack/Sentry/Mapbox/Geo-IP/HIBP) | NÃO VERIFICÁVEL | Depende de tráfego/credenciais de produção | Ativar contas e testar com o provedor (dono) |
| PROD | §9.4 | RLS como `authenticated`, concorrência, crons agendados (15/11 e 01/12), replay em banco novo, logs nativos, `prod-migrate` real | NÃO VERIFICÁVEL | Itens ambientais; nenhum tem artefato no repo que prove execução | Sessão com acesso ao banco/Logs Explorer |
| PROD | §3 / CI-5 | Fila do Actions acumula cancelamentos (`contexto`/`auto-update`) | NÃO VERIFICÁVEL | `.github/workflows/contexto.yml` inalterado quanto a `concurrency` (não lido integralmente) | Ver runs no GitHub |

### 3.3 Marcados como OK/feitos no doc que **não batem** com o repo hoje

| Doc | Seção | Item | Status | Evidência | Observação |
|---|---|---|---|---|---|
| PROD | §2 | "`vitest run` 254 arquivos / **3040 testes**" | DIVERGENTE (não re-executado) | Hoje 282 arquivos `*.test.ts(x)` e 2.689 `it(`/`test(` estáticos (AGENTS.md também fala em 2.689) | Números diferentes porque o vitest expande `it.each`; não é erro, mas o doc está congelado em 13/11 |
| PROD | §1.2 | "106 pastas em `supabase/functions`" | DIVERGENTE | `ls supabase/functions` → 105 pastas de função + `_shared` + `fuzz_test.ts`/`stress_test.ts` | Contagem muda com a versão; doc desatualizado |
| PROD | §6 | "Score de crédito 'simulated for now' — OK, só comentário desatualizado" | OK | `src/lib/collection-engine.ts:48` (não re-lido) | Sem ação |
| PROD | §8 | "#346 aguarda aprovação do dono" (linha residual) | DESATUALIZADO | A mesma tabela já marca RESOLVIDO duas linhas acima; migration `20261114083000` no repo | Linha redundante no doc |
| PROD | §9.3 DB-06 | "sincronizar_conta_partida não sincroniza em UPDATE" | DIVERGENTE do repo | Trigger do repo é `BEFORE INSERT OR UPDATE OF conta_id, conta_contabil_id` (`20261112023354:34`) | Ou o achado se refere à versão de prod, ou estava errado |

**Contagem prod-readiness:** pendências/BLOQUEADOS rastreados **44** → resolvidos no repo **21** (3.1) · ainda pendentes no código **17** (3.2, excluindo NÃO VERIFICÁVEL) · NÃO VERIFICÁVEL/ambientais **6** (SEC-02 DROP em prod, webhook-retry-worker publicado, integrações, §9.4, CI-5, DB-07/09/11/SEC-04) · marcados OK mas divergentes **5** (3.3).

---

## Totais

| Documento | Itens auditados | IMPLEMENTADO | PARCIAL | NÃO IMPLEMENTADO | Não verificável |
|---|---:|---:|---:|---:|---:|
| GAPS_ENTERPRISE — 71 gaps | 71 | 8 | 24 | 39 | 0 |
| GAPS_ENTERPRISE — roadmap | 21 | 4 | 9 | 8 | 0 |
| PLANO_EXCELENCIA (pendentes/divergentes) | 9 listados / 18 do plano | 12 confirmados (incl. #4, #6, #12) | 4 (#1, #3, #7, #13) | 0 | 2 (#5, #14-15) |
| prod-readiness (pendências de 14/11) | 44 | 21 | 2 (DB-03, DB-13; + Web Push e Open Finance mitigados) | 13 | 6 |

Maiores fechamentos desde os docs: SSO + SCIM, contabilidade dupla + SPED ECD/ECF + DRE/Balanço, e 21 pendências do prod-readiness já versionadas (#338/#339/#340/#344/#345/#348, allowlist de IP, GRANTs, partições). Maiores buracos que persistem: webhooks de saída (placeholder desabilitado), API pública sem autenticação por API key, custom fields sem renderização, i18n com 14 chaves, status page com métricas fixas, menu sem filtro por papel, índice único de lançamentos contábeis (J2) e idempotência sem `empresa_id` (SEC-06).

---

## Anexo — A5 — Auditoria: planos × código atual (2026-11-20)

Base verificada: `/home/user/Promo_Finance_V2` em `a406e99` (main, 2026-11-19). Clone raso (sem histórico antigo); sem `node_modules` (`bun install` falhou por proxy 403 — `lint:strict` e `vitest` **não executados**); sem acesso ao banco canônico (MCP oficial ausente nesta sessão) nem a branch protection / secrets via API (403). Tudo marcado **NÃO VERIFICADO** indica isso, não ausência.

Legenda de status: **FEITO** · **PARCIAL** · **NÃO FEITO** · **MARCADA FEITA, NÃO ENCONTRADA** · **NÃO VERIFICADO** (evidência só existiria em banco/ops/GitHub inacessível).

---

## 1. `docs/PLANO_MELHORIAS_50_ETAPAS_2026-09-13.md` (50 etapas)

| Doc | Etapa | Título resumido | Status | Evidência | O que falta |
| --- | --- | --- | --- | --- | --- |
| P50 | 1 | Rotacionar `service_role` exposta no histórico | PARCIAL | `docs/REAUDITORIA_FINAL.md:113` lista como critério "rotacionados e confirmados pelo responsável humano"; `docs/runbooks/ROTACAO_SECRETS.md:110` tabela com `SUPABASE_SERVICE_ROLE_KEY | — | —` (sem data) | Registro datado da rotação no runbook; não verificável em código |
| P50 | 2 | Confirmar rotação do `migrate-helper` | PARCIAL | `docs/execucao-cline/baseline-lote-a.md:51` prescreve; `ROTACAO_SECRETS.md` sem linha datada para `migrate-helper`; função removida (`ls supabase/functions` sem `migrate-helper`) | Registro datado no runbook de segurança |
| P50 | 3 | `analise-preditiva` cross-tenant | FEITO | `supabase/functions/analise-preditiva/index.ts:39` `validatePayload(OptionalEmpresaIdSchema…)`, `:44` `exigirUsuarioComEmpresa`, `:75-94` `.eq('empresa_id', empresaId)` nas 4 consultas (transações via `contas_bancarias`) | — |
| P50 | 4 | `nfe-upload-certificado` | FEITO | `index.ts:11` import `exigirVinculoEmpresa`, `:122` chamada antes de usar `empresa_id` em `:193/:213` | — |
| P50 | 5 | `executar-fechamento-tributario` | FEITO | `index.ts:9,94` `exigirVinculoEmpresa(uid, body.empresa_id, req)` antes de leituras/upserts | — |
| P50 | 6 | `executar-relatorios` guard condicional | FEITO | `index.ts:80` `if (!relatorioId && guard.dados.origem !== 'interna')` rejeita lote global por usuário | — |
| P50 | 7 | `enviar-digest-conformidade` | FEITO | `index.ts:136` `exigirVinculoEmpresa`, `:142` `empresasDoUsuario`, `:159-160` filtro `.in('empresa_id', empresasPermitidas)` | — |
| P50 | 8 | `executar-analise-preditiva` mistura tenants | FEITO | `index.ts:42-62` consultas por `empresaId`; `:396` `exigirChamadaInterna`; `:412-433` loop por empresa | — |
| P50 | 9 | Helper canônico `exigirVinculoEmpresa()` | PARCIAL | `_shared/auth-guard.ts:390` (`exigirVinculoEmpresa`), `:448` (`exigirAdminOuVinculo`), `:560` (`exigirUsuarioComEmpresa`); usado em 5 `index.ts` (asaas-proxy, digest, fechamento, nfe-upload, open-finance) + `analise-preditiva` | `executar-relatorios/index.ts:91-99` ainda consulta vínculo inline (`.eq('user_id', …)`) em vez do helper |
| P50 | 10 | Teste de contrato contra IDOR | FEITO | `_shared/contract-coverage_test.ts:220` "funcao user-facing que recebe empresa_id no corpo valida o vinculo" (regex `GUARDA_DE_TENANT` `:204`) | — |
| P50 | 11 | Decidir modelo de papéis por empresa (ADR) | PARCIAL | `docs/ADR-003-PAPEIS-POR-EMPRESA.md:3` **Status: proposto (aguarda decisão)**; nenhuma migration adiciona `empresa_id` a `user_roles`; sem regra lint para `has_role` | Decisão do dono (a ou b) e implementação correspondente |
| P50 | 12 | gitleaks no CI e pre-commit | FEITO | `.github/workflows/ci.yml:24-135` job `secret-scan` (`gitleaks git --baseline-path .gitleaks-baseline.json`, SARIF); `.husky/pre-commit:15-29`; `.gitleaks.toml`, `.gitleaks-baseline.json` presentes; check obrigatório em `scripts/ci/github-settings-baseline.json:23` | Obs.: pre-commit só avisa se o binário não estiver instalado (`:27-28`) |
| P50 | 13 | Anon keys hardcoded → Vault | FEITO | `supabase/migrations/20260913120000_corrige_credenciais_automacoes_internas.sql:80` `chave_anon_vault()`, `:244` uso em `notify_performance_alert` | Chaves continuam nas 4 migrations históricas (`20260712194415`, `20260726180529`, `20260728183119`, `20260905130000`) — histórico imutável, só rotação resolve |
| P50 | 14 | Wrapper `mustSucceed()` | FEITO | `src/lib/supabase-write.ts:180`; 11 arquivos importam | — |
| P50 | 15 | ESLint `no-floating-supabase-write` | FEITO | `eslint-rules/no-floating-supabase-write.js`; `eslint.config.js:52` nível `error` | — |
| P50 | 16 | Aprovação de pagamento | FEITO | `src/hooks/expert-actions/financial-actions.ts:96-99` `mustSucceed(supabase.rpc('aprovar_solicitacao_pagamento'…))`; RPC em `20260913140000_rpcs_atomicas_fluxos_multi_passo.sql:115` | — |
| P50 | 17 | Conciliação bancária | FEITO | `src/hooks/useConciliacao.ts:44-47` `mustSucceed`; confirmação via proxy/RPC `confirmar_conciliacao_manual` (`20260913140000…:41`) que grava vínculo na mesma transação (`:66-70`) | — |
| P50 | 18 | Retenções/DARF | FEITO | `src/hooks/useRetencoesFonte.ts:218-219` `gerar_darf_retencoes`, `:255-256` `pagar_darf_retencoes`, ambos em `mustSucceed`; RPCs em `20260913140000…:199,296` | — |
| P50 | 19 | Créditos CBS/IBS | FEITO | `src/hooks/useImportacaoXMLNFe.ts:293-294` `mustSucceed(supabase.rpc('registrar_nfe_com_creditos'…))`; RPC `20260913140000…:371` | — |
| P50 | 20 | Acordos, lançamentos, anexos | PARCIAL | `useAcordosParcelamento.ts:165-200` quitação com `mustSucceed`; `useLancamentosContabeis.ts:234-235` delete compensatório em `mustSucceed`; `AnexoList.tsx:86-90` storage primeiro e `throw` em erro | `useAcordosParcelamento.ts:114-119` ao criar acordo, `update({status:'em_acordo'})` só `logger.error` (fire-and-forget persiste) |
| P50 | 21 | RPC atômica para multi-passo | FEITO | `20260913140000_rpcs_atomicas_fluxos_multi_passo.sql` define `confirmar_conciliacao_manual`, `aprovar_solicitacao_pagamento`, `gerar_darf_retencoes`, `pagar_darf_retencoes`, `registrar_nfe_com_creditos` | — |
| P50 | 22 | Views sem filtro de tenant | FEITO | `src/hooks/useViews.ts:38-41` e `:86-92` com `.eq('empresa_id')` e `empresaId` na key; `src/lib/queryClient.ts:238,243` recebem `empresaId` | — |
| P50 | 23 | `empresaId` obrigatório nas queryKeys | PARCIAL | Gate `src/lib/arquitetura/__tests__/escopo-querykey.test.ts` (DIVIDA_CONHECIDA vazia) garante presença; posição não é padronizada (`useCategorias.ts:37` `['categorias', tipo, currentEmpresaId]`) | Forma fixa `['recurso', empresaId, …]` não imposta; apenas presença |
| P50 | 24 | Invalidação heurística → estrutural | FEITO | `src/hooks/useSelectiveEmpresaInvalidation.ts` fail-closed com allowlist `RAIZES_AGNOSTICAS_A_EMPRESA` + `resetQueries` (justificativa `:24-39` para não usar `removeQueries`) | — |
| P50 | 25 | 51 queries sem empresa na chave | FEITO | Todos os hooks citados têm `empresaId` na key (`useCategorias.ts:37,75`, `useCentrosCusto.ts:14`, `useContratos.ts:7`, `useLancamentosContabeis.ts:25`, `useApuracoesTributarias.ts:71`, `useCreditosTributarios.ts:79,98`, `useRetencoesFonte.ts:85,109`); gate em `escopo-querykey.test.ts` sem dívida | `useCentrosCusto.ts:31` `['centros_custo','all']` é legítima (sem filtro de empresa) |
| P50 | 26 | Leituras não-reativas de tenant | FEITO | `src/pages/Orcamentos.tsx:48-50` `useEmpresaScope()`; `src/components/layout/sidebar/RecentAndFavorites.tsx:27` `useEmpresaScope()` | — |
| P50 | 27 | Modo consolidado | PARCIAL | UI honesta: `EmpresaScopeBar.tsx:151-156` aviso "Valores financeiros exibem apenas X… não soma"; `EmpresaScopeContext.tsx:136` ainda `ids[0]` | Agregação real por `ids` não existe; toggle "consolidado" mantido com disclaimer |
| P50 | 28 | Teste de arquitetura de escopo | FEITO | `src/lib/arquitetura/escopo-empresa.ts` + `__tests__/escopo-querykey.test.ts` | — |
| P50 | 29 | Glob que desativa 20 specs | FEITO | `ci.yml` sem `git ls-files -- 'e2e/**/*.e2e.ts'`; `scripts/ci/listar-specs-quarentena.ts:110` usa `'e2e/**/*.e2e.ts','e2e/*.e2e.ts'`; 28 specs em disco | — |
| P50 | 30 | Referência morta na exclusão | FEITO | Lista cravada não existe mais em `ci.yml:687-696` (derivada pelo script) | — |
| P50 | 31 | Promover specs financeiras ao gate | PARCIAL | `playwright.financeiro.config.ts:59-66` 6 specs/16 casos; job `e2e-financeiro` `ci.yml:641-654`; check obrigatório `github-settings-baseline.json:21`; `e2e/fixtures/{sessao,edge,financeiro}.ts`; `tsconfig.e2e.json` + `ci.yml:437` | Ondas 2+: 18 specs em quarentena (`calculadora-tributaria`, `sped-wizard`, `importacao-xml`, `aprovacoes`, `lgpd-privacidade`, `contas-pagar`/`conciliacao` reais…) |
| P50 | 32 | Recalibrar piso de cobertura | FEITO | `vitest.config.ts:62-67` lines 66 / functions 58 / branches 59 / statements 65 | — |
| P50 | 33 | Comentário obsoleto de cobertura | FEITO | `vitest.config.ts:56-61` comentário atualizado | — |
| P50 | 34 | Gate RLS/GRANT nos checks obrigatórios | FEITO | `scripts/ci/github-settings-baseline.json:16` `Supabase DB Linter` (medido 2026-11-08); `docs/agentes/github-ci.md:17` | API live devolveu 403 nesta sessão |
| P50 | 35 | Exigir ≥1 revisão aprovada | NÃO FEITO | `github-settings-baseline.json:12` `required_approving_review_count: 0` | Decisão do dono (regra 6.6: branch protection) |
| P50 | 36 | Deadlock `REQUIRED_MIGRATIONS` | FEITO | `scripts/security/test-canonical-db-gates.mjs:200-248` `pendentesDoPr`/"pendentes esperadas" | — |
| P50 | 37 | Actions Node 20 depreciado | FEITO | `grep uses:` → `checkout` v5/v6/v7, `upload-artifact` v6, `cache` v5, `setup-node` v4/v6 — todos SHA-pinned | — |
| P50 | 38 | Hook `pre-push` | FEITO | `.husky/pre-push` roda `tsc --noEmit`, `tsc -p tsconfig.e2e.json`, `vitest run --changed origin/main` | — |
| P50 | 39 | Testes dos motores tributários | PARCIAL | `src/lib/tributario/__tests__/paridade-motor-edge.test.ts`, `paridade-obrigacoes-edge.test.ts`, `drift-guard-motor.test.ts`, `decidir-regime.test.ts` | `calculo-iva` (`CRONOGRAMA` inline `index.ts:8`) e `prever-carga-tributaria` sem paridade/fronteira; pastas `simular-*`, `calculo-iva`, `decidir-regime`, `prever-carga-tributaria` sem teste Deno próprio |
| P50 | 40 | SPED ECD/ECF/Contribuições ✅ | FEITO | `_shared/sped/bloco9.ts` + `bloco9_test.ts`, `push-helper.ts`; `layout.ts`/`layout_test.ts`/`__fixtures__` em `gerar-sped-ecd`, `gerar-sped-ecf`, `exportar-sped-contribuicoes` | Pendentes declarados: decisão sobre `gerar-dre-tributaria` (stub) e comunicação da mudança fiscal |
| P50 | 41 | Testes de cobrança | PARCIAL | `executar-regua-cobranca/domain.test.ts` | `processar-fila-cobrancas` e `enviar-relatorios-tributarios-agendados` sem teste |
| P50 | 42 | Testes conciliação/categorização | NÃO FEITO | `ls` de `conciliacao-ia`, `categorizar-despesa`, `detectar-anomalias-financeiras` → só `index.ts` | Os 3 testes |
| P50 | 43 | Testes de integração externa | PARCIAL | `asaas-proxy/{index,credit-risk}.test.ts`, `open-finance/index_test.ts`, `sefaz-dfe-puxar/__tests__/` (5), `sefaz-manifestar/__tests__/payload_test.ts` | `bling-proxy` e `nfe-upload-certificado` sem teste |
| P50 | 44 | Piso de cobertura edge ✅ (antecipada) | PARCIAL | `deno-tests.yml:124-129` diretório inteiro, `--allow-net` loopback, `--ignore` sso; `contract-coverage_test.ts:58` `DIVIDA_400_CONHECIDA` com 17 entradas (era 19) | `deno coverage` com piso ausente (0 ocorrências no workflow); 17 endpoints ainda em 400; `sso-test-login/index.test.ts` sem guarda `ignore` própria |
| P50 | 45 | Reconstruir grafo e gatilho | PARCIAL | `.github/workflows/graphify.yml:4-15` `push: branches:[main]` adicionado | `permissions: contents: read` (`:33-34`) e job não commita saída; `graphify-out/GRAPH_REPORT.md:13` "Built from `79cb9a2a`" (2026-10-06) vs HEAD `a406e99` (2026-11-19); `AGENTS.md:66` mantém alegação "auto-sync N8N em 15 min" |
| P50 | 46 | Limpar branches/worktrees | FEITO | `gh api …/branches` → 6 branches remotas (`main`, `contexto`, `inventario`, `automation/estado-real`, 2 de trabalho) | Worktrees locais da máquina do dono não verificáveis aqui |
| P50 | 47 | 5 commits órfãos | PARCIAL | Conteúdo de `7c684900` presente (`docs/REMOTE_ONLY_MIGRATIONS_STRATEGY.md`) e de `8b62718f` (`docs/auditoria-financeira*`, `scripts/auditoria-financeira`) | Branches de backup citadas em `AUDITORIA_SINCRONIA §1.1` já não existem no remoto; revisão dirigida de `29eb6719` (auth-guard) sem registro; SHAs inacessíveis (clone raso) |
| P50 | 48 | PRs abertos #69/#73/#79 | FEITO | `gh api pulls`: #69 closed sem merge, #73 merged, #79 merged; único PR aberto hoje: #475 | — |
| P50 | 49 | Normalizar migrations e auditar views | PARCIAL | Views: `20261102000000_registrar_grupo_b_rls_cross_tenant.sql` aplica `security_invoker` às 4 legadas (`vw_cash_flow`, `vw_contas_atrasadas`, `vw_monthly_summary`, `vw_totals_by_category`); varredura aproximada: 0 views locais sem invoker | `001_create_tables.sql`, `002_rls_policies.sql`, `003_seed_data.sql` continuam fora do padrão de 14 dígitos; estado live das views não verificado |
| P50 | 50 | Deriva do CLAUDE.md/AGENTS.md | NÃO FEITO | `AGENTS.md:7` "105 Edge Functions" (real: 106 `index.ts`); `:11` "meta 2689/2689" (≈2.714 casos estáticos em 282 arquivos); `:66` N8N sem gatilho | Atualizar 3 números/alegações (`docs/agentes/sistema.md:38` já diz 106) |

**Contagem P50:** FEITO 32 · PARCIAL 15 (1, 2, 9, 11, 20, 23, 27, 31, 39, 41, 43, 44, 45, 47, 49) · NÃO FEITO 3 (35, 42, 50) · MARCADA FEITA, NÃO ENCONTRADA 0 (as etapas marcadas ✅ — 40 e 44 — têm os artefatos descritos).

---

## 2. `docs/REVISAO_PLANO_IMPLEMENTACOES_2026-09-12.md`

### 2.1 Achados prioritários A01–A10

| Doc | Item | Título resumido | Status | Evidência | O que falta |
| --- | --- | --- | --- | --- | --- |
| REV | A01 | EXPERT anuncia boleto inexistente | FEITO | `financial-actions.ts:264-273` `gerarBoleto` devolve `success:false` com `BOLETO_EXPERT_INDISPONIVEL`; sem `Math.random` | — |
| REV | A02 | PER/DCOMP recibo simulado | FEITO | `src/hooks/usePerDcomp.ts:72,143-146` `transmitirPerDcompNaoConfigurado()` falha fechado; sem recibo aleatório | — |
| REV | A03 | API keys parciais | PARCIAL | `api-keys-manage/index.ts:131-132` agora envia `nome`/`chave`; `:15` só `z.literal('create')`; `useApiKeys.ts:67-68` delete direto na tabela | list/rotate/revoke no handler; deploy remoto não verificável |
| REV | A04 | Passkeys sem verificação server-side | PARCIAL | `Auth.hooks.ts:303-308` bloqueia login biométrico se `!webAuthnServerVerificationAvailable` (UI honesta) | `ls supabase/functions` sem `webauthn-*`; `useWebAuthn.ts:142,253` challenge ainda gerado no navegador |
| REV | A05 | Guarda de papel ignora `expires_at` | FEITO | `_shared/auth-guard.ts:193-208`, `:456-466`, `:518-527` filtram `expires_at` | — |
| REV | A06 | Segurança do banco (95 advisors) | NÃO VERIFICADO | Em código: 23 migrations ≥ 2026-09-13 tocam `search_path`; `20261102000000` views com `security_invoker`; `20260912100000` (PR #79 mergeada) revoga RPCs anon | Advisors live não consultáveis nesta sessão |
| REV | A07 | Suítes verdes não cobrem obrigação | PARCIAL | Pisos recalibrados (`vitest.config.ts:62-67`); `tsconfig.json:24` `strict: true`; Deno roda diretório inteiro (`deno-tests.yml:124-129`) | `tsconfig.json:29-39` exclui `*.test.ts(x)`/`src/test` do type-check; `scripts/ci/deno-check-functions.sh` cobre 14 `index.ts` + `_shared`; `lint:strict` não é gate (`ci.yml:296` roda `lint`); `DATABASE_URL` gates dependem de secret não verificável |
| REV | A08 | Erros e navegação | FEITO | `useRegrasConciliacao.ts:24-78` todos os `error` checados; `useOptimizedQueries.ts:34,48,62` `throw`; `usePrefetchRoutes.ts:53-55` com `queryFn`; `sidebar/sidebarNavState.ts:20-21` trata hash | Incremento `vezes_aplicada` por leitura+escrita (`:36,:76`) persiste (concorrência) |
| REV | A09 | Publicação/docs/simulações | PARCIAL | `functions-deploy.yml:150-152` CLI pinada `2.22.6`; `open-finance/index.ts:245` "simulated list of major Brazilian banks" ainda presente; `AGENTS.md:7` contagem defasada | Decisão Open Finance sandbox; contagens |
| REV | A10 | Repo público × AGENTS.md "privado" | PARCIAL | `gh api repos/…` → `private:false, visibility:public`; `AGENTS.md` não diz mais "privado"; `docs/agentes/github-ci.md:8` registra "público" | Decisão de negócio (tornar privado) e rotação de credenciais expostas continuam sem registro |

### 2.2 Matriz das 100 etapas (seção 5)

| Doc | Etapa | Título resumido | Status | Evidência | O que falta |
| --- | --- | --- | --- | --- | --- |
| REV | 001 | Recriar baseline | PARCIAL | `docs/execucao-cline/baseline-lote-a.md` | Baseline com hashes/ambiente atual |
| REV | 002 | Matriz P0–P3 | PARCIAL | `docs/execucao-cline/MATRIZ_DECISOES.md` | Reclassificação atual |
| REV | 003 | Revalidar `compare-schemas` | PARCIAL | `compare-schemas/index.ts` sem segredo; sem teste (`ls` só `index.ts`) | Rotação/regressão |
| REV | 004 | Revalidar `send-push-notification` | PARCIAL | `send-push-notification/index.test.ts` existe | Teste de tenant/destinatário real |
| REV | 005 | IA com cota/orçamento | PARCIAL | `_shared/rate-limit.ts`; 19 `index.ts` importam; 5/5 fns de IA citadas usam | Orçamento e testes de abuso |
| REV | 006 | Remover fallback MCP | FEITO | `scripts/mcp-phd-suite.mjs` sem `eyJ`; `:347` "fallback de token via env" | — |
| REV | 007 | Não destruição | FEITO | Meta-regra; nada destrutivo nesta auditoria | — |
| REV | 008 | Painel de prontidão | PARCIAL | `docs/prod-readiness.md` | Estados codificado/testado/deployado/tráfego |
| REV | 009 | Varredura de segredos com histórico | FEITO | `ci.yml:113-119` `gitleaks git … --baseline-path` | — |
| REV | 010 | Fechar gate de contenção | PARCIAL | P0 do P50 (3–8) corrigidos em código | Aceite produtivo |
| REV | 011 | MCP da origem read-only | NÃO VERIFICADO | Acesso operacional | — |
| REV | 012 | Catálogo integral da origem | NÃO VERIFICADO | Banco | — |
| REV | 013 | Recoletar destino | NÃO VERIFICADO | Banco | — |
| REV | 014 | Genealogia das migrations | PARCIAL | `.github/workflows/migration-ledger.yml` compara ledger; `docs/REMOTE_ONLY_MIGRATIONS_STRATEGY.md:29` | Genealogia semântica |
| REV | 015 | SQL das destino-only | NÃO VERIFICADO | Banco | — |
| REV | 016 | Classificar locais ausentes no ledger | NÃO FEITO | Nenhum artefato de classificação; `AUDITORIA_SINCRONIA §2.2` "Pendente decisão" | Classificação |
| REV | 017 | Classificar `sql/` e `db/functions/` | NÃO FEITO | `sql/` não existe; `db/functions` existe sem doc de classificação | Doc de classificação |
| REV | 018 | Regenerar tipos | FEITO | `.github/workflows/schema-drift.yml:26-64` regenera e compara tipos (cron semanal) | — |
| REV | 019 | Diff semântico tripartido | NÃO VERIFICADO | Banco | — |
| REV | 020 | Decisão sobre origem | NÃO VERIFICADO | Decisão do dono | — |
| REV | 021 | Objetos só nos tipos | NÃO VERIFICADO | Banco | — |
| REV | 022 | Objetos só no destino | NÃO VERIFICADO | Banco | — |
| REV | 023 | Views ausentes | NÃO VERIFICADO | Banco | — |
| REV | 024 | Colunas divergentes | PARCIAL | `scripts/ci/check-colunas-select.mjs`; `20261116220000_reconcilia_17_colunas_que_so_existem_em_producao.sql` | Matriz completa |
| REV | 025 | Constraint `faixas_simples_reparticao_soma_chk` | PARCIAL | `20260728124719…:56` `VALIDATE CONSTRAINT`; `20260825250000_recreate_6_constraints.sql` | Estado live |
| REV | 026 | Auditar índices | NÃO VERIFICADO | Workload | — |
| REV | 027 | Policy de `estrategias_elisao_catalogo` | PARCIAL | `20261117000000_catalogo_elisao_volta_a_ser_tabela.sql` define policy | Confirmar live |
| REV | 028 | Matriz CRUD/testes cross-tenant | PARCIAL | `scripts/security/test-tenant-isolation.sql`, `test-write-isolation.sql`, `test-tenant-policy-scope.sql`; `20261102000000_registrar_grupo_b_rls_cross_tenant.sql` | Execução depende de `DATABASE_URL` |
| REV | 029 | Reduzir `GRANT ALL`/`TRUNCATE` | PARCIAL | `20261116151000_grants_authenticated_audit_por_coluna.sql` | Estado live |
| REV | 030 | Anon telemetria/grants | PARCIAL | `20260912100000_revoke_anon_admin_observability_rpcs.sql` (PR #79 merged) | SSO discovery/anon insert |
| REV | 031 | Catálogo de rotinas | NÃO VERIFICADO | Banco | — |
| REV | 032 | Lalamove em `check_integrity_invariants` | PARCIAL | `20260903001000_fix_set_empresa_id_default_coalesce_ativo.sql` é a última a tocar; sem migration nova dedicada | Confirmar definição live |
| REV | 033 | Overloads PostgREST | NÃO VERIFICADO | Banco | — |
| REV | 034 | SECURITY DEFINER / `search_path` | PARCIAL | 23 migrations ≥ 2026-09-13 com `search_path` | Advisor live |
| REV | 035 | `EXECUTE` por consumidor | PARCIAL | PR #79 mergeada; `20260826050000_revoke_execute_authenticated_e09.sql` | Live |
| REV | 036 | Triggers duplicados | NÃO VERIFICADO | Banco | — |
| REV | 037 | Catálogo de triggers | NÃO VERIFICADO | Banco | — |
| REV | 038 | Views/matviews | PARCIAL | `20261102000000` `security_invoker` nas 4 views legadas | Teste tenant/refresh |
| REV | 039 | Refresh `mv_performance_alerts_weekly` | FEITO | `20260913160000_mv_perf_weekly_unique_idx.sql:9` índice único | Execução live |
| REV | 040 | Cron origem/destino | PARCIAL | 27 migrations com `cron.schedule`; `20261101200000_monitor_health_cron.sql` | Reconciliação |
| REV | 041 | Catálogo 103/103 config | FEITO | `supabase/config.toml` 106 stanzas `[functions.*]` = 106 `index.ts` | — |
| REV | 042 | Regressão `compare-schemas` | NÃO FEITO | Sem teste em `compare-schemas/` | Teste |
| REV | 043 | Regressão push | PARCIAL | `send-push-notification/index.test.ts` | Tenant/destinatário |
| REV | 044 | `api-keys-manage` | PARCIAL | ver A03 | list/rotate/revoke |
| REV | 045 | `webhook-financeiro` | NÃO FEITO | Sem edge com esse nome (`ls supabase/functions`); sem decisão registrada fora das auditorias | Decidir/criar/retirar promessa |
| REV | 046 | `enviar-push-notification` → `send-push-notification` | FEITO | `20260913120000…:295-347` | — |
| REV | 047 | Auth/cota/auditoria IA | PARCIAL | `auth-guard.ts:193-208` expiração; `rate-limit.ts` | Concorrência de cota |
| REV | 048 | Classificar fns sem JWT | PARCIAL | `docs/execucao-cline/MATRIZ_AUTH_EDGE.md` (estática, base 2026-08-30, 103 fns); hoje `config.toml` 52 false / 54 true | Atualizar matriz e testar exceções |
| REV | 049 | CI cobre todos testes/check/lint Edge | PARCIAL | Testes: diretório inteiro (`deno-tests.yml:129`); lint lista explícita (`:55-86`); check 14 `index.ts` | Lint/check sobre todas as 106 |
| REV | 050 | Canário | NÃO VERIFICADO | Ops | — |
| REV | 051 | Certificar rotas/páginas | PARCIAL | `src/test/a11y/critical-pages.test.tsx`, e2e | Todas as rotas com papéis |
| REV | 052 | Deep link alertas preditivos | FEITO | `commandPaletteNavigation.ts:84`, `SidebarNavGroups.tsx:112`, `DashboardExecutivo.tsx:128` | — |
| REV | 053 | Páginas órfãs | NÃO VERIFICADO | Decisão | — |
| REV | 054 | Menu sensível ao hash | FEITO | `sidebar/sidebarNavState.ts:20-21`; `SidebarNavGroups.tsx:248` | — |
| REV | 055 | Score aleatório de cobranças | FEITO | `src/components/cobranca/CustomerDeepScore.tsx` sem `Math.random` | — |
| REV | 056 | WhatsApp proativo | PARCIAL | `whatsapp-ia-proativo/index_test.ts` | Mensagem real |
| REV | 057 | Convite real | PARCIAL | `convidar-usuario/index.ts` + `index.test.ts` | Entrega/aceite real |
| REV | 058 | NF-e simulada | PARCIAL | `CancelamentoNFe.tsx:70`, `InutilizacaoNFe.tsx:75` sem simulador; `__tests__/sefaz-sem-protocolo-fabricado.test.tsx` | Homologação real |
| REV | 059 | Boleto só backend | FEITO | `financial-actions.ts:264-273` | — |
| REV | 060 | Prefetch/`usePrefetchRoutes` | FEITO | `.ts:53-55` com `queryFn`; `.tsx` é wrapper `PrefetchOnVisible` | — |
| REV | 061 | Elisão atômica | PARCIAL | `useOportunidadesElisao.ts:187-188` update único com `throw` | Idempotência/estado anterior |
| REV | 062 | Regras de conciliação | PARCIAL | `useRegrasConciliacao.ts:24-78` erros tratados | Incremento leitura+escrita (`:36,:76`) |
| REV | 063 | Vazio × RLS × indisponibilidade | FEITO | `useOptimizedQueries.ts:34,48,62` `if (error) throw` | — |
| REV | 064 | Auditoria de conciliação | PARCIAL | RPC `confirmar_conciliacao_manual` atômica | Prova de todas as suboperações |
| REV | 065 | TODOs de schema | PARCIAL | 2 `TODO(2026-08-14)` restantes: `useOrganizacoes.ts:259`, `useBulkActions.ts:266` | 2 TODOs |
| REV | 066 | Escrita secundária | FEITO | PER/DCOMP fail-closed; RPCs `20260913140000` | — |
| REV | 067 | Awaits Supabase suspeitos | FEITO | `eslint.config.js:52` regra `error` | — |
| REV | 068 | Triar TODO/ts-nocheck/eslint-disable | PARCIAL | 0 `@ts-nocheck`, 0 `@ts-ignore`, 78 `eslint-disable`, 10 TODO/FIXME/HACK em `src` | Triagem dos 78 |
| REV | 069 | Objetos sem consumidor | NÃO VERIFICADO | Decisão | — |
| REV | 070 | Invariantes de negócio | PARCIAL | RPCs + testes de hooks | Concorrência real |
| REV | 071 | Thresholds | FEITO | `vitest.config.ts:62-67` | Meta 85% (C50-29) |
| REV | 072 | Typecheck testes/E2E + strict | PARCIAL | `tsconfig.json:24` strict; `tsconfig.e2e.json:19` e2e/scripts | `tsconfig.json:29-39` exclui testes unitários |
| REV | 073 | Todos os arquivos Deno | FEITO | `deno-tests.yml:124-129` | — |
| REV | 074 | Deno lint sem `\|\| true` | PARCIAL | `deno-tests.yml:55-86` sem `\|\| true`, mas lista explícita + `--rules-exclude` | Diretório inteiro |
| REV | 075 | `--allow-read` preservado | FEITO | `deno-tests.yml:126` | — |
| REV | 076 | `lint:strict` como gate | NÃO FEITO | `ci.yml:296` `bun run lint`; `lint:strict` ausente do CI; execução local impossível (sem deps) | Promover a gate |
| REV | 077 | PRs mecânicos | NÃO VERIFICADO | Processo | — |
| REV | 078 | E2E hermético | PARCIAL | `e2e/fixtures/sessao.ts` offline; 18 em quarentena; 10 `skip/fixme` em `e2e/` | Ondas seguintes |
| REV | 079 | Decisão lockfile | FEITO | Só `bun.lock` presente | — |
| REV | 080 | Fixar Bun/CLI/auditoria | PARCIAL | `.github/actions/setup-bun/action.yml:12` `bun-version-file`; CLI `2.22.6`; Deno `v2.9.5`; `ci.yml:205-215` `bun audit` com 5 `--ignore` | Política de bloqueio documentada |
| REV | 081 | Orçamento de bundle | PARCIAL | `vite.config.ts:98,127` `manualChunks`, `chunkSizeWarningLimit: 1200` | Orçamento por rota |
| REV | 082 | Avisos de build | NÃO VERIFICADO | Build não executado | — |
| REV | 083 | Decompor hotspots | PARCIAL | `eslint.config.js:111-114` `max-lines` 400 (warn) | Arquivos longos |
| REV | 084 | Mapa Graphify | PARCIAL | `GRAPH_REPORT.md` de 2026-10-06 | Reconstruir |
| REV | 085 | SLOs/runbooks | PARCIAL | `docs/runbooks/{BACKUP_DR,HOTFIX,INCIDENTES,ROTACAO_SECRETS,UPTIME_OBSERVABILIDADE}.md` | Alertas injetados |
| REV | 086 | Docs e contagens | NÃO FEITO | `AGENTS.md:7,11` defasados | Atualizar |
| REV | 087 | Decisão lockfile | FEITO | Um lockfile | — |
| REV | 088 | Suíte E2E paralela/Dyad | NÃO VERIFICADO | Decisão | — |
| REV | 089 | Artefatos/`sql/`/`db/functions` | NÃO VERIFICADO | Decisão | — |
| REV | 090 | Matriz manter/integrar/remover | NÃO VERIFICADO | Decisão | — |
| REV | 091 | Staging/backup/rollback | NÃO VERIFICADO | Ops (`docs/runbooks/BACKUP_DR.md` existe) | — |
| REV | 092 | Ensaiar migrations | NÃO VERIFICADO | `scripts/security/test-migration-replay-safety.sh` existe; replay do zero não | — |
| REV | 093 | Segurança em staging | NÃO VERIFICADO | Ops | — |
| REV | 094 | E2E real dos 7 fluxos | NÃO VERIFICADO | Ops | — |
| REV | 095 | Regressão integral do banco | NÃO VERIFICADO | Banco | — |
| REV | 096 | Carga/retries/idempotência | NÃO VERIFICADO | Ops | — |
| REV | 097 | Gates operacionais | NÃO VERIFICADO | Ops | — |
| REV | 098 | Canário produtivo | NÃO VERIFICADO | Ops | — |
| REV | 099 | Reconciliar tráfego real | NÃO VERIFICADO | Ops | — |
| REV | 100 | Aceite final | NÃO FEITO | P0/P1 abertos acima | — |

**Contagem matriz 100:** FEITO 20 · PARCIAL 42 · NÃO FEITO 7 (016, 017, 042, 045, 076, 086, 100) · NÃO VERIFICADO 31.

### 2.3 Plano complementar C50 (seção 6.1)

| Doc | Etapa | Título resumido | Status | Evidência | O que falta |
| --- | --- | --- | --- | --- | --- |
| C50 | 01 | Confirmar projeto Supabase | FEITO | `AGENTS.md:10` `bwwbeyolnnzppeuhgkcd` | — |
| C50 | 02 | Inventário read-only do runtime | NÃO VERIFICADO | Banco | — |
| C50 | 03 | Diff repo × produção | PARCIAL | `schema-drift.yml`, `migration-ledger.yml` | SQL semântico |
| C50 | 04 | Cadeia de migrations reproduzível | PARCIAL | `test-migration-replay-safety.sh`; `REMOTE_ONLY_MIGRATIONS_STRATEGY.md` | Replay do zero |
| C50 | 05 | Atualizar inventários | NÃO FEITO | `AGENTS.md:7,11` | — |
| C50 | 06 | Reconciliação 22/08 em staging | NÃO VERIFICADO | Ops | — |
| C50 | 07 | Reconciliar tabelas consumidas | PARCIAL | `check-colunas-select.mjs`; `20261116220000` | Matriz |
| C50 | 08 | 15 RPCs ausentes | NÃO VERIFICADO | Banco | — |
| C50 | 09 | Views consumidas | PARCIAL | `20261102000000` | Live |
| C50 | 10 | Buckets | PARCIAL | 5 migrations com `storage.buckets` | Live |
| C50 | 11 | `pg_net` | PARCIAL | `20261101200000_monitor_health_cron.sql` `CREATE EXTENSION pg_net` | Live |
| C50 | 12 | 16 cron jobs | PARCIAL | 27 migrations `cron.schedule` | Reconciliação |
| C50 | 13 | Régua de cobrança ponta a ponta | PARCIAL | `executar-regua-cobranca/domain.test.ts`; `e2e/regua-cobranca.e2e.ts` (gate) | Real |
| C50 | 14 | Automações tributárias | NÃO VERIFICADO | Ops | — |
| C50 | 15 | Observabilidade/manutenção | NÃO VERIFICADO | Ops | — |
| C50 | 16 | `orquestrador-elisao` | PARCIAL | `src/lib/tributario/elisao/` (cliente); sem edge | Decisão |
| C50 | 17 | `importar-xml-nfe` | PARCIAL | `src/hooks/useImportacaoXMLNFe.ts` + RPC `registrar_nfe_com_creditos`; sem edge | Decisão |
| C50 | 18 | `exportar-sped` | FEITO | 3 funções especializadas com testes (P50-40) | — |
| C50 | 19 | `previsao-tributaria-ia` | PARCIAL | `prever-carga-tributaria/index.ts` (sem teste) | Equivalência |
| C50 | 20 | `api-keys-manage` | PARCIAL | ver A03 | — |
| C50 | 21 | `webauthn-register` | NÃO FEITO | Sem edge | — |
| C50 | 22 | `webauthn-verify` | NÃO FEITO | Sem edge; UI bloqueada (`Auth.hooks.ts:303-308`) | — |
| C50 | 23 | Retirar NF-e simulada | PARCIAL | ver 058 | — |
| C50 | 24 | Destino da emissão NF-e | NÃO VERIFICADO | Decisão | — |
| C50 | 25 | Open Finance simulado | NÃO FEITO | `open-finance/index.ts:245` lista simulada | Decisão/aviso |
| C50 | 26 | Shards E2E | FEITO | Gates separados `e2e-critical/destructive/financeiro/quarantine` (`ci.yml:531-761`) | — |
| C50 | 27 | Skips condicionais E2E | PARCIAL | 10 `skip/fixme` em `e2e/`; quarentena não bloqueante | — |
| C50 | 28 | Gates de banco no CI | NÃO VERIFICADO | `ci.yml:298-320` usa `secrets.DATABASE_URL`; existência do secret não consultável (403) | — |
| C50 | 29 | Cobertura até 85% | PARCIAL | Piso 66/58/59/65 | 85% |
| C50 | 30 | Qualidade dos testes | PARCIAL | Paridade/inversão documentadas (P50-39/40) | — |
| C50 | 31 | Regenerar tipos | FEITO | `schema-drift.yml` | — |
| C50 | 32 | Remover 7 `@ts-nocheck` | FEITO | 0 em `src` | — |
| C50 | 33 | TODOs de schema | PARCIAL | 2 restantes | — |
| C50 | 34 | Isolamento multiempresa | PARCIAL | Guards + gate `contract-coverage_test.ts:220` + `escopo-querykey.test.ts` | Testes com 2 tenants reais |
| C50 | 35 | CSP enforcement | FEITO | `vercel.json:39` header `Content-Security-Policy` (não Report-Only) | — |
| C50 | 36–38 | Asaas/Bling/Bitrix ponta a ponta | NÃO VERIFICADO | Ops | — |
| C50 | 39 | Filas/retries/DLQ | PARCIAL | `webhook-retry-worker`, `_shared/webhook-idempotency.ts`, `20261117053000_reprocess_dlq_reagenda_original.sql` | Aceite |
| C50 | 40 | Logística herdada | PARCIAL | Última migration com Lalamove `20260903001000` | — |
| C50 | 41 | Baseline de bundle | PARCIAL | ver 081 | — |
| C50 | 42 | Lazy loading | FEITO | `App.tsx` 9 `lazy(`; `src/routes/*.tsx` "mesmos lazy chunks" | — |
| C50 | 43 | Índices | NÃO VERIFICADO | Workload | — |
| C50 | 44 | SRE Command Center | PARCIAL | `src/routes/adminRoutes.tsx:119` `/admin/sre`; `e2e/sre-command-center.e2e.ts` (quarentena) | RPCs/telemetria live |
| C50 | 45 | SLOs/alertas/runbooks | PARCIAL | `docs/runbooks/` | Alerta injetado |
| C50 | 46–49 | Staging/homologação/rollback/produção | NÃO VERIFICADO | Ops | — |
| C50 | 50 | Encerrar planos | NÃO FEITO | Pendências acima | — |

**Contagem C50:** FEITO 7 · PARCIAL 23 · NÃO FEITO 5 (05, 21, 22, 25, 50) · NÃO VERIFICADO 15.

### 2.4 Graphify G50 (seção 6.2)

Evidência comum: `scripts/graphify/{run,benchmark,code_references,edge_inventory,graph_quality,sql_inventory,typescript_imports}.py`, 10 arquivos `test_*.py`, `requirements-linux-py311.lock`, `.github/workflows/graphify.yml` (push em main + PR + dispatch), `package.json:11-15` scripts `graphify:*`, `docs/agentes/graphify.md`.

| Doc | Etapas | Status | Evidência | O que falta |
| --- | --- | --- | --- | --- |
| G50 | 001–021, 026–034, 036–039, 041–043, 049 (38 marcadas) | FEITO | Artefatos acima existem e são executados no workflow (`graphify.yml:13-25`) | — |
| G50 | 022 Inventário canônico read-only | PARCIAL | `sql_inventory.py`/`edge_inventory.py` rodam no CI | Catálogo live |
| G50 | 023 Origem × destino | NÃO VERIFICADO | Banco de origem | — |
| G50 | 024 Código → objetos SQL | PARCIAL | `code_references.py` | Cobertura completa |
| G50 | 025 Dependências indiretas | PARCIAL | `code_references.py` (chamadas dinâmicas) | — |
| G50 | 035 MCP local opcional | NÃO FEITO | 0 ocorrências de `mcp` em `scripts/graphify/*.py` | — |
| G50 | 040 Compatibilidade/upgrades | PARCIAL | `test_requirements_lock.py`; PR #73 (bump) mergeada | — |
| G50 | 044 Atualização/retenção | PARCIAL | `graphify.yml:4-15` push em main | Saída não é commitada; `GRAPH_REPORT.md` de 2026-10-06 |
| G50 | 045 Integrar à revisão de mudanças | PARCIAL | `graphify.yml` em `pull_request` | — |
| G50 | 046 Cobertura por módulo | NÃO VERIFICADO | — | — |
| G50 | 047 Privacidade/fronteiras | PARCIAL | `graphify.yml:26` "Não publicar corpus…" | — |
| G50 | 048 Utilidade antes/depois | PARCIAL | `benchmark.py` + `benchmark_cases.json` | — |
| G50 | 050 Aceite operacional | NÃO FEITO | Grafo stale (P50-45) | — |

**Contagem G50:** FEITO 38 · PARCIAL 8 · NÃO FEITO 2 · NÃO VERIFICADO 2.

### 2.5 Frontend e contratos F100 (seção 6.3)

| Doc | Etapas | Título resumido | Status | Evidência | O que falta |
| --- | --- | --- | --- | --- | --- |
| F100 | 005, 006, 007, 010, 018, 025, 068, 079, 084 | Envelope 422 canônico, Zod normalizado, gate "sem endpoint sem validação" | FEITO | `_shared/contract-response.ts`, `validation.ts`, `contract-validator.ts`, `contract-coverage_test.ts`; `DIVIDA_400_CONHECIDA` como catraca | 17 endpoints ainda em 400 |
| F100 | 014, 015, 036, 037, 070, 071, 072, 094 | Versionamento `x-contract-version` v1/v2 | FEITO | `_shared/versioned-contract.ts:4` + `versioned-contract_test.ts`; usado em 4 `index.ts` | Rollout além dos 4 webhooks |
| F100 | 012, 019 | Contratos Conciliacao/NFe em 422; gates no workflow Deno | FEITO | `conciliacao-proxy/index_test.ts`, `nfe-vinculo-proxy/index_test.ts`; `deno-tests.yml:129` | — |
| F100 | 001–004, 020–023, 026–028, 030–035, 038–040 | Inventário/matriz endpoint a endpoint | PARCIAL | `scripts/ci/gerar-matriz-conformidade-contratos.mjs`, `gerar-matriz-edge-tabela.mjs`; `MATRIZ_AUTH_EDGE.md` (2026-08-30) | Matriz atualizada para 106 fns e classificação comportamental |
| F100 | 008, 009, 011, 017 | Ingressos externos autenticados antes da validação | PARCIAL | `_shared/webhook-auth.ts` usado em 3 `*-webhook/index.ts` (asaas, bitrix24, bling) | `whatsapp-webhook` fora do helper comum; testes HTTP reais |
| F100 | 013, 069 | Taxonomia 422 schema × regra de negócio | PARCIAL | `contract-response.ts` | Documento de taxonomia |
| F100 | 016 | Baseline do healthcheck | NÃO VERIFICADO | — | — |
| F100 | 024 | Zod só via `_shared/zod.ts` | PARCIAL | `_shared/zod.ts:11` declara regra; 3 arquivos ainda importam `npm:zod` direto (`sync-profile-to-bitrix`, `convidar-contador`, `nfe-upload-certificado`) | 3 imports |
| F100 | 029 | JSON inválido (400) × schema (422) | NÃO FEITO | `validation.ts:60-74` devolve `createValidationErrorResponse` (422) também para JSON malformado | Separar 400 |
| F100 | 041 | `SkipLinks` duplicado | FEITO | Única instância em `MainLayout.tsx:49` | — |
| F100 | 042, 043 | Alvo `#main-nav` e landmark | FEITO | `SidebarNavGroups.tsx:309-310` `<nav id="main-nav" aria-label="Navegação principal">`; `MainLayout.tsx:49` alterna `#mobile-bottom-nav` | — |
| F100 | 044, 045, 049 | Rótulos sidebar/idioma/tema/portal | PARCIAL | `src/test/a11y/critical-pages.test.tsx` | Verificação por componente |
| F100 | 046, 047, 048 | Drawer mobile modal, focus trap, "Fechar menu" | NÃO FEITO | `sidebar/MobileSidebarDrawer.tsx` é `motion.aside` sem `role="dialog"`, `aria-modal`, `aria-label` ou tratamento de Escape (grep vazio) | Implementar |
| F100 | 050, 060 | axe no shell; viewports móveis | PARCIAL | `src/test/a11y/critical-pages.test.tsx`; e2e `visual-theme` | Shell completo |
| F100 | 051 | Marca/domínio/social cards | NÃO FEITO | `index.html:27-38` ainda `promobrindes.com.br`, `@PromoBrindes`, `lovable.dev/opengraph-image…` | Trocar metas |
| F100 | 052 | Título por rota | FEITO | `NavigationTracker.tsx:54` `document.title = … — Promo Finance` | — |
| F100 | 053 | description/canonical | PARCIAL | `index.html:10,29,37` description; sem `canonical` | canonical |
| F100 | 054 | Prefetch sem `queryFn` | FEITO | `usePrefetchRoutes.ts:53-55` | — |
| F100 | 055, 056, 057 | Instrumentar prefetch; realtime; listeners globais | NÃO VERIFICADO | — | — |
| F100 | 058 | Breadcrumb `/centro-custos` | FEITO | `src/lib/navigation.ts:49` e rota `contabilRoutes.tsx:25` coincidem | — |
| F100 | 059 | `window.location.href` → router | PARCIAL | 11 atribuições restantes em `src` (fora de testes) | 11 pontos |
| F100 | 061 | Inventário `verify_jwt=false` | PARCIAL | `MATRIZ_AUTH_EDGE.md`; `config.toml` 52 false | Atualizar |
| F100 | 062, 063, 064 | Helper comum de origem; Bling HMAC; fail-closed | PARCIAL | `bling-webhook/index.ts:13` `authenticateWebhook`; `webhook-auth.ts` + `webhook-auth_test.ts` | `whatsapp-webhook` sem o helper; constante-tempo/nonce não localizados por grep (`timingSafe\|nonce\|replay` → 0) |
| F100 | 065 | Anti-replay timestamp/nonce | NÃO FEITO | grep `nonce\|replay\|timestamp` em `webhook-auth.ts` → 0 | Implementar |
| F100 | 066 | Dedup por chave canônica | FEITO | `_shared/webhook-idempotency.ts` | — |
| F100 | 067, 078 | claim/success/failure/DLQ; retry worker | PARCIAL | `webhook-retry-worker/`, `webhook-replay/`, migrations `20261117053000`, `20261117074000` | Rastreabilidade por provedor |
| F100 | 073 | Sunset com data/telemetria | NÃO FEITO | `versioned-contract.ts:15-16` só flag `deprecated` | Data e telemetria |
| F100 | 074, 083, 085 | 5 cenários negativos por schema/endpoint | PARCIAL | `validation_test.ts`, testes por função (35/106 pastas com teste) | 71 funções sem teste |
| F100 | 075, 091, 092 | Logs/métricas estruturados | PARCIAL | `_shared/edge-observability.ts` + test | Dashboard |
| F100 | 076, 077 | Enumeração; replay administrativo | PARCIAL | `webhook-replay/index.ts`; `20261117074000_webhook_replay_resolve_dlq.sql:31` `has_role admin` | Testes de indistinguibilidade |
| F100 | 080, 087, 098 | Matriz/artefatos/inventário publicados | PARCIAL | `gerar-matriz-conformidade-contratos.mjs`, `actions-kpi.mjs` | Artifact por pipeline |
| F100 | 081 | Todos os testes Deno no CI | FEITO | `deno-tests.yml:124-129` | — |
| F100 | 082 | Manifesto endpoint/schema/teste/auth | PARCIAL | Gates de cobertura (`contract-coverage_test.ts`) | Manifesto versionado |
| F100 | 086 | Gate sintático × comportamental | PARCIAL | Jobs `deno-tests` e `integration-tests` | 2 checks obrigatórios distintos (só `Integration tests` é obrigatório) |
| F100 | 088, 089, 090 | Webhooks/proxies/cron testados | PARCIAL | Testes em `asaas-proxy`, `conciliacao-proxy`, `nfe-vinculo-proxy`, `executar-regua-cobranca`… | `bling-proxy`, `processar-fila-cobrancas` etc. |
| F100 | 093, 095, 099 | Smoke pós-deploy; gate de rollout; staging | NÃO VERIFICADO | `functions-deploy.yml` (CLI pinada) | — |
| F100 | 096 | Docs aspiracionais / "Freight Quest" | NÃO FEITO | `docs/testing-architecture.md` ainda cita "Freight Quest" | Corrigir doc |
| F100 | 097, 100 | Runbook contratual; docs de contratos | PARCIAL | `docs/runbooks/INCIDENTES.md`; sem doc por contrato | — |

**Contagem F100 (por etapa):** FEITO 27 · PARCIAL 58 · NÃO FEITO 8 (029, 046, 047, 048, 051, 065, 073, 096) · NÃO VERIFICADO 7 (016, 055, 056, 057, 093, 095, 099).

---

## 3. `docs/AUDITORIA_SINCRONIA_2026-09-17.md` — pendências

| Item | Status hoje | Evidência |
| --- | --- | --- |
| Drift do histórico de migrations (562 só local / 324 só banco) — "pendente decisão" | PARCIAL | `.github/workflows/migration-ledger.yml:31-40` monitora `supabase migration list`; `docs/REMOTE_ONLY_MIGRATIONS_STRATEGY.md:29` decide **não** usar `migration repair`; `001`–`003` continuam; estado do ledger live NÃO VERIFICADO |
| MCP "Supabase — Visão V2" aponta para outro projeto | NÃO VERIFICADO | Config é local da máquina do dono; sem `.mcp.json` no repo |
| Repo público × AGENTS.md "privado" | PARCIAL | `gh api` → `visibility: public`; AGENTS.md não afirma mais privado; `docs/agentes/github-ci.md:8` documenta "público" — decisão explícita de negócio não registrada |
| `delete_branch_on_merge` | FEITO | `gh api repos` → `true`; `github-settings-baseline.json:31` |
| 18 worktrees em `~/codex-workspaces`/`~/hermes-workspaces` | NÃO VERIFICADO | Máquina do dono |
| PR #88 (etapas 10–44) | FEITO | `gh api pulls/88` → `merged=true` |
| 6 branches recuperadas (backups) | PARCIAL | Remoto hoje tem 6 branches e nenhuma das `fix/codex-*`/`backup/*` listadas; conteúdo de `7c684900`/`8b62718f` está em main; descarte de `29eb6719`/`fb9e6442`/`80aa2880` sem registro |

## 4. `docs/RECONCILIACAO_ONLINE_2026-08-31.md` — "Gaps ainda pendentes de publicação"

| Item | Status hoje | Evidência |
| --- | --- | --- |
| Worktree `fix/codex-h0831-gates-pos-merge` não enviado | FEITO | PR #52 `merged=true`; branch não existe mais no remoto |
| `main` sem gates E2E separados | FEITO | `ci.yml:531` `e2e-critical`, `:583` `e2e-destructive`, `:641` `e2e-financeiro`, `:671` `e2e-quarantine` |
| Gate Deno endurecido | PARCIAL | Testes: diretório inteiro + `--allow-net` loopback (`deno-tests.yml:124-129`); lint sem `\|\| true` mas lista explícita (`:55-86`) |
| Snapshot do grafo atualizado | NÃO FEITO | `graphify-out/GRAPH_REPORT.md:13` de `79cb9a2a` (2026-10-06) |
| Testes novos das funções protegidas | PARCIAL | Testes em `analise-fluxo-ia/auth_test.ts`, `enviar-alerta-email`, `executar-analise-preditiva`, `gerar-alertas-tributarios`, `whatsapp-ia-proativo`; sem teste: `analyze-document`, `benchmarking-setorial`, `categorizar-despesa`, `insights-relatorio` |
| 9 Edge Functions com guard revisado | FEITO | Todas usam `exigirUsuario`/`exigirChamadaInterna`/`exigirInternaOuUsuario` (grep por função) |
| Secrets `SUPABASE_ACCESS_TOKEN` e `DATABASE_URL` no GitHub | NÃO VERIFICADO | Workflows os referenciam (`migration-ledger.yml:34`, `ci.yml:301`); listagem de secrets devolveu 403 |
| `mcp-query` live atrás do código local | NÃO VERIFICADO | Hash remoto não consultável; local: `mcp-query/{index,sql-policy}.ts` + testes; `config.toml:226-227` `verify_jwt=false` |
| Logout real depende do job `e2e-destructive` | FEITO | `playwright.destructive.config.ts:15` `logout-real.e2e.ts`; job `ci.yml:583-627`; check obrigatório `E2E Destructive Logout` (`baseline:22`) |

---

## 5. Totais

| Documento | Itens | FEITO | PARCIAL | NÃO FEITO | MARCADA FEITA, NÃO ENCONTRADA | NÃO VERIFICADO |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| P50 (50 etapas) | 50 | 32 | 15 | 3 | 0 | 0 |
| REV — A01–A10 | 10 | 4 | 5 | 0 | 0 | 1 |
| REV — matriz 100 | 100 | 20 | 42 | 7 | 0 | 31 |
| REV — C50 | 50 | 7 | 23 | 5 | 0 | 15 |
| REV — G50 | 50 | 38 | 8 | 2 | 0 | 2 |
| REV — F100 | 100 | 27 | 58 | 8 | 0 | 7 |
| AUDITORIA_SINCRONIA pendências | 7 | 2 | 3 | 0 | 0 | 2 |
| RECONCILIACAO pendências | 9 | 4 | 2 | 1 | 0 | 2 |

Limites desta auditoria: sem banco canônico, sem branch protection/secrets via API (403), clone raso, `bun install` bloqueado pelo proxy (sem `lint:strict`/`vitest`/`build`). Nenhum arquivo do repositório foi alterado (`git status` limpo; `node_modules` parcial criado pelo install falho foi removido).

---

## Anexo — A6 — Auditoria: planos de workflows, Graphify, docs/ci, execução-cline e runbooks

Base: `main` @ `a406e993` (2026-11-19). Repo somente leitura. Evidência = arquivo:linha ou saída de comando executado nesta sessão. Só aparecem na tabela itens NÃO FEITOS / PARCIAIS / DIVERGENTES / NÃO VERIFICÁVEIS; os FEITOS entram só na contagem final de cada documento.

Estado de referência usado em várias linhas:
- `ls .github/workflows` = 19 arquivos (`actionlint, auto-update-pr-branch, automation-local, ci, codeql, contexto, deno-tests, dependency-review, estado-real, functions-deploy, graphify, inventario-estado, migration-ledger, prod-migrate, schema-drift, settings-guard, staging-migrate, supabase-admin-ops, supabase-linter`).
- Perímetro GitHub medido em 2026-11-08: `scripts/ci/github-settings-baseline.json` (8 required checks; `required_approving_review_count: 0`; `required_linear_history: false`; `allow_merge_commit/rebase: true`; `allowed_actions: all`; `sha_pinning_required: false`; `rulesets_count: 0`; environments `copilot, Preview, Production, Production-Ops`; `secret_scanning_non_provider_patterns/validity_checks` "desligados por design").
- `ls supabase/functions` = 106 funções + `_shared` + `fuzz_test.ts`/`stress_test.ts`; `supabase/config.toml` = 106 blocos `[functions.*]` (54 `verify_jwt=true`, 52 `false`).

---

## 1. `docs/PLANO_WORKFLOWS_100_ETAPAS_2026-09-27.md` + `docs/evidencias/AUDITORIA_WORKFLOWS_2026-09-27.md`

| Doc | Etapa/Item | Status | Evidência | O que falta |
|---|---|---|---|---|
| PLANO | 2 — re-executar linter em `main` | NÃO VERIFICÁVEL (run do Actions) | sem acesso a runs nesta sessão | registrar run id na evidência |
| PLANO | 3 — secret `DATABASE_URL` | NÃO FEITO (não verificável; comportamento do CI indica ausente) | `ci.yml:298-307` preflight `--mode summary`; evidência lista como pendente; `.github/workflows/README.md:44-46` diz que ausência é tolerada | criar o secret (dono) |
| PLANO | 4 — rodar os 4 gates de banco pela 1ª vez | NÃO FEITO | depende da 3; `ci.yml:313,328,347,408` todos `if: available == 'true'` | idem |
| PLANO | 5 — `DATABASE_URL` obrigatório (`--mode fail`, remover "inconclusivos") | NÃO FEITO | `ci.yml:305` `--mode summary`; `ci.yml:361-369` step "Registrar gates de banco como inconclusivos" ainda existe | trocar para `--mode fail` após 3 |
| PLANO | 11 — visibilidade do repo | NÃO FEITO | `docs/agentes/github-ci.md:8` "**público**" | decisão do dono |
| PLANO | 12 — rotacionar 23 credenciais do baseline | NÃO FEITO / rotação não verificável | `jq length .gitleaks-baseline.json` = 23 (mesmo número do plano) | rotação externa + registro |
| PLANO | 13 — exigir 1 aprovação + conversas resolvidas | PARCIAL | baseline: `required_approving_review_count: 0`; `github-ci.md:19` `required_conversation_resolution: true` | ligar required review |
| PLANO | 14 — histórico linear, só squash | NÃO FEITO | baseline: `required_linear_history: false`, `allow_merge_commit: true`, `allow_rebase_merge: true` | configurar no repo |
| PLANO | 15 — `allow_update_branch` | NÃO VERIFICÁVEL | campo ausente do baseline; `auto-update-pr-branch.yml` usa update-branch (indício de ligado) | medir via API |
| PLANO | 17 — ruleset espelhando branch protection | NÃO FEITO | baseline `rulesets_count: 0` | criar ruleset |
| PLANO | 18 — proteger environment `Production` | PARCIAL | `github-ci.md:23`: `Production-Ops` tem reviewer (`prod-migrate.yml:81`, `functions-deploy.yml:138`, `supabase-admin-ops.yml`); `Production` e `Preview` sem proteção, e `supabase-linter.yml:50` usa `environment: Production` | proteger `Production` ou migrar linter |
| PLANO | 19 — secrets de produção no environment | PARCIAL / não verificável | README diz `SUPABASE_ACCESS_TOKEN` em Environment `Production` (`.github/workflows/README.md:40`); localização real de secrets não é lida pelo repo | confirmar via API |
| PLANO | 20 — `post-merge-audit`/`functions-deploy` consumindo environment | PARCIAL | `functions-deploy.yml:138` `environment: Production-Ops`; `ci.yml:756-770` `post-merge-audit` sem `environment:` e usa `secrets.SUPABASE_SERVICE_ROLE_KEY` de repo | mover post-merge-audit |
| PLANO | 22 — apagar environment `copilot` | NÃO FEITO | baseline `environments: [copilot, ...]`; `docs/ci/kpi.json` ainda tem chave `copilot` (12 runs) | decisão do dono |
| PLANO | 24 — quarentena E2E em `schedule` noturno + issue automática | PARCIAL | `ci.yml:676` roda em push `main`/dispatch (fora de PR); sem `schedule:` e sem issue | agendar + alertar |
| PLANO/EVID | 25 — unificar `test:run` + `test:coverage` | **MARCADA FEITA, NÃO ENCONTRADA** | `ci.yml:445` `bun run test:run ...` e `ci.yml:457` `bun run test:coverage` — suíte roda 2× | unificar com `--coverage` |
| PLANO | 29 — build único + `vite preview` nos E2E | NÃO FEITO | `playwright.critical.config.ts:45`, `destructive:40`, `financeiro:114` `command: 'npm run dev'` | servir `dist/` |
| PLANO | 30 — `paths-filter` para PR só de docs | NÃO FEITO | `grep -rl dorny .github` vazio; `ci.yml` sem filtro de paths em `pull_request` | adicionar filtro |
| PLANO | 32 — reduzir matriz `perfis` do graphify a dispatch/noturno | NÃO FEITO | `graphify.yml:16-23` `pull_request` em `src/**`; `graphify.yml:63-80` 11 perfis | mover para dispatch |
| PLANO/EVID | 34 — pinar runner `ubuntu-24.04` | PARCIAL (evidência diz "já ok") | E2E jobs em `ubuntu-24.04` (`ci.yml:535,587,643,678`, por incompatibilidade do Playwright); demais 15 jobs em `ubuntu-latest` | pinar todos ou documentar |
| PLANO | 35 — revisar `timeout-minutes` | PARCIAL | `ci.yml:141` quality-gate 30 (plano: 20); `ci.yml:763` post-merge 15 ✓; `ci.yml:679` quarentena 30 | ajustar quality-gate |
| PLANO/EVID | 36 — relatório de custo antes/depois (`get_workflow_usage`) | PARCIAL | evidência traz só estimativas ("~65%"); medição real existe hoje em `docs/ci/kpi.json` (gerado por `scripts/ci/actions-kpi.mjs`), não comparada ao "antes" | fechar antes/depois |
| PLANO | 37 — job `migrations-replay` do zero no CI | PARCIAL | `scripts/db/replay-migrations.sh` existe (harness local, issue #90); `grep -rn replay-migrations .github` vazio — não roda em nenhum workflow | criar job |
| PLANO | 38 — rodar pgTAP `supabase/tests/sql/*.test.sql` contra banco replayado | PARCIAL | `ci.yml:323,334` rodam `rls_multi_empresa.sql` e `catalogos_tributarios.test.sql` só com `DATABASE_URL` (banco vivo); `infra.test.sql`, `integrity_cycle.test.sql`, `lint_function_repairs.test.sql`, `overloads.test.sql` não rodam em workflow | depende da 37 |
| PLANO | 39 — gate estático de policy `USING (true)` no diff | PARCIAL | gate é live (`supabase-linter.yml:149` → `test-canonical-db-gates.mjs:363` allowlist contra banco); `pendingPrMigrations` (`:210-237`) só lê versões do diff, não varre `USING (true)` | varredura estática |
| PLANO | 40 — gate de nomenclatura de migrations (14 dígitos, > max, sem duplicata) | NÃO FEITO | nenhum script em `scripts/ci`/`scripts/security` valida ordem/duplicata; `test-canonical-db-gates.mjs:230` só extrai `^\d{14}_` | criar gate |
| PLANO | 42 — linter live em Preview Branch | NÃO FEITO | `supabase-linter.yml:138,148,173` sempre `vars.VITE_SUPABASE_PROJECT_ID` | depende de Branching |
| PLANO | 43 — linter live em schedule diário | NÃO FEITO | `supabase-linter.yml:14-34` sem `schedule:` | agendar |
| PLANO/EVID | 46 — `lint` → `lint:strict` no CI | **MARCADA FEITA, NÃO ENCONTRADA** | `ci.yml:294-296` "Lint check — Etapa 46" executa `bun run lint`; `grep -c lint:strict ci.yml` = 0; `package.json:24-25` `lint` sem `--max-warnings 0` | trocar para `lint:strict` |
| PLANO | 51 — lista única de arquivos Deno (lint × check) | NÃO FEITO | `deno-tests.yml:55-89` lint com 33 arquivos; `scripts/ci/deno-check-functions.sh:37-50` check com 14 `index.ts` + `_shared` | manifesto único |
| PLANO | 52 — `deno check` em tudo com allowlist de dívida | NÃO FEITO | `deno-check-functions.sh:37-50` allowlist positiva de 14 funções | inverter lógica |
| PLANO/EVID | 53 — remover `--no-check` do `deno test` | PARCIAL | removido do `unit-tests` (`deno-tests.yml:124-129`); permanece no `integration-tests` (`deno-tests.yml:181`) | remover do integration |
| PLANO | 54 — `deno lint` em todas as funções | NÃO FEITO | `deno-tests.yml:55-56` `--rules-exclude` global em 33 arquivos | ampliar |
| PLANO | 55 — cobertura de teste por função + trava | NÃO FEITO | `grep -nE "sem teste|cobertura" deno-tests.yml` vazio (descoberta por diretório existe, `:91-129`, mas sem relatório/trava) | step summary + trava |
| PLANO | 56 — integração `sso-test-login` fora de produção | NÃO FEITO | `deno-tests.yml:131-182` `integration-tests` "edge functions live" contra `sso-test-login` publicada; é required check (baseline) | ambiente de preview |
| PLANO | 58 — matriz `verify_jwt × --no-verify-jwt` para todas as funções | PARCIAL | `scripts/security/test-functions-deploy.sh:48,54` cobre 2 funções; `scripts/admin/supabase_admin_ops.py:119` compara verify_jwt de todas, mas só via `supabase-admin-ops.yml` (dispatch manual) | gate no CI |
| PLANO | 59 — respeitar `deno.lock` | NÃO FEITO | `deno-check-functions.sh:68` `deno check --no-config --no-lock` | remover `--no-lock` |
| PLANO/EVID | 60 — atualizar `.github/workflows/README.md` | PARCIAL | README (27/09) afirma `graphify.yml` "push main + schedule semanal (terças 02:00 UTC)" — `graphify.yml` não tem `schedule:`; "Sim (7 checks)" vs 8 no baseline; não lista `actionlint, schema-drift, settings-guard, migration-ledger, prod-migrate, supabase-admin-ops, estado-real, auto-update-pr-branch, automation-local`; `README.md:40` secret em "Environment Production" não verificável | regenerar (hoje `docs/ci/README.md` é gerado e cobre 19) |
| PLANO/EVID | 61 — JUnit + `dorny/test-reporter` nos 4 E2E | PARCIAL | JUnit só no Vitest (`ci.yml:445-453`); E2E seguem `--reporter=list` (`ci.yml:558,609,654,711`); sem test-reporter | reporter nos E2E |
| PLANO | 63 — remover/documentar `grepInvert` do gate crítico | NÃO FEITO | `playwright.critical.config.ts:19` `grepInvert: /RBAC › usuário autenticado sem perfil admin\|Regressão visual — Telas autenticadas/` sem justificativa | documentar/remover |
| PLANO | 64 — `retries: 0` nos gates bloqueantes | NÃO FEITO | `playwright.critical.config.ts:23` e `destructive:19` `retries: process.env.CI ? 2 : 0` | decidir/registrar |
| PLANO | 65 — promover specs da quarentena ao gate offline | PARCIAL | `ls e2e/financeiro/*offline*` = 2 specs (`conciliacao-offline`, `contas-pagar-offline`) de 28 `.e2e.ts`; quarentena listada dinamicamente por `scripts/ci/listar-specs-quarentena.ts` | migrar mais specs |
| PLANO | 66 — usuário E2E dedicado por job destrutivo | NÃO FEITO | `ci.yml:547-548` (critical) e `:598-599` (destructive) usam os mesmos `E2E_USER_EMAIL/E2E_USER_PASSWORD` | secrets por job |
| PLANO | 68 — E2E crítico contra Preview da Vercel | NÃO FEITO | `grep E2E_BASE_URL ci.yml` vazio; nenhuma leitura de deployment status | job novo |
| PLANO | 69 — pinar Playwright/Chromium para snapshots | NÃO FEITO | `package.json:142` `"@playwright/test": "^1.58.2"` (caret) | pin exato |
| PLANO | 72 — `sha_pinning_required` + `allowed_actions: selected` | NÃO FEITO | baseline `allowed_actions: all`, `sha_pinning_required: false`; `AGENTS.md §5` documenta como aceito | decisão do dono |
| PLANO | 82 — `secret_scanning_non_provider_patterns` + `validity_checks` | NÃO FEITO | baseline: "desligados por design/plano — omitidos" | ligar no repo |
| PLANO | 83 — destino do `staging-migrate` (5 secrets) | PARCIAL / não verificável | `staging-migrate.yml:30-59` job `check-secrets` sai verde avisando quando faltam; existência dos secrets não é legível no repo | dono fornece secrets ou arquiva |
| PLANO/EVID | 85 — deploy de Edge Functions dirigido por diff | PARCIAL | `functions-deploy.yml` segue só `workflow_dispatch` (`:4`), 106 opções no `choice` + `deploy_all` (`:117-120`); nenhum job detecta `supabase/functions/<fn>/**` alterado | job por diff em `main` |
| PLANO | 86 — migrations em produção via workflow com aprovação | PARCIAL | `prod-migrate.yml` existe (`db push`, `environment: Production-Ops`, confirmação do ref, dry_run) — mas é dispatch manual e sem o replay da 37 como pré-requisito; `AGENTS.md §4` mantém `db_query` via MCP como caminho oficial | integrar replay; decidir caminho único |
| PLANO | 87 — registrar deploy no GitHub Deployments API | NÃO FEITO | `scripts/edge-deploy/register-deployment.mjs` e `deployment-record.mjs` existem, mas `grep register-deployment scripts/migrate-functions.sh` vazio e nenhum workflow os chama | ligar ao deploy |
| PLANO | 89 — verificar deploy Vercel a partir do CI | NÃO FEITO | `grep -i vercel ci.yml` só em comentários (`:174,212`) | job pós-merge |
| PLANO | 90 — decidir `post-merge-audit` | PARCIAL | `ci.yml:760` ainda `vars.ENABLE_PRODUCTION_SIMULATION_AUDIT == 'true'` (variável não confirmada); timeout 15 adicionado | agendar ou remover |
| PLANO | 91 — notificação de falha em `main` | NÃO FEITO | `grep -rliE "slack\|whatsapp\|evolution" .github/workflows` só em comentários; nenhum job `on: workflow_run` de alerta | alerta externo |
| PLANO | 92 — `SUPABASE_PROJECT_REF` com asserção contra `config.toml` | PARCIAL | `functions-deploy.yml:159-162` compara `vars.VITE_SUPABASE_PROJECT_ID` com canônico; `supabase-linter.yml` e `migration-ledger.yml` usam a var sem asserção | asserção no linter |
| PLANO/EVID | 94 — remover `master`/`develop` dos triggers | PARCIAL (evidência cita graphify/deno-tests) | `supabase-linter.yml:16` `branches: [main, master, develop]` ainda | remover do linter |
| PLANO/EVID | 96 — cobertura como artifact + comentário na PR | PARCIAL | artifact `coverage-report` (`ci.yml:460-465`); nenhum comentário em PR | comentar |
| PLANO/EVID | 97 — jobs com IDs estáveis sem acento nos required checks | PARCIAL | `deno-tests.yml:24` renomeado `deterministic`; required checks seguem com acento/parênteses: `Varredura de segredos (gitleaks)`, `E2E Financeiro (offline)`, `Integration tests (edge functions live)` (baseline) | padronizar contexts |
| PLANO/EVID | 98 — sincronizar Graphify com CI / promessa N8N | PARCIAL | `graphify.yml:9` push `main` ✓, mas não publica `graph.json`; `graphify-out/GRAPH_REPORT.md:1,12` "2026-10-06 · Built from commit 79cb9a2a" vs HEAD `a406e993`; `git ls-files graphify-out` = só `GRAPH_REPORT.md`+`manifest.json`; `AGENTS.md:66` e `docs/agentes/graphify.md:20` mantêm "auto-sync N8N em 15 min" sem nenhum artefato no repo | sync real ou remover promessa |
| PLANO/EVID | 100 — re-auditoria antes/depois em `docs/evidencias/` | PARCIAL | `docs/evidencias/AUDITORIA_WORKFLOWS_2026-09-27.md` é o mesmo documento da etapa 36, escrito no mesmo dia do plano; sem coleta posterior (runs, durações, required checks) | re-auditar |
| EVID | tabela "Estado após" — "Gates obrigatórios 8" | FEITO hoje, mas datado | só confirmável pelo baseline de 2026-11-08, não em 27/09 (evidência não cita API) | — |
| EVID | "Etapa 57: dependabot npm + github-actions" | DIVERGENTE (rótulo) | etapa 57 do plano é "integration-tests só em PR e main"; dependabot é a 81 | corrigir rótulo |
| EVID | "Etapa 85: lista de funções expandida para 104" | DIVERGENTE (desatualizada) | hoje 106 opções (`sed -n '/options:/,/deploy_all:/p' functions-deploy.yml \| grep -c '^\s*- '` = 106) | — |
| EVID | "Etapa 75: permissions explícito 6/6" | FEITO (hoje 17/19 top-level) | `auto-update-pr-branch.yml` e `schema-drift.yml` só com `permissions:` por job | — |

**Contagem PLANO (100 etapas):** auditadas 100 · FEITO 40 · PARCIAL 26 · NÃO FEITO 30 · MARCADA FEITA, NÃO ENCONTRADA 2 (25, 46) · NÃO VERIFICÁVEL 2 (2, 15).
FEITO (sem linha na tabela): 1, 6–10, 16, 21, 23, 26–28, 31, 33, 41, 44, 45, 47–50, 57, 62, 67, 70, 71, 73–81, 84, 88, 93 (6 branches remotas hoje: `git ls-remote --heads origin | wc -l`), 95, 99.
**Contagem EVIDÊNCIA (57 etapas marcadas ✅):** 2 falsas (25, 46) · 7 parciais (24, 34, 60, 61, 94, 96, 97, 98, 100 → 9 contando 98/100) · demais confirmadas.

---

## 2. `docs/GRAPHIFY_PLANO_50_ETAPAS.md` + `docs/GRAPHIFY_VALIDACAO_2026-09-11.md` + `docs/agentes/graphify.md`

Verificado: `package.json:11-19` tem exatamente 9 scripts `graphify:*`; `scripts/graphify/` tem `run.py, sql_inventory.py, code_references.py, edge_inventory.py, graph_quality.py, benchmark.py, typescript_imports.py, config.json (12 perfis), requirements-linux-py311.lock` e 163 `def test_` em `test_*.py`; `run.py:182` grava `evidencia.json`, `:204` `directed=True`, `:163` exige `graphifyy==<config.version>`; `.gitignore:61` ignora `graphify-out/`; `src/lib/arquitetura/` preservado (`analisador-imports.ts, escopo-empresa.ts, grafo-observado.json, modulos.ts, __tests__`); `graphify.yml` roda testes, piloto, inventários e 11 perfis.

| Doc | Etapa/Item | Status | Evidência | O que falta |
|---|---|---|---|---|
| PLANO50 | 003 — "versão 0.9.48 efetivamente executada" | DIVERGENTE (desatualizado) | `scripts/graphify/config.json:2` `"version": "0.9.97"`; `graphify.local.json:5` `"pin": "0.9.97"` | atualizar doc ou registrar upgrade (ver 040) |
| PLANO50 | 022 — inventariar catálogo canônico somente leitura | PARCIAL (fora do wrapper) | não há script em `scripts/graphify/`; existe `scripts/inventario/banco.sql` + `inventario-estado.yml` e `scripts/supabase_snapshot/` + `contexto.yml` (branches `inventario`/`contexto`) | integrar ao grafo ou marcar como resolvido por outro caminho |
| PLANO50 | 023 — comparar origem × destino | NÃO FEITO | nenhum artefato; `VALIDACAO:196-197` pendência "autenticar origem Lovable" | acesso à origem |
| PLANO50 | 024 — ligar referências de código a objetos SQL (matriz) | NÃO FEITO no grafo | `code_references.py` só literal; `docs/ci/MATRIZ_EDGE_TABELA.md` (gerada por `scripts/ci/gerar-matriz-edge-tabela.mjs`) cobre `.from()` edge×tabela fora do Graphify | correlacionar |
| PLANO50 | 025 — dependências indiretas (trigger→função→tabela) | NÃO FEITO | nenhum adaptador em `scripts/graphify` | — |
| PLANO50 | 032 — homologar consultas (budget) | PARCIAL (declarado pelo próprio doc) | `PLANO50:398-400` "`--budget 700` retornou 756 … etapa 032 permanece parcial" | — |
| PLANO50 | 035 — MCP local opcional | NÃO FEITO (não ativado, conforme plano) | sem config MCP graphify no repo | decisão |
| PLANO50 | 040 — compatibilidade/upgrade com matriz e rollback | NÃO FEITO, mas pin já mudou | `config.json:2` 0.9.97 vs plano 0.9.48; nenhum registro de comparação de métricas/hashes do upgrade em `docs/` | registrar procedimento |
| PLANO50 | 042 — "orientar agentes **sem instalar hooks**" / 044 — "nenhum watcher global implícito" | DIVERGENTE | `.claude/settings.json:2-22` instala hooks `PreToolUse` (Bash\|Grep, Read\|Glob) chamando `/workspace/.local/bin/graphify hook-guard search\|read` — binário inexistente neste ambiente (`which graphify` vazio) | decidir: remover hooks ou atualizar plano/`docs/agentes/graphify.md` (que proíbe "instalação de hooks") |
| PLANO50 | 044 — política de atualização/retenção | NÃO FEITO | nenhuma política em docs; `graphify-out/piloto-*` só local | definir |
| PLANO50 | 045 — modelo de impacto por PR | NÃO FEITO | `.github/PULL_REQUEST_TEMPLATE.md` cita graphify mas sem bloco de impacto/lacunas | — |
| PLANO50 | 046 — matriz de cobertura por módulo | NÃO FEITO | — | — |
| PLANO50 | 047 — revisão de privacidade independente | NÃO FEITO | `VALIDACAO:198` pendente decisão | — |
| PLANO50 | 048 — utilidade antes/depois | NÃO FEITO (043 benchmark existe: `benchmark.py`, `benchmark_cases.json`) | — | repetir medição |
| PLANO50 | 050 — aceite operacional | NÃO FEITO | `VALIDACAO:200` "pertence ao mantenedor" | — |
| PLANO50 | item fora do plano | DIVERGENTE | `scripts/graphify-local.mjs` (+ `.unit.mjs`) e `graphify.local.json` (`.tools/graphify/.venv`, `output: graphify-out/pilot`) são um segundo wrapper não descrito no plano nem em `docs/agentes/graphify.md`; `.tools/graphify` não existe no checkout | documentar ou remover |
| VALIDACAO | "68 testes específicos do Graphify" | DESATUALIZADO (melhorou) | 163 `def test_` hoje | — |
| VALIDACAO | "46 Edge Functions sem JWT no gateway" (pendência 3) | DESATUALIZADO | hoje 52 `verify_jwt=false` em 106 (ver §4) | revisar lista |
| agentes/graphify.md | "`graphify query` quando `graphify-out/graph.json` existe" | NÃO EXECUTÁVEL neste checkout | `graph.json` não versionado (`.gitignore:61`; `git ls-files graphify-out` = 2 arquivos); CLI `graphify` ausente (`which graphify` vazio) | gerar/local ou ajustar instrução |
| agentes/graphify.md:20 / AGENTS.md:66 | "auto-sync N8N corrige em até 15 min" | NÃO ENCONTRADO | `grep -rniE "auto-sync\|n8n" docs/agentes/graphify.md AGENTS.md` só nas próprias frases; nenhum workflow/script/webhook; `GRAPH_REPORT.md` parado em `79cb9a2a` (2026-10-06) com HEAD `a406e993` (2026-11-19) → o sync, se existe, não está funcionando | provar ou remover promessa |
| agentes/graphify.md:21 | "`graphify.yml` reconstrói os mapas a cada merge em main" | PARCIAL | `graphify.yml:4-15` trigger existe, mas o job só valida/gera em runner e **não publica** (comentários `:62,92`) — `graphify-out/` do repo não é atualizado por ele | — |
| agentes/graphify.md:25-27 | "Perfis versionados: pilot, edge-runtime, domain-integrations, frontend-entry, frontend-routes, frontend-components" | DESATUALIZADO | `config.json` tem 12 perfis (6 `finance-*` a mais) | listar os 12 |

**Contagem PLANO50 (50 etapas):** auditadas 50 · FEITO 36 · PARCIAL 3 (022, 032, 042) · NÃO FEITO 11 (023, 024, 025, 035, 040, 044, 045, 046, 047, 048, 050) · MARCADA FEITA, NÃO ENCONTRADA 0 (042 marcada feita mas contradita por hooks instalados — contada como PARCIAL/divergente).
Docs auxiliares: `GRAPHIFY_VALIDACAO` 2 números desatualizados; `docs/agentes/graphify.md` 4 afirmações divergentes/não executáveis.

---

## 3. `docs/ci/README.md` + `docs/ci/MATRIZ_EDGE_TABELA.md` + `docs/ci/kpi.json`

Verificado FEITO: os 3 geradores existem (`scripts/ci/render-workflow-docs.mjs`, `gerar-matriz-edge-tabela.mjs`, `actions-kpi.mjs`) e rodam em `estado-real.yml:72-78`; README cobre os 19 workflows (6 com bloco `# docs:` — `auto-update-pr-branch, automation-local, contexto, estado-real, inventario-estado, settings-guard` — e 13 sem, conferido por `sed -n 1,16p` de cada); matriz "106 edge functions" = `ls supabase/functions` (106): **0 funções listadas que não existem, 0 existentes fora da matriz** (`comm` sobre a seção "Por função").

| Doc | Etapa/Item | Status | Evidência | O que falta |
|---|---|---|---|---|
| docs/ci/README | 13 workflows sem bloco `# docs:` | PENDÊNCIA (declarada) | `actionlint, ci, codeql, deno-tests, dependency-review, functions-deploy, graphify, migration-ledger, prod-migrate, schema-drift, staging-migrate, supabase-admin-ops, supabase-linter` | adicionar bloco |
| docs/ci/kpi.json | 12 chaves sem arquivo em `.github/workflows/` | DIVERGENTE (fantasmas/apps) | `copilot, copilot-pull-request-reviewer, dependabot-updates, update-graph, zz-diagnostico-actions.yml, zzdiag-automation-local.yml, zzdiag-codeql.yml, zzdiag-dependency-review.yml, zzdiag-settings-guard.yml, zzuses-3d3c42e5aac5.yml, zzuses-v4.yml, zzuses-v5.yml` (workflows registrados a partir de outras branches ou gerados por apps — mesma classe do achado L do plano) | limpar branches/registros |
| docs/agentes/github-ci.md | "Guard de perímetro (settings-guard) **não existe**" (`:27,52-54`) e "14 arquivos" (`:33`) | DESATUALIZADO | `settings-guard.yml` + `scripts/ci/github-settings-guard.mjs` + `github-settings-baseline.json` existem; 19 arquivos | atualizar doc |
| .github/workflows/README.md | ver §1 etapa 60 | PARCIAL | — | — |

**Contagem docs/ci:** README 19 workflows + 3 scripts auditados → 22 FEITO, 13 pendências declaradas; MATRIZ 106 funções → 106 FEITO, 0 divergências; kpi.json 28 chaves → 16 com arquivo, 12 sem arquivo.

---

## 4. `docs/execucao-cline/` (INDICE, MATRIZ_DECISOES, MATRIZ_AUTH_EDGE, RELATORIO_LOTE_01, baseline-lote-a)

### 4.1 Itens planejados que ficaram pendentes — estado hoje

| Doc | Etapa/Item | Status | Evidência | O que falta |
|---|---|---|---|---|
| INDICE §14 | `BASELINE_<data>.md` | FEITO com outro nome | `docs/execucao-cline/baseline-lote-a.md` | — |
| INDICE §14 | `MATRIZ_DIVERGENCIAS_BD.md`, `GENEALOGIA_MIGRATIONS.md`, `CANDIDATOS_HIGIENE.md`, `RELATORIO_LOTE_02+`, `RELATORIO_FINAL.md` | NÃO FEITO | `ls docs/execucao-cline` = só os 5 arquivos auditados | — |
| INDICE 006 | remover token fallback do `mcp-phd-suite` | FEITO | `scripts/mcp-phd-suite.mjs:7-27` só `--token`/`MCP_TOKEN` | — |
| INDICE 009 | varredura ampliada de segredos com gate real | FEITO | `ci.yml:23-136` gitleaks + baseline só encolhe + SARIF | — |
| INDICE 014/016 | genealogia de migrations × ledger | PARCIAL | `migration-ledger.yml` (dispatch) e `prod-migrate.yml:131-176` checam ledger; nenhum `GENEALOGIA_MIGRATIONS.md` | documento |
| INDICE 044 / D3 | `api-keys-manage` | FEITO | `supabase/functions/api-keys-manage/index.ts` (`exigirPapel`); `config.toml:214-216` | — |
| INDICE 045 / D3 | `webhook-financeiro` | FEITO (promessa removida) | `grep -rl webhook-financeiro src supabase` vazio | — |
| INDICE 046 | corrigir `enviar-push-notification` → `send-push-notification` | FEITO | `supabase/migrations/20260913120000_corrige_credenciais_automacoes_internas.sql` | — |
| INDICE 048 | classificar 99 funções + testar exceções | PARCIAL | matriz estática existe; testes negativos de runtime das P0 não encontrados como tal (ver 4.2) | testes negativos |
| INDICE 049 / 073 / 074 | CI Deno sem mascaramento | PARCIAL | `deno test` descobre todo o diretório (`deno-tests.yml:91-129`), `\|\| true` removido (`grep -c` = 0); `deno check`/`lint` ainda em allowlist (§1 etapas 51–54, 59) | check/lint globais |
| INDICE 060 | duplicidade `usePrefetchRoutes.ts/.tsx` | NÃO FEITO | `ls src/hooks/usePrefetchRoutes*` → `.ts` **e** `.tsx` | consolidar |
| INDICE 062 | remover `@ts-nocheck` | FEITO | `grep -rl "@ts-nocheck" src \| wc -l` = 0 | — |
| INDICE 072 | typecheck com E2E | FEITO | `ci.yml:437` `type-check:e2e`; `.husky/pre-push` | — |
| INDICE 076 | `lint:strict` como gate | NÃO FEITO | `ci.yml:296` `bun run lint` | — |
| INDICE 080 | pins + audit bloqueante | FEITO | `.bun-version`, SHAs, `ci.yml:197-230` `bun audit` com 15 `--ignore` documentados | — |
| INDICE 081 | orçamento de bundle por rota | PARCIAL | `ci.yml:477-497` limite global 600 KB por chunk, não por rota | — |
| INDICE 084 | Graphify atualizado com commit/saúde | PARCIAL | ver §2 (report em `79cb9a2a`) | — |
| INDICE 086 | docs por scripts reproduzíveis | PARCIAL | `docs/ci/*` e branches `contexto`/`inventario` gerados; `docs/RUNBOOK.md`, `.github/workflows/README.md`, `docs/agentes/github-ci.md` ainda manuais e desatualizados (§3, §5) | — |
| INDICE lotes B, C, E, F, I, J (011–040 exc. acima, 051–059, 061–070, 087–100) | NÃO VERIFICÁVEL estaticamente / continuam pendentes conforme INDICE | sem artefato novo em `docs/execucao-cline`; não há evidência de execução no repo | — |
| MATRIZ_DECISOES D1, D2, D4–D7, D9–D12 | PENDENTES (decisão do dono) | nenhum registro de decisão em `docs/` | — |
| MATRIZ_DECISOES D8 (suíte Dyad) | RESOLVIDA de fato | `playwright-dyad.config.ts` removido (§1 etapa 70) | registrar decisão |
| MATRIZ_DECISOES D7 (lockfile) | NÃO VERIFICADO | não medido nesta auditoria | — |
| RELATORIO_LOTE_01 §8 | isolamento de usuário E2E por job | NÃO FEITO | §1 etapa 66 | — |
| RELATORIO_LOTE_01 §8 | testes negativos de runtime das 21 P0 | NÃO FEITO como evidência | nenhum relatório; porém 17 das 21 ganharam guard em código (4.2) | — |
| RELATORIO_LOTE_01 §8 | hermeticidade E2E (078) | PARCIAL | `e2e-financeiro` offline existe; critical/destructive seguem contra produção com `retries: 2` | — |
| RELATORIO_LOTE_01 §9 | "main sem branch protection" | RESOLVIDO | baseline 2026-11-08: 8 required checks, `enforce_admins: true` | — |
| baseline-lote-a §5 | PR #1 remover `migrate-helper` (F1) | FEITO | `ls supabase/functions/migrate-helper` → inexistente | — |
| baseline-lote-a F2 | token literal em `mcp-phd-suite` | FEITO | idem 006 | — |
| baseline-lote-a F3 | anon keys JWT em 3 migrations | PERSISTE (por design: não reescrever) | 23 entradas em `.gitleaks-baseline.json`; rotação externa não verificável | rotação (dono) |
| baseline-lote-a §1 | `fuzz_test.ts`/`stress_test.ts` soltos em `supabase/functions/` | PERSISTE | `ls supabase/functions` | mover/remover |

### 4.2 MATRIZ_AUTH_EDGE (base 2026-08-30, 103 funções) × código atual

Método: `supabase/config.toml` parseado (106 blocos) + grep em cada `supabase/functions/<fn>/index.ts` por `exigirUsuario/exigirPapel/exigirChamadaInterna/exigirInternaOuUsuario/exigirAdmin*/exigirVinculoEmpresa/authenticateWebhook/getUser/getClaims/CRON_SECRET/x-cron-secret/x-mcp-secret/x-n8n-secret/asaas-access-token`. Tabela completa em `/tmp/claude-0/-home-user-Promo-Finance-V2/3832d5a6-7e57-5059-826a-b0c356f019ec/scratchpad/auth_detail.txt`.

| Doc | Item | Status | Evidência | O que falta |
|---|---|---|---|---|
| MATRIZ_AUTH | `verify_jwt`: matriz diz 4 `true` / 99 `false` | DIVERGENTE (desatualizado) | hoje 54 `true` / 52 `false`. Passaram a `true` (50): `aceitar-convite, calcular-health-score-operacional, calcular-slo-metrics-diario, calculo-iva, comparar-benchmark-setorial, conciliacao-proxy, consulta-tributaria, contabilizar-evento, convidar-contador, copilot-global, copilot-tributario, detectar-anomalias-financeiras, enviar-convite-organizacao, enviar-digest-conformidade, enviar-relatorios-tributarios-agendados, executar-fechamento-tributario, exportar-sped-contribuicoes, gerar-acoes-recomendadas, gerar-pacote-evidencias, gerar-relatorio-anual, gerar-resumo-executivo-semanal, gerar-resumo-financeiro-diario, gerar-snapshots-conformidade, gerar-sped-ecd, gerar-sped-ecf, get-mapbox-token, log-sped-bitrix24, n8n-dispatch, nfe-upload-certificado, nfe-vinculo-proxy, notify-saved-filter, overlay-rejeicoes-auditoria, processar-fila-cobrancas, processar-nf-ocr, processar-solicitacao-lgpd, projecao-reforma, relatorio-diario-anomalias, sefaz-manifestar, simular-presumido, simular-real, simular-simples, sincronizar-anomalia-bitrix24, sso-generate-metadata, sso-test-login, sso-validate-config, sync-profile-to-bitrix, upload-anexo, verificar-conformidade-fiscal, webhook-simulator, whatsapp-ai-analyzer` (`config.toml:322-350` explica o padrão) | regenerar matriz |
| MATRIZ_AUTH | 21 P0 "sem guard + service_role" | 19 RESOLVIDOS, 1 PERSISTE, 1 ERA FALSO POSITIVO | guard em código hoje: `analise-fluxo-ia, analyze-document, benchmarking-setorial, categorizar-despesa, insights-relatorio` (`exigirUsuario`); `calcular-health-score-operacional, comparar-benchmark-setorial, prever-carga-tributaria, whatsapp-ia-proativo` (`exigirInternaOuUsuario`); `enviar-alerta-email, enviar-relatorios-tributarios-agendados, executar-analise-preditiva, gerar-alertas-tributarios, notify-performance-alert` (`exigirChamadaInterna`); `detectar-anomalias-financeiras` (`exigirChamadaInterna+exigirPapel`); `gerar-acoes-recomendadas, gerar-resumo-executivo-semanal` (`exigirInternaOuUsuario+exigirAdminOuVinculo`). Só gateway (`verify_jwt=true`, sem guard em código): `relatorio-diario-anomalias`, `whatsapp-ai-analyzer`. `ci-security-gate-log`: já tinha `x-ci-gate-secret` (`index.ts:3,58-62`) — falso positivo da matriz. **`validate-ip-geo`: sem guard e `verify_jwt=false` por desenho** — é chamada antes do login (`verify_jwt=false`, `config.toml:131-132`), valida payload (`index.ts:94-99`), rate-limita por IP (`:138-146`) e o consumidor `useAuthValidation.ts:96-100` faz fail-open: uma rejeição por auth cairia em `allowed:true` e desligaria o bloqueio de IP/país no fluxo pré-login (`useAuthValidation.ts:72-99`), que é justamente o bloqueio que a função existe para aplicar | não adicionar guard (quebraria o bloqueio pré-login); decidir guard em código para os 2 "só gateway" |
| MATRIZ_AUTH | 4 "sem guard, sem SR" (`calculo-iva`, `simular-*`) | RESOLVIDOS | `verify_jwt=true` + `exigirUsuario` em cada `index.ts` | — |
| MATRIZ_AUTH | 3 "revisar" | 1 PERSISTE | `gerar-alertas-dispatcher`: `verify_jwt=false`, só repassa `Authorization` ao downstream (`index.ts:57`), nenhum guard; `projecao-reforma` e `sso-validate-config` passaram a `verify_jwt=true` (sem guard em código) | guard no dispatcher |
| MATRIZ_AUTH | 5 "cron-inline" P1 (consolidar em `exigirChamadaInterna`) | PERSISTEM | `executar-regua-cobranca` (`CRON_SECRET`,`x-cron-secret`), `sefaz-dfe-dispatcher` (`CRON_SECRET`×1,`x-cron-secret`×3), `sefaz-dfe-puxar` (`CRON_SECRET`×2,`x-cron-secret`×2), `enviar-digest-conformidade` e `gerar-snapshots-conformidade` (`x-cron-secret`×2 + `getUser`, agora `verify_jwt=true`) | consolidar |
| MATRIZ_AUTH | P1 `webhook-replay` (getUser sem papel), `sso-initiate` (sem guard, SR) | 2 FALSO DIAGNÓSTICO | `webhook-replay`: **falso diagnóstico** (usa `has_role(_role:admin)` com 403, `index.ts:43-49`; autorização presente); `sso-initiate`: **falso diagnóstico (pré-login por desenho)** — `CorporateOnboarding.hook.ts:97-115` invoca antes de sessão (rota `/auth/corporate`, `App.tsx:65`); handler valida payload, restringe `redirect_to`, exige provedor ativo e rate-limit (`index.ts:48-76,103-119`); exigir sessão impediria iniciar login corporativo, e SR é necessário para leitura pré-sessão. `scim-server` reclassificado: guard Bearer próprio via `scim_tokens` (`index.ts:1047-1064`), `getUser` de `:402` é leitura do recurso SCIM, não auth | revisar contrato |
| MATRIZ_AUTH | `health` público-design | COERENTE | `health/index.ts:25-31` `exigirUsuario` com fallback anônimo `{status:'ok'}`; `verify_jwt=false` | — |
| MATRIZ_AUTH | `get-mapbox-token`, `sso-generate-metadata` "público por design" | DIVERGENTE (mudaram para `verify_jwt=true`) | `config.toml:211-212, 282-283`; `scripts/integrity/04_endpoints.sh:100-103` já espera bearer anon no mapbox; metadata SAML exigindo JWT deve ser confirmado com o IdP | confirmar sso-generate-metadata |
| MATRIZ_AUTH | `gerar-alertas` "interna-ou-usuário + getUser×3" | MUDOU | hoje só `exigirChamadaInterna` (sem `getUser`) | atualizar matriz |
| MATRIZ_AUTH / config.toml | `monitorar-erros-frontend` | DIVERGÊNCIA código × config | `config.toml:229` comenta "aceita erros de JavaScript **não autenticado** do browser"; `index.ts` exige `exigirChamadaInterna` (+ `x-cron-secret`) — browser sem segredo recebe 401 | alinhar comentário ou código |
| MATRIZ_AUTH | funções fora da matriz (novas) | 4 NOVAS, 1 REMOVIDA | novas: `api-keys-manage` (vj=false, `exigirPapel`×4), `convidar-usuario` (vj=false, `exigirPapel`×4), `monitor-health` (vj=false, `exigirChamadaInterna`), `upload-anexo` (vj=true, `exigirUsuario`); removida: `migrate-helper` | incluir na matriz |
| MATRIZ_AUTH "Próximos passos" 1–4 | testes negativos, consolidação cron, revisão de contrato, atualização da matriz | NÃO FEITO como documento | matriz não atualizada desde `5093a727` (2026-08-30) | regenerar |

**Contagem execucao-cline:** INDICE 100 etapas → verificáveis nesta auditoria 22 (FEITO 10 · PARCIAL 8 · NÃO FEITO 4: 060, 076 e artefatos §14 ×2 grupos), 78 continuam pendentes/não verificáveis conforme o próprio índice (⛔/❌/🟡). MATRIZ_DECISOES 12 → 1 resolvida de fato (D8), 1 parcial (D3), 10 pendentes. MATRIZ_AUTH 103 funções → 103 auditadas: 50 divergências de `verify_jwt`, 20 P0 resolvidos, 0 P0 persistentes (o nono falso positivo: `validate-ip-geo` é pré-login por desenho, fail-open no consumidor `useAuthValidation.ts:96-100`), 1 falso positivo (`ci-security-gate-log`), 6 P1 persistentes (5 cron-inline + `gerar-alertas-dispatcher`), 2 mudanças de contrato público→JWT, 1 divergência config×código, 4 novas/1 removida. RELATORIO_LOTE_01 pendências 5 → 1 resolvida, 1 parcial, 3 pendentes. baseline-lote-a 4 itens → 2 FEITO, 2 persistem.

---

## 5. Runbooks (`docs/HEALTHCHECK.md`, `docs/runbooks/*.md`, `docs/RUNBOOK.md`)

Verificado FEITO (existem): `scripts/healthcheck/{run.sh,01_webhooks.sh,02_crons.sql,03_realtime.mjs,04_events.sh,baseline/expected-webhooks.json,fixtures/*.json}`; `scripts/staging-migrate.sh:23,46,246` `--skip-healthcheck`/fase 8; edge `health` e `monitor-health`; `functions-deploy.yml`, `prod-migrate.yml`; `src/lib/telemetry.ts`, `src/lib/console-guard.ts`, web-vitals, Sentry (`src/config/env.ts`); objetos SQL em migrations: `edge_function_logs, frontend_error_logs, get_cron_run_history, toggle_cron_job, gerar_alertas_vencimento, has_any_role, certificado_get_password, empresas_certificados, webhooks_log, n8n_dispatch_logs, webhook_events`; `NFE_CERT_MASTER_KEY_PREV` (`_shared/sefaz/pfx.ts`), `CONTADOR_INVITE_SECRET` (2 fns); vars `PROD_PROJECT_REF`/`REQUIRED_SECRETS` (`prod-migrate.yml:84`, `staging-migrate.yml:73-74`); `docs/MIGRATION_CHECKLIST.md`, `docs/STAGING_MIGRATION.md`, `docs/DATA_MIGRATION.md`; `scripts/data/{tables.yaml,checkpoint.sql,copy-table.sh,rollback.sh,verify.sh}`, `scripts/data-migrate.sh`, `scripts/migrate-cron-jobs.sh/.sql` (13 `cron.schedule`), `scripts/integrity/01-15 + run.sh + dump-baseline.sh`, `_shared/resilience.ts` (`INTEGRACOES_DESATIVADAS`), `.env.example`.

| Doc | Etapa/Item | Status | Evidência | O que falta |
|---|---|---|---|---|
| UPTIME | monitor externo (Better Stack/UptimeRobot/Checkly), 3 alvos, alerta | NÃO FEITO (só "sugerido") | `grep -rliE "uptime\|betterstack\|checkly\|uptimerobot" .github/workflows scripts` vazio; nenhum workflow de uptime | configurar fora do repo e registrar |
| UPTIME / HOTFIX / INCIDENTES | URL `https://app.promo-finance.com` | NÃO VERIFICADO (divergência registrada) | `docs/agentes/vercel-deploy.md:18-26`: domínio não aparece nos domínios do projeto Vercel | confirmar domínio |
| UPTIME §RUM | destino de web-vitals ("próxima ação") | PENDENTE (declarado) | `src/lib/telemetry.ts` existe; sem evidência de ingestão configurada no repo | — |
| BACKUP_DR §tabela | "GitHub (repositório **privado**)" | DIVERGENTE | `docs/agentes/github-ci.md:8` público; plano §1 achado D | corrigir doc ou tornar privado |
| BACKUP_DR B.6 | "`scripts/integrity/*.sh`" | IMPRECISO | `.sh` em `scripts/integrity` = só `run.sh`, `04_endpoints.sh`, `dump-baseline.sh`; os checks são `.sql` via `run.sh` | citar `run.sh` |
| BACKUP_DR gaps 1–2 | PITR confirmado; réplica de Storage | NÃO FEITO (não verificável no repo) | nenhum script/job de backup de buckets em `scripts/` | — |
| BACKUP_DR §Ensaio | log de ensaios de DR (semestral) | NÃO FEITO | tabela vazia (`—`) | registrar 1º ensaio |
| INCIDENTES §3.2 | "circuit breaker do roadmap" / `feature_flags` | PARCIAL | `supabase/functions/_shared/resilience.ts` tem `INTEGRACOES_DESATIVADAS`; tabela `feature_flags` não encontrada em migrations (`grep -l feature_flags supabase/migrations/*` vazio) | alinhar runbook ao mecanismo real |
| INCIDENTES §4 / HOTFIX | `docs/postmortems/AAAAMMDD-<slug>.md` | NÃO EXISTE | `ls docs/postmortems` → inexistente | criar pasta/1º post-mortem |
| HOTFIX §4 | "PR com label de urgência" | NÃO VERIFICÁVEL | nenhuma label definida no repo (labels vivem no GitHub) | — |
| ROTACAO_SECRETS §tabela final | registro de rotações (8 secrets) | NÃO FEITO | todas as linhas `—` | registrar |
| ROTACAO_SECRETS §Rotação periódica | "a cada 90 dias" | NÃO FEITO (sem automação/lembrete) | nenhum workflow/scheduled task de lembrete | — |
| RUNBOOK.md §2 | edge `simular-regimes` | NÃO EXISTE | `ls supabase/functions \| grep -c '^simular-regimes$'` = 0 (existem `simular-simples/real/presumido`) | corrigir |
| RUNBOOK.md §2, §6, Contatos | "painel Lovable Cloud → Backend", "vault Lovable Cloud", `update_secret`, `lovable_api_key--rotate_lovable_api_key` | DESATUALIZADO | stack atual é Supabase Cloud `bwwbeyolnnzppeuhgkcd` (AGENTS.md §1); ferramentas Lovable não existem no repo; `LOVABLE_API_KEY` ainda é lida por 22 funções (ok) | reescrever §2/§6 para Supabase (ver `docs/runbooks/ROTACAO_SECRETS.md`) |
| RUNBOOK.md §1, §5 | `mem://security/...`, `mem://integrations/...` | NÃO SÃO ARQUIVOS | referências a memória de IDE, não a `docs/` | substituir por caminhos |
| RUNBOOK.md §7 | "356 migrations" | DESATUALIZADO | plano cita 602; baseline-lote-a 551; hoje `ls supabase/migrations \| wc -l` > 600 | regenerar número |
| RUNBOOK.md §8 | "Edge Functions (87)" / "`functions list` → 87" | DESATUALIZADO | 106 funções | — |
| RUNBOOK.md §8 vs §9 | "13 cron jobs" vs "05_crons.sql — 14 jobs ativos" | INCONSISTENTE | `scripts/migrate-cron-jobs.sql` tem 13 `cron.schedule` | conferir 05_crons.sql |
| RUNBOOK.md §9 | "`04_endpoints.sh` — smoke de 7 Edge Functions críticas" | DIVERGENTE | script bate em 6: `health, get-mapbox-token, asaas-webhook, bling-webhook, cnpja-lookup, expert-agent` (`grep -oE "hit (GET\|POST) /[a-z0-9-]+"`) | corrigir contagem |
| RUNBOOK.md §9 | "`02_rls.sql` — sem `USING (true)`" | DIVERGENTE com gate canônico | `test-canonical-db-gates.mjs:130` mantém allowlist de policies literal-true (ex.: `asaas_payment_links`) | alinhar |
| HEALTHCHECK.md | — | FEITO (8/8 citações existem) | — | — |

**Contagem runbooks:** itens citados auditados 58 → existem/FEITO 37 · PARCIAL 2 · NÃO FEITO/NÃO EXISTE 8 (monitor externo, postmortems, ensaio DR, registro de rotação, lembrete 90d, backup Storage, `simular-regimes`, RUM) · DIVERGENTE/DESATUALIZADO 9 · NÃO VERIFICÁVEL 2 (domínio Vercel, label).

---

## Resumo transversal (o que muda decisão)

1. Duas etapas marcadas ✅ na evidência de 27/09 não existem no CI: suíte Vitest ainda roda 2× (`ci.yml:445,457`) e o lint do CI não é `lint:strict` (`ci.yml:296`) — a meta `lint:strict` do AGENTS.md não é gate.
2. Os 4 gates de banco do `quality-gate` continuam condicionais a `DATABASE_URL` com `--mode summary` (`ci.yml:305`) — passam verde sem rodar.
3. Perímetro GitHub: sem review obrigatório, sem linear history, actions `all`/sem SHA obrigatório, rulesets 0, env `copilot` vivo, repo público (baseline 2026-11-08).
4. Graphify: `graph.json` não existe no repo, CLI ausente, `GRAPH_REPORT` parado em `79cb9a2a` (06/10) e a promessa "auto-sync N8N 15 min" não tem artefato; `.claude/settings.json` instala hooks que o plano proíbe.
5. Auth das edges: 0 P0 persistem (`validate-ip-geo` não é P0: pré-login por desenho, com rate-limit e fail-open no consumidor), 9 P1 persistem, matriz desatualizada em 50 `verify_jwt` e 4 funções novas.
6. Runbooks: `docs/RUNBOOK.md` descreve stack Lovable e números antigos (87 fns, 356 migrations, `simular-regimes`); nenhum post-mortem, ensaio de DR ou rotação registrada; monitor externo de uptime não existe.

---

## Anexo — A8 — Auditoria dos planos de migração/banco (somente leitura, sem acesso ao banco)

Data: 2026-11-20 · Repo: `/home/user/Promo_Finance_V2` (1048 migrations em `supabase/migrations/`).
Método: para cada etapa/item, `grep` nas migrations (CREATE/DROP por nome), `ls` em `scripts/`, `supabase/tests/`, `.github/workflows/`, `docs/`. Tudo que exige `SELECT` em produção está marcado **NÃO VERIFICÁVEL SEM BANCO**. Só constam pendentes, parciais e divergentes; etapas confirmadas como FEITO são apenas contadas no fim.

Legenda de status: FEITO · PARCIAL · NÃO FEITO · NÃO VERIFICÁVEL SEM BANCO (inclui infra externa: Vercel, Lovable, Cloudflare, VPS, provedores) · MARCADO FEITO, NÃO ENCONTRADO · DIVERGENTE (feito ao contrário do plano por decisão posterior).

---

## 1. docs/migracao/PLANO-CORRECOES-100-ETAPAS.md

| Doc | Etapa/Item | Status | Evidência | O que falta |
|---|---|---|---|---|
| PLANO-100 | 1 Rotacionar credenciais | NÃO VERIFICÁVEL SEM BANCO | Infra externa (Dashboard, Workers, VPS). Literal `DJ9PcaG72` só aparece citado no próprio plano (`docs/migracao/PLANO-CORRECOES-100-ETAPAS.md`); `repos/supabase-full-mcp-server` não está neste repo | Confirmar rotação fora do repo |
| PLANO-100 | 2 Congelar escrita na origem | NÃO VERIFICÁVEL SEM BANCO | Ação em `cron.job` do projeto `lszcm…` | — |
| PLANO-100 | 3 Backup lógico | NÃO VERIFICÁVEL SEM BANCO | VPS/MinIO; `docs/runbooks/BACKUP_DR.md` existe (procedimento), sem `BACKUPS.md`/hash | Evidência do dump |
| PLANO-100 | 4 `docs/FONTE-DE-VERDADE.md` | PARCIAL | Arquivo ausente; papel cumprido por `docs/adr/0001-fonte-da-verdade-migracao.md` (E05 do plano 60), não linkado no `README.md` (seções: Stack, Como rodar, Scripts, Banco de dados, Documentação) | Criar/linkar ou formalizar que o ADR substitui |
| PLANO-100 | 5 Repo privado + limpar `supabase/.temp` | PARCIAL | `.gitignore:59` tem `supabase/.temp/`, pasta não versionada (FEITO). `gh api repos/adm01-debug/Promo_Finance_V2` → `"private":false,"visibility":"public"` | Tornar privado (decisão do dono) |
| PLANO-100 | 6 Staging isolado | PARCIAL / NÃO VERIFICÁVEL | `.github/workflows/staging-migrate.yml` + `scripts/staging-migrate.sh` existem; o workflow só testa presença dos secrets (`staging-migrate.yml:38-47`). Nenhum `staging` em `supabase/config.toml` | Existência do projeto/secrets não comprovável pelo repo |
| PLANO-100 | 7 Gate CI contra DDL fora de migrations / migration imutável | PARCIAL | `ci.yml:262-265` roda `scripts/security/test-migration-replay-safety.sh`; não há job que falhe ao tocar `*.sql` fora de `supabase/migrations/` nem ao modificar migration antiga | Gate de imutabilidade |
| PLANO-100 | 8 `scripts/db-diff/run.sh` | NÃO FEITO | `scripts/db-diff/` inexistente; `inv*.sql`/`diff.js` não versionados. Equivalentes parciais: `scripts/inventario/banco.sql`, `scripts/supabase_snapshot/snapshot.py`, `scripts/integrity/` | Script de diff origem×destino reproduzível |
| PLANO-100 | 9 Remover `_dbg/_t/_v4` + `_test_fn*` | PARCIAL | `20260825090000_hardening_seguranca_destino.sql` dropa `_test_fn`, `_test_fn2`, `_trig_fn`; nenhuma migration cita `_dbg`, `_t`, `_v4` (`grep -lw` = 0) | DROP das 3 tabelas lixo não versionado (estado em prod NÃO VERIFICÁVEL) |
| PLANO-100 | 12 `search_path` em SECDEF sem config | PARCIAL | `20260825090000:81` só `is_user_admin()`; `has_any_role` já tinha `SET search_path = public` (`20260728140000:8`, sem `pg_catalog`). Varredura "todas as SECDEF com proconfig NULL" é só em DB | Varredura final NÃO VERIFICÁVEL SEM BANCO |
| PLANO-100 | 13 Conter/dropar `exec_sql` | DIVERGENTE | Wave1 moveu para `private` sem migration; `20260826010000_restaurar_exec_sql_wrapper_e03.sql` **recria** `public.exec_sql` (wrapper). `DROP` final não existe; `docs/SECURITY.md` não registra | Decidir se o wrapper fica; registrar exceção |
| PLANO-100 | 15 `FORCE RLS` em `audit_logs`/`frontend_error_logs` | NÃO FEITO | Único FORCE é genérico pré-plano (`20260711164724:23`); nenhuma migration pós-plano. Pai não particionado em prod (`20261113114335` cabeçalho) | Migration explícita |
| PLANO-100 | 16 `planos_acao` policy tenant | PARCIAL | Policy recriada como owner (`user_id = auth.uid()`) em `20260825230000:627`, não `empresa_membro_ativo(empresa_id)` como pedido | Decidir modelo (owner vs tenant) |
| PLANO-100 | 17 Remover usuário E2E de prod | NÃO VERIFICÁVEL SEM BANCO | `auth.users`; `TEST_ADMIN_JWT` só em `staging-migrate.yml:50,72` | — |
| PLANO-100 | 18 Bucket de teste / `migrate-helper` na origem | NÃO VERIFICÁVEL SEM BANCO | Origem Lovable | — |
| PLANO-100 | 19 Voltar 15 funções para `verify_jwt=true` + `scripts/probe-functions.sh` | NÃO FEITO (superado por E15) | `supabase/config.toml`: as 15 (`gerar-alertas`, `executar-relatorios`, …, `external-data`) estão `verify_jwt = false`; `scripts/probe-functions.sh` ausente. Plano 60 (E15/Apêndice B) decidiu o oposto (100 OFF) | Conflito entre planos nunca registrado |
| PLANO-100 | 20 Exceções em `docs/SECURITY.md` | NÃO FEITO | `grep -i "exec_sql\|get-vapid-key\|health\|webhook" docs/SECURITY.md` = vazio | Lista de exceções com dono/data |
| PLANO-100 | 21 Limpar ledger fantasma `financeiro_*` | NÃO VERIFICÁVEL SEM BANCO | `docs/migracao/historico-fantasma.json` ausente | Cópia do histórico |
| PLANO-100 | 22 Baseline `20260825100000_baseline_schema_origem.sql` | PARCIAL | Existe `20260825100000_reconciliar_schema_completo.sql` (11.572 linhas) + `20260825110000_reconciliar_schema_v3_completo.sql` (7.337) — reconciliação, não baseline idempotente para ambiente novo | Baseline/squash (E46) |
| PLANO-100 | 23 `docs/migracao/ORDEM.md` | NÃO FEITO | Ausente | — |
| PLANO-100 | 24 Registrar migrations aplicadas no ledger | NÃO VERIFICÁVEL SEM BANCO | Mecanismo similar existe em `20261102000000_registrar_grupo_b_rls_cross_tenant.sql` (registra 15 migrations `20260902*` condicionado a efeitos) | — |
| PLANO-100 | 25 Regra de nome + `scripts/check-migration-name.sh` | PARCIAL | `CONTRIBUTING.md` não cita migration; `scripts/check-migration-name.sh` ausente. Regra vive em `AGENTS.md` §4 | Lint no CI |
| PLANO-100 | 26 Arquivar legadas em `_archive/` | NÃO FEITO | `001_create_tables.sql`, `002_rls_policies.sql`, `003_seed_data.sql`, `20241231000000/1` seguem em `supabase/migrations/`; `_archive/` inexistente | — |
| PLANO-100 | 27 `db-migrate.yml` em push para main | PARCIAL | `prod-migrate.yml` existe, mas é `workflow_dispatch` manual com environment `Production-Ops` (linhas 6-7,16-17); `migration-ledger.yml` é diagnóstico read-only | Automático em merge (decisão §6.6) |
| PLANO-100 | 28 `functions-deploy.yml` por diretório alterado | PARCIAL | `functions-deploy.yml` existe, `workflow_dispatch` por nome de função (`:3-7,119,138`), não matriz por diff | — |
| PLANO-100 | 29 Lovable→GitHub desligado / branch protection | NÃO VERIFICÁVEL | `gh api .../branches/main/protection` → 403 | — |
| PLANO-100 | 30 `docs/ESTADO-BANCO.md` gerado semanalmente | NÃO FEITO | Ausente; `estado-real.yml` gera `docs/ci/*`, não diff de banco; `ESTADO_ATUAL.md` datado 2026-08-16 | — |
| PLANO-100 | 33 Dropar `nfe_xml`/`subscriptions`; `estrategias_elisao_catalogo` como view | DIVERGENTE | Nenhum `DROP TABLE nfe_xml/subscriptions` em migrations (citadas em 5/4 arquivos, 0 DROP); `20261117000000_catalogo_elisao_volta_a_ser_tabela.sql` converte a VIEW em TABELA (reconcilia com prod) — oposto da etapa | Registrar decisão; `_bak_` nunca existiu |
| PLANO-100 | 38 `docs/migracao/partidas-invalidas.md` | PARCIAL | Funções/triggers FEITOS (`fn_balancete` 20261113181100, `fn_livro_razao` 20261116170000, `trg_validar_partidas_dobradas` 20261112003647 como CONSTRAINT TRIGGER); doc de exceções ausente | Doc |
| PLANO-100 | 39 `docs/migracao/decisoes-colunas.md` | PARCIAL | Colunas/trigger `trg_pix_template_sync_legacy` FEITOS (20260825110000); doc ausente | Doc |
| PLANO-100 | 43 Restaurar precisão numérica | NÃO FEITO | `grep -lE 'ALTER COLUMN \w+ (SET DATA )?TYPE numeric\([0-9]+,[0-9]+\)' supabase/migrations/*.sql` = 0 arquivos; `docs/agentes/auditoria-drift-banco-2026-11-17.md` confirma 38 tabelas com tipo divergente (grupo 3 pendente) | Migration de tipos |
| PLANO-100 | 45 Fechar 78 tabelas divergentes + `scripts/db-diff/columns.js` | PARCIAL | Script ausente. Convergências pontuais: `20261116220000` (17 colunas só em prod), `20261117193000`, `20261117220000` (5 colunas), `20261117223000`. Drift 17/11: 272 colunas só em prod, 475 só nas migrations | Maior parte das colunas |
| PLANO-100 | 46 `docs/migracao/violacoes-check.md` | PARCIAL | CHECKs FEITOS (`20260825220000_check_constraints_e46.sql`, 1.287 linhas); doc ausente; VALIDATE em prod NÃO VERIFICÁVEL | Doc |
| PLANO-100 | 48 `docs/migracao/objetos-so-destino.md` | NÃO FEITO | Ausente | — |
| PLANO-100 | 49 274 índices ausentes | PARCIAL | `20260825240000_validate_constraints_fks_indexes.sql` tem 8 linhas; índices adicionais em `20261117204500`, `20261117225000`, `20261117232000`; replay 17/11: 1160 índices (repo) vs 686 (prod) | Diff de índices NÃO VERIFICÁVEL SEM BANCO |
| PLANO-100 | 50 Índices/constraints divergentes | NÃO VERIFICÁVEL SEM BANCO | — | — |
| PLANO-100 | 51 Reparticionar `audit_logs` | NÃO FEITO (revertido) | Prod é tabela comum; `20261113114335_ensure_monthly_partitions_ignora_pai_nao_particionado.sql` faz o cron ignorar; `20261118003500_drop_particoes_orfas_e_views_mortas.sql` dropa as 11 filhas órfãs (aprovado pelo dono 18/11) | Decisão contrária ao plano — registrar |
| PLANO-100 | 52 Reparticionar `frontend_error_logs` | NÃO FEITO | Idem; `20261118003500` diz explicitamente "Não toca: frontend_error_logs_2026_* / _default" — órfãs ainda em prod. Trigger sanitize existe (`20260825110000`) | Limpeza das órfãs (próximo passo já listado lá) |
| PLANO-100 | 53 `maintain_monthly_partitions`/`drop_old_partitions` no formato da origem | PARCIAL | Existem (`20261113114335`, `20261113114643`), mas versão adaptada a pai não particionado — não "formato da origem" | — |
| PLANO-100 | 55 `mv_benchmark_setorial` | DIVERGENTE | Recriada em `20260827100000`, **dropada** em `20261118003500` junto com `refresh_mv_benchmark_setorial()` (sem leitor) | — |
| PLANO-100 | 58 `internal_job_secret()` lendo vault | PARCIAL | Funções de observabilidade FEITAS; `internal_job_secret` em `20260825100000:6614` ainda lê `public.integration_secrets` | Migrar para `vault.decrypted_secrets` |
| PLANO-100 | 59 gates 25-35 ligados ao CI | PARCIAL | Funções existem (`20260825110000`; `gate_34` em `20260827100000`); CI não chama `gate_*` (grep em `.github/workflows` = 0); `scripts/integrity/08,09,10_*.sql` chamam gate_29/30/31 só no fluxo de staging | Job no CI |
| PLANO-100 | 61, 62 Triggers/funções divergentes vs origem | NÃO VERIFICÁVEL SEM BANCO | Compara hash com origem | — |
| PLANO-100 | 63 Sobrecargas conflitantes | PARCIAL | `supabase/tests/sql/overloads.test.sql` existe; ambiguidade real só em DB | NÃO VERIFICÁVEL SEM BANCO |
| PLANO-100 | 65 16 views + 2 ausentes | PARCIAL / DIVERGENTE | `vw_auditoria_tributaria_recente`, `vw_transferencias_painel` criadas (`20260827100000`); `vw_rpc_hotspots`, `vw_rpc_slow_calls` **dropadas** em `20261118003500`; `gate_30` não roda no CI | — |
| PLANO-100 | 66 Portar evoluções do destino para baseline | PARCIAL | `invocar_regua_cobranca` só em `20260822115000`; não há baseline (E46) | — |
| PLANO-100 | 69 Revisar 122 policies só-destino (`policies-so-destino.md`) | NÃO FEITO | Doc ausente; `docs/RLS_MATRIZ_NEGATIVA.md` lista ~25 policies `USING (true)`/owner vivas sem DROP posterior (ver §3) | — |
| PLANO-100 | 70 `clientes` policies com `empresa_membro_ativo` | FEITO (repo) / NÃO VERIFICÁVEL | `20260825110000:5545`, `20260825230000:203-205` incluem `empresa_id IS NULL OR empresa_membro_ativo(...)` | Prova em prod |
| PLANO-100 | 71 Policies de storage | PARCIAL | `nfe-xml`/`nfe-certificados` FEITO (`20260722193843`, `20260722193917`, `20260902250000`); bucket `financeiro` reescrito em `20261013120000:152-191`, mas `RLS_MATRIZ_NEGATIVA.md` ainda registra GAP P1 (SELECT/DELETE sem prefixo) | Confirmar se 20261013120000 fecha o GAP e atualizar doc |
| PLANO-100 | 72 Supabase Advisor zerado | NÃO VERIFICÁVEL SEM BANCO | — | — |
| PLANO-100 | 73 `supabase/tests/rls_tenant.test.ts` (Deno, matriz cruzada) | PARCIAL | Ausente. Existem `supabase/tests/sql/rls_multi_empresa.sql` (roda em `ci.yml:323` via psql se `DATABASE_URL`), `scripts/security/test-tenant-isolation.sql`, `test-write-isolation.sql`, `test-tenant-policy-scope.sql` — não é matriz por tabela nem roda em `deno-tests.yml` | Teste cruzado completo |
| PLANO-100 | 74, 77, 78, 79 Dados (catálogos, seeds, profiles, telemetria) | NÃO VERIFICÁVEL SEM BANCO | `docs/migracao/truncate-list.md` ausente; `20261117052200_seed_benchmarks_setoriais.sql` cobre 1 catálogo | — |
| PLANO-100 | 76 `integration_secrets` → vault | DIVERGENTE | `20260827090000_reconciliar_integration_secrets_sem_drop.sql` mantém a tabela; `internal_job_secret` lê a tabela; nenhuma migration usa `vault.create_secret` | Decisão vault vs tabela |
| PLANO-100 | 80 44 secrets de runtime | NÃO VERIFICÁVEL SEM BANCO | `.gitignore:41-44` não cobre `.env.functions` (só `.env`, `.env.local`, `.env.development*`) | Adicionar ao `.gitignore` se o arquivo for usado |
| PLANO-100 | 81 Unificar `APP_PUBLIC_URL` | PARCIAL | `supabase/functions/_shared/app-url.ts:15-17` lê as 3 vars (fallback), erro pede `APP_BASE_URL` (`:26`) — padrão ficou `APP_BASE_URL`, não `APP_PUBLIC_URL`; sem aviso de depreciação | Alinhar nome canônico/doc |
| PLANO-100 | 82 Deploy das 90 funções | NÃO VERIFICÁVEL SEM BANCO | `functions-deploy.yml` existe | — |
| PLANO-100 | 84 `sefaz-dfe-puxar`/`sso-initiate` 503 | PARCIAL / NÃO VERIFICÁVEL | `grep allowed_domains supabase/functions/sso-initiate/index.ts` = 0 | — |
| PLANO-100 | 85 Remover `LOVABLE_API_KEY` / refs à origem | PARCIAL | `index.html:44-45` já aponta para `bwwbeyolnnzppeuhgkcd` (FEITO); `LOVABLE_API_KEY` ainda em 22 arquivos de `supabase/functions` | Substituir gateway de IA (decisão de custo) |
| PLANO-100 | 86 Mover `fuzz_test.ts`/`stress_test.ts` para `_tests/`; Deno tests em staging | NÃO FEITO | Arquivos seguem em `supabase/functions/`; `deno-tests.yml:119,164` usa `localhost:54321` e `secrets.VITE_SUPABASE_URL` (não staging) | — |
| PLANO-100 | 87 `health` com checks de vault/buckets/cron | PARCIAL | `supabase/functions/health/index.ts` consulta `asaas_config` e faz pings; sem `vault.secrets`, buckets ou `cron.job` | — |
| PLANO-100 | 88 `docs/webhooks.md` + repontar provedores | NÃO FEITO / NÃO VERIFICÁVEL | Doc ausente (webhooks aparecem em `docs/RUNBOOK.md`, `docs/HEALTHCHECK.md`, `docs/EDGE_FUNCTIONS_CATALOG.md`); provedores externos fora do repo | — |
| PLANO-100 | 89 `20260825170000_cron_jobs.sql` com 30 jobs | PARCIAL | Arquivo ausente. Migrations nomeiam 28 jobs distintos (`cron.schedule`), incluindo `webhook-retry-worker-1min`, `sefaz-observability-hourly`, `monitorar-erros-frontend`, `integrity-invariants-hourly`, `capture-index-usage-daily`. Ausentes da lista do plano: `auditar-acessos-cross-tenant`, `cleanup-cron-logs`, `cleanup-expired-tokens`, `cleanup-login-attempts`, `daily-log-cleanup`, `gerar-snapshots-conformidade-mensal`, `recarregar-seeds-fiscais-diario`, `sefaz-dfe-dispatcher-15min`, `snapshot-table-bloat-daily`. `scripts/migrate-cron-jobs.sql` tem 13; `scripts/integrity/baseline/expected-crons.json` tem 1 | Jobs faltantes versionados; baseline de crons desatualizado |
| PLANO-100 | 90 Duplicidade da régua | PARCIAL | Migrations agendam **ambos**: `processar-regua-cobranca-diario` (5 ocorrências; função recriada em `20261117010000`) e `executar-regua-cobranca-diaria` (3) — plano pedia manter só o segundo | Estado real NÃO VERIFICÁVEL SEM BANCO |
| PLANO-100 | 91, 92, 94, 95, 99 Alertas, N8N/Evolution, Vercel, MCPs, cutover | NÃO VERIFICÁVEL SEM BANCO | Infra externa | — |
| PLANO-100 | 93 Drift semanal (segunda 06:00) abrindo issue | PARCIAL | `schema-drift.yml` roda `cron: '0 6 * * 1'`, mas compara `types.ts` e paridade do ledger via `PROD_DB_URL` (`:22,171-183`); não aplica baseline em staging nem abre issue (grep `issue` = 0) | — |
| PLANO-100 | 96 README/ESTADO_ATUAL atualizados | PARCIAL | `README.md` sem seções "Ambientes", "Como deployar function", "Como rodar o diff"; `ESTADO_ATUAL.md` de 2026-08-16 | — |
| PLANO-100 | 97 Diff = 0 (critério de aceite) | NÃO VERIFICÁVEL SEM BANCO | Depende da etapa 8 (ausente) | — |
| PLANO-100 | 98 Smoke E2E (`docs/migracao/smoke.md`) | NÃO FEITO | Doc ausente; execução NÃO VERIFICÁVEL | — |
| PLANO-100 | 100 `docs/migracao/RETRO.md` | NÃO FEITO | Ausente | — |

Etapas confirmadas FEITO no repo (não listadas acima): 10, 11, 14, 31, 32, 34, 35, 36, 37, 40, 41, 42, 44, 47, 54 (`20260825090000:138` + `20260712194216`), 56, 57, 60, 64, 67, 68, 75 (`20260825100000:11569-11571`), 83 (106 blocos = 106 pastas).

**Contagem PLANO-100 (100 etapas):** FEITO 23 · PARCIAL 31 · NÃO FEITO 15 · DIVERGENTE 4 · NÃO VERIFICÁVEL SEM BANCO 27.

---

## 2. docs/migracao/PLANO-CORRECAO-60-ETAPAS.md

Todas as 60 etapas estão `- [ ]` no doc (painel 0/60). Status real:

| Doc | Etapa/Item | Status | Evidência | O que falta |
|---|---|---|---|---|
| PLANO-60 | E01 Backup | NÃO VERIFICÁVEL SEM BANCO | VPS | — |
| PLANO-60 | E02 `docs/migracao/ESTADO-CUTOVER.md` | NÃO FEITO | Ausente; `index.html:44` aponta para `bwwbey…` (indício de cutover feito) | Doc |
| PLANO-60 | E04 Registrar 3 migrations no ledger | NÃO VERIFICÁVEL SEM BANCO | — | — |
| PLANO-60 | E06-E08 Fechar policies abertas/sobrepostas | PARCIAL | `20260826040000_fechar_policies_abertas_e06_e08.sql` (105 linhas SQL, "91 policies"). Porém `RLS_MATRIZ_NEGATIVA.md` (out/2026) lista policies `USING(true)` nunca derrubadas e o grep confirma `ult_drop = -` para: `Users can view own contas_pagar/receber` (002), `Users can manage their own transferencias/vendedores/retencoes/contratos/metas/partidas/regimes`, `Permitir acesso total whatsapp_conversas/historico_cobranca_whatsapp/resumos_executivos_semanais`, `Empresa access for faturamento/folha/payment methods/duplicate rules/routing/apuracoes`, `Users can view logs`, `Users can manage their own tax alerts`, `Users can manage acoes_recomendadas`; e owner-sem-tenant recriadas em `20260825230000`: `Owner manage acordos/execucoes/boletos/alertas/sessoes`, `hap_user_insert`, `fornecedores_owner_select`, `conciliacoes_owner_all`, `concil_parciais_owner_all` | Migration derrubando/escopando essas policies |
| PLANO-60 | E10 `gate_36_funcoes_sem_revoke` + `allowlist-rpc.txt` + job CI | PARCIAL | `gate_36` inexistente (0 citações); allowlist ausente. Equivalente: `scripts/integrity/07_exec_grants.sql` + `baseline/allowed-secdef-exec.json` (fluxo staging) e `scripts/security/test-observability-privileges.sql` no `ci.yml:316` (condicionado a `DATABASE_URL`) | Gate nominal no CI |
| PLANO-60 | E12 `20260826041000_grants_tabelas.sql` | NÃO FEITO | Ausente; parcial em `20261116151000_grants_authenticated_audit_por_coluna.sql` | — |
| PLANO-60 | E14 initplan | FEITO (repo) / NÃO VERIFICÁVEL | `20260825230000_initplan_rls_e67.sql` (904 linhas) | Diff final em DB |
| PLANO-60 | E16-E20 Redeploy, secrets, webhooks, provedores | NÃO VERIFICÁVEL SEM BANCO | Infra | — |
| PLANO-60 | E21 `scripts/probe-edge-functions.sh` + `edge-functions-matrix.md` + job CI | NÃO FEITO | Ambos ausentes. Parcial: `scripts/edge-deploy/smoke-functions.mjs`, `scripts/integrity/04_endpoints.sh` | — |
| PLANO-60 | E22 Worker MCP da origem | NÃO VERIFICÁVEL SEM BANCO | Cloudflare | — |
| PLANO-60 | E25 Vault + `internal_job_secret` única fonte | PARCIAL | `internal_job_secret` lê `integration_secrets` (`20260825100000:6614`); vault NÃO VERIFICÁVEL | — |
| PLANO-60 | E26 Recriar 8 crons HTTP; `migrate-cron-jobs.sql` com 31 | PARCIAL | Migrations com `net.http_post` em cron: `20260726180529`, `20260728183119`, `20260822115000`, `20260913120000`, `20261101200000`; dos 8 pedidos faltam nas migrations `sefaz-dfe-dispatcher-15min`, `gerar-snapshots-conformidade-mensal`, `auditar-acessos-cross-tenant`. `scripts/migrate-cron-jobs.sql` = 13 jobs | — |
| PLANO-60 | E27 Alinhar 15 jobs | NÃO VERIFICÁVEL SEM BANCO | — | — |
| PLANO-60 | E28 Substituir stubs (`20260826110000_funcoes_reais.sql`) | PARCIAL | Arquivo ausente. `run_integrity_cycle` real em `20260728122339:231-247` (chama `check_integrity_invariants`); `check_catalogos_tributarios_invariants` 117 linhas (`20260728131802`); `lancamento_contabil_before_insert` 19 linhas (`20260726144646`) — pode ser o "stub de 91 chars"; `validar_partidas_dobradas` refeito `20261112003647` | Corpos vs origem NÃO VERIFICÁVEL SEM BANCO |
| PLANO-60 | E29 Alerta de cron em canal externo | NÃO VERIFICÁVEL SEM BANCO | — | — |
| PLANO-60 | E30 372 colunas (`20260826030000_colunas_ausentes.sql`) | MARCADO FEITO, NÃO ENCONTRADO | `20260826030000_add_colunas_ausentes_e30.sql` é marcador (5 linhas SQL, cabeçalho: "não contém a DDL original"). Drift 17/11: 475 colunas declaradas ausentes em prod. Correções parciais `20261117193000`, `20261117220000`, `20261117223000` | DDL real |
| PLANO-60 | E31 Convergir tributário (`20260826070000`, `mapeamento-colunas.md`) | NÃO FEITO | Ambos ausentes | Decisão do dono |
| PLANO-60 | E32 Convergir integrações (`20260826071000`) | NÃO FEITO | Ausente | — |
| PLANO-60 | E33 Convergir observabilidade (`20260826072000`) | PARCIAL | Ausente; só `saved_filter_subscriptions` convergida (`20261117223000`) | — |
| PLANO-60 | E34 Reparticionar logs (`20260826080000`) | NÃO FEITO (revertido) | Ver PLANO-100 §51/52 | — |
| PLANO-60 | E35 256 constraints (`20260826090000`) | PARCIAL | Ausente; cobertura parcial por `20260825220000` (CHECKs), `20260825250000` (6 constraints), `20261116210000`, `20261117232000` (UNIQUEs) | — |
| PLANO-60 | E36 Conflitos semânticos (`partidas_contabeis_tipo_check` D/C) | DIVERGENTE | Migrations posteriores adotaram `'debito'/'credito'` do destino (`20261111233235`, `20261112003647`, `20261113181100`), não `'D','C'` da origem; FKs CASCADE NÃO VERIFICÁVEL | Registrar decisão |
| PLANO-60 | E37 `ALTER TYPE tipo_cobranca ADD VALUE 'cartao'` | NÃO FEITO | `grep "ALTER TYPE.*tipo_cobranca.*ADD VALUE"` = 0 | Migration |
| PLANO-60 | E38 Índices (`scripts/sql/indices_convergencia.sql`) | PARCIAL | Script ausente; índices parciais em `20261117204500`, `20261117225000`, `20261117232000` | — |
| PLANO-60 | E39 Views/matview/`estrategias_elisao_catalogo` (`20260826100000`) | PARCIAL / DIVERGENTE | Views ausentes criadas em `20260827100000`; `estrategias_elisao_catalogo` virou TABELA (`20261117000000`); `mv_benchmark_setorial` dropada (`20261118003500`) | — |
| PLANO-60 | E40 Funções (23 divergentes/14 ausentes) | PARCIAL | Recriadas em massa em `20260825110000`; `20260826110000` ausente; assinaturas vs origem NÃO VERIFICÁVEL | — |
| PLANO-60 | E42 Tipos/defaults/`search_path` (`20260826120000`) | NÃO FEITO | Ausente; nenhum `ALTER COLUMN TYPE numeric(p,s)`; drift grupo 3 aberto | — |
| PLANO-60 | E43 Renomear 323 migrations (`rename-migrations-to-ledger.mjs`, `mapa-versoes.csv`) | NÃO FEITO | Ambos ausentes; nomes mantidos (ex.: `20260518153054_*`) | Decisão do dono |
| PLANO-60 | E44 Backfill do ledger | NÃO VERIFICÁVEL SEM BANCO | `docs/agentes/auditoria-drift-banco-2026-11-17.md` reporta ledger 1034 = 1034 em 17/11; hoje 1048 arquivos | — |
| PLANO-60 | E45 Substituir migration-comentário da wave1 por DDL | NÃO FEITO | `20260825200000_plano_correcoes_100_etapas_wave1.sql` segue com 1 linha SQL (`SELECT 'WAVE1_REGISTRO|OK|'…`); `20260826030000` idem marcador | — |
| PLANO-60 | E46 Baseline squash + job `schema-from-scratch` | NÃO FEITO | Sem `20260901000000_baseline.sql`, sem `_archive/`, sem job; `scripts/db/replay-migrations.sh` existe mas nenhum workflow o chama | Decisão do dono (§6.6) |
| PLANO-60 | E47 `schema-drift.yml` com `diff.mjs` e `allowlist-drift.json` | PARCIAL | Workflow existe (semanal); usa só `PROD_DB_URL` para paridade de versões e `types.ts`; sem `SRC_DB_URL`, `diff.mjs`, allowlist | — |
| PLANO-60 | E48 Docs operacionais | PARCIAL | `scripts/README.md` sem "87/13" (FEITO); `docs/MIGRATION_CHECKLIST.md` ainda diz 356 migrations (2026-07-21); `ESTADO_ATUAL.md` 2026-08-16 | Atualizar |
| PLANO-60 | E50 Higiene na origem | NÃO VERIFICÁVEL SEM BANCO | — | — |
| PLANO-60 | E51-E55 Dados | NÃO VERIFICÁVEL SEM BANCO | — | — |
| PLANO-60 | E56 `docs/migracao/DIFF-FINAL-*.txt` | NÃO FEITO | Ausente; `diff.mjs` não versionado (`scripts/audit/` inexistente) | — |
| PLANO-60 | E57 Suíte portada para `Bun.SQL`; `test_results_v3.json` | NÃO FEITO | `supabase/tests/test_harness_v2.js` ainda usa `psql` (2 ocorrências); v3 ausente | — |
| PLANO-60 | E58 E2E contra destino | PARCIAL / NÃO VERIFICÁVEL | `playwright.config.ts`, `e2e/`, referência em `ci.yml` existem; execução contra `bwwbey…` não comprovável | — |
| PLANO-60 | E59, E60 Cutover / pós-cutover | NÃO VERIFICÁVEL SEM BANCO | — | — |

Confirmadas FEITO: E03 (`20260826010000`), E05 (ADR), E09 (`20260826050000`), E11 (`20260722193843/193917`), E13 (`scripts/mcp-phd-suite.mjs` exige `MCP_TOKEN`), E15 (106 blocos; 4 ON = `analise-preditiva`, `bitrix24-sync`, `conciliacao-ia`, `open-finance`), E23/E24 (`20260826020000`), E41 (`20261112003647` CONSTRAINT TRIGGER DEFERRABLE), E49 (`types.ts` contém `is_user_admin`, `has_any_role`, `invocar_regua_cobranca`).

**Contagem PLANO-60 (60 etapas):** FEITO 10 · PARCIAL 15 · NÃO FEITO 13 · DIVERGENTE 1 · MARCADO FEITO, NÃO ENCONTRADO 1 · NÃO VERIFICÁVEL SEM BANCO 20.

---

## 3. Checklists/estratégia: MIGRATION_CHECKLIST, STAGING_MIGRATION, DATA_MIGRATION, REMOTE_ONLY_MIGRATIONS_STRATEGY, MIGRATIONS_ADR, adr/0001

| Doc | Etapa/Item | Status | Evidência | O que falta |
|---|---|---|---|---|
| MIGRATION_CHECKLIST | "356 migrations" (pré-req e Fase 3) | DIVERGENTE | `ls supabase/migrations/*.sql \| wc -l` = 1048; doc de 2026-07-21 | Atualizar |
| MIGRATION_CHECKLIST | Pré-requisitos e Fases 1-3, 5, 7 (comandos manuais) | NÃO VERIFICÁVEL SEM BANCO | Procedimento manual | — |
| MIGRATION_CHECKLIST | Fase 4 item 17 `supabase test db` (pgTAP) | PARCIAL | `supabase/tests/sql/` tem 6 arquivos; CI roda via `psql` só `rls_multi_empresa.sql` + catálogos (`ci.yml:316-330`), condicionado a `DATABASE_URL`; nenhum `supabase test db`/`pg_prove` em workflows | — |
| MIGRATION_CHECKLIST | Fase 6 item 21 partições mensais | DIVERGENTE | Em prod `audit_logs`/`frontend_error_logs` não são particionadas (`20261113114335`); checklist assume partições | Reescrever item |
| MIGRATION_CHECKLIST | Fase 6 item 22 realtime só `performance_alerts` | DIVERGENTE | Migrations adicionam à publication também `solicitacoes_aprovacao`, `alertas`, `security_alerts`, `alertas_tributarios`, `anomalias_detectadas`, `audit_logs`, `anomalia_detection_runs`, `user_anomalia_preferences`, `transacoes_bancarias`; estado real NÃO VERIFICÁVEL | — |
| MIGRATION_CHECKLIST | Fase 8 `docs/MIGRATION_INCIDENT_YYYYMMDD.md` | NÃO FEITO | Nenhum arquivo | — |
| MIGRATION_CHECKLIST | Nota "cron jobs re-scheduling manual, fora do escopo" | DIVERGENTE | `scripts/migrate-cron-jobs.sh/.sql` existem (13 jobs) | — |
| STAGING_MIGRATION | Projeto staging provisionado + 6 secrets + vars `REQUIRED_SECRETS`/`PROD_PROJECT_REF` | NÃO VERIFICÁVEL SEM BANCO | `staging-migrate.yml:38-47` só verifica presença dos secrets em runtime | — |
| STAGING_MIGRATION | "102 Edge Functions" com bloco explícito | DIVERGENTE | 106 pastas em `supabase/functions/` e 106 blocos em `config.toml` | Atualizar número |
| STAGING_MIGRATION | Baselines em `scripts/integrity/baseline/` | PARCIAL | 4 documentados existem + `allowed-secdef-exec.json` (não documentado); `expected-crons.json` tem 1 job (`executar-regua-cobranca-diaria`) vs ≥13 crons conhecidos | Regerar baseline (precisa de DB) |
| STAGING_MIGRATION | `health` público 200 / `cnpja-lookup` 401 etc. (probes) | NÃO VERIFICÁVEL SEM BANCO | Runtime | — |
| DATA_MIGRATION | Scripts e flags (`data-migrate.sh`, `scripts/data/*`, `_migration.gc`, `--with-data`, `--no-snapshot`, `--resume`) | FEITO | `scripts/data-migrate.sh:17-18`, `scripts/data/checkpoint.sql:39`, `scripts/staging-migrate.sh:24,45` | Execução contra staging NÃO VERIFICÁVEL |
| REMOTE_ONLY | "5 migrations existem só no remoto e não devem ser recriadas" | DIVERGENTE | As 5 existem no repo: `20260826010000` (18 linhas SQL reais), `020000` (54), `030000` (marcador sem DDL), `040000` (105), `050000` (138) | Doc contradiz o repo; decidir status do marcador 030000 |
| REMOTE_ONLY | `20260827102000_guardrails_integration_secrets_mv_benchmark.sql` | MARCADO FEITO, NÃO ENCONTRADO | Não existe em `supabase/migrations/` (`ls \| grep 20260827102000` = vazio); `mv_benchmark_setorial` foi dropada em `20261118003500` | Remover referência |
| MIGRATIONS_ADR | "356 migrations", cron 7, "Alter/Drop 73/93" | DIVERGENTE | 1048 arquivos; 28 jobs nomeados em `cron.schedule` | Atualizar |
| MIGRATIONS_ADR | §4.5 logs particionados por mês | DIVERGENTE | Prod não particionado (`20261113114335`, `20261118003500`) | — |
| MIGRATIONS_ADR | §4.6 realtime só `performance_alerts` (auditado 2026-07-15) | DIVERGENTE | Ver MIGRATION_CHECKLIST item 22 | — |
| MIGRATIONS_ADR | §6 "sem DROP TABLE em produção sem ADR neste arquivo" | PARCIAL | `20261117190000` (20 tabelas) e `20261118003500` (11 tabelas + 3 views + matview) têm justificativa no cabeçalho, mas não há ADR neste arquivo | Registrar ADR |
| adr/0001 | Decisão 1 "SRC define schema/funções/policies" | DIVERGENTE (superada) | Práticas atuais reconciliam a cadeia com **produção** (`20261117000000`, `20261116220000`, `20261117190000`); `AGENTS.md` trata `bwwbey…` como oficial; ADR segue "Aceito" sem revisão | Revisar/superseder ADR |
| adr/0001 | Decisão 3 "repo é a única forma de aplicar mudanças" | PARCIAL | `20261102000000` e `20261116190000` registram DDL aplicado manualmente a posteriori | — |
| adr/0001 | Consequência "`diff.mjs SRC DST` tende a zero" | NÃO FEITO | `diff.mjs` não versionado | — |

**Contagem grupo 2 (20 itens):** FEITO 1 · PARCIAL 5 · NÃO FEITO 2 · DIVERGENTE 9 · MARCADO FEITO, NÃO ENCONTRADO 1 · NÃO VERIFICÁVEL SEM BANCO 4 (itens não listados = conformes).

---

## 4. DB_HEALTH, DIAGRAMA_ER, RLS_MATRIZ_NEGATIVA, SECURITY_DEFINER_ATTESTATION

| Doc | Etapa/Item | Status | Evidência | O que falta |
|---|---|---|---|---|
| DB_HEALTH | Queries 1-6 (FK sem índice, índices sem uso, views sem security_invoker, RLS sem policy, ledger, cron falhas) | NÃO VERIFICÁVEL SEM BANCO | Requerem `SELECT` em prod | — |
| DB_HEALTH | Query 5 texto "1034 arquivos" | DIVERGENTE | 1048 | Atualizar |
| DB_HEALTH | Query 7 — 21 candidatos sem guard precisam de justificativa escrita | NÃO FEITO | Nenhum doc lista os 21 com justificativa (`docs/SECURITY.md` não cita) | Doc de exceções (= etapa 20 do PLANO-100) |
| DB_HEALTH | Meta "Migrations aplicadas 573+" | DIVERGENTE | 1048 arquivos | — |
| DB_HEALTH | "Semanalmente… automatizado via cron + monitor-health" | PARCIAL | `supabase/functions/monitor-health` + job `monitor-health-check` (`20261101200000`) existem; não há evidência de que executem as 7 queries deste doc | — |
| DIAGRAMA_ER | 18 entidades centrais | FEITO | Todas com `CREATE TABLE` e sem DROP posterior (`empresas` 20260518180000 … `nfe_recebidas` 20260722193652) | — |
| DIAGRAMA_ER | Lista de GAPs cita `configuracoes_receber` | DIVERGENTE | Tabela dropada em `20261117190000_drop_tabelas_residuo_lovable.sql` (nunca existiu em prod) | Remover da lista |
| DIAGRAMA_ER | GAPs P1 de isolamento (≈35 tabelas) | NÃO FEITO | Policies permissivas seguem sem DROP (ver RLS abaixo) | Migrations de RLS |
| RLS_MATRIZ | GAPs P1/P2 "nunca derrubadas" | NÃO FEITO (confirmado) | `ult_drop = -` para `Users can view own contas_pagar/receber` (002), `…transferencias` (20260518190805), `…vendedores` (20260518190901), `…retencoes` (20260518191044), `Permitir acesso total whatsapp_conversas/historico_cobranca_whatsapp` (20260519134138), `…resumos_executivos_semanais` (20260519134259), `Empresa access for faturamento/folha` (20260519131458), `…contratos/metas/partidas` (20260518190304), `Empresa access for payment methods/duplicate rules/routing` (20260519131227), `Users can view logs` (20260508115859), `Empresa access for apuracoes` (20260519131632), `…regimes` (20260518190805), `…tax alerts` (20260518190951), `Users can manage acoes_recomendadas` (20260518190901); owner-sem-tenant recriadas e vivas em `20260825230000`: `Owner manage acordos/execucoes/boletos/alertas/sessoes`, `hap_user_insert`, `fornecedores_owner_select`, `conciliacoes_owner_all`, `concil_parciais_owner_all` | Correção de RLS (P1) |
| RLS_MATRIZ | `anexos_financeiros`: "`Auth users can read anexos_financeiros` segue ativa" e GAP bucket `financeiro` | DIVERGENTE (doc atrasado) | `20261013120000:188-191` dropa as 4 policies legadas e `:152-167` reescreve as de storage por empresa | Reavaliar linha e, se fechado, atualizar doc |
| RLS_MATRIZ | Tabelas citadas `known_devices`, `account_lockouts`, `audit_log`, `conciliacao_sugestoes`, `contatos_financeiros` | DIVERGENTE | Dropadas em `20261117190000` (nunca existiram em prod) | Remover da matriz |
| RLS_MATRIZ | E2E da matriz contra staging ("melhoria pendente") | NÃO FEITO | Só `supabase/tests/sql/rls_multi_empresa.sql` (ci.yml:323, condicional) e `scripts/security/test-tenant-isolation.sql`/`test-write-isolation.sql` (fluxo staging); testes citados `auth-guard_test.ts`, `asaas-proxy/index.test.ts` existem | Teste cruzado completo |
| SECDEF | "72 funções auditadas em 2026-07-16" | DIVERGENTE | `20260825110000` recriou dezenas de SECDEF; funções novas (`gate_25…35`, `empresa_membro_ativo`, `is_user_locked` 20260903001300, `invocar_regua_cobranca`, `claim_frontend_error_alerts`, `watch_cron_failures`, …) não constam | Reauditar e atualizar (regra "linha no mesmo PR" não cumprida) |
| SECDEF | `get_active_uapi_token()` (§9) | DIVERGENTE | Tabela `lalamove_uapi_sessions` dropada em `20260824124500` (ADR-001); a função foi recriada em `20260825110000` referenciando tabela inexistente | Dropar função (ADR-001) ou documentar |
| SECDEF | "apenas 1 função exposta a anon" | PARCIAL | `20260903001100` concedeu anon em `get_lockout_details`, `20260903001200` revogou; estado atual NÃO VERIFICÁVEL SEM BANCO; fonte viva passou a ser `scripts/integrity/baseline/allowed-secdef-exec.json` | Alinhar doc à allowlist |
| SECDEF | Checklist "testes pgTAP cobrem RBAC e overloads" | PARCIAL | `supabase/tests/sql/overloads.test.sql` existe; não há teste nominal de `has_role`/`has_permission` em `supabase/tests/sql/` | — |
| SECDEF | Demais 60+ funções listadas | FEITO (repo) | Todas com `CREATE OR REPLACE FUNCTION` e sem DROP posterior ao último CREATE (ex.: `has_role` 20260825110000, `processar_regua_cobranca` 20261117010000, `reprocess_dlq` 20261117053000) | Privilégios reais NÃO VERIFICÁVEL SEM BANCO |

**Contagem grupo 3 (18 itens):** FEITO 2 · PARCIAL 4 · NÃO FEITO 4 · DIVERGENTE 7 · NÃO VERIFICÁVEL SEM BANCO 1.

---

## 5. docs/agentes/auditoria-drift-banco-2026-11-17.md e replay-migrations-2026-11-17.md

| Doc | Etapa/Item | Status | Evidência | O que falta |
|---|---|---|---|---|
| drift-17/11 | Ordem 1 — colunas do grupo 2 que o código grava (PR #440) | FEITO | `20261117193000_colunas_nunca_aplicadas.sql` (cabeçalho cita este doc; `semana_inicio` UNIQUE); `saved_filter_subscriptions` em `20261117223000`; `clientes.bitrix_id` em `20261117211000`; `sso_login_attempts.state` em `20261117201000` | — |
| drift-17/11 | Nomes errados (PR #441): `payment_id`→`asaas_payment_id`, `transacoes_bancarias.empresa_id`, `empresas.ativa` | PARCIAL | `asaas-webhook/index.ts:125-128` usa `asaas_payment_id` (FEITO); `analise-preditiva/index.ts:70`, `executar-fechamento-tributario/index.ts:164` comentam a ausência de `empresa_id` (FEITO); `empresas.ativa`: `src/components/empresa/EmpresaActionPicker.tsx:53` ainda tem `ativa: true` (NÃO VERIFICADO se é filtro de DB ou prop) | Confirmar `ativa` |
| drift-17/11 | Ordem 2 — versionar 272 colunas só em prod | PARCIAL | `20261116220000_reconcilia_17_colunas…` (17 colunas) + `20261116190000`; restam ~255 sem migration (NÃO VERIFICÁVEL SEM BANCO o número exato) | Migration(s) aditivas |
| drift-17/11 | Ordem 3 — alinhar tipos (38 tabelas) | NÃO FEITO | Nenhum `ALTER COLUMN … TYPE` após 17/11 exceto `20261117223000` (saved_filter_subscriptions) | Decisão caso a caso |
| drift-17/11 | "1034 migrations no ledger = 1034" | NÃO VERIFICÁVEL SEM BANCO | Hoje 1048 arquivos; as 14 novas (`20261117190000`…`20261118003500`) não comprováveis no ledger | — |
| replay-17/11 | 20 tabelas-resíduo | FEITO | `20261117190000_drop_tabelas_residuo_lovable.sql` (+4 funções e 1 trigger) | — |
| replay-17/11 | Partições órfãs de `frontend_error_logs` em prod | NÃO FEITO | `20261118003500` cobre só `audit_logs_*` e declara "Não toca: frontend_error_logs_2026_* / _default" | Migration análoga (decisão do dono) |
| replay-17/11 | Gate de CI que roda o replay em cada PR | NÃO FEITO | `grep -l replay-migrations .github/workflows/*.yml` = vazio | Workflow (§6.6 dono) |
| replay-17/11 | Estratégia do histórico (repair vs squash) | NÃO FEITO | Sem `_archive/`, sem baseline; decisão do dono pendente | — |
| replay-17/11 | Limite de preview branches Supabase | NÃO VERIFICÁVEL SEM BANCO | Configuração da conta | — |
| replay-17/11 | Delta funções 492/212, policies 861/615, índices 1160/686 | NÃO VERIFICÁVEL SEM BANCO | Só 20 tabelas foram tratadas; nenhuma migration pós-17/11 remove funções/policies/índices em massa | — |

**Contagem grupo 4 (11 itens):** FEITO 2 · PARCIAL 2 · NÃO FEITO 4 · NÃO VERIFICÁVEL SEM BANCO 3.

---

## 6. docs/ADR-002-FUNCOES-ESSENCIAIS-PROMO-FINANCE.md — 11 funções

Critério: existe `CREATE OR REPLACE FUNCTION` em migration e nenhum `DROP` posterior sem recriação; consumidor = trigger/cron/RPC/frontend/edge (grep em `supabase/migrations`, `src/`, `supabase/functions/`, `scripts/migrate-cron-jobs.sql`).

| Doc | Função | Status | Evidência | O que falta |
|---|---|---|---|---|
| ADR-002 | `check_integrity_invariants()` | FEITO | Último CREATE `20260825130000` (DROP só em `20260824124500`, anterior); consumidor `run_integrity_cycle()` (`20260728122339:247`) + cron `integrity-invariants-hourly` | — |
| ADR-002 | `capture_index_usage_snapshot()` | PARCIAL | CREATE `20260831153000`; cron `capture-index-usage-daily` aparece em 1 migration; sem RPC/front/edge | Confirmar job ativo (NÃO VERIFICÁVEL SEM BANCO) |
| ADR-002 | `frontend_error_logs_sanitize()` | FEITO | Trigger `trg_frontend_error_logs_sanitize BEFORE INSERT ON frontend_error_logs` (`20260825110000`) | Em prod a tabela é flat — trigger vale igual |
| ADR-002 | `gerar_alertas_vencimento()` | FEITO | CREATE `20260903000800`; edge `gerar-alertas/index.ts:59` (`rpc`) + cron `gerar-alertas-vencimento-diario` | — |
| ADR-002 | `gerar_contas_recorrentes()` | FEITO | CREATE `20260825110000`; `src/hooks/usePagamentosRecorrentes.ts:188` + cron `gerar-contas-recorrentes-diario` | — |
| ADR-002 | `get_cobertura_fiscal_uf()` | FEITO | CREATE `20260825110000`; 1 consumidor em `src/` | — |
| ADR-002 | `get_ultima_carga_fiscal()` | FEITO | CREATE `20260825110000`; 1 consumidor em `src/` | — |
| ADR-002 | `provisionar_usuario_atual()` | PARCIAL | CREATE `20260825110000` + GRANT; **0 consumidores** em `src/`, `supabase/functions/`, triggers ou cron | Ligar ao fluxo de onboarding ou registrar como RPC reservado |
| ADR-002 | `set_empresa_id_from_profile()` | FEITO | Triggers `trg_alertas_set_empresa`, `trg_solicitacoes_lgpd_set_empresa` (`20260825110000`) | — |
| ADR-002 | `sync_regime_tributario_empresa()` | FEITO | Trigger `trg_sync_regime_empresa AFTER INSERT OR UPDATE ON regimes_tributarios` (`20260825110000`) | — |
| ADR-002 | `trigger_bitrix24_sync()` | PARCIAL | CREATE `20260825110000` (DROP anterior em `20260824124500`); **0 triggers** a invocam, 0 cron, 0 código; única citação fora de DDL: `20260711182305:14` (lista de nomes) e `REVOKE` em `20260826050000:129` | Função órfã — ligar trigger ou novo ADR |

**Contagem ADR-002 (11 funções):** FEITO 8 · PARCIAL 3 · NÃO FEITO 0.

---

## Resumo das contagens

| Documento | Itens | FEITO | PARCIAL | NÃO FEITO | DIVERGENTE | MARCADO FEITO, NÃO ENCONTRADO | NÃO VERIFICÁVEL SEM BANCO |
|---|---|---|---|---|---|---|---|
| PLANO-CORRECOES-100-ETAPAS | 100 | 23 | 31 | 15 | 4 | 0 | 27 |
| PLANO-CORRECAO-60-ETAPAS | 60 | 10 | 15 | 13 | 1 | 1 | 20 |
| Checklists/estratégia (6 docs) | 20 | 1 | 5 | 2 | 9 | 1 | 4 |
| DB_HEALTH/ER/RLS/SECDEF | 18 | 2 | 4 | 4 | 7 | 0 | 1 |
| Drift + replay 17/11 | 11 | 2 | 2 | 4 | 0 | 0 | 3 |
| ADR-002 (11 funções) | 11 | 8 | 3 | 0 | 0 | 0 | 0 |

Padrões transversais: (1) os dois planos de ago/2026 pressupõem a origem Lovable como fonte de schema; desde nov/2026 a cadeia é reconciliada com produção (`20261116*`, `20261117*`), invertendo decisões (catálogo de elisão, partições, `partidas_contabeis_tipo_check`, matview) sem ADR que supersedesse `adr/0001`; (2) três migrations são marcadores sem DDL (`20260825200000`, `20260826030000`; `20260827102000` nem existe); (3) nenhum workflow roda `scripts/db/replay-migrations.sh`, `gate_*` ou um diff estrutural — a detecção de drift depende de `PROD_DB_URL`/`DATABASE_URL` opcionais; (4) ~25 policies permissivas listadas na matriz RLS continuam sem DROP em nenhuma migration.

---

## Anexo — A9 — Auditoria dos planos ARQUIVADOS (docs/archive + raiz)

HEAD auditado: `a406e993` (= `origin/main`, 2026-11-20). Somente leitura.

**Limites desta verificação**
- Estado vivo do banco `bwwbeyolnnzppeuhgkcd` NÃO verificado: o MCP oficial não está carregado nesta sessão. Tudo que é "aplicado em produção", cron ativo, ledger, grants/policies vivas = `NÃO VERIFICÁVEL`. O que está marcado FEITO abaixo para banco significa "existe migration versionada no repo".
- Clone raso (50 commits): PRs conferidas por `gh api repos/adm01-debug/Promo_Finance_V2/pulls/N` (estado/merged_at). Branch protection: API devolve 403 → não verificável.
- `node_modules` ausente: `lint:strict`, `type-check` e `format:check` não executados.
- Status usados: `FEITO` · `PARCIAL` · `NÃO FEITO` · `MARCADO FEITO, NÃO ENCONTRADO` · `NÃO VERIFICÁVEL` (fora do repo). Só pendentes/parciais/divergentes nas tabelas; FEITO entra só na contagem.

---

## 1. docs/archive/AUDITORIA_EXAUSTIVA_PLANO_100_ETAPAS_2026-08-26.md (100 etapas)

| Doc | Etapa/Item | Status | Evidência | O que falta |
|---|---|---|---|---|
| P100-arch | 001 Baseline auditável | PARCIAL | `scripts/inventario/{gerar-banco,gerar-repo,gerar-rotas}.mjs`; workflows `inventario-estado.yml`, `estado-real.yml` | `docs/execucao-cline/BASELINE_<data>.md` não existe |
| P100-arch | 002 Matriz de severidade | PARCIAL | `docs/execucao-cline/MATRIZ_DECISOES.md` existe | Matriz P0–P3 por achado com classificação (vuln/perda/drift/falso positivo) não existe |
| P100-arch | 008 Painel de prontidão | PARCIAL | `docs/prod-readiness.md` (PR #324 merged 2026-11-13) | Estados codificado/testado/implantado/tráfego/aceito por módulo não conferidos |
| P100-arch | 010, 011, 012, 013, 016, 019, 020 (contenção em runtime, origem Lovable, catálogo live, ledger, diff tripartido, decisão de baseline) | NÃO VERIFICÁVEL | Dependem de acesso ao banco/origem e decisão do dono | — |
| P100-arch | 014 Genealogia das migrations | PARCIAL | `.github/workflows/migration-ledger.yml` compara `schema_migrations` × arquivos locais | `docs/execucao-cline/GENEALOGIA_MIGRATIONS.md` não existe |
| P100-arch | 015 Internalizar 6 migrations destino-only | FEITO | `ls supabase/migrations` → 20260826010000/020000/030000/040000/050000 e 20260827090000 existem | — |
| P100-arch | 017 Classificar `sql/` e `db/functions/` | PARCIAL | `sql/` movido para `docs/archive/sql` (README do archive: "substituídos por supabase/tests/sql"); `db/functions/{README.md,observability,retention}` permanece | Classificação formal de `db/functions/` (oficial/biblioteca/legado) |
| P100-arch | 022 6 tabelas só no destino | NÃO VERIFICÁVEL | `estrategias_elisao_catalogo` tem migration `20260417155857` (CREATE + policies); partições só no banco | Owner/retenção das partições `audit_logs_2026_01`, `frontend_error_logs_2026_0X` |
| P100-arch | 025 Validar `faixas_simples_reparticao_soma_chk` | NÃO FEITO | `supabase/migrations/20260825250000_recreate_6_constraints.sql:47-49` recria `NOT VALID` ("14 linhas legacy inválidas"); nenhum `VALIDATE CONSTRAINT` posterior (o único, `20260728124719:56`, é anterior) | Limpar as 14 linhas e `VALIDATE` |
| P100-arch | 026 Auditar 852 índices | PARCIAL | `20261101140000_drop_idle_indexes.sql`, `20261117204500_indices_financeiros_ausentes.sql`, `20261117225000_indices_recuperados_da_445.sql` | Relatório versionado com workload/plano por índice |
| P100-arch | 029 Reduzir `GRANT ALL`/`TRUNCATE` de `authenticated` | NÃO FEITO | `grep -rlE "REVOKE (ALL\|TRUNCATE).*FROM authenticated" supabase/migrations` → só `20261116180000_refresh_mv_benchmark_grants_excecao_estreita.sql` (exceção pontual) | Migration de mínimo privilégio nas ~284 relações |
| P100-arch | 030 Sanear privilégios anônimos | PARCIAL | `20260827101000_hardening_views_pii_rpcs.sql:12` revoga `gerar_numero_acordo()` de anon; `20260728204937:26` mantém `GRANT INSERT ON frontend_error_logs TO anon` (by design) | Grants das sequences `driver_locations_id_seq`/`rpc_observability_metrics_id_seq` não tratados em migration |
| P100-arch | 031 Catálogo das 180 rotinas | NÃO FEITO | Nenhum artefato em `docs/` ou `docs/execucao-cline/` | Catálogo assinatura/owner/grants/callers |
| P100-arch | 033 Desambiguar 7 overloads | PARCIAL | `AUDITORIA_BACKEND_SENIOR` #44 consolidou `registrar_evento_receber`→`registrar_evento_cobranca` (4 migrations) | `get_performance_alerts`, `watch_cron_failures`, `purge_old_rows`, `resolve_integrity_alert`, `close/escalate_stale_integrity_alerts` sem teste de contrato versionado |
| P100-arch | 034 Endurecer 149 `SECURITY DEFINER` | PARCIAL | `grep has_any_role ... search_path` em migrations → 0 | `has_any_role`/`empresa_membro_ativo` com `pg_catalog` explícito; checklist |
| P100-arch | 035 Mínimo privilégio de EXECUTE | PARCIAL | `20260826050000_revoke_execute_authenticated_e09.sql` existe; `gerar_numero_acordo` revogado | Catálogo "cada EXECUTE tem consumidor" |
| P100-arch | 036 Triggers duplicados `organizacao_membros` | NÃO FEITO | `grep -rn trg_organizacao_membros_updated_at supabase/migrations` → 0 (objeto só vive no banco); só `trg_org_membros_updated_at` versionado | Migration `DROP TRIGGER IF EXISTS trg_organizacao_membros_updated_at` |
| P100-arch | 037 Validar 158 triggers | NÃO FEITO | Sem catálogo | — |
| P100-arch | 038 Certificar views/matview | PARCIAL | `security_invoker` nas 14 views em migrations (`grep` por view → ≥1 cada) | Teste com dados representativos não versionado |
| P100-arch | 039/040 Revalidar 22 jobs / reconciliar cron | PARCIAL | `20260913160000_mv_perf_weekly_unique_idx.sql`; `20261031180000_cron_step43_espacar_diagnosticos.sql` | Execução/schedule vivos NÃO VERIFICÁVEIS |
| P100-arch | 047 Auth e custo das funções de IA | PARCIAL | `exigirUsuario`+`checkRateLimit` em `expert-agent:121,131`, `analyze-document:24,34`, `conciliacao-ia:104,114`; 19 funções com `checkRateLimit` | Cota/orçamento por empresa, timeout/cancelamento, auditoria de custo |
| P100-arch | 048 Classificar funções sem JWT | PARCIAL | `supabase/config.toml`: 52 `verify_jwt = false`; `docs/execucao-cline/MATRIZ_AUTH_EDGE.md` existe; `gerar-alertas-tributarios:72` `exigirChamadaInterna`; `validate-ip-geo:12` público + rate limit | `gerar-pdf-tributario` só lê `Authorization` manualmente (:43) sem guard compartilhado; teste negativo automatizado por exceção |
| P100-arch | 049 / 073 / 074 Qualidade Edge no CI | PARCIAL | `.github/workflows/deno-tests.yml:55-86` lista fixa de 15 arquivos é só do `deno lint`/check; `deno test` roda `supabase/functions/` inteiro (`:124-129`, 64 arquivos, inclui `contract-coverage_test.ts`); sem `\|\| true` (FEITO esse ponto) | Falta `deno coverage` com piso como gate |
| P100-arch | 050, 091–100 (canário, staging, rollout, tráfego real, aceite) | NÃO VERIFICÁVEL | Fora do repo | — |
| P100-arch | 051 Certificar 129 rotas | PARCIAL | `scripts/inventario/gerar-rotas.mjs`; órfãs roteadas (`src/routes/adminRoutes.tsx:86`, `tributarioRoutes.tsx:51`) | Matriz rota×permissão×estado vazio/erro×teste |
| P100-arch | 056 Persistir histórico WhatsApp proativo | FEITO | `supabase/functions/whatsapp-ia-proativo/index.ts:690-691` insere em `historico_cobranca_whatsapp` | — |
| P100-arch | 058 Isolar/concluir NF-e | PARCIAL | `src/components/nfe/NovaNFeForm.tsx` sem `Math.random`; `CancelamentoNFe.tsx:70` e `InutilizacaoNFe.tsx:74-75` não transmitem (comentário explícito); `src/lib/sefaz-simulator/` ainda existe (só tipos importados) | Emissão real: não há edge function de emissão/autorização (só `sefaz-manifestar`, `sefaz-dfe-*`, `nfe-*`); decisão de produto (Etapa 24 do P50) |
| P100-arch | 060 Prefetch / hooks ambíguos | NÃO FEITO | `src/hooks/usePrefetchRoutes.ts` e `usePrefetchRoutes.tsx` coexistem (`ls src/hooks \| uniq -d` → `usePrefetchRoutes`) | Remover duplicata |
| P100-arch | 061 Elisão atômica | PARCIAL | `src/hooks/useOportunidadesElisao.ts:159-172`: insert antes do delete, erros propagados, delete revalida `status='identificada'` | Sem RPC/transação única (janela com duplicatas se o delete falhar) |
| P100-arch | 064 / 066 Sucesso falso em `useConciliacaoAudit` / escritas secundárias | PARCIAL | `src/hooks/useConciliacaoAudit.ts:31-39`: falha ao inserir alerta só `console.error` | Modelar conclusão parcial/toast condicional |
| P100-arch | 065 36 TODOs de schema | PARCIAL | `grep -rn 2026-08-14 src` → 2: `src/hooks/useOrganizacoes.ts:259`, `src/hooks/useBulkActions.ts:266` | Resolver os 2 |
| P100-arch | 067 198 awaits sem `error` | NÃO VERIFICÁVEL | Heurística não reproduzida nesta sessão | — |
| P100-arch | 068 Supressões | PARCIAL | `@ts-nocheck` → 0; `TODO/FIXME/HACK` → 3; `eslint-disable` → **78** (era 36) | eslint-disable cresceu; triar |
| P100-arch | 069 Objetos sem consumidor | NÃO FEITO | Sem lista de decisão versionada | — |
| P100-arch | 070 Invariantes dos fluxos centrais | PARCIAL | `e2e/__tests__/regua-cobranca.e2e.ts`, `supabase/functions/asaas-proxy/index.test.ts` | Concorrência/falha parcial para elisão, convite, conciliação |
| P100-arch | 071 Cobertura declarada × exigida | PARCIAL | `vitest.config.ts:63-66` lines 66/functions 58/branches 59/statements 65; `docs/TESTING.md:29` "Unit: 80%" | Alinhar doc ao gate real |
| P100-arch | 072 Escopo TypeScript | PARCIAL | `tsconfig.json:24 strict:true`; `type-check:e2e` (`package.json:30`); ratchet `scripts/ci/typecheck-strict-baseline.sh` com baseline vazio | `tsconfig.app.json:25 strict:false` (build Vite) |
| P100-arch | 076 `lint:strict` como gate | PARCIAL | `.github/workflows/ci.yml:296` roda `bun run lint` (não `lint:strict`) | Promover a gate; resultado atual NÃO VERIFICADO (sem node_modules) |
| P100-arch | 077 Formatação | PARCIAL | `ci.yml:289` `prettier --check` só nos arquivos alterados | `format:check` global não é gate |
| P100-arch | 078 Playwright local × CI | PARCIAL | `playwright.config.ts` declara firefox/webkit/Mobile; `ci.yml:558,609,654,709` só `--project=chromium`; `grep -c "test.skip" e2e` → 10 | Rodar projetos declarados ou reduzir promessa |
| P100-arch | 080 Fixar ferramentas/deps | PARCIAL | `.bun-version` usado nos workflows; `bun audit` com `--ignore` documentado (`ci.yml:156-228`); front `@supabase/supabase-js@2.87.1` (bun.lock:544) × Edge `npm:@supabase/supabase-js@2.49.4` em **98** arquivos | Alinhar supabase-js nas Edge |
| P100-arch | 081 Orçamento de bundle | NÃO FEITO | Só `chunkSizeWarningLimit: 1200` (`vite.config.ts:127`); sem size-limit/comparação por PR | Gate de bundle |
| P100-arch | 083 Reduzir arquivos grandes | NÃO FEITO | `asaas-proxy/index.ts` > 1.400 linhas | Decomposição por risco |
| P100-arch | 084 Mapa Graphify atualizado | PARCIAL | `graphify-out/GRAPH_REPORT.md:13` "Built from commit `79cb9a2a`" × HEAD `a406e993` | `graphify update .` (auto-sync N8N) |
| P100-arch | 085 Baseline de observabilidade | PARCIAL | `monitor-health` + `20261101200000_monitor_health_cron.sql`; `docs/DB_HEALTH.md`; `_shared/sentry.ts` | SLOs formais/runbook por fluxo P0/P1 |
| P100-arch | 086 Documentação obsoleta | NÃO FEITO | `docs/EDGE_FUNCTIONS_CATALOG.md:3` "Auto-gerado em 2026-07-17. Total: 87 funções" (real: 106); `CHANGELOG.md` última versão `[1.0.0] - 2025-01-15`; `CONTRIBUTING.md:78` `npm install`; `docs/ARCHITECTURE.md:42` cita `src/services` (inexistente) e `:40` `orquestrador-elisao.ts` (inexistente); `docs/TESTING.md:29` 80% | Regenerar/corrigir os 5 |
| P100-arch | 089 Artefatos paralelos | PARCIAL | `supabase/tests/test_results.json` e `test_results_v2.json` ainda versionados; `sql/` arquivado; `db/functions/` mantido | Decisão sobre `test_results*.json` |
| P100-arch | 090 Matriz de higiene | PARCIAL | `docs/execucao-cline/CANDIDATOS_HIGIENE.md` não existe | — |

**Contagem P100-archive (100):** FEITO 36 · PARCIAL 33 · NÃO FEITO 10 · NÃO VERIFICÁVEL 21.
FEITO (não listados): 003, 004, 005, 006, 007, 009, 015, 018, 021, 023, 024, 027, 028, 032, 041, 042, 043, 044, 045 (sem caller nem promessa: `grep webhook-financeiro src` → 0), 046, 052, 053, 054 (`sidebarNavState.test.ts:5` cobre hash), 055, 056, 057, 059, 062, 063, 075, 079, 082, 087, 088.

---

## 2. docs/archive/HANDOFF_CLINE_EXECUCAO_PENDENCIAS_PLANO_100_ETAPAS_2026-08-30.md

Status das 100 etapas = tabela da seção 1. Itens próprios do handoff:

| Doc | Etapa/Item | Status | Evidência | O que falta |
|---|---|---|---|---|
| HANDOFF | §5 contagens de partida (7 `@ts-nocheck`, 36 `eslint-disable`, 3 lockfiles, 103 funções/99 sem JWT) | PARCIAL | `@ts-nocheck` 0; `eslint-disable` 78; 1 lockfile (`bun.lock`); 106 funções, 52 `verify_jwt=false` / 54 `true` | eslint-disable dobrou |
| HANDOFF | §9 P0 `migrate-helper` | FEITO | `ls supabase/functions/migrate-helper` → ausente; `grep -rn migrate-helper supabase/config.toml` → 0 | — |
| HANDOFF | §10.4 funções com service role sem guard: `comparar-benchmark-setorial`, `detectar-anomalias-financeiras`, `gerar-alertas-tributarios`, `prever-carga-tributaria`, `validate-ip-geo` | FEITO / PARCIAL | guards: 2, 3, 1 (`exigirChamadaInterna:72`), 2, 0 (`validate-ip-geo:12` "público, pré-login" + `checkRateLimit`) | `validate-ip-geo` só documentado em comentário |
| HANDOFF | §10.5 `enviar-convite-organizacao` sucesso simulado | PARCIAL | `supabase/functions/enviar-convite-organizacao/index.ts:167` "Modo simulado: não falha o fluxo" | Decidir fail-closed quando provedor ausente |
| HANDOFF | §10.5 `enviar-alerta-email` modo simulado | PARCIAL | `index.ts:52-67` sem `RESEND_API_KEY` responde `simulated: true` | Idem |
| HANDOFF | §10.5 `copilot-global` stream simulado | NÃO FEITO | `supabase/functions/copilot-global/index.ts:286` "stream simulado em uma única mensagem" | Stream real ou UI honesta |
| HANDOFF | §10.5 NF-e simulada | PARCIAL | ver P100 058 | — |
| HANDOFF | §10.5 benchmarking simulado no frontend | NÃO ENCONTRADO | `grep -rnE "simul\|mock" src/pages/tributario/Benchmarking*.tsx src/hooks/useBenchmark*.ts` → 0 | Considerar FEITO/removido |
| HANDOFF | §10.5 `useBudget` sem consumidor | FEITO | `src/hooks/useBudget.ts:29` `from('budgets')`; consumidores `AlertasOrcamento.tsx`, `pages/Orcamentos.tsx` | — |
| HANDOFF | §10.5 recibo PER/DCOMP simulado | FEITO | `src/hooks/usePerDcomp.ts:144` comentário: não atribui recibo aleatório | — |
| HANDOFF | §10.5 Compras mock | FEITO | `grep mock src/pages/Compras.tsx` → 0 | — |
| HANDOFF | §14 artefatos exigidos (9) | PARCIAL | `docs/execucao-cline/` tem só `INDICE.md`, `MATRIZ_AUTH_EDGE.md`, `MATRIZ_DECISOES.md` | Faltam BASELINE, MATRIZ_DIVERGENCIAS_BD, GENEALOGIA_MIGRATIONS, CANDIDATOS_HIGIENE, RELATORIO_LOTE_*, RELATORIO_FINAL |
| HANDOFF | §16 decisões (api-keys/webhook-financeiro, NF-e, useBudget, órfãs, lockfile, Dyad, sql/, policies públicas, custo IA, staging) | PARCIAL | Resolvidas: api-keys (função existe), useBudget, órfãs, lockfile, Dyad, `sql/`; `docs/execucao-cline/MATRIZ_DECISOES.md` | Abertas: NF-e (homologação × demo), custo IA, staging homologado |

**Contagem HANDOFF (itens próprios, 13):** FEITO 5 · PARCIAL 6 · NÃO FEITO 1 · NÃO ENCONTRADO 1. (100 etapas: ver seção 1.)

---

## 3. docs/archive/PLANO_CORRECAO_MELHORIAS_50_ETAPAS.md (50 etapas, 2026-08-24)

| Doc | Etapa/Item | Status | Evidência | O que falta |
|---|---|---|---|---|
| P50-arch | 04 Cadeia de migrations reproduzível | PARCIAL | `20260421144212:43,50` guardas; PR #131 (shims Preview) merged 2026-11-11 | Replay em banco vazio NÃO VERIFICÁVEL |
| P50-arch | 05 Inventários/docs canônicos | NÃO FEITO | ver P100 086 | — |
| P50-arch | 06, 14, 15, 26, 30, 36, 37, 38, 46, 47, 48, 49, 50 (staging, automações vivas, E2E histórico, integrações ponta a ponta, homologação, rollback, produção) | NÃO VERIFICÁVEL | Fora do repo | — |
| P50-arch | 07–11 (46 tabelas, 15 RPCs, 3 views, 4 buckets, `pg_net`) | FEITO em repo | Todas as 33 tabelas com `CREATE TABLE` em migrations; 15 RPCs com `CREATE FUNCTION` (3–6 migrations cada); `vw_edge_health` 4 mig, `vw_auditoria_tributaria_recente` 4, `vw_transferencias_painel` 8; buckets referenciados 4–8× cada; `CREATE EXTENSION pg_net` 4× | Estado vivo NÃO VERIFICÁVEL |
| P50-arch | 12 16 cron jobs com decisão | PARCIAL | Migrations com `cron.schedule`/`unschedule`; sem catálogo nome/owner/timeout/retry | Catálogo |
| P50-arch | 13 Régua ponta a ponta | PARCIAL | RPC `processar_fila_cobrancas` usada (`processar-fila-cobrancas/index.ts:31`); `e2e/__tests__/regua-cobranca.e2e.ts` | Execução real/DLQ monitorada NÃO VERIFICÁVEL |
| P50-arch | 16 `orquestrador-elisao` | NÃO FEITO | `ls supabase/functions/orquestrador-elisao` → ausente; `docs/ARCHITECTURE.md:40` ainda cita | Implementar ou remover da doc |
| P50-arch | 17 `importar-xml-nfe` | PARCIAL | Função ausente; existe `src/hooks/useImportacaoXMLNFe.ts` (importação no cliente) | Validação de assinatura/schema no backend |
| P50-arch | 18 `exportar-sped` | PARCIAL | Existem `exportar-sped-contribuicoes`, `gerar-sped-ecd`, `gerar-sped-ecf` | Nome planejado não existe; homologação contábil NÃO VERIFICÁVEL |
| P50-arch | 19 `previsao-tributaria-ia` | PARCIAL | Existe `prever-carga-tributaria` (guards=2) | Dataset de avaliação/explicabilidade |
| P50-arch | 21–22 `webauthn-register`/`webauthn-verify` | NÃO FEITO | Funções ausentes; `grep -rli webauthn src` → 10 arquivos (UI/hook sem backend) | Backend WebAuthn |
| P50-arch | 23 Retirar NF-e simulada | PARCIAL | ver P100 058 | Rótulo/flag na UI |
| P50-arch | 24 Decidir destino NF-e | NÃO FEITO | Nenhum ADR em `docs/` (5 ADRs: nenhum sobre NF-e) | ADR |
| P50-arch | 25 Open Finance simulado | NÃO FEITO | `supabase/functions/open-finance/index.ts:31` "(sandbox)", `:245` "return a simulated list of major Brazilian banks" | Integração real ou isolamento |
| P50-arch | 27 Skips condicionais E2E | PARCIAL | `grep -rn "test.skip\|skip(" e2e` → 10 | Separar anônimo/autenticado/integração |
| P50-arch | 28 Gates de banco no CI | NÃO FEITO | `ci.yml:313,328,347,408,415` `if: db_url_preflight.outputs.available == 'true'`; `:362-371` sem secret só grava "inconclusivo" no summary — job passa | `exit 1` quando ausente (igual E-026/P50-root 38) |
| P50-arch | 29 Cobertura 85% | PARCIAL | `vitest.config.ts:63-66` 66/58/59/65 | Elevar por ondas |
| P50-arch | 33 TODOs de schema | PARCIAL | 2 restantes (ver P100 065) | — |
| P50-arch | 34 Isolamento multiempresa toda superfície | PARCIAL | `supabase/tests/sql/rls_multi_empresa.sql:66-76` detecta `has_role` sem `empresa_id`; gate condicional ao secret | Storage/Realtime/caches; gate obrigatório |
| P50-arch | 35 CSP enforce sem `unsafe-eval` | PARCIAL | `vercel.json:39-40` header `Content-Security-Policy` (enforce) com `'unsafe-inline' 'unsafe-eval'` | Remover `unsafe-eval` |
| P50-arch | 39 Filas/retries/DLQ padronizados | PARCIAL | `_shared/webhook-idempotency.ts`, `_shared/resilience.ts` usado em 9 funções | Padrão único em todos os provedores |
| P50-arch | 41 Baseline de bundle | NÃO FEITO | ver P100 081 | — |
| P50-arch | 43 Índices com telemetria | PARCIAL | ver P100 026 | — |
| P50-arch | 44 SRE Command Center operacional | PARCIAL | RPCs `toggle_cron_job`/`delete_cron_job` em 4 migrations | E2E admin/non-admin NÃO VERIFICÁVEL |
| P50-arch | 45 SLOs/alertas/runbooks | PARCIAL | ver P100 085 | — |

**Contagem P50-archive (50):** FEITO 14 · PARCIAL 17 · NÃO FEITO 6 · NÃO VERIFICÁVEL 13.
FEITO (não listados): 01, 02, 03, 07, 08, 09, 10, 11, 20, 31, 32, 40, 42 (`grep -c "lazy(" src/routes src/App.tsx` → 127), mais o 40 já marcado.

---

## 4. docs/archive/PLANO_AUDITORIA_FRONTEND_CONTRATOS_100_ETAPAS.md (100 itens, 23 marcados `[x]`)

**Divergência de escopo:** o doc trata de *contratos HTTP* das Edge Functions (Zod/422/versionamento), não do módulo "Contratos". O módulo existe e é mínimo: `src/pages/Contratos.tsx` (16 linhas), `src/hooks/useContratos.ts` (list/create/update via `from('contratos')`), `src/components/contratos/GestaoContratos.tsx` (259 linhas: criar + listar + status), rota `/contratos` (`geralRoutes.tsx:84`), tabela `contratos` (`20260518190304`). Sem edição completa, anexos, alerta de vencimento ou renovação automática efetiva — nenhuma dessas funcionalidades está planejada no doc.

| Doc | Etapa/Item | Status | Evidência | O que falta |
|---|---|---|---|---|
| CONTR | 1–4, 20–23, 26–27, 31–32, 40, 61, 80 (inventário/matrizes de endpoints, auth, testes) | PARCIAL | `docs/execucao-cline/MATRIZ_AUTH_EDGE.md` existe | Matriz helper/schema/status por endpoint não publicada |
| CONTR | 11 Converter schema-only em teste HTTP | PARCIAL | 64 arquivos de teste Deno (unit-tests roda o diretório inteiro, `deno-tests.yml:124-129`) | Status+body por webhook no CI |
| CONTR | 13 / 69 Separar 422 schema × regra de negócio; taxonomia HTTP | NÃO FEITO | `grep -rlE "status: 400" supabase/functions --include=index.ts` → 19; `status: 422` → 4 | Taxonomia documentada e testada |
| CONTR | 16 Baseline do healthcheck | NÃO FEITO | `supabase/functions/health/index.ts:69` `realtime: { status: dbErr ? 'outage' : 'operational' }` (copia DB) | Check real de realtime |
| CONTR | 19 / 79 Gate de contrato integrado ao CI | FEITO | `grep contract-coverage .github/workflows/deno-tests.yml` → 0 porque a descoberta é por diretório: `deno test ... supabase/functions/` (`:124-129`) roda `_shared/contract-coverage_test.ts` junto com os demais | — |
| CONTR | 24 Só `_shared/zod.ts` fornece Zod | NÃO FEITO | `grep -rlE "deno.land/x/zod\|npm:zod" supabase/functions --include=index.ts` → 35 | Centralizar import |
| CONTR | 28 Padronizar `safeParse` inline | PARCIAL | 22 handlers com `safeParse` inline | Migrar para helper 422 |
| CONTR | 29 JSON inválido = 400, schema = 422 | DIVERGENTE | `_shared/validation.ts:42` `parseJsonBody` devolve **422** para JSON inválido | Decidir e alinhar com o plano |
| CONTR | 30, 33–35, 38–39 (query/headers, matriz 4 cenários, guards comuns, lotes) | PARCIAL | `versioned-contract.ts` em 4 webhooks; `webhook-auth.ts` em bling/bitrix/whatsapp; asaas usa `segredosIguais` próprio; n8n HMAC próprio | Guard único; cenários por endpoint |
| CONTR | 43–45 Landmarks/rótulos acessíveis (sidebar, idioma, tema, notificações) | PARCIAL | `aria-label` em `SidebarNavGroups.tsx` → 1; header → 1 | Nome por estado do recolhimento, triggers rotulados |
| CONTR | 46–48 Drawer mobile como diálogo modal, focus trap, "Fechar menu" | NÃO FEITO | `src/components/layout/sidebar/MobileSidebarDrawer.tsx` (`motion.aside`) sem `role="dialog"`, `aria-modal`, focus trap ou `Escape` | Implementar |
| CONTR | 49 Rotular download/abrir no portal | NÃO VERIFICÁVEL | Portal removido (`src/pages/PortalCliente.tsx` inexistente) | — |
| CONTR | 50 Shell com axe | PARCIAL | `src/test/a11y/critical-pages.test.tsx` | Cobrir drawer |
| CONTR | 51 Marca/domínio/social cards | NÃO FEITO | `index.html:27` `og:url https://promobrindes.com.br/`, `:30` `og:image https://lovable.dev/opengraph-image-p98pqg.png` | Corrigir metadados |
| CONTR | 53 description/canonical públicos | NÃO FEITO | Sem `<link rel="canonical">`/description por rota | — |
| CONTR | 55–57, 60 Instrumentar prefetch, estabilizar realtime, listeners no shell, viewports | NÃO VERIFICÁVEL | — | — |
| CONTR | 59 Trocar `window.location.href` por router | NÃO FEITO | `grep -rn "window.location.href =" src` (sem testes) → 11 | — |
| CONTR | 65 Timestamp/nonce anti-replay | NÃO FEITO | `grep -nE "timestamp\|nonce\|replay" _shared/webhook-auth.ts` → 0 | Janela anti-replay |
| CONTR | 66–67 Dedup canônica / claim-success-failure-DLQ comum | PARCIAL | `_shared/webhook-idempotency.ts`; RPCs `webhook_claim`/`webhook_mark_success` | Generalizar além de Asaas |
| CONTR | 73 Sunset v1 | NÃO FEITO | `grep -rli sunset supabase/functions/_shared docs/*.md` → só `docs/REVISAO_PLANO_IMPLEMENTACOES_2026-09-12.md` | Política com data e telemetria |
| CONTR | 74 Arrays vazios/campos extras por schema | PARCIAL | `contract-coverage_test.ts` cobre ausente/tipo/vazio | 5 categorias negativas |
| CONTR | 75–78, 85–93, 95, 97–100 (logs estruturados, replay admin, retry worker, smoke pós-deploy, gate de deploy, runbook, docs de contrato) | PARCIAL | Log estruturado JSON em ~106/108 funções via `_shared/observability.ts` (`createLogger` emite `{function_name,level,event}`) e `_shared/edge-observability.ts` (`withEdgeObservability`); o “6/106” do codex só contava `_shared/logger.ts`, ignorando o padrão real (ev.: `decidir-regime/index.ts:15,117`, `observability.ts:86-105`, `edge-observability.ts:182`) | — |
| CONTR | 81 Descobrir todos os testes Deno no CI | FEITO | `deno-tests.yml:124-129` roda `supabase/functions/` inteiro (descoberta recursiva do Deno); `contract-coverage_test.ts` incluído | — |
| CONTR | 82 Manifesto endpoint/schema/teste/auth | NÃO FEITO | Não encontrado | — |
| CONTR | 96 Docs aspiracionais / "Freight Quest" | NÃO FEITO | `docs/testing-architecture.md` e `docs/REVISAO_PLANO_IMPLEMENTACOES_2026-09-12.md` ainda citam | Corrigir |

**Contagem CONTR (100):** FEITO 31 · PARCIAL 27 · NÃO FEITO 16 · MARCADO FEITO, NÃO ENCONTRADO 2 (itens 19 e 79) · DIVERGENTE 1 (29) · NÃO VERIFICÁVEL 23.
FEITO conferidos (não listados): 5–7 (`_shared/contract-response.ts:3,33,54`), 8–9 (`bling-webhook:34` auth antes do parse), 10, 14–15 (`versioned-contract.ts:4-5,48`), 17, 18, 25, 36–37, 41 (um `SkipLinks` em `MainLayout.tsx:49`), 42 (`SidebarNavGroups.tsx:309 id="main-nav"`), 52 (`NavigationTracker.tsx:54 document.title`), 54 (`useOptimizedQueries.ts:26-62` com `queryFn`), 58 (`contabilRoutes.tsx:25 /centro-custos`), 62–64 parcialmente, 68, 70–72, 84, 94.

---

## 5. Auditorias e relatórios arquivados

### 5.1 docs/archive/ESTADO_ATUAL_EVIDENCIAS.md (+ ESTADO_ATUAL.md raiz, R1–R9 e §8)

| Doc | Etapa/Item | Status | Evidência | O que falta |
|---|---|---|---|---|
| EVID | §1 46 tabelas ausentes / §2 15 RPCs / §1-C 3 views / §4 buckets / §3 `pg_net` e 16 crons | FEITO em repo | Ver P50-arch 07–11 | Existência viva NÃO VERIFICÁVEL |
| EVID | §1-B erros descartados (`contabilizar-evento:58`, `decidir-regime:218,272`) | PARCIAL | `decidir-regime/index.ts:274,336` agora captura `auditError`; `contabilizar-evento` não reconferido linha a linha | Reconferir idempotência em `contabilizar-evento` |
| EVID | §8.1 17 funções sem chamador | FEITO | Todas as 8 amostradas têm 1–2 refs em `src`/migrations/`.github`; `evaluate-delivery-alerts` removida | — |
| EVID | §9 `NovaNFeForm` número sorteado / `ContingenciaNFe` sucesso sorteado | FEITO | `grep Math.random src/components/nfe` → 0 | `src/lib/sefaz-simulator/` permanece (ver P100 058) |
| EVID | §9 `open-finance:148` bancos simulados / sandbox default | NÃO FEITO | `open-finance/index.ts:31,245` | — |
| ESTADO_ATUAL raiz | R4 NFe simulador exposto como real | PARCIAL | ver P100 058 | Rótulo/decisão |
| ESTADO_ATUAL raiz | R8 CI nunca verde | NÃO VERIFICÁVEL | `PENDENCIAS.md:14` afirma CI verde em 29/10 (3023 testes) | Histórico de runs não acessível aqui |
| ESTADO_ATUAL raiz | §8 item 5 marcar NF-e como simulação na UI | PARCIAL | Cancelamento/Inutilização avisam em comentário de código, não na UI | Aviso visível |
| ESTADO_ATUAL raiz | §8 F decidir emissão NF-e | NÃO FEITO | Sem ADR | — |
| ESTADO_ATUAL raiz | §8 G secrets CI (`SUPABASE_PROJECT_ID`, `VITE_SUPABASE_PROJECT_ID`) | NÃO VERIFICÁVEL | Secrets | — |

Contagem EVID+ESTADO_ATUAL (itens avaliados 14): FEITO 6 · PARCIAL 4 · NÃO FEITO 2 · NÃO VERIFICÁVEL 2. FEITO extras: R1 (ledger/gates), R2, R3, R5, R6, R9 em repo; §8 E Lalamove (ADR-001).

### 5.2 docs/archive/AUDITORIA_BACKEND_SENIOR.md (53 itens ✅ + roadmap)

| Doc | Etapa/Item | Status | Evidência | O que falta |
|---|---|---|---|---|
| BACKEND | "GRANT explícito por role 100%" (itens 11–15) | DIVERGENTE | P100-archive §7.1 (8/2026) encontrou `GRANT ALL` incl. `TRUNCATE` para `authenticated` em 284 relações; sem migration corretiva (ver P100 029) | Revisar grants |
| BACKEND | Item 49 job `pgss_weekly_baseline` | FEITO | `cleanup_pgss_baseline` em 4 migrations; job `pgss-weekly-baseline` listado em P100 §5.6 | — |
| BACKEND | Roadmap: branch protection em `main` | NÃO VERIFICÁVEL | `gh api .../branches/main/protection` → 403 | — |
| BACKEND | Roadmap: CSP enforce sem `unsafe-eval` | PARCIAL | `vercel.json:40` | — |
| BACKEND | Roadmap: lockout/rate-limit de auth server-side; `checkRateLimit` nas 6 functions de auth; exigir `aal2` | PARCIAL / NÃO FEITO / NÃO FEITO | `src/pages/Auth.hooks.ts:225` usa RPC `is_user_locked`; `checkRateLimit` em `sso-initiate/sso-callback/sso-logout/scim-server/sso-test-login/validar-token-contador/aceitar-convite` → 0 em todas; `grep -rl aal2 src` → 0 | Rate limit nas functions de auth; AAL2 para admin/financeiro |
| BACKEND | Roadmap: supabase-js desatualizado | PARCIAL | Front 2.87.1 (bun.lock); Edge 2.49.4 ×98 | Edge |
| BACKEND | Roadmap: logger estruturado nas 105 functions | PARCIAL | ~106/108 funções usam log estruturado JSON via `_shared/observability.ts` (`createLogger`) e `_shared/edge-observability.ts` (`withEdgeObservability`); o “6/106 do `_shared/logger.ts`” era medição de um helper, não do órgão real | — |
| BACKEND | Roadmap: `_shared/resilience.ts` nas integrações | PARCIAL | 9 funções | Bitrix24/WhatsApp/Open Finance |
| BACKEND | Roadmap: `supabase/seed.sql` | NÃO FEITO | `package.json:42 "db:seed": "supabase db seed"`; arquivo ausente | — |
| BACKEND | Roadmap: cobertura além do piso | PARCIAL | 66% gate | — |
| BACKEND | Roadmap: `tsconfig strict` incremental | PARCIAL | `tsconfig.json strict:true`; `tsconfig.app.json:25 strict:false` | — |

Contagem BACKEND (53 itens marcados + 14 de roadmap avaliados): 53 marcados → objetos encontrados em migrations para todos os conferidos (`v_table_bloat` 5, `monitor_table_bloat` 7, `audit_trigger_generic` 6, `ensure_monthly_partitions` 9, `reprocess_dlq` 8, `registrar_evento_cobranca` 4, `get_asaas_payment_stats` 12, `export_asaas_audit_csv` 13, `rate-limit.ts` com `rate_limit_logs`) — 1 DIVERGENTE (grants). Roadmap: FEITO 5 (RLS test, CORS 0 wildcard em `index.ts`, docs CLAUDE/AGENTS 105–106, types/`@ts-nocheck`, motor tributário unificado — `src/lib/tributario/shared-logic.ts` 12 linhas, dependabot) · PARCIAL 6 · NÃO FEITO 4 · NÃO VERIFICÁVEL 1.

### 5.3 docs/archive/AUDITORIA_TECNICA_EXAUSTIVA_2026-09-02.md (Top 10 + gaps por dimensão)

| Doc | Etapa/Item | Status | Evidência | O que falta |
|---|---|---|---|---|
| TEC | #1 Branch protection | NÃO VERIFICÁVEL | 403 na API | — |
| TEC | #3 Deploy das 16 migrations + revalidar via MCP | NÃO VERIFICÁVEL | — | — |
| TEC | #4 Auditar 16 Edge Functions restantes (role global × vínculo) | PARCIAL | `asaas-proxy` 30+ `exigirEmpresaDoRecurso`; `executar-fechamento-tributario:94`; `bling-proxy:97-107` RBAC | Sem lista das 16 com veredito |
| TEC | #5 CSP enforced sem `unsafe-eval` | PARCIAL | `vercel.json:40` | — |
| TEC | #6 Corrigir CLAUDE.md / regenerar catálogo | PARCIAL | `AGENTS.md:7` 105 / `docs/agentes/sistema.md:38` 106 (real 106); `docs/EDGE_FUNCTIONS_CATALOG.md:3` ainda "87 funções" | Catálogo |
| TEC | #9 Atualizar supabase-js | PARCIAL | Edge 2.49.4 | — |
| TEC | D2 lockout client-side / MFA não exigida | PARCIAL / NÃO FEITO | ver BACKEND | — |
| TEC | D3 `user_roles` global | FEITO (opção B) | `SECURITY_RULES.md:30,101` documenta papel `admin` global e proíbe `admin_global`; `user_roles` sem `empresa_id` | — |
| TEC | D4 285 FKs sem `ON DELETE`; `seed.sql`; backup/PITR no RUNBOOK | NÃO VERIFICÁVEL / NÃO FEITO / NÃO FEITO | `docs/SECURITY.md:28-33` "a confirmar", "Procedimento de restore documentado: NÃO" | — |
| TEC | D5 `docs/DEPLOYMENT.md` infra errada | FEITO | `docs/DEPLOYMENT.md:7,10` Vercel | — |
| TEC | D7 CHANGELOG congelado; `calcular-iva` | NÃO FEITO / FEITO | `CHANGELOG.md:70 [1.0.0] - 2025-01-15` | — |
| TEC | D9 `health` realtime placeholder | NÃO FEITO | `health/index.ts:69` | — |
| TEC | D10 Sentry stub morto | FEITO | `src/main.tsx:21 initSentry(...)`; `@sentry/react ^11.9.0` | — |
| TEC | D12 pacotes MISSING no lockfile | NÃO VERIFICÁVEL | — | — |
| TEC | D13 CONTRIBUTING fork+npm; rollback de migrations | NÃO FEITO | `CONTRIBUTING.md:78 npm install` | — |
| TEC | D14 paginação server-side em 4 lugares | PARCIAL | `grep -rn "\.range(" src` → 9 | — |
| TEC | D15 `lint:strict` falha; ESLint ignora `supabase/functions/**` | NÃO VERIFICÁVEL / PARCIAL | `deno lint` só em lista fixa | — |
| TEC | D19 máquina de estados; `.pfx` sem limite | NÃO FEITO / PARCIAL | `nfe-upload-certificado/index.ts:20` só `password.max(256)` | Limite de tamanho |
| TEC | D1 `src/services` inexistente na doc; ciclos em `lib/tributario`; ADRs | NÃO FEITO / NÃO VERIFICÁVEL / PARCIAL | `docs/ARCHITECTURE.md:42`; 5 ADRs em `docs/` | — |

Contagem TEC (itens avaliados 27): FEITO 6 (#2 `rls_multi_empresa.sql:66-76`, #7 CORS, #8 types, #10 motor tributário, D3, D5, D10) · PARCIAL 9 · NÃO FEITO 8 · NÃO VERIFICÁVEL 5.

### 5.4 docs/archive/TECHNICAL_AUDIT_RESILIENCE.md

| Doc | Etapa/Item | Status | Evidência | O que falta |
|---|---|---|---|---|
| RESIL | §4 contrato `external-data` action `fetch_external_report` | MARCADO FEITO, NÃO ENCONTRADO | `grep -nE "fetch_external_report\|action" supabase/functions/external-data/index.ts` → 0 | Doc descreve contrato inexistente |
| RESIL | §4 erro `400` para payload inválido | DIVERGENTE | Envelope canônico atual é 422 (`contract-response.ts`) | Atualizar doc |
| RESIL | §5 `health` monitora Realtime | NÃO FEITO | `health/index.ts:69` copia status do DB | — |

Contagem RESIL (9 itens): FEITO 6 (`telemetry.ts:56,250`; `client.ts:33 new Proxy`; `validation.ts:103 isWebhookProcessed`; `EmpresaGuard.tsx`; `current-empresa-changed` 12 refs; rota `/admin/system-health` `adminRoutes.tsx:109`) · NÃO FEITO 1 · MARCADO FEITO, NÃO ENCONTRADO 1 · DIVERGENTE 1.

### 5.5 docs/archive/analise-prs/*.md (3 arquivos)

| Doc | Etapa/Item | Status | Evidência | O que falta |
|---|---|---|---|---|
| PRS | #235 migrations 20300/20400 não rastreadas; #238 Grupo B RLS sem migration rastreada | NÃO VERIFICÁVEL | Ledger vivo | — |
| PRS | Sentry: erros PostgREST → `[object Object]` | NÃO VERIFICÁVEL | Não endereçado nas PRs; não reconferido | — |
| PRS | Deploy das edge functions no Supabase | NÃO VERIFICÁVEL | — | — |
| PRS | `20261101140000` com typos | FEITO | `grep -nE "EXISTpublic\|psblic" supabase/migrations/20261101140000*.sql` → 0 | — |

Contagem PRS (17 itens): FEITO 14 (#234 merged 2026-11-10 + `20261031180000`; #240 merged + `monitor-health` + `20261101200000`; #235 steps 15/16 → `20261117225000:46-60`; #248 merged 2026-11-07 — `sentry.ts:3 EDGE_SENTRY_DSN`, `:19-20 parseDsn try`, `:84 res.ok`, `framesDo` exportada em `edge-observability.ts:53`; `env.manifest.json:326-328 SENTRY_ENVIRONMENT required:false`; `vite.config.ts:65-68 SENTRY_ORG/PROJECT`; `admin_global` removido do guard `asaas-proxy:806` e `SECURITY_RULES.md:30`; #237/#226/#225 já no main) · NÃO VERIFICÁVEL 3.

### 5.6 docs/archive/README.md

| Doc | Etapa/Item | Status | Evidência |
|---|---|---|---|
| README | Fontes vigentes apontadas | FEITO | `docs/AUDITORIA_TECNICA_EXAUSTIVA_2026-09-02_R2_LIVE.md`, `docs/PLANO_EXCELENCIA_10_10.md`, `AGENTS.md` existem; `sql/scripts/` → `docs/archive/sql` |

---

## 6. docs/archive/mapa-integracao-20261112/ (MAPA-INTEGRACAO, IMPORTADOS, EXECUCAO-29-10)

Remoto hoje tem **6 branches** (`gh api .../branches` → 6); nenhuma das 57 "pendentes" ou 5 "importadas" ainda existe (só `origin/contexto`). Verificação feita pelo conteúdo citado.

| Doc | Etapa/Item | Status | Evidência | O que falta |
|---|---|---|---|---|
| MAPA | #1 `prod-readiness` (PR #324) · #3 dashboard rótulos (PR #325) | FEITO | `gh api` merged 2026-11-13 / 2026-11-12; `docs/prod-readiness.md` | — |
| MAPA | #2 `mapbox-gl 3.34.2` (PR #293 fechado sem merge) | SUPERADO | `package.json:117 "mapbox-gl": "^3.35.0"` | — |
| MAPA | #4 quarentena E2E (`codex-h0831-reconciliacao-online`) | FEITO | `ci.yml:9` "quarentena E2E" | — |
| MAPA | #5 guard 11 views em `20260317125441` | NÃO FEITO | `grep -c "IF NOT EXISTS\|DO \$\$" supabase/migrations/20260317125441_*.sql` → 0 (PR #131 shims merged cobre outro ponto) | Guarda para Preview |
| MAPA | #6 / #47 "protege integrações e remove dados simulados" (codex-055358) | NÃO FEITO | `open-finance/index.ts:245` ainda simulado | — |
| MAPA | #7 asaas links por empresa | FEITO | `asaas-proxy/index.ts:859-862 criar_link_pagamento → exigirEmpresaDoRecurso` | — |
| MAPA | #8, #9, #15 `db-types-drift` | SUPERADO | `.github/workflows/schema-drift.yml` regenera tipos e abre PR | — |
| MAPA | #10 `vibrant-ride`, #13 `fix-n8n-tests`, #18, #21, #24, #38, #44 `base44`, #49, #51, #52, #53 (47 arq.), #55 (139 arq.), #56 `lint-zero` (301 arq.) | NÃO VERIFICÁVEL | Conteúdo não descrito/não localizável por grep; branches apagadas | Se havia valor, foi perdido com a branch |
| MAPA | #11 boletos types (Copilot) | FEITO | via PR #247 (`20260913170000`, `useBoletos.ts:178 asaas_id`) | — |
| MAPA | #12 GHSA ignores no bun audit | FEITO | `ci.yml:198-201,228` | — |
| MAPA | #14 `obter_totais_movimentacoes` (migration 20261031154800) | SUPERADO | `20260924193301_rpc_totais_movimentacoes.sql`, `20261027120000`; `20261116190000` nota "já versionado"; `Movimentacoes.tsx:175` usa | — |
| MAPA | #16 codeql autobuild 4.39.1 | FEITO | `codeql.yml:46-56` `# v4.39.3` | — |
| MAPA | #17 ADR 0001 fonte da verdade | NÃO VERIFICÁVEL | 5 ADRs em `docs/`; nome exato não conferido | — |
| MAPA | #19 hover-card 1.2.1 · #22 nanoid · #28 joyride 3.2.0 | FEITO | `package.json:74,125`; `nanoid`/`react-query-devtools` ausentes | — |
| MAPA | #20 recharts 3.10.1 (PR #175) | NÃO FEITO | `package.json:130 "recharts": "^2.10.3"`; PR fechado sem merge | Migração major |
| MAPA | #23 vitest 5.0.5 · #29 vitest/ui 5.1.0 | NÃO FEITO | `package.json:179 "vitest": "^4.1.11"` | — |
| MAPA | #25 monitor-health review (PR #240) · #26 sentry EDGE_SENTRY_DSN/res.ok | FEITO | ver 5.5 | — |
| MAPA | #27 react-dom bump | NÃO VERIFICÁVEL | Versão alvo não citada | — |
| MAPA | #30 `exigirPapel` respeita `is_active` | FEITO | `_shared/auth-guard.ts:195 .eq('is_active', true)` | — |
| MAPA | #31, #35, #36, #37, #42 strict burndown p1–p10 | SUPERADO | `tsconfig.json:24 strict:true`; `scripts/ci/baselines/strictnullchecks-baseline.txt` vazio (0 linhas) = zero erros | `tsconfig.app.json strict:false` |
| MAPA | #32 sentry steps 44-45 | FEITO | PR #248 merged | — |
| MAPA | #33 `timingSafeEqual` de `string-utils` em `mcp-query` | FEITO | `mcp-query/index.ts:27,437` | — |
| MAPA | #34 `automation/estado-real` · #43 `inventario` · #57 `contexto` · #40 contexto IA | FEITO | `.github/workflows/estado-real.yml`, `inventario-estado.yml`, `contexto.yml`; `origin/contexto` existe | — |
| MAPA | #39 rate limit 30 req/min `bling-proxy` | FEITO | `bling-proxy/index.ts:58-65` | — |
| MAPA | #41 cline índice e matrizes | PARCIAL | `docs/execucao-cline/` 3 de 9 artefatos | — |
| MAPA | #45 `wip-squash-253` isola contrato de deploy | PARCIAL | `.github/workflows/functions-deploy.yml` existe; conteúdo da branch não comparável | — |
| MAPA | #46 gitleaks `--log-opts` | FEITO | `ci.yml:90,116` | — |
| MAPA | #48 DDL steps 12-23 | FEITO | PR #235 merged 2026-11-10; `20261101120000`, `20261101140000`, `20261116190000:141-146` | — |
| MAPA | #50 `tipo_cobranca cartao_credito/debito`; notify-alert projeto destino | FEITO | `20260825090000:146`; `20260905130000_fix_notify_performance_alert_destino.sql` | — |
| MAPA | #54 supabase-js 2.118 nas Edge (67 arquivos) | NÃO FEITO | 98 arquivos em `npm:@supabase/supabase-js@2.49.4` | Atualizar em lotes |
| IMPORTADOS | 5 branches `importado/local/*` | NÃO VERIFICÁVEL | Nenhuma existe no remoto; `chat-c696391` (93 arquivos) sem rastro identificável | Conteúdo possivelmente perdido |
| EXEC-29-10 | PR #198 deps · PR #199 conciliação dupla | FEITO | merged 2026-10-29 / 2026-11-06; `useConciliacaoPage.ts:274-282` só atualiza estado local | — |
| EXEC-29-10 | PR #131 "não mesclar" | DIVERGENTE | `gh api` → merged 2026-11-11 (contrariando a recomendação do doc; ok do dono não registrado no repo) | Registrar decisão |
| EXEC-29-10 | PR #175 recharts 3 · PR #200 docs CI | NÃO FEITO / NÃO VERIFICÁVEL | #175 fechado sem merge | — |

**Contagem MAPA+IMPORTADOS+EXECUCAO (57 trabalhos + 7 itens de execução = 64):** FEITO 27 · SUPERADO 9 · PARCIAL 2 · NÃO FEITO 7 · DIVERGENTE 1 · NÃO VERIFICÁVEL 18.

---

## 7. Documentos da RAIZ

### 7.1 PLANO_100.md (43 etapas E-001..E-043, 2026-09-24) — cobre AUDITORIA.md A-001..A-044

| Doc | Etapa/Item | Status | Evidência | O que falta |
|---|---|---|---|---|
| P100-raiz | E-003 Rotacionar service_role de `xyykivpcdbfukaongpbw` | NÃO VERIFICÁVEL | Externo ao repo; HEAD lê env (`compare-schemas:25`) | — |
| P100-raiz | E-004 / E-005 Aplicar `20260913120000` e `20260913140000` | FEITO em repo | Arquivos existem (`20260913120000:373-374,438` triggers; 4 RPCs 1 migration cada) | Aplicação viva NÃO VERIFICÁVEL |
| P100-raiz | E-021 `formatCurrency` nas 5 telas | PARCIAL (regressão) | 5 telas sem `brl` local; nova função local em `src/pages/tributario/ComparativoConformidade.tsx` | Trocar por `formatCurrency` |
| P100-raiz | E-026 Gates falharem sem `DATABASE_URL` | NÃO FEITO | `ci.yml:313,328,347,408,415` condicionais; `:362-371` só registra "inconclusivo" | `exit 1` |
| P100-raiz | E-028 Backup/PITR documentado e testado | NÃO FEITO | `docs/SECURITY.md:28-33` "a confirmar no painel", "Procedimento de restore documentado: NÃO" | — |
| P100-raiz | E-029 Reconciliar ~44 migrations não rastreadas | PARCIAL | `migration-ledger.yml`; `20261116190000_versiona_ddl_ja_aplicado_em_producao.sql` | Resultado da reconciliação não versionado |
| P100-raiz | E-030 43 TODOs de schema drift | PARCIAL | 2 restantes | — |
| P100-raiz | E-033 24 pares de índices duplicados | PARCIAL | `20261101140000_drop_idle_indexes.sql`; `20261116190000` (4 índices) | Lista dos 24 pares com DROP |
| P100-raiz | E-035 `empresa_id` + RLS por empresa em `fornecedores` | PARCIAL | Coluna existe (`20260317000844:80`), índice (`20261117225000:66`); policies ainda só por `user_id` (`20260518172812:2-5 fornecedores_owner_*`); nenhuma `fornecedores_empresa_*` | Policies `empresa_acessivel(empresa_id)` |
| P100-raiz | E-039 supabase-js nas 18 Edge | NÃO FEITO | 98 arquivos em 2.49.4 | — |
| P100-raiz | E-042 `anon key` hardcoded nas 3 migrations | FEITO em repo | `20260913120000:112-162` redefine `notify_performance_alert_trigger()` lendo de `integration_secrets` e enviando só `x-cron-secret` (sem chave anon); `:244 chave_anon_vault()`. Falso diagnóstico: recomendar nova migration dirige trabalho a falha já resolvida. Literais restantes (`20260905130000:23`) são histórico imutável — só rotação resolve | Rotação de chaves (histórico imutável) | |

**Contagem PLANO_100 raiz (43):** FEITO 30 · PARCIAL 6 · NÃO FEITO 3 · NÃO VERIFICÁVEL 1 (E-003); E-004/E-005 contados como FEITO em repo.
FEITO (não listados): E-001 (`asaas-proxy:228-1382`), E-002 (`sefaz-manifestar:254,290-304`), E-006 (`migration-ledger.yml`), E-007 (`bling-proxy:97-107`), E-008, E-009 (`:74,83`), E-010 (`:31`), E-011 (`:164-176`), E-012 (`open-finance:189`), E-013, E-014 (`:168`), E-015 (`List.tsx:81-91`), E-016 (`useConciliacaoPageState.ts:78` useQuery), E-017 (rota/`PortalCliente.tsx` removidos), E-018 (exceção documentada PR #95; `gerar-pacote-evidencias:271-278`), E-019 (`withTimeout` em `asaas-proxy:41`, `bling-proxy:975`), E-020 (`segredosIguais` em `asaas-webhook:41`, `n8n-dispatch:99`), E-022 (`confirmarIgnorar`), E-023 (`bulk-actions-bar.tsx:26,49`), E-024 (`useFinancialOperations.ts:81 range`, `Movimentacoes.tsx:4,175`), E-025, E-027 (`main.tsx:21`), E-031 (`calculo-iva:25`), E-032 (`20261101120000`), E-034 (`20261116190000:141-146`), E-036 (`Cobrancas.tsx:393-396`), E-037 (`isDeleting` → 0), E-038 (`package.json:177` devDependencies), E-040 (`_shared/app-url.ts`), E-041 (11 vars presentes), E-043 (`n8n-callback:2,55-67`).

### 7.2 PLANO_50.md (50 etapas, 2026-09-24)

| Doc | Etapa/Item | Status | Evidência | O que falta |
|---|---|---|---|---|
| P50-raiz | 06 Confirmar deploy Vercel por merge | NÃO VERIFICÁVEL | — | — |
| P50-raiz | 07, 08 Aplicar migrations 20260913120000/140000 | FEITO em repo / aplicação NÃO VERIFICÁVEL | idem E-004/E-005 | — |
| P50-raiz | 11 `anon key` em 3 cron jobs | FEITO em repo | ver E-042 (definição efetiva em `20260913120000:112-162`, sem chave anon) | — |
| P50-raiz | 13 24 pares de índices duplicados | PARCIAL | ver E-033 | — |
| P50-raiz | 16 16 índices de FK restantes | PARCIAL | `20261117204500_indices_financeiros_ausentes.sql` cobre parte (`idx_fornecedores_empresa_id_fk`, `idx_movimentacoes_empresa_id_fk`, …) | Conferir os 16 nomes (`partidas_contabeis.conta_contabil_id`, `sso_*`, `bloqueios_duplicidade` …) |
| P50-raiz | 17 397 índices nunca usados | PARCIAL | `20261101140000_drop_idle_indexes.sql` (lote) | Lotes restantes |
| P50-raiz | 22 ~44 migrations não rastreadas | PARCIAL | ver E-029 | — |
| P50-raiz | 27 18 arquivos com TODO schema drift | PARCIAL | 2 restantes | — |
| P50-raiz | 28 203 casts `as any`/`as unknown as` | PARCIAL | `grep -rnE "as any\b\|as unknown as" src` (sem testes) → 159 | — |
| P50-raiz | 29 supabase-js Edge | NÃO FEITO | 98 × 2.49.4 | — |
| P50-raiz | 31 ~20 functions `verify_jwt=false` sem guarda | PARCIAL | `mcp-query` 3 guards, `sefaz-dfe-*` 4, `prever-carga-tributaria` 2; `gerar-pdf-tributario` só header manual (:43); 52 sem JWT no `config.toml` | Classificação dos 3 baldes versionada |
| P50-raiz | 34 Rotação da chave de terceiro | NÃO VERIFICÁVEL | — | — |
| P50-raiz | 36 Rate limit uniforme nas financeiras | PARCIAL | 19 functions com `checkRateLimit` | Restante das funções com IA/API paga |
| P50-raiz | 38 Gates falharem sem `DATABASE_URL` | NÃO FEITO | ver E-026 | — |
| P50-raiz | 39 Backup/PITR | NÃO FEITO | ver E-028 | — |
| P50-raiz | 41 Testes das guardas das PRs #92/#96 | PARCIAL | `asaas-proxy/index.test.ts`, `credit-risk.test.ts`; `sefaz-manifestar/` sem teste; `bling-proxy` sem teste de RBAC localizado | Testes 200/403 por action |
| P50-raiz | 48 Documento único de segurança | PARCIAL | `SECURITY_RULES.md` atualizado (admin global, exceções); `docs/SECURITY.md` separado | Consolidar |
| P50-raiz | 49 Grafo reconstruído | PARCIAL | `GRAPH_REPORT.md:13` `79cb9a2a` ≠ HEAD | — |
| P50-raiz | 50 Re-auditar e medir | PARCIAL | `docs/AUDITORIA_PLANEJADO_X_EXECUTADO_2026-10-12.md` existe | Tabela antes×depois das métricas deste plano |

**Contagem PLANO_50 raiz (50):** FEITO 29 · PARCIAL 14 · NÃO FEITO 4 · NÃO VERIFICÁVEL 3.
FEITO (não listados): 01–05 (PRs #92/#96/#98/#99/#91/#94/#95 merged 2026-09-24), 09 (`20260913160000`), 10, 12, 14, 15 (`20261117225000:46-58`), 18 (14 views com `security_invoker`), 19 (`20260417155857:21-26`), 20 opção B (`SECURITY_RULES.md:30`), 21 (`20261116190000` nota: NOT NULL já no CREATE TABLE `20260315192305`), 23, 24, 25 (`Cobrancas.tsx:396 contasReceberId={selectedDevedor?.conta_ids}`), 26 (`app-url.ts` lança erro), 30 (`asaas-proxy:806,862`), 32, 33, 35 (gitleaks), 37 (`migration-ledger.yml`), 40 (`docs/DEPLOYMENT.md` Vercel), 42 (`e2e/__tests__/regua-cobranca.e2e.ts`), 43 (`20261031180000`), 44 (`vite.config.ts:59-68`), 45 (`_shared/sentry.ts`), 46 (`monitor-health` + `20261101200000`), 47 (`docs/DB_HEALTH.md`, `scripts/inventario/`).

### 7.3 AUDITORIA.md (44 achados) e ESTADO_ATUAL.md (raiz)

- AUDITORIA.md A-001..A-044 mapeiam 1:1 para E-001..E-043 (A-016→E-018): mesmo status da seção 7.1. Pendentes: A-003/A-037 (anon key em `20260905130000` — histórico imutável; implementação efetiva sem literal), A-004 (reconciliação parcial), A-006 (índices duplicados parcial), A-008 (`fornecedores` sem RLS por empresa), A-023 (novo `brl` local), A-032 (gates condicionais), A-034 (PITR), A-036 (externo), A-039 (2 TODOs), A-041 (supabase-js Edge). §4 "Não verificado" continua não verificável sem banco.
- ESTADO_ATUAL.md: ver 5.1.

---

## Resumo por documento

| Documento | Itens | FEITO | PARCIAL | NÃO FEITO | MARCADO FEITO, NÃO ENCONTRADO / DIVERGENTE | NÃO VERIFICÁVEL |
|---|---:|---:|---:|---:|---:|---:|
| archive/AUDITORIA_EXAUSTIVA_PLANO_100_ETAPAS | 100 | 36 | 33 | 10 | 0 | 21 |
| archive/HANDOFF_CLINE (itens próprios) | 13 | 5 | 6 | 1 | 1 | 0 |
| archive/PLANO_CORRECAO_MELHORIAS_50_ETAPAS | 50 | 14 | 17 | 6 | 0 | 13 |
| archive/PLANO_AUDITORIA_FRONTEND_CONTRATOS | 100 | 31 | 27 | 16 | 3 | 23 |
| archive/ESTADO_ATUAL_EVIDENCIAS + ESTADO_ATUAL raiz | 14 | 6 | 4 | 2 | 0 | 2 |
| archive/AUDITORIA_BACKEND_SENIOR (roadmap) | 14 (+53 ✅) | 5 | 6 | 4 | 1 | 1 |
| archive/AUDITORIA_TECNICA_EXAUSTIVA_2026-09-02 | 27 | 6 | 9 | 8 | 0 | 5 |
| archive/TECHNICAL_AUDIT_RESILIENCE | 9 | 6 | 0 | 1 | 2 | 0 |
| archive/analise-prs (3 arquivos) | 17 | 14 | 0 | 0 | 0 | 3 |
| archive/README.md | 1 | 1 | 0 | 0 | 0 | 0 |
| archive/mapa-integracao (57 + 7) | 64 | 27 (+9 superados) | 2 | 7 | 1 | 18 |
| raiz/PLANO_100.md | 43 | 30 | 6 | 3 | 0 | 1 |
| raiz/PLANO_50.md | 50 | 29 | 14 | 4 | 0 | 3 |
| raiz/AUDITORIA.md | 44 | (= PLANO_100) | | | | |

## Pendências que se repetem em ≥3 documentos (prioridade)

1. Gates de banco no CI condicionais a `DATABASE_URL` (`ci.yml:313,328,347,408,415`) — P100-arch 028/093, P50-arch 28, E-026, P50-raiz 38.
2. `@supabase/supabase-js@2.49.4` em 98 Edge Functions — P100-arch 080, E-039, P50-raiz 29, MAPA #54, TEC #9.
3. Documentação obsoleta (`EDGE_FUNCTIONS_CATALOG` 87, `CHANGELOG` 2025, `CONTRIBUTING` npm, `ARCHITECTURE` `src/services`/`orquestrador-elisao`, `TESTING` 80%) — P100-arch 086, P50-arch 05, TEC #6/D7/D13.
4. Open Finance simulado (`open-finance/index.ts:31,245`) — P50-arch 25, EVID §9, MAPA #6/#47.
5. NF-e: decisão homologação × demonstração (sem ADR; simulador ainda em `src/lib/sefaz-simulator`) — P100-arch 058, P50-arch 23/24, ESTADO_ATUAL R4/§8F.
6. Testes Deno: unit-tests cobre o diretório inteiro (64 arquivos); falta `deno coverage` com piso — P100-arch 049/073, CONTR 19/79/81 (19/79 já resolvidos).
7. Backup/PITR nunca documentado/testado (`docs/SECURITY.md:28-33`) — E-028, P50-raiz 39, TEC D4.
8. `fornecedores` sem RLS por `empresa_id` (policies `fornecedores_owner_*`) — E-035, A-008.
9. Constraint `faixas_simples_reparticao_soma_chk` ainda `NOT VALID` (`20260825250000:49`) — P100-arch 025.
10. Anon key hardcoded em `20260905130000:23` (projeto oficial, mas literal em migration) — E-042, P50-raiz 11, A-037.

---

## Anexo — A10 — Reverificação do inventário de trabalho inacabado (17/11) + docs de segurança/processo

HEAD `a406e99` (2026-11-20). Clone raso (50 commits; raiz = `ece50dc4` #424, 17/11 07:53 -03), então o `git log` local só enxerga #424→#476; PRs #410–#423 foram conferidas via `gh api` (REST). Sem acesso ao banco: tudo que depende de produção está marcado **NÃO VERIFICÁVEL SEM BANCO**.

**O doc `docs/auditoria/INVENTARIO_TRABALHO_INACABADO_2026-11-17.md` NÃO foi atualizado com status** — único commit que o toca é o próprio #424 que o criou (`git log -- docs/auditoria/INVENTARIO_TRABALHO_INACABADO_2026-11-17.md` → 1 commit); nenhuma linha "RESOLVIDO/PR #" nos 17 achados (grep por `status|resolvido|corrigido|PR #4[2-9]` só acha as ressalvas originais do #422).

## 1. Os 17 achados

| Nº | Título | Status hoje | Commit(s) | Evidência arquivo:linha (HEAD) | O que falta |
|---|---|---|---|---|---|
| 1 | Motor anti-duplicidade: regras salvas que nenhum motor lê | **PARCIAL** | `ed338a2d` (#455) | `supabase/migrations/20261117232000_indices_anti_duplicata_contas.sql:139-150` cria UNIQUE `idx_contas_pagar_prevent_duplicates (empresa_id, fornecedor_id, valor, data_vencimento, numero_documento)` e o equivalente em contas_receber — bloqueia duplicata exata. Mas `RegrasDuplicidadeTab.tsx:99` ainda `toast.success('...versionadas com sucesso!')`, `:162` "Versão N ATIVA", `:231` "Garantia de Idempotência", `:253` "aplicadas instantaneamente"; `configuracoes_duplicidade` só é lida por esse componente (`grep -rl` em src/ e supabase/functions → só ele); `validar_duplicidade_avancada` continua só nas migrations de 2026-05 (`20260508200327...sql`) | Parte (1) do doc (parar a mentira na UI) não feita; parte (2) (motor que lê `campos_validacao`/fuzzy/tolerância) não feita — índice fixo não honra a configuração da tela. Aplicação do índice em produção: NÃO VERIFICÁVEL SEM BANCO |
| 2 | Aba padrão de Configurações = régua fictícia | **AINDA ABERTO** | nenhum (`git log --since=2026-11-17 -- src/pages/Configuracoes.tsx src/components/configuracoes/ReguaCobrancaTab.tsx` → só #424) | `src/pages/Configuracoes.tsx:42,44` importa `ReguaCobrancaTab`/`TemplatesTab`; `:75` `useState(etapasIniciais)`; `:80` `useUrlTab('regua', ...)`; `:96` `toggleEtapa` só setState+toast; `:305` `<ReguaCobrancaTab etapas={etapas} onToggleEtapa={toggleEtapa}/>`; `grep supabase\|useMutation\|useQuery` no arquivo → 0. `ReguaCobrancaTab.tsx` → 0 `onClick`. `TemplatesTab.tsx` só recebeu `DialogDescription` (#427 `cf7bc77b`) | Tudo: trocar as abas-fantasma por `ReguaCobrancaConfig` (ou link para `/cobrancas?tab=regua`). Estado de `regua_cobranca` (auto_executar=false): NÃO VERIFICÁVEL SEM BANCO |
| 3 | "Salvar Configurações" do Sistema só toast; alerta fixo em 7 dias | **AINDA ABERTO** | nenhum | `src/pages/Configuracoes.tsx:104` `savePreferencias` sem persistência, `:358` `onSave={savePreferencias}`; `SistemaTab.tsx:283` único `onClick`; sem `useTheme`; nenhuma migration `*preferencias_sistema*` em `supabase/migrations/`; `gerar_alertas_vencimento` segue com `CURRENT_DATE + 7` (`20260903000800_fix_gerar_alertas_vencimento_coalesce_ativo.sql:23,30`, última definição versionada) | Entregas 1 (a,b,c) e 2 (d,e) inteiras |
| 4 | Cobrança Asaas criada no provedor e nunca gravada | **PARCIAL** (núcleo resolvido) | `ece50dc4` (#424), `b982315a` (#441) | `supabase/functions/asaas-proxy/index.ts:370-372` fail-fast 422 se não for `cus_...`; `:378-385` resolve uuid local via `asaas_customers.asaas_id`; `:485` `asaas_customer_id: clienteLocalCobranca.id`; `:511-513` `result.registro_local = dbError ? {ok:false,...} : {ok:true}`; `src/hooks/useAsaas.ts:89` `exigirRegistroLocalDaCobranca(resultado)` antes do toast; `useBoletos.ts:158` agora manda `clienteAsaas.asaas_id` | (a) webhook: `asaas-webhook/index.ts:107` `if (localPayment) {...}` continua **sem else** — evento sem linha local ainda é marcado processado (item 3 da correção); (b) `asaas-proxy/index.test.ts` → 0 ocorrências de `criar_cobranca`/`pareceIdClienteAsaas` (só `useBoletos.validation.test.ts` no front); (c) a função ainda responde 200 com `registro_local.ok=false` em vez de 500 (decisão documentada no código `:507-510`) |
| 5 | Baixa automática por extrato grava `conta_bancaria_id: ''` e engole falhas | **AINDA ABERTO** | nenhum | `src/components/contas-receber/BaixaAutomaticaDialog.tsx:155` `conta_bancaria_id: m.transacao.conta_bancaria_id || ''`; `:153,181,192` três `eslint-disable local/no-floating-supabase-write`; `:149` `successCount++` dentro de `if (!error)` sem else; `:208` tela de sucesso só com `processados`; sem `src/components/contas-receber/__tests__/*Baixa*` | Itens 1–5 da correção inteiros |
| 6 | Quorum de aprovação salvo mas nunca exigido | **AINDA ABERTO** | nenhum (`useAprovacoes.ts` só teve remoção de TODOs em #432) | `ConfiguracaoAprovacaoCard.tsx:187` input `max="5"` ainda aceita 2–5; `useAprovacoes.ts:215` grava `aprovadores_obrigatorios` sem validação; nenhuma migration cria `aprovacao_assinaturas` nem reescreve `aprovar_solicitacao_pagamento` após 20261117074000 (`grep -rl aprovacao_assinaturas supabase/migrations src` → 0) | (a) travar campo/validar >1; (b) tabela de assinaturas + RPC com COUNT ≥ quorum |
| 7 | Painel de obrigações acessórias (dashboard) tudo atrasado / 0% / botões mortos | **AINDA ABERTO** | nenhum | `DashboardReformaTributaria.tsx:57-70` `routeMap` sem chave `obrigacoes` (grep → 0); `:208` `case 'obrigacoes'` ainda renderiza o componente morto; `ObrigacoesAcessorias.tsx` → 0 `onClick`/`onSubmit`; `:66-71` status só por calendário | Opção A (1 linha no routeMap para `/tributario/obrigacoes`) ou B |
| 8 | Relatórios tributários agendados sem invocador/cron | **AINDA ABERTO** | nenhum | `grep -rn "cron.schedule" supabase/migrations/*.sql \| grep -i relatorios-tributarios` → 0; `enviar-relatorios-tributarios-agendados/index.ts:108` ainda exige segredo `relatorios_tributarios_cron`; `supabase/config.toml:169-170` `verify_jwt = true` (ressalva do Devin segue válida); função está na lista do `functions-deploy.yml:47` | Job pg_cron + segredo + decisão verify_jwt vs Bearer service_role. Existência do segredo em `integration_secrets`: NÃO VERIFICÁVEL SEM BANCO |
| 9 | Alertas tributários nunca gerados; painel afirma "06:00" | **AINDA ABERTO** | nenhum | `src/components/admin/CronJobsStatus.tsx:155` literal "O job roda diariamente às 06:00." intacto; `grep cron.schedule ... \| grep -i alertas-tributarios` → 0 migrations | (A) front deixar de afirmar agendamento não verificado; (B) criar o job (dono). Estado de `cron.job`: NÃO VERIFICÁVEL SEM BANCO |
| 10 | SPED EFD-Contribuições: `empresas.inscricao_municipal` inexistente | **RESOLVIDO (no repo)** | `5be2cfc7` (#451) | `supabase/migrations/20261117220000_colunas_declaradas_classe_select.sql:30` `ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS inscricao_municipal TEXT;` — opção B do doc; `exportar-sped-contribuicoes/index.ts:108` mantém o select (correto após a coluna existir) | Aplicação em produção e geração real do SPED: NÃO VERIFICÁVEL SEM BANCO. Auditoria das outras colunas da 20260317124844: parcialmente coberta por #440/#451 (não conferido coluna a coluna) |
| 11 | DRE Tributária: `faturamento_mensal.total_tributos` inexistente | **PARCIAL** (causa principal resolvida) | `31bd09e4` (#450) | `gerar-dre-tributaria/index.ts:61-64` comentário + `.select('receita_bruta')`; gate de CI contra coluna inexistente em select/order criado em `c72e283f` (#457) | Item 2 da correção não feito: `gerar-dre-tributaria/index.ts:58` ainda `const { data: fat } = await supa...` (sem `error`), `:69-71` `if (fat) {...}` — falha de leitura do banco continua caindo no ramo `sem_faturamento_no_periodo` |
| 12 | CNPJ lookup 503: RPC `cnpja_check_rate_limit` inexistente | **RESOLVIDO (no repo)** | `61b38385` (#438) | `supabase/migrations/20261117195500_restaura_cnpja_rate_limit.sql:30,37,40,50,57` cria tabela, índice simples, RLS, policy e `CREATE OR REPLACE FUNCTION public.cnpja_check_rate_limit`; `cnpja-lookup/index.ts:179` chama a RPC | Aplicação em produção: NÃO VERIFICÁVEL SEM BANCO. Sem teste para a função (`supabase/functions/cnpja-lookup/` só tem `index.ts`) |
| 13 | Open Finance devolve saldo/extrato inventados e grava em `transacoes_bancarias` | **RESOLVIDO** | `19a248ad` (#425) | `open-finance/index.ts:54-62` lista de ações que exigem provedor homologado (inclui `import_transactions`) e recusa com 503; `index_test.ts:11-37` cobre recusa/503/mensagem; `ImportarExtratoDialog.tsx:48-57` `toast.error('Open Finance não homologado')` no lugar do `mockExtrato`; `ImportarExtratoDialogArquivoLocal.tsx:133-134` botão `disabled` com `title` | — |
| 14 | Log SEFAZ semeado com 7 eventos falsos | **RESOLVIDO** | PR #423 (merge 17/11 10:39Z, dentro do squash-root `ece50dc4`) | `src/lib/sefaz-event-logger.ts` tem 152 linhas, `eventosLog: EventoSefaz[] = []` (:35), `grep inicializarEventosDemo` → 0; testes `src/components/nfe/__tests__/sefaz-sem-protocolo-fabricado.test.tsx`, `sefaz-sem-metrica-fabricada.test.tsx` | — |
| 15 | Status SEFAZ por `Math.random` + contingência automática | **RESOLVIDO** | PR #423 | `src/lib/sefaz-contingency/state.ts:107-134` `checkSefazHealth` devolve `online: null, latency: null, lastCheck: null`, sem `Math.random`/`setTimeout` (só no comentário) e sem chamar `registerCommunication*`; `ContingenciaNFe.tsx:113,174,306,315` e `SefazMonitor.tsx:198` textos "não homologada"; teste `src/lib/__tests__/sefaz-sem-status-fabricado.test.ts`, `sefaz-monitor-sem-laco.test.tsx` | `SefazMonitor.tsx:45 autoMonitor=true` e `:141 setInterval` / `ContingenciaNFe.tsx:55,66` ainda existem — laço roda, mas sobre estado nulo (não fabrica mais); item (2) do doc "desligar setInterval" não feito literalmente |
| 16 | Conciliação automática conta/marca antes de persistir | **AINDA ABERTO** | nenhum (#420 corrigiu só `totalSalvas`, antes do inventário) | `src/lib/conciliacao-page-helpers.ts:240-251` `matchesAlta.push`, `autoConciliadas++`, `valorAutoConciliado +=`, `novasTransacoes[idx].conciliada = true` **antes** do `await confirmarConciliacao.mutateAsync` (:255); `useConciliacaoPage.ts:193,203` filtram por `confianca !== 'alta'`, não por persistência; teste `:137` "não marca localmente..." não assere `autoConciliadas === 0` (grep → só `.toBe(1)`/`.toBe(0)` nos testes :116/:131 de outro cenário) | Mover contadores/mutação para depois do `mutateAsync`; retornar ids persistidos; reforçar o teste |
| 17 | SLO: nada invoca `calcular-slo-metrics-diario` | **AINDA ABERTO** | nenhum | `grep -rn "cron.schedule" supabase/migrations/*.sql \| grep -i slo` → 0; `SLOPanel.tsx:99` ainda promete "gerado às 23:55"; `supabase/config.toml:331-332` `verify_jwt = true` (ressalva do Devin segue) | Migration com `cron.schedule('calcular-slo-metrics-diario','55 23 * * *', ...)` + decisão verify_jwt/Bearer; ajustar texto do painel. `integration_secrets.internal_jobs`: NÃO VERIFICÁVEL SEM BANCO |

**Contagem (tarefa 1):** RESOLVIDO 5 (#10, #12, #13, #14, #15 — #10 e #12 condicionados a aplicação em produção não verificável) · PARCIAL 3 (#1, #4, #11) · AINDA ABERTO 9 (#2, #3, #5, #6, #7, #8, #9, #16, #17). Doc não atualizado: 17/17 sem status.

## 2. Docs de segurança/processo — só pendentes/parciais

| Doc | Item | Status | Evidência | O que falta |
|---|---|---|---|---|
| docs/SECURITY.md | Restore de backup testado / procedimento documentado / retenção e PITR confirmados | **PENDENTE** (declarado no próprio doc) | `docs/SECURITY.md:28-38` "Restore testado: NÃO", "a confirmar no painel", "a verificar se habilitado" | Ação no painel Supabase; NÃO VERIFICÁVEL SEM BANCO/painel |
| docs/SECURITY.md | Canal de vulnerabilidades `security@promo-finance.com` + "PGP Key: [link]" | **PARCIAL / placeholder** | `:44-45` literal `[link]`; `grep -rn security@promo-finance src` → 0 | Publicar chave ou remover a linha |
| docs/SECURITY.md | "Session timeout: 24h", "MFA disponível" | **NÃO VERIFICADO** | nenhuma referência a timeout de sessão em `src/hooks/useAuth.tsx`/`src/lib/*.ts` (grep `24h|sessionTimeout|inactivity` → 0); MFA: componentes `MFASettings.tsx`/`TwoFactorSetup.tsx` existem | Confirmar config de Auth no painel |
| docs/CSP_REVISAO.md | 1. Remover `'unsafe-eval'` de `script-src` | **PENDENTE** | `vercel.json` → 1 ocorrência de `unsafe-eval` | Teste em preview + remoção |
| docs/CSP_REVISAO.md | 2. Estreitar `img-src` | **PENDENTE** | `vercel.json` → `img-src 'self' data: blob: https:` | Allowlist |
| docs/CSP_REVISAO.md | 3. Nonce/hash para `'unsafe-inline'` | **PENDENTE** | sem nonce no `index.html`/`vercel.json`; `'unsafe-inline'` presente | Decisão (aceitar risco ou implementar) |
| docs/CSP_REVISAO.md | 4. `report-uri`/`report-to` | **PENDENTE** | `grep report-to\|report-uri vercel.json` → 0 | Endpoint de telemetria |
| docs/CSP_REVISAO.md | (não listado como pendência) `connect-src`/`script-src` ainda com `lovable.app`/`lovable.dev` | **PARCIAL** | `vercel.json` cita `lovable.app`, `lovable.dev` | Avaliar remoção (origem Lovable já descontinuada: #435 removeu tabelas-resíduo) |
| docs/VALIDACAO_SEGURANCA_GATEWAY | Gates dependentes de `DATABASE_URL`/segredos: resultado "inconclusivo" se pulado | **PARCIAL (por desenho)** | `ci.yml:298-330` preflight + gates com `secrets.DATABASE_URL`; arquivos citados existem (`_shared/sql-write-guard_test.ts`, `bling-webhook/index.test.ts`, `src/lib/__tests__/edge-functions.security.test.ts`, `compare-schemas/index.ts:24-28` responde 503) | Nada no repo; depende de segredos no environment `Production` (NÃO VERIFICÁVEL daqui) |
| docs/PERFORMANCE.md | Checklist inteiro (Bundle/Runtime/Assets/Caching/Monitoring) com todas as caixas `[ ]` | **PARCIAL / doc desatualizado** | existem: lazy em `src/routes/*Pages.ts` (118 `lazy(`), `vite.config.ts:98` `manualChunks`, `:127 chunkSizeWarningLimit: 1200` (doc diz 600), `web-vitals` em `src/lib/telemetry.ts` (doc cita `src/lib/vitals.ts`, inexistente), `react-window`/`@tanstack/react-virtual` em `package.json` (uso: 2 arquivos), `public/sw.js` (sem Workbox: grep → 0; doc mostra Workbox), SW registrado em `src/main.tsx:27-42` | Metas de bundle (<500 KB JS, <100 KB CSS, Lighthouse 95+): NÃO VERIFICADO (sem build nesta sessão); Workbox/Background sync inexistentes; checklist nunca marcado |
| docs/ACCESSIBILITY.md | "Status: Em implementação"; checklist com todas as caixas `[ ]`; "Vídeos têm legendas", "Atalhos documentados", "HTML válido (W3C)" | **PARCIAL** | existem: `src/components/accessibility/SkipLinks.tsx` (doc cita `src/components/SkipLinks.tsx`), `index.html:2 lang="pt-BR"`, `axe-core`+`vitest-axe` em `package.json`, testes `src/test/a11y/critical-pages.test.tsx`, `indices-tab.test.tsx`; `focus-trap-react` não instalado (Radix cobre); sem Pa11y/Lighthouse no `ci.yml` (grep → 0) | Auditoria W3C/Lighthouse/screen reader não automatizada; itens de mídia/legendas sem evidência; "Última atualização 30/12/2025" |
| docs/TESTING.md | Diretório `tests/` com `auth-flow.spec.ts` e `visual-regression.spec.ts` | **INEXISTENTE** | `ls tests/` → não existe; E2E vive em `e2e/` (28 arquivos `*.e2e.ts`, ex.: `e2e/visual-theme.e2e.ts`, `e2e/auth/`) | Corrigir doc |
| docs/TESTING.md | Scripts `npm run test:watch`, `npm run test:integration` | **INEXISTENTE** | `package.json:31-37` tem `test`, `test:run`, `test:coverage`, `test:e2e`, `test:e2e:ui`; sem `test:watch`/`test:integration` | Corrigir doc |
| docs/TESTING.md | Cobertura mínima "Unit: 80%" | **PARCIAL** | `vitest.config.ts:62-66` thresholds `lines: 66`, `statements: 65` (comentário :54: real ~71%/70%) | Meta do doc não é a do gate |
| docs/testing-architecture.md | "Quality Gate: 85% Statement Coverage" / `test:coverage: Coverage threshold (85%)` | **PARCIAL** | `vitest.config.ts:62-66` → 66/65 | Idem |
| docs/testing-architecture.md | Título "Freight Quest Testing Architecture" | **ERRADO** | `docs/testing-architecture.md:1` — nome de outro projeto | Corrigir |
| docs/testing-architecture.md | "`bun run lint` no CI" | OK (`ci.yml:296`) — demais artefatos existem (`fuzz_test.ts`, `stress_test.ts`, `_shared/load-tester.ts`, `webhook-simulator` em `ci.yml:767`) | — | — |
| docs/DEPLOYMENT.md | "Pré-requisito Node.js 18+" | **DESATUALIZADO** | `package.json:191` `"node": ">=22.12.0"` (#411); Vercel Node `24.x` (`docs/agentes/vercel-deploy.md`) | Corrigir |
| docs/DEPLOYMENT.md | Lista de env vars do bundle | **PARCIAL** | `src/config/env.ts:19` tem `VITE_SENTRY_DSN` (opcional), ausente no doc | Adicionar |
| docs/GETTING-STARTED.md | 3 links "Vídeo: ..." para `https://youtube.com/...` | **PLACEHOLDER** | `docs/GETTING-STARTED.md` → 3 ocorrências de `youtube.com/...` | Gravar vídeos ou remover |
| docs/GETTING-STARTED.md | Integração "Banco (Open Finance)" oferecida como opcional | **PARCIAL / falso hoje** | #425: `open-finance/index.ts:54` recusa toda ação com 503 "não homologado"; botão `disabled` em `ImportarExtratoDialogArquivoLocal.tsx:133` | Remover/avisar no guia |
| docs/GETTING-STARTED.md | "Chat (canto inferior direito)" e `suporte@promo-finance.com` | **NÃO VERIFICADO** | grep `crisp|intercom|tawk|ChatWidget` em src/index.html → só falsos positivos (Tesouraria); e-mail não aparece no código | Confirmar com o dono |
| docs/MODULARIZATION_REPORT.md | "Status: 2 de 40+ concluídos" / Fase 1 restantes pendentes | **DESATUALIZADO (Fase 1 concluída)** | barrels de 5 linhas: `src/lib/brazilian-validators.ts`, `src/lib/sefaz-simulator.ts`, `src/lib/tributario/relatorio-pdf.ts`, `src/types/reforma-tributaria.ts` + diretórios homônimos + `src/lib/__tests__/{brazilian-validators,sefaz-simulator,relatorio-pdf,reforma-tributaria-types}.regression.test.ts` | Atualizar status |
| docs/MODULARIZATION_REPORT.md | Fase 2 hooks (>400 linhas) | **PENDENTE** | `useContasPagarLogic.ts` 473, `useConciliacaoPage.ts` 457, `useAsaas.ts` 406 ainda monolíticos; `useDemonstrativosContabeis.ts` 314 (abaixo da meta); `useReviewQueue.ts` não existe (renomeado/removido — `ls src/hooks \| grep -i review` → 0) | Fases 2–6: 54 arquivos `.ts/.tsx` (não-teste) com >400 linhas em `src/{pages,components,hooks,lib}` |
| docs/INVENTARIO_REPOSITORIO.md | Hooks listados inexistentes | **DESATUALIZADO** | faltam `useCRUD`, `useNotifications`, `useExportData`, `useImportData` (`ls src/hooks/<nome>.ts*` → não existe; há `usePushNotifications.ts`, `useExportarSped.ts`) | Regenerar inventário |
| docs/INVENTARIO_REPOSITORIO.md | Componentes listados inexistentes | **DESATUALIZADO** | faltam `BulkActionsBar`, `DataImporter`, `SearchInput`, `SavedFiltersDropdown`, `AdvancedFilters`, `ExportDropdown` (find → 0; existe `src/components/shared/SavedFiltersBar.tsx`) | Idem |
| docs/INVENTARIO_REPOSITORIO.md | "15 arquivos e2e", "40+ migrações", "React 18", "Lovable Cloud" | **DESATUALIZADO** | `e2e/` 28 arquivos; `supabase/migrations/` 1048 arquivos; `package.json:120` `"react": "^19.3.1"` (#474); Supabase Cloud direto | Idem |
| docs/agentes/vercel-deploy.md | Pendência: confirmar `app.promo-finance.com` no projeto Vercel | **PENDENTE / NÃO VERIFICÁVEL** | `vercel-deploy.md:18-24, 56-58` — exige MCP Vercel/painel | Dono/MCP Vercel |
| docs/agentes/github-ci.md | "Guard de perímetro (settings-guard) **não existe**" / "sem baseline commitado" / "14 workflows" | **DESATUALIZADO (item já existe)** | `.github/workflows/settings-guard.yml` e `scripts/ci/github-settings-baseline.json` existem; 19 workflows hoje (`auto-update-pr-branch.yml`, `automation-local.yml`, `estado-real.yml`, `inventario-estado.yml`, `settings-guard.yml` não constam) | Atualizar tabela (verificar se o guard está entre os checks obrigatórios: NÃO VERIFICADO — exige API de branch protection) |
| docs/agentes/fluxo-git.md | "repo não tem commitlint" (decisão em aberto) | **CONFIRMADO ABERTO** | sem `commitlint.config.*`/`.commitlintrc*`; `grep commitlint package.json` → 0; `.husky/` só `pre-commit`, `pre-push` | Decisão do dono |
| docs/contexto/regras/manual/README.md + TEMPLATE | "Comece copiando `TEMPLATE-regras-de-negocio.md` para `regras.md`" | **PENDENTE** | `ls docs/contexto/regras/manual/` → só `README.md`, `TEMPLATE-regras-de-negocio.md`; `docs/contexto/regras/` tem só `manual/` (o `07-REGRAS-DE-NEGOCIO.md` é gerado na branch `contexto`) | Dono preencher `regras.md` (seções 1–9 do template vazias) |
| docs/agentes/inventario-branches-2026-11-16.md | Branches "mantidas" com PR aberta / "conteúdo resgatado — apagar depois do merge" | **INTEGRADO** (todas) | via `gh api`: #333, #339, #344, #350, #351, #352–#359 merged 16/11; #340 fechada → substituída pela #366 (merged 16/11 15:22Z); #345 fechada sem merge, mas `supabase/migrations/20261117010000_marcar_contas_vencidas.sql` está na main; #348 fechada sem merge, mas `20261116151000_grants_authenticated_audit_por_coluna.sql` está na main; #349 fechada sem merge, mas `docs/prod-readiness.md` existe; `automation/estado-real` → `docs/ci/{kpi.json,README.md,MATRIZ_EDGE_TABELA.md}` presentes na main (#429) | Branches "resgatadas" (`Github_Copilotfeat-edge-deploy-verificacao`, `backup/codex-h0831-...`, `claude/chore-shared-helpers-...`, `claude/fix-rate-limit-functions-...`, `claude/fix-review-findings-261107-1830`, `claude/vibrant-ride-...`, `fix/codex-h111911-...`, `claude/chore-ddl-steps12-23-...`, `claude/resolve-conflicting-prs-...`) marcadas "apagar depois do merge": exclusão NÃO VERIFICADA (não listei refs remotas). `fix/codex-auditoria-financeira-20260910` e `fix/notify-alert-projeto-destino`: decisão explícita de não reaproveitar — não é pendência |
| docs/agentes/auditoria-branches-2026-11-17.md | PRs em aberto no fechamento: #426, #447, #455, #457, #371 | **INTEGRADO/FECHADO** | #426 merged 17/11 17:25Z (`8c701248`), #447 merged 20:50Z (`f76fcd21`), #455 merged 21:56Z (`ed338a2d`), #457 merged 18/11 00:41Z (`c72e283f`); #371 fechada sem merge → substituída por #460 (`fee7c1da`, merged 17/11 23:24Z); #442 fechada → recuperada em #449 (`9aa7ea65`) | Única PR aberta hoje: #475 `claude/chore-gate-26-snapshot-ci-261119-2048` (gate #26 de drift no CI) — fora destes docs |
| docs/agentes/definicao-de-pronto.md | — | sem itens verificáveis (só regras) | — | — |

**Contagem (tarefa 2):** 33 linhas listadas · PENDENTE/PLACEHOLDER/INEXISTENTE 15 · PARCIAL 9 · DESATUALIZADO (item existe, doc errado) 7 · NÃO VERIFICADO/NÃO VERIFICÁVEL 5 (SECURITY backup/MFA/timeout, GETTING-STARTED chat, vercel domínio) · branches: 100% do trabalho "a recuperar" dos dois inventários está na `main` (0 pendências de integração).

---

## Anexo — A11 — Varredura do CÓDIGO: funcionalidades esboçadas mas incompletas

Base: `/home/user/Promo_Finance_V2` (HEAD local, 2026-11-20). Somente leitura. Testes (`*.test.*`, `__tests__`, `*_test.ts`, `e2e/`, `src/test/`) excluídos de todas as contagens. "NÃO VERIFICADO" = exige consulta ao banco/vault de produção, fora do escopo desta varredura de repositório.

Observação de método: o grep por `TODO` casa com `todos` (PT-BR). Reexecutado com `\b(TODO|FIXME|HACK|XXX)\b` → só 4 ocorrências reais, 2 delas dívida de tipagem (`useOrganizacoes.ts:259`, `useBulkActions.ts:266`), nenhuma é funcionalidade faltante.

---

## Frente 1 — Marcadores (simulado / placeholder / em desenvolvimento / stub)

| Frente | Item (arquivo:linha ou nome) | Tipo | Evidência | Funcionalidade afetada |
|---|---|---|---|---|
| 1 | `src/components/analytics/BenchmarkingSetorial.tsx:20-29,129,137` | simulado em produção | `// Dados de benchmark do setor (simulados - em produção viriam de uma API)` + `const BENCHMARKS_SETOR = {inadimplencia: 5.2, ...}`; `valorEmpresa: 1.8, // Simulado`; `valorEmpresa: 7.5, // Simulado`. Renderizado em produção por `src/components/dashboard/DashboardExecutivo.tsx:173` (`case 'benchmarking': return <BenchmarkingSetorial />`, página inicial `src/pages/Index.tsx:2`) e `src/pages/BIFuturista.tsx:298` (rota `/bi`, `src/routes/analiseRoutes.tsx:35`) | Painel "Benchmarking Setorial" do dashboard executivo e do BI compara a empresa com números de mercado inventados; Liquidez Corrente e Custo Operacional da própria empresa também são fixos |
| 1 | `src/components/contas-receber/EnviarCobrancaDialog.tsx:67-69` | handler só toast | `} else { toast.info('SMS: funcionalidade em desenvolvimento'); }` — canal SMS oferecido no diálogo, sem envio | Envio de cobrança por SMS não existe; WhatsApp/e-mail apenas abrem `wa.me`/`mailto:` (sem registro no sistema) |
| 1 | `src/components/contas-receber/BaixaAutomaticaDialogCorrespondenciasAutomaticas.tsx:83-88` | handler só toast | botão "Vincular Manualmente": `// Futuro: Abrir modal de busca manual` + `toast.info('Funcionalidade de vinculação manual em desenvolvimento')` | Baixa automática: transações sem correspondência não podem ser vinculadas manualmente a partir deste diálogo |
| 1 | `src/components/reforma-tributaria/ExportacaoSPED.tsx:49-60,325` | disabled "Em breve" | `{ id: 'dctf', disponivel: false }`, `{ id: 'per-dcomp', disponivel: false }` → card com `<Badge>Em breve</Badge>`, excluídos do `<Select>` (linha 250). Página `src/pages/tributario/SpedExport.tsx` | Exportação SPED não gera DCTF nem PER/DCOMP; só EFD-IBS/CBS e EFD-Contribuições |
| 1 | `src/components/nfe/NovaNFeForm.tsx:82-86` | handler só toast (gate deliberado) | `handleSubmit` = `toast.error('Emissão indisponível: a integração SEFAZ ainda precisa ser homologada e confirmar protocolo real.')`; aviso na tela (linha 90-93) | Emissão de NF-e: formulário completo, não transmite nada |
| 1 | `src/components/nfe/CancelamentoNFe.tsx:70-80`, `InutilizacaoNFe.tsx:75-88`, `ContingenciaNFe.tsx:113,174`, `contingencia/ContingenciaPendingList.tsx:42-46` | gate deliberado ("indisponível") | mesmas mensagens "integração SEFAZ ainda precisa ser homologada"; `semIntegracao = health.online === null` (`SefazMonitor.tsx:60`, `SefazStatusBanner.tsx:54`, `ContingenciaNFe.tsx:60`). Comentários dizem que antes usavam `src/lib/sefaz-simulator` (hoje só importado como `type`) | Cancelamento, inutilização, contingência e monitor SEFAZ: telas prontas, backend SEFAZ de emissão inexistente |
| 1 | `src/components/conciliacao/RegrasConciliacaoPanel.tsx:86-110,228` | simulado em produção (declarado) | `const mockExtrato = [...]` 3 lançamentos fixos; UI avisa "extrato simulado" (linha 228) | Preview de regras de conciliação não usa extrato real da empresa |
| 1 | `supabase/functions/enviar-alerta-email/index.ts:51-69` | simulado em produção (dependente de secret) | `if (!resendApiKey) { ... mensagem: '[Email simulado para ...]' ... simulated: true }`. Idem `relatorio-diario-anomalias/index.ts:231-237`, `enviar-digest-conformidade/index.ts:319-414` (`situacao: 'simulado'`), `enviar-convite-organizacao/index.ts:167` | Sem `RESEND_API_KEY` no vault, alertas/digests/convites por e-mail são apenas registrados como "simulado". Presença do secret em produção: NÃO VERIFICADO |
| 1 | 18 Edge Functions com `Deno.env.get('LOVABLE_API_KEY')` (`conciliacao-ia`, `analyze-document`, `categorizar-despesa`, `copilot-global`, `copilot-tributario`, `expert-agent`, `analise-preditiva`, `executar-analise-preditiva`, `analise-fluxo-ia`, `insights-relatorio`, `processar-nf-ocr`, `gerar-acoes-recomendadas`, `gerar-resumo-executivo-semanal`, `calcular-health-score-operacional`, `benchmarking-setorial`, `decidir-regime`, `convidar-contador`, `whatsapp-ia-proativo`) | dependência externa possivelmente ausente | `conciliacao-ia/index.ts:141-142: if (!LOVABLE_API_KEY) throw new Error(...)`; idem `analyze-document:57`, `categorizar-despesa:75`. `comparar-benchmark-setorial/index.ts:2`: `// Substitui a versão que dependia de LOVABLE_API_KEY (ausente neste projeto)` | Todo o bloco de IA (copilot, conciliação IA, OCR, categorização, análise preditiva, resumo semanal, health score) falha se a chave não estiver no vault. NÃO VERIFICADO no vault |
| 1 | `supabase/functions/gerar-heatmap-tributario/index.ts:1`, `comparar-benchmark-setorial/index.ts:1`, `gerar-dre-tributaria/index.ts:1` | rótulo "stub" (funcional) | `// Edge: ... — versão determinística (stub)`; o código consulta o banco (ex.: `respostaSemFaturamento` em heatmap). `comparar-benchmark-setorial:26-30`: usa faixa de referência interna porque `public.benchmarks_setoriais` "esta vazia (0 linhas em 2026-11-17)" | Benchmark setorial tributário compara contra constantes internas, não contra amostra de empresas |
| 1 | `src/components/ui/resizable.tsx:4` | stub (órfão) | `// Stub components for react-resizable-panels compatibility`; zero importadores | Nenhuma (componente não usado) |
| 1 | `src/components/design-system-debug/DesignSystemAudit.tsx:378` | ação fake (debug) | `toast.promise(new Promise(r => setTimeout(r, 2000)), { loading: 'Sincronizando design tokens...' })` | Só página de debug de design system |

## Frente 2 — Handlers vazios / só toast (ações de negócio sem efeito)

| Frente | Item | Tipo | Evidência | Funcionalidade afetada |
|---|---|---|---|---|
| 2 | `src/components/nfe/NFePreview.tsx:188` | handler só toast | `<Button onClick={() => toast.success('XML da NF-e baixado com sucesso!')}>Download XML` — nenhum download. Em produção via `src/pages/NotasFiscais.tsx:19` → `NotasFiscaisAbas.tsx:45` | Download do XML da NF-e na pré-visualização não baixa arquivo |
| 2 | `src/components/nfe/NFePreview.tsx:209` | handler só toast | `onClick={() => toast.success('NF-e enviada por e-mail!')}` | "Enviar NF-e por e-mail" não envia nada |
| 2 | `src/pages/NotasFiscaisAbas.tsx:226` | handler só toast | ícone XML: `onClick={() => toast.success('XML baixado!')}` | Download de XML na lista de notas fiscais é falso |
| 2 | `src/pages/NotasFiscaisAbas.tsx:233` | handler só toast | ícone DANFE: `onClick={() => toast.success('DANFE gerado!')}` | Geração de DANFE na lista é falsa (no `NFePreview` há `setDanfeOpen(true)` real, mas aqui não) |
| 2 | `src/components/contabilidade/elisao/NovaSimulacaoElisaoDialog.tsx:88-94` | handler só toast | `<Button onClick={() => toast.info('Importando dados do diário e centros de custo...')}>Sincronizar com Contabilidade (Automático)` — nenhuma query. Usado por `ElisaoFiscalTab.tsx` | Simulação de elisão: botão "sincronizar com contabilidade" não importa dados |
| 2 | `EnviarCobrancaDialog.tsx:68`, `BaixaAutomaticaDialogCorrespondenciasAutomaticas.tsx:86` | handler só toast | ver Frente 1 | Cobrança por SMS; vinculação manual na baixa automática |
| 2 | `src/components/ui/tree-view.tsx:207` (`onChange={() => {}}`), `src/pages/dev/Especimes.tsx:446` (`onPageSizeChange={() => {}}`) | handler vazio (não negócio) | tree-view tem zero importadores; Especimes é página dev | Nenhuma |

## Frente 3 — Edge Functions órfãs (108 pastas, 106 funções + `fuzz_test.ts`/`stress_test.ts`)

Comando-base: `grep -rl -E "functions\.invoke\(['\"]NOME['\"]|functions/v1/NOME\b|['\"]NOME['\"]" src supabase/functions supabase/migrations` (excluindo a própria pasta, testes, `src/lib/arquitetura/` e `scripts/inventario`). Crons em migrations que chamam `functions/v1/`: apenas `digest-silenciamentos-erro`, `enviar-digest-conformidade`, `enviar-push-notification`, `executar-regua-cobranca`, `monitor-health`, `notify-performance-alert`, `send-push-notification`, `whatsapp-ai-analyzer`. Jobs criados direto no banco (fora de migrations): NÃO VERIFICADO.

| Frente | Item | Tipo | Evidência | Funcionalidade afetada |
|---|---|---|---|---|
| 3 | `calcular-slo-metrics-diario` | edge órfã | 0 invocadores; só `.github/workflows/functions-deploy.yml:25`. Cabeçalho: "Agrega métricas das últimas 24h e persiste snapshot em slo_metrics_diarias". `verify_jwt = true`, exige `exigirChamadaInterna` | Painel de SLO nunca recebe snapshot diário |
| 3 | `enviar-relatorios-tributarios-agendados` | edge órfã | 0 invocadores; cabeçalho `index.ts:3: // Cron diário 06:00 — drena agendamentos vencidos, gera PDF e envia por e-mail`; nenhum `cron.schedule` a menciona | Relatórios tributários agendados nunca são enviados |
| 3 | `relatorio-diario-anomalias` | edge órfã | 0 invocadores (só deploy yml:90) | Relatório diário de anomalias por e-mail nunca dispara |
| 3 | `sefaz-dfe-dispatcher` → `sefaz-dfe-puxar` | edge agendada em prod (não órfã) | cron `sefaz-dfe-dispatcher-15min` ativo em prod (P-09:229; §9.2:286); `index.ts:242` invoca `sefaz-dfe-puxar`; ausência da definição nas migrations é problema de reprodutibilidade, não cadeia órfã | Sucesso da captação permanece não verificado (NF-08: conferir `net._http_response`) |
| 3 | `sync-profile-to-bitrix` | edge órfã | 0 invocadores em src/functions/migrations (nenhum trigger/webhook de banco a referencia) | Sincronização de perfil de usuário para o Bitrix24 não acontece |
| 3 | `n8n-dispatch` | edge órfã | 0 invocadores; cabeçalho "Roteia eventos para workflows n8n"; só docs | Disparo de eventos para automações n8n nunca é chamado pelo sistema |
| 3 | `executar-analise-preditiva` | edge órfã | só `scripts/ci/test_scripts_shell.py`, `deno-check-functions.sh`, `deno-tests.yml`; `verify_jwt = false` + `exigirChamadaInterna` (cron interno previsto) | Execução agendada da análise preditiva nunca roda |
| 3 | `gerar-alertas-dispatcher` | edge órfã | só `scripts/inventario/*`; cabeçalho "consolida alertas em um único endpoint com dispatch por tipo"; `verify_jwt = false` | Endpoint consolidado de alertas sem chamador (os alertas individuais têm seus próprios invocadores) |
| 3 | `get-mapbox-token` | edge órfã | só `scripts/integrity/04_endpoints.sh`; `grep -il mapbox src` = 0 arquivos | Nenhuma tela usa mapa; secret `MAPBOX_ACCESS_TOKEN` sem uso real |
| 3 | `calculo-iva`, `projecao-reforma`, `simular-simples`, `simular-presumido`, `simular-real` | edge órfã (duplicada) | 0 invocadores; frontend usa `src/lib/tributario/{projecao-reforma,simular-*}.ts` (`src/lib/tributario/index.ts:7-12`, `decidir-regime.ts:4-6`) | Cálculos tributários rodam só no navegador; as 5 edges são cópias mortas |
| 3 | `ci-security-gate-log`, `compare-schemas`, `mcp-query`, `n8n-callback` | não órfã (chamador externo) | invocadas por CI (`scripts/security/*`, `.github`), cliente MCP externo e n8n | — (listadas por transparência) |
| 3 | `supabase/config.toml` × pastas | sem divergência | 106 `[functions.X]` = 106 pastas (`comm` vazio nos dois sentidos) | — |

## Frente 4 — Hooks órfãos (231 arquivos em `src/hooks/`, subpastas incluídas)

| Frente | Item | Tipo | Evidência | Funcionalidade afetada |
|---|---|---|---|---|
| 4 | `src/hooks/useGlobalFilterSync.ts` | hook órfão | único importador: `src/hooks/__tests__/useGlobalFilterSync.test.ts`. Corpo: ouve `current-empresa-changed` e dispara `toast.info('Filtros sincronizados')` | Aviso "filtros mantidos ao trocar de empresa" nunca aparece; o hook também não sincroniza nada (só toast) |

Todos os demais 230 hooks têm ≥1 importador fora de testes.

## Frente 5 — Páginas e componentes órfãos

Páginas: 124 arquivos `.tsx` em `src/pages/` (profundidade ≤2). 63 não aparecem em `src/App.tsx`/`src/routes/*`, mas **todos** são sub-componentes importados pela página-mãe (ex.: `ConciliacaoConteudo.tsx` ← `Conciliacao.tsx`; `tributario/Alertas.tsx` ← `IpiSimulador.tsx`). **0 páginas órfãs.**

Componentes com zero importadores: 47 arquivos. 33 são kit `src/components/ui/*` sem uso (`currency-input`, `date-range-picker`, `sidebar`, `pagination`, `rich-text-editor`, `tag-input`, `carousel`, `wizard`, `drawer`, `modal`, `file-upload`, `status-badge`, `input-otp`, `chart`, `phone-input`, `search-input`, `sonner`, `menubar`, `resizable`, `resizable-panels`, `hover-card`, `navigation-menu`, `context-menu`, `data-grid`, `radio`, `tree-view`, `collapse`, `data-table`, `aspect-ratio`, `split-button`, `confirmation-dialog.hooks`, `command.hooks`, `action-button.hooks`, `lazy-load.utils`). Os de negócio:

| Frente | Item | Tipo | Evidência | Funcionalidade afetada |
|---|---|---|---|---|
| 5 | `src/components/integracoes/BitrixWebhookPanel.tsx` | componente órfão | 0 importadores; único leitor de `.from('bitrix_webhook_events')` no app | Painel de eventos de webhook do Bitrix24 existe mas não está em nenhuma tela |
| 5 | `src/components/nfe/SefazStatusPanel.tsx` | componente órfão | 0 importadores; importa `SefazResponse` de `@/lib/sefaz-simulator` | Painel de status de transmissão SEFAZ (do antigo simulador) morto |
| 5 | `src/components/admin/FiscalHealthBadge.tsx` | componente órfão | 0 importadores; consome RPC `get_catalogos_tributarios_health` | Badge de saúde fiscal no cabeçalho admin nunca aparece |
| 5 | `src/components/contabilidade/SpedEcdDownloadStep.tsx` | componente órfão | 0 importadores (download real está em `SpedEcdWizardStep3.tsx:65`) | Duplicata morta do passo de download SPED ECD |
| 5 | `src/components/reforma-tributaria/KPIComparativo.tsx` | componente órfão | 0 importadores; `// KPI COM COMPARATIVO TEMPORAL` | KPI com comparativo temporal da Reforma não exibido |
| 5 | `src/components/tributario/pf/ResultadoPf.tsx` | componente órfão | 0 importadores; `// RESULTADO DA SIMULAÇÃO PF — Lei 15.270/2025` | Resultado da simulação IRPF não renderizado (verificar se o simulador PF tem outra tela de resultado) |
| 5 | `src/components/charts/RechartsExample.tsx` | componente órfão | 0 importadores | Exemplo; nenhuma |
| 5 | `src/components/layout/EmpresaSwitcher.tsx`, `src/components/empresa/EmpresaActionPicker.tsx`, `src/components/auth/PermissionGate.hoc.tsx`, `src/components/quick-create/QuickCreateModal.hooks.tsx`, `src/components/tributario/calculadora/schemas.ts`, `src/components/layout/page-transition.constants.ts` | provável órfão | 0 `import` por caminho de arquivo; nome aparece só em comentários/texto de outros arquivos | Seletor de empresa alternativo e HOC de permissão não usados |

## Frente 6 — Tabelas órfãs (262 `CREATE TABLE` vivas nas migrations; 36 dropadas)

Método: tabela sem `.from('X')`/`.from("X")`/`.from<T>('X')` em `src/` e `supabase/functions/`; depois conferido se alguma função SQL/trigger/cron em migrations faz DML nela (`INSERT INTO|FROM|JOIN|UPDATE|DELETE FROM X`). Falsos positivos descartados após conferência: `protestos` (`src/hooks/useProtestos.ts:8`), `performance_alerts` (realtime + 32 DML), `regras_roteamento_financeiro` (`useEmpresasConfig.ts:82`, `.from<T>`), `elisao_regras_creditos` (join em `ElisaoFiscalTab.tsx:77`), `bitrix24_activities` (`n8n-callback/index.ts:171`), `protocolos_st` (RPC, 16 DML), `audit_logs_2026_11` (partição).

**6a. Sem consumidor algum (nem app, nem SQL):**

| Frente | Item | Tipo | Evidência | Funcionalidade afetada |
|---|---|---|---|---|
| 6 | `alerts_sent` | tabela órfã | criada em `20260825110000_reconciliar_schema_v3_completo.sql`; 0 `.from`, 0 DML | Histórico de alertas enviados não é gravado nem lido |
| 6 | `bitrix24_stage_mappings` | tabela órfã | idem v3; 0/0 | Mapeamento de etapas Bitrix24 sem tela nem edge |
| 6 | `bitrix24_tokens` | tabela órfã | idem v3; 0/0 | Tokens OAuth do Bitrix não persistidos nesta tabela (integração usa env `BITRIX24_ACCESS_TOKEN`) |
| 6 | `custom_field_values` | tabela órfã | `20260519124706_*.sql`; 0/0 | Campos personalizados: valores nunca gravados |
| 6 | `email_verifications` | tabela órfã | v3; 0/0 | Verificação de e-mail própria não implementada |
| 6 | `mfa_sessions` | tabela órfã | v3; 0/0 | Sessões MFA customizadas não usadas |
| 6 | `operacoes_icms` | tabela órfã | `20260728154320_*.sql`; 0/0 | Registro de operações ICMS sem funcionalidade |
| 6 | `projecoes_reforma` | tabela órfã | `20260728154320_*.sql`; 0/0 | Projeções da Reforma não são salvas (cálculo só em memória no front) |
| 6 | `regras_duplicidade` | tabela órfã | `20260519131227_*.sql`; 0/0 | Regras configuráveis de duplicidade sem UI |
| 6 | `regua_cobranca_etapas` | tabela órfã | `20260518171156_*.sql`; 0/0 | Etapas da régua de cobrança nesta tabela não são usadas (régua usa outra estrutura) |
| 6 | `risk_rules` | tabela órfã | v3; 0/0 | Regras de risco sem consumidor |
| 6 | `security_audit_logs` | tabela órfã | `20260711164723_create-security-tables-stub.sql` ("Tabelas criadas fora do sistema de migrations em produção"); 0/0 | Log de auditoria de segurança separado nunca alimentado |
| 6 | `simulacao_tributos_detalhados` | tabela órfã | `20260728154320_*.sql`; 0/0 | Detalhamento de simulação tributária não persistido |
| 6 | `user_passkeys`, `webauthn_challenges` | tabela órfã | v3; 0/0. `WebAuthnManager.tsx:140` exibe "registro de novos dispositivos temporariamente indisponível" | Login por passkey/WebAuthn: tabelas criadas, fluxo não implementado |
| 6 | `webhook_events` | tabela órfã | `20260711152457_create-webhook-events-stub.sql` (shim); 0/0 | Fila genérica de eventos de webhook sem produtor/consumidor |

**6b. Sem consumidor no app; só referenciada por SQL (policy, função, cron, seed) — dados invisíveis ao usuário:**

| Frente | Item | Tipo | Evidência | Funcionalidade afetada |
|---|---|---|---|---|
| 6 | `alert_configurations` | tabela órfã (só seed) | `20260712223141_stub-alerts-tables.sql`; 1 `INSERT INTO` seed; 0 `.from` | Configuração de alertas não editável nem lida pelo app |
| 6 | `geo_blocks`, `ip_whitelist`, `user_devices` | tabela órfã (só policy) | `create-security-tables-stub.sql`/v3; única referência SQL é subselect em policy | Bloqueio geográfico, whitelist de IP e dispositivos confiáveis: sem tela, sem edge que grave |
| 6 | `password_reset_tokens` | tabela órfã (só função SQL) | 3 DML em funções; 0 `.from` | Reset de senha custom não exposto (app usa Supabase Auth) |
| 6 | `regimes_tributarios` | tabela órfã (só função SQL) | 3 `FROM public.regimes_tributarios r` em funções; 0 `.from` | Cadastro de regimes tributários sem manutenção pelo app |
| 6 | `runtime_error_logs` | tabela órfã (só retenção) | `create-runtime-error-logs-stub.sql`; único DML: `DELETE ... < now() - 30 days` | Log de erros de runtime: só limpeza, nenhum produtor/leitor |
| 6 | `acessos_suspeitos` | consumidor RPC/admin (não órfã) | 30 DML em funções/triggers; painel admin `AcessosSuspeitosPanel.tsx:92` via RPC `get_acessos_suspeitos` (migration `20260729152318_...sql:1`; teste `AcessosSuspeitosPanel.test.tsx:32`) | Painel real de acessos suspeitos em Admin Telemetria |
| 6 | `bloat_snapshots`, `index_usage_snapshots`, `indices_uso_excecoes`, `pg_stat_statements_baseline`, `slow_query_alerts`, `rpc_observability_metrics` | tabela órfã (só SQL) | DML por crons de manutenção (`pgss-weekly-baseline`, etc.); 0 `.from` | Telemetria de banco coletada sem painel no app |
| 6 | `catalogos_fiscais_cargas` (órfã por enquanto); `catalogos_tributarios_health_history` (consumidor RPC/admin) | t. cargas órfã (só SQL) | 12 e 6 DML; `catalogos_tributarios_health_history` tem painel admin `CatalogosTributariosHealthPanel.tsx` + `CatalogosTributariosHistoryPanel.tsx:52` via RPC `get_catalogos_tributarios_history` (migration `20260728130413_...sql:121`); t. cargas sem painel | Histórico de saúde dos catálogos visível; cargas seguem invisíveis |
| 6 | `cnpja_rate_limit` | tabela órfã (só SQL) | `20261117195500_restaura_cnpja_rate_limit.sql`; 4 DML | Rate limit CNPJá só via função SQL |
| 6 | `drivers` | tabela órfã (só policy) | v3; 13 referências, todas em arrays de policies (`driver_approval_queue`, `driver_evaluations`, `driver_incidents`) | Módulo "motoristas" inteiro (drivers + 3 tabelas filhas) sem nenhuma tela ou edge |
| 6 | `estrategias_elisao` | tabela órfã (só SQL) | 5 DML (`count(*)` em funções); 0 `.from` | Catálogo de estratégias de elisão não exibido |
| 6 | `frontend_error_silence_digest_log` (órfã por enquanto); `retencao_politicas` (consumidor RPC/admin) | t. log órfã; retenção com painel | 8 e 9 DML; `retencao_politicas` tem painel admin `RetentionPoliciesPanel.tsx:81` (via RPC `get_retencao_politicas_status`, migration `20260730125918_...sql:1`) e `RetentionHistoryPanel.tsx`; t. log sem UI | Políticas de retenção com UI; log de silenciamentos segue sem UI |
| 6 | `sessoes_conciliacao` | tabela órfã (só policy/função) | 4 DML; 0 `.from` | Sessões de conciliação não são criadas pelo app |
| 6 | `simulacoes` | tabela órfã (só SQL) | 8 DML; app usa `elisao_simulacoes_regime` (`ElisaoFiscalTab.tsx:48`) e `regimes_simulados` | Tabela genérica de simulações sem consumidor |

## Frente 7 — Rotas "em construção" / só card de aviso

| Frente | Item | Tipo | Evidência | Funcionalidade afetada |
|---|---|---|---|---|
| 7 | — | nenhuma rota em construção | `grep -riE "em construção|EmConstrucao|ComingSoon|UnderConstruction" src/App.tsx src/routes src/pages` = 0; `grep "<Navigate" src/routes src/App.tsx` = 0. Páginas de ≤31 linhas (`Contratos`, `AssinaturaDigital`, `ComprovanteOCR`, `MetasFinanceiras`, `tributario/*`) são wrappers `MainLayout + <XPanel/>` | — |
| 7 | `/tributario/sped-export` (`ExportacaoSPED.tsx`) e telas NF-e (`NovaNFeForm`, `CancelamentoNFe`, `InutilizacaoNFe`, `ContingenciaNFe`) | rota com funcionalidade parcialmente bloqueada | ver Frente 1 | DCTF/PER-DCOMP "Em breve"; emissão/cancelamento NF-e "indisponível até homologação" |

## Frente 8 — Feature flags e variáveis de ambiente

| Frente | Item | Tipo | Evidência | Funcionalidade afetada |
|---|---|---|---|---|
| 8 | `src/lib/feature-flags.ts` | inexistente | `ls src/lib/feature-flags.ts src/config/*flag*` = nada; `grep import.meta.env.VITE_(FEATURE|ENABLE|FLAG)_` = 0 | Não há sistema de feature flags no frontend |
| 8 | `INTEGRACOES_DESATIVADAS` (edge) | kill-switch | `supabase/functions/_shared/resilience.ts:121-146`: lista CSV → 503 imediato; usado em 9 edges (`asaas-proxy`, `bling-proxy`, `open-finance`, `bitrix24-sync`, `n8n-dispatch`, `sync-profile-to-bitrix`, `sincronizar-anomalia-bitrix24`, `enviar-bitrix24-tributario`, `log-sped-bitrix24`) | Integrações podem estar desligadas em produção sem sinal no código. Valor atual: NÃO VERIFICADO |
| 8 | `MFA_ADMIN_ENFORCED` (edge) | flag | 3 arquivos em `supabase/functions` | Enforce de MFA para admin opcional por env. Valor: NÃO VERIFICADO |
| 8 | `ENABLE_PRODUCTION_SIMULATION_AUDIT` (CI var) | flag desligada por padrão | `.github/workflows/ci.yml:760: if: ... && vars.ENABLE_PRODUCTION_SIMULATION_AUDIT == 'true'`; `env.manifest.json`: `required: false` | Auditoria de simulação em produção só roda se a var for setada no GitHub |
| 8 | `ENABLE_AUTHENTICATED_VISUAL_SNAPSHOTS` (CI var) | flag desligada por padrão | `.github/workflows/ci.yml:721`; `required: false` | Snapshots visuais autenticados desligados por padrão |
| 8 | `env.manifest.json` — `consumers: []` | limitação do gerador | 85 vars; **todas** as 80 de escopo `edge`/`ci` têm `consumers: []` (gerador só rastreia `src/`). Conferido no código: `LOVABLE_API_KEY` 18 edges, `OPENAI_API_KEY` só `whatsapp-ai-analyzer:48`, `OPEN_FINANCE_CLIENT_ID` `open-finance:32`, `MAPBOX_ACCESS_TOKEN` só `get-mapbox-token:11` (edge órfã) | `MAPBOX_ACCESS_TOKEN` é a única var cujo único consumidor é código morto |

---

## Contagens

| Frente | Resultado |
|---|---|
| 1 Marcadores | 4 TODO reais (0 funcionais); 12 itens relevantes: 2 dados simulados em produção (`BenchmarkingSetorial`, `RegrasConciliacaoPanel` preview), 2 "em desenvolvimento" (SMS, vincular manualmente), 2 "Em breve" (DCTF, PER/DCOMP), 5 telas NF-e bloqueadas por falta de homologação SEFAZ, 4 edges com modo "simulado" sem `RESEND_API_KEY`, 18 edges dependentes de `LOVABLE_API_KEY` |
| 2 Handlers só toast | 7 ações de negócio sem efeito (NFePreview ×2, NotasFiscaisAbas ×2, elisão sincronizar, SMS, vincular manualmente) |
| 3 Edge Functions | 106 funções; **13 órfãs** (`calcular-slo-metrics-diario`, `enviar-relatorios-tributarios-agendados`, `relatorio-diario-anomalias`, `sync-profile-to-bitrix`, `n8n-dispatch`, `executar-analise-preditiva`, `gerar-alertas-dispatcher`, `get-mapbox-token`, `calculo-iva`, `projecao-reforma`, `simular-simples`, `simular-presumido`, `simular-real`); 4 com chamador externo legítimo; config.toml × pastas: 0 divergências |
| 4 Hooks | 231 verificados; **1 órfão** (`useGlobalFilterSync`) |
| 5 Páginas/componentes | **0 páginas órfãs** (124); **47 componentes** sem importador: 33 kit UI, 7 de negócio, 7 utilitários/prováveis |
| 6 Tabelas | 262 vivas; **17 sem consumidor algum** (6a) + **~28 só com referência SQL, invisíveis ao app** (6b, incl. módulo `drivers` com 4 tabelas) |
| 7 Rotas em construção | 0 rotas placeholder; 2 rotas com bloqueio parcial (SPED tipos "Em breve", NF-e sem homologação) |
| 8 Flags/env | 0 feature flags no front; 1 kill-switch de integrações; 2 flags CI desligadas por padrão; 1 secret (`MAPBOX_ACCESS_TOKEN`) consumido só por código morto |

---

## Anexo — A12 — Auditoria dos documentos de planejamento na raiz do repo

HEAD auditado: `a406e993` (clone raso, 50 commits — merges antigos (#184/#196/#217/#218/#221) não aparecem no `git log`; verificação feita pelo estado do código, não pelo histórico). Data: 2026-11-20. Só itens PENDENTES / PARCIAIS / DIVERGENTES; o que está FEITO e confere não entra nas tabelas (resumo de contagem no fim).

Legenda de status: FEITO · PARCIAL · NÃO FEITO · MARCADO FEITO, NÃO ENCONTRADO (o doc diz "✅" mas o código não confirma) · NÃO VERIFICADO (depende de ambiente externo não acessível nesta sessão: vault Supabase, runs do GitHub, build local sem `node_modules`).

---

## 1. PENDENCIAS.md (308 linhas)

| Doc | Item | Status | Evidência | O que falta |
|---|---|---|---|---|
| PENDENCIAS §1 | Secret `PROD_DB_URL` + `SUPABASE_ACCESS_TOKEN` para `prod-migrate` real | **FEITO (pós-doc)** | `github_list_actions_secrets`: `PROD_DB_URL` (created 2026-11-13), `SUPABASE_ACCESS_TOKEN` (2026-09-10) existem. Env `Production-Ops` com `required_reviewers=adm01-debug` (`github_list_environments`). `prod-migrate.yml:45-73` job `check-secrets` sem environment + `migrate` com `environment: Production-Ops` (l.81) | Doc desatualizado: diz "migrations reais aguardam configuração dos secrets". Nada falta no código. |
| PENDENCIAS §2 | Secrets de staging: `STAGING_DB_URL`, `STAGING_PROJECT_REF`, `STAGING_ANON_KEY`, var `REQUIRED_SECRETS`, `TEST_ADMIN_JWT` | **NÃO FEITO** (pendente) | `github_list_actions_secrets` = 14 nomes, nenhum `STAGING_*` nem `TEST_ADMIN_JWT`; `github_list_actions_variables` = 4 (sem `REQUIRED_SECRETS`). `staging-migrate.yml:30-63` `check-secrets` skipa gracioso (workflow verde, mas nunca executa). `scripts/staging-migrate.sh:95` exige as 6 vars | Decidir: criar projeto de staging + secrets, ou arquivar `staging-migrate.yml` (o próprio doc oferece essa saída, l.78). |
| PENDENCIAS §2/§5 | GitHub Variable `REQUIRED_SECRETS` (CSV do manifesto) | **NÃO FEITO** | Variables: `ENABLE_PRODUCTION_SIMULATION_AUDIT`, `PROD_PROJECT_REF`, `VITE_SUPABASE_PROJECT_ID`, `VITE_SUPABASE_URL` — sem `REQUIRED_SECRETS`. `migrate-functions.sh:125-134` cai no fallback do manifesto | Opcional (fallback funciona). Lista derivada hoje tem **33** nomes (não 29): entraram `ASAAS_WEBHOOK_TOKEN`, `CI_GATE_LOG_SECRET`, `MCP_SECRET`, `REGUA_CRON_SECRET`, `VAPID_PRIVATE_KEY`, `VAPID_PUBLIC_KEY`; saíram `SCHEMA_COMPARE_EXTERNAL_*` (`jq` sobre `env.manifest.json`). |
| PENDENCIAS §3 | GHSA zod: mitigação `.max()` em `conciliacao-ia`, `ExpertAgent`, `CategorizarDespesa` | PARCIAL (verificação) | `supabase/functions/conciliacao-ia/index.ts:34-36` `.max(500/500/200)` ✓. `ExpertAgent*`/`CategorizarDespesa*` em `src/`: grep `.max(` com `-l` não retornou arquivo | Confirmar se os schemas ExpertAgent/CategorizarDespesa ainda existem com `.max()` (não localizados por nome de arquivo). |
| PENDENCIAS §3 | Fix completo = migrar zod v3→v4 (frontend ~24 arquivos + ~42 `index.ts` com `deno.land/x/zod@v3.22.4` + `_shared/zod.ts`) | **PARCIAL** | Frontend: `package.json:138` `"zod": "^4.6.7"` ✓ (CVE fechado no front; Dependabot alerts abertos = 0 via API). Edge: `grep -rl deno.land/x/zod@v3` = **44 arquivos**; `_shared/zod.ts:14` ainda `export { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'`; só 22 funções importam `_shared/zod`; ainda há `npm:zod@3.23.8` (4) e `zod@3.23.8` (1) | Edge functions seguem em zod v3.22.4 com 3 especificadores divergentes — o "projeto separado" não aconteceu. |
| PENDENCIAS §3 | Dependabot × `bun.lock` (`misconfigured_tooling`) | NÃO VERIFICADO (externo) | `.github/dependabot.yml` `package-ecosystem: bun` ✓. Runs históricos não reexecutáveis | Limitação GitHub; sem ação de código. |
| PENDENCIAS §4 | Copilot Code Review HTTP 402 (cota) | NÃO VERIFICADO (billing externo) | Nenhum workflow no repo controla isso | Fora do código. |
| PENDENCIAS §5 | Vault Supabase com 29 secrets ausentes (`functions-deploy`) | NÃO VERIFICADO (vault não acessível nesta sessão — MCP oficial do projeto não disponível) | `functions-deploy.yml:4` só `workflow_dispatch`, `:138` `environment: Production-Ops`, `:179` `STOP_ON_FAIL: "1"` ✓ (código conforme doc) | Confirmar via `supabase secrets list` no projeto `bwwbeyolnnzppeuhgkcd`; a lista obrigatória cresceu para 33. |
| PENDENCIAS §6a | PR #201 `fix/ci-workflows` mergear quando runners voltassem | NÃO VERIFICADO | Clone raso não contém o merge; conteúdo da PR era só docs (PENDENCIAS/RELATORIO_CI), e esses arquivos estão na raiz com o texto descrito | Sem impacto de código. |
| PENDENCIAS §6b | Baseline local (`lint:strict` falha com 74 warnings) | NÃO VERIFICADO | `node_modules/.bin/{eslint,vitest,tsc}` ausentes nesta sessão | Doc afirma CI usa `bun run lint` e `lint:strict` falharia; AGENTS.md exige `lint:strict` — divergência de gate a resolver. |
| PENDENCIAS (hist.) | schema-drift guards `PROD_DB_URL`/`SUPABASE_ACCESS_TOKEN`/`PROD_PROJECT_REF` + `gh pr create` degradado | FEITO | `schema-drift.yml:49-54,126-136,173-178` | — |
| PENDENCIAS (hist.) | Migrations `20261002093000`, `20261004220000`, `20261012160000`, `20261013120000`, `20261013160000` | FEITO (arquivos) | `ls supabase/migrations` lista as 5 | Aplicação em prod NÃO VERIFICADA nesta sessão. |
| PENDENCIAS (hist.) | dompurify 3.4.17 | FEITO | `package.json` `"dompurify": "3.4.17"` | — |

---

## 2. RELATORIO_IMPLEMENTACAO_EXAUSTIVO.md (180 linhas)

| Doc | Item | Status | Evidência | O que falta |
|---|---|---|---|---|
| RIE §2 P5 | `CommandPalette.tsx` "682 linhas reescritas" | DIVERGENTE (FEITO, refatorado) | `src/components/command-palette/CommandPalette.tsx` = **197 linhas**; lógica dividida em `commandPaletteManagement.ts`, `commandPaletteNavigation.ts`, `commandPalette.types.ts`; `velaPop` em `CommandPalette.tsx:99` ✓ | Só o número do doc está obsoleto. |
| RIE §2 P6 | `ThemeContext` substitui `next-themes` | FEITO | `src/components/theme/ThemeContext.ts`, `ThemeProvider.tsx:2,57`; `grep from 'next-themes'` = 0 | — |
| RIE §3.1 / §8.4 | Remoção da dep `next-themes` (chore opcional) | **NÃO FEITO** | `package.json` `"next-themes": "^0.4.6"` ainda presente; 0 imports | Dep morta. |
| RIE §5.1 | `Grainient.tsx` "não utilizado" (aurora antiga com `ogl`) | FEITO (removido) + **dep `ogl` morta** | `find src -name Grainient*` = nada; `grep from 'ogl'` = 0; `package.json` `"ogl": "^1.0.11"` ainda em `dependencies` | Remover `ogl`. |
| RIE §3.1 | Nomenclatura estilizada ("Quantum-Sentinel", "Global Vault Cleared", "Quantum-Aging") — "aguardando decisão produto" | **NÃO FEITO** (ainda no código) | `sidebarFiscalNavGroup.ts:34` `'Quantum-Sentinel: Tributário'`, `SidebarNavGroups.tsx:110`, `SistemaTab.tsx:227`, `Configuracoes.tsx:240`, `Relatorios.tsx:70` | Decisão de produto pendente desde 2026-08-25. |
| RIE §3.1 | Hex residuais (~118) em bespoke fora da amostra | PARCIAL (sob demanda) | `grep -rhoE '#[0-9a-fA-F]{6}' src --include=*.ts(x)` = **177** ocorrências | Backlog "sob demanda" segue aberto; contagem maior que a reportada. |
| RIE §3.1 | TabsContent×`h-full` (10 arquivos candidatos) | PARCIAL (sob demanda) | 7 arquivos `.tsx` hoje contêm `TabsContent` e `h-full` | Varredura preventiva não feita. |
| RIE §3.1 | Reorganização menu Fiscal 27 itens (D4) | **NÃO FEITO** | `sidebarFiscalNavGroup.ts` tem 42 `label:` / 41 rotas — cresceu | Fora do escopo do restyle; segue aberto. |
| RIE §4 | Dívida graphify-out removida do índice git | **PARCIAL** | `.gitignore:61` `graphify-out/` ✓, mas `git ls-files graphify-out` = 2 arquivos rastreados (`GRAPH_REPORT.md`, `manifest.json`) | Ou `git rm --cached` dos 2 ou exceção explícita no `.gitignore` (AGENTS §8 usa `graphify-out/graph.json` como grafo upstream — alinhar). |
| RIE §8.1 | Smoke `npm run build` em CI | FEITO | `ci.yml:469` `bun run build` | — |
| RIE §6 G2/G3 | Espécimes `/__especimes` DEV-only | FEITO | `src/App.tsx:70` `{import.meta.env.DEV && <Route path="/__especimes" .../>}`; `src/pages/dev/Especimes.tsx` (496 l.) com zonas Z0–Z3 (l.452-468) | Rota legada `/design-system-debug` (`App.tsx:35,69`) — HANDOFF a declara "deprecada" mas continua registrada em produção. |
| RIE §2 P0 | Remap tokens legados → `var(--bg-0)` etc. | FEITO (forma diferente) | `index.css:147-213` legados redefinidos como **HSL equivalentes** (`--background: 230 25% 5%`), não `var(--bg-0)` como planejado; tokens Vela `--bg-0..3/--line/--t0..2/--acc/--ok/--warn/--bad/--info` em `index.css:10-79`; `--font-body: 'Plus Jakarta Sans'` l.144 | Só divergência de implementação. |
| RIE §6 G8 | `--ch1..5` paleta charts | PARCIAL (verificar definição) | `chartColors.ts:2` usa `var(--ch1..5)`; `grep -- '--ch1' src/index.css` = **0** — variáveis `--ch1..5` **não definidas** em `src/index.css` | Se não estiverem definidas em outro CSS (`src/components/theme/high-contrast.css`?), as séries caem em cor vazia. **Verificar em runtime.** |
| RIE §2 P3/P3-ext | Dashboards com StatCard/ChartContainer | FEITO | `grep from '@/components/motion'`: `EmpresaKpis`, `ConciliacaoDashboard`, `HeroKPIs`, `ReceberKpis`, `ContasPagarKPIs`; charts: `EmpresaCharts`, `ReceberKpis`, `ReceberCharts` | — |
| RIE §2 P1/P2 | Aurora CSS + `vela-page-enter` | FEITO | `src/components/effects/AuroraBackground.tsx` (usado em `Auth.tsx:6,50,78`); keyframes `velaAur1..4` `index.css:463-487`; `MainLayout.tsx:117` `vela-page-enter` | — |
| RIE §1 | xlsx vendored | FEITO | `vendor/xlsx-0.20.3.tgz` (2.4 MB); `package.json` `"xlsx": "file:vendor/xlsx-0.20.3.tgz"` | — |

---

## 3. Projeto Vela Dark / Metronic V9

### 3a. EXECAO_RESTYLE_METRONIC_V9.md (118 linhas)

| Doc | Item | Status | Evidência | O que falta |
|---|---|---|---|---|
| METRONIC | Toda a exceção (paleta zinc, chart-1..5, layout-1 Metronic) | **SUPERSEDIDO** (não implementado) | `EXECAO_VELA_DARK.md:9-11` D8 troca o alvo para Vela-dark; `index.css` não tem paleta zinc Metronic | Doc histórico. |
| METRONIC | Assinatura do dono | NÃO FEITO | `[ ] Aprovo…` / `Assinatura: ___` em branco | Irrelevante (superado por Vela). |
| METRONIC "Delimitação temporal" | Mover o documento para `docs/` ao término | **NÃO FEITO** | Arquivo continua em `/home/user/Promo_Finance_V2/EXECAO_RESTYLE_METRONIC_V9.md` | Mover para `docs/archive/`. |
| METRONIC | Referências a `HERMES.md`, `src/tailwind.config.ts` | DIVERGENTE | `HERMES.md` não existe na raiz; `tailwind.config.ts` fica na raiz, não em `src/` | Só precisão do doc. |

### 3b. EXECAO_VELA_DARK.md (137 linhas)

| Doc | Item | Status | Evidência | O que falta |
|---|---|---|---|---|
| VELA crit. 1 | 22 tokens Vela em `index.css` + keyframes | FEITO | `index.css:10-79` tokens; keyframes `velaUp/Pop/Fade/Spin/Pulse/Shimmer/Rise/Draw/GrowY/Reveal/Aur1-4` (l.251-487) | — |
| VELA crit. 2 | Fontes Jakarta + JetBrains Mono (Google Fonts) | FEITO | `index.html:46` | Ainda carrega `Outfit` (fonte legada D9 pedia troca) — `tailwind.config.ts:23` `heading` ainda cita Outfit. |
| VELA crit. 3 | Variants CVA (button, badge, nav-menu, toggle) | FEITO | 4 arquivos `*.variants.ts` com `bg-acc`/`rounded-vela` | — |
| VELA crit. 4 | `chart.tsx` re-tematizado com `--ch1..5` | **PARCIAL** | `src/components/ui/chart.tsx` sem referência a `--ch`; paleta só em `src/components/charts/chartColors.ts`; `--ch1..5` não definidos em `index.css` (ver RIE acima) | Definir `--ch1..5` (ou confirmar onde estão) e tematizar `ui/chart.tsx`. |
| VELA crit. 7 | `src/components/motion/` | FEITO | `AnimatedNumber.tsx`, `StatCard.tsx`, `index.ts` | — |
| VELA crit. 8/9 | "50 páginas formulaicas" / "18 bespoke recompostas" | NÃO VERIFICADO (visual) | Sem harness Playwright nesta sessão | Aceite visual documentado só em RELATORIO_ACEITE (10 telas). |
| VELA "Delimitação temporal" 2 | Mover `EXECAO_VELA_DARK.md` para `docs/` | **NÃO FEITO** | Arquivo continua na raiz | Mover para `docs/archive/`. |
| VELA "Delimitação temporal" 1 | Regra "não editar `src/components/ui/`" restaurada | FEITO (texto) | `AI_RULES.md:16,71` mantém a proibição | — |
| VELA | `SECURITY_RULES.md`, `HERMES.md` citados | PARCIAL | `SECURITY_RULES.md` existe; `HERMES.md` **não existe** | Referência quebrada. |

### 3c. HANDOFF_VELA_DARK.md (227 linhas)

| Doc | Item | Status | Evidência | O que falta |
|---|---|---|---|---|
| HANDOFF §4.1 | Husky pre-commit não executável | FEITO | `ls -la .husky` → `-rwxr-xr-x pre-commit`, `pre-push` | — |
| HANDOFF §4.2 | 2 vulnerabilidades high Dependabot | FEITO | `github_list_dependabot_alerts state=open` = `[]` | — |
| HANDOFF §4.3 | `graphify-out/` fora do git | **PARCIAL** | 2 arquivos ainda rastreados (ver RIE §4) | `git rm --cached` ou documentar exceção. |
| HANDOFF §4.4 | 13–16 warnings de lint | NÃO VERIFICADO | Sem `node_modules`; RELATORIO_CI reporta 74 warnings em 30/10 | Backlog cresceu (13→74 segundo o próprio RELATORIO_CI). |
| HANDOFF §4.6 | Drift repo↔banco: 46 tabelas ausentes | NÃO VERIFICADO (banco não acessível) | — | Confirmar com `schema-drift` / MCP oficial. |
| HANDOFF §4.7 | `useConciliacaoPage.test.tsx` flaky | NÃO VERIFICADO | Arquivo existe `src/hooks/__tests__/useConciliacaoPage.test.tsx` | Sem registro de estabilização. |
| HANDOFF §1 | Stack "React 18 + Vite 5" | DIVERGENTE | `package.json`: `react ^19.3.1` (PR #474 `e6e61434`), `vite ^8.3.8`, `react-router-dom ^7.18.2` | Doc histórico; AGENTS.md também cita React 18/Vite 6. |
| HANDOFF §10 | `/design-system-debug` deprecado → usar `/__especimes` | **NÃO FEITO** | `src/App.tsx:35,69` rota ainda registrada (sem gate `DEV`) | Remover ou gatear a rota legada. |
| HANDOFF §10 | "Bomba lint-staged/prettier no `App.tsx` (336 linhas)" | RESOLVIDO (por refatoração) | `src/App.tsx` = 122 linhas; rotas em `src/routes/*.tsx`; `lint-staged` em `package.json:181` | Hazard obsoleto. |
| HANDOFF §10 | `next-themes` dep morta — remoção opcional | **NÃO FEITO** | `package.json` `"next-themes": "^0.4.6"` | — |
| HANDOFF P3 | `fontFamily.mono = JetBrains Mono` | FEITO | `tailwind.config.ts:24` | — |
| HANDOFF P7 | G2 espécimes "Storybook" | DIVERGENTE | Scripts `storybook`/`build-storybook` em `package.json:43-44`, mas **nenhuma dep `storybook`** e sem `.storybook/`; G2 foi feito em `/__especimes` | Scripts npm quebrados (ver AI_RULES abaixo). |

### 3d. RELATORIO_ACEITE_VELA_DARK.md (100 linhas)

| Doc | Item | Status | Evidência | O que falta |
|---|---|---|---|---|
| ACEITE §6.1 | Nomenclatura estilizada — "produto decide" | **NÃO FEITO** | Ver RIE §3.1 (5 ocorrências em `src/`) | Decisão pendente. |
| ACEITE §6.2 | Lint baseline 16 warnings / `App.tsx` 336 linhas contido com `--no-verify` | RESOLVIDO parcialmente | `App.tsx` 122 linhas; AGENTS.md:51 proíbe `--no-verify` fora de emergência | Warnings: 74 em 30/10 (RELATORIO_CI) — NÃO VERIFICADO hoje. |
| ACEITE §6.3 | 2 avisos Dependabot | FEITO | alerts abertos = 0 (API) | — |
| ACEITE §6.4 | Flaky `useConciliacaoPage.test.tsx` | NÃO VERIFICADO | — | — |
| ACEITE §7 | Próximo passo: `npm run build` smoke em CI | FEITO | `ci.yml:469` | — |
| ACEITE §7 | Epic de polimento hex residuais | NÃO FEITO | 177 hex em `src/` | Sob demanda. |
| ACEITE §4 | Capturas em `/tmp/pfv2-p7b-*.png` "espelho CDN assinado" | NÃO VERIFICADO | Evidência fora do repo | Sem artefato versionado. |

---

## 4. RELATORIO_CI.md (339 linhas)

| Doc | Item | Status | Evidência | O que falta |
|---|---|---|---|---|
| RCI 30/10 §1 | Workflow `e2e-cloud-probe` (`workflow_dispatch`) | **NÃO ENCONTRADO** (removido) | `ls .github/workflows` = 19 arquivos, nenhum `e2e-cloud-probe`; `grep -rn e2e-cloud-probe .github docs/agentes` = 0 | Doc lista workflow que não existe mais. |
| RCI 30/10 §1 | `npm_and_yarn in /. for zod` failure (bloqueio externo) | NÃO VERIFICADO (run histórico) | Front em zod 4 (`package.json:138`); alerts abertos 0 | Deve ter cessado; sem prova de run nesta sessão. |
| RCI 30/10 §1 | "CI Pipeline — 6 jobs" | DIVERGENTE | `ci.yml` hoje tem 7 jobs: `secret-scan`, `quality-gate`, `e2e-critical`, `e2e-destructive`, `e2e-financeiro`, `e2e-quarantine`, `post-merge-audit` | Só contagem. |
| RCI 30/10 §4 | `prod-migrate`: `migrate` skipped "aguarda secrets" | SUPERADO | Secrets `PROD_DB_URL`/`SUPABASE_ACCESS_TOKEN` existem desde 13/11 e 10/09 | Doc desatualizado (ver PENDENCIAS §1). |
| RCI 29/10 | Baseline "3023 testes / 246 arquivos" vs AGENTS.md "meta 2689/2689" | DIVERGENTE | `find src -name '*.test.ts*'` = **282** arquivos hoje | AGENTS.md:11 e docs desalinhados com o número real de testes. |
| RCI (todas) | Workflows não cobertos pelo relatório | INFORMATIVO | Novos desde 30/10: `auto-update-pr-branch.yml`, `automation-local.yml`, `contexto.yml`, `estado-real.yml`, `inventario-estado.yml`, `settings-guard.yml` | Relatório não reflete o conjunto atual. |
| RCI 29/10 | "8 required checks" | FEITO (baseline) | `scripts/ci/github-settings-baseline.json:16-25` lista 8 contexts (Supabase DB Linter, Quality Gate & Tests, E2E Critical Gate, Integration tests, E2E Financeiro, E2E Destructive Logout, gitleaks, Unit tests) | Estado real da branch protection NÃO VERIFICADO (só baseline). |
| RCI 29/10 §6b | Registry npm 403 / baseline local | NÃO VERIFICADO | `node_modules` ausente também nesta sessão | Ambiente. |

---

## 5. CHANGELOG.md (113 linhas) — seção `[Unreleased]`

| Doc | Item | Status | Evidência | O que falta |
|---|---|---|---|---|
| CHANGELOG Security | `health/` reduzido a liveness mínimo — removidos client SERVICE_ROLE e sondagem de APIs externas | **MARCADO FEITO, NÃO ENCONTRADO** | `supabase/functions/health/index.ts:30` `Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')` + `createClient(url,key)`; `:35,105` `fetch(u, timeout 3000)` pinga Asaas/Bling; probe público (sem usuário) ainda executa os checks (l.26-45), só agrega o status | Ou atualizar o CHANGELOG (comportamento atual é "status agregado público + detalhe autenticado") ou cumprir o item. |
| CHANGELOG Security | CORS allowlist em todas as Edge Functions | FEITO | `_shared/cors.ts:31,79` (`ALLOWED_ORIGINS`, `corsHeadersPara`); único `'*'` restante em `open-finance/index_test.ts:38,41` (teste) | — |
| CHANGELOG Security | CSP enforce no `vercel.json` | FEITO | `vercel.json:39` `Content-Security-Policy`; sem `Report-Only` | — |
| CHANGELOG Security | Magic bytes em uploads | FEITO | `src/lib/magic-bytes.ts` + testes | — |
| CHANGELOG Added | Correlation id `x-request-id` → `edge_function_logs` | FEITO | `_shared/correlation.ts`, `_shared/edge-observability.ts:2,20` | — |
| CHANGELOG Added | CI: `deno check`, lint Deno, testes Deno | FEITO | `deno-tests.yml:55` `deno lint`, `:92` `scripts/ci/deno-check-functions.sh`, `:124,177` `deno test` | — |
| CHANGELOG Added | Regeneração semanal de `types.ts` com PR automático | FEITO | `schema-drift.yml:11-12` cron seg 06:00; `:126` `gh pr create` | — |
| CHANGELOG Added | Paridade migrations↔schema (`supabase db diff`) + gate de formatação | FEITO | `prod-migrate.yml:203` `db diff`; `schema-drift.yml:183-191` paridade via `psql`; `ci.yml:289` `prettier --check` em arquivos alterados | — |
| CHANGELOG Added | Runbooks DR/backup, uptime, matriz papel×rota×tabela | FEITO/PARCIAL | `docs/runbooks/`: `BACKUP_DR.md`, `UPTIME_OBSERVABILIDADE.md`, `HOTFIX.md`, `INCIDENTES.md`, `ROTACAO_SECRETS.md`; matriz papel×rota×tabela não em `runbooks/` (`docs/MATRIZ_PAPEIS.md` existe) | Caminho da matriz divergente do texto. |
| CHANGELOG Added | Overlay `strictNullChecks` via `tsconfig.strict.json` + `type-check:strict` | **PARCIAL / DIVERGENTE** | Script `type-check:strict` existe (`package.json:48` → `scripts/ci/typecheck-strict-baseline.sh`), mas **não existe `tsconfig.strict.json`** (`ls tsconfig*.json` = app/e2e/node/json); o script faz ratchet com `baselines/strictnullchecks-baseline.txt` e comenta "tsconfig principal já roda strict global (PR #141)" | Atualizar CHANGELOG. |
| CHANGELOG Changed | Logger `_shared/observability.ts` — sweep `console.*` → `createLogger` | PARCIAL | 77/106 `index.ts` usam `createLogger`; 2 `console.*` restantes: `enviar-convite-organizacao/index.ts:161`, `n8n-callback/index.ts:156` | Sweep quase completo; 2 restos. |
| CHANGELOG Changed | AGENTS.md sem `--no-verify` | FEITO | `AGENTS.md:51` | — |
| CHANGELOG Changed | Docs históricos → `docs/archive/`, SQL ad-hoc em `docs/archive/sql/` | PARCIAL | `docs/archive/` existe (5 docs), `docs/archive/sql/` com 1 arquivo; porém **10 docs de planejamento seguem na raiz** (os auditados aqui) e `docs/` tem 40+ auditorias/relatórios soltos | Mover os docs da raiz. |
| CHANGELOG Added (anterior) | `docs/archive/AUDITORIA_TECNICA_EXAUSTIVA_2026-09-02_R2_LIVE.md` | DIVERGENTE (caminho) | Arquivo está em `docs/AUDITORIA_TECNICA_EXAUSTIVA_2026-09-02_R2_LIVE.md`, não em `docs/archive/` | Caminho errado no CHANGELOG. |
| CHANGELOG Added (anterior) | Branch protection (Quality Gate + E2E Critical + Deno Tests) | PARCIAL (baseline) | `github-settings-baseline.json:16-25` inclui os 3 + 5 outros | Estado real NÃO VERIFICADO. |
| CHANGELOG Added (anterior) | Dark mode com ThemeProvider | FEITO | `src/components/theme/ThemeProvider.tsx` | — |
| CHANGELOG Added (anterior) | Service Worker Workbox | **PARCIAL / NÃO ENCONTRADO** | `public/sw.js` existe; `usePushNotifications.ts:74` registra `/sw.js`; **nenhum `workbox`/`vite-plugin-pwa` em `package.json` ou `vite.config.ts`** — só padrões de limpeza em `auth-cleanup.ts:26,34` | "Workbox" não existe; SW é artesanal. |
| CHANGELOG Added (anterior) | Docker multi-stage | **MARCADO FEITO, NÃO ENCONTRADO** | `ls Dockerfile*` = nada | Sem Dockerfile no repo (deploy é Vercel). |
| CHANGELOG Changed (anterior) | Bundle < 500KB; coverage 2%→20% | NÃO VERIFICADO | Sem build local | — |
| CHANGELOG Fixed | CLAUDE.md com "105 edge functions, 571+ migrations, meta 2689 testes" | DIVERGENTE | Hoje: **106** diretórios em `supabase/functions` (sem `_shared`), **1048** arquivos em `supabase/migrations`, 282 arquivos de teste; `docs/agentes/sistema.md:22` ainda "571+" | Números desatualizados em AGENTS.md/sistema.md. |
| CHANGELOG Fixed | Lockfile único `bun.lock` | FEITO | sem `bun.lockb`/`package-lock.json` | — |
| CHANGELOG Removed | `e2e-tests/` | FEITO | diretório ausente; `e2e/auth/login.e2e.ts` existe | — |

---

## 6. CONTRIBUTING.md (289) e AI_RULES.md (78)

| Doc | Item | Status | Evidência | O que falta |
|---|---|---|---|---|
| CONTRIBUTING | `CODE_OF_CONDUCT.md` | **NÃO ENCONTRADO** | `ls CODE_OF_CONDUCT.md` = não existe | Link quebrado. |
| CONTRIBUTING | Requisitos "Node.js 20+, npm 10+" / `npm install` | DIVERGENTE | `package.json` `engines.node >=22.12.0`; projeto usa **bun** (`bun.lock`, AGENTS.md:11, `.husky` via node direto) | Atualizar doc. |
| CONTRIBUTING | URLs `github.com/seu-usuario/promo-finance`, `original/promo-finance` | DIVERGENTE | Repo real `adm01-debug/Promo_Finance_V2` | Placeholders nunca preenchidos. |
| CONTRIBUTING | Fluxo fork + `feature/minha-feature` | DIVERGENTE | AGENTS.md §6.1 exige `claude/<tipo>-<slug>-<AAMMDD-HHMM>` em worktree, sem fork | Doc contradiz regra vigente. |
| CONTRIBUTING | Conventional Commits com `docs:`/`style:`/`refactor:`/`test:` | PARCIAL | Sem commitlint (`grep commitlint` = 0, confirmado em AGENTS.md:51); AGENTS.md aceita só `fix:`/`feat:`/`chore:`/`infra:` | Nenhum gate; prefixos divergem. |
| CONTRIBUTING | Scripts `npm run dev/build/test/test:e2e/lint/type-check` | FEITO | todos em `package.json:16-33` | — |
| CONTRIBUTING | Template de PR inline | DIVERGENTE | `.github/PULL_REQUEST_TEMPLATE.md` real tem seções "Objetivo e escopo / Validação / Impacto estrutural — Graphify", diferente do inline | — |
| CONTRIBUTING | Templates de issue | FEITO | `.github/ISSUE_TEMPLATE/bug_report.md`, `feature_request.md` | — |
| CONTRIBUTING | Hooks (não menciona husky/lint-staged/gitleaks) | OMISSÃO | `.husky/pre-commit` (lint-staged + gitleaks), `.husky/pre-push` (tsc + tsc e2e + vitest --changed); `package.json:181` lint-staged; `.gitleaks.toml`, `.gitleaks-baseline.json` | Documentar hooks. |
| AI_RULES | "React 18 + TypeScript + Vite 5"; "React Router DOM v6" | DIVERGENTE | `react ^19.3.1`, `vite ^8.3.8`, `react-router-dom ^7.18.2` | Atualizar. |
| AI_RULES | "Keep ALL routes in `src/App.tsx`" | DIVERGENTE | Rotas distribuídas em `src/routes/*.tsx`; `App.tsx` 122 linhas | Regra obsoleta. |
| AI_RULES | Theme → `next-themes` via `ThemeProvider.tsx` | DIVERGENTE | `ThemeProvider.tsx` usa `ThemeContext` custom; `next-themes` sem import | Atualizar (e remover dep). |
| AI_RULES | Storybook na stack | **NÃO ENCONTRADO** | sem dep `storybook`, sem `.storybook/`; scripts `storybook`/`build-storybook` órfãos em `package.json:43-44` | Remover scripts ou instalar. |
| AI_RULES | `zod` (forms) | FEITO (v4) | `package.json:138` `zod ^4.6.7` | Edge functions em v3 (ver PENDENCIAS §3). |
| AI_RULES | `npx tsc --noEmit -p tsconfig.app.json`; `npm test -- <path>` | FEITO (arquivos existem) | `tsconfig.app.json` ✓; hooks/CI usam `bun`/`tsc --noEmit` raiz | Comando divergente do CI (`bun run type-check` = `tsc --noEmit`). |
| AI_RULES | Caminhos `src/lib/queryClient.ts`, `src/i18n.ts`, `src/pages/Index.tsx`, `src/integrations/supabase/client.ts` | FEITO | todos existem | — |
| Hooks/gates (ambos) | husky, lint-staged, gitleaks, prettier | FEITO | `.husky/{pre-commit,pre-push}` executáveis; `package.json:39` `prepare: husky`, `:167,169` deps; `.prettierrc`; `ci.yml:23` job gitleaks | commitlint: não existe (por decisão, AGENTS.md:51). |

---

## 7. docs/contexto/regras/manual/

| Doc | Item | Status | Evidência | O que falta |
|---|---|---|---|---|
| regras/manual/README.md | "Comece copiando `TEMPLATE-regras-de-negocio.md` para `regras.md`" | **NÃO FEITO** | `ls docs/contexto/regras/manual/` = apenas `README.md` (228 B) e `TEMPLATE-regras-de-negocio.md` (1085 B). Nenhuma regra manual escrita | `scripts/regras_negocio/generate.py:1675-1676` registra gap: "Nenhuma regra manual em `manual/`". Seções 1–9 do template (atores, ciclo de vida, cálculos, prazos, integrações, exceções comerciais) vazias — só o dono pode preencher. |
| TEMPLATE | Entra em `07-REGRAS-DE-NEGOCIO.md` seção A | PARCIAL (mecanismo pronto, sem conteúdo) | `generate.py:1743` lê `manual/`; `find docs -name 07-REGRAS-DE-NEGOCIO.md` = 0 (gerado sob demanda / não versionado) | Gerar e versionar após preencher. |

---

## Contagens por documento (só itens listados acima)

| Documento | NÃO FEITO | PARCIAL | MARCADO FEITO, NÃO ENCONTRADO | DIVERGENTE/SUPERADO (doc desatualizado) | NÃO VERIFICADO (externo) | FEITO pós-doc (fechar no doc) |
|---|---|---|---|---|---|---|
| PENDENCIAS.md | 2 (secrets staging, var `REQUIRED_SECRETS`) | 2 (zod edge v3, `.max()` Expert/Categorizar) | 0 | 1 (§1 secrets já existem) | 6 | 3 |
| RELATORIO_IMPLEMENTACAO_EXAUSTIVO.md | 3 (next-themes, nomenclatura, menu Fiscal) | 4 (hex 177, TabsContent, graphify-out, `--ch1..5`) | 0 | 2 (CommandPalette 197 l., remap em HSL) | 0 | 1 (ogl removido do código, dep ficou) |
| EXECAO_RESTYLE_METRONIC_V9.md | 1 (mover p/ docs) | 0 | 0 | 2 (superseded; HERMES.md) | 0 | 0 |
| EXECAO_VELA_DARK.md | 1 (mover p/ docs) | 2 (chart.tsx/`--ch`, HERMES.md) | 0 | 1 (Outfit ainda carregado) | 1 | 0 |
| HANDOFF_VELA_DARK.md | 2 (design-system-debug, next-themes) | 1 (graphify-out) | 0 | 3 (stack React18/Vite5, App.tsx hazard, Storybook) | 3 | 2 |
| RELATORIO_ACEITE_VELA_DARK.md | 2 (nomenclatura, hex) | 1 (lint/App.tsx) | 0 | 0 | 2 | 1 |
| RELATORIO_CI.md | 0 | 0 | 1 (`e2e-cloud-probe` inexistente) | 4 (6 jobs, prod-migrate superado, 2689 vs 282 arquivos, workflows novos) | 3 | 0 |
| CHANGELOG.md | 0 | 5 (strict tsconfig, console.* 2, archive, SW sem Workbox, branch protection) | 2 (health liveness, Dockerfile) | 3 (caminho R2_LIVE, números 105/571, matriz) | 1 | 0 |
| CONTRIBUTING.md | 1 (CODE_OF_CONDUCT) | 1 (commits sem gate) | 0 | 5 (Node/npm, URLs, fluxo fork, PR template, hooks não documentados) | 0 | 0 |
| AI_RULES.md | 0 | 0 | 1 (Storybook) | 4 (Vite/React/Router, rotas no App.tsx, next-themes, comando tsc) | 0 | 0 |
| docs/contexto/regras/manual | 1 (nenhuma regra escrita) | 1 (gerador pronto, sem saída) | 0 | 0 | 0 | 0 |

**Pendências acionáveis de maior impacto** (todas com evidência acima):
1. Edge Functions em zod v3.22.4 (44 imports diretos + `_shared/zod.ts`) — front já em v4.
2. `health/index.ts` ainda usa `SUPABASE_SERVICE_ROLE_KEY` e pinga APIs externas no probe público — CHANGELOG afirma o contrário.
3. `--ch1..5` referenciados em `chartColors.ts` mas não definidos em `src/index.css` — verificar runtime.
4. Secrets de staging + variable `REQUIRED_SECRETS` inexistentes (workflow `staging-migrate` verde mas inerte).
5. `docs/contexto/regras/manual/` vazio — regras de negócio manuais nunca escritas.
6. 10 docs de planejamento ainda na raiz (as próprias exceções previam mover para `docs/`); 4 deles com dados superados (secrets já criados, React 19, Vite 8, zod 4).
7. Deps mortas: `next-themes`, `ogl`; scripts órfãos `storybook`/`build-storybook`; `CODE_OF_CONDUCT.md`/`HERMES.md` referenciados e inexistentes.

---

## Anexo — A7 Auditoria financeira e planejado × executado (10/09 e 12/10)

A7 — Auditoria financeira: planejado × executado (verificação em 20/11/2026)

Base: `main` @ `a406e99` (clone raso, 50 commits — `git log --since` não alcança antes de 17/11; verificação feita por leitura do código atual).
Produção: snapshot `origin/contexto` @ `e5cf731` (2026-11-20 02:21 UTC) — `docs/contexto/supabase/{functions,tables,policies,views,triggers,cron,cron-runs,stats,storage,edge-functions,lints,migrations}.md`. Abaixo, `ctx:` = esse snapshot.
Somente leitura. Nada foi alterado no repo.

Legenda: FEITO · PARCIAL · NÃO FEITO · MARCADO FEITO, NÃO ENCONTRADO · NÃO VERIFICÁVEL SEM BANCO (inclui "sem API GitHub/Vercel/secrets").
As tabelas listam **só o que segue pendente/parcial/divergente**. Os itens FEITO aparecem numa linha-resumo por seção, com a evidência-chave.

---

## 1. `docs/AUDITORIA_PLANEJADO_X_EXECUTADO_2026-10-12.md`

### 1.0 Transversais (§3) — resumo FEITO
- §3.1 Ledger: as 49 migrations + 6 pré-ledger citadas estão em `ctx:migrations.md` (script: 55/55 versões presentes). Efeitos conferidos presentes: RPCs `aprovar_solicitacao_pagamento`, `gerar/pagar_darf_retencoes`, `registrar_nfe_com_creditos`, `totais_contas_pagar/receber`, `is_user_locked`, `cnpja_check_rate_limit`, `confirmar_conciliacao_manual` (3 sobrecargas, incl. 6 args), `segredo_cron`, `chave_anon_vault`, `invocar_digest_*`, `gate_34_*` (ctx:functions/public/*); 18/18 views com `security_invoker` (ctx:views.md); `empresa_acessivel` com `ue.ativo = true` (ctx:functions/public/empresa_acessivel__*.sql:12); `certificado_get_password`:20 e `export_asaas_audit_csv`:15 com `empresa_acessivel`; 4 RPCs `nfe_*` de vínculo com `empresa_acessivel`; `chave_pix` mascarada (ctx:views.md:288-290); 0 policies `OR true`; `query_telemetry.empresa_id` existe.
- §3.3 Buckets `financeiro` e `relatorios-tributarios` existem (ctx:storage.md). §3.4 triggers `trg_notificar_alerta_critico_push` (ctx:triggers.md:10) e `on_whatsapp_message_inserted` (:77) existem.

| Doc | Item/Etapa | Status | Evidência | O que falta |
|---|---|---|---|---|
| D1 | §3.1 #3 `20260824124500` (descomissionar Lalamove) | PARCIAL | cron 37 sumiu de ctx:cron.md; mas `public.trigger_bitrix24_sync` segue em ctx:functions/public/ e sem chamador | Dropar `trigger_bitrix24_sync` (resíduo ADR-001) |
| D1 | §3.1 pré-ledger `20260317001356` → RPC `processar_fila_cobrancas` | NÃO FEITO | `ls ctx:functions/public \| grep ^processar_fila_cobrancas` = 0, embora a versão esteja no ledger; chamada em `supabase/functions/processar-fila-cobrancas/index.ts:31` | Criar a RPC (ledger diz aplicada, efeito ausente) |
| D1 | §3.1 pré-ledger `20260509132829` → trigger `handle_asaas_payment_settlement` | NÃO FEITO | função ausente em ctx:functions; `asaas_payments` só tem trigger `updated_at` (ctx:triggers.md:27) | Liquidação automática Asaas → baixa CR/movimentação |
| D1 | §3.1 pré-ledger `20260418140233` → cron `refresh-benchmark-setorial-weekly` | NÃO FEITO | ausente em ctx:cron.md (31 jobs) | Agendar ou retirar |
| D1 | §3.1/§5.7 `001_create_tables.sql`, `002_rls_policies.sql`, `003_seed_data.sql` sem timestamp | NÃO FEITO | `ls supabase/migrations \| grep ^00[0-9]_` → 3 arquivos | Renomear/normalizar (PLANO_MELHORIAS 49) |
| D1 | §3.2 `processar_fila_cobrancas` | NÃO FEITO | idem acima | idem |
| D1 | §3.2 `handle_asaas_payment_settlement` | NÃO FEITO | idem acima | idem |

### 1.1 Contas a Pagar (§4.1)
FEITO: CP-01 (`useContasPagar.ts:151` usa `user_id`), CP-04 (cron 49 `marcar-contas-vencidas`, succeeded 17–19/11 em ctx:cron-runs.md:276-282), CP-05 (`.limit(1000)` e `*0.95` removidos — `useContasPagar.ts:20-55` lê paginado até 20k), CP-10 (`useContasPagarLogic.calculos.ts:132-133` usa `'rejeitado'`), CP-14 (bucket + `upload-anexo` em `config.toml:294` e `functions-deploy.yml:114`, ACTIVE v102), CP-20 (policies `contas_pagar_*` com `empresa_acessivel`/`user_empresas` — ctx:tables/public/contas_pagar.md), CP-22 (`ContasPagarTableRow.tsx:122` grava `tags`; coluna existe).

| Doc | Item/Etapa | Status | Evidência | O que falta |
|---|---|---|---|---|
| D1 | CP-02 Pagamento parcial | PARCIAL | só resta `chk_contas_pagar_status` (inclui `parcial`) em ctx:contas_pagar.md:62; mas `RegistrarPagamentoDialog.tsx:155-157` sobrescreve `data_pagamento`, sem tabela de histórico de baixas | Histórico de pagamentos parciais |
| D1 | CP-03 / AP-02 Liberar pagamento aprovado | PARCIAL | `RegistrarPagamentoDialog.tsx:108-112`: usa status da solicitação; fallback legado exige `aprovado_em`, coluna ausente em prod (ctx:contas_pagar.md, 36 colunas sem `aprovado_em`); RPC só grava `aprovado_por` | Criar `contas_pagar.aprovado_em` ou remover fallback |
| D1 | CP-06 Baixa reflete no caixa | NÃO FEITO | `RegistrarPagamentoDialog.tsx:150-161` só faz UPDATE em `contas_pagar`; nenhum INSERT em `movimentacoes` (grep) | Gerar movimentação (trigger de saldo já existe) |
| D1 | CP-07 Estorno de pagamento | NÃO FEITO | grep "estorn" em `src/components/contas-pagar`, `src/hooks/financial` = 0 | Ação de estorno |
| D1 | CP-08 Exclusão segura | NÃO FEITO | `useContasPagar.ts:209` `.delete()` físico | Soft-delete + bloqueio de título pago |
| D1 | CP-09 Cancelamento com motivo | NÃO FEITO | só em massa `useContasPagarLogic.ts:351-362` (`status:'cancelado'`, sem motivo) | Cancelamento unitário com justificativa |
| D1 | CP-11 Baixa em lote respeita alçada | NÃO FEITO | `handleBulkMarkAsPaid` `useContasPagarLogic.ts:334-349` marca `pago` sem checar aprovação | Checar alçada no lote |
| D1 | CP-12 Parcelamento | NÃO FEITO | grep `parcela` em `ContaPagarForm*.tsx` = 0 | Campo e geração de N parcelas |
| D1 | CP-13 Recorrência | NÃO FEITO | ctx:functions/public/gerar_contas_recorrentes__*.sql:58 grava `auth.uid()` (nulo no cron) e :70 incrementa `total_gerado` | Dono do título, contador correto |
| D1 | CP-15 CNAB 240/400 | NÃO FEITO | grep `cnab\|remessa` só acha Bling/logística | — |
| D1 | CP-16 Importação de CP por planilha | NÃO FEITO | grep = 0 | — |
| D1 | CP-17 Adiantamento a fornecedor | NÃO FEITO | grep `adiantamento` só `AntecipacaoDialog.tsx` (Asaas) | — |
| D1 | CP-18 Multi-moeda | NÃO FEITO | grep `taxa_cambio\|moeda_estrangeira` = 0 | — |
| D1 | CP-19 Trilha de auditoria do título | NÃO FEITO | `contas_pagar` só tem triggers `set_updated_at` e `trg_anexos_sync_empresa` (ctx:triggers.md) | Trigger de auditoria + timeline |
| D1 | CP-21 SoD lança ≠ paga | NÃO FEITO | grep = 0 | — |
| D1 | CP-23 Exportação XLSX real | PARCIAL | `src/components/ui/export-menu.tsx:55` rótulo agora honesto "Excel (CSV)"; XLSX real não existe | Gerar .xlsx |

### 1.2 Contas a Receber (§4.2)
FEITO: CR-01 (colunas existem em prod e `ContaReceberForm.tsx:200-204` grava), CR-04 (cron 49), CR-05 (`useContasReceberLogic.calculos.ts:30-81` trata `pago` e `recebido`), CR-13 (sem `.limit(1000)`; RPC existe), CR-16 (bucket), CR-19 (policies com `empresa_acessivel`).

| Doc | Item/Etapa | Status | Evidência | O que falta |
|---|---|---|---|---|
| D1 | CR-02 Criar N parcelas | NÃO FEITO (só UI) | `ContaReceberForm.tsx:186` um único `.insert`; `:411-412` rótulo "Criar N Parcelas" | Loop de geração |
| D1 | CR-03 Recorrência de receita | NÃO FEITO | `gerar_contas_recorrentes` não referencia `contas_receber` (grep no .sql = 0) | Gerador de CR recorrente |
| D1 | CR-06 Recebimento reflete no caixa | NÃO FEITO | `RegistrarRecebimentoDialog.tsx:116,132` grava `contas_receber` + `transacoes_bancarias`, não `movimentacoes` | Gerar movimentação |
| D1 | CR-07 Desconto | PARCIAL | `AplicarDescontoDialog.tsx:50-52` grava `valor_final` (agora existe) mas sobrescreve `observacoes`; sem alçada | Preservar observações; alçada |
| D1 | CR-08 Acordo/renegociação | PARCIAL | `useAcordosParcelamento.ts:115-117` status `em_acordo` (aceito no CHECK); `parcelas_acordo` tem `valor_pago/data_pagamento`; quitação rateia `valor_recebido` (:321-330); não cria títulos CR por parcela | Gerar CR/boleto por parcela |
| D1 | CR-09 Baixa automática por extrato | NÃO FEITO | `BaixaAutomaticaDialog.tsx:78` casa só `Math.abs(valor) < 0.05` | Nosso número/CNPJ, revisão, desfazer |
| D1 | CR-10 Vincular manualmente | NÃO FEITO | `BaixaAutomaticaDialogCorrespondenciasAutomaticas.tsx:86` toast "em desenvolvimento" | — |
| D1 | CR-11 / BP-02 Baixa automática Asaas | NÃO FEITO | `asaas-webhook/index.ts:101-165` só escreve `asaas_payments`, `asaas_transfers`, `asaas_audit_trail`; trigger de liquidação ausente | Liquidação → CR → movimentação |
| D1 | CR-12 Enviar cobrança | NÃO FEITO | `EnviarCobrancaDialog.tsx:60,65` só `wa.me`/`mailto`; `:68` SMS "em desenvolvimento"; sem registro | Envio real + histórico |
| D1 | CR-14 Exclusão/cancelamento | NÃO FEITO | `useContasReceberLogic.ts:141` `.delete()` físico | Soft-delete; cancelar boleto/Asaas vinculado |
| D1 | CR-15 Estorno/nota de crédito | NÃO FEITO | grep = 0 | — |
| D1 | CR-17 Limite de crédito | NÃO FEITO | `limite_credito` só em `ClienteForm.tsx:47-131` | Checagem no lançamento |
| D1 | CR-18 Multi-moeda / adiantamento cliente | NÃO FEITO | grep = 0 | — |

### 1.3 Aprovações (§4.3)
FEITO: AP-01 (RPC em ctx:functions/public/aprovar_solicitacao_pagamento__*.sql), AP-03 (`'rejeitado'` alinhado).

| Doc | Item/Etapa | Status | Evidência | O que falta |
|---|---|---|---|---|
| D1 | AP-02 Liberar após aprovar | PARCIAL | ver CP-03 | — |
| D1 | AP-04 Multinível / **quorum** (`aprovadores_obrigatorios`) | NÃO FEITO | `fluxos_aprovacao_niveis` sem escritor (grep); `ConfiguracaoAprovacaoCard.tsx:245-250` lixeira e `:260` "Configurar primeiro nível" sem `onClick`; RPC aprova com 1 aprovador (sql:42-46), `aprovadores_obrigatorios` só salvo (`ConfiguracaoAprovacaoCard.tsx:74`) | Quorum e níveis no backend |
| D1 | AP-05 Visualização do workflow | NÃO FEITO | passos fixos "Gestor Direto"/"Diretoria Financeira" em `AprovacoesPendentesConteudo.tsx:40-41` | Ler fluxo real |
| D1 | AP-06 Observadores / cadeia | NÃO FEITO | grep `observador` = 0 | — |
| D1 | AP-07 SoD solicitante ≠ aprovador | NÃO FEITO | RPC não compara `solicitado_por` com `auth.uid()` (sql:7-46) | Bloquear autoaprovação |
| D1 | AP-08 SLA/escalonamento | NÃO FEITO | nenhum job em ctx:cron.md | — |
| D1 | AP-09 Aprovar outras entidades | NÃO FEITO | RPC exige `conta_pagar_id` (sql:27-29) | — |
| D1 | AP-10 Delegação | NÃO FEITO | grep = 0 | — |

### 1.4 Tesouraria (§4.4) — **lançamento bancário**
FEITO: TS-01 (trigger `trg_saldo_movimentacao` → `fn_saldo_movimentacao`, ctx:triggers.md), TS-02 (`movimentacoes` tem `conta_bancaria_id`, `conta_pagar_id`, `conta_receber_id`, `centro_custo_id`…), TS-05 (grava `'realizado'`; `transferencias` sem CHECK de status em prod).

| Doc | Item/Etapa | Status | Evidência | O que falta |
|---|---|---|---|---|
| D1 | TS-03 Alimentação automática de movimentações | PARCIAL | só transferência gera movimentação (`trg_transferencia_movimentacao`, ctx:triggers.md); nenhum INSERT em `movimentacoes` em pagar/receber/conciliar/Asaas (grep `from('movimentacoes')` só em `useFinancialOperations.ts`) | Ligar pagar/receber/conciliar |
| D1 | TS-04 Lançar/estornar movimentação manual | NÃO FEITO (só backend) | `useCreateMovimentacao`/`useDeleteMovimentacao` sem consumidor `.tsx` (grep = 0) | Tela de ajuste |
| D1 | TS-06 Transferência por Contas Bancárias | PARCIAL | `movimentacao_id` e `cancelado_em` existem; `aprovado_por` ausente em `transferencias` | — |
| D1 | TS-07 Cancelar transferência | NÃO FEITO (só backend) | `useCancelTransferencia` sem consumidor | — |
| D1 | TS-08 Validar saldo no servidor | NÃO FEITO | só `contas-bancarias/TransferenciaDialog.tsx:60`; `financeiro/TransferenciaDialog.tsx` e `fn_transferencia_movimentacao` não validam | — |
| D1 | TS-09 Intercompany | NÃO FEITO | sem mútuo/eliminação | — |
| D1 | TS-10 Editar/sincronizar conta | NÃO FEITO | `ContaBancariaCard.tsx:115-127` três `DropdownMenuItem` sem `onClick` | — |
| D1 | TS-11 Código do banco | NÃO FEITO | `NovaContaDialog.tsx:58` `codigo_banco: '000'` | — |
| D1 | TS-12 Mapeamento de extrato | NÃO FEITO | `ContaBancariaCard.tsx:73` grava `contas_bancarias.mapeamento_extrato` (ausente em prod); importador lê `configuracoes_conciliacao` (`ImportarExtratoDialog.tsx:107-110`) | Unificar destino |
| D1 | TS-13 Importar extrato em /contas-bancarias | NÃO FEITO (só UI) | `ContasBancarias.tsx:307-311` só toast | — |
| D1 | TS-14 Aplicações/empréstimos/cartão/câmbio | NÃO FEITO | — | — |
| D1 | TS-15 Exportar movimentações | NÃO FEITO | `Movimentacoes.tsx` sem `ExportMenu` | — |
| D1 | TS-16 Texto "3 CNPJs × 12+ contas" | NÃO FEITO | `Tesouraria.tsx:25` | — |
| D1 | TS-17 Inativar conta com vínculos | NÃO FEITO | `ContasBancarias.tsx:112` só `ativo:false` | — |

### 1.5 Conciliação e Open Finance (§4.5)
FEITO: CO-01 (sobrecarga de 6 args em ctx:functions/public/confirmar_conciliacao_manual__b68498bd56c4814f.sql), CO-05 (#425: `ImportarExtratoDialog.tsx:48-57` recusa "Open Finance não homologado"), CO-09 (`Conciliacao.tsx:333-337`).

| Doc | Item/Etapa | Status | Evidência | O que falta |
|---|---|---|---|---|
| D1 | CO-02 Desfazer conciliação | PARCIAL | spoofing corrigido (`desfazer_conciliacao` usa `auth.uid()`, sql:8); `desfazer_conciliacao_manual__f807…sql:35-50` reabre só CR, não CP nem `conciliacoes_parciais` | Reabrir CP e limpar parciais |
| D1 | CO-03 Efeito no título | NÃO FEITO | `confirmar_conciliacao_manual__52745….sql:62-79` força `pago/recebido` e `valor_pago = valor + ajuste` | Respeitar pagamentos parciais |
| D1 | CO-04 Split | PARCIAL | `ConciliacaoSplitDialog.tsx:119-131` grava `conciliacoes_parciais` + `conciliacao_parcial/valor_conciliado`; título não é tocado | Baixa parcial no título |
| D1 | CO-06 Open Finance (edge) | PARCIAL | `open-finance/index.ts:37-60` recusa ações sem provedor (sem dado falso); integração real inexistente; `open_finance_consents` = 0 (ctx:stats.md) | ITP/agregador real |
| D1 | CO-07 Saldos/extrato por consentimento | NÃO FEITO | `OpenFinanceConsentList.tsx:105-112` botões sem `onClick` | — |
| D1 | CO-08 Mapeamento de layout no preview | NÃO FEITO | `ExtratoPreviewStep.tsx:150-159` inputs sem estado; "Salvar Layout Alpha" sem `onClick` | — |
| D1 | CO-10 Preview de regras | NÃO FEITO | `RegrasConciliacaoPanel.tsx:86,110` `mockExtrato` | — |
| D1 | CO-11 Histórico de arquivos importados | PARCIAL | `useConciliacaoPage.ts:164-165` "Sem registro de cabeçalho do arquivo" | Trilha de arquivo |
| D1 | CO-12 Conciliação retroativa | NÃO FEITO | `useConciliacaoRetroativa.ts:29` "Simulação de gatilho"; nenhuma edge lê `logs_conciliacao_retroativa` | Worker |
| D1 | CO-13 CNAB/CAMT/MT940 | NÃO FEITO | grep = 0 | — |
| D1 | CO-14 Adquirente cartão | NÃO FEITO | grep cielo/getnet = 0 | — |
| D1 | CO-15 Conciliação Asaas | NÃO FEITO | ctx:functions/public/generate_reconciliation_suggestions__*.sql:9 `RETURN jsonb_build_array();` | Implementar |
| D1 | CO-16 Dependência `LOVABLE_API_KEY` | NÃO VERIFICÁVEL SEM BANCO | 17 edges usam `ai.gateway.lovable.dev` (grep); secret não legível | Confirmar secret |

### 1.6 Boletos/PIX/Asaas (§4.6)
FEITO: BP-04 (`empresa_id` NOT NULL em `asaas_payments`/`asaas_customers`), BP-08 (enum `tipo_cobranca` tem `cartao_credito/cartao_debito`, ctx:types-enums.md:27).

| Doc | Item/Etapa | Status | Evidência | O que falta |
|---|---|---|---|---|
| D1 | BP-01 Gravar boleto Asaas | NÃO FEITO (causa remanescente) | colunas `asaas_id/external_provider` agora existem, **mas** `useBoletos.ts:109` grava `status:'gerado'` e `chk_boletos_status` aceita só `pendente,enviado,pago,vencido,cancelado` (ctx:tables/public/boletos.md:68) → insert falha depois da cobrança criada no Asaas | Alinhar status/CHECK |
| D1 | BP-02 Liquidação automática | NÃO FEITO | ver CR-11 | — |
| D1 | BP-03 Contador "gerado" | NÃO FEITO | `useBoletos.ts:378-380` conta `'gerado'`, que o banco recusa | — |
| D1 | BP-05 `consultar_saldo` por empresa | NÃO FEITO | `asaas-proxy/index.ts:805-808` só `exigirPapel` | `exigirVinculoEmpresa` |
| D1 | BP-06 Antecipação automática | NÃO FEITO | só manual | — |
| D1 | BP-07 Uso real | NÃO FEITO | `asaas_payments` = 0 (ctx:stats.md) | Ativar integração |

### 1.7 Cobrança/régua/WhatsApp (§4.7) — **régua**
FEITO: CB-06 (trigger `on_whatsapp_message_inserted` existe).

| Doc | Item/Etapa | Status | Evidência | O que falta |
|---|---|---|---|---|
| D1 | CB-01 Envio real WhatsApp (Evolution) | NÃO FEITO | `whatsapp-ia-proativo/index.ts:498,678` montam `https://wa.me/...`; grep `evolution` em `supabase/functions` = 0 | Integração de envio |
| D1 | CB-02 Fila de cobrança | NÃO FEITO | `processar-fila-cobrancas/index.ts:31` chama RPC inexistente; `fila_cobrancas` sem escritor | Criar RPC |
| D1 | CB-03 Régua diária duplicada/stub | NÃO FEITO (piorou) | cron 24 `processar_regua_cobranca(null,false)` **falha todo dia** "Sem permissão para esta empresa" (ctx:cron-runs.md, 17–19/11) — função exige empresa (sql:10-12) e o ramo não-simulado devolve 0 fixo (sql:21-24); cron 2 `invocar_regua_cobranca` OK | Remover cron 24 ou corrigir; régua única |
| D1 | CB-04 E-mail (`RESEND_API_KEY`) | NÃO VERIFICÁVEL SEM BANCO | secret não legível | — |
| D1 | CB-05 Régua/templates em Configurações | NÃO FEITO | `Configuracoes.tsx:75-76` `useState(etapasIniciais)`; `ReguaCobrancaTab.tsx:54,121` botões sem handler | Remover tela duplicada |
| D1 | CB-07 Negativação/protesto | NÃO FEITO | TODOs removidos, mas grep `serasa\|boa vista\|cenprot` em `supabase/functions` = 0 | Integração externa |
| D1 | CB-08 SMS | NÃO FEITO | `EnviarCobrancaDialog.tsx:68` | — |
| D1 | CB-09 Portal do cliente | NÃO FEITO | `portal_cliente_acessos` sem escritor (só leitura `usePortalCliente.ts:80`) | — |
| D1 | CB-10 E2E régua→fila→envio→acordo | NÃO FEITO | `e2e/regua-cobranca.e2e.ts:18` só "renderiza a tela" | — |
| D1 | CB-11 Testes Deno fila/idempotência | PARCIAL | `executar-regua-cobranca/domain.test.ts` existe; `processar-fila-cobrancas/` só `index.ts` | Teste da fila |

### 1.8 Compras (§4.8)
FEITO: CM-02 (`PedidoCompraForm.tsx:100-105` grava `user_id`, `centro_custo_id`, `valor_total`; colunas existem).

| Doc | Item/Etapa | Status | Evidência | O que falta |
|---|---|---|---|---|
| D1 | CM-01 Aprovar/receber/cancelar pedido | NÃO FEITO | `Compras.tsx` sem `.update(` (grep = 0) | Workflow de pedido |
| D1 | CM-03 Pedido/NF-e → CP | PARCIAL | NF-e → CP manual via `nfe-vinculo-proxy/index.ts:127` (`nfe_create_conta_pagar_from_nfe`); pedido → CP inexistente | — |
| D1 | CM-04 Estoque/custeio | NÃO FEITO | — | — |
| D1 | CM-05 "IA Compras" | NÃO FEITO | `Configuracoes.tsx:243` "12.4%" fixo | — |

### 1.9 Contabilidade (§4.9)
FEITO: CT-01 (trigger `normalizar_tipo_partida` converte `D/C`→`debito/credito`, ctx:functions/public/normalizar_tipo_partida__*.sql:9-12), CT-03 (`validar_partidas_dobradas` usa `'debito'`, sql:13), CT-11 (`lancamentos_contabeis.origem_id` existe).

| Doc | Item/Etapa | Status | Evidência | O que falta |
|---|---|---|---|---|
| D1 | CT-02 Relatórios somam D/C | NÃO FEITO | leitores ainda comparam `'D'/'C'` contra `debito/credito` gravado: `src/lib/contabilidade/demonstrativos-competencia.ts:159-160,334-344`, `src/components/contabilidade/razao-diario/useRazaoDiarioData.ts:53-54`, `src/hooks/usePreValidacaoSped.ts:107-113`, `src/hooks/useVerificacaoIntegracoes.ts:88` | Normalizar na leitura → DRE/razão/SPED deixam de dar zero |
| D1 | CT-04 Contabilização automática | PARCIAL | trigger `trg_contabilizar_movimentacao` em `movimentacoes` (ctx:triggers.md); front segue `dry_run: true` (`useContabilizacaoMutations.ts:29`) | Contabilizar CP/CR/baixas |
| D1 | CT-05 Fechamento de período contábil | NÃO FEITO | grep `periodo_fechado\|fechamento_contabil` = 0 | — |
| D1 | CT-06 DFC indireto | NÃO FEITO | grep = 0 | — |
| D1 | CT-07 DMPL/DLPA | NÃO FEITO | grep = 0 | — |
| D1 | CT-08 Consolidação contábil | NÃO FEITO | — | — |
| D1 | CT-09 Plano de contas unificado | NÃO FEITO | — | — |
| D1 | CT-10 `fn_livro_razao` órfão | NÃO FEITO | ctx:functions.md:87 sem chamador | — |
| D1 | CT-12 Elisão: simulações | PARCIAL | `estrategias_elisao_catalogo` ganhou policy (ctx:policies.md); `elisao_simulacoes_regime` sem escritor | — |
| D1 | CT-13 Multi-moeda/IFRS | NÃO FEITO | — | — |

### 1.10 Tributário (§4.10)
FEITO: TR-01 (RPCs DARF existem; `darfs` = 0, uso NÃO VERIFICADO), TR-02 (RPC existe).

| Doc | Item/Etapa | Status | Evidência | O que falta |
|---|---|---|---|---|
| D1 | TR-03 DRE tributária stub | NÃO FEITO | `gerar-dre-tributaria/index.ts:1` "versão determinística (stub)" | — |
| D1 | TR-04 Benchmark stub | NÃO FEITO | `comparar-benchmark-setorial/index.ts:1-2`; cron de benchmark ausente | — |
| D1 | TR-05 Heatmap stub | NÃO FEITO | `gerar-heatmap-tributario/index.ts:1` | — |
| D1 | TR-06 Previsão de carga | NÃO FEITO | `prever-carga-tributaria/index.ts` mantém ramo `stub` (2 ocorrências) | — |
| D1 | TR-07 `calculo-iva` órfão | NÃO FEITO | refs fora do diretório = 0; sem teste | — |
| D1 | TR-08 Motor duplicado / simuladores órfãos | NÃO FEITO | `simular-simples/presumido/real`, `projecao-reforma` sem invocação (refs só em `src/lib/tributario/*`) | — |
| D1 | TR-09 Testes `calculo-iva`/`decidir-regime`/`prever-carga` | PARCIAL | `prever-carga-tributaria` tem teste; `calculo-iva` e `decidir-regime` não | — |
| D1 | TR-10 Regimes especiais | NÃO FEITO | sem escritor | — |
| D1 | TR-11 Projeções/simulação/ICMS | NÃO FEITO | 0 referências | — |
| D1 | TR-12 Obrigações acessórias | NÃO FEITO | `obrigacoes_acessorias` não existe em prod (ctx:tables) | — |
| D1 | TR-13 Envio agendado avança em falha | NÃO FEITO | `enviar-relatorios-tributarios-agendados/index.ts:181-188` atualiza `proximo_envio_em` antes de checar `ok` | Só avançar no sucesso |
| D1 | TR-14 Fuso por usuário | NÃO FEITO | `enviar-digest-conformidade/index.ts:35` `FUSO='America/Sao_Paulo'` | — |
| D1 | TR-15 Menu fiscal / "Quantum" | NÃO VERIFICÁVEL SEM BANCO (decisão de produto) | — | Decisão do dono |
| D1 | TR-16 7 funções com papel global | NÃO FEITO | `_shared/contract-coverage_test.ts:246-254` mantém os 7 | Depende do ADR-003 |

### 1.11 NF-e/SEFAZ (§4.11)
FEITO: NF-02, NF-03, NF-04 (agora recusam sem protocolo real: `CancelamentoNFe.tsx:80`, `InutilizacaoNFe.tsx:88`, `ContingenciaNFe.tsx:113,174`), NF-11 (RPCs `nfe_*` com `empresa_acessivel`).

| Doc | Item/Etapa | Status | Evidência | O que falta |
|---|---|---|---|---|
| D1 | NF-01 Emissão NF-e/NFS-e | NÃO FEITO | `NovaNFeForm.tsx:84,254` "Emissão indisponível" | Decisão emissor/provedor |
| D1 | NF-05 Lista/KPIs Notas Fiscais | NÃO FEITO | `NotasFiscais.tsx:25-34` `useState([])` sem leitura de `notas_fiscais` | Ler do banco |
| D1 | NF-06 Baixar XML/DANFE | NÃO FEITO | `NotasFiscaisAbas.tsx:226,233` só toast | — |
| D1 | NF-07 Monitor SEFAZ em memória | NÃO FEITO | `EventosHistorico.tsx:23` importa `sefaz-event-logger` | — |
| D1 | NF-08 Captação DF-e | NÃO VERIFICÁVEL SEM BANCO | cron 32 "succeeded" só prova enfileiramento; código ainda exige `CRON_DISPATCH_SECRET` (`sefaz-dfe-dispatcher/index.ts:51`) e o cron envia `SEFAZ_CRON_SECRET` (ctx:cron.md) | Conferir `net._http_response` |
| D1 | NF-09 Certificado A1 | PARCIAL | IDOR corrigido; `empresas_certificados` = 0 | Cadastrar certificado |
| D1 | NF-10 Manifestação | NÃO FEITO (bloqueado) | `nfe_eventos` = 0 | — |
| D1 | NF-12 NF-e recebida → CP | PARCIAL | `nfe_create_conta_pagar_from_nfe` via `nfe-vinculo-proxy/index.ts:127` (manual) | Automático |
| D1 | NF-13 OCR de nota | NÃO FEITO | `processar-nf-ocr/index.ts:99-107,153-154` grava `arquivo_tipo`, `criado_por`, `mensagem_erro`; nenhuma existe em `notas_fiscais_ocr` (prod tem `erro_mensagem`) → INSERT falha | Alinhar colunas |

### 1.12 SPED (§4.12)
| Doc | Item/Etapa | Status | Evidência | O que falta |
|---|---|---|---|---|
| D1 | SP-01 DCTF/PER-DCOMP | NÃO FEITO | `ExportacaoSPED.tsx:53,59` `disponivel:false`, `:325` "Em breve" | — |
| D1 | SP-02 SPED Fiscal EFD ICMS/IPI | NÃO FEITO | sem gerador | — |
| D1 | SP-03 ECD/ECF com base real | PARCIAL | depende de CT-02/CT-04 | — |
| D1 | SP-04 Leiaute validado no PVA | NÃO VERIFICÁVEL SEM BANCO | — | — |
| D1 | SP-05 UF default `'SP'` | NÃO FEITO | `ExportacaoSPED.tsx:105` | — |

### 1.13 Dashboard/BI (§4.13)
FEITO: DB-01 (RPCs de totais existem).

| Doc | Item/Etapa | Status | Evidência | O que falta |
|---|---|---|---|---|
| D1 | DB-02 `vw_fluxo_caixa_diario` constante | NÃO FEITO | ctx:views.md: `2500.00/1200.00/1300.00 FROM empresas` | — |
| D1 | DB-03 Dashboard arrastável | NÃO FEITO | `DraggableDashboardGrid.tsx` ausente; `@dnd-kit/*` em `package.json:60-62` sem import em `src` | — |
| D1 | DB-04 Cockpit CFO | NÃO FEITO | grep `cockpit` = 0 | — |
| D1 | DB-05/06/07 Construtor, BI externo, ARIMA | NÃO FEITO | — | — |
| D1 | DB-08 Status page externa | NÃO FEITO | — | — |
| D1 | DB-09 `kpis_operacionais` | NÃO FEITO | sem escritor | — |
| D1 | DB-10 Telas sem menu | PARCIAL | 13/14 rotas agora em `src/components/layout`/`src/lib/navigation.ts`; `/theme-diagnostics` não | — |

### 1.14 Orçamento/centro de custo (§4.14)
FEITO: OR-03 (`movimentacoes.centro_custo_id` existe; pedido grava).

| Doc | Item/Etapa | Status | Evidência | O que falta |
|---|---|---|---|---|
| D1 | OR-01 Orçado × realizado só CP | NÃO VERIFICÁVEL SEM BANCO | não reinspecionado (`useBudget.ts`) | — |
| D1 | OR-02 Rateio | NÃO FEITO | grep `rateio` só PIS/COFINS e acordo | — |
| D1 | OR-04 Histórico do centro de custo | NÃO FEITO | `auditoria_financeira` sem escritor, 0 linhas (ctx:stats.md) | — |

### 1.15 Configurações/Admin (§4.15)
FEITO: AD-07 (`src/App.tsx` = 122 linhas).

| Doc | Item/Etapa | Status | Evidência | O que falta |
|---|---|---|---|---|
| D1 | AD-01 Preferências | NÃO FEITO | `SistemaTab.tsx:104,113,132` `checked={true}` | — |
| D1 | AD-02 Roteamento multi-CNPJ | NÃO FEITO | `RegrasRoteamentoTab.tsx:44-45` CNPJs fictícios | — |
| D1 | AD-03 Hub de Integrações | NÃO FEITO | `Integracoes.tsx:54,62,69,83` KPIs/status fixos | — |
| D1 | AD-04 "Gerar nova chave"/"Ver doc API" | NÃO VERIFICÁVEL SEM BANCO | `DocumentacaoAPI.tsx` só tem `onClick` de copiar (:90,107); botão citado não reinspecionado | — |
| D1 | AD-05 Automações `p13-*` | NÃO FEITO | `AutomacoesTab.tsx:33-40`; nenhum job `p13-` em ctx:cron.md | — |
| D1 | AD-06 `/design-system-debug` | NÃO FEITO | `App.tsx:35,69` | — |

### 1.16 Segurança/multi-empresa (§4.16)
FEITO: SG-02, SG-03, SG-04, SG-05 (`is_user_locked` existe e é chamada em `Auth.hooks.ts`), SG-14 (bucket existe), SG-17.

| Doc | Item/Etapa | Status | Evidência | O que falta |
|---|---|---|---|---|
| D1 | SG-01 RLS sem empresa | PARCIAL | script sobre ctx:policies.md: 12 policies `has_role` sem `empresa` em 6 tabelas com `empresa_id`: `bling_sync_logs`(2), `bling_webhook_events`(1), `overlay_rejeicoes_auditoria`(4), `query_telemetry`(3), `security_alerts`(1), `sso_role_mappings`(1) (era 47/34) | Escopar as 12 |
| D1 | SG-06 IP whitelist/país/dispositivo | NÃO FEITO | `is_ip_whitelisted`, `is_country_blocked`, `is_known_device` sem chamador (ctx:functions.md) | — |
| D1 | SG-07 Admin global × por empresa | NÃO FEITO (decisão) | `docs/ADR-003-PAPEIS-POR-EMPRESA.md:3` "proposto (aguarda decisão)" | Decisão do dono |
| D1 | SG-08 SoD / segurança por campo | NÃO FEITO | — | — |
| D1 | SG-09 WebAuthn | NÃO FEITO | `useWebAuthn.ts:22` `=false`; sem edge `webauthn-*` | — |
| D1 | SG-10 API pública por chave | NÃO FEITO | só `api-keys-manage` referencia `api_keys`; 0 chaves | — |
| D1 | SG-11 Webhooks de saída | NÃO FEITO | grep = 0 | — |
| D1 | SG-12 Audit log hash encadeado | NÃO FEITO | `audit_logs` sem `prev_hash` (ctx:tables) | — |
| D1 | SG-13 Rate limit IA/API paga | PARCIAL | 19/106 `index.ts` usam `checkRateLimit/rateLimit` | — |
| D1 | SG-15 `asaas_config` restrita a papéis | NÃO FEITO | policies "Users can view/update their own company asaas config" só `empresa_acessivel(empresa_id)` (ctx:policies.md) → qualquer papel lê as chaves | Restringir por papel |
| D1 | SG-16 `fornecedores` por empresa | PARCIAL | coluna `empresa_id` existe; policies `fornecedores_owner_*` por `user_id` | Policy por empresa |
| D1 | SG-18 Repo público / 23 credenciais | NÃO VERIFICÁVEL SEM BANCO | `docs/runbooks/ROTACAO_SECRETS.md:108-117` todas "—" | Rotação (ação do dono) |
| D1 | SG-19 CSP endurecida | NÃO FEITO | `vercel.json`: `unsafe-eval` 1×, `unsafe-inline` 2×, sem `report-to` | — |
| D1 | SG-20 Exceção do pacote de evidências | NÃO FEITO (divergente) | `SECURITY_RULES.md:85-91` diz admin global; `gerar-pacote-evidencias/index.ts:336-348` exige `user_empresas` | Alinhar doc ou código |

### 1.17 IA (§4.17)
| Doc | Item/Etapa | Status | Evidência | O que falta |
|---|---|---|---|---|
| D1 | IA-01 `LOVABLE_API_KEY` | NÃO VERIFICÁVEL SEM BANCO | 17 edges com `ai.gateway.lovable.dev` | — |
| D1 | IA-02 Stubs no lugar da IA | NÃO FEITO | TR-03..05 | — |
| D1 | IA-03 Feedback da conciliação IA | NÃO FEITO (nunca ativado) | `feedback_conciliacao_ia` = 0 | — |
| D1 | IA-04 Ações recomendadas | NÃO FEITO (nunca ativado) | `acoes_recomendadas` = 0 | — |
| D1 | IA-05 Previsão estatística | NÃO FEITO | — | — |

### 1.18 Integrações (§4.18)
FEITO: IN-07 (CNPJA, RPC existe — #438), IN-10 (colunas `sso_login_attempts` existem — #443), IN-13 (cron Lalamove removido).

| Doc | Item/Etapa | Status | Evidência | O que falta |
|---|---|---|---|---|
| D1 | IN-01 Evolution API | NÃO FEITO | ver CB-01 | — |
| D1 | IN-02 Bling | NÃO FEITO (nunca ativado) | `bling_tokens` = 0 | — |
| D1 | IN-03 Bitrix24 | NÃO FEITO (nunca ativado) | `bitrix_oauth_tokens` = 0; `sync-profile-to-bitrix` órfã | — |
| D1 | IN-04 Asaas | NÃO FEITO | ver §1.6 | — |
| D1 | IN-05 Open Finance | PARCIAL | ver CO-06 | — |
| D1 | IN-06 SEFAZ DF-e | NÃO VERIFICÁVEL SEM BANCO | ver NF-08..10 | — |
| D1 | IN-08 n8n | PARCIAL | HMAC implementado (`n8n-callback/index.ts:2`, enum `create_task/create_alert/log` :20); `n8n-dispatch` sem chamador; payload ainda lê `driver_id` (:190) | Eventos financeiros ou remoção |
| D1 | IN-09 Mapbox | NÃO FEITO | `mapbox-gl` em `package.json:117`, sem import em `src`; `get-mapbox-token` órfã | — |
| D1 | IN-10b SAML/SCIM uso real | NÃO VERIFICÁVEL SEM BANCO | — | — |
| D1 | IN-11 Resend/Slack | NÃO VERIFICÁVEL SEM BANCO | — | — |
| D1 | IN-12 Push web | PARCIAL | trigger de push crítico existe; `public/sw.js` e `public/sw-push.js` coexistem; `push_subscriptions` = 0 | Unificar SW |

### 1.19 LGPD/i18n/PWA (§4.19)
| Doc | Item/Etapa | Status | Evidência | O que falta |
|---|---|---|---|---|
| D1 | OU-01 LGPD exclusão | PARCIAL | `atendida_por` existe; `processar-solicitacao-lgpd/escrita.ts:41` anonimiza só `profiles` (#439 corrigiu efeito) | `auth.users`, `clientes`, logs |
| D1 | OU-02 Assinatura digital | NÃO FEITO | `AssinaturaDigital.tsx:51-52` simulação + `setTimeout(1500)` | — |
| D1 | OU-03 Campos customizados | NÃO FEITO | `custom_field_values` 0 refs | — |
| D1 | OU-04 i18n | NÃO FEITO | `useTranslation` em 2 arquivos | — |
| D1 | OU-05 Offline | NÃO FEITO | `offline.html` não referenciado | — |
| D1 | OU-06 Acessibilidade (fonte/contraste) | NÃO FEITO | grep toggle = 0 | — |
| D1 | OU-07 Feature flags | NÃO FEITO | `src/lib/feature-flags.ts` ausente | — |
| D1 | OU-08 Storybook | NÃO FEITO | `package.json:43-44` scripts; sem `.storybook/` | — |
| D1 | OU-09 Portal do contador | NÃO VERIFICÁVEL SEM BANCO | — | — |

### 1.20 Banco (§5)
| Doc | Item/Etapa | Status | Evidência | O que falta |
|---|---|---|---|---|
| D1 | §5.1 FKs sem índice (PLANO_50 15/16) | PARCIAL | ctx:lints.md: 6 `fk_without_index` (eram 21) | — |
| D1 | §5.1 índices duplicados/não usados/autovacuum (E-033/034, P50-17) | NÃO VERIFICÁVEL SEM BANCO | não há contagem no snapshot | — |
| D1 | §5.1 lint novo | NÃO FEITO | ctx:lints.md: 1 ALTA `secdef_mutable_search_path` em `gerar_lancamento_contabil_automatico()`; 118 `policy_auth_fn_not_wrapped` | — |
| D1 | §5.2 23 tabelas sem escritor | NÃO FEITO (21/23) | só `bitrix_field_mappings` e `darfs` (via RPC) ganharam escritor | — |
| D1 | §5.2 14 tabelas sem uso | NÃO FEITO (14/14) | 0 refs em `src`/`supabase/functions` | — |
| D1 | §5.2 `account_lockouts`, `obrigacoes_acessorias` | NÃO FEITO | ausentes em ctx:tables | — |
| D1 | §5.3 43 funções SQL órfãs | NÃO FEITO (42/43) | ctx:functions.md colunas código/cron/trigger vazias; só `confirmar_conciliacao` saiu; `gate_*` só em `scripts/` | — |
| D1 | §5.3 `run_integrity_cycle()` stub | NÃO FEITO | sql:6 `RETURN jsonb_build_object(...,'status','ok')`; cron 12 horário | — |
| D1 | §5.4 cron 32 `sefaz-dfe-dispatcher` | NÃO VERIFICÁVEL SEM BANCO | ver NF-08 | — |
| D1 | §5.4 crons 36/42 (401) | NÃO VERIFICÁVEL SEM BANCO | jobs "succeeded" (só enfileiramento) | Ler `net._http_response` |
| D1 | §5.4 réguas 09h+12h | NÃO FEITO | cron 24 falhando (ver CB-03) | — |
| D1 | §5.4 `refresh-benchmark-setorial-weekly` e `p13-*` | NÃO FEITO | ausentes | — |
| D1 | §5.4 `calcular-slo-metrics-diario`, `gerar-alertas-dispatcher`, `relatorio-diario-anomalias` sem cron | NÃO FEITO | refs = 0, ausentes em cron.md | — |
| D1 | §5.4 frequência dos jobs (P50-43) | PARCIAL | `detect-query-regressions-5min` agora `*/30`; `webhook-retry-worker` segue `* * * * *` | — |
| D1 | §5.5 Trigger de auditoria financeira | NÃO FEITO | `audit_trigger_generic` só em tabelas de segurança/config (ctx:triggers.md); `auditoria_financeira` 0 linhas | — |
| D1 | §5.5 Liquidação Asaas | NÃO FEITO | ver BP-02 | — |
| D1 | §5.6 Colunas usadas e ausentes | PARCIAL | 44/96 pares ainda ausentes em prod (script); confirmados ainda escritos/lidos: `notas_fiscais_ocr.{arquivo_tipo,criado_por,mensagem_erro}`, `historico_analises_preditivas.{analise_completa,dados_analisados,projecoes}` (`executar-analise-preditiva/index.ts:246-253`), `health_scores_operacionais.detalhes` (`calcular-health-score-operacional/index.ts:297`), `historico_cobranca_whatsapp.ia_sentimento` (`whatsapp-ai-analyzer/index.ts:73`), `contas_bancarias.mapeamento_extrato`, `contas_pagar.aprovado_em` (leitura); `TODO(2026-08-14)` caiu de 31 para 2 | Corrigir os 6 grupos confirmados |
| D1 | §5.7 `boletos` CHECK sem `gerado` | NÃO FEITO | ver BP-01 | — |

### 1.21 CI/CD, testes, operação (§6) e observabilidade (§7)
FEITO: CI-10 (`.github/dependabot.yml:15` `bun`), OB-01 (`edge_function_logs` ~172,5 mil linhas, ctx:stats.md), OB-10 (`vw_edge_health` filtra `request_end/request_error`), E-032 (`admin_only_integration_secrets` não existe em ctx:policies.md).

| Doc | Item/Etapa | Status | Evidência | O que falta |
|---|---|---|---|---|
| D1 | CI-01 Gates de banco sem `DATABASE_URL` | NÃO FEITO | `ci.yml:298-307` `require-env.sh --mode summary`; steps com `if: available == 'true'` (:313) | Falhar sem secret |
| D1 | CI-02/03/04/05/06/08/09/17/20 | NÃO VERIFICÁVEL SEM BANCO | dependem de API GitHub/Vercel (runs, secrets, branch protection) | — |
| D1 | CI-07 Deploy de edges rastreável | PARCIAL | 106 dirs = 106 remotas, `verify_jwt` 100% igual (script); paridade de bundle não verificável | — |
| D1 | CI-11 `audit-env` no CI | NÃO FEITO | grep em `.github/workflows` = 0 | — |
| D1 | CI-12 Gates `scripts/security/*` | PARCIAL | workflows chamam `test-canonical-db-gates.mjs`, `test-observability-privileges.sql` etc. | — |
| D1 | CI-13 Gates `scripts/integrity/*` | NÃO FEITO | só `14_retencao.sql` referenciado | — |
| D1 | CI-14 Graphify agendado | NÃO FEITO | `graphify.yml` sem `schedule` | — |
| D1 | CI-15 Lint estrito no CI | NÃO FEITO | `ci.yml:296` `bun run lint` (não `lint:strict`) | — |
| D1 | CI-16 `deno check/lint` em todas | NÃO VERIFICÁVEL SEM BANCO | só `deno-tests.yml:55` | — |
| D1 | CI-18 `npx @latest` sem pin | NÃO FEITO | `.codex/config.toml:14,25` | — |
| D1 | CI-19 README dos workflows | NÃO VERIFICÁVEL SEM BANCO | 20 workflows hoje | — |
| D1 | TE-01 Cobertura | NÃO VERIFICÁVEL SEM BANCO | não executado | — |
| D1 | TE-02 Edges sem teste | PARCIAL | 58/106 sem teste (script); sem teste em dinheiro/fisco: `processar-fila-cobrancas`, `enviar-relatorios-tributarios-agendados`, `conciliacao-ia`, `categorizar-despesa`, `detectar-anomalias-financeiras`, `bling-proxy`, `nfe-upload-certificado`, `calculo-iva`, `decidir-regime`, `scim-server`, `bitrix24-sync` | — |
| D1 | TE-03 Piso `deno coverage` | NÃO FEITO | grep `deno coverage` em workflows = 0 | — |
| D1 | TE-04..08, TE-10..12 | NÃO VERIFICÁVEL SEM BANCO | dependem de execução do CI | — |
| D1 | TE-09 400 em vez de 422 | PARCIAL | `DIVIDA_400_CONHECIDA` com 17 funções (`contract-coverage_test.ts:58-76`; eram 19) | — |
| D1 | OP-01..06, OP-12 (backup Storage, PITR/RTO, ensaio DR, uptime, rotação, post-mortems, SLA) | NÃO FEITO | `ROTACAO_SECRETS.md:108-117` vazio; `docs/postmortems` inexistente; `BACKUP_DR.md:18` RPO 24h sem confirmação | — |
| D1 | OP-09 `db:migrate = supabase db push` | NÃO FEITO | `package.json:40` | — |
| D1 | OP-10 `db:seed`/`storybook` | PARCIAL | `db:seed` (`package.json:42`); storybook sem config | — |
| D1 | §6.4 Dependências mortas | NÃO FEITO | ainda em `package.json`: `@dnd-kit/*`(60-62), `mapbox-gl`(117), `next-themes`(118), `ogl`(119), `react-resizable-panels`(127), `msw`(170); `lovable-tagger`(115) e `vitest-axe`(135) em `dependencies` | — |
| D1 | OB-02 `audit_logs` parada | NÃO VERIFICÁVEL SEM BANCO | ~420 linhas (eram 431); data da última linha não está no snapshot | — |
| D1 | OB-03 `frontend_error_logs` | NÃO FEITO | 0 linhas (ctx:stats.md) | — |
| D1 | OB-05/06 Sentry | NÃO VERIFICÁVEL SEM BANCO | DSN em Vercel/secrets | — |
| D1 | OB-07 Alerta de falha de cron | PARCIAL | `cron-failure-watch` ativo; cron 24 falha 3 dias seguidos (ctx:cron-runs.md) | — |
| D1 | OB-08 Painel de saúde do banco | NÃO FEITO | `gate_*` órfãos | — |
| D1 | OB-09 CSP report-to | NÃO FEITO | ver SG-19 | — |

### 1.22 Edge Functions (§8)
FEITO: `cnpja-lookup`, `conciliacao-proxy`, `webhook-retry-worker` (cron 33 manda só `{limit:50}`, ctx:cron.md; schema `index.ts:14`), `upload-anexo`, `external-data` (coluna existe), `sso-initiate`.

| Doc | Item/Etapa | Status | Evidência | O que falta |
|---|---|---|---|---|
| D1 | 13 edges órfãs | NÃO FEITO (13/13) | `calcular-slo-metrics-diario`, `calculo-iva`, `compare-schemas`, `gerar-alertas-dispatcher`, `get-mapbox-token`, `n8n-dispatch`, `projecao-reforma`, `relatorio-diario-anomalias`, `simular-presumido/real/simples`, `sync-profile-to-bitrix`, `executar-analise-preditiva`: 0 invocações em `src`/SQL/workflows/cron (script) | Ligar ou remover |
| D1 | `processar-fila-cobrancas` quebrada | NÃO FEITO | RPC ausente | — |
| D1 | `sefaz-dfe-dispatcher` / `enviar-digest-conformidade` / `monitorar-erros-frontend` | NÃO VERIFICÁVEL SEM BANCO | resposta HTTP não está no snapshot | — |
| D1 | 3 stubs + `enviar-alerta-email` simulado sem Resend | NÃO FEITO / NÃO VERIFICÁVEL | stubs confirmados; secret ilegível | — |
| D1 | `docs/EDGE_FUNCTIONS_CATALOG.md` | NÃO FEITO | `:3` "Total: 87 funções" (real: 106) | Regenerar |
| D1 | `supabase-js@2.49.4` nas edges (E-039) | NÃO FEITO | 98 ocorrências `supabase-js@2.49.4` em `supabase/functions` | — |

### 1.23 Planos (§9), docs (§10), enterprise (§11)
| Doc | Item/Etapa | Status | Evidência | O que falta |
|---|---|---|---|---|
| D1 | PLANO_100 E-003 / PLANO_MELHORIAS 1-2 rotação | NÃO VERIFICÁVEL SEM BANCO | sem registro de rotação | Ação do dono |
| D1 | E-006 Gate de migration não aplicada | PARCIAL | `migration-ledger.yml` existe; `CONTRIBUTING.md` sem regra (grep `migration` = 0) | — |
| D1 | E-013 `asaas_id/external_provider` | PARCIAL | colunas existem; CHECK bloqueia (BP-01) | — |
| D1 | E-026 CI falha sem `DATABASE_URL` | NÃO FEITO | ver CI-01 | — |
| D1 | E-030 TODO(2026-08-14) | PARCIAL | 2 restantes (2 arquivos) | — |
| D1 | E-035 `fornecedores.empresa_id` com RLS | PARCIAL | ver SG-16 | — |
| D1 | E-039 supabase-js edges | NÃO FEITO | ver §1.22 | — |
| D1 | P50-28 `as any` | PARCIAL | 159 `as any`/`as unknown as` fora de teste (eram 215) | — |
| D1 | P50-26 `getAppBaseUrl` vazio | NÃO VERIFICÁVEL SEM BANCO | `_shared/app-url.ts:13-19` lê 3 envs; comportamento sem env não reinspecionado | — |
| D1 | PLANO_MELHORIAS 27 consolidado | PARCIAL | `EmpresaScopeContext.tsx:136` ainda `ids[0]` | — |
| D1 | PLANO_MELHORIAS 50 / §10 `AGENTS.md` (sucessor do CLAUDE.md) | NÃO FEITO (divergente) | `AGENTS.md:9` "Vite 6, React 18" × `package.json:178` vite ^8.3.8, `:120` react ^19.3.1; `:7` "105 Edge Functions" × 106; `:66` "auto-sync N8N" | Atualizar |
| D1 | §10 `docs/TESTING.md` | NÃO FEITO | `:8` `npm run test:watch`, `:17` pasta `tests/`, `:24` `test:integration` | — |
| D1 | §9.13 ADR-001 resíduos | PARCIAL | `trigger_bitrix24_sync` ainda existe | — |
| D1 | §9.13 ADR-003 | NÃO FEITO (decisão) | `docs/ADR-003-PAPEIS-POR-EMPRESA.md:3` | — |
| D1 | §11 GAPS_ENTERPRISE (≈40 gaps não iniciados) | NÃO FEITO | nenhum dos módulos (CNAB, rateio, fechamento contábil, DFC indireto, multi-moeda, webhooks de saída, SoD…) aparece no código (greps acima) | — |

**MARCADO FEITO, NÃO ENCONTRADO (D1):** 0. Amostra de 40 artefatos citados como existentes conferida (ex.: `RegistrarPagamentoDialog.tsx`, `BloqueiosDuplicidade.tsx`, `ConciliacaoSplitDialog.tsx`, `FluxoInterEmpresas.tsx`, `ContadorReadonly.tsx`, `obter_totais_movimentacoes`, `registrar_evento_pagar`, 106/106 diretórios de edges); todos existem.

---

## 2. Auditoria financeira de 10/09 (`PLANO_..._100_ETAPAS`, `..._EVIDENCIAS`, `STATUS_2026-11-17`, `INTERFACE_E_INVENTARIO`, `VERIFICACOES.json`)

### 2.1 `STATUS_2026-11-17.md` — os 12 achados que ele deixou abertos
FEITO desde 17/11: F06 (`cashflow-scenarios.ts:72` comentário do `Math.random()` removido; 0 chamadas), F07 (`cashflow-scenarios.ts:249` `saldoMinimo: vazio ? saldoInicial : …`), F09 (`balancete-utils.ts:65-74` valor não finito impede fechamento), F10 (`BoletoBarcode.tsx:2` "Nao gera nada", recebe `codigoBarras/linhaDigitavel` do provedor), F16 (`useContasPagar.ts:17-55` lê paginado até 20.000, sem `.limit(1000)`).

| Doc | Item/Etapa | Status | Evidência | O que falta |
|---|---|---|---|---|
| D2 | F01 CSV BRL sem aspas | PARCIAL | `ofx-parser/utils.ts:108-128` `parseCSVLine` quebra pelo delimitador antes de `parseValorMonetario` | Detectar vírgula decimal com delimitador vírgula |
| D2 | F12 NF-e simulada | PARCIAL | inutilização/cancelamento/contingência agora recusam (ver NF-02..04); `NotasFiscais.tsx:25` sem leitura do banco; `NotasFiscaisAbas.tsx:226,233` XML/DANFE só toast | — |
| D2 | F21 Elisão delete+insert | PARCIAL | `useOportunidadesElisao.ts:158-176` agora insere antes e checa erro dos dois passos; ainda 2 chamadas não atômicas | RPC transacional |
| D2 | F23 E2E com asserções condicionais | NÃO FEITO | `e2e/contas-pagar.e2e.ts`: 12 `isVisible()` condicionais | Esperar estado |
| D2 | F24 Gates SQL condicionais | NÃO FEITO | ver CI-01 | — |
| D2 | F25 `docs/TESTING.md` | NÃO FEITO | ver §1.23 | — |
| D2 | F27 `transmitirApuracao` | PARCIAL | `useApuracoesTributarias.ts:~309-317` só `throw`; botão segue chamando (`ApuracaoMensal.tsx:150`) | Esconder botão ou integrar |

### 2.2 `AUDITORIA_FINANCEIRA_EVIDENCIAS_2026-09-10.md` (F01–F28)
Os 28 achados batem com 2.1: 16 corrigidos já em 17/11 + F06, F07, F09, F10, F16 hoje = **21 FEITO**; pendentes = F01, F12, F21, F23, F24, F25, F27 (tabela 2.1). Artefatos citados como corrigidos existem (`CustomerDeepScore.tsx`, `MetricasPorCanal.tsx`, `ConviteUsuarioDialog.tsx`, `api-keys-manage/index.ts`, `export-utils.ts`, `transaction-matcher/converters.ts`, `ProjectedCashFlowChart.test.tsx`, `currency.test.ts`) — **0 MARCADO FEITO, NÃO ENCONTRADO**.

### 2.3 `PLANO_AUDITORIA_FINANCEIRA_100_ETAPAS_2026-09-10.md`
As 100 etapas continuam `- [ ]` (grep `- [x]` = 0). Quase todas exigem homologação com dados/provedor (não verificável sem banco). Classificação por evidência de código:

| Doc | Item/Etapa | Status | Evidência | O que falta |
|---|---|---|---|---|
| D2 | 001, 002, 007, 089, 096, 099, 100 (inventário, base de homologação, isolamento A/B, matriz de cliques, volume, canário, aceite) | NÃO VERIFICÁVEL SEM BANCO | sem staging; checklist vazio | Homologação |
| D2 | 003 origem dos indicadores | PARCIAL | F13/F14/F15 corrigidos; `vw_fluxo_caixa_diario` constante (DB-02) | — |
| D2 | 004 precisão monetária / 005 datas | FEITO | F02–F05 | — |
| D2 | 006 invariantes/idempotência | PARCIAL | RPCs atômicas de aprovação/DARF/NF-e/conciliação existem; pagar/receber não geram movimentação | — |
| D2 | 008 alçadas e SoD | NÃO FEITO | AP-07, CP-11, CP-21 | — |
| D2 | 009 vazio/erro/sucesso parcial | PARCIAL | F19/F26 corrigidos | — |
| D2 | 010 autenticação degradada | NÃO VERIFICÁVEL SEM BANCO | — | — |
| D2 | 011 cadastro CP | PARCIAL | CP-01 FEITO; CP-12 não | — |
| D2 | 012 **duplicidade** | PARCIAL | índices únicos parciais `idx_contas_pagar_prevent_duplicates` / `idx_contas_receber_prevent_duplicates` (ctx:tables, #455) + `src/pages/BloqueiosDuplicidade.tsx`; importação repetida/concorrência não homologadas | Homologar |
| D2 | 013 aprovação multinível | NÃO FEITO | AP-04 (quorum não aplicado) | — |
| D2 | 014 juros/multa/desconto | NÃO VERIFICÁVEL SEM BANCO | — | — |
| D2 | 015 pagamentos parciais múltiplos | PARCIAL | CP-02 (sem histórico) | — |
| D2 | 016 cancelar/estornar/excluir | NÃO FEITO | CP-07/08/09, CR-14/15 | — |
| D2 | 017 filtros após paginação | NÃO VERIFICÁVEL SEM BANCO | KPIs agora sobre leitura completa (F16); filtro pós-página não reinspecionado | — |
| D2 | 018 totais CP | FEITO | F16 | — |
| D2 | 019 recorrência/parcelamento | NÃO FEITO | CP-12, CP-13, CR-02, CR-03 | — |
| D2 | 020 compras → CP | NÃO FEITO | CM-01, CM-03 | — |
| D2 | 021–025, 028, 030 (cadastro CR, parciais, aging, renegociação, comercial, portal, devolução) | PARCIAL / NÃO FEITO | CR-08 parcial; CR-15 e CB-09 não | — |
| D2 | 026 scores fictícios / 029 históricos inventados | FEITO | F13, F15 | — |
| D2 | 027 timeline de cobrança verificável | NÃO FEITO | CR-12 sem registro | — |
| D2 | 031 moeda no CSV | PARCIAL | F01 | — |
| D2 | 032 datas inválidas | FEITO | F02 | — |
| D2 | 033, 034, 036, 039, 040 (formatos, idempotência import, matcher, multiempresa, extrato×razão) | NÃO VERIFICÁVEL SEM BANCO | — | — |
| D2 | 035 residual na conciliação | FEITO | F11 | — |
| D2 | 037 confirmação atômica | PARCIAL | RPC 6 args existe; sobrescreve `valor_pago` (CO-03) | — |
| D2 | 038 desfazer | PARCIAL | CO-02 | — |
| D2 | 041 abertura de conta / 042 unificar `TransferenciaDialog` / 043 concorrência | NÃO FEITO / PARCIAL | dois diálogos seguem (`financeiro/` e `contas-bancarias/`), só um valida saldo (TS-08) | — |
| D2 | 044 vínculos de movimentações | FEITO | F22 | — |
| D2 | 045, 047, 048, 049 (30 dias, risco, vazio, residual gráfico) | FEITO | F17, F08, F07, F18 | — |
| D2 | 046 cenários reproduzíveis | FEITO | F06 | — |
| D2 | 050 intercompany | NÃO FEITO | TS-09 | — |
| D2 | 051 instrumentos fictícios | FEITO | F10 | — |
| D2 | 052 emissão de boleto | NÃO FEITO | BP-01 (CHECK recusa `'gerado'`) | — |
| D2 | 053 numeração atômica | NÃO VERIFICÁVEL SEM BANCO | — | — |
| D2 | 054–057, 060 (webhooks, Pix, cancelamento, remessa/retorno) | NÃO FEITO / NÃO VERIFICÁVEL | Asaas nunca ativado; CNAB inexistente | — |
| D2 | 058 **régua** | NÃO FEITO | CB-03 cron 24 falhando; CB-01 sem envio real | — |
| D2 | 059 métricas de canal | FEITO | F14 | — |
| D2 | 061 isolar NF-e simulada | PARCIAL | F12 | — |
| D2 | 062–070 (fiscal real, XML, DF-e, catálogos, IRPJ, PIS/Cofins, retenções, simuladores, fechamento) | NÃO VERIFICÁVEL SEM BANCO / PARCIAL | 070: F27 parcial; PER/DCOMP não grava mais "transmitido" (`usePerDcomp.ts:72`) | — |
| D2 | 071 partidas dobradas | PARCIAL | gravação normalizada (CT-01/03); leitura quebrada (CT-02) | — |
| D2 | 072 balancete NaN | FEITO | F09 | — |
| D2 | 073–075 DRE/balanço/caixa×competência | NÃO FEITO | CT-02 faz DRE/balanço por competência somarem zero | — |
| D2 | 076–078, 080 (orçamento, rateio, eventos, BI) | NÃO FEITO / NÃO VERIFICÁVEL | OR-02 | — |
| D2 | 079 exportações | PARCIAL | F28 FEITO; CP-23 XLSX não | — |
| D2 | 081, 084–088, 090 (cadastros, Bling, Asaas/OF, Bitrix, segurança, notificações, a11y) | NÃO VERIFICÁVEL SEM BANCO | integrações nunca ativadas | — |
| D2 | 082 convite / 083 API keys | FEITO | F19, F20 | — |
| D2 | 091 denominador de cobertura | NÃO VERIFICÁVEL SEM BANCO | não executado | — |
| D2 | 092 falsos positivos E2E | NÃO FEITO | F23 | — |
| D2 | 093 contratos de todas as edges | PARCIAL | matriz regenerada: 35/106 com teste local; 54 sem `invalid_json` | — |
| D2 | 094 código × banco canônico | PARCIAL | snapshot `origin/contexto` diário existe; 44 pares de coluna ainda divergem (§1.20) | — |
| D2 | 095 SQL no aceite real | NÃO FEITO | F24 | — |
| D2 | 097 observabilidade por operação | PARCIAL | OB-01 ativo; `audit_logs` estagnado | — |
| D2 | 098 docs/resíduos | NÃO FEITO | F25, AGENTS.md, catálogo de edges | — |

### 2.4 `VERIFICACOES.json` e `INTERFACE_E_INVENTARIO.md`
| Doc | Item/Etapa | Status | Evidência | O que falta |
|---|---|---|---|---|
| D2 | `lint.log`: 13 warnings | NÃO VERIFICÁVEL SEM BANCO | `node_modules` ausente nesta sessão (não executado); CI roda `lint` sem `--max-warnings` (ci.yml:296) | Rodar `lint:strict` |
| D2 | `build.log`: build sem env falha | NÃO VERIFICÁVEL SEM BANCO | comportamento esperado (guard de env) | — |
| D2 | `cobertura-global.log` reprova thresholds | NÃO VERIFICÁVEL SEM BANCO | não executado | — |
| D2 | Interface: `/tributario/relatorios-contabeis` crash | FEITO | F26 | — |
| D2 | Interface: `/usuarios` "Convidar" não comprovado | NÃO VERIFICÁVEL SEM BANCO | fluxo F19 corrigido; clique não reexecutado | — |
| D2 | Interface: 8 rotas não exercitadas (`/__especimes`, `*` …) / 127 "sem exceção não comprova função" | NÃO VERIFICÁVEL SEM BANCO | sondas `navegacao.mjs` desatualizadas (STATUS:31-35) | Atualizar sonda |

---

## 3. `docs/auditoria-20260912/PARIDADE_EDGE.md` + `evidencias.json` + `reproduzir-lacunas.cjs`
FEITO: `api-keys-manage` publicada (ctx:edge-functions.md, ACTIVE v105); 3 divergências de JWT (`ci-security-gate-log`, `n8n-callback`, `notify-performance-alert`) agora `false/false` — script: 106 locais = 106 remotas, 0 divergência de `verify_jwt` com `supabase/config.toml`; advisor `rls_enabled_no_policy` (estrategias_elisao_catalogo) e `security_definer_view` (14) resolvidos; as 3 lacunas reproduzidas pelo `.cjs` foram fechadas (`expert-actions/financial-actions.ts:265-272` boleto "indisponível"; `usePerDcomp.ts:72` não marca transmitido/compensado).

| Doc | Item/Etapa | Status | Evidência | O que falta |
|---|---|---|---|---|
| D3 | 57 bundles divergentes (fonte remota × git) | NÃO VERIFICÁVEL SEM BANCO | snapshot traz só metadados/versão (ctx:edge-functions/<slug>/README.md); Management API devolve bundle compilado | Comparar via MCP `get_edge_function` |
| D3 | 323 migrations só remotas / 563 só locais (ledger) | PARCIAL | ctx:migrations.md tem 1.045 versões; as 55 críticas estão lá; reconciliação total não refeita | — |
| D3 | Advisor `function_search_path_mutable` (17) | PARCIAL | ctx:lints.md: 1 restante (`gerar_lancamento_contabil_automatico`) | — |
| D3 | Advisors `anon/authenticated_security_definer_function_executable` (3/57), `materialized_view_in_api` (2), `auth_leaked_password_protection` | NÃO VERIFICÁVEL SEM BANCO | não constam do lints.md atual (que é outro coletor) | Rodar advisors |
| D3 | Deno: 23 de 48 testes fora da seleção explícita do CI | PARCIAL | STATUS F24: `deno-tests.yml:120-130` passou a descobrir por diretório | — |

---

## 4. Relatórios de 07–10/2026

### 4.1 `docs/VALIDACAO_EXAUSTIVA_R2_2026-09-03.md`
FEITO: G4 lockout (`get_lockout_details` com EXECUTE p/ authenticated; front usa wrapper `is_user_locked`, `Auth.hooks.ts:226`), M1 migrations aplicadas, B2 KPIs >1000 (RPC + leitura paginada), B4 `@ts-nocheck` (0 em `src`), §3.1 `USING(true)` nas 5 tabelas (0 em ctx:policies.md), F1–F7 conferidos (`sso-callback/index.ts:912-934`, `.sub` em `cnpja-lookup:117`/`enviar-bitrix24-tributario:93`).

| Doc | Item/Etapa | Status | Evidência | O que falta |
|---|---|---|---|---|
| D4a | G2 `external-data` cross-org | PARCIAL (decidido como intencional) | `external-data/index.ts:148-153` comenta base externa compartilhada; exige vínculo ativo, sem filtro por empresa | Confirmar decisão do dono |
| D4a | G3 `validate-ip-geo` log poisoning | PARCIAL | rate limit (`:138-146`) e campo renomeado `email_informado` (:111-118); e-mail segue não validado | — |

### 4.2 `docs/AUDITORIA_TECNICA_EXAUSTIVA_2026-09-02_R2_LIVE.md`
FEITO: ações #2 (migrations aplicadas), #5 lockout (wrapper), #7 lockfiles (`bun.lockb`/`package-lock.json` ausentes), #10 CORS (`_shared/cors.ts:78-79` `corsHeadersPara(req)`), INP (`telemetry.ts:15,292`), `@ts-nocheck`, `useIRPJCSLL` com `periodo_inicio/fim` (:105-122), `useReguaCobranca` `dias_gatilho?: number[]` (:29), `bling-proxy` RBAC em ações destrutivas (:80-95), `copilot-global` usa cliente do usuário/RLS (:276), `sso-initiate` rate limit (:117).

| Doc | Item/Etapa | Status | Evidência | O que falta |
|---|---|---|---|---|
| D4b | #1 rotacionar `SUPABASE_ACCESS_TOKEN` | NÃO VERIFICÁVEL SEM BANCO | — | — |
| D4b | #3 `DATABASE_URL` / gates psql | NÃO FEITO | ver CI-01 | — |
| D4b | #4 branch protection / #6 E2E logout | NÃO VERIFICÁVEL SEM BANCO | API GitHub | — |
| D4b | #8 `compare-schemas` / `SCHEMA_COMPARE_EXTERNAL_URL` | NÃO FEITO | `compare-schemas/index.ts:24` segue; função órfã | Aposentar |
| D4b | #9 CLAUDE.md/AGENTS.md atualizado | NÃO FEITO | ver §1.23 | — |
| D4b | `sso-initiate` `select('*')` carrega `client_secret` | NÃO FEITO | `sso-initiate/index.ts:68-71` | Colunas explícitas |
| D4b | `health` exposto a qualquer JWT | NÃO FEITO | `health/index.ts` sem `exigirPapel` (grep = 0) | — |
| D4b | `sso-logout` sem tolerância a token expirado | NÃO VERIFICÁVEL SEM BANCO | `sso-logout/index.ts:26-29` exige `claims.sub` | — |
| D4b | Sprint 1/2: MFA `aal2`, `strictNullChecks`, Sentry real, `resilience.ts` em Bitrix/WhatsApp/OF, uptime externo | NÃO VERIFICÁVEL SEM BANCO / NÃO FEITO | OP-04 e OP-07 não feitos | — |
| D4b | R2.3: ~96 policies reais sem escopo no replay | PARCIAL | prod hoje: 12 em 6 tabelas (SG-01) | — |

### 4.3 `docs/REAUDITORIA_FINAL.md` (template 50 etapas, 31/10)
FEITO hoje (estavam pendentes): 3 (`analise-preditiva/index.ts:44` `exigirUsuarioComEmpresa`), 4 e 5 (`nfe-upload-certificado`, `executar-fechamento-tributario` com `exigirVinculoEmpresa`), 12 (gitleaks em `ci.yml` e `.husky/pre-commit`), 13 (`chave_anon_vault()` em prod), 15 (`eslint-rules/no-floating-supabase-write.js`, `eslint.config` :6,36), 16 e 17 (RPCs atômicas), 19 (`registrar_nfe_com_creditos` com `empresa_acessivel`, sql:17), 22 e 49-views (18/18 views `security_invoker`), 28 (`src/lib/arquitetura/__tests__/escopo-querykey.test.ts`), 29 (nenhum `*.spec.ts` em `e2e/`; `playwright.config.ts:161` `**/*.e2e.ts`), 38 (`.husky/pre-push`), 39 e 40 (`paridade-motor-edge.test.ts`, `_shared/sped/bloco9_test.ts`, `exportar-sped-contribuicoes/layout_test.ts`).

| Doc | Item/Etapa | Status | Evidência | O que falta |
|---|---|---|---|---|
| D4c | 1, 2 rotação service_role / migrate-helper | NÃO VERIFICÁVEL SEM BANCO | — | Ação do dono |
| D4c | 6 `executar-relatorios` guard condicional | PARCIAL | IDOR por `relatorio_id` fechado (`:91-109`), mas relatório com `empresa_id` nulo passa vazio pelo check e geradores rodam sem filtro (`:265`, `:313`, `:350` `if (empresaId)`) com service_role | Exigir empresa |
| D4c | 11 ADR papéis por empresa (marcado ✅ APLICADO) | PARCIAL (divergente) | `docs/ADR-003-PAPEIS-POR-EMPRESA.md:3` "proposto (aguarda decisão)" | Decisão do dono |
| D4c | 23 empresaId em queryKeys | NÃO VERIFICÁVEL SEM BANCO | teste de arquitetura existe; contagem não refeita | — |
| D4c | 27 modo consolidado | PARCIAL | `EmpresaScopeContext.tsx:136` `ids[0]` | — |
| D4c | 34 gate RLS/GRANT obrigatório | NÃO FEITO | ver CI-01 | — |
| D4c | 35 revisão obrigatória (marcado ✅) | NÃO VERIFICÁVEL SEM BANCO | branch protection via API | — |
| D4c | 37 Actions Node 20 | NÃO VERIFICÁVEL SEM BANCO | actions fixadas por SHA; runtime não conferido | — |
| D4c | 41 testes de cobrança | PARCIAL | só `executar-regua-cobranca/domain.test.ts` | — |
| D4c | 42 testes conciliação/categorização IA | NÃO FEITO | `conciliacao-ia`, `categorizar-despesa` sem teste | — |
| D4c | 43 testes integração externa | PARCIAL | testes de `bling-webhook`/`bitrix24-webhook`; proxies sem teste | — |
| D4c | 44 piso cobertura edges / Sentry | NÃO FEITO | grep `deno coverage` = 0 | — |
| D4c | 45 grafo | NÃO VERIFICÁVEL SEM BANCO | `graphify.yml` sem schedule | — |
| D4c | 46, 47 branches/commits órfãos | NÃO VERIFICÁVEL SEM BANCO | PRs #428/#454/#458 dizem fechado (doc, não conferido) | — |
| D4c | 49 migrations fora do padrão | NÃO FEITO | `001`–`003` | — |
| D4c | 50 deriva do CLAUDE.md | NÃO FEITO | ver §1.23 | — |

### 4.4 `docs/QA_EXHAUSTIVE_REPORT.md` (22/07)
| Doc | Item/Etapa | Status | Evidência | O que falta |
|---|---|---|---|---|
| D4d | Próx. 1 E2E autenticado (300+ cenários) | NÃO VERIFICÁVEL SEM BANCO | — | — |
| D4d | Próx. 2 revogar EXECUTE de SECURITY DEFINER | NÃO VERIFICÁVEL SEM BANCO | grants não reinspecionados | — |
| D4d | Próx. 3 modularizar >400 linhas | PARCIAL | `App.tsx` 122 linhas; demais não medidos | — |

### 4.5 `docs/QA_VALIDATION_REPORT.md` (22/07)
| Doc | Item/Etapa | Status | Evidência | O que falta |
|---|---|---|---|---|
| D4e | #2 27 SECURITY DEFINER executáveis | NÃO VERIFICÁVEL SEM BANCO | — | — |
| D4e | #3 CSP enforcement | NÃO FEITO | `unsafe-eval`/`unsafe-inline` em `vercel.json` | — |
| D4e | #4 rollbacks | NÃO VERIFICÁVEL SEM BANCO | — | — |
| D4e | #6 testes `export-contabil`, `sefaz-contingency/xml`, e2e drilldown | NÃO VERIFICÁVEL SEM BANCO | não reinspecionado | — |
| D4e | #7 `as any` | PARCIAL | 159 ocorrências fora de teste | — |
| D4e | #8 future flags React Router | NÃO VERIFICÁVEL SEM BANCO | — | — |
| D4e | #1 jspdf ≥4.3 / #5 índice `alert_configurations` | NÃO VERIFICÁVEL SEM BANCO | não conferido | — |

### 4.6 `docs/SCENARIOS.md`
Harness existe (`src/test/scenarios/{generator,invariants,faults,runner,report,rng,types}.ts`, `fixtures/{conciliacao,webhooks,cobranca,anomalias,nfe}.ts`, `scripts/run-scenarios.ts`) e roda no Vitest (`vitest.config.ts:36` inclui `*.spec`). `scenarios.spec.ts:9` executa N cenários × todas as invariantes.

| Doc | Item/Etapa | Status | Evidência | O que falta |
|---|---|---|---|---|
| D4f | Invariante `idempotencyWebhook` — teste unitário ok+violado | PARCIAL | definida (`invariants.ts`); 0 menções em `__tests__/invariants.spec.ts` (coberta só pelo combinatório) | Teste dedicado (regra do próprio doc) |
| D4f | Invariante `contagemConciliada` — teste unitário | PARCIAL | idem | idem |
| D4f | Falhas `flaky`, `latency`, `partial_write` — teste dedicado | PARCIAL | definidas em `faults.ts`; 0 arquivos em `__tests__` as citam | — |
| D4f | Execução no CI ("CI exaustivo" `SCENARIOS_COUNT=2000`) | NÃO FEITO | grep `scenarios` em `.github/workflows/ci.yml` = 0 (roda só no default do Vitest) | — |

### 4.7 `docs/contract-conformance-summary.md`
| Doc | Item/Etapa | Status | Evidência | O que falta |
|---|---|---|---|---|
| D4g | Documento desatualizado | NÃO FEITO | `node scripts/ci/gerar-matriz-conformidade-contratos.mjs --check` → "desatualizados"; regenerado em cópia: 35 com teste (33%) × 34 no doc; `contabilizar-evento` ganhou teste (#473); script não roda no CI (grep workflows = 0) | Regenerar + gate |
| D4g | 71/106 funções sem teste local | NÃO FEITO | matriz regenerada | — |
| D4g | 57 funções com body sem resposta 422 / 54 sem `invalid_json` | NÃO FEITO | matriz regenerada | — |
| D4g | Só 5 com cobertura evidenciada de JSON malformado | NÃO FEITO | idem | — |
| D4g | 82/106 sem guard canônico detectado (`exigir*`) | NÃO VERIFICÁVEL SEM BANCO | heurística do gerador; várias usam guard próprio | — |

---

## Funcionalidades esperadas do financeiro (pedido explícito)
| Funcionalidade | Existe? | Evidência |
|---|---|---|
| Baixa automática por extrato | PARCIAL | `BaixaAutomaticaDialog.tsx:78` (valor ±0,05 / data), grava `logs_baixa_automatica` (:193); sem nosso número/CNPJ |
| Baixa automática Asaas (webhook) | NÃO | sem trigger de liquidação; `asaas-webhook` não toca `contas_receber` |
| Lançamento bancário (saldo) | PARCIAL | `trg_saldo_movimentacao` + transferência → movimentação; pagar/receber/conciliar não lançam |
| Régua de cobrança | PARCIAL | cron 2 (`executar-regua-cobranca`) OK; cron 24 falha diariamente; envio WhatsApp só `wa.me` |
| Quorum de aprovação | NÃO | `aprovadores_obrigatorios` salvo e ignorado; RPC aprova com 1 |
| Duplicidade | SIM (homologação pendente) | índices únicos parciais em CP/CR (#455) + tela de bloqueios |

---

## Contagens (só itens listados nas tabelas; FEITO contado à parte)
| Documento | FEITO (desde a auditoria) | PARCIAL | NÃO FEITO | MARCADO FEITO, NÃO ENCONTRADO | NÃO VERIFICÁVEL SEM BANCO |
|---|---:|---:|---:|---:|---:|
| D1 `AUDITORIA_PLANEJADO_X_EXECUTADO_2026-10-12` (249 linhas pendentes) | ≈66 (≈56 IDs de §4/§6/§7/§8 + 10 itens de §3) | 45 | 178 | 0 | 26 |
| D2 auditoria 10/09 (STATUS + EVIDÊNCIAS + 100 etapas + VERIFICACOES + INTERFACE) | F-achados: 21/28 (5 fechados após 17/11); 100 etapas: 13 linhas FEITO (≈20 etapas) | 20 | 19 | 0 | 14 |
| D3 `PARIDADE_EDGE` + evidências | 5 (JWT 3/3, `api-keys-manage`, 2 advisors, 3 lacunas do `.cjs`) | 3 | 0 | 0 | 2 |
| D4a `VALIDACAO_EXAUSTIVA_R2` | 6 | 2 | 0 | 0 | 0 |
| D4b `AUDITORIA_TECNICA_EXAUSTIVA_R2_LIVE` | 11 | 1 | 5 | 0 | 4 |
| D4c `REAUDITORIA_FINAL` | 17 | 5 (inclui etapa 11, marcada ✅ com ADR ainda "proposto") | 5 | 0 | 6 |
| D4d `QA_EXHAUSTIVE_REPORT` | 0 | 1 | 0 | 0 | 2 |
| D4e `QA_VALIDATION_REPORT` | 0 | 1 | 1 | 0 | 5 |
| D4f `SCENARIOS` | harness existe | 3 | 1 | 0 | 0 |
| D4g `contract-conformance-summary` | — | 0 | 4 | 0 | 1 |

Notas de contagem: "PARCIAL/NÃO FEITO/NÃO VERIFICÁVEL" = linhas das tabelas (um item por linha; algumas linhas agrupam IDs, ex. CP-15..18 separados, DB-05/06/07 juntos). "MARCADO FEITO, NÃO ENCONTRADO" = 0 em todos: nenhum artefato declarado pronto está ausente; a única divergência de "feito" é a etapa 11 do REAUDITORIA (ADR existe, decisão não), contada como PARCIAL.

## Achados de maior impacto (novos ou que persistem apesar de PR que os "corrigiu")
1. NOVO — Cron 24 `processar-regua-cobranca-diario` **falha todo dia** desde ao menos 17/11 ("Sem permissão para esta empresa") — ctx:cron-runs.md.
2. PERSISTE — Boleto via Asaas continua quebrando no INSERT local: `status:'gerado'` × `chk_boletos_status` (ctx:tables/public/boletos.md:68; `useBoletos.ts:109`) — colunas foram criadas (#424) mas o CHECK não.
3. PERSISTE — DRE/balanço por competência, razão/diário, pré-validação SPED e verificação de integrações comparam `'D'/'C'` com dados gravados como `debito/credito` (CT-02) → somam zero.
4. PERSISTE — INSERT/UPDATE em colunas ainda inexistentes: `processar-nf-ocr` (3), `executar-analise-preditiva` (3), `calcular-health-score-operacional` (`detalhes`), `whatsapp-ai-analyzer` (`ia_sentimento`).
5. NOVO — `asaas_config` (chaves de API) legível por qualquer papel com vínculo à empresa (policies "Users can view/update their own company asaas config").
6. NOVO — `executar-relatorios`: relatório sem `empresa_id` roda geradores sem filtro com service_role (`:265,:313,:350`).
7. NOVO — Lint ALTA: `gerar_lancamento_contabil_automatico()` SECURITY DEFINER sem `search_path` (ctx:lints.md).

---

## Anexo — W1 Varredura de código: automações (cron), secrets e canais de envio

Três agentes independentes, cegos aos achados já escritos, releram o código e o snapshot de produção. Tabelas completas (campo `local` truncado a 55-70 caracteres para legibilidade).

### C6 — Automações prometidas vs. cron real de produção (33 jobs ativos)

| ID | Local | Item | Status | Funcionalidade afetada |
|---|---|---|---|---|
| C6-001 | cron job 24 processar-regua-cobranca-diario (`0 9 * * * | Job da régua de cobrança das 09:00 falha todo dia | JOB_FALHANDO | Régua de cobrança automática diária (versão SQL das 09:00): não processa nenhuma empresa e gera erro |
| C6-002 | cron job 43 enviar-digest-conformidade-diario (`0 8 * * | Job com comando placeholder | JOB_PLACEHOLDER | Digest diário de conformidade tributária: o job 'diário' não envia nada (o envio real depende do job |
| C6-003 | cron job 12 integrity-invariants-hourly → public.run_in | Job horário de invariantes de integridade é no-op | JOB_PLACEHOLDER | Verificação automática de integridade dos dados financeiros: aparece como 'ok' sem checar nada |
| C6-004 | cron job 17 recarregar-seeds-fiscais-diario → public.re | Job diário de recarga de seeds fiscais é no-op | JOB_PLACEHOLDER | Atualização diária das tabelas fiscais (alíquotas por UF): o painel de cobertura fiscal mostra uma ' |
| C6-005 | cron job 13 maintain-monthly-partitions (`0 0 1 * *`) → | Manutenção mensal de partições provavelmente não faz nada | JOB_PLACEHOLDER (provável, NÃO VERIFICADO) | Manutenção automática das tabelas de log de erros e auditoria: o job roda, mas não cria partições |
| C6-006 | cron job 40 gerar-snapshots-conformidade-mensal (`0 4 5 | Job mensal chama uma função com verify_jwt ligado sem enviar Authorization nem a | PROVAVEL_401 (NÃO VERIFICADO) | Fotografia mensal de conformidade tributária e alertas de tendência (alertas_tributarios): podem nun |
| C6-007 | cron job 42 enviar-digest-conformidade-horario → public | Digest de conformidade chama uma edge com verify_jwt ligado mandando só 'apikey' | PROVAVEL_401 (NÃO VERIFICADO) | E-mail de digest de conformidade (diário/semanal configurável em PreferenciasDigest) pode não estar  |
| C6-008 | src/components/admin/CronJobsStatus.tsx:24,155; supabas | Cron diário de alertas tributários prometido sem job agendado | SEM_CRON | Alertas tributários automáticos (sublimite do Simples, Fator R, vencimentos, IRPFM) e o painel 'Stat |
| C6-009 | supabase/functions/enviar-relatorios-tributarios-agenda | Envio de relatórios tributários agendados ('Cron diário 06:00') sem job | SEM_CRON | Relatórios tributários agendados pelo usuário no Dashboard Tributário nunca são enviados por e-mail |
| C6-010 | supabase/functions/executar-relatorios/index.ts:62-64,7 | Execução em lote de relatórios agendados (por proximo_envio) depende de cron ine | SEM_CRON | Relatórios agendados (diário/semanal/mensal) em /relatorios: a frequência escolhida não é cumprida,  |
| C6-011 | src/components/admin/AutomacoesTab.tsx:33-40,43-46 (p13 | Automação 'Health Score diário (07:00)' listada na tela sem job | SEM_CRON | Health score operacional das empresas não é recalculado diariamente |
| C6-012 | src/components/admin/AutomacoesTab.tsx:47-50 (p13-detec | Detector de anomalias 'a cada 30 min' sem job | SEM_CRON | Detecção automática de anomalias financeiras: só roda quando alguém clica |
| C6-013 | src/components/admin/AutomacoesTab.tsx:51-54 (p13-resum | Resumo executivo semanal 'Domingos 18:00' sem job e com secret de IA ausente | SEM_CRON + SECRET_AUSENTE | Resumo executivo semanal por e-mail/tela nunca é gerado automaticamente (e falha mesmo no manual) |
| C6-014 | src/components/admin/AutomacoesTab.tsx:55 (p13-refresh- | Refresh semanal do benchmark setorial 'Segundas 03:00' sem job | SEM_CRON | Comparativo com o setor (benchmark) não é atualizado |
| C6-015 | src/components/admin/AutomacoesTab.tsx:56-59 (p13-gerar | Geração diária de 'Top 5 ações por IA (06:00)' sem job e sem secret de IA | SEM_CRON + SECRET_AUSENTE | Ações recomendadas diárias por IA no painel |
| C6-016 | src/components/admin/AutomacoesTab.tsx:60-63 (p13-clean | Limpeza de ações expiradas '05:55' sem job | SEM_CRON | Expiração automática de ações recomendadas antigas |
| C6-017 | supabase/functions/calcular-slo-metrics-diario/index.ts | Snapshot diário de SLO sem job | SEM_CRON | Painel de SLO/disponibilidade do admin sem dados |
| C6-018 | src/components/asaas/tabs/ConfigTab.tsx:211-214; supaba | 'Relatório Diário' automático das últimas 24h por e-mail sem job | SEM_CRON | Resumo financeiro diário por e-mail (Asaas/operações) só sai no clique |
| C6-019 | supabase/functions/relatorio-diario-anomalias/index.ts: | Relatório diário de anomalias sem job (nome promete execução diária) | SEM_CRON | E-mail diário de anomalias financeiras nunca é enviado |
| C6-020 | supabase/functions/executar-analise-preditiva/index.ts: | Análise preditiva de execução interna sem job | SEM_CRON + SECRET_AUSENTE | Previsões financeiras automáticas por IA nunca rodam |
| C6-021 | supabase/functions/gerar-alertas-dispatcher/index.ts:2- | Dispatcher consolidado de alertas sem chamador agendado | SEM_CRON | Geração consolidada de alertas (tributário, preditivo, health score) não é disparada |
| C6-022 | src/components/conciliacao/ConfiguracaoConciliacaoPanel | Alertas periódicos configuráveis de inadimplência e conciliação sem nenhum consu | SEM_CRON (config sem efeito) | Alertas de inadimplência/conciliação com frequência diária/semanal/mensal: o usuário configura, nada |
| C6-023 | src/components/configuracoes/SistemaTab.tsx:190-214 ('B | Backup automático configurável sem implementação | SIMULADO | Backup automático da empresa: a chave liga/desliga e a frequência não fazem nada |
| C6-024 | src/components/bitrix/BitrixConfigTab.tsx:119-132; src/ | Intervalo de sincronização Bitrix24 (5/15/30/60 min) só em estado local | SIMULADO | Sincronização periódica automática com o Bitrix24 (CRM) não existe; só manual |
| C6-025 | src/components/admin/AlertasProativosErros.tsx:39,70 vs | A UI promete monitor 'a cada 15 minutos'; o job real roda a cada 30 | DIVERGENTE | Alerta proativo de erros no sistema: cobertura e latência menores do que a tela informa |
| C6-026 | cron job 11 detect-query-regressions-5min (`*/30 * * *  | O nome do job diz 5 min, a agenda é 30 min | DIVERGENTE | Detecção de regressão de performance mais lenta do que o nome sugere (impacto baixo, só observabilid |
| C6-027 | supabase/functions/monitor-health/index.ts:132-140; mon | Canal Slack dos alertas automáticos sem secret | CANAL_SEM_PROVEDOR | Alertas de falha de cron/webhook e de erros do front não chegam no Slack (só e-mail) |
| C6-028 | src/pages/StatusPage.tsx:199-213 | 'Relatório Semanal' e crédito de SLA 'aplicado automaticamente' são texto fixo | SIMULADO | Página pública de status/SLA: promete relatório semanal e crédito automático que não existem |
| C6-029 | docs/FUNCIONALIDADES_SISTEMA.md:287-289,342; docs/GAPS_ | A documentação declara '6 Cron Jobs P13 ✅' e '6 jobs ativos', que não existem | DOC_FALSA | Inventário de automações para o dono/auditoria: superestima o que roda sozinho |
| C6-030 | supabase/migrations/003_seed_data.sql:295 (cron 'update | Marcação automática de contas vencidas: planejada no seed, hoje coberta | COBERTO | Status 'vencido' automático de contas a pagar/receber |
| C6-031 | jobs net.http_post: 32 sefaz-dfe-dispatcher, 33 webhook | Status 'succeeded' do pg_cron não prova que a edge function respondeu 2xx | NAO_VERIFICADO | Captação de NF-e de entrada (DF-e), reprocessamento de webhooks, monitor de saúde, digests e régua:  |
### C7 — Secrets lidos pelo código e ausentes nos nomes de secrets de produção (25 confirmados)

| ID | Local | Item | Status | Funcionalidade afetada |
|---|---|---|---|---|
| C7-001 | supabase/functions/copilot-global/index.ts:31 | LOVABLE_API_KEY ausente — copilot-global | SECRET_AUSENTE | Copilot Global (assistente IA do sistema) responde erro em toda pergunta. |
| C7-002 | supabase/functions/analise-preditiva/index.ts:27 | LOVABLE_API_KEY ausente — analise-preditiva | SECRET_AUSENTE | Análise preditiva financeira por IA sempre falha (erro 500). |
| C7-003 | supabase/functions/executar-analise-preditiva/index.ts: | LOVABLE_API_KEY ausente — executar-analise-preditiva | SECRET_AUSENTE | Execução de análise preditiva (alertas preditivos) falha com erro 500. |
| C7-004 | supabase/functions/benchmarking-setorial/index.ts:57 | LOVABLE_API_KEY ausente — benchmarking-setorial | SECRET_AUSENTE | Benchmarking setorial por IA indisponível (erro 500). |
| C7-005 | supabase/functions/conciliacao-ia/index.ts:140 | LOVABLE_API_KEY ausente — conciliacao-ia | SECRET_AUSENTE | Sugestões de conciliação bancária por IA falham (erro 500); conciliação fica só manual. |
| C7-006 | supabase/functions/expert-agent/index.ts:148 | LOVABLE_API_KEY ausente — expert-agent | SECRET_AUSENTE | Agente especialista (chat IA) indisponível. |
| C7-007 | supabase/functions/copilot-tributario/index.ts:113 | LOVABLE_API_KEY ausente — copilot-tributario | SECRET_AUSENTE | Copilot Tributário (dúvidas fiscais por IA) indisponível. |
| C7-008 | supabase/functions/analyze-document/index.ts:55 | LOVABLE_API_KEY ausente — analyze-document | SECRET_AUSENTE | Leitura/análise automática de documentos anexados por IA falha. |
| C7-009 | supabase/functions/analise-fluxo-ia/index.ts:73 | LOVABLE_API_KEY ausente — analise-fluxo-ia | SECRET_AUSENTE | Insights de fluxo de caixa por IA ('CFO virtual') indisponíveis. |
| C7-010 | supabase/functions/categorizar-despesa/index.ts:74 | LOVABLE_API_KEY ausente — categorizar-despesa | SECRET_AUSENTE | Categorização automática de despesas por IA falha; classificação fica manual. |
| C7-011 | supabase/functions/insights-relatorio/index.ts:48 | LOVABLE_API_KEY ausente — insights-relatorio | SECRET_AUSENTE | Insights automáticos em relatórios indisponíveis. |
| C7-012 | supabase/functions/processar-nf-ocr/index.ts:58 | LOVABLE_API_KEY ausente — processar-nf-ocr | SECRET_AUSENTE | Leitura automática (OCR) de notas fiscais não funciona; lançamento manual. |
| C7-013 | supabase/functions/gerar-acoes-recomendadas/index.ts:37 | LOVABLE_API_KEY ausente — gerar-acoes-recomendadas | SECRET_AUSENTE | Plano de ações recomendadas (sugestões executivas) não é gerado. |
| C7-014 | supabase/functions/gerar-resumo-executivo-semanal/index | LOVABLE_API_KEY ausente — gerar-resumo-executivo-semanal | SECRET_AUSENTE / SEM_CRON | Resumo executivo semanal por e-mail nunca é gerado nem enviado. |
| C7-015 | supabase/functions/whatsapp-ia-proativo/index.ts:237 | LOVABLE_API_KEY ausente — whatsapp-ia-proativo | SECRET_AUSENTE (degrada) | Mensagens proativas de cobrança/alerta via WhatsApp saem sem personalização por IA; modo de ger |
| C7-016 | supabase/functions/convidar-contador/index.ts:162 | LOVABLE_API_KEY ausente — e-mail de convite do contador não é enviado | SECRET_AUSENTE / LINK_MANUAL | Convite ao contador externo não chega por e-mail; o link precisa ser repassado manualmente. |
| C7-017 | supabase/functions/decidir-regime/index.ts:300 | LOVABLE_API_KEY ausente — decidir-regime (degradação) | SECRET_AUSENTE (degrada) | Simulador de regime tributário funciona, mas sem o parecer executivo escrito por IA. |
| C7-018 | supabase/functions/calcular-health-score-operacional/in | LOVABLE_API_KEY ausente — calcular-health-score-operacional (degradação) | SECRET_AUSENTE (degrada) | Health score operacional sai com comentário '_IA indisponível._' em vez da análise. |
| C7-019 | supabase/functions/asaas-proxy/index.ts:169 | ASAAS_API_KEY ausente | SECRET_AUSENTE | Cobrança Asaas inteira (clientes, boletos/PIX, assinaturas, transferências, saldo, links de pag |
| C7-020 | supabase/functions/bitrix24-sync/index.ts:37-39,68 | BITRIX24_DOMAIN / BITRIX24_ACCESS_TOKEN / BITRIX24_CLIENT_ID / BITRIX24_CLI | SECRET_AUSENTE | Sincronização com o CRM Bitrix24 (negócios/contatos) não funciona. |
| C7-021 | supabase/functions/sync-profile-to-bitrix/index.ts:23-2 | Bitrix24 sem configuração — sync-profile-to-bitrix | SECRET_AUSENTE | Foto e telefone do perfil do usuário não são enviados ao Bitrix24 (503). |
| C7-022 | supabase/functions/sincronizar-anomalia-bitrix24/index. | Bitrix24 sem configuração — sincronizar-anomalia-bitrix24 | SECRET_AUSENTE (silencioso) | Anomalias financeiras detectadas não viram tarefa/negócio no Bitrix24; resposta 200 esconde a f |
| C7-023 | supabase/functions/enviar-bitrix24-tributario/index.ts: | Bitrix24 sem configuração — enviar-bitrix24-tributario | SECRET_AUSENTE | Pendências tributárias não são enviadas como negócio ao Bitrix24. |
| C7-024 | supabase/functions/log-sped-bitrix24/index.ts:37-39 | Bitrix24 sem configuração — log-sped-bitrix24 | SECRET_AUSENTE | Registro de entregas SPED no Bitrix24 não acontece. |
| C7-025 | supabase/functions/bling-proxy/index.ts:704-705,768-775 | BLING_CLIENT_ID / BLING_CLIENT_SECRET ausentes | SECRET_AUSENTE | Não é possível conectar o ERP Bling (autorização OAuth falha); nenhuma sincronização de pedidos |
| C7-026 | supabase/functions/_shared/webhook-auth.ts:140-148 | BLING_WEBHOOK_SECRET / BITRIX24_WEBHOOK_SECRET / WHATSAPP_WEBHOOK_SECRET ausentes | SECRET_AUSENTE (NÃO VERIFICADO via tabela) | Fail-closed: sem o segredo, `webhook-auth.ts:140-148` retorna 503 `secret_not_configured` (Bling, Bitrix24, WhatsApp) — a integração fica indisponível, sem bypass de autenticação |
| C7-027 | supabase/functions/cnpja-lookup/index.ts:215-221 | CNPJA_API_KEY ausente | SECRET_AUSENTE | Consulta automática de CNPJ (preenchimento de cadastro de clientes/fornecedores) retorna erro. |
| C7-028 | supabase/functions/get-mapbox-token/index.ts:11-16 | MAPBOX_ACCESS_TOKEN ausente | SECRET_AUSENTE | Mapas (telas com geolocalização) não carregam. |
| C7-029 | supabase/functions/whatsapp-ai-analyzer/index.ts:48 | OPENAI_API_KEY ausente | SECRET_AUSENTE | Análise de sentimento/próxima ação das mensagens de cobrança por WhatsApp não funciona. |
| C7-030 | supabase/functions/monitor-health/index.ts:132; digest- | SLACK_WEBHOOK_URL ausente | CANAL_SEM_PROVEDOR | Alertas de saúde do sistema, erros do front e regressões de performance só chegam por e-mail, n |
| C7-031 | supabase/functions/_shared/edge-observability.ts:35; _s | EDGE_SENTRY_DSN / SENTRY_DSN ausentes | SECRET_AUSENTE (observabilidade) | Erros das 105 funções de servidor não são reportados ao Sentry; falhas só aparecem em logs. |
| C7-032 | supabase/functions/open-finance/index.ts:32 | OPEN_FINANCE_CLIENT_ID ausente (OPEN_FINANCE_REDIRECT_URI existe) | CANAL_SEM_PROVEDOR / SIMULADO | Open Finance (importar extratos direto do banco) não existe de fato; lista de bancos é estática |
| C7-033 | supabase/functions/compare-schemas/index.ts:24-31 | SCHEMA_COMPARE_EXTERNAL_URL / SCHEMA_COMPARE_EXTERNAL_SERVICE_ROLE_KEY ause | SECRET_AUSENTE (ferramenta admin) | Ferramenta de admin de comparação de estrutura do banco com outro projeto indisponível (503). |
| C7-034 | supabase/functions/_shared/auth-guard.ts:160 | MFA_ADMIN_ENFORCED ausente | SECRET_AUSENTE (postura de segurança) | Administradores não são obrigados a usar 2º fator (TOTP) para ações sensíveis, como subir certi |
| C7-035 | supabase/functions/sso-callback/index.ts:987-989 | Segredo SSO dinâmico (sso_providers.client_secret_ref) | NÃO VERIFICADO | Login SSO de provedores que exigem client_secret pode falhar na troca de token. |
| C7-036 | supabase/functions/_shared/sefaz/pfx.ts:62 | NFE_CERT_MASTER_KEY_PREV ausente | OK_OPCIONAL | Nenhuma (só necessário durante troca da chave dos certificados). |
| C7-037 | supabase/functions/_shared/resilience.ts:127 | INTEGRACOES_DESATIVADAS ausente | OK_OPCIONAL | Nenhuma (kill-switch de emergência não acionado). |
| C7-038 | supabase/functions/convidar-contador/index.ts:64; valid | SUPABASE_JWT_SECRET ausente | SEM_IMPACTO | Nenhuma. |
| C7-039 | supabase/functions/_shared/console-persist.ts:34 | SUPABASE_FUNCTION_NAME / EDGE_FUNCTION_NAME ausentes | SEM_IMPACTO (rótulo de log genérico) | Logs persistidos podem ficar com nome de função genérico 'console-tee', dificultando diagnóstic |
| C7-040 | supabase/functions/ci-security-gate-log/index.ts:181; n | DENO_TESTING ausente | OK | Nenhuma. |
| C7-041 | env.manifest.json (vars scope=edge) | Manifest diverge de produção | MANIFEST_DIVERGENTE | O inventário oficial diz que estas chaves são obrigatórias, mas produção roda sem elas; nenhum  |

### C8 — Canais de envio e integrações externas: real vs. simulado/manual/sem provedor

| ID | Local | Item | Status | Funcionalidade afetada |
|---|---|---|---|---|
| C8-001 | supabase/functions/whatsapp-ia-proativo/index.ts:676-67 | O envio por WhatsApp não chama nenhum provedor (Meta, Evolution, Z-API ou o | LINK_MANUAL / CANAL_SEM_PROVEDOR | Cobrança e alertas por WhatsApp: nenhuma mensagem chega ao cliente sem alguém abrir o link à mã |
| C8-002 | supabase/functions/executar-regua-cobranca/index.ts:183 | Na régua automática, o canal WhatsApp chama whatsapp-ia-proativo, que respo | SIMULADO (falso positivo de entrega) | Régua de cobrança diária: o painel mostra lembretes de WhatsApp como enviados, mas o cliente nã |
| C8-003 | supabase/functions/processar-fila-cobrancas/index.ts:75 | A fila de cobranças marca o item WhatsApp como 'enviado', com provider 'wha | SIMULADO (falso positivo de entrega) | Fila de cobranças: o histórico registra WhatsApp enviado sem entrega real. |
| C8-004 | supabase/functions/processar-fila-cobrancas (sem agenda | Nenhum job do pg_cron chama a edge processar-fila-cobrancas, e a tabela fil | SEM_CRON | Disparo em lote da fila de cobranças (e-mail e WhatsApp): só roda se alguém acionar manualmente |
| C8-005 | supabase/functions/asaas-proxy/index.ts:1214-1229 | O alerta de falhas do Asaas por WhatsApp chama whatsapp-ia-proativo, mas o  | CANAL_SEM_PROVEDOR | Alerta operacional de falhas na sincronização Asaas por WhatsApp: o responsável não é avisado. |
| C8-006 | src/components/integracoes/WhatsAppConfigPanel.tsx:12-1 | A tela 'WhatsApp Business API' pede Phone Number ID e Access Token da Meta, | SIMULADO / CANAL_SEM_PROVEDOR | Configuração de WhatsApp Business: o usuário acredita que conectou a Meta e que o teste chegou, |
| C8-007 | src/components/cobranca/WhatsAppProativoPanel.tsx:87-10 | O WhatsApp proativo abre o link wa.me no navegador. O envio depende do usuá | LINK_MANUAL | Cobrança proativa por WhatsApp no painel: o envio é manual, um cliente por vez. |
| C8-008 | src/components/contas-receber/EnviarCobrancaDialog.tsx: | O diálogo 'Enviar cobrança' abre wa.me sem número (https://wa.me/?text=...) | LINK_MANUAL (WhatsApp e e-mail) / CANAL_SEM_PROVEDOR (SMS) | Cobrança avulsa em Contas a Receber: o e-mail não sai pelo Resend, o WhatsApp vai sem destinatá |
| C8-009 | supabase/functions/executar-regua-cobranca/domain.ts:1  | A régua aceita os canais 'sms' e 'telefone', mas não há implementação para  | CANAL_SEM_PROVEDOR | Régua de cobrança por SMS e por telefone: as etapas são configuráveis, mas nunca disparam. |
| C8-010 | supabase/functions/open-finance/index.ts:53-55, 245, 33 | O Open Finance não tem provedor. A lista de instituições é fixa no código.  | CANAL_SEM_PROVEDOR / dados fixos (lista de instituições) | Conexão bancária via Open Finance (saldo e extrato automáticos): indisponível. A lista de banco |
| C8-011 | supabase/functions/send-push-notification/index.ts:23 e | O push VAPID não é Web Push real. A função generateVapidAuthHeader existe,  | SIMULADO (envio sem protocolo Web Push) | Notificações push no navegador e no celular (alertas preditivos, de segurança e de filtros salv |
| C8-012 | src/components/nfe/NovaNFeForm.tsx:84; InutilizacaoNFe. | Não existe edge function de emissão de NF-e (NFeAutorizacao). Emissão, inut | CANAL_SEM_PROVEDOR | Emissão, cancelamento e inutilização de NF-e e transmissão em contingência: indisponíveis. |
| C8-013 | src/lib/sefaz-simulator/handlers.ts:7-123 e utils.ts:57 | O simulador SEFAZ continua no bundle: autoriza com Math.random, gera protoc | SIMULADO (dormente, sem chamador) | Risco de voltar a gerar protocolo fiscal falso se alguém religar o simulador. Hoje não afeta o  |
| C8-014 | src/lib/sefaz-contingency/state.ts:120-133; storage.ts: | O status de comunicação com a SEFAZ não é consultado de verdade: a função d | CANAL_SEM_PROVEDOR / localStorage | Monitor SEFAZ e auto-contingência: sem status real, e a configuração se perde ao trocar de nave |
| C8-015 | supabase/functions/sefaz-dfe-puxar/index.ts:186-207; se | O DF-e (distribuição e manifestação) faz chamada real à SEFAZ por mTLS, e o | REAL_SEM_DADOS (sem certificado A1 cadastrado) | Captura automática de notas de fornecedores (DF-e) e manifestação do destinatário: não acontece |
| C8-016 | supabase/functions/asaas-proxy/index.ts:169-172 | O Asaas faz chamada real a https://api.asaas.com/v3 (linha 34), mas o secre | SECRET_AUSENTE | Boletos e PIX via Asaas, sincronização de pagamentos, antecipações e transferências: não funcio |
| C8-017 | supabase/functions/bling-proxy/index.ts:768-776 (e 704- | O Bling faz chamada real (api.bling.com.br/Api/v3), mas BLING_CLIENT_ID e B | SECRET_AUSENTE | Integração com o ERP Bling (pedidos, NF-e do Bling, contatos): não conecta. |
| C8-018 | supabase/functions/enviar-bitrix24-tributario/index.ts: | O Bitrix24 tributário e o log SPED fazem chamada real à REST do Bitrix, mas | SECRET_AUSENTE | Envio de alertas e relatórios tributários e do log de entrega SPED para o CRM Bitrix24. |
| C8-019 | supabase/functions/sincronizar-anomalia-bitrix24/index. | Sem configuração do Bitrix24, a sincronização de anomalias responde HTTP 20 | SECRET_AUSENTE (falha silenciosa 200) | Criação de tarefa ou negócio no Bitrix24 a partir de anomalias financeiras. |
| C8-020 | supabase/functions/bitrix24-sync/index.ts:37-39, 68-71; | A sincronização de usuários e perfis com o Bitrix24 depende de BITRIX24_CLI | SECRET_AUSENTE | Sincronização de colaboradores, perfis e avatares entre o financeiro e o Bitrix24. |
| C8-021 | supabase/functions/cnpja-lookup/index.ts:215-220 | A consulta de CNPJ faz chamada real a api.cnpja.com, mas o secret CNPJA_API | SECRET_AUSENTE | Preenchimento automático de cadastro de cliente ou fornecedor pelo CNPJ. |
| C8-022 | supabase/functions/get-mapbox-token/index.ts:11-16 | O Mapbox não tem MAPBOX_ACCESS_TOKEN em produção, e nenhum código do front  | SECRET_AUSENTE / sem consumidor | Mapas e geolocalização: não há tela usando, e a dependência é peso morto no bundle. |
| C8-023 | Slack: monitor-health/index.ts:132; monitorar-erros-fro | Todos os alertas via Slack dependem de SLACK_WEBHOOK_URL, que não existe em | SECRET_AUSENTE (canal ignorado silenciosamente) | Avisos de saúde do sistema, de picos de erro e de regressão de performance no Slack da equipe. |
| C8-024 | IA/OCR via ai.gateway.lovable.dev: processar-nf-ocr:58- | Todas as funções de IA e OCR chamam o gateway Lovable (chamada HTTP real),  | SECRET_AUSENTE | OCR de notas fiscais, análise de documentos, categorização automática de despesas, conciliação  |
| C8-025 | supabase/functions/convidar-contador/index.ts:161-207 | O e-mail de convite ao contador passa pelo connector-gateway.lovable.dev e  | SECRET_AUSENTE (e-mail não enviado) | Convite de acesso ao painel tributário para o contador externo: o e-mail não chega. |
| C8-026 | supabase/functions/whatsapp-ai-analyzer/index.ts:45-48 | A análise de sentimento das conversas de WhatsApp chama api.openai.com com  | SECRET_AUSENTE / sem consumidor | Insight de IA (sentimento e próxima ação) sobre as cobranças por WhatsApp. |
| C8-027 | supabase/functions/n8n-dispatch/index.ts:51-87; tabela  | O n8n-dispatch faz POST real em cfg.webhook_url, mas não há nenhum workflow | REAL_SEM_CONFIGURACAO (sem destino nem chamador) | Automações externas via n8n disparadas por eventos do financeiro. |
| C8-028 | cron 43 'enviar-digest-conformidade-diario' (origin/con | O job diário do digest de conformidade está ativo, mas executa só `SELECT 1 | JOB_PLACEHOLDER | Resumo diário de conformidade fiscal por e-mail: o job diário não envia nada. Só o horário func |
| C8-029 | Edges de envio sem agendamento: enviar-relatorios-tribu | Funções que enviam e-mail (Resend ou enviar-alerta-email) ou push, e que pe | SEM_CRON | Relatórios tributários agendados, resumo financeiro diário, resumo executivo semanal, relatório |
| C8-030 | supabase/functions/webhook-simulator/index.ts:100-110,  | O simulador de webhooks está publicado em produção. Ele envia eventos fabri | SIMULADOR_EM_PRODUCAO | Teste de webhooks pelo admin: pode injetar eventos de pagamento fictícios no processamento real |
| C8-031 | supabase/functions/enviar-alerta-email/index.ts:51-70 | O envio de e-mail (Resend) tem um caminho simulado: sem RESEND_API_KEY, gra | REAL (fallback simulado inativo) | E-mails de régua, alertas e resumos: hoje são reais. Se o secret for removido, passam a ser sim |
| C8-032 | supabase/functions/whatsapp-webhook/index.ts:40-48 (aut | O webhook de entrada de WhatsApp exige o segredo 'whatsapp_webhook_secret'  | CANAL_SEM_PROVEDOR (NÃO VERIFICADO o segredo em integration_secrets) | Recebimento de respostas e status de entrega de mensagens de WhatsApp. |
## Anexo — W3 Crítico final de cobertura (documentos fora de docs/, achados adicionais)

### Documentos fora do escopo original, verificados nesta rodada

- .lovable/roadmap-final.md (plano: 16 lotes tributário) — verificado aqui
- .lovable/plan.md (plano âncoras SpedEcfWizard) — verificado aqui: IMPLEMENTADO (Step1PeriodoEcd.tsx:33,36,68,83; crosscheck.ts:33-83; Step2Validacoes.tsx:225)
- .lovable/memory/index.md + .lovable/memory/{features,architecture,integrations,observability,quality}/*.md (~45 specs de funcionalidade; nenhum citado nos relatórios) — verificados aqui por amostragem de objetos de banco/edge/componente
- docs/ADR-001-LALAMOVE-FORA-DE-ESCOPO.md (só citado indiretamente como 'ADR-001' em A7/A8; os 14 objetos estão ausentes em prod/types.ts — FEITO; resíduos get_active_uapi_token e trigger_bitrix24_sync já cobertos em A7 D1 §9.13 e A8 SECDEF)
- docs/agentes/mapa-repo.md — verificado aqui
- docs/agentes/proximos-passos.md (regra de formato; sem funcionalidade)
- .github/copilot-instructions.md (1 linha: 'Ver AGENTS.md')
- .github/ISSUE_TEMPLATE/feature_request.md (template; sem funcionalidade)
- .codex/AGENTS.md (25 linhas, difere de AGENTS.md raiz; governança)
- .claude/CLAUDE.md, .claude/skills/Promo_Finance_V2/SKILL.md, .agents/skills/Promo_Finance_V2/SKILL.md, .claude/skills/graphify/** (governança/ferramenta)
- db/functions/README.md — verificado aqui
- scripts/{regras_negocio,edge-deploy,integrity,inventario,maintenance,ai-context,supabase_snapshot}/README.md — verificados: arquivos/workflows citados existem; ausências (publish.sh, deployment-manifest.json) são documentadas como intencionais; allowed-public-tables.json está em scripts/integrity/baseline/
- analise-prs/RELATORIO_PRS.md, analise-prs/reconciliacao-migrations.md, analise-prs/auditorias-anteriores.md, analise-prs/dossiers/*.md (55 dossiês) — RAIZ, distintos de docs/archive/analise-prs/ (que A9 cobre). Verificados: 4 itens APLICAR da reconciliação hoje FEITOS (is_user_locked, totais_contas_pagar, query_telemetry.empresa_id, transferencias.movimentacao_id em ctx); A-002 boletos.asaas_id/external_provider FEITO (ctx boletos.md:55-56); A-003 integration_secrets hoje RESTRICTIVE USING false (FEITO); recharts 3/vitest 5 pendentes já cobertos por A9
- docs/contract-conformance.json — verificado aqui (o summary .md é coberto em master §4.7)
- docs/auditoria-financeira-20260910/{cenarios.json,resumo.json,inventario.json.gz,navegacao.json.gz,nfe-simulada.png,SHA256SUMS} — artefatos de evidência; SHA256SUMS confere (sha256sum -c OK). cenarios.json: 26 cenários, 19 reprovados na época; amostra re-executada hoje: S01 parseValorMonetario('1.234,56')=1234.56, S06 '12abc' lança erro, S04 '31/02/2026' lança erro → corrigidos; S23/S24 (boleto gerado rejeitado pelo próprio parser) e S25/S26 NÃO VERIFICADOS
- docs/evidencias/replay-2026-09-03/{gate_negative.out,gate_real_schema.out} — saídas de gate (RAISE listando policies de saved_filters); evidência histórica, sem plano
- docs/archive/mapa-integracao-20261112/mesclar-prontos.sh, docs/archive/scripts/ci-local.sh (scripts arquivados)

### Achados adicionais (COV-001..010)

| ID | Doc/fonte | Item | Status | Evidência |
|---|---|---|---|---|
| COV-001 | .lovable/memory/features/saved-filter-permission-revocation.md:8 | Camada 'banco (autoritativa)': trigger fn_revoke_orphan_saved_filter_subscriptions em saved_filters e user_empresas + função can_access_save | NÃO IMPLEMENTADO EM PRODUÇÃO (drift: migration no ledger, objeto ausente) | Criada em supabase/migrations/20260423132042_22382edf-....sql:13,43-53 (can_access_saved_filter em 20260422120756); ambas as versões constam em ctx migrations.md:126,143. Porém `git ls-tree origin/contexto docs/contexto/supabase/functions / grep -c '/fn_revoke_orphan_saved_filter_subscriptions__'` = 0 e idem can_access_saved_filter = 0; ctx tables/public/saved_filters.md §Triggers só tem trg_saved |
| COV-002 | .lovable/memory/features/auditoria-tributaria.md:6 | Trilha automática: função fn_audit_tributario + 4 triggers AFTER INSERT/UPDATE/DELETE em apurações, regime cache, conformidade, agendados | NÃO IMPLEMENTADO EM PRODUÇÃO | fn_audit_tributario criada em 20260418140233/141743/143540 (todas no ledger ctx migrations.md:101+), mas 0 arquivos em ctx functions/public/fn_audit_tributario__*. Triggers em prod: apuracoes_tributarias só set_updated_at_*; regime_decision_cache só trg_regime_cache_updated_at; verificacoes_conformidade nenhum; relatorios_tributarios_agendados só trg_rel_trib_agend_updated_at (ctx tables/public/*. |
| COV-003 | .lovable/memory/features/anomalia-alert-preferences.md:12 | Trigger validate_user_anomalia_preferences valida range de toast_duracao_segundos (3..30) e severidades | PARCIAL (só client-side) | Migration 20260422114156 no ledger (ctx migrations.md:124), mas função ausente em ctx functions (count 0); ctx tables/public/user_anomalia_preferences.md §Triggers só set_updated_at_*; coluna toast_duracao_segundos (linha 24) sem CHECK. Validação existe apenas em src/hooks/anomaliaPreferencesValidation.ts — escrita direta via PostgREST não é validada. |
| COV-004 | .lovable/memory/features/saved-filter-anti-spam.md:6 e saved-filter-subscription-cadence.md:11 | rate_limit_max (1-100)/rate_limit_window_min (1-1440) e severidades 'validados por trigger' validate_saved_filter_subscription_rules | PARCIAL (só clamp client-side) | Função criada em 20260423125524/20260423130838 (ledger ctx migrations.md:141) mas ausente em ctx functions (count 0); ctx tables/public/saved_filter_subscriptions.md: rate_limit_max (l.35) e severidades_criticas (l.33) sem CHECK (único CHECK é saved_filter_subscriptions_canal_check l.45); §Triggers só trg_saved_filter_subs_updated_at. |
| COV-005 | .lovable/memory/features/saved-filter-dedup-audit.md:3 | View de auditoria vw_notification_history_duplicates | DIVERGENTE (removida) | supabase/migrations/20261118003500_drop_particoes_orfas_e_views_mortas.sql:71 `DROP VIEW IF EXISTS public.vw_notification_history_duplicates`; ausente em ctx views.md. Doc .lovable ainda a descreve como mecanismo de auditoria. |
| COV-006 | .lovable/roadmap-final.md:33 | 'Retry exponencial em todas as Edge Functions externas (CNPJá, Bitrix24)' | PARCIAL | cnpja-lookup tem retry (fetchCnpjaWithRetry, index.ts:224; `grep -ci retry` = 6). enviar-bitrix24-tributario não: `grep -ci 'retry\/backoff' supabase/functions/enviar-bitrix24-tributario/index.ts` = 0; chamada externa é fetch simples em index.ts:44. |
| COV-007 | .lovable/roadmap-final.md:3,30-31 | '16/16 lotes — 100%': 2 tabelas tributario_faturamento_mensal/tributario_folha_mensal e 9 páginas incluindo 'alíquotas'; lotes 15 (Push Bitr | DIVERGENTE / PARCIAL em produção | Tabelas reais são faturamento_mensal e folha_pagamento (ctx tables.md:107,112; src/hooks/useHistoricoFinanceiro.ts:47,63) — nomes do doc não existem em migrations/src (grep vazio). Não há rota /tributario/aliquotas (grep -i aliquot src/routes src/App.tsx = vazio; alíquotas ficam em catálogos). Lotes 15/16 dependem de BITRIX24_DOMAIN/BITRIX24_ACCESS_TOKEN (enviar-bitrix24-tributario/index.ts:39-40) |
| COV-008 | docs/contract-conformance.json (+ docs/contract-conformance-summary.md) | Matriz de conformidade de contratos: '88 consomem body · 88 com validação (100%)' | DIVERGENTE (falso 100%) | scripts/ci/gerar-matriz-conformidade-contratos.mjs:21 PADRAO_BODY = /req\.json\s*\(/.../ não casa `req.clone().json()`; por isso scim-server, sso-callback, sso-logout saem com body=false/semBodyDetectavel=true no JSON, embora leiam corpo (scim-server/index.ts:1074-1078, sso-callback/index.ts:165, sso-logout/index.ts:101). O gate oficial `bash scripts/security/zod-coverage.sh` → 'Sem validação Zod: |
| COV-009 | docs/agentes/mapa-repo.md:24,30,34,47 | Mapa do repo para agentes | DIVERGENTE (desatualizado) | Diz 'ver PR aberta #263' e 'disponível após merge do PR #263', mas analise-prs/RELATORIO_PRS.md lista #263 mergeada (8ec6561a) e scripts/ci/check-claude-md-integrity.mjs existe; diz 'ver PR aberta #253' para scripts/edge-deploy, mas #253 foi fechada e o diretório existe. Diz 106 Edge Functions (correto: `ls -d supabase/functions/*/ / grep -v _shared / wc -l` = 106), enquanto AGENTS.md §1 diz 105. |
| COV-010 | db/functions/README.md:22,32,36-38 | Funções SQL versionadas por domínio (incl. auth/), aplicadas via \i nas migrations, cada uma com teste pgTAP | PARCIAL | `find db/functions -type f` = 6 .sql (retention ×3, observability ×1, webhooks ×2); diretório auth/ não existe; `grep -rl '\\i db/functions' supabase/migrations / wc -l` = 0 (nenhuma migration usa o padrão). As 6 funções existem em prod (ctx functions). |

### Observações do crítico (contradições entre frentes e como foram resolvidas)

Cobertura: dos 159 arquivos da lista solicitada (docs/**/*.md exceto archive/sql, *.md da raiz, docs/api, docs/ci, auditoria-financeira-20260910, auditoria-20260912, evidencias, .github/*.md, ISSUE_TEMPLATE, READMEs de functions/graphify/scripts), só ficaram sem citação os listados em docs_nao_cobertos. Os de maior risco ficam FORA dos caminhos pedidos e nenhum relatório os cita: .lovable/** (≈47 specs de funcionalidade e roadmap) e analise-prs/** na raiz. Resultado dos achados: COV-001..004 mostram um padrão sistêmico que A8 não mediu: migrations Lovable que estão no ledger de prod (ctx migrations.md) mas cujos objetos (funções/triggers) NÃO existem em prod. Hipótese: shadow files UUID 'não rastreados' foram reconciliados só no ledger, sem efeito no schema (analise-prs/reconciliacao-migrations.md:27); NÃO VERIFICADO. Vale um varrimento 'CREATE FUNCTION em migration aplicada × ctx functions/' feito pelo orquestrador.

Contradições entre relatórios a resolver:
(1) Número de cron jobs em prod: A7 l.23 '31 jobs'; parte_producao P-03/P-09 '32 jobs'; o cron.md atual da branch contexto tem 33 linhas de job (`grep -cE '^\| [0-9]+ \|'` = 33). Snapshots de momentos diferentes: padronizar no valor atual. Jobs nomeados em migrations também divergem: A8 l.75/160 diz 28, parte_producao P-09 diz 22 (banco.json).
(2) Secrets: A12 l.20 (PENDENCIAS §5, 29 secrets) e A8 l.67 (44 secrets) marcam 'NÃO VERIFICÁVEL SEM BANCO/vault não acessível'; A7 D1 CO-16/IA-01 marca LOVABLE_API_KEY 'NÃO VERIFICÁVEL SEM BANCO'. Mas parte_producao P-01/P-02 verificou pela lista de 31 secrets em ctx edge-functions.md §Secrets (e há ctx vault.md). Reclassificar esses itens como verificados: LOVABLE_API_KEY, CNPJA_API_KEY, BITRIX24_*, ASAAS_API_KEY ausentes.
(3) Testes: AGENTS.md diz meta 2689; A12 l.116 cita 3023 (PENDENCIAS) e 282 arquivos; A4 l.199 cita 3040 e '2.689 it/test estáticos'. O vitest.log do scratchpad não prova nada: 'cross-env: command not found', exit 127 (EXIT=0 enganoso). Nenhum relatório tem contagem executada; tratar como NÃO VERIFICADO.
(4) Edge Functions: A12/A6/mapa-repo dizem 106 (real); A5/A7 repetem 105 (AGENTS.md); A8 102, A9/master 98 (em contexto de supabase-js). Deixar claro em cada um se é citação de doc ou contagem real.
(5) Migrations: master S-43 '1045 aplicadas' bate com ctx migrations.md (1045 linhas de versão); A8 usa 1048 arquivos. Ambos certos, mas são métricas diferentes (ledger × arquivos); rotular as duas.
(6) Contagem de tabelas: A1/A2 usam 247 (types.ts); ctx tables.md lista 262 tabelas public. Não misturar as bases.
(7) mv_benchmark_setorial: A1/A12 tratam o refresh semanal como cron faltante ('NÃO IMPLEMENTADO'), mas A8 l.2377 mostra que a matview e refresh_mv_benchmark_setorial() foram DROPADAS em 20261118003500. O item é 'removido por decisão', não 'cron faltando'.
(8) ADR-001: A7 D1 §9.13 marca resíduos como PARCIAL. O ADR em si (14 objetos ausentes) está FEITO: 0 em ctx tables/views e 0 em types.ts.

Itens .lovable confirmados IMPLEMENTADOS (sem achado): todas as 21 edges citadas existem (enviar-push-notification = send-push-notification; o trigger em prod chama .../send-push-notification). Também existem as 30+ peças de componente/hook (OnboardingTour, CopilotGlobalFloat, SLOPanel, HeatmapTributarioAnual etc.), as tabelas dos specs (exceto mv_benchmark_setorial, dropada), os buckets relatorios-tributarios e notas-fiscais-upload (ctx storage.md:11-12), vw_edge_health (ctx views.md:370) e a rota /admin/edge-health (adminRoutes.tsx:99).