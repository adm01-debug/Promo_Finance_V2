-- Impede categorias duplicadas (mesma empresa + tipo + nome, ignorando
-- maiúsculas/minúsculas e espaços nas pontas).
CREATE UNIQUE INDEX IF NOT EXISTS categorias_empresa_tipo_nome_uq
  ON public.categorias (empresa_id, tipo, lower(btrim(nome)));
