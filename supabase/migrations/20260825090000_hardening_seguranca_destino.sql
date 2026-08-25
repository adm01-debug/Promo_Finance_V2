-- =============================================================
-- Migration: Hardening de segurança do banco destino
-- Projeto: bwwbeyolnnzppeuhgkcd (canônico)
-- Evidência: auditoria src/dst 2026-08-25 (adm01-debug/Promo_Finance_V2)
-- =============================================================

BEGIN;

-- 1. Dropar objetos de teste -----------------------------------------------
DROP FUNCTION IF EXISTS public._test_fn(integer);
DROP FUNCTION IF EXISTS public._test_fn2(text);
DROP FUNCTION IF EXISTS public._trig_fn();

-- 2. Restringir exec_sql a service_role ------------------------------------
REVOKE EXECUTE ON FUNCTION public.exec_sql(text) FROM PUBLIC, anon, authenticated;
-- (mantido para uso pelo mcp-query; só service_role pode chamar)

-- 3. REVOKE ALL em tabelas de anon (254 → 0) ------------------------------
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon;

-- 4. Revogar EXECUTE de anon/PUBLIC em todas as funções -------------------
-- (src restringe 84 funções a service_role; 15 a authenticated+service_role)
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC, anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC, anon;

-- 4b. Re-conceder EXECUTE a authenticated onde origem permite ------------
GRANT EXECUTE ON FUNCTION public.fn_norm_conta_codigo(p_codigo text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_bloat_history(p_days integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_catalogos_tributarios_health() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_cron_jobs() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_cron_run_history(p_job_name text, p_limit integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_performance_alerts_weekly(p_weeks integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_retencoes_pendentes_count(p_empresa_id uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_retention_history(p_days integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_table_bloat() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_permissions(user_id uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_roles(user_id uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(_user_id uuid, _role app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.registrar_auditoria_config(_tipo_acao text, _empresa_id uuid, _detalhes jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.registrar_evento_pagar(p_conta_id uuid, p_tipo text, p_mensagem text, p_metadata jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.registrar_evento_receber(p_conta_id uuid, p_evento text, p_detalhes jsonb, p_tipo text, p_mensagem text, p_metadata jsonb) TO authenticated;

-- 4c. Re-conceder EXECUTE a anon nas 2 funções pré-login ----------------
GRANT EXECUTE ON FUNCTION public.gerar_numero_acordo() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.resolve_sso_providers_for_domain(p_domain text) TO anon, authenticated;

-- 5. Corrigir SECURITY DEFINER sem search_path -----------------------------
ALTER FUNCTION public.is_user_admin() SET search_path = public, pg_catalog;

-- 6. Mover extensões de 'public' para 'extensions' -------------------------
ALTER EXTENSION pg_stat_statements SET SCHEMA extensions;
ALTER EXTENSION pg_trgm         SET SCHEMA extensions;
DROP VIEW IF EXISTS public.pg_stat_statements;
DROP VIEW IF EXISTS public.pg_stat_statements_info;

-- 7. Timeout por role (restaurar valores da origem) ------------------------
ALTER ROLE anon          SET statement_timeout = '8s';
ALTER ROLE anon          SET lock_timeout      = '3s';
ALTER ROLE anon          SET idle_in_transaction_session_timeout = '10s';
ALTER ROLE authenticated SET lock_timeout      = '3s';
ALTER ROLE authenticated SET idle_in_transaction_session_timeout = '10s';
ALTER ROLE authenticator SET lock_timeout      = '3s';
ALTER ROLE authenticator SET idle_in_transaction_session_timeout = '10s';
ALTER ROLE service_role  SET statement_timeout = '60s';
ALTER ROLE service_role  SET lock_timeout      = '10s';
ALTER ROLE service_role  SET idle_in_transaction_session_timeout = '30s';
ALTER ROLE supabase_admin SET statement_timeout = '0';
ALTER DATABASE postgres  SET idle_in_transaction_session_timeout = '15min';

-- 8. Publicação Realtime: adicionar performance_alerts ----------------------
ALTER PUBLICATION supabase_realtime ADD TABLE public.performance_alerts;

-- 9. Enum tipo_cobranca (ausente no destino; usado por pagamentos_recorrentes)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='tipo_cobranca' AND typnamespace='public'::regnamespace)
  THEN CREATE TYPE public.tipo_cobranca AS ENUM (
    'transferencia','pix','boleto','debito_automatico','cartao_credito','cartao_debito','cheque','dinheiro');
  END IF;
END $$;

COMMIT;
