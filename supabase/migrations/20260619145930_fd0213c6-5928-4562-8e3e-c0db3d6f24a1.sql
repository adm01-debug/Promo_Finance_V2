
-- ============================================================================
-- AUDITORIA DE SEGURANÇA - RODADA 1: Correção de RLS sobre-permissiva
-- Remove policies USING (true) que vazavam dados sensíveis e adiciona
-- escopo por empresa via user_empresas. Policies admin/financeiro restritivas
-- existentes são preservadas.
-- ============================================================================

-- Helper local: nenhum (usamos user_empresas direto)

-- 1) PORTAL CLIENTE TOKENS — tokens só para admins
DROP POLICY IF EXISTS "auth read portal tokens" ON public.portal_cliente_tokens;

-- 2) PORTAL CLIENTE ACESSOS — logs só para admins
DROP POLICY IF EXISTS "auth read portal acessos" ON public.portal_cliente_acessos;
CREATE POLICY "portal_acessos_admin_select" ON public.portal_cliente_acessos
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- 3) ASAAS_CONFIG — credenciais só para admins
DROP POLICY IF EXISTS "auth select asaas_config" ON public.asaas_config;

-- 4) ASAAS_CUSTOMERS — PII por empresa
DROP POLICY IF EXISTS "auth select asaas_customers" ON public.asaas_customers;
CREATE POLICY "asaas_customers_empresa_select" ON public.asaas_customers
  FOR SELECT TO authenticated
  USING (empresa_id IN (SELECT empresa_id FROM public.user_empresas WHERE user_id = auth.uid() AND ativo = true));

-- 5) ASAAS_PAYMENTS — dados de pagamento por empresa
DROP POLICY IF EXISTS "auth select asaas_payments" ON public.asaas_payments;
CREATE POLICY "asaas_payments_empresa_select" ON public.asaas_payments
  FOR SELECT TO authenticated
  USING (empresa_id IN (SELECT empresa_id FROM public.user_empresas WHERE user_id = auth.uid() AND ativo = true));

-- 6) ASAAS_TRANSFERS — chaves PIX por empresa (se houver), senão admin
DROP POLICY IF EXISTS "auth select asaas_transfers" ON public.asaas_transfers;
CREATE POLICY "asaas_transfers_empresa_select" ON public.asaas_transfers
  FOR SELECT TO authenticated
  USING (empresa_id IN (SELECT empresa_id FROM public.user_empresas WHERE user_id = auth.uid() AND ativo = true));

-- 7) ASAAS_AUDIT_TRAIL — só admin
DROP POLICY IF EXISTS "auth select asaas_audit_trail" ON public.asaas_audit_trail;

-- 8) ASAAS_SYNC_QUEUE — só admin
DROP POLICY IF EXISTS "auth select asaas_sync_queue" ON public.asaas_sync_queue;

-- 9) ASAAS_RECONCILIATION_SUGGESTIONS — por empresa
DROP POLICY IF EXISTS "auth select asaas_reconciliation_suggestions" ON public.asaas_reconciliation_suggestions;
CREATE POLICY "asaas_recon_empresa_select" ON public.asaas_reconciliation_suggestions
  FOR SELECT TO authenticated
  USING (empresa_id IN (SELECT empresa_id FROM public.user_empresas WHERE user_id = auth.uid() AND ativo = true));

-- 10) PROFILES — só o próprio perfil (policies de "auth.uid()=id" já existem)
DROP POLICY IF EXISTS "auth read profiles" ON public.profiles;

-- 11) SECURITY_AUDIT_LOGS — corrigir policy "Only admins" que estava com USING(true)
DROP POLICY IF EXISTS "Only admins can view security logs" ON public.security_audit_logs;
CREATE POLICY "Only admins can view security logs" ON public.security_audit_logs
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- 12) PARCELAS_ACORDO — restringir via empresa do acordo
DROP POLICY IF EXISTS "Access via agreement" ON public.parcelas_acordo;
CREATE POLICY "parcelas_acordo_empresa_select" ON public.parcelas_acordo
  FOR SELECT TO authenticated
  USING (acordo_id IN (
    SELECT a.id FROM public.acordos_parcelamento a
    WHERE a.empresa_id IN (SELECT empresa_id FROM public.user_empresas WHERE user_id = auth.uid() AND ativo = true)
  ));
