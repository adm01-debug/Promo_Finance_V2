CREATE OR REPLACE FUNCTION public.registrar_evento_receber(p_conta_id uuid, p_evento text, p_detalhes jsonb DEFAULT '{}'::jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE v_id uuid;
BEGIN
  INSERT INTO public.logs_baixa_automatica (user_id, conta_receber_id, resultado, detalhes)
  VALUES (COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid), p_conta_id, p_evento, p_detalhes)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$function$
