-- E67: initplan (SELECT auth.uid()) em 469 policies (2026-08-25)
-- PostgreSQL normaliza automaticamente para ( SELECT auth.uid() AS uid)
DO $batchfix001$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='acessos_suspeitos') THEN
  DROP POLICY IF EXISTS acessos_suspeitos_tenant_select ON public.acessos_suspeitos; CREATE POLICY acessos_suspeitos_tenant_select ON public.acessos_suspeitos AS PERMISSIVE FOR SELECT TO authenticated USING ((has_role((SELECT auth.uid()), 'admin'::app_role) AND ((empresa_id IS NULL) OR empresa_acessivel(empresa_id))));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix001$;
DO $batchfix002$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='acoes_recomendadas') THEN
  DROP POLICY IF EXISTS "Empresa-based access" ON public.acoes_recomendadas; CREATE POLICY "Empresa-based access" ON public.acoes_recomendadas AS PERMISSIVE FOR ALL TO authenticated USING (((empresa_id IN ( SELECT user_empresas.empresa_id
     FROM user_empresas
    WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND (user_empresas.ativo = true)))) OR (EXISTS ( SELECT 1
     FROM user_roles
    WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = 'admin'::app_role))))));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix002$;
DO $batchfix003$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='acordos_parcelamento') THEN
  DROP POLICY IF EXISTS "Empresa-based access" ON public.acordos_parcelamento; CREATE POLICY "Empresa-based access" ON public.acordos_parcelamento AS PERMISSIVE FOR ALL TO authenticated USING (((empresa_id IN ( SELECT user_empresas.empresa_id
     FROM user_empresas
    WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND (user_empresas.ativo = true)))) OR (EXISTS ( SELECT 1
     FROM user_roles
    WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = 'admin'::app_role))))));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix003$;
DO $batchfix004$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='acordos_parcelamento') THEN
  DROP POLICY IF EXISTS "Owner manage acordos" ON public.acordos_parcelamento; CREATE POLICY "Owner manage acordos" ON public.acordos_parcelamento AS PERMISSIVE FOR ALL TO authenticated USING (((SELECT auth.uid()) = user_id)) WITH CHECK (((SELECT auth.uid()) = user_id));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix004$;
DO $acpol1$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='alert_configurations') THEN
    DROP POLICY IF EXISTS "Admins can delete alert configs" ON public.alert_configurations;
    CREATE POLICY "Admins can delete alert configs" ON public.alert_configurations AS PERMISSIVE FOR DELETE TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR duplicate_object THEN NULL;
END $acpol1$;
DO $acpol2$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='alert_configurations') THEN
    DROP POLICY IF EXISTS "Admins managers can view alert configs" ON public.alert_configurations;
    CREATE POLICY "Admins managers can view alert configs" ON public.alert_configurations AS PERMISSIVE FOR SELECT TO authenticated USING ((has_role((SELECT auth.uid()), 'admin'::app_role) OR has_role((SELECT auth.uid()), 'financeiro'::app_role)));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR duplicate_object THEN NULL;
END $acpol2$;
DO $acpol3$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='alert_configurations') THEN
    DROP POLICY IF EXISTS "Managers can insert alert configs" ON public.alert_configurations;
    CREATE POLICY "Managers can insert alert configs" ON public.alert_configurations AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((has_role((SELECT auth.uid()), 'admin'::app_role) OR has_role((SELECT auth.uid()), 'financeiro'::app_role)));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR duplicate_object THEN NULL;
END $acpol3$;
DO $acpol4$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='alert_configurations') THEN
    DROP POLICY IF EXISTS "Managers can update alert configs" ON public.alert_configurations;
    CREATE POLICY "Managers can update alert configs" ON public.alert_configurations AS PERMISSIVE FOR UPDATE TO authenticated USING ((has_role((SELECT auth.uid()), 'admin'::app_role) OR has_role((SELECT auth.uid()), 'financeiro'::app_role)));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR duplicate_object THEN NULL;
END $acpol4$;
DO $acpol5$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='alert_configurations') THEN
    DROP POLICY IF EXISTS "Viewers can view alert configs" ON public.alert_configurations;
    CREATE POLICY "Viewers can view alert configs" ON public.alert_configurations AS PERMISSIVE FOR SELECT TO authenticated USING (has_role((SELECT auth.uid()), 'visualizador'::app_role));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR duplicate_object THEN NULL;
END $acpol5$;
DO $batchfix005$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='alertas') THEN
  DROP POLICY IF EXISTS "Owner manage alertas" ON public.alertas; CREATE POLICY "Owner manage alertas" ON public.alertas AS PERMISSIVE FOR ALL TO authenticated USING (((SELECT auth.uid()) = user_id)) WITH CHECK (((SELECT auth.uid()) = user_id));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix005$;
DO $batchfix006$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='alertas') THEN
  DROP POLICY IF EXISTS alertas_owner_delete ON public.alertas; CREATE POLICY alertas_owner_delete ON public.alertas AS PERMISSIVE FOR DELETE TO authenticated USING ((( SELECT (SELECT auth.uid()) AS uid) = user_id));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix006$;
DO $batchfix007$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='alertas') THEN
  DROP POLICY IF EXISTS alertas_owner_select ON public.alertas; CREATE POLICY alertas_owner_select ON public.alertas AS PERMISSIVE FOR SELECT TO authenticated USING ((( SELECT (SELECT auth.uid()) AS uid) = user_id));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix007$;
DO $aptag$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='alertas_preditivos' AND column_name='empresa_id'
  ) THEN
    DROP POLICY IF EXISTS alertas_preditivos_empresa_select ON public.alertas_preditivos;
    CREATE POLICY alertas_preditivos_empresa_select ON public.alertas_preditivos AS PERMISSIVE FOR SELECT TO authenticated USING ((empresa_id IN ( SELECT user_empresas.empresa_id
       FROM user_empresas
      WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND (user_empresas.ativo = true)))));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR undefined_function THEN NULL;
END $aptag$;
DO $batchfix008$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='alertas_tributarios') THEN
  DROP POLICY IF EXISTS "Empresa-based access" ON public.alertas_tributarios; CREATE POLICY "Empresa-based access" ON public.alertas_tributarios AS PERMISSIVE FOR ALL TO authenticated USING (((empresa_id IN ( SELECT user_empresas.empresa_id
     FROM user_empresas
    WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND (user_empresas.ativo = true)))) OR (EXISTS ( SELECT 1
     FROM user_roles
    WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = 'admin'::app_role))))));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix008$;
DO $alrtag$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='alerts') THEN
    DROP POLICY IF EXISTS "Authorized roles can view alerts" ON public.alerts;
    CREATE POLICY "Authorized roles can view alerts" ON public.alerts AS PERMISSIVE FOR SELECT TO authenticated USING ((has_role((SELECT auth.uid()), 'admin'::app_role) OR has_role((SELECT auth.uid()), 'financeiro'::app_role) OR has_role((SELECT auth.uid()), 'operacional'::app_role)));
    DROP POLICY IF EXISTS "Managers can delete alerts" ON public.alerts;
    CREATE POLICY "Managers can delete alerts" ON public.alerts AS PERMISSIVE FOR DELETE TO authenticated USING ((has_role((SELECT auth.uid()), 'admin'::app_role) OR has_role((SELECT auth.uid()), 'financeiro'::app_role)));
    DROP POLICY IF EXISTS "Operators can insert alerts" ON public.alerts;
    CREATE POLICY "Operators can insert alerts" ON public.alerts AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((has_role((SELECT auth.uid()), 'admin'::app_role) OR has_role((SELECT auth.uid()), 'financeiro'::app_role) OR has_role((SELECT auth.uid()), 'operacional'::app_role)));
    DROP POLICY IF EXISTS "Operators can update alerts" ON public.alerts;
    CREATE POLICY "Operators can update alerts" ON public.alerts AS PERMISSIVE FOR UPDATE TO authenticated USING ((has_role((SELECT auth.uid()), 'admin'::app_role) OR has_role((SELECT auth.uid()), 'financeiro'::app_role) OR has_role((SELECT auth.uid()), 'operacional'::app_role)));
    DROP POLICY IF EXISTS "Viewers can view alerts" ON public.alerts;
    CREATE POLICY "Viewers can view alerts" ON public.alerts AS PERMISSIVE FOR SELECT TO authenticated USING (has_role((SELECT auth.uid()), 'visualizador'::app_role));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR duplicate_object THEN NULL;
END $alrtag$;
DO $alrsnttag$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='alerts_sent') THEN
    DROP POLICY IF EXISTS "Admins can delete alerts sent" ON public.alerts_sent;
    CREATE POLICY "Admins can delete alerts sent" ON public.alerts_sent AS PERMISSIVE FOR DELETE TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role));
    DROP POLICY IF EXISTS "Authorized roles can view alerts sent" ON public.alerts_sent;
    CREATE POLICY "Authorized roles can view alerts sent" ON public.alerts_sent AS PERMISSIVE FOR SELECT TO authenticated USING ((has_role((SELECT auth.uid()), 'admin'::app_role) OR has_role((SELECT auth.uid()), 'financeiro'::app_role) OR has_role((SELECT auth.uid()), 'operacional'::app_role)));
    DROP POLICY IF EXISTS "Managers can update alerts sent" ON public.alerts_sent;
    CREATE POLICY "Managers can update alerts sent" ON public.alerts_sent AS PERMISSIVE FOR UPDATE TO authenticated USING ((has_role((SELECT auth.uid()), 'admin'::app_role) OR has_role((SELECT auth.uid()), 'financeiro'::app_role)));
    DROP POLICY IF EXISTS "System can insert alerts sent" ON public.alerts_sent;
    CREATE POLICY "System can insert alerts sent" ON public.alerts_sent AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((has_role((SELECT auth.uid()), 'admin'::app_role) OR has_role((SELECT auth.uid()), 'financeiro'::app_role) OR has_role((SELECT auth.uid()), 'operacional'::app_role)));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR duplicate_object THEN NULL;
END $alrsnttag$;
DO $batchfix009$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='aliquotas_interestaduais') THEN
  DROP POLICY IF EXISTS aliq_inter_write_admin ON public.aliquotas_interestaduais; CREATE POLICY aliq_inter_write_admin ON public.aliquotas_interestaduais AS PERMISSIVE FOR ALL TO authenticated USING (has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role)) WITH CHECK (has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix009$;
DO $batchfix010$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='aliquotas_internas_uf') THEN
  DROP POLICY IF EXISTS aliq_internas_write_admin ON public.aliquotas_internas_uf; CREATE POLICY aliq_internas_write_admin ON public.aliquotas_internas_uf AS PERMISSIVE FOR ALL TO authenticated USING (has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role)) WITH CHECK (has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix010$;
DO $batchfix011$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='aliquotas_iss_municipal') THEN
  DROP POLICY IF EXISTS aliq_iss_write_admin ON public.aliquotas_iss_municipal; CREATE POLICY aliq_iss_write_admin ON public.aliquotas_iss_municipal AS PERMISSIVE FOR ALL TO authenticated USING (has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role)) WITH CHECK (has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix011$;
DO $batchfix012$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='allowed_countries') THEN
  DROP POLICY IF EXISTS "Admin manage" ON public.allowed_countries; CREATE POLICY "Admin manage" ON public.allowed_countries AS PERMISSIVE FOR ALL TO authenticated USING ((EXISTS ( SELECT 1
     FROM user_roles
    WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = 'admin'::app_role)))));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix012$;
DO $batchfix013$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='allowed_ips') THEN
  DROP POLICY IF EXISTS allowed_ips_admin_all ON public.allowed_ips; CREATE POLICY allowed_ips_admin_all ON public.allowed_ips AS PERMISSIVE FOR ALL TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role)) WITH CHECK (has_role((SELECT auth.uid()), 'admin'::app_role));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix013$;
DO $batchfix014$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='anexos_financeiros') THEN
  DROP POLICY IF EXISTS "Owner manage anexos" ON public.anexos_financeiros; CREATE POLICY "Owner manage anexos" ON public.anexos_financeiros AS PERMISSIVE FOR ALL TO authenticated USING (((SELECT auth.uid()) = user_id)) WITH CHECK (((SELECT auth.uid()) = user_id));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix014$;
DO $batchfix015$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='anomalia_detection_runs') THEN
  DROP POLICY IF EXISTS anomalia_runs_owner_or_admin_select ON public.anomalia_detection_runs; CREATE POLICY anomalia_runs_owner_or_admin_select ON public.anomalia_detection_runs AS PERMISSIVE FOR SELECT TO authenticated USING (((triggered_by = (SELECT auth.uid())) OR has_role((SELECT auth.uid()), 'admin'::app_role)));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix015$;
DO $batchfix016$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='anomalia_toast_eventos') THEN
  DROP POLICY IF EXISTS "Users can insert toast events" ON public.anomalia_toast_eventos; CREATE POLICY "Users can insert toast events" ON public.anomalia_toast_eventos AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (((SELECT auth.uid()) = user_id));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix016$;
DO $batchfix017$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='anomalia_toast_eventos') THEN
  DROP POLICY IF EXISTS "Users can view their own toast events" ON public.anomalia_toast_eventos; CREATE POLICY "Users can view their own toast events" ON public.anomalia_toast_eventos AS PERMISSIVE FOR SELECT TO authenticated USING (((SELECT auth.uid()) = user_id));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix017$;
DO $batchfix018$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='anomalias_detectadas') THEN
  DROP POLICY IF EXISTS "Admins can manage anomalias" ON public.anomalias_detectadas; CREATE POLICY "Admins can manage anomalias" ON public.anomalias_detectadas AS PERMISSIVE FOR ALL TO authenticated USING ((has_role((SELECT auth.uid()), 'admin'::app_role) OR has_role((SELECT auth.uid()), 'financeiro'::app_role))) WITH CHECK ((has_role((SELECT auth.uid()), 'admin'::app_role) OR has_role((SELECT auth.uid()), 'financeiro'::app_role)));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix018$;
DO $batchfix019$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='anomalias_detectadas') THEN
  DROP POLICY IF EXISTS anomalias_detectadas_empresa_select ON public.anomalias_detectadas; CREATE POLICY anomalias_detectadas_empresa_select ON public.anomalias_detectadas AS PERMISSIVE FOR SELECT TO authenticated USING ((empresa_id IN ( SELECT user_empresas.empresa_id
     FROM user_empresas
    WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND (user_empresas.ativo = true)))));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix019$;
DO $batchfix020$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='anomalias_detectadas') THEN
  DROP POLICY IF EXISTS anomalias_detectadas_tenant_rw ON public.anomalias_detectadas; CREATE POLICY anomalias_detectadas_tenant_rw ON public.anomalias_detectadas AS PERMISSIVE FOR ALL TO authenticated USING (((has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) OR has_role(( SELECT (SELECT auth.uid()) AS uid), 'financeiro'::app_role)) AND empresa_acessivel(empresa_id))) WITH CHECK (((has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) OR has_role(( SELECT (SELECT auth.uid()) AS uid), 'financeiro'::app_role)) AND empresa_acessivel(empresa_id)));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix020$;
DO $batchfix021$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='api_keys') THEN
  DROP POLICY IF EXISTS api_keys_delete ON public.api_keys; CREATE POLICY api_keys_delete ON public.api_keys AS PERMISSIVE FOR DELETE TO authenticated USING ((has_role((SELECT auth.uid()), 'admin'::app_role) AND empresa_acessivel(empresa_id)));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix021$;
DO $batchfix022$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='api_keys') THEN
  DROP POLICY IF EXISTS api_keys_select ON public.api_keys; CREATE POLICY api_keys_select ON public.api_keys AS PERMISSIVE FOR SELECT TO authenticated USING ((has_role((SELECT auth.uid()), 'admin'::app_role) AND empresa_acessivel(empresa_id)));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix022$;
DO $aprcmttag$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='aprovacao_comentarios' AND column_name='user_id') THEN
    DROP POLICY IF EXISTS "Users can insert their own comments" ON public.aprovacao_comentarios; CREATE POLICY "Users can insert their own comments" ON public.aprovacao_comentarios AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (((SELECT auth.uid()) = user_id));
    DROP POLICY IF EXISTS aprovacao_comentarios_owner_select ON public.aprovacao_comentarios; CREATE POLICY aprovacao_comentarios_owner_select ON public.aprovacao_comentarios AS PERMISSIVE FOR SELECT TO authenticated USING (((solicitacao_id IN ( SELECT solicitacoes_aprovacao.id
   FROM solicitacoes_aprovacao
  WHERE ((solicitacoes_aprovacao.solicitado_por = (SELECT auth.uid())) OR (solicitacoes_aprovacao.aprovado_por = (SELECT auth.uid()))))) OR (user_id = (SELECT auth.uid())) OR has_role((SELECT auth.uid()), 'admin'::app_role)));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR undefined_function THEN NULL;
END $aprcmttag$;
DO $batchfix023$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='apuracoes_irpj_csll') THEN
  DROP POLICY IF EXISTS "Empresa-based access" ON public.apuracoes_irpj_csll; CREATE POLICY "Empresa-based access" ON public.apuracoes_irpj_csll AS PERMISSIVE FOR ALL TO authenticated USING (((empresa_id IN ( SELECT user_empresas.empresa_id
     FROM user_empresas
    WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND (user_empresas.ativo = true)))) OR (EXISTS ( SELECT 1
     FROM user_roles
    WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = 'admin'::app_role))))));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix023$;
DO $batchfix024$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='apuracoes_tributarias') THEN
  DROP POLICY IF EXISTS apuracoes_tributarias_admin_all ON public.apuracoes_tributarias; CREATE POLICY apuracoes_tributarias_admin_all ON public.apuracoes_tributarias AS PERMISSIVE FOR ALL TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role)) WITH CHECK (has_role((SELECT auth.uid()), 'admin'::app_role));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix024$;
DO $batchfix025$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='apuracoes_tributarias') THEN
  DROP POLICY IF EXISTS apuracoes_tributarias_empresa_select ON public.apuracoes_tributarias; CREATE POLICY apuracoes_tributarias_empresa_select ON public.apuracoes_tributarias AS PERMISSIVE FOR SELECT TO authenticated USING ((empresa_id IN ( SELECT user_empresas.empresa_id
     FROM user_empresas
    WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND (user_empresas.ativo = true)))));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix025$;
DO $batchfix026$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='apuracoes_tributarias') THEN
  DROP POLICY IF EXISTS apuracoes_tributarias_tenant_rw ON public.apuracoes_tributarias; CREATE POLICY apuracoes_tributarias_tenant_rw ON public.apuracoes_tributarias AS PERMISSIVE FOR ALL TO authenticated USING ((has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id))) WITH CHECK ((has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id)));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix026$;
DO $batchfix027$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='asaas_audit_trail') THEN
  DROP POLICY IF EXISTS asaas_audit_admin_all ON public.asaas_audit_trail; CREATE POLICY asaas_audit_admin_all ON public.asaas_audit_trail AS PERMISSIVE FOR ALL TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role)) WITH CHECK (has_role((SELECT auth.uid()), 'admin'::app_role));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix027$;
DO $batchfix028$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='asaas_audit_trail') THEN
  DROP POLICY IF EXISTS asaas_audit_tenant_select ON public.asaas_audit_trail; CREATE POLICY asaas_audit_tenant_select ON public.asaas_audit_trail AS PERMISSIVE FOR SELECT TO authenticated USING ((has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) AND (EXISTS ( SELECT 1
     FROM asaas_payments p
    WHERE ((p.id = asaas_audit_trail.payment_id) AND empresa_acessivel(p.empresa_id))))));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix028$;
DO $batchfix029$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='asaas_config') THEN
  DROP POLICY IF EXISTS asaas_config_admin_all ON public.asaas_config; CREATE POLICY asaas_config_admin_all ON public.asaas_config AS PERMISSIVE FOR ALL TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role)) WITH CHECK (has_role((SELECT auth.uid()), 'admin'::app_role));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix029$;
DO $batchfix030$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='asaas_config') THEN
  DROP POLICY IF EXISTS asaas_config_tenant_rw ON public.asaas_config; CREATE POLICY asaas_config_tenant_rw ON public.asaas_config AS PERMISSIVE FOR ALL TO authenticated USING ((has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id))) WITH CHECK ((has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id)));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix030$;
DO $batchfix031$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='asaas_customers') THEN
  DROP POLICY IF EXISTS asaas_customers_admin_all ON public.asaas_customers; CREATE POLICY asaas_customers_admin_all ON public.asaas_customers AS PERMISSIVE FOR ALL TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role)) WITH CHECK (has_role((SELECT auth.uid()), 'admin'::app_role));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix031$;
DO $batchfix032$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='asaas_customers') THEN
  DROP POLICY IF EXISTS asaas_customers_empresa_select ON public.asaas_customers; CREATE POLICY asaas_customers_empresa_select ON public.asaas_customers AS PERMISSIVE FOR SELECT TO authenticated USING ((empresa_id IN ( SELECT user_empresas.empresa_id
     FROM user_empresas
    WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND (user_empresas.ativo = true)))));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix032$;
DO $batchfix033$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='asaas_customers') THEN
  DROP POLICY IF EXISTS asaas_customers_tenant_rw ON public.asaas_customers; CREATE POLICY asaas_customers_tenant_rw ON public.asaas_customers AS PERMISSIVE FOR ALL TO authenticated USING ((has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id))) WITH CHECK ((has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id)));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix033$;
DO $batchfix034$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='asaas_payments') THEN
  DROP POLICY IF EXISTS asaas_payments_admin_all ON public.asaas_payments; CREATE POLICY asaas_payments_admin_all ON public.asaas_payments AS PERMISSIVE FOR ALL TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role)) WITH CHECK (has_role((SELECT auth.uid()), 'admin'::app_role));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix034$;
DO $batchfix035$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='asaas_payments') THEN
  DROP POLICY IF EXISTS asaas_payments_empresa_select ON public.asaas_payments; CREATE POLICY asaas_payments_empresa_select ON public.asaas_payments AS PERMISSIVE FOR SELECT TO authenticated USING ((empresa_id IN ( SELECT user_empresas.empresa_id
     FROM user_empresas
    WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND (user_empresas.ativo = true)))));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix035$;
DO $batchfix036$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='asaas_payments') THEN
  DROP POLICY IF EXISTS asaas_payments_tenant_rw ON public.asaas_payments; CREATE POLICY asaas_payments_tenant_rw ON public.asaas_payments AS PERMISSIVE FOR ALL TO authenticated USING ((has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id))) WITH CHECK ((has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id)));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix036$;
DO $batchfix037$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='asaas_reconciliation_suggestions') THEN
  DROP POLICY IF EXISTS asaas_recon_admin_all ON public.asaas_reconciliation_suggestions; CREATE POLICY asaas_recon_admin_all ON public.asaas_reconciliation_suggestions AS PERMISSIVE FOR ALL TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role)) WITH CHECK (has_role((SELECT auth.uid()), 'admin'::app_role));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix037$;
DO $batchfix038$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='asaas_reconciliation_suggestions') THEN
  DROP POLICY IF EXISTS asaas_recon_empresa_select ON public.asaas_reconciliation_suggestions; CREATE POLICY asaas_recon_empresa_select ON public.asaas_reconciliation_suggestions AS PERMISSIVE FOR SELECT TO authenticated USING ((empresa_id IN ( SELECT user_empresas.empresa_id
     FROM user_empresas
    WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND (user_empresas.ativo = true)))));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix038$;
DO $batchfix039$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='asaas_reconciliation_suggestions') THEN
  DROP POLICY IF EXISTS asaas_reconciliation_suggestions_tenant_rw ON public.asaas_reconciliation_suggestions; CREATE POLICY asaas_reconciliation_suggestions_tenant_rw ON public.asaas_reconciliation_suggestions AS PERMISSIVE FOR ALL TO authenticated USING ((has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id))) WITH CHECK ((has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id)));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix039$;
DO $batchfix040$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='asaas_sync_queue') THEN
  DROP POLICY IF EXISTS asaas_sync_admin_all ON public.asaas_sync_queue; CREATE POLICY asaas_sync_admin_all ON public.asaas_sync_queue AS PERMISSIVE FOR ALL TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role)) WITH CHECK (has_role((SELECT auth.uid()), 'admin'::app_role));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix040$;
DO $batchfix041$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='asaas_sync_queue') THEN
  DROP POLICY IF EXISTS asaas_sync_tenant_all ON public.asaas_sync_queue; CREATE POLICY asaas_sync_tenant_all ON public.asaas_sync_queue AS PERMISSIVE FOR ALL TO authenticated USING ((has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) AND (EXISTS ( SELECT 1
     FROM asaas_payments p
    WHERE ((p.id = asaas_sync_queue.payment_id) AND empresa_acessivel(p.empresa_id)))))) WITH CHECK ((has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) AND (EXISTS ( SELECT 1
     FROM asaas_payments p
    WHERE ((p.id = asaas_sync_queue.payment_id) AND empresa_acessivel(p.empresa_id))))));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix041$;
