
-- aprovacao_comentarios
DROP POLICY IF EXISTS "Users can view comments on requests they can see" ON public.aprovacao_comentarios;
CREATE POLICY "aprovacao_comentarios_owner_select" ON public.aprovacao_comentarios
  FOR SELECT TO authenticated
  USING (solicitacao_id IN (
    SELECT id FROM public.solicitacoes_aprovacao
    WHERE solicitado_por = auth.uid() OR aprovado_por = auth.uid()
  ) OR user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::public.app_role));

-- templates_cobranca
DROP POLICY IF EXISTS "Users can view templates" ON public.templates_cobranca;
CREATE POLICY "templates_cobranca_empresa_select" ON public.templates_cobranca
  FOR SELECT TO authenticated
  USING (empresa_id IN (SELECT empresa_id FROM public.user_empresas WHERE user_id = auth.uid() AND ativo = true));

-- regua_cobranca_etapas (via régua pai)
DROP POLICY IF EXISTS "Users can view stages" ON public.regua_cobranca_etapas;
CREATE POLICY "regua_cobranca_etapas_empresa_select" ON public.regua_cobranca_etapas
  FOR SELECT TO authenticated
  USING (regua_id IN (
    SELECT id FROM public.regua_cobranca
    WHERE empresa_id IN (SELECT empresa_id FROM public.user_empresas WHERE user_id = auth.uid() AND ativo = true)
  ));
