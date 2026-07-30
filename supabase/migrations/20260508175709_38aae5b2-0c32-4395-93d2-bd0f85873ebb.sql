-- Create asaas_config table
CREATE TABLE IF NOT EXISTS public.asaas_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    retry_limit INTEGER DEFAULT 5,
    retry_interval_minutes INTEGER DEFAULT 30,
    backoff_multiplier DECIMAL DEFAULT 2.0,
    auto_sync_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(empresa_id)
);

-- Enable RLS
ALTER TABLE public.asaas_config ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own company asaas config"
ON public.asaas_config FOR SELECT
USING (empresa_id IN (SELECT id FROM public.empresas));

CREATE POLICY "Users can update their own company asaas config"
ON public.asaas_config FOR UPDATE
USING (empresa_id IN (SELECT id FROM public.empresas));

CREATE POLICY "Users can insert their own company asaas config"
ON public.asaas_config FOR INSERT
WITH CHECK (empresa_id IN (SELECT id FROM public.empresas));

-- Trigger for updated_at
CREATE TRIGGER update_asaas_config_updated_at
BEFORE UPDATE ON public.asaas_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to export audit trail as CSV (can be called via RPC)
CREATE OR REPLACE FUNCTION public.export_asaas_audit_csv(p_empresa_id UUID)
RETURNS TEXT AS $$
DECLARE
    v_csv TEXT;
BEGIN
    SELECT string_agg(row_data, E'\n')
    INTO v_csv
    FROM (
        SELECT 'ID,Payment_ID,Event_Type,Description,Status,Created_At' AS row_data
        UNION ALL
        SELECT 
            id::text || ',' || 
            payment_id::text || ',' || 
            event_type || ',' || 
            '"' || REPLACE(COALESCE(description, ''), '"', '""') || '",' || 
            COALESCE(status, '') || ',' || 
            created_at::text
        FROM public.asaas_audit_trail
        WHERE payment_id IN (SELECT id FROM public.asaas_payments WHERE empresa_id = p_empresa_id)
        ORDER BY created_at DESC
    ) s;
    
    RETURN v_csv;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
