
-- Fix SECURITY DEFINER on all views - set to SECURITY INVOKER
ALTER VIEW public.vw_contas_pagar_painel SET (security_invoker = on);
ALTER VIEW public.vw_contas_receber_painel SET (security_invoker = on);
ALTER VIEW public.vw_dre_mensal SET (security_invoker = on);
ALTER VIEW public.vw_dso_aging SET (security_invoker = on);
ALTER VIEW public.vw_saldos_contas SET (security_invoker = on);
ALTER VIEW public.vw_fluxo_caixa SET (security_invoker = on);
ALTER VIEW public.vw_fluxo_caixa_diario SET (security_invoker = on);
ALTER VIEW public.vw_gastos_centro_custo SET (security_invoker = on);
ALTER VIEW public.vw_metricas_cobranca SET (security_invoker = on);
ALTER VIEW public.vw_transferencias_painel SET (security_invoker = on);
ALTER VIEW public.vw_webhooks_recentes SET (security_invoker = on);
