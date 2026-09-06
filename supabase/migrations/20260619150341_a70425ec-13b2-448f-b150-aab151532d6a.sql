
-- =====================================================================
-- RODADA 2 — Corrige isolamento multi-tenant quebrado
-- Padrão substituído: empresa_id IN (SELECT id FROM empresas)  ❌
-- Padrão novo:        empresa_id IN (SELECT empresa_id FROM user_empresas
--                                     WHERE user_id=auth.uid() AND ativo)
-- =====================================================================

-- 1) active_tracking — remove catch-all que vazava GPS de todos motoristas
-- Guard: 42P01 — table may not exist on preview branch
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='active_tracking') THEN
    EXECUTE $sql$DROP POLICY IF EXISTS "Authenticated users can view tracking" ON public.active_tracking$sql$;
  END IF;
END $$;

-- 2) anomalia_detection_runs — restringe ao próprio usuário ou admin
-- Guard: 42P01 — table may not exist on preview branch
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='anomalia_detection_runs') THEN
    EXECUTE $sql$DROP POLICY IF EXISTS "Users view their own data in newly created tables" ON public.anomalia_detection_runs$sql$;
    EXECUTE $sql$CREATE POLICY "anomalia_runs_owner_or_admin_select" ON public.anomalia_detection_runs
  FOR SELECT TO authenticated
  USING (triggered_by = auth.uid() OR public.has_role(auth.uid(), 'admin'::public.app_role))$sql$;
  END IF;
END $$;

-- 3) apuracoes_tributarias
-- Guard: 42P01 — table may not exist on preview branch
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='apuracoes_tributarias') THEN
    EXECUTE $sql$DROP POLICY IF EXISTS "Authenticated users can view tax calculations" ON public.apuracoes_tributarias$sql$;
    EXECUTE $sql$CREATE POLICY "apuracoes_tributarias_empresa_select" ON public.apuracoes_tributarias
  FOR SELECT TO authenticated
  USING (empresa_id IN (SELECT empresa_id FROM public.user_empresas WHERE user_id = auth.uid() AND ativo = true))$sql$;
  END IF;
END $$;

-- 4) bitrix_field_mappings
-- Guard: 42P01 — table may not exist on preview branch
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='bitrix_field_mappings') THEN
    EXECUTE $sql$DROP POLICY IF EXISTS "Users see own mappings" ON public.bitrix_field_mappings$sql$;
    EXECUTE $sql$CREATE POLICY "bitrix_field_mappings_empresa_select" ON public.bitrix_field_mappings
  FOR SELECT TO authenticated
  USING (empresa_id IN (SELECT empresa_id FROM public.user_empresas WHERE user_id = auth.uid() AND ativo = true))$sql$;
  END IF;
END $$;

-- 5) bitrix_sync_logs
-- Guard: 42P01 — table may not exist on preview branch
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='bitrix_sync_logs') THEN
    EXECUTE $sql$DROP POLICY IF EXISTS "Users see own sync logs" ON public.bitrix_sync_logs$sql$;
    EXECUTE $sql$CREATE POLICY "bitrix_sync_logs_empresa_select" ON public.bitrix_sync_logs
  FOR SELECT TO authenticated
  USING (empresa_id IN (SELECT empresa_id FROM public.user_empresas WHERE user_id = auth.uid() AND ativo = true))$sql$;
  END IF;
END $$;

-- 6) centros_custo
-- Guard: 42P01 — table may not exist on preview branch
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='centros_custo') THEN
    EXECUTE $sql$DROP POLICY IF EXISTS "Users can view centros de custo" ON public.centros_custo$sql$;
    EXECUTE $sql$CREATE POLICY "centros_custo_empresa_select" ON public.centros_custo
  FOR SELECT TO authenticated
  USING (empresa_id IN (SELECT empresa_id FROM public.user_empresas WHERE user_id = auth.uid() AND ativo = true))$sql$;
  END IF;
END $$;

-- 7) configuracoes_aprovacao
-- Guard: 42P01 — table may not exist on preview branch
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='configuracoes_aprovacao') THEN
    EXECUTE $sql$DROP POLICY IF EXISTS "Authenticated users can view approval config" ON public.configuracoes_aprovacao$sql$;
    EXECUTE $sql$CREATE POLICY "configuracoes_aprovacao_empresa_select" ON public.configuracoes_aprovacao
  FOR SELECT TO authenticated
  USING (empresa_id IN (SELECT empresa_id FROM public.user_empresas WHERE user_id = auth.uid() AND ativo = true))$sql$;
  END IF;
END $$;

-- 8) execucoes_cobranca — substitui isolation quebrado
-- Guard: 42P01 — table may not exist on preview branch
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='execucoes_cobranca') THEN
    EXECUTE $sql$DROP POLICY IF EXISTS "execucoes_cobranca_isolation" ON public.execucoes_cobranca$sql$;
    EXECUTE $sql$CREATE POLICY "execucoes_cobranca_empresa_all" ON public.execucoes_cobranca
  FOR ALL TO authenticated
  USING (empresa_id IN (SELECT empresa_id FROM public.user_empresas WHERE user_id = auth.uid() AND ativo = true))
  WITH CHECK (empresa_id IN (SELECT empresa_id FROM public.user_empresas WHERE user_id = auth.uid() AND ativo = true))$sql$;
  END IF;
END $$;

-- 9) fila_cobrancas
-- Guard: 42P01 — table may not exist on preview branch
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='fila_cobrancas') THEN
    EXECUTE $sql$DROP POLICY IF EXISTS "Users can view queue" ON public.fila_cobrancas$sql$;
    EXECUTE $sql$CREATE POLICY "fila_cobrancas_empresa_select" ON public.fila_cobrancas
  FOR SELECT TO authenticated
  USING (empresa_id IN (SELECT empresa_id FROM public.user_empresas WHERE user_id = auth.uid() AND ativo = true))$sql$;
  END IF;
END $$;

-- 10) historico_analises_preditivas
-- Guard: 42P01 — table may not exist on preview branch
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='historico_analises_preditivas') THEN
    EXECUTE $sql$DROP POLICY IF EXISTS "Authenticated read hap" ON public.historico_analises_preditivas$sql$;
    EXECUTE $sql$CREATE POLICY "historico_analises_preditivas_empresa_select" ON public.historico_analises_preditivas
  FOR SELECT TO authenticated
  USING (empresa_id IN (SELECT empresa_id FROM public.user_empresas WHERE user_id = auth.uid() AND ativo = true))$sql$;
  END IF;
END $$;

-- 11) historico_cobranca — corrige USING(true) E isolation quebrado
-- Guard: 42P01 — table may not exist on preview branch
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='historico_cobranca') THEN
    EXECUTE $sql$DROP POLICY IF EXISTS "Users can view history" ON public.historico_cobranca$sql$;
    EXECUTE $sql$DROP POLICY IF EXISTS "historico_cobranca_isolation" ON public.historico_cobranca$sql$;
    EXECUTE $sql$CREATE POLICY "historico_cobranca_empresa_all" ON public.historico_cobranca
  FOR ALL TO authenticated
  USING (empresa_id IN (SELECT empresa_id FROM public.user_empresas WHERE user_id = auth.uid() AND ativo = true))
  WITH CHECK (empresa_id IN (SELECT empresa_id FROM public.user_empresas WHERE user_id = auth.uid() AND ativo = true))$sql$;
  END IF;
END $$;

-- 12) historico_cobrancas_boletos — sem empresa_id direto, usa conta_receber
-- Guard: 42P01 — table may not exist on preview branch
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='historico_cobrancas_boletos') THEN
    EXECUTE $sql$DROP POLICY IF EXISTS "auth select historico_cobrancas_boletos" ON public.historico_cobrancas_boletos$sql$;
    EXECUTE $sql$CREATE POLICY "historico_cobrancas_boletos_empresa_select" ON public.historico_cobrancas_boletos
  FOR SELECT TO authenticated
  USING (conta_receber_id IN (
    SELECT id FROM public.contas_receber
    WHERE empresa_id IN (SELECT empresa_id FROM public.user_empresas WHERE user_id = auth.uid() AND ativo = true)
  ))$sql$;
  END IF;
END $$;

-- 13) itens_pedido_compra — via pedido pai
-- Guard: 42P01 — table may not exist on preview branch
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='itens_pedido_compra') THEN
    EXECUTE $sql$DROP POLICY IF EXISTS "Users can view items" ON public.itens_pedido_compra$sql$;
    EXECUTE $sql$CREATE POLICY "itens_pedido_compra_empresa_select" ON public.itens_pedido_compra
  FOR SELECT TO authenticated
  USING (pedido_id IN (
    SELECT id FROM public.pedidos_compra
    WHERE empresa_id IN (SELECT empresa_id FROM public.user_empresas WHERE user_id = auth.uid() AND ativo = true)
  ))$sql$;
  END IF;
END $$;

-- 14) notas_fiscais
-- Guard: 42P01 — table may not exist on preview branch
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='notas_fiscais') THEN
    EXECUTE $sql$DROP POLICY IF EXISTS "Users view own NFs" ON public.notas_fiscais$sql$;
    EXECUTE $sql$CREATE POLICY "notas_fiscais_empresa_select" ON public.notas_fiscais
  FOR SELECT TO authenticated
  USING (empresa_id IN (SELECT empresa_id FROM public.user_empresas WHERE user_id = auth.uid() AND ativo = true))$sql$;
  END IF;
END $$;

-- 15) operacoes_tributaveis
-- Guard: 42P01 — table may not exist on preview branch
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='operacoes_tributaveis') THEN
    EXECUTE $sql$DROP POLICY IF EXISTS "Users view own operacoes" ON public.operacoes_tributaveis$sql$;
    EXECUTE $sql$CREATE POLICY "operacoes_tributaveis_empresa_select" ON public.operacoes_tributaveis
  FOR SELECT TO authenticated
  USING (empresa_id IN (SELECT empresa_id FROM public.user_empresas WHERE user_id = auth.uid() AND ativo = true))$sql$;
  END IF;
