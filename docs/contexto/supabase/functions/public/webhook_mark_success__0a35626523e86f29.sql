CREATE OR REPLACE FUNCTION public.webhook_mark_success(p_id uuid, p_response jsonb DEFAULT NULL::jsonb)
 RETURNS void
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  UPDATE public.webhooks_log
     SET status        = 'success',
         processed_at  = now(),
         last_response = p_response,
         error_message = NULL,
         next_retry_at = NULL
   WHERE id = p_id;
$function$
