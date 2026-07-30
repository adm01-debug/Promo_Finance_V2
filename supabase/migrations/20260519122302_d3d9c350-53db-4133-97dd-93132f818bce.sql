-- 1. Bitrix Sync Logs: fix detalhes type
ALTER TABLE public.bitrix_sync_logs ALTER COLUMN detalhes TYPE JSONB USING detalhes::JSONB;

-- 2. Boletos: add missing columns and fix types
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'boletos' AND column_name = 'descricao') THEN
        ALTER TABLE public.boletos ADD COLUMN descricao TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'boletos' AND column_name = 'observacoes') THEN
        ALTER TABLE public.boletos ADD COLUMN observacoes TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'boletos' AND column_name = 'conta_pagar_id') THEN
        ALTER TABLE public.boletos ADD COLUMN conta_pagar_id UUID REFERENCES public.contas_pagar(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'boletos' AND column_name = 'conta_bancaria_id') THEN
        ALTER TABLE public.boletos ADD COLUMN conta_bancaria_id UUID REFERENCES public.contas_bancarias(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'boletos' AND column_name = 'created_by') THEN
        ALTER TABLE public.boletos ADD COLUMN created_by UUID REFERENCES auth.users(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'boletos' AND column_name = 'bitrix_id') THEN
        ALTER TABLE public.boletos ADD COLUMN bitrix_id TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'boletos' AND column_name = 'bitrix_status') THEN
        ALTER TABLE public.boletos ADD COLUMN bitrix_status TEXT;
    END IF;
END $$;

ALTER TABLE public.boletos ALTER COLUMN rastreio_status TYPE JSONB USING (CASE WHEN rastreio_status IS NULL THEN '[]'::JSONB ELSE rastreio_status::JSONB END);
ALTER TABLE public.boletos ALTER COLUMN rastreio_status SET DEFAULT '[]'::JSONB;

-- 3. Categorias: add plano_conta_id
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'categorias' AND column_name = 'plano_conta_id') THEN
        ALTER TABLE public.categorias ADD COLUMN plano_conta_id UUID REFERENCES public.plano_contas(id);
    END IF;
END $$;

-- 4. Create regua_cobranca_status if missing (used in useCobrancas.ts)
CREATE TABLE IF NOT EXISTS public.regua_cobranca_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID REFERENCES public.empresas(id),
    conta_receber_id UUID REFERENCES public.contas_receber(id),
    etapa_atual TEXT,
    status_cobranca TEXT,
    data_ultima_acao TIMESTAMP WITH TIME ZONE DEFAULT now(),
    proxima_acao_data DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5. Add full_name and email to profiles (used in joins)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'full_name') THEN
        ALTER TABLE public.profiles ADD COLUMN full_name TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'email') THEN
        ALTER TABLE public.profiles ADD COLUMN email TEXT;
    END IF;
END $$;
