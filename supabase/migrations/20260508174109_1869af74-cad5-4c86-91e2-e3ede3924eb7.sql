-- Criar tabela de fila de sincronização/retentativas
CREATE TABLE IF NOT EXISTS public.asaas_sync_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID REFERENCES public.asaas_payments(id) ON DELETE CASCADE,
    operation_type TEXT NOT NULL, -- 'EMISSION', 'UPDATE_STATUS', 'DOWNLOAD_FILES'
    status TEXT NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'
    attempts INTEGER NOT NULL DEFAULT 0,
    max_attempts INTEGER NOT NULL DEFAULT 5,
    last_error TEXT,
    next_retry_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Criar tabela de trilha de auditoria específica para boletos
CREATE TABLE IF NOT EXISTS public.asaas_audit_trail (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID REFERENCES public.asaas_payments(id) ON DELETE CASCADE,
    action TEXT NOT NULL, -- 'EMISSION_REQUESTED', 'EMISSION_SUCCESS', 'WEBHOOK_RECEIVED', 'STATUS_CHANGED', 'DOWNLOAD_CLICKED'
    previous_status TEXT,
    new_status TEXT,
    details JSONB,
    user_id UUID REFERENCES auth.users(id),
    ip_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Adicionar campo de comprovante e metadados extras em asaas_payments se não existirem
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'asaas_payments' AND COLUMN_NAME = 'link_comprovante') THEN
        ALTER TABLE public.asaas_payments ADD COLUMN link_comprovante TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'asaas_payments' AND COLUMN_NAME = 'metadata') THEN
        ALTER TABLE public.asaas_payments ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
    END IF;
END $$;

-- Habilitar RLS
ALTER TABLE public.asaas_sync_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asaas_audit_trail ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
CREATE POLICY "Permitir leitura da fila para autenticados" ON public.asaas_sync_queue FOR SELECT TO authenticated USING (true);
CREATE POLICY "Permitir leitura da auditoria para autenticados" ON public.asaas_audit_trail FOR SELECT TO authenticated USING (true);

-- Gatilho para updated_at na fila
CREATE TRIGGER update_asaas_sync_queue_updated_at
    BEFORE UPDATE ON public.asaas_sync_queue
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

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

ALTER TABLE public.asaas_audit_trail
  ADD COLUMN IF NOT EXISTS asaas_payment_id uuid;
DO $fk$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='asaas_audit_trail_asaas_payment_id_fkey'
                   AND conrelid='public.asaas_audit_trail'::regclass)
     AND EXISTS (SELECT 1 FROM pg_class cl JOIN pg_namespace ns ON ns.oid=cl.relnamespace
                  WHERE ns.nspname='public' AND cl.relname='asaas_payments'
                    AND cl.relkind='r') THEN
    ALTER TABLE public.asaas_audit_trail ADD CONSTRAINT asaas_audit_trail_asaas_payment_id_fkey
      FOREIGN KEY (asaas_payment_id) REFERENCES public.asaas_payments(id)
      ON DELETE CASCADE;
  END IF;
END
$fk$;

ALTER TABLE public.asaas_sync_queue
  ADD COLUMN IF NOT EXISTS asaas_payment_id uuid;
DO $fk$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='asaas_sync_queue_asaas_payment_id_fkey'
                   AND conrelid='public.asaas_sync_queue'::regclass)
     AND EXISTS (SELECT 1 FROM pg_class cl JOIN pg_namespace ns ON ns.oid=cl.relnamespace
                  WHERE ns.nspname='public' AND cl.relname='asaas_payments'
                    AND cl.relkind='r') THEN
    ALTER TABLE public.asaas_sync_queue ADD CONSTRAINT asaas_sync_queue_asaas_payment_id_fkey
      FOREIGN KEY (asaas_payment_id) REFERENCES public.asaas_payments(id)
      ON DELETE CASCADE;
  END IF;
END
$fk$;
