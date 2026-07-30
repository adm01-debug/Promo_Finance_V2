---
name: Página Sino dos filtros salvos
description: Página /configuracoes/notificacoes/sino lista todos os filtros salvos do usuário agrupados por entity_type, com toggles inline para canais (in-app/push) e badge de tempo real ativo por preset
type: feature
---
Página `src/pages/configuracoes/SinoNotificacoesFiltros.tsx` (rota `/configuracoes/notificacoes/sino`):
- Lista todos os `saved_filters` do usuário agrupados por `entity_type` (label resolvido via `findCatalogEntry` + fallback `ENTITY_TYPE_LABELS` para `anomalias_detectadas` e `conciliacao_transacoes`).
- Por preset, dois Switches inline (No app / Push) que disparam `subscribe`/`updateChannels` de `useSavedFilterSubscriptions`. Botão "Remover" só aparece quando ativo.
- Badge "Tempo real ativo" verde quando `entity_type ∈ REALTIME_ENABLED_ENTITY_TYPES` (`anomalias_detectadas`, `conciliacao_transacoes`); cinza com aviso "Preferência salva, será aplicada quando módulo ganhar suporte" caso contrário.
- KPIs no topo: total de assinaturas, in-app, push, e-mail. Banner amarelo se push não autorizado mas há assinaturas pedindo push (botão "Ativar push" via `useWebPushSubscription`).
- Atalho adicionado em `src/pages/Configuracoes.tsx` (grid 3 colunas: Preferências, Sino, Diagnóstico).

Para preferências avançadas (frequência, severidades, tipos de evento, e-mail) o usuário continua usando `SubscriptionPopover` no `SavedFiltersBar` dentro do próprio módulo. Esta página é o atalho rápido para ligar/desligar canais sem entrar em cada tela.
