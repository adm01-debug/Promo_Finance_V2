REVOKE ALL ON public.catalogos_tributarios_health_history FROM anon;
GRANT SELECT ON public.catalogos_tributarios_health_history TO authenticated;
GRANT ALL ON public.catalogos_tributarios_health_history TO service_role;