-- Fix remaining permissive RLS policies (batch 2)

-- rate_limit_logs ALL
DROP POLICY IF EXISTS "System can manage rate limit logs" ON public.rate_limit_logs;
CREATE POLICY "System can manage rate limit logs" ON public.rate_limit_logs FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- recomendacoes_metas_ia UPDATE/INSERT
DROP POLICY IF EXISTS "Usuários podem atualizar recomendações" ON public.recomendacoes_metas_ia;
CREATE POLICY "Usuários podem atualizar recomendações" ON public.recomendacoes_metas_ia FOR UPDATE USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "Sistema pode inserir recomendações" ON public.recomendacoes_metas_ia;
CREATE POLICY "Sistema pode inserir recomendações" ON public.recomendacoes_metas_ia FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- regimes_especiais_empresa (individual policies not caught by ALL policy)
DROP POLICY IF EXISTS "Usuários autenticados podem deletar regimes especiais" ON public.regimes_especiais_empresa;
CREATE POLICY "Usuários autenticados podem deletar regimes especiais" ON public.regimes_especiais_empresa FOR DELETE USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "Usuários autenticados podem inserir regimes especiais" ON public.regimes_especiais_empresa;
CREATE POLICY "Usuários autenticados podem inserir regimes especiais" ON public.regimes_especiais_empresa FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar regimes especiais" ON public.regimes_especiais_empresa;
CREATE POLICY "Usuários autenticados podem atualizar regimes especiais" ON public.regimes_especiais_empresa FOR UPDATE USING (auth.uid() IS NOT NULL);

-- regras_conciliacao UPDATE/INSERT
DROP POLICY IF EXISTS "Authenticated users can update regras_conciliacao" ON public.regras_conciliacao;
CREATE POLICY "Authenticated users can update regras_conciliacao" ON public.regras_conciliacao FOR UPDATE USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "Authenticated users can insert regras_conciliacao" ON public.regras_conciliacao;
CREATE POLICY "Authenticated users can insert regras_conciliacao" ON public.regras_conciliacao FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- security_alerts INSERT
DROP POLICY IF EXISTS "System can insert security alerts" ON public.security_alerts;
CREATE POLICY "System can insert security alerts" ON public.security_alerts FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- split_payment_transacoes INSERT/UPDATE (individual policies)
DROP POLICY IF EXISTS "Usuários autenticados podem inserir split payment" ON public.split_payment_transacoes;
CREATE POLICY "Usuários autenticados podem inserir split payment" ON public.split_payment_transacoes FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar split payment" ON public.split_payment_transacoes;
CREATE POLICY "Usuários autenticados podem atualizar split payment" ON public.split_payment_transacoes FOR UPDATE USING (auth.uid() IS NOT NULL);

-- user_sessions ALL
DROP POLICY IF EXISTS "System can manage sessions" ON public.user_sessions;
CREATE POLICY "System can manage sessions" ON public.user_sessions FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);