DO $batchfix042$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='asaas_transfers') THEN
  DROP POLICY IF EXISTS asaas_transfers_admin_all ON public.asaas_transfers; CREATE POLICY asaas_transfers_admin_all ON public.asaas_transfers AS PERMISSIVE FOR ALL TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role)) WITH CHECK (has_role((SELECT auth.uid()), 'admin'::app_role));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix042$;
DO $batchfix043$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='asaas_transfers') THEN
  DROP POLICY IF EXISTS asaas_transfers_empresa_select ON public.asaas_transfers; CREATE POLICY asaas_transfers_empresa_select ON public.asaas_transfers AS PERMISSIVE FOR SELECT TO authenticated USING ((empresa_id IN ( SELECT user_empresas.empresa_id
     FROM user_empresas
    WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND (user_empresas.ativo = true)))));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix043$;
DO $batchfix044$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='asaas_transfers') THEN
  DROP POLICY IF EXISTS asaas_transfers_tenant_rw ON public.asaas_transfers; CREATE POLICY asaas_transfers_tenant_rw ON public.asaas_transfers AS PERMISSIVE FOR ALL TO authenticated USING ((has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id))) WITH CHECK ((has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id)));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix044$;
DO $batchfix045$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='audit_logs') THEN
  DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_logs; CREATE POLICY "Admins can view audit logs" ON public.audit_logs AS PERMISSIVE FOR SELECT TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix045$;
DO $batchfix046$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='audit_logs') THEN
  DROP POLICY IF EXISTS audit_logs_insert_self_attributed ON public.audit_logs; CREATE POLICY audit_logs_insert_self_attributed ON public.audit_logs AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (((user_id = ( SELECT (SELECT auth.uid()) AS uid)) AND ((user_email IS NULL) OR (user_email = ( SELECT (auth.jwt() ->> 'email'::text))))));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix046$;
DO $audlogs26tag$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='audit_logs_2026_01') THEN
    DROP POLICY IF EXISTS admin_only_audit_logs_2026_01 ON public.audit_logs_2026_01; CREATE POLICY admin_only_audit_logs_2026_01 ON public.audit_logs_2026_01 AS PERMISSIVE FOR ALL TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role)) WITH CHECK (has_role((SELECT auth.uid()), 'admin'::app_role));
  END IF;
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='audit_logs_2026_02') THEN
    DROP POLICY IF EXISTS admin_only_audit_logs_2026_02 ON public.audit_logs_2026_02; CREATE POLICY admin_only_audit_logs_2026_02 ON public.audit_logs_2026_02 AS PERMISSIVE FOR ALL TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role)) WITH CHECK (has_role((SELECT auth.uid()), 'admin'::app_role));
  END IF;
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='audit_logs_2026_03') THEN
    DROP POLICY IF EXISTS admin_only_audit_logs_2026_03 ON public.audit_logs_2026_03; CREATE POLICY admin_only_audit_logs_2026_03 ON public.audit_logs_2026_03 AS PERMISSIVE FOR ALL TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role)) WITH CHECK (has_role((SELECT auth.uid()), 'admin'::app_role));
  END IF;
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='audit_logs_2026_04') THEN
    DROP POLICY IF EXISTS admin_only_audit_logs_2026_04 ON public.audit_logs_2026_04; CREATE POLICY admin_only_audit_logs_2026_04 ON public.audit_logs_2026_04 AS PERMISSIVE FOR ALL TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role)) WITH CHECK (has_role((SELECT auth.uid()), 'admin'::app_role));
  END IF;
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='audit_logs_2026_05') THEN
    DROP POLICY IF EXISTS admin_only_audit_logs_2026_05 ON public.audit_logs_2026_05; CREATE POLICY admin_only_audit_logs_2026_05 ON public.audit_logs_2026_05 AS PERMISSIVE FOR ALL TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role)) WITH CHECK (has_role((SELECT auth.uid()), 'admin'::app_role));
  END IF;
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='audit_logs_2026_06') THEN
    DROP POLICY IF EXISTS admin_only_audit_logs_2026_06 ON public.audit_logs_2026_06; CREATE POLICY admin_only_audit_logs_2026_06 ON public.audit_logs_2026_06 AS PERMISSIVE FOR ALL TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role)) WITH CHECK (has_role((SELECT auth.uid()), 'admin'::app_role));
  END IF;
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='audit_logs_2026_07') THEN
    DROP POLICY IF EXISTS admin_only_audit_logs_2026_07 ON public.audit_logs_2026_07; CREATE POLICY admin_only_audit_logs_2026_07 ON public.audit_logs_2026_07 AS PERMISSIVE FOR ALL TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role)) WITH CHECK (has_role((SELECT auth.uid()), 'admin'::app_role));
  END IF;
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='audit_logs_2026_08') THEN
    DROP POLICY IF EXISTS admin_only_audit_logs_2026_08 ON public.audit_logs_2026_08; CREATE POLICY admin_only_audit_logs_2026_08 ON public.audit_logs_2026_08 AS PERMISSIVE FOR ALL TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role)) WITH CHECK (has_role((SELECT auth.uid()), 'admin'::app_role));
  END IF;
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='audit_logs_2026_09') THEN
    DROP POLICY IF EXISTS admin_only_audit_logs_2026_09 ON public.audit_logs_2026_09; CREATE POLICY admin_only_audit_logs_2026_09 ON public.audit_logs_2026_09 AS PERMISSIVE FOR ALL TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role)) WITH CHECK (has_role((SELECT auth.uid()), 'admin'::app_role));
  END IF;
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='audit_logs_2026_10') THEN
    DROP POLICY IF EXISTS admin_only_audit_logs_2026_10 ON public.audit_logs_2026_10; CREATE POLICY admin_only_audit_logs_2026_10 ON public.audit_logs_2026_10 AS PERMISSIVE FOR ALL TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role)) WITH CHECK (has_role((SELECT auth.uid()), 'admin'::app_role));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object THEN NULL;
END $audlogs26tag$;
DO $audlogsdfttag$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='audit_logs_default') THEN
    DROP POLICY IF EXISTS admin_only_audit_logs_default ON public.audit_logs_default; CREATE POLICY admin_only_audit_logs_default ON public.audit_logs_default AS PERMISSIVE FOR ALL TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role)) WITH CHECK (has_role((SELECT auth.uid()), 'admin'::app_role));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object THEN NULL;
END $audlogsdfttag$;
DO $audfinemprtag$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='auditoria_financeira' AND column_name='empresa_id') THEN
    DROP POLICY IF EXISTS auditoria_financeira_empresa_select ON public.auditoria_financeira; CREATE POLICY auditoria_financeira_empresa_select ON public.auditoria_financeira AS PERMISSIVE FOR SELECT TO authenticated USING ((empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND (user_empresas.ativo = true)))));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR undefined_function THEN NULL;
END $audfinemprtag$;
DO $audfinusrtag$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='auditoria_financeira' AND column_name='user_id') THEN
    DROP POLICY IF EXISTS auditoria_user_insert ON public.auditoria_financeira; CREATE POLICY auditoria_user_insert ON public.auditoria_financeira AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (((SELECT auth.uid()) = user_id));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR undefined_function THEN NULL;
END $audfinusrtag$;
DO $audtribemprtag$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='auditoria_tributaria' AND column_name='empresa_id') THEN
    DROP POLICY IF EXISTS auditoria_trib_select_tenant ON public.auditoria_tributaria; CREATE POLICY auditoria_trib_select_tenant ON public.auditoria_tributaria AS PERMISSIVE FOR SELECT TO authenticated USING ((has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id)));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR undefined_function THEN NULL;
END $audtribemprtag$;
DO $authlogstag$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='auth_logs') THEN
    DROP POLICY IF EXISTS "Admins can view all auth logs" ON public.auth_logs; CREATE POLICY "Admins can view all auth logs" ON public.auth_logs AS PERMISSIVE FOR SELECT TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role));
    DROP POLICY IF EXISTS "Authenticated can insert auth logs" ON public.auth_logs; CREATE POLICY "Authenticated can insert auth logs" ON public.auth_logs AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((has_role((SELECT auth.uid()), 'admin'::app_role) OR has_role((SELECT auth.uid()), 'financeiro'::app_role) OR has_role((SELECT auth.uid()), 'operacional'::app_role) OR has_role((SELECT auth.uid()), 'visualizador'::app_role)));
    DROP POLICY IF EXISTS "Users can view own auth logs" ON public.auth_logs; CREATE POLICY "Users can view own auth logs" ON public.auth_logs AS PERMISSIVE FOR SELECT TO authenticated USING (((SELECT auth.uid()) = user_id));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object THEN NULL;
END $authlogstag$;
DO $batchfix047$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='benchmarks_setoriais') THEN
  DROP POLICY IF EXISTS benchmarks_admin_write ON public.benchmarks_setoriais; CREATE POLICY benchmarks_admin_write ON public.benchmarks_setoriais AS PERMISSIVE FOR ALL TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role)) WITH CHECK (has_role((SELECT auth.uid()), 'admin'::app_role));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix047$;
DO $batchfix048$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='beneficios_fiscais') THEN
  DROP POLICY IF EXISTS beneficios_write_admin ON public.beneficios_fiscais; CREATE POLICY beneficios_write_admin ON public.beneficios_fiscais AS PERMISSIVE FOR ALL TO authenticated USING (has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role)) WITH CHECK (has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix048$;
DO $bitrix24acttag$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='bitrix24_activities') THEN
    DROP POLICY IF EXISTS "Admins can delete activities" ON public.bitrix24_activities; CREATE POLICY "Admins can delete activities" ON public.bitrix24_activities AS PERMISSIVE FOR DELETE TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role));
    DROP POLICY IF EXISTS "Authorized roles can view activities" ON public.bitrix24_activities; CREATE POLICY "Authorized roles can view activities" ON public.bitrix24_activities AS PERMISSIVE FOR SELECT TO authenticated USING ((has_role((SELECT auth.uid()), 'admin'::app_role) OR has_role((SELECT auth.uid()), 'financeiro'::app_role)));
    DROP POLICY IF EXISTS "Managers can insert activities" ON public.bitrix24_activities; CREATE POLICY "Managers can insert activities" ON public.bitrix24_activities AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((has_role((SELECT auth.uid()), 'admin'::app_role) OR has_role((SELECT auth.uid()), 'financeiro'::app_role)));
    DROP POLICY IF EXISTS "Managers can update activities" ON public.bitrix24_activities; CREATE POLICY "Managers can update activities" ON public.bitrix24_activities AS PERMISSIVE FOR UPDATE TO authenticated USING ((has_role((SELECT auth.uid()), 'admin'::app_role) OR has_role((SELECT auth.uid()), 'financeiro'::app_role)));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object THEN NULL;
END $bitrix24acttag$;
DO $bitrix24stagmaptag$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='bitrix24_stage_mappings') THEN
    DROP POLICY IF EXISTS "Admins can delete stage mappings" ON public.bitrix24_stage_mappings; CREATE POLICY "Admins can delete stage mappings" ON public.bitrix24_stage_mappings AS PERMISSIVE FOR DELETE TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role));
    DROP POLICY IF EXISTS "Authorized roles can view stage mappings" ON public.bitrix24_stage_mappings; CREATE POLICY "Authorized roles can view stage mappings" ON public.bitrix24_stage_mappings AS PERMISSIVE FOR SELECT TO authenticated USING ((has_role((SELECT auth.uid()), 'admin'::app_role) OR has_role((SELECT auth.uid()), 'financeiro'::app_role) OR has_role((SELECT auth.uid()), 'operacional'::app_role)));
    DROP POLICY IF EXISTS "Managers can insert stage mappings" ON public.bitrix24_stage_mappings; CREATE POLICY "Managers can insert stage mappings" ON public.bitrix24_stage_mappings AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((has_role((SELECT auth.uid()), 'admin'::app_role) OR has_role((SELECT auth.uid()), 'financeiro'::app_role)));
    DROP POLICY IF EXISTS "Managers can update stage mappings" ON public.bitrix24_stage_mappings; CREATE POLICY "Managers can update stage mappings" ON public.bitrix24_stage_mappings AS PERMISSIVE FOR UPDATE TO authenticated USING ((has_role((SELECT auth.uid()), 'admin'::app_role) OR has_role((SELECT auth.uid()), 'financeiro'::app_role)));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object THEN NULL;
END $bitrix24stagmaptag$;
DO $bitrix24toktag$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='bitrix24_tokens') THEN
    DROP POLICY IF EXISTS "Admins can delete tokens" ON public.bitrix24_tokens; CREATE POLICY "Admins can delete tokens" ON public.bitrix24_tokens AS PERMISSIVE FOR DELETE TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role));
    DROP POLICY IF EXISTS "Admins can insert tokens" ON public.bitrix24_tokens; CREATE POLICY "Admins can insert tokens" ON public.bitrix24_tokens AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (has_role((SELECT auth.uid()), 'admin'::app_role));
    DROP POLICY IF EXISTS "Admins can update tokens" ON public.bitrix24_tokens; CREATE POLICY "Admins can update tokens" ON public.bitrix24_tokens AS PERMISSIVE FOR UPDATE TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role));
    DROP POLICY IF EXISTS "Only admins can view tokens" ON public.bitrix24_tokens; CREATE POLICY "Only admins can view tokens" ON public.bitrix24_tokens AS PERMISSIVE FOR SELECT TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object THEN NULL;
END $bitrix24toktag$;
DO $batchfix049$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='bitrix_field_mappings') THEN
  DROP POLICY IF EXISTS bitrix_field_mappings_empresa_select ON public.bitrix_field_mappings; CREATE POLICY bitrix_field_mappings_empresa_select ON public.bitrix_field_mappings AS PERMISSIVE FOR SELECT TO authenticated USING ((empresa_id IN ( SELECT user_empresas.empresa_id
     FROM user_empresas
    WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND (user_empresas.ativo = true)))));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix049$;
DO $batchfix050$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='bitrix_sync_logs') THEN
  DROP POLICY IF EXISTS bitrix_sync_logs_empresa_select ON public.bitrix_sync_logs; CREATE POLICY bitrix_sync_logs_empresa_select ON public.bitrix_sync_logs AS PERMISSIVE FOR SELECT TO authenticated USING ((empresa_id IN ( SELECT user_empresas.empresa_id
     FROM user_empresas
    WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND (user_empresas.ativo = true)))));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix050$;
DO $batchfix051$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='bitrix_webhook_events') THEN
  DROP POLICY IF EXISTS "Admin only manage" ON public.bitrix_webhook_events; CREATE POLICY "Admin only manage" ON public.bitrix_webhook_events AS PERMISSIVE FOR ALL TO authenticated USING ((EXISTS ( SELECT 1
     FROM user_roles
    WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = 'admin'::app_role)))));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix051$;
DO $batchfix052$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='bling_sync_logs') THEN
  DROP POLICY IF EXISTS bling_sync_logs_insert ON public.bling_sync_logs; CREATE POLICY bling_sync_logs_insert ON public.bling_sync_logs AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((has_role((SELECT auth.uid()), 'admin'::app_role) OR has_role((SELECT auth.uid()), 'financeiro'::app_role)));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix052$;
DO $batchfix053$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='bling_sync_logs') THEN
  DROP POLICY IF EXISTS bling_sync_logs_select ON public.bling_sync_logs; CREATE POLICY bling_sync_logs_select ON public.bling_sync_logs AS PERMISSIVE FOR SELECT TO authenticated USING ((has_role((SELECT auth.uid()), 'admin'::app_role) OR has_role((SELECT auth.uid()), 'financeiro'::app_role) OR has_role((SELECT auth.uid()), 'operacional'::app_role)));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix053$;
DO $batchfix054$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='bling_webhook_events') THEN
  DROP POLICY IF EXISTS bling_webhook_events_admin_select ON public.bling_webhook_events; CREATE POLICY bling_webhook_events_admin_select ON public.bling_webhook_events AS PERMISSIVE FOR SELECT TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix054$;
DO $batchfix055$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='bloat_snapshots') THEN
  DROP POLICY IF EXISTS "Admins podem consultar snapshots de bloat" ON public.bloat_snapshots; CREATE POLICY "Admins podem consultar snapshots de bloat" ON public.bloat_snapshots AS PERMISSIVE FOR SELECT TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix055$;
DO $batchfix056$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='blocked_ips') THEN
  DROP POLICY IF EXISTS "Admins can manage blocked IPs" ON public.blocked_ips; CREATE POLICY "Admins can manage blocked IPs" ON public.blocked_ips AS PERMISSIVE FOR ALL TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix056$;
DO $batchfix057$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='blocked_ips') THEN
  DROP POLICY IF EXISTS "Managers can view blocked IPs" ON public.blocked_ips; CREATE POLICY "Managers can view blocked IPs" ON public.blocked_ips AS PERMISSIVE FOR SELECT TO authenticated USING (has_role((SELECT auth.uid()), 'financeiro'::app_role));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix057$;
DO $batchfix058$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='bloqueios_duplicidade') THEN
  DROP POLICY IF EXISTS "Empresa-based access" ON public.bloqueios_duplicidade; CREATE POLICY "Empresa-based access" ON public.bloqueios_duplicidade AS PERMISSIVE FOR ALL TO authenticated USING (((empresa_id IN ( SELECT user_empresas.empresa_id
     FROM user_empresas
    WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND (user_empresas.ativo = true)))) OR (EXISTS ( SELECT 1
     FROM user_roles
    WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = 'admin'::app_role))))));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix058$;
DO $batchfix059$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='boletos') THEN
  DROP POLICY IF EXISTS "Owner manage boletos" ON public.boletos; CREATE POLICY "Owner manage boletos" ON public.boletos AS PERMISSIVE FOR ALL TO authenticated USING (((SELECT auth.uid()) = user_id)) WITH CHECK (((SELECT auth.uid()) = user_id));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix059$;
DO $batchfix060$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='boletos') THEN
  DROP POLICY IF EXISTS boletos_grupo_select ON public.boletos; CREATE POLICY boletos_grupo_select ON public.boletos AS PERMISSIVE FOR SELECT TO authenticated USING (((empresa_id IS NOT NULL) AND (empresa_id IN ( SELECT user_empresas.empresa_id
     FROM user_empresas
    WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND (user_empresas.ativo = true))))));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix060$;
DO $batchfix061$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='budgets') THEN
  DROP POLICY IF EXISTS "Budgets scoped by owner or empresa" ON public.budgets; CREATE POLICY "Budgets scoped by owner or empresa" ON public.budgets AS PERMISSIVE FOR ALL TO authenticated USING (((user_id = (SELECT auth.uid())) OR has_role((SELECT auth.uid()), 'admin'::app_role) OR (company_id IN ( SELECT ue.empresa_id
     FROM user_empresas ue
    WHERE ((ue.user_id = (SELECT auth.uid())) AND (ue.ativo = true)))))) WITH CHECK (((user_id = (SELECT auth.uid())) OR has_role((SELECT auth.uid()), 'admin'::app_role) OR (company_id IN ( SELECT ue.empresa_id
     FROM user_empresas ue
    WHERE ((ue.user_id = (SELECT auth.uid())) AND (ue.ativo = true))))));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix061$;
DO $batchfix062$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='catalogos_fiscais_cargas') THEN
  DROP POLICY IF EXISTS "Admins leem cargas de catalogos fiscais" ON public.catalogos_fiscais_cargas; CREATE POLICY "Admins leem cargas de catalogos fiscais" ON public.catalogos_fiscais_cargas AS PERMISSIVE FOR SELECT TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix062$;
DO $batchfix063$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='catalogos_tributarios_health_history') THEN
  DROP POLICY IF EXISTS "admins leem historico saude fiscal" ON public.catalogos_tributarios_health_history; CREATE POLICY "admins leem historico saude fiscal" ON public.catalogos_tributarios_health_history AS PERMISSIVE FOR SELECT TO authenticated USING (( SELECT has_role((SELECT auth.uid()), 'admin'::app_role) AS has_role));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix063$;
DO $batchfix064$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='categorias') THEN
  DROP POLICY IF EXISTS "Categorias scoped by empresa" ON public.categorias; CREATE POLICY "Categorias scoped by empresa" ON public.categorias AS PERMISSIVE FOR ALL TO authenticated USING ((has_role((SELECT auth.uid()), 'admin'::app_role) OR (empresa_id IN ( SELECT ue.empresa_id
     FROM user_empresas ue
    WHERE ((ue.user_id = (SELECT auth.uid())) AND (ue.ativo = true)))))) WITH CHECK ((has_role((SELECT auth.uid()), 'admin'::app_role) OR (empresa_id IN ( SELECT ue.empresa_id
     FROM user_empresas ue
    WHERE ((ue.user_id = (SELECT auth.uid())) AND (ue.ativo = true))))));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix064$;
DO $batchfix065$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='centros_custo') THEN
  DROP POLICY IF EXISTS "Admins can manage centros de custo" ON public.centros_custo; CREATE POLICY "Admins can manage centros de custo" ON public.centros_custo AS PERMISSIVE FOR ALL TO authenticated USING ((has_role((SELECT auth.uid()), 'admin'::app_role) OR has_role((SELECT auth.uid()), 'financeiro'::app_role))) WITH CHECK ((has_role((SELECT auth.uid()), 'admin'::app_role) OR has_role((SELECT auth.uid()), 'financeiro'::app_role)));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix065$;
DO $ccustoetag$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='centros_custo' AND column_name='empresa_id') THEN
    DROP POLICY IF EXISTS centros_custo_empresa_select ON public.centros_custo; CREATE POLICY centros_custo_empresa_select ON public.centros_custo AS PERMISSIVE FOR SELECT TO authenticated USING ((empresa_id IN ( SELECT user_empresas.empresa_id
       FROM user_empresas
      WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND (user_empresas.ativo = true)))));
    DROP POLICY IF EXISTS centros_custo_tenant_rw ON public.centros_custo; CREATE POLICY centros_custo_tenant_rw ON public.centros_custo AS PERMISSIVE FOR ALL TO authenticated USING (((has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) OR has_role(( SELECT (SELECT auth.uid()) AS uid), 'financeiro'::app_role)) AND empresa_acessivel(empresa_id))) WITH CHECK (((has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) OR has_role(( SELECT (SELECT auth.uid()) AS uid), 'financeiro'::app_role)) AND empresa_acessivel(empresa_id)));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR undefined_function THEN NULL;
END $ccustoetag$;
DO $batchfix066$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='ci_security_gate_events') THEN
  DROP POLICY IF EXISTS "Admins can view CI security gate events" ON public.ci_security_gate_events; CREATE POLICY "Admins can view CI security gate events" ON public.ci_security_gate_events AS PERMISSIVE FOR SELECT TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix066$;
DO $batchfix067$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='clientes') THEN
  DROP POLICY IF EXISTS clientes_grupo_select ON public.clientes; CREATE POLICY clientes_grupo_select ON public.clientes AS PERMISSIVE FOR SELECT TO authenticated USING (((empresa_id IS NOT NULL) AND (empresa_id IN ( SELECT user_empresas.empresa_id
     FROM user_empresas
    WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND (user_empresas.ativo = true))))));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix067$;
DO $batchfix068$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='clientes') THEN
  DROP POLICY IF EXISTS clientes_owner_delete ON public.clientes; CREATE POLICY clientes_owner_delete ON public.clientes AS PERMISSIVE FOR DELETE TO authenticated USING (((SELECT auth.uid()) = user_id));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix068$;
DO $batchfix069$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='clientes') THEN
  DROP POLICY IF EXISTS clientes_owner_insert ON public.clientes; CREATE POLICY clientes_owner_insert ON public.clientes AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (((( SELECT (SELECT auth.uid()) AS uid) = user_id) AND ((empresa_id IS NULL) OR empresa_membro_ativo(empresa_id))));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix069$;
DO $batchfix070$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='clientes') THEN
  DROP POLICY IF EXISTS clientes_owner_select ON public.clientes; CREATE POLICY clientes_owner_select ON public.clientes AS PERMISSIVE FOR SELECT TO authenticated USING (((SELECT auth.uid()) = user_id));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix070$;
DO $batchfix071$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='clientes') THEN
  DROP POLICY IF EXISTS clientes_owner_update ON public.clientes; CREATE POLICY clientes_owner_update ON public.clientes AS PERMISSIVE FOR UPDATE TO authenticated USING ((( SELECT (SELECT auth.uid()) AS uid) = user_id)) WITH CHECK (((( SELECT (SELECT auth.uid()) AS uid) = user_id) AND ((empresa_id IS NULL) OR empresa_membro_ativo(empresa_id))));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix071$;
