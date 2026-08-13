-- Update solicitacoes_aprovacao
ALTER TABLE public.solicitacoes_aprovacao 
ADD COLUMN IF NOT EXISTS solicitado_em TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Update creditos_tributarios
ALTER TABLE public.creditos_tributarios 
ADD COLUMN IF NOT EXISTS valor_utilizado NUMERIC DEFAULT 0;

-- Update profiles to ensure email is present (some queries use it)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email TEXT;

-- Add index to solicitacoes_aprovacao for common queries
CREATE INDEX IF NOT EXISTS idx_solicitacoes_aprovacao_conta_pagar 
ON public.solicitacoes_aprovacao(conta_pagar_id);