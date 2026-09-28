-- Shim: adiciona user_id à historico_analises_preditivas antes de migration 20260518172812
-- que cria policy "hap_user_insert" referenciando essa coluna (tabela criada sem user_id em 20251220134032)
ALTER TABLE public.historico_analises_preditivas
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
