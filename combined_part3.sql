  END LOOP;
END $$;

-- 1. ponto_departamentos
CREATE TABLE public.ponto_departamentos (
  id serial PRIMARY KEY,
  nome varchar(200),
  cargo varchar(200),
  responsavel varchar(200),
  codigo_firebird integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.ponto_departamentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view ponto_departamentos" ON public.ponto_departamentos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage ponto_departamentos" ON public.ponto_departamentos FOR ALL TO authenticated USING (public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role])) WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role]));

-- 2. ponto_funcionarios
CREATE TABLE public.ponto_funcionarios (
  id serial PRIMARY KEY,
  nome varchar(100),
  cpf varchar(15),
  rg varchar(15),
  pis varchar(15),
  matricula varchar(20),
  cracha varchar(20),
  funcao varchar(100),
  email varchar(100),
  telefone varchar(20),
  celular varchar(20),
  data_nascimento date,
  data_admissao date,
  data_desligamento date,
  situacao varchar(20) DEFAULT 'ATIVO',
  empresa_codigo integer,
  departamento_id integer REFERENCES public.ponto_departamentos(id),
  codigo_firebird integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.ponto_funcionarios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view ponto_funcionarios" ON public.ponto_funcionarios FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage ponto_funcionarios" ON public.ponto_funcionarios FOR ALL TO authenticated USING (public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role])) WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role]));

-- 3. ponto_registros
CREATE TABLE public.ponto_registros (
  id serial PRIMARY KEY,
  funcionario_id integer REFERENCES public.ponto_funcionarios(id),
  data_batida date,
  entrada_1 time, saida_1 time,
  entrada_2 time, saida_2 time,
  entrada_3 time, saida_3 time,
  entrada_4 time, saida_4 time,
  entrada_5 time, saida_5 time,
  entrada_6 time, saida_6 time,
  abono time, abono_negativo time,
  justificativa_abono integer,
  folga integer, neutro integer,
  horario_codigo integer,
  dados_brutos jsonb, observacoes jsonb,
  codigo_firebird integer,
  sincronizado_em timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.ponto_registros ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view ponto_registros" ON public.ponto_registros FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage ponto_registros" ON public.ponto_registros FOR ALL TO authenticated USING (public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role])) WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role]));

-- 4. ponto_sync_log
CREATE TABLE public.ponto_sync_log (
  id serial PRIMARY KEY,
  status varchar(20) DEFAULT 'running',
  inicio timestamptz, fim timestamptz,
  departamentos_sincronizados integer DEFAULT 0,
  funcionarios_sincronizados integer DEFAULT 0,
  registros_novos integer DEFAULT 0,
  registros_atualizados integer DEFAULT 0,
  erro text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.ponto_sync_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view ponto_sync_log" ON public.ponto_sync_log FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage ponto_sync_log" ON public.ponto_sync_log FOR ALL TO authenticated USING (public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role])) WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role]));

-- 5. Triggers updated_at
CREATE TRIGGER update_ponto_departamentos_updated_at BEFORE UPDATE ON public.ponto_departamentos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_ponto_funcionarios_updated_at BEFORE UPDATE ON public.ponto_funcionarios FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_ponto_registros_updated_at BEFORE UPDATE ON public.ponto_registros FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6. RPC fn_verificar_vencidos
CREATE OR REPLACE FUNCTION public.fn_verificar_vencidos()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.contas_pagar SET status = 'vencido' WHERE status = 'pendente' AND data_vencimento < CURRENT_DATE;
  UPDATE public.contas_receber SET status = 'vencido' WHERE status = 'pendente' AND data_vencimento < CURRENT_DATE;
END;
$$;

-- =====================================================
-- MIGRATION: Adicionar 276 colunas faltantes para paridade total
-- Tabelas afetadas: 31 (views serão atualizadas depois)
-- =====================================================

-- anexos_financeiros (3)
ALTER TABLE public.anexos_financeiros ADD COLUMN IF NOT EXISTS storage_path TEXT;
ALTER TABLE public.anexos_financeiros ADD COLUMN IF NOT EXISTS url_publica TEXT;
ALTER TABLE public.anexos_financeiros ADD COLUMN IF NOT EXISTS uploaded_por TEXT;

-- fila_cobrancas (8)
ALTER TABLE public.fila_cobrancas ADD COLUMN IF NOT EXISTS regua_etapa_id UUID;
ALTER TABLE public.fila_cobrancas ADD COLUMN IF NOT EXISTS assunto TEXT;
ALTER TABLE public.fila_cobrancas ADD COLUMN IF NOT EXISTS link_pagamento TEXT;
ALTER TABLE public.fila_cobrancas ADD COLUMN IF NOT EXISTS data_agendamento TIMESTAMPTZ;
ALTER TABLE public.fila_cobrancas ADD COLUMN IF NOT EXISTS erro_detalhe TEXT;
ALTER TABLE public.fila_cobrancas ADD COLUMN IF NOT EXISTS enviado_em TIMESTAMPTZ;
ALTER TABLE public.fila_cobrancas ADD COLUMN IF NOT EXISTS entregue_em TIMESTAMPTZ;
ALTER TABLE public.fila_cobrancas ADD COLUMN IF NOT EXISTS lido_em TIMESTAMPTZ;

-- notas_fiscais (16)
ALTER TABLE public.notas_fiscais ADD COLUMN IF NOT EXISTS tipo TEXT;
ALTER TABLE public.notas_fiscais ADD COLUMN IF NOT EXISTS descricao_servico TEXT;
ALTER TABLE public.notas_fiscais ADD COLUMN IF NOT EXISTS valor NUMERIC;
ALTER TABLE public.notas_fiscais ADD COLUMN IF NOT EXISTS valor_iss NUMERIC;
ALTER TABLE public.notas_fiscais ADD COLUMN IF NOT EXISTS aliquota_iss NUMERIC;
ALTER TABLE public.notas_fiscais ADD COLUMN IF NOT EXISTS data_competencia DATE;
ALTER TABLE public.notas_fiscais ADD COLUMN IF NOT EXISTS conta_receber_id UUID;
ALTER TABLE public.notas_fiscais ADD COLUMN IF NOT EXISTS contato_id UUID;
ALTER TABLE public.notas_fiscais ADD COLUMN IF NOT EXISTS asaas_invoice_id TEXT;
ALTER TABLE public.notas_fiscais ADD COLUMN IF NOT EXISTS asaas_payment_id TEXT;
ALTER TABLE public.notas_fiscais ADD COLUMN IF NOT EXISTS asaas_status TEXT;
ALTER TABLE public.notas_fiscais ADD COLUMN IF NOT EXISTS asaas_pdf_url TEXT;
ALTER TABLE public.notas_fiscais ADD COLUMN IF NOT EXISTS asaas_xml_url TEXT;
ALTER TABLE public.notas_fiscais ADD COLUMN IF NOT EXISTS asaas_rps_number TEXT;
ALTER TABLE public.notas_fiscais ADD COLUMN IF NOT EXISTS bitrix_deal_id TEXT;
ALTER TABLE public.notas_fiscais ADD COLUMN IF NOT EXISTS observacoes TEXT;

-- movimentacoes (12)
ALTER TABLE public.movimentacoes ADD COLUMN IF NOT EXISTS conta_destino_id UUID;
ALTER TABLE public.movimentacoes ADD COLUMN IF NOT EXISTS plano_conta_id UUID;
ALTER TABLE public.movimentacoes ADD COLUMN IF NOT EXISTS contato_id UUID;
ALTER TABLE public.movimentacoes ADD COLUMN IF NOT EXISTS conciliado BOOLEAN DEFAULT false;
ALTER TABLE public.movimentacoes ADD COLUMN IF NOT EXISTS conciliacao_id UUID;
ALTER TABLE public.movimentacoes ADD COLUMN IF NOT EXISTS bitrix_deal_id TEXT;
ALTER TABLE public.movimentacoes ADD COLUMN IF NOT EXISTS tags TEXT[];
ALTER TABLE public.movimentacoes ADD COLUMN IF NOT EXISTS asaas_transaction_id TEXT;
ALTER TABLE public.movimentacoes ADD COLUMN IF NOT EXISTS asaas_type TEXT;
ALTER TABLE public.movimentacoes ADD COLUMN IF NOT EXISTS valor_liquido NUMERIC;
ALTER TABLE public.movimentacoes ADD COLUMN IF NOT EXISTS taxa_gateway NUMERIC;

-- retencoes_fonte (1)
ALTER TABLE public.retencoes_fonte ADD COLUMN IF NOT EXISTS darf_id UUID;

-- formas_pagamento (4)
ALTER TABLE public.formas_pagamento ADD COLUMN IF NOT EXISTS parcelas_padrao INTEGER;
ALTER TABLE public.formas_pagamento ADD COLUMN IF NOT EXISTS taxa_fixa NUMERIC;
ALTER TABLE public.formas_pagamento ADD COLUMN IF NOT EXISTS prazo_recebimento_dias INTEGER;
ALTER TABLE public.formas_pagamento ADD COLUMN IF NOT EXISTS conta_bancaria_id UUID;

-- contas_pagar (8)
ALTER TABLE public.contas_pagar ADD COLUMN IF NOT EXISTS data_competencia DATE;
ALTER TABLE public.contas_pagar ADD COLUMN IF NOT EXISTS recorrencia_parent_id UUID;
ALTER TABLE public.contas_pagar ADD COLUMN IF NOT EXISTS bitrix_activity_id TEXT;
ALTER TABLE public.contas_pagar ADD COLUMN IF NOT EXISTS origem TEXT;
ALTER TABLE public.contas_pagar ADD COLUMN IF NOT EXISTS tags TEXT[];
ALTER TABLE public.contas_pagar ADD COLUMN IF NOT EXISTS asaas_bill_id TEXT;
ALTER TABLE public.contas_pagar ADD COLUMN IF NOT EXISTS asaas_transfer_id TEXT;
ALTER TABLE public.contas_pagar ADD COLUMN IF NOT EXISTS asaas_status TEXT;

-- empresas (5)
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS inscricao_municipal TEXT;
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS bairro TEXT;
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS numero TEXT;
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS complemento TEXT;
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- templates_cobranca (1)
ALTER TABLE public.templates_cobranca ADD COLUMN IF NOT EXISTS nome TEXT;

-- webhooks_log (8)
ALTER TABLE public.webhooks_log ADD COLUMN IF NOT EXISTS evento TEXT;
ALTER TABLE public.webhooks_log ADD COLUMN IF NOT EXISTS origem TEXT;
ALTER TABLE public.webhooks_log ADD COLUMN IF NOT EXISTS asaas_event_id TEXT;
ALTER TABLE public.webhooks_log ADD COLUMN IF NOT EXISTS asaas_payment_id TEXT;
ALTER TABLE public.webhooks_log ADD COLUMN IF NOT EXISTS asaas_transfer_id TEXT;
ALTER TABLE public.webhooks_log ADD COLUMN IF NOT EXISTS asaas_subscription_id TEXT;
ALTER TABLE public.webhooks_log ADD COLUMN IF NOT EXISTS status_processamento TEXT;
ALTER TABLE public.webhooks_log ADD COLUMN IF NOT EXISTS erro_detalhe TEXT;

-- profiles (2)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS telefone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ativo BOOLEAN DEFAULT true;

-- fornecedores (5)
ALTER TABLE public.fornecedores ADD COLUMN IF NOT EXISTS bairro TEXT;
ALTER TABLE public.fornecedores ADD COLUMN IF NOT EXISTS numero TEXT;
ALTER TABLE public.fornecedores ADD COLUMN IF NOT EXISTS complemento TEXT;
ALTER TABLE public.fornecedores ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.fornecedores ADD COLUMN IF NOT EXISTS bitrix_company_id TEXT;

-- transferencias (22)
ALTER TABLE public.transferencias ADD COLUMN IF NOT EXISTS modalidade TEXT;
ALTER TABLE public.transferencias ADD COLUMN IF NOT EXISTS contato_id UUID;
ALTER TABLE public.transferencias ADD COLUMN IF NOT EXISTS pix_chave_destino TEXT;
ALTER TABLE public.transferencias ADD COLUMN IF NOT EXISTS pix_tipo_chave TEXT;
ALTER TABLE public.transferencias ADD COLUMN IF NOT EXISTS banco_destino TEXT;
ALTER TABLE public.transferencias ADD COLUMN IF NOT EXISTS agencia_destino TEXT;
ALTER TABLE public.transferencias ADD COLUMN IF NOT EXISTS conta_destino TEXT;
ALTER TABLE public.transferencias ADD COLUMN IF NOT EXISTS data_solicitacao DATE;
ALTER TABLE public.transferencias ADD COLUMN IF NOT EXISTS data_agendamento DATE;
ALTER TABLE public.transferencias ADD COLUMN IF NOT EXISTS data_credito DATE;
ALTER TABLE public.transferencias ADD COLUMN IF NOT EXISTS plano_conta_id UUID;
ALTER TABLE public.transferencias ADD COLUMN IF NOT EXISTS centro_custo_id UUID;
ALTER TABLE public.transferencias ADD COLUMN IF NOT EXISTS asaas_end_to_end TEXT;
ALTER TABLE public.transferencias ADD COLUMN IF NOT EXISTS asaas_comprovante_url TEXT;
ALTER TABLE public.transferencias ADD COLUMN IF NOT EXISTS asaas_fail_reason TEXT;
ALTER TABLE public.transferencias ADD COLUMN IF NOT EXISTS asaas_authorized BOOLEAN;
ALTER TABLE public.transferencias ADD COLUMN IF NOT EXISTS recorrente BOOLEAN DEFAULT false;
ALTER TABLE public.transferencias ADD COLUMN IF NOT EXISTS recorrencia_frequencia TEXT;
ALTER TABLE public.transferencias ADD COLUMN IF NOT EXISTS recorrencia_inicio DATE;
ALTER TABLE public.transferencias ADD COLUMN IF NOT EXISTS recorrencia_fim DATE;
ALTER TABLE public.transferencias ADD COLUMN IF NOT EXISTS bitrix_deal_id TEXT;
ALTER TABLE public.transferencias ADD COLUMN IF NOT EXISTS external_reference TEXT;
ALTER TABLE public.transferencias ADD COLUMN IF NOT EXISTS tags TEXT[];

-- portal_cliente_acessos (2)
ALTER TABLE public.portal_cliente_acessos ADD COLUMN IF NOT EXISTS ip TEXT;
ALTER TABLE public.portal_cliente_acessos ADD COLUMN IF NOT EXISTS metadata JSONB;

-- protestos (3)
ALTER TABLE public.protestos ADD COLUMN IF NOT EXISTS uf_cartorio TEXT;
ALTER TABLE public.protestos ADD COLUMN IF NOT EXISTS data_cancelamento DATE;
ALTER TABLE public.protestos ADD COLUMN IF NOT EXISTS erro_detalhe TEXT;

-- permissions (3)
ALTER TABLE public.permissions ADD COLUMN IF NOT EXISTS code TEXT;
ALTER TABLE public.permissions ADD COLUMN IF NOT EXISTS descricao TEXT;
ALTER TABLE public.permissions ADD COLUMN IF NOT EXISTS ativo BOOLEAN DEFAULT true;

-- rate_limit_logs (1)
ALTER TABLE public.rate_limit_logs ADD COLUMN IF NOT EXISTS user_id UUID;

-- apuracoes_irpj_csll (2)
ALTER TABLE public.apuracoes_irpj_csll ADD COLUMN IF NOT EXISTS lucro_liquido NUMERIC;
ALTER TABLE public.apuracoes_irpj_csll ADD COLUMN IF NOT EXISTS competencia TEXT;

-- contas_bancarias (3)
ALTER TABLE public.contas_bancarias ADD COLUMN IF NOT EXISTS data_saldo_inicial DATE;
ALTER TABLE public.contas_bancarias ADD COLUMN IF NOT EXISTS moeda TEXT DEFAULT 'BRL';
ALTER TABLE public.contas_bancarias ADD COLUMN IF NOT EXISTS observacoes TEXT;

-- extrato_bancario (11)
ALTER TABLE public.extrato_bancario ADD COLUMN IF NOT EXISTS data_transacao DATE;
ALTER TABLE public.extrato_bancario ADD COLUMN IF NOT EXISTS descricao_banco TEXT;
ALTER TABLE public.extrato_bancario ADD COLUMN IF NOT EXISTS saldo_apos NUMERIC;
ALTER TABLE public.extrato_bancario ADD COLUMN IF NOT EXISTS numero_documento_banco TEXT;
ALTER TABLE public.extrato_bancario ADD COLUMN IF NOT EXISTS codigo_transacao TEXT;
ALTER TABLE public.extrato_bancario ADD COLUMN IF NOT EXISTS movimentacao_id UUID;
ALTER TABLE public.extrato_bancario ADD COLUMN IF NOT EXISTS conciliado_em TIMESTAMPTZ;
ALTER TABLE public.extrato_bancario ADD COLUMN IF NOT EXISTS conciliado_por TEXT;
ALTER TABLE public.extrato_bancario ADD COLUMN IF NOT EXISTS arquivo_origem TEXT;
ALTER TABLE public.extrato_bancario ADD COLUMN IF NOT EXISTS linha_arquivo INTEGER;
ALTER TABLE public.extrato_bancario ADD COLUMN IF NOT EXISTS importado_em TIMESTAMPTZ;

-- plano_contas (2)
ALTER TABLE public.plano_contas ADD COLUMN IF NOT EXISTS nome TEXT;
ALTER TABLE public.plano_contas ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- centros_custo (3)
ALTER TABLE public.centros_custo ADD COLUMN IF NOT EXISTS tipo TEXT;
ALTER TABLE public.centros_custo ADD COLUMN IF NOT EXISTS responsavel TEXT;
ALTER TABLE public.centros_custo ADD COLUMN IF NOT EXISTS bitrix_deal_id TEXT;

