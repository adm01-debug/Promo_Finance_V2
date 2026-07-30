CREATE OR REPLACE FUNCTION public.get_asaas_payment_stats(p_empresa_id UUID)
RETURNS TABLE (
    status TEXT,
    total_count BIGINT,
    total_value NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ap.status,
        COUNT(*),
        SUM(ap.valor)
    FROM 
        public.asaas_payments ap
    WHERE 
        ap.empresa_id = p_empresa_id
    GROUP BY 
        ap.status;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
