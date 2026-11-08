CREATE OR REPLACE FUNCTION public.provisionar_usuario_atual()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Autenticação obrigatória para provisionamento';
  END IF;
  RETURN public.provisionar_usuario(v_uid);
END;
$function$
