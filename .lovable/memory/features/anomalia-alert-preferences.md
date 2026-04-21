---
name: Preferências de alerta de anomalias por usuário
description: Toast/badge de anomalias críticas com silêncio por severidade, snooze temporário, centro de custo e tipo
type: feature
---
Tabela `user_anomalia_preferences` (RLS por user_id, unique user_id):
- toast_enabled, toast_min_severidade, silenciar_ate, centros_custo_silenciados[], tipos_silenciados[].

`anomalias_detectadas.centro_custo_id` (nullable) é populada pela edge `detectar-anomalias-financeiras` ao criar anomalias de `movimentacao` e `conta_pagar` (puxado do registro origem). Backfill via migration.

Hooks:
- `useAnomaliaPreferences` (upsert default na 1ª leitura) + helper puro `shouldNotify(prefs, anomalia)`.
- `useAnomaliasCriticasCount` (contagem de críticas/altas em aberto, respeitando silêncios).
- `useRealtimeAnomalias` aplica `shouldNotify` antes do toast; sempre invalida queries para o badge.

UI: `AnomaliaPreferencesDialog` aberto pelo botão "Preferências" no header de `AnomaliasDetectadasPanel`. Badge de críticas exibido ao lado do título.
