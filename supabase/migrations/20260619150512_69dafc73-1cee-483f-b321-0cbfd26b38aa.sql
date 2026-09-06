
-- aprovacao_comentarios
-- Guard: 42P01 + 42703(user_id) — table/column may not exist on preview branch
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='aprovacao_comentarios')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='aprovacao_comentarios' AND column_name='user_id') THEN
    EXECUTE $sql$DROP POLICY IF EXISTS "Users can view comments on requests they can see" ON public.aprovacao_comentarios$sql$;
    EXECUTE $sql$CREATE POLICY "aprovacao_comentarios_owner_select" ON public.aprovacao_comentarios
  FOR SELECT TO authenticated
  USING (solicitacao_id IN (
    SELECT id FROM public.solicitacoes_aprovacao
    WHERE solicitado_por = auth.uid() OR aprovado_por = auth.uid()
  ) OR user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::public.app_role))$sql$;
  END IF;
END $$;

-- templates_cobranca
-- Guard: 42P01 + 42703(empresa_id) — table/column may not exist on preview branch
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='templates_cobranca')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='templates_cobranca' AND column_name='empresa_id') THEN
    EXECUTE $sql$DROP POLICY IF EXISTS "Users can view templates" ON public.templates_cobranca$sql$;
    EXECUTE $sql$CREATE POLICY "templates_cobranca_empresa_select" ON public.templates_cobranca
  FOR SELECT TO authenticated
  USING (empresa_id IN (SELECT empresa_id FROM public.user_empresas WHERE user_id = auth.uid() AND ativo = true))$sql$;
  END IF;
END $$;

-- regua_cobranca_etapas (via régua pai)
-- Guard: 42P01 + 42703(regua_id) — table/column may not exist on preview branch
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='regua_cobranca_etapas')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='regua_cobranca_etapas' AND column_name='regua_id') THEN
    EXECUTE $sql$DROP POLICY IF EXISTS "Users can view stages" ON public.regua_cobranca_etapas$sql$;
    EXECUTE $sql$CREATE POLICY "regua_cobranca_etapas_empresa_select" ON public.regua_cobranca_etapas
  FOR SELECT TO authenticated
  USING (regua_id IN (
    SELECT id FROM public.regua_cobranca
    WHERE empresa_id IN (SELECT empresa_id FROM public.user_empresas WHERE user_id = auth.uid() AND ativo = true)
  ))$sql$;
  END IF;
END $$;
