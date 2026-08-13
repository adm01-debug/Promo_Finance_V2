
-- =====================================================================
-- RODADA 2 — Corrige isolamento multi-tenant quebrado
-- Padrão substituído: empresa_id IN (SELECT id FROM empresas)  ❌
-- Padrão novo:        empresa_id IN (SELECT empresa_id FROM user_empresas
--                                     WHERE user_id=auth.uid() AND ativo)
-- =====================================================================

-- 1) active_tracking — remove catch-all que vazava GPS de todos motoristas
DROP POLICY IF EXISTS "Authenticated users can view tracking" ON public.active_tracking;

-- 2) anomalia_detection_runs — restringe ao próprio usuário ou admin
DROP POLICY IF EXISTS "Users view their own data in newly created tables" ON public.anomalia_detection_runs;
CREATE POLICY "anomalia_runs_owner_or_admin_select" ON public.anomalia_detection_runs
  FOR SELECT TO authenticated
  USING (triggered_by = auth.uid() OR public.has_role(auth.uid(), 'admin'::public.app_role));

-- 3) apuracoes_tributarias
DROP POLICY IF EXISTS "Authenticated users can view tax calculations" ON public.apuracoes_tributarias;
CREATE POLICY "apuracoes_tributarias_empresa_select" ON public.apuracoes_tributarias
  FOR SELECT TO authenticated
  USING (empresa_id IN (SELECT empresa_id FROM public.user_empresas WHERE user_id = auth.uid() AND ativo = true));

-- 4) bitrix_field_mappings
DROP POLICY IF EXISTS "Users see own mappings" ON public.bitrix_field_mappings;
CREATE POLICY "bitrix_field_mappings_empresa_select" ON public.bitrix_field_mappings
  FOR SELECT TO authenticated
  USING (empresa_id IN (SELECT empresa_id FROM public.user_empresas WHERE user_id = auth.uid() AND ativo = true));

-- 5) bitrix_sync_logs
DROP POLICY IF EXISTS "Users see own sync logs" ON public.bitrix_sync_logs;
CREATE POLICY "bitrix_sync_logs_empresa_select" ON public.bitrix_sync_logs
  FOR SELECT TO authenticated
  USING (empresa_id IN (SELECT empresa_id FROM public.user_empresas WHERE user_id = auth.uid() AND ativo = true));

-- 6) centros_custo
DROP POLICY IF EXISTS "Users can view centros de custo" ON public.centros_custo;
CREATE POLICY "centros_custo_empresa_select" ON public.centros_custo
  FOR SELECT TO authenticated
  USING (empresa_id IN (SELECT empresa_id FROM public.user_empresas WHERE user_id = auth.uid() AND ativo = true));

-- 7) configuracoes_aprovacao
DROP POLICY IF EXISTS "Authenticated users can view approval config" ON public.configuracoes_aprovacao;
CREATE POLICY "configuracoes_aprovacao_empresa_select" ON public.configuracoes_aprovacao
  FOR SELECT TO authenticated
  USING (empresa_id IN (SELECT empresa_id FROM public.user_empresas WHERE user_id = auth.uid() AND ativo = true));

-- 8) execucoes_cobranca — substitui isolation quebrado
DROP POLICY IF EXISTS "execucoes_cobranca_isolation" ON public.execucoes_cobranca;
CREATE POLICY "execucoes_cobranca_empresa_all" ON public.execucoes_cobranca
  FOR ALL TO authenticated
  USING (empresa_id IN (SELECT empresa_id FROM public.user_empresas WHERE user_id = auth.uid() AND ativo = true))
  WITH CHECK (empresa_id IN (SELECT empresa_id FROM public.user_empresas WHERE user_id = auth.uid() AND ativo = true));

-- 9) fila_cobrancas
DROP POLICY IF EXISTS "Users can view queue" ON public.fila_cobrancas;
CREATE POLICY "fila_cobrancas_empresa_select" ON public.fila_cobrancas
  FOR SELECT TO authenticated
  USING (empresa_id IN (SELECT empresa_id FROM public.user_empresas WHERE user_id = auth.uid() AND ativo = true));

-- 10) historico_analises_preditivas
DROP POLICY IF EXISTS "Authenticated read hap" ON public.historico_analises_preditivas;
CREATE POLICY "historico_analises_preditivas_empresa_select" ON public.historico_analises_preditivas
  FOR SELECT TO authenticated
  USING (empresa_id IN (SELECT empresa_id FROM public.user_empresas WHERE user_id = auth.uid() AND ativo = true));

-- 11) historico_cobranca — corrige USING(true) E isolation quebrado
DROP POLICY IF EXISTS "Users can view history" ON public.historico_cobranca;
DROP POLICY IF EXISTS "historico_cobranca_isolation" ON public.historico_cobranca;
CREATE POLICY "historico_cobranca_empresa_all" ON public.historico_cobranca
  FOR ALL TO authenticated
  USING (empresa_id IN (SELECT empresa_id FROM public.user_empresas WHERE user_id = auth.uid() AND ativo = true))
  WITH CHECK (empresa_id IN (SELECT empresa_id FROM public.user_empresas WHERE user_id = auth.uid() AND ativo = true));

-- 12) historico_cobrancas_boletos — sem empresa_id direto, usa conta_receber
DROP POLICY IF EXISTS "auth select historico_cobrancas_boletos" ON public.historico_cobrancas_boletos;
CREATE POLICY "historico_cobrancas_boletos_empresa_select" ON public.historico_cobrancas_boletos
  FOR SELECT TO authenticated
  USING (conta_receber_id IN (
    SELECT id FROM public.contas_receber
    WHERE empresa_id IN (SELECT empresa_id FROM public.user_empresas WHERE user_id = auth.uid() AND ativo = true)
  ));

-- 13) itens_pedido_compra — via pedido pai
DROP POLICY IF EXISTS "Users can view items" ON public.itens_pedido_compra;
CREATE POLICY "itens_pedido_compra_empresa_select" ON public.itens_pedido_compra
  FOR SELECT TO authenticated
  USING (pedido_id IN (
    SELECT id FROM public.pedidos_compra
    WHERE empresa_id IN (SELECT empresa_id FROM public.user_empresas WHERE user_id = auth.uid() AND ativo = true)
  ));

-- 14) notas_fiscais
DROP POLICY IF EXISTS "Users view own NFs" ON public.notas_fiscais;
CREATE POLICY "notas_fiscais_empresa_select" ON public.notas_fiscais
  FOR SELECT TO authenticated
  USING (empresa_id IN (SELECT empresa_id FROM public.user_empresas WHERE user_id = auth.uid() AND ativo = true));

-- 15) operacoes_tributaveis
DROP POLICY IF EXISTS "Users view own operacoes" ON public.operacoes_tributaveis;
CREATE POLICY "operacoes_tributaveis_empresa_select" ON public.operacoes_tributaveis
  FOR SELECT TO authenticated
  USING (empresa_id IN (SELECT empresa_id FROM public.user_empresas WHERE user_id = auth.uid() AND ativo = true));

-- 16) pedidos_compra
DROP POLICY IF EXISTS "Users can view everything" ON public.pedidos_compra;
CREATE POLICY "pedidos_compra_empresa_select" ON public.pedidos_compra
  FOR SELECT TO authenticated
  USING (empresa_id IN (SELECT empresa_id FROM public.user_empresas WHERE user_id = auth.uid() AND ativo = true));

-- 17) pix_templates
DROP POLICY IF EXISTS "Users can view pix" ON public.pix_templates;
DROP POLICY IF EXISTS "pix_templates_isolation" ON public.pix_templates;
CREATE POLICY "pix_templates_empresa_select" ON public.pix_templates
  FOR SELECT TO authenticated
  USING (empresa_id IN (SELECT empresa_id FROM public.user_empresas WHERE user_id = auth.uid() AND ativo = true));

-- 18) regimes_simulados — SELECT/INSERT/UPDATE com escopo por empresa
DROP POLICY IF EXISTS "Users can view simulation history" ON public.regimes_simulados;
DROP POLICY IF EXISTS "Users can insert simulations" ON public.regimes_simulados;
CREATE POLICY "regimes_simulados_empresa_select" ON public.regimes_simulados
  FOR SELECT TO authenticated
  USING (empresa_id IN (SELECT empresa_id FROM public.user_empresas WHERE user_id = auth.uid() AND ativo = true));
CREATE POLICY "regimes_simulados_empresa_insert" ON public.regimes_simulados
  FOR INSERT TO authenticated
  WITH CHECK (empresa_id IN (SELECT empresa_id FROM public.user_empresas WHERE user_id = auth.uid() AND ativo = true));

-- 19) regua_cobranca — corrige isolation quebrado E USING(true)
DROP POLICY IF EXISTS "Users can view regua" ON public.regua_cobranca;
DROP POLICY IF EXISTS "regua_cobranca_isolation" ON public.regua_cobranca;
CREATE POLICY "regua_cobranca_empresa_select" ON public.regua_cobranca
  FOR SELECT TO authenticated
  USING (empresa_id IN (SELECT empresa_id FROM public.user_empresas WHERE user_id = auth.uid() AND ativo = true));

-- 20) split_payment_transacoes — SELECT/INSERT/UPDATE com escopo real por empresa
DROP POLICY IF EXISTS "Users can view split transactions of their companies" ON public.split_payment_transacoes;
DROP POLICY IF EXISTS "Users can insert split transactions" ON public.split_payment_transacoes;
DROP POLICY IF EXISTS "Users can update split transactions" ON public.split_payment_transacoes;
CREATE POLICY "split_payment_empresa_select" ON public.split_payment_transacoes
  FOR SELECT TO authenticated
  USING (empresa_id IN (SELECT empresa_id FROM public.user_empresas WHERE user_id = auth.uid() AND ativo = true));
CREATE POLICY "split_payment_empresa_insert" ON public.split_payment_transacoes
  FOR INSERT TO authenticated
  WITH CHECK (empresa_id IN (SELECT empresa_id FROM public.user_empresas WHERE user_id = auth.uid() AND ativo = true));
CREATE POLICY "split_payment_empresa_update" ON public.split_payment_transacoes
  FOR UPDATE TO authenticated
  USING (empresa_id IN (SELECT empresa_id FROM public.user_empresas WHERE user_id = auth.uid() AND ativo = true))
  WITH CHECK (empresa_id IN (SELECT empresa_id FROM public.user_empresas WHERE user_id = auth.uid() AND ativo = true));
