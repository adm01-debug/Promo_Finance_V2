-- E67: initplan (SELECT auth.uid()) em 469 policies (2026-08-25)
-- PostgreSQL normaliza automaticamente para ( SELECT auth.uid() AS uid)
DROP POLICY IF EXISTS acessos_suspeitos_tenant_select ON public.acessos_suspeitos; CREATE POLICY acessos_suspeitos_tenant_select ON public.acessos_suspeitos AS PERMISSIVE FOR SELECT TO authenticated USING ((has_role((SELECT auth.uid()), 'admin'::app_role) AND ((empresa_id IS NULL) OR empresa_acessivel(empresa_id))));
DROP POLICY IF EXISTS "Empresa-based access" ON public.acoes_recomendadas; CREATE POLICY "Empresa-based access" ON public.acoes_recomendadas AS PERMISSIVE FOR ALL TO authenticated USING (((empresa_id IN ( SELECT user_empresas.empresa_id
   FROM user_empresas
  WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND (user_empresas.ativo = true)))) OR (EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = 'admin'::app_role))))));
DROP POLICY IF EXISTS "Empresa-based access" ON public.acordos_parcelamento; CREATE POLICY "Empresa-based access" ON public.acordos_parcelamento AS PERMISSIVE FOR ALL TO authenticated USING (((empresa_id IN ( SELECT user_empresas.empresa_id
   FROM user_empresas
  WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND (user_empresas.ativo = true)))) OR (EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = 'admin'::app_role))))));
DROP POLICY IF EXISTS "Owner manage acordos" ON public.acordos_parcelamento; CREATE POLICY "Owner manage acordos" ON public.acordos_parcelamento AS PERMISSIVE FOR ALL TO authenticated USING (((SELECT auth.uid()) = user_id)) WITH CHECK (((SELECT auth.uid()) = user_id));
DROP POLICY IF EXISTS "Admins can delete alert configs" ON public.alert_configurations; CREATE POLICY "Admins can delete alert configs" ON public.alert_configurations AS PERMISSIVE FOR DELETE TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role));
DROP POLICY IF EXISTS "Admins managers can view alert configs" ON public.alert_configurations; CREATE POLICY "Admins managers can view alert configs" ON public.alert_configurations AS PERMISSIVE FOR SELECT TO authenticated USING ((has_role((SELECT auth.uid()), 'admin'::app_role) OR has_role((SELECT auth.uid()), 'manager'::app_role)));
DROP POLICY IF EXISTS "Managers can insert alert configs" ON public.alert_configurations; CREATE POLICY "Managers can insert alert configs" ON public.alert_configurations AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((has_role((SELECT auth.uid()), 'admin'::app_role) OR has_role((SELECT auth.uid()), 'manager'::app_role)));
DROP POLICY IF EXISTS "Managers can update alert configs" ON public.alert_configurations; CREATE POLICY "Managers can update alert configs" ON public.alert_configurations AS PERMISSIVE FOR UPDATE TO authenticated USING ((has_role((SELECT auth.uid()), 'admin'::app_role) OR has_role((SELECT auth.uid()), 'manager'::app_role)));
DROP POLICY IF EXISTS "Viewers can view alert configs" ON public.alert_configurations; CREATE POLICY "Viewers can view alert configs" ON public.alert_configurations AS PERMISSIVE FOR SELECT TO authenticated USING (has_role((SELECT auth.uid()), 'viewer'::app_role));
DROP POLICY IF EXISTS "Owner manage alertas" ON public.alertas; CREATE POLICY "Owner manage alertas" ON public.alertas AS PERMISSIVE FOR ALL TO authenticated USING (((SELECT auth.uid()) = user_id)) WITH CHECK (((SELECT auth.uid()) = user_id));
DROP POLICY IF EXISTS alertas_owner_delete ON public.alertas; CREATE POLICY alertas_owner_delete ON public.alertas AS PERMISSIVE FOR DELETE TO authenticated USING ((( SELECT (SELECT auth.uid()) AS uid) = user_id));
DROP POLICY IF EXISTS alertas_owner_select ON public.alertas; CREATE POLICY alertas_owner_select ON public.alertas AS PERMISSIVE FOR SELECT TO authenticated USING ((( SELECT (SELECT auth.uid()) AS uid) = user_id));
DROP POLICY IF EXISTS alertas_preditivos_empresa_select ON public.alertas_preditivos; CREATE POLICY alertas_preditivos_empresa_select ON public.alertas_preditivos AS PERMISSIVE FOR SELECT TO authenticated USING ((empresa_id IN ( SELECT user_empresas.empresa_id
   FROM user_empresas
  WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND (user_empresas.ativo = true)))));
DROP POLICY IF EXISTS "Empresa-based access" ON public.alertas_tributarios; CREATE POLICY "Empresa-based access" ON public.alertas_tributarios AS PERMISSIVE FOR ALL TO authenticated USING (((empresa_id IN ( SELECT user_empresas.empresa_id
   FROM user_empresas
  WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND (user_empresas.ativo = true)))) OR (EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = 'admin'::app_role))))));
DROP POLICY IF EXISTS "Authorized roles can view alerts" ON public.alerts; CREATE POLICY "Authorized roles can view alerts" ON public.alerts AS PERMISSIVE FOR SELECT TO authenticated USING ((has_role((SELECT auth.uid()), 'admin'::app_role) OR has_role((SELECT auth.uid()), 'manager'::app_role) OR has_role((SELECT auth.uid()), 'operator'::app_role)));
DROP POLICY IF EXISTS "Managers can delete alerts" ON public.alerts; CREATE POLICY "Managers can delete alerts" ON public.alerts AS PERMISSIVE FOR DELETE TO authenticated USING ((has_role((SELECT auth.uid()), 'admin'::app_role) OR has_role((SELECT auth.uid()), 'manager'::app_role)));
DROP POLICY IF EXISTS "Operators can insert alerts" ON public.alerts; CREATE POLICY "Operators can insert alerts" ON public.alerts AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((has_role((SELECT auth.uid()), 'admin'::app_role) OR has_role((SELECT auth.uid()), 'manager'::app_role) OR has_role((SELECT auth.uid()), 'operator'::app_role)));
DROP POLICY IF EXISTS "Operators can update alerts" ON public.alerts; CREATE POLICY "Operators can update alerts" ON public.alerts AS PERMISSIVE FOR UPDATE TO authenticated USING ((has_role((SELECT auth.uid()), 'admin'::app_role) OR has_role((SELECT auth.uid()), 'manager'::app_role) OR has_role((SELECT auth.uid()), 'operator'::app_role)));
DROP POLICY IF EXISTS "Viewers can view alerts" ON public.alerts; CREATE POLICY "Viewers can view alerts" ON public.alerts AS PERMISSIVE FOR SELECT TO authenticated USING (has_role((SELECT auth.uid()), 'viewer'::app_role));
DROP POLICY IF EXISTS "Admins can delete alerts sent" ON public.alerts_sent; CREATE POLICY "Admins can delete alerts sent" ON public.alerts_sent AS PERMISSIVE FOR DELETE TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role));
DROP POLICY IF EXISTS "Authorized roles can view alerts sent" ON public.alerts_sent; CREATE POLICY "Authorized roles can view alerts sent" ON public.alerts_sent AS PERMISSIVE FOR SELECT TO authenticated USING ((has_role((SELECT auth.uid()), 'admin'::app_role) OR has_role((SELECT auth.uid()), 'manager'::app_role) OR has_role((SELECT auth.uid()), 'operator'::app_role)));
DROP POLICY IF EXISTS "Managers can update alerts sent" ON public.alerts_sent; CREATE POLICY "Managers can update alerts sent" ON public.alerts_sent AS PERMISSIVE FOR UPDATE TO authenticated USING ((has_role((SELECT auth.uid()), 'admin'::app_role) OR has_role((SELECT auth.uid()), 'manager'::app_role)));
DROP POLICY IF EXISTS "System can insert alerts sent" ON public.alerts_sent; CREATE POLICY "System can insert alerts sent" ON public.alerts_sent AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((has_role((SELECT auth.uid()), 'admin'::app_role) OR has_role((SELECT auth.uid()), 'manager'::app_role) OR has_role((SELECT auth.uid()), 'operator'::app_role)));
DROP POLICY IF EXISTS aliq_inter_write_admin ON public.aliquotas_interestaduais; CREATE POLICY aliq_inter_write_admin ON public.aliquotas_interestaduais AS PERMISSIVE FOR ALL TO authenticated USING (has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role)) WITH CHECK (has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role));
DROP POLICY IF EXISTS aliq_internas_write_admin ON public.aliquotas_internas_uf; CREATE POLICY aliq_internas_write_admin ON public.aliquotas_internas_uf AS PERMISSIVE FOR ALL TO authenticated USING (has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role)) WITH CHECK (has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role));
DROP POLICY IF EXISTS aliq_iss_write_admin ON public.aliquotas_iss_municipal; CREATE POLICY aliq_iss_write_admin ON public.aliquotas_iss_municipal AS PERMISSIVE FOR ALL TO authenticated USING (has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role)) WITH CHECK (has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role));
DROP POLICY IF EXISTS "Admin manage" ON public.allowed_countries; CREATE POLICY "Admin manage" ON public.allowed_countries AS PERMISSIVE FOR ALL TO authenticated USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = 'admin'::app_role)))));
DROP POLICY IF EXISTS allowed_ips_admin_all ON public.allowed_ips; CREATE POLICY allowed_ips_admin_all ON public.allowed_ips AS PERMISSIVE FOR ALL TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role)) WITH CHECK (has_role((SELECT auth.uid()), 'admin'::app_role));
DROP POLICY IF EXISTS "Owner manage anexos" ON public.anexos_financeiros; CREATE POLICY "Owner manage anexos" ON public.anexos_financeiros AS PERMISSIVE FOR ALL TO authenticated USING (((SELECT auth.uid()) = user_id)) WITH CHECK (((SELECT auth.uid()) = user_id));
DROP POLICY IF EXISTS anomalia_runs_owner_or_admin_select ON public.anomalia_detection_runs; CREATE POLICY anomalia_runs_owner_or_admin_select ON public.anomalia_detection_runs AS PERMISSIVE FOR SELECT TO authenticated USING (((triggered_by = (SELECT auth.uid())) OR has_role((SELECT auth.uid()), 'admin'::app_role)));
DROP POLICY IF EXISTS "Users can insert toast events" ON public.anomalia_toast_eventos; CREATE POLICY "Users can insert toast events" ON public.anomalia_toast_eventos AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (((SELECT auth.uid()) = user_id));
DROP POLICY IF EXISTS "Users can view their own toast events" ON public.anomalia_toast_eventos; CREATE POLICY "Users can view their own toast events" ON public.anomalia_toast_eventos AS PERMISSIVE FOR SELECT TO authenticated USING (((SELECT auth.uid()) = user_id));
DROP POLICY IF EXISTS "Admins can manage anomalias" ON public.anomalias_detectadas; CREATE POLICY "Admins can manage anomalias" ON public.anomalias_detectadas AS PERMISSIVE FOR ALL TO authenticated USING ((has_role((SELECT auth.uid()), 'admin'::app_role) OR has_role((SELECT auth.uid()), 'financeiro'::app_role))) WITH CHECK ((has_role((SELECT auth.uid()), 'admin'::app_role) OR has_role((SELECT auth.uid()), 'financeiro'::app_role)));
DROP POLICY IF EXISTS anomalias_detectadas_empresa_select ON public.anomalias_detectadas; CREATE POLICY anomalias_detectadas_empresa_select ON public.anomalias_detectadas AS PERMISSIVE FOR SELECT TO authenticated USING ((empresa_id IN ( SELECT user_empresas.empresa_id
   FROM user_empresas
  WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND (user_empresas.ativo = true)))));
DROP POLICY IF EXISTS anomalias_detectadas_tenant_rw ON public.anomalias_detectadas; CREATE POLICY anomalias_detectadas_tenant_rw ON public.anomalias_detectadas AS PERMISSIVE FOR ALL TO authenticated USING (((has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) OR has_role(( SELECT (SELECT auth.uid()) AS uid), 'financeiro'::app_role)) AND empresa_acessivel(empresa_id))) WITH CHECK (((has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) OR has_role(( SELECT (SELECT auth.uid()) AS uid), 'financeiro'::app_role)) AND empresa_acessivel(empresa_id)));
DROP POLICY IF EXISTS api_keys_delete ON public.api_keys; CREATE POLICY api_keys_delete ON public.api_keys AS PERMISSIVE FOR DELETE TO authenticated USING ((has_role((SELECT auth.uid()), 'admin'::app_role) AND empresa_acessivel(empresa_id)));
DROP POLICY IF EXISTS api_keys_select ON public.api_keys; CREATE POLICY api_keys_select ON public.api_keys AS PERMISSIVE FOR SELECT TO authenticated USING ((has_role((SELECT auth.uid()), 'admin'::app_role) AND empresa_acessivel(empresa_id)));
DROP POLICY IF EXISTS "Users can insert their own comments" ON public.aprovacao_comentarios; CREATE POLICY "Users can insert their own comments" ON public.aprovacao_comentarios AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (((SELECT auth.uid()) = user_id));
DROP POLICY IF EXISTS aprovacao_comentarios_owner_select ON public.aprovacao_comentarios; CREATE POLICY aprovacao_comentarios_owner_select ON public.aprovacao_comentarios AS PERMISSIVE FOR SELECT TO authenticated USING (((solicitacao_id IN ( SELECT solicitacoes_aprovacao.id
   FROM solicitacoes_aprovacao
  WHERE ((solicitacoes_aprovacao.solicitado_por = (SELECT auth.uid())) OR (solicitacoes_aprovacao.aprovado_por = (SELECT auth.uid()))))) OR (user_id = (SELECT auth.uid())) OR has_role((SELECT auth.uid()), 'admin'::app_role)));
DROP POLICY IF EXISTS "Empresa-based access" ON public.apuracoes_irpj_csll; CREATE POLICY "Empresa-based access" ON public.apuracoes_irpj_csll AS PERMISSIVE FOR ALL TO authenticated USING (((empresa_id IN ( SELECT user_empresas.empresa_id
   FROM user_empresas
  WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND (user_empresas.ativo = true)))) OR (EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = 'admin'::app_role))))));
DROP POLICY IF EXISTS apuracoes_tributarias_admin_all ON public.apuracoes_tributarias; CREATE POLICY apuracoes_tributarias_admin_all ON public.apuracoes_tributarias AS PERMISSIVE FOR ALL TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role)) WITH CHECK (has_role((SELECT auth.uid()), 'admin'::app_role));
DROP POLICY IF EXISTS apuracoes_tributarias_empresa_select ON public.apuracoes_tributarias; CREATE POLICY apuracoes_tributarias_empresa_select ON public.apuracoes_tributarias AS PERMISSIVE FOR SELECT TO authenticated USING ((empresa_id IN ( SELECT user_empresas.empresa_id
   FROM user_empresas
  WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND (user_empresas.ativo = true)))));
DROP POLICY IF EXISTS apuracoes_tributarias_tenant_rw ON public.apuracoes_tributarias; CREATE POLICY apuracoes_tributarias_tenant_rw ON public.apuracoes_tributarias AS PERMISSIVE FOR ALL TO authenticated USING ((has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id))) WITH CHECK ((has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id)));
DROP POLICY IF EXISTS asaas_audit_admin_all ON public.asaas_audit_trail; CREATE POLICY asaas_audit_admin_all ON public.asaas_audit_trail AS PERMISSIVE FOR ALL TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role)) WITH CHECK (has_role((SELECT auth.uid()), 'admin'::app_role));
DROP POLICY IF EXISTS asaas_audit_tenant_select ON public.asaas_audit_trail; CREATE POLICY asaas_audit_tenant_select ON public.asaas_audit_trail AS PERMISSIVE FOR SELECT TO authenticated USING ((has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) AND (EXISTS ( SELECT 1
   FROM asaas_payments p
  WHERE ((p.id = asaas_audit_trail.asaas_payment_id) AND empresa_acessivel(p.empresa_id))))));
DROP POLICY IF EXISTS asaas_config_admin_all ON public.asaas_config; CREATE POLICY asaas_config_admin_all ON public.asaas_config AS PERMISSIVE FOR ALL TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role)) WITH CHECK (has_role((SELECT auth.uid()), 'admin'::app_role));
DROP POLICY IF EXISTS asaas_config_tenant_rw ON public.asaas_config; CREATE POLICY asaas_config_tenant_rw ON public.asaas_config AS PERMISSIVE FOR ALL TO authenticated USING ((has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id))) WITH CHECK ((has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id)));
DROP POLICY IF EXISTS asaas_customers_admin_all ON public.asaas_customers; CREATE POLICY asaas_customers_admin_all ON public.asaas_customers AS PERMISSIVE FOR ALL TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role)) WITH CHECK (has_role((SELECT auth.uid()), 'admin'::app_role));
DROP POLICY IF EXISTS asaas_customers_empresa_select ON public.asaas_customers; CREATE POLICY asaas_customers_empresa_select ON public.asaas_customers AS PERMISSIVE FOR SELECT TO authenticated USING ((empresa_id IN ( SELECT user_empresas.empresa_id
   FROM user_empresas
  WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND (user_empresas.ativo = true)))));
DROP POLICY IF EXISTS asaas_customers_tenant_rw ON public.asaas_customers; CREATE POLICY asaas_customers_tenant_rw ON public.asaas_customers AS PERMISSIVE FOR ALL TO authenticated USING ((has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id))) WITH CHECK ((has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id)));
DROP POLICY IF EXISTS asaas_payments_admin_all ON public.asaas_payments; CREATE POLICY asaas_payments_admin_all ON public.asaas_payments AS PERMISSIVE FOR ALL TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role)) WITH CHECK (has_role((SELECT auth.uid()), 'admin'::app_role));
DROP POLICY IF EXISTS asaas_payments_empresa_select ON public.asaas_payments; CREATE POLICY asaas_payments_empresa_select ON public.asaas_payments AS PERMISSIVE FOR SELECT TO authenticated USING ((empresa_id IN ( SELECT user_empresas.empresa_id
   FROM user_empresas
  WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND (user_empresas.ativo = true)))));
DROP POLICY IF EXISTS asaas_payments_tenant_rw ON public.asaas_payments; CREATE POLICY asaas_payments_tenant_rw ON public.asaas_payments AS PERMISSIVE FOR ALL TO authenticated USING ((has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id))) WITH CHECK ((has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id)));
DROP POLICY IF EXISTS asaas_recon_admin_all ON public.asaas_reconciliation_suggestions; CREATE POLICY asaas_recon_admin_all ON public.asaas_reconciliation_suggestions AS PERMISSIVE FOR ALL TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role)) WITH CHECK (has_role((SELECT auth.uid()), 'admin'::app_role));
DROP POLICY IF EXISTS asaas_recon_empresa_select ON public.asaas_reconciliation_suggestions; CREATE POLICY asaas_recon_empresa_select ON public.asaas_reconciliation_suggestions AS PERMISSIVE FOR SELECT TO authenticated USING ((empresa_id IN ( SELECT user_empresas.empresa_id
   FROM user_empresas
  WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND (user_empresas.ativo = true)))));
DROP POLICY IF EXISTS asaas_reconciliation_suggestions_tenant_rw ON public.asaas_reconciliation_suggestions; CREATE POLICY asaas_reconciliation_suggestions_tenant_rw ON public.asaas_reconciliation_suggestions AS PERMISSIVE FOR ALL TO authenticated USING ((has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id))) WITH CHECK ((has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id)));
DROP POLICY IF EXISTS asaas_sync_admin_all ON public.asaas_sync_queue; CREATE POLICY asaas_sync_admin_all ON public.asaas_sync_queue AS PERMISSIVE FOR ALL TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role)) WITH CHECK (has_role((SELECT auth.uid()), 'admin'::app_role));
DROP POLICY IF EXISTS asaas_sync_tenant_all ON public.asaas_sync_queue; CREATE POLICY asaas_sync_tenant_all ON public.asaas_sync_queue AS PERMISSIVE FOR ALL TO authenticated USING ((has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) AND (EXISTS ( SELECT 1
   FROM asaas_payments p
  WHERE ((p.id = asaas_sync_queue.asaas_payment_id) AND empresa_acessivel(p.empresa_id)))))) WITH CHECK ((has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) AND (EXISTS ( SELECT 1
   FROM asaas_payments p
  WHERE ((p.id = asaas_sync_queue.asaas_payment_id) AND empresa_acessivel(p.empresa_id))))));
