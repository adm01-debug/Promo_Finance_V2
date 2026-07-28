DROP POLICY IF EXISTS acessos_suspeitos_admin_select ON public.acessos_suspeitos;

CREATE POLICY acessos_suspeitos_tenant_select
ON public.acessos_suspeitos
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  AND (
    empresa_id IS NULL
    OR public.empresa_acessivel(empresa_id)
  )
);