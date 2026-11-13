CREATE POLICY "alertas_preditivos_select_empresa" ON public.alertas_preditivos AS PERMISSIVE FOR SELECT TO authenticated USING (empresa_acessivel(empresa_id))
