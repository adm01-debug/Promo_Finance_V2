-- Fix overly permissive RLS policies: replace USING(true)/WITH CHECK(true) 
-- with auth.uid() IS NOT NULL on non-SELECT operations.

-- account_lockouts
DROP POLICY IF EXISTS "System can manage account lockouts" ON public.account_lockouts;
CREATE POLICY "System can manage account lockouts" ON public.account_lockouts FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- alertas INSERT
DROP POLICY IF EXISTS "System can insert alertas" ON public.alertas;
CREATE POLICY "System can insert alertas" ON public.alertas FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- alertas_preditivos INSERT
DROP POLICY IF EXISTS "Sistema pode inserir alertas preditivos" ON public.alertas_preditivos;
CREATE POLICY "Sistema pode inserir alertas preditivos" ON public.alertas_preditivos FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- alertas_tributarios ALL
DROP POLICY IF EXISTS "alertas_tributarios_all" ON public.alertas_tributarios;
CREATE POLICY "alertas_tributarios_all" ON public.alertas_tributarios FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- apuracoes_irpj_csll ALL
DROP POLICY IF EXISTS "Auth users can manage apuracoes_irpj" ON public.apuracoes_irpj_csll;
CREATE POLICY "Auth users can manage apuracoes_irpj" ON public.apuracoes_irpj_csll FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- apuracoes_tributarias INSERT/UPDATE/DELETE
DROP POLICY IF EXISTS "Usuários autenticados podem inserir apurações" ON public.apuracoes_tributarias;
CREATE POLICY "Usuários autenticados podem inserir apurações" ON public.apuracoes_tributarias FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar apurações" ON public.apuracoes_tributarias;
CREATE POLICY "Usuários autenticados podem atualizar apurações" ON public.apuracoes_tributarias FOR UPDATE USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "Usuários autenticados podem deletar apurações" ON public.apuracoes_tributarias;
CREATE POLICY "Usuários autenticados podem deletar apurações" ON public.apuracoes_tributarias FOR DELETE USING (auth.uid() IS NOT NULL);

-- blocked_ips INSERT
DROP POLICY IF EXISTS "System can insert blocked IPs" ON public.blocked_ips;
CREATE POLICY "System can insert blocked IPs" ON public.blocked_ips FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- conciliacoes_parciais INSERT
DROP POLICY IF EXISTS "Authenticated users can insert conciliacoes_parciais" ON public.conciliacoes_parciais;
CREATE POLICY "Authenticated users can insert conciliacoes_parciais" ON public.conciliacoes_parciais FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- creditos_tributarios INSERT/UPDATE/DELETE
DROP POLICY IF EXISTS "Usuários autenticados podem inserir créditos" ON public.creditos_tributarios;
CREATE POLICY "Usuários autenticados podem inserir créditos" ON public.creditos_tributarios FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar créditos" ON public.creditos_tributarios;
CREATE POLICY "Usuários autenticados podem atualizar créditos" ON public.creditos_tributarios FOR UPDATE USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "Usuários autenticados podem deletar créditos" ON public.creditos_tributarios;
CREATE POLICY "Usuários autenticados podem deletar créditos" ON public.creditos_tributarios FOR DELETE USING (auth.uid() IS NOT NULL);

-- darfs ALL
DROP POLICY IF EXISTS "darfs_all" ON public.darfs;
CREATE POLICY "darfs_all" ON public.darfs FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- historico_analises_preditivas INSERT
DROP POLICY IF EXISTS "Sistema pode inserir análises" ON public.historico_analises_preditivas;
CREATE POLICY "Sistema pode inserir análises" ON public.historico_analises_preditivas FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- historico_cobranca_whatsapp INSERT/UPDATE
DROP POLICY IF EXISTS "Usuários podem inserir histórico de cobrança" ON public.historico_cobranca_whatsapp;
CREATE POLICY "Usuários podem inserir histórico de cobrança" ON public.historico_cobranca_whatsapp FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "Usuários podem atualizar histórico de cobrança" ON public.historico_cobranca_whatsapp;
CREATE POLICY "Usuários podem atualizar histórico de cobrança" ON public.historico_cobranca_whatsapp FOR UPDATE USING (auth.uid() IS NOT NULL);

-- historico_relatorios INSERT
DROP POLICY IF EXISTS "System can insert report history" ON public.historico_relatorios;
CREATE POLICY "System can insert report history" ON public.historico_relatorios FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- historico_score_saude INSERT
DROP POLICY IF EXISTS "Sistema pode inserir scores" ON public.historico_score_saude;
CREATE POLICY "Sistema pode inserir scores" ON public.historico_score_saude FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- incentivos_fiscais ALL
DROP POLICY IF EXISTS "Auth users can manage incentivos" ON public.incentivos_fiscais;
CREATE POLICY "Auth users can manage incentivos" ON public.incentivos_fiscais FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- lalur_lancamentos ALL
DROP POLICY IF EXISTS "Auth users can manage lalur" ON public.lalur_lancamentos;
CREATE POLICY "Auth users can manage lalur" ON public.lalur_lancamentos FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- login_attempts INSERT
DROP POLICY IF EXISTS "Sistema pode inserir tentativas" ON public.login_attempts;
CREATE POLICY "Sistema pode inserir tentativas" ON public.login_attempts FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- operacoes_tributaveis INSERT/UPDATE/DELETE
DROP POLICY IF EXISTS "Usuários autenticados podem inserir operações" ON public.operacoes_tributaveis;
CREATE POLICY "Usuários autenticados podem inserir operações" ON public.operacoes_tributaveis FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar operações" ON public.operacoes_tributaveis;
CREATE POLICY "Usuários autenticados podem atualizar operações" ON public.operacoes_tributaveis FOR UPDATE USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "Usuários autenticados podem deletar operações" ON public.operacoes_tributaveis;
CREATE POLICY "Usuários autenticados podem deletar operações" ON public.operacoes_tributaveis FOR DELETE USING (auth.uid() IS NOT NULL);

-- pagamentos_recorrentes UPDATE
DROP POLICY IF EXISTS "Usuários podem atualizar pagamentos recorrentes" ON public.pagamentos_recorrentes;
CREATE POLICY "Usuários podem atualizar pagamentos recorrentes" ON public.pagamentos_recorrentes FOR UPDATE USING (auth.uid() IS NOT NULL);

-- per_dcomp ALL
DROP POLICY IF EXISTS "per_dcomp_all" ON public.per_dcomp;
CREATE POLICY "per_dcomp_all" ON public.per_dcomp FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- prejuizos_fiscais ALL
DROP POLICY IF EXISTS "Auth users can manage prejuizos" ON public.prejuizos_fiscais;
CREATE POLICY "Auth users can manage prejuizos" ON public.prejuizos_fiscais FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- regimes_especiais_empresa ALL
DROP POLICY IF EXISTS "Auth users can manage regimes_especiais" ON public.regimes_especiais_empresa;
CREATE POLICY "Auth users can manage regimes_especiais" ON public.regimes_especiais_empresa FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- retencoes_fonte ALL
DROP POLICY IF EXISTS "retencoes_fonte_all" ON public.retencoes_fonte;
CREATE POLICY "retencoes_fonte_all" ON public.retencoes_fonte FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- split_payment_transacoes ALL
DROP POLICY IF EXISTS "split_payment_all" ON public.split_payment_transacoes;
CREATE POLICY "split_payment_all" ON public.split_payment_transacoes FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- security_settings ALL
DROP POLICY IF EXISTS "security_settings_all" ON public.security_settings;
CREATE POLICY "security_settings_all" ON public.security_settings FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);