CREATE POLICY "parcelas_acordo_admin_write" ON public.parcelas_acordo
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'financeiro'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'financeiro'::public.app_role));

-- 13) CONTAS_BANCARIAS — escopo por empresa
DROP POLICY IF EXISTS "Users can view accounts" ON public.contas_bancarias;
CREATE POLICY "contas_bancarias_empresa_select" ON public.contas_bancarias
  FOR SELECT TO authenticated
  USING (empresa_id IN (SELECT empresa_id FROM public.user_empresas WHERE user_id = auth.uid() AND ativo = true));

-- 14) CONTAS_PAGAR / RECEBER — escopo por empresa
DROP POLICY IF EXISTS "Users can view contas pagar" ON public.contas_pagar;
CREATE POLICY "contas_pagar_empresa_select" ON public.contas_pagar
  FOR SELECT TO authenticated
  USING (empresa_id IN (SELECT empresa_id FROM public.user_empresas WHERE user_id = auth.uid() AND ativo = true));

DROP POLICY IF EXISTS "Users can view contas receber" ON public.contas_receber;
CREATE POLICY "contas_receber_empresa_select" ON public.contas_receber
  FOR SELECT TO authenticated
  USING (empresa_id IN (SELECT empresa_id FROM public.user_empresas WHERE user_id = auth.uid() AND ativo = true));

-- 15) TRANSACOES_BANCARIAS — escopo via conta bancária
DROP POLICY IF EXISTS "Users can view transactions" ON public.transacoes_bancarias;
CREATE POLICY "transacoes_bancarias_empresa_select" ON public.transacoes_bancarias
  FOR SELECT TO authenticated
  USING (conta_bancaria_id IN (
    SELECT id FROM public.contas_bancarias
    WHERE empresa_id IN (SELECT empresa_id FROM public.user_empresas WHERE user_id = auth.uid() AND ativo = true)
  ));

-- 16) NEGATIVACOES / PROTESTOS — escopo por empresa
DROP POLICY IF EXISTS "Users can view negativacoes" ON public.negativacoes;
CREATE POLICY "negativacoes_empresa_select" ON public.negativacoes
  FOR SELECT TO authenticated
  USING (empresa_id IN (SELECT empresa_id FROM public.user_empresas WHERE user_id = auth.uid() AND ativo = true));

DROP POLICY IF EXISTS "Users can view protestos" ON public.protestos;
CREATE POLICY "protestos_empresa_select" ON public.protestos
  FOR SELECT TO authenticated
  USING (empresa_id IN (SELECT empresa_id FROM public.user_empresas WHERE user_id = auth.uid() AND ativo = true));

-- 17) AUDITORIA_FINANCEIRA — escopo por empresa
-- Guard: 42703 — empresa_id may not exist on preview branch
DROP POLICY IF EXISTS "auth read auditoria_financeira" ON public.auditoria_financeira;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='auditoria_financeira' AND column_name='empresa_id') THEN
    EXECUTE $sql$CREATE POLICY "auditoria_financeira_empresa_select" ON public.auditoria_financeira
  FOR SELECT TO authenticated
  USING (empresa_id IN (SELECT empresa_id FROM public.user_empresas WHERE user_id = auth.uid() AND ativo = true))$sql$;
  END IF;
END $$;

-- 18) WEBHOOKS_LOG — só admin
DROP POLICY IF EXISTS "auth read webhooks_log" ON public.webhooks_log;
DROP POLICY IF EXISTS "authenticated read webhooks_log" ON public.webhooks_log;
CREATE POLICY "webhooks_log_admin_select" ON public.webhooks_log
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- 19) HEALTH SCORES — escopo por empresa
DROP POLICY IF EXISTS "Empresa access for health scores" ON public.health_scores_operacionais;
DROP POLICY IF EXISTS "Authenticated users can view health scores" ON public.health_scores_operacionais;
CREATE POLICY "health_scores_empresa_select" ON public.health_scores_operacionais
  FOR SELECT TO authenticated
  USING (empresa_id IN (SELECT empresa_id FROM public.user_empresas WHERE user_id = auth.uid() AND ativo = true));