DO $batchfix072$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='cnaes') THEN
  DROP POLICY IF EXISTS cnaes_write_admin ON public.cnaes; CREATE POLICY cnaes_write_admin ON public.cnaes AS PERMISSIVE FOR ALL TO authenticated USING (has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role)) WITH CHECK (has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix072$;
DO $batchfix073$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='conciliacoes') THEN
  DROP POLICY IF EXISTS conciliacoes_owner_all ON public.conciliacoes; CREATE POLICY conciliacoes_owner_all ON public.conciliacoes AS PERMISSIVE FOR ALL TO authenticated USING (((SELECT auth.uid()) = user_id)) WITH CHECK (((SELECT auth.uid()) = user_id));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix073$;
DO $batchfix074$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='conciliacoes_parciais') THEN
  DROP POLICY IF EXISTS concil_parciais_owner_all ON public.conciliacoes_parciais; CREATE POLICY concil_parciais_owner_all ON public.conciliacoes_parciais AS PERMISSIVE FOR ALL TO authenticated USING (((SELECT auth.uid()) = created_by)) WITH CHECK (((SELECT auth.uid()) = created_by));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix074$;
DO $batchfix075$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='configuracoes_aprovacao') THEN
  DROP POLICY IF EXISTS configuracoes_aprovacao_admin_all ON public.configuracoes_aprovacao; CREATE POLICY configuracoes_aprovacao_admin_all ON public.configuracoes_aprovacao AS PERMISSIVE FOR ALL TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role)) WITH CHECK (has_role((SELECT auth.uid()), 'admin'::app_role));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix075$;
DO $cfgaprvtag$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='configuracoes_aprovacao' AND column_name='empresa_id'
  ) THEN
    DROP POLICY IF EXISTS configuracoes_aprovacao_empresa_select ON public.configuracoes_aprovacao; CREATE POLICY configuracoes_aprovacao_empresa_select ON public.configuracoes_aprovacao AS PERMISSIVE FOR SELECT TO authenticated USING ((empresa_id IN ( SELECT user_empresas.empresa_id
       FROM user_empresas
      WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND (user_empresas.ativo = true)))));
    DROP POLICY IF EXISTS configuracoes_aprovacao_tenant_rw ON public.configuracoes_aprovacao; CREATE POLICY configuracoes_aprovacao_tenant_rw ON public.configuracoes_aprovacao AS PERMISSIVE FOR ALL TO authenticated USING ((has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id))) WITH CHECK ((has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id)));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR undefined_function THEN NULL;
END $cfgaprvtag$;
DO $cfgduptag$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='configuracoes_duplicidade' AND column_name='empresa_id'
  ) THEN
    DROP POLICY IF EXISTS "Empresa-based access" ON public.configuracoes_duplicidade; CREATE POLICY "Empresa-based access" ON public.configuracoes_duplicidade AS PERMISSIVE FOR ALL TO authenticated USING (((empresa_id IN ( SELECT user_empresas.empresa_id
       FROM user_empresas
      WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND (user_empresas.ativo = true)))) OR (EXISTS ( SELECT 1
       FROM user_roles
      WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = 'admin'::app_role))))));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR undefined_function THEN NULL;
END $cfgduptag$;
DO $batchfix076$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='configuracoes_duplicidade') THEN
  DROP POLICY IF EXISTS config_dup_admin_all ON public.configuracoes_duplicidade; CREATE POLICY config_dup_admin_all ON public.configuracoes_duplicidade AS PERMISSIVE FOR ALL TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role)) WITH CHECK (has_role((SELECT auth.uid()), 'admin'::app_role));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix076$;
DO $cfgduprwtag$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='configuracoes_duplicidade' AND column_name='empresa_id'
  ) THEN
    DROP POLICY IF EXISTS configuracoes_duplicidade_tenant_rw ON public.configuracoes_duplicidade; CREATE POLICY configuracoes_duplicidade_tenant_rw ON public.configuracoes_duplicidade AS PERMISSIVE FOR ALL TO authenticated USING ((has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id))) WITH CHECK ((has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id)));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR undefined_function THEN NULL;
END $cfgduprwtag$;
DO $cfgsnaptag$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='conformidade_snapshots' AND column_name='empresa_id'
  ) THEN
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
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR undefined_function THEN NULL;
END $cfgsnaptag$;
DO $cntabantag$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='contas_bancarias' AND column_name='empresa_id'
  ) THEN
    DROP POLICY IF EXISTS contas_bancarias_empresa_select ON public.contas_bancarias; CREATE POLICY contas_bancarias_empresa_select ON public.contas_bancarias AS PERMISSIVE FOR SELECT TO authenticated USING ((empresa_id IN ( SELECT user_empresas.empresa_id
       FROM user_empresas
      WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND (user_empresas.ativo = true)))));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR undefined_function THEN NULL;
END $cntabantag$;
DO $batchfix077$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='contas_pagar') THEN
  DROP POLICY IF EXISTS "Admins can manage contas pagar" ON public.contas_pagar; CREATE POLICY "Admins can manage contas pagar" ON public.contas_pagar AS PERMISSIVE FOR ALL TO authenticated USING ((has_role((SELECT auth.uid()), 'admin'::app_role) OR has_role((SELECT auth.uid()), 'financeiro'::app_role))) WITH CHECK ((has_role((SELECT auth.uid()), 'admin'::app_role) OR has_role((SELECT auth.uid()), 'financeiro'::app_role)));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix077$;
DO $cntapgtag$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='contas_pagar' AND column_name='empresa_id'
  ) THEN
    DROP POLICY IF EXISTS contas_pagar_empresa_select ON public.contas_pagar; CREATE POLICY contas_pagar_empresa_select ON public.contas_pagar AS PERMISSIVE FOR SELECT TO authenticated USING ((empresa_id IN ( SELECT user_empresas.empresa_id
       FROM user_empresas
      WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND (user_empresas.ativo = true)))));
    DROP POLICY IF EXISTS contas_pagar_tenant_rw ON public.contas_pagar; CREATE POLICY contas_pagar_tenant_rw ON public.contas_pagar AS PERMISSIVE FOR ALL TO authenticated USING (((has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) OR has_role(( SELECT (SELECT auth.uid()) AS uid), 'financeiro'::app_role)) AND empresa_acessivel(empresa_id))) WITH CHECK (((has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) OR has_role(( SELECT (SELECT auth.uid()) AS uid), 'financeiro'::app_role)) AND empresa_acessivel(empresa_id)));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR undefined_function THEN NULL;
END $cntapgtag$;
DO $batchfix078$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='contas_receber') THEN
  DROP POLICY IF EXISTS "Admins can manage contas receber" ON public.contas_receber; CREATE POLICY "Admins can manage contas receber" ON public.contas_receber AS PERMISSIVE FOR ALL TO authenticated USING ((has_role((SELECT auth.uid()), 'admin'::app_role) OR has_role((SELECT auth.uid()), 'financeiro'::app_role))) WITH CHECK ((has_role((SELECT auth.uid()), 'admin'::app_role) OR has_role((SELECT auth.uid()), 'financeiro'::app_role)));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix078$;
DO $cntarectag$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='contas_receber' AND column_name='empresa_id'
  ) THEN
    DROP POLICY IF EXISTS contas_receber_empresa_select ON public.contas_receber; CREATE POLICY contas_receber_empresa_select ON public.contas_receber AS PERMISSIVE FOR SELECT TO authenticated USING ((empresa_id IN ( SELECT user_empresas.empresa_id
       FROM user_empresas
      WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND (user_empresas.ativo = true)))));
    DROP POLICY IF EXISTS contas_receber_tenant_rw ON public.contas_receber; CREATE POLICY contas_receber_tenant_rw ON public.contas_receber AS PERMISSIVE FOR ALL TO authenticated USING (((has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) OR has_role(( SELECT (SELECT auth.uid()) AS uid), 'financeiro'::app_role)) AND empresa_acessivel(empresa_id))) WITH CHECK (((has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) OR has_role(( SELECT (SELECT auth.uid()) AS uid), 'financeiro'::app_role)) AND empresa_acessivel(empresa_id)));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR undefined_function THEN NULL;
END $cntarectag$;
DO $contrtag$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='contratos' AND column_name='empresa_id'
  ) THEN
    DROP POLICY IF EXISTS "Empresa-based access" ON public.contratos; CREATE POLICY "Empresa-based access" ON public.contratos AS PERMISSIVE FOR ALL TO authenticated USING (((empresa_id IN ( SELECT user_empresas.empresa_id
       FROM user_empresas
      WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND (user_empresas.ativo = true)))) OR (EXISTS ( SELECT 1
       FROM user_roles
      WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = 'admin'::app_role))))));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR undefined_function THEN NULL;
END $contrtag$;
DO $batchfix079$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='convites') THEN
  DROP POLICY IF EXISTS convites_manage_responsavel ON public.convites; CREATE POLICY convites_manage_responsavel ON public.convites AS PERMISSIVE FOR ALL TO authenticated USING ((is_org_responsavel(organizacao_id, (SELECT auth.uid())) OR has_role((SELECT auth.uid()), 'admin'::app_role))) WITH CHECK (((convidado_por = (SELECT auth.uid())) AND (is_org_responsavel(organizacao_id, (SELECT auth.uid())) OR has_role((SELECT auth.uid()), 'admin'::app_role))));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix079$;
DO $convctag$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='convites_contador' AND column_name='empresa_id'
  ) THEN
    DROP POLICY IF EXISTS convites_contador_revogar ON public.convites_contador; CREATE POLICY convites_contador_revogar ON public.convites_contador AS PERMISSIVE FOR UPDATE TO authenticated USING ((empresa_acessivel(empresa_id) AND (has_role((SELECT auth.uid()), 'admin'::app_role) OR has_role((SELECT auth.uid()), 'financeiro'::app_role)))) WITH CHECK ((empresa_acessivel(empresa_id) AND (has_role((SELECT auth.uid()), 'admin'::app_role) OR has_role((SELECT auth.uid()), 'financeiro'::app_role))));
    DROP POLICY IF EXISTS convites_contador_select ON public.convites_contador; CREATE POLICY convites_contador_select ON public.convites_contador AS PERMISSIVE FOR SELECT TO authenticated USING ((empresa_acessivel(empresa_id) AND (has_role((SELECT auth.uid()), 'admin'::app_role) OR has_role((SELECT auth.uid()), 'financeiro'::app_role))));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR undefined_function THEN NULL;
END $convctag$;
DO $credibtag$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='creditos_tributarios' AND column_name='empresa_id'
  ) THEN
    DROP POLICY IF EXISTS "Access by empresa_id" ON public.creditos_tributarios; CREATE POLICY "Access by empresa_id" ON public.creditos_tributarios AS PERMISSIVE FOR ALL TO authenticated USING (((empresa_id IN ( SELECT user_empresas.empresa_id
       FROM user_empresas
      WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND (user_empresas.ativo = true)))) OR (EXISTS ( SELECT 1
       FROM user_roles
      WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = 'admin'::app_role))))));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR undefined_function THEN NULL;
END $credibtag$;
DO $cronlogtag$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='cron_job_logs'
  ) THEN
    DROP POLICY IF EXISTS "Admins can view cron logs" ON public.cron_job_logs;
    CREATE POLICY "Admins can view cron logs" ON public.cron_job_logs AS PERMISSIVE FOR SELECT TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR undefined_function THEN NULL;
END $cronlogtag$;
DO $cfdeftag$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='custom_field_definitions' AND column_name='empresa_id'
  ) THEN
    DROP POLICY IF EXISTS "Custom field definitions scoped by empresa" ON public.custom_field_definitions; CREATE POLICY "Custom field definitions scoped by empresa" ON public.custom_field_definitions AS PERMISSIVE FOR ALL TO authenticated USING ((has_role((SELECT auth.uid()), 'admin'::app_role) OR (empresa_id IN ( SELECT ue.empresa_id
       FROM user_empresas ue
      WHERE ((ue.user_id = (SELECT auth.uid())) AND (ue.ativo = true)))))) WITH CHECK ((has_role((SELECT auth.uid()), 'admin'::app_role) OR (empresa_id IN ( SELECT ue.empresa_id
       FROM user_empresas ue
      WHERE ((ue.user_id = (SELECT auth.uid())) AND (ue.ativo = true))))));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR undefined_function THEN NULL;
END $cfdeftag$;
DO $batchfix080$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='custom_field_values') THEN
  DROP POLICY IF EXISTS "Custom field values scoped by definition empresa" ON public.custom_field_values; CREATE POLICY "Custom field values scoped by definition empresa" ON public.custom_field_values AS PERMISSIVE FOR ALL TO authenticated USING ((EXISTS ( SELECT 1
     FROM custom_field_definitions d
    WHERE ((d.id = custom_field_values.definition_id) AND (has_role((SELECT auth.uid()), 'admin'::app_role) OR (d.empresa_id IN ( SELECT ue.empresa_id
             FROM user_empresas ue
            WHERE ((ue.user_id = (SELECT auth.uid())) AND (ue.ativo = true))))))))) WITH CHECK ((EXISTS ( SELECT 1
     FROM custom_field_definitions d
    WHERE ((d.id = custom_field_values.definition_id) AND (has_role((SELECT auth.uid()), 'admin'::app_role) OR (d.empresa_id IN ( SELECT ue.empresa_id
             FROM user_empresas ue
            WHERE ((ue.user_id = (SELECT auth.uid())) AND (ue.ativo = true)))))))));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix080$;
DO $batchfix081$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='darfs') THEN
  DROP POLICY IF EXISTS "Admins can manage darfs" ON public.darfs; CREATE POLICY "Admins can manage darfs" ON public.darfs AS PERMISSIVE FOR ALL TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role)) WITH CHECK (has_role((SELECT auth.uid()), 'admin'::app_role));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix081$;
DO $darftag$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='darfs' AND column_name='empresa_id'
  ) THEN
    DROP POLICY IF EXISTS "DARFs scoped by linked empresa" ON public.darfs; CREATE POLICY "DARFs scoped by linked empresa" ON public.darfs AS PERMISSIVE FOR SELECT TO authenticated USING ((has_role((SELECT auth.uid()), 'admin'::app_role) OR (empresa_id IN ( SELECT ue.empresa_id
       FROM user_empresas ue
      WHERE ((ue.user_id = (SELECT auth.uid())) AND (ue.ativo = true)))) OR (alerta_id IN ( SELECT at.id
       FROM alertas_tributarios at
      WHERE (at.empresa_id IN ( SELECT ue.empresa_id
               FROM user_empresas ue
              WHERE ((ue.user_id = (SELECT auth.uid())) AND (ue.ativo = true))))))));
    DROP POLICY IF EXISTS darfs_tenant_rw ON public.darfs; CREATE POLICY darfs_tenant_rw ON public.darfs AS PERMISSIVE FOR ALL TO authenticated USING ((has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id))) WITH CHECK ((has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id)));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR undefined_function THEN NULL;
END $darftag$;
DO $batchfix082$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='digest_envios_log') THEN
  DROP POLICY IF EXISTS "Admins podem consultar o log de envios do digest" ON public.digest_envios_log; CREATE POLICY "Admins podem consultar o log de envios do digest" ON public.digest_envios_log AS PERMISSIVE FOR SELECT TO authenticated USING (has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix082$;
DO $batchfix083$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='dispositivos_conhecidos') THEN
  DROP POLICY IF EXISTS "User-based access" ON public.dispositivos_conhecidos; CREATE POLICY "User-based access" ON public.dispositivos_conhecidos AS PERMISSIVE FOR ALL TO authenticated USING (((user_id = (SELECT auth.uid())) OR (EXISTS ( SELECT 1
     FROM user_roles
    WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = 'admin'::app_role))))));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix083$;
DO $divconctag$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='divergencias_conciliacao' AND column_name='empresa_id'
  ) THEN
    DROP POLICY IF EXISTS "Empresa-based access" ON public.divergencias_conciliacao; CREATE POLICY "Empresa-based access" ON public.divergencias_conciliacao AS PERMISSIVE FOR ALL TO authenticated USING (((empresa_id IN ( SELECT user_empresas.empresa_id
       FROM user_empresas
      WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND (user_empresas.ativo = true)))) OR (EXISTS ( SELECT 1
       FROM user_roles
      WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = 'admin'::app_role))))));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR undefined_function THEN NULL;
END $divconctag$;
DO $batchfix084$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='edge_function_logs') THEN
  DROP POLICY IF EXISTS edge_function_logs_admin_select ON public.edge_function_logs; CREATE POLICY edge_function_logs_admin_select ON public.edge_function_logs AS PERMISSIVE FOR SELECT TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix084$;
DO $eliscredtag$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='elisao_creditos_auditoria' AND column_name='empresa_id'
  ) THEN
    DROP POLICY IF EXISTS creditos_auditoria_delete_admin ON public.elisao_creditos_auditoria; CREATE POLICY creditos_auditoria_delete_admin ON public.elisao_creditos_auditoria AS PERMISSIVE FOR DELETE TO authenticated USING ((has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id)));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR undefined_function THEN NULL;
END $eliscredtag$;
DO $batchfix085$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='elisao_regras_creditos') THEN
  DROP POLICY IF EXISTS elisao_regras_creditos_admin ON public.elisao_regras_creditos; CREATE POLICY elisao_regras_creditos_admin ON public.elisao_regras_creditos AS PERMISSIVE FOR ALL TO authenticated USING ((EXISTS ( SELECT 1
     FROM profiles
    WHERE ((profiles.id = (SELECT auth.uid())) AND (profiles.role = ANY (ARRAY['admin'::text, 'super_admin'::text])))))) WITH CHECK ((EXISTS ( SELECT 1
     FROM profiles
    WHERE ((profiles.id = (SELECT auth.uid())) AND (profiles.role = ANY (ARRAY['admin'::text, 'super_admin'::text]))))));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix085$;
DO $batchfix086$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='elisao_regras_creditos') THEN
  DROP POLICY IF EXISTS regras_creditos_admin ON public.elisao_regras_creditos; CREATE POLICY regras_creditos_admin ON public.elisao_regras_creditos AS PERMISSIVE FOR ALL TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role)) WITH CHECK (has_role((SELECT auth.uid()), 'admin'::app_role));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix086$;
DO $emailvertag$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='email_verifications'
  ) THEN
    DROP POLICY IF EXISTS "Admins can delete verifications" ON public.email_verifications;
    CREATE POLICY "Admins can delete verifications" ON public.email_verifications AS PERMISSIVE FOR DELETE TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role));
    DROP POLICY IF EXISTS "Users can insert own verifications" ON public.email_verifications;
    CREATE POLICY "Users can insert own verifications" ON public.email_verifications AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (((SELECT auth.uid()) = user_id));
    DROP POLICY IF EXISTS "Users can update their verifications" ON public.email_verifications;
    CREATE POLICY "Users can update their verifications" ON public.email_verifications AS PERMISSIVE FOR UPDATE TO authenticated USING ((((SELECT auth.uid()) = user_id) OR has_role((SELECT auth.uid()), 'admin'::app_role)));
    DROP POLICY IF EXISTS "Users can view own verifications" ON public.email_verifications;
    CREATE POLICY "Users can view own verifications" ON public.email_verifications AS PERMISSIVE FOR SELECT TO authenticated USING (((SELECT auth.uid()) = user_id));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR undefined_function THEN NULL;
END $emailvertag$;
DO $batchfix087$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='empresas') THEN
  DROP POLICY IF EXISTS "Operacional+ podem ver empresas" ON public.empresas; CREATE POLICY "Operacional+ podem ver empresas" ON public.empresas AS PERMISSIVE FOR SELECT TO authenticated USING (has_any_role((SELECT auth.uid()), ARRAY['admin'::app_role, 'financeiro'::app_role, 'operacional'::app_role]));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix087$;
DO $batchfix088$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='empresas') THEN
  DROP POLICY IF EXISTS "Owner manage empresas" ON public.empresas; CREATE POLICY "Owner manage empresas" ON public.empresas AS PERMISSIVE FOR ALL TO authenticated USING (((SELECT auth.uid()) = user_id)) WITH CHECK (((SELECT auth.uid()) = user_id));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix088$;
DO $batchfix089$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='empresas_certificados') THEN
  DROP POLICY IF EXISTS cert_admin_all ON public.empresas_certificados; CREATE POLICY cert_admin_all ON public.empresas_certificados AS PERMISSIVE FOR ALL TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role)) WITH CHECK (has_role((SELECT auth.uid()), 'admin'::app_role));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix089$;
DO $empcerttag$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='empresas_certificados' AND column_name='empresa_id'
  ) THEN
    DROP POLICY IF EXISTS cert_empresa_read ON public.empresas_certificados; CREATE POLICY cert_empresa_read ON public.empresas_certificados AS PERMISSIVE FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
       FROM user_empresas ue
      WHERE ((ue.user_id = (SELECT auth.uid())) AND (ue.empresa_id = empresas_certificados.empresa_id)))));
    DROP POLICY IF EXISTS empresas_certificados_tenant_rw ON public.empresas_certificados; CREATE POLICY empresas_certificados_tenant_rw ON public.empresas_certificados AS PERMISSIVE FOR ALL TO authenticated USING ((has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id))) WITH CHECK ((has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id)));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR undefined_function THEN NULL;
END $empcerttag$;
DO $batchfix090$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='entregas_obrigacoes') THEN
  DROP POLICY IF EXISTS entregas_obrigacoes_admin_all ON public.entregas_obrigacoes; CREATE POLICY entregas_obrigacoes_admin_all ON public.entregas_obrigacoes AS PERMISSIVE FOR ALL TO authenticated USING ((EXISTS ( SELECT 1
     FROM profiles p
    WHERE ((p.id = (SELECT auth.uid())) AND (p.role = ANY (ARRAY['admin'::text, 'super_admin'::text]))))));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix090$;
DO $entreobrtag$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='entregas_obrigacoes' AND column_name='empresa_id'
  ) THEN
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
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR undefined_function THEN NULL;
END $entreobrtag$;
DO $batchfix091$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='estrategias_elisao') THEN
  DROP POLICY IF EXISTS estrategias_write_admin ON public.estrategias_elisao; CREATE POLICY estrategias_write_admin ON public.estrategias_elisao AS PERMISSIVE FOR ALL TO authenticated USING (has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role)) WITH CHECK (has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix091$;
DO $batchfix092$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='evidencias_pacotes') THEN
  DROP POLICY IF EXISTS "Evidencias scoped by verificacao" ON public.evidencias_pacotes; CREATE POLICY "Evidencias scoped by verificacao" ON public.evidencias_pacotes AS PERMISSIVE FOR ALL TO authenticated USING ((EXISTS ( SELECT 1
     FROM verificacoes_conformidade vc
    WHERE ((vc.id = evidencias_pacotes.verificacao_id) AND (has_role((SELECT auth.uid()), 'admin'::app_role) OR (vc.empresa_id IN ( SELECT ue.empresa_id
             FROM user_empresas ue
            WHERE ((ue.user_id = (SELECT auth.uid())) AND (ue.ativo = true))))))))) WITH CHECK ((EXISTS ( SELECT 1
     FROM verificacoes_conformidade vc
    WHERE ((vc.id = evidencias_pacotes.verificacao_id) AND (has_role((SELECT auth.uid()), 'admin'::app_role) OR (vc.empresa_id IN ( SELECT ue.empresa_id
             FROM user_empresas ue
            WHERE ((ue.user_id = (SELECT auth.uid())) AND (ue.ativo = true)))))))));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix092$;
DO $batchfix093$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='execucoes_cobranca') THEN
  DROP POLICY IF EXISTS "Owner manage execucoes" ON public.execucoes_cobranca; CREATE POLICY "Owner manage execucoes" ON public.execucoes_cobranca AS PERMISSIVE FOR ALL TO authenticated USING (((SELECT auth.uid()) = user_id)) WITH CHECK (((SELECT auth.uid()) = user_id));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix093$;
DO $execcobrtag$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='execucoes_cobranca' AND column_name='empresa_id'
  ) THEN
    DROP POLICY IF EXISTS execucoes_cobranca_empresa_all ON public.execucoes_cobranca; CREATE POLICY execucoes_cobranca_empresa_all ON public.execucoes_cobranca AS PERMISSIVE FOR ALL TO authenticated USING ((empresa_id IN ( SELECT user_empresas.empresa_id
       FROM user_empresas
      WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND (user_empresas.ativo = true))))) WITH CHECK ((empresa_id IN ( SELECT user_empresas.empresa_id
       FROM user_empresas
      WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND (user_empresas.ativo = true)))));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR undefined_function THEN NULL;
END $execcobrtag$;
DO $batchfix094$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='expert_conversations') THEN
  DROP POLICY IF EXISTS "Users can manage their own conversations" ON public.expert_conversations; CREATE POLICY "Users can manage their own conversations" ON public.expert_conversations AS PERMISSIVE FOR ALL TO authenticated USING (((SELECT auth.uid()) = user_id));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix094$;
