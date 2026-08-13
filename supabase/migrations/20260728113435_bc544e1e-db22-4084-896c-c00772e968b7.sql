CREATE OR REPLACE FUNCTION public.resolve_integrity_alert(p_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_updated integer := 0;
BEGIN
  IF v_uid IS NULL OR NOT public.has_role(v_uid, 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores.';
  END IF;

  -- Idempotente: só encerra o que ainda está aberto.
  UPDATE public.integrity_alerts
  SET resolved_at = now(), resolved_by = v_uid, updated_at = now()
  WHERE id = p_id AND resolved_at IS NULL;
  GET DIAGNOSTICS v_updated = ROW_COUNT;

  IF v_updated = 0 AND NOT EXISTS (SELECT 1 FROM public.integrity_alerts WHERE id = p_id) THEN
    RAISE EXCEPTION 'Alerta não encontrado.';
  END IF;

  RETURN jsonb_build_object('success', true, 'updated', v_updated);
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.resolve_integrity_alert(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.resolve_integrity_alert(uuid) TO authenticated, service_role;