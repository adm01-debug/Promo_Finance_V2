CREATE OR REPLACE FUNCTION public.registrar_evento_cobranca(p_conta_id uuid, p_evento text, p_mensagem text DEFAULT NULL::text, p_canal text DEFAULT NULL::text, p_destinatario text DEFAULT NULL::text, p_metadata jsonb DEFAULT '{}'::jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_id uuid;
  v_empresa uuid;
BEGIN
  SELECT empresa_id INTO v_empresa FROM public.contas_receber WHERE id = p_conta_id;

  INSERT INTO public.historico_cobranca (
    conta_receber_id, empresa_id, evento, mensagem, canal, destinatario, metadata, created_at
  ) VALUES (
    p_conta_id, v_empresa, p_evento, p_mensagem, p_canal, p_destinatario, COALESCE(p_metadata, '{}'::jsonb), now()
  ) RETURNING id INTO v_id;

  RETURN v_id;
END;
$function$
