-- Step 19: Policy SELECT em estrategias_elisao_catalogo
-- Tabela tinha RLS habilitado mas zero policies (acesso bloqueado para authenticated)
CREATE POLICY estrategias_elisao_catalogo_select
  ON public.estrategias_elisao_catalogo
  FOR SELECT
  TO authenticated
  USING (true);
