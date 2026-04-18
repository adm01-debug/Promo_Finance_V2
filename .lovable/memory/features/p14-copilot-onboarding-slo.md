---
name: P14 Copilot Global + Onboarding + SLO
description: Copilot IA contextual em todas as páginas (SSE + tools), tour react-joyride 8 passos, painel SLO/SLA admin com snapshot diário 23:55
type: feature
---
- Edge `copilot-global` (gemini-2.5-flash, SSE) com 4 tools (KPIs, ações, alertas, health). Contexto adapta por rota. RBAC admin/financeiro/visualizador.
- `CopilotGlobalFloat.tsx` no MainLayout. Histórico em sessionStorage por rota.
- `OnboardingTour.tsx` (react-joyride) auto-inicia para usuários novos. Tabela `user_onboarding_progress`. Botão "Reiniciar tour" em /configuracoes > notificações.
- Edge `calcular-slo-metrics-diario` (cron 55 23 * * *) → tabela `slo_metrics_diarias` (retenção 90d). `SLOPanel` é a 5ª aba em /admin/system-health (4 KPIs + gráfico 30d + CSV).
