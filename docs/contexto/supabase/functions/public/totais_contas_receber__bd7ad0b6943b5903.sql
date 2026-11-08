CREATE OR REPLACE FUNCTION public.totais_contas_receber(p_empresa_id uuid DEFAULT NULL::uuid, p_centro_custo_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(total_receber numeric, total_vencidas_receber numeric, receitas_mes numeric)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT
    COALESCE(SUM(cr.valor - COALESCE(cr.valor_recebido, 0))
      FILTER (WHERE cr.status NOT IN ('pago', 'cancelado')), 0) AS total_receber,
    COALESCE(SUM(cr.valor - COALESCE(cr.valor_recebido, 0))
      FILTER (WHERE cr.status = 'vencido'), 0) AS total_vencidas_receber,
    COALESCE(SUM(cr.valor_recebido)
      FILTER (
        WHERE cr.data_recebimento >= date_trunc('month', (now() AT TIME ZONE 'America/Sao_Paulo'))::date
          AND cr.data_recebimento < (date_trunc('month', (now() AT TIME ZONE 'America/Sao_Paulo')) + INTERVAL '1 month')::date
      ), 0) AS receitas_mes
  FROM public.contas_receber cr
  WHERE (p_empresa_id IS NULL OR cr.empresa_id = p_empresa_id)
    AND (p_centro_custo_id IS NULL OR cr.centro_custo_id = p_centro_custo_id);
$function$
