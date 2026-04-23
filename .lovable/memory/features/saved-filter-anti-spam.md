---
name: Anti-spam de assinaturas de filtro salvo
description: Limite máximo de notificações imediatas por janela deslizante; excedente vira 1 batch
type: feature
---
Cada `saved_filter_subscriptions` tem `rate_limit_max` (1-100, default 5) e `rate_limit_window_min` (1-1440, default 10), validados por trigger.

`useSavedFilterAlerts` mantém em memória `dispatchTimestampsBySub` (timestamps por sub na janela) e `flushTimerBySub` (timer de debounce). Em modo `imediata`: se a contagem na janela ≥ max, o item entra em `pendingBySub` e um `setTimeout` agenda `flushBatch` ao fim da janela. Cada novo item excedente reagenda o timer (coalesce). Itens "user critical" (severidade marcada em `severidades_criticas`) bypassam o limite.

UI no `SubscriptionPopover` na seção "Anti-spam (rajadas)" com 2 inputs numéricos. Clamp client-side (1-100 / 1-1440) espelha o trigger.