-- contas_receber (13)
ALTER TABLE public.contas_receber ADD COLUMN IF NOT EXISTS data_competencia DATE;
ALTER TABLE public.contas_receber ADD COLUMN IF NOT EXISTS numero_nf TEXT;
ALTER TABLE public.contas_receber ADD COLUMN IF NOT EXISTS bitrix_activity_id TEXT;
ALTER TABLE public.contas_receber ADD COLUMN IF NOT EXISTS origem TEXT;
ALTER TABLE public.contas_receber ADD COLUMN IF NOT EXISTS tags TEXT[];
ALTER TABLE public.contas_receber ADD COLUMN IF NOT EXISTS asaas_payment_id TEXT;
ALTER TABLE public.contas_receber ADD COLUMN IF NOT EXISTS asaas_installment_id TEXT;
ALTER TABLE public.contas_receber ADD COLUMN IF NOT EXISTS asaas_subscription_id TEXT;
ALTER TABLE public.contas_receber ADD COLUMN IF NOT EXISTS asaas_invoice_url TEXT;
ALTER TABLE public.contas_receber ADD COLUMN IF NOT EXISTS asaas_billing_type TEXT;
ALTER TABLE public.contas_receber ADD COLUMN IF NOT EXISTS asaas_status TEXT;
ALTER TABLE public.contas_receber ADD COLUMN IF NOT EXISTS data_credito DATE;
ALTER TABLE public.contas_receber ADD COLUMN IF NOT EXISTS valor_liquido NUMERIC;
ALTER TABLE public.contas_receber ADD COLUMN IF NOT EXISTS taxa_gateway NUMERIC;

-- contatos_financeiros (10)
ALTER TABLE public.contatos_financeiros ADD COLUMN IF NOT EXISTS razao_social TEXT;
ALTER TABLE public.contatos_financeiros ADD COLUMN IF NOT EXISTS banco TEXT;
ALTER TABLE public.contatos_financeiros ADD COLUMN IF NOT EXISTS agencia TEXT;
ALTER TABLE public.contatos_financeiros ADD COLUMN IF NOT EXISTS conta TEXT;
ALTER TABLE public.contatos_financeiros ADD COLUMN IF NOT EXISTS pix_chave TEXT;
ALTER TABLE public.contatos_financeiros ADD COLUMN IF NOT EXISTS pix_tipo TEXT;
ALTER TABLE public.contatos_financeiros ADD COLUMN IF NOT EXISTS bitrix_contact_id TEXT;
ALTER TABLE public.contatos_financeiros ADD COLUMN IF NOT EXISTS bitrix_company_id TEXT;
ALTER TABLE public.contatos_financeiros ADD COLUMN IF NOT EXISTS asaas_customer_id TEXT;
ALTER TABLE public.contatos_financeiros ADD COLUMN IF NOT EXISTS asaas_subconta_wallet_id TEXT;

-- auditoria_financeira (4)
ALTER TABLE public.auditoria_financeira ADD COLUMN IF NOT EXISTS acao TEXT;
ALTER TABLE public.auditoria_financeira ADD COLUMN IF NOT EXISTS dados_anteriores JSONB;
ALTER TABLE public.auditoria_financeira ADD COLUMN IF NOT EXISTS usuario TEXT;
ALTER TABLE public.auditoria_financeira ADD COLUMN IF NOT EXISTS ip TEXT;

-- execucoes_cobranca (9)
ALTER TABLE public.execucoes_cobranca ADD COLUMN IF NOT EXISTS regua_etapa_id UUID;
ALTER TABLE public.execucoes_cobranca ADD COLUMN IF NOT EXISTS mensagem_enviada TEXT;
ALTER TABLE public.execucoes_cobranca ADD COLUMN IF NOT EXISTS enviado_em TIMESTAMPTZ;
ALTER TABLE public.execucoes_cobranca ADD COLUMN IF NOT EXISTS respondido_em TIMESTAMPTZ;
ALTER TABLE public.execucoes_cobranca ADD COLUMN IF NOT EXISTS resposta_cliente TEXT;
ALTER TABLE public.execucoes_cobranca ADD COLUMN IF NOT EXISTS erro_detalhe TEXT;
ALTER TABLE public.execucoes_cobranca ADD COLUMN IF NOT EXISTS custo NUMERIC;
ALTER TABLE public.execucoes_cobranca ADD COLUMN IF NOT EXISTS metadata JSONB;
ALTER TABLE public.execucoes_cobranca ADD COLUMN IF NOT EXISTS created_by UUID;

-- clientes (10)
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS nome TEXT;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS cpf_cnpj TEXT;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS cep TEXT;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS bairro TEXT;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS numero TEXT;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS complemento TEXT;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS asaas_customer_id TEXT;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS bitrix_contact_id TEXT;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS bitrix_company_id TEXT;

-- negativacoes (2)
ALTER TABLE public.negativacoes ADD COLUMN IF NOT EXISTS motivo_exclusao TEXT;
ALTER TABLE public.negativacoes ADD COLUMN IF NOT EXISTS erro_detalhe TEXT;

-- conciliacoes (6)
ALTER TABLE public.conciliacoes ADD COLUMN IF NOT EXISTS data_inicio DATE;
ALTER TABLE public.conciliacoes ADD COLUMN IF NOT EXISTS data_fim DATE;
ALTER TABLE public.conciliacoes ADD COLUMN IF NOT EXISTS total_itens_conciliados INTEGER;
ALTER TABLE public.conciliacoes ADD COLUMN IF NOT EXISTS total_itens_pendentes INTEGER;
ALTER TABLE public.conciliacoes ADD COLUMN IF NOT EXISTS realizado_por TEXT;
ALTER TABLE public.conciliacoes ADD COLUMN IF NOT EXISTS observacoes TEXT;

-- portal_cliente_tokens (7)
ALTER TABLE public.portal_cliente_tokens ADD COLUMN IF NOT EXISTS tipo TEXT;
ALTER TABLE public.portal_cliente_tokens ADD COLUMN IF NOT EXISTS valido_ate TIMESTAMPTZ;
ALTER TABLE public.portal_cliente_tokens ADD COLUMN IF NOT EXISTS usado BOOLEAN DEFAULT false;
ALTER TABLE public.portal_cliente_tokens ADD COLUMN IF NOT EXISTS usado_em TIMESTAMPTZ;
ALTER TABLE public.portal_cliente_tokens ADD COLUMN IF NOT EXISTS ip_acesso TEXT;
ALTER TABLE public.portal_cliente_tokens ADD COLUMN IF NOT EXISTS conta_receber_id UUID;
ALTER TABLE public.portal_cliente_tokens ADD COLUMN IF NOT EXISTS empresa_id UUID;

-- regua_cobranca (3)
ALTER TABLE public.regua_cobranca ADD COLUMN IF NOT EXISTS etapa TEXT;
ALTER TABLE public.regua_cobranca ADD COLUMN IF NOT EXISTS prioridade INTEGER;
ALTER TABLE public.regua_cobranca ADD COLUMN IF NOT EXISTS condicoes JSONB;

DROP VIEW IF EXISTS public.vw_contas_pagar_painel;
DROP VIEW IF EXISTS public.vw_contas_receber_painel;
DROP VIEW IF EXISTS public.vw_dre_mensal;
DROP VIEW IF EXISTS public.vw_dso_aging;
DROP VIEW IF EXISTS public.vw_saldos_contas;
DROP VIEW IF EXISTS public.vw_fluxo_caixa;
DROP VIEW IF EXISTS public.vw_fluxo_caixa_diario;
DROP VIEW IF EXISTS public.vw_gastos_centro_custo;
DROP VIEW IF EXISTS public.vw_metricas_cobranca;
DROP VIEW IF EXISTS public.vw_transferencias_painel;
DROP VIEW IF EXISTS public.vw_webhooks_recentes;

CREATE VIEW public.vw_contas_pagar_painel AS
SELECT cp.id, cp.empresa_id, cp.conta_bancaria_id, cp.centro_custo_id, cp.fornecedor_id, cp.fornecedor_nome,
    cp.descricao, cp.valor, cp.valor_pago, cp.data_emissao, cp.data_vencimento, cp.data_pagamento, cp.status,
    cp.tipo_cobranca, cp.numero_documento, cp.codigo_barras, cp.observacoes, cp.recorrente, cp.bitrix_deal_id,
    cp.aprovado_por, cp.aprovado_em, cp.created_by, cp.created_at, cp.updated_at, cp.valor_original,
    cp.valor_desconto, cp.valor_juros, cp.valor_multa, cp.numero_parcela_atual, cp.total_parcelas, cp.categoria,
    cp.forma_pagamento, cp.forma_pagamento_id, cp.plano_conta_id, cp.contato_id, cp.frequencia_recorrencia,
    cp.user_id, cp.vencimento, cp.parcela_atual, cp.valor_final,
    (cp.valor - COALESCE(cp.valor_pago, 0)) AS saldo_devedor,
    (cp.data_vencimento - CURRENT_DATE) AS dias_para_vencer,
    f.nome AS fornecedor, f.cnpj AS fornecedor_cnpj,
    cf.nome AS contato_nome, cc.nome AS centro_custo, cb.banco AS conta_bancaria,
    cp.asaas_bill_id, cp.asaas_status, cp.tags,
    pc.descricao AS plano_conta_nome, pc.codigo AS plano_conta_codigo
FROM contas_pagar cp
    LEFT JOIN fornecedores f ON f.id = cp.fornecedor_id
    LEFT JOIN contas_bancarias cb ON cb.id = cp.conta_bancaria_id
    LEFT JOIN centros_custo cc ON cc.id = cp.centro_custo_id
    LEFT JOIN plano_contas pc ON pc.id = cp.plano_conta_id
    LEFT JOIN contatos_financeiros cf ON cf.id = cp.contato_id
WHERE cp.status = ANY (ARRAY['pendente'::status_pagamento, 'vencido'::status_pagamento, 'parcial'::status_pagamento, 'atrasado'::status_pagamento]);

CREATE VIEW public.vw_contas_receber_painel AS
SELECT cr.id, cr.empresa_id, cr.conta_bancaria_id, cr.centro_custo_id, cr.cliente_id, cr.cliente_nome,
    cr.descricao, cr.valor, cr.valor_recebido, cr.data_emissao, cr.data_vencimento, cr.data_recebimento,
    cr.status, cr.tipo_cobranca, cr.numero_documento, cr.codigo_barras, cr.chave_pix, cr.link_boleto,
    cr.observacoes, cr.etapa_cobranca, cr.bitrix_deal_id, cr.created_by, cr.created_at, cr.updated_at,
    cr.vendedor_id, cr.valor_original, cr.valor_desconto, cr.valor_juros, cr.valor_multa,
    cr.numero_parcela_atual, cr.total_parcelas, cr.categoria, cr.forma_recebimento, cr.forma_pagamento_id,
    cr.plano_conta_id, cr.contato_id, cr.frequencia_recorrencia, cr.recorrente, cr.user_id, cr.vencimento,
    cr.parcela_atual, cr.valor_pago, cr.valor_final,
    (cr.valor - COALESCE(cr.valor_recebido, 0)) AS saldo_a_receber,
    (cr.data_vencimento - CURRENT_DATE) AS dias_para_vencer,
    c.razao_social AS cliente, c.cnpj_cpf AS cliente_cpf_cnpj,
    cf.nome AS contato_nome, cc.nome AS centro_custo,
    cr.numero_nf, cr.asaas_payment_id, cr.asaas_billing_type, cr.asaas_status,
    cr.data_credito, cr.valor_liquido, cr.taxa_gateway, cr.tags,
    c.score AS cliente_score, cb.banco AS conta_banco, cc.nome AS centro_custo_nome,
    pc.descricao AS plano_conta_nome
FROM contas_receber cr
    LEFT JOIN clientes c ON c.id = cr.cliente_id
    LEFT JOIN contas_bancarias cb ON cb.id = cr.conta_bancaria_id
    LEFT JOIN centros_custo cc ON cc.id = cr.centro_custo_id
    LEFT JOIN plano_contas pc ON pc.id = cr.plano_conta_id
    LEFT JOIN contatos_financeiros cf ON cf.id = cr.contato_id
WHERE cr.status = ANY (ARRAY['pendente'::status_pagamento, 'vencido'::status_pagamento, 'parcial'::status_pagamento, 'atrasado'::status_pagamento]);

CREATE VIEW public.vw_dre_mensal AS
SELECT date_trunc('month', m.data_movimentacao::timestamp with time zone) AS mes,
    m.empresa_id,
    sum(CASE WHEN m.tipo = 'entrada' THEN m.valor ELSE 0 END) AS receitas,
    sum(CASE WHEN m.tipo = 'saida' THEN m.valor ELSE 0 END) AS despesas,
    sum(CASE WHEN m.tipo = 'entrada' THEN m.valor ELSE -m.valor END) AS resultado,
    pc.tipo AS tipo_conta, cat.nome AS categoria,
    sum(m.valor) AS total_bruto,
    sum(COALESCE(m.valor_liquido, m.valor)) AS total_liquido,
    sum(COALESCE(m.taxa_gateway, 0)) AS total_taxas
FROM movimentacoes m
    LEFT JOIN plano_contas pc ON pc.id = m.plano_conta_id
    LEFT JOIN categorias cat ON cat.id = m.categoria_id
WHERE m.deleted_at IS NULL
GROUP BY date_trunc('month', m.data_movimentacao::timestamp with time zone), m.empresa_id, pc.tipo, cat.nome;

CREATE VIEW public.vw_dso_aging AS
SELECT cr.empresa_id,
    count(*) AS total_titulos, sum(cr.valor) AS valor_total,
    sum(cr.valor - COALESCE(cr.valor_recebido, 0)) AS saldo_aberto,
    sum(CASE WHEN cr.data_vencimento >= CURRENT_DATE THEN cr.valor - COALESCE(cr.valor_recebido, 0) ELSE 0 END) AS a_vencer,
    sum(CASE WHEN (CURRENT_DATE - cr.data_vencimento) BETWEEN 0 AND 7 THEN cr.valor - COALESCE(cr.valor_recebido, 0) ELSE 0 END) AS vencido_0_7,
    sum(CASE WHEN (CURRENT_DATE - cr.data_vencimento) BETWEEN 8 AND 15 THEN cr.valor - COALESCE(cr.valor_recebido, 0) ELSE 0 END) AS vencido_8_15,
    sum(CASE WHEN (CURRENT_DATE - cr.data_vencimento) BETWEEN 16 AND 30 THEN cr.valor - COALESCE(cr.valor_recebido, 0) ELSE 0 END) AS vencido_16_30,
    sum(CASE WHEN (CURRENT_DATE - cr.data_vencimento) BETWEEN 31 AND 60 THEN cr.valor - COALESCE(cr.valor_recebido, 0) ELSE 0 END) AS vencido_31_60,
    sum(CASE WHEN (CURRENT_DATE - cr.data_vencimento) BETWEEN 61 AND 90 THEN cr.valor - COALESCE(cr.valor_recebido, 0) ELSE 0 END) AS vencido_61_90,
    sum(CASE WHEN (CURRENT_DATE - cr.data_vencimento) > 90 THEN cr.valor - COALESCE(cr.valor_recebido, 0) ELSE 0 END) AS vencido_90_mais,
    CASE
        WHEN cr.data_vencimento >= CURRENT_DATE THEN 'A Vencer'
        WHEN (CURRENT_DATE - cr.data_vencimento) <= 30 THEN '1-30 dias'
        WHEN (CURRENT_DATE - cr.data_vencimento) <= 60 THEN '31-60 dias'
        WHEN (CURRENT_DATE - cr.data_vencimento) <= 90 THEN '61-90 dias'
        ELSE '90+ dias'
    END AS faixa,
    count(*) AS quantidade,
    avg(CASE WHEN cr.data_vencimento < CURRENT_DATE THEN (CURRENT_DATE - cr.data_vencimento) ELSE 0 END) AS media_dias_atraso,
    count(*) FILTER (WHERE cr.etapa_cobranca IS NOT NULL) AS em_cobranca
FROM contas_receber cr
WHERE cr.status = ANY (ARRAY['pendente'::status_pagamento, 'vencido'::status_pagamento, 'parcial'::status_pagamento, 'atrasado'::status_pagamento])
GROUP BY cr.empresa_id, CASE WHEN cr.data_vencimento >= CURRENT_DATE THEN 'A Vencer' WHEN (CURRENT_DATE - cr.data_vencimento) <= 30 THEN '1-30 dias' WHEN (CURRENT_DATE - cr.data_vencimento) <= 60 THEN '31-60 dias' WHEN (CURRENT_DATE - cr.data_vencimento) <= 90 THEN '61-90 dias' ELSE '90+ dias' END;

CREATE VIEW public.vw_saldos_contas AS
SELECT cb.id, cb.banco, cb.agencia, cb.conta, cb.tipo_conta, cb.saldo_atual, cb.cor, cb.ativo,
    cb.empresa_id, cb.nome, cb.tipo, e.razao_social AS empresa_nome
FROM contas_bancarias cb LEFT JOIN empresas e ON e.id = cb.empresa_id WHERE cb.ativo = true;

CREATE VIEW public.vw_fluxo_caixa AS
SELECT m.data_movimentacao, m.tipo, m.descricao, m.valor, m.valor_liquido, m.taxa_gateway,
    cb.banco AS conta_bancaria, cat.nome AS categoria, pc.tipo AS tipo_categoria, cc.nome AS centro_custo,
    cf.nome AS contato, m.conciliado, m.asaas_transaction_id, m.asaas_type, m.origem,
    m.created_at, m.empresa_id, m.conta_bancaria_id
FROM movimentacoes m
    LEFT JOIN contas_bancarias cb ON cb.id = m.conta_bancaria_id
    LEFT JOIN plano_contas pc ON pc.id = m.plano_conta_id
    LEFT JOIN centros_custo cc ON cc.id = m.centro_custo_id
    LEFT JOIN contatos_financeiros cf ON cf.id = m.contato_id
    LEFT JOIN categorias cat ON cat.id = m.categoria_id
