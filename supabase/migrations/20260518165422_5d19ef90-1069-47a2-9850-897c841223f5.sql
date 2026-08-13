
-- ============ ANOMALIAS ============
ALTER TABLE public.anomalias_detectadas
  ADD COLUMN IF NOT EXISTS dados jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS detectada_em timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS resolvida_em timestamptz,
  ADD COLUMN IF NOT EXISTS resolvida_por uuid,
  ADD COLUMN IF NOT EXISTS observacoes text,
  ADD COLUMN IF NOT EXISTS bitrix_task_id text;
UPDATE public.anomalias_detectadas SET detectada_em = COALESCE(detectada_em, created_at, now()) WHERE detectada_em IS NULL;

-- ============ WEBAUTHN ============
CREATE TABLE IF NOT EXISTS public.webauthn_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  credential_id text NOT NULL UNIQUE,
  public_key text,
  counter bigint DEFAULT 0,
  device_name text,
  transports text[] DEFAULT '{}',
  last_used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.webauthn_credentials ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users manage own webauthn" ON public.webauthn_credentials;
CREATE POLICY "users manage own webauthn" ON public.webauthn_credentials
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============ WEBHOOKS LOG ============
CREATE TABLE IF NOT EXISTS public.webhooks_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text,
  event_type text,
  status text DEFAULT 'received',
  payload jsonb DEFAULT '{}'::jsonb,
  response jsonb,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.webhooks_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth read webhooks_log" ON public.webhooks_log;
DROP POLICY IF EXISTS "auth write webhooks_log" ON public.webhooks_log;
CREATE POLICY "auth read webhooks_log" ON public.webhooks_log FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth write webhooks_log" ON public.webhooks_log FOR INSERT TO authenticated WITH CHECK (true);

-- ============ ASAAS ============
CREATE TABLE IF NOT EXISTS public.asaas_customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid, cliente_id uuid, asaas_id text UNIQUE,
  razao_social text, nome text, cpf_cnpj text, email text, telefone text,
  endereco jsonb, metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.asaas_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid, asaas_id text UNIQUE,
  asaas_customer_id uuid REFERENCES public.asaas_customers(id) ON DELETE SET NULL,
  conta_receber_id uuid REFERENCES public.contas_receber(id) ON DELETE SET NULL,
  tipo text, status text DEFAULT 'PENDING',
  valor numeric(14,2) DEFAULT 0, valor_liquido numeric(14,2),
  data_vencimento date, data_pagamento date,
  descricao text, invoice_url text, bank_slip_url text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.asaas_transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid, asaas_id text UNIQUE,
  valor numeric(14,2) DEFAULT 0,
  chave_pix text, tipo_chave text, descricao text,
  status text DEFAULT 'PENDING', idempotency_key text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.asaas_audit_trail (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asaas_payment_id uuid REFERENCES public.asaas_payments(id) ON DELETE CASCADE,
  action text, actor uuid, details jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.asaas_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid UNIQUE, api_key_encrypted text,
  ambiente text DEFAULT 'sandbox', webhook_secret text,
  ativo boolean DEFAULT true, configuracoes jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.asaas_reconciliation_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid,
  transaction_id text,
  conta_receber_id uuid REFERENCES public.contas_receber(id) ON DELETE CASCADE,
  score numeric(5,4) DEFAULT 0,
  status text DEFAULT 'PENDING',
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.asaas_sync_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asaas_payment_id uuid REFERENCES public.asaas_payments(id) ON DELETE CASCADE,
  attempts integer DEFAULT 0, status text DEFAULT 'pending',
  last_error text, next_retry_at timestamptz DEFAULT now(),
  payload jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============ HISTÓRICO COBRANÇAS BOLETOS ============
CREATE TABLE IF NOT EXISTS public.historico_cobrancas_boletos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  boleto_id uuid,
  conta_receber_id uuid,
  tipo_evento text NOT NULL,
  descricao text,
  metadados jsonb DEFAULT '{}'::jsonb,
  user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============ CENTROS DE CUSTO ============
ALTER TABLE public.centros_custo
  ADD COLUMN IF NOT EXISTS descricao text,
  ADD COLUMN IF NOT EXISTS responsavel text,
  ADD COLUMN IF NOT EXISTS orcamento_previsto numeric(14,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS orcamento_realizado numeric(14,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES public.centros_custo(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- ============ RLS permissivas autenticadas ============
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'asaas_customers','asaas_payments','asaas_transfers','asaas_audit_trail',
    'asaas_config','asaas_reconciliation_suggestions','asaas_sync_queue',
    'historico_cobrancas_boletos'
  ] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS "auth select %1$s" ON public.%1$I', t);
    EXECUTE format('DROP POLICY IF EXISTS "auth modify %1$s" ON public.%1$I', t);
    EXECUTE format('CREATE POLICY "auth select %1$s" ON public.%1$I FOR SELECT TO authenticated USING (true)', t);
    EXECUTE format('CREATE POLICY "auth modify %1$s" ON public.%1$I FOR ALL TO authenticated USING (true) WITH CHECK (true)', t);
  END LOOP;
END $$;

-- Adicionar políticas INSERT/UPDATE/DELETE em centros_custo (já tinha SELECT pública)
DROP POLICY IF EXISTS "auth modify centros_custo" ON public.centros_custo;
CREATE POLICY "auth modify centros_custo" ON public.centros_custo
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
