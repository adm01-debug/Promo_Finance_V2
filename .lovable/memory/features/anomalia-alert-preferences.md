---
name: Preferências de alerta de anomalias por usuário
description: Toast/badge de anomalias com severidades, duração, ações de toast/drawer, snooze, centro de custo e tipo configuráveis por usuário
type: feature
---
Tabela `user_anomalia_preferences` (RLS por user_id, unique user_id):
- toast_enabled, toast_min_severidade (legado), silenciar_ate, centros_custo_silenciados[], tipos_silenciados[].
- **toast_severidades_ativas TEXT[]** — lista explícita de severidades que disparam toast (default `{critica,alta}`); fonte da verdade quando preenchida.
- **toast_duracao_segundos INT** — 3..30, default 12 (validado por trigger).
- **toast_acoes JSONB** — `{drill_down, abrir_pagina, copiar_id, marcar_lida}` booleans.
- **drawer_acoes JSONB** — `{abrir_entidade, pagina_completa, copiar_id, marcar_lida}` booleans.
- Trigger `validate_user_anomalia_preferences` valida range da duração e severidades.

`anomalias_detectadas.centro_custo_id` (nullable) populada pela edge `detectar-anomalias-financeiras` para anomalias de movimentação/conta_pagar.

Hooks:
- `useAnomaliaPreferences` (upsert default na 1ª leitura, normaliza linhas legadas) + helper puro `shouldNotify(prefs, anomalia)` que checa `toast_severidades_ativas`.
- `useAnomaliasCriticasCount` — contagem respeitando silêncios.
- `useRealtimeAnomalias` — usa duração e ações configuradas; sonner mostra até 2 ações (action + cancel), extras em toasts secundários.

UI:
- `AnomaliaPreferencesDialog` com seções: master switch, severidades (checkboxes), Slider de duração, ações do toast, ações do drawer, soneca, CCs, tipos.
- `AnomaliaDrillDownDrawer` filtra botões pelo `drawer_acoes` (Abrir transação, Página completa, Copiar ID, Marcar lida).
