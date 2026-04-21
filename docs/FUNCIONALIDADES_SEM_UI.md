# 🔍 Funcionalidades sem UI completa — Promo Finance

> Auditoria minuciosa do codebase: o que existe em código (hooks, edges, componentes) mas **não está exposto adequadamente** ao usuário final via interface visual.

**Data da análise:** 2026-04-21
**Escopo:** 130+ hooks, 54 páginas, 51 edge functions, 100+ componentes-painel
**Baseline:** P1 → P15 (1.012/1.012 testes passando)

---

## 📊 Resumo executivo

| Categoria | Total | Com UI exposta | Sem UI completa | Cobertura |
|---|---:|---:|---:|---:|
| 🔴 Hooks de domínio | ~95 | ~94 | **1** (`useBudget`) | **98.9%** |
| 🟡 Componentes-painel ocultos em sub-tabs | ~110 | ~99 | **11** (módulo tributário) | **90.0%** |
| 🟢 Edge Functions sem painel para usuário | 51 | 47 | **4** (cron-only restritas a admin) | **92.2%** |
| 🔵 Hooks utilitários (intencionalmente sem UI) | 24 | N/A | N/A | **100%** |
| **TOTAL** | **~280** | **~265** | **~16** | **~94.6%** |

**Veredito:** sistema com cobertura de UI **excelente (94.6%)**. Os gaps são pontuais e majoritariamente de **exposição/descoberta** (rota, sidebar, deep-link), não de implementação.

---

## 🔴 1. Hook órfão CRÍTICO — `useBudget`

| Atributo | Valor |
|---|---|
| **Arquivo** | `src/hooks/useBudget.ts` |
| **Linhas de código** | 298 |
| **Status** | ✅ 100% implementado · ❌ **0 componentes consomem** |
| **Persistência** | `localStorage` via `useLocalStorage('budgets', ...)` |

### Capacidades já prontas no hook
- ✅ CRUD completo: `createBudget`, `updateBudget`, `deleteBudget`, `duplicateBudget`
- ✅ Cálculo de `BudgetSummary` (gasto, restante, % usado, status `under|warning|over`)
- ✅ Projeção: `dailyAverage`, `projectedTotal`, `daysRemaining`
- ✅ Períodos `weekly | monthly | yearly`
- ✅ Sistema de alertas (`useBudgetAlerts`) com threshold configurável (default 80%)
- ✅ Tracking ativo (`useBudgetTracking`) por categoria
- ✅ Totais agregados: `totalBudgeted`, `totalSpent`, `overallPercentUsed`, contagem por status

### Sugestão de UI (P16 prioritário)
Criar **`src/pages/Orcamentos.tsx`** + rota `/orcamentos`:
- Hero com 4 KPIs (orçado, gasto, restante, % geral)
- Cards por categoria com `Progress` colorido por status
- Gráfico Recharts (barras stacked: orçado vs gasto vs projetado)
- Dialog CRUD reutilizando `useCRUD` + `useZodForm`
- Integração com `useCategorias` + `useContasPagar` para popular `spentData` automaticamente
- Widget no `DashboardExecutivo` (`alertas-orcamento`)
- Item no sidebar em "Financeiro › Orçamentos"

---

## 🟡 2. Componentes ocultos em sub-tabs (sem rota / sidebar)

Estes 11 painéis tributários **existem e funcionam**, mas só são acessíveis trocando uma aba interna no `DashboardReformaTributaria` (`switch case`). **Sem rota dedicada, sem deep-link, sem item no sidebar.**

| Componente | Localização atual | Sugestão de exposição |
|---|---|---|
| `SplitPaymentPanel` | `case 'split-payment'` em `DashboardReformaTributaria` | Rota `/tributario/split-payment` + sidebar |
| `ConciliacaoTributariaPanel` | `case 'conciliacao'` | Rota `/tributario/conciliacao` |
| `IncentivosFiscaisPanel` | `case 'incentivos'` | Rota `/tributario/incentivos` |
| `AuditoriaCompliancePanel` | `case 'auditoria'` | Rota `/tributario/auditoria` |
| `ComparativoRegimesPanel` | `case 'comparativo'` | Rota `/tributario/comparativo` |
| `CashbackSimuladorPanel` | `case 'cashback'` | Rota `/tributario/cashback` |
| `ImportacaoXMLPanel` | `case 'importacao-xml'` | Rota `/tributario/importacao-xml` |
| `ExportacaoSPED` | `case 'exportacao'` | Rota `/tributario/sped` (já há botão SPED no header) |
| `RelatoriosContabeisTributarios` | `case 'relatorios'` | Rota `/tributario/relatorios-contabeis` |
| `PerDcompPanel` | `case 'per-dcomp'` | Rota `/tributario/per-dcomp` |
| `RetencoesFonte` | `case 'retencoes'` | Rota `/tributario/retencoes` |

**Impacto:** usuário não consegue compartilhar URL de uma aba específica, não vê o módulo no sidebar, e o command palette (Ctrl+K) não encontra estes painéis.

### Outros componentes pouco descobríveis

