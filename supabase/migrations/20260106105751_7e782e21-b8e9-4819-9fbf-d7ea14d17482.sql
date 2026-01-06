-- ============================================
-- MÓDULO REFORMA TRIBUTÁRIA - TABELAS PRINCIPAIS
-- Melhoria 1: Estrutura de dados para IBS/CBS/IS
-- ============================================

-- Tabela de Apurações Tributárias (mensal)
CREATE TABLE public.apuracoes_tributarias (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  competencia DATE NOT NULL, -- Primeiro dia do mês de competência
  ano INTEGER NOT NULL,
  mes INTEGER NOT NULL,
  
  -- CBS (Contribuição sobre Bens e Serviços)
  cbs_debitos NUMERIC(15,2) DEFAULT 0,
  cbs_creditos NUMERIC(15,2) DEFAULT 0,
  cbs_saldo_anterior NUMERIC(15,2) DEFAULT 0,
  cbs_a_pagar NUMERIC(15,2) DEFAULT 0,
  cbs_a_compensar NUMERIC(15,2) DEFAULT 0,
  
  -- IBS (Imposto sobre Bens e Serviços)
  ibs_debitos NUMERIC(15,2) DEFAULT 0,
  ibs_creditos NUMERIC(15,2) DEFAULT 0,
  ibs_saldo_anterior NUMERIC(15,2) DEFAULT 0,
  ibs_a_pagar NUMERIC(15,2) DEFAULT 0,
  ibs_a_compensar NUMERIC(15,2) DEFAULT 0,
  
  -- IS (Imposto Seletivo)
  is_debitos NUMERIC(15,2) DEFAULT 0,
  is_creditos NUMERIC(15,2) DEFAULT 0,
  is_a_pagar NUMERIC(15,2) DEFAULT 0,
  
  -- Tributos Residuais (período de transição)
  icms_residual NUMERIC(15,2) DEFAULT 0,
  iss_residual NUMERIC(15,2) DEFAULT 0,
  pis_residual NUMERIC(15,2) DEFAULT 0,
  cofins_residual NUMERIC(15,2) DEFAULT 0,
  
  -- Totais
  total_tributos_novos NUMERIC(15,2) DEFAULT 0,
  total_tributos_residuais NUMERIC(15,2) DEFAULT 0,
  total_geral NUMERIC(15,2) DEFAULT 0,
  
  -- Controle
  status VARCHAR(20) DEFAULT 'rascunho' CHECK (status IN ('rascunho', 'calculado', 'revisado', 'transmitido', 'retificado')),
  data_transmissao TIMESTAMP WITH TIME ZONE,
  protocolo_transmissao VARCHAR(100),
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID,
  
  UNIQUE(empresa_id, ano, mes)
);

-- Tabela de Créditos Tributários
CREATE TABLE public.creditos_tributarios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  
  -- Identificação
  tipo_tributo VARCHAR(10) NOT NULL CHECK (tipo_tributo IN ('CBS', 'IBS', 'IS')),
  tipo_credito VARCHAR(50) NOT NULL, -- 'aquisicao_insumos', 'ativo_imobilizado', 'energia', 'transporte', etc.
  
  -- Documento de origem
  documento_tipo VARCHAR(20), -- 'nfe', 'nfse', 'cte', 'manual'
  documento_numero VARCHAR(50),
  documento_serie VARCHAR(10),
  documento_chave VARCHAR(50),
  nota_fiscal_id UUID REFERENCES public.notas_fiscais(id),
  
  -- Fornecedor
  fornecedor_id UUID REFERENCES public.fornecedores(id),
  fornecedor_cnpj VARCHAR(20),
  fornecedor_nome VARCHAR(200),
  
  -- Valores
  valor_base NUMERIC(15,2) NOT NULL,
  aliquota NUMERIC(6,4) NOT NULL,
  valor_credito NUMERIC(15,2) NOT NULL,
  
  -- Período
  data_origem DATE NOT NULL,
  competencia_origem DATE NOT NULL,
  competencia_utilizacao DATE,
  
  -- Status
  status VARCHAR(20) DEFAULT 'disponivel' CHECK (status IN ('disponivel', 'utilizado', 'compensado', 'expirado', 'estornado', 'transferido')),
  
  -- Utilização
  apuracao_id UUID REFERENCES public.apuracoes_tributarias(id),
  valor_utilizado NUMERIC(15,2) DEFAULT 0,
  saldo_disponivel NUMERIC(15,2),
  
  -- Controle
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

