CREATE OR REPLACE FUNCTION public.reprocess_dlq(p_dlq_id uuid, p_notes text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_dlq public.webhook_dlq%ROWTYPE;
  v_log_id UUID;
  v_log_status TEXT;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem reprocessar DLQ.';
  END IF;

  SELECT * INTO v_dlq
    FROM public.webhook_dlq
   WHERE id = p_dlq_id AND resolved_at IS NULL
   FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'DLQ item não encontrado ou já resolvido';
  END IF;

  SELECT id, status INTO v_log_id, v_log_status
    FROM public.webhooks_log
   WHERE dlq_id = p_dlq_id
   ORDER BY created_at DESC
   LIMIT 1
   FOR UPDATE;

  IF v_log_id IS NULL AND v_dlq.external_id IS NOT NULL THEN
    SELECT id, status INTO v_log_id, v_log_status
      FROM public.webhooks_log
     WHERE source = v_dlq.source AND external_id = v_dlq.external_id
     ORDER BY created_at DESC
     LIMIT 1
     FOR UPDATE;
  END IF;

  IF v_log_status = 'success' THEN
    UPDATE public.webhook_dlq
       SET resolved_at = now(),
           resolved_by = auth.uid(),
           notes = concat_ws(
             ' | ',
             COALESCE(p_notes, notes),
             'evento ja concluido (webhooks_log.status=success): item resolvido sem reexecucao'
           )
     WHERE id = p_dlq_id;
    RETURN v_log_id;
  END IF;

  IF v_log_status = 'processing' THEN
    RAISE EXCEPTION 'Evento em processamento agora (webhooks_log %): aguarde o fim da tentativa atual.', v_log_id;
  END IF;

  IF v_log_id IS NOT NULL THEN
    UPDATE public.webhooks_log
       SET status        = 'pending',
           attempts      = 0,
           next_retry_at = now(),
           processed_at  = NULL,
           error_message = NULL,
           last_error_at = NULL,
           dlq_id        = NULL
     WHERE id = v_log_id;
  ELSE
    INSERT INTO public.webhooks_log (
      source, event_type, external_id, payload, status,
      attempts, next_retry_at
    ) VALUES (
      v_dlq.source, v_dlq.event_type, v_dlq.external_id, v_dlq.payload,
      'pending', 0, now()
    ) RETURNING id INTO v_log_id;
  END IF;

  UPDATE public.webhook_dlq
     SET resolved_at = now(),
         resolved_by = auth.uid(),
         notes = COALESCE(p_notes, notes)
   WHERE id = p_dlq_id;

  RETURN v_log_id;
END;
$function$
