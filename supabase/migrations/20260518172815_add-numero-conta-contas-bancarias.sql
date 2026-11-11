-- Shim: adiciona numero_conta a contas_bancarias antes de 20260518175808
-- que faz UPDATE SET conta = numero_conta (tabela criada em 20251214170739 sem essa coluna)
ALTER TABLE public.contas_bancarias
ADD COLUMN IF NOT EXISTS numero_conta TEXT;
