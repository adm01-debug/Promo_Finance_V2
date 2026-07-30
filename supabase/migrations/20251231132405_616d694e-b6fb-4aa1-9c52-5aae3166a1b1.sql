-- Create function to get lockout details including remaining time
CREATE OR REPLACE FUNCTION public.get_lockout_details(_email text)
 RETURNS TABLE(is_locked boolean, remaining_minutes integer, lockout_count integer)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT 
    CASE WHEN locked_until > now() THEN true ELSE false END as is_locked,
    CASE WHEN locked_until > now() 
         THEN CEIL(EXTRACT(EPOCH FROM (locked_until - now())) / 60)::integer 
         ELSE 0 
    END as remaining_minutes,
    COALESCE(account_lockouts.lockout_count, 0) as lockout_count
  FROM public.account_lockouts
  WHERE user_email = _email
$function$;