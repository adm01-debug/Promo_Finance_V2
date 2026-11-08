CREATE OR REPLACE FUNCTION public.totais_contas_pagar(p_empresa_id uuid DEFAULT NULL::uuid, p_centro_custo_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(total_pagar numeric, total_vencidas_pagar numeric, despesas_mes numeric)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT
    COALESCE(SUM(cp.valor - COALESCE(cp.valor_pago, 0))
      FILTER (WHERE cp.status NOT IN ('pago', 'cancelado')), 0) AS total_pagar,
    COALESCE(SUM(cp.valor - COALESCE(cp.valor_pago, 0))
      FILTER (WHERE cp.status = 'vencido'), 0) AS total_vencidas_pagar,
    COALESCE(SUM(cp.valor_pago)
      FILTER (
        WHERE cp.data_pagamento >= date_trunc('month', (now() AT TIME ZONE 'America/Sao_Paulo'))::date
          AND cp.data_pagamento < (date_trunc('month', (now() AT TIME ZONE 'America/Sao_Paulo')) + INTERVAL '1 month')::date
      ), 0) AS despesas_mes
  FROM public.contas_pagar cp
  WHERE (p_empresa_id IS NULL OR cp.empresa_id = p_empresa_id)
    AND (p_centro_custo_id IS NULL OR cp.centro_custo_id = p_centro_custo_id);
$function$
