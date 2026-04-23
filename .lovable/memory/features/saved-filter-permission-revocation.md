---
name: Revogação de permissões em assinaturas de filtros salvos
description: Trigger fn_revoke_orphan_saved_filter_subscriptions + guarda permission_revoked no helper de dedup garantem que alertas param imediatamente quando o usuário perde acesso ao filtro
type: feature
---
Defesa em três camadas para garantir que o usuário só receba alertas de filtros aos quais tem acesso:

1. **Banco (autoritativo)**: trigger `fn_revoke_orphan_saved_filter_subscriptions` em `AFTER UPDATE OR DELETE` de `saved_filters` e `user_empresas` apaga assinaturas órfãs usando `can_access_saved_filter`. Cobre: filtro virou privado, mudou de empresa/papéis, foi excluído, ou usuário foi desativado/teve role alterada no tenant.

2. **Realtime (sincronização)**: `useSavedFilterSubscriptions` escuta canal `saved-filter-permissions-${user.id}` em `saved_filters` (qualquer evento) e DELETE em `saved_filter_subscriptions`, invalidando React Query imediatamente — UI reflete a revogação sem refresh.

3. **Helper puro (defesa em profundidade)**: `checkShouldDispatch` em `src/hooks/savedFilterDedup.ts` recebe `subscriptionUserId` + `currentUserId` e rejeita com `reason: "permission_revoked"` se não bate. Cobre o gap entre revogação no banco e próxima sincronização do cliente.

Coberto por 13 testes em `src/hooks/__tests__/savedFilterDedup.test.ts` (incluindo cenários cross-user e compat retroativa).
