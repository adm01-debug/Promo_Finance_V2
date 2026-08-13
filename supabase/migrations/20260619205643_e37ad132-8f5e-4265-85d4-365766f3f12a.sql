
-- CLIENTES
DROP POLICY IF EXISTS clientes_grupo_select ON public.clientes;
CREATE POLICY clientes_grupo_select ON public.clientes
  FOR SELECT TO authenticated
  USING (
    empresa_id IS NOT NULL AND empresa_id IN (
      SELECT empresa_id FROM public.user_empresas
      WHERE user_id = auth.uid() AND ativo = true
    )
  );

DROP POLICY IF EXISTS clientes_grupo_update ON public.clientes;
CREATE POLICY clientes_grupo_update ON public.clientes
  FOR UPDATE TO authenticated
  USING (
    empresa_id IS NOT NULL AND empresa_id IN (
      SELECT empresa_id FROM public.user_empresas
      WHERE user_id = auth.uid() AND ativo = true
    )
  )
  WITH CHECK (
    empresa_id IS NULL
    OR empresa_id IN (
      SELECT empresa_id FROM public.user_empresas
      WHERE user_id = auth.uid() AND ativo = true
    )
  );

-- BOLETOS
DROP POLICY IF EXISTS boletos_grupo_select ON public.boletos;
CREATE POLICY boletos_grupo_select ON public.boletos
  FOR SELECT TO authenticated
  USING (
    empresa_id IS NOT NULL AND empresa_id IN (
      SELECT empresa_id FROM public.user_empresas
      WHERE user_id = auth.uid() AND ativo = true
    )
  );
