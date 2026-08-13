-- Adicionar colunas necessárias para o hook de validação de auth se não existirem
ALTER TABLE public.login_attempts 
ADD COLUMN IF NOT EXISTS attempt_count INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS first_attempt_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN IF NOT EXISTS last_attempt_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN IF NOT EXISTS blocked_reason TEXT,
ADD COLUMN IF NOT EXISTS block_reason TEXT; -- Alias para compatibilidade caso necessário
