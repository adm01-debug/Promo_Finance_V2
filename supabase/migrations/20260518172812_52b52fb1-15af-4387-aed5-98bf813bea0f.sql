
CREATE POLICY "fornecedores_owner_select" ON public.fornecedores FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "fornecedores_owner_insert" ON public.fornecedores FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "fornecedores_owner_update" ON public.fornecedores FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "fornecedores_owner_delete" ON public.fornecedores FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "clientes_owner_select" ON public.clientes FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "clientes_owner_insert" ON public.clientes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "clientes_owner_update" ON public.clientes FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "clientes_owner_delete" ON public.clientes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Guard: 42703 — table created in 20251220134032 without user_id; CREATE TABLE IF NOT EXISTS in 20260518164611 was no-op
ALTER TABLE public.historico_analises_preditivas ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

DROP POLICY IF EXISTS "Authenticated insert hap" ON public.historico_analises_preditivas;
CREATE POLICY "hap_user_insert" ON public.historico_analises_preditivas FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "authenticated insert webhooks_log" ON public.webhooks_log;
DROP POLICY IF EXISTS "auth write webhooks_log" ON public.webhooks_log;
CREATE POLICY "webhooks_log_admin_insert" ON public.webhooks_log FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'::public.app_role));

DROP POLICY IF EXISTS "auth modify asaas_customers" ON public.asaas_customers;
CREATE POLICY "asaas_customers_admin_all" ON public.asaas_customers FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(),'admin'::public.app_role));

DROP POLICY IF EXISTS "auth modify asaas_payments" ON public.asaas_payments;
CREATE POLICY "asaas_payments_admin_all" ON public.asaas_payments FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(),'admin'::public.app_role));

DROP POLICY IF EXISTS "auth modify asaas_transfers" ON public.asaas_transfers;
CREATE POLICY "asaas_transfers_admin_all" ON public.asaas_transfers FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(),'admin'::public.app_role));

DROP POLICY IF EXISTS "auth modify asaas_audit_trail" ON public.asaas_audit_trail;
CREATE POLICY "asaas_audit_admin_all" ON public.asaas_audit_trail FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(),'admin'::public.app_role));

DROP POLICY IF EXISTS "auth modify asaas_config" ON public.asaas_config;
CREATE POLICY "asaas_config_admin_all" ON public.asaas_config FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(),'admin'::public.app_role));

DROP POLICY IF EXISTS "auth modify asaas_reconciliation_suggestions" ON public.asaas_reconciliation_suggestions;
CREATE POLICY "asaas_recon_admin_all" ON public.asaas_reconciliation_suggestions FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(),'admin'::public.app_role));

DROP POLICY IF EXISTS "auth modify asaas_sync_queue" ON public.asaas_sync_queue;
CREATE POLICY "asaas_sync_admin_all" ON public.asaas_sync_queue FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(),'admin'::public.app_role));

-- Guard: 42703 — table created in 20260509114452 without user_id; CREATE TABLE IF NOT EXISTS in 20260518165422 was no-op
ALTER TABLE public.historico_cobrancas_boletos ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

DROP POLICY IF EXISTS "auth modify historico_cobrancas_boletos" ON public.historico_cobrancas_boletos;
CREATE POLICY "historico_cobrancas_user_all" ON public.historico_cobrancas_boletos FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "auth insert auditoria_financeira" ON public.auditoria_financeira;
CREATE POLICY "auditoria_user_insert" ON public.auditoria_financeira FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "auth modify portal tokens" ON public.portal_cliente_tokens;
CREATE POLICY "portal_tokens_admin_all" ON public.portal_cliente_tokens FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(),'admin'::public.app_role));

DROP POLICY IF EXISTS "auth insert portal acessos" ON public.portal_cliente_acessos;
CREATE POLICY "portal_acessos_admin_insert" ON public.portal_cliente_acessos FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'::public.app_role));

DROP POLICY IF EXISTS "Users can insert their own error logs" ON public.frontend_error_logs;
CREATE POLICY "frontend_error_user_insert" ON public.frontend_error_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.get_cron_run_history()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    RETURN '[]'::jsonb;
END;
$$;

DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='public' AND p.prosecdef=true
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon', r.sig);
  END LOOP;
END $$;

REVOKE EXECUTE ON FUNCTION public.get_cron_run_history(text,integer) FROM authenticated, anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.cleanup_expired_tokens() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_old_cron_logs() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_old_login_attempts() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.run_daily_cleanup() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.run_daily_cleanup_with_logging() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.get_active_uapi_token() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.clear_login_attempts(text) FROM authenticated;
