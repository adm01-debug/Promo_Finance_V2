-- Robust policy fix with column existence checks
DO $$ 
DECLARE
  t text;
  pol text;
  has_empresa_id boolean;
  has_user_id boolean;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' 
    AND tablename IN (
      'apuracoes_irpj_csll', 'configuracoes_duplicidade', 'regras_roteamento_financeiro',
      'divergencias_conciliacao', 'contratos', 'metas_financeiras', 
      'partidas_contabeis', 'bloqueios_duplicidade', 'plano_contas', 'transferencias', 
      'regimes_tributarios', 'vendedores', 'acoes_recomendadas', 'parcelas_acordo', 
      'alertas_tributarios', 'darfs', 'retencoes_fonte', 'formas_pagamento', 
      'regras_duplicidade', 'faturamento_mensal', 'folha_pagamento', 'whatsapp_conversas', 
      'historico_cobranca_whatsapp', 'resumos_executivos_semanais', 'acordos_parcelamento',
      'feedback_conciliacao_ia', 'dispositivos_conhecidos', 'bitrix_webhook_events', 'allowed_countries',
      'regras_conciliacao'
    )
  LOOP
    -- Drop existing permissive policies
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = t AND (qual = 'true' OR with_check = 'true') AND schemaname = 'public'
    LOOP
      EXECUTE format('DROP POLICY %I ON public.%I', pol, t);
    END LOOP;

    -- Check columns
    SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = t AND column_name = 'empresa_id' AND table_schema = 'public') INTO has_empresa_id;
    SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = t AND column_name = 'user_id' AND table_schema = 'public') INTO has_user_id;

    IF has_empresa_id THEN
      EXECUTE format('CREATE POLICY "Empresa-based access" ON public.%I FOR ALL TO authenticated USING (
        empresa_id IN (SELECT empresa_id FROM public.user_empresas WHERE user_id = auth.uid() AND ativo = true) OR
        EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = ''admin'')
      )', t);
    ELSIF has_user_id THEN
      EXECUTE format('CREATE POLICY "User-based access" ON public.%I FOR ALL TO authenticated USING (
        user_id = auth.uid() OR
        EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = ''admin'')
      )', t);
    ELSIF t = 'allowed_countries' THEN
      EXECUTE format('CREATE POLICY "Public read" ON public.%I FOR SELECT TO authenticated USING (true)', t);
      EXECUTE format('CREATE POLICY "Admin manage" ON public.%I FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = ''admin''))', t);
    ELSIF t = 'bitrix_webhook_events' THEN
      EXECUTE format('CREATE POLICY "Admin only manage" ON public.%I FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = ''admin''))', t);
    ELSIF t = 'partidas_contabeis' THEN
      EXECUTE format('CREATE POLICY "Access via lancamento" ON public.partidas_contabeis FOR ALL TO authenticated USING (
        lancamento_id IN (SELECT id FROM public.lancamentos_contabeis)
      )', t);
    ELSIF t = 'parcelas_acordo' THEN
      EXECUTE format('CREATE POLICY "Access via agreement" ON public.parcelas_acordo FOR ALL TO authenticated USING (
        acordo_id IN (SELECT id FROM public.acordos_parcelamento)
      )', t);
    END IF;
  END LOOP;
END $$;
