-- contas_bancarias
ALTER TABLE public.contas_bancarias
  ADD COLUMN IF NOT EXISTS saldo_atual numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS conta text,
  ADD COLUMN IF NOT EXISTS tipo_conta text DEFAULT 'corrente',
  ADD COLUMN IF NOT EXISTS codigo_banco text DEFAULT '000';

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='contas_bancarias' AND column_name='saldo_disponivel') THEN
    EXECUTE 'ALTER TABLE public.contas_bancarias ADD COLUMN saldo_disponivel numeric GENERATED ALWAYS AS (saldo_atual) STORED';
  END IF;
END $$;

-- Guard: 42703 — numero_conta may not exist on preview branch
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='contas_bancarias' AND column_name='numero_conta') THEN
    UPDATE public.contas_bancarias SET conta = numero_conta WHERE conta IS NULL AND numero_conta IS NOT NULL;
  END IF;
END $$;

-- fila_cobrancas
ALTER TABLE public.fila_cobrancas
  ADD COLUMN IF NOT EXISTS cliente_nome text,
  ADD COLUMN IF NOT EXISTS etapa text,
  ADD COLUMN IF NOT EXISTS canal text,
  ADD COLUMN IF NOT EXISTS destinatario text,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'pendente',
  ADD COLUMN IF NOT EXISTS provider text;

-- regras_conciliacao
ALTER TABLE public.regras_conciliacao
  ADD COLUMN IF NOT EXISTS padrao_descricao text;

-- sessoes_conciliacao
CREATE TABLE IF NOT EXISTS public.sessoes_conciliacao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  empresa_id uuid,
  status text NOT NULL DEFAULT 'aberta',
  periodo_inicio date,
  periodo_fim date,
  total_conciliados integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.sessoes_conciliacao ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='sessoes_conciliacao' AND policyname='Owner manage sessoes') THEN
    CREATE POLICY "Owner manage sessoes" ON public.sessoes_conciliacao FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- lancamentos_contabeis
CREATE TABLE IF NOT EXISTS public.lancamentos_contabeis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  empresa_id uuid,
  numero_lancamento bigint,
  data_lancamento date NOT NULL DEFAULT CURRENT_DATE,
  historico text,
  origem text,
  valor_total numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'ativo',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.lancamentos_contabeis ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='lancamentos_contabeis' AND policyname='Owner manage lancamentos') THEN
    CREATE POLICY "Owner manage lancamentos" ON public.lancamentos_contabeis FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- login_attempts
ALTER TABLE public.login_attempts
  ADD COLUMN IF NOT EXISTS user_email text,
  ADD COLUMN IF NOT EXISTS success boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS blocked_reason text;
-- Guard: 42703 — email column may not exist on login_attempts on preview branch
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='login_attempts' AND column_name='email') THEN
    UPDATE public.login_attempts SET user_email = email WHERE user_email IS NULL AND email IS NOT NULL;
  END IF;
END $$;