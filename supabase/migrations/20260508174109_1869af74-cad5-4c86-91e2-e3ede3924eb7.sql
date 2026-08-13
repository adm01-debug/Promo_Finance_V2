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