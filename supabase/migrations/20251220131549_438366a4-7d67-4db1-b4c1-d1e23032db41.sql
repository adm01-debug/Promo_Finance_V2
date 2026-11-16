-- Create table for financial goals
CREATE TABLE public.metas_financeiras (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo TEXT NOT NULL CHECK (tipo IN ('receita', 'despesa', 'inadimplencia', 'economia')),
  titulo TEXT NOT NULL,
  valor_meta NUMERIC NOT NULL DEFAULT 0,
  mes INTEGER NOT NULL CHECK (mes >= 1 AND mes <= 12),
  ano INTEGER NOT NULL CHECK (ano >= 2020),
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(tipo, mes, ano)
);

-- Enable RLS
ALTER TABLE public.metas_financeiras ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Authenticated users can view metas_financeiras"
ON public.metas_financeiras
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Financeiro+ can manage metas_financeiras"
ON public.metas_financeiras
FOR ALL
USING (has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role]));

-- Trigger for updated_at
CREATE TRIGGER update_metas_financeiras_updated_at
BEFORE UPDATE ON public.metas_financeiras
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default goals for current month
INSERT INTO public.metas_financeiras (tipo, titulo, valor_meta, mes, ano)
VALUES 
  ('receita', 'Meta de Receitas', 150000, EXTRACT(MONTH FROM CURRENT_DATE)::INTEGER, EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER),
  ('despesa', 'Limite de Despesas', 100000, EXTRACT(MONTH FROM CURRENT_DATE)::INTEGER, EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER),
  ('inadimplencia', 'Inadimplência Máxima', 5, EXTRACT(MONTH FROM CURRENT_DATE)::INTEGER, EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER);

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

ALTER TABLE public.metas_financeiras
  ADD COLUMN IF NOT EXISTS user_id uuid;
DO $fk$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='metas_financeiras_user_id_fkey'
                   AND conrelid='public.metas_financeiras'::regclass)
     AND EXISTS (SELECT 1 FROM pg_class cl JOIN pg_namespace ns ON ns.oid=cl.relnamespace
                  WHERE ns.nspname='auth' AND cl.relname='users'
                    AND cl.relkind='r') THEN
    ALTER TABLE public.metas_financeiras ADD CONSTRAINT metas_financeiras_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id)
      ON DELETE NO ACTION;
  END IF;
END
$fk$;
