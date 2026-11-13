DROP POLICY IF EXISTS "asaas_config_select" ON public.asaas_config

DROP POLICY IF EXISTS "asaas_config_insert" ON public.asaas_config

DROP POLICY IF EXISTS "asaas_config_update" ON public.asaas_config

DROP POLICY IF EXISTS "asaas_config_delete" ON public.asaas_config

CREATE POLICY "asaas_config_select_financeiro" ON public.asaas_config AS PERMISSIVE FOR SELECT TO authenticated USING (empresa_acessivel(empresa_id) AND EXISTS (SELECT 1 FROM public.user_empresas ue WHERE ue.user_id = (SELECT auth.uid()) AND ue.empresa_id = asaas_config.empresa_id AND ue.ativo = true AND ue.role IN ('admin', 'financeiro', 'contador')))

CREATE POLICY "asaas_config_insert_admin" ON public.asaas_config AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (empresa_acessivel(empresa_id) AND EXISTS (SELECT 1 FROM public.user_empresas ue WHERE ue.user_id = (SELECT auth.uid()) AND ue.empresa_id = asaas_config.empresa_id AND ue.ativo = true AND ue.role IN ('admin', 'financeiro')))

CREATE POLICY "asaas_config_update_admin" ON public.asaas_config AS PERMISSIVE FOR UPDATE TO authenticated USING (empresa_acessivel(empresa_id) AND EXISTS (SELECT 1 FROM public.user_empresas ue WHERE ue.user_id = (SELECT auth.uid()) AND ue.empresa_id = asaas_config.empresa_id AND ue.ativo = true AND ue.role IN ('admin', 'financeiro'))) WITH CHECK (empresa_acessivel(empresa_id) AND EXISTS (SELECT 1 FROM public.user_empresas ue WHERE ue.user_id = (SELECT auth.uid()) AND ue.empresa_id = asaas_config.empresa_id AND ue.ativo = true AND ue.role IN ('admin', 'financeiro')))

CREATE POLICY "asaas_config_delete_admin" ON public.asaas_config AS PERMISSIVE FOR DELETE TO authenticated USING (empresa_acessivel(empresa_id) AND EXISTS (SELECT 1 FROM public.user_empresas ue WHERE ue.user_id = (SELECT auth.uid()) AND ue.empresa_id = asaas_config.empresa_id AND ue.ativo = true AND ue.role = 'admin'))
