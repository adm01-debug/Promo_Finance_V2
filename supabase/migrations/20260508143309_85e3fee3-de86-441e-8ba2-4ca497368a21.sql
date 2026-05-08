ALTER TABLE public.elisao_creditos_auditoria 
ADD COLUMN IF NOT EXISTS score_confianca NUMERIC DEFAULT 100,
ADD COLUMN IF NOT EXISTS divergencias_detectadas JSONB DEFAULT '[]'::jsonb;

-- Comentário para documentar que regra_id já existe e está vinculado via fkey
COMMENT ON COLUMN public.elisao_creditos_auditoria.regra_id IS 'Regra aplicada para o cálculo do crédito';
