CREATE OR REPLACE FUNCTION public.get_retencoes_pendentes_count(p_empresa_id uuid)
 RETURNS bigint
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  IF p_empresa_id IS NULL THEN
    RAISE EXCEPTION 'Empresa nao informada';
  END IF;

  IF NOT public.empresa_acessivel(p_empresa_id) THEN
    RAISE EXCEPTION 'Acesso negado a empresa informada';
  END IF;

  RETURN (
    SELECT COUNT(*)
    FROM public.retencoes_fonte
    WHERE empresa_id = p_empresa_id
      AND status = 'pendente'
      AND darf_gerado = false
  );
END;
$function$
