CREATE OR REPLACE FUNCTION public.resolve_sso_providers_for_domain(p_domain text)
 RETURNS TABLE(id uuid, nome text, tipo text, preset text, force_sso_for_domains boolean, ordem integer)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
  SELECT
    sp.id,
    sp.nome,
    sp.tipo,
    sp.preset,
    sp.force_sso_for_domains,
    sp.ordem
  FROM public.sso_providers sp
  WHERE sp.ativo = true
    AND length(trim(coalesce(p_domain, ''))) BETWEEN 3 AND 253
    AND trim(lower(p_domain)) = ANY (
      SELECT lower(domain) FROM unnest(sp.allowed_domains) AS domain
    )
  ORDER BY sp.ordem ASC, sp.nome ASC;
$function$