WHERE m.deleted_at IS NULL;

CREATE VIEW public.vw_fluxo_caixa_diario AS
SELECT m.data_movimentacao AS dia, m.data_movimentacao AS data, m.empresa_id,
    sum(CASE WHEN m.tipo = 'entrada' THEN m.valor ELSE 0 END) AS entradas,
    sum(CASE WHEN m.tipo = 'saida' THEN m.valor ELSE 0 END) AS saidas,
    sum(CASE WHEN m.tipo = 'entrada' THEN m.valor ELSE -m.valor END) AS saldo,
    sum(CASE WHEN m.tipo = 'entrada' THEN m.valor ELSE 0 END) AS total_entradas,
    sum(CASE WHEN m.tipo = 'saida' THEN m.valor ELSE 0 END) AS total_saidas,
    sum(CASE WHEN m.tipo = 'entrada' THEN m.valor ELSE -m.valor END) AS saldo_dia,
    sum(CASE WHEN m.tipo = 'entrada' THEN COALESCE(m.valor_liquido, m.valor) ELSE 0 END) AS entradas_liquidas,
    sum(COALESCE(m.taxa_gateway, 0)) AS total_taxas
FROM movimentacoes m WHERE m.deleted_at IS NULL GROUP BY m.data_movimentacao, m.empresa_id;

CREATE VIEW public.vw_gastos_centro_custo AS
SELECT cc.id AS centro_custo_id, cc.nome, cc.nome AS centro_custo, cc.codigo, cc.orcamento_previsto,
    COALESCE(sum(cp.valor), 0) AS total_gasto,
    CASE WHEN cc.orcamento_previsto > 0 THEN round((COALESCE(sum(cp.valor), 0) / cc.orcamento_previsto) * 100, 2) ELSE 0 END AS percentual_utilizado,
    cc.tipo, (cc.orcamento_previsto - COALESCE(sum(cp.valor), 0)) AS saldo_orcamento, cc.bitrix_deal_id
FROM centros_custo cc LEFT JOIN contas_pagar cp ON cp.centro_custo_id = cc.id AND cp.status = 'pago'::status_pagamento
GROUP BY cc.id, cc.nome, cc.codigo, cc.orcamento_previsto, cc.tipo, cc.bitrix_deal_id;

CREATE VIEW public.vw_metricas_cobranca AS
SELECT ec.etapa, ec.etapa AS etapa_nome, ec.canal, ec.empresa_id,
    count(DISTINCT ec.conta_receber_id) AS contas_cobradas, count(*) AS total_enviados, count(*) AS total_disparos,
    count(*) FILTER (WHERE ec.status = 'enviado') AS enviados,
    sum(CASE WHEN ec.entregue THEN 1 ELSE 0 END) AS total_entregues, sum(CASE WHEN ec.entregue THEN 1 ELSE 0 END) AS entregues,
    sum(CASE WHEN ec.lido THEN 1 ELSE 0 END) AS total_lidos, sum(CASE WHEN ec.lido THEN 1 ELSE 0 END) AS lidos,
    count(*) FILTER (WHERE ec.respondido_em IS NOT NULL) AS respondidos,
    count(*) FILTER (WHERE ec.status = 'falhou') AS falhas, sum(COALESCE(ec.custo, 0)) AS custo_total,
    CASE WHEN count(*) > 0 THEN round((sum(CASE WHEN ec.entregue THEN 1 ELSE 0 END)::numeric / count(*)::numeric) * 100, 2) ELSE 0 END AS taxa_entrega,
    CASE WHEN count(*) > 0 THEN round((sum(CASE WHEN ec.entregue THEN 1 ELSE 0 END)::numeric / count(*)::numeric) * 100, 2) ELSE 0 END AS taxa_entrega_pct
FROM execucoes_cobranca ec GROUP BY ec.etapa, ec.canal, ec.empresa_id;

CREATE VIEW public.vw_transferencias_painel AS
SELECT t.id, t.empresa_id, t.conta_bancaria_id, t.conta_destino_id, t.conta_pagar_id, t.tipo,
    t.descricao, t.valor, t.taxa, t.valor_liquido, t.data_transferencia, t.data_efetivacao, t.status,
    t.chave_pix, t.tipo_chave_pix, t.favorecido_nome, t.favorecido_cpf_cnpj, t.favorecido_banco,
    t.favorecido_agencia, t.favorecido_conta, t.favorecido_tipo_conta, t.codigo_barras, t.linha_digitavel,
    t.comprovante_url, t.protocolo, t.asaas_transfer_id, t.asaas_status, t.erro_mensagem, t.observacoes,
    t.aprovado_por, t.aprovado_em, t.cancelado_por, t.cancelado_em, t.motivo_cancelamento,
    t.movimentacao_id, t.numero_documento, t.origem, t.created_by, t.created_at, t.updated_at,
    t.modalidade, t.data_solicitacao, t.favorecido_nome AS destinatario, co.banco AS conta_origem, t.pix_chave_destino,
    t.asaas_end_to_end, t.asaas_comprovante_url, t.bitrix_deal_id, t.external_reference, t.tags,
    co.banco AS banco_origem, co.conta AS conta_origem_numero, cd.banco AS banco_destino, cd.conta AS conta_destino_numero
FROM transferencias t
    LEFT JOIN contas_bancarias co ON co.id = t.conta_bancaria_id
    LEFT JOIN contas_bancarias cd ON cd.id = t.conta_destino_id;

CREATE VIEW public.vw_webhooks_recentes AS
SELECT wl.id, wl.provider, wl.event_type, wl.evento, wl.payload, wl.headers, wl.status,
    wl.status_processamento, wl.processado, wl.processado_em, wl.erro_mensagem, wl.erro_detalhe,
    wl.ip_origem, wl.asaas_payment_id, wl.asaas_transfer_id, wl.created_at, wl.updated_at
FROM webhooks_log wl ORDER BY wl.created_at DESC LIMIT 100;

-- Fix SECURITY DEFINER on all views - set to SECURITY INVOKER
ALTER VIEW public.vw_contas_pagar_painel SET (security_invoker = on);
ALTER VIEW public.vw_contas_receber_painel SET (security_invoker = on);
ALTER VIEW public.vw_dre_mensal SET (security_invoker = on);
ALTER VIEW public.vw_dso_aging SET (security_invoker = on);
ALTER VIEW public.vw_saldos_contas SET (security_invoker = on);
ALTER VIEW public.vw_fluxo_caixa SET (security_invoker = on);
ALTER VIEW public.vw_fluxo_caixa_diario SET (security_invoker = on);
ALTER VIEW public.vw_gastos_centro_custo SET (security_invoker = on);
ALTER VIEW public.vw_metricas_cobranca SET (security_invoker = on);
ALTER VIEW public.vw_transferencias_painel SET (security_invoker = on);
ALTER VIEW public.vw_webhooks_recentes SET (security_invoker = on);
-- =============================================
-- SECURITY HARDENING: Fix critical RLS issues
-- =============================================

-- 1. ponto_funcionarios: restrict SELECT to admin/financeiro
DROP POLICY IF EXISTS "Authenticated can view ponto_funcionarios" ON public.ponto_funcionarios;
CREATE POLICY "Admin/financeiro can view ponto_funcionarios"
  ON public.ponto_funcionarios FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin', 'financeiro']::app_role[]));

-- 2. contatos_financeiros: restrict SELECT to admin/financeiro
DROP POLICY IF EXISTS "Auth users can read contatos_financeiros" ON public.contatos_financeiros;
CREATE POLICY "Admin/financeiro can read contatos_financeiros"
  ON public.contatos_financeiros FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin', 'financeiro']::app_role[]));

-- 3. auditoria_financeira: restrict SELECT to admin only
DROP POLICY IF EXISTS "Auth users can read auditoria_financeira" ON public.auditoria_financeira;
CREATE POLICY "Admin can read auditoria_financeira"
  ON public.auditoria_financeira FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 4. anexos_financeiros: replace overly permissive ALL policy with scoped policies
DROP POLICY IF EXISTS "Auth users can manage anexos_financeiros" ON public.anexos_financeiros;

CREATE POLICY "Auth users can read anexos_financeiros"
  ON public.anexos_financeiros FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin', 'financeiro', 'operacional']::app_role[]));

CREATE POLICY "Auth users can insert anexos_financeiros"
  ON public.anexos_financeiros FOR INSERT TO authenticated
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin', 'financeiro', 'operacional']::app_role[]));

CREATE POLICY "Admin/financeiro can update anexos_financeiros"
  ON public.anexos_financeiros FOR UPDATE TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin', 'financeiro']::app_role[]));

CREATE POLICY "Admin/financeiro can delete anexos_financeiros"
  ON public.anexos_financeiros FOR DELETE TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin', 'financeiro']::app_role[]));

-- 5. ponto_registros: restrict SELECT to admin/financeiro
DROP POLICY IF EXISTS "Authenticated can view ponto_registros" ON public.ponto_registros;
CREATE POLICY "Admin/financeiro can view ponto_registros"
  ON public.ponto_registros FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin', 'financeiro']::app_role[]));

-- PIX Templates table for saving reusable payment templates
CREATE TABLE public.pix_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao TEXT,
  empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
  centro_custo_id UUID REFERENCES public.centros_custo(id) ON DELETE SET NULL,
  favorecido_nome TEXT NOT NULL,
  favorecido_cpf_cnpj TEXT,
  chave_pix TEXT NOT NULL,
  tipo_chave_pix TEXT NOT NULL DEFAULT 'cpf',
  valor_padrao NUMERIC DEFAULT 0,
  valor_fixo BOOLEAN DEFAULT false,
  categoria TEXT,
  tags TEXT[] DEFAULT '{}',
  uso_count INTEGER DEFAULT 0,
  ultimo_uso TIMESTAMPTZ,
  ativo BOOLEAN DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pix_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Authenticated users can view pix_templates"
  ON public.pix_templates FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert pix_templates"
  ON public.pix_templates FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Authenticated users can update pix_templates"
  ON public.pix_templates FOR UPDATE TO authenticated
  USING (true);

CREATE POLICY "Admins can delete pix_templates"
  ON public.pix_templates FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Updated_at trigger
CREATE TRIGGER update_pix_templates_updated_at
  BEFORE UPDATE ON public.pix_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
-- 1. PIX_TEMPLATES: Fix cross-tenant vulnerability
DROP POLICY IF EXISTS "Authenticated users can view pix_templates" ON public.pix_templates;
DROP POLICY IF EXISTS "Authenticated users can update pix_templates" ON public.pix_templates;

CREATE POLICY "Role-based select pix_templates"
  ON public.pix_templates FOR SELECT TO authenticated
  USING (
    created_by = auth.uid()
    OR has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role])
  );

CREATE POLICY "Role-based update pix_templates"
  ON public.pix_templates FOR UPDATE TO authenticated
  USING (
    created_by = auth.uid()
    OR has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role])
  )
  WITH CHECK (
    created_by = auth.uid()
    OR has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role])
  );

-- 2. WEBHOOKS_LOG: Restrict to admin/financeiro
DROP POLICY IF EXISTS "Auth users can read webhooks_log" ON public.webhooks_log;

CREATE POLICY "Admin financeiro can read webhooks_log"
  ON public.webhooks_log FOR SELECT TO authenticated
  USING (
    has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role])
  );

-- 3. PONTO_DEPARTAMENTOS: Restrict SELECT
DROP POLICY IF EXISTS "Authenticated can view ponto_departamentos" ON public.ponto_departamentos;

CREATE POLICY "Admin financeiro can view ponto_departamentos"
  ON public.ponto_departamentos FOR SELECT TO authenticated
  USING (
    has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role])
  );

-- 4. CONFIGURACOES_APROVACAO: Restrict SELECT
DROP POLICY IF EXISTS "Autenticados podem ver configuracoes_aprovacao" ON public.configuracoes_aprovacao;

CREATE POLICY "Admin financeiro can view configuracoes_aprovacao"
  ON public.configuracoes_aprovacao FOR SELECT TO authenticated
  USING (
    has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role])
  );-- 1. REGUA_COBRANCA: Restrict SELECT to admin/financeiro
DROP POLICY IF EXISTS "Usuários autenticados podem ver régua de cobrança" ON public.regua_cobranca;

CREATE POLICY "Admin financeiro can view regua_cobranca"
  ON public.regua_cobranca FOR SELECT TO authenticated
  USING (
    has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role])
  );

-- 2. TEMPLATES_COBRANCA: Restrict SELECT to admin/financeiro
DROP POLICY IF EXISTS "Auth users can read templates_cobranca" ON public.templates_cobranca;

CREATE POLICY "Admin financeiro can read templates_cobranca"
  ON public.templates_cobranca FOR SELECT TO authenticated
  USING (
    has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role])
  );

-- 3. PONTO_SYNC_LOG: Restrict SELECT to admin/financeiro
DROP POLICY IF EXISTS "Authenticated can view ponto_sync_log" ON public.ponto_sync_log;

CREATE POLICY "Admin financeiro can view ponto_sync_log"
  ON public.ponto_sync_log FOR SELECT TO authenticated
  USING (
    has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role])
  );

-- 4. REGRAS_CONCILIACAO: Restrict SELECT to admin/financeiro
DROP POLICY IF EXISTS "Authenticated users can read regras_conciliacao" ON public.regras_conciliacao;

CREATE POLICY "Admin financeiro can read regras_conciliacao"
  ON public.regras_conciliacao FOR SELECT TO authenticated
  USING (
    has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role])
  );
CREATE TABLE public.query_telemetry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operation TEXT NOT NULL,
  table_name TEXT,
  rpc_name TEXT,
  duration_ms INTEGER NOT NULL DEFAULT 0,
  record_count INTEGER,
  query_limit INTEGER,
  query_offset INTEGER,
  count_mode TEXT,
  severity TEXT NOT NULL DEFAULT 'normal',
  error_message TEXT,
  user_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.query_telemetry ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage telemetry" ON public.query_telemetry
  FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role]));

CREATE INDEX idx_query_telemetry_created_at ON public.query_telemetry (created_at DESC);
CREATE INDEX idx_query_telemetry_severity ON public.query_telemetry (severity);
CREATE INDEX IF NOT EXISTS idx_query_telemetry_table ON public.query_telemetry (table_name);ALTER VIEW public.vw_contas_receber_painel SET (security_invoker = true);
ALTER VIEW public.vw_contas_pagar_painel SET (security_invoker = true);
ALTER VIEW public.vw_transferencias_painel SET (security_invoker = true);
ALTER VIEW public.vw_saldos_contas SET (security_invoker = true);
ALTER VIEW public.vw_fluxo_caixa SET (security_invoker = true);
ALTER VIEW public.vw_fluxo_caixa_diario SET (security_invoker = true);
ALTER VIEW public.vw_dre_mensal SET (security_invoker = true);
ALTER VIEW public.vw_dso_aging SET (security_invoker = true);
ALTER VIEW public.vw_metricas_cobranca SET (security_invoker = true);
ALTER VIEW public.vw_gastos_centro_custo SET (security_invoker = true);
ALTER VIEW public.vw_webhooks_recentes SET (security_invoker = true);-- 1. Revoke anon access from all financial views (security_invoker already set)
REVOKE SELECT ON public.vw_contas_receber_painel FROM anon;
REVOKE SELECT ON public.vw_contas_pagar_painel FROM anon;
REVOKE SELECT ON public.vw_transferencias_painel FROM anon;
REVOKE SELECT ON public.vw_saldos_contas FROM anon;
REVOKE SELECT ON public.vw_fluxo_caixa FROM anon;
REVOKE SELECT ON public.vw_fluxo_caixa_diario FROM anon;
REVOKE SELECT ON public.vw_dre_mensal FROM anon;
REVOKE SELECT ON public.vw_dso_aging FROM anon;
REVOKE SELECT ON public.vw_metricas_cobranca FROM anon;
REVOKE SELECT ON public.vw_gastos_centro_custo FROM anon;
REVOKE SELECT ON public.vw_webhooks_recentes FROM anon;

-- 2. Restrict ponto_funcionarios to admin only
DROP POLICY IF EXISTS "Admin/financeiro can view ponto_funcionarios" ON public.ponto_funcionarios;
DROP POLICY IF EXISTS "Admins manage ponto_funcionarios" ON public.ponto_funcionarios;

CREATE POLICY "Admin can view ponto_funcionarios"
  ON public.ponto_funcionarios FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin can manage ponto_funcionarios"
  ON public.ponto_funcionarios FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- 3. Add INSERT policy for rate_limit_logs
CREATE POLICY "System can insert rate limit logs"
  ON public.rate_limit_logs FOR INSERT TO authenticated
  WITH CHECK (true);-- ============================================
-- MOTOR TRIBUTÁRIO — FUNDAÇÃO (Lote 1)
-- Tabelas: faturamento_mensal, folha_pagamento,
--          regimes_simulados, oportunidades_elisao
-- ============================================

-- 1. Faturamento mensal por empresa (base para RBT12)
CREATE TABLE public.faturamento_mensal (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  ano INTEGER NOT NULL CHECK (ano BETWEEN 2020 AND 2050),
  mes INTEGER NOT NULL CHECK (mes BETWEEN 1 AND 12),
  receita_bruta NUMERIC(15,2) NOT NULL DEFAULT 0,
  receita_servicos NUMERIC(15,2) NOT NULL DEFAULT 0,
  receita_revenda NUMERIC(15,2) NOT NULL DEFAULT 0,
  receita_industria NUMERIC(15,2) NOT NULL DEFAULT 0,
  receita_exportacao NUMERIC(15,2) NOT NULL DEFAULT 0,
  observacoes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(empresa_id, ano, mes)
);

CREATE INDEX idx_faturamento_mensal_empresa_periodo
  ON public.faturamento_mensal(empresa_id, ano DESC, mes DESC);

ALTER TABLE public.faturamento_mensal ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authorized roles can view faturamento"
  ON public.faturamento_mensal FOR SELECT
  USING (public.has_any_role(auth.uid(), ARRAY['admin','financeiro','operacional','visualizador']::app_role[]));

