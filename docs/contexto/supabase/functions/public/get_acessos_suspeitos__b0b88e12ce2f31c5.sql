CREATE OR REPLACE FUNCTION public.get_acessos_suspeitos(_horas integer DEFAULT 168, _somente_abertos boolean DEFAULT true)
 RETURNS SETOF acessos_suspeitos
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT s.* FROM public.acessos_suspeitos s
  WHERE public.has_role((SELECT auth.uid()), 'admin'::public.app_role)
    AND (s.empresa_id IS NULL OR public.empresa_acessivel(s.empresa_id))
    AND s.created_at >= now() - make_interval(hours => GREATEST(COALESCE(_horas, 168), 1))
    AND (NOT COALESCE(_somente_abertos, true) OR s.revisado_em IS NULL)
  ORDER BY (s.severidade = 'critical') DESC, s.created_at DESC
  LIMIT 500;
$function$
