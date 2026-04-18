---
name: P13 Automação Total
description: Cron jobs P10-P12 automáticos + Centro de Ações Inteligentes + push trigger
type: feature
---
6 cron jobs P13 (pg_cron + pg_net): health-score 07:00, anomalias */30min, resumo-semanal Dom 18:00, refresh-benchmark Seg 03:00, gerar-acoes 06:00, cleanup-acoes 05:55.
Tabela acoes_recomendadas (TTL 24h) populada por edge gerar-acoes-recomendadas (gemini-2.5-flash cruza 5 fontes: anomalias críticas + health<70 + alertas + apurações atrasadas + LGPD pendentes).
UI: CentroAcoesInteligentes no DashboardExecutivo + AutomacoesTab em /admin/system-health (4ª aba) + item Privacidade no sidebar.
Trigger fn_notificar_alerta_critico_push em alertas (prioridade=critica) → enviar-push-notification automático.
Hook: useAcoesRecomendadas.