CREATE POLICY "Authorized roles can insert faturamento"
  ON public.faturamento_mensal FOR INSERT
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','financeiro','operacional']::app_role[]));

CREATE POLICY "Authorized roles can update faturamento"
  ON public.faturamento_mensal FOR UPDATE
  USING (public.has_any_role(auth.uid(), ARRAY['admin','financeiro','operacional']::app_role[]));

CREATE POLICY "Admin/financeiro can delete faturamento"
  ON public.faturamento_mensal FOR DELETE
  USING (public.has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[]));

CREATE TRIGGER update_faturamento_mensal_updated_at
  BEFORE UPDATE ON public.faturamento_mensal
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Folha de pagamento mensal (base para Fator R)
CREATE TABLE public.folha_pagamento (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  ano INTEGER NOT NULL CHECK (ano BETWEEN 2020 AND 2050),
  mes INTEGER NOT NULL CHECK (mes BETWEEN 1 AND 12),
  salarios NUMERIC(15,2) NOT NULL DEFAULT 0,
  pro_labore NUMERIC(15,2) NOT NULL DEFAULT 0,
  encargos NUMERIC(15,2) NOT NULL DEFAULT 0,
  total_folha NUMERIC(15,2) NOT NULL DEFAULT 0,
  numero_funcionarios INTEGER DEFAULT 0,
  observacoes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(empresa_id, ano, mes)
);

CREATE INDEX idx_folha_pagamento_empresa_periodo
  ON public.folha_pagamento(empresa_id, ano DESC, mes DESC);

ALTER TABLE public.folha_pagamento ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authorized roles can view folha"
  ON public.folha_pagamento FOR SELECT
  USING (public.has_any_role(auth.uid(), ARRAY['admin','financeiro','operacional','visualizador']::app_role[]));

CREATE POLICY "Authorized roles can insert folha"
  ON public.folha_pagamento FOR INSERT
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','financeiro','operacional']::app_role[]));

CREATE POLICY "Authorized roles can update folha"
  ON public.folha_pagamento FOR UPDATE
  USING (public.has_any_role(auth.uid(), ARRAY['admin','financeiro','operacional']::app_role[]));

CREATE POLICY "Admin/financeiro can delete folha"
  ON public.folha_pagamento FOR DELETE
  USING (public.has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[]));

CREATE TRIGGER update_folha_pagamento_updated_at
  BEFORE UPDATE ON public.folha_pagamento
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Regimes simulados (histórico de simulações comparativas)
CREATE TABLE public.regimes_simulados (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  data_simulacao TIMESTAMPTZ NOT NULL DEFAULT now(),
  ano_referencia INTEGER NOT NULL,
  rbt12 NUMERIC(15,2) NOT NULL DEFAULT 0,
  folha_12m NUMERIC(15,2) NOT NULL DEFAULT 0,
  fator_r NUMERIC(6,4),
  regime_atual TEXT,
  regime_recomendado TEXT NOT NULL,
  cenarios JSONB NOT NULL DEFAULT '[]'::jsonb,
  alertas JSONB NOT NULL DEFAULT '[]'::jsonb,
  justificativa TEXT,
  economia_anual_estimada NUMERIC(15,2),
  parametros JSONB,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_regimes_simulados_empresa_data
  ON public.regimes_simulados(empresa_id, data_simulacao DESC);

ALTER TABLE public.regimes_simulados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authorized roles can view regimes simulados"
  ON public.regimes_simulados FOR SELECT
  USING (public.has_any_role(auth.uid(), ARRAY['admin','financeiro','operacional','visualizador']::app_role[]));

CREATE POLICY "Authorized roles can insert regimes simulados"
  ON public.regimes_simulados FOR INSERT
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','financeiro','operacional']::app_role[]));

CREATE POLICY "Admin/financeiro can update regimes simulados"
  ON public.regimes_simulados FOR UPDATE
  USING (public.has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[]));

CREATE POLICY "Admin/financeiro can delete regimes simulados"
  ON public.regimes_simulados FOR DELETE
  USING (public.has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[]));

CREATE TRIGGER update_regimes_simulados_updated_at
  BEFORE UPDATE ON public.regimes_simulados
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Oportunidades de elisão fiscal
CREATE TABLE public.oportunidades_elisao (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  estrategia TEXT NOT NULL,
  categoria TEXT,
  aplicavel BOOLEAN NOT NULL DEFAULT false,
  economia_estimada NUMERIC(15,2),
  base_legal TEXT,
  risco TEXT CHECK (risco IN ('baixo','medio','alto')),
  status TEXT NOT NULL DEFAULT 'identificada' CHECK (status IN ('identificada','em_analise','aprovada','implementada','descartada')),
  observacoes TEXT,
  data_identificacao DATE NOT NULL DEFAULT CURRENT_DATE,
  data_implementacao DATE,
  responsavel UUID,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_oportunidades_elisao_empresa_status
  ON public.oportunidades_elisao(empresa_id, status, data_identificacao DESC);

ALTER TABLE public.oportunidades_elisao ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authorized roles can view oportunidades elisao"
  ON public.oportunidades_elisao FOR SELECT
  USING (public.has_any_role(auth.uid(), ARRAY['admin','financeiro','operacional','visualizador']::app_role[]));

CREATE POLICY "Authorized roles can insert oportunidades elisao"
  ON public.oportunidades_elisao FOR INSERT
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','financeiro','operacional']::app_role[]));

CREATE POLICY "Admin/financeiro can update oportunidades elisao"
  ON public.oportunidades_elisao FOR UPDATE
  USING (public.has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[]));

CREATE POLICY "Admin/financeiro can delete oportunidades elisao"
  ON public.oportunidades_elisao FOR DELETE
  USING (public.has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[]));

CREATE TRIGGER update_oportunidades_elisao_updated_at
  BEFORE UPDATE ON public.oportunidades_elisao
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();-- Catálogo de estratégias de elisão fiscal
CREATE TABLE public.estrategias_elisao_catalogo (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo text NOT NULL UNIQUE,
  nome text NOT NULL,
  descricao text NOT NULL,
  base_legal text NOT NULL,
  risco text NOT NULL CHECK (risco IN ('baixo', 'medio', 'alto')),
  aplicavel_a text[] NOT NULL DEFAULT '{}',
  requisitos jsonb NOT NULL DEFAULT '{}'::jsonb,
  economia_potencial_min numeric,
  economia_potencial_max numeric,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.estrategias_elisao_catalogo ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Catálogo elisão visível para autenticados"
  ON public.estrategias_elisao_catalogo FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins gerenciam catálogo elisão"
  ON public.estrategias_elisao_catalogo FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_estrategias_elisao_updated_at
  BEFORE UPDATE ON public.estrategias_elisao_catalogo
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Benchmarks setoriais
CREATE TABLE public.benchmarks_setoriais (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cnae_prefix text NOT NULL,
  setor text NOT NULL,
  regime text NOT NULL CHECK (regime IN ('simples', 'presumido', 'real')),
  carga_media_pct numeric NOT NULL,
  margem_media_pct numeric NOT NULL,
  fonte text,
  ano_referencia integer NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (cnae_prefix, regime, ano_referencia)
);

ALTER TABLE public.benchmarks_setoriais ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Benchmarks visíveis para autenticados"
  ON public.benchmarks_setoriais FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins gerenciam benchmarks"
  ON public.benchmarks_setoriais FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_benchmarks_setoriais_updated_at
  BEFORE UPDATE ON public.benchmarks_setoriais
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_benchmarks_cnae ON public.benchmarks_setoriais (cnae_prefix);

-- Seed: 9 estratégias de elisão
INSERT INTO public.estrategias_elisao_catalogo (codigo, nome, descricao, base_legal, risco, aplicavel_a, requisitos, economia_potencial_min, economia_potencial_max) VALUES
('MS_LC224', 'Mandado de Segurança LC 224/2025', 'Discussão judicial sobre limites e regras da Lei Complementar 224/2025 (Reforma Tributária) que afetam empresas do Simples Nacional próximas ao sublimite estadual.', 'LC 224/2025; CF/88 art. 5º, LXIX', 'medio', ARRAY['simples'], '{"rbt12_min": 3240000, "proximidade_sublimite_pct": 90}'::jsonb, 0.05, 0.15),
('JCP', 'Juros sobre Capital Próprio', 'Distribuição de JCP como despesa dedutível no Lucro Real, reduzindo IRPJ/CSLL. Limitada a TJLP × PL ou 50% do lucro.', 'Lei 9.249/95 art. 9º; RIR/2018 art. 355', 'baixo', ARRAY['real'], '{"patrimonio_liquido_min": 100000, "lucro_positivo": true}'::jsonb, 0.08, 0.18),
('REINTEGRA', 'Reintegra — Crédito sobre Exportação', 'Apuração de crédito de 0,1% a 3% sobre receita de exportação para devolução de resíduos tributários.', 'Lei 13.043/14; Decreto 8.415/15', 'baixo', ARRAY['simples', 'presumido', 'real'], '{"receita_exportacao_min": 1}'::jsonb, 0.001, 0.03),
('HOLDING', 'Holding Patrimonial / Familiar', 'Constituição de holding para concentrar participações societárias e patrimônio, otimizando ITCMD, sucessão e dividendos. Especialmente relevante com IRPFM (Lei 15.270/2025).', 'Lei 15.270/2025; CC/2002; Lei 6.404/76', 'medio', ARRAY['simples', 'presumido', 'real'], '{"dividendos_anuais_min": 600000}'::jsonb, 0.10, 0.30),
('PAT', 'Programa de Alimentação ao Trabalhador', 'Dedução de até 4% do IRPJ devido para empresas Lucro Real que custeiam alimentação dos funcionários.', 'Lei 6.321/76; Decreto 10.854/21', 'baixo', ARRAY['real'], '{"folha_minima": 50000}'::jsonb, 0.01, 0.04),
('LEI_BEM', 'Lei do Bem — Incentivo P&D', 'Exclusão de até 60% (até 100%) das despesas com Pesquisa & Desenvolvimento da base do IRPJ/CSLL.', 'Lei 11.196/05 cap. III; Decreto 5.798/06', 'medio', ARRAY['real'], '{"despesas_pd_min": 50000}'::jsonb, 0.15, 0.34),
('DRAWBACK', 'Drawback — Suspensão de Tributos', 'Suspensão/restituição de II, IPI, PIS, COFINS, ICMS sobre insumos importados destinados a produto exportado.', 'Lei 11.945/09; Portaria SECEX 23/2011', 'baixo', ARRAY['presumido', 'real'], '{"importacao_min": 100000, "exportacao_min": 100000}'::jsonb, 0.05, 0.20),
('SUBVENCAO_ICMS', 'Subvenção de ICMS — Exclusão da Base IRPJ/CSLL', 'Exclusão dos benefícios fiscais de ICMS da base de cálculo do IRPJ/CSLL (Tema 1.182 STJ).', 'LC 160/17; Lei 12.973/14 art. 30; Tema 1.182 STJ', 'medio', ARRAY['real'], '{"beneficio_icms_min": 10000}'::jsonb, 0.05, 0.34),
('BONIFICACAO', 'Bonificação em Mercadorias', 'Estruturação de bonificações comerciais para reduzir base de cálculo do ICMS, PIS e COFINS.', 'LC 87/96 art. 13; Tema 144 STJ; Lei 10.637/02', 'medio', ARRAY['presumido', 'real'], '{"volume_vendas_min": 500000}'::jsonb, 0.02, 0.09);

-- Seed: benchmarks setoriais (carga total média por setor/regime)
INSERT INTO public.benchmarks_setoriais (cnae_prefix, setor, regime, carga_media_pct, margem_media_pct, fonte, ano_referencia) VALUES
('47', 'Comércio Varejista', 'simples', 6.5, 12.0, 'IBPT 2024', 2025),
('47', 'Comércio Varejista', 'presumido', 11.3, 12.0, 'IBPT 2024', 2025),
('47', 'Comércio Varejista', 'real', 14.8, 12.0, 'IBPT 2024', 2025),
('10', 'Indústria de Alimentos', 'presumido', 13.5, 18.0, 'IBPT 2024', 2025),
('10', 'Indústria de Alimentos', 'real', 16.2, 18.0, 'IBPT 2024', 2025),
('62', 'Tecnologia / Software', 'simples', 8.7, 25.0, 'IBPT 2024', 2025),
('62', 'Tecnologia / Software', 'presumido', 13.3, 25.0, 'IBPT 2024', 2025),
('69', 'Atividades Jurídicas/Contábeis', 'simples', 12.5, 30.0, 'IBPT 2024', 2025);DROP POLICY IF EXISTS "System can insert rate limit logs" ON public.rate_limit_logs;

CREATE POLICY "Authenticated users can insert rate limit logs"
ON public.rate_limit_logs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);-- RPC para histórico de execuções de cron jobs (admin-only)
CREATE OR REPLACE FUNCTION public.get_cron_run_history(p_job_name text DEFAULT NULL, p_limit integer DEFAULT 20)
RETURNS TABLE(
  jobid bigint,
  jobname text,
  runid bigint,
  job_pid integer,
  database text,
  username text,
  command text,
  status text,
  return_message text,
  start_time timestamptz,
  end_time timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem visualizar histórico de cron jobs';
  END IF;

  RETURN QUERY
  SELECT
    j.jobid,
    j.jobname,
    d.runid,
    d.job_pid,
    d.database,
    d.username,
    d.command,
    d.status,
    d.return_message,
    d.start_time,
    d.end_time
  FROM cron.job_run_details d
  JOIN cron.job j ON j.jobid = d.jobid
  WHERE (p_job_name IS NULL OR j.jobname = p_job_name)
  ORDER BY d.start_time DESC
  LIMIT p_limit;
END;
$$;-- Tabela de telemetria de erros frontend
CREATE TABLE public.frontend_error_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  stack TEXT,
  url TEXT,
  user_agent TEXT,
  severity TEXT NOT NULL DEFAULT 'error',
  context JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_frontend_error_logs_user_id ON public.frontend_error_logs(user_id);
CREATE INDEX idx_frontend_error_logs_created_at ON public.frontend_error_logs(created_at DESC);
CREATE INDEX idx_frontend_error_logs_severity ON public.frontend_error_logs(severity);

ALTER TABLE public.frontend_error_logs ENABLE ROW LEVEL SECURITY;

-- Usuários autenticados podem inserir seus próprios erros
CREATE POLICY "Users can insert their own error logs"
ON public.frontend_error_logs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Usuários veem apenas seus próprios erros
CREATE POLICY "Users can view their own error logs"
ON public.frontend_error_logs
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Admins veem todos os erros
CREATE POLICY "Admins can view all error logs"
ON public.frontend_error_logs
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Admins podem deletar erros antigos
CREATE POLICY "Admins can delete error logs"
ON public.frontend_error_logs
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'));-- Bucket privado para relatórios tributários executivos
INSERT INTO storage.buckets (id, name, public)
VALUES ('relatorios-tributarios', 'relatorios-tributarios', false)
ON CONFLICT (id) DO NOTHING;

-- Apenas usuários autenticados podem ler relatórios
CREATE POLICY "Authenticated users can view tax reports"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'relatorios-tributarios');

-- Apenas service_role (edge functions) pode inserir relatórios
CREATE POLICY "Service role can insert tax reports"
ON storage.objects
FOR INSERT
TO service_role
WITH CHECK (bucket_id = 'relatorios-tributarios');

-- Apenas admin pode deletar relatórios
CREATE POLICY "Admins can delete tax reports"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'relatorios-tributarios'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);-- Tabela de logs estruturados das edge functions
CREATE TABLE IF NOT EXISTS public.edge_function_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  function_name TEXT NOT NULL,
  level TEXT NOT NULL CHECK (level IN ('info', 'warn', 'error')),
  event TEXT NOT NULL,
  duration_ms INTEGER,
  status_code INTEGER,
  error_message TEXT,
  context JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_edge_logs_fn_created
  ON public.edge_function_logs (function_name, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_edge_logs_level_created
  ON public.edge_function_logs (level, created_at DESC);

ALTER TABLE public.edge_function_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins podem visualizar logs de edge functions"
  ON public.edge_function_logs
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role pode inserir logs"
  ON public.edge_function_logs
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- View de saúde agregada (últimos 7 dias)
CREATE OR REPLACE VIEW public.vw_edge_health
WITH (security_invoker = true)
AS
SELECT
  function_name,
  COUNT(*) AS total_calls,
  COUNT(*) FILTER (WHERE level = 'error') AS error_count,
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE level = 'error') / NULLIF(COUNT(*), 0),
    2
  ) AS error_rate_pct,
  ROUND(
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY duration_ms)::numeric,
    0
  ) AS p50_ms,
  ROUND(
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY duration_ms)::numeric,
    0
  ) AS p95_ms,
  MAX(created_at) AS last_call_at
FROM public.edge_function_logs
WHERE created_at >= now() - INTERVAL '7 days'
GROUP BY function_name
ORDER BY total_calls DESC;-- Tabela de cache CNPJá
CREATE TABLE public.cnpja_cache (
  cnpj TEXT PRIMARY KEY CHECK (length(cnpj) = 14),
  data JSONB NOT NULL,
  situacao_cadastral TEXT,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_cnpja_cache_expires_at ON public.cnpja_cache(expires_at);

ALTER TABLE public.cnpja_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins podem ver cache CNPJá"
  ON public.cnpja_cache FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Tabela de rate limit CNPJá
CREATE TABLE public.cnpja_rate_limit (
  user_id UUID NOT NULL,
  window_start TIMESTAMPTZ NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, window_start)
);

CREATE INDEX idx_cnpja_rate_limit_window ON public.cnpja_rate_limit(window_start);

ALTER TABLE public.cnpja_rate_limit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuário vê próprio uso CNPJá"
  ON public.cnpja_rate_limit FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Função para verificar e incrementar rate limit
CREATE OR REPLACE FUNCTION public.cnpja_check_rate_limit(
  _user_id UUID,
  _max INTEGER DEFAULT 10,
  _window_minutes INTEGER DEFAULT 60
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_window TIMESTAMPTZ;
  v_count INTEGER;
BEGIN
  v_window := date_trunc('minute', now()) - (EXTRACT(MINUTE FROM now())::INTEGER % _window_minutes) * INTERVAL '1 minute';

  INSERT INTO public.cnpja_rate_limit (user_id, window_start, request_count)
  VALUES (_user_id, v_window, 1)
  ON CONFLICT (user_id, window_start)
  DO UPDATE SET request_count = cnpja_rate_limit.request_count + 1
  RETURNING request_count INTO v_count;

  -- Limpa janelas antigas (best-effort)
  DELETE FROM public.cnpja_rate_limit
  WHERE window_start < now() - INTERVAL '1 day';

  RETURN v_count <= _max;
END;
$$;-- Tabela de convites para contadores (acesso read-only via token)
CREATE TABLE IF NOT EXISTS public.convites_contador (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  nome TEXT,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_convites_contador_empresa ON public.convites_contador(empresa_id);
CREATE INDEX IF NOT EXISTS idx_convites_contador_email ON public.convites_contador(email);
CREATE INDEX IF NOT EXISTS idx_convites_contador_expires ON public.convites_contador(expires_at) WHERE accepted_at IS NULL AND revoked_at IS NULL;

-- Trigger updated_at
DROP TRIGGER IF EXISTS trg_convites_contador_updated_at ON public.convites_contador;
CREATE TRIGGER trg_convites_contador_updated_at
  BEFORE UPDATE ON public.convites_contador
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.convites_contador ENABLE ROW LEVEL SECURITY;

-- Usuário vê convites que criou
CREATE POLICY "Usuario ve proprios convites"
  ON public.convites_contador FOR SELECT TO authenticated
  USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Usuário cria convite (apenas como ele mesmo)
CREATE POLICY "Usuario cria proprio convite"
  ON public.convites_contador FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());

-- Usuário/admin pode revogar (UPDATE limitado a revoked_at)
CREATE POLICY "Usuario revoga proprio convite"
  ON public.convites_contador FOR UPDATE TO authenticated
  USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));-- View otimizada para Dashboard Tributário v2
-- Agrega faturamento mensal × tributos calculados por empresa
CREATE OR REPLACE VIEW public.vw_tributario_dashboard
WITH (security_invoker = true)
AS
SELECT
  e.id AS empresa_id,
  e.razao_social,
  e.regime_tributario,
  EXTRACT(YEAR FROM at_.competencia::date)::int AS ano,
  EXTRACT(MONTH FROM at_.competencia::date)::int AS mes,
  at_.competencia,
  COALESCE(at_.total_geral, 0) AS total_tributos,
  COALESCE(at_.total_tributos_novos, 0) AS tributos_novos,
  COALESCE(at_.total_tributos_residuais, 0) AS tributos_residuais,
  COALESCE(at_.cbs_a_pagar, 0) AS cbs,
  COALESCE(at_.ibs_a_pagar, 0) AS ibs,
  COALESCE(at_.is_a_pagar, 0) AS imposto_seletivo,
  at_.status AS status_apuracao
FROM public.empresas e
LEFT JOIN public.apuracoes_tributarias at_ ON at_.empresa_id = e.id
WHERE e.id IS NOT NULL;

COMMENT ON VIEW public.vw_tributario_dashboard IS
'Dashboard Tributário v2: agrega apurações tributárias por empresa/competência. Security invoker respeita RLS de empresas e apuracoes_tributarias.';

-- Índice em apuracoes_tributarias para acelerar consultas (idempotente)
CREATE INDEX IF NOT EXISTS idx_apuracoes_tributarias_empresa_competencia
  ON public.apuracoes_tributarias (empresa_id, ano DESC, mes DESC);-- ============ 1. CACHE DE DECISÕES DE REGIME ============
CREATE TABLE IF NOT EXISTS public.regime_decision_cache (
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  ano INTEGER NOT NULL,
  mes INTEGER NOT NULL,
  decisao JSONB NOT NULL,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  PRIMARY KEY (empresa_id, ano, mes)
);

CREATE INDEX IF NOT EXISTS idx_regime_decision_cache_expires
  ON public.regime_decision_cache(expires_at);

ALTER TABLE public.regime_decision_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "regime_cache_read_authorized"
  ON public.regime_decision_cache
  FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'financeiro')
  );

-- Service role escreve (sem política = só service_role bypass RLS)

-- Trigger: invalida cache ao inserir/atualizar apuração tributária
CREATE OR REPLACE FUNCTION public.fn_invalidar_regime_cache()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.regime_decision_cache
  WHERE empresa_id = COALESCE(NEW.empresa_id, OLD.empresa_id)
    AND ano = COALESCE(NEW.ano, OLD.ano)
    AND mes = COALESCE(NEW.mes, OLD.mes);
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_invalidar_regime_cache ON public.apuracoes_tributarias;
CREATE TRIGGER trg_invalidar_regime_cache
  AFTER INSERT OR UPDATE OR DELETE ON public.apuracoes_tributarias
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_invalidar_regime_cache();

-- ============ 2. RELATÓRIOS AGENDADOS ============
DO $$ BEGIN
  CREATE TYPE public.frequencia_relatorio AS ENUM ('mensal', 'trimestral', 'anual');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.relatorios_tributarios_agendados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  ano INTEGER NOT NULL,
  frequencia public.frequencia_relatorio NOT NULL DEFAULT 'mensal',
  dia_envio INTEGER NOT NULL DEFAULT 1 CHECK (dia_envio BETWEEN 1 AND 28),
  destinatarios TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ativo BOOLEAN NOT NULL DEFAULT true,
  ultimo_envio_em TIMESTAMPTZ,
  proximo_envio_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rel_trib_agend_proximo
  ON public.relatorios_tributarios_agendados(proximo_envio_em)
  WHERE ativo = true;

CREATE INDEX IF NOT EXISTS idx_rel_trib_agend_empresa
  ON public.relatorios_tributarios_agendados(empresa_id);

ALTER TABLE public.relatorios_tributarios_agendados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rel_trib_agend_admin_fin_select"
  ON public.relatorios_tributarios_agendados
  FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'financeiro')
  );

CREATE POLICY "rel_trib_agend_admin_fin_insert"
  ON public.relatorios_tributarios_agendados
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'financeiro')
  );

CREATE POLICY "rel_trib_agend_admin_fin_update"
  ON public.relatorios_tributarios_agendados
  FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'financeiro')
  );

CREATE POLICY "rel_trib_agend_admin_delete"
  ON public.relatorios_tributarios_agendados
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_rel_trib_agend_updated_at
  BEFORE UPDATE ON public.relatorios_tributarios_agendados
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();-- Tabela de verificações de conformidade fiscal
CREATE TABLE public.verificacoes_conformidade (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  periodo TEXT NOT NULL, -- formato YYYY-MM
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  nivel TEXT NOT NULL CHECK (nivel IN ('excelente', 'bom', 'atencao', 'critico')),
  itens JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_checks INTEGER NOT NULL DEFAULT 0,
  checks_aprovados INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_verif_conf_empresa_periodo
  ON public.verificacoes_conformidade(empresa_id, periodo DESC);

CREATE INDEX idx_verif_conf_created
  ON public.verificacoes_conformidade(created_at DESC);

ALTER TABLE public.verificacoes_conformidade ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin/financeiro/contador podem ler verificacoes"
  ON public.verificacoes_conformidade
  FOR SELECT
  TO authenticated
  USING (
    public.has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[])
    OR public.has_role(auth.uid(), 'visualizador'::app_role)
  );

CREATE POLICY "Service role pode inserir verificacoes"
  ON public.verificacoes_conformidade
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role pode atualizar verificacoes"
  ON public.verificacoes_conformidade
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE TRIGGER trg_verif_conf_updated_at
  BEFORE UPDATE ON public.verificacoes_conformidade
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();-- ============================================
-- LOTE P9 — Auditoria tributária + Benchmark
-- ============================================

DO $$ BEGIN
  CREATE TYPE public.acao_auditoria_tributaria AS ENUM ('insert', 'update', 'delete');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.auditoria_tributaria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID,
  user_id UUID,
  user_email TEXT,
  acao public.acao_auditoria_tributaria NOT NULL,
  entidade_tipo TEXT NOT NULL,
  entidade_id TEXT,
  payload_anterior JSONB,
  payload_novo JSONB,
  ip_address TEXT,
  user_agent TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_auditoria_trib_empresa ON public.auditoria_tributaria(empresa_id, criado_em DESC);
CREATE INDEX IF NOT EXISTS idx_auditoria_trib_user ON public.auditoria_tributaria(user_id, criado_em DESC);
CREATE INDEX IF NOT EXISTS idx_auditoria_trib_entidade ON public.auditoria_tributaria(entidade_tipo, entidade_id);
CREATE INDEX IF NOT EXISTS idx_auditoria_trib_criado ON public.auditoria_tributaria(criado_em DESC);

ALTER TABLE public.auditoria_tributaria ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auditoria_trib_admin_select" ON public.auditoria_tributaria;
CREATE POLICY "auditoria_trib_admin_select"
  ON public.auditoria_tributaria FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.fn_audit_tributario()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_empresa_id UUID;
  v_acao public.acao_auditoria_tributaria;
  v_user_email TEXT;
  v_new_json JSONB;
  v_old_json JSONB;
BEGIN
  v_new_json := CASE WHEN TG_OP IN ('INSERT','UPDATE') THEN to_jsonb(NEW) ELSE NULL END;
  v_old_json := CASE WHEN TG_OP IN ('UPDATE','DELETE') THEN to_jsonb(OLD) ELSE NULL END;

  IF TG_OP = 'INSERT' THEN
    v_acao := 'insert';
    v_empresa_id := (v_new_json->>'empresa_id')::uuid;
  ELSIF TG_OP = 'UPDATE' THEN
    v_acao := 'update';
    v_empresa_id := (v_new_json->>'empresa_id')::uuid;
  ELSE
    v_acao := 'delete';
    v_empresa_id := (v_old_json->>'empresa_id')::uuid;
  END IF;

  SELECT email INTO v_user_email FROM public.profiles WHERE id = auth.uid();

  INSERT INTO public.auditoria_tributaria (
    empresa_id, user_id, user_email, acao, entidade_tipo, entidade_id,
    payload_anterior, payload_novo
  ) VALUES (
    v_empresa_id,
    auth.uid(),
    v_user_email,
    v_acao,
    TG_TABLE_NAME,
    COALESCE((v_new_json->>'id'), (v_old_json->>'id')),
    v_old_json,
    v_new_json
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_apuracoes_tributarias ON public.apuracoes_tributarias;
CREATE TRIGGER trg_audit_apuracoes_tributarias
  AFTER INSERT OR UPDATE OR DELETE ON public.apuracoes_tributarias
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_tributario();

DROP TRIGGER IF EXISTS trg_audit_regime_decision_cache ON public.regime_decision_cache;
CREATE TRIGGER trg_audit_regime_decision_cache
  AFTER INSERT OR UPDATE OR DELETE ON public.regime_decision_cache
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_tributario();

DROP TRIGGER IF EXISTS trg_audit_verificacoes_conformidade ON public.verificacoes_conformidade;
CREATE TRIGGER trg_audit_verificacoes_conformidade
  AFTER INSERT OR UPDATE OR DELETE ON public.verificacoes_conformidade
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_tributario();

DROP TRIGGER IF EXISTS trg_audit_relatorios_agendados ON public.relatorios_tributarios_agendados;
CREATE TRIGGER trg_audit_relatorios_agendados
  AFTER INSERT OR UPDATE OR DELETE ON public.relatorios_tributarios_agendados
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_tributario();

CREATE OR REPLACE VIEW public.vw_auditoria_tributaria_recente
WITH (security_invoker = true)
AS
SELECT
  a.id,
  a.empresa_id,
  e.razao_social AS empresa_nome,
  a.user_id,
  COALESCE(p.full_name, a.user_email, 'Sistema') AS user_nome,
  a.user_email,
  a.acao,
  a.entidade_tipo,
  a.entidade_id,
  a.payload_anterior,
  a.payload_novo,
  a.criado_em
FROM public.auditoria_tributaria a
LEFT JOIN public.profiles p ON p.id = a.user_id
LEFT JOIN public.empresas e ON e.id = a.empresa_id
ORDER BY a.criado_em DESC
LIMIT 1000;

-- Benchmark agregado por regime tributário (única dim disponível na vw)
DROP MATERIALIZED VIEW IF EXISTS public.mv_benchmark_setorial CASCADE;

CREATE MATERIALIZED VIEW public.mv_benchmark_setorial AS
WITH carga AS (
  SELECT
    COALESCE(regime_tributario, 'nao_informado') AS regime,
    empresa_id,
    SUM(total_tributos)::numeric AS total_12m
  FROM public.vw_tributario_dashboard
  WHERE (ano * 12 + mes) >= (EXTRACT(YEAR FROM CURRENT_DATE)::int * 12 + EXTRACT(MONTH FROM CURRENT_DATE)::int - 12)
  GROUP BY regime_tributario, empresa_id
)
SELECT
  regime,
  COUNT(*) AS amostra,
  percentile_cont(0.25) WITHIN GROUP (ORDER BY total_12m) AS p25,
  percentile_cont(0.5)  WITHIN GROUP (ORDER BY total_12m) AS mediana,
  percentile_cont(0.75) WITHIN GROUP (ORDER BY total_12m) AS p75,
  AVG(total_12m) AS media,
  now() AS atualizado_em
FROM carga
GROUP BY regime;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_benchmark_regime ON public.mv_benchmark_setorial(regime);

CREATE OR REPLACE FUNCTION public.refresh_mv_benchmark_setorial()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_benchmark_setorial;
EXCEPTION WHEN OTHERS THEN
  REFRESH MATERIALIZED VIEW public.mv_benchmark_setorial;
END;
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'refresh-benchmark-setorial-weekly') THEN
      PERFORM cron.unschedule('refresh-benchmark-setorial-weekly');
    END IF;
    PERFORM cron.schedule(
      'refresh-benchmark-setorial-weekly',
      '0 3 * * 0',
      $cron$ SELECT public.refresh_mv_benchmark_setorial(); $cron$
    );
  END IF;
END $$;

DO $$ BEGIN
  REFRESH MATERIALIZED VIEW public.mv_benchmark_setorial;
EXCEPTION WHEN OTHERS THEN NULL; END $$;-- Remove acesso público da MV (corrige WARN 0016)
REVOKE ALL ON public.mv_benchmark_setorial FROM anon, authenticated;
GRANT SELECT ON public.mv_benchmark_setorial TO service_role;-- ============================================
-- P10: Fechamento Tributário + Push Subscriptions
-- ============================================

-- Enum de status do fechamento
DO $$ BEGIN
  CREATE TYPE public.status_fechamento_tributario AS ENUM ('aberto', 'em_revisao', 'fechado', 'reaberto');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Tabela de fechamentos tributários mensais
CREATE TABLE IF NOT EXISTS public.fechamentos_tributarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  ano INTEGER NOT NULL,
  mes INTEGER NOT NULL CHECK (mes BETWEEN 1 AND 12),
  periodo TEXT GENERATED ALWAYS AS (lpad(ano::text, 4, '0') || '-' || lpad(mes::text, 2, '0')) STORED,
  status public.status_fechamento_tributario NOT NULL DEFAULT 'aberto',
  checklist JSONB NOT NULL DEFAULT '[]'::jsonb,
  score_conformidade NUMERIC,
  total_apurado NUMERIC,
  observacoes TEXT,
  forcado BOOLEAN NOT NULL DEFAULT false,
  justificativa_forcado TEXT,
  fechado_por UUID,
  fechado_em TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (empresa_id, ano, mes)
);

CREATE INDEX IF NOT EXISTS idx_fechamentos_empresa_periodo ON public.fechamentos_tributarios(empresa_id, ano DESC, mes DESC);
CREATE INDEX IF NOT EXISTS idx_fechamentos_status ON public.fechamentos_tributarios(status);

ALTER TABLE public.fechamentos_tributarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin/financeiro/contador podem ler fechamentos"
  ON public.fechamentos_tributarios FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'financeiro')
  );

CREATE POLICY "Admin/financeiro podem inserir fechamentos"
  ON public.fechamentos_tributarios FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'financeiro')
  );

CREATE POLICY "Admin/financeiro podem atualizar fechamentos abertos"
  ON public.fechamentos_tributarios FOR UPDATE
  TO authenticated
  USING (
    (status <> 'fechado' AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'financeiro')))
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Apenas admin pode deletar fechamentos"
  ON public.fechamentos_tributarios FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_fechamentos_updated_at
  BEFORE UPDATE ON public.fechamentos_tributarios
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger de auditoria P9
CREATE TRIGGER trg_audit_fechamentos
  AFTER INSERT OR UPDATE OR DELETE ON public.fechamentos_tributarios
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_tributario();

-- ============================================
-- Push Subscriptions (Web Push API)
-- ============================================
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, endpoint)
);

CREATE INDEX IF NOT EXISTS idx_push_subs_user ON public.push_subscriptions(user_id) WHERE ativo = true;

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários veem suas subscriptions"
  ON public.push_subscriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Usuários criam suas subscriptions"
  ON public.push_subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários atualizam suas subscriptions"
  ON public.push_subscriptions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários deletam suas subscriptions"
  ON public.push_subscriptions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_push_subs_updated_at
  BEFORE UPDATE ON public.push_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
