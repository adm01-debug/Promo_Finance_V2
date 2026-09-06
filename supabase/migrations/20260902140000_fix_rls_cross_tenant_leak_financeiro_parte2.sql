-- SECURITY FIX (parte 2): mais 4 policies RLS soltas encontradas por
-- verificação adversarial da migration 20260902130000.
--
-- A migration anterior (20260902130000) removeu as policies "Admins can
-- manage X" mais recentes (criadas em 20260825230000), mas contas_pagar e
-- centros_custo tinham policies AINDA MAIS ANTIGAS (20251214170739), nunca
-- dropadas, com o mesmo defeito: PERMISSIVE, sem considerar empresa_id:
--
--   contas_pagar:
--     "Operacional+ can insert contas_pagar" (INSERT, has_any_role admin/
--       financeiro/operacional)
--     "Financeiro+ can update contas_pagar"  (UPDATE, has_any_role admin/
--       financeiro)
--     "Admin can delete contas_pagar"        (DELETE, has_role admin)
--   centros_custo:
--     "Financeiro+ can manage centros_custo" (FOR ALL, has_any_role admin/
--       financeiro)
--
-- Nenhuma delas checa empresa_id/empresa_acessivel. Como PERMISSIVE combina
-- por OR, elas sozinhas já bastam para conceder INSERT/UPDATE/DELETE em
-- contas_pagar e ALL em centros_custo cross-tenant para qualquer usuário
-- com o role certo em QUALQUER empresa — mesma classe de vazamento que a
-- migration anterior corrigiu, só que por policies com nomes diferentes.
--
-- contas_pagar_tenant_rw e centros_custo_tenant_rw (ambas FOR ALL, já
-- exigindo has_role(...) AND empresa_acessivel(empresa_id), ver
-- 20260825230000_initplan_rls_e67.sql) já cobrem os mesmos casos de uso
-- corretamente escopados, então essas 4 policies são apenas removidas.

BEGIN;

DROP POLICY IF EXISTS "Operacional+ can insert contas_pagar" ON public.contas_pagar;
DROP POLICY IF EXISTS "Financeiro+ can update contas_pagar" ON public.contas_pagar;
DROP POLICY IF EXISTS "Admin can delete contas_pagar" ON public.contas_pagar;
DROP POLICY IF EXISTS "Financeiro+ can manage centros_custo" ON public.centros_custo;

COMMIT;

INSERT INTO supabase_migrations.schema_migrations(version,name)
VALUES('20260902140000','fix_rls_cross_tenant_leak_financeiro_parte2')
ON CONFLICT (version) DO NOTHING;
