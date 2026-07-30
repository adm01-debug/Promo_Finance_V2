
-- =====================================================
-- MIGRAÇÃO 1: Tabelas ausentes do módulo Core Financeiro
-- =====================================================

-- Tabela: contatos_financeiros (20 cols)
CREATE TABLE IF NOT EXISTS public.contatos_financeiros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  email TEXT,
  telefone TEXT,
  whatsapp TEXT,
  cpf_cnpj TEXT,
  tipo TEXT DEFAULT 'cliente' CHECK (tipo IN ('cliente', 'fornecedor', 'ambos', 'outro')),
  cargo TEXT,
  departamento TEXT,
  empresa TEXT,
  endereco TEXT,
  cidade TEXT,
  estado TEXT,
  cep TEXT,
  observacoes TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  empresa_id UUID REFERENCES public.empresas(id),
  origem TEXT DEFAULT 'manual',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela: categorias (10 cols)
CREATE TABLE IF NOT EXISTS public.categorias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'ambos' CHECK (tipo IN ('receita', 'despesa', 'ambos')),
  cor TEXT DEFAULT '#6B7280',
  icone TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  user_id UUID,
  plano_conta_id UUID REFERENCES public.plano_contas(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela: formas_pagamento (11 cols)
CREATE TABLE IF NOT EXISTS public.formas_pagamento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  codigo TEXT UNIQUE,
  tipo TEXT DEFAULT 'ambos' CHECK (tipo IN ('entrada', 'saida', 'ambos')),
  taxa_percentual NUMERIC DEFAULT 0,
  dias_compensacao INTEGER DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT true,
  requer_dados_bancarios BOOLEAN DEFAULT false,
  icone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela: movimentacoes (27 cols)
CREATE TABLE IF NOT EXISTS public.movimentacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES public.empresas(id),
  conta_bancaria_id UUID REFERENCES public.contas_bancarias(id),
  conta_pagar_id UUID REFERENCES public.contas_pagar(id),
  conta_receber_id UUID REFERENCES public.contas_receber(id),
  transferencia_id UUID,
  tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'saida', 'transferencia')),
  descricao TEXT NOT NULL,
  valor NUMERIC NOT NULL,
  data_movimentacao DATE NOT NULL DEFAULT CURRENT_DATE,
  data_competencia DATE,
  categoria_id UUID,
  centro_custo_id UUID REFERENCES public.centros_custo(id),
  forma_pagamento_id UUID,
  numero_documento TEXT,
  observacoes TEXT,
  conciliada BOOLEAN DEFAULT false,
  conciliada_em TIMESTAMPTZ,
  conciliada_por UUID,
  estornada BOOLEAN DEFAULT false,
  estornada_em TIMESTAMPTZ,
  movimentacao_estorno_id UUID,
  origem TEXT DEFAULT 'manual',
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- Tabela: transferencias (40 cols)
CREATE TABLE IF NOT EXISTS public.transferencias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES public.empresas(id),
  conta_bancaria_id UUID REFERENCES public.contas_bancarias(id),
  conta_destino_id UUID REFERENCES public.contas_bancarias(id),
  conta_pagar_id UUID REFERENCES public.contas_pagar(id),
  tipo TEXT NOT NULL DEFAULT 'pix' CHECK (tipo IN ('pix', 'ted', 'transferencia_interna', 'boleto_pagamento')),
  descricao TEXT NOT NULL,
  valor NUMERIC NOT NULL,
  taxa NUMERIC DEFAULT 0,
  valor_liquido NUMERIC,
  data_transferencia DATE NOT NULL DEFAULT CURRENT_DATE,
  data_efetivacao DATE,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'agendado', 'realizado', 'cancelado', 'estornado', 'erro')),
  chave_pix TEXT,
  tipo_chave_pix TEXT,
  favorecido_nome TEXT,
  favorecido_cpf_cnpj TEXT,
  favorecido_banco TEXT,
  favorecido_agencia TEXT,
  favorecido_conta TEXT,
  favorecido_tipo_conta TEXT,
  codigo_barras TEXT,
  linha_digitavel TEXT,
  comprovante_url TEXT,
  protocolo TEXT,
  asaas_transfer_id TEXT,
  asaas_status TEXT,
  erro_mensagem TEXT,
  observacoes TEXT,
  aprovado_por UUID,
  aprovado_em TIMESTAMPTZ,
  cancelado_por UUID,
  cancelado_em TIMESTAMPTZ,
  motivo_cancelamento TEXT,
  movimentacao_id UUID,
  numero_documento TEXT,
  origem TEXT DEFAULT 'manual',
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela: extrato_bancario (17 cols)
CREATE TABLE IF NOT EXISTS public.extrato_bancario (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conta_bancaria_id UUID NOT NULL REFERENCES public.contas_bancarias(id),
  empresa_id UUID REFERENCES public.empresas(id),
  data DATE NOT NULL,
  descricao TEXT NOT NULL,
  valor NUMERIC NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('credito', 'debito')),
  saldo NUMERIC,
  numero_documento TEXT,
  categoria TEXT,
  importado_de TEXT,
  hash_transacao TEXT,
  conciliado BOOLEAN DEFAULT false,
  transacao_bancaria_id UUID REFERENCES public.transacoes_bancarias(id),
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela: conciliacoes (14 cols)
CREATE TABLE IF NOT EXISTS public.conciliacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES public.empresas(id),
  conta_bancaria_id UUID NOT NULL REFERENCES public.contas_bancarias(id),
  periodo_inicio DATE NOT NULL,
  periodo_fim DATE NOT NULL,
  saldo_banco NUMERIC NOT NULL DEFAULT 0,
  saldo_sistema NUMERIC NOT NULL DEFAULT 0,
  total_conciliados INTEGER DEFAULT 0,
  total_pendentes INTEGER DEFAULT 0,
  status TEXT DEFAULT 'em_andamento' CHECK (status IN ('em_andamento', 'finalizada', 'cancelada')),
  finalizada_em TIMESTAMPTZ,
  finalizada_por UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela: anexos_financeiros (11 cols)
