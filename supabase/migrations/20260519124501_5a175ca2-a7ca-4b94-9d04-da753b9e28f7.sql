-- Update verificacoes_conformidade
ALTER TABLE public.verificacoes_conformidade 
ADD COLUMN IF NOT EXISTS periodo TEXT,
ADD COLUMN IF NOT EXISTS nivel TEXT,
ADD COLUMN IF NOT EXISTS total_checks INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS checks_aprovados INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS itens JSONB DEFAULT '[]'::jsonb;

-- Update solicitacoes_aprovacao
ALTER TABLE public.solicitacoes_aprovacao 
ADD COLUMN IF NOT EXISTS aprovado_em TIMESTAMP WITH TIME ZONE;

-- Add index for performance on compliance checks
CREATE INDEX IF NOT EXISTS idx_verificacoes_conformidade_empresa_periodo 
ON public.verificacoes_conformidade(empresa_id, periodo);