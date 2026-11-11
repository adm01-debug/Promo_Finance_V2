-- Shim: adiciona empresa_id a historico_analises_preditivas antes de 20260619150341
-- que cria POLICY "historico_analises_preditivas_empresa_select" referenciando empresa_id (42703)
-- tabela já tem user_id (adicionado em 20260518172818) mas não empresa_id
ALTER TABLE public.historico_analises_preditivas
ADD COLUMN IF NOT EXISTS empresa_id UUID;