-- Tabela de Operações Tributáveis (base para cálculo)
CREATE TABLE public.operacoes_tributaveis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  
  -- Tipo de operação
  tipo_operacao VARCHAR(30) NOT NULL CHECK (tipo_operacao IN ('venda', 'compra', 'servico_prestado', 'servico_tomado', 'importacao', 'exportacao', 'devolucao_venda', 'devolucao_compra')),
  
  -- Documento
  documento_tipo VARCHAR(20) NOT NULL,
  documento_numero VARCHAR(50),
  documento_serie VARCHAR(10),
  documento_chave VARCHAR(50),
  nota_fiscal_id UUID REFERENCES public.notas_fiscais(id),
  
  -- Partes
  cliente_id UUID REFERENCES public.clientes(id),
  fornecedor_id UUID REFERENCES public.fornecedores(id),
  cnpj_cpf_contraparte VARCHAR(20),
  nome_contraparte VARCHAR(200),
  
  -- Localização
  uf_origem VARCHAR(2),
  uf_destino VARCHAR(2),
  municipio_origem VARCHAR(10),
  municipio_destino VARCHAR(10),
  
  -- Classificação fiscal
  cfop VARCHAR(10),
  ncm VARCHAR(10),
  cest VARCHAR(10),
  
  -- Valores base
  valor_operacao NUMERIC(15,2) NOT NULL,
  valor_desconto NUMERIC(15,2) DEFAULT 0,
  valor_frete NUMERIC(15,2) DEFAULT 0,
  valor_seguro NUMERIC(15,2) DEFAULT 0,
  valor_outros NUMERIC(15,2) DEFAULT 0,
  base_calculo NUMERIC(15,2) NOT NULL,
  
  -- CBS
  cbs_aliquota NUMERIC(6,4) DEFAULT 0,
  cbs_valor NUMERIC(15,2) DEFAULT 0,
  cbs_credito NUMERIC(15,2) DEFAULT 0,
  
  -- IBS
  ibs_aliquota NUMERIC(6,4) DEFAULT 0,
  ibs_valor NUMERIC(15,2) DEFAULT 0,
  ibs_credito NUMERIC(15,2) DEFAULT 0,
  
  -- IS (Imposto Seletivo)
  is_categoria VARCHAR(50),
  is_aliquota NUMERIC(6,4) DEFAULT 0,
  is_valor NUMERIC(15,2) DEFAULT 0,
  
  -- Tributos Residuais
  icms_aliquota NUMERIC(6,4) DEFAULT 0,
  icms_valor NUMERIC(15,2) DEFAULT 0,
  iss_aliquota NUMERIC(6,4) DEFAULT 0,
  iss_valor NUMERIC(15,2) DEFAULT 0,
  pis_aliquota NUMERIC(6,4) DEFAULT 0,
  pis_valor NUMERIC(15,2) DEFAULT 0,
  cofins_aliquota NUMERIC(6,4) DEFAULT 0,
  cofins_valor NUMERIC(15,2) DEFAULT 0,
  
  -- Regimes especiais
  regime_especial VARCHAR(50),
  reducao_aliquota NUMERIC(6,4) DEFAULT 0,
  
  -- Isenções/Imunidades
  isento BOOLEAN DEFAULT FALSE,
  motivo_isencao TEXT,
  
  -- Split Payment
  split_payment BOOLEAN DEFAULT FALSE,
  split_payment_valor NUMERIC(15,2) DEFAULT 0,
  
  -- Período
  data_operacao DATE NOT NULL,
  competencia DATE NOT NULL,
  
  -- Controle
  apuracao_id UUID REFERENCES public.apuracoes_tributarias(id),
  status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'processado', 'erro', 'cancelado')),
  erro_mensagem TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

-- Tabela de Transações Split Payment
CREATE TABLE public.split_payment_transacoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  operacao_id UUID NOT NULL REFERENCES public.operacoes_tributaveis(id) ON DELETE CASCADE,
  
  -- Documento
  documento_tipo VARCHAR(20) NOT NULL,
  documento_numero VARCHAR(50),
  documento_chave VARCHAR(50),
  
  -- Valores
  valor_operacao NUMERIC(15,2) NOT NULL,
  valor_liquido NUMERIC(15,2) NOT NULL,
  
  -- Tributos retidos
  cbs_retido NUMERIC(15,2) DEFAULT 0,
  ibs_retido NUMERIC(15,2) DEFAULT 0,
  is_retido NUMERIC(15,2) DEFAULT 0,
  total_retido NUMERIC(15,2) DEFAULT 0,
  
  -- Destinação
  conta_fornecedor VARCHAR(50),
  conta_cbs VARCHAR(50),
  conta_ibs VARCHAR(50),
  conta_is VARCHAR(50),
  
  -- Status do pagamento
  status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'processando', 'concluido', 'erro')),
  data_processamento TIMESTAMP WITH TIME ZONE,
  protocolo VARCHAR(100),
  erro_mensagem TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de Configurações de Regime Especial por Empresa
