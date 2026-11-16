-- Tabela para solicitações de reset de senha pendentes
CREATE TABLE public.password_reset_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado', 'rejeitado')),
  motivo_rejeicao text,
  solicitado_em timestamp with time zone NOT NULL DEFAULT now(),
  aprovado_por uuid,
  aprovado_em timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.password_reset_requests ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Qualquer um pode criar solicitação de reset"
ON public.password_reset_requests
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins podem ver todas solicitações"
ON public.password_reset_requests
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins podem atualizar solicitações"
ON public.password_reset_requests
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins podem deletar solicitações"
ON public.password_reset_requests
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

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

ALTER TABLE public.password_reset_requests
  ADD COLUMN IF NOT EXISTS reviewed_by uuid;
DO $fk$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='password_reset_requests_reviewed_by_fkey'
                   AND conrelid='public.password_reset_requests'::regclass)
     AND EXISTS (SELECT 1 FROM pg_class cl JOIN pg_namespace ns ON ns.oid=cl.relnamespace
                  WHERE ns.nspname='auth' AND cl.relname='users'
                    AND cl.relkind='r') THEN
    ALTER TABLE public.password_reset_requests ADD CONSTRAINT password_reset_requests_reviewed_by_fkey
      FOREIGN KEY (reviewed_by) REFERENCES auth.users(id)
      ON DELETE NO ACTION;
  END IF;
END
$fk$;