DO $batchfix095$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='expert_conversations') THEN
  DROP POLICY IF EXISTS "Usuários veem suas próprias conversas" ON public.expert_conversations; CREATE POLICY "Usuários veem suas próprias conversas" ON public.expert_conversations AS PERMISSIVE FOR ALL TO authenticated USING (((SELECT auth.uid()) = user_id));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix095$;
DO $batchfix096$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='expert_messages') THEN
  DROP POLICY IF EXISTS "Users can insert messages to their conversations" ON public.expert_messages; CREATE POLICY "Users can insert messages to their conversations" ON public.expert_messages AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((EXISTS ( SELECT 1
     FROM expert_conversations
    WHERE ((expert_conversations.id = expert_messages.conversation_id) AND (expert_conversations.user_id = (SELECT auth.uid()))))));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix096$;
DO $batchfix097$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='expert_messages') THEN
  DROP POLICY IF EXISTS "Users can view messages from their conversations" ON public.expert_messages; CREATE POLICY "Users can view messages from their conversations" ON public.expert_messages AS PERMISSIVE FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
     FROM expert_conversations
    WHERE ((expert_conversations.id = expert_messages.conversation_id) AND (expert_conversations.user_id = (SELECT auth.uid()))))));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix097$;
DO $batchfix098$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='expert_messages') THEN
  DROP POLICY IF EXISTS "Usuários veem mensagens de suas conversas" ON public.expert_messages; CREATE POLICY "Usuários veem mensagens de suas conversas" ON public.expert_messages AS PERMISSIVE FOR ALL TO authenticated USING ((EXISTS ( SELECT 1
     FROM expert_conversations
    WHERE ((expert_conversations.id = expert_messages.conversation_id) AND (expert_conversations.user_id = (SELECT auth.uid()))))));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix098$;
DO $batchfix099$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='extrato_bancario') THEN
  DROP POLICY IF EXISTS "Users can manage their own extrato_bancario" ON public.extrato_bancario; CREATE POLICY "Users can manage their own extrato_bancario" ON public.extrato_bancario AS PERMISSIVE FOR ALL TO authenticated USING (((SELECT auth.uid()) = user_id)) WITH CHECK (((SELECT auth.uid()) = user_id));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix099$;
DO $batchfix100$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='extrato_bancario') THEN
  DROP POLICY IF EXISTS extrato_owner_all ON public.extrato_bancario; CREATE POLICY extrato_owner_all ON public.extrato_bancario AS PERMISSIVE FOR ALL TO authenticated USING (((SELECT auth.uid()) = user_id)) WITH CHECK (((SELECT auth.uid()) = user_id));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix100$;
DO $batchfix101$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='faixas_simples_nacional') THEN
  DROP POLICY IF EXISTS faixas_simples_write_admin ON public.faixas_simples_nacional; CREATE POLICY faixas_simples_write_admin ON public.faixas_simples_nacional AS PERMISSIVE FOR ALL TO authenticated USING (has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role)) WITH CHECK (has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix101$;
DO $fatmenstag$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='faturamento_mensal' AND column_name='empresa_id'
  ) THEN
    DROP POLICY IF EXISTS "Empresa-based access" ON public.faturamento_mensal; CREATE POLICY "Empresa-based access" ON public.faturamento_mensal AS PERMISSIVE FOR ALL TO authenticated USING (((empresa_id IN ( SELECT user_empresas.empresa_id
       FROM user_empresas
      WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND (user_empresas.ativo = true)))) OR (EXISTS ( SELECT 1
       FROM user_roles
      WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = 'admin'::app_role))))));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR undefined_function THEN NULL;
END $fatmenstag$;
DO $batchfix102$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='fechamentos_tributarios') THEN
  DROP POLICY IF EXISTS fechamentos_tributarios_all_admin ON public.fechamentos_tributarios; CREATE POLICY fechamentos_tributarios_all_admin ON public.fechamentos_tributarios AS PERMISSIVE FOR ALL TO authenticated USING ((EXISTS ( SELECT 1
     FROM profiles
    WHERE ((profiles.id = (SELECT auth.uid())) AND (profiles.role = ANY (ARRAY['admin'::text, 'super_admin'::text])))))) WITH CHECK ((EXISTS ( SELECT 1
     FROM profiles
    WHERE ((profiles.id = (SELECT auth.uid())) AND (profiles.role = ANY (ARRAY['admin'::text, 'super_admin'::text]))))));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix102$;
DO $batchfix103$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='fechamentos_tributarios') THEN
  DROP POLICY IF EXISTS fechamentos_tributarios_select_own ON public.fechamentos_tributarios; CREATE POLICY fechamentos_tributarios_select_own ON public.fechamentos_tributarios AS PERMISSIVE FOR SELECT TO authenticated USING (((empresa_id IN ( SELECT profiles.empresa_id
     FROM profiles
    WHERE (profiles.id = (SELECT auth.uid())))) OR (EXISTS ( SELECT 1
     FROM profiles
    WHERE ((profiles.id = (SELECT auth.uid())) AND (profiles.role = ANY (ARRAY['admin'::text, 'super_admin'::text])))))));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix103$;
DO $batchfix104$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='feedback_conciliacao_ia') THEN
  DROP POLICY IF EXISTS "User-based access" ON public.feedback_conciliacao_ia; CREATE POLICY "User-based access" ON public.feedback_conciliacao_ia AS PERMISSIVE FOR ALL TO authenticated USING (((user_id = (SELECT auth.uid())) OR (EXISTS ( SELECT 1
     FROM user_roles
    WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = 'admin'::app_role))))));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix104$;
DO $batchfix105$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='feedback_conciliacao_ia') THEN
  DROP POLICY IF EXISTS "Users can manage feedback" ON public.feedback_conciliacao_ia; CREATE POLICY "Users can manage feedback" ON public.feedback_conciliacao_ia AS PERMISSIVE FOR ALL TO authenticated USING (((SELECT auth.uid()) = user_id));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix105$;
DO $batchfix106$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='fila_cobrancas') THEN
  DROP POLICY IF EXISTS "Admins can manage queue" ON public.fila_cobrancas; CREATE POLICY "Admins can manage queue" ON public.fila_cobrancas AS PERMISSIVE FOR ALL TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix106$;
DO $filacobtag$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='fila_cobrancas' AND column_name='empresa_id'
  ) THEN
    DROP POLICY IF EXISTS fila_cobrancas_empresa_select ON public.fila_cobrancas; CREATE POLICY fila_cobrancas_empresa_select ON public.fila_cobrancas AS PERMISSIVE FOR SELECT TO authenticated USING ((empresa_id IN ( SELECT user_empresas.empresa_id
       FROM user_empresas
      WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND (user_empresas.ativo = true)))));
    DROP POLICY IF EXISTS fila_cobrancas_tenant_rw ON public.fila_cobrancas; CREATE POLICY fila_cobrancas_tenant_rw ON public.fila_cobrancas AS PERMISSIVE FOR ALL TO authenticated USING ((has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id))) WITH CHECK ((has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id)));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR undefined_function THEN NULL;
END $filacobtag$;
DO $fluxapvtag$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='fluxos_aprovacao_niveis' AND column_name='empresa_id'
  ) THEN
    DROP POLICY IF EXISTS "Access by empresa_id" ON public.fluxos_aprovacao_niveis; CREATE POLICY "Access by empresa_id" ON public.fluxos_aprovacao_niveis AS PERMISSIVE FOR ALL TO authenticated USING (((empresa_id IN ( SELECT user_empresas.empresa_id
       FROM user_empresas
      WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND (user_empresas.ativo = true)))) OR (EXISTS ( SELECT 1
       FROM user_roles
      WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = 'admin'::app_role))))));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR undefined_function THEN NULL;
END $fluxapvtag$;
DO $folhapgtag$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='folha_pagamento' AND column_name='empresa_id'
  ) THEN
    DROP POLICY IF EXISTS "Empresa-based access" ON public.folha_pagamento; CREATE POLICY "Empresa-based access" ON public.folha_pagamento AS PERMISSIVE FOR ALL TO authenticated USING (((empresa_id IN ( SELECT user_empresas.empresa_id
       FROM user_empresas
      WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND (user_empresas.ativo = true)))) OR (EXISTS ( SELECT 1
       FROM user_roles
      WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = 'admin'::app_role))))));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR undefined_function THEN NULL;
END $folhapgtag$;
DO $formapgtag$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='formas_pagamento' AND column_name='empresa_id'
  ) THEN
    DROP POLICY IF EXISTS "Empresa-based access" ON public.formas_pagamento; CREATE POLICY "Empresa-based access" ON public.formas_pagamento AS PERMISSIVE FOR ALL TO authenticated USING (((empresa_id IN ( SELECT user_empresas.empresa_id
       FROM user_empresas
      WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND (user_empresas.ativo = true)))) OR (EXISTS ( SELECT 1
       FROM user_roles
      WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = 'admin'::app_role))))));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR undefined_function THEN NULL;
END $formapgtag$;
DO $batchfix107$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='fornecedores') THEN
  DROP POLICY IF EXISTS fornecedores_owner_delete ON public.fornecedores; CREATE POLICY fornecedores_owner_delete ON public.fornecedores AS PERMISSIVE FOR DELETE TO authenticated USING (((SELECT auth.uid()) = user_id));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix107$;
DO $batchfix108$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='fornecedores') THEN
  DROP POLICY IF EXISTS fornecedores_owner_insert ON public.fornecedores; CREATE POLICY fornecedores_owner_insert ON public.fornecedores AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (((SELECT auth.uid()) = user_id));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix108$;
DO $batchfix109$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='fornecedores') THEN
  DROP POLICY IF EXISTS fornecedores_owner_select ON public.fornecedores; CREATE POLICY fornecedores_owner_select ON public.fornecedores AS PERMISSIVE FOR SELECT TO authenticated USING (((SELECT auth.uid()) = user_id));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix109$;
DO $batchfix110$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='fornecedores') THEN
  DROP POLICY IF EXISTS fornecedores_owner_update ON public.fornecedores; CREATE POLICY fornecedores_owner_update ON public.fornecedores AS PERMISSIVE FOR UPDATE TO authenticated USING (((SELECT auth.uid()) = user_id)) WITH CHECK (((SELECT auth.uid()) = user_id));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix110$;
DO $batchfix111$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='frontend_error_alert_state') THEN
  DROP POLICY IF EXISTS fe_alert_state_admin_select ON public.frontend_error_alert_state; CREATE POLICY fe_alert_state_admin_select ON public.frontend_error_alert_state AS PERMISSIVE FOR SELECT TO authenticated USING (has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix111$;
DO $batchfix112$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='frontend_error_logs') THEN
  DROP POLICY IF EXISTS "Admins can view frontend errors" ON public.frontend_error_logs; CREATE POLICY "Admins can view frontend errors" ON public.frontend_error_logs AS PERMISSIVE FOR SELECT TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix112$;
DO $batchfix113$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='frontend_error_logs') THEN
  DROP POLICY IF EXISTS frontend_error_user_insert ON public.frontend_error_logs; CREATE POLICY frontend_error_user_insert ON public.frontend_error_logs AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((((SELECT auth.uid()) = user_id) OR (user_id IS NULL)));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix113$;
DO $batchfix114$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='frontend_error_logs_2026_01') THEN
  DROP POLICY IF EXISTS admin_only_frontend_error_logs_2026_01 ON public.frontend_error_logs_2026_01; CREATE POLICY admin_only_frontend_error_logs_2026_01 ON public.frontend_error_logs_2026_01 AS PERMISSIVE FOR ALL TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role)) WITH CHECK (has_role((SELECT auth.uid()), 'admin'::app_role));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix114$;
DO $batchfix115$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='frontend_error_logs_2026_02') THEN
  DROP POLICY IF EXISTS admin_only_frontend_error_logs_2026_02 ON public.frontend_error_logs_2026_02; CREATE POLICY admin_only_frontend_error_logs_2026_02 ON public.frontend_error_logs_2026_02 AS PERMISSIVE FOR ALL TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role)) WITH CHECK (has_role((SELECT auth.uid()), 'admin'::app_role));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix115$;
DO $batchfix116$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='frontend_error_logs_2026_03') THEN
  DROP POLICY IF EXISTS admin_only_frontend_error_logs_2026_03 ON public.frontend_error_logs_2026_03; CREATE POLICY admin_only_frontend_error_logs_2026_03 ON public.frontend_error_logs_2026_03 AS PERMISSIVE FOR ALL TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role)) WITH CHECK (has_role((SELECT auth.uid()), 'admin'::app_role));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix116$;
DO $batchfix117$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='frontend_error_logs_2026_04') THEN
  DROP POLICY IF EXISTS admin_only_frontend_error_logs_2026_04 ON public.frontend_error_logs_2026_04; CREATE POLICY admin_only_frontend_error_logs_2026_04 ON public.frontend_error_logs_2026_04 AS PERMISSIVE FOR ALL TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role)) WITH CHECK (has_role((SELECT auth.uid()), 'admin'::app_role));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix117$;
DO $batchfix118$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='frontend_error_logs_2026_05') THEN
  DROP POLICY IF EXISTS admin_only_frontend_error_logs_2026_05 ON public.frontend_error_logs_2026_05; CREATE POLICY admin_only_frontend_error_logs_2026_05 ON public.frontend_error_logs_2026_05 AS PERMISSIVE FOR ALL TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role)) WITH CHECK (has_role((SELECT auth.uid()), 'admin'::app_role));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix118$;
DO $batchfix119$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='frontend_error_logs_2026_06') THEN
  DROP POLICY IF EXISTS admin_only_frontend_error_logs_2026_06 ON public.frontend_error_logs_2026_06; CREATE POLICY admin_only_frontend_error_logs_2026_06 ON public.frontend_error_logs_2026_06 AS PERMISSIVE FOR ALL TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role)) WITH CHECK (has_role((SELECT auth.uid()), 'admin'::app_role));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix119$;
DO $batchfix120$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='frontend_error_logs_2026_07') THEN
  DROP POLICY IF EXISTS admin_only_frontend_error_logs_2026_07 ON public.frontend_error_logs_2026_07; CREATE POLICY admin_only_frontend_error_logs_2026_07 ON public.frontend_error_logs_2026_07 AS PERMISSIVE FOR ALL TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role)) WITH CHECK (has_role((SELECT auth.uid()), 'admin'::app_role));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix120$;
DO $batchfix121$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='frontend_error_logs_2026_08') THEN
  DROP POLICY IF EXISTS admin_only_frontend_error_logs_2026_08 ON public.frontend_error_logs_2026_08; CREATE POLICY admin_only_frontend_error_logs_2026_08 ON public.frontend_error_logs_2026_08 AS PERMISSIVE FOR ALL TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role)) WITH CHECK (has_role((SELECT auth.uid()), 'admin'::app_role));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix121$;
DO $batchfix122$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='frontend_error_logs_2026_09') THEN
  DROP POLICY IF EXISTS admin_only_frontend_error_logs_2026_09 ON public.frontend_error_logs_2026_09; CREATE POLICY admin_only_frontend_error_logs_2026_09 ON public.frontend_error_logs_2026_09 AS PERMISSIVE FOR ALL TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role)) WITH CHECK (has_role((SELECT auth.uid()), 'admin'::app_role));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix122$;
DO $batchfix123$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='frontend_error_logs_2026_10') THEN
  DROP POLICY IF EXISTS admin_only_frontend_error_logs_2026_10 ON public.frontend_error_logs_2026_10; CREATE POLICY admin_only_frontend_error_logs_2026_10 ON public.frontend_error_logs_2026_10 AS PERMISSIVE FOR ALL TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role)) WITH CHECK (has_role((SELECT auth.uid()), 'admin'::app_role));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix123$;
DO $batchfix124$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='frontend_error_logs_default') THEN
  DROP POLICY IF EXISTS admin_only_frontend_error_logs_default ON public.frontend_error_logs_default; CREATE POLICY admin_only_frontend_error_logs_default ON public.frontend_error_logs_default AS PERMISSIVE FOR ALL TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role)) WITH CHECK (has_role((SELECT auth.uid()), 'admin'::app_role));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix124$;
DO $batchfix125$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='frontend_error_silence_digest_log') THEN
  DROP POLICY IF EXISTS fe_silence_digest_admin_select ON public.frontend_error_silence_digest_log; CREATE POLICY fe_silence_digest_admin_select ON public.frontend_error_silence_digest_log AS PERMISSIVE FOR SELECT TO authenticated USING (has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix125$;
DO $batchfix126$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='frontend_performance_logs') THEN
  DROP POLICY IF EXISTS "Admins can view performance logs" ON public.frontend_performance_logs; CREATE POLICY "Admins can view performance logs" ON public.frontend_performance_logs AS PERMISSIVE FOR SELECT TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix126$;
DO $batchfix127$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='frontend_performance_logs') THEN
  DROP POLICY IF EXISTS "Authenticated users can insert performance logs" ON public.frontend_performance_logs; CREATE POLICY "Authenticated users can insert performance logs" ON public.frontend_performance_logs AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (((SELECT auth.uid()) IS NOT NULL));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix127$;
DO $batchfix128$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='geo_blocks') THEN
  DROP POLICY IF EXISTS "Admins can delete geo blocks" ON public.geo_blocks; CREATE POLICY "Admins can delete geo blocks" ON public.geo_blocks AS PERMISSIVE FOR DELETE TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix128$;
DO $batchfix129$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='geo_blocks') THEN
  DROP POLICY IF EXISTS "Admins can insert geo blocks" ON public.geo_blocks; CREATE POLICY "Admins can insert geo blocks" ON public.geo_blocks AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (has_role((SELECT auth.uid()), 'admin'::app_role));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix129$;
DO $batchfix130$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='geo_blocks') THEN
  DROP POLICY IF EXISTS "Admins can manage geo blocks" ON public.geo_blocks; CREATE POLICY "Admins can manage geo blocks" ON public.geo_blocks AS PERMISSIVE FOR ALL TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix130$;
DO $batchfix131$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='geo_blocks') THEN
  DROP POLICY IF EXISTS "Admins can update geo blocks" ON public.geo_blocks; CREATE POLICY "Admins can update geo blocks" ON public.geo_blocks AS PERMISSIVE FOR UPDATE TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix131$;
DO $batchfix132$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='geo_blocks') THEN
  DROP POLICY IF EXISTS "Managers can view geo blocks" ON public.geo_blocks; CREATE POLICY "Managers can view geo blocks" ON public.geo_blocks AS PERMISSIVE FOR SELECT TO authenticated USING (has_role((SELECT auth.uid()), 'financeiro'::app_role));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix132$;
DO $batchfix133$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='glossario_tributario') THEN
  DROP POLICY IF EXISTS glossario_admin ON public.glossario_tributario; CREATE POLICY glossario_admin ON public.glossario_tributario AS PERMISSIVE FOR ALL TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role)) WITH CHECK (has_role((SELECT auth.uid()), 'admin'::app_role));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix133$;
DO $healthsctag$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='health_scores_operacionais' AND column_name='empresa_id'
  ) THEN
    DROP POLICY IF EXISTS health_scores_empresa_select ON public.health_scores_operacionais; CREATE POLICY health_scores_empresa_select ON public.health_scores_operacionais AS PERMISSIVE FOR SELECT TO authenticated USING ((empresa_id IN ( SELECT user_empresas.empresa_id
       FROM user_empresas
      WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND (user_empresas.ativo = true)))));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR undefined_function THEN NULL;
END $healthsctag$;
DO $batchfix134$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='historico_analises_preditivas') THEN
  DROP POLICY IF EXISTS hap_user_insert ON public.historico_analises_preditivas; CREATE POLICY hap_user_insert ON public.historico_analises_preditivas AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (((SELECT auth.uid()) = user_id));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix134$;
DO $haptag$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='historico_analises_preditivas' AND column_name='empresa_id'
  ) THEN
    DROP POLICY IF EXISTS historico_analises_preditivas_empresa_select ON public.historico_analises_preditivas;
    CREATE POLICY historico_analises_preditivas_empresa_select ON public.historico_analises_preditivas AS PERMISSIVE FOR SELECT TO authenticated USING ((empresa_id IN ( SELECT user_empresas.empresa_id
       FROM user_empresas
      WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND (user_empresas.ativo = true)))));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR undefined_function THEN NULL;
END $haptag$;
DO $histcobtag$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='historico_cobranca' AND column_name='empresa_id'
  ) THEN
    DROP POLICY IF EXISTS historico_cobranca_empresa_all ON public.historico_cobranca; CREATE POLICY historico_cobranca_empresa_all ON public.historico_cobranca AS PERMISSIVE FOR ALL TO authenticated USING ((empresa_id IN ( SELECT user_empresas.empresa_id
       FROM user_empresas
      WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND (user_empresas.ativo = true))))) WITH CHECK ((empresa_id IN ( SELECT user_empresas.empresa_id
       FROM user_empresas
      WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND (user_empresas.ativo = true)))));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR undefined_function THEN NULL;
END $histcobtag$;
DO $histcobwatag$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='historico_cobranca_whatsapp' AND column_name='empresa_id'
  ) THEN
    DROP POLICY IF EXISTS "Empresa-based access" ON public.historico_cobranca_whatsapp; CREATE POLICY "Empresa-based access" ON public.historico_cobranca_whatsapp AS PERMISSIVE FOR ALL TO authenticated USING (((empresa_id IN ( SELECT user_empresas.empresa_id
       FROM user_empresas
      WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND (user_empresas.ativo = true)))) OR (EXISTS ( SELECT 1
       FROM user_roles
      WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = 'admin'::app_role))))));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR undefined_function THEN NULL;
END $histcobwatag$;
DO $batchfix135$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='historico_cobrancas_boletos') THEN
  DROP POLICY IF EXISTS historico_cobrancas_boletos_empresa_select ON public.historico_cobrancas_boletos; CREATE POLICY historico_cobrancas_boletos_empresa_select ON public.historico_cobrancas_boletos AS PERMISSIVE FOR SELECT TO authenticated USING ((conta_receber_id IN ( SELECT contas_receber.id
     FROM contas_receber
    WHERE (contas_receber.empresa_id IN ( SELECT user_empresas.empresa_id
             FROM user_empresas
            WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND (user_empresas.ativo = true)))))));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix135$;
DO $batchfix136$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='historico_cobrancas_boletos') THEN
  DROP POLICY IF EXISTS historico_cobrancas_user_all ON public.historico_cobrancas_boletos; CREATE POLICY historico_cobrancas_user_all ON public.historico_cobrancas_boletos AS PERMISSIVE FOR ALL TO authenticated USING (((SELECT auth.uid()) = user_id)) WITH CHECK (((SELECT auth.uid()) = user_id));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix136$;
DO $batchfix137$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='historico_conciliacao_ia') THEN
  DROP POLICY IF EXISTS historico_conciliacao_ia_role_select ON public.historico_conciliacao_ia; CREATE POLICY historico_conciliacao_ia_role_select ON public.historico_conciliacao_ia AS PERMISSIVE FOR SELECT TO authenticated USING ((has_role((SELECT auth.uid()), 'admin'::app_role) OR has_role((SELECT auth.uid()), 'financeiro'::app_role)));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix137$;
DO $batchfix138$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='historico_conciliacao_ia') THEN
  DROP POLICY IF EXISTS historico_conciliacao_ia_tenant_select ON public.historico_conciliacao_ia; CREATE POLICY historico_conciliacao_ia_tenant_select ON public.historico_conciliacao_ia AS PERMISSIVE FOR SELECT TO authenticated USING (((has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) OR has_role(( SELECT (SELECT auth.uid()) AS uid), 'financeiro'::app_role)) AND ((EXISTS ( SELECT 1
     FROM contas_receber cr
    WHERE ((cr.id = historico_conciliacao_ia.conta_receber_id) AND empresa_acessivel(cr.empresa_id)))) OR (EXISTS ( SELECT 1
     FROM contas_pagar cp
    WHERE ((cp.id = historico_conciliacao_ia.conta_pagar_id) AND empresa_acessivel(cp.empresa_id)))) OR (EXISTS ( SELECT 1
     FROM sessoes_conciliacao s
    WHERE ((s.id = historico_conciliacao_ia.sessao_id) AND ((s.user_id = ( SELECT (SELECT auth.uid()) AS uid)) OR empresa_acessivel(s.empresa_id))))))));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix138$;
DO $batchfix139$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='historico_relatorios') THEN
  DROP POLICY IF EXISTS historico_relatorios_leitura ON public.historico_relatorios; CREATE POLICY historico_relatorios_leitura ON public.historico_relatorios AS PERMISSIVE FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
     FROM relatorios_agendados r
    WHERE ((r.id = historico_relatorios.relatorio_agendado_id) AND ((r.created_by = (SELECT auth.uid())) OR has_role((SELECT auth.uid()), 'admin'::app_role))))));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix139$;
