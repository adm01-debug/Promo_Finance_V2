CREATE OR REPLACE FUNCTION public.enqueue_webhook_retry(p_log_id uuid, p_source text, p_event_type text, p_external_id text, p_payload jsonb, p_error text, p_headers jsonb DEFAULT '{}'::jsonb)
 RETURNS TABLE(action text, next_retry_at timestamp with time zone, attempts integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_attempts INTEGER := 0;
  v_next TIMESTAMPTZ;
  v_backoff INTERVAL;
BEGIN
  -- Determinar tentativa atual
  IF p_log_id IS NOT NULL THEN
    SELECT COALESCE(wl.attempts, 0) + 1 INTO v_attempts
      FROM public.webhooks_log wl WHERE wl.id = p_log_id;
  ELSE
    v_attempts := 1;
  END IF;

  IF v_attempts >= 3 THEN
    -- Move para DLQ
    INSERT INTO public.webhook_dlq (
      source, event_type, external_id, payload, headers,
      error_message, attempts, last_attempt_at
    ) VALUES (
      p_source, p_event_type, p_external_id, COALESCE(p_payload,'{}'::jsonb),
      COALESCE(p_headers,'{}'::jsonb), p_error, v_attempts, now()
    );

    IF p_log_id IS NOT NULL THEN
      UPDATE public.webhooks_log
         SET status='dead', attempts=v_attempts, last_error_at=now(),
             error_message=p_error, next_retry_at=NULL
       WHERE id = p_log_id;
    END IF;

    RETURN QUERY SELECT 'moved_to_dlq'::TEXT, NULL::TIMESTAMPTZ, v_attempts;
    RETURN;
  END IF;

  -- Backoff exponencial: 1min, 5min, 30min
  v_backoff := CASE v_attempts
    WHEN 1 THEN INTERVAL '1 minute'
    WHEN 2 THEN INTERVAL '5 minutes'
    ELSE INTERVAL '30 minutes'
  END;
  v_next := now() + v_backoff;

  IF p_log_id IS NOT NULL THEN
    UPDATE public.webhooks_log
       SET status='retrying', attempts=v_attempts,
           next_retry_at=v_next, last_error_at=now(),
           error_message=p_error
     WHERE id = p_log_id;
  ELSE
    INSERT INTO public.webhooks_log (
      source, event_type, external_id, payload, status,
      error_message, attempts, next_retry_at, last_error_at
    ) VALUES (
      p_source, p_event_type, p_external_id, COALESCE(p_payload,'{}'::jsonb),
      'retrying', p_error, v_attempts, v_next, now()
    );
  END IF;

  RETURN QUERY SELECT 'scheduled_retry'::TEXT, v_next, v_attempts;
END;
$function$
