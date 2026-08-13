-- 1. Fix budgets: make legacy columns optional (already done in previous attempt, but repeating to be safe)
ALTER TABLE public.budgets ALTER COLUMN nome DROP NOT NULL;
ALTER TABLE public.budgets ALTER COLUMN periodo_inicio DROP NOT NULL;
ALTER TABLE public.budgets ALTER COLUMN periodo_fim DROP NOT NULL;
ALTER TABLE public.budgets ALTER COLUMN valor_total DROP NOT NULL;

-- 2. Fix contas_bancarias: make nome optional
ALTER TABLE public.contas_bancarias ALTER COLUMN nome DROP NOT NULL;

-- 3. Fix solicitacoes_aprovacao
ALTER TABLE public.solicitacoes_aprovacao ALTER COLUMN entidade_tipo DROP NOT NULL;
ALTER TABLE public.solicitacoes_aprovacao ALTER COLUMN entidade_tipo SET DEFAULT 'conta_pagar';

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'solicitacoes_aprovacao' AND column_name = 'solicitado_por') THEN
        ALTER TABLE public.solicitacoes_aprovacao ADD COLUMN solicitado_por UUID REFERENCES auth.users(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'solicitacoes_aprovacao' AND column_name = 'observacoes') THEN
        ALTER TABLE public.solicitacoes_aprovacao ADD COLUMN observacoes TEXT;
    END IF;
END $$;

-- 4. Fix transferencias
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transferencias' AND column_name = 'tipo') THEN
        ALTER TABLE public.transferencias ADD COLUMN tipo TEXT;
    END IF;
END $$;

-- 5. Fix login_attempts
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'login_attempts' AND column_name = 'user_email') THEN
        ALTER TABLE public.login_attempts ADD COLUMN user_email TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'login_attempts' AND column_name = 'blocked_reason') THEN
        ALTER TABLE public.login_attempts ADD COLUMN blocked_reason TEXT;
    END IF;
END $$;

-- 6. Fix bitrix_sync_logs
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bitrix_sync_logs' AND column_name = 'mensagem_erro') THEN
        ALTER TABLE public.bitrix_sync_logs ADD COLUMN mensagem_erro TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bitrix_sync_logs' AND column_name = 'iniciado_em') THEN
        ALTER TABLE public.bitrix_sync_logs ADD COLUMN iniciado_em TIMESTAMP WITH TIME ZONE DEFAULT now();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bitrix_sync_logs' AND column_name = 'finalizado_em') THEN
        ALTER TABLE public.bitrix_sync_logs ADD COLUMN finalizado_em TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- 7. Fix bitrix_field_mappings
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bitrix_field_mappings' AND column_name = 'entidade') THEN
        ALTER TABLE public.bitrix_field_mappings ADD COLUMN entidade TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bitrix_field_mappings' AND column_name = 'campo_bitrix') THEN
        ALTER TABLE public.bitrix_field_mappings ADD COLUMN campo_bitrix TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bitrix_field_mappings' AND column_name = 'campo_sistema') THEN
        ALTER TABLE public.bitrix_field_mappings ADD COLUMN campo_sistema TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bitrix_field_mappings' AND column_name = 'ativo') THEN
        ALTER TABLE public.bitrix_field_mappings ADD COLUMN ativo BOOLEAN DEFAULT true;
    END IF;
END $$;

-- 8. Fix boletos
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'boletos' AND column_name = 'cedente_cnpj') THEN
        ALTER TABLE public.boletos ADD COLUMN cedente_cnpj TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'boletos' AND column_name = 'banco') THEN
        ALTER TABLE public.boletos ADD COLUMN banco TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'boletos' AND column_name = 'agencia') THEN
        ALTER TABLE public.boletos ADD COLUMN agencia TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'boletos' AND column_name = 'conta') THEN
        ALTER TABLE public.boletos ADD COLUMN conta TEXT;
    END IF;
END $$;

-- 9. Fix profiles
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'full_name') THEN
        ALTER TABLE public.profiles ADD COLUMN full_name TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'email') THEN
        ALTER TABLE public.profiles ADD COLUMN email TEXT;
    END IF;
END $$;
