CREATE OR REPLACE FUNCTION public.log_audit(p_table_name text, p_record_id uuid, p_action text, p_details text DEFAULT NULL::text, p_old_data jsonb DEFAULT NULL::jsonb, p_new_data jsonb DEFAULT NULL::jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE v_id UUID;
BEGIN
    INSERT INTO public.audit_logs (table_name, record_id, action, details, old_data, new_data, user_id, user_email)
    VALUES (p_table_name, p_record_id, p_action, p_details, p_old_data, p_new_data, auth.uid(), (auth.jwt()->>'email'))
    RETURNING id INTO v_id;
    RETURN v_id;
END;
$function$
