-- Transferências: normalização aditiva do drift + movimentação bilateral
-- 1) transferencias: colunas canônicas aditivas
ALTER TABLE public.transferencias
  ADD COLUMN IF NOT EXISTS conta_origem_id UUID REFERENCES public.contas_bancarias(id);
ALTER TABLE public.transferencias
  ADD COLUMN IF NOT EXISTS movimentacao_id UUID;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'transferencias'
      AND column_name = 'conta_bancaria_id'
  ) THEN
    UPDATE public.transferencias
      SET conta_origem_id = conta_bancaria_id
      WHERE conta_origem_id IS NULL;
  END IF;
END $$;

-- 2) movimentacoes: colunas que o fluxo de transferência precisa
ALTER TABLE public.movimentacoes
  ADD COLUMN IF NOT EXISTS conta_bancaria_id UUID REFERENCES public.contas_bancarias(id);
ALTER TABLE public.movimentacoes
  ADD COLUMN IF NOT EXISTS transferencia_id UUID;
ALTER TABLE public.movimentacoes
  ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE public.movimentacoes
  ADD COLUMN IF NOT EXISTS origem TEXT DEFAULT 'manual';
