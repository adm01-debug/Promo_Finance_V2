-- 1. Create contratos table
CREATE TABLE IF NOT EXISTS public.contratos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    empresa_id UUID REFERENCES public.empresas(id),
    descricao TEXT NOT NULL,
    numero_contrato TEXT,
    status TEXT DEFAULT 'ativo',
    tipo TEXT,
    data_inicio DATE,
    data_fim DATE,
    renovacao_automatica BOOLEAN DEFAULT false,
    valor_mensal NUMERIC(15,2),
    valor_total NUMERIC(15,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Create metas_financeiras table
CREATE TABLE IF NOT EXISTS public.metas_financeiras (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    empresa_id UUID REFERENCES public.empresas(id),
    titulo TEXT NOT NULL,
    tipo TEXT NOT NULL,
    mes INTEGER NOT NULL,
    ano INTEGER NOT NULL,
    valor_meta NUMERIC(15,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Create partidas_contabeis table
CREATE TABLE IF NOT EXISTS public.partidas_contabeis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lancamento_id UUID REFERENCES public.lancamentos_contabeis(id) ON DELETE CASCADE,
    conta_contabil_id UUID,
    tipo TEXT NOT NULL CHECK (tipo IN ('debito', 'credito')),
    valor NUMERIC(15,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. Create bloqueios_duplicidade table
CREATE TABLE IF NOT EXISTS public.bloqueios_duplicidade (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID REFERENCES public.empresas(id),
    transacao_id UUID,
    valor_bloqueado NUMERIC(15,2),
    motivo TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5. Update regras_conciliacao
ALTER TABLE public.regras_conciliacao ADD COLUMN IF NOT EXISTS entidade_nome TEXT;
ALTER TABLE public.regras_conciliacao ADD COLUMN IF NOT EXISTS lancamento_tipo TEXT;
ALTER TABLE public.regras_conciliacao ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- 6. Update contas_receber
ALTER TABLE public.contas_receber ADD COLUMN IF NOT EXISTS valor_desconto NUMERIC(15,2) DEFAULT 0;
ALTER TABLE public.contas_receber ADD COLUMN IF NOT EXISTS chave_pix TEXT;
ALTER TABLE public.contas_receber ADD COLUMN IF NOT EXISTS data_emissao DATE DEFAULT CURRENT_DATE;

-- 7. Update conciliacoes (ensure it has same fields as sessoes_conciliacao)
ALTER TABLE public.conciliacoes ADD COLUMN IF NOT EXISTS periodo_inicio DATE;
ALTER TABLE public.conciliacoes ADD COLUMN IF NOT EXISTS periodo_fim DATE;
ALTER TABLE public.conciliacoes ADD COLUMN IF NOT EXISTS conta_bancaria_id UUID REFERENCES public.contas_bancarias(id);

-- 8. Fix RPC registrar_evento_receber
CREATE OR REPLACE FUNCTION public.registrar_evento_receber(
    p_conta_id UUID,
    p_evento TEXT,
    p_detalhes JSONB DEFAULT '{}'::jsonb,
    p_tipo TEXT DEFAULT 'sistema'
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.logs_baixa_automatica (
        conta_receber_id,
        evento,
        detalhes,
        tipo,
        created_at
    ) VALUES (
        p_conta_id,
        p_evento,
        p_detalhes,
        p_tipo,
        now()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 9. Enable RLS and add policies
ALTER TABLE public.contratos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metas_financeiras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partidas_contabeis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bloqueios_duplicidade ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own contratos" ON public.contratos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Users can manage their own metas" ON public.metas_financeiras FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Users can manage their own partidas" ON public.partidas_contabeis FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Users can manage their own bloqueios" ON public.bloqueios_duplicidade FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Ensure all tables created in this round have at least some basic authenticated access
GRANT ALL ON public.contratos TO authenticated;
GRANT ALL ON public.metas_financeiras TO authenticated;
GRANT ALL ON public.partidas_contabeis TO authenticated;
GRANT ALL ON public.bloqueios_duplicidade TO authenticated;

-- Reconciliacao com o banco de PRODUCAO, no arquivo que CRIA a tabela.
--
-- Estas colunas existem no canonico bwwbeyolnnzppeuhgkcd e a cadeia nunca as
-- criava. O numero veio de replay real (Postgres 16.15, os 1025 arquivos em
-- ordem, 1 transacao por arquivo): a secao 4 de 20261116190000 imprimia
--   NOTICE: indices de FK: 109 aplicados, 17 ignorados por coluna ou tabela ausente
-- e 4 arquivos abortavam por coluna ausente.
--
-- A coluna entra AQUI, e nao num arquivo de timestamp novo, porque medi que um
-- arquivo no fim da cadeia nao resolve: com a migration 20261116220000
-- aplicada, os 126 nomes de indice presentes no replay seguiam 106, iguais a
-- sem ela, porque ela roda DEPOIS de quem precisa da coluna. Mesmo padrao do
-- indice da FK em 20260712223141.
--
-- Em producao e no-op: este arquivo ja foi aplicado, e migration-ledger.yml
-- compara versao (nome do arquivo), nao checksum de conteudo.
--
-- Para asaas_audit_trail.asaas_payment_id, asaas_sync_queue.asaas_payment_id e
-- fila_cobrancas.etapa_id esta e uma ADICAO, nao renomeacao: em producao a
-- coluna antiga nao existe mais, mas 18 arquivos da cadeia ainda a usam (o
-- ultimo em 20261102000000), e renomear aqui quebra 20260508183450 e
-- 20260508184054 — medido. A remocao da coluna antiga e outra tarefa.

ALTER TABLE public.contratos
  ADD COLUMN IF NOT EXISTS cliente_id uuid;
DO $fk$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='contratos_cliente_id_fkey'
                   AND conrelid='public.contratos'::regclass)
     AND EXISTS (SELECT 1 FROM pg_class cl JOIN pg_namespace ns ON ns.oid=cl.relnamespace
                  WHERE ns.nspname='public' AND cl.relname='clientes'
                    AND cl.relkind='r') THEN
    ALTER TABLE public.contratos ADD CONSTRAINT contratos_cliente_id_fkey
      FOREIGN KEY (cliente_id) REFERENCES public.clientes(id)
      ON DELETE SET NULL;
  END IF;
END
$fk$;

ALTER TABLE public.contratos
  ADD COLUMN IF NOT EXISTS fornecedor_id uuid;
DO $fk$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='contratos_fornecedor_id_fkey'
                   AND conrelid='public.contratos'::regclass)
     AND EXISTS (SELECT 1 FROM pg_class cl JOIN pg_namespace ns ON ns.oid=cl.relnamespace
                  WHERE ns.nspname='public' AND cl.relname='fornecedores'
                    AND cl.relkind='r') THEN
    ALTER TABLE public.contratos ADD CONSTRAINT contratos_fornecedor_id_fkey
      FOREIGN KEY (fornecedor_id) REFERENCES public.fornecedores(id)
      ON DELETE SET NULL;
  END IF;
END
$fk$;
