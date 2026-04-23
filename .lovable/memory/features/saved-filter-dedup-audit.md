---
name: Dedup e auditoria de notificações de filtros salvos
description: Helper puro savedFilterDedup + view vw_notification_history_duplicates para garantir não duplicação após refresh
type: feature
---
Defesa em duas camadas contra disparos duplicados:
1. **In-session**: Set `seen` no `useSavedFilterAlerts` rejeita o mesmo `row.id` na mesma sessão.
2. **Cross-refresh**: `last_seen_at` na assinatura — qualquer evento com `rowTs <= last_seen_at` é rejeitado mesmo após refresh.

Lógica extraída para `src/hooks/savedFilterDedup.ts` (`checkShouldDispatch` + `clampRateLimit`), coberta por `src/hooks/__tests__/savedFilterDedup.test.ts` (10 testes).

Auditoria SQL: view `vw_notification_history_duplicates` (security_invoker) lista pares `(user_id, source_ref, channel)` em janela < 60s. Útil para confirmar que assinaturas/push não geram repetição após refresh ou reconexão de realtime.
