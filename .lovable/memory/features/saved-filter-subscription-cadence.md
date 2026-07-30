---
name: Cadência, canais e regras de severidade/tipo das assinaturas de filtros salvos
description: Assinaturas em saved_filter_subscriptions suportam frequencia, horario_preferido, canais (in-app/push/email), severidades_criticas e tipos_eventos_ativos para alertas customizados
type: feature
---
Tabela `saved_filter_subscriptions` (RLS por user_id):
- `notify_inapp`, `notify_push`, `notify_email` (canais).
- `frequencia` enum `imediata|horaria|diaria` + `horario_preferido` TIME + `next_dispatch_at` TIMESTAMPTZ (agrupamento).
- **`severidades_criticas TEXT[]`** — quais severidades (`baixa|media|alta|critica`) o usuário considera críticas para esta assinatura. Default `{critica}`. Eleva push para `critica` e usa `toast.error` com duração 15s.
- **`tipos_eventos_ativos TEXT[]`** — lista de tipos de evento (ex.: `pagamento_duplicado`, `movimentacao_outlier`) que disparam alerta. Vazio = todos disparam (compat).
- Trigger `validate_saved_filter_subscription_rules` rejeita severidades inválidas.

Hooks:
- `useSavedFilterSubscriptions` exporta `SEVERIDADES_DISPONIVEIS` + tipo `SeveridadeAlerta`. Mutations `subscribe`/`updateChannels` aceitam `severidadesCriticas` e `tiposEventosAtivos` (resetam `next_dispatch_at` apenas quando freq/horário mudam).
- `useSavedFilterAlerts` (`EntityConfig` interno): novos opcionais `rowSeveridade` e `rowTipoEvento`. Quando definidos, o loop filtra registros pelos tipos ativos e marca como crítico se a severidade do row está em `severidades_criticas`. Anomalias usa ambos; conciliação usa apenas `rowTipoEvento` (`credito|debito`).

UI:
- `SubscriptionPopover` (`src/components/shared/SubscriptionPopover.tsx`) ganha duas seções extras: "Severidades críticas" (4 checkboxes) e "Tipos de evento" (renderizada quando `tiposEventosOpcoes` é passada). Largura w-80, scroll vertical até 80vh.
- `SavedFiltersBar` passa o catálogo de tipos de anomalia (5 itens) para `entityType === "anomalias_detectadas"`.
