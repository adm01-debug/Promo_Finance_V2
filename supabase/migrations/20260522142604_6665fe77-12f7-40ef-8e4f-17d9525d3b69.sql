-- Fix Security Definer Views (change to SECURITY INVOKER)
ALTER VIEW public.vw_contas_pagar_painel SET (security_invoker = on);
ALTER VIEW public.vw_contas_receber_painel SET (security_invoker = on);
ALTER VIEW public.vw_dre_mensal SET (security_invoker = on);
ALTER VIEW public.vw_dso_aging SET (security_invoker = on);
ALTER VIEW public.vw_fluxo_caixa SET (security_invoker = on);
ALTER VIEW public.vw_fluxo_caixa_diario SET (security_invoker = on);
ALTER VIEW public.vw_gastos_centro_custo SET (security_invoker = on);
ALTER VIEW public.vw_metricas_cobranca SET (security_invoker = on);
ALTER VIEW public.vw_saldos_contas SET (security_invoker = on);

-- Ensure critical tables with RLS enabled have at least a basic policy
DO $$
BEGIN
    -- For active_tracking, allow authenticated users (usually safe for a log/tracking table if sensitive data is not exposed)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'active_tracking' AND table_schema = 'public') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'active_tracking' AND policyname = 'Authenticated users can view tracking') THEN
            CREATE POLICY "Authenticated users can view tracking" ON public.active_tracking FOR SELECT USING (auth.role() = 'authenticated');
        END IF;
    END IF;
    
    -- health_scores_operacionais
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'health_scores_operacionais' AND table_schema = 'public') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'health_scores_operacionais' AND policyname = 'Authenticated users can view health scores') THEN
            CREATE POLICY "Authenticated users can view health scores" ON public.health_scores_operacionais FOR SELECT USING (auth.role() = 'authenticated');
        END IF;
    END IF;

    -- allowed_ips (Admin only)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'allowed_ips' AND table_schema = 'public') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'allowed_ips' AND policyname = 'Admins can manage allowed ips') THEN
            CREATE POLICY "Admins can manage allowed ips" ON public.allowed_ips FOR ALL USING (
              EXISTS (
                SELECT 1 FROM public.user_roles 
                WHERE user_id = auth.uid() AND role = 'admin'
              )
            );
        END IF;
    END IF;
END
$$;