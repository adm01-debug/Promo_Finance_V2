-- asaas_audit_trail (via asaas_payments)
DROP POLICY IF EXISTS asaas_audit_admin_select ON public.asaas_audit_trail;
DROP POLICY IF EXISTS asaas_audit_admin_delete ON public.asaas_audit_trail;
CREATE POLICY asaas_audit_tenant_select ON public.asaas_audit_trail
  FOR SELECT TO authenticated
  USING (
    public.has_role((SELECT auth.uid()), 'admin'::app_role)
    AND EXISTS (SELECT 1 FROM public.asaas_payments p
                WHERE p.id = asaas_audit_trail.asaas_payment_id
                  AND public.empresa_acessivel(p.empresa_id))
  );

-- asaas_sync_queue (via asaas_payments)
DROP POLICY IF EXISTS asaas_sync_admin_all ON public.asaas_sync_queue;
CREATE POLICY asaas_sync_tenant_all ON public.asaas_sync_queue
  FOR ALL TO authenticated
  USING (
    public.has_role((SELECT auth.uid()), 'admin'::app_role)
    AND EXISTS (SELECT 1 FROM public.asaas_payments p
                WHERE p.id = asaas_sync_queue.asaas_payment_id
                  AND public.empresa_acessivel(p.empresa_id))
  )
  WITH CHECK (
    public.has_role((SELECT auth.uid()), 'admin'::app_role)
    AND EXISTS (SELECT 1 FROM public.asaas_payments p
                WHERE p.id = asaas_sync_queue.asaas_payment_id
                  AND public.empresa_acessivel(p.empresa_id))
  );

-- historico_conciliacao_ia (via contas_pagar / contas_receber / sessoes_conciliacao)
DROP POLICY IF EXISTS historico_conciliacao_ia_role_select ON public.historico_conciliacao_ia;
CREATE POLICY historico_conciliacao_ia_tenant_select ON public.historico_conciliacao_ia
  FOR SELECT TO authenticated
  USING (
    (public.has_role((SELECT auth.uid()), 'admin'::app_role)
     OR public.has_role((SELECT auth.uid()), 'financeiro'::app_role))
    AND (
      EXISTS (SELECT 1 FROM public.contas_receber cr
              WHERE cr.id = historico_conciliacao_ia.conta_receber_id
                AND public.empresa_acessivel(cr.empresa_id))
      OR EXISTS (SELECT 1 FROM public.contas_pagar cp
              WHERE cp.id = historico_conciliacao_ia.conta_pagar_id
                AND public.empresa_acessivel(cp.empresa_id))
      OR EXISTS (SELECT 1 FROM public.sessoes_conciliacao s
              WHERE s.id = historico_conciliacao_ia.sessao_id
                AND (s.user_id = (SELECT auth.uid()) OR public.empresa_acessivel(s.empresa_id)))
    )
  );

-- parcelas_acordo (via acordos_parcelamento)
DROP POLICY IF EXISTS parcelas_acordo_admin_write ON public.parcelas_acordo;
CREATE POLICY parcelas_acordo_tenant_write ON public.parcelas_acordo
  FOR ALL TO authenticated
  USING (
    (public.has_role((SELECT auth.uid()), 'admin'::app_role)
     OR public.has_role((SELECT auth.uid()), 'financeiro'::app_role))
    AND EXISTS (SELECT 1 FROM public.acordos_parcelamento a
                WHERE a.id = parcelas_acordo.acordo_id
                  AND public.empresa_acessivel(a.empresa_id))
  )
  WITH CHECK (
    (public.has_role((SELECT auth.uid()), 'admin'::app_role)
     OR public.has_role((SELECT auth.uid()), 'financeiro'::app_role))
    AND EXISTS (SELECT 1 FROM public.acordos_parcelamento a
                WHERE a.id = parcelas_acordo.acordo_id
                  AND public.empresa_acessivel(a.empresa_id))
  );

-- regua_cobranca_etapas (via regua_cobranca)
DROP POLICY IF EXISTS "Admins can manage stages" ON public.regua_cobranca_etapas;
CREATE POLICY regua_cobranca_etapas_tenant_write ON public.regua_cobranca_etapas
  FOR ALL TO authenticated
  USING (
    public.has_role((SELECT auth.uid()), 'admin'::app_role)
    AND EXISTS (SELECT 1 FROM public.regua_cobranca r
                WHERE r.id = regua_cobranca_etapas.regua_id
                  AND public.empresa_acessivel(r.empresa_id))
  )
  WITH CHECK (
    public.has_role((SELECT auth.uid()), 'admin'::app_role)
    AND EXISTS (SELECT 1 FROM public.regua_cobranca r
                WHERE r.id = regua_cobranca_etapas.regua_id
                  AND public.empresa_acessivel(r.empresa_id))
  );