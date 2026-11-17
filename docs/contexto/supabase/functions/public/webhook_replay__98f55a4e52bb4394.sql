CREATE OR REPLACE FUNCTION public.webhook_replay(p_id uuid)
 RETURNS webhooks_log
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_row public.webhooks_log%ROWTYPE;
  v_dlq_id uuid;
BEGIN
  -- Guarda: só admin ou service_role (auth.uid() nulo).
  IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'unauthorized: admin role required to replay webhooks';
  END IF;

  -- O dlq_id tem de ser lido ANTES do update: o `RETURNING *` devolve a linha
  -- nova, em que dlq_id acabou de virar NULL, de modo que o bloco seguinte
  -- nunca rodava e o item da DLQ ficava aberto para sempre.
  SELECT dlq_id INTO v_dlq_id
    FROM public.webhooks_log
   WHERE id = p_id
     FOR UPDATE;

  UPDATE public.webhooks_log
     SET status        = 'pending',
         next_retry_at = now(),
         attempts      = LEAST(attempts, max_attempts - 1),
         error_message = NULL,
         last_error_at = NULL,
         dlq_id        = NULL
   WHERE id = p_id
  RETURNING * INTO v_row;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'webhook % not found', p_id;
  END IF;

  -- Se veio de DLQ, marca DLQ como resolvido.
  IF v_dlq_id IS NOT NULL THEN
    UPDATE public.webhook_dlq
       SET resolved_at = now(),
           resolved_by = COALESCE(resolved_by, auth.uid()),
           notes = COALESCE(notes,'') || E'\nRe-enfileirado via webhook_replay em ' || now()::text
     WHERE id = v_dlq_id
       AND resolved_at IS NULL;
  END IF;

  RETURN v_row;
END;
$function$
