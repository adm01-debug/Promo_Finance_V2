-- 1) Garantir que administradores atuais fiquem vinculados às empresas existentes
INSERT INTO public.user_empresas (user_id, empresa_id, role, is_default, provisioned_via, ativo)
SELECT ur.user_id, e.id, 'admin', false, 'manual', true
FROM public.user_roles ur
CROSS JOIN public.empresas e
WHERE ur.role = 'admin'
ON CONFLICT (user_id, empresa_id) DO NOTHING;

-- 2) Remover o bypass global de admin do helper de tenant
CREATE OR REPLACE FUNCTION public.empresa_acessivel(_empresa_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT _empresa_id IS NOT NULL
     AND EXISTS (
       SELECT 1 FROM public.user_empresas ue
       WHERE ue.empresa_id = _empresa_id
         AND ue.user_id = (SELECT auth.uid())
         AND COALESCE(ue.ativo, true)
     )
$function$;

-- 3) Coluna empresa_id nas tabelas raiz do domínio operacional
ALTER TABLE public.lalamove_orders     ADD COLUMN IF NOT EXISTS empresa_id uuid REFERENCES public.empresas(id) ON DELETE RESTRICT;
ALTER TABLE public.drivers             ADD COLUMN IF NOT EXISTS empresa_id uuid REFERENCES public.empresas(id) ON DELETE RESTRICT;
ALTER TABLE public.alerts              ADD COLUMN IF NOT EXISTS empresa_id uuid REFERENCES public.empresas(id) ON DELETE RESTRICT;
ALTER TABLE public.alert_configurations ADD COLUMN IF NOT EXISTS empresa_id uuid REFERENCES public.empresas(id) ON DELETE RESTRICT;
ALTER TABLE public.risk_rules          ADD COLUMN IF NOT EXISTS empresa_id uuid REFERENCES public.empresas(id) ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS idx_lalamove_orders_empresa ON public.lalamove_orders(empresa_id);
CREATE INDEX IF NOT EXISTS idx_drivers_empresa ON public.drivers(empresa_id);
CREATE INDEX IF NOT EXISTS idx_alerts_empresa ON public.alerts(empresa_id);
CREATE INDEX IF NOT EXISTS idx_alert_configurations_empresa ON public.alert_configurations(empresa_id);
CREATE INDEX IF NOT EXISTS idx_risk_rules_empresa ON public.risk_rules(empresa_id);

-- 4) Preenchimento automático da empresa do usuário
CREATE OR REPLACE FUNCTION public.set_empresa_id_default()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_empresa uuid;
BEGIN
  IF NEW.empresa_id IS NOT NULL THEN
    RETURN NEW;
  END IF;
  SELECT ue.empresa_id INTO v_empresa
  FROM public.user_empresas ue
  WHERE ue.user_id = auth.uid() AND COALESCE(ue.ativo, true)
  ORDER BY ue.is_default DESC NULLS LAST, ue.created_at
  LIMIT 1;

  IF v_empresa IS NULL THEN
    SELECT e.id INTO v_empresa FROM public.empresas e ORDER BY e.created_at LIMIT 1;
  END IF;

  NEW.empresa_id := v_empresa;
  RETURN NEW;
END;
$function$;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['lalamove_orders','drivers','alerts','alert_configurations','risk_rules'] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_%I_set_empresa ON public.%I', t, t);
    EXECUTE format('CREATE TRIGGER trg_%I_set_empresa BEFORE INSERT ON public.%I FOR EACH ROW EXECUTE FUNCTION public.set_empresa_id_default()', t, t);
    EXECUTE format('UPDATE public.%I SET empresa_id = (SELECT id FROM public.empresas ORDER BY created_at LIMIT 1) WHERE empresa_id IS NULL AND (SELECT count(*) FROM public.empresas) = 1', t);
  END LOOP;
END $$;

-- 5) Recriar policies com escopo de tenant (remove overrides globais por papel)
DO $$
DECLARE r record; t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'lalamove_orders','drivers','alerts','alert_configurations','risk_rules',
    'lalamove_stops','lalamove_status_history','active_tracking','driver_locations',
    'driver_incidents','driver_evaluations','driver_approval_queue','tracking_events',
    'alerts_sent','bitrix24_sync'
  ] LOOP
    FOR r IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename=t LOOP
      EXECUTE format('DROP POLICY %I ON public.%I', r.policyname, t);
    END LOOP;
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
  END LOOP;
