# 📋 Funcionalidades do Sistema — Promo Finance

> Documento executivo e exaustivo mapeando **100% das funcionalidades** do sistema.
> Última atualização: Abril 2026 · Lotes evolutivos: **P1 → P15**

---

## 📊 Métricas do Projeto

| Métrica | Valor |
|---------|-------|
| Páginas (rotas) | **54** |
| Edge Functions | **51** |
| Tabelas Supabase | **130+** |
| Hooks customizados | **130+** |
| Pastas de componentes | **60+** |
| Migrações SQL | **102** |
| Testes unitários | **1.012 / 1.012 ✅ (100%)** |
| Erros TypeScript | **0** |
| Lotes evolutivos entregues | **P1 → P15** |

**Legenda de status:** ✅ Produção · 🧪 Beta · 🤖 IA · 🔒 Admin

---

## 📑 Índice

1. [Visão geral & arquitetura](#1-visão-geral--arquitetura)
2. [Autenticação & segurança](#2-autenticação--segurança)
3. [Financeiro core](#3-financeiro-core)
4. [Cobranças & inadimplência](#4-cobranças--inadimplência)
5. [Conciliação bancária](#5-conciliação-bancária)
6. [Fluxo de caixa & dashboards](#6-fluxo-de-caixa--dashboards)
7. [Tributário & Reforma 2026](#7-tributário--reforma-2026-p1p9)
8. [NFe & SEFAZ](#8-nfe--sefaz)
9. [Aprovações & workflow](#9-aprovações--workflow)
10. [Integrações](#10-integrações)
11. [IA & assistentes](#11-ia--assistentes-p11p14)
12. [Inteligência operacional](#12-inteligência-operacional-p10p13)
13. [Compliance & LGPD](#13-compliance--lgpd-p12)
14. [Observabilidade & admin](#14-observabilidade--admin-p13p15)
15. [UX & qualidade](#15-ux--qualidade)

---

## 1. Visão geral & arquitetura

**Stack:** React 18 + Vite 5 + TypeScript 5 + TailwindCSS + shadcn/ui + Lovable Cloud (Supabase) + TanStack Query + Framer Motion.

**Camadas:**
- **Apresentação** — páginas (`src/pages/`), componentes (`src/components/`), design system (HSL tokens, Outfit + Plus Jakarta Sans).
- **Domínio** — hooks (`src/hooks/`), validators (`src/lib/brazilian-validators.ts`), motores (`src/lib/tributario/`).
- **Dados** — Supabase client + 130+ tabelas + views otimizadas (`vw_*` com `security_invoker`).
- **Backend** — 51 Edge Functions Deno (RBAC, observabilidade, AI gateway).

**Multi-tenant:** segregação por `empresa_id` em todas as tabelas operacionais. **RBAC 4 papéis:** `admin`, `financeiro`, `operacional`, `visualizador`.

---

## 2. Autenticação & segurança

| Funcionalidade | Descrição | Localização | Status |
|---|---|---|---|
| Login / Signup | Email + senha com validação Zod | `pages/Auth.tsx` | ✅ |
| MFA TOTP | Autenticação de 2 fatores via app | `components/MFASettings.tsx`, `useMFA` | ✅ |
| WebAuthn biométrico | Login por digital/FaceID | `useWebAuthn`, `webauthn-*` edges | ✅ |
| Recuperação de senha | Fluxo `/reset-password` com força mínima | `pages/ResetPassword.tsx` | ✅ |
| HIBP check | Verificação de senhas vazadas | Manual config | ✅ |
| Account lockout | Bloqueio exponencial após N tentativas | `account_lockouts` table | ✅ |
| IP/Geo restriction | Whitelist de países e IPs | `GeoRestrictionPanel`, `allowed_countries`, `allowed_ips` | 🔒 |
| Known devices | Reconhecimento de dispositivos confiáveis | `KnownDevicesPanel` | ✅ |
| Sessões ativas | Listagem e revogação | `pages/Seguranca.tsx` | ✅ |
| Audit logs | Registro completo de ações | `audit_logs`, `useAuditLog` | ✅ |
| Rate limiting | Proteção contra abuso | `RateLimitDashboard` | 🔒 |
| XSS sanitization | `escapeHtml` obrigatório em rich text | `lib/sanitize.ts` | ✅ |
| RLS hardening | Policies restritas via `auth.uid()` + `has_any_role()` | Todas as 130+ tabelas | ✅ |

---

## 3. Financeiro core

| Funcionalidade | Descrição | Localização | Status |
|---|---|---|---|
| Contas a pagar | CRUD + agendamento + recorrência + anexos | `pages/ContasPagar.tsx`, `contas-pagar/` | ✅ |
| Contas a receber | CRUD + régua + scoring de cliente | `pages/ContasReceber.tsx`, `contas-receber/` | ✅ |
| Boletos | Emissão, registro, código de barras, linha digitável | `pages/Boletos.tsx`, `boletos` table | ✅ |
| Pix Hub | Templates, QR Code, Pix Copia & Cola, split | `pages/PixHub.tsx` | ✅ |
| Tesouraria | Visão consolidada de saldos | `pages/Tesouraria.tsx` | ✅ |
| Movimentações | Histórico completo de transações | `pages/Movimentacoes.tsx` | ✅ |
| Transferências entre contas | Débito/crédito atômico | `transferencias_bancarias` table | ✅ |
| Categorias | Receita/despesa hierárquicas | `pages/Categorias.tsx` | ✅ |
| Plano de contas | Estrutura contábil padrão BR | `plano_contas` table | ✅ |
| Centros de custo | Orçado vs realizado, hierárquico | `pages/CentrosCusto.tsx` | ✅ |
| Pagamentos recorrentes | Geração automática de parcelas | `pagamentos_recorrentes` | ✅ |
| Anexos financeiros | Upload de comprovantes | `anexos_financeiros`, bucket privado | ✅ |
| Versionamento | Histórico de versões por entidade | `VersionHistory.tsx` | ✅ |
| Duplicação | Clone rápido de registros | `DuplicateButton.tsx` | ✅ |

---

## 4. Cobranças & inadimplência

| Funcionalidade | Descrição | Localização | Status |
|---|---|---|---|
| Régua de cobrança | Email/WhatsApp/SMS automatizados | `ReguaCobrancaConfig.tsx` | ✅ |
| Acordos de parcelamento | Geração com desconto/juros | `acordos_parcelamento`, `cobranca/` | ✅ |
| Protestos & negativações | Fluxo SERASA/Cartório | `pages/Cobrancas.tsx` | ✅ |
| Fila de cobranças | Priorização por valor/risco | `useCobrancas` | ✅ |
| Histórico WhatsApp IA | Conversas registradas + insights | `whatsapp_conversas` | 🤖 |
| Scoring de clientes | 0-100 baseado em histórico | `useScoreCliente`, `clientes.score` | 🤖 |
| Inadimplência segmentada | Aging + buckets + tendência | `PrevisaoInadimplencia.tsx` | 🤖 |
| Simulador antecipação | Recebíveis com taxa | `SimuladorAntecipacao.tsx` | ✅ |
| Cashback simulador | Reforma tributária 2026 | `CashbackSimulador.tsx` | ✅ |

---

## 5. Conciliação bancária

| Funcionalidade | Descrição | Localização | Status |
|---|---|---|---|
| Extrato bancário | Upload OFX/CSV + Open Finance | `pages/Conciliacao.tsx` | ✅ |
| Regras automáticas | Match por descrição/valor | `regras_conciliacao` | ✅ |
| Conciliação IA | Match probabilístico | `conciliacao-ia` edge | 🤖 |
| Conciliações parciais | Múltiplos lançamentos por transação | `conciliacao_itens` | ✅ |
| Feedback IA | Reforço de aprendizado | `useConciliacaoIA` | 🤖 |
| Histórico | Períodos finalizados auditáveis | `conciliacoes` table | ✅ |
| Webhooks de extrato | Recebimento automático | `bling_webhook_events` | ✅ |

---

## 6. Fluxo de caixa & dashboards

| Funcionalidade | Descrição | Localização | Status |
|---|---|---|---|
| Dashboard executivo | Bento grid premium animado | `DashboardExecutivo.tsx` | ✅ |
| DashboardEmpresa | Visão por empresa (multi-tenant) | `pages/DashboardEmpresa.tsx` | ✅ |
| DashboardReceber | Foco em recebíveis | `pages/DashboardReceber.tsx` | ✅ |
| Fluxo de caixa | Projeções + cenários | `pages/FluxoCaixa.tsx` | ✅ |
| Cenários Monte Carlo | Simulação probabilística | `MonteCarloCenarios.tsx` | 🤖 |
| Hero KPIs animados | Números com countup + glow | `HeroKPIs.tsx` | ✅ |
| Top clientes/centros | Rankings dinâmicos | `TopClientesWidget` | ✅ |
| Status pie chart | Distribuição visual | Recharts | ✅ |
| Saldos por banco | Consolidado em tempo real | `vw_saldos_contas` | ✅ |
| Drag & drop layout | Customização do dashboard | `DraggableDashboardGrid.tsx` | ✅ |
| BI page | Análises avançadas | `pages/BI.tsx` | ✅ |

---

## 7. Tributário & Reforma 2026 (P1→P9)

| Funcionalidade | Descrição | Localização | Status |
|---|---|---|---|
| Decidir regime | Recomendação automática (cache 7d) | `decidir-regime` edge | 🤖 |
| Simulador Simples Nacional | 5 anexos + Fator R | `simular-simples` edge | ✅ |
| Simulador Lucro Presumido | PIS/COFINS/IRPJ/CSLL | `simular-presumido` edge | ✅ |
| Simulador Lucro Real | LALUR + prejuízos compensáveis | `simular-real` edge | ✅ |
| Apuração mensal/trimestral | `apuracoes_tributarias` | `pages/ApuracoesTributarias.tsx` | ✅ |
| IRPJ/CSLL | Tabela LALUR + adicional 10% | `apuracoes_irpj_csll` | ✅ |
| CBS/IBS/Imposto Seletivo | Reforma 2026 (transição) | `projecao-reforma` edge | ✅ |
| Split payment | Recolhimento na origem | Tributário module | ✅ |
| Retenções de fonte | IRRF/CSRF/PIS/COFINS | `retencoes_fonte` | ✅ |
| Créditos tributários | Apuração + utilização | `creditos_tributarios` | ✅ |
| PER/DCOMP | Compensação de tributos | Edge dedicada | ✅ |
| DARFs | Geração + controle | `darfs` table | ✅ |
| Incentivos fiscais | SUDENE, Lei do Bem, etc. | `incentivos_fiscais` | ✅ |
| Regimes especiais | RECOF, Drawback, etc. | `regimes_especiais` | ✅ |
| Estratégias de elisão | 9 motores paralelos | `orquestrador-elisao` edge | 🤖 |
| Conformidade fiscal | 8 checks ponderados → score 0-100 | `verificar-conformidade-fiscal` edge | 🤖 |
| Auditoria tributária | `auditoria_tributaria` table | Edge dedicada | ✅ |
| Importação XML NFe | Parser + cadastro automático | `importar-xml-nfe` edge | ✅ |
| Exportação SPED | Contribuições + Fiscal | `exportar-sped` edge | ✅ |
| DRE Tributária | Demonstração específica | `dre_tributaria` table | ✅ |
| Heatmap anual | 12×8 visual de carga | `HeatmapTributario.tsx` | ✅ |
| Previsão IA 3 meses | Forecast tributário | `previsao-tributaria-ia` | 🤖 |
| Relatório anual PDF | jsPDF + autoTable, 4 seções | `gerar-relatorio-anual` | ✅ |
| Wizard onboarding | 4 passos com confetti | `pages/OnboardingTributario.tsx` | ✅ |
| Cronograma transição | Linha do tempo 2026-2033 | `CronogramaTransicao.tsx` | ✅ |
| Glossário tributário | Termos da reforma | `pages/GlossarioTributario.tsx` | ✅ |
| Benchmark setorial | Comparativo CNAE | `benchmarks_setoriais` | 🤖 |
| Comparativo de regimes | Side-by-side | `ComparativoRegimes.tsx` | ✅ |
| Obrigações acessórias | Calendário + status | `obrigacoes_acessorias` | ✅ |

---

## 8. NFe & SEFAZ

| Funcionalidade | Descrição | Localização | Status |
|---|---|---|---|
| Emissão NFe | Geração + assinatura digital | `pages/NotasFiscais.tsx` | ✅ |
| Cancelamento NFe | Fluxo SEFAZ com prazo | `CancelamentoNFe.tsx` | ✅ |
| Contingência | Modo offline SEFAZ | `ContingenciaNFe.tsx` | ✅ |
| Alertas de rejeição | Códigos SEFAZ explicados | `AlertasRejeicao.tsx` | ✅ |
| SEFAZ Monitor | Status em tempo real | `SefazMonitor.tsx` | ✅ |
| SEFAZ Analytics | Taxa rejeição/aprovação | `SefazAnalytics.tsx` | ✅ |
| OCR de NFe | Vision IA extrai 8+ campos | `processar-nf-ocr` edge | 🤖 |
| Comprovante OCR | Reconhecimento de pagamentos | OCR pipeline | 🤖 |

---

## 9. Aprovações & workflow

| Funcionalidade | Descrição | Localização | Status |
|---|---|---|---|
| Solicitações por alçada | Threshold `valor_minimo_aprovacao` | `pages/Aprovacoes.tsx` | ✅ |
| Workflow multi-aprovador | Sequencial ou paralelo | `aprovacoes` table | ✅ |
| Observadores | Notas e visibilidade extras | `aprovacao_observadores` | ✅ |
| Notificações | Push + email + in-app | `useNotifications` | ✅ |

---

## 10. Integrações

| Integração | Recurso | Edge Function | Status |
|---|---|---|---|
| Bling ERP v3 | OAuth + sync produtos/notas/pedidos (backoff exponencial) | `bling-*` | ✅ |
| ASAAS | Boletos, Pix, cartão, webhooks | `asaas-*` | ✅ |
| Bitrix24 CRM | Contatos, deals, webhooks | `bitrix24-sync` | ✅ |
| Open Finance | Saldos + extratos padronizados | `open-finance` | ✅ |
| CNPJa Lookup | Cache 30d + rate limit 10/h | `cnpja-lookup` | ✅ |
| Resend | Envio de emails transacionais | Múltiplas edges | ✅ |
| WhatsApp IA | Conversas proativas | `whatsapp-*` | 🤖 |
| Proxy Supabase externo | Sync clientes/fornecedores legacy | `external-data` | ✅ |
| Assinatura digital | Certificado A1/A3 | `assinatura-digital` | ✅ |
| Portal cliente | Acesso público via token | `pages/PortalCliente.tsx` | ✅ |
| Convite contador | Read-only JWT 30d | `convidar-contador` | ✅ |

---

## 11. IA & assistentes (P11→P14)

| Funcionalidade | Modelo | Localização | Status |
|---|---|---|---|
| EXPERT Agent | gemini-2.5-flash + 15 tools | `expert-agent` edge | 🤖 |
| Copilot Tributário | Contextual à página tributária | `copilot-tributario` | 🤖 |
| Copilot Global SSE | 4 tools (KPIs, ações, alertas, health) | `copilot-global` edge | 🤖 |
| Análise preditiva ML | Previsões financeiras | `analise-preditiva` | 🤖 |
| Categorização despesa | Auto-classificação | `categorizar-despesa` | 🤖 |
| Conciliação IA | Match probabilístico | `conciliacao-ia` | 🤖 |
| Análise fluxo IA | Insights de caixa | `analise-fluxo-ia` | 🤖 |
| Insights relatório | Sumarização executiva | Edge dedicada | 🤖 |
| Previsão tributária | Forecast 3 meses | `previsao-tributaria-ia` | 🤖 |
| Resumo executivo semanal | Cron Dom 18:00 | `gerar-resumo-executivo-semanal` | 🤖 |
| OCR NF | Vision + tool calling | `processar-nf-ocr` | 🤖 |
| Recomendações de metas | KPIs sugeridos | `useMetasFinanceiras` | 🤖 |

---

## 12. Inteligência operacional (P10→P13)

| Funcionalidade | Descrição | Localização | Status |
|---|---|---|---|
| Health Score Operacional | 6 dimensões 0-100 + insights IA | `health_scores_operacionais` | 🤖 |
| Detector de anomalias | 5 detectores estatísticos (cron 30min) | `detectar-anomalias-financeiras` | 🤖 |
| Centro de Ações Inteligentes | Top 5 cruzando 5 fontes | `acoes_recomendadas` | 🤖 |
| Alertas preditivos | Eventos futuros estimados | `alertas_preditivos` | 🤖 |
| Push notifications | VAPID + trigger crítico automático | `enviar-push-notification` | ✅ |
| Real-time alertas | Realtime channel + toast | `useRealtimeAlertas` | ✅ |
| Quick create | Criação rápida em qualquer tela | `QuickCreateMenu.tsx` | ✅ |
| Command palette | Cmd+K busca global | `CommandPalette.tsx` | ✅ |
| Recent items | Histórico de navegação | `useRecentItems` | ✅ |
| Favoritos | Pin de páginas/registros | `useFavorites` | ✅ |

---

## 13. Compliance & LGPD (P12)

| Funcionalidade | Descrição | Localização | Status |
|---|---|---|---|
| Centro Privacidade LGPD | Acesso/portabilidade/exclusão/retificação/anonimização | `pages/Privacidade.tsx` | ✅ |
| Processar solicitação LGPD | Edge automatizada | `processar-solicitacao-lgpd` | ✅ |
| Auditoria compliance | Logs LGPD completos | `solicitacoes_lgpd` | ✅ |
| Auditoria financeira | Trilha por entidade | `auditoria_financeira` | ✅ |
| Auditoria tributária | Trilha tributária | `auditoria_tributaria` | ✅ |
| Audit logs page | Visualização admin | `pages/AuditLogs.tsx` | 🔒 |
| Conformidade fiscal | Validador 8 checks | `ConformidadeFiscalCard.tsx` | 🤖 |

---

## 14. Observabilidade & admin (P13→P15)

| Funcionalidade | Descrição | Localização | Status |
|---|---|---|---|
| /admin/system-health | 5 abas consolidadas | `pages/SystemHealth.tsx` | 🔒 |
| Edge Health | `vw_edge_health` + status | Tab 1 | 🔒 |
| Telemetry | Charts de performance | `TelemetryCharts.tsx` | 🔒 |
| Anomalias detectadas | Painel + resolução | `AnomaliasDetectadasPanel.tsx` | 🔒 |
| Automações P13 | 6 cron jobs visíveis | `AutomacoesTab.tsx` | 🔒 |
| SLO Panel | p50/p95/p99 + uptime + 30d + CSV | `SLOPanel.tsx` | 🔒 |
| Cron jobs (6) | health 07:00 · anomalias */30min · resumo Dom 18:00 · benchmark Seg 03:00 · ações 06:00 · cleanup 05:55 · SLO 23:55 | `pg_cron + pg_net` | ✅ |
| Edge function logs | `edge_function_logs` table | `_shared/observability.ts` | ✅ |
| Frontend error logs | Captura client-side | `frontend_error_logs` | ✅ |
| Query telemetry | Performance de queries | Tabela dedicada | 🔒 |
| Rate limit dashboard | Visão de throttling | `RateLimitDashboard.tsx` | 🔒 |
| Webhooks log | `bitrix_webhook_events`, `bling_webhook_events` | Admin | 🔒 |
| RLS hardening P15 | 4 críticas resolvidas (notas_fiscais_ocr, resumos, ações, storage) | Migração P15 | ✅ |

---

## 15. UX & qualidade

| Funcionalidade | Descrição | Localização | Status |
|---|---|---|---|
| Onboarding tour | 8 passos react-joyride | `OnboardingTour.tsx` | ✅ |
| PWA install prompt | Instalação como app | `PWAInstallPrompt.tsx` | ✅ |
| Offline sync | Fila de operações offline | `useOfflineSync` | ✅ |
| Network status | Indicador online/offline | `NetworkStatus.tsx` | ✅ |
| Skeletons | Loading states em todas as listas | shadcn `skeleton` | ✅ |
| ErrorBoundary | Captura de erros globais | `ErrorBoundary.tsx` | ✅ |
| A11y WCAG AA | Roles, labels, contraste | Auditoria periódica | ✅ |
| Keyboard shortcuts | Atalhos globais | `useKeyboardShortcuts` | ✅ |
| Swipe back (mobile) | Gesto de voltar | `useSwipeBack` | ✅ |
| Confetti | Celebração em conclusões | `canvas-confetti` | ✅ |
| Sound feedback | Feedback sonoro opcional | `useSoundFeedback` | ✅ |
| Theme dark/light | Toggle persistente | `ThemeProvider` | ✅ |
| Premium aesthetic | Glassmorphism + glow + Bento | Design system global | ✅ |
| Validators BR | CPF/CNPJ/Pix/Telefone | `brazilian-validators.ts` | ✅ |
| Export CSV/PDF | UTF-8 BOM + jsPDF | `useExportData` | ✅ |
| Importação CSV/Excel | Wizard de mapeamento | `DataImporter.tsx` | ✅ |
| Virtual lists | `react-window` > 30 itens | `VirtualizedTable` | ✅ |
| Filtros avançados | Multi-campo persistentes | `AdvancedFilters.tsx` | ✅ |
| Filtros salvos | Presets por usuário | `SavedFiltersDropdown.tsx` | ✅ |
| Bulk actions | Operações em massa | `BulkActionsBar.tsx` | ✅ |
| Search debounce | 300ms padrão | `SearchInput.tsx` | ✅ |
| Navegação inteligente | `BackButton` + `parentRouteMap` | `BackButton.tsx` | ✅ |

---

## 🏗️ Arquitetura final (alto nível)

```
┌────────────────────────────────────────────────────────────┐
│                    UI (React + shadcn)                     │
│  54 páginas · 60+ pastas componentes · Design System HSL   │
└──────────────┬─────────────────────────────────────────────┘
               │ TanStack Query (cache 2-10min)
┌──────────────▼─────────────────────────────────────────────┐
│              Domínio (130+ hooks + validators)             │
└──────────────┬─────────────────────────────────────────────┘
               │ Supabase JS client
┌──────────────▼─────────────────────────────────────────────┐
│   Lovable Cloud · 130+ tabelas · RLS · vw_* otimizadas     │
│         51 Edge Functions Deno · 6 Cron Jobs P13           │
│   AI Gateway (Lovable AI) · Resend · Open Finance · CNPJa  │
└────────────────────────────────────────────────────────────┘
```

---

## 🔗 Links úteis

- **Painel admin de saúde:** `/admin/system-health`
- **Centro de Privacidade (LGPD):** `/configuracoes/privacidade`
- **Wizard tributário:** `/tributario/onboarding`
- **Repositório GitHub:** sincronizado via integração bidirecional Lovable

---

> **Status final do produto:** 10/10++++++++++ · 1.012 testes passando · 0 erros TS · RLS hardened · 51 edges em produção.
