-- Tabela para níveis de aprovação (Workflows complexos)
CREATE TABLE IF NOT EXISTS public.fluxos_aprovacao_niveis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    ordem INTEGER NOT NULL,
    nome TEXT NOT NULL,
    descricao TEXT,
    valor_minimo DECIMAL(15,2) DEFAULT 0,
    aprovadores_obrigatorios INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(empresa_id, ordem)
);

-- Habilitar RLS
ALTER TABLE public.fluxos_aprovacao_niveis ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Users can view their own workflow levels"
ON public.fluxos_aprovacao_niveis FOR SELECT
USING (auth.uid() = empresa_id);

CREATE POLICY "Admins can manage workflow levels"
ON public.fluxos_aprovacao_niveis FOR ALL
USING (auth.uid() = empresa_id);

-- Comentários nas aprovações (Trilha de discussão)
CREATE TABLE IF NOT EXISTS public.aprovacao_comentarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    solicitacao_id UUID NOT NULL REFERENCES public.solicitacoes_aprovacao(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL,
    texto TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.aprovacao_comentarios ENABLE ROW LEVEL SECURITY;

-- Políticas para comentários
CREATE POLICY "Users can view comments on their requests or if they are approvers"
ON public.aprovacao_comentarios FOR SELECT
USING (true); -- Simplificado para o exemplo, em produção seria mais restrito

CREATE POLICY "Users can post comments"
ON public.aprovacao_comentarios FOR INSERT
WITH CHECK (auth.uid() = usuario_id);

-- Adicionar colunas de controle de fluxo na tabela de solicitações
ALTER TABLE public.solicitacoes_aprovacao 
ADD COLUMN IF NOT EXISTS nivel_atual INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS total_niveis INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS assinaturas JSONB DEFAULT '[]'::jsonb;

-- Trigger para atualizar timestamp
CREATE TRIGGER update_fluxos_aprovacao_niveis_updated_at
BEFORE UPDATE ON public.fluxos_aprovacao_niveis
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

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

ALTER TABLE public.fluxos_aprovacao_niveis
  ADD COLUMN IF NOT EXISTS configuracao_id uuid;
DO $fk$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='fluxos_aprovacao_niveis_configuracao_id_fkey'
                   AND conrelid='public.fluxos_aprovacao_niveis'::regclass)
     AND EXISTS (SELECT 1 FROM pg_class cl JOIN pg_namespace ns ON ns.oid=cl.relnamespace
                  WHERE ns.nspname='public' AND cl.relname='configuracoes_aprovacao'
                    AND cl.relkind='r') THEN
    ALTER TABLE public.fluxos_aprovacao_niveis ADD CONSTRAINT fluxos_aprovacao_niveis_configuracao_id_fkey
      FOREIGN KEY (configuracao_id) REFERENCES public.configuracoes_aprovacao(id)
      ON DELETE NO ACTION;
  END IF;
END
$fk$;
