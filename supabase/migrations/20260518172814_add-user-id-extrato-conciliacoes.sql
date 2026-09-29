-- Shim: adiciona user_id a extrato_bancario e conciliacoes antes de 20260518173107
-- que cria policies referenciando user_id (tabelas criadas em 20260317000749 sem essa coluna)
ALTER TABLE public.extrato_bancario
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

ALTER TABLE public.conciliacoes
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
