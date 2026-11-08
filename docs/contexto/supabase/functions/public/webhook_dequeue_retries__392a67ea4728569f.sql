CREATE OR REPLACE FUNCTION public.webhook_dequeue_retries(p_limit integer DEFAULT 25)
 RETURNS SETOF webhooks_log
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  UPDATE public.webhooks_log
     SET status = 'processing'
   WHERE id IN (
     SELECT id
       FROM public.webhooks_log
      WHERE status IN ('pending','retrying')
        AND next_retry_at IS NOT NULL
        AND next_retry_at <= now()
      ORDER BY next_retry_at ASC
      LIMIT GREATEST(1, p_limit)
      FOR UPDATE SKIP LOCKED
   )
  RETURNING *;
END;
$function$
