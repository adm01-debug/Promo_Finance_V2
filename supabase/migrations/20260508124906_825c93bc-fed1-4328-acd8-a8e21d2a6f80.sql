-- Auditoria de divergências
ALTER TABLE public.divergencias_conciliacao 
ADD COLUMN IF NOT EXISTS resolvido_por UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS resolvido_em TIMESTAMP WITH TIME ZONE;

-- Auditoria de compensações de centavos
ALTER TABLE public.transacoes_bancarias
ADD COLUMN IF NOT EXISTS compensacao_aceita_por UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS compensacao_aceita_em TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Progresso e detalhes de erro para conciliação retroativa
ALTER TABLE public.logs_conciliacao_retroativa
ADD COLUMN IF NOT EXISTS progresso NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS erro_detalhe TEXT;
