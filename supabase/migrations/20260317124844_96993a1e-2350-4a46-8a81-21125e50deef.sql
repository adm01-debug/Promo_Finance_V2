
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
