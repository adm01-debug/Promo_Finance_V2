-- Shim: adiciona user_id a logs_conciliacao_retroativa antes de 20260518172859
-- que cria policy referenciando user_id (tabela criada em 20260508115859 sem essa coluna)
ALTER TABLE public.logs_conciliacao_retroativa
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