DO $histsctag$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='historico_score_saude' AND column_name='empresa_id'
  ) THEN
    DROP POLICY IF EXISTS historico_score_saude_empresa_select ON public.historico_score_saude; CREATE POLICY historico_score_saude_empresa_select ON public.historico_score_saude AS PERMISSIVE FOR SELECT TO authenticated USING ((empresa_id IN ( SELECT user_empresas.empresa_id
       FROM user_empresas
      WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND (user_empresas.ativo = true)))));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR undefined_function THEN NULL;
END $histsctag$;
DO $batchfix140$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='incentivos_fiscais') THEN
  DROP POLICY IF EXISTS admins_all_incentivos_fiscais ON public.incentivos_fiscais; CREATE POLICY admins_all_incentivos_fiscais ON public.incentivos_fiscais AS PERMISSIVE FOR ALL TO authenticated USING ((((auth.jwt() ->> 'role'::text) = 'service_role'::text) OR ((auth.jwt() ->> 'role'::text) = 'anon'::text) OR (((auth.jwt() ->> 'role'::text) = 'authenticated'::text) AND (((SELECT auth.uid()))::text = (empresa_id)::text))));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix140$;
DO $batchfix141$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='index_usage_snapshots') THEN
  DROP POLICY IF EXISTS "Somente admins leem snapshots de índices" ON public.index_usage_snapshots; CREATE POLICY "Somente admins leem snapshots de índices" ON public.index_usage_snapshots AS PERMISSIVE FOR SELECT TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix141$;
DO $batchfix142$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='indices_uso_excecoes') THEN
  DROP POLICY IF EXISTS "Somente admins gerenciam exceções de índice" ON public.indices_uso_excecoes; CREATE POLICY "Somente admins gerenciam exceções de índice" ON public.indices_uso_excecoes AS PERMISSIVE FOR SELECT TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix142$;
DO $batchfix143$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='integration_secrets') THEN
  DROP POLICY IF EXISTS admin_only_integration_secrets ON public.integration_secrets; CREATE POLICY admin_only_integration_secrets ON public.integration_secrets AS PERMISSIVE FOR ALL TO authenticated USING ((EXISTS ( SELECT 1
     FROM user_roles
    WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = 'admin'::app_role)))));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix143$;
DO $batchfix144$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='integrity_alerts') THEN
  DROP POLICY IF EXISTS integrity_alerts_admin_read ON public.integrity_alerts; CREATE POLICY integrity_alerts_admin_read ON public.integrity_alerts AS PERMISSIVE FOR SELECT TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix144$;
DO $batchfix145$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='ip_whitelist') THEN
  DROP POLICY IF EXISTS "Admins can delete whitelist" ON public.ip_whitelist; CREATE POLICY "Admins can delete whitelist" ON public.ip_whitelist AS PERMISSIVE FOR DELETE TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix145$;
DO $batchfix146$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='ip_whitelist') THEN
  DROP POLICY IF EXISTS "Admins can insert whitelist" ON public.ip_whitelist; CREATE POLICY "Admins can insert whitelist" ON public.ip_whitelist AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (has_role((SELECT auth.uid()), 'admin'::app_role));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix146$;
DO $batchfix147$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='ip_whitelist') THEN
  DROP POLICY IF EXISTS "Admins can manage IP whitelist" ON public.ip_whitelist; CREATE POLICY "Admins can manage IP whitelist" ON public.ip_whitelist AS PERMISSIVE FOR ALL TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix147$;
DO $batchfix148$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='ip_whitelist') THEN
  DROP POLICY IF EXISTS "Admins can update whitelist" ON public.ip_whitelist; CREATE POLICY "Admins can update whitelist" ON public.ip_whitelist AS PERMISSIVE FOR UPDATE TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix148$;
DO $batchfix149$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='ip_whitelist') THEN
  DROP POLICY IF EXISTS "Managers can view IP whitelist" ON public.ip_whitelist; CREATE POLICY "Managers can view IP whitelist" ON public.ip_whitelist AS PERMISSIVE FOR SELECT TO authenticated USING (has_role((SELECT auth.uid()), 'financeiro'::app_role));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix149$;
DO $batchfix150$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='itens_lista_iss') THEN
  DROP POLICY IF EXISTS itens_iss_write_admin ON public.itens_lista_iss; CREATE POLICY itens_iss_write_admin ON public.itens_lista_iss AS PERMISSIVE FOR ALL TO authenticated USING (has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role)) WITH CHECK (has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix150$;
DO $batchfix151$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='itens_pedido_compra') THEN
  DROP POLICY IF EXISTS itens_pedido_compra_empresa_select ON public.itens_pedido_compra; CREATE POLICY itens_pedido_compra_empresa_select ON public.itens_pedido_compra AS PERMISSIVE FOR SELECT TO authenticated USING ((pedido_id IN ( SELECT pedidos_compra.id
     FROM pedidos_compra
    WHERE (pedidos_compra.empresa_id IN ( SELECT user_empresas.empresa_id
             FROM user_empresas
            WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND (user_empresas.ativo = true)))))));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix151$;
DO $lancconttag$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='lancamentos_contabeis' AND column_name='empresa_id'
  ) THEN
    DROP POLICY IF EXISTS "Lancamentos scoped by empresa" ON public.lancamentos_contabeis; CREATE POLICY "Lancamentos scoped by empresa" ON public.lancamentos_contabeis AS PERMISSIVE FOR ALL TO authenticated USING (((user_id = ( SELECT (SELECT auth.uid()) AS uid)) OR has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) OR (empresa_id IN ( SELECT ue.empresa_id
       FROM user_empresas ue
      WHERE ((ue.user_id = ( SELECT (SELECT auth.uid()) AS uid)) AND (ue.ativo = true)))))) WITH CHECK (((user_id = ( SELECT (SELECT auth.uid()) AS uid)) OR has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) OR (empresa_id IN ( SELECT ue.empresa_id
       FROM user_empresas ue
      WHERE ((ue.user_id = ( SELECT (SELECT auth.uid()) AS uid)) AND (ue.ativo = true))))));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR undefined_function THEN NULL;
END $lancconttag$;
DO $batchfix152$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='lancamentos_contabeis') THEN
  DROP POLICY IF EXISTS "Owner manage lancamentos" ON public.lancamentos_contabeis; CREATE POLICY "Owner manage lancamentos" ON public.lancamentos_contabeis AS PERMISSIVE FOR ALL TO authenticated USING (((SELECT auth.uid()) = user_id)) WITH CHECK (((SELECT auth.uid()) = user_id));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix152$;
DO $batchfix153$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='login_attempts') THEN
  DROP POLICY IF EXISTS "Admins can delete login attempts" ON public.login_attempts; CREATE POLICY "Admins can delete login attempts" ON public.login_attempts AS PERMISSIVE FOR DELETE TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix153$;
DO $batchfix154$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='login_attempts') THEN
  DROP POLICY IF EXISTS "Admins can insert login attempts" ON public.login_attempts; CREATE POLICY "Admins can insert login attempts" ON public.login_attempts AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((has_role((SELECT auth.uid()), 'admin'::app_role) OR has_role((SELECT auth.uid()), 'financeiro'::app_role)));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix154$;
DO $batchfix155$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='login_attempts') THEN
  DROP POLICY IF EXISTS "Admins can update login attempts" ON public.login_attempts; CREATE POLICY "Admins can update login attempts" ON public.login_attempts AS PERMISSIVE FOR UPDATE TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role)) WITH CHECK (has_role((SELECT auth.uid()), 'admin'::app_role));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix155$;
DO $batchfix156$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='login_attempts') THEN
  DROP POLICY IF EXISTS "Admins can view login attempts" ON public.login_attempts; CREATE POLICY "Admins can view login attempts" ON public.login_attempts AS PERMISSIVE FOR SELECT TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix156$;
DO $batchfix157$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='logs_baixa_automatica') THEN
  DROP POLICY IF EXISTS "Owner manage logs_baixa" ON public.logs_baixa_automatica; CREATE POLICY "Owner manage logs_baixa" ON public.logs_baixa_automatica AS PERMISSIVE FOR ALL TO authenticated USING (((SELECT auth.uid()) = user_id)) WITH CHECK (((SELECT auth.uid()) = user_id));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix157$;
DO $batchfix158$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='logs_baixa_automatica') THEN
  DROP POLICY IF EXISTS logs_baixa_insert_owner ON public.logs_baixa_automatica; CREATE POLICY logs_baixa_insert_owner ON public.logs_baixa_automatica AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((( SELECT (SELECT auth.uid()) AS uid) = user_id));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix158$;
DO $batchfix159$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='logs_baixa_automatica') THEN
  DROP POLICY IF EXISTS logs_baixa_select_owner ON public.logs_baixa_automatica; CREATE POLICY logs_baixa_select_owner ON public.logs_baixa_automatica AS PERMISSIVE FOR SELECT TO authenticated USING ((( SELECT (SELECT auth.uid()) AS uid) = user_id));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix159$;
DO $batchfix160$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='logs_conciliacao_retroativa') THEN
  DROP POLICY IF EXISTS logs_retro_insert_owner ON public.logs_conciliacao_retroativa; CREATE POLICY logs_retro_insert_owner ON public.logs_conciliacao_retroativa AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((( SELECT (SELECT auth.uid()) AS uid) = user_id));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix160$;
DO $batchfix161$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='logs_conciliacao_retroativa') THEN
  DROP POLICY IF EXISTS logs_retro_owner_all ON public.logs_conciliacao_retroativa; CREATE POLICY logs_retro_owner_all ON public.logs_conciliacao_retroativa AS PERMISSIVE FOR ALL TO authenticated USING (((SELECT auth.uid()) = user_id)) WITH CHECK (((SELECT auth.uid()) = user_id));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix161$;
DO $batchfix162$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='logs_conciliacao_retroativa') THEN
  DROP POLICY IF EXISTS logs_retro_select_owner ON public.logs_conciliacao_retroativa; CREATE POLICY logs_retro_select_owner ON public.logs_conciliacao_retroativa AS PERMISSIVE FOR SELECT TO authenticated USING ((( SELECT (SELECT auth.uid()) AS uid) = user_id));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix162$;
DO $metasfintag$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='metas_financeiras' AND column_name='empresa_id'
  ) THEN
    DROP POLICY IF EXISTS "Empresa-based access" ON public.metas_financeiras; CREATE POLICY "Empresa-based access" ON public.metas_financeiras AS PERMISSIVE FOR ALL TO authenticated USING (((empresa_id IN ( SELECT user_empresas.empresa_id
       FROM user_empresas
      WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND (user_empresas.ativo = true)))) OR (EXISTS ( SELECT 1
       FROM user_roles
      WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = 'admin'::app_role))))));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR undefined_function THEN NULL;
END $metasfintag$;
DO $batchfix163$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='mfa_sessions') THEN
  DROP POLICY IF EXISTS "Users can delete their MFA sessions" ON public.mfa_sessions; CREATE POLICY "Users can delete their MFA sessions" ON public.mfa_sessions AS PERMISSIVE FOR DELETE TO authenticated USING ((((SELECT auth.uid()) = user_id) OR has_role((SELECT auth.uid()), 'admin'::app_role)));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix163$;
DO $batchfix164$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='mfa_sessions') THEN
  DROP POLICY IF EXISTS "Users can insert their MFA sessions" ON public.mfa_sessions; CREATE POLICY "Users can insert their MFA sessions" ON public.mfa_sessions AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (((SELECT auth.uid()) = user_id));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix164$;
DO $batchfix165$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='mfa_sessions') THEN
  DROP POLICY IF EXISTS "Users can manage own MFA sessions" ON public.mfa_sessions; CREATE POLICY "Users can manage own MFA sessions" ON public.mfa_sessions AS PERMISSIVE FOR ALL TO authenticated USING (((SELECT auth.uid()) = user_id)) WITH CHECK (((SELECT auth.uid()) = user_id));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix165$;
DO $batchfix166$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='mfa_sessions') THEN
  DROP POLICY IF EXISTS "Users can update their MFA sessions" ON public.mfa_sessions; CREATE POLICY "Users can update their MFA sessions" ON public.mfa_sessions AS PERMISSIVE FOR UPDATE TO authenticated USING (((SELECT auth.uid()) = user_id));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix166$;
DO $movimtag$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='movimentacoes' AND column_name='empresa_id'
  ) THEN
    DROP POLICY IF EXISTS "Access by empresa_id" ON public.movimentacoes; CREATE POLICY "Access by empresa_id" ON public.movimentacoes AS PERMISSIVE FOR ALL TO authenticated USING (((empresa_id IN ( SELECT user_empresas.empresa_id
       FROM user_empresas
      WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND (user_empresas.ativo = true)))) OR (EXISTS ( SELECT 1
       FROM user_roles
      WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = 'admin'::app_role))))));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR undefined_function THEN NULL;
END $movimtag$;
DO $batchfix167$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='n8n_dispatch_logs') THEN
  DROP POLICY IF EXISTS "Admins e managers visualizam logs n8n" ON public.n8n_dispatch_logs; CREATE POLICY "Admins e managers visualizam logs n8n" ON public.n8n_dispatch_logs AS PERMISSIVE FOR SELECT TO authenticated USING ((has_role((SELECT auth.uid()), 'admin'::app_role) OR has_role((SELECT auth.uid()), 'financeiro'::app_role)));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix167$;
DO $batchfix168$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='n8n_workflow_configs') THEN
  DROP POLICY IF EXISTS "Admins e managers gerenciam configs n8n" ON public.n8n_workflow_configs; CREATE POLICY "Admins e managers gerenciam configs n8n" ON public.n8n_workflow_configs AS PERMISSIVE FOR ALL TO authenticated USING ((has_role((SELECT auth.uid()), 'admin'::app_role) OR has_role((SELECT auth.uid()), 'financeiro'::app_role))) WITH CHECK ((has_role((SELECT auth.uid()), 'admin'::app_role) OR has_role((SELECT auth.uid()), 'financeiro'::app_role)));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix168$;
DO $batchfix169$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='ncms') THEN
  DROP POLICY IF EXISTS ncms_write_admin ON public.ncms; CREATE POLICY ncms_write_admin ON public.ncms AS PERMISSIVE FOR ALL TO authenticated USING (has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role)) WITH CHECK (has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix169$;
DO $batchfix170$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='negativacoes') THEN
  DROP POLICY IF EXISTS "Admins can manage negativacoes" ON public.negativacoes; CREATE POLICY "Admins can manage negativacoes" ON public.negativacoes AS PERMISSIVE FOR ALL TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix170$;
DO $negativtag$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='negativacoes' AND column_name='empresa_id'
  ) THEN
    DROP POLICY IF EXISTS negativacoes_empresa_select ON public.negativacoes; CREATE POLICY negativacoes_empresa_select ON public.negativacoes AS PERMISSIVE FOR SELECT TO authenticated USING ((empresa_id IN ( SELECT user_empresas.empresa_id
       FROM user_empresas
      WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND (user_empresas.ativo = true)))));
    DROP POLICY IF EXISTS negativacoes_tenant_rw ON public.negativacoes; CREATE POLICY negativacoes_tenant_rw ON public.negativacoes AS PERMISSIVE FOR ALL TO authenticated USING ((has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id))) WITH CHECK ((has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id)));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR undefined_function THEN NULL;
END $negativtag$;
DO $batchfix171$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='new_device_alerts') THEN
  DROP POLICY IF EXISTS "Users can delete their device alerts" ON public.new_device_alerts; CREATE POLICY "Users can delete their device alerts" ON public.new_device_alerts AS PERMISSIVE FOR DELETE TO authenticated USING ((((SELECT auth.uid()) = user_id) OR has_role((SELECT auth.uid()), 'admin'::app_role)));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix171$;
DO $batchfix172$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='new_device_alerts') THEN
  DROP POLICY IF EXISTS "Users can insert their device alerts" ON public.new_device_alerts; CREATE POLICY "Users can insert their device alerts" ON public.new_device_alerts AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (((SELECT auth.uid()) = user_id));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix172$;
DO $batchfix173$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='new_device_alerts') THEN
  DROP POLICY IF EXISTS "Users can update their device alerts" ON public.new_device_alerts; CREATE POLICY "Users can update their device alerts" ON public.new_device_alerts AS PERMISSIVE FOR UPDATE TO authenticated USING ((((SELECT auth.uid()) = user_id) OR has_role((SELECT auth.uid()), 'admin'::app_role)));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix173$;
DO $batchfix174$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='new_device_alerts') THEN
  DROP POLICY IF EXISTS "Users can view own device alerts" ON public.new_device_alerts; CREATE POLICY "Users can view own device alerts" ON public.new_device_alerts AS PERMISSIVE FOR SELECT TO authenticated USING (((SELECT auth.uid()) = user_id));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix174$;
DO $batchfix175$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='nfe_eventos') THEN
  DROP POLICY IF EXISTS nfe_ev_read_via_nfe ON public.nfe_eventos; CREATE POLICY nfe_ev_read_via_nfe ON public.nfe_eventos AS PERMISSIVE FOR SELECT TO authenticated USING ((has_role((SELECT auth.uid()), 'admin'::app_role) OR (EXISTS ( SELECT 1
     FROM (nfe_recebidas r
       JOIN user_empresas ue ON ((ue.empresa_id = r.empresa_id)))
    WHERE ((r.chave_acesso = nfe_eventos.chave_acesso) AND (ue.user_id = (SELECT auth.uid())))))));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix175$;
DO $batchfix176$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='nfe_recebidas') THEN
  DROP POLICY IF EXISTS nfe_rec_empresa_read ON public.nfe_recebidas; CREATE POLICY nfe_rec_empresa_read ON public.nfe_recebidas AS PERMISSIVE FOR SELECT TO authenticated USING ((has_role((SELECT auth.uid()), 'admin'::app_role) OR ((empresa_id IS NOT NULL) AND (EXISTS ( SELECT 1
     FROM user_empresas ue
    WHERE ((ue.user_id = (SELECT auth.uid())) AND (ue.empresa_id = nfe_recebidas.empresa_id)))))));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix176$;
DO $batchfix177$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='nfe_recebidas') THEN
  DROP POLICY IF EXISTS nfe_rec_empresa_update ON public.nfe_recebidas; CREATE POLICY nfe_rec_empresa_update ON public.nfe_recebidas AS PERMISSIVE FOR UPDATE TO authenticated USING ((has_role((SELECT auth.uid()), 'admin'::app_role) OR ((empresa_id IS NOT NULL) AND (EXISTS ( SELECT 1
     FROM user_empresas ue
    WHERE ((ue.user_id = (SELECT auth.uid())) AND (ue.empresa_id = nfe_recebidas.empresa_id)))))));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix177$;
DO $notafistag$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='notas_fiscais' AND column_name='empresa_id'
  ) THEN
    DROP POLICY IF EXISTS notas_fiscais_empresa_select ON public.notas_fiscais; CREATE POLICY notas_fiscais_empresa_select ON public.notas_fiscais AS PERMISSIVE FOR SELECT TO authenticated USING ((empresa_id IN ( SELECT user_empresas.empresa_id
       FROM user_empresas
      WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND (user_empresas.ativo = true)))));
    DROP POLICY IF EXISTS notas_fiscais_tenant_delete ON public.notas_fiscais; CREATE POLICY notas_fiscais_tenant_delete ON public.notas_fiscais AS PERMISSIVE FOR DELETE TO authenticated USING ((empresa_membro_ativo(empresa_id) AND (has_role((SELECT auth.uid()), 'admin'::app_role) OR has_role((SELECT auth.uid()), 'financeiro'::app_role))));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR undefined_function THEN NULL;
END $notafistag$;
DO $batchfix178$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='notas_fiscais_ocr') THEN
  DROP POLICY IF EXISTS notas_fiscais_ocr_all_admin ON public.notas_fiscais_ocr; CREATE POLICY notas_fiscais_ocr_all_admin ON public.notas_fiscais_ocr AS PERMISSIVE FOR ALL TO authenticated USING ((EXISTS ( SELECT 1
     FROM profiles
    WHERE ((profiles.id = (SELECT auth.uid())) AND (profiles.role = ANY (ARRAY['admin'::text, 'super_admin'::text])))))) WITH CHECK ((EXISTS ( SELECT 1
     FROM profiles
    WHERE ((profiles.id = (SELECT auth.uid())) AND (profiles.role = ANY (ARRAY['admin'::text, 'super_admin'::text]))))));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix178$;
DO $notaocrtag$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='notas_fiscais_ocr' AND column_name='empresa_id'
  ) THEN
    DROP POLICY IF EXISTS notas_fiscais_ocr_select_own ON public.notas_fiscais_ocr; CREATE POLICY notas_fiscais_ocr_select_own ON public.notas_fiscais_ocr AS PERMISSIVE FOR SELECT TO authenticated USING (((empresa_id IN ( SELECT profiles.empresa_id
       FROM profiles
      WHERE (profiles.id = (SELECT auth.uid())))) OR (EXISTS ( SELECT 1
       FROM profiles
      WHERE ((profiles.id = (SELECT auth.uid())) AND (profiles.role = ANY (ARRAY['admin'::text, 'super_admin'::text])))))));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR undefined_function THEN NULL;
END $notaocrtag$;
DO $batchfix179$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='notification_history') THEN
  DROP POLICY IF EXISTS notification_history_owner ON public.notification_history; CREATE POLICY notification_history_owner ON public.notification_history AS PERMISSIVE FOR ALL TO authenticated USING ((user_id = (SELECT auth.uid()))) WITH CHECK ((user_id = (SELECT auth.uid())));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix179$;
DO $batchfix180$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='open_finance_consents') THEN
  DROP POLICY IF EXISTS "Users can manage their own consents" ON public.open_finance_consents; CREATE POLICY "Users can manage their own consents" ON public.open_finance_consents AS PERMISSIVE FOR ALL TO authenticated USING (((SELECT auth.uid()) = user_id));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix180$;
DO $opttribtag$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='operacoes_tributaveis' AND column_name='empresa_id'
  ) THEN
    DROP POLICY IF EXISTS operacoes_tributaveis_empresa_select ON public.operacoes_tributaveis; CREATE POLICY operacoes_tributaveis_empresa_select ON public.operacoes_tributaveis AS PERMISSIVE FOR SELECT TO authenticated USING ((empresa_id IN ( SELECT user_empresas.empresa_id
       FROM user_empresas
      WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND (user_empresas.ativo = true)))));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR undefined_function THEN NULL;
END $opttribtag$;
DO $batchfix181$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='organizacao_membros') THEN
  DROP POLICY IF EXISTS org_membros_manage_responsavel ON public.organizacao_membros; CREATE POLICY org_membros_manage_responsavel ON public.organizacao_membros AS PERMISSIVE FOR ALL TO authenticated USING ((is_org_responsavel(organizacao_id, (SELECT auth.uid())) OR has_role((SELECT auth.uid()), 'admin'::app_role))) WITH CHECK ((is_org_responsavel(organizacao_id, (SELECT auth.uid())) OR has_role((SELECT auth.uid()), 'admin'::app_role)));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix181$;
DO $batchfix182$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='organizacao_membros') THEN
  DROP POLICY IF EXISTS org_membros_select ON public.organizacao_membros; CREATE POLICY org_membros_select ON public.organizacao_membros AS PERMISSIVE FOR SELECT TO authenticated USING (((usuario_id = (SELECT auth.uid())) OR is_org_membro(organizacao_id, (SELECT auth.uid())) OR is_org_responsavel(organizacao_id, (SELECT auth.uid())) OR has_role((SELECT auth.uid()), 'admin'::app_role)));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix182$;
DO $batchfix183$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='organizacoes') THEN
  DROP POLICY IF EXISTS organizacoes_delete_responsavel ON public.organizacoes; CREATE POLICY organizacoes_delete_responsavel ON public.organizacoes AS PERMISSIVE FOR DELETE TO authenticated USING (((responsavel_id = (SELECT auth.uid())) OR has_role((SELECT auth.uid()), 'admin'::app_role)));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix183$;
DO $batchfix184$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='organizacoes') THEN
  DROP POLICY IF EXISTS organizacoes_insert_proprio ON public.organizacoes; CREATE POLICY organizacoes_insert_proprio ON public.organizacoes AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((responsavel_id = (SELECT auth.uid())));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix184$;
