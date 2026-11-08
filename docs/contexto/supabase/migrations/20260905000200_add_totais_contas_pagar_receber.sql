CREATE OR REPLACE FUNCTION public.totais_contas_pagar(
  p_empresa_id uuid DEFAULT NULL,
  p_centro_custo_id uuid DEFAULT NULL
)
RETURNS TABLE (
  total_pagar numeric,
  total_vencidas_pagar numeric,
  despesas_mes numeric
)
LANGUAGE sql
STABLE
SET search_path = public
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.totais_contas_receber(
  p_empresa_id uuid DEFAULT NULL,
  p_centro_custo_id uuid DEFAULT NULL
)
RETURNS TABLE (
  total_receber numeric,
  total_vencidas_receber numeric,
  receitas_mes numeric
)
LANGUAGE sql
STABLE
SET search_path = public
AS $$
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
$$;

REVOKE ALL ON FUNCTION public.totais_contas_pagar(uuid, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.totais_contas_receber(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.totais_contas_pagar(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.totais_contas_receber(uuid, uuid) TO authenticated, service_role;

NOTIFY pgrst, 'reload schema';
