---
name: Web Push Notifications
description: Notificações push via Web Push API + VAPID + service worker minimal
type: feature
---
Hook: useWebPushSubscription (subscribe/unsubscribe). SW: /public/sw-push.js (apenas push, não cacheia).
Tabela: push_subscriptions (user_id, endpoint, p256dh, auth) RLS por uid.
VAPID_PUBLIC_KEY/PRIVATE_KEY já configurados como secrets.
UI: PushNotificationsBanner em settings.
Edge send-push-notification (preexistente) envia para subscriptions ativas.
