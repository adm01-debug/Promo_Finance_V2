-- Shim: adiciona colunas faltantes antes de 20260519122034
-- que faz ALTER COLUMN ... DROP NOT NULL em colunas inexistentes (42703)
ALTER TABLE public.budgets
ADD COLUMN IF NOT EXISTS nome TEXT,
ADD COLUMN IF NOT EXISTS periodo_inicio DATE,
ADD COLUMN IF NOT EXISTS periodo_fim DATE,
ADD COLUMN IF NOT EXISTS valor_total NUMERIC;

ALTER TABLE public.contas_bancarias
ADD COLUMN IF NOT EXISTS nome TEXT;
