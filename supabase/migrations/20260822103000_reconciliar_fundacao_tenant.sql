-- Reconciliação do banco canônico: helper de escopo multiempresa ausente.
-- Idempotente; pode ser aplicado em ambientes que já tenham a função.
CREATE OR REPLACE FUNCTION public.empresa_acessivel(_empresa_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT _empresa_id IS NOT NULL AND (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1
      FROM public.user_empresas ue
      WHERE ue.empresa_id = _empresa_id
        AND ue.user_id = auth.uid()
        AND COALESCE(ue.ativo, true)
    )
  )
$$;

REVOKE ALL ON FUNCTION public.empresa_acessivel(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.empresa_acessivel(uuid) TO authenticated, service_role;

NOTIFY pgrst, 'reload schema';
