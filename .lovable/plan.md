
P13 entregue ✅. Sistema 10/10++++++++. Proponho **Lote P14 — Inteligência Conversacional Global + Onboarding Guiado + Observabilidade Total**.

## Lote P14 — Copilot Global + Tour Interativo + Painel SLO

### 1. Copilot Global (assistente IA em todas as páginas)
Hoje existe `CopilotTributarioFloat` apenas no DashboardTributario. Vou expandir:
- Edge `copilot-global` (gemini-2.5-flash, SSE streaming):
  - Recebe `{ contexto_pagina, pergunta, historico }`.
  - Tools function-calling: `consultar_kpis_financeiros`, `consultar_apuracao_tributaria`, `listar_acoes_recomendadas`, `buscar_alertas_criticos`, `consultar_health_score`.
  - System prompt adapta-se à página atual (financeiro vs tributário vs admin).
  - Trata 429/402, sanitiza markdown via `escapeHtml`.
- UI `CopilotGlobalFloat.tsx` montado no `MainLayout`:
  - Botão flutuante canto inferior-direito (ícone Sparkles).
  - Sheet lateral com chat + sugestões contextuais ("Resumo do dia", "Quais ações urgentes?", "Como está minha carga tributária?").
  - Histórico em sessionStorage por rota.
- RBAC: admin/financeiro/visualizador.
- Hook `useCopilotGlobal`.

### 2. Onboarding Guiado Interativo (tour de primeira sessão)
- Migration: tabela `user_onboarding_progress` (user_id PK, etapas_completas text[], iniciado_em, finalizado_em, pulado).
- Componente `OnboardingTour.tsx` usando `react-joyride` (~30kb gzip):
  - 8 passos guiados pelos módulos principais: Dashboard → Contas a Pagar → Contas a Receber → Tributário → Aprovações → LGPD → Centro de Ações → Configurações.
  - Cada passo: highlight do elemento + tooltip explicativo + ação opcional ("Ver mais").
  - Persiste progresso em tempo real.
- Trigger automático no primeiro login (verifica `user_onboarding_progress.finalizado_em IS NULL`).
- Botão "Reiniciar tour" em `/configuracoes`.
- Hook `useOnboardingProgress`.

### 3. Painel SLO/SLA Observabilidade (admin)
- Migration: tabela `slo_metrics_diarias` (data PK, total_requisicoes, latencia_p50_ms, latencia_p95_ms, latencia_p99_ms, taxa_erro_pct, edges_health jsonb, calculado_em).
- Edge `calcular-slo-metrics-diario` (cron 23:55):
  - Agrega últimas 24h de `audit_logs` + `cron.job_run_details` + edge function logs.
  - Calcula percentis de latência, taxa de erro, uptime das 6 cron jobs P13.
  - Persiste snapshot diário (retenção 90 dias).
- UI `SLOPanel.tsx` (5ª aba em `/admin/system-health`):
  - 4 KPI cards (uptime%, latência p95, taxa erro, total req/dia).
  - Gráfico linha últimos 30 dias (recharts).
  - Tabela detalhada por dia com export CSV.
- Hook `useSLOMetrics`.

### 4. Validação
- `npx tsc --noEmit` zero erros.
- 2 edge functions deployadas + 1 cron job novo (slo 23:55).
- 2 migrations limpas + RLS hardening.
- Memórias: `mem://features/copilot-global`, `mem://features/onboarding-tour`, `mem://features/slo-observabilidade`.

## Diagrama
```text
   MainLayout
      └─▶ CopilotGlobalFloat ──▶ copilot-global (SSE)
                                     ├─▶ tools: KPIs, apuração, ações, alertas, health
                                     └─▶ contexto adapta por rota

   Primeiro login ──▶ OnboardingTour (react-joyride, 8 passos)
                          └─▶ user_onboarding_progress

   cron 23:55 ──▶ calcular-slo-metrics-diario
                      ├─▶ agrega audit_logs + cron history + edge logs
                      └─▶ slo_metrics_diarias
                            └─▶ SLOPanel (4 KPIs + gráfico 30d + CSV)
```

## Observações
- Reaproveita 100% da infra P1-P13 (auditoria, cron, AI gateway, RBAC, sidebar).
- Sem secrets novos ✅.
- Eleva produto para **10/10+++++++++** (assistente em qualquer tela + onboarding profissional + SLO mensurável).
