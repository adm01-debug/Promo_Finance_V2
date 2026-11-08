CREATE OR REPLACE FUNCTION public.fn_indices_contabeis(p_empresa_id uuid, p_competencia text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
AS $function$
BEGIN RETURN jsonb_build_object('competencia',p_competencia,'calculado_em',now()); END;
$function$
