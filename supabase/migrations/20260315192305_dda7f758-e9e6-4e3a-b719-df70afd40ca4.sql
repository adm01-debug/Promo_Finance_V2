
-- ============================================
-- ASAAS Integration Tables
-- ============================================

-- Tabela de clientes sincronizados com ASAAS
CREATE TABLE public.asaas_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
  empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE NOT NULL,
  asaas_id TEXT NOT NULL UNIQUE,
  nome TEXT NOT NULL,
  cpf_cnpj TEXT,
  email TEXT,
  telefone TEXT,
  endereco JSONB,
  sincronizado_em TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de cobranças/pagamentos do ASAAS
CREATE TABLE public.asaas_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE NOT NULL,
  asaas_id TEXT NOT NULL UNIQUE,
  asaas_customer_id TEXT,
  conta_receber_id UUID REFERENCES public.contas_receber(id) ON DELETE SET NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('boleto', 'pix', 'credit_card', 'debit_card')),
  valor NUMERIC(14,2) NOT NULL,
  valor_liquido NUMERIC(14,2),
  data_vencimento DATE NOT NULL,
  data_pagamento DATE,
  status TEXT NOT NULL DEFAULT 'PENDING',
  descricao TEXT,
  nosso_numero TEXT,
  codigo_barras TEXT,
  linha_digitavel TEXT,
  pix_qrcode TEXT,
  pix_copia_cola TEXT,
  link_boleto TEXT,
  link_fatura TEXT,
  webhook_payload JSONB,
  erro_mensagem TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX idx_asaas_customers_empresa ON public.asaas_customers(empresa_id);
CREATE INDEX idx_asaas_customers_cliente ON public.asaas_customers(cliente_id);
CREATE INDEX idx_asaas_payments_empresa ON public.asaas_payments(empresa_id);
CREATE INDEX idx_asaas_payments_status ON public.asaas_payments(status);
CREATE INDEX idx_asaas_payments_conta_receber ON public.asaas_payments(conta_receber_id);

-- Triggers updated_at
CREATE TRIGGER update_asaas_customers_updated_at
  BEFORE UPDATE ON public.asaas_customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_asaas_payments_updated_at
  BEFORE UPDATE ON public.asaas_payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE public.asaas_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asaas_payments ENABLE ROW LEVEL SECURITY;

-- Policies asaas_customers
CREATE POLICY "Admins e financeiro podem ver clientes ASAAS"
  ON public.asaas_customers FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin', 'financeiro']::app_role[]));

CREATE POLICY "Admins e financeiro podem inserir clientes ASAAS"
  ON public.asaas_customers FOR INSERT TO authenticated
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin', 'financeiro']::app_role[]));

CREATE POLICY "Admins e financeiro podem atualizar clientes ASAAS"
  ON public.asaas_customers FOR UPDATE TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin', 'financeiro']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin', 'financeiro']::app_role[]));

-- Policies asaas_payments
CREATE POLICY "Admins e financeiro podem ver pagamentos ASAAS"
  ON public.asaas_payments FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin', 'financeiro']::app_role[]));

CREATE POLICY "Admins e financeiro podem inserir pagamentos ASAAS"
  ON public.asaas_payments FOR INSERT TO authenticated
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin', 'financeiro']::app_role[]));

CREATE POLICY "Admins e financeiro podem atualizar pagamentos ASAAS"
  ON public.asaas_payments FOR UPDATE TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin', 'financeiro']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin', 'financeiro']::app_role[]));

-- Service role policy for webhook (inserts/updates without auth)
CREATE POLICY "Service role full access asaas_payments"
  ON public.asaas_payments FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access asaas_customers"
  ON public.asaas_customers FOR ALL TO service_role
  USING (true) WITH CHECK (true);
