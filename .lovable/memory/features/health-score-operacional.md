---
name: Health Score Operacional
description: Score 0-100 de saúde 360° por empresa com 6 dimensões ponderadas + insights gerados por IA, snapshot diário
type: feature
---
Tabela `health_scores_operacionais` (admin-only).
Dimensões + pesos: tributário 25%, financeiro 25%, operacional 15%, LGPD 10%, cadastros 10%, engajamento 15%.
Edge `calcular-health-score-operacional` agrega dados, calcula score + tendência vs 7d, chama gemini-2.5-flash para 3 insights markdown.
UI `HealthScoreCard.tsx` (gauge + breakdown + insights). Hook `useHealthScoreOperacional`.
Cron diário 07:00 (a configurar via cron job se necessário).
