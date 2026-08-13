-- ============================================================================
-- Gap #34 (complemento) — asaas_audit_trail: remover mutabilidade da evidência
-- ----------------------------------------------------------------------------
-- A policy `asaas_audit_admin_all` era `FOR ALL`, o que inclui UPDATE. Mesmo
-- restrita a admin, isso permite REESCREVER um registro de auditoria de
-- pagamento silenciosamente — o pior modo de falha de uma trilha, porque o
-- resultado é indistinguível de um histórico legítimo. DELETE é mantido (o
-- expurgo é visível: a linha some), UPDATE é eliminado.
-- ============================================================================

DROP POLICY IF EXISTS "asaas_audit_admin_all" ON public.asaas_audit_trail;

CREATE POLICY "asaas_audit_admin_select"
  ON public.asaas_audit_trail FOR SELECT TO authenticated
  USING (public.has_role((SELECT auth.uid()), 'admin'::app_role));

CREATE POLICY "asaas_audit_admin_delete"
  ON public.asaas_audit_trail FOR DELETE TO authenticated
  USING (public.has_role((SELECT auth.uid()), 'admin'::app_role));

REVOKE UPDATE ON public.asaas_audit_trail FROM authenticated;

-- Gravação da trilha é feita pelo backend (service_role ignora RLS).
GRANT ALL ON public.asaas_audit_trail TO service_role;