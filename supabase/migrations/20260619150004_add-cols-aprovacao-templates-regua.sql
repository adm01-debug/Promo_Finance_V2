-- Shim batch: adiciona colunas antes de 20260619150512
-- que cria policies referenciando user_id (aprovacao_comentarios),
-- empresa_id (templates_cobranca) e regua_id (regua_cobranca_etapas) (42703)
ALTER TABLE public.aprovacao_comentarios
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

ALTER TABLE public.templates_cobranca
ADD COLUMN IF NOT EXISTS empresa_id UUID;

ALTER TABLE public.regua_cobranca_etapas
ADD COLUMN IF NOT EXISTS regua_id UUID REFERENCES public.regua_cobranca(id);
