CREATE OR REPLACE FUNCTION public.webhook_mark_failure(p_id uuid, p_error text, p_retryable boolean DEFAULT true)
 RETURNS TABLE(status text, will_retry boolean, next_retry_at timestamp with time zone, dlq_id uuid)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_row public.webhooks_log%ROWTYPE;
  v_backoff INTERVAL;
  v_dlq UUID;
  v_final_status TEXT;
  v_will_retry BOOLEAN := false;
  v_next TIMESTAMPTZ;
BEGIN
  SELECT * INTO v_row FROM public.webhooks_log WHERE id = p_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'webhook % not found', p_id;
  END IF;

  IF p_retryable AND v_row.attempts < v_row.max_attempts THEN
    -- 2^attempts minutos, cap 60min
    v_backoff := make_interval(mins => LEAST(60, POWER(2, v_row.attempts)::INT));
    v_next := now() + v_backoff;
    v_final_status := 'retrying';
    v_will_retry := true;

    UPDATE public.webhooks_log
       SET status        = 'retrying',
           error_message = p_error,
           last_error_at = now(),
           next_retry_at = v_next
     WHERE id = p_id;
  ELSE
    -- Sem retry: promove ao DLQ
    v_final_status := 'dead';
    INSERT INTO public.webhook_dlq(source, event_type, external_id, payload, error_message, attempts)
    VALUES (v_row.source, v_row.event_type, v_row.external_id, v_row.payload, p_error, v_row.attempts)
    RETURNING id INTO v_dlq;

    UPDATE public.webhooks_log
       SET status        = 'dead',
           error_message = p_error,
           last_error_at = now(),
           next_retry_at = NULL,
           dlq_id        = v_dlq
     WHERE id = p_id;
  END IF;

  RETURN QUERY SELECT v_final_status, v_will_retry, v_next, v_dlq;
END;
$function$
