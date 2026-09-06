-- Migration 003: Add missing columns to contas_pagar and contas_receber
--
-- Context: 001_create_tables.sql creates these tables with minimal columns.
-- Subsequent CREATE TABLE IF NOT EXISTS in 20251214170739 is a no-op.
-- Views in 20260317125441 reference columns that don't exist yet.
-- This migration adds all missing columns BEFORE those migrations run.
-- FK constraints omitted intentionally — referenced tables don't exist yet.

-- ============================================================
-- contas_pagar missing columns
-- ============================================================

ALTER TABLE public.contas_pagar
  ADD COLUMN IF NOT EXISTS empresa_id UUID,
  ADD COLUMN IF NOT EXISTS conta_bancaria_id UUID,
  ADD COLUMN IF NOT EXISTS centro_custo_id UUID,
  ADD COLUMN IF NOT EXISTS fornecedor_nome TEXT,
  ADD COLUMN IF NOT EXISTS valor_pago DECIMAL(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS data_emissao DATE,
  ADD COLUMN IF NOT EXISTS tipo_cobranca TEXT,
  ADD COLUMN IF NOT EXISTS bitrix_deal_id TEXT,
  ADD COLUMN IF NOT EXISTS aprovado_por UUID,
  ADD COLUMN IF NOT EXISTS aprovado_em TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS created_by UUID,
  ADD COLUMN IF NOT EXISTS valor_original DECIMAL(15,2),
  ADD COLUMN IF NOT EXISTS valor_desconto DECIMAL(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS valor_juros DECIMAL(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS valor_multa DECIMAL(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS numero_parcela_atual INTEGER,
  ADD COLUMN IF NOT EXISTS forma_pagamento_id UUID,
  ADD COLUMN IF NOT EXISTS plano_conta_id UUID,
  ADD COLUMN IF NOT EXISTS contato_id UUID,
  ADD COLUMN IF NOT EXISTS vencimento DATE,
  ADD COLUMN IF NOT EXISTS valor_final DECIMAL(15,2),
  ADD COLUMN IF NOT EXISTS asaas_bill_id TEXT,
  ADD COLUMN IF NOT EXISTS asaas_status TEXT,
  ADD COLUMN IF NOT EXISTS tags JSONB;

-- ============================================================
-- contas_receber missing columns
-- ============================================================

ALTER TABLE public.contas_receber
  ADD COLUMN IF NOT EXISTS empresa_id UUID,
  ADD COLUMN IF NOT EXISTS conta_bancaria_id UUID,
  ADD COLUMN IF NOT EXISTS centro_custo_id UUID,
  ADD COLUMN IF NOT EXISTS cliente_nome TEXT,
  ADD COLUMN IF NOT EXISTS valor_recebido DECIMAL(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS data_emissao DATE,
  ADD COLUMN IF NOT EXISTS tipo_cobranca TEXT,
  ADD COLUMN IF NOT EXISTS codigo_barras TEXT,
  ADD COLUMN IF NOT EXISTS chave_pix TEXT,
  ADD COLUMN IF NOT EXISTS link_boleto TEXT,
  ADD COLUMN IF NOT EXISTS etapa_cobranca TEXT,
  ADD COLUMN IF NOT EXISTS bitrix_deal_id TEXT,
  ADD COLUMN IF NOT EXISTS created_by UUID,
  ADD COLUMN IF NOT EXISTS vendedor_id UUID,
  ADD COLUMN IF NOT EXISTS valor_original DECIMAL(15,2),
  ADD COLUMN IF NOT EXISTS valor_desconto DECIMAL(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS valor_juros DECIMAL(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS valor_multa DECIMAL(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS numero_parcela_atual INTEGER,
  ADD COLUMN IF NOT EXISTS forma_pagamento_id UUID,
  ADD COLUMN IF NOT EXISTS plano_conta_id UUID,
  ADD COLUMN IF NOT EXISTS contato_id UUID,
  ADD COLUMN IF NOT EXISTS vencimento DATE,
  ADD COLUMN IF NOT EXISTS valor_pago DECIMAL(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS valor_final DECIMAL(15,2),
  ADD COLUMN IF NOT EXISTS numero_nf TEXT,
  ADD COLUMN IF NOT EXISTS asaas_payment_id TEXT,
  ADD COLUMN IF NOT EXISTS asaas_billing_type TEXT,
  ADD COLUMN IF NOT EXISTS asaas_status TEXT,
  ADD COLUMN IF NOT EXISTS data_credito DATE,
  ADD COLUMN IF NOT EXISTS valor_liquido DECIMAL(15,2),
  ADD COLUMN IF NOT EXISTS taxa_gateway DECIMAL(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tags JSONB;

-- ============================================================
-- clientes missing column (referenced by vw_contas_receber_painel)
-- ============================================================

ALTER TABLE public.clientes
  ADD COLUMN IF NOT EXISTS score DECIMAL(5,2);
