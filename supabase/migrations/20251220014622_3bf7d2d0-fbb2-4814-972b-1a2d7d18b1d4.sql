-- Criar tabela de histórico de conciliações com IA
CREATE TABLE public.historico_conciliacao_ia (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  transacao_bancaria_id UUID REFERENCES public.transacoes_bancarias(id),
  conta_pagar_id UUID REFERENCES public.contas_pagar(id),
  conta_receber_id UUID REFERENCES public.contas_receber(id),
  tipo_lancamento TEXT NOT NULL CHECK (tipo_lancamento IN ('pagar', 'receber')),
  score_ia INTEGER NOT NULL CHECK (score_ia >= 0 AND score_ia <= 100),
  confianca TEXT NOT NULL CHECK (confianca IN ('alta', 'media', 'baixa')),
  motivos JSONB NOT NULL DEFAULT '[]',
  analise_ia TEXT,
  acao TEXT NOT NULL CHECK (acao IN ('aprovado', 'rejeitado')),
  aprovado_por UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de feedback para treinar o algoritmo
CREATE TABLE public.feedback_conciliacao_ia (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  transacao_descricao TEXT NOT NULL,
  lancamento_entidade TEXT NOT NULL,
  lancamento_descricao TEXT,
  tipo_lancamento TEXT NOT NULL CHECK (tipo_lancamento IN ('pagar', 'receber')),
  score_original INTEGER NOT NULL,
  acao TEXT NOT NULL CHECK (acao IN ('aprovado', 'rejeitado')),
  motivo_rejeicao TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_historico_conciliacao_ia_transacao ON public.historico_conciliacao_ia(transacao_bancaria_id);
CREATE INDEX idx_historico_conciliacao_ia_created_at ON public.historico_conciliacao_ia(created_at DESC);
CREATE INDEX idx_feedback_conciliacao_ia_created_at ON public.feedback_conciliacao_ia(created_at DESC);

-- Habilitar RLS
ALTER TABLE public.historico_conciliacao_ia ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback_conciliacao_ia ENABLE ROW LEVEL SECURITY;

-- Políticas RLS - histórico visível para todos autenticados
CREATE POLICY "Usuários autenticados podem ver histórico de conciliação" 
ON public.historico_conciliacao_ia 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Usuários autenticados podem inserir histórico de conciliação" 
ON public.historico_conciliacao_ia 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- Políticas RLS - feedback
CREATE POLICY "Usuários autenticados podem ver feedback" 
ON public.feedback_conciliacao_ia 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Usuários autenticados podem inserir feedback" 
ON public.feedback_conciliacao_ia 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

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

ALTER TABLE public.feedback_conciliacao_ia
  ADD COLUMN IF NOT EXISTS transacao_id uuid;
DO $fk$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='feedback_conciliacao_ia_transacao_id_fkey'
                   AND conrelid='public.feedback_conciliacao_ia'::regclass)
     AND EXISTS (SELECT 1 FROM pg_class cl JOIN pg_namespace ns ON ns.oid=cl.relnamespace
                  WHERE ns.nspname='public' AND cl.relname='transacoes_bancarias'
                    AND cl.relkind='r') THEN
    ALTER TABLE public.feedback_conciliacao_ia ADD CONSTRAINT feedback_conciliacao_ia_transacao_id_fkey
      FOREIGN KEY (transacao_id) REFERENCES public.transacoes_bancarias(id)
      ON DELETE NO ACTION;
  END IF;
END
$fk$;