-- 20) HISTORICO_SCORE_SAUDE — escopo por empresa
-- Guard: 42703 — empresa_id may not exist on preview branch
DROP POLICY IF EXISTS "Everyone can view score history" ON public.historico_score_saude;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='historico_score_saude' AND column_name='empresa_id') THEN
    EXECUTE $sql$CREATE POLICY "historico_score_saude_empresa_select" ON public.historico_score_saude
  FOR SELECT TO authenticated
  USING (empresa_id IN (SELECT empresa_id FROM public.user_empresas WHERE user_id = auth.uid() AND ativo = true))$sql$;
  END IF;
END $$;

-- 21) RECOMENDACOES_METAS_IA — escopo por empresa
-- Guard: 42703 — empresa_id may not exist on preview branch
DROP POLICY IF EXISTS "Everyone can view recommendations" ON public.recomendacoes_metas_ia;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='recomendacoes_metas_ia' AND column_name='empresa_id') THEN
    EXECUTE $sql$CREATE POLICY "recomendacoes_metas_ia_empresa_select" ON public.recomendacoes_metas_ia
  FOR SELECT TO authenticated
  USING (empresa_id IN (SELECT empresa_id FROM public.user_empresas WHERE user_id = auth.uid() AND ativo = true))$sql$;
  END IF;
END $$;

-- 22) ALERTAS_PREDITIVOS — escopo por empresa
-- Guard: 42703 — empresa_id may not exist on preview branch
DROP POLICY IF EXISTS "Alertas preditivos visualizáveis por todos da empresa" ON public.alertas_preditivos;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='alertas_preditivos' AND column_name='empresa_id') THEN
    EXECUTE $sql$CREATE POLICY "alertas_preditivos_empresa_select" ON public.alertas_preditivos
  FOR SELECT TO authenticated
  USING (empresa_id IN (SELECT empresa_id FROM public.user_empresas WHERE user_id = auth.uid() AND ativo = true))$sql$;
  END IF;
END $$;

-- 23) HISTORICO_CONCILIACAO_IA — só admin/financeiro
DROP POLICY IF EXISTS "Users see IA history" ON public.historico_conciliacao_ia;
CREATE POLICY "historico_conciliacao_ia_role_select" ON public.historico_conciliacao_ia
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'financeiro'::public.app_role));

-- 24) ANOMALIAS_DETECTADAS — escopo por empresa
-- Guard: 42703 — empresa_id may not exist on preview branch
DROP POLICY IF EXISTS "Users can view anomalias" ON public.anomalias_detectadas;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='anomalias_detectadas' AND column_name='empresa_id') THEN
    EXECUTE $sql$CREATE POLICY "anomalias_detectadas_empresa_select" ON public.anomalias_detectadas
  FOR SELECT TO authenticated
  USING (empresa_id IN (SELECT empresa_id FROM public.user_empresas WHERE user_id = auth.uid() AND ativo = true))$sql$;
  END IF;
END $$;

-- 25) PREJUIZOS_FISCAIS — sobrescrever policy mal nomeada
-- Guard: 42703 — empresa_id may not exist on preview branch
DROP POLICY IF EXISTS "Empresa access for prejuizos" ON public.prejuizos_fiscais;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='prejuizos_fiscais' AND column_name='empresa_id') THEN
    EXECUTE $sql$CREATE POLICY "prejuizos_fiscais_empresa_select" ON public.prejuizos_fiscais
  FOR SELECT TO authenticated
  USING (empresa_id IN (SELECT empresa_id FROM public.user_empresas WHERE user_id = auth.uid() AND ativo = true))$sql$;
  END IF;
END $$;
CREATE POLICY "prejuizos_fiscais_admin_write" ON public.prejuizos_fiscais
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- 26) Remover overload inseguro has_role(uuid, text) que ignora is_active
DROP FUNCTION IF EXISTS public.has_role(uuid, text);
