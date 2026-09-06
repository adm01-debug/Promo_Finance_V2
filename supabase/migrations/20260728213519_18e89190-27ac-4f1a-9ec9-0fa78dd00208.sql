DO $$
DECLARE
  r record;
  rolexpr text;
BEGIN
  FOR r IN
    SELECT * FROM (VALUES
      ('anomalias_detectadas','Admins can manage anomalias','fin'),
      ('apuracoes_tributarias','apuracoes_tributarias_admin_all','adm'),
      ('asaas_config','asaas_config_admin_all','adm'),
      ('asaas_customers','asaas_customers_admin_all','adm'),
      ('asaas_payments','asaas_payments_admin_all','adm'),
      ('asaas_reconciliation_suggestions','asaas_recon_admin_all','adm'),
      ('asaas_transfers','asaas_transfers_admin_all','adm'),
      ('centros_custo','Admins can manage centros de custo','fin'),
      ('conformidade_snapshots','conformidade_snapshots_admin_all','adm'),
      ('configuracoes_aprovacao','configuracoes_aprovacao_admin_all','adm'),
      ('configuracoes_duplicidade','config_dup_admin_all','adm'),
      ('contas_pagar','Admins can manage contas pagar','fin'),
      ('contas_receber','Admins can manage contas receber','fin'),
      ('darfs','Admins can manage darfs','adm'),
      ('empresas_certificados','cert_admin_all','adm'),
      ('entregas_obrigacoes','entregas_obrigacoes_admin_all','adm'),
      ('fila_cobrancas','Admins can manage queue','adm'),
      ('negativacoes','Admins can manage negativacoes','adm'),
      ('pix_templates','Admins can manage pix','adm'),
      ('protestos','Admins can manage protestos','adm'),
      ('regua_cobranca','Admins can manage regua','adm'),
      ('templates_cobranca','Admins can manage templates','adm'),
      ('prejuizos_fiscais','prejuizos_fiscais_admin_write','adm')
    ) AS v(tbl, pol, kind)
  LOOP
    -- Skip tables that don't exist
    IF NOT EXISTS (
      SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relname = r.tbl
    ) THEN CONTINUE; END IF;
    -- Skip tables that lack empresa_id
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = r.tbl AND column_name = 'empresa_id'
    ) THEN CONTINUE; END IF;

    rolexpr := CASE WHEN r.kind = 'fin'
      THEN '(public.has_role((SELECT auth.uid()), ''admin''::app_role) OR public.has_role((SELECT auth.uid()), ''financeiro''::app_role))'
      ELSE 'public.has_role((SELECT auth.uid()), ''admin''::app_role)' END;

    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.pol, r.tbl);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.tbl || '_tenant_rw', r.tbl);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING (%s AND public.empresa_acessivel(empresa_id)) WITH CHECK (%s AND public.empresa_acessivel(empresa_id))',
      r.tbl || '_tenant_rw', r.tbl, rolexpr, rolexpr);
  END LOOP;
END $$;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'auditoria_tributaria'
  ) THEN
    EXECUTE $pol$DROP POLICY IF EXISTS auditoria_trib_select_admin ON public.auditoria_tributaria$pol$;
    EXECUTE $pol$CREATE POLICY auditoria_trib_select_tenant ON public.auditoria_tributaria
      FOR SELECT TO authenticated
      USING (public.has_role((SELECT auth.uid()), 'admin'::app_role) AND public.empresa_acessivel(empresa_id))$pol$;
  END IF;
END $$;