DO $batchfix185$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='organizacoes') THEN
  DROP POLICY IF EXISTS organizacoes_select_membro_ou_admin ON public.organizacoes; CREATE POLICY organizacoes_select_membro_ou_admin ON public.organizacoes AS PERMISSIVE FOR SELECT TO authenticated USING (((responsavel_id = (SELECT auth.uid())) OR is_org_membro(id, (SELECT auth.uid())) OR has_role((SELECT auth.uid()), 'admin'::app_role)));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix185$;
DO $batchfix186$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='organizacoes') THEN
  DROP POLICY IF EXISTS organizacoes_update_responsavel ON public.organizacoes; CREATE POLICY organizacoes_update_responsavel ON public.organizacoes AS PERMISSIVE FOR UPDATE TO authenticated USING (((responsavel_id = (SELECT auth.uid())) OR has_role((SELECT auth.uid()), 'admin'::app_role))) WITH CHECK (((responsavel_id = (SELECT auth.uid())) OR has_role((SELECT auth.uid()), 'admin'::app_role)));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix186$;
DO $batchfix187$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='overlay_rejeicoes_auditoria') THEN
  DROP POLICY IF EXISTS "Gestores atualizam auditoria de overlay" ON public.overlay_rejeicoes_auditoria; CREATE POLICY "Gestores atualizam auditoria de overlay" ON public.overlay_rejeicoes_auditoria AS PERMISSIVE FOR UPDATE TO authenticated USING ((has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) OR has_role(( SELECT (SELECT auth.uid()) AS uid), 'financeiro'::app_role))) WITH CHECK ((has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) OR has_role(( SELECT (SELECT auth.uid()) AS uid), 'financeiro'::app_role)));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix187$;
DO $batchfix188$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='overlay_rejeicoes_auditoria') THEN
  DROP POLICY IF EXISTS "Gestores inserem auditoria de overlay" ON public.overlay_rejeicoes_auditoria; CREATE POLICY "Gestores inserem auditoria de overlay" ON public.overlay_rejeicoes_auditoria AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) OR has_role(( SELECT (SELECT auth.uid()) AS uid), 'financeiro'::app_role)));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix188$;
DO $batchfix189$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='overlay_rejeicoes_auditoria') THEN
  DROP POLICY IF EXISTS "Gestores leem auditoria de overlay" ON public.overlay_rejeicoes_auditoria; CREATE POLICY "Gestores leem auditoria de overlay" ON public.overlay_rejeicoes_auditoria AS PERMISSIVE FOR SELECT TO authenticated USING ((has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) OR has_role(( SELECT (SELECT auth.uid()) AS uid), 'financeiro'::app_role)));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix189$;
DO $batchfix190$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='overlay_rejeicoes_auditoria') THEN
  DROP POLICY IF EXISTS "Gestores removem auditoria de overlay" ON public.overlay_rejeicoes_auditoria; CREATE POLICY "Gestores removem auditoria de overlay" ON public.overlay_rejeicoes_auditoria AS PERMISSIVE FOR DELETE TO authenticated USING ((has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) OR has_role(( SELECT (SELECT auth.uid()) AS uid), 'financeiro'::app_role)));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix190$;
DO $batchfix191$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='parcelas_acordo') THEN
  DROP POLICY IF EXISTS parcelas_acordo_admin_write ON public.parcelas_acordo; CREATE POLICY parcelas_acordo_admin_write ON public.parcelas_acordo AS PERMISSIVE FOR ALL TO authenticated USING ((has_role((SELECT auth.uid()), 'admin'::app_role) OR has_role((SELECT auth.uid()), 'financeiro'::app_role))) WITH CHECK ((has_role((SELECT auth.uid()), 'admin'::app_role) OR has_role((SELECT auth.uid()), 'financeiro'::app_role)));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix191$;
DO $batchfix192$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='parcelas_acordo') THEN
  DROP POLICY IF EXISTS parcelas_acordo_empresa_select ON public.parcelas_acordo; CREATE POLICY parcelas_acordo_empresa_select ON public.parcelas_acordo AS PERMISSIVE FOR SELECT TO authenticated USING ((acordo_id IN ( SELECT a.id
     FROM acordos_parcelamento a
    WHERE (a.empresa_id IN ( SELECT user_empresas.empresa_id
             FROM user_empresas
            WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND (user_empresas.ativo = true)))))));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix192$;
DO $batchfix193$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='parcelas_acordo') THEN
  DROP POLICY IF EXISTS parcelas_acordo_tenant_write ON public.parcelas_acordo; CREATE POLICY parcelas_acordo_tenant_write ON public.parcelas_acordo AS PERMISSIVE FOR ALL TO authenticated USING (((has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) OR has_role(( SELECT (SELECT auth.uid()) AS uid), 'financeiro'::app_role)) AND (EXISTS ( SELECT 1
     FROM acordos_parcelamento a
    WHERE ((a.id = parcelas_acordo.acordo_id) AND empresa_acessivel(a.empresa_id)))))) WITH CHECK (((has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) OR has_role(( SELECT (SELECT auth.uid()) AS uid), 'financeiro'::app_role)) AND (EXISTS ( SELECT 1
     FROM acordos_parcelamento a
    WHERE ((a.id = parcelas_acordo.acordo_id) AND empresa_acessivel(a.empresa_id))))));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix193$;
DO $batchfix194$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='partidas_contabeis') THEN
  DROP POLICY IF EXISTS "Partidas scoped by lancamento" ON public.partidas_contabeis; CREATE POLICY "Partidas scoped by lancamento" ON public.partidas_contabeis AS PERMISSIVE FOR ALL TO authenticated USING ((EXISTS ( SELECT 1
     FROM lancamentos_contabeis lc
    WHERE ((lc.id = partidas_contabeis.lancamento_id) AND ((lc.user_id = (SELECT auth.uid())) OR has_role((SELECT auth.uid()), 'admin'::app_role) OR (lc.empresa_id IN ( SELECT ue.empresa_id
             FROM user_empresas ue
            WHERE ((ue.user_id = (SELECT auth.uid())) AND (ue.ativo = true))))))))) WITH CHECK ((EXISTS ( SELECT 1
     FROM lancamentos_contabeis lc
    WHERE ((lc.id = partidas_contabeis.lancamento_id) AND ((lc.user_id = (SELECT auth.uid())) OR has_role((SELECT auth.uid()), 'admin'::app_role) OR (lc.empresa_id IN ( SELECT ue.empresa_id
             FROM user_empresas ue
            WHERE ((ue.user_id = (SELECT auth.uid())) AND (ue.ativo = true)))))))));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix194$;
DO $batchfix195$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='password_reset_requests') THEN
  DROP POLICY IF EXISTS "Admins and managers can view reset requests" ON public.password_reset_requests; CREATE POLICY "Admins and managers can view reset requests" ON public.password_reset_requests AS PERMISSIVE FOR SELECT TO authenticated USING ((has_role((SELECT auth.uid()), 'admin'::app_role) OR has_role((SELECT auth.uid()), 'financeiro'::app_role)));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix195$;
DO $batchfix196$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='password_reset_requests') THEN
  DROP POLICY IF EXISTS "Admins can update reset requests" ON public.password_reset_requests; CREATE POLICY "Admins can update reset requests" ON public.password_reset_requests AS PERMISSIVE FOR UPDATE TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role)) WITH CHECK (has_role((SELECT auth.uid()), 'admin'::app_role));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix196$;
DO $batchfix197$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='password_reset_requests') THEN
  DROP POLICY IF EXISTS "Users can request own password reset" ON public.password_reset_requests; CREATE POLICY "Users can request own password reset" ON public.password_reset_requests AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((user_email = (( SELECT users.email
     FROM auth.users
    WHERE (users.id = (SELECT auth.uid()))))::text));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix197$;
DO $batchfix198$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='password_reset_tokens') THEN
  DROP POLICY IF EXISTS "Admins can delete reset tokens" ON public.password_reset_tokens; CREATE POLICY "Admins can delete reset tokens" ON public.password_reset_tokens AS PERMISSIVE FOR DELETE TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix198$;
DO $batchfix199$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='password_reset_tokens') THEN
  DROP POLICY IF EXISTS "Authenticated can insert own reset tokens" ON public.password_reset_tokens; CREATE POLICY "Authenticated can insert own reset tokens" ON public.password_reset_tokens AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (((SELECT auth.uid()) = user_id));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix199$;
DO $batchfix200$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='password_reset_tokens') THEN
  DROP POLICY IF EXISTS "Users can select own reset tokens" ON public.password_reset_tokens; CREATE POLICY "Users can select own reset tokens" ON public.password_reset_tokens AS PERMISSIVE FOR SELECT TO authenticated USING (((SELECT auth.uid()) = user_id));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix200$;
DO $batchfix201$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='password_reset_tokens') THEN
  DROP POLICY IF EXISTS "Users can view own reset tokens" ON public.password_reset_tokens; CREATE POLICY "Users can view own reset tokens" ON public.password_reset_tokens AS PERMISSIVE FOR SELECT TO authenticated USING (((SELECT auth.uid()) = user_id));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix201$;
DO $pedcomprtag$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='pedidos_compra' AND column_name='empresa_id'
  ) THEN
    DROP POLICY IF EXISTS pedidos_compra_empresa_select ON public.pedidos_compra; CREATE POLICY pedidos_compra_empresa_select ON public.pedidos_compra AS PERMISSIVE FOR SELECT TO authenticated USING ((empresa_id IN ( SELECT user_empresas.empresa_id
       FROM user_empresas
      WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND (user_empresas.ativo = true)))));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR undefined_function THEN NULL;
END $pedcomprtag$;
DO $batchfix202$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='per_dcomp') THEN
  DROP POLICY IF EXISTS per_dcomp_admin_all ON public.per_dcomp; CREATE POLICY per_dcomp_admin_all ON public.per_dcomp AS PERMISSIVE FOR ALL TO authenticated USING ((EXISTS ( SELECT 1
     FROM profiles p
    WHERE ((p.id = (SELECT auth.uid())) AND (p.role = ANY (ARRAY['admin'::text, 'super_admin'::text]))))));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix202$;
DO $batchfix203$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='performance_alerts') THEN
  DROP POLICY IF EXISTS "Admins podem ler alertas de performance" ON public.performance_alerts; CREATE POLICY "Admins podem ler alertas de performance" ON public.performance_alerts AS PERMISSIVE FOR SELECT TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix203$;
DO $batchfix204$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='permissions') THEN
  DROP POLICY IF EXISTS "Admins can delete permissions" ON public.permissions; CREATE POLICY "Admins can delete permissions" ON public.permissions AS PERMISSIVE FOR DELETE TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix204$;
DO $batchfix205$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='permissions') THEN
  DROP POLICY IF EXISTS "Admins can insert permissions" ON public.permissions; CREATE POLICY "Admins can insert permissions" ON public.permissions AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (has_role((SELECT auth.uid()), 'admin'::app_role));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix205$;
DO $batchfix206$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='permissions') THEN
  DROP POLICY IF EXISTS "Admins can update permissions" ON public.permissions; CREATE POLICY "Admins can update permissions" ON public.permissions AS PERMISSIVE FOR UPDATE TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix206$;
DO $batchfix207$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='permissions') THEN
  DROP POLICY IF EXISTS "Anyone authenticated can view permissions" ON public.permissions; CREATE POLICY "Anyone authenticated can view permissions" ON public.permissions AS PERMISSIVE FOR SELECT TO authenticated USING (((SELECT auth.uid()) IS NOT NULL));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix207$;
DO $batchfix208$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='pg_stat_statements_baseline') THEN
  DROP POLICY IF EXISTS "Admins can view baselines" ON public.pg_stat_statements_baseline; CREATE POLICY "Admins can view baselines" ON public.pg_stat_statements_baseline AS PERMISSIVE FOR SELECT TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix208$;
DO $batchfix209$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='pix_templates') THEN
  DROP POLICY IF EXISTS "Admins can manage pix" ON public.pix_templates; CREATE POLICY "Admins can manage pix" ON public.pix_templates AS PERMISSIVE FOR ALL TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix209$;
DO $pixtmpltag$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='pix_templates' AND column_name='empresa_id'
  ) THEN
    DROP POLICY IF EXISTS pix_templates_empresa_select ON public.pix_templates; CREATE POLICY pix_templates_empresa_select ON public.pix_templates AS PERMISSIVE FOR SELECT TO authenticated USING ((empresa_id IN ( SELECT user_empresas.empresa_id
       FROM user_empresas
      WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND (user_empresas.ativo = true)))));
    DROP POLICY IF EXISTS pix_templates_tenant_rw ON public.pix_templates; CREATE POLICY pix_templates_tenant_rw ON public.pix_templates AS PERMISSIVE FOR ALL TO authenticated USING ((has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id))) WITH CHECK ((has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id)));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR undefined_function THEN NULL;
END $pixtmpltag$;
DO $planconttag$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='plano_contas' AND column_name='empresa_id'
  ) THEN
    DROP POLICY IF EXISTS "Empresa-based access" ON public.plano_contas; CREATE POLICY "Empresa-based access" ON public.plano_contas AS PERMISSIVE FOR ALL TO authenticated USING (((empresa_id IN ( SELECT user_empresas.empresa_id
       FROM user_empresas
      WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND (user_empresas.ativo = true)))) OR (EXISTS ( SELECT 1
       FROM user_roles
      WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = 'admin'::app_role))))));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR undefined_function THEN NULL;
END $planconttag$;
DO $batchfix210$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='planos_acao') THEN
  DROP POLICY IF EXISTS planos_acao_owner ON public.planos_acao; CREATE POLICY planos_acao_owner ON public.planos_acao AS PERMISSIVE FOR ALL TO authenticated USING ((user_id = (SELECT auth.uid()))) WITH CHECK ((user_id = (SELECT auth.uid())));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix210$;
DO $batchfix211$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='portal_cliente_acessos') THEN
  DROP POLICY IF EXISTS portal_acessos_admin_insert ON public.portal_cliente_acessos; CREATE POLICY portal_acessos_admin_insert ON public.portal_cliente_acessos AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (has_role((SELECT auth.uid()), 'admin'::app_role));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix211$;
DO $batchfix212$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='portal_cliente_acessos') THEN
  DROP POLICY IF EXISTS portal_acessos_admin_select ON public.portal_cliente_acessos; CREATE POLICY portal_acessos_admin_select ON public.portal_cliente_acessos AS PERMISSIVE FOR SELECT TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix212$;
DO $batchfix213$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='portal_cliente_tokens') THEN
  DROP POLICY IF EXISTS portal_tokens_admin_all ON public.portal_cliente_tokens; CREATE POLICY portal_tokens_admin_all ON public.portal_cliente_tokens AS PERMISSIVE FOR ALL TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role)) WITH CHECK (has_role((SELECT auth.uid()), 'admin'::app_role));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix213$;
DO $batchfix214$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='prejuizos_fiscais') THEN
  DROP POLICY IF EXISTS prejuizos_fiscais_admin_write ON public.prejuizos_fiscais; CREATE POLICY prejuizos_fiscais_admin_write ON public.prejuizos_fiscais AS PERMISSIVE FOR ALL TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role)) WITH CHECK (has_role((SELECT auth.uid()), 'admin'::app_role));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix214$;
DO $prejfistag$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='prejuizos_fiscais' AND column_name='empresa_id'
  ) THEN
    DROP POLICY IF EXISTS prejuizos_fiscais_empresa_select ON public.prejuizos_fiscais; CREATE POLICY prejuizos_fiscais_empresa_select ON public.prejuizos_fiscais AS PERMISSIVE FOR SELECT TO authenticated USING ((empresa_id IN ( SELECT user_empresas.empresa_id
       FROM user_empresas
      WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND (user_empresas.ativo = true)))));
    DROP POLICY IF EXISTS prejuizos_fiscais_tenant_rw ON public.prejuizos_fiscais; CREATE POLICY prejuizos_fiscais_tenant_rw ON public.prejuizos_fiscais AS PERMISSIVE FOR ALL TO authenticated USING ((has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id))) WITH CHECK ((has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id)));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR undefined_function THEN NULL;
END $prejfistag$;
DO $batchfix215$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='profiles') THEN
  DROP POLICY IF EXISTS "Admins can manage profiles" ON public.profiles; CREATE POLICY "Admins can manage profiles" ON public.profiles AS PERMISSIVE FOR ALL TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role)) WITH CHECK (has_role((SELECT auth.uid()), 'admin'::app_role));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix215$;
DO $batchfix216$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='profiles') THEN
  DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles; CREATE POLICY "Users can update own profile" ON public.profiles AS PERMISSIVE FOR UPDATE TO authenticated USING ((((SELECT auth.uid()) = id) OR ((SELECT auth.uid()) = user_id))) WITH CHECK (((((SELECT auth.uid()) = id) OR ((SELECT auth.uid()) = user_id)) AND profile_sensitive_fields_unchanged(id, user_id, role, empresa_id)));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix216$;
DO $batchfix217$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='profiles') THEN
  DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles; CREATE POLICY "Users can view own profile" ON public.profiles AS PERMISSIVE FOR SELECT TO authenticated USING ((((SELECT auth.uid()) = id) OR ((SELECT auth.uid()) = user_id) OR has_role((SELECT auth.uid()), 'admin'::app_role)));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix217$;
DO $batchfix218$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='protestos') THEN
  DROP POLICY IF EXISTS "Admins can manage protestos" ON public.protestos; CREATE POLICY "Admins can manage protestos" ON public.protestos AS PERMISSIVE FOR ALL TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix218$;
DO $protesttag$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='protestos' AND column_name='empresa_id'
  ) THEN
    DROP POLICY IF EXISTS protestos_empresa_select ON public.protestos; CREATE POLICY protestos_empresa_select ON public.protestos AS PERMISSIVE FOR SELECT TO authenticated USING ((empresa_id IN ( SELECT user_empresas.empresa_id
       FROM user_empresas
      WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND (user_empresas.ativo = true)))));
    DROP POLICY IF EXISTS protestos_tenant_rw ON public.protestos; CREATE POLICY protestos_tenant_rw ON public.protestos AS PERMISSIVE FOR ALL TO authenticated USING ((has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id))) WITH CHECK ((has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id)));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR undefined_function THEN NULL;
END $protesttag$;
DO $batchfix219$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='protocolos_st') THEN
  DROP POLICY IF EXISTS protocolos_st_write_admin ON public.protocolos_st; CREATE POLICY protocolos_st_write_admin ON public.protocolos_st AS PERMISSIVE FOR ALL TO authenticated USING (has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role)) WITH CHECK (has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix219$;
DO $batchfix220$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='protocolos_st_ncms') THEN
  DROP POLICY IF EXISTS protocolos_st_ncms_write_admin ON public.protocolos_st_ncms; CREATE POLICY protocolos_st_ncms_write_admin ON public.protocolos_st_ncms AS PERMISSIVE FOR ALL TO authenticated USING (has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role)) WITH CHECK (has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix220$;
DO $batchfix221$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='protocolos_st_ufs') THEN
  DROP POLICY IF EXISTS protocolos_st_ufs_write_admin ON public.protocolos_st_ufs; CREATE POLICY protocolos_st_ufs_write_admin ON public.protocolos_st_ufs AS PERMISSIVE FOR ALL TO authenticated USING (has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role)) WITH CHECK (has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix221$;
DO $batchfix222$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='push_subscriptions') THEN
  DROP POLICY IF EXISTS push_subscriptions_owner ON public.push_subscriptions; CREATE POLICY push_subscriptions_owner ON public.push_subscriptions AS PERMISSIVE FOR ALL TO authenticated USING ((user_id = (SELECT auth.uid()))) WITH CHECK ((user_id = (SELECT auth.uid())));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix222$;
DO $batchfix223$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='query_telemetry') THEN
  DROP POLICY IF EXISTS "Admins can manage telemetry" ON public.query_telemetry; CREATE POLICY "Admins can manage telemetry" ON public.query_telemetry AS PERMISSIVE FOR ALL TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role)) WITH CHECK (has_role((SELECT auth.uid()), 'admin'::app_role));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix223$;
DO $batchfix224$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='query_telemetry') THEN
  DROP POLICY IF EXISTS "Managers can view telemetry" ON public.query_telemetry; CREATE POLICY "Managers can view telemetry" ON public.query_telemetry AS PERMISSIVE FOR SELECT TO authenticated USING (has_role((SELECT auth.uid()), 'financeiro'::app_role));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix224$;
DO $batchfix225$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='query_telemetry') THEN
  DROP POLICY IF EXISTS "System can insert telemetry" ON public.query_telemetry; CREATE POLICY "System can insert telemetry" ON public.query_telemetry AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((has_role((SELECT auth.uid()), 'admin'::app_role) OR has_role((SELECT auth.uid()), 'financeiro'::app_role) OR has_role((SELECT auth.uid()), 'operacional'::app_role)));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix225$;
DO $batchfix226$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='rate_limit_logs') THEN
  DROP POLICY IF EXISTS "Admins can view rate limit logs" ON public.rate_limit_logs; CREATE POLICY "Admins can view rate limit logs" ON public.rate_limit_logs AS PERMISSIVE FOR SELECT TO authenticated USING ((has_role((SELECT auth.uid()), 'admin'::app_role) OR has_role((SELECT auth.uid()), 'financeiro'::app_role)));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix226$;
DO $batchfix227$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='rate_limit_logs') THEN
  DROP POLICY IF EXISTS "Authenticated can insert rate limit logs" ON public.rate_limit_logs; CREATE POLICY "Authenticated can insert rate limit logs" ON public.rate_limit_logs AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((has_role((SELECT auth.uid()), 'admin'::app_role) OR has_role((SELECT auth.uid()), 'financeiro'::app_role) OR has_role((SELECT auth.uid()), 'operacional'::app_role) OR has_role((SELECT auth.uid()), 'visualizador'::app_role)));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix227$;
DO $recometag$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='recomendacoes_metas_ia' AND column_name='empresa_id'
  ) THEN
    DROP POLICY IF EXISTS recomendacoes_metas_ia_empresa_select ON public.recomendacoes_metas_ia; CREATE POLICY recomendacoes_metas_ia_empresa_select ON public.recomendacoes_metas_ia AS PERMISSIVE FOR SELECT TO authenticated USING ((empresa_id IN ( SELECT user_empresas.empresa_id
       FROM user_empresas
      WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND (user_empresas.ativo = true)))));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR undefined_function THEN NULL;
END $recometag$;
DO $regimeepetag$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='regimes_especiais_empresa' AND column_name='empresa_id'
  ) THEN
    DROP POLICY IF EXISTS "Access by empresa_id" ON public.regimes_especiais_empresa; CREATE POLICY "Access by empresa_id" ON public.regimes_especiais_empresa AS PERMISSIVE FOR ALL TO authenticated USING (((empresa_id IN ( SELECT user_empresas.empresa_id
       FROM user_empresas
      WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND (user_empresas.ativo = true)))) OR (EXISTS ( SELECT 1
       FROM user_roles
      WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = 'admin'::app_role))))));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR undefined_function THEN NULL;
END $regimeepetag$;
DO $regimesimtag$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='regimes_simulados' AND column_name='empresa_id'
  ) THEN
    DROP POLICY IF EXISTS regimes_simulados_empresa_insert ON public.regimes_simulados; CREATE POLICY regimes_simulados_empresa_insert ON public.regimes_simulados AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((empresa_id IN ( SELECT user_empresas.empresa_id
       FROM user_empresas
      WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND (user_empresas.ativo = true)))));
    DROP POLICY IF EXISTS regimes_simulados_empresa_select ON public.regimes_simulados; CREATE POLICY regimes_simulados_empresa_select ON public.regimes_simulados AS PERMISSIVE FOR SELECT TO authenticated USING ((empresa_id IN ( SELECT user_empresas.empresa_id
       FROM user_empresas
      WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND (user_empresas.ativo = true)))));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR undefined_function THEN NULL;
END $regimesimtag$;
DO $regimetribtag$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='regimes_tributarios' AND column_name='empresa_id'
  ) THEN
    DROP POLICY IF EXISTS "Empresa-based access" ON public.regimes_tributarios; CREATE POLICY "Empresa-based access" ON public.regimes_tributarios AS PERMISSIVE FOR ALL TO authenticated USING (((empresa_id IN ( SELECT user_empresas.empresa_id
       FROM user_empresas
      WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND (user_empresas.ativo = true)))) OR (EXISTS ( SELECT 1
       FROM user_roles
      WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = 'admin'::app_role))))));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR undefined_function THEN NULL;
END $regimetribtag$;
DO $regrasconctag$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='regras_conciliacao' AND column_name='empresa_id'
  ) THEN
    DROP POLICY IF EXISTS "Empresa-based access" ON public.regras_conciliacao; CREATE POLICY "Empresa-based access" ON public.regras_conciliacao AS PERMISSIVE FOR ALL TO authenticated USING (((empresa_id IN ( SELECT user_empresas.empresa_id
       FROM user_empresas
      WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND (user_empresas.ativo = true)))) OR (EXISTS ( SELECT 1
       FROM user_roles
      WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = 'admin'::app_role))))));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR undefined_function THEN NULL;
