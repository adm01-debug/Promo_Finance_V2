-- Final audit: harden all remaining RLS policies

-- 1) contas_bancarias: restrict SELECT to financeiro/admin
DROP POLICY IF EXISTS "Authenticated users can view contas_bancarias" ON public.contas_bancarias;
CREATE POLICY "Financeiro+ podem ver contas_bancarias"
ON public.contas_bancarias FOR SELECT TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role]));

-- 2) transacoes_bancarias: restrict SELECT to financeiro/admin
DROP POLICY IF EXISTS "Authenticated users can view transacoes_bancarias" ON public.transacoes_bancarias;
CREATE POLICY "Financeiro+ podem ver transacoes_bancarias"
ON public.transacoes_bancarias FOR SELECT TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role]));

-- 3) contas_receber: restrict SELECT to operacional+
DROP POLICY IF EXISTS "Authenticated users can view contas_receber" ON public.contas_receber;
CREATE POLICY "Operacional+ podem ver contas_receber"
ON public.contas_receber FOR SELECT TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role, 'operacional'::public.app_role]));

-- 4) contas_pagar: restrict SELECT to operacional+
DROP POLICY IF EXISTS "Authenticated users can view contas_pagar" ON public.contas_pagar;
CREATE POLICY "Operacional+ podem ver contas_pagar"
ON public.contas_pagar FOR SELECT TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role, 'operacional'::public.app_role]));

-- 5) vendedores: restrict SELECT to operacional+
DROP POLICY IF EXISTS "Autenticados podem ver vendedores" ON public.vendedores;
DROP POLICY IF EXISTS "Authenticated users can view vendedores" ON public.vendedores;
CREATE POLICY "Operacional+ podem ver vendedores"
ON public.vendedores FOR SELECT TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role, 'operacional'::public.app_role]));

-- 6) conciliacoes_parciais: restrict to financeiro/admin
DROP POLICY IF EXISTS "Authenticated users can view conciliacoes_parciais" ON public.conciliacoes_parciais;
DROP POLICY IF EXISTS "Authenticated users can insert conciliacoes_parciais" ON public.conciliacoes_parciais;
CREATE POLICY "Financeiro+ podem ver conciliacoes_parciais"
ON public.conciliacoes_parciais FOR SELECT TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role]));
CREATE POLICY "Financeiro+ podem inserir conciliacoes_parciais"
ON public.conciliacoes_parciais FOR INSERT TO authenticated
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role]));

-- 7) workflow_aprovacoes: restrict SELECT
DROP POLICY IF EXISTS "Authenticated users can view workflow_aprovacoes" ON public.workflow_aprovacoes;
CREATE POLICY "Aprovações visíveis ao solicitante ou financeiro+"
ON public.workflow_aprovacoes FOR SELECT TO authenticated
USING (
  solicitante_id = auth.uid()
  OR public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role])
);

-- 8) solicitacoes_aprovacao: restrict SELECT
DROP POLICY IF EXISTS "Authenticated users can view solicitacoes_aprovacao" ON public.solicitacoes_aprovacao;
CREATE POLICY "Solicitações visíveis ao solicitante ou financeiro+"
ON public.solicitacoes_aprovacao FOR SELECT TO authenticated
USING (
  solicitado_por = auth.uid()
  OR public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role])
);

-- 9) contratos: restrict SELECT to financeiro/admin
DROP POLICY IF EXISTS "Authenticated users can view contratos" ON public.contratos;
CREATE POLICY "Financeiro+ podem ver contratos"
ON public.contratos FOR SELECT TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role]));

-- 10) parcelas_acordo: restrict SELECT to financeiro/admin
DROP POLICY IF EXISTS "Authenticated users can view parcelas_acordo" ON public.parcelas_acordo;
DROP POLICY IF EXISTS "Usuários autenticados podem ver parcelas" ON public.parcelas_acordo;
CREATE POLICY "Financeiro+ podem ver parcelas_acordo"
ON public.parcelas_acordo FOR SELECT TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role]));

-- 11) metas_financeiras: restrict SELECT to financeiro/admin
DROP POLICY IF EXISTS "Authenticated users can view metas_financeiras" ON public.metas_financeiras;
CREATE POLICY "Financeiro+ podem ver metas_financeiras"
ON public.metas_financeiras FOR SELECT TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role]));

-- 12) historico_conciliacao_ia: restrict to financeiro/admin
DROP POLICY IF EXISTS "Authenticated users can view historico_conciliacao_ia" ON public.historico_conciliacao_ia;
DROP POLICY IF EXISTS "Authenticated users can insert historico_conciliacao_ia" ON public.historico_conciliacao_ia;
CREATE POLICY "Financeiro+ podem ver historico_conciliacao_ia"
ON public.historico_conciliacao_ia FOR SELECT TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role]));
CREATE POLICY "Financeiro+ podem inserir historico_conciliacao_ia"
ON public.historico_conciliacao_ia FOR INSERT TO authenticated
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role]));

-- 13) historico_cobranca: restrict SELECT to financeiro/admin
DROP POLICY IF EXISTS "Authenticated users can view historico_cobranca" ON public.historico_cobranca;
CREATE POLICY "Financeiro+ podem ver historico_cobranca"
ON public.historico_cobranca FOR SELECT TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role]));

-- 14) empresas: restrict SELECT to operacional+
DROP POLICY IF EXISTS "Authenticated users can view empresas" ON public.empresas;
CREATE POLICY "Operacional+ podem ver empresas"
ON public.empresas FOR SELECT TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role, 'operacional'::public.app_role]));

-- 15) centros_custo: restrict SELECT to financeiro/admin
DROP POLICY IF EXISTS "Authenticated users can view centros_custo" ON public.centros_custo;
CREATE POLICY "Financeiro+ podem ver centros_custo"
ON public.centros_custo FOR SELECT TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role]));

-- 16) security_alerts: restrict INSERT to admin only
DROP POLICY IF EXISTS "System can insert security alerts" ON public.security_alerts;
CREATE POLICY "Admin pode inserir security_alerts"
ON public.security_alerts FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));