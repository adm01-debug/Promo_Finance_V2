
-- Fix SECURITY DEFINER on all views - set to SECURITY INVOKER
-- vw_contas_pagar_painel/vw_contas_receber_painel podem não existir aqui:
-- o guard de 20260317125441 pula a criação quando contas_pagar.conta_bancaria_id
-- ainda não existe (só adicionada em 20260518164611). ALTER VIEW sobre relação
-- inexistente quebraria o replay do zero (achado do cubic na PR #63).
DO $$
BEGIN
  IF to_regclass('public.vw_contas_pagar_painel') IS NOT NULL THEN
    EXECUTE 'ALTER VIEW public.vw_contas_pagar_painel SET (security_invoker = on)';
  END IF;
  IF to_regclass('public.vw_contas_receber_painel') IS NOT NULL THEN
    EXECUTE 'ALTER VIEW public.vw_contas_receber_painel SET (security_invoker = on)';
  END IF;
END
$$;
ALTER VIEW public.vw_dre_mensal SET (security_invoker = on);
ALTER VIEW public.vw_dso_aging SET (security_invoker = on);
ALTER VIEW public.vw_saldos_contas SET (security_invoker = on);
ALTER VIEW public.vw_fluxo_caixa SET (security_invoker = on);
ALTER VIEW public.vw_fluxo_caixa_diario SET (security_invoker = on);
ALTER VIEW public.vw_gastos_centro_custo SET (security_invoker = on);
ALTER VIEW public.vw_metricas_cobranca SET (security_invoker = on);
ALTER VIEW public.vw_transferencias_painel SET (security_invoker = on);
ALTER VIEW public.vw_webhooks_recentes SET (security_invoker = on);