CREATE TABLE public.regimes_especiais_empresa (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  
  regime_codigo VARCHAR(50) NOT NULL,
  regime_nome VARCHAR(200) NOT NULL,
  
  -- Reduções aplicáveis
  reducao_cbs NUMERIC(6,4) DEFAULT 0,
  reducao_ibs NUMERIC(6,4) DEFAULT 0,
  
  -- Vigência
  data_inicio DATE NOT NULL,
  data_fim DATE,
  
  -- Documentação
  ato_legal VARCHAR(200),
  numero_processo VARCHAR(50),
  
  ativo BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

-- Índices para performance
CREATE INDEX idx_apuracoes_empresa_periodo ON public.apuracoes_tributarias(empresa_id, ano, mes);
CREATE INDEX idx_creditos_empresa_status ON public.creditos_tributarios(empresa_id, status);
CREATE INDEX idx_creditos_competencia ON public.creditos_tributarios(competencia_origem);
CREATE INDEX idx_operacoes_empresa_competencia ON public.operacoes_tributaveis(empresa_id, competencia);
CREATE INDEX idx_operacoes_nota_fiscal ON public.operacoes_tributaveis(nota_fiscal_id);
CREATE INDEX idx_split_payment_operacao ON public.split_payment_transacoes(operacao_id);

-- Habilitar RLS
ALTER TABLE public.apuracoes_tributarias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creditos_tributarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operacoes_tributaveis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.split_payment_transacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regimes_especiais_empresa ENABLE ROW LEVEL SECURITY;

-- Políticas RLS (acesso autenticado)
CREATE POLICY "Usuários autenticados podem ver apurações" ON public.apuracoes_tributarias FOR SELECT TO authenticated USING (true);
CREATE POLICY "Usuários autenticados podem inserir apurações" ON public.apuracoes_tributarias FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Usuários autenticados podem atualizar apurações" ON public.apuracoes_tributarias FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Usuários autenticados podem deletar apurações" ON public.apuracoes_tributarias FOR DELETE TO authenticated USING (true);

CREATE POLICY "Usuários autenticados podem ver créditos" ON public.creditos_tributarios FOR SELECT TO authenticated USING (true);
CREATE POLICY "Usuários autenticados podem inserir créditos" ON public.creditos_tributarios FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Usuários autenticados podem atualizar créditos" ON public.creditos_tributarios FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Usuários autenticados podem deletar créditos" ON public.creditos_tributarios FOR DELETE TO authenticated USING (true);

CREATE POLICY "Usuários autenticados podem ver operações" ON public.operacoes_tributaveis FOR SELECT TO authenticated USING (true);
CREATE POLICY "Usuários autenticados podem inserir operações" ON public.operacoes_tributaveis FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Usuários autenticados podem atualizar operações" ON public.operacoes_tributaveis FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Usuários autenticados podem deletar operações" ON public.operacoes_tributaveis FOR DELETE TO authenticated USING (true);

CREATE POLICY "Usuários autenticados podem ver split payment" ON public.split_payment_transacoes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Usuários autenticados podem inserir split payment" ON public.split_payment_transacoes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Usuários autenticados podem atualizar split payment" ON public.split_payment_transacoes FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Usuários autenticados podem ver regimes especiais" ON public.regimes_especiais_empresa FOR SELECT TO authenticated USING (true);
CREATE POLICY "Usuários autenticados podem inserir regimes especiais" ON public.regimes_especiais_empresa FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Usuários autenticados podem atualizar regimes especiais" ON public.regimes_especiais_empresa FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Usuários autenticados podem deletar regimes especiais" ON public.regimes_especiais_empresa FOR DELETE TO authenticated USING (true);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_apuracoes_tributarias_updated_at BEFORE UPDATE ON public.apuracoes_tributarias FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_creditos_tributarios_updated_at BEFORE UPDATE ON public.creditos_tributarios FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_operacoes_tributaveis_updated_at BEFORE UPDATE ON public.operacoes_tributaveis FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_split_payment_transacoes_updated_at BEFORE UPDATE ON public.split_payment_transacoes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_regimes_especiais_empresa_updated_at BEFORE UPDATE ON public.regimes_especiais_empresa FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();