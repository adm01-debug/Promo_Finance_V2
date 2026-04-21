

## Plano — Documento de "Funcionalidades sem UI completa" (FUNCIONALIDADES_SEM_UI.md)

Após análise minuciosa do codebase (130+ hooks, 54 páginas, 51 edges, 100+ componentes), identifiquei o que **existe em código mas não tem interface visual completa exposta ao usuário final**. Vou gerar um `.md` executivo categorizando os gaps.

### Localização
- `/mnt/documents/FUNCIONALIDADES_SEM_UI.md` (download imediato)
- `docs/FUNCIONALIDADES_SEM_UI.md` (versionado no GitHub)

### Achados consolidados (resumo)

**🔴 Gap crítico (hook 100% pronto, ZERO UI):**
1. **`useBudget`** (298 linhas) — sistema completo de orçamentos por categoria com `Budget`, `BudgetSummary`, alertas, projeções, status under/warning/over. **Nenhuma página/componente** consome. Pronto para virar `pages/Orcamentos.tsx` ou widget no Dashboard.

**🟡 Gaps parciais (renderizado em local secundário, sem rota dedicada):**
2. **Reforma Tributária — 11 painéis** (`SplitPaymentPanel`, `ConciliacaoTributariaPanel`, `IncentivosFiscaisPanel`, `AuditoriaCompliancePanel`, `ComparativoRegimesPanel`, `CashbackSimuladorPanel`, `ImportacaoXMLPanel`, `ExportacaoSPED`, `RelatoriosContabeisTributarios`, `PerDcompPanel`, `RetencoesFonte`) — só acessíveis via troca interna de tab no `DashboardReformaTributaria` (`case` de switch). Sem rotas próprias, sem links no sidebar, sem deep-link.
3. **`AssistenteFechamentoMensal`** — usado só no `DashboardTributario`; não há página `/tributario/fechamento-mensal`.
4. **`ScoringClientesPanel`** — componente existe mas só renderizado dentro de `pages/Clientes.tsx` (sem destaque/aba própria).
5. **`MetasFinanceirasPanel`** — só aparece como widget opcional no Dashboard (precisa habilitar).
6. **`PortalClientePanel`** — só renderizado dentro do detalhe de cliente; sem visão consolidada de tokens ativos por admin.
7. **`AlertasPreditivosPanel`** — só widget opcional no Dashboard.
8. **`HealthScoreCard`** + **`CentroAcoesInteligentes`** — embutidos no `DashboardExecutivo`; sem página `/inteligencia` dedicada.

**🟢 Edge Functions sem UI dedicada (rodam por cron/trigger):**
9. **`gerar-resumo-executivo-semanal`** — só visualizável no admin (`ResumosExecutivosTab`). Usuário comum não vê/recebe via UI.
10. **`calcular-slo-metrics-diario`** — restrito a admin.
11. **`enviar-relatorios-tributarios-agendados`** — sem painel de "histórico de envios" para o usuário.
12. **`detectar-anomalias-financeiras`** — resultados só no admin (`AnomaliasDetectadasPanel`); usuário financeiro não vê suas próprias anomalias.

**🔵 Hooks utilitários (intencionalmente sem UI — corretos):**
- `useDebounce`, `useLocalStorage`, `useMediaQuery`, `useBreakpoint`, `useDeviceDetection`, `useKeyboardShortcuts`, `useNetworkStatus`, `useInstallPrompt`, `useOfflineSync`, `useConfetti`, `useSoundFeedback`, `useSwipeBack`, `usePrefetchRoutes`, `useCountUp`, `usePagination`, `useFilters`, `useZodForm`, `useTableOptimization`, `useOptimizedQueries`, `useViews`, `useMeta`, `usePermissions`, `useAuditLog`, `useReauth`. Não precisam de UI — são primitivas.

### Estrutura do documento (6 seções)

1. **Resumo executivo** — 1 gap crítico, 7 gaps parciais, 4 edges sem UI usuário, 24 utilitários OK.
2. **🔴 Hook órfão crítico** — tabela detalhada do `useBudget` (capacidades, sugestão de UI: nova página `/orcamentos` com cards por categoria + gráfico Recharts + dialog CRUD).
3. **🟡 Componentes ocultos em sub-tabs** — tabela: componente · localização atual · sugestão de exposição (rota dedicada, item sidebar, deep-link).
4. **🟢 Edge Functions sem UI usuário** — tabela: edge · cron/trigger · sugestão (painel histórico, notificação, aba self-service).
5. **🔵 Hooks utilitários (sem necessidade de UI)** — lista justificada.
6. **Roadmap sugerido P16** — priorização por impacto:
   - **Alto:** `useBudget` → página `/orcamentos`; expor 11 painéis tributários como rotas (`/tributario/split-payment`, `/tributario/incentivos`, etc.) + sidebar.
   - **Médio:** página `/inteligencia` consolidando HealthScore + Anomalias + Centro de Ações para usuário comum (não só admin); painel "Meus resumos semanais" em `/relatorios`.
   - **Baixo:** Aba dedicada de scoring em `/clientes`; histórico de envios de relatórios agendados.

### Formato

- Tabelas Markdown (Hook/Componente · Linhas de código · Localização · Status UI · Sugestão).
- Badges: 🔴 Crítico · 🟡 Parcial · 🟢 Edge · 🔵 Utilitário OK.
- Diagrama ASCII do "mapa de cobertura" (% UI exposta vs código pronto).
- Footer com link para `/admin/system-health` e referência ao `FUNCIONALIDADES_SISTEMA.md`.

### Métricas a incluir

| Camada | Total | Com UI | Sem UI completa | % Cobertura |
|---|---|---|---|---|
| Hooks de domínio | ~95 | ~94 | 1 (`useBudget`) | 98.9% |
| Componentes-painel | ~110 | ~99 | 11 (tributário sub-tabs) | 90.0% |
| Edge Functions usuário | 51 | 47 | 4 (cron-only sem painel) | 92.2% |
| Hooks utilitários | 24 | N/A (não precisam) | N/A | 100% |
| **Total geral** | **~280** | **~265** | **~15** | **~94.6%** |

### Entrega

Após gerar, emito `<lov-artifact>` para download. Arquivo em `docs/` sincroniza automaticamente no GitHub.