| Componente | Localização atual | Sugestão |
|---|---|---|
| `AssistenteFechamentoMensal` | Apenas no `DashboardTributario` | Página `/tributario/fechamento-mensal` dedicada |
| `ScoringClientesPanel` | Embutido em `pages/Clientes.tsx` | Aba dedicada "Scoring & Risco" em `/clientes` |
| `MetasFinanceirasPanel` | Widget opcional no Dashboard (precisa habilitar) | Promover a widget default + página `/metas` |
| `PortalClientePanel` | Só no detalhe de cliente individual | Visão consolidada admin: `/clientes/portal-tokens` |
| `AlertasPreditivosPanel` | Widget opcional no Dashboard | Promover a widget default |
| `HealthScoreCard` + `CentroAcoesInteligentes` | Embutidos no `DashboardExecutivo` | Página `/inteligencia` consolidando IA operacional |
| `WhatsAppHistoryPanel` | Aba secundária em `/cobrancas` | OK, mas adicionar contador de não lidas no sidebar |

---

## 🟢 3. Edge Functions sem painel para usuário comum

Funções rodam por cron/trigger e produzem dados, mas **só admin vê o resultado**. Usuário financeiro/operacional fica no escuro.

| Edge Function | Trigger | Resultado visível em | Gap |
|---|---|---|---|
| `gerar-resumo-executivo-semanal` | Cron Dom 18:00 | `ResumosExecutivosTab` (admin-only) | 🟡 Usuário deveria ver "Meus resumos semanais" em `/relatorios` |
| `calcular-slo-metrics-diario` | Cron 23:55 | `SLOPanel` (admin-only) | 🔵 OK ser admin-only — métricas de infra |
| `enviar-relatorios-tributarios-agendados` | Cron diário | Apenas no e-mail do destinatário | 🟡 Falta painel "Histórico de envios" em `/relatorios/agendados` |
| `detectar-anomalias-financeiras` | Cron */30min | `AnomaliasDetectadasPanel` (admin-only) | 🟡 Usuário financeiro deveria ver anomalias da própria empresa |
| `whatsapp-ia-proativo` | Manual via `WhatsAppProativoPanel` | OK | ✅ Bem exposto |
| `processar-solicitacao-lgpd` | Manual via `CentroPrivacidadeLGPD` | OK | ✅ Bem exposto |

---

## 🔵 4. Hooks utilitários (sem necessidade de UI — corretos)

Estes 24 hooks são **primitivas de infraestrutura** consumidas por outros componentes. Não devem ter UI própria.

`useDebounce` · `useLocalStorage` · `useMediaQuery` · `useBreakpoint` · `useDeviceDetection` · `useKeyboardShortcuts` · `useKeyboardNavigation` · `useNetworkStatus` · `useInstallPrompt` · `useOfflineSync` · `useConfetti` · `useSoundFeedback` · `useSwipeBack` · `usePrefetchRoutes` · `useCountUp` · `usePagination` · `useFilters` · `useZodForm` · `useTableOptimization` · `useOptimizedQueries` · `useViews` · `useMeta` · `usePermissions` · `useReauth`

✅ **Status: 100% adequado** — nenhuma ação necessária.

---

## 🗺️ Mapa de cobertura visual

```
                    Cobertura UI por camada

Hooks domínio       ████████████████████░  98.9%  (1 órfão: useBudget)
Componentes-painel  ██████████████████░░░  90.0%  (11 sub-tabs sem rota)
Edge Functions      ██████████████████░░░  92.2%  (3 cron sem painel usuário)
Hooks utilitários   █████████████████████ 100.0%  (corretos sem UI)
                    ─────────────────────
GERAL               ███████████████████░░  94.6%
```

---

## 🚀 Roadmap sugerido — Lote P16

### 🔥 Alto impacto (semana 1)
1. **Página `/orcamentos`** consumindo `useBudget` (cards + Recharts + CRUD)
2. **11 rotas tributárias dedicadas** (`/tributario/split-payment`, `/tributario/incentivos`, etc.) + grupo "Reforma Tributária" no sidebar com sub-itens
3. **Página `/inteligencia`** consolidando `HealthScoreCard` + `CentroAcoesInteligentes` + `AnomaliasDetectadasPanel` (versão usuário, filtrada por empresa) para usuário financeiro

### 🟡 Médio impacto (semana 2)
4. Aba "Scoring & Risco" em `/clientes` destacando `ScoringClientesPanel`
5. Painel "Meus resumos semanais" em `/relatorios` (filtrar `resumos_executivos_semanais` por usuário)
6. Painel "Histórico de envios" em `/relatorios/agendados`

### 🔵 Baixo impacto (semana 3)
7. Visão admin consolidada de `PortalClientePanel` (todos os tokens ativos)
8. Promover `MetasFinanceirasPanel` e `AlertasPreditivosPanel` a widgets default no Dashboard
9. Página `/tributario/fechamento-mensal` dedicada para o `AssistenteFechamentoMensal`

---

## 📎 Referências

- 📘 [FUNCIONALIDADES_SISTEMA.md](./FUNCIONALIDADES_SISTEMA.md) — inventário completo (100% das features)
- 🛠️ `/admin/system-health` — observabilidade SLO/Anomalias/Cron
- 🧪 [Auditoria P15](../.lovable/memory/quality/auditoria-testes-p15.md) — baseline de qualidade

---

**Conclusão:** o sistema tem **arquitetura madura e código robusto**. Os gaps de UI são pontuais e resolvíveis com **~3 sprints de exposição** (rotas, sidebar, deep-links). Após P16, a cobertura projetada chega a **~99.5%** (apenas hooks utilitários permaneceriam intencionalmente sem UI).
