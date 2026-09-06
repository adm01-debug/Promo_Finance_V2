
-- =====================================================
-- MIGRAÇÃO 3: Colunas faltantes nas tabelas existentes
-- =====================================================

-- ==================== CONTAS_PAGAR ====================
-- Adicionar colunas financeiras para cálculo de valor_final
ALTER TABLE public.contas_pagar ADD COLUMN IF NOT EXISTS valor_original NUMERIC;
ALTER TABLE public.contas_pagar ADD COLUMN IF NOT EXISTS valor_desconto NUMERIC DEFAULT 0;
ALTER TABLE public.contas_pagar ADD COLUMN IF NOT EXISTS valor_juros NUMERIC DEFAULT 0;
ALTER TABLE public.contas_pagar ADD COLUMN IF NOT EXISTS valor_multa NUMERIC DEFAULT 0;

-- Colunas de parcelamento
ALTER TABLE public.contas_pagar ADD COLUMN IF NOT EXISTS numero_parcela_atual INTEGER DEFAULT 1;
ALTER TABLE public.contas_pagar ADD COLUMN IF NOT EXISTS total_parcelas INTEGER DEFAULT 1;

-- Colunas de classificação
ALTER TABLE public.contas_pagar ADD COLUMN IF NOT EXISTS categoria TEXT;
ALTER TABLE public.contas_pagar ADD COLUMN IF NOT EXISTS forma_pagamento TEXT;
ALTER TABLE public.contas_pagar ADD COLUMN IF NOT EXISTS forma_pagamento_id UUID REFERENCES public.formas_pagamento(id);
-- plano_contas só é criada em 20260518190420 (posterior a este arquivo) —
-- achado do CI (Supabase Preview, replay do zero): "relation
-- public.plano_contas does not exist" ao tentar a REFERENCES inline.
-- Guard: sem a tabela ainda, cria a coluna sem FK; 20260518190420 adiciona
-- a constraint depois, via ALTER TABLE ADD CONSTRAINT guardado por
-- pg_constraint (idempotente nos dois ambientes — replay do zero e prod,
-- onde coluna e FK já existem de quando a ordem real de deploy foi outra).
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'plano_contas') THEN
    ALTER TABLE public.contas_pagar ADD COLUMN IF NOT EXISTS plano_conta_id UUID REFERENCES public.plano_contas(id);
  ELSE
    ALTER TABLE public.contas_pagar ADD COLUMN IF NOT EXISTS plano_conta_id UUID;
  END IF;
END $$;
ALTER TABLE public.contas_pagar ADD COLUMN IF NOT EXISTS contato_id UUID REFERENCES public.contatos_financeiros(id);

-- Colunas de recorrência e user
ALTER TABLE public.contas_pagar ADD COLUMN IF NOT EXISTS frequencia_recorrencia TEXT;
ALTER TABLE public.contas_pagar ADD COLUMN IF NOT EXISTS user_id UUID;

-- ==================== CONTAS_RECEBER ====================
ALTER TABLE public.contas_receber ADD COLUMN IF NOT EXISTS valor_original NUMERIC;
ALTER TABLE public.contas_receber ADD COLUMN IF NOT EXISTS valor_desconto NUMERIC DEFAULT 0;
ALTER TABLE public.contas_receber ADD COLUMN IF NOT EXISTS valor_juros NUMERIC DEFAULT 0;
ALTER TABLE public.contas_receber ADD COLUMN IF NOT EXISTS valor_multa NUMERIC DEFAULT 0;

ALTER TABLE public.contas_receber ADD COLUMN IF NOT EXISTS numero_parcela_atual INTEGER DEFAULT 1;
ALTER TABLE public.contas_receber ADD COLUMN IF NOT EXISTS total_parcelas INTEGER DEFAULT 1;

ALTER TABLE public.contas_receber ADD COLUMN IF NOT EXISTS categoria TEXT;
ALTER TABLE public.contas_receber ADD COLUMN IF NOT EXISTS forma_recebimento TEXT;
ALTER TABLE public.contas_receber ADD COLUMN IF NOT EXISTS forma_pagamento_id UUID REFERENCES public.formas_pagamento(id);
-- Mesmo forward-reference de plano_contas do bloco contas_pagar acima.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'plano_contas') THEN
    ALTER TABLE public.contas_receber ADD COLUMN IF NOT EXISTS plano_conta_id UUID REFERENCES public.plano_contas(id);
  ELSE
    ALTER TABLE public.contas_receber ADD COLUMN IF NOT EXISTS plano_conta_id UUID;
  END IF;
END $$;
ALTER TABLE public.contas_receber ADD COLUMN IF NOT EXISTS contato_id UUID REFERENCES public.contatos_financeiros(id);

ALTER TABLE public.contas_receber ADD COLUMN IF NOT EXISTS frequencia_recorrencia TEXT;
ALTER TABLE public.contas_receber ADD COLUMN IF NOT EXISTS recorrente BOOLEAN DEFAULT false;
ALTER TABLE public.contas_receber ADD COLUMN IF NOT EXISTS user_id UUID;

-- ==================== FORNECEDORES ====================
ALTER TABLE public.fornecedores ADD COLUMN IF NOT EXISTS cnpj TEXT;
ALTER TABLE public.fornecedores ADD COLUMN IF NOT EXISTS cep TEXT;
ALTER TABLE public.fornecedores ADD COLUMN IF NOT EXISTS categoria TEXT;
ALTER TABLE public.fornecedores ADD COLUMN IF NOT EXISTS banco TEXT;
ALTER TABLE public.fornecedores ADD COLUMN IF NOT EXISTS agencia TEXT;
ALTER TABLE public.fornecedores ADD COLUMN IF NOT EXISTS conta TEXT;
ALTER TABLE public.fornecedores ADD COLUMN IF NOT EXISTS pix TEXT;
ALTER TABLE public.fornecedores ADD COLUMN IF NOT EXISTS contato_nome TEXT;
ALTER TABLE public.fornecedores ADD COLUMN IF NOT EXISTS contato_telefone TEXT;
ALTER TABLE public.fornecedores ADD COLUMN IF NOT EXISTS score INTEGER DEFAULT 100;
ALTER TABLE public.fornecedores ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES public.empresas(id);
ALTER TABLE public.fornecedores ADD COLUMN IF NOT EXISTS contato_financeiro_id UUID REFERENCES public.contatos_financeiros(id);

-- ==================== CONTAS_BANCARIAS ====================
ALTER TABLE public.contas_bancarias ADD COLUMN IF NOT EXISTS nome TEXT;
ALTER TABLE public.contas_bancarias ADD COLUMN IF NOT EXISTS tipo TEXT DEFAULT 'corrente';
ALTER TABLE public.contas_bancarias ADD COLUMN IF NOT EXISTS saldo_inicial NUMERIC DEFAULT 0;

-- ==================== CLIENTES ====================
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS tipo TEXT DEFAULT 'PJ' CHECK (tipo IN ('PF', 'PJ'));
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS contato_financeiro_id UUID REFERENCES public.contatos_financeiros(id);
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES public.empresas(id);

-- ==================== EMPRESAS ====================
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS regime_tributario TEXT;
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS tipo_pessoa TEXT DEFAULT 'PJ';

-- ==================== REGUA_COBRANCA ====================
-- Verificar e adicionar colunas faltantes
ALTER TABLE public.regua_cobranca ADD COLUMN IF NOT EXISTS dias_gatilho INTEGER DEFAULT 0;
ALTER TABLE public.regua_cobranca ADD COLUMN IF NOT EXISTS canais TEXT[];
ALTER TABLE public.regua_cobranca ADD COLUMN IF NOT EXISTS auto_executar BOOLEAN DEFAULT false;
ALTER TABLE public.regua_cobranca ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES public.empresas(id);

-- ==================== PROFILES ====================
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS user_id UUID UNIQUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cargo TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES public.empresas(id);