DROP POLICY IF EXISTS asaas_transfers_admin_all ON public.asaas_transfers; CREATE POLICY asaas_transfers_admin_all ON public.asaas_transfers AS PERMISSIVE FOR ALL TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role)) WITH CHECK (has_role((SELECT auth.uid()), 'admin'::app_role));
DROP POLICY IF EXISTS asaas_transfers_empresa_select ON public.asaas_transfers; CREATE POLICY asaas_transfers_empresa_select ON public.asaas_transfers AS PERMISSIVE FOR SELECT TO authenticated USING ((empresa_id IN ( SELECT user_empresas.empresa_id
   FROM user_empresas
  WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND (user_empresas.ativo = true)))));
DROP POLICY IF EXISTS asaas_transfers_tenant_rw ON public.asaas_transfers; CREATE POLICY asaas_transfers_tenant_rw ON public.asaas_transfers AS PERMISSIVE FOR ALL TO authenticated USING ((has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id))) WITH CHECK ((has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id)));
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_logs; CREATE POLICY "Admins can view audit logs" ON public.audit_logs AS PERMISSIVE FOR SELECT TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role));
DROP POLICY IF EXISTS audit_logs_insert_self_attributed ON public.audit_logs; CREATE POLICY audit_logs_insert_self_attributed ON public.audit_logs AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (((user_id = ( SELECT (SELECT auth.uid()) AS uid)) AND ((user_email IS NULL) OR (user_email = ( SELECT (auth.jwt() ->> 'email'::text))))));
DROP POLICY IF EXISTS admin_only_audit_logs_2026_01 ON public.audit_logs_2026_01; CREATE POLICY admin_only_audit_logs_2026_01 ON public.audit_logs_2026_01 AS PERMISSIVE FOR ALL TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role)) WITH CHECK (has_role((SELECT auth.uid()), 'admin'::app_role));
DROP POLICY IF EXISTS admin_only_audit_logs_2026_02 ON public.audit_logs_2026_02; CREATE POLICY admin_only_audit_logs_2026_02 ON public.audit_logs_2026_02 AS PERMISSIVE FOR ALL TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role)) WITH CHECK (has_role((SELECT auth.uid()), 'admin'::app_role));
DROP POLICY IF EXISTS admin_only_audit_logs_2026_03 ON public.audit_logs_2026_03; CREATE POLICY admin_only_audit_logs_2026_03 ON public.audit_logs_2026_03 AS PERMISSIVE FOR ALL TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role)) WITH CHECK (has_role((SELECT auth.uid()), 'admin'::app_role));
DROP POLICY IF EXISTS admin_only_audit_logs_2026_04 ON public.audit_logs_2026_04; CREATE POLICY admin_only_audit_logs_2026_04 ON public.audit_logs_2026_04 AS PERMISSIVE FOR ALL TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role)) WITH CHECK (has_role((SELECT auth.uid()), 'admin'::app_role));
DROP POLICY IF EXISTS admin_only_audit_logs_2026_05 ON public.audit_logs_2026_05; CREATE POLICY admin_only_audit_logs_2026_05 ON public.audit_logs_2026_05 AS PERMISSIVE FOR ALL TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role)) WITH CHECK (has_role((SELECT auth.uid()), 'admin'::app_role));
DROP POLICY IF EXISTS admin_only_audit_logs_2026_06 ON public.audit_logs_2026_06; CREATE POLICY admin_only_audit_logs_2026_06 ON public.audit_logs_2026_06 AS PERMISSIVE FOR ALL TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role)) WITH CHECK (has_role((SELECT auth.uid()), 'admin'::app_role));
DROP POLICY IF EXISTS admin_only_audit_logs_2026_07 ON public.audit_logs_2026_07; CREATE POLICY admin_only_audit_logs_2026_07 ON public.audit_logs_2026_07 AS PERMISSIVE FOR ALL TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role)) WITH CHECK (has_role((SELECT auth.uid()), 'admin'::app_role));
DROP POLICY IF EXISTS admin_only_audit_logs_2026_08 ON public.audit_logs_2026_08; CREATE POLICY admin_only_audit_logs_2026_08 ON public.audit_logs_2026_08 AS PERMISSIVE FOR ALL TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role)) WITH CHECK (has_role((SELECT auth.uid()), 'admin'::app_role));
DROP POLICY IF EXISTS admin_only_audit_logs_2026_09 ON public.audit_logs_2026_09; CREATE POLICY admin_only_audit_logs_2026_09 ON public.audit_logs_2026_09 AS PERMISSIVE FOR ALL TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role)) WITH CHECK (has_role((SELECT auth.uid()), 'admin'::app_role));
DROP POLICY IF EXISTS admin_only_audit_logs_2026_10 ON public.audit_logs_2026_10; CREATE POLICY admin_only_audit_logs_2026_10 ON public.audit_logs_2026_10 AS PERMISSIVE FOR ALL TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role)) WITH CHECK (has_role((SELECT auth.uid()), 'admin'::app_role));
DROP POLICY IF EXISTS admin_only_audit_logs_default ON public.audit_logs_default; CREATE POLICY admin_only_audit_logs_default ON public.audit_logs_default AS PERMISSIVE FOR ALL TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role)) WITH CHECK (has_role((SELECT auth.uid()), 'admin'::app_role));
DROP POLICY IF EXISTS auditoria_financeira_empresa_select ON public.auditoria_financeira; CREATE POLICY auditoria_financeira_empresa_select ON public.auditoria_financeira AS PERMISSIVE FOR SELECT TO authenticated USING ((empresa_id IN ( SELECT user_empresas.empresa_id
   FROM user_empresas
  WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND (user_empresas.ativo = true)))));
DROP POLICY IF EXISTS auditoria_user_insert ON public.auditoria_financeira; CREATE POLICY auditoria_user_insert ON public.auditoria_financeira AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (((SELECT auth.uid()) = user_id));
DROP POLICY IF EXISTS auditoria_trib_select_tenant ON public.auditoria_tributaria; CREATE POLICY auditoria_trib_select_tenant ON public.auditoria_tributaria AS PERMISSIVE FOR SELECT TO authenticated USING ((has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id)));
DROP POLICY IF EXISTS "Admins can view all auth logs" ON public.auth_logs; CREATE POLICY "Admins can view all auth logs" ON public.auth_logs AS PERMISSIVE FOR SELECT TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role));
DROP POLICY IF EXISTS "Authenticated can insert auth logs" ON public.auth_logs; CREATE POLICY "Authenticated can insert auth logs" ON public.auth_logs AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((has_role((SELECT auth.uid()), 'admin'::app_role) OR has_role((SELECT auth.uid()), 'manager'::app_role) OR has_role((SELECT auth.uid()), 'operator'::app_role) OR has_role((SELECT auth.uid()), 'viewer'::app_role)));
DROP POLICY IF EXISTS "Users can view own auth logs" ON public.auth_logs; CREATE POLICY "Users can view own auth logs" ON public.auth_logs AS PERMISSIVE FOR SELECT TO authenticated USING (((SELECT auth.uid()) = user_id));
DROP POLICY IF EXISTS benchmarks_admin_write ON public.benchmarks_setoriais; CREATE POLICY benchmarks_admin_write ON public.benchmarks_setoriais AS PERMISSIVE FOR ALL TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role)) WITH CHECK (has_role((SELECT auth.uid()), 'admin'::app_role));
DROP POLICY IF EXISTS beneficios_write_admin ON public.beneficios_fiscais; CREATE POLICY beneficios_write_admin ON public.beneficios_fiscais AS PERMISSIVE FOR ALL TO authenticated USING (has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role)) WITH CHECK (has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role));
DROP POLICY IF EXISTS "Admins can delete activities" ON public.bitrix24_activities; CREATE POLICY "Admins can delete activities" ON public.bitrix24_activities AS PERMISSIVE FOR DELETE TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role));
DROP POLICY IF EXISTS "Authorized roles can view activities" ON public.bitrix24_activities; CREATE POLICY "Authorized roles can view activities" ON public.bitrix24_activities AS PERMISSIVE FOR SELECT TO authenticated USING ((has_role((SELECT auth.uid()), 'admin'::app_role) OR has_role((SELECT auth.uid()), 'manager'::app_role)));
DROP POLICY IF EXISTS "Managers can insert activities" ON public.bitrix24_activities; CREATE POLICY "Managers can insert activities" ON public.bitrix24_activities AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((has_role((SELECT auth.uid()), 'admin'::app_role) OR has_role((SELECT auth.uid()), 'manager'::app_role)));
DROP POLICY IF EXISTS "Managers can update activities" ON public.bitrix24_activities; CREATE POLICY "Managers can update activities" ON public.bitrix24_activities AS PERMISSIVE FOR UPDATE TO authenticated USING ((has_role((SELECT auth.uid()), 'admin'::app_role) OR has_role((SELECT auth.uid()), 'manager'::app_role)));
DROP POLICY IF EXISTS "Admins can delete stage mappings" ON public.bitrix24_stage_mappings; CREATE POLICY "Admins can delete stage mappings" ON public.bitrix24_stage_mappings AS PERMISSIVE FOR DELETE TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role));
DROP POLICY IF EXISTS "Authorized roles can view stage mappings" ON public.bitrix24_stage_mappings; CREATE POLICY "Authorized roles can view stage mappings" ON public.bitrix24_stage_mappings AS PERMISSIVE FOR SELECT TO authenticated USING ((has_role((SELECT auth.uid()), 'admin'::app_role) OR has_role((SELECT auth.uid()), 'manager'::app_role) OR has_role((SELECT auth.uid()), 'operator'::app_role)));
DROP POLICY IF EXISTS "Managers can insert stage mappings" ON public.bitrix24_stage_mappings; CREATE POLICY "Managers can insert stage mappings" ON public.bitrix24_stage_mappings AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((has_role((SELECT auth.uid()), 'admin'::app_role) OR has_role((SELECT auth.uid()), 'manager'::app_role)));
DROP POLICY IF EXISTS "Managers can update stage mappings" ON public.bitrix24_stage_mappings; CREATE POLICY "Managers can update stage mappings" ON public.bitrix24_stage_mappings AS PERMISSIVE FOR UPDATE TO authenticated USING ((has_role((SELECT auth.uid()), 'admin'::app_role) OR has_role((SELECT auth.uid()), 'manager'::app_role)));
DROP POLICY IF EXISTS "Admins can delete tokens" ON public.bitrix24_tokens; CREATE POLICY "Admins can delete tokens" ON public.bitrix24_tokens AS PERMISSIVE FOR DELETE TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role));
DROP POLICY IF EXISTS "Admins can insert tokens" ON public.bitrix24_tokens; CREATE POLICY "Admins can insert tokens" ON public.bitrix24_tokens AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (has_role((SELECT auth.uid()), 'admin'::app_role));
DROP POLICY IF EXISTS "Admins can update tokens" ON public.bitrix24_tokens; CREATE POLICY "Admins can update tokens" ON public.bitrix24_tokens AS PERMISSIVE FOR UPDATE TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role));
DROP POLICY IF EXISTS "Only admins can view tokens" ON public.bitrix24_tokens; CREATE POLICY "Only admins can view tokens" ON public.bitrix24_tokens AS PERMISSIVE FOR SELECT TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role));
DROP POLICY IF EXISTS bitrix_field_mappings_empresa_select ON public.bitrix_field_mappings; CREATE POLICY bitrix_field_mappings_empresa_select ON public.bitrix_field_mappings AS PERMISSIVE FOR SELECT TO authenticated USING ((empresa_id IN ( SELECT user_empresas.empresa_id
   FROM user_empresas
  WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND (user_empresas.ativo = true)))));
DROP POLICY IF EXISTS bitrix_sync_logs_empresa_select ON public.bitrix_sync_logs; CREATE POLICY bitrix_sync_logs_empresa_select ON public.bitrix_sync_logs AS PERMISSIVE FOR SELECT TO authenticated USING ((empresa_id IN ( SELECT user_empresas.empresa_id
   FROM user_empresas
  WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND (user_empresas.ativo = true)))));
DROP POLICY IF EXISTS "Admin only manage" ON public.bitrix_webhook_events; CREATE POLICY "Admin only manage" ON public.bitrix_webhook_events AS PERMISSIVE FOR ALL TO authenticated USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = 'admin'::app_role)))));
DROP POLICY IF EXISTS bling_sync_logs_insert ON public.bling_sync_logs; CREATE POLICY bling_sync_logs_insert ON public.bling_sync_logs AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((has_role((SELECT auth.uid()), 'admin'::app_role) OR has_role((SELECT auth.uid()), 'financeiro'::app_role)));
DROP POLICY IF EXISTS bling_sync_logs_select ON public.bling_sync_logs; CREATE POLICY bling_sync_logs_select ON public.bling_sync_logs AS PERMISSIVE FOR SELECT TO authenticated USING ((has_role((SELECT auth.uid()), 'admin'::app_role) OR has_role((SELECT auth.uid()), 'financeiro'::app_role) OR has_role((SELECT auth.uid()), 'operacional'::app_role)));
DROP POLICY IF EXISTS bling_webhook_events_admin_select ON public.bling_webhook_events; CREATE POLICY bling_webhook_events_admin_select ON public.bling_webhook_events AS PERMISSIVE FOR SELECT TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role));
DROP POLICY IF EXISTS "Admins podem consultar snapshots de bloat" ON public.bloat_snapshots; CREATE POLICY "Admins podem consultar snapshots de bloat" ON public.bloat_snapshots AS PERMISSIVE FOR SELECT TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role));
DROP POLICY IF EXISTS "Admins can manage blocked IPs" ON public.blocked_ips; CREATE POLICY "Admins can manage blocked IPs" ON public.blocked_ips AS PERMISSIVE FOR ALL TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role));
DROP POLICY IF EXISTS "Managers can view blocked IPs" ON public.blocked_ips; CREATE POLICY "Managers can view blocked IPs" ON public.blocked_ips AS PERMISSIVE FOR SELECT TO authenticated USING (has_role((SELECT auth.uid()), 'manager'::app_role));
DROP POLICY IF EXISTS "Empresa-based access" ON public.bloqueios_duplicidade; CREATE POLICY "Empresa-based access" ON public.bloqueios_duplicidade AS PERMISSIVE FOR ALL TO authenticated USING (((empresa_id IN ( SELECT user_empresas.empresa_id
   FROM user_empresas
  WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND (user_empresas.ativo = true)))) OR (EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = 'admin'::app_role))))));
DROP POLICY IF EXISTS "Owner manage boletos" ON public.boletos; CREATE POLICY "Owner manage boletos" ON public.boletos AS PERMISSIVE FOR ALL TO authenticated USING (((SELECT auth.uid()) = user_id)) WITH CHECK (((SELECT auth.uid()) = user_id));
DROP POLICY IF EXISTS boletos_grupo_select ON public.boletos; CREATE POLICY boletos_grupo_select ON public.boletos AS PERMISSIVE FOR SELECT TO authenticated USING (((empresa_id IS NOT NULL) AND (empresa_id IN ( SELECT user_empresas.empresa_id
   FROM user_empresas
  WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND (user_empresas.ativo = true))))));
DROP POLICY IF EXISTS "Budgets scoped by owner or empresa" ON public.budgets; CREATE POLICY "Budgets scoped by owner or empresa" ON public.budgets AS PERMISSIVE FOR ALL TO authenticated USING (((user_id = (SELECT auth.uid())) OR has_role((SELECT auth.uid()), 'admin'::app_role) OR (company_id IN ( SELECT ue.empresa_id
   FROM user_empresas ue
  WHERE ((ue.user_id = (SELECT auth.uid())) AND (ue.ativo = true)))))) WITH CHECK (((user_id = (SELECT auth.uid())) OR has_role((SELECT auth.uid()), 'admin'::app_role) OR (company_id IN ( SELECT ue.empresa_id
   FROM user_empresas ue
  WHERE ((ue.user_id = (SELECT auth.uid())) AND (ue.ativo = true))))));
DROP POLICY IF EXISTS "Admins leem cargas de catalogos fiscais" ON public.catalogos_fiscais_cargas; CREATE POLICY "Admins leem cargas de catalogos fiscais" ON public.catalogos_fiscais_cargas AS PERMISSIVE FOR SELECT TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role));
DROP POLICY IF EXISTS "admins leem historico saude fiscal" ON public.catalogos_tributarios_health_history; CREATE POLICY "admins leem historico saude fiscal" ON public.catalogos_tributarios_health_history AS PERMISSIVE FOR SELECT TO authenticated USING (( SELECT has_role((SELECT auth.uid()), 'admin'::app_role) AS has_role));
DROP POLICY IF EXISTS "Categorias scoped by empresa" ON public.categorias; CREATE POLICY "Categorias scoped by empresa" ON public.categorias AS PERMISSIVE FOR ALL TO authenticated USING ((has_role((SELECT auth.uid()), 'admin'::app_role) OR (empresa_id IN ( SELECT ue.empresa_id
   FROM user_empresas ue
  WHERE ((ue.user_id = (SELECT auth.uid())) AND (ue.ativo = true)))))) WITH CHECK ((has_role((SELECT auth.uid()), 'admin'::app_role) OR (empresa_id IN ( SELECT ue.empresa_id
   FROM user_empresas ue
  WHERE ((ue.user_id = (SELECT auth.uid())) AND (ue.ativo = true))))));
DROP POLICY IF EXISTS "Admins can manage centros de custo" ON public.centros_custo; CREATE POLICY "Admins can manage centros de custo" ON public.centros_custo AS PERMISSIVE FOR ALL TO authenticated USING ((has_role((SELECT auth.uid()), 'admin'::app_role) OR has_role((SELECT auth.uid()), 'financeiro'::app_role))) WITH CHECK ((has_role((SELECT auth.uid()), 'admin'::app_role) OR has_role((SELECT auth.uid()), 'financeiro'::app_role)));
DROP POLICY IF EXISTS centros_custo_empresa_select ON public.centros_custo; CREATE POLICY centros_custo_empresa_select ON public.centros_custo AS PERMISSIVE FOR SELECT TO authenticated USING ((empresa_id IN ( SELECT user_empresas.empresa_id
   FROM user_empresas
  WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND (user_empresas.ativo = true)))));
DROP POLICY IF EXISTS centros_custo_tenant_rw ON public.centros_custo; CREATE POLICY centros_custo_tenant_rw ON public.centros_custo AS PERMISSIVE FOR ALL TO authenticated USING (((has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) OR has_role(( SELECT (SELECT auth.uid()) AS uid), 'financeiro'::app_role)) AND empresa_acessivel(empresa_id))) WITH CHECK (((has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) OR has_role(( SELECT (SELECT auth.uid()) AS uid), 'financeiro'::app_role)) AND empresa_acessivel(empresa_id)));
DROP POLICY IF EXISTS "Admins can view CI security gate events" ON public.ci_security_gate_events; CREATE POLICY "Admins can view CI security gate events" ON public.ci_security_gate_events AS PERMISSIVE FOR SELECT TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role));
DROP POLICY IF EXISTS clientes_grupo_select ON public.clientes; CREATE POLICY clientes_grupo_select ON public.clientes AS PERMISSIVE FOR SELECT TO authenticated USING (((empresa_id IS NOT NULL) AND (empresa_id IN ( SELECT user_empresas.empresa_id
   FROM user_empresas
  WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND (user_empresas.ativo = true))))));
DROP POLICY IF EXISTS clientes_owner_delete ON public.clientes; CREATE POLICY clientes_owner_delete ON public.clientes AS PERMISSIVE FOR DELETE TO authenticated USING (((SELECT auth.uid()) = user_id));
DROP POLICY IF EXISTS clientes_owner_insert ON public.clientes; CREATE POLICY clientes_owner_insert ON public.clientes AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (((( SELECT (SELECT auth.uid()) AS uid) = user_id) AND ((empresa_id IS NULL) OR empresa_membro_ativo(empresa_id))));
DROP POLICY IF EXISTS clientes_owner_select ON public.clientes; CREATE POLICY clientes_owner_select ON public.clientes AS PERMISSIVE FOR SELECT TO authenticated USING (((SELECT auth.uid()) = user_id));
DROP POLICY IF EXISTS clientes_owner_update ON public.clientes; CREATE POLICY clientes_owner_update ON public.clientes AS PERMISSIVE FOR UPDATE TO authenticated USING ((( SELECT (SELECT auth.uid()) AS uid) = user_id)) WITH CHECK (((( SELECT (SELECT auth.uid()) AS uid) = user_id) AND ((empresa_id IS NULL) OR empresa_membro_ativo(empresa_id))));
DROP POLICY IF EXISTS cnaes_write_admin ON public.cnaes; CREATE POLICY cnaes_write_admin ON public.cnaes AS PERMISSIVE FOR ALL TO authenticated USING (has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role)) WITH CHECK (has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role));
DROP POLICY IF EXISTS conciliacoes_owner_all ON public.conciliacoes; CREATE POLICY conciliacoes_owner_all ON public.conciliacoes AS PERMISSIVE FOR ALL TO authenticated USING (((SELECT auth.uid()) = user_id)) WITH CHECK (((SELECT auth.uid()) = user_id));
DROP POLICY IF EXISTS concil_parciais_owner_all ON public.conciliacoes_parciais; CREATE POLICY concil_parciais_owner_all ON public.conciliacoes_parciais AS PERMISSIVE FOR ALL TO authenticated USING (((SELECT auth.uid()) = created_by)) WITH CHECK (((SELECT auth.uid()) = created_by));
DROP POLICY IF EXISTS configuracoes_aprovacao_admin_all ON public.configuracoes_aprovacao; CREATE POLICY configuracoes_aprovacao_admin_all ON public.configuracoes_aprovacao AS PERMISSIVE FOR ALL TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role)) WITH CHECK (has_role((SELECT auth.uid()), 'admin'::app_role));
DROP POLICY IF EXISTS configuracoes_aprovacao_empresa_select ON public.configuracoes_aprovacao; CREATE POLICY configuracoes_aprovacao_empresa_select ON public.configuracoes_aprovacao AS PERMISSIVE FOR SELECT TO authenticated USING ((empresa_id IN ( SELECT user_empresas.empresa_id
   FROM user_empresas
  WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND (user_empresas.ativo = true)))));
DROP POLICY IF EXISTS configuracoes_aprovacao_tenant_rw ON public.configuracoes_aprovacao; CREATE POLICY configuracoes_aprovacao_tenant_rw ON public.configuracoes_aprovacao AS PERMISSIVE FOR ALL TO authenticated USING ((has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id))) WITH CHECK ((has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id)));
DROP POLICY IF EXISTS "Empresa-based access" ON public.configuracoes_duplicidade; CREATE POLICY "Empresa-based access" ON public.configuracoes_duplicidade AS PERMISSIVE FOR ALL TO authenticated USING (((empresa_id IN ( SELECT user_empresas.empresa_id
   FROM user_empresas
  WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND (user_empresas.ativo = true)))) OR (EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = 'admin'::app_role))))));
DROP POLICY IF EXISTS config_dup_admin_all ON public.configuracoes_duplicidade; CREATE POLICY config_dup_admin_all ON public.configuracoes_duplicidade AS PERMISSIVE FOR ALL TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role)) WITH CHECK (has_role((SELECT auth.uid()), 'admin'::app_role));
DROP POLICY IF EXISTS configuracoes_duplicidade_tenant_rw ON public.configuracoes_duplicidade; CREATE POLICY configuracoes_duplicidade_tenant_rw ON public.configuracoes_duplicidade AS PERMISSIVE FOR ALL TO authenticated USING ((has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id))) WITH CHECK ((has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id)));
DROP POLICY IF EXISTS conformidade_snapshots_empresa_insert ON public.conformidade_snapshots; CREATE POLICY conformidade_snapshots_empresa_insert ON public.conformidade_snapshots AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((empresa_id IN ( SELECT ue.empresa_id
   FROM user_empresas ue
  WHERE ((ue.user_id = ( SELECT (SELECT auth.uid()) AS uid)) AND (ue.ativo = true)))));
DROP POLICY IF EXISTS conformidade_snapshots_empresa_select ON public.conformidade_snapshots; CREATE POLICY conformidade_snapshots_empresa_select ON public.conformidade_snapshots AS PERMISSIVE FOR SELECT TO authenticated USING ((empresa_id IN ( SELECT ue.empresa_id
   FROM user_empresas ue
  WHERE ((ue.user_id = ( SELECT (SELECT auth.uid()) AS uid)) AND (ue.ativo = true)))));
DROP POLICY IF EXISTS conformidade_snapshots_empresa_update ON public.conformidade_snapshots; CREATE POLICY conformidade_snapshots_empresa_update ON public.conformidade_snapshots AS PERMISSIVE FOR UPDATE TO authenticated USING ((empresa_id IN ( SELECT ue.empresa_id
   FROM user_empresas ue
  WHERE ((ue.user_id = ( SELECT (SELECT auth.uid()) AS uid)) AND (ue.ativo = true))))) WITH CHECK ((empresa_id IN ( SELECT ue.empresa_id
   FROM user_empresas ue
  WHERE ((ue.user_id = ( SELECT (SELECT auth.uid()) AS uid)) AND (ue.ativo = true)))));
DROP POLICY IF EXISTS conformidade_snapshots_tenant_rw ON public.conformidade_snapshots; CREATE POLICY conformidade_snapshots_tenant_rw ON public.conformidade_snapshots AS PERMISSIVE FOR ALL TO authenticated USING ((has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id))) WITH CHECK ((has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id)));
DROP POLICY IF EXISTS contas_bancarias_empresa_select ON public.contas_bancarias; CREATE POLICY contas_bancarias_empresa_select ON public.contas_bancarias AS PERMISSIVE FOR SELECT TO authenticated USING ((empresa_id IN ( SELECT user_empresas.empresa_id
   FROM user_empresas
  WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND (user_empresas.ativo = true)))));
DROP POLICY IF EXISTS "Admins can manage contas pagar" ON public.contas_pagar; CREATE POLICY "Admins can manage contas pagar" ON public.contas_pagar AS PERMISSIVE FOR ALL TO authenticated USING ((has_role((SELECT auth.uid()), 'admin'::app_role) OR has_role((SELECT auth.uid()), 'financeiro'::app_role))) WITH CHECK ((has_role((SELECT auth.uid()), 'admin'::app_role) OR has_role((SELECT auth.uid()), 'financeiro'::app_role)));
DROP POLICY IF EXISTS contas_pagar_empresa_select ON public.contas_pagar; CREATE POLICY contas_pagar_empresa_select ON public.contas_pagar AS PERMISSIVE FOR SELECT TO authenticated USING ((empresa_id IN ( SELECT user_empresas.empresa_id
   FROM user_empresas
  WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND (user_empresas.ativo = true)))));
DROP POLICY IF EXISTS contas_pagar_tenant_rw ON public.contas_pagar; CREATE POLICY contas_pagar_tenant_rw ON public.contas_pagar AS PERMISSIVE FOR ALL TO authenticated USING (((has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) OR has_role(( SELECT (SELECT auth.uid()) AS uid), 'financeiro'::app_role)) AND empresa_acessivel(empresa_id))) WITH CHECK (((has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) OR has_role(( SELECT (SELECT auth.uid()) AS uid), 'financeiro'::app_role)) AND empresa_acessivel(empresa_id)));
DROP POLICY IF EXISTS "Admins can manage contas receber" ON public.contas_receber; CREATE POLICY "Admins can manage contas receber" ON public.contas_receber AS PERMISSIVE FOR ALL TO authenticated USING ((has_role((SELECT auth.uid()), 'admin'::app_role) OR has_role((SELECT auth.uid()), 'financeiro'::app_role))) WITH CHECK ((has_role((SELECT auth.uid()), 'admin'::app_role) OR has_role((SELECT auth.uid()), 'financeiro'::app_role)));
DROP POLICY IF EXISTS contas_receber_empresa_select ON public.contas_receber; CREATE POLICY contas_receber_empresa_select ON public.contas_receber AS PERMISSIVE FOR SELECT TO authenticated USING ((empresa_id IN ( SELECT user_empresas.empresa_id
   FROM user_empresas
  WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND (user_empresas.ativo = true)))));
DROP POLICY IF EXISTS contas_receber_tenant_rw ON public.contas_receber; CREATE POLICY contas_receber_tenant_rw ON public.contas_receber AS PERMISSIVE FOR ALL TO authenticated USING (((has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) OR has_role(( SELECT (SELECT auth.uid()) AS uid), 'financeiro'::app_role)) AND empresa_acessivel(empresa_id))) WITH CHECK (((has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) OR has_role(( SELECT (SELECT auth.uid()) AS uid), 'financeiro'::app_role)) AND empresa_acessivel(empresa_id)));
DROP POLICY IF EXISTS "Empresa-based access" ON public.contratos; CREATE POLICY "Empresa-based access" ON public.contratos AS PERMISSIVE FOR ALL TO authenticated USING (((empresa_id IN ( SELECT user_empresas.empresa_id
   FROM user_empresas
  WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND (user_empresas.ativo = true)))) OR (EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = 'admin'::app_role))))));
DROP POLICY IF EXISTS convites_manage_responsavel ON public.convites; CREATE POLICY convites_manage_responsavel ON public.convites AS PERMISSIVE FOR ALL TO authenticated USING ((is_org_responsavel(organizacao_id, (SELECT auth.uid())) OR has_role((SELECT auth.uid()), 'admin'::app_role))) WITH CHECK (((convidado_por = (SELECT auth.uid())) AND (is_org_responsavel(organizacao_id, (SELECT auth.uid())) OR has_role((SELECT auth.uid()), 'admin'::app_role))));
DROP POLICY IF EXISTS convites_contador_revogar ON public.convites_contador; CREATE POLICY convites_contador_revogar ON public.convites_contador AS PERMISSIVE FOR UPDATE TO authenticated USING ((empresa_acessivel(empresa_id) AND (has_role((SELECT auth.uid()), 'admin'::app_role) OR has_role((SELECT auth.uid()), 'financeiro'::app_role)))) WITH CHECK ((empresa_acessivel(empresa_id) AND (has_role((SELECT auth.uid()), 'admin'::app_role) OR has_role((SELECT auth.uid()), 'financeiro'::app_role))));
DROP POLICY IF EXISTS convites_contador_select ON public.convites_contador; CREATE POLICY convites_contador_select ON public.convites_contador AS PERMISSIVE FOR SELECT TO authenticated USING ((empresa_acessivel(empresa_id) AND (has_role((SELECT auth.uid()), 'admin'::app_role) OR has_role((SELECT auth.uid()), 'financeiro'::app_role))));
DROP POLICY IF EXISTS "Access by empresa_id" ON public.creditos_tributarios; CREATE POLICY "Access by empresa_id" ON public.creditos_tributarios AS PERMISSIVE FOR ALL TO authenticated USING (((empresa_id IN ( SELECT user_empresas.empresa_id
   FROM user_empresas
  WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND (user_empresas.ativo = true)))) OR (EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = 'admin'::app_role))))));
DROP POLICY IF EXISTS "Admins can view cron logs" ON public.cron_job_logs; CREATE POLICY "Admins can view cron logs" ON public.cron_job_logs AS PERMISSIVE FOR SELECT TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role));
DROP POLICY IF EXISTS "Custom field definitions scoped by empresa" ON public.custom_field_definitions; CREATE POLICY "Custom field definitions scoped by empresa" ON public.custom_field_definitions AS PERMISSIVE FOR ALL TO authenticated USING ((has_role((SELECT auth.uid()), 'admin'::app_role) OR (empresa_id IN ( SELECT ue.empresa_id
   FROM user_empresas ue
  WHERE ((ue.user_id = (SELECT auth.uid())) AND (ue.ativo = true)))))) WITH CHECK ((has_role((SELECT auth.uid()), 'admin'::app_role) OR (empresa_id IN ( SELECT ue.empresa_id
   FROM user_empresas ue
  WHERE ((ue.user_id = (SELECT auth.uid())) AND (ue.ativo = true))))));
DROP POLICY IF EXISTS "Custom field values scoped by definition empresa" ON public.custom_field_values; CREATE POLICY "Custom field values scoped by definition empresa" ON public.custom_field_values AS PERMISSIVE FOR ALL TO authenticated USING ((EXISTS ( SELECT 1
   FROM custom_field_definitions d
  WHERE ((d.id = custom_field_values.definition_id) AND (has_role((SELECT auth.uid()), 'admin'::app_role) OR (d.empresa_id IN ( SELECT ue.empresa_id
           FROM user_empresas ue
          WHERE ((ue.user_id = (SELECT auth.uid())) AND (ue.ativo = true))))))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM custom_field_definitions d
  WHERE ((d.id = custom_field_values.definition_id) AND (has_role((SELECT auth.uid()), 'admin'::app_role) OR (d.empresa_id IN ( SELECT ue.empresa_id
           FROM user_empresas ue
          WHERE ((ue.user_id = (SELECT auth.uid())) AND (ue.ativo = true)))))))));
DROP POLICY IF EXISTS "Admins can manage darfs" ON public.darfs; CREATE POLICY "Admins can manage darfs" ON public.darfs AS PERMISSIVE FOR ALL TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role)) WITH CHECK (has_role((SELECT auth.uid()), 'admin'::app_role));
DROP POLICY IF EXISTS "DARFs scoped by linked empresa" ON public.darfs; CREATE POLICY "DARFs scoped by linked empresa" ON public.darfs AS PERMISSIVE FOR SELECT TO authenticated USING ((has_role((SELECT auth.uid()), 'admin'::app_role) OR (empresa_id IN ( SELECT ue.empresa_id
   FROM user_empresas ue
  WHERE ((ue.user_id = (SELECT auth.uid())) AND (ue.ativo = true)))) OR (alerta_id IN ( SELECT at.id
   FROM alertas_tributarios at
  WHERE (at.empresa_id IN ( SELECT ue.empresa_id
           FROM user_empresas ue
          WHERE ((ue.user_id = (SELECT auth.uid())) AND (ue.ativo = true))))))));
DROP POLICY IF EXISTS darfs_tenant_rw ON public.darfs; CREATE POLICY darfs_tenant_rw ON public.darfs AS PERMISSIVE FOR ALL TO authenticated USING ((has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id))) WITH CHECK ((has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id)));
DROP POLICY IF EXISTS "Admins podem consultar o log de envios do digest" ON public.digest_envios_log; CREATE POLICY "Admins podem consultar o log de envios do digest" ON public.digest_envios_log AS PERMISSIVE FOR SELECT TO authenticated USING (has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role));
DROP POLICY IF EXISTS "User-based access" ON public.dispositivos_conhecidos; CREATE POLICY "User-based access" ON public.dispositivos_conhecidos AS PERMISSIVE FOR ALL TO authenticated USING (((user_id = (SELECT auth.uid())) OR (EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = 'admin'::app_role))))));
DROP POLICY IF EXISTS "Empresa-based access" ON public.divergencias_conciliacao; CREATE POLICY "Empresa-based access" ON public.divergencias_conciliacao AS PERMISSIVE FOR ALL TO authenticated USING (((empresa_id IN ( SELECT user_empresas.empresa_id
   FROM user_empresas
  WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND (user_empresas.ativo = true)))) OR (EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = 'admin'::app_role))))));
DROP POLICY IF EXISTS edge_function_logs_admin_select ON public.edge_function_logs; CREATE POLICY edge_function_logs_admin_select ON public.edge_function_logs AS PERMISSIVE FOR SELECT TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role));
DROP POLICY IF EXISTS creditos_auditoria_delete_admin ON public.elisao_creditos_auditoria; CREATE POLICY creditos_auditoria_delete_admin ON public.elisao_creditos_auditoria AS PERMISSIVE FOR DELETE TO authenticated USING ((has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id)));
DROP POLICY IF EXISTS elisao_regras_creditos_admin ON public.elisao_regras_creditos; CREATE POLICY elisao_regras_creditos_admin ON public.elisao_regras_creditos AS PERMISSIVE FOR ALL TO authenticated USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = (SELECT auth.uid())) AND (profiles.role = ANY (ARRAY['admin'::text, 'super_admin'::text])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = (SELECT auth.uid())) AND (profiles.role = ANY (ARRAY['admin'::text, 'super_admin'::text]))))));
DROP POLICY IF EXISTS regras_creditos_admin ON public.elisao_regras_creditos; CREATE POLICY regras_creditos_admin ON public.elisao_regras_creditos AS PERMISSIVE FOR ALL TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role)) WITH CHECK (has_role((SELECT auth.uid()), 'admin'::app_role));
DROP POLICY IF EXISTS "Admins can delete verifications" ON public.email_verifications; CREATE POLICY "Admins can delete verifications" ON public.email_verifications AS PERMISSIVE FOR DELETE TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role));
DROP POLICY IF EXISTS "Users can insert own verifications" ON public.email_verifications; CREATE POLICY "Users can insert own verifications" ON public.email_verifications AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (((SELECT auth.uid()) = user_id));
DROP POLICY IF EXISTS "Users can update their verifications" ON public.email_verifications; CREATE POLICY "Users can update their verifications" ON public.email_verifications AS PERMISSIVE FOR UPDATE TO authenticated USING ((((SELECT auth.uid()) = user_id) OR has_role((SELECT auth.uid()), 'admin'::app_role)));
DROP POLICY IF EXISTS "Users can view own verifications" ON public.email_verifications; CREATE POLICY "Users can view own verifications" ON public.email_verifications AS PERMISSIVE FOR SELECT TO authenticated USING (((SELECT auth.uid()) = user_id));
DROP POLICY IF EXISTS "Operacional+ podem ver empresas" ON public.empresas; CREATE POLICY "Operacional+ podem ver empresas" ON public.empresas AS PERMISSIVE FOR SELECT TO authenticated USING (has_any_role((SELECT auth.uid()), ARRAY['admin'::app_role, 'financeiro'::app_role, 'operacional'::app_role]));
DROP POLICY IF EXISTS "Owner manage empresas" ON public.empresas; CREATE POLICY "Owner manage empresas" ON public.empresas AS PERMISSIVE FOR ALL TO authenticated USING (((SELECT auth.uid()) = user_id)) WITH CHECK (((SELECT auth.uid()) = user_id));
DROP POLICY IF EXISTS cert_admin_all ON public.empresas_certificados; CREATE POLICY cert_admin_all ON public.empresas_certificados AS PERMISSIVE FOR ALL TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role)) WITH CHECK (has_role((SELECT auth.uid()), 'admin'::app_role));
DROP POLICY IF EXISTS cert_empresa_read ON public.empresas_certificados; CREATE POLICY cert_empresa_read ON public.empresas_certificados AS PERMISSIVE FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM user_empresas ue
  WHERE ((ue.user_id = (SELECT auth.uid())) AND (ue.empresa_id = empresas_certificados.empresa_id)))));
DROP POLICY IF EXISTS empresas_certificados_tenant_rw ON public.empresas_certificados; CREATE POLICY empresas_certificados_tenant_rw ON public.empresas_certificados AS PERMISSIVE FOR ALL TO authenticated USING ((has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id))) WITH CHECK ((has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id)));
DROP POLICY IF EXISTS entregas_obrigacoes_admin_all ON public.entregas_obrigacoes; CREATE POLICY entregas_obrigacoes_admin_all ON public.entregas_obrigacoes AS PERMISSIVE FOR ALL TO authenticated USING ((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = (SELECT auth.uid())) AND (p.role = ANY (ARRAY['admin'::text, 'super_admin'::text]))))));
DROP POLICY IF EXISTS entregas_obrigacoes_empresa_insert ON public.entregas_obrigacoes; CREATE POLICY entregas_obrigacoes_empresa_insert ON public.entregas_obrigacoes AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((empresa_id IN ( SELECT ue.empresa_id
   FROM user_empresas ue
  WHERE ((ue.user_id = ( SELECT (SELECT auth.uid()) AS uid)) AND (ue.ativo = true)))));
DROP POLICY IF EXISTS entregas_obrigacoes_empresa_select ON public.entregas_obrigacoes; CREATE POLICY entregas_obrigacoes_empresa_select ON public.entregas_obrigacoes AS PERMISSIVE FOR SELECT TO authenticated USING ((empresa_id IN ( SELECT ue.empresa_id
   FROM user_empresas ue
  WHERE ((ue.user_id = ( SELECT (SELECT auth.uid()) AS uid)) AND (ue.ativo = true)))));
DROP POLICY IF EXISTS entregas_obrigacoes_empresa_update ON public.entregas_obrigacoes; CREATE POLICY entregas_obrigacoes_empresa_update ON public.entregas_obrigacoes AS PERMISSIVE FOR UPDATE TO authenticated USING ((empresa_id IN ( SELECT ue.empresa_id
   FROM user_empresas ue
  WHERE ((ue.user_id = ( SELECT (SELECT auth.uid()) AS uid)) AND (ue.ativo = true))))) WITH CHECK ((empresa_id IN ( SELECT ue.empresa_id
   FROM user_empresas ue
  WHERE ((ue.user_id = ( SELECT (SELECT auth.uid()) AS uid)) AND (ue.ativo = true)))));
DROP POLICY IF EXISTS entregas_obrigacoes_tenant_rw ON public.entregas_obrigacoes; CREATE POLICY entregas_obrigacoes_tenant_rw ON public.entregas_obrigacoes AS PERMISSIVE FOR ALL TO authenticated USING ((has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id))) WITH CHECK ((has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id)));
DROP POLICY IF EXISTS estrategias_write_admin ON public.estrategias_elisao; CREATE POLICY estrategias_write_admin ON public.estrategias_elisao AS PERMISSIVE FOR ALL TO authenticated USING (has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role)) WITH CHECK (has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role));
DROP POLICY IF EXISTS "Evidencias scoped by verificacao" ON public.evidencias_pacotes; CREATE POLICY "Evidencias scoped by verificacao" ON public.evidencias_pacotes AS PERMISSIVE FOR ALL TO authenticated USING ((EXISTS ( SELECT 1
   FROM verificacoes_conformidade vc
  WHERE ((vc.id = evidencias_pacotes.verificacao_id) AND (has_role((SELECT auth.uid()), 'admin'::app_role) OR (vc.empresa_id IN ( SELECT ue.empresa_id
           FROM user_empresas ue
          WHERE ((ue.user_id = (SELECT auth.uid())) AND (ue.ativo = true))))))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM verificacoes_conformidade vc
  WHERE ((vc.id = evidencias_pacotes.verificacao_id) AND (has_role((SELECT auth.uid()), 'admin'::app_role) OR (vc.empresa_id IN ( SELECT ue.empresa_id
           FROM user_empresas ue
          WHERE ((ue.user_id = (SELECT auth.uid())) AND (ue.ativo = true)))))))));
DROP POLICY IF EXISTS "Owner manage execucoes" ON public.execucoes_cobranca; CREATE POLICY "Owner manage execucoes" ON public.execucoes_cobranca AS PERMISSIVE FOR ALL TO authenticated USING (((SELECT auth.uid()) = user_id)) WITH CHECK (((SELECT auth.uid()) = user_id));
DROP POLICY IF EXISTS execucoes_cobranca_empresa_all ON public.execucoes_cobranca; CREATE POLICY execucoes_cobranca_empresa_all ON public.execucoes_cobranca AS PERMISSIVE FOR ALL TO authenticated USING ((empresa_id IN ( SELECT user_empresas.empresa_id
   FROM user_empresas
  WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND (user_empresas.ativo = true))))) WITH CHECK ((empresa_id IN ( SELECT user_empresas.empresa_id
   FROM user_empresas
  WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND (user_empresas.ativo = true)))));
DROP POLICY IF EXISTS "Users can manage their own conversations" ON public.expert_conversations; CREATE POLICY "Users can manage their own conversations" ON public.expert_conversations AS PERMISSIVE FOR ALL TO authenticated USING (((SELECT auth.uid()) = user_id));
DROP POLICY IF EXISTS "Usuários veem suas próprias conversas" ON public.expert_conversations; CREATE POLICY "Usuários veem suas próprias conversas" ON public.expert_conversations AS PERMISSIVE FOR ALL TO authenticated USING (((SELECT auth.uid()) = user_id));
DROP POLICY IF EXISTS "Users can insert messages to their conversations" ON public.expert_messages; CREATE POLICY "Users can insert messages to their conversations" ON public.expert_messages AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM expert_conversations
  WHERE ((expert_conversations.id = expert_messages.conversation_id) AND (expert_conversations.user_id = (SELECT auth.uid()))))));
DROP POLICY IF EXISTS "Users can view messages from their conversations" ON public.expert_messages; CREATE POLICY "Users can view messages from their conversations" ON public.expert_messages AS PERMISSIVE FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM expert_conversations
  WHERE ((expert_conversations.id = expert_messages.conversation_id) AND (expert_conversations.user_id = (SELECT auth.uid()))))));
DROP POLICY IF EXISTS "Usuários veem mensagens de suas conversas" ON public.expert_messages; CREATE POLICY "Usuários veem mensagens de suas conversas" ON public.expert_messages AS PERMISSIVE FOR ALL TO authenticated USING ((EXISTS ( SELECT 1
   FROM expert_conversations
  WHERE ((expert_conversations.id = expert_messages.conversation_id) AND (expert_conversations.user_id = (SELECT auth.uid()))))));
DROP POLICY IF EXISTS "Users can manage their own extrato_bancario" ON public.extrato_bancario; CREATE POLICY "Users can manage their own extrato_bancario" ON public.extrato_bancario AS PERMISSIVE FOR ALL TO authenticated USING (((SELECT auth.uid()) = user_id)) WITH CHECK (((SELECT auth.uid()) = user_id));
DROP POLICY IF EXISTS extrato_owner_all ON public.extrato_bancario; CREATE POLICY extrato_owner_all ON public.extrato_bancario AS PERMISSIVE FOR ALL TO authenticated USING (((SELECT auth.uid()) = user_id)) WITH CHECK (((SELECT auth.uid()) = user_id));
DROP POLICY IF EXISTS faixas_simples_write_admin ON public.faixas_simples_nacional; CREATE POLICY faixas_simples_write_admin ON public.faixas_simples_nacional AS PERMISSIVE FOR ALL TO authenticated USING (has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role)) WITH CHECK (has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role));
DROP POLICY IF EXISTS "Empresa-based access" ON public.faturamento_mensal; CREATE POLICY "Empresa-based access" ON public.faturamento_mensal AS PERMISSIVE FOR ALL TO authenticated USING (((empresa_id IN ( SELECT user_empresas.empresa_id
   FROM user_empresas
  WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND (user_empresas.ativo = true)))) OR (EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = 'admin'::app_role))))));
DROP POLICY IF EXISTS fechamentos_tributarios_all_admin ON public.fechamentos_tributarios; CREATE POLICY fechamentos_tributarios_all_admin ON public.fechamentos_tributarios AS PERMISSIVE FOR ALL TO authenticated USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = (SELECT auth.uid())) AND (profiles.role = ANY (ARRAY['admin'::text, 'super_admin'::text])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = (SELECT auth.uid())) AND (profiles.role = ANY (ARRAY['admin'::text, 'super_admin'::text]))))));
DROP POLICY IF EXISTS fechamentos_tributarios_select_own ON public.fechamentos_tributarios; CREATE POLICY fechamentos_tributarios_select_own ON public.fechamentos_tributarios AS PERMISSIVE FOR SELECT TO authenticated USING (((empresa_id IN ( SELECT profiles.empresa_id
   FROM profiles
  WHERE (profiles.id = (SELECT auth.uid())))) OR (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = (SELECT auth.uid())) AND (profiles.role = ANY (ARRAY['admin'::text, 'super_admin'::text])))))));
DROP POLICY IF EXISTS "User-based access" ON public.feedback_conciliacao_ia; CREATE POLICY "User-based access" ON public.feedback_conciliacao_ia AS PERMISSIVE FOR ALL TO authenticated USING (((user_id = (SELECT auth.uid())) OR (EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = 'admin'::app_role))))));
DROP POLICY IF EXISTS "Users can manage feedback" ON public.feedback_conciliacao_ia; CREATE POLICY "Users can manage feedback" ON public.feedback_conciliacao_ia AS PERMISSIVE FOR ALL TO authenticated USING (((SELECT auth.uid()) = user_id));
DROP POLICY IF EXISTS "Admins can manage queue" ON public.fila_cobrancas; CREATE POLICY "Admins can manage queue" ON public.fila_cobrancas AS PERMISSIVE FOR ALL TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role));
DROP POLICY IF EXISTS fila_cobrancas_empresa_select ON public.fila_cobrancas; CREATE POLICY fila_cobrancas_empresa_select ON public.fila_cobrancas AS PERMISSIVE FOR SELECT TO authenticated USING ((empresa_id IN ( SELECT user_empresas.empresa_id
   FROM user_empresas
  WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND (user_empresas.ativo = true)))));
DROP POLICY IF EXISTS fila_cobrancas_tenant_rw ON public.fila_cobrancas; CREATE POLICY fila_cobrancas_tenant_rw ON public.fila_cobrancas AS PERMISSIVE FOR ALL TO authenticated USING ((has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id))) WITH CHECK ((has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id)));
DROP POLICY IF EXISTS "Access by empresa_id" ON public.fluxos_aprovacao_niveis; CREATE POLICY "Access by empresa_id" ON public.fluxos_aprovacao_niveis AS PERMISSIVE FOR ALL TO authenticated USING (((empresa_id IN ( SELECT user_empresas.empresa_id
   FROM user_empresas
  WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND (user_empresas.ativo = true)))) OR (EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = 'admin'::app_role))))));
DROP POLICY IF EXISTS "Empresa-based access" ON public.folha_pagamento; CREATE POLICY "Empresa-based access" ON public.folha_pagamento AS PERMISSIVE FOR ALL TO authenticated USING (((empresa_id IN ( SELECT user_empresas.empresa_id
   FROM user_empresas
  WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND (user_empresas.ativo = true)))) OR (EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = 'admin'::app_role))))));
DROP POLICY IF EXISTS "Empresa-based access" ON public.formas_pagamento; CREATE POLICY "Empresa-based access" ON public.formas_pagamento AS PERMISSIVE FOR ALL TO authenticated USING (((empresa_id IN ( SELECT user_empresas.empresa_id
   FROM user_empresas
  WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND (user_empresas.ativo = true)))) OR (EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = 'admin'::app_role))))));
DROP POLICY IF EXISTS fornecedores_owner_delete ON public.fornecedores; CREATE POLICY fornecedores_owner_delete ON public.fornecedores AS PERMISSIVE FOR DELETE TO authenticated USING (((SELECT auth.uid()) = user_id));
DROP POLICY IF EXISTS fornecedores_owner_insert ON public.fornecedores; CREATE POLICY fornecedores_owner_insert ON public.fornecedores AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (((SELECT auth.uid()) = user_id));
DROP POLICY IF EXISTS fornecedores_owner_select ON public.fornecedores; CREATE POLICY fornecedores_owner_select ON public.fornecedores AS PERMISSIVE FOR SELECT TO authenticated USING (((SELECT auth.uid()) = user_id));
DROP POLICY IF EXISTS fornecedores_owner_update ON public.fornecedores; CREATE POLICY fornecedores_owner_update ON public.fornecedores AS PERMISSIVE FOR UPDATE TO authenticated USING (((SELECT auth.uid()) = user_id)) WITH CHECK (((SELECT auth.uid()) = user_id));
DROP POLICY IF EXISTS fe_alert_state_admin_select ON public.frontend_error_alert_state; CREATE POLICY fe_alert_state_admin_select ON public.frontend_error_alert_state AS PERMISSIVE FOR SELECT TO authenticated USING (has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role));
DROP POLICY IF EXISTS "Admins can view frontend errors" ON public.frontend_error_logs; CREATE POLICY "Admins can view frontend errors" ON public.frontend_error_logs AS PERMISSIVE FOR SELECT TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role));
DROP POLICY IF EXISTS frontend_error_user_insert ON public.frontend_error_logs; CREATE POLICY frontend_error_user_insert ON public.frontend_error_logs AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((((SELECT auth.uid()) = user_id) OR (user_id IS NULL)));
DROP POLICY IF EXISTS admin_only_frontend_error_logs_2026_01 ON public.frontend_error_logs_2026_01; CREATE POLICY admin_only_frontend_error_logs_2026_01 ON public.frontend_error_logs_2026_01 AS PERMISSIVE FOR ALL TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role)) WITH CHECK (has_role((SELECT auth.uid()), 'admin'::app_role));
DROP POLICY IF EXISTS admin_only_frontend_error_logs_2026_02 ON public.frontend_error_logs_2026_02; CREATE POLICY admin_only_frontend_error_logs_2026_02 ON public.frontend_error_logs_2026_02 AS PERMISSIVE FOR ALL TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role)) WITH CHECK (has_role((SELECT auth.uid()), 'admin'::app_role));
DROP POLICY IF EXISTS admin_only_frontend_error_logs_2026_03 ON public.frontend_error_logs_2026_03; CREATE POLICY admin_only_frontend_error_logs_2026_03 ON public.frontend_error_logs_2026_03 AS PERMISSIVE FOR ALL TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role)) WITH CHECK (has_role((SELECT auth.uid()), 'admin'::app_role));
DROP POLICY IF EXISTS admin_only_frontend_error_logs_2026_04 ON public.frontend_error_logs_2026_04; CREATE POLICY admin_only_frontend_error_logs_2026_04 ON public.frontend_error_logs_2026_04 AS PERMISSIVE FOR ALL TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role)) WITH CHECK (has_role((SELECT auth.uid()), 'admin'::app_role));
DROP POLICY IF EXISTS admin_only_frontend_error_logs_2026_05 ON public.frontend_error_logs_2026_05; CREATE POLICY admin_only_frontend_error_logs_2026_05 ON public.frontend_error_logs_2026_05 AS PERMISSIVE FOR ALL TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role)) WITH CHECK (has_role((SELECT auth.uid()), 'admin'::app_role));
DROP POLICY IF EXISTS admin_only_frontend_error_logs_2026_06 ON public.frontend_error_logs_2026_06; CREATE POLICY admin_only_frontend_error_logs_2026_06 ON public.frontend_error_logs_2026_06 AS PERMISSIVE FOR ALL TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role)) WITH CHECK (has_role((SELECT auth.uid()), 'admin'::app_role));
DROP POLICY IF EXISTS admin_only_frontend_error_logs_2026_07 ON public.frontend_error_logs_2026_07; CREATE POLICY admin_only_frontend_error_logs_2026_07 ON public.frontend_error_logs_2026_07 AS PERMISSIVE FOR ALL TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role)) WITH CHECK (has_role((SELECT auth.uid()), 'admin'::app_role));
DROP POLICY IF EXISTS admin_only_frontend_error_logs_2026_08 ON public.frontend_error_logs_2026_08; CREATE POLICY admin_only_frontend_error_logs_2026_08 ON public.frontend_error_logs_2026_08 AS PERMISSIVE FOR ALL TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role)) WITH CHECK (has_role((SELECT auth.uid()), 'admin'::app_role));
DROP POLICY IF EXISTS admin_only_frontend_error_logs_2026_09 ON public.frontend_error_logs_2026_09; CREATE POLICY admin_only_frontend_error_logs_2026_09 ON public.frontend_error_logs_2026_09 AS PERMISSIVE FOR ALL TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role)) WITH CHECK (has_role((SELECT auth.uid()), 'admin'::app_role));
DROP POLICY IF EXISTS admin_only_frontend_error_logs_2026_10 ON public.frontend_error_logs_2026_10; CREATE POLICY admin_only_frontend_error_logs_2026_10 ON public.frontend_error_logs_2026_10 AS PERMISSIVE FOR ALL TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role)) WITH CHECK (has_role((SELECT auth.uid()), 'admin'::app_role));
DROP POLICY IF EXISTS admin_only_frontend_error_logs_default ON public.frontend_error_logs_default; CREATE POLICY admin_only_frontend_error_logs_default ON public.frontend_error_logs_default AS PERMISSIVE FOR ALL TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role)) WITH CHECK (has_role((SELECT auth.uid()), 'admin'::app_role));
DROP POLICY IF EXISTS fe_silence_digest_admin_select ON public.frontend_error_silence_digest_log; CREATE POLICY fe_silence_digest_admin_select ON public.frontend_error_silence_digest_log AS PERMISSIVE FOR SELECT TO authenticated USING (has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role));
DROP POLICY IF EXISTS "Admins can view performance logs" ON public.frontend_performance_logs; CREATE POLICY "Admins can view performance logs" ON public.frontend_performance_logs AS PERMISSIVE FOR SELECT TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role));
DROP POLICY IF EXISTS "Authenticated users can insert performance logs" ON public.frontend_performance_logs; CREATE POLICY "Authenticated users can insert performance logs" ON public.frontend_performance_logs AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (((SELECT auth.uid()) IS NOT NULL));
DROP POLICY IF EXISTS "Admins can delete geo blocks" ON public.geo_blocks; CREATE POLICY "Admins can delete geo blocks" ON public.geo_blocks AS PERMISSIVE FOR DELETE TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role));
DROP POLICY IF EXISTS "Admins can insert geo blocks" ON public.geo_blocks; CREATE POLICY "Admins can insert geo blocks" ON public.geo_blocks AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (has_role((SELECT auth.uid()), 'admin'::app_role));
DROP POLICY IF EXISTS "Admins can manage geo blocks" ON public.geo_blocks; CREATE POLICY "Admins can manage geo blocks" ON public.geo_blocks AS PERMISSIVE FOR ALL TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role));
DROP POLICY IF EXISTS "Admins can update geo blocks" ON public.geo_blocks; CREATE POLICY "Admins can update geo blocks" ON public.geo_blocks AS PERMISSIVE FOR UPDATE TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role));
DROP POLICY IF EXISTS "Managers can view geo blocks" ON public.geo_blocks; CREATE POLICY "Managers can view geo blocks" ON public.geo_blocks AS PERMISSIVE FOR SELECT TO authenticated USING (has_role((SELECT auth.uid()), 'manager'::app_role));
DROP POLICY IF EXISTS glossario_admin ON public.glossario_tributario; CREATE POLICY glossario_admin ON public.glossario_tributario AS PERMISSIVE FOR ALL TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role)) WITH CHECK (has_role((SELECT auth.uid()), 'admin'::app_role));
DROP POLICY IF EXISTS health_scores_empresa_select ON public.health_scores_operacionais; CREATE POLICY health_scores_empresa_select ON public.health_scores_operacionais AS PERMISSIVE FOR SELECT TO authenticated USING ((empresa_id IN ( SELECT user_empresas.empresa_id
   FROM user_empresas
  WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND (user_empresas.ativo = true)))));
DROP POLICY IF EXISTS hap_user_insert ON public.historico_analises_preditivas; CREATE POLICY hap_user_insert ON public.historico_analises_preditivas AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (((SELECT auth.uid()) = user_id));
DROP POLICY IF EXISTS historico_analises_preditivas_empresa_select ON public.historico_analises_preditivas; CREATE POLICY historico_analises_preditivas_empresa_select ON public.historico_analises_preditivas AS PERMISSIVE FOR SELECT TO authenticated USING ((empresa_id IN ( SELECT user_empresas.empresa_id
   FROM user_empresas
  WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND (user_empresas.ativo = true)))));
DROP POLICY IF EXISTS historico_cobranca_empresa_all ON public.historico_cobranca; CREATE POLICY historico_cobranca_empresa_all ON public.historico_cobranca AS PERMISSIVE FOR ALL TO authenticated USING ((empresa_id IN ( SELECT user_empresas.empresa_id
   FROM user_empresas
  WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND (user_empresas.ativo = true))))) WITH CHECK ((empresa_id IN ( SELECT user_empresas.empresa_id
   FROM user_empresas
  WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND (user_empresas.ativo = true)))));
DROP POLICY IF EXISTS "Empresa-based access" ON public.historico_cobranca_whatsapp; CREATE POLICY "Empresa-based access" ON public.historico_cobranca_whatsapp AS PERMISSIVE FOR ALL TO authenticated USING (((empresa_id IN ( SELECT user_empresas.empresa_id
   FROM user_empresas
  WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND (user_empresas.ativo = true)))) OR (EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = 'admin'::app_role))))));
DROP POLICY IF EXISTS historico_cobrancas_boletos_empresa_select ON public.historico_cobrancas_boletos; CREATE POLICY historico_cobrancas_boletos_empresa_select ON public.historico_cobrancas_boletos AS PERMISSIVE FOR SELECT TO authenticated USING ((conta_receber_id IN ( SELECT contas_receber.id
   FROM contas_receber
  WHERE (contas_receber.empresa_id IN ( SELECT user_empresas.empresa_id
           FROM user_empresas
          WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND (user_empresas.ativo = true)))))));
DROP POLICY IF EXISTS historico_cobrancas_user_all ON public.historico_cobrancas_boletos; CREATE POLICY historico_cobrancas_user_all ON public.historico_cobrancas_boletos AS PERMISSIVE FOR ALL TO authenticated USING (((SELECT auth.uid()) = user_id)) WITH CHECK (((SELECT auth.uid()) = user_id));
DROP POLICY IF EXISTS historico_conciliacao_ia_role_select ON public.historico_conciliacao_ia; CREATE POLICY historico_conciliacao_ia_role_select ON public.historico_conciliacao_ia AS PERMISSIVE FOR SELECT TO authenticated USING ((has_role((SELECT auth.uid()), 'admin'::app_role) OR has_role((SELECT auth.uid()), 'financeiro'::app_role)));
DROP POLICY IF EXISTS historico_conciliacao_ia_tenant_select ON public.historico_conciliacao_ia; CREATE POLICY historico_conciliacao_ia_tenant_select ON public.historico_conciliacao_ia AS PERMISSIVE FOR SELECT TO authenticated USING (((has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) OR has_role(( SELECT (SELECT auth.uid()) AS uid), 'financeiro'::app_role)) AND ((EXISTS ( SELECT 1
   FROM contas_receber cr
  WHERE ((cr.id = historico_conciliacao_ia.conta_receber_id) AND empresa_acessivel(cr.empresa_id)))) OR (EXISTS ( SELECT 1
   FROM contas_pagar cp
  WHERE ((cp.id = historico_conciliacao_ia.conta_pagar_id) AND empresa_acessivel(cp.empresa_id)))) OR (EXISTS ( SELECT 1
   FROM sessoes_conciliacao s
  WHERE ((s.id = historico_conciliacao_ia.sessao_id) AND ((s.user_id = ( SELECT (SELECT auth.uid()) AS uid)) OR empresa_acessivel(s.empresa_id))))))));
DROP POLICY IF EXISTS historico_relatorios_leitura ON public.historico_relatorios; CREATE POLICY historico_relatorios_leitura ON public.historico_relatorios AS PERMISSIVE FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM relatorios_agendados r
  WHERE ((r.id = historico_relatorios.relatorio_agendado_id) AND ((r.created_by = (SELECT auth.uid())) OR has_role((SELECT auth.uid()), 'admin'::app_role))))));
DROP POLICY IF EXISTS historico_score_saude_empresa_select ON public.historico_score_saude; CREATE POLICY historico_score_saude_empresa_select ON public.historico_score_saude AS PERMISSIVE FOR SELECT TO authenticated USING ((empresa_id IN ( SELECT user_empresas.empresa_id
   FROM user_empresas
  WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND (user_empresas.ativo = true)))));
DROP POLICY IF EXISTS admins_all_incentivos_fiscais ON public.incentivos_fiscais; CREATE POLICY admins_all_incentivos_fiscais ON public.incentivos_fiscais AS PERMISSIVE FOR ALL TO authenticated USING ((((auth.jwt() ->> 'role'::text) = 'service_role'::text) OR ((auth.jwt() ->> 'role'::text) = 'anon'::text) OR (((auth.jwt() ->> 'role'::text) = 'authenticated'::text) AND (((SELECT auth.uid()))::text = (empresa_id)::text))));
DROP POLICY IF EXISTS "Somente admins leem snapshots de índices" ON public.index_usage_snapshots; CREATE POLICY "Somente admins leem snapshots de índices" ON public.index_usage_snapshots AS PERMISSIVE FOR SELECT TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role));
DROP POLICY IF EXISTS "Somente admins gerenciam exceções de índice" ON public.indices_uso_excecoes; CREATE POLICY "Somente admins gerenciam exceções de índice" ON public.indices_uso_excecoes AS PERMISSIVE FOR SELECT TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role));
DROP POLICY IF EXISTS admin_only_integration_secrets ON public.integration_secrets; CREATE POLICY admin_only_integration_secrets ON public.integration_secrets AS PERMISSIVE FOR ALL TO authenticated USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = 'admin'::app_role)))));
DROP POLICY IF EXISTS integrity_alerts_admin_read ON public.integrity_alerts; CREATE POLICY integrity_alerts_admin_read ON public.integrity_alerts AS PERMISSIVE FOR SELECT TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role));
DROP POLICY IF EXISTS "Admins can delete whitelist" ON public.ip_whitelist; CREATE POLICY "Admins can delete whitelist" ON public.ip_whitelist AS PERMISSIVE FOR DELETE TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role));
DROP POLICY IF EXISTS "Admins can insert whitelist" ON public.ip_whitelist; CREATE POLICY "Admins can insert whitelist" ON public.ip_whitelist AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (has_role((SELECT auth.uid()), 'admin'::app_role));
DROP POLICY IF EXISTS "Admins can manage IP whitelist" ON public.ip_whitelist; CREATE POLICY "Admins can manage IP whitelist" ON public.ip_whitelist AS PERMISSIVE FOR ALL TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role));
DROP POLICY IF EXISTS "Admins can update whitelist" ON public.ip_whitelist; CREATE POLICY "Admins can update whitelist" ON public.ip_whitelist AS PERMISSIVE FOR UPDATE TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role));
DROP POLICY IF EXISTS "Managers can view IP whitelist" ON public.ip_whitelist; CREATE POLICY "Managers can view IP whitelist" ON public.ip_whitelist AS PERMISSIVE FOR SELECT TO authenticated USING (has_role((SELECT auth.uid()), 'manager'::app_role));
DROP POLICY IF EXISTS itens_iss_write_admin ON public.itens_lista_iss; CREATE POLICY itens_iss_write_admin ON public.itens_lista_iss AS PERMISSIVE FOR ALL TO authenticated USING (has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role)) WITH CHECK (has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role));
DROP POLICY IF EXISTS itens_pedido_compra_empresa_select ON public.itens_pedido_compra; CREATE POLICY itens_pedido_compra_empresa_select ON public.itens_pedido_compra AS PERMISSIVE FOR SELECT TO authenticated USING ((pedido_id IN ( SELECT pedidos_compra.id
   FROM pedidos_compra
  WHERE (pedidos_compra.empresa_id IN ( SELECT user_empresas.empresa_id
           FROM user_empresas
          WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND (user_empresas.ativo = true)))))));
DROP POLICY IF EXISTS "Lancamentos scoped by empresa" ON public.lancamentos_contabeis; CREATE POLICY "Lancamentos scoped by empresa" ON public.lancamentos_contabeis AS PERMISSIVE FOR ALL TO authenticated USING (((user_id = ( SELECT (SELECT auth.uid()) AS uid)) OR has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) OR (empresa_id IN ( SELECT ue.empresa_id
   FROM user_empresas ue
  WHERE ((ue.user_id = ( SELECT (SELECT auth.uid()) AS uid)) AND (ue.ativo = true)))))) WITH CHECK (((user_id = ( SELECT (SELECT auth.uid()) AS uid)) OR has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) OR (empresa_id IN ( SELECT ue.empresa_id
   FROM user_empresas ue
  WHERE ((ue.user_id = ( SELECT (SELECT auth.uid()) AS uid)) AND (ue.ativo = true))))));
DROP POLICY IF EXISTS "Owner manage lancamentos" ON public.lancamentos_contabeis; CREATE POLICY "Owner manage lancamentos" ON public.lancamentos_contabeis AS PERMISSIVE FOR ALL TO authenticated USING (((SELECT auth.uid()) = user_id)) WITH CHECK (((SELECT auth.uid()) = user_id));
DROP POLICY IF EXISTS "Admins can delete login attempts" ON public.login_attempts; CREATE POLICY "Admins can delete login attempts" ON public.login_attempts AS PERMISSIVE FOR DELETE TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role));
DROP POLICY IF EXISTS "Admins can insert login attempts" ON public.login_attempts; CREATE POLICY "Admins can insert login attempts" ON public.login_attempts AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((has_role((SELECT auth.uid()), 'admin'::app_role) OR has_role((SELECT auth.uid()), 'manager'::app_role)));
DROP POLICY IF EXISTS "Admins can update login attempts" ON public.login_attempts; CREATE POLICY "Admins can update login attempts" ON public.login_attempts AS PERMISSIVE FOR UPDATE TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role)) WITH CHECK (has_role((SELECT auth.uid()), 'admin'::app_role));
DROP POLICY IF EXISTS "Admins can view login attempts" ON public.login_attempts; CREATE POLICY "Admins can view login attempts" ON public.login_attempts AS PERMISSIVE FOR SELECT TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role));
DROP POLICY IF EXISTS "Owner manage logs_baixa" ON public.logs_baixa_automatica; CREATE POLICY "Owner manage logs_baixa" ON public.logs_baixa_automatica AS PERMISSIVE FOR ALL TO authenticated USING (((SELECT auth.uid()) = user_id)) WITH CHECK (((SELECT auth.uid()) = user_id));
DROP POLICY IF EXISTS logs_baixa_insert_owner ON public.logs_baixa_automatica; CREATE POLICY logs_baixa_insert_owner ON public.logs_baixa_automatica AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((( SELECT (SELECT auth.uid()) AS uid) = user_id));
DROP POLICY IF EXISTS logs_baixa_select_owner ON public.logs_baixa_automatica; CREATE POLICY logs_baixa_select_owner ON public.logs_baixa_automatica AS PERMISSIVE FOR SELECT TO authenticated USING ((( SELECT (SELECT auth.uid()) AS uid) = user_id));
DROP POLICY IF EXISTS logs_retro_insert_owner ON public.logs_conciliacao_retroativa; CREATE POLICY logs_retro_insert_owner ON public.logs_conciliacao_retroativa AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((( SELECT (SELECT auth.uid()) AS uid) = user_id));
DROP POLICY IF EXISTS logs_retro_owner_all ON public.logs_conciliacao_retroativa; CREATE POLICY logs_retro_owner_all ON public.logs_conciliacao_retroativa AS PERMISSIVE FOR ALL TO authenticated USING (((SELECT auth.uid()) = user_id)) WITH CHECK (((SELECT auth.uid()) = user_id));
DROP POLICY IF EXISTS logs_retro_select_owner ON public.logs_conciliacao_retroativa; CREATE POLICY logs_retro_select_owner ON public.logs_conciliacao_retroativa AS PERMISSIVE FOR SELECT TO authenticated USING ((( SELECT (SELECT auth.uid()) AS uid) = user_id));
DROP POLICY IF EXISTS "Empresa-based access" ON public.metas_financeiras; CREATE POLICY "Empresa-based access" ON public.metas_financeiras AS PERMISSIVE FOR ALL TO authenticated USING (((empresa_id IN ( SELECT user_empresas.empresa_id
   FROM user_empresas
  WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND (user_empresas.ativo = true)))) OR (EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = 'admin'::app_role))))));
DROP POLICY IF EXISTS "Users can delete their MFA sessions" ON public.mfa_sessions; CREATE POLICY "Users can delete their MFA sessions" ON public.mfa_sessions AS PERMISSIVE FOR DELETE TO authenticated USING ((((SELECT auth.uid()) = user_id) OR has_role((SELECT auth.uid()), 'admin'::app_role)));
DROP POLICY IF EXISTS "Users can insert their MFA sessions" ON public.mfa_sessions; CREATE POLICY "Users can insert their MFA sessions" ON public.mfa_sessions AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (((SELECT auth.uid()) = user_id));
DROP POLICY IF EXISTS "Users can manage own MFA sessions" ON public.mfa_sessions; CREATE POLICY "Users can manage own MFA sessions" ON public.mfa_sessions AS PERMISSIVE FOR ALL TO authenticated USING (((SELECT auth.uid()) = user_id)) WITH CHECK (((SELECT auth.uid()) = user_id));
DROP POLICY IF EXISTS "Users can update their MFA sessions" ON public.mfa_sessions; CREATE POLICY "Users can update their MFA sessions" ON public.mfa_sessions AS PERMISSIVE FOR UPDATE TO authenticated USING (((SELECT auth.uid()) = user_id));
DROP POLICY IF EXISTS "Access by empresa_id" ON public.movimentacoes; CREATE POLICY "Access by empresa_id" ON public.movimentacoes AS PERMISSIVE FOR ALL TO authenticated USING (((empresa_id IN ( SELECT user_empresas.empresa_id
   FROM user_empresas
  WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND (user_empresas.ativo = true)))) OR (EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = 'admin'::app_role))))));
DROP POLICY IF EXISTS "Admins e managers visualizam logs n8n" ON public.n8n_dispatch_logs; CREATE POLICY "Admins e managers visualizam logs n8n" ON public.n8n_dispatch_logs AS PERMISSIVE FOR SELECT TO authenticated USING ((has_role((SELECT auth.uid()), 'admin'::app_role) OR has_role((SELECT auth.uid()), 'manager'::app_role)));
DROP POLICY IF EXISTS "Admins e managers gerenciam configs n8n" ON public.n8n_workflow_configs; CREATE POLICY "Admins e managers gerenciam configs n8n" ON public.n8n_workflow_configs AS PERMISSIVE FOR ALL TO authenticated USING ((has_role((SELECT auth.uid()), 'admin'::app_role) OR has_role((SELECT auth.uid()), 'manager'::app_role))) WITH CHECK ((has_role((SELECT auth.uid()), 'admin'::app_role) OR has_role((SELECT auth.uid()), 'manager'::app_role)));
DROP POLICY IF EXISTS ncms_write_admin ON public.ncms; CREATE POLICY ncms_write_admin ON public.ncms AS PERMISSIVE FOR ALL TO authenticated USING (has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role)) WITH CHECK (has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role));
DROP POLICY IF EXISTS "Admins can manage negativacoes" ON public.negativacoes; CREATE POLICY "Admins can manage negativacoes" ON public.negativacoes AS PERMISSIVE FOR ALL TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role));
DROP POLICY IF EXISTS negativacoes_empresa_select ON public.negativacoes; CREATE POLICY negativacoes_empresa_select ON public.negativacoes AS PERMISSIVE FOR SELECT TO authenticated USING ((empresa_id IN ( SELECT user_empresas.empresa_id
   FROM user_empresas
  WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND (user_empresas.ativo = true)))));
DROP POLICY IF EXISTS negativacoes_tenant_rw ON public.negativacoes; CREATE POLICY negativacoes_tenant_rw ON public.negativacoes AS PERMISSIVE FOR ALL TO authenticated USING ((has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id))) WITH CHECK ((has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id)));
DROP POLICY IF EXISTS "Users can delete their device alerts" ON public.new_device_alerts; CREATE POLICY "Users can delete their device alerts" ON public.new_device_alerts AS PERMISSIVE FOR DELETE TO authenticated USING ((((SELECT auth.uid()) = user_id) OR has_role((SELECT auth.uid()), 'admin'::app_role)));
DROP POLICY IF EXISTS "Users can insert their device alerts" ON public.new_device_alerts; CREATE POLICY "Users can insert their device alerts" ON public.new_device_alerts AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (((SELECT auth.uid()) = user_id));
DROP POLICY IF EXISTS "Users can update their device alerts" ON public.new_device_alerts; CREATE POLICY "Users can update their device alerts" ON public.new_device_alerts AS PERMISSIVE FOR UPDATE TO authenticated USING ((((SELECT auth.uid()) = user_id) OR has_role((SELECT auth.uid()), 'admin'::app_role)));
DROP POLICY IF EXISTS "Users can view own device alerts" ON public.new_device_alerts; CREATE POLICY "Users can view own device alerts" ON public.new_device_alerts AS PERMISSIVE FOR SELECT TO authenticated USING (((SELECT auth.uid()) = user_id));
DROP POLICY IF EXISTS nfe_ev_read_via_nfe ON public.nfe_eventos; CREATE POLICY nfe_ev_read_via_nfe ON public.nfe_eventos AS PERMISSIVE FOR SELECT TO authenticated USING ((has_role((SELECT auth.uid()), 'admin'::app_role) OR (EXISTS ( SELECT 1
   FROM (nfe_recebidas r
     JOIN user_empresas ue ON ((ue.empresa_id = r.empresa_id)))
  WHERE ((r.chave_acesso = nfe_eventos.chave_acesso) AND (ue.user_id = (SELECT auth.uid())))))));
DROP POLICY IF EXISTS nfe_rec_empresa_read ON public.nfe_recebidas; CREATE POLICY nfe_rec_empresa_read ON public.nfe_recebidas AS PERMISSIVE FOR SELECT TO authenticated USING ((has_role((SELECT auth.uid()), 'admin'::app_role) OR ((empresa_id IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM user_empresas ue
  WHERE ((ue.user_id = (SELECT auth.uid())) AND (ue.empresa_id = nfe_recebidas.empresa_id)))))));
DROP POLICY IF EXISTS nfe_rec_empresa_update ON public.nfe_recebidas; CREATE POLICY nfe_rec_empresa_update ON public.nfe_recebidas AS PERMISSIVE FOR UPDATE TO authenticated USING ((has_role((SELECT auth.uid()), 'admin'::app_role) OR ((empresa_id IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM user_empresas ue
  WHERE ((ue.user_id = (SELECT auth.uid())) AND (ue.empresa_id = nfe_recebidas.empresa_id)))))));
DROP POLICY IF EXISTS notas_fiscais_empresa_select ON public.notas_fiscais; CREATE POLICY notas_fiscais_empresa_select ON public.notas_fiscais AS PERMISSIVE FOR SELECT TO authenticated USING ((empresa_id IN ( SELECT user_empresas.empresa_id
   FROM user_empresas
  WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND (user_empresas.ativo = true)))));
DROP POLICY IF EXISTS notas_fiscais_tenant_delete ON public.notas_fiscais; CREATE POLICY notas_fiscais_tenant_delete ON public.notas_fiscais AS PERMISSIVE FOR DELETE TO authenticated USING ((empresa_membro_ativo(empresa_id) AND (has_role((SELECT auth.uid()), 'admin'::app_role) OR has_role((SELECT auth.uid()), 'manager'::app_role))));
DROP POLICY IF EXISTS notas_fiscais_ocr_all_admin ON public.notas_fiscais_ocr; CREATE POLICY notas_fiscais_ocr_all_admin ON public.notas_fiscais_ocr AS PERMISSIVE FOR ALL TO authenticated USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = (SELECT auth.uid())) AND (profiles.role = ANY (ARRAY['admin'::text, 'super_admin'::text])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = (SELECT auth.uid())) AND (profiles.role = ANY (ARRAY['admin'::text, 'super_admin'::text]))))));
DROP POLICY IF EXISTS notas_fiscais_ocr_select_own ON public.notas_fiscais_ocr; CREATE POLICY notas_fiscais_ocr_select_own ON public.notas_fiscais_ocr AS PERMISSIVE FOR SELECT TO authenticated USING (((empresa_id IN ( SELECT profiles.empresa_id
   FROM profiles
  WHERE (profiles.id = (SELECT auth.uid())))) OR (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = (SELECT auth.uid())) AND (profiles.role = ANY (ARRAY['admin'::text, 'super_admin'::text])))))));
DROP POLICY IF EXISTS notification_history_owner ON public.notification_history; CREATE POLICY notification_history_owner ON public.notification_history AS PERMISSIVE FOR ALL TO authenticated USING ((user_id = (SELECT auth.uid()))) WITH CHECK ((user_id = (SELECT auth.uid())));
DROP POLICY IF EXISTS "Users can manage their own consents" ON public.open_finance_consents; CREATE POLICY "Users can manage their own consents" ON public.open_finance_consents AS PERMISSIVE FOR ALL TO authenticated USING (((SELECT auth.uid()) = user_id));
DROP POLICY IF EXISTS operacoes_tributaveis_empresa_select ON public.operacoes_tributaveis; CREATE POLICY operacoes_tributaveis_empresa_select ON public.operacoes_tributaveis AS PERMISSIVE FOR SELECT TO authenticated USING ((empresa_id IN ( SELECT user_empresas.empresa_id
   FROM user_empresas
  WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND (user_empresas.ativo = true)))));
DROP POLICY IF EXISTS org_membros_manage_responsavel ON public.organizacao_membros; CREATE POLICY org_membros_manage_responsavel ON public.organizacao_membros AS PERMISSIVE FOR ALL TO authenticated USING ((is_org_responsavel(organizacao_id, (SELECT auth.uid())) OR has_role((SELECT auth.uid()), 'admin'::app_role))) WITH CHECK ((is_org_responsavel(organizacao_id, (SELECT auth.uid())) OR has_role((SELECT auth.uid()), 'admin'::app_role)));
DROP POLICY IF EXISTS org_membros_select ON public.organizacao_membros; CREATE POLICY org_membros_select ON public.organizacao_membros AS PERMISSIVE FOR SELECT TO authenticated USING (((usuario_id = (SELECT auth.uid())) OR is_org_membro(organizacao_id, (SELECT auth.uid())) OR is_org_responsavel(organizacao_id, (SELECT auth.uid())) OR has_role((SELECT auth.uid()), 'admin'::app_role)));
DROP POLICY IF EXISTS organizacoes_delete_responsavel ON public.organizacoes; CREATE POLICY organizacoes_delete_responsavel ON public.organizacoes AS PERMISSIVE FOR DELETE TO authenticated USING (((responsavel_id = (SELECT auth.uid())) OR has_role((SELECT auth.uid()), 'admin'::app_role)));
DROP POLICY IF EXISTS organizacoes_insert_proprio ON public.organizacoes; CREATE POLICY organizacoes_insert_proprio ON public.organizacoes AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((responsavel_id = (SELECT auth.uid())));
DROP POLICY IF EXISTS organizacoes_select_membro_ou_admin ON public.organizacoes; CREATE POLICY organizacoes_select_membro_ou_admin ON public.organizacoes AS PERMISSIVE FOR SELECT TO authenticated USING (((responsavel_id = (SELECT auth.uid())) OR is_org_membro(id, (SELECT auth.uid())) OR has_role((SELECT auth.uid()), 'admin'::app_role)));
DROP POLICY IF EXISTS organizacoes_update_responsavel ON public.organizacoes; CREATE POLICY organizacoes_update_responsavel ON public.organizacoes AS PERMISSIVE FOR UPDATE TO authenticated USING (((responsavel_id = (SELECT auth.uid())) OR has_role((SELECT auth.uid()), 'admin'::app_role))) WITH CHECK (((responsavel_id = (SELECT auth.uid())) OR has_role((SELECT auth.uid()), 'admin'::app_role)));
DROP POLICY IF EXISTS "Gestores atualizam auditoria de overlay" ON public.overlay_rejeicoes_auditoria; CREATE POLICY "Gestores atualizam auditoria de overlay" ON public.overlay_rejeicoes_auditoria AS PERMISSIVE FOR UPDATE TO authenticated USING ((has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) OR has_role(( SELECT (SELECT auth.uid()) AS uid), 'manager'::app_role))) WITH CHECK ((has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) OR has_role(( SELECT (SELECT auth.uid()) AS uid), 'manager'::app_role)));
DROP POLICY IF EXISTS "Gestores inserem auditoria de overlay" ON public.overlay_rejeicoes_auditoria; CREATE POLICY "Gestores inserem auditoria de overlay" ON public.overlay_rejeicoes_auditoria AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) OR has_role(( SELECT (SELECT auth.uid()) AS uid), 'manager'::app_role)));
DROP POLICY IF EXISTS "Gestores leem auditoria de overlay" ON public.overlay_rejeicoes_auditoria; CREATE POLICY "Gestores leem auditoria de overlay" ON public.overlay_rejeicoes_auditoria AS PERMISSIVE FOR SELECT TO authenticated USING ((has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) OR has_role(( SELECT (SELECT auth.uid()) AS uid), 'manager'::app_role)));
DROP POLICY IF EXISTS "Gestores removem auditoria de overlay" ON public.overlay_rejeicoes_auditoria; CREATE POLICY "Gestores removem auditoria de overlay" ON public.overlay_rejeicoes_auditoria AS PERMISSIVE FOR DELETE TO authenticated USING ((has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) OR has_role(( SELECT (SELECT auth.uid()) AS uid), 'manager'::app_role)));
DROP POLICY IF EXISTS parcelas_acordo_admin_write ON public.parcelas_acordo; CREATE POLICY parcelas_acordo_admin_write ON public.parcelas_acordo AS PERMISSIVE FOR ALL TO authenticated USING ((has_role((SELECT auth.uid()), 'admin'::app_role) OR has_role((SELECT auth.uid()), 'financeiro'::app_role))) WITH CHECK ((has_role((SELECT auth.uid()), 'admin'::app_role) OR has_role((SELECT auth.uid()), 'financeiro'::app_role)));
DROP POLICY IF EXISTS parcelas_acordo_empresa_select ON public.parcelas_acordo; CREATE POLICY parcelas_acordo_empresa_select ON public.parcelas_acordo AS PERMISSIVE FOR SELECT TO authenticated USING ((acordo_id IN ( SELECT a.id
   FROM acordos_parcelamento a
  WHERE (a.empresa_id IN ( SELECT user_empresas.empresa_id
           FROM user_empresas
          WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND (user_empresas.ativo = true)))))));
DROP POLICY IF EXISTS parcelas_acordo_tenant_write ON public.parcelas_acordo; CREATE POLICY parcelas_acordo_tenant_write ON public.parcelas_acordo AS PERMISSIVE FOR ALL TO authenticated USING (((has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) OR has_role(( SELECT (SELECT auth.uid()) AS uid), 'financeiro'::app_role)) AND (EXISTS ( SELECT 1
   FROM acordos_parcelamento a
  WHERE ((a.id = parcelas_acordo.acordo_id) AND empresa_acessivel(a.empresa_id)))))) WITH CHECK (((has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) OR has_role(( SELECT (SELECT auth.uid()) AS uid), 'financeiro'::app_role)) AND (EXISTS ( SELECT 1
   FROM acordos_parcelamento a
  WHERE ((a.id = parcelas_acordo.acordo_id) AND empresa_acessivel(a.empresa_id))))));
DROP POLICY IF EXISTS "Partidas scoped by lancamento" ON public.partidas_contabeis; CREATE POLICY "Partidas scoped by lancamento" ON public.partidas_contabeis AS PERMISSIVE FOR ALL TO authenticated USING ((EXISTS ( SELECT 1
   FROM lancamentos_contabeis lc
  WHERE ((lc.id = partidas_contabeis.lancamento_id) AND ((lc.user_id = (SELECT auth.uid())) OR has_role((SELECT auth.uid()), 'admin'::app_role) OR (lc.empresa_id IN ( SELECT ue.empresa_id
           FROM user_empresas ue
          WHERE ((ue.user_id = (SELECT auth.uid())) AND (ue.ativo = true))))))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM lancamentos_contabeis lc
  WHERE ((lc.id = partidas_contabeis.lancamento_id) AND ((lc.user_id = (SELECT auth.uid())) OR has_role((SELECT auth.uid()), 'admin'::app_role) OR (lc.empresa_id IN ( SELECT ue.empresa_id
           FROM user_empresas ue
          WHERE ((ue.user_id = (SELECT auth.uid())) AND (ue.ativo = true)))))))));
DROP POLICY IF EXISTS "Admins and managers can view reset requests" ON public.password_reset_requests; CREATE POLICY "Admins and managers can view reset requests" ON public.password_reset_requests AS PERMISSIVE FOR SELECT TO authenticated USING ((has_role((SELECT auth.uid()), 'admin'::app_role) OR has_role((SELECT auth.uid()), 'manager'::app_role)));
DROP POLICY IF EXISTS "Admins can update reset requests" ON public.password_reset_requests; CREATE POLICY "Admins can update reset requests" ON public.password_reset_requests AS PERMISSIVE FOR UPDATE TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role)) WITH CHECK (has_role((SELECT auth.uid()), 'admin'::app_role));
DROP POLICY IF EXISTS "Users can request own password reset" ON public.password_reset_requests; CREATE POLICY "Users can request own password reset" ON public.password_reset_requests AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((user_email = (( SELECT users.email
   FROM auth.users
  WHERE (users.id = (SELECT auth.uid()))))::text));
DROP POLICY IF EXISTS "Admins can delete reset tokens" ON public.password_reset_tokens; CREATE POLICY "Admins can delete reset tokens" ON public.password_reset_tokens AS PERMISSIVE FOR DELETE TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role));
DROP POLICY IF EXISTS "Authenticated can insert own reset tokens" ON public.password_reset_tokens; CREATE POLICY "Authenticated can insert own reset tokens" ON public.password_reset_tokens AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (((SELECT auth.uid()) = user_id));
DROP POLICY IF EXISTS "Users can select own reset tokens" ON public.password_reset_tokens; CREATE POLICY "Users can select own reset tokens" ON public.password_reset_tokens AS PERMISSIVE FOR SELECT TO authenticated USING (((SELECT auth.uid()) = user_id));
DROP POLICY IF EXISTS "Users can view own reset tokens" ON public.password_reset_tokens; CREATE POLICY "Users can view own reset tokens" ON public.password_reset_tokens AS PERMISSIVE FOR SELECT TO authenticated USING (((SELECT auth.uid()) = user_id));
DROP POLICY IF EXISTS pedidos_compra_empresa_select ON public.pedidos_compra; CREATE POLICY pedidos_compra_empresa_select ON public.pedidos_compra AS PERMISSIVE FOR SELECT TO authenticated USING ((empresa_id IN ( SELECT user_empresas.empresa_id
   FROM user_empresas
  WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND (user_empresas.ativo = true)))));
DROP POLICY IF EXISTS per_dcomp_admin_all ON public.per_dcomp; CREATE POLICY per_dcomp_admin_all ON public.per_dcomp AS PERMISSIVE FOR ALL TO authenticated USING ((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = (SELECT auth.uid())) AND (p.role = ANY (ARRAY['admin'::text, 'super_admin'::text]))))));
DROP POLICY IF EXISTS "Admins podem ler alertas de performance" ON public.performance_alerts; CREATE POLICY "Admins podem ler alertas de performance" ON public.performance_alerts AS PERMISSIVE FOR SELECT TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role));
DROP POLICY IF EXISTS "Admins can delete permissions" ON public.permissions; CREATE POLICY "Admins can delete permissions" ON public.permissions AS PERMISSIVE FOR DELETE TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role));
DROP POLICY IF EXISTS "Admins can insert permissions" ON public.permissions; CREATE POLICY "Admins can insert permissions" ON public.permissions AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (has_role((SELECT auth.uid()), 'admin'::app_role));
DROP POLICY IF EXISTS "Admins can update permissions" ON public.permissions; CREATE POLICY "Admins can update permissions" ON public.permissions AS PERMISSIVE FOR UPDATE TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role));
DROP POLICY IF EXISTS "Anyone authenticated can view permissions" ON public.permissions; CREATE POLICY "Anyone authenticated can view permissions" ON public.permissions AS PERMISSIVE FOR SELECT TO authenticated USING (((SELECT auth.uid()) IS NOT NULL));
DROP POLICY IF EXISTS "Admins can view baselines" ON public.pg_stat_statements_baseline; CREATE POLICY "Admins can view baselines" ON public.pg_stat_statements_baseline AS PERMISSIVE FOR SELECT TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role));
DROP POLICY IF EXISTS "Admins can manage pix" ON public.pix_templates; CREATE POLICY "Admins can manage pix" ON public.pix_templates AS PERMISSIVE FOR ALL TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role));
DROP POLICY IF EXISTS pix_templates_empresa_select ON public.pix_templates; CREATE POLICY pix_templates_empresa_select ON public.pix_templates AS PERMISSIVE FOR SELECT TO authenticated USING ((empresa_id IN ( SELECT user_empresas.empresa_id
   FROM user_empresas
  WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND (user_empresas.ativo = true)))));
DROP POLICY IF EXISTS pix_templates_tenant_rw ON public.pix_templates; CREATE POLICY pix_templates_tenant_rw ON public.pix_templates AS PERMISSIVE FOR ALL TO authenticated USING ((has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id))) WITH CHECK ((has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id)));
DROP POLICY IF EXISTS "Empresa-based access" ON public.plano_contas; CREATE POLICY "Empresa-based access" ON public.plano_contas AS PERMISSIVE FOR ALL TO authenticated USING (((empresa_id IN ( SELECT user_empresas.empresa_id
   FROM user_empresas
  WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND (user_empresas.ativo = true)))) OR (EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = 'admin'::app_role))))));
DROP POLICY IF EXISTS planos_acao_owner ON public.planos_acao; CREATE POLICY planos_acao_owner ON public.planos_acao AS PERMISSIVE FOR ALL TO authenticated USING ((user_id = (SELECT auth.uid()))) WITH CHECK ((user_id = (SELECT auth.uid())));
DROP POLICY IF EXISTS portal_acessos_admin_insert ON public.portal_cliente_acessos; CREATE POLICY portal_acessos_admin_insert ON public.portal_cliente_acessos AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (has_role((SELECT auth.uid()), 'admin'::app_role));
DROP POLICY IF EXISTS portal_acessos_admin_select ON public.portal_cliente_acessos; CREATE POLICY portal_acessos_admin_select ON public.portal_cliente_acessos AS PERMISSIVE FOR SELECT TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role));
DROP POLICY IF EXISTS portal_tokens_admin_all ON public.portal_cliente_tokens; CREATE POLICY portal_tokens_admin_all ON public.portal_cliente_tokens AS PERMISSIVE FOR ALL TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role)) WITH CHECK (has_role((SELECT auth.uid()), 'admin'::app_role));
DROP POLICY IF EXISTS prejuizos_fiscais_admin_write ON public.prejuizos_fiscais; CREATE POLICY prejuizos_fiscais_admin_write ON public.prejuizos_fiscais AS PERMISSIVE FOR ALL TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role)) WITH CHECK (has_role((SELECT auth.uid()), 'admin'::app_role));
DROP POLICY IF EXISTS prejuizos_fiscais_empresa_select ON public.prejuizos_fiscais; CREATE POLICY prejuizos_fiscais_empresa_select ON public.prejuizos_fiscais AS PERMISSIVE FOR SELECT TO authenticated USING ((empresa_id IN ( SELECT user_empresas.empresa_id
   FROM user_empresas
  WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND (user_empresas.ativo = true)))));
DROP POLICY IF EXISTS prejuizos_fiscais_tenant_rw ON public.prejuizos_fiscais; CREATE POLICY prejuizos_fiscais_tenant_rw ON public.prejuizos_fiscais AS PERMISSIVE FOR ALL TO authenticated USING ((has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id))) WITH CHECK ((has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id)));
DROP POLICY IF EXISTS "Admins can manage profiles" ON public.profiles; CREATE POLICY "Admins can manage profiles" ON public.profiles AS PERMISSIVE FOR ALL TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role)) WITH CHECK (has_role((SELECT auth.uid()), 'admin'::app_role));
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles; CREATE POLICY "Users can update own profile" ON public.profiles AS PERMISSIVE FOR UPDATE TO authenticated USING ((((SELECT auth.uid()) = id) OR ((SELECT auth.uid()) = user_id))) WITH CHECK (((((SELECT auth.uid()) = id) OR ((SELECT auth.uid()) = user_id)) AND profile_sensitive_fields_unchanged(id, user_id, role, empresa_id)));
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles; CREATE POLICY "Users can view own profile" ON public.profiles AS PERMISSIVE FOR SELECT TO authenticated USING ((((SELECT auth.uid()) = id) OR ((SELECT auth.uid()) = user_id) OR has_role((SELECT auth.uid()), 'admin'::app_role)));
DROP POLICY IF EXISTS "Admins can manage protestos" ON public.protestos; CREATE POLICY "Admins can manage protestos" ON public.protestos AS PERMISSIVE FOR ALL TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role));
DROP POLICY IF EXISTS protestos_empresa_select ON public.protestos; CREATE POLICY protestos_empresa_select ON public.protestos AS PERMISSIVE FOR SELECT TO authenticated USING ((empresa_id IN ( SELECT user_empresas.empresa_id
   FROM user_empresas
  WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND (user_empresas.ativo = true)))));
DROP POLICY IF EXISTS protestos_tenant_rw ON public.protestos; CREATE POLICY protestos_tenant_rw ON public.protestos AS PERMISSIVE FOR ALL TO authenticated USING ((has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id))) WITH CHECK ((has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id)));
DROP POLICY IF EXISTS protocolos_st_write_admin ON public.protocolos_st; CREATE POLICY protocolos_st_write_admin ON public.protocolos_st AS PERMISSIVE FOR ALL TO authenticated USING (has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role)) WITH CHECK (has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role));
DROP POLICY IF EXISTS protocolos_st_ncms_write_admin ON public.protocolos_st_ncms; CREATE POLICY protocolos_st_ncms_write_admin ON public.protocolos_st_ncms AS PERMISSIVE FOR ALL TO authenticated USING (has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role)) WITH CHECK (has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role));
DROP POLICY IF EXISTS protocolos_st_ufs_write_admin ON public.protocolos_st_ufs; CREATE POLICY protocolos_st_ufs_write_admin ON public.protocolos_st_ufs AS PERMISSIVE FOR ALL TO authenticated USING (has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role)) WITH CHECK (has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role));
DROP POLICY IF EXISTS push_subscriptions_owner ON public.push_subscriptions; CREATE POLICY push_subscriptions_owner ON public.push_subscriptions AS PERMISSIVE FOR ALL TO authenticated USING ((user_id = (SELECT auth.uid()))) WITH CHECK ((user_id = (SELECT auth.uid())));
DROP POLICY IF EXISTS "Admins can manage telemetry" ON public.query_telemetry; CREATE POLICY "Admins can manage telemetry" ON public.query_telemetry AS PERMISSIVE FOR ALL TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role)) WITH CHECK (has_role((SELECT auth.uid()), 'admin'::app_role));
DROP POLICY IF EXISTS "Managers can view telemetry" ON public.query_telemetry; CREATE POLICY "Managers can view telemetry" ON public.query_telemetry AS PERMISSIVE FOR SELECT TO authenticated USING (has_role((SELECT auth.uid()), 'manager'::app_role));
DROP POLICY IF EXISTS "System can insert telemetry" ON public.query_telemetry; CREATE POLICY "System can insert telemetry" ON public.query_telemetry AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((has_role((SELECT auth.uid()), 'admin'::app_role) OR has_role((SELECT auth.uid()), 'manager'::app_role) OR has_role((SELECT auth.uid()), 'operator'::app_role)));
DROP POLICY IF EXISTS "Admins can view rate limit logs" ON public.rate_limit_logs; CREATE POLICY "Admins can view rate limit logs" ON public.rate_limit_logs AS PERMISSIVE FOR SELECT TO authenticated USING ((has_role((SELECT auth.uid()), 'admin'::app_role) OR has_role((SELECT auth.uid()), 'manager'::app_role)));
DROP POLICY IF EXISTS "Authenticated can insert rate limit logs" ON public.rate_limit_logs; CREATE POLICY "Authenticated can insert rate limit logs" ON public.rate_limit_logs AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((has_role((SELECT auth.uid()), 'admin'::app_role) OR has_role((SELECT auth.uid()), 'manager'::app_role) OR has_role((SELECT auth.uid()), 'operator'::app_role) OR has_role((SELECT auth.uid()), 'viewer'::app_role)));
DROP POLICY IF EXISTS recomendacoes_metas_ia_empresa_select ON public.recomendacoes_metas_ia; CREATE POLICY recomendacoes_metas_ia_empresa_select ON public.recomendacoes_metas_ia AS PERMISSIVE FOR SELECT TO authenticated USING ((empresa_id IN ( SELECT user_empresas.empresa_id
   FROM user_empresas
  WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND (user_empresas.ativo = true)))));
DROP POLICY IF EXISTS "Access by empresa_id" ON public.regimes_especiais_empresa; CREATE POLICY "Access by empresa_id" ON public.regimes_especiais_empresa AS PERMISSIVE FOR ALL TO authenticated USING (((empresa_id IN ( SELECT user_empresas.empresa_id
   FROM user_empresas
  WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND (user_empresas.ativo = true)))) OR (EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = 'admin'::app_role))))));
DROP POLICY IF EXISTS regimes_simulados_empresa_insert ON public.regimes_simulados; CREATE POLICY regimes_simulados_empresa_insert ON public.regimes_simulados AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((empresa_id IN ( SELECT user_empresas.empresa_id
   FROM user_empresas
  WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND (user_empresas.ativo = true)))));
DROP POLICY IF EXISTS regimes_simulados_empresa_select ON public.regimes_simulados; CREATE POLICY regimes_simulados_empresa_select ON public.regimes_simulados AS PERMISSIVE FOR SELECT TO authenticated USING ((empresa_id IN ( SELECT user_empresas.empresa_id
   FROM user_empresas
  WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND (user_empresas.ativo = true)))));
DROP POLICY IF EXISTS "Empresa-based access" ON public.regimes_tributarios; CREATE POLICY "Empresa-based access" ON public.regimes_tributarios AS PERMISSIVE FOR ALL TO authenticated USING (((empresa_id IN ( SELECT user_empresas.empresa_id
   FROM user_empresas
  WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND (user_empresas.ativo = true)))) OR (EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = 'admin'::app_role))))));
DROP POLICY IF EXISTS "Empresa-based access" ON public.regras_conciliacao; CREATE POLICY "Empresa-based access" ON public.regras_conciliacao AS PERMISSIVE FOR ALL TO authenticated USING (((empresa_id IN ( SELECT user_empresas.empresa_id
   FROM user_empresas
  WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND (user_empresas.ativo = true)))) OR (EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = 'admin'::app_role))))));
DROP POLICY IF EXISTS regras_contab_write ON public.regras_contabilizacao_automatica; CREATE POLICY regras_contab_write ON public.regras_contabilizacao_automatica AS PERMISSIVE FOR ALL TO authenticated USING ((empresa_acessivel(empresa_id) AND (has_role((SELECT auth.uid()), 'admin'::app_role) OR has_role((SELECT auth.uid()), 'financeiro'::app_role) OR has_role((SELECT auth.uid()), 'contador'::app_role)))) WITH CHECK ((empresa_acessivel(empresa_id) AND (has_role((SELECT auth.uid()), 'admin'::app_role) OR has_role((SELECT auth.uid()), 'financeiro'::app_role) OR has_role((SELECT auth.uid()), 'contador'::app_role))));
DROP POLICY IF EXISTS "Empresa-based access" ON public.regras_duplicidade; CREATE POLICY "Empresa-based access" ON public.regras_duplicidade AS PERMISSIVE FOR ALL TO authenticated USING (((empresa_id IN ( SELECT user_empresas.empresa_id
   FROM user_empresas
  WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND (user_empresas.ativo = true)))) OR (EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = 'admin'::app_role))))));
DROP POLICY IF EXISTS "Empresa-based access" ON public.regras_roteamento_financeiro; CREATE POLICY "Empresa-based access" ON public.regras_roteamento_financeiro AS PERMISSIVE FOR ALL TO authenticated USING (((empresa_id IN ( SELECT user_empresas.empresa_id
   FROM user_empresas
  WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND (user_empresas.ativo = true)))) OR (EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = 'admin'::app_role))))));
DROP POLICY IF EXISTS empresa_based_access ON public.regras_roteamento_financeiro; CREATE POLICY empresa_based_access ON public.regras_roteamento_financeiro AS PERMISSIVE FOR ALL TO authenticated USING (((empresa_id IN ( SELECT user_empresas.empresa_id
   FROM user_empresas
  WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND (user_empresas.ativo = true)))) OR (EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = 'admin'::app_role))))));
DROP POLICY IF EXISTS "Admins can manage regua" ON public.regua_cobranca; CREATE POLICY "Admins can manage regua" ON public.regua_cobranca AS PERMISSIVE FOR ALL TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role));
DROP POLICY IF EXISTS regua_cobranca_empresa_select ON public.regua_cobranca; CREATE POLICY regua_cobranca_empresa_select ON public.regua_cobranca AS PERMISSIVE FOR SELECT TO authenticated USING ((empresa_id IN ( SELECT user_empresas.empresa_id
   FROM user_empresas
  WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND (user_empresas.ativo = true)))));
DROP POLICY IF EXISTS regua_cobranca_tenant_rw ON public.regua_cobranca; CREATE POLICY regua_cobranca_tenant_rw ON public.regua_cobranca AS PERMISSIVE FOR ALL TO authenticated USING ((has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id))) WITH CHECK ((has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id)));
DROP POLICY IF EXISTS "Admins can manage stages" ON public.regua_cobranca_etapas; CREATE POLICY "Admins can manage stages" ON public.regua_cobranca_etapas AS PERMISSIVE FOR ALL TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role));
DROP POLICY IF EXISTS regua_cobranca_etapas_empresa_select ON public.regua_cobranca_etapas; CREATE POLICY regua_cobranca_etapas_empresa_select ON public.regua_cobranca_etapas AS PERMISSIVE FOR SELECT TO authenticated USING ((regua_id IN ( SELECT regua_cobranca.id
   FROM regua_cobranca
  WHERE (regua_cobranca.empresa_id IN ( SELECT user_empresas.empresa_id
           FROM user_empresas
          WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND (user_empresas.ativo = true)))))));
DROP POLICY IF EXISTS regua_cobranca_etapas_tenant_write ON public.regua_cobranca_etapas; CREATE POLICY regua_cobranca_etapas_tenant_write ON public.regua_cobranca_etapas AS PERMISSIVE FOR ALL TO authenticated USING ((has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) AND (EXISTS ( SELECT 1
   FROM regua_cobranca r
  WHERE ((r.id = regua_cobranca_etapas.regua_id) AND empresa_acessivel(r.empresa_id)))))) WITH CHECK ((has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) AND (EXISTS ( SELECT 1
   FROM regua_cobranca r
  WHERE ((r.id = regua_cobranca_etapas.regua_id) AND empresa_acessivel(r.empresa_id))))));
DROP POLICY IF EXISTS "Access by empresa_id" ON public.regua_cobranca_status; CREATE POLICY "Access by empresa_id" ON public.regua_cobranca_status AS PERMISSIVE FOR ALL TO authenticated USING (((empresa_id IN ( SELECT user_empresas.empresa_id
   FROM user_empresas
  WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND (user_empresas.ativo = true)))) OR (EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = 'admin'::app_role))))));
DROP POLICY IF EXISTS relatorios_agendados_proprios ON public.relatorios_agendados; CREATE POLICY relatorios_agendados_proprios ON public.relatorios_agendados AS PERMISSIVE FOR ALL TO authenticated USING (((created_by = (SELECT auth.uid())) OR has_role((SELECT auth.uid()), 'admin'::app_role))) WITH CHECK (((created_by = (SELECT auth.uid())) OR has_role((SELECT auth.uid()), 'admin'::app_role)));
DROP POLICY IF EXISTS relatorios_tributarios_agendados_all_admin ON public.relatorios_tributarios_agendados; CREATE POLICY relatorios_tributarios_agendados_all_admin ON public.relatorios_tributarios_agendados AS PERMISSIVE FOR ALL TO authenticated USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = (SELECT auth.uid())) AND (profiles.role = ANY (ARRAY['admin'::text, 'super_admin'::text])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = (SELECT auth.uid())) AND (profiles.role = ANY (ARRAY['admin'::text, 'super_admin'::text]))))));
DROP POLICY IF EXISTS relatorios_tributarios_agendados_select_own ON public.relatorios_tributarios_agendados; CREATE POLICY relatorios_tributarios_agendados_select_own ON public.relatorios_tributarios_agendados AS PERMISSIVE FOR SELECT TO authenticated USING (((empresa_id IN ( SELECT profiles.empresa_id
   FROM profiles
  WHERE (profiles.id = (SELECT auth.uid())))) OR (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = (SELECT auth.uid())) AND (profiles.role = ANY (ARRAY['admin'::text, 'super_admin'::text])))))));
DROP POLICY IF EXISTS "Empresa-based access" ON public.resumos_executivos_semanais; CREATE POLICY "Empresa-based access" ON public.resumos_executivos_semanais AS PERMISSIVE FOR ALL TO authenticated USING (((empresa_id IN ( SELECT user_empresas.empresa_id
   FROM user_empresas
  WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND (user_empresas.ativo = true)))) OR (EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = 'admin'::app_role))))));
DROP POLICY IF EXISTS retencao_politicas_admin_select ON public.retencao_politicas; CREATE POLICY retencao_politicas_admin_select ON public.retencao_politicas AS PERMISSIVE FOR SELECT TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role));
DROP POLICY IF EXISTS "Empresa-based access" ON public.retencoes_fonte; CREATE POLICY "Empresa-based access" ON public.retencoes_fonte AS PERMISSIVE FOR ALL TO authenticated USING (((empresa_id IN ( SELECT user_empresas.empresa_id
   FROM user_empresas
  WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND (user_empresas.ativo = true)))) OR (EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = 'admin'::app_role))))));
DROP POLICY IF EXISTS "Admins can delete risk rules" ON public.risk_rules; CREATE POLICY "Admins can delete risk rules" ON public.risk_rules AS PERMISSIVE FOR DELETE TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role));
DROP POLICY IF EXISTS "Authorized roles can view risk rules" ON public.risk_rules; CREATE POLICY "Authorized roles can view risk rules" ON public.risk_rules AS PERMISSIVE FOR SELECT TO authenticated USING ((has_role((SELECT auth.uid()), 'admin'::app_role) OR has_role((SELECT auth.uid()), 'manager'::app_role) OR has_role((SELECT auth.uid()), 'operator'::app_role)));
DROP POLICY IF EXISTS "Managers can insert risk rules" ON public.risk_rules; CREATE POLICY "Managers can insert risk rules" ON public.risk_rules AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((has_role((SELECT auth.uid()), 'admin'::app_role) OR has_role((SELECT auth.uid()), 'manager'::app_role)));
DROP POLICY IF EXISTS "Managers can update risk rules" ON public.risk_rules; CREATE POLICY "Managers can update risk rules" ON public.risk_rules AS PERMISSIVE FOR UPDATE TO authenticated USING ((has_role((SELECT auth.uid()), 'admin'::app_role) OR has_role((SELECT auth.uid()), 'manager'::app_role)));
DROP POLICY IF EXISTS "Viewers can view risk rules" ON public.risk_rules; CREATE POLICY "Viewers can view risk rules" ON public.risk_rules AS PERMISSIVE FOR SELECT TO authenticated USING (has_role((SELECT auth.uid()), 'viewer'::app_role));
DROP POLICY IF EXISTS "Admins can delete role permissions" ON public.role_permissions; CREATE POLICY "Admins can delete role permissions" ON public.role_permissions AS PERMISSIVE FOR DELETE TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role));
DROP POLICY IF EXISTS "Admins can insert role permissions" ON public.role_permissions; CREATE POLICY "Admins can insert role permissions" ON public.role_permissions AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (has_role((SELECT auth.uid()), 'admin'::app_role));
DROP POLICY IF EXISTS "Admins can manage role_permissions" ON public.role_permissions; CREATE POLICY "Admins can manage role_permissions" ON public.role_permissions AS PERMISSIVE FOR ALL TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role));
DROP POLICY IF EXISTS "Admins can update role permissions" ON public.role_permissions; CREATE POLICY "Admins can update role permissions" ON public.role_permissions AS PERMISSIVE FOR UPDATE TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role));
DROP POLICY IF EXISTS "Anyone authenticated can view role_permissions" ON public.role_permissions; CREATE POLICY "Anyone authenticated can view role_permissions" ON public.role_permissions AS PERMISSIVE FOR SELECT TO authenticated USING (((SELECT auth.uid()) IS NOT NULL));
DROP POLICY IF EXISTS admin_read_rpc_metrics ON public.rpc_observability_metrics; CREATE POLICY admin_read_rpc_metrics ON public.rpc_observability_metrics AS PERMISSIVE FOR SELECT TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role));
DROP POLICY IF EXISTS "Admins can delete error logs" ON public.runtime_error_logs; CREATE POLICY "Admins can delete error logs" ON public.runtime_error_logs AS PERMISSIVE FOR DELETE TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role));
DROP POLICY IF EXISTS "Admins can update error logs" ON public.runtime_error_logs; CREATE POLICY "Admins can update error logs" ON public.runtime_error_logs AS PERMISSIVE FOR UPDATE TO authenticated USING ((has_role((SELECT auth.uid()), 'admin'::app_role) OR has_role((SELECT auth.uid()), 'manager'::app_role)));
DROP POLICY IF EXISTS "Admins managers can view error logs" ON public.runtime_error_logs; CREATE POLICY "Admins managers can view error logs" ON public.runtime_error_logs AS PERMISSIVE FOR SELECT TO authenticated USING ((has_role((SELECT auth.uid()), 'admin'::app_role) OR has_role((SELECT auth.uid()), 'manager'::app_role)));
DROP POLICY IF EXISTS "Authenticated can insert error logs" ON public.runtime_error_logs; CREATE POLICY "Authenticated can insert error logs" ON public.runtime_error_logs AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (((SELECT auth.uid()) IS NOT NULL));
DROP POLICY IF EXISTS saved_filter_subscriptions_owner ON public.saved_filter_subscriptions; CREATE POLICY saved_filter_subscriptions_owner ON public.saved_filter_subscriptions AS PERMISSIVE FOR ALL TO authenticated USING ((user_id = (SELECT auth.uid()))) WITH CHECK ((user_id = (SELECT auth.uid())));
DROP POLICY IF EXISTS saved_filters_admin_all ON public.saved_filters; CREATE POLICY saved_filters_admin_all ON public.saved_filters AS PERMISSIVE FOR ALL TO authenticated USING ((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = (SELECT auth.uid())) AND (p.role = ANY (ARRAY['admin'::text, 'super_admin'::text]))))));
DROP POLICY IF EXISTS saved_filters_owner_all ON public.saved_filters; CREATE POLICY saved_filters_owner_all ON public.saved_filters AS PERMISSIVE FOR ALL TO authenticated USING ((user_id = (SELECT auth.uid()))) WITH CHECK ((user_id = (SELECT auth.uid())));
DROP POLICY IF EXISTS saved_filters_owner_write ON public.saved_filters; CREATE POLICY saved_filters_owner_write ON public.saved_filters AS PERMISSIVE FOR ALL TO authenticated USING ((user_id = (SELECT auth.uid()))) WITH CHECK ((user_id = (SELECT auth.uid())));
DROP POLICY IF EXISTS saved_filters_select ON public.saved_filters; CREATE POLICY saved_filters_select ON public.saved_filters AS PERMISSIVE FOR SELECT TO authenticated USING (((user_id = (SELECT auth.uid())) OR (is_shared AND (empresa_id IS NOT NULL) AND empresa_acessivel(empresa_id) AND (EXISTS ( SELECT 1
   FROM user_roles ur
  WHERE ((ur.user_id = (SELECT auth.uid())) AND ((ur.role)::text = ANY (saved_filters.shared_with_roles))))))));
DROP POLICY IF EXISTS scim_operations_log_admin_select ON public.scim_operations_log; CREATE POLICY scim_operations_log_admin_select ON public.scim_operations_log AS PERMISSIVE FOR SELECT TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role));
DROP POLICY IF EXISTS "Admins manage scim_tokens" ON public.scim_tokens; CREATE POLICY "Admins manage scim_tokens" ON public.scim_tokens AS PERMISSIVE FOR ALL TO authenticated USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = 'admin'::app_role)))));
DROP POLICY IF EXISTS security_alerts_admin_all ON public.security_alerts; CREATE POLICY security_alerts_admin_all ON public.security_alerts AS PERMISSIVE FOR ALL TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role)) WITH CHECK (has_role((SELECT auth.uid()), 'admin'::app_role));
DROP POLICY IF EXISTS "Authenticated users can insert security logs" ON public.security_audit_logs; CREATE POLICY "Authenticated users can insert security logs" ON public.security_audit_logs AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (((SELECT auth.uid()) IS NOT NULL));
DROP POLICY IF EXISTS "Only admins can view security logs" ON public.security_audit_logs; CREATE POLICY "Only admins can view security logs" ON public.security_audit_logs AS PERMISSIVE FOR SELECT TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role));
DROP POLICY IF EXISTS sec_settings_admin_all ON public.security_settings; CREATE POLICY sec_settings_admin_all ON public.security_settings AS PERMISSIVE FOR ALL TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role)) WITH CHECK (has_role((SELECT auth.uid()), 'admin'::app_role));
DROP POLICY IF EXISTS cursor_admin_read ON public.sefaz_dfe_cursor; CREATE POLICY cursor_admin_read ON public.sefaz_dfe_cursor AS PERMISSIVE FOR SELECT TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role));
DROP POLICY IF EXISTS "Owner manage sessoes" ON public.sessoes_conciliacao; CREATE POLICY "Owner manage sessoes" ON public.sessoes_conciliacao AS PERMISSIVE FOR ALL TO authenticated USING (((SELECT auth.uid()) = user_id)) WITH CHECK (((SELECT auth.uid()) = user_id));
DROP POLICY IF EXISTS "Users can manage their own sessoes_conciliacao" ON public.sessoes_conciliacao; CREATE POLICY "Users can manage their own sessoes_conciliacao" ON public.sessoes_conciliacao AS PERMISSIVE FOR ALL TO authenticated USING (((SELECT auth.uid()) = user_id)) WITH CHECK (((SELECT auth.uid()) = user_id));
DROP POLICY IF EXISTS slo_metrics_admin_select ON public.slo_metrics_diarias; CREATE POLICY slo_metrics_admin_select ON public.slo_metrics_diarias AS PERMISSIVE FOR SELECT TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role));
DROP POLICY IF EXISTS "Admins podem visualizar slow_query_alerts" ON public.slow_query_alerts; CREATE POLICY "Admins podem visualizar slow_query_alerts" ON public.slow_query_alerts AS PERMISSIVE FOR SELECT TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role));
DROP POLICY IF EXISTS "Owner manage aprovacoes" ON public.solicitacoes_aprovacao; CREATE POLICY "Owner manage aprovacoes" ON public.solicitacoes_aprovacao AS PERMISSIVE FOR ALL TO authenticated USING (((SELECT auth.uid()) = user_id)) WITH CHECK (((SELECT auth.uid()) = user_id));
DROP POLICY IF EXISTS solicitacoes_lgpd_admin_all ON public.solicitacoes_lgpd; CREATE POLICY solicitacoes_lgpd_admin_all ON public.solicitacoes_lgpd AS PERMISSIVE FOR ALL TO authenticated USING ((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = (SELECT auth.uid())) AND (p.role = ANY (ARRAY['admin'::text, 'super_admin'::text]))))));
DROP POLICY IF EXISTS solicitacoes_lgpd_user_insert ON public.solicitacoes_lgpd; CREATE POLICY solicitacoes_lgpd_user_insert ON public.solicitacoes_lgpd AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((user_id = (SELECT auth.uid())));
DROP POLICY IF EXISTS solicitacoes_lgpd_user_select ON public.solicitacoes_lgpd; CREATE POLICY solicitacoes_lgpd_user_select ON public.solicitacoes_lgpd AS PERMISSIVE FOR SELECT TO authenticated USING ((user_id = (SELECT auth.uid())));
DROP POLICY IF EXISTS sped_arquivos_delete_admin ON public.sped_contabil_arquivos; CREATE POLICY sped_arquivos_delete_admin ON public.sped_contabil_arquivos AS PERMISSIVE FOR DELETE TO authenticated USING ((has_role((SELECT auth.uid()), 'admin'::app_role) AND empresa_acessivel(empresa_id)));
DROP POLICY IF EXISTS sped_arquivos_update_admin ON public.sped_contabil_arquivos; CREATE POLICY sped_arquivos_update_admin ON public.sped_contabil_arquivos AS PERMISSIVE FOR UPDATE TO authenticated USING ((has_role((SELECT auth.uid()), 'admin'::app_role) AND empresa_acessivel(empresa_id))) WITH CHECK ((has_role((SELECT auth.uid()), 'admin'::app_role) AND empresa_acessivel(empresa_id)));
DROP POLICY IF EXISTS split_payment_empresa_insert ON public.split_payment_transacoes; CREATE POLICY split_payment_empresa_insert ON public.split_payment_transacoes AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((empresa_id IN ( SELECT user_empresas.empresa_id
   FROM user_empresas
  WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND (user_empresas.ativo = true)))));
DROP POLICY IF EXISTS split_payment_empresa_select ON public.split_payment_transacoes; CREATE POLICY split_payment_empresa_select ON public.split_payment_transacoes AS PERMISSIVE FOR SELECT TO authenticated USING ((empresa_id IN ( SELECT user_empresas.empresa_id
   FROM user_empresas
  WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND (user_empresas.ativo = true)))));
DROP POLICY IF EXISTS split_payment_empresa_update ON public.split_payment_transacoes; CREATE POLICY split_payment_empresa_update ON public.split_payment_transacoes AS PERMISSIVE FOR UPDATE TO authenticated USING ((empresa_id IN ( SELECT user_empresas.empresa_id
   FROM user_empresas
  WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND (user_empresas.ativo = true))))) WITH CHECK ((empresa_id IN ( SELECT user_empresas.empresa_id
   FROM user_empresas
  WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND (user_empresas.ativo = true)))));
DROP POLICY IF EXISTS "Admins can view SSO login attempts" ON public.sso_login_attempts; CREATE POLICY "Admins can view SSO login attempts" ON public.sso_login_attempts AS PERMISSIVE FOR SELECT TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role));
DROP POLICY IF EXISTS "Admins manage sso providers" ON public.sso_providers; CREATE POLICY "Admins manage sso providers" ON public.sso_providers AS PERMISSIVE FOR ALL TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role)) WITH CHECK (has_role((SELECT auth.uid()), 'admin'::app_role));
DROP POLICY IF EXISTS sso_role_mappings_admin ON public.sso_role_mappings; CREATE POLICY sso_role_mappings_admin ON public.sso_role_mappings AS PERMISSIVE FOR ALL TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role)) WITH CHECK (has_role((SELECT auth.uid()), 'admin'::app_role));
DROP POLICY IF EXISTS sso_user_groups_select ON public.sso_user_groups; CREATE POLICY sso_user_groups_select ON public.sso_user_groups AS PERMISSIVE FOR SELECT TO authenticated USING (((user_id = (SELECT auth.uid())) OR has_role((SELECT auth.uid()), 'admin'::app_role)));
DROP POLICY IF EXISTS tax_audit_select ON public.tax_audit_trail; CREATE POLICY tax_audit_select ON public.tax_audit_trail AS PERMISSIVE FOR SELECT TO authenticated USING ((has_role((SELECT auth.uid()), 'admin'::app_role) OR ((empresa_id IS NOT NULL) AND empresa_acessivel(empresa_id))));
DROP POLICY IF EXISTS "Admins can manage templates" ON public.templates_cobranca; CREATE POLICY "Admins can manage templates" ON public.templates_cobranca AS PERMISSIVE FOR ALL TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role));
DROP POLICY IF EXISTS templates_cobranca_empresa_select ON public.templates_cobranca; CREATE POLICY templates_cobranca_empresa_select ON public.templates_cobranca AS PERMISSIVE FOR SELECT TO authenticated USING ((empresa_id IN ( SELECT user_empresas.empresa_id
   FROM user_empresas
  WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND (user_empresas.ativo = true)))));
DROP POLICY IF EXISTS templates_cobranca_tenant_rw ON public.templates_cobranca; CREATE POLICY templates_cobranca_tenant_rw ON public.templates_cobranca AS PERMISSIVE FOR ALL TO authenticated USING ((has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id))) WITH CHECK ((has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id)));
DROP POLICY IF EXISTS transacoes_bancarias_empresa_select ON public.transacoes_bancarias; CREATE POLICY transacoes_bancarias_empresa_select ON public.transacoes_bancarias AS PERMISSIVE FOR SELECT TO authenticated USING ((conta_bancaria_id IN ( SELECT contas_bancarias.id
   FROM contas_bancarias
  WHERE (contas_bancarias.empresa_id IN ( SELECT user_empresas.empresa_id
           FROM user_empresas
          WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND (user_empresas.ativo = true)))))));
DROP POLICY IF EXISTS "Empresa-based access" ON public.transferencias; CREATE POLICY "Empresa-based access" ON public.transferencias AS PERMISSIVE FOR ALL TO authenticated USING (((empresa_id IN ( SELECT user_empresas.empresa_id
   FROM user_empresas
  WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND (user_empresas.ativo = true)))) OR (EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = 'admin'::app_role))))));
DROP POLICY IF EXISTS admin_all ON public.ufs; CREATE POLICY admin_all ON public.ufs AS PERMISSIVE FOR ALL TO authenticated USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = 'admin'::app_role)))));
DROP POLICY IF EXISTS ufs_write_admin ON public.ufs; CREATE POLICY ufs_write_admin ON public.ufs AS PERMISSIVE FOR ALL TO authenticated USING (has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role)) WITH CHECK (has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role));
DROP POLICY IF EXISTS "Users can insert their own audit logs" ON public.user_action_audit; CREATE POLICY "Users can insert their own audit logs" ON public.user_action_audit AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (((SELECT auth.uid()) = user_id));
DROP POLICY IF EXISTS "Users can view their own audit logs" ON public.user_action_audit; CREATE POLICY "Users can view their own audit logs" ON public.user_action_audit AS PERMISSIVE FOR SELECT TO authenticated USING (((SELECT auth.uid()) = user_id));
DROP POLICY IF EXISTS admins_all_user_active_filters ON public.user_active_filters; CREATE POLICY admins_all_user_active_filters ON public.user_active_filters AS PERMISSIVE FOR ALL TO authenticated USING ((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = (SELECT auth.uid())) AND (p.role = ANY (ARRAY['admin'::text, 'super_admin'::text]))))));
DROP POLICY IF EXISTS user_active_filters_owner ON public.user_active_filters; CREATE POLICY user_active_filters_owner ON public.user_active_filters AS PERMISSIVE FOR ALL TO authenticated USING ((user_id = (SELECT auth.uid()))) WITH CHECK ((user_id = (SELECT auth.uid())));
DROP POLICY IF EXISTS users_own_filters ON public.user_active_filters; CREATE POLICY users_own_filters ON public.user_active_filters AS PERMISSIVE FOR ALL TO authenticated USING ((user_id = (SELECT auth.uid()))) WITH CHECK ((user_id = (SELECT auth.uid())));
DROP POLICY IF EXISTS "Users can manage their own preferences" ON public.user_anomalia_preferences; CREATE POLICY "Users can manage their own preferences" ON public.user_anomalia_preferences AS PERMISSIVE FOR ALL TO authenticated USING (((SELECT auth.uid()) = user_id)) WITH CHECK (((SELECT auth.uid()) = user_id));
DROP POLICY IF EXISTS "Users can manage their own preferences" ON public.user_demonstrativo_preferences; CREATE POLICY "Users can manage their own preferences" ON public.user_demonstrativo_preferences AS PERMISSIVE FOR ALL TO authenticated USING (((SELECT auth.uid()) = user_id)) WITH CHECK (((SELECT auth.uid()) = user_id));
DROP POLICY IF EXISTS "Users can delete their devices" ON public.user_devices; CREATE POLICY "Users can delete their devices" ON public.user_devices AS PERMISSIVE FOR DELETE TO authenticated USING ((((SELECT auth.uid()) = user_id) OR has_role((SELECT auth.uid()), 'admin'::app_role)));
DROP POLICY IF EXISTS "Users can insert their devices" ON public.user_devices; CREATE POLICY "Users can insert their devices" ON public.user_devices AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (((SELECT auth.uid()) = user_id));
DROP POLICY IF EXISTS "Users can manage own devices" ON public.user_devices; CREATE POLICY "Users can manage own devices" ON public.user_devices AS PERMISSIVE FOR ALL TO authenticated USING (((SELECT auth.uid()) = user_id)) WITH CHECK (((SELECT auth.uid()) = user_id));
DROP POLICY IF EXISTS "Users can update their devices" ON public.user_devices; CREATE POLICY "Users can update their devices" ON public.user_devices AS PERMISSIVE FOR UPDATE TO authenticated USING ((((SELECT auth.uid()) = user_id) OR has_role((SELECT auth.uid()), 'admin'::app_role)));
DROP POLICY IF EXISTS "Users can view own devices" ON public.user_devices; CREATE POLICY "Users can view own devices" ON public.user_devices AS PERMISSIVE FOR SELECT TO authenticated USING (((SELECT auth.uid()) = user_id));
DROP POLICY IF EXISTS "Admins visualizam preferencias de digest" ON public.user_digest_preferences; CREATE POLICY "Admins visualizam preferencias de digest" ON public.user_digest_preferences AS PERMISSIVE FOR SELECT TO authenticated USING (has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role));
DROP POLICY IF EXISTS "Usuarios gerenciam suas preferencias de digest" ON public.user_digest_preferences; CREATE POLICY "Usuarios gerenciam suas preferencias de digest" ON public.user_digest_preferences AS PERMISSIVE FOR ALL TO authenticated USING ((( SELECT (SELECT auth.uid()) AS uid) = user_id)) WITH CHECK ((( SELECT (SELECT auth.uid()) AS uid) = user_id));
DROP POLICY IF EXISTS user_digest_prefs_all ON public.user_digest_preferences; CREATE POLICY user_digest_prefs_all ON public.user_digest_preferences AS PERMISSIVE FOR ALL TO authenticated USING (((SELECT auth.uid()) = user_id)) WITH CHECK (((SELECT auth.uid()) = user_id));
DROP POLICY IF EXISTS "Admins manage user_empresas" ON public.user_empresas; CREATE POLICY "Admins manage user_empresas" ON public.user_empresas AS PERMISSIVE FOR ALL TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role)) WITH CHECK (has_role((SELECT auth.uid()), 'admin'::app_role));
DROP POLICY IF EXISTS "Users view own empresa links" ON public.user_empresas; CREATE POLICY "Users view own empresa links" ON public.user_empresas AS PERMISSIVE FOR SELECT TO authenticated USING ((((SELECT auth.uid()) = user_id) OR has_role((SELECT auth.uid()), 'admin'::app_role)));
DROP POLICY IF EXISTS "Users can manage their presets" ON public.user_filter_presets; CREATE POLICY "Users can manage their presets" ON public.user_filter_presets AS PERMISSIVE FOR ALL TO authenticated USING (((SELECT auth.uid()) = user_id));
DROP POLICY IF EXISTS users_own_presets ON public.user_filter_presets; CREATE POLICY users_own_presets ON public.user_filter_presets AS PERMISSIVE FOR ALL TO authenticated USING (((user_id = (SELECT auth.uid())) OR true));
DROP POLICY IF EXISTS "Users can insert their own onboarding progress" ON public.user_onboarding_progress; CREATE POLICY "Users can insert their own onboarding progress" ON public.user_onboarding_progress AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (((SELECT auth.uid()) = user_id));
DROP POLICY IF EXISTS "Users can update their own onboarding progress" ON public.user_onboarding_progress; CREATE POLICY "Users can update their own onboarding progress" ON public.user_onboarding_progress AS PERMISSIVE FOR UPDATE TO authenticated USING (((SELECT auth.uid()) = user_id));
DROP POLICY IF EXISTS "Users can view their own onboarding progress" ON public.user_onboarding_progress; CREATE POLICY "Users can view their own onboarding progress" ON public.user_onboarding_progress AS PERMISSIVE FOR SELECT TO authenticated USING (((SELECT auth.uid()) = user_id));
DROP POLICY IF EXISTS "Users can delete own passkeys" ON public.user_passkeys; CREATE POLICY "Users can delete own passkeys" ON public.user_passkeys AS PERMISSIVE FOR DELETE TO authenticated USING (((SELECT auth.uid()) = user_id));
DROP POLICY IF EXISTS "Users can delete their passkeys" ON public.user_passkeys; CREATE POLICY "Users can delete their passkeys" ON public.user_passkeys AS PERMISSIVE FOR DELETE TO authenticated USING ((((SELECT auth.uid()) = user_id) OR has_role((SELECT auth.uid()), 'admin'::app_role)));
DROP POLICY IF EXISTS "Users can insert own passkeys" ON public.user_passkeys; CREATE POLICY "Users can insert own passkeys" ON public.user_passkeys AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (((SELECT auth.uid()) = user_id));
DROP POLICY IF EXISTS "Users can insert their passkeys" ON public.user_passkeys; CREATE POLICY "Users can insert their passkeys" ON public.user_passkeys AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (((SELECT auth.uid()) = user_id));
DROP POLICY IF EXISTS "Users can update own passkeys" ON public.user_passkeys; CREATE POLICY "Users can update own passkeys" ON public.user_passkeys AS PERMISSIVE FOR UPDATE TO authenticated USING (((SELECT auth.uid()) = user_id)) WITH CHECK (((SELECT auth.uid()) = user_id));
DROP POLICY IF EXISTS "Users can update their passkeys" ON public.user_passkeys; CREATE POLICY "Users can update their passkeys" ON public.user_passkeys AS PERMISSIVE FOR UPDATE TO authenticated USING (((SELECT auth.uid()) = user_id));
DROP POLICY IF EXISTS "Users can view own passkeys" ON public.user_passkeys; CREATE POLICY "Users can view own passkeys" ON public.user_passkeys AS PERMISSIVE FOR SELECT TO authenticated USING (((SELECT auth.uid()) = user_id));
DROP POLICY IF EXISTS "Admins can delete user roles" ON public.user_roles; CREATE POLICY "Admins can delete user roles" ON public.user_roles AS PERMISSIVE FOR DELETE TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role));
DROP POLICY IF EXISTS "Admins can insert user roles" ON public.user_roles; CREATE POLICY "Admins can insert user roles" ON public.user_roles AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (has_role((SELECT auth.uid()), 'admin'::app_role));
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles; CREATE POLICY "Admins can manage all roles" ON public.user_roles AS PERMISSIVE FOR ALL TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role)) WITH CHECK (has_role((SELECT auth.uid()), 'admin'::app_role));
DROP POLICY IF EXISTS "Admins can update user roles" ON public.user_roles; CREATE POLICY "Admins can update user roles" ON public.user_roles AS PERMISSIVE FOR UPDATE TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role));
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles; CREATE POLICY "Users can view own roles" ON public.user_roles AS PERMISSIVE FOR SELECT TO authenticated USING ((((SELECT auth.uid()) = user_id) OR has_role((SELECT auth.uid()), 'admin'::app_role)));
DROP POLICY IF EXISTS "Users see own sessions" ON public.user_sessions; CREATE POLICY "Users see own sessions" ON public.user_sessions AS PERMISSIVE FOR SELECT TO authenticated USING (((SELECT auth.uid()) = user_id));
DROP POLICY IF EXISTS "Empresa-based access" ON public.vendedores; CREATE POLICY "Empresa-based access" ON public.vendedores AS PERMISSIVE FOR ALL TO authenticated USING (((empresa_id IN ( SELECT user_empresas.empresa_id
   FROM user_empresas
  WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND (user_empresas.ativo = true)))) OR (EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = 'admin'::app_role))))));
DROP POLICY IF EXISTS "Access by empresa_id" ON public.verificacoes_conformidade; CREATE POLICY "Access by empresa_id" ON public.verificacoes_conformidade AS PERMISSIVE FOR ALL TO authenticated USING (((empresa_id IN ( SELECT user_empresas.empresa_id
   FROM user_empresas
  WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND (user_empresas.ativo = true)))) OR (EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = 'admin'::app_role))))));
DROP POLICY IF EXISTS "Authenticated can create challenges" ON public.webauthn_challenges; CREATE POLICY "Authenticated can create challenges" ON public.webauthn_challenges AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (((SELECT auth.uid()) = user_id));
DROP POLICY IF EXISTS "Authenticated can read own challenges" ON public.webauthn_challenges; CREATE POLICY "Authenticated can read own challenges" ON public.webauthn_challenges AS PERMISSIVE FOR SELECT TO authenticated USING ((((SELECT auth.uid()) = user_id) OR has_role((SELECT auth.uid()), 'admin'::app_role)));
DROP POLICY IF EXISTS "Users can delete their challenges" ON public.webauthn_challenges; CREATE POLICY "Users can delete their challenges" ON public.webauthn_challenges AS PERMISSIVE FOR DELETE TO authenticated USING ((((SELECT auth.uid()) = user_id) OR has_role((SELECT auth.uid()), 'admin'::app_role)));
DROP POLICY IF EXISTS "Users can insert their challenges" ON public.webauthn_challenges; CREATE POLICY "Users can insert their challenges" ON public.webauthn_challenges AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (((SELECT auth.uid()) = user_id));
DROP POLICY IF EXISTS "Users can update their challenges" ON public.webauthn_challenges; CREATE POLICY "Users can update their challenges" ON public.webauthn_challenges AS PERMISSIVE FOR UPDATE TO authenticated USING ((( SELECT (SELECT auth.uid()) AS uid) = user_id));
DROP POLICY IF EXISTS "users manage own webauthn" ON public.webauthn_credentials; CREATE POLICY "users manage own webauthn" ON public.webauthn_credentials AS PERMISSIVE FOR ALL TO authenticated USING (((SELECT auth.uid()) = user_id)) WITH CHECK (((SELECT auth.uid()) = user_id));
DROP POLICY IF EXISTS "Admins podem atualizar DLQ" ON public.webhook_dlq; CREATE POLICY "Admins podem atualizar DLQ" ON public.webhook_dlq AS PERMISSIVE FOR UPDATE TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role)) WITH CHECK (has_role((SELECT auth.uid()), 'admin'::app_role));
DROP POLICY IF EXISTS "Admins podem visualizar DLQ" ON public.webhook_dlq; CREATE POLICY "Admins podem visualizar DLQ" ON public.webhook_dlq AS PERMISSIVE FOR SELECT TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role));
DROP POLICY IF EXISTS "Admins can delete events" ON public.webhook_events; CREATE POLICY "Admins can delete events" ON public.webhook_events AS PERMISSIVE FOR DELETE TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role));
DROP POLICY IF EXISTS "Authorized roles can view webhook events" ON public.webhook_events; CREATE POLICY "Authorized roles can view webhook events" ON public.webhook_events AS PERMISSIVE FOR SELECT TO authenticated USING ((has_role((SELECT auth.uid()), 'admin'::app_role) OR has_role((SELECT auth.uid()), 'manager'::app_role)));
DROP POLICY IF EXISTS "Authorized roles can view webhooks" ON public.webhook_events; CREATE POLICY "Authorized roles can view webhooks" ON public.webhook_events AS PERMISSIVE FOR SELECT TO authenticated USING ((has_role((SELECT auth.uid()), 'admin'::app_role) OR has_role((SELECT auth.uid()), 'manager'::app_role)));
DROP POLICY IF EXISTS "Managers can update events" ON public.webhook_events; CREATE POLICY "Managers can update events" ON public.webhook_events AS PERMISSIVE FOR UPDATE TO authenticated USING ((has_role((SELECT auth.uid()), 'admin'::app_role) OR has_role((SELECT auth.uid()), 'manager'::app_role)));
DROP POLICY IF EXISTS "Operators can insert events" ON public.webhook_events; CREATE POLICY "Operators can insert events" ON public.webhook_events AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((has_role((SELECT auth.uid()), 'admin'::app_role) OR has_role((SELECT auth.uid()), 'manager'::app_role) OR has_role((SELECT auth.uid()), 'operator'::app_role)));
DROP POLICY IF EXISTS "Viewers can view webhook events" ON public.webhook_events; CREATE POLICY "Viewers can view webhook events" ON public.webhook_events AS PERMISSIVE FOR SELECT TO authenticated USING (has_role((SELECT auth.uid()), 'viewer'::app_role));
DROP POLICY IF EXISTS "Users can view simulation results" ON public.webhook_simulation_results; CREATE POLICY "Users can view simulation results" ON public.webhook_simulation_results AS PERMISSIVE FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM webhook_simulation_runs
  WHERE ((webhook_simulation_runs.id = webhook_simulation_results.run_id) AND (webhook_simulation_runs.created_by = (SELECT auth.uid()))))));
DROP POLICY IF EXISTS "Users can insert simulation runs" ON public.webhook_simulation_runs; CREATE POLICY "Users can insert simulation runs" ON public.webhook_simulation_runs AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (((SELECT auth.uid()) = created_by));
DROP POLICY IF EXISTS "Users can view simulation runs" ON public.webhook_simulation_runs; CREATE POLICY "Users can view simulation runs" ON public.webhook_simulation_runs AS PERMISSIVE FOR SELECT TO authenticated USING (((SELECT auth.uid()) = created_by));
DROP POLICY IF EXISTS webhooks_log_admin_insert ON public.webhooks_log; CREATE POLICY webhooks_log_admin_insert ON public.webhooks_log AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (has_role((SELECT auth.uid()), 'admin'::app_role));
DROP POLICY IF EXISTS webhooks_log_admin_select ON public.webhooks_log; CREATE POLICY webhooks_log_admin_select ON public.webhooks_log AS PERMISSIVE FOR SELECT TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role));
DROP POLICY IF EXISTS "Empresa-based access" ON public.whatsapp_conversas; CREATE POLICY "Empresa-based access" ON public.whatsapp_conversas AS PERMISSIVE FOR ALL TO authenticated USING (((empresa_id IN ( SELECT user_empresas.empresa_id
   FROM user_empresas
  WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND (user_empresas.ativo = true)))) OR (EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = 'admin'::app_role))))));
