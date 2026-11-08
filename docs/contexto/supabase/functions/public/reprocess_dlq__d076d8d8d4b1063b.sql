CREATE OR REPLACE FUNCTION public.reprocess_dlq(p_dlq_id uuid, p_notes text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_dlq public.webhook_dlq%ROWTYPE;
  v_new_log_id UUID;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem reprocessar DLQ.';
  END IF;

  SELECT * INTO v_dlq FROM public.webhook_dlq WHERE id = p_dlq_id AND resolved_at IS NULL;
  IF v_dlq IS NULL THEN
    RAISE EXCEPTION 'DLQ item não encontrado ou já resolvido';
  END IF;

  INSERT INTO public.webhooks_log (
    source, event_type, external_id, payload, status,
    attempts, next_retry_at
  ) VALUES (
    v_dlq.source, v_dlq.event_type, v_dlq.external_id, v_dlq.payload,
    'pending', 0, now()
  ) RETURNING id INTO v_new_log_id;

  UPDATE public.webhook_dlq
     SET resolved_at = now(),
         resolved_by = auth.uid(),
         notes = COALESCE(p_notes, notes)
   WHERE id = p_dlq_id;

  RETURN v_new_log_id;
END;
$function$
