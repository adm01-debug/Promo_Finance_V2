-- Adiciona colunas e FKs faltantes em public.contratos
-- Necessário para os embeds cliente:clientes(...) e fornecedor:fornecedores(...)

ALTER TABLE public.contratos
  ADD COLUMN IF NOT EXISTS cliente_id uuid,
  ADD COLUMN IF NOT EXISTS fornecedor_id uuid,
  ADD COLUMN IF NOT EXISTS created_by uuid,
  ADD COLUMN IF NOT EXISTS observacoes text,
  ADD COLUMN IF NOT EXISTS dias_aviso_renovacao integer;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'contratos_cliente_id_fkey'
  ) THEN
    ALTER TABLE public.contratos
      ADD CONSTRAINT contratos_cliente_id_fkey
      FOREIGN KEY (cliente_id) REFERENCES public.clientes(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'contratos_fornecedor_id_fkey'
  ) THEN
    ALTER TABLE public.contratos
      ADD CONSTRAINT contratos_fornecedor_id_fkey
      FOREIGN KEY (fornecedor_id) REFERENCES public.fornecedores(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_contratos_cliente ON public.contratos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_contratos_fornecedor ON public.contratos(fornecedor_id);

NOTIFY pgrst, 'reload schema';
