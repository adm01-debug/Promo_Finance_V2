-- Add alert configurations to asaas_config
ALTER TABLE public.asaas_config 
ADD COLUMN IF NOT EXISTS alert_email_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS alert_email_address TEXT,
ADD COLUMN IF NOT EXISTS alert_whatsapp_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS alert_whatsapp_number TEXT,
ADD COLUMN IF NOT EXISTS failure_threshold INTEGER DEFAULT 5;

-- Add bank account column to asaas_payments for filtering
ALTER TABLE public.asaas_payments 
ADD COLUMN IF NOT EXISTS conta_bancaria TEXT;

-- Function to check for queue failures and trigger alerts
CREATE OR REPLACE FUNCTION public.check_asaas_queue_failures()
RETURNS TRIGGER AS $$
DECLARE
    v_failure_count INTEGER;
    v_threshold INTEGER;
    v_config RECORD;
BEGIN
    -- Get failure count for the last hour
    SELECT COUNT(*) INTO v_failure_count
    FROM public.asaas_sync_queue
    WHERE status = 'failed' 
      AND updated_at > now() - interval '1 hour';

    -- Get threshold from config
    SELECT * INTO v_config FROM public.asaas_config LIMIT 1;
    v_threshold := COALESCE(v_config.failure_threshold, 5);

    -- If threshold reached, log an event that can be picked up by an edge function or notify directly
    IF v_failure_count >= v_threshold THEN
        -- Insert into audit trail as a system alert
        INSERT INTO public.asaas_audit_trail (
            action,
            details,
            created_at
        ) VALUES (
            'QUEUE_ALERT',
            jsonb_build_object(
                'failure_count', v_failure_count,
                'threshold', v_threshold,
                'message', 'Limite de falhas na fila de retentativas atingido.'
            ),
            now()
        );
        
        -- In a real scenario, we would trigger an edge function here
        -- via a webhook or pg_net if available.
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to check failures on sync queue update
DROP TRIGGER IF EXISTS tr_check_asaas_queue_failures ON public.asaas_sync_queue;
CREATE TRIGGER tr_check_asaas_queue_failures
AFTER UPDATE ON public.asaas_sync_queue
FOR EACH ROW
WHEN (NEW.status = 'failed')
EXECUTE FUNCTION public.check_asaas_queue_failures();
