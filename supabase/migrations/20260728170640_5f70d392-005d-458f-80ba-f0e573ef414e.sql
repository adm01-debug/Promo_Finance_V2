-- Gap #17: alinhamento schema x código

-- 1) fornecedores
ALTER TABLE public.fornecedores
  ADD COLUMN IF NOT EXISTS cnpj_cpf text,
  ADD COLUMN IF NOT EXISTS nome text,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS telefone text,
  ADD COLUMN IF NOT EXISTS contato text,
  ADD COLUMN IF NOT EXISTS ativo boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS ramo_atividade text,
  ADD COLUMN IF NOT EXISTS observacoes text,
  ADD COLUMN IF NOT EXISTS endereco text,
  ADD COLUMN IF NOT EXISTS cidade text,
  ADD COLUMN IF NOT EXISTS estado text,
  ADD COLUMN IF NOT EXISTS score numeric,
  ADD COLUMN IF NOT EXISTS limite_credito numeric;
UPDATE public.fornecedores SET cnpj_cpf = COALESCE(cnpj_cpf, cnpj), nome = COALESCE(nome, nome_fantasia, razao_social);

-- 2) vendedores
ALTER TABLE public.vendedores ADD COLUMN IF NOT EXISTS telefone text;

-- 3) centros_custo
ALTER TABLE public.centros_custo ADD COLUMN IF NOT EXISTS tipo text;

-- 4) operacoes_tributaveis
ALTER TABLE public.operacoes_tributaveis
  ADD COLUMN IF NOT EXISTS documento_tipo text NOT NULL DEFAULT 'nfe',
  ADD COLUMN IF NOT EXISTS documento_numero text,
  ADD COLUMN IF NOT EXISTS documento_serie text,
  ADD COLUMN IF NOT EXISTS documento_chave text,
  ADD COLUMN IF NOT EXISTS nota_fiscal_id uuid,
  ADD COLUMN IF NOT EXISTS cliente_id uuid,
  ADD COLUMN IF NOT EXISTS fornecedor_id uuid,
  ADD COLUMN IF NOT EXISTS cnpj_cpf_contraparte text,
  ADD COLUMN IF NOT EXISTS nome_contraparte text,
  ADD COLUMN IF NOT EXISTS uf_origem text,
  ADD COLUMN IF NOT EXISTS uf_destino text,
  ADD COLUMN IF NOT EXISTS cfop text,
  ADD COLUMN IF NOT EXISTS ncm text,
  ADD COLUMN IF NOT EXISTS valor_operacao numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS valor_desconto numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS valor_frete numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS base_calculo numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_categoria text,
  ADD COLUMN IF NOT EXISTS is_aliquota numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS icms_aliquota numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS iss_aliquota numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pis_aliquota numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cofins_aliquota numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS regime_especial text,
  ADD COLUMN IF NOT EXISTS reducao_aliquota numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS isento boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS motivo_isencao text,
  ADD COLUMN IF NOT EXISTS split_payment boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS split_payment_valor numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS competencia text,
  ADD COLUMN IF NOT EXISTS apuracao_id uuid,
  ADD COLUMN IF NOT EXISTS erro_mensagem text,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
CREATE INDEX IF NOT EXISTS idx_operacoes_trib_nota_fiscal ON public.operacoes_tributaveis(nota_fiscal_id);
CREATE INDEX IF NOT EXISTS idx_operacoes_trib_competencia ON public.operacoes_tributaveis(empresa_id, competencia);

-- 5) notas_fiscais
ALTER TABLE public.notas_fiscais
  ADD COLUMN IF NOT EXISTS cliente_cnpj text,
  ADD COLUMN IF NOT EXISTS cliente_nome text,
  ADD COLUMN IF NOT EXISTS valor_desconto numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS valor_frete numeric NOT NULL DEFAULT 0;

-- 6) retencoes_fonte
ALTER TABLE public.retencoes_fonte
  ADD COLUMN IF NOT EXISTS tipo_retencao text,
  ADD COLUMN IF NOT EXISTS tipo_operacao text,
  ADD COLUMN IF NOT EXISTS nota_fiscal_id uuid,
  ADD COLUMN IF NOT EXISTS conta_pagar_id uuid,
  ADD COLUMN IF NOT EXISTS conta_receber_id uuid,
  ADD COLUMN IF NOT EXISTS cnpj_participante text,
  ADD COLUMN IF NOT EXISTS nome_participante text,
  ADD COLUMN IF NOT EXISTS valor_base numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS aliquota numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS valor_retido numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS data_retencao date,
  ADD COLUMN IF NOT EXISTS data_recolhimento date,
  ADD COLUMN IF NOT EXISTS data_vencimento date,
  ADD COLUMN IF NOT EXISTS codigo_receita text,
  ADD COLUMN IF NOT EXISTS numero_documento text,
  ADD COLUMN IF NOT EXISTS darf_gerado boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pendente',
  ADD COLUMN IF NOT EXISTS competencia text,
  ADD COLUMN IF NOT EXISTS observacoes text;
ALTER TABLE public.retencoes_fonte DROP CONSTRAINT IF EXISTS retencoes_fonte_status_check;
ALTER TABLE public.retencoes_fonte ADD CONSTRAINT retencoes_fonte_status_check
  CHECK (status IN ('pendente','recolhido','compensado','cancelado'));
CREATE INDEX IF NOT EXISTS idx_retencoes_fonte_competencia ON public.retencoes_fonte(empresa_id, competencia);

-- 7) apuracoes_irpj_csll
ALTER TABLE public.apuracoes_irpj_csll
  ADD COLUMN IF NOT EXISTS trimestre integer,
  ADD COLUMN IF NOT EXISTS mes integer,
  ADD COLUMN IF NOT EXISTS irpj_normal numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS irpj_adicional_base numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS irpj_adicional numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS irpj_total numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS csll_base numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS csll_total numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS irpj_incentivos_deducoes numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_tributos numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS irpj_a_pagar numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS csll_a_pagar numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS saldo_negativo_irpj numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS saldo_negativo_csll numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS data_transmissao timestamptz,
  ADD COLUMN IF NOT EXISTS numero_recibo text,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.apuracoes_irpj_csll DROP CONSTRAINT IF EXISTS apuracoes_irpj_csll_trimestre_check;
ALTER TABLE public.apuracoes_irpj_csll ADD CONSTRAINT apuracoes_irpj_csll_trimestre_check
  CHECK (trimestre IS NULL OR trimestre BETWEEN 1 AND 4);
ALTER TABLE public.apuracoes_irpj_csll DROP CONSTRAINT IF EXISTS apuracoes_irpj_csll_mes_check;
ALTER TABLE public.apuracoes_irpj_csll ADD CONSTRAINT apuracoes_irpj_csll_mes_check
  CHECK (mes IS NULL OR mes BETWEEN 1 AND 12);

-- 8) prejuizos_fiscais
ALTER TABLE public.prejuizos_fiscais ADD COLUMN IF NOT EXISTS trimestre_origem integer;
ALTER TABLE public.prejuizos_fiscais DROP CONSTRAINT IF EXISTS prejuizos_fiscais_trimestre_origem_check;
ALTER TABLE public.prejuizos_fiscais ADD CONSTRAINT prejuizos_fiscais_trimestre_origem_check
  CHECK (trimestre_origem IS NULL OR trimestre_origem BETWEEN 1 AND 4);

-- 9) regras_conciliacao
ALTER TABLE public.regras_conciliacao ADD COLUMN IF NOT EXISTS entidade_id uuid;

-- 10) bloqueios_duplicidade
ALTER TABLE public.bloqueios_duplicidade ADD COLUMN IF NOT EXISTS dados_tentativa jsonb NOT NULL DEFAULT '{}'::jsonb;

-- 11) evidencias_pacotes
ALTER TABLE public.evidencias_pacotes
  ADD COLUMN IF NOT EXISTS gerado_por_email text,
  ADD COLUMN IF NOT EXISTS periodo_inicio date,
  ADD COLUMN IF NOT EXISTS periodo_fim date,
  ADD COLUMN IF NOT EXISTS escopos text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS storage_path text,
  ADD COLUMN IF NOT EXISTS tamanho_bytes bigint,
  ADD COLUMN IF NOT EXISTS manifest jsonb NOT NULL DEFAULT '{}'::jsonb;

-- 12) contas_receber
ALTER TABLE public.contas_receber ADD COLUMN IF NOT EXISTS bitrix_deal_id text;
CREATE INDEX IF NOT EXISTS idx_contas_receber_bitrix_deal ON public.contas_receber(bitrix_deal_id) WHERE bitrix_deal_id IS NOT NULL;

-- 13) faturamento_mensal / folha_pagamento
ALTER TABLE public.faturamento_mensal ADD COLUMN IF NOT EXISTS observacoes text;
ALTER TABLE public.folha_pagamento
  ADD COLUMN IF NOT EXISTS observacoes text,
  ADD COLUMN IF NOT EXISTS numero_funcionarios integer;
CREATE UNIQUE INDEX IF NOT EXISTS ux_faturamento_mensal_empresa_ano_mes
  ON public.faturamento_mensal(empresa_id, ano, mes);
CREATE UNIQUE INDEX IF NOT EXISTS ux_folha_pagamento_empresa_ano_mes
  ON public.folha_pagamento(empresa_id, ano, mes);