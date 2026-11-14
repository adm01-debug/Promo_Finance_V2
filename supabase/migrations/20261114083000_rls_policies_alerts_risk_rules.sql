-- fix: tabelas do Grupo B (alert_configurations, alerts, risk_rules) com RLS
-- ativa mas ZERO policies em produção — lockout total via authenticated.
--
-- Causa raiz: a reconcile v3 (20260825110000_reconciliar_schema_v3_completo.sql,
-- linhas 5039-5049, 5075-5084, 6460-6469) cria as policies *_tenant_* para
-- estas 3 tabelas, mas elas nunca chegaram a prod (as migrations Grupo A/B
-- apenas droppam policies legadas de outros nomes). Resultado: GRANT existente
-- para authenticated, RLS ativa, 0 policies → toda query autenticada retorna
-- vazio (lockout), incl. cross-tenant.
--
-- Padrão replicado: mesma definição da reconcile v3 (empresa_membro_ativo +
-- has_role). Idempotente (DROP IF EXISTS + CREATE).

BEGIN;

-- alert_configurations (4)
DROP POLICY IF EXISTS alert_configurations_tenant_delete ON public.alert_configurations;
CREATE POLICY alert_configurations_tenant_delete ON public.alert_configurations FOR DELETE TO authenticated USING ((public.empresa_membro_ativo(empresa_id) AND (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'manager'::public.app_role))));

DROP POLICY IF EXISTS alert_configurations_tenant_insert ON public.alert_configurations;
CREATE POLICY alert_configurations_tenant_insert ON public.alert_configurations FOR INSERT TO authenticated WITH CHECK ((public.empresa_membro_ativo(empresa_id) AND (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'manager'::public.app_role) OR public.has_role(auth.uid(), 'operator'::public.app_role))));

DROP POLICY IF EXISTS alert_configurations_tenant_select ON public.alert_configurations;
CREATE POLICY alert_configurations_tenant_select ON public.alert_configurations FOR SELECT TO authenticated USING (public.empresa_membro_ativo(empresa_id));

DROP POLICY IF EXISTS alert_configurations_tenant_update ON public.alert_configurations;
CREATE POLICY alert_configurations_tenant_update ON public.alert_configurations FOR UPDATE TO authenticated USING ((public.empresa_membro_ativo(empresa_id) AND (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'manager'::public.app_role) OR public.has_role(auth.uid(), 'operator'::public.app_role)))) WITH CHECK (public.empresa_membro_ativo(empresa_id));

-- alerts (4)
DROP POLICY IF EXISTS alerts_tenant_delete ON public.alerts;
CREATE POLICY alerts_tenant_delete ON public.alerts FOR DELETE TO authenticated USING ((public.empresa_membro_ativo(empresa_id) AND (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'manager'::public.app_role))));

DROP POLICY IF EXISTS alerts_tenant_insert ON public.alerts;
CREATE POLICY alerts_tenant_insert ON public.alerts FOR INSERT TO authenticated WITH CHECK ((public.empresa_membro_ativo(empresa_id) AND (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'manager'::public.app_role) OR public.has_role(auth.uid(), 'operator'::public.app_role))));

DROP POLICY IF EXISTS alerts_tenant_select ON public.alerts;
CREATE POLICY alerts_tenant_select ON public.alerts FOR SELECT TO authenticated USING (public.empresa_membro_ativo(empresa_id));

DROP POLICY IF EXISTS alerts_tenant_update ON public.alerts;
CREATE POLICY alerts_tenant_update ON public.alerts FOR UPDATE TO authenticated USING ((public.empresa_membro_ativo(empresa_id) AND (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'manager'::public.app_role) OR public.has_role(auth.uid(), 'operator'::public.app_role)))) WITH CHECK (public.empresa_membro_ativo(empresa_id));

-- risk_rules (4)
DROP POLICY IF EXISTS risk_rules_tenant_delete ON public.risk_rules;
CREATE POLICY risk_rules_tenant_delete ON public.risk_rules FOR DELETE TO authenticated USING ((public.empresa_membro_ativo(empresa_id) AND (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'manager'::public.app_role))));

DROP POLICY IF EXISTS risk_rules_tenant_insert ON public.risk_rules;
CREATE POLICY risk_rules_tenant_insert ON public.risk_rules FOR INSERT TO authenticated WITH CHECK ((public.empresa_membro_ativo(empresa_id) AND (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'manager'::public.app_role) OR public.has_role(auth.uid(), 'operator'::public.app_role))));

DROP POLICY IF EXISTS risk_rules_tenant_select ON public.risk_rules;
CREATE POLICY risk_rules_tenant_select ON public.risk_rules FOR SELECT TO authenticated USING (public.empresa_membro_ativo(empresa_id));

DROP POLICY IF EXISTS risk_rules_tenant_update ON public.risk_rules;
CREATE POLICY risk_rules_tenant_update ON public.risk_rules FOR UPDATE TO authenticated USING ((public.empresa_membro_ativo(empresa_id) AND (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'manager'::public.app_role) OR public.has_role(auth.uid(), 'operator'::public.app_role)))) WITH CHECK (public.empresa_membro_ativo(empresa_id));

COMMIT;