END $$;

-- 16) pedidos_compra
-- Guard: 42P01 — table may not exist on preview branch
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='pedidos_compra') THEN
    EXECUTE $sql$DROP POLICY IF EXISTS "Users can view everything" ON public.pedidos_compra$sql$;
    EXECUTE $sql$CREATE POLICY "pedidos_compra_empresa_select" ON public.pedidos_compra
  FOR SELECT TO authenticated
  USING (empresa_id IN (SELECT empresa_id FROM public.user_empresas WHERE user_id = auth.uid() AND ativo = true))$sql$;
  END IF;
END $$;

-- 17) pix_templates
-- Guard: 42P01 — table may not exist on preview branch
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='pix_templates') THEN
    EXECUTE $sql$DROP POLICY IF EXISTS "Users can view pix" ON public.pix_templates$sql$;
    EXECUTE $sql$DROP POLICY IF EXISTS "pix_templates_isolation" ON public.pix_templates$sql$;
    EXECUTE $sql$CREATE POLICY "pix_templates_empresa_select" ON public.pix_templates
  FOR SELECT TO authenticated
  USING (empresa_id IN (SELECT empresa_id FROM public.user_empresas WHERE user_id = auth.uid() AND ativo = true))$sql$;
  END IF;
END $$;

-- 18) regimes_simulados — SELECT/INSERT/UPDATE com escopo por empresa
-- Guard: 42P01 — table may not exist on preview branch
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='regimes_simulados') THEN
    EXECUTE $sql$DROP POLICY IF EXISTS "Users can view simulation history" ON public.regimes_simulados$sql$;
    EXECUTE $sql$DROP POLICY IF EXISTS "Users can insert simulations" ON public.regimes_simulados$sql$;
    EXECUTE $sql$CREATE POLICY "regimes_simulados_empresa_select" ON public.regimes_simulados
  FOR SELECT TO authenticated
  USING (empresa_id IN (SELECT empresa_id FROM public.user_empresas WHERE user_id = auth.uid() AND ativo = true))$sql$;
    EXECUTE $sql$CREATE POLICY "regimes_simulados_empresa_insert" ON public.regimes_simulados
  FOR INSERT TO authenticated
  WITH CHECK (empresa_id IN (SELECT empresa_id FROM public.user_empresas WHERE user_id = auth.uid() AND ativo = true))$sql$;
  END IF;
END $$;

-- 19) regua_cobranca — corrige isolation quebrado E USING(true)
-- Guard: 42P01 — table may not exist on preview branch
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='regua_cobranca') THEN
    EXECUTE $sql$DROP POLICY IF EXISTS "Users can view regua" ON public.regua_cobranca$sql$;
    EXECUTE $sql$DROP POLICY IF EXISTS "regua_cobranca_isolation" ON public.regua_cobranca$sql$;
    EXECUTE $sql$CREATE POLICY "regua_cobranca_empresa_select" ON public.regua_cobranca
  FOR SELECT TO authenticated
  USING (empresa_id IN (SELECT empresa_id FROM public.user_empresas WHERE user_id = auth.uid() AND ativo = true))$sql$;
  END IF;
END $$;

-- 20) split_payment_transacoes — SELECT/INSERT/UPDATE com escopo real por empresa
-- Guard: 42P01 — table may not exist on preview branch
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='split_payment_transacoes') THEN
    EXECUTE $sql$DROP POLICY IF EXISTS "Users can view split transactions of their companies" ON public.split_payment_transacoes$sql$;
    EXECUTE $sql$DROP POLICY IF EXISTS "Users can insert split transactions" ON public.split_payment_transacoes$sql$;
    EXECUTE $sql$DROP POLICY IF EXISTS "Users can update split transactions" ON public.split_payment_transacoes$sql$;
    EXECUTE $sql$CREATE POLICY "split_payment_empresa_select" ON public.split_payment_transacoes
  FOR SELECT TO authenticated
  USING (empresa_id IN (SELECT empresa_id FROM public.user_empresas WHERE user_id = auth.uid() AND ativo = true))$sql$;
    EXECUTE $sql$CREATE POLICY "split_payment_empresa_insert" ON public.split_payment_transacoes
  FOR INSERT TO authenticated
  WITH CHECK (empresa_id IN (SELECT empresa_id FROM public.user_empresas WHERE user_id = auth.uid() AND ativo = true))$sql$;
    EXECUTE $sql$CREATE POLICY "split_payment_empresa_update" ON public.split_payment_transacoes
  FOR UPDATE TO authenticated
  USING (empresa_id IN (SELECT empresa_id FROM public.user_empresas WHERE user_id = auth.uid() AND ativo = true))
  WITH CHECK (empresa_id IN (SELECT empresa_id FROM public.user_empresas WHERE user_id = auth.uid() AND ativo = true))$sql$;
  END IF;
END $$;