END $regrasconctag$;
DO $regrascontatag$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='regras_contabilizacao_automatica' AND column_name='empresa_id'
  ) THEN
    DROP POLICY IF EXISTS regras_contab_write ON public.regras_contabilizacao_automatica; CREATE POLICY regras_contab_write ON public.regras_contabilizacao_automatica AS PERMISSIVE FOR ALL TO authenticated USING ((empresa_acessivel(empresa_id) AND (has_role((SELECT auth.uid()), 'admin'::app_role) OR has_role((SELECT auth.uid()), 'financeiro'::app_role) OR has_role((SELECT auth.uid()), 'contador'::app_role)))) WITH CHECK ((empresa_acessivel(empresa_id) AND (has_role((SELECT auth.uid()), 'admin'::app_role) OR has_role((SELECT auth.uid()), 'financeiro'::app_role) OR has_role((SELECT auth.uid()), 'contador'::app_role))));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR undefined_function THEN NULL;
END $regrascontatag$;
DO $regrasduptag$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='regras_duplicidade' AND column_name='empresa_id'
  ) THEN
    DROP POLICY IF EXISTS "Empresa-based access" ON public.regras_duplicidade; CREATE POLICY "Empresa-based access" ON public.regras_duplicidade AS PERMISSIVE FOR ALL TO authenticated USING (((empresa_id IN ( SELECT user_empresas.empresa_id
       FROM user_empresas
      WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND (user_empresas.ativo = true)))) OR (EXISTS ( SELECT 1
       FROM user_roles
      WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = 'admin'::app_role))))));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR undefined_function THEN NULL;
END $regrasduptag$;
DO $regrasrotetag$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='regras_roteamento_financeiro' AND column_name='empresa_id'
  ) THEN
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
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR undefined_function THEN NULL;
END $regrasrotetag$;
DO $batchfix228$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='regua_cobranca') THEN
  DROP POLICY IF EXISTS "Admins can manage regua" ON public.regua_cobranca; CREATE POLICY "Admins can manage regua" ON public.regua_cobranca AS PERMISSIVE FOR ALL TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix228$;
DO $reguacobtag$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='regua_cobranca' AND column_name='empresa_id'
  ) THEN
    DROP POLICY IF EXISTS regua_cobranca_empresa_select ON public.regua_cobranca; CREATE POLICY regua_cobranca_empresa_select ON public.regua_cobranca AS PERMISSIVE FOR SELECT TO authenticated USING ((empresa_id IN ( SELECT user_empresas.empresa_id
       FROM user_empresas
      WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND (user_empresas.ativo = true)))));
    DROP POLICY IF EXISTS regua_cobranca_tenant_rw ON public.regua_cobranca; CREATE POLICY regua_cobranca_tenant_rw ON public.regua_cobranca AS PERMISSIVE FOR ALL TO authenticated USING ((has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id))) WITH CHECK ((has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id)));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR undefined_function THEN NULL;
END $reguacobtag$;
DO $batchfix229$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='regua_cobranca_etapas') THEN
  DROP POLICY IF EXISTS "Admins can manage stages" ON public.regua_cobranca_etapas; CREATE POLICY "Admins can manage stages" ON public.regua_cobranca_etapas AS PERMISSIVE FOR ALL TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix229$;
DO $batchfix230$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='regua_cobranca_etapas') THEN
  DROP POLICY IF EXISTS regua_cobranca_etapas_empresa_select ON public.regua_cobranca_etapas; CREATE POLICY regua_cobranca_etapas_empresa_select ON public.regua_cobranca_etapas AS PERMISSIVE FOR SELECT TO authenticated USING ((regua_id IN ( SELECT regua_cobranca.id
     FROM regua_cobranca
    WHERE (regua_cobranca.empresa_id IN ( SELECT user_empresas.empresa_id
             FROM user_empresas
            WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND (user_empresas.ativo = true)))))));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix230$;
DO $batchfix231$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='regua_cobranca_etapas') THEN
  DROP POLICY IF EXISTS regua_cobranca_etapas_tenant_write ON public.regua_cobranca_etapas; CREATE POLICY regua_cobranca_etapas_tenant_write ON public.regua_cobranca_etapas AS PERMISSIVE FOR ALL TO authenticated USING ((has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) AND (EXISTS ( SELECT 1
     FROM regua_cobranca r
    WHERE ((r.id = regua_cobranca_etapas.regua_id) AND empresa_acessivel(r.empresa_id)))))) WITH CHECK ((has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) AND (EXISTS ( SELECT 1
     FROM regua_cobranca r
    WHERE ((r.id = regua_cobranca_etapas.regua_id) AND empresa_acessivel(r.empresa_id))))));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix231$;
DO $reguacobstattag$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='regua_cobranca_status' AND column_name='empresa_id'
  ) THEN
    DROP POLICY IF EXISTS "Access by empresa_id" ON public.regua_cobranca_status; CREATE POLICY "Access by empresa_id" ON public.regua_cobranca_status AS PERMISSIVE FOR ALL TO authenticated USING (((empresa_id IN ( SELECT user_empresas.empresa_id
       FROM user_empresas
      WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND (user_empresas.ativo = true)))) OR (EXISTS ( SELECT 1
       FROM user_roles
      WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = 'admin'::app_role))))));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR undefined_function THEN NULL;
END $reguacobstattag$;
DO $batchfix232$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='relatorios_agendados') THEN
  DROP POLICY IF EXISTS relatorios_agendados_proprios ON public.relatorios_agendados; CREATE POLICY relatorios_agendados_proprios ON public.relatorios_agendados AS PERMISSIVE FOR ALL TO authenticated USING (((created_by = (SELECT auth.uid())) OR has_role((SELECT auth.uid()), 'admin'::app_role))) WITH CHECK (((created_by = (SELECT auth.uid())) OR has_role((SELECT auth.uid()), 'admin'::app_role)));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix232$;
DO $batchfix233$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='relatorios_tributarios_agendados') THEN
  DROP POLICY IF EXISTS relatorios_tributarios_agendados_all_admin ON public.relatorios_tributarios_agendados; CREATE POLICY relatorios_tributarios_agendados_all_admin ON public.relatorios_tributarios_agendados AS PERMISSIVE FOR ALL TO authenticated USING ((EXISTS ( SELECT 1
     FROM profiles
    WHERE ((profiles.id = (SELECT auth.uid())) AND (profiles.role = ANY (ARRAY['admin'::text, 'super_admin'::text])))))) WITH CHECK ((EXISTS ( SELECT 1
     FROM profiles
    WHERE ((profiles.id = (SELECT auth.uid())) AND (profiles.role = ANY (ARRAY['admin'::text, 'super_admin'::text]))))));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix233$;
DO $reltribselecttag$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='relatorios_tributarios_agendados' AND column_name='empresa_id'
  ) THEN
    DROP POLICY IF EXISTS relatorios_tributarios_agendados_select_own ON public.relatorios_tributarios_agendados; CREATE POLICY relatorios_tributarios_agendados_select_own ON public.relatorios_tributarios_agendados AS PERMISSIVE FOR SELECT TO authenticated USING (((empresa_id IN ( SELECT profiles.empresa_id
       FROM profiles
      WHERE (profiles.id = (SELECT auth.uid())))) OR (EXISTS ( SELECT 1
       FROM profiles
      WHERE ((profiles.id = (SELECT auth.uid())) AND (profiles.role = ANY (ARRAY['admin'::text, 'super_admin'::text])))))));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR undefined_function THEN NULL;
END $reltribselecttag$;
DO $resumoexetag$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='resumos_executivos_semanais' AND column_name='empresa_id'
  ) THEN
    DROP POLICY IF EXISTS "Empresa-based access" ON public.resumos_executivos_semanais; CREATE POLICY "Empresa-based access" ON public.resumos_executivos_semanais AS PERMISSIVE FOR ALL TO authenticated USING (((empresa_id IN ( SELECT user_empresas.empresa_id
       FROM user_empresas
      WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND (user_empresas.ativo = true)))) OR (EXISTS ( SELECT 1
       FROM user_roles
      WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = 'admin'::app_role))))));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR undefined_function THEN NULL;
END $resumoexetag$;
DO $batchfix234$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='retencao_politicas') THEN
  DROP POLICY IF EXISTS retencao_politicas_admin_select ON public.retencao_politicas; CREATE POLICY retencao_politicas_admin_select ON public.retencao_politicas AS PERMISSIVE FOR SELECT TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix234$;
DO $retenfonttag$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='retencoes_fonte' AND column_name='empresa_id'
  ) THEN
    DROP POLICY IF EXISTS "Empresa-based access" ON public.retencoes_fonte; CREATE POLICY "Empresa-based access" ON public.retencoes_fonte AS PERMISSIVE FOR ALL TO authenticated USING (((empresa_id IN ( SELECT user_empresas.empresa_id
       FROM user_empresas
      WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND (user_empresas.ativo = true)))) OR (EXISTS ( SELECT 1
       FROM user_roles
      WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = 'admin'::app_role))))));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR undefined_function THEN NULL;
END $retenfonttag$;
DO $batchfix235$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='risk_rules') THEN
  DROP POLICY IF EXISTS "Admins can delete risk rules" ON public.risk_rules; CREATE POLICY "Admins can delete risk rules" ON public.risk_rules AS PERMISSIVE FOR DELETE TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix235$;
DO $batchfix236$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='risk_rules') THEN
  DROP POLICY IF EXISTS "Authorized roles can view risk rules" ON public.risk_rules; CREATE POLICY "Authorized roles can view risk rules" ON public.risk_rules AS PERMISSIVE FOR SELECT TO authenticated USING ((has_role((SELECT auth.uid()), 'admin'::app_role) OR has_role((SELECT auth.uid()), 'financeiro'::app_role) OR has_role((SELECT auth.uid()), 'operacional'::app_role)));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix236$;
DO $batchfix237$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='risk_rules') THEN
  DROP POLICY IF EXISTS "Managers can insert risk rules" ON public.risk_rules; CREATE POLICY "Managers can insert risk rules" ON public.risk_rules AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((has_role((SELECT auth.uid()), 'admin'::app_role) OR has_role((SELECT auth.uid()), 'financeiro'::app_role)));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix237$;
DO $batchfix238$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='risk_rules') THEN
  DROP POLICY IF EXISTS "Managers can update risk rules" ON public.risk_rules; CREATE POLICY "Managers can update risk rules" ON public.risk_rules AS PERMISSIVE FOR UPDATE TO authenticated USING ((has_role((SELECT auth.uid()), 'admin'::app_role) OR has_role((SELECT auth.uid()), 'financeiro'::app_role)));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix238$;
DO $batchfix239$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='risk_rules') THEN
  DROP POLICY IF EXISTS "Viewers can view risk rules" ON public.risk_rules; CREATE POLICY "Viewers can view risk rules" ON public.risk_rules AS PERMISSIVE FOR SELECT TO authenticated USING (has_role((SELECT auth.uid()), 'visualizador'::app_role));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix239$;
DO $batchfix240$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='role_permissions') THEN
  DROP POLICY IF EXISTS "Admins can delete role permissions" ON public.role_permissions; CREATE POLICY "Admins can delete role permissions" ON public.role_permissions AS PERMISSIVE FOR DELETE TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix240$;
DO $batchfix241$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='role_permissions') THEN
  DROP POLICY IF EXISTS "Admins can insert role permissions" ON public.role_permissions; CREATE POLICY "Admins can insert role permissions" ON public.role_permissions AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (has_role((SELECT auth.uid()), 'admin'::app_role));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix241$;
DO $batchfix242$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='role_permissions') THEN
  DROP POLICY IF EXISTS "Admins can manage role_permissions" ON public.role_permissions; CREATE POLICY "Admins can manage role_permissions" ON public.role_permissions AS PERMISSIVE FOR ALL TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix242$;
DO $batchfix243$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='role_permissions') THEN
  DROP POLICY IF EXISTS "Admins can update role permissions" ON public.role_permissions; CREATE POLICY "Admins can update role permissions" ON public.role_permissions AS PERMISSIVE FOR UPDATE TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix243$;
DO $batchfix244$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='role_permissions') THEN
  DROP POLICY IF EXISTS "Anyone authenticated can view role_permissions" ON public.role_permissions; CREATE POLICY "Anyone authenticated can view role_permissions" ON public.role_permissions AS PERMISSIVE FOR SELECT TO authenticated USING (((SELECT auth.uid()) IS NOT NULL));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix244$;
DO $batchfix245$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='rpc_observability_metrics') THEN
  DROP POLICY IF EXISTS admin_read_rpc_metrics ON public.rpc_observability_metrics; CREATE POLICY admin_read_rpc_metrics ON public.rpc_observability_metrics AS PERMISSIVE FOR SELECT TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix245$;
DO $batchfix246$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='runtime_error_logs') THEN
  DROP POLICY IF EXISTS "Admins can delete error logs" ON public.runtime_error_logs; CREATE POLICY "Admins can delete error logs" ON public.runtime_error_logs AS PERMISSIVE FOR DELETE TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix246$;
DO $batchfix247$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='runtime_error_logs') THEN
  DROP POLICY IF EXISTS "Admins can update error logs" ON public.runtime_error_logs; CREATE POLICY "Admins can update error logs" ON public.runtime_error_logs AS PERMISSIVE FOR UPDATE TO authenticated USING ((has_role((SELECT auth.uid()), 'admin'::app_role) OR has_role((SELECT auth.uid()), 'financeiro'::app_role)));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix247$;
DO $batchfix248$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='runtime_error_logs') THEN
  DROP POLICY IF EXISTS "Admins managers can view error logs" ON public.runtime_error_logs; CREATE POLICY "Admins managers can view error logs" ON public.runtime_error_logs AS PERMISSIVE FOR SELECT TO authenticated USING ((has_role((SELECT auth.uid()), 'admin'::app_role) OR has_role((SELECT auth.uid()), 'financeiro'::app_role)));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix248$;
DO $batchfix249$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='runtime_error_logs') THEN
  DROP POLICY IF EXISTS "Authenticated can insert error logs" ON public.runtime_error_logs; CREATE POLICY "Authenticated can insert error logs" ON public.runtime_error_logs AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (((SELECT auth.uid()) IS NOT NULL));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix249$;
DO $batchfix250$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='saved_filter_subscriptions') THEN
  DROP POLICY IF EXISTS saved_filter_subscriptions_owner ON public.saved_filter_subscriptions; CREATE POLICY saved_filter_subscriptions_owner ON public.saved_filter_subscriptions AS PERMISSIVE FOR ALL TO authenticated USING ((user_id = (SELECT auth.uid()))) WITH CHECK ((user_id = (SELECT auth.uid())));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix250$;
DO $batchfix251$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='saved_filters') THEN
  DROP POLICY IF EXISTS saved_filters_admin_all ON public.saved_filters; CREATE POLICY saved_filters_admin_all ON public.saved_filters AS PERMISSIVE FOR ALL TO authenticated USING ((EXISTS ( SELECT 1
     FROM profiles p
    WHERE ((p.id = (SELECT auth.uid())) AND (p.role = ANY (ARRAY['admin'::text, 'super_admin'::text]))))));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix251$;
DO $batchfix252$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='saved_filters') THEN
  DROP POLICY IF EXISTS saved_filters_owner_all ON public.saved_filters; CREATE POLICY saved_filters_owner_all ON public.saved_filters AS PERMISSIVE FOR ALL TO authenticated USING ((user_id = (SELECT auth.uid()))) WITH CHECK ((user_id = (SELECT auth.uid())));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix252$;
DO $batchfix253$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='saved_filters') THEN
  DROP POLICY IF EXISTS saved_filters_owner_write ON public.saved_filters; CREATE POLICY saved_filters_owner_write ON public.saved_filters AS PERMISSIVE FOR ALL TO authenticated USING ((user_id = (SELECT auth.uid()))) WITH CHECK ((user_id = (SELECT auth.uid())));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix253$;
DO $savedfilttag$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='saved_filters' AND column_name='empresa_id'
  ) THEN
    DROP POLICY IF EXISTS saved_filters_select ON public.saved_filters; CREATE POLICY saved_filters_select ON public.saved_filters AS PERMISSIVE FOR SELECT TO authenticated USING (((user_id = (SELECT auth.uid())) OR (is_shared AND (empresa_id IS NOT NULL) AND empresa_acessivel(empresa_id) AND (EXISTS ( SELECT 1
       FROM user_roles ur
      WHERE ((ur.user_id = (SELECT auth.uid())) AND ((ur.role)::text = ANY (saved_filters.shared_with_roles))))))));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR undefined_function THEN NULL;
END $savedfilttag$;
DO $batchfix254$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='scim_operations_log') THEN
  DROP POLICY IF EXISTS scim_operations_log_admin_select ON public.scim_operations_log; CREATE POLICY scim_operations_log_admin_select ON public.scim_operations_log AS PERMISSIVE FOR SELECT TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix254$;
DO $batchfix255$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='scim_tokens') THEN
  DROP POLICY IF EXISTS "Admins manage scim_tokens" ON public.scim_tokens; CREATE POLICY "Admins manage scim_tokens" ON public.scim_tokens AS PERMISSIVE FOR ALL TO authenticated USING ((EXISTS ( SELECT 1
     FROM user_roles
    WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = 'admin'::app_role)))));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix255$;
DO $batchfix256$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='security_alerts') THEN
  DROP POLICY IF EXISTS security_alerts_admin_all ON public.security_alerts; CREATE POLICY security_alerts_admin_all ON public.security_alerts AS PERMISSIVE FOR ALL TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role)) WITH CHECK (has_role((SELECT auth.uid()), 'admin'::app_role));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix256$;
DO $batchfix257$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='security_audit_logs') THEN
  DROP POLICY IF EXISTS "Authenticated users can insert security logs" ON public.security_audit_logs; CREATE POLICY "Authenticated users can insert security logs" ON public.security_audit_logs AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (((SELECT auth.uid()) IS NOT NULL));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix257$;
DO $batchfix258$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='security_audit_logs') THEN
  DROP POLICY IF EXISTS "Only admins can view security logs" ON public.security_audit_logs; CREATE POLICY "Only admins can view security logs" ON public.security_audit_logs AS PERMISSIVE FOR SELECT TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix258$;
DO $batchfix259$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='security_settings') THEN
  DROP POLICY IF EXISTS sec_settings_admin_all ON public.security_settings; CREATE POLICY sec_settings_admin_all ON public.security_settings AS PERMISSIVE FOR ALL TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role)) WITH CHECK (has_role((SELECT auth.uid()), 'admin'::app_role));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix259$;
DO $batchfix260$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='sefaz_dfe_cursor') THEN
  DROP POLICY IF EXISTS cursor_admin_read ON public.sefaz_dfe_cursor; CREATE POLICY cursor_admin_read ON public.sefaz_dfe_cursor AS PERMISSIVE FOR SELECT TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix260$;
DO $batchfix261$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='sessoes_conciliacao') THEN
  DROP POLICY IF EXISTS "Owner manage sessoes" ON public.sessoes_conciliacao; CREATE POLICY "Owner manage sessoes" ON public.sessoes_conciliacao AS PERMISSIVE FOR ALL TO authenticated USING (((SELECT auth.uid()) = user_id)) WITH CHECK (((SELECT auth.uid()) = user_id));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix261$;
DO $batchfix262$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='sessoes_conciliacao') THEN
  DROP POLICY IF EXISTS "Users can manage their own sessoes_conciliacao" ON public.sessoes_conciliacao; CREATE POLICY "Users can manage their own sessoes_conciliacao" ON public.sessoes_conciliacao AS PERMISSIVE FOR ALL TO authenticated USING (((SELECT auth.uid()) = user_id)) WITH CHECK (((SELECT auth.uid()) = user_id));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix262$;
DO $batchfix263$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='slo_metrics_diarias') THEN
  DROP POLICY IF EXISTS slo_metrics_admin_select ON public.slo_metrics_diarias; CREATE POLICY slo_metrics_admin_select ON public.slo_metrics_diarias AS PERMISSIVE FOR SELECT TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix263$;
DO $batchfix264$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='slow_query_alerts') THEN
  DROP POLICY IF EXISTS "Admins podem visualizar slow_query_alerts" ON public.slow_query_alerts; CREATE POLICY "Admins podem visualizar slow_query_alerts" ON public.slow_query_alerts AS PERMISSIVE FOR SELECT TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix264$;
DO $batchfix265$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='solicitacoes_aprovacao') THEN
  DROP POLICY IF EXISTS "Owner manage aprovacoes" ON public.solicitacoes_aprovacao; CREATE POLICY "Owner manage aprovacoes" ON public.solicitacoes_aprovacao AS PERMISSIVE FOR ALL TO authenticated USING (((SELECT auth.uid()) = user_id)) WITH CHECK (((SELECT auth.uid()) = user_id));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix265$;
DO $batchfix266$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='solicitacoes_lgpd') THEN
  DROP POLICY IF EXISTS solicitacoes_lgpd_admin_all ON public.solicitacoes_lgpd; CREATE POLICY solicitacoes_lgpd_admin_all ON public.solicitacoes_lgpd AS PERMISSIVE FOR ALL TO authenticated USING ((EXISTS ( SELECT 1
     FROM profiles p
    WHERE ((p.id = (SELECT auth.uid())) AND (p.role = ANY (ARRAY['admin'::text, 'super_admin'::text]))))));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix266$;
DO $batchfix267$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='solicitacoes_lgpd') THEN
  DROP POLICY IF EXISTS solicitacoes_lgpd_user_insert ON public.solicitacoes_lgpd; CREATE POLICY solicitacoes_lgpd_user_insert ON public.solicitacoes_lgpd AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((user_id = (SELECT auth.uid())));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix267$;
DO $batchfix268$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='solicitacoes_lgpd') THEN
  DROP POLICY IF EXISTS solicitacoes_lgpd_user_select ON public.solicitacoes_lgpd; CREATE POLICY solicitacoes_lgpd_user_select ON public.solicitacoes_lgpd AS PERMISSIVE FOR SELECT TO authenticated USING ((user_id = (SELECT auth.uid())));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix268$;
DO $spedconttag$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='sped_contabil_arquivos' AND column_name='empresa_id'
  ) THEN
    DROP POLICY IF EXISTS sped_arquivos_delete_admin ON public.sped_contabil_arquivos; CREATE POLICY sped_arquivos_delete_admin ON public.sped_contabil_arquivos AS PERMISSIVE FOR DELETE TO authenticated USING ((has_role((SELECT auth.uid()), 'admin'::app_role) AND empresa_acessivel(empresa_id)));
    DROP POLICY IF EXISTS sped_arquivos_update_admin ON public.sped_contabil_arquivos; CREATE POLICY sped_arquivos_update_admin ON public.sped_contabil_arquivos AS PERMISSIVE FOR UPDATE TO authenticated USING ((has_role((SELECT auth.uid()), 'admin'::app_role) AND empresa_acessivel(empresa_id))) WITH CHECK ((has_role((SELECT auth.uid()), 'admin'::app_role) AND empresa_acessivel(empresa_id)));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR undefined_function THEN NULL;
END $spedconttag$;
DO $splitpaytag$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='split_payment_transacoes' AND column_name='empresa_id'
  ) THEN
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
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR undefined_function THEN NULL;
END $splitpaytag$;
DO $batchfix269$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='sso_login_attempts') THEN
  DROP POLICY IF EXISTS "Admins can view SSO login attempts" ON public.sso_login_attempts; CREATE POLICY "Admins can view SSO login attempts" ON public.sso_login_attempts AS PERMISSIVE FOR SELECT TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix269$;
DO $batchfix270$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='sso_providers') THEN
  DROP POLICY IF EXISTS "Admins manage sso providers" ON public.sso_providers; CREATE POLICY "Admins manage sso providers" ON public.sso_providers AS PERMISSIVE FOR ALL TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role)) WITH CHECK (has_role((SELECT auth.uid()), 'admin'::app_role));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix270$;
DO $batchfix271$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='sso_role_mappings') THEN
  DROP POLICY IF EXISTS sso_role_mappings_admin ON public.sso_role_mappings; CREATE POLICY sso_role_mappings_admin ON public.sso_role_mappings AS PERMISSIVE FOR ALL TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role)) WITH CHECK (has_role((SELECT auth.uid()), 'admin'::app_role));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix271$;
DO $batchfix272$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='sso_user_groups') THEN
  DROP POLICY IF EXISTS sso_user_groups_select ON public.sso_user_groups; CREATE POLICY sso_user_groups_select ON public.sso_user_groups AS PERMISSIVE FOR SELECT TO authenticated USING (((user_id = (SELECT auth.uid())) OR has_role((SELECT auth.uid()), 'admin'::app_role)));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix272$;
