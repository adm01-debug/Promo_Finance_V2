-- SECURITY FIX (parte 3): mais 9 policies RLS soltas encontradas por
-- segunda rodada de verificação adversarial das migrations 20260902130000
-- e 20260902140000.
--
-- Mesma classe de bug (PERMISSIVE, has_role/has_any_role sem empresa_id/
-- empresa_acessivel), nunca dropadas em nenhuma das 559 migrations
-- anteriores, todas com policy irmã *_tenant_rw/*_tenant_write/
-- *_empresa_select já cobrindo o mesmo caso de uso com escopo correto:
--
--   contas_pagar:
--     "Operacional+ podem ver contas_pagar" (SELECT, has_any_role
--       admin/financeiro/operacional) — 20260314213748
--   contas_receber:
--     "Operacional+ podem ver contas_receber" (SELECT, has_any_role
--       admin/financeiro/operacional) — 20260314213748
--     "Operacional+ can insert contas_receber" (INSERT) — 20251214170739
--     "Financeiro+ can update contas_receber" (UPDATE) — 20251214170739
--     "Admin can delete contas_receber" (DELETE) — 20251214170739
--   anomalias_detectadas:
--     "Apenas admin visualiza anomalias" (SELECT, has_role admin) — 20260418144137
--     "Apenas admin atualiza anomalias" (UPDATE, has_role admin) — 20260418144137
--     "Sistema insere anomalias" (INSERT, has_role admin) — 20260418144137
--   parcelas_acordo:
--     "Financeiro+ podem gerenciar parcelas" (ALL, has_any_role
--       admin/financeiro) — 20251224131348
--
-- contas_receber_tenant_rw, contas_receber_empresa_select,
-- anomalias_detectadas_tenant_rw, anomalias_detectadas_empresa_select e
-- parcelas_acordo_tenant_write/empresa_select (ver
-- 20260825230000_initplan_rls_e67.sql) já cobrem os mesmos comandos com
-- empresa_acessivel(empresa_id)/empresa_id IN user_empresas — nenhuma
-- funcionalidade legítima depende das 9 policies removidas aqui.

BEGIN;

DROP POLICY IF EXISTS "Operacional+ podem ver contas_pagar" ON public.contas_pagar;
DROP POLICY IF EXISTS "Operacional+ podem ver contas_receber" ON public.contas_receber;
DROP POLICY IF EXISTS "Operacional+ can insert contas_receber" ON public.contas_receber;
DROP POLICY IF EXISTS "Financeiro+ can update contas_receber" ON public.contas_receber;
DROP POLICY IF EXISTS "Admin can delete contas_receber" ON public.contas_receber;
DROP POLICY IF EXISTS "Apenas admin visualiza anomalias" ON public.anomalias_detectadas;
DROP POLICY IF EXISTS "Apenas admin atualiza anomalias" ON public.anomalias_detectadas;
DROP POLICY IF EXISTS "Sistema insere anomalias" ON public.anomalias_detectadas;
DROP POLICY IF EXISTS "Financeiro+ podem gerenciar parcelas" ON public.parcelas_acordo;

COMMIT;