-- ========================================
-- TABELA: notas_fiscais_ocr
-- ========================================
DO $$ BEGIN
  CREATE TYPE public.status_nf_ocr AS ENUM ('processando', 'sucesso', 'erro');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.notas_fiscais_ocr (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
  arquivo_url TEXT NOT NULL,
  arquivo_nome TEXT,
  arquivo_tipo TEXT,
  status public.status_nf_ocr NOT NULL DEFAULT 'processando',
  dados_extraidos JSONB,
  mensagem_erro TEXT,
  conta_pagar_id UUID REFERENCES public.contas_pagar(id) ON DELETE SET NULL,
  criado_por UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notas_fiscais_ocr_empresa ON public.notas_fiscais_ocr(empresa_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notas_fiscais_ocr_criado_por ON public.notas_fiscais_ocr(criado_por, created_at DESC);

ALTER TABLE public.notas_fiscais_ocr ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários autenticados visualizam NFs OCR"
  ON public.notas_fiscais_ocr FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Usuários autenticados criam NFs OCR"
  ON public.notas_fiscais_ocr FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = criado_por);

CREATE POLICY "Usuários atualizam suas próprias NFs OCR"
  ON public.notas_fiscais_ocr FOR UPDATE
  TO authenticated
  USING (auth.uid() = criado_por OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins deletam NFs OCR"
  ON public.notas_fiscais_ocr FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_notas_fiscais_ocr_updated_at
  BEFORE UPDATE ON public.notas_fiscais_ocr
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_notas_fiscais_ocr_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.notas_fiscais_ocr
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_tributario();

-- ========================================
-- TABELA: resumos_executivos_semanais
-- ========================================
CREATE TABLE IF NOT EXISTS public.resumos_executivos_semanais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
  semana_inicio DATE NOT NULL,
  semana_fim DATE NOT NULL,
  resumo_md TEXT NOT NULL,
  kpis JSONB NOT NULL DEFAULT '{}'::jsonb,
  destinatarios TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  enviado_em TIMESTAMPTZ,
  erro_envio TEXT,
  modelo_ia TEXT DEFAULT 'openai/gpt-5-mini',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (empresa_id, semana_inicio)
);

CREATE INDEX IF NOT EXISTS idx_resumos_executivos_empresa ON public.resumos_executivos_semanais(empresa_id, semana_inicio DESC);

ALTER TABLE public.resumos_executivos_semanais ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários autenticados visualizam resumos executivos"
  ON public.resumos_executivos_semanais FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Service role gerencia resumos executivos"
  ON public.resumos_executivos_semanais FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins gerenciam resumos executivos"
  ON public.resumos_executivos_semanais FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_resumos_executivos_updated_at
  BEFORE UPDATE ON public.resumos_executivos_semanais
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ========================================
-- BUCKET: notas-fiscais-upload (privado)
-- ========================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('notas-fiscais-upload', 'notas-fiscais-upload', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Usuários autenticados fazem upload de NFs"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'notas-fiscais-upload' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Usuários autenticados leem suas NFs"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'notas-fiscais-upload' AND (auth.uid()::text = (storage.foldername(name))[1] OR has_role(auth.uid(), 'admin')));

CREATE POLICY "Usuários deletam suas NFs"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'notas-fiscais-upload' AND (auth.uid()::text = (storage.foldername(name))[1] OR has_role(auth.uid(), 'admin')));
-- ============= ENUMS =============
CREATE TYPE public.tipo_solicitacao_lgpd AS ENUM ('acesso', 'portabilidade', 'exclusao', 'retificacao', 'anonimizacao');
CREATE TYPE public.status_solicitacao_lgpd AS ENUM ('aberta', 'em_analise', 'atendida', 'rejeitada');
CREATE TYPE public.tipo_anomalia AS ENUM ('movimentacao_outlier', 'pagamento_duplicado', 'conta_pagar_alta', 'conciliacao_atrasada', 'mudanca_regime_brusca');
CREATE TYPE public.severidade_anomalia AS ENUM ('baixa', 'media', 'alta', 'critica');
CREATE TYPE public.status_anomalia AS ENUM ('nova', 'investigando', 'falso_positivo', 'confirmada');

-- ============= 1. SOLICITAÇÕES LGPD =============
CREATE TABLE public.solicitacoes_lgpd (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  user_email TEXT NOT NULL,
  tipo public.tipo_solicitacao_lgpd NOT NULL,
  status public.status_solicitacao_lgpd NOT NULL DEFAULT 'aberta',
  justificativa TEXT,
  payload_resposta JSONB,
  url_dump TEXT,
  atendida_em TIMESTAMPTZ,
  atendida_por UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.solicitacoes_lgpd ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários veem suas próprias solicitações"
  ON public.solicitacoes_lgpd FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Usuários criam suas próprias solicitações"
  ON public.solicitacoes_lgpd FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Apenas admin atualiza solicitações"
  ON public.solicitacoes_lgpd FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_solicitacoes_lgpd_updated_at
  BEFORE UPDATE ON public.solicitacoes_lgpd
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_solicitacoes_lgpd_user ON public.solicitacoes_lgpd(user_id, created_at DESC);
CREATE INDEX idx_solicitacoes_lgpd_status ON public.solicitacoes_lgpd(status, created_at DESC);

-- ============= 2. HEALTH SCORES =============
CREATE TABLE public.health_scores_operacionais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID,
  snapshot_data DATE NOT NULL DEFAULT CURRENT_DATE,
  score_total NUMERIC(5,2) NOT NULL,
  score_tributario NUMERIC(5,2) NOT NULL DEFAULT 0,
  score_financeiro NUMERIC(5,2) NOT NULL DEFAULT 0,
  score_operacional NUMERIC(5,2) NOT NULL DEFAULT 0,
  score_lgpd NUMERIC(5,2) NOT NULL DEFAULT 0,
  score_cadastros NUMERIC(5,2) NOT NULL DEFAULT 0,
  score_engajamento NUMERIC(5,2) NOT NULL DEFAULT 0,
  tendencia_pct NUMERIC(6,2),
  insights_md TEXT,
  detalhes JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.health_scores_operacionais ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Apenas admin visualiza health scores"
  ON public.health_scores_operacionais FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Sistema insere health scores via service role"
  ON public.health_scores_operacionais FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_health_scores_empresa_data ON public.health_scores_operacionais(empresa_id, snapshot_data DESC);
CREATE UNIQUE INDEX idx_health_scores_unique ON public.health_scores_operacionais(empresa_id, snapshot_data) WHERE empresa_id IS NOT NULL;

-- ============= 3. ANOMALIAS DETECTADAS =============
CREATE TABLE public.anomalias_detectadas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID,
  entidade_tipo TEXT NOT NULL,
  entidade_id UUID,
  tipo_anomalia public.tipo_anomalia NOT NULL,
  severidade public.severidade_anomalia NOT NULL DEFAULT 'media',
  descricao TEXT NOT NULL,
  dados JSONB,
  status public.status_anomalia NOT NULL DEFAULT 'nova',
  detectada_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolvida_em TIMESTAMPTZ,
  resolvida_por UUID,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.anomalias_detectadas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Apenas admin visualiza anomalias"
  ON public.anomalias_detectadas FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Apenas admin atualiza anomalias"
  ON public.anomalias_detectadas FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Sistema insere anomalias"
  ON public.anomalias_detectadas FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_anomalias_updated_at
  BEFORE UPDATE ON public.anomalias_detectadas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_anomalias_status ON public.anomalias_detectadas(status, detectada_em DESC);
CREATE INDEX idx_anomalias_empresa ON public.anomalias_detectadas(empresa_id, detectada_em DESC);
CREATE INDEX idx_anomalias_severidade ON public.anomalias_detectadas(severidade, status);-- Tabela de ações recomendadas (Centro de Ações Inteligentes)
CREATE TABLE IF NOT EXISTS public.acoes_recomendadas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descricao TEXT NOT NULL,
  urgencia TEXT NOT NULL DEFAULT 'media' CHECK (urgencia IN ('baixa','media','alta','critica')),
  impacto_estimado NUMERIC,
  impacto_tipo TEXT CHECK (impacto_tipo IN ('reais','percentual','score')),
  link_resolucao TEXT,
  fonte TEXT NOT NULL,
  ordem INTEGER NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  gerado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '24 hours'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_acoes_recomendadas_empresa ON public.acoes_recomendadas(empresa_id, expires_at DESC);
CREATE INDEX IF NOT EXISTS idx_acoes_recomendadas_expires ON public.acoes_recomendadas(expires_at);

ALTER TABLE public.acoes_recomendadas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read acoes_recomendadas"
ON public.acoes_recomendadas FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admin manage acoes_recomendadas"
ON public.acoes_recomendadas FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Trigger: notificação push automática ao criar alerta crítico
CREATE OR REPLACE FUNCTION public.fn_notificar_alerta_critico_push()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_url TEXT;
  v_key TEXT;
BEGIN
  IF NEW.prioridade = 'critica' THEN
    v_url := current_setting('app.settings.supabase_url', true);
    v_key := current_setting('app.settings.service_role_key', true);

    IF v_url IS NULL OR v_key IS NULL THEN
      v_url := 'https://iikqosstymnnxaujzadw.supabase.co';
    END IF;

    BEGIN
      PERFORM net.http_post(
        url := v_url || '/functions/v1/enviar-push-notification',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || COALESCE(v_key, '')
        ),
        body := jsonb_build_object(
          'titulo', NEW.titulo,
          'mensagem', NEW.mensagem,
          'user_id', NEW.user_id,
          'url', NEW.acao_url
        )
      );
    EXCEPTION WHEN OTHERS THEN
      NULL; -- não bloqueia inserção
    END;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notificar_alerta_critico_push ON public.alertas;
CREATE TRIGGER trg_notificar_alerta_critico_push
AFTER INSERT ON public.alertas
FOR EACH ROW
EXECUTE FUNCTION public.fn_notificar_alerta_critico_push();-- Tabela: progresso de onboarding por usuário
CREATE TABLE IF NOT EXISTS public.user_onboarding_progress (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  etapas_completas TEXT[] NOT NULL DEFAULT '{}',
  iniciado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  finalizado_em TIMESTAMPTZ,
  pulado BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_onboarding_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuário vê seu próprio progresso"
ON public.user_onboarding_progress FOR SELECT
TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Usuário insere seu próprio progresso"
ON public.user_onboarding_progress FOR INSERT
TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuário atualiza seu próprio progresso"
ON public.user_onboarding_progress FOR UPDATE
TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER trg_user_onboarding_progress_updated
BEFORE UPDATE ON public.user_onboarding_progress
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Tabela: snapshot diário de métricas SLO
CREATE TABLE IF NOT EXISTS public.slo_metrics_diarias (
  data DATE PRIMARY KEY,
  total_requisicoes INTEGER NOT NULL DEFAULT 0,
  latencia_p50_ms INTEGER NOT NULL DEFAULT 0,
  latencia_p95_ms INTEGER NOT NULL DEFAULT 0,
  latencia_p99_ms INTEGER NOT NULL DEFAULT 0,
  taxa_erro_pct NUMERIC(5,2) NOT NULL DEFAULT 0,
  uptime_pct NUMERIC(5,2) NOT NULL DEFAULT 100,
  cron_jobs_sucesso INTEGER NOT NULL DEFAULT 0,
  cron_jobs_falha INTEGER NOT NULL DEFAULT 0,
  edges_health JSONB NOT NULL DEFAULT '{}'::jsonb,
  calculado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.slo_metrics_diarias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Apenas admins visualizam SLO"
ON public.slo_metrics_diarias FOR SELECT
TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role gerencia SLO"
ON public.slo_metrics_diarias FOR ALL
TO service_role USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_slo_data_desc ON public.slo_metrics_diarias (data DESC);DROP POLICY IF EXISTS "Usuários autenticados visualizam NFs OCR" ON public.notas_fiscais_ocr;
CREATE POLICY "Owner ou admin/financeiro visualiza NFs OCR"
ON public.notas_fiscais_ocr
FOR SELECT TO authenticated
USING (
  auth.uid() = criado_por
  OR public.has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[])
);

DROP POLICY IF EXISTS "Usuários autenticados visualizam resumos executivos" ON public.resumos_executivos_semanais;
CREATE POLICY "Admin/financeiro visualiza resumos executivos"
ON public.resumos_executivos_semanais
FOR SELECT TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[]));

DROP POLICY IF EXISTS "Authenticated read acoes_recomendadas" ON public.acoes_recomendadas;
CREATE POLICY "Admin/financeiro lê acoes_recomendadas"
ON public.acoes_recomendadas
FOR SELECT TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[]));

DROP POLICY IF EXISTS "Authenticated users can view tax reports" ON storage.objects;
CREATE POLICY "Admin/financeiro visualiza tax reports"
ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'relatorios-tributarios'
  AND public.has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[])
);
-- Enum tipo SSO
DO $$ BEGIN
  CREATE TYPE public.sso_tipo AS ENUM ('oidc', 'saml');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Tabela principal de provedores SSO
CREATE TABLE public.sso_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  tipo public.sso_tipo NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT false,
  ordem INTEGER NOT NULL DEFAULT 0,
  preset TEXT, -- 'azure', 'okta', 'google', 'onelogin', 'jumpcloud', 'adfs', 'custom'
  
  -- OIDC fields
  client_id TEXT,
  client_secret_ref TEXT, -- nome do secret no Lovable Cloud
  discovery_url TEXT,
  authorization_endpoint TEXT,
  token_endpoint TEXT,
  userinfo_endpoint TEXT,
  jwks_uri TEXT,
  scopes TEXT[] DEFAULT ARRAY['openid','profile','email'],
  
  -- SAML fields
  entity_id_idp TEXT,
  sso_url TEXT,
  slo_url TEXT,
  x509_cert TEXT,
  metadata_xml TEXT,
  name_id_format TEXT DEFAULT 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress',
  signature_algorithm TEXT DEFAULT 'RSA-SHA256',
  
  -- Common config
  allowed_domains TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  claim_mapping JSONB NOT NULL DEFAULT '{"email":"email","full_name":"name","groups":"groups"}'::jsonb,
  default_role public.app_role NOT NULL DEFAULT 'visualizador',
  auto_provision_users BOOLEAN NOT NULL DEFAULT true,
  force_sso_for_domains BOOLEAN NOT NULL DEFAULT false,
  
  ultimo_teste_em TIMESTAMPTZ,
  ultimo_teste_sucesso BOOLEAN,
  ultimo_teste_mensagem TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX idx_sso_providers_ativo ON public.sso_providers(ativo) WHERE ativo = true;
CREATE INDEX idx_sso_providers_domains ON public.sso_providers USING GIN(allowed_domains);

-- Tentativas de login
CREATE TABLE public.sso_login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID REFERENCES public.sso_providers(id) ON DELETE CASCADE,
  email TEXT,
  success BOOLEAN NOT NULL DEFAULT false,
  error_code TEXT,
  error_message TEXT,
  ip_address TEXT,
  user_agent TEXT,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sso_attempts_provider ON public.sso_login_attempts(provider_id, created_at DESC);
CREATE INDEX idx_sso_attempts_created ON public.sso_login_attempts(created_at DESC);

-- Mapeamento de grupos -> roles
CREATE TABLE public.sso_role_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES public.sso_providers(id) ON DELETE CASCADE,
  idp_group TEXT NOT NULL,
  app_role public.app_role NOT NULL,
  ordem INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(provider_id, idp_group)
);

CREATE INDEX idx_sso_role_mappings_provider ON public.sso_role_mappings(provider_id);

-- Validação: force_sso requer allowed_domains
CREATE OR REPLACE FUNCTION public.fn_validar_sso_provider()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.force_sso_for_domains = true AND (NEW.allowed_domains IS NULL OR array_length(NEW.allowed_domains, 1) IS NULL) THEN
    RAISE EXCEPTION 'force_sso_for_domains requer ao menos um domínio em allowed_domains';
  END IF;
  
  IF NEW.tipo = 'oidc' AND NEW.ativo = true AND (NEW.client_id IS NULL OR (NEW.discovery_url IS NULL AND NEW.authorization_endpoint IS NULL)) THEN
    RAISE EXCEPTION 'Provedor OIDC ativo requer client_id e discovery_url ou endpoints manuais';
  END IF;
  
  IF NEW.tipo = 'saml' AND NEW.ativo = true AND (NEW.sso_url IS NULL OR NEW.x509_cert IS NULL) THEN
    RAISE EXCEPTION 'Provedor SAML ativo requer sso_url e x509_cert';
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validar_sso_provider
  BEFORE INSERT OR UPDATE ON public.sso_providers
  FOR EACH ROW EXECUTE FUNCTION public.fn_validar_sso_provider();

-- Trigger updated_at
CREATE TRIGGER trg_sso_providers_updated
  BEFORE UPDATE ON public.sso_providers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger de auditoria (redacted secrets)
CREATE OR REPLACE FUNCTION public.fn_audit_sso_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old jsonb;
  v_new jsonb;
BEGIN
  v_old := CASE WHEN TG_OP IN ('UPDATE','DELETE') THEN to_jsonb(OLD) - 'client_secret_ref' ELSE NULL END;
  v_new := CASE WHEN TG_OP IN ('INSERT','UPDATE') THEN to_jsonb(NEW) - 'client_secret_ref' ELSE NULL END;
  
  PERFORM public.log_audit(
    TG_OP::audit_action,
    TG_TABLE_NAME,
    COALESCE(NEW.id::text, OLD.id::text),
    v_old,
    v_new,
    'SSO provider change'
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_audit_sso_providers
  AFTER INSERT OR UPDATE OR DELETE ON public.sso_providers
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_sso_changes();

-- RLS
ALTER TABLE public.sso_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sso_login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sso_role_mappings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins gerenciam SSO providers"
  ON public.sso_providers FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins veem tentativas SSO"
  ON public.sso_login_attempts FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Sistema insere tentativas SSO"
  ON public.sso_login_attempts FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

CREATE POLICY "Admins gerenciam role mappings"
  ON public.sso_role_mappings FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Sistema insere tentativas SSO" ON public.sso_login_attempts;

-- Função SECURITY DEFINER para registro controlado
CREATE OR REPLACE FUNCTION public.registrar_tentativa_sso(
  _provider_id UUID,
  _email TEXT,
  _success BOOLEAN,
  _error_code TEXT DEFAULT NULL,
  _error_message TEXT DEFAULT NULL,
  _ip TEXT DEFAULT NULL,
  _user_agent TEXT DEFAULT NULL,
  _duration_ms INTEGER DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO public.sso_login_attempts (
    provider_id, email, success, error_code, error_message,
    ip_address, user_agent, duration_ms
  ) VALUES (
    _provider_id, _email, _success, _error_code, _error_message,
    _ip, _user_agent, _duration_ms
  ) RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.registrar_tentativa_sso(UUID,TEXT,BOOLEAN,TEXT,TEXT,TEXT,TEXT,INTEGER) FROM public;
GRANT EXECUTE ON FUNCTION public.registrar_tentativa_sso(UUID,TEXT,BOOLEAN,TEXT,TEXT,TEXT,TEXT,INTEGER) TO authenticated, anon;
CREATE INDEX IF NOT EXISTS idx_feedback_concil_created ON public.feedback_conciliacao_ia(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_anomalias_detectada_sev_status ON public.anomalias_detectadas(severidade, status, detectada_em DESC);-- Tabela de pacotes de evidências exportados
CREATE TABLE public.evidencias_pacotes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  gerado_por UUID,
  gerado_por_email TEXT,
  periodo_inicio DATE NOT NULL,
  periodo_fim DATE NOT NULL,
  escopos TEXT[] NOT NULL,
  storage_path TEXT NOT NULL,
  manifest JSONB NOT NULL DEFAULT '{}'::jsonb,
  tamanho_bytes BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.evidencias_pacotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins veem pacotes de evidências"
  ON public.evidencias_pacotes FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins inserem pacotes de evidências"
  ON public.evidencias_pacotes FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_evidencias_pacotes_created ON public.evidencias_pacotes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_auditoria_financeira_created ON public.auditoria_financeira(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_auditoria_tributaria_criado ON public.auditoria_tributaria(criado_em DESC);
-- Complementa plano_contas existente
ALTER TABLE public.plano_contas
  ADD COLUMN IF NOT EXISTS empresa_id UUID,
  ADD COLUMN IF NOT EXISTS centro_resultado TEXT,
  ADD COLUMN IF NOT EXISTS codigo_referencial TEXT;

CREATE INDEX IF NOT EXISTS idx_plano_contas_empresa ON public.plano_contas(empresa_id);

-- 2. Lançamentos Contábeis (cabeçalho)
CREATE TABLE public.lancamentos_contabeis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL,
  numero_lancamento BIGINT,
  data_lancamento DATE NOT NULL,
  historico TEXT NOT NULL,
  origem TEXT NOT NULL DEFAULT 'manual' CHECK (origem IN ('manual','conta_pagar','conta_receber','movimentacao','importacao','sistema')),
  origem_id UUID,
  valor_total NUMERIC(15,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'confirmado' CHECK (status IN ('rascunho','confirmado','cancelado')),
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_lanc_emp_data ON public.lancamentos_contabeis(empresa_id, data_lancamento DESC);
CREATE INDEX idx_lanc_origem ON public.lancamentos_contabeis(origem, origem_id);

ALTER TABLE public.lancamentos_contabeis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lanc_select" ON public.lancamentos_contabeis FOR SELECT TO authenticated
  USING (has_any_role(auth.uid(), ARRAY['admin','financeiro','operacional','visualizador']::app_role[]));
CREATE POLICY "lanc_insert" ON public.lancamentos_contabeis FOR INSERT TO authenticated
  WITH CHECK (has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[]));
CREATE POLICY "lanc_update" ON public.lancamentos_contabeis FOR UPDATE TO authenticated
  USING (has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[]));
CREATE POLICY "lanc_delete" ON public.lancamentos_contabeis FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_lanc_updated BEFORE UPDATE ON public.lancamentos_contabeis
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Sequência por exercício
CREATE OR REPLACE FUNCTION public.fn_lanc_numero_sequencial()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_ano INT; v_seq BIGINT;
BEGIN
  IF NEW.numero_lancamento IS NULL THEN
    v_ano := EXTRACT(YEAR FROM NEW.data_lancamento);
    SELECT COALESCE(MAX(numero_lancamento),0)+1 INTO v_seq
      FROM public.lancamentos_contabeis
      WHERE empresa_id = NEW.empresa_id
        AND EXTRACT(YEAR FROM data_lancamento) = v_ano;
    NEW.numero_lancamento := v_seq;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_lanc_numero BEFORE INSERT ON public.lancamentos_contabeis
  FOR EACH ROW EXECUTE FUNCTION public.fn_lanc_numero_sequencial();

-- 3. Partidas Contábeis (D/C)
CREATE TABLE public.partidas_contabeis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lancamento_id UUID NOT NULL REFERENCES public.lancamentos_contabeis(id) ON DELETE CASCADE,
  conta_id UUID NOT NULL REFERENCES public.plano_contas(id) ON DELETE RESTRICT,
  tipo CHAR(1) NOT NULL CHECK (tipo IN ('D','C')),
  valor NUMERIC(15,2) NOT NULL CHECK (valor > 0),
  historico_complementar TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_partidas_lanc ON public.partidas_contabeis(lancamento_id);
CREATE INDEX idx_partidas_conta ON public.partidas_contabeis(conta_id);

ALTER TABLE public.partidas_contabeis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "partidas_select" ON public.partidas_contabeis FOR SELECT TO authenticated
  USING (has_any_role(auth.uid(), ARRAY['admin','financeiro','operacional','visualizador']::app_role[]));
CREATE POLICY "partidas_insert" ON public.partidas_contabeis FOR INSERT TO authenticated
  WITH CHECK (has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[]));
CREATE POLICY "partidas_update" ON public.partidas_contabeis FOR UPDATE TO authenticated
  USING (has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[]));
CREATE POLICY "partidas_delete" ON public.partidas_contabeis FOR DELETE TO authenticated
  USING (has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[]));

-- 4. SPED Contábil arquivos gerados
CREATE TABLE public.sped_contabil_arquivos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('ECD','ECF')),
  ano_calendario INT NOT NULL,
  periodo_inicio DATE NOT NULL,
  periodo_fim DATE NOT NULL,
  storage_path TEXT NOT NULL,
  hash_sha256 TEXT,
  total_linhas INT,
  total_lancamentos INT,
  validacoes JSONB NOT NULL DEFAULT '{"erros":[],"avisos":[]}'::jsonb,
  status TEXT NOT NULL DEFAULT 'gerado' CHECK (status IN ('gerado','validado','transmitido','rejeitado')),
  recibo_transmissao TEXT,
  gerado_por UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_sped_contabil_empresa_ano ON public.sped_contabil_arquivos(empresa_id, ano_calendario DESC);

ALTER TABLE public.sped_contabil_arquivos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sped_contabil_select" ON public.sped_contabil_arquivos FOR SELECT TO authenticated
  USING (has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[]));
CREATE POLICY "sped_contabil_insert" ON public.sped_contabil_arquivos FOR INSERT TO authenticated
  WITH CHECK (has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[]));
CREATE POLICY "sped_contabil_update" ON public.sped_contabil_arquivos FOR UPDATE TO authenticated
  USING (has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[]));
-- 1) Multi-empresa: vínculo usuário ↔ empresa com papel por empresa
CREATE TABLE public.user_empresas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL DEFAULT 'visualizador',
  is_default BOOLEAN NOT NULL DEFAULT false,
  provisioned_via TEXT NOT NULL DEFAULT 'manual' CHECK (provisioned_via IN ('manual','sso','scim')),
  scim_external_id TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, empresa_id)
);
CREATE INDEX idx_user_empresas_user ON public.user_empresas(user_id);
CREATE INDEX idx_user_empresas_empresa ON public.user_empresas(empresa_id);
CREATE INDEX idx_user_empresas_scim ON public.user_empresas(scim_external_id) WHERE scim_external_id IS NOT NULL;

ALTER TABLE public.user_empresas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own empresa links"
  ON public.user_empresas FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage user_empresas"
  ON public.user_empresas FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_user_empresas_updated
  BEFORE UPDATE ON public.user_empresas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Helper: papel em empresa específica
CREATE OR REPLACE FUNCTION public.has_role_in_empresa(_user UUID, _empresa UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_empresas
    WHERE user_id = _user AND empresa_id = _empresa AND role = _role AND ativo = true
  );
$$;

-- 2) Vínculo provedor SSO ↔ empresa
ALTER TABLE public.sso_providers
  ADD COLUMN empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE;
CREATE INDEX idx_sso_providers_empresa ON public.sso_providers(empresa_id);

-- 3) Tokens SCIM (bearer hash SHA-256)
CREATE TABLE public.scim_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID REFERENCES public.sso_providers(id) ON DELETE CASCADE,
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  token_prefix TEXT NOT NULL,
  nome TEXT NOT NULL,
  expires_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_scim_tokens_empresa ON public.scim_tokens(empresa_id);
CREATE INDEX idx_scim_tokens_hash ON public.scim_tokens(token_hash) WHERE ativo = true;

ALTER TABLE public.scim_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage scim_tokens"
  ON public.scim_tokens FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 4) Log SCIM
CREATE TABLE public.scim_operations_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id UUID REFERENCES public.scim_tokens(id) ON DELETE SET NULL,
  empresa_id UUID,
  resource_type TEXT NOT NULL,
  operation TEXT NOT NULL,
  external_id TEXT,
  user_id UUID,
  status_code INT NOT NULL,
  request_body JSONB,
  response_body JSONB,
  duration_ms INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_scim_log_token ON public.scim_operations_log(token_id, created_at DESC);
CREATE INDEX idx_scim_log_empresa ON public.scim_operations_log(empresa_id, created_at DESC);

ALTER TABLE public.scim_operations_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view scim logs"
  ON public.scim_operations_log FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 5) Estado OIDC PKCE em sso_login_attempts
ALTER TABLE public.sso_login_attempts
  ADD COLUMN IF NOT EXISTS state TEXT,
  ADD COLUMN IF NOT EXISTS code_verifier_hash TEXT,
  ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES public.empresas(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_sso_attempts_state ON public.sso_login_attempts(state) WHERE state IS NOT NULL;ALTER TABLE public.anomalias_detectadas REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.anomalias_detectadas;CREATE TABLE IF NOT EXISTS public.saved_filters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  name TEXT NOT NULL,
  filters JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_filter_name_per_user_entity UNIQUE (user_id, entity_type, name)
);

CREATE INDEX IF NOT EXISTS idx_saved_filters_user_entity
  ON public.saved_filters(user_id, entity_type);

CREATE INDEX IF NOT EXISTS idx_saved_filters_default
  ON public.saved_filters(user_id, entity_type, is_default)
  WHERE is_default = true;

ALTER TABLE public.saved_filters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own filters" ON public.saved_filters
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own filters" ON public.saved_filters
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own filters" ON public.saved_filters
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own filters" ON public.saved_filters
  FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER trigger_saved_filters_updated_at
  BEFORE UPDATE ON public.saved_filters
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.ensure_single_default_filter()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.is_default = true THEN
    UPDATE public.saved_filters
    SET is_default = false
    WHERE user_id = NEW.user_id
      AND entity_type = NEW.entity_type
      AND id != NEW.id
      AND is_default = true;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_single_default_filter
  BEFORE INSERT OR UPDATE OF is_default ON public.saved_filters
  FOR EACH ROW
  WHEN (NEW.is_default = true)
  EXECUTE FUNCTION public.ensure_single_default_filter();-- 1. Preferências de alerta de anomalias por usuário
CREATE TABLE public.user_anomalia_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  toast_enabled BOOLEAN NOT NULL DEFAULT true,
  toast_min_severidade TEXT NOT NULL DEFAULT 'critica' CHECK (toast_min_severidade IN ('baixa','media','alta','critica')),
  silenciar_ate TIMESTAMPTZ,
  centros_custo_silenciados UUID[] NOT NULL DEFAULT '{}',
  tipos_silenciados TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_anomalia_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users select own anomalia prefs"
  ON public.user_anomalia_preferences FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "users insert own anomalia prefs"
  ON public.user_anomalia_preferences FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users update own anomalia prefs"
  ON public.user_anomalia_preferences FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "users delete own anomalia prefs"
  ON public.user_anomalia_preferences FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER trg_user_anomalia_prefs_updated
  BEFORE UPDATE ON public.user_anomalia_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Vincular anomalias a centro de custo (nullable)
ALTER TABLE public.anomalias_detectadas
  ADD COLUMN IF NOT EXISTS centro_custo_id UUID;

CREATE INDEX IF NOT EXISTS idx_anomalias_centro_custo
  ON public.anomalias_detectadas(centro_custo_id)
  WHERE centro_custo_id IS NOT NULL;

-- 3. Backfill best-effort
UPDATE public.anomalias_detectadas a
SET centro_custo_id = cp.centro_custo_id
FROM public.contas_pagar cp
WHERE a.entidade_tipo = 'conta_pagar'
  AND a.centro_custo_id IS NULL
  AND a.entidade_id IS NOT NULL
  AND a.entidade_id::uuid = cp.id
  AND cp.centro_custo_id IS NOT NULL;

UPDATE public.anomalias_detectadas a
SET centro_custo_id = m.centro_custo_id
FROM public.movimentacoes m
WHERE a.entidade_tipo = 'movimentacao'
  AND a.centro_custo_id IS NULL
  AND a.entidade_id IS NOT NULL
  AND a.entidade_id::uuid = m.id
  AND m.centro_custo_id IS NOT NULL;ALTER TABLE public.anomalias_detectadas
  ADD COLUMN IF NOT EXISTS bitrix_task_id text;-- Garantir REPLICA IDENTITY FULL para enviar payload completo nos eventos realtime
ALTER TABLE public.audit_logs REPLICA IDENTITY FULL;

-- Adicionar tabela à publicação supabase_realtime (idempotente)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'audit_logs'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.audit_logs';
  END IF;
END $$;ALTER TABLE public.sso_login_attempts ADD COLUMN IF NOT EXISTS app_redirect text;-- Adiciona colunas de telemetria do onboarding
ALTER TABLE public.sso_login_attempts
  ADD COLUMN IF NOT EXISTS event_type text,
  ADD COLUMN IF NOT EXISTS context jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_sso_login_attempts_email_created
  ON public.sso_login_attempts (email, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_sso_login_attempts_event_type_created
  ON public.sso_login_attempts (event_type, created_at DESC);

-- RPC para registrar eventos do onboarding (executável por anon e authenticated)
CREATE OR REPLACE FUNCTION public.log_sso_onboarding_event(
  _email text,
  _event_type text,
  _provider_id uuid DEFAULT NULL,
  _context jsonb DEFAULT '{}'::jsonb,
  _success boolean DEFAULT true,
  _error_code text DEFAULT NULL,
  _error_message text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  IF _event_type NOT IN (
    'domain_resolved','auto_redirect_started','auto_redirect_cancelled',
    'manual_provider_selected','redirect_dispatched','redirect_failed',
    'password_fallback_used'
  ) THEN
    RAISE EXCEPTION 'event_type inválido: %', _event_type;
  END IF;

  INSERT INTO public.sso_login_attempts(
    provider_id, email, success, error_code, error_message,
    event_type, context
  ) VALUES (
    _provider_id,
    NULLIF(lower(trim(COALESCE(_email,''))), ''),
    _success,
    _error_code,
    _error_message,
    _event_type,
    COALESCE(_context, '{}'::jsonb)
  ) RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.log_sso_onboarding_event(text, text, uuid, jsonb, boolean, text, text) TO anon, authenticated;
CREATE TABLE public.sso_sandbox_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by_email text,
  provider_id uuid REFERENCES public.sso_providers(id) ON DELETE SET NULL,
  provider_nome text,
  use_provider_config boolean NOT NULL DEFAULT true,
  input jsonb NOT NULL,
  result jsonb NOT NULL,
  outcome text NOT NULL CHECK (outcome IN ('bloqueado','seria_jit','usuario_existente','sem_email')),
  email_masked text,
  resolved_role text,
  matched_group text,
  has_errors boolean NOT NULL DEFAULT false
);

CREATE INDEX idx_sso_sandbox_runs_created_at ON public.sso_sandbox_runs (created_at DESC);
CREATE INDEX idx_sso_sandbox_runs_provider ON public.sso_sandbox_runs (provider_id, created_at DESC);
CREATE INDEX idx_sso_sandbox_runs_outcome ON public.sso_sandbox_runs (outcome, created_at DESC);

ALTER TABLE public.sso_sandbox_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read sandbox runs"
  ON public.sso_sandbox_runs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins insert sandbox runs"
  ON public.sso_sandbox_runs FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') AND auth.uid() = created_by);

CREATE POLICY "Admins delete sandbox runs"
  ON public.sso_sandbox_runs FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
ALTER TABLE public.sso_sandbox_runs ADD COLUMN IF NOT EXISTS batch_id uuid NULL;
CREATE INDEX IF NOT EXISTS idx_sso_sandbox_runs_batch_id ON public.sso_sandbox_runs(batch_id) WHERE batch_id IS NOT NULL;ALTER TABLE public.user_anomalia_preferences
  ADD COLUMN IF NOT EXISTS toast_severidades_ativas TEXT[]
    NOT NULL DEFAULT ARRAY['critica','alta']::TEXT[],
  ADD COLUMN IF NOT EXISTS toast_duracao_segundos INT
    NOT NULL DEFAULT 12,
  ADD COLUMN IF NOT EXISTS toast_acoes JSONB
    NOT NULL DEFAULT '{"drill_down":true,"abrir_pagina":true,"copiar_id":false,"marcar_lida":false}'::jsonb,
  ADD COLUMN IF NOT EXISTS drawer_acoes JSONB
    NOT NULL DEFAULT '{"abrir_entidade":true,"pagina_completa":true,"copiar_id":false,"marcar_lida":false}'::jsonb;

CREATE OR REPLACE FUNCTION public.validate_user_anomalia_preferences()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  sev TEXT;
BEGIN
  IF NEW.toast_duracao_segundos < 3 OR NEW.toast_duracao_segundos > 30 THEN
    RAISE EXCEPTION 'toast_duracao_segundos deve estar entre 3 e 30 segundos';
  END IF;

  IF NEW.toast_severidades_ativas IS NOT NULL THEN
    FOREACH sev IN ARRAY NEW.toast_severidades_ativas LOOP
      IF sev NOT IN ('baixa','media','alta','critica') THEN
        RAISE EXCEPTION 'Severidade invalida em toast_severidades_ativas: %', sev;
      END IF;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_user_anomalia_preferences
  ON public.user_anomalia_preferences;

CREATE TRIGGER trg_validate_user_anomalia_preferences
  BEFORE INSERT OR UPDATE ON public.user_anomalia_preferences
  FOR EACH ROW EXECUTE FUNCTION public.validate_user_anomalia_preferences();
-- 1) Novas colunas
ALTER TABLE public.saved_filters
  ADD COLUMN IF NOT EXISTS empresa_id uuid NULL,
  ADD COLUMN IF NOT EXISTS shared_with_roles public.app_role[] NOT NULL DEFAULT ARRAY[]::public.app_role[],
  ADD COLUMN IF NOT EXISTS is_shared boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS created_by uuid NULL;

