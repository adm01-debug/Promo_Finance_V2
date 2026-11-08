CREATE OR REPLACE FUNCTION public.is_known_device(_user_id uuid, _fingerprint text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_devices
        WHERE user_id = _user_id
          AND device_fingerprint = _fingerprint
    )
$function$
