-- 1. Revoke anon access from all financial views (security_invoker already set)
REVOKE SELECT ON public.vw_contas_receber_painel FROM anon;
REVOKE SELECT ON public.vw_contas_pagar_painel FROM anon;
REVOKE SELECT ON public.vw_transferencias_painel FROM anon;
REVOKE SELECT ON public.vw_saldos_contas FROM anon;
REVOKE SELECT ON public.vw_fluxo_caixa FROM anon;
REVOKE SELECT ON public.vw_fluxo_caixa_diario FROM anon;
REVOKE SELECT ON public.vw_dre_mensal FROM anon;
REVOKE SELECT ON public.vw_dso_aging FROM anon;
REVOKE SELECT ON public.vw_metricas_cobranca FROM anon;
REVOKE SELECT ON public.vw_gastos_centro_custo FROM anon;
REVOKE SELECT ON public.vw_webhooks_recentes FROM anon;

-- 2. Restrict ponto_funcionarios to admin only
DROP POLICY IF EXISTS "Admin/financeiro can view ponto_funcionarios" ON public.ponto_funcionarios;
DROP POLICY IF EXISTS "Admins manage ponto_funcionarios" ON public.ponto_funcionarios;

CREATE POLICY "Admin can view ponto_funcionarios"
  ON public.ponto_funcionarios FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin can manage ponto_funcionarios"
  ON public.ponto_funcionarios FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- 3. Add INSERT policy for rate_limit_logs
CREATE POLICY "System can insert rate limit logs"
  ON public.rate_limit_logs FOR INSERT TO authenticated
  WITH CHECK (true);