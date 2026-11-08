CREATE OR REPLACE FUNCTION public.registrar_auditoria_config(_tipo_acao text, _empresa_id uuid DEFAULT NULL::uuid, _detalhes jsonb DEFAULT '{}'::jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
    v_user_id UUID;
BEGIN
    v_user_id := auth.uid();
    
    INSERT INTO public.audit_logs (
        user_id,
        action,
        table_name,
        details,
        new_data,
        created_at
    ) VALUES (
        v_user_id,
        _tipo_acao,
        'config_change',
        'Config change for empresa ' || COALESCE(_empresa_id::text, 'global'),
        _detalhes,
        now()
    );
END;
$function$
