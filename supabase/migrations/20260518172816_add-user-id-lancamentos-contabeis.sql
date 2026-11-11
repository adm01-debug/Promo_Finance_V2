-- Shim: adiciona user_id a lancamentos_contabeis antes de 20260518175808
-- que cria policy "Owner manage lancamentos" referenciando user_id
-- (tabela criada em 20260421123700 sem essa coluna)
ALTER TABLE public.lancamentos_contabeis
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
