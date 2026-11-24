CREATE OR REPLACE FUNCTION public.registrar_auditoria_config(_tipo_acao text, _empresa_id uuid DEFAULT NULL::uuid, _detalhes jsonb DEFAULT '{}'::jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    IF auth.role() IS DISTINCT FROM 'service_role'
       AND session_user NOT IN ('postgres', 'supabase_admin') THEN
      RAISE EXCEPTION 'Autenticação necessária para registrar auditoria.' USING ERRCODE = '42501';
    END IF;
  ELSIF _empresa_id IS NULL THEN
    IF NOT public.has_role(v_user_id, 'admin'::public.app_role) THEN
      RAISE EXCEPTION 'Somente administradores podem registrar eventos globais.' USING ERRCODE = '42501';
    END IF;
  ELSIF NOT public.empresa_acessivel(_empresa_id) THEN
    RAISE EXCEPTION 'Sem acesso à empresa informada.' USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.audit_logs (
    user_id, action, table_name, details, new_data, created_at
  ) VALUES (
    v_user_id,
    _tipo_acao,
    'config_change',
    'Config change for empresa ' || COALESCE(_empresa_id::text, 'global'),
    COALESCE(_detalhes, '{}'::jsonb),
    now()
  );
END;
$function$
