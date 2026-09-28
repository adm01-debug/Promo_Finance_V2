-- Shim batch: adiciona empresa_id às tabelas que precisam antes de 20260619145930
-- que cria policies referenciando empresa_id nessas tabelas (42703)
-- historico_score_saude criada em 20251220134032 sem empresa_id
-- recomendacoes_metas_ia, alertas_preditivos, anomalias_detectadas, prejuizos_fiscais
-- também criadas sem empresa_id e precisam da coluna para as policies da 20260619145930
-- (20260619145929b_ não funciona: Supabase só reconhece versões puramente numéricas)
ALTER TABLE public.historico_score_saude
ADD COLUMN IF NOT EXISTS empresa_id UUID;

ALTER TABLE public.recomendacoes_metas_ia
ADD COLUMN IF NOT EXISTS empresa_id UUID;

ALTER TABLE public.alertas_preditivos
ADD COLUMN IF NOT EXISTS empresa_id UUID;

ALTER TABLE public.anomalias_detectadas
ADD COLUMN IF NOT EXISTS empresa_id UUID;

ALTER TABLE public.prejuizos_fiscais
ADD COLUMN IF NOT EXISTS empresa_id UUID;
