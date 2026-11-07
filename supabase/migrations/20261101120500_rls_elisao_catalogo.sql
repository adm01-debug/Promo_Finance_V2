-- Step 19: RLS em elisao_catalogo
-- Verificado: tabela elisao_catalogo NÃO EXISTE no banco (bwwbeyolnnzppeuhgkcd).
-- Step pulado: "Se a tabela não existir, registre isso na PR e pule o step."

-- Quando/se a tabela for criada, aplicar:
/*
ALTER TABLE elisao_catalogo ENABLE ROW LEVEL SECURITY;

CREATE POLICY elisao_leitura_autenticados ON elisao_catalogo
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY elisao_escrita_admin ON elisao_catalogo
  FOR ALL TO authenticated
  USING (has_role('admin_global') OR has_role('admin'))
  WITH CHECK (has_role('admin_global') OR has_role('admin'));
*/