-- Backfill: created_by = user_id
UPDATE public.saved_filters SET created_by = user_id WHERE created_by IS NULL;

-- Index para lookups por empresa
CREATE INDEX IF NOT EXISTS idx_saved_filters_empresa_shared
  ON public.saved_filters (empresa_id, entity_type)
  WHERE is_shared = true;

-- 2) Função helper: papel do usuário na empresa
CREATE OR REPLACE FUNCTION public.user_role_in_empresa(_user_id uuid, _empresa_id uuid)
RETURNS public.app_role
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role FROM public.user_empresas
  WHERE user_id = _user_id AND empresa_id = _empresa_id AND ativo = true
  LIMIT 1;
$$;

-- 3) Atualiza políticas RLS
DROP POLICY IF EXISTS "Users can view own filters" ON public.saved_filters;
DROP POLICY IF EXISTS "Users can insert own filters" ON public.saved_filters;
DROP POLICY IF EXISTS "Users can update own filters" ON public.saved_filters;
DROP POLICY IF EXISTS "Users can delete own filters" ON public.saved_filters;

-- SELECT: próprios + compartilhados na mesma empresa cujo papel está na lista
CREATE POLICY "saved_filters_select"
  ON public.saved_filters FOR SELECT
  USING (
    auth.uid() = user_id
    OR (
      is_shared = true
      AND empresa_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM public.user_empresas ue
        WHERE ue.user_id = auth.uid()
          AND ue.empresa_id = saved_filters.empresa_id
          AND ue.ativo = true
          AND (
            cardinality(saved_filters.shared_with_roles) = 0
            OR ue.role = ANY(saved_filters.shared_with_roles)
          )
      )
    )
  );

-- INSERT: usuário cria para si; se compartilhar, precisa pertencer à empresa
CREATE POLICY "saved_filters_insert"
  ON public.saved_filters FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND (created_by IS NULL OR created_by = auth.uid())
    AND (
      is_shared = false
      OR (
        empresa_id IS NOT NULL
        AND EXISTS (
          SELECT 1 FROM public.user_empresas ue
          WHERE ue.user_id = auth.uid()
            AND ue.empresa_id = saved_filters.empresa_id
            AND ue.ativo = true
        )
      )
    )
  );

-- UPDATE: somente criador (ou dono original)
CREATE POLICY "saved_filters_update"
  ON public.saved_filters FOR UPDATE
  USING (auth.uid() = COALESCE(created_by, user_id))
  WITH CHECK (auth.uid() = COALESCE(created_by, user_id));

-- DELETE: somente criador
CREATE POLICY "saved_filters_delete"
  ON public.saved_filters FOR DELETE
  USING (auth.uid() = COALESCE(created_by, user_id));

-- 4) Função para duplicar um filtro acessível para o usuário atual
CREATE OR REPLACE FUNCTION public.duplicate_saved_filter(
  _source_id uuid,
  _new_name text
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_src public.saved_filters%ROWTYPE;
  v_uid uuid := auth.uid();
  v_new_id uuid;
  v_can_see boolean;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  SELECT * INTO v_src FROM public.saved_filters WHERE id = _source_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Filtro não encontrado';
  END IF;

  -- Reusa a checagem de visibilidade da política
  SELECT (
    v_src.user_id = v_uid
    OR (
      v_src.is_shared = true
      AND v_src.empresa_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM public.user_empresas ue
        WHERE ue.user_id = v_uid
          AND ue.empresa_id = v_src.empresa_id
          AND ue.ativo = true
          AND (
            cardinality(v_src.shared_with_roles) = 0
            OR ue.role = ANY(v_src.shared_with_roles)
          )
      )
    )
  ) INTO v_can_see;

  IF NOT v_can_see THEN
    RAISE EXCEPTION 'Sem acesso ao filtro de origem';
  END IF;

  INSERT INTO public.saved_filters (
    user_id, created_by, entity_type, name, filters, is_default,
    empresa_id, shared_with_roles, is_shared
  ) VALUES (
    v_uid, v_uid, v_src.entity_type,
    COALESCE(NULLIF(trim(_new_name), ''), v_src.name || ' (cópia)'),
    v_src.filters,
    false,
    NULL, ARRAY[]::public.app_role[], false
  )
  RETURNING id INTO v_new_id;

  RETURN v_new_id;
END;
$$;
-- Tabela de assinaturas de filtros salvos
CREATE TABLE IF NOT EXISTS public.saved_filter_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  saved_filter_id UUID NOT NULL REFERENCES public.saved_filters(id) ON DELETE CASCADE,
  notify_inapp BOOLEAN NOT NULL DEFAULT true,
  notify_push BOOLEAN NOT NULL DEFAULT false,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, saved_filter_id)
);

CREATE INDEX IF NOT EXISTS idx_sfs_user ON public.saved_filter_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_sfs_filter ON public.saved_filter_subscriptions(saved_filter_id);

ALTER TABLE public.saved_filter_subscriptions ENABLE ROW LEVEL SECURITY;

-- Helper: usuário pode "ver" o filtro salvo (mesma lógica usada em duplicate_saved_filter)
CREATE OR REPLACE FUNCTION public.can_access_saved_filter(_filter_id UUID, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.saved_filters sf
    WHERE sf.id = _filter_id
      AND (
        sf.user_id = _user_id
        OR (
          sf.is_shared = true
          AND sf.empresa_id IS NOT NULL
          AND EXISTS (
            SELECT 1 FROM public.user_empresas ue
            WHERE ue.user_id = _user_id
              AND ue.empresa_id = sf.empresa_id
              AND ue.ativo = true
              AND (
                cardinality(sf.shared_with_roles) = 0
                OR ue.role = ANY(sf.shared_with_roles)
              )
          )
        )
      )
  )
$$;

-- RLS: apenas o próprio dono manipula suas assinaturas, e o filtro precisa ser acessível
CREATE POLICY "users select own subscriptions"
  ON public.saved_filter_subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "users insert own subscriptions"
  ON public.saved_filter_subscriptions
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND public.can_access_saved_filter(saved_filter_id, auth.uid())
  );

CREATE POLICY "users update own subscriptions"
  ON public.saved_filter_subscriptions
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND public.can_access_saved_filter(saved_filter_id, auth.uid())
  );

CREATE POLICY "users delete own subscriptions"
  ON public.saved_filter_subscriptions
  FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger updated_at
CREATE TRIGGER trg_sfs_updated_at
  BEFORE UPDATE ON public.saved_filter_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Realtime já está geralmente habilitado em anomalias_detectadas; garantir:
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'anomalias_detectadas'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.anomalias_detectadas';
  END IF;
END $$;ALTER TABLE public.feedback_conciliacao_ia
ADD COLUMN IF NOT EXISTS transacao_bancaria_id UUID REFERENCES public.transacoes_bancarias(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_feedback_conciliacao_ia_transacao_bancaria_id
  ON public.feedback_conciliacao_ia(transacao_bancaria_id);CREATE TABLE public.anomalia_detection_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  triggered_by UUID,
  trigger_source TEXT NOT NULL DEFAULT 'manual',
  status TEXT NOT NULL DEFAULT 'queued',
  current_step TEXT,
  step_index INT NOT NULL DEFAULT 0,
  total_steps INT NOT NULL DEFAULT 5,
  candidatas INT NOT NULL DEFAULT 0,
  inseridas INT NOT NULL DEFAULT 0,
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  duration_ms INT,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_anomalia_runs_status ON public.anomalia_detection_runs(status, created_at DESC);
CREATE INDEX idx_anomalia_runs_created ON public.anomalia_detection_runs(created_at DESC);

ALTER TABLE public.anomalia_detection_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins podem visualizar execuções de detecção"
ON public.anomalia_detection_runs FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins podem criar execuções de detecção"
ON public.anomalia_detection_runs FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins podem atualizar execuções de detecção"
ON public.anomalia_detection_runs FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

ALTER PUBLICATION supabase_realtime ADD TABLE public.anomalia_detection_runs;
ALTER TABLE public.anomalia_detection_runs REPLICA IDENTITY FULL;
CREATE TRIGGER trg_audit_lancamentos_contabeis
AFTER INSERT OR UPDATE OR DELETE ON public.lancamentos_contabeis
FOR EACH ROW EXECUTE FUNCTION public.fn_auditoria_financeira();

CREATE TRIGGER trg_audit_partidas_contabeis
AFTER INSERT OR UPDATE OR DELETE ON public.partidas_contabeis
FOR EACH ROW EXECUTE FUNCTION public.fn_auditoria_financeira();
create table if not exists public.user_active_filters (
  user_id uuid not null references auth.users(id) on delete cascade,
  entity_type text not null,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, entity_type)
);

alter table public.user_active_filters enable row level security;

create policy "own active filters select"
  on public.user_active_filters for select
  using (user_id = auth.uid());

create policy "own active filters insert"
  on public.user_active_filters for insert
  with check (user_id = auth.uid());

create policy "own active filters update"
  on public.user_active_filters for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "own active filters delete"
  on public.user_active_filters for delete
  using (user_id = auth.uid());

drop trigger if exists trg_user_active_filters_uat on public.user_active_filters;
create trigger trg_user_active_filters_uat
  before update on public.user_active_filters
  for each row execute function public.update_updated_at();

create index if not exists idx_user_active_filters_user on public.user_active_filters(user_id);-- Tabela para persistir o checklist de configuração SCIM por usuário admin
CREATE TABLE IF NOT EXISTS public.scim_setup_checklist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_key text NOT NULL,
  confirmed boolean NOT NULL DEFAULT false,
  confirmed_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, item_key)
);

ALTER TABLE public.scim_setup_checklist ENABLE ROW LEVEL SECURITY;

-- Apenas admins podem ler/gravar (compartilhado entre admins do tenant)
CREATE POLICY "Admins can view scim checklist"
  ON public.scim_setup_checklist FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert scim checklist"
  ON public.scim_setup_checklist FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') AND user_id = auth.uid());

CREATE POLICY "Admins can update scim checklist"
  ON public.scim_setup_checklist FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete scim checklist"
  ON public.scim_setup_checklist FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_scim_setup_checklist_updated_at
  BEFORE UPDATE ON public.scim_setup_checklist
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_scim_setup_checklist_user
  ON public.scim_setup_checklist(user_id);ALTER TABLE public.scim_tokens
  ADD COLUMN IF NOT EXISTS default_role public.app_role;

COMMENT ON COLUMN public.scim_tokens.default_role IS
  'Papel aplicado quando o IdP não envia department/group reconhecível. NULL = usar visualizador (legado).';-- Tabela para persistir grupos do IdP por usuário/provedor a cada login SSO
CREATE TABLE public.sso_user_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES public.sso_providers(id) ON DELETE CASCADE,
  groups TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  matched_group TEXT,
  matched_role app_role,
  last_synced_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, provider_id)
);

CREATE INDEX idx_sso_user_groups_user ON public.sso_user_groups(user_id);
CREATE INDEX idx_sso_user_groups_provider ON public.sso_user_groups(provider_id);
CREATE INDEX idx_sso_user_groups_groups ON public.sso_user_groups USING GIN(groups);

ALTER TABLE public.sso_user_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own SSO groups"
  ON public.sso_user_groups FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins view all SSO groups"
  ON public.sso_user_groups FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins manage SSO groups"
  ON public.sso_user_groups FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_sso_user_groups_updated_at
  BEFORE UPDATE ON public.sso_user_groups
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();CREATE TABLE IF NOT EXISTS public.anomalia_toast_eventos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  anomalia_id UUID NOT NULL,
  severidade TEXT NOT NULL,
  tipo_anomalia TEXT,
  titulo TEXT NOT NULL,
  descricao TEXT,
  centro_custo_id UUID,
  centro_custo_nome TEXT,
  acoes_disponiveis TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  duracao_segundos INTEGER NOT NULL,
  dispatched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_anomalia_toast_eventos_user_dispatched
  ON public.anomalia_toast_eventos (user_id, dispatched_at DESC);

CREATE INDEX IF NOT EXISTS idx_anomalia_toast_eventos_anomalia
  ON public.anomalia_toast_eventos (anomalia_id);

ALTER TABLE public.anomalia_toast_eventos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own toast eventos"
  ON public.anomalia_toast_eventos FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users insert own toast eventos"
  ON public.anomalia_toast_eventos FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users delete own toast eventos"
  ON public.anomalia_toast_eventos FOR DELETE
  TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));ALTER TABLE public.user_anomalia_preferences REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_anomalia_preferences;
-- Trigger para notificar usuários quando um filtro salvo for compartilhado com eles
-- (criação compartilhada OU papéis adicionados em update).

CREATE OR REPLACE FUNCTION public.fn_notificar_filtro_compartilhado()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_target_roles public.app_role[];
  v_old_roles public.app_role[];
  v_owner_email TEXT;
  v_owner_name TEXT;
  v_should_notify BOOLEAN := false;
  v_is_new_share BOOLEAN := false;
  v_user RECORD;
BEGIN
  -- Apenas filtros compartilhados com empresa definida geram notificação
  IF NEW.is_shared IS NOT TRUE OR NEW.empresa_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    v_should_notify := true;
    v_is_new_share := true;
    v_target_roles := NEW.shared_with_roles;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Notificar quando o flag de compartilhamento foi ligado agora
    IF (OLD.is_shared IS NOT TRUE) AND NEW.is_shared = true THEN
      v_should_notify := true;
      v_is_new_share := true;
      v_target_roles := NEW.shared_with_roles;
    -- Ou quando novos papéis foram adicionados
    ELSIF NEW.shared_with_roles IS DISTINCT FROM OLD.shared_with_roles THEN
      v_should_notify := true;
      v_is_new_share := false;
      -- Diferença: papéis presentes em NEW mas não em OLD
      SELECT COALESCE(array_agg(r), ARRAY[]::public.app_role[])
      INTO v_target_roles
      FROM unnest(NEW.shared_with_roles) AS r
      WHERE r <> ALL(COALESCE(OLD.shared_with_roles, ARRAY[]::public.app_role[]));

      -- Caso especial: lista vazia em NEW = "todos do tenant".
      -- Se OLD tinha papéis específicos e agora abriu para todos, notifica todos
      -- que NÃO estavam cobertos antes.
      IF cardinality(NEW.shared_with_roles) = 0
         AND cardinality(COALESCE(OLD.shared_with_roles, ARRAY[]::public.app_role[])) > 0 THEN
        v_target_roles := ARRAY[]::public.app_role[]; -- sentinela = todos
      END IF;
    END IF;
  END IF;

  IF NOT v_should_notify THEN
    RETURN NEW;
  END IF;

  -- Dados do dono (para mensagem)
  SELECT email, COALESCE(full_name, email)
  INTO v_owner_email, v_owner_name
  FROM public.profiles
  WHERE id = NEW.user_id;

  -- Para cada usuário do tenant cujo papel está coberto, insere um alerta.
  -- Pula o próprio dono.
  FOR v_user IN
    SELECT DISTINCT ue.user_id, ue.role
    FROM public.user_empresas ue
    WHERE ue.empresa_id = NEW.empresa_id
      AND ue.ativo = true
      AND ue.user_id <> NEW.user_id
      AND (
        -- Lista vazia = todos do tenant
        cardinality(NEW.shared_with_roles) = 0
        OR ue.role = ANY(NEW.shared_with_roles)
      )
      AND (
        -- Em UPDATE com papéis específicos, só notifica quem entrou agora
        TG_OP = 'INSERT'
        OR v_is_new_share
        OR cardinality(v_target_roles) = 0
        OR ue.role = ANY(v_target_roles)
      )
  LOOP
    INSERT INTO public.alertas (
      tipo,
      titulo,
      mensagem,
      prioridade,
      entidade_tipo,
      entidade_id,
      acao_url,
      user_id
    ) VALUES (
      'filtro_compartilhado',
      CASE
        WHEN v_is_new_share THEN 'Novo filtro compartilhado com você'
        ELSE 'Acesso a filtro compartilhado atualizado'
      END,
      format(
        '%s compartilhou o filtro "%s" (%s) com o perfil %s.',
        COALESCE(v_owner_name, 'Um usuário'),
        NEW.name,
        NEW.entity_type,
        v_user.role
      ),
      'baixa'::public.prioridade_alerta,
      'saved_filter',
      NEW.id::text,
      '/admin/filtros-compartilhados',
      v_user.user_id
    );
  END LOOP;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Falha na notificação não bloqueia escrita do filtro
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notificar_filtro_compartilhado ON public.saved_filters;
CREATE TRIGGER trg_notificar_filtro_compartilhado
  AFTER INSERT OR UPDATE OF is_shared, shared_with_roles, empresa_id
  ON public.saved_filters
  FOR EACH ROW
