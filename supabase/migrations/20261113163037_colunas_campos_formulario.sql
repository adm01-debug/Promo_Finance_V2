-- Cria as colunas que faltam em produção para que campos já preenchidos nas
-- telas/hooks voltem a ser gravados. Hoje o código descarta esses valores com
-- comentários "TODO: coluna X não existe" (ex.: ContaReceberForm.tsx:189,
-- ContasPagarTableRow.tsx:121, useCreditosTributarios.ts:143). Decisão do dono
-- em 13/11/2026: criar as colunas.
-- Conferido em produção (information_schema, 13/11): todas ausentes; tipos
-- seguem as colunas irmãs de cada tabela; alvos de FK existem.
-- Só ADD COLUMN IF NOT EXISTS (nullable ou com DEFAULT), FKs e índices
-- simples. Não altera policies: as tabelas já têm RLS e as colunas novas
-- herdam as regras existentes. Não cria tabela nova.

-- Compras
ALTER TABLE public.pedidos_compra
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS centro_custo_id uuid REFERENCES public.centros_custo(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_pedidos_compra_centro_custo_id ON public.pedidos_compra (centro_custo_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_compra_user_id ON public.pedidos_compra (user_id);

ALTER TABLE public.itens_pedido_compra
  ADD COLUMN IF NOT EXISTS valor_total numeric;
UPDATE public.itens_pedido_compra
   SET valor_total = quantidade * valor_unitario
 WHERE valor_total IS NULL AND quantidade IS NOT NULL AND valor_unitario IS NOT NULL;

-- Conciliação por split
ALTER TABLE public.transacoes_bancarias
  ADD COLUMN IF NOT EXISTS conciliacao_parcial boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS valor_conciliado numeric;

-- Contas a pagar / receber
ALTER TABLE public.contas_pagar
  ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS data_emissao date;

ALTER TABLE public.contas_receber
  ADD COLUMN IF NOT EXISTS valor_final numeric(15,2),
  ADD COLUMN IF NOT EXISTS codigo_barras text,
  ADD COLUMN IF NOT EXISTS link_boleto text,
  ADD COLUMN IF NOT EXISTS frequencia_recorrencia text;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'contas_receber_frequencia_recorrencia_check') THEN
    ALTER TABLE public.contas_receber ADD CONSTRAINT contas_receber_frequencia_recorrencia_check
      CHECK (frequencia_recorrencia IS NULL OR frequencia_recorrencia IN
        ('semanal','quinzenal','mensal','bimestral','trimestral','semestral','anual'));
  END IF;
END $$;

-- Cobrança, acordos, negativação e protesto
ALTER TABLE public.historico_cobranca
  ADD COLUMN IF NOT EXISTS etapa_anterior text,
  ADD COLUMN IF NOT EXISTS etapa_nova text;

ALTER TABLE public.parcelas_acordo
  ADD COLUMN IF NOT EXISTS data_pagamento date,
  ADD COLUMN IF NOT EXISTS valor_pago numeric(15,2);

ALTER TABLE public.negativacoes
  ADD COLUMN IF NOT EXISTS observacoes text,
  ADD COLUMN IF NOT EXISTS created_by uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_negativacoes_created_by ON public.negativacoes (created_by);

ALTER TABLE public.protestos
  ADD COLUMN IF NOT EXISTS observacoes text,
  ADD COLUMN IF NOT EXISTS data_pagamento date,
  ADD COLUMN IF NOT EXISTS created_by uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_protestos_created_by ON public.protestos (created_by);

-- Tributário
ALTER TABLE public.alertas_tributarios
  ADD COLUMN IF NOT EXISTS user_id uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS data_lembrete date,
  ADD COLUMN IF NOT EXISTS entidade_tipo text,
  ADD COLUMN IF NOT EXISTS entidade_id uuid,
  ADD COLUMN IF NOT EXISTS competencia text,
  ADD COLUMN IF NOT EXISTS acao_url text,
  ADD COLUMN IF NOT EXISTS acao_label text,
  ADD COLUMN IF NOT EXISTS resolvido_em timestamptz,
  ADD COLUMN IF NOT EXISTS resolvido_por uuid REFERENCES auth.users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_alertas_tributarios_user_id ON public.alertas_tributarios (user_id);
CREATE INDEX IF NOT EXISTS idx_alertas_tributarios_resolvido_por ON public.alertas_tributarios (resolvido_por);

ALTER TABLE public.apuracoes_tributarias
  ADD COLUMN IF NOT EXISTS data_transmissao timestamptz,
  ADD COLUMN IF NOT EXISTS protocolo_transmissao text,
  ADD COLUMN IF NOT EXISTS created_by uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_apuracoes_tributarias_created_by ON public.apuracoes_tributarias (created_by);

ALTER TABLE public.creditos_tributarios
  ADD COLUMN IF NOT EXISTS tipo_credito text,
  ADD COLUMN IF NOT EXISTS documento_tipo text,
  ADD COLUMN IF NOT EXISTS documento_numero text,
  ADD COLUMN IF NOT EXISTS documento_chave text,
  ADD COLUMN IF NOT EXISTS fornecedor_id uuid REFERENCES public.fornecedores(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS fornecedor_cnpj text,
  ADD COLUMN IF NOT EXISTS fornecedor_nome text,
  ADD COLUMN IF NOT EXISTS valor_base numeric(15,2),
  ADD COLUMN IF NOT EXISTS aliquota numeric(9,6),
  ADD COLUMN IF NOT EXISTS observacoes text,
  ADD COLUMN IF NOT EXISTS apuracao_id uuid REFERENCES public.apuracoes_tributarias(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS competencia_utilizacao text;
CREATE INDEX IF NOT EXISTS idx_creditos_tributarios_fornecedor_id ON public.creditos_tributarios (fornecedor_id);
CREATE INDEX IF NOT EXISTS idx_creditos_tributarios_apuracao_id ON public.creditos_tributarios (apuracao_id);

-- Alertas, presets, movimentações, transferências, anomalias, SCIM
ALTER TABLE public.alertas
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'pendente',
  ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

ALTER TABLE public.user_filter_presets
  ADD COLUMN IF NOT EXISTS empresa_id uuid REFERENCES public.empresas(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_user_filter_presets_empresa_id ON public.user_filter_presets (empresa_id);

ALTER TABLE public.movimentacoes
  ADD COLUMN IF NOT EXISTS categoria_id uuid REFERENCES public.categorias(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS observacoes text;
CREATE INDEX IF NOT EXISTS idx_movimentacoes_categoria_id ON public.movimentacoes (categoria_id);

ALTER TABLE public.transferencias
  ADD COLUMN IF NOT EXISTS observacoes text,
  ADD COLUMN IF NOT EXISTS cancelado_em timestamptz;

ALTER TABLE public.anomalia_toast_eventos
  ADD COLUMN IF NOT EXISTS centro_custo_id uuid REFERENCES public.centros_custo(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_anomalia_toast_eventos_centro_custo_id ON public.anomalia_toast_eventos (centro_custo_id);

ALTER TABLE public.scim_tokens
  ADD COLUMN IF NOT EXISTS default_role public.app_role DEFAULT 'visualizador';
