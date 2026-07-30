-- 1. negativacoes
ALTER TABLE public.negativacoes ADD COLUMN IF NOT EXISTS protocolo TEXT;

-- 2. protestos
ALTER TABLE public.protestos 
ADD COLUMN IF NOT EXISTS cidade_cartorio TEXT,
ADD COLUMN IF NOT EXISTS estado_cartorio TEXT,
ADD COLUMN IF NOT EXISTS custas NUMERIC DEFAULT 0;

-- 3. regua_cobranca
ALTER TABLE public.regua_cobranca ADD COLUMN IF NOT EXISTS descricao TEXT;

-- 4. contas_receber
ALTER TABLE public.contas_receber ADD COLUMN IF NOT EXISTS cliente_nome TEXT;

-- 5. templates_cobranca
ALTER TABLE public.templates_cobranca ADD COLUMN IF NOT EXISTS provider TEXT;

-- 6. fila_cobrancas
ALTER TABLE public.fila_cobrancas ADD COLUMN IF NOT EXISTS provider TEXT;
