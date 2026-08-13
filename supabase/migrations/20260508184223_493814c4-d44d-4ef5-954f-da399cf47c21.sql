ALTER TABLE public.asaas_sync_queue 
ADD COLUMN IF NOT EXISTS error_history JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.asaas_sync_queue.error_history IS 'Histórico serializado de erros encontrados em cada tentativa de sincronização.';

-- Index for queue cleanup/maintenance
CREATE INDEX IF NOT EXISTS idx_asaas_sync_queue_status_updated ON public.asaas_sync_queue(status, updated_at);
