
-- =====================================================
-- MIGRAÇÃO 2: Tabelas de Cobrança ausentes
-- =====================================================

-- Tabela: templates_cobranca (14 cols)
CREATE TABLE IF NOT EXISTS public.templates_cobranca (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES public.empresas(id),
  etapa TEXT NOT NULL,
  canal TEXT NOT NULL CHECK (canal IN ('email', 'whatsapp', 'sms', 'telefone')),
  assunto TEXT,
  corpo TEXT NOT NULL,
  tom TEXT DEFAULT 'profissional' CHECK (tom IN ('amigavel', 'profissional', 'firme', 'urgente', 'juridico')),
  padrao BOOLEAN DEFAULT false,
  ativo BOOLEAN NOT NULL DEFAULT true,
  variaveis_disponiveis TEXT[],
  versao INTEGER DEFAULT 1,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela: fila_cobrancas (22 cols)
CREATE TABLE IF NOT EXISTS public.fila_cobrancas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES public.empresas(id),
  conta_receber_id UUID REFERENCES public.contas_receber(id),
  cliente_id UUID REFERENCES public.clientes(id),
  cliente_nome TEXT,
  etapa TEXT NOT NULL,
  canal TEXT NOT NULL CHECK (canal IN ('email', 'whatsapp', 'sms', 'telefone')),
  destinatario TEXT,
  template_id UUID REFERENCES public.templates_cobranca(id),
  mensagem_renderizada TEXT,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'processando', 'enviado', 'entregue', 'lido', 'respondido', 'falhou', 'cancelado')),
  tentativas INTEGER DEFAULT 0,
  max_tentativas INTEGER DEFAULT 3,
  proxima_tentativa TIMESTAMPTZ,
  erro_mensagem TEXT,
  prioridade INTEGER DEFAULT 5,
  agendado_para TIMESTAMPTZ,
  processado_em TIMESTAMPTZ,
  processado_por TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela: execucoes_cobranca (22 cols)
CREATE TABLE IF NOT EXISTS public.execucoes_cobranca (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES public.empresas(id),
  fila_id UUID REFERENCES public.fila_cobrancas(id),
  conta_receber_id UUID REFERENCES public.contas_receber(id),
  cliente_id UUID REFERENCES public.clientes(id),
  cliente_nome TEXT,
  etapa TEXT NOT NULL,
  canal TEXT NOT NULL,
  destinatario TEXT,
  mensagem TEXT,
  status TEXT NOT NULL DEFAULT 'enviado',
  provider TEXT,
  provider_message_id TEXT,
  entregue BOOLEAN DEFAULT false,
  entregue_em TIMESTAMPTZ,
  lido BOOLEAN DEFAULT false,
  lido_em TIMESTAMPTZ,
  respondido BOOLEAN DEFAULT false,
  resposta TEXT,
  erro_mensagem TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela: negativacoes (15 cols)
CREATE TABLE IF NOT EXISTS public.negativacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES public.empresas(id),
  cliente_id UUID REFERENCES public.clientes(id),
  conta_receber_id UUID REFERENCES public.contas_receber(id),
  bureau TEXT NOT NULL CHECK (bureau IN ('serasa', 'spc', 'boa_vista')),
  valor NUMERIC NOT NULL,
  data_inclusao DATE,
  data_exclusao DATE,
  protocolo TEXT,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'incluido', 'excluido', 'erro', 'cancelado')),
  motivo TEXT,
  observacoes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela: protestos (18 cols)
CREATE TABLE IF NOT EXISTS public.protestos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES public.empresas(id),
  cliente_id UUID REFERENCES public.clientes(id),
  conta_receber_id UUID REFERENCES public.contas_receber(id),
  cartorio TEXT,
  cidade_cartorio TEXT,
  estado_cartorio TEXT,
  valor NUMERIC NOT NULL,
  data_protocolo DATE,
  data_protesto DATE,
  data_pagamento DATE,
  protocolo TEXT,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'protocolado', 'protestado', 'pago', 'cancelado', 'sustado', 'erro')),
  custas NUMERIC DEFAULT 0,
  observacoes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.templates_cobranca ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fila_cobrancas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.execucoes_cobranca ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.negativacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.protestos ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Auth users can manage templates_cobranca" ON public.templates_cobranca FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users can manage fila_cobrancas" ON public.fila_cobrancas FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users can manage execucoes_cobranca" ON public.execucoes_cobranca FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users can manage negativacoes" ON public.negativacoes FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users can manage protestos" ON public.protestos FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- updated_at triggers
CREATE TRIGGER update_templates_cobranca_updated_at BEFORE UPDATE ON public.templates_cobranca FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_fila_cobrancas_updated_at BEFORE UPDATE ON public.fila_cobrancas FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_execucoes_cobranca_updated_at BEFORE UPDATE ON public.execucoes_cobranca FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_negativacoes_updated_at BEFORE UPDATE ON public.negativacoes FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_protestos_updated_at BEFORE UPDATE ON public.protestos FOR EACH ROW EXECUTE FUNCTION update_updated_at();
