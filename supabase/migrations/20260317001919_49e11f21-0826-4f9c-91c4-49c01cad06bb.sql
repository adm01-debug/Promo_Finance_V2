
-- Fix security definer views by recreating with security_invoker=true

-- Get view definitions first, then recreate
DO $$
DECLARE
  v_views TEXT[] := ARRAY[
    'vw_contas_pagar_painel', 'vw_contas_receber_painel', 'vw_dre_mensal',
    'vw_dso_aging', 'vw_fluxo_caixa', 'vw_fluxo_caixa_diario',
    'vw_gastos_centro_custo', 'vw_metricas_cobranca', 'vw_saldos_contas',
    'vw_transferencias_painel', 'vw_webhooks_recentes'
  ];
  v_view TEXT;
BEGIN
  FOREACH v_view IN ARRAY v_views LOOP
    EXECUTE format('ALTER VIEW public.%I SET (security_invoker = true)', v_view);
  END LOOP;
END $$;
