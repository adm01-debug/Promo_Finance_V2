-- As 5 views abaixo podem não existir aqui pelo mesmo motivo de 20260317125502
-- (guards de 20260317125441 sobre colunas só adicionadas em maio).
DO $$
BEGIN
  IF to_regclass('public.vw_contas_receber_painel') IS NOT NULL THEN
    EXECUTE 'ALTER VIEW public.vw_contas_receber_painel SET (security_invoker = true)';
  END IF;
  IF to_regclass('public.vw_contas_pagar_painel') IS NOT NULL THEN
    EXECUTE 'ALTER VIEW public.vw_contas_pagar_painel SET (security_invoker = true)';
  END IF;
  IF to_regclass('public.vw_dre_mensal') IS NOT NULL THEN
    EXECUTE 'ALTER VIEW public.vw_dre_mensal SET (security_invoker = true)';
  END IF;
  IF to_regclass('public.vw_dso_aging') IS NOT NULL THEN
    EXECUTE 'ALTER VIEW public.vw_dso_aging SET (security_invoker = true)';
  END IF;
  IF to_regclass('public.vw_gastos_centro_custo') IS NOT NULL THEN
    EXECUTE 'ALTER VIEW public.vw_gastos_centro_custo SET (security_invoker = true)';
  END IF;
END
$$;
ALTER VIEW public.vw_transferencias_painel SET (security_invoker = true);
ALTER VIEW public.vw_saldos_contas SET (security_invoker = true);
ALTER VIEW public.vw_fluxo_caixa SET (security_invoker = true);
ALTER VIEW public.vw_fluxo_caixa_diario SET (security_invoker = true);
ALTER VIEW public.vw_metricas_cobranca SET (security_invoker = true);
ALTER VIEW public.vw_webhooks_recentes SET (security_invoker = true);