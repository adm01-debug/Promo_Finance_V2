CREATE OR REPLACE FUNCTION public.generate_reconciliation_suggestions(p_empresa_id uuid, p_transaction_date date, p_transaction_value numeric, p_transaction_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
    -- Basic stub for suggestions
    RETURN jsonb_build_array();
END;
$function$
