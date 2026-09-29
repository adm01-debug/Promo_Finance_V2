-- Shim: adiciona user_id à feedback_conciliacao_ia antes da migration 20260518171949
-- que cria policy referenciando essa coluna (tabela criada em 20251220014622 sem user_id)
ALTER TABLE public.feedback_conciliacao_ia
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