END $$;

-- Raiz: acesso somente para membros ativos da empresa
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['lalamove_orders','drivers','alerts','alert_configurations','risk_rules'] LOOP
    EXECUTE format($f$
      CREATE POLICY %1$s_tenant_select ON public.%1$I FOR SELECT TO authenticated
        USING (public.empresa_membro_ativo(empresa_id));
      CREATE POLICY %1$s_tenant_insert ON public.%1$I FOR INSERT TO authenticated
        WITH CHECK (public.empresa_membro_ativo(empresa_id)
          AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager') OR public.has_role(auth.uid(),'operator')));
      CREATE POLICY %1$s_tenant_update ON public.%1$I FOR UPDATE TO authenticated
        USING (public.empresa_membro_ativo(empresa_id)
          AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager') OR public.has_role(auth.uid(),'operator')))
        WITH CHECK (public.empresa_membro_ativo(empresa_id));
      CREATE POLICY %1$s_tenant_delete ON public.%1$I FOR DELETE TO authenticated
        USING (public.empresa_membro_ativo(empresa_id)
          AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager')));
    $f$, t);
  END LOOP;
END $$;

-- Filhos: herdam o escopo do registro-pai
DO $$
DECLARE
  spec text[][] := ARRAY[
    ARRAY['lalamove_stops','EXISTS (SELECT 1 FROM public.lalamove_orders o WHERE o.id = order_id AND public.empresa_membro_ativo(o.empresa_id))'],
    ARRAY['lalamove_status_history','EXISTS (SELECT 1 FROM public.lalamove_orders o WHERE o.id = order_id AND public.empresa_membro_ativo(o.empresa_id))'],
    ARRAY['bitrix24_sync','EXISTS (SELECT 1 FROM public.lalamove_orders o WHERE o.id = order_id AND public.empresa_membro_ativo(o.empresa_id))'],
    ARRAY['active_tracking','EXISTS (SELECT 1 FROM public.lalamove_orders o WHERE o.id = order_id AND public.empresa_membro_ativo(o.empresa_id))'],
    ARRAY['tracking_events','EXISTS (SELECT 1 FROM public.lalamove_orders o WHERE o.id = order_id AND public.empresa_membro_ativo(o.empresa_id))'],
    ARRAY['driver_locations','EXISTS (SELECT 1 FROM public.active_tracking a JOIN public.lalamove_orders o ON o.id = a.order_id WHERE a.id = tracking_id AND public.empresa_membro_ativo(o.empresa_id))'],
    ARRAY['driver_incidents','EXISTS (SELECT 1 FROM public.drivers d WHERE d.id = driver_id AND public.empresa_membro_ativo(d.empresa_id))'],
    ARRAY['driver_evaluations','EXISTS (SELECT 1 FROM public.drivers d WHERE d.id = driver_id AND public.empresa_membro_ativo(d.empresa_id))'],
    ARRAY['driver_approval_queue','EXISTS (SELECT 1 FROM public.drivers d WHERE d.id = driver_id AND public.empresa_membro_ativo(d.empresa_id))'],
    ARRAY['alerts_sent','EXISTS (SELECT 1 FROM public.alerts a WHERE a.id = alert_id AND public.empresa_membro_ativo(a.empresa_id))']
  ];
  i int;
BEGIN
  FOR i IN 1 .. array_length(spec,1) LOOP
    EXECUTE format($f$
      CREATE POLICY %1$s_tenant_select ON public.%1$I FOR SELECT TO authenticated USING (%2$s);
      CREATE POLICY %1$s_tenant_insert ON public.%1$I FOR INSERT TO authenticated WITH CHECK (%2$s);
      CREATE POLICY %1$s_tenant_update ON public.%1$I FOR UPDATE TO authenticated USING (%2$s) WITH CHECK (%2$s);
      CREATE POLICY %1$s_tenant_delete ON public.%1$I FOR DELETE TO authenticated
        USING ((%2$s) AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager')));
    $f$, spec[i][1], spec[i][2]);
  END LOOP;
END $$;
