DO $$
DECLARE r record;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='bitrix24_activities')
     OR NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='lalamove_orders') THEN
    RETURN;
  END IF;

  FOR r IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='bitrix24_activities' LOOP
    EXECUTE format('DROP POLICY %I ON public.bitrix24_activities', r.policyname);
  END LOOP;

  EXECUTE 'ALTER TABLE public.bitrix24_activities ENABLE ROW LEVEL SECURITY';

  EXECUTE $p$
    CREATE POLICY bitrix24_activities_tenant_select ON public.bitrix24_activities FOR SELECT TO authenticated
      USING (EXISTS (SELECT 1 FROM public.lalamove_orders o WHERE o.id = order_id AND public.empresa_membro_ativo(o.empresa_id)));
    CREATE POLICY bitrix24_activities_tenant_insert ON public.bitrix24_activities FOR INSERT TO authenticated
      WITH CHECK (EXISTS (SELECT 1 FROM public.lalamove_orders o WHERE o.id = order_id AND public.empresa_membro_ativo(o.empresa_id)));
    CREATE POLICY bitrix24_activities_tenant_update ON public.bitrix24_activities FOR UPDATE TO authenticated
      USING (EXISTS (SELECT 1 FROM public.lalamove_orders o WHERE o.id = order_id AND public.empresa_membro_ativo(o.empresa_id)))
      WITH CHECK (EXISTS (SELECT 1 FROM public.lalamove_orders o WHERE o.id = order_id AND public.empresa_membro_ativo(o.empresa_id)));
    CREATE POLICY bitrix24_activities_tenant_delete ON public.bitrix24_activities FOR DELETE TO authenticated
      USING (EXISTS (SELECT 1 FROM public.lalamove_orders o WHERE o.id = order_id AND public.empresa_membro_ativo(o.empresa_id))
             AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager')));
  $p$;
END $$;