CREATE TABLE IF NOT EXISTS public.anexos_financeiros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entidade_tipo TEXT NOT NULL,
  entidade_id UUID NOT NULL,
  nome_arquivo TEXT NOT NULL,
  url TEXT NOT NULL,
  tipo_arquivo TEXT,
  tamanho_bytes BIGINT,
  descricao TEXT,
  uploaded_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela: auditoria_financeira (9 cols)
CREATE TABLE IF NOT EXISTS public.auditoria_financeira (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tabela TEXT NOT NULL,
  operacao TEXT NOT NULL CHECK (operacao IN ('INSERT', 'UPDATE', 'DELETE')),
  registro_id UUID,
  dados_antigos JSONB,
  dados_novos JSONB,
  user_id UUID,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela: webhooks_log (12 cols)
CREATE TABLE IF NOT EXISTS public.webhooks_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB,
  headers JSONB,
  status TEXT DEFAULT 'recebido',
  processado BOOLEAN DEFAULT false,
  processado_em TIMESTAMPTZ,
  erro_mensagem TEXT,
  ip_origem TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.contatos_financeiros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.formas_pagamento ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimentacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transferencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.extrato_bancario ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conciliacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anexos_financeiros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auditoria_financeira ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhooks_log ENABLE ROW LEVEL SECURITY;

-- RLS policies for authenticated users with role checks
CREATE POLICY "Auth users can manage contatos_financeiros" ON public.contatos_financeiros FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users can manage categorias" ON public.categorias FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users can read formas_pagamento" ON public.formas_pagamento FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can manage movimentacoes" ON public.movimentacoes FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users can manage transferencias" ON public.transferencias FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users can manage extrato_bancario" ON public.extrato_bancario FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users can manage conciliacoes" ON public.conciliacoes FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users can manage anexos_financeiros" ON public.anexos_financeiros FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users can read auditoria_financeira" ON public.auditoria_financeira FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can read webhooks_log" ON public.webhooks_log FOR SELECT TO authenticated USING (true);

-- updated_at triggers for new tables
CREATE TRIGGER update_contatos_financeiros_updated_at BEFORE UPDATE ON public.contatos_financeiros FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_categorias_updated_at BEFORE UPDATE ON public.categorias FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_formas_pagamento_updated_at BEFORE UPDATE ON public.formas_pagamento FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_movimentacoes_updated_at BEFORE UPDATE ON public.movimentacoes FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_transferencias_updated_at BEFORE UPDATE ON public.transferencias FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_extrato_bancario_updated_at BEFORE UPDATE ON public.extrato_bancario FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_conciliacoes_updated_at BEFORE UPDATE ON public.conciliacoes FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_anexos_financeiros_updated_at BEFORE UPDATE ON public.anexos_financeiros FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_webhooks_log_updated_at BEFORE UPDATE ON public.webhooks_log FOR EACH ROW EXECUTE FUNCTION update_updated_at();
