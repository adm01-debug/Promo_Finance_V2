CREATE OR REPLACE FUNCTION public.is_ip_whitelisted(_ip_address inet)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
    SELECT EXISTS (
        SELECT 1
        FROM public.ip_whitelist
        WHERE is_active = true
          AND (ip_address = _ip_address OR _ip_address << cidr_range::inet)
    )
$function$
