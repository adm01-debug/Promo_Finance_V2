-- Drop remaining conflicting broad policies

-- historico_conciliacao_ia
DROP POLICY IF EXISTS "Usuários autenticados podem ver histórico de conciliação" ON public.historico_conciliacao_ia;
DROP POLICY IF EXISTS "Usuários autenticados podem inserir histórico de conciliaçã" ON public.historico_conciliacao_ia;
DROP POLICY IF EXISTS "Usuários autenticados podem inserir histórico de conciliação" ON public.historico_conciliacao_ia;

-- conciliacoes_parciais
DROP POLICY IF EXISTS "Authenticated users can read conciliacoes_parciais" ON public.conciliacoes_parciais;

-- feedback_conciliacao_ia
DROP POLICY IF EXISTS "Usuários autenticados podem ver feedback" ON public.feedback_conciliacao_ia;
DROP POLICY IF EXISTS "Usuários autenticados podem inserir feedback" ON public.feedback_conciliacao_ia;

CREATE POLICY "Usuário vê próprio feedback"
ON public.feedback_conciliacao_ia FOR SELECT TO authenticated
USING (created_by = auth.uid() OR public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role]));

CREATE POLICY "Financeiro+ podem inserir feedback"
ON public.feedback_conciliacao_ia FOR INSERT TO authenticated
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role]));