DO $taxaudittag$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='tax_audit_trail' AND column_name='empresa_id'
  ) THEN
    DROP POLICY IF EXISTS tax_audit_select ON public.tax_audit_trail; CREATE POLICY tax_audit_select ON public.tax_audit_trail AS PERMISSIVE FOR SELECT TO authenticated USING ((has_role((SELECT auth.uid()), 'admin'::app_role) OR ((empresa_id IS NOT NULL) AND empresa_acessivel(empresa_id))));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR undefined_function THEN NULL;
END $taxaudittag$;
DO $batchfix273$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='templates_cobranca') THEN
  DROP POLICY IF EXISTS "Admins can manage templates" ON public.templates_cobranca; CREATE POLICY "Admins can manage templates" ON public.templates_cobranca AS PERMISSIVE FOR ALL TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix273$;
DO $tmplcobtag$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='templates_cobranca' AND column_name='empresa_id'
  ) THEN
    DROP POLICY IF EXISTS templates_cobranca_empresa_select ON public.templates_cobranca; CREATE POLICY templates_cobranca_empresa_select ON public.templates_cobranca AS PERMISSIVE FOR SELECT TO authenticated USING ((empresa_id IN ( SELECT user_empresas.empresa_id
       FROM user_empresas
      WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND (user_empresas.ativo = true)))));
    DROP POLICY IF EXISTS templates_cobranca_tenant_rw ON public.templates_cobranca; CREATE POLICY templates_cobranca_tenant_rw ON public.templates_cobranca AS PERMISSIVE FOR ALL TO authenticated USING ((has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id))) WITH CHECK ((has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id)));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR undefined_function THEN NULL;
END $tmplcobtag$;
DO $batchfix274$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='transacoes_bancarias') THEN
  DROP POLICY IF EXISTS transacoes_bancarias_empresa_select ON public.transacoes_bancarias; CREATE POLICY transacoes_bancarias_empresa_select ON public.transacoes_bancarias AS PERMISSIVE FOR SELECT TO authenticated USING ((conta_bancaria_id IN ( SELECT contas_bancarias.id
     FROM contas_bancarias
    WHERE (contas_bancarias.empresa_id IN ( SELECT user_empresas.empresa_id
             FROM user_empresas
            WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND (user_empresas.ativo = true)))))));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix274$;
DO $transfertag$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='transferencias' AND column_name='empresa_id'
  ) THEN
    DROP POLICY IF EXISTS "Empresa-based access" ON public.transferencias; CREATE POLICY "Empresa-based access" ON public.transferencias AS PERMISSIVE FOR ALL TO authenticated USING (((empresa_id IN ( SELECT user_empresas.empresa_id
       FROM user_empresas
      WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND (user_empresas.ativo = true)))) OR (EXISTS ( SELECT 1
       FROM user_roles
      WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = 'admin'::app_role))))));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR undefined_function THEN NULL;
END $transfertag$;
DO $batchfix275$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='ufs') THEN
  DROP POLICY IF EXISTS admin_all ON public.ufs; CREATE POLICY admin_all ON public.ufs AS PERMISSIVE FOR ALL TO authenticated USING ((EXISTS ( SELECT 1
     FROM user_roles
    WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = 'admin'::app_role)))));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix275$;
DO $batchfix276$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='ufs') THEN
  DROP POLICY IF EXISTS ufs_write_admin ON public.ufs; CREATE POLICY ufs_write_admin ON public.ufs AS PERMISSIVE FOR ALL TO authenticated USING (has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role)) WITH CHECK (has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix276$;
DO $batchfix277$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='user_action_audit') THEN
  DROP POLICY IF EXISTS "Users can insert their own audit logs" ON public.user_action_audit; CREATE POLICY "Users can insert their own audit logs" ON public.user_action_audit AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (((SELECT auth.uid()) = user_id));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix277$;
DO $batchfix278$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='user_action_audit') THEN
  DROP POLICY IF EXISTS "Users can view their own audit logs" ON public.user_action_audit; CREATE POLICY "Users can view their own audit logs" ON public.user_action_audit AS PERMISSIVE FOR SELECT TO authenticated USING (((SELECT auth.uid()) = user_id));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix278$;
DO $batchfix279$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='user_active_filters') THEN
  DROP POLICY IF EXISTS admins_all_user_active_filters ON public.user_active_filters; CREATE POLICY admins_all_user_active_filters ON public.user_active_filters AS PERMISSIVE FOR ALL TO authenticated USING ((EXISTS ( SELECT 1
     FROM profiles p
    WHERE ((p.id = (SELECT auth.uid())) AND (p.role = ANY (ARRAY['admin'::text, 'super_admin'::text]))))));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix279$;
DO $batchfix280$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='user_active_filters') THEN
  DROP POLICY IF EXISTS user_active_filters_owner ON public.user_active_filters; CREATE POLICY user_active_filters_owner ON public.user_active_filters AS PERMISSIVE FOR ALL TO authenticated USING ((user_id = (SELECT auth.uid()))) WITH CHECK ((user_id = (SELECT auth.uid())));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix280$;
DO $batchfix281$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='user_active_filters') THEN
  DROP POLICY IF EXISTS users_own_filters ON public.user_active_filters; CREATE POLICY users_own_filters ON public.user_active_filters AS PERMISSIVE FOR ALL TO authenticated USING ((user_id = (SELECT auth.uid()))) WITH CHECK ((user_id = (SELECT auth.uid())));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix281$;
DO $batchfix282$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='user_anomalia_preferences') THEN
  DROP POLICY IF EXISTS "Users can manage their own preferences" ON public.user_anomalia_preferences; CREATE POLICY "Users can manage their own preferences" ON public.user_anomalia_preferences AS PERMISSIVE FOR ALL TO authenticated USING (((SELECT auth.uid()) = user_id)) WITH CHECK (((SELECT auth.uid()) = user_id));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix282$;
DO $batchfix283$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='user_demonstrativo_preferences') THEN
  DROP POLICY IF EXISTS "Users can manage their own preferences" ON public.user_demonstrativo_preferences; CREATE POLICY "Users can manage their own preferences" ON public.user_demonstrativo_preferences AS PERMISSIVE FOR ALL TO authenticated USING (((SELECT auth.uid()) = user_id)) WITH CHECK (((SELECT auth.uid()) = user_id));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix283$;
DO $batchfix284$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='user_devices') THEN
  DROP POLICY IF EXISTS "Users can delete their devices" ON public.user_devices; CREATE POLICY "Users can delete their devices" ON public.user_devices AS PERMISSIVE FOR DELETE TO authenticated USING ((((SELECT auth.uid()) = user_id) OR has_role((SELECT auth.uid()), 'admin'::app_role)));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix284$;
DO $batchfix285$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='user_devices') THEN
  DROP POLICY IF EXISTS "Users can insert their devices" ON public.user_devices; CREATE POLICY "Users can insert their devices" ON public.user_devices AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (((SELECT auth.uid()) = user_id));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix285$;
DO $batchfix286$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='user_devices') THEN
  DROP POLICY IF EXISTS "Users can manage own devices" ON public.user_devices; CREATE POLICY "Users can manage own devices" ON public.user_devices AS PERMISSIVE FOR ALL TO authenticated USING (((SELECT auth.uid()) = user_id)) WITH CHECK (((SELECT auth.uid()) = user_id));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix286$;
DO $batchfix287$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='user_devices') THEN
  DROP POLICY IF EXISTS "Users can update their devices" ON public.user_devices; CREATE POLICY "Users can update their devices" ON public.user_devices AS PERMISSIVE FOR UPDATE TO authenticated USING ((((SELECT auth.uid()) = user_id) OR has_role((SELECT auth.uid()), 'admin'::app_role)));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix287$;
DO $batchfix288$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='user_devices') THEN
  DROP POLICY IF EXISTS "Users can view own devices" ON public.user_devices; CREATE POLICY "Users can view own devices" ON public.user_devices AS PERMISSIVE FOR SELECT TO authenticated USING (((SELECT auth.uid()) = user_id));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix288$;
DO $batchfix289$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='user_digest_preferences') THEN
  DROP POLICY IF EXISTS "Admins visualizam preferencias de digest" ON public.user_digest_preferences; CREATE POLICY "Admins visualizam preferencias de digest" ON public.user_digest_preferences AS PERMISSIVE FOR SELECT TO authenticated USING (has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix289$;
DO $batchfix290$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='user_digest_preferences') THEN
  DROP POLICY IF EXISTS "Usuarios gerenciam suas preferencias de digest" ON public.user_digest_preferences; CREATE POLICY "Usuarios gerenciam suas preferencias de digest" ON public.user_digest_preferences AS PERMISSIVE FOR ALL TO authenticated USING ((( SELECT (SELECT auth.uid()) AS uid) = user_id)) WITH CHECK ((( SELECT (SELECT auth.uid()) AS uid) = user_id));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix290$;
DO $batchfix291$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='user_digest_preferences') THEN
  DROP POLICY IF EXISTS user_digest_prefs_all ON public.user_digest_preferences; CREATE POLICY user_digest_prefs_all ON public.user_digest_preferences AS PERMISSIVE FOR ALL TO authenticated USING (((SELECT auth.uid()) = user_id)) WITH CHECK (((SELECT auth.uid()) = user_id));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix291$;
DO $batchfix292$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='user_empresas') THEN
  DROP POLICY IF EXISTS "Admins manage user_empresas" ON public.user_empresas; CREATE POLICY "Admins manage user_empresas" ON public.user_empresas AS PERMISSIVE FOR ALL TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role)) WITH CHECK (has_role((SELECT auth.uid()), 'admin'::app_role));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix292$;
DO $batchfix293$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='user_empresas') THEN
  DROP POLICY IF EXISTS "Users view own empresa links" ON public.user_empresas; CREATE POLICY "Users view own empresa links" ON public.user_empresas AS PERMISSIVE FOR SELECT TO authenticated USING ((((SELECT auth.uid()) = user_id) OR has_role((SELECT auth.uid()), 'admin'::app_role)));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix293$;
DO $batchfix294$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='user_filter_presets') THEN
  DROP POLICY IF EXISTS "Users can manage their presets" ON public.user_filter_presets; CREATE POLICY "Users can manage their presets" ON public.user_filter_presets AS PERMISSIVE FOR ALL TO authenticated USING (((SELECT auth.uid()) = user_id));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix294$;
DO $batchfix295$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='user_filter_presets') THEN
  DROP POLICY IF EXISTS users_own_presets ON public.user_filter_presets; CREATE POLICY users_own_presets ON public.user_filter_presets AS PERMISSIVE FOR ALL TO authenticated USING (((user_id = (SELECT auth.uid())) OR true));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix295$;
DO $batchfix296$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='user_onboarding_progress') THEN
  DROP POLICY IF EXISTS "Users can insert their own onboarding progress" ON public.user_onboarding_progress; CREATE POLICY "Users can insert their own onboarding progress" ON public.user_onboarding_progress AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (((SELECT auth.uid()) = user_id));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix296$;
DO $batchfix297$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='user_onboarding_progress') THEN
  DROP POLICY IF EXISTS "Users can update their own onboarding progress" ON public.user_onboarding_progress; CREATE POLICY "Users can update their own onboarding progress" ON public.user_onboarding_progress AS PERMISSIVE FOR UPDATE TO authenticated USING (((SELECT auth.uid()) = user_id));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix297$;
DO $batchfix298$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='user_onboarding_progress') THEN
  DROP POLICY IF EXISTS "Users can view their own onboarding progress" ON public.user_onboarding_progress; CREATE POLICY "Users can view their own onboarding progress" ON public.user_onboarding_progress AS PERMISSIVE FOR SELECT TO authenticated USING (((SELECT auth.uid()) = user_id));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix298$;
DO $batchfix299$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='user_passkeys') THEN
  DROP POLICY IF EXISTS "Users can delete own passkeys" ON public.user_passkeys; CREATE POLICY "Users can delete own passkeys" ON public.user_passkeys AS PERMISSIVE FOR DELETE TO authenticated USING (((SELECT auth.uid()) = user_id));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix299$;
DO $batchfix300$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='user_passkeys') THEN
  DROP POLICY IF EXISTS "Users can delete their passkeys" ON public.user_passkeys; CREATE POLICY "Users can delete their passkeys" ON public.user_passkeys AS PERMISSIVE FOR DELETE TO authenticated USING ((((SELECT auth.uid()) = user_id) OR has_role((SELECT auth.uid()), 'admin'::app_role)));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix300$;
DO $batchfix301$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='user_passkeys') THEN
  DROP POLICY IF EXISTS "Users can insert own passkeys" ON public.user_passkeys; CREATE POLICY "Users can insert own passkeys" ON public.user_passkeys AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (((SELECT auth.uid()) = user_id));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix301$;
DO $batchfix302$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='user_passkeys') THEN
  DROP POLICY IF EXISTS "Users can insert their passkeys" ON public.user_passkeys; CREATE POLICY "Users can insert their passkeys" ON public.user_passkeys AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (((SELECT auth.uid()) = user_id));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix302$;
DO $batchfix303$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='user_passkeys') THEN
  DROP POLICY IF EXISTS "Users can update own passkeys" ON public.user_passkeys; CREATE POLICY "Users can update own passkeys" ON public.user_passkeys AS PERMISSIVE FOR UPDATE TO authenticated USING (((SELECT auth.uid()) = user_id)) WITH CHECK (((SELECT auth.uid()) = user_id));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix303$;
DO $batchfix304$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='user_passkeys') THEN
  DROP POLICY IF EXISTS "Users can update their passkeys" ON public.user_passkeys; CREATE POLICY "Users can update their passkeys" ON public.user_passkeys AS PERMISSIVE FOR UPDATE TO authenticated USING (((SELECT auth.uid()) = user_id));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix304$;
DO $batchfix305$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='user_passkeys') THEN
  DROP POLICY IF EXISTS "Users can view own passkeys" ON public.user_passkeys; CREATE POLICY "Users can view own passkeys" ON public.user_passkeys AS PERMISSIVE FOR SELECT TO authenticated USING (((SELECT auth.uid()) = user_id));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix305$;
DO $batchfix306$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='user_roles') THEN
  DROP POLICY IF EXISTS "Admins can delete user roles" ON public.user_roles; CREATE POLICY "Admins can delete user roles" ON public.user_roles AS PERMISSIVE FOR DELETE TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix306$;
DO $batchfix307$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='user_roles') THEN
  DROP POLICY IF EXISTS "Admins can insert user roles" ON public.user_roles; CREATE POLICY "Admins can insert user roles" ON public.user_roles AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (has_role((SELECT auth.uid()), 'admin'::app_role));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix307$;
DO $batchfix308$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='user_roles') THEN
  DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles; CREATE POLICY "Admins can manage all roles" ON public.user_roles AS PERMISSIVE FOR ALL TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role)) WITH CHECK (has_role((SELECT auth.uid()), 'admin'::app_role));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix308$;
DO $batchfix309$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='user_roles') THEN
  DROP POLICY IF EXISTS "Admins can update user roles" ON public.user_roles; CREATE POLICY "Admins can update user roles" ON public.user_roles AS PERMISSIVE FOR UPDATE TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix309$;
DO $batchfix310$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='user_roles') THEN
  DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles; CREATE POLICY "Users can view own roles" ON public.user_roles AS PERMISSIVE FOR SELECT TO authenticated USING ((((SELECT auth.uid()) = user_id) OR has_role((SELECT auth.uid()), 'admin'::app_role)));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix310$;
DO $batchfix311$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='user_sessions') THEN
  DROP POLICY IF EXISTS "Users see own sessions" ON public.user_sessions; CREATE POLICY "Users see own sessions" ON public.user_sessions AS PERMISSIVE FOR SELECT TO authenticated USING (((SELECT auth.uid()) = user_id));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix311$;
DO $vendedtag$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='vendedores' AND column_name='empresa_id'
  ) THEN
    DROP POLICY IF EXISTS "Empresa-based access" ON public.vendedores; CREATE POLICY "Empresa-based access" ON public.vendedores AS PERMISSIVE FOR ALL TO authenticated USING (((empresa_id IN ( SELECT user_empresas.empresa_id
       FROM user_empresas
      WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND (user_empresas.ativo = true)))) OR (EXISTS ( SELECT 1
       FROM user_roles
      WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = 'admin'::app_role))))));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR undefined_function THEN NULL;
END $vendedtag$;
DO $verifconftag$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='verificacoes_conformidade' AND column_name='empresa_id'
  ) THEN
    DROP POLICY IF EXISTS "Access by empresa_id" ON public.verificacoes_conformidade; CREATE POLICY "Access by empresa_id" ON public.verificacoes_conformidade AS PERMISSIVE FOR ALL TO authenticated USING (((empresa_id IN ( SELECT user_empresas.empresa_id
       FROM user_empresas
      WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND (user_empresas.ativo = true)))) OR (EXISTS ( SELECT 1
       FROM user_roles
      WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = 'admin'::app_role))))));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR undefined_function THEN NULL;
END $verifconftag$;
DO $batchfix312$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='webauthn_challenges') THEN
  DROP POLICY IF EXISTS "Authenticated can create challenges" ON public.webauthn_challenges; CREATE POLICY "Authenticated can create challenges" ON public.webauthn_challenges AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (((SELECT auth.uid()) = user_id));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix312$;
DO $batchfix313$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='webauthn_challenges') THEN
  DROP POLICY IF EXISTS "Authenticated can read own challenges" ON public.webauthn_challenges; CREATE POLICY "Authenticated can read own challenges" ON public.webauthn_challenges AS PERMISSIVE FOR SELECT TO authenticated USING ((((SELECT auth.uid()) = user_id) OR has_role((SELECT auth.uid()), 'admin'::app_role)));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix313$;
DO $batchfix314$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='webauthn_challenges') THEN
  DROP POLICY IF EXISTS "Users can delete their challenges" ON public.webauthn_challenges; CREATE POLICY "Users can delete their challenges" ON public.webauthn_challenges AS PERMISSIVE FOR DELETE TO authenticated USING ((((SELECT auth.uid()) = user_id) OR has_role((SELECT auth.uid()), 'admin'::app_role)));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix314$;
DO $batchfix315$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='webauthn_challenges') THEN
  DROP POLICY IF EXISTS "Users can insert their challenges" ON public.webauthn_challenges; CREATE POLICY "Users can insert their challenges" ON public.webauthn_challenges AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (((SELECT auth.uid()) = user_id));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix315$;
DO $batchfix316$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='webauthn_challenges') THEN
  DROP POLICY IF EXISTS "Users can update their challenges" ON public.webauthn_challenges; CREATE POLICY "Users can update their challenges" ON public.webauthn_challenges AS PERMISSIVE FOR UPDATE TO authenticated USING ((( SELECT (SELECT auth.uid()) AS uid) = user_id));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix316$;
DO $batchfix317$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='webauthn_credentials') THEN
  DROP POLICY IF EXISTS "users manage own webauthn" ON public.webauthn_credentials; CREATE POLICY "users manage own webauthn" ON public.webauthn_credentials AS PERMISSIVE FOR ALL TO authenticated USING (((SELECT auth.uid()) = user_id)) WITH CHECK (((SELECT auth.uid()) = user_id));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix317$;
DO $batchfix318$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='webhook_dlq') THEN
  DROP POLICY IF EXISTS "Admins podem atualizar DLQ" ON public.webhook_dlq; CREATE POLICY "Admins podem atualizar DLQ" ON public.webhook_dlq AS PERMISSIVE FOR UPDATE TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role)) WITH CHECK (has_role((SELECT auth.uid()), 'admin'::app_role));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix318$;
DO $batchfix319$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='webhook_dlq') THEN
  DROP POLICY IF EXISTS "Admins podem visualizar DLQ" ON public.webhook_dlq; CREATE POLICY "Admins podem visualizar DLQ" ON public.webhook_dlq AS PERMISSIVE FOR SELECT TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix319$;
DO $batchfix320$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='webhook_events') THEN
  DROP POLICY IF EXISTS "Admins can delete events" ON public.webhook_events; CREATE POLICY "Admins can delete events" ON public.webhook_events AS PERMISSIVE FOR DELETE TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix320$;
DO $batchfix321$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='webhook_events') THEN
  DROP POLICY IF EXISTS "Authorized roles can view webhook events" ON public.webhook_events; CREATE POLICY "Authorized roles can view webhook events" ON public.webhook_events AS PERMISSIVE FOR SELECT TO authenticated USING ((has_role((SELECT auth.uid()), 'admin'::app_role) OR has_role((SELECT auth.uid()), 'financeiro'::app_role)));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix321$;
DO $batchfix322$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='webhook_events') THEN
  DROP POLICY IF EXISTS "Authorized roles can view webhooks" ON public.webhook_events; CREATE POLICY "Authorized roles can view webhooks" ON public.webhook_events AS PERMISSIVE FOR SELECT TO authenticated USING ((has_role((SELECT auth.uid()), 'admin'::app_role) OR has_role((SELECT auth.uid()), 'financeiro'::app_role)));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix322$;
DO $batchfix323$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='webhook_events') THEN
  DROP POLICY IF EXISTS "Managers can update events" ON public.webhook_events; CREATE POLICY "Managers can update events" ON public.webhook_events AS PERMISSIVE FOR UPDATE TO authenticated USING ((has_role((SELECT auth.uid()), 'admin'::app_role) OR has_role((SELECT auth.uid()), 'financeiro'::app_role)));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix323$;
DO $batchfix324$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='webhook_events') THEN
  DROP POLICY IF EXISTS "Operators can insert events" ON public.webhook_events; CREATE POLICY "Operators can insert events" ON public.webhook_events AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((has_role((SELECT auth.uid()), 'admin'::app_role) OR has_role((SELECT auth.uid()), 'financeiro'::app_role) OR has_role((SELECT auth.uid()), 'operacional'::app_role)));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix324$;
DO $batchfix325$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='webhook_events') THEN
  DROP POLICY IF EXISTS "Viewers can view webhook events" ON public.webhook_events; CREATE POLICY "Viewers can view webhook events" ON public.webhook_events AS PERMISSIVE FOR SELECT TO authenticated USING (has_role((SELECT auth.uid()), 'visualizador'::app_role));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix325$;
DO $batchfix326$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='webhook_simulation_results') THEN
  DROP POLICY IF EXISTS "Users can view simulation results" ON public.webhook_simulation_results; CREATE POLICY "Users can view simulation results" ON public.webhook_simulation_results AS PERMISSIVE FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
     FROM webhook_simulation_runs
    WHERE ((webhook_simulation_runs.id = webhook_simulation_results.run_id) AND (webhook_simulation_runs.created_by = (SELECT auth.uid()))))));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix326$;
DO $batchfix327$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='webhook_simulation_runs') THEN
  DROP POLICY IF EXISTS "Users can insert simulation runs" ON public.webhook_simulation_runs; CREATE POLICY "Users can insert simulation runs" ON public.webhook_simulation_runs AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (((SELECT auth.uid()) = created_by));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix327$;
DO $batchfix328$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='webhook_simulation_runs') THEN
  DROP POLICY IF EXISTS "Users can view simulation runs" ON public.webhook_simulation_runs; CREATE POLICY "Users can view simulation runs" ON public.webhook_simulation_runs AS PERMISSIVE FOR SELECT TO authenticated USING (((SELECT auth.uid()) = created_by));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix328$;
DO $batchfix329$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='webhooks_log') THEN
  DROP POLICY IF EXISTS webhooks_log_admin_insert ON public.webhooks_log; CREATE POLICY webhooks_log_admin_insert ON public.webhooks_log AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (has_role((SELECT auth.uid()), 'admin'::app_role));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix329$;
DO $batchfix330$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='webhooks_log') THEN
  DROP POLICY IF EXISTS webhooks_log_admin_select ON public.webhooks_log; CREATE POLICY webhooks_log_admin_select ON public.webhooks_log AS PERMISSIVE FOR SELECT TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::app_role));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR duplicate_object THEN NULL;
END $batchfix330$;
DO $whatconvtag$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='whatsapp_conversas' AND column_name='empresa_id'
  ) THEN
    DROP POLICY IF EXISTS "Empresa-based access" ON public.whatsapp_conversas; CREATE POLICY "Empresa-based access" ON public.whatsapp_conversas AS PERMISSIVE FOR ALL TO authenticated USING (((empresa_id IN ( SELECT user_empresas.empresa_id
       FROM user_empresas
      WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND (user_empresas.ativo = true)))) OR (EXISTS ( SELECT 1
       FROM user_roles
      WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = 'admin'::app_role))))));
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object OR undefined_column OR undefined_function THEN NULL;
END $whatconvtag$;
