CREATE OR REPLACE FUNCTION public.is_country_blocked(_country_code text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
    SELECT EXISTS (
        SELECT 1
        FROM public.geo_blocks
        WHERE country_code = _country_code
          AND is_blocked = true
          AND (expires_at IS NULL OR expires_at > now())
    )
$function$
