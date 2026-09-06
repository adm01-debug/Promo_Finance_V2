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
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
             WHERE n.nspname = 'public' AND p.proname = 'exec_sql') THEN
    REVOKE EXECUTE ON FUNCTION public.exec_sql(text) FROM PUBLIC, anon, authenticated;
  END IF;
END $$;
-- (mantido para uso pelo mcp-query; só service_role pode chamar)

-- 3. REVOKE ALL em tabelas de anon (254 → 0) ------------------------------
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon;

-- 4. Revogar EXECUTE de anon/PUBLIC em todas as funções -------------------
-- (src restringe 84 funções a service_role; 15 a authenticated+service_role)
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC, anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC, anon;

-- 4b. Re-conceder EXECUTE a authenticated onde origem permite ------------
DO $$ BEGIN GRANT EXECUTE ON FUNCTION public.fn_norm_conta_codigo(p_codigo text) TO authenticated;
EXCEPTION WHEN undefined_function THEN NULL; END $$;
DO $$ BEGIN GRANT EXECUTE ON FUNCTION public.get_bloat_history(p_days integer) TO authenticated;
EXCEPTION WHEN undefined_function THEN NULL; END $$;
DO $$ BEGIN GRANT EXECUTE ON FUNCTION public.get_catalogos_tributarios_health() TO authenticated;
EXCEPTION WHEN undefined_function THEN NULL; END $$;
DO $$ BEGIN GRANT EXECUTE ON FUNCTION public.get_cron_jobs() TO authenticated;
EXCEPTION WHEN undefined_function THEN NULL; END $$;
DO $$ BEGIN GRANT EXECUTE ON FUNCTION public.get_cron_run_history(p_job_name text, p_limit integer) TO authenticated;
EXCEPTION WHEN undefined_function THEN NULL; END $$;
DO $$ BEGIN GRANT EXECUTE ON FUNCTION public.get_performance_alerts_weekly(p_weeks integer) TO authenticated;
EXCEPTION WHEN undefined_function THEN NULL; END $$;
DO $$ BEGIN GRANT EXECUTE ON FUNCTION public.get_retencoes_pendentes_count(p_empresa_id uuid) TO authenticated;
EXCEPTION WHEN undefined_function THEN NULL; END $$;
DO $$ BEGIN GRANT EXECUTE ON FUNCTION public.get_retention_history(p_days integer) TO authenticated;
EXCEPTION WHEN undefined_function THEN NULL; END $$;
DO $$ BEGIN GRANT EXECUTE ON FUNCTION public.get_table_bloat() TO authenticated;
EXCEPTION WHEN undefined_function THEN NULL; END $$;
DO $$ BEGIN GRANT EXECUTE ON FUNCTION public.get_user_permissions(user_id uuid) TO authenticated;
EXCEPTION WHEN undefined_function THEN NULL; END $$;
DO $$ BEGIN GRANT EXECUTE ON FUNCTION public.get_user_roles(user_id uuid) TO authenticated;
EXCEPTION WHEN undefined_function THEN NULL; END $$;
DO $$ BEGIN GRANT EXECUTE ON FUNCTION public.has_role(_user_id uuid, _role app_role) TO authenticated;
EXCEPTION WHEN undefined_function THEN NULL; END $$;
DO $$ BEGIN GRANT EXECUTE ON FUNCTION public.registrar_auditoria_config(_tipo_acao text, _empresa_id uuid, _detalhes jsonb) TO authenticated;
EXCEPTION WHEN undefined_function THEN NULL; END $$;
DO $$ BEGIN GRANT EXECUTE ON FUNCTION public.registrar_evento_pagar(p_conta_id uuid, p_tipo text, p_mensagem text, p_metadata jsonb) TO authenticated;
EXCEPTION WHEN undefined_function THEN NULL; END $$;
DO $$ BEGIN GRANT EXECUTE ON FUNCTION public.registrar_evento_receber(p_conta_id uuid, p_evento text, p_detalhes jsonb, p_tipo text, p_mensagem text, p_metadata jsonb) TO authenticated;
EXCEPTION WHEN undefined_function THEN NULL; END $$;

-- 4c. Re-conceder EXECUTE a anon nas 2 funções pré-login ----------------
DO $$ BEGIN GRANT EXECUTE ON FUNCTION public.gerar_numero_acordo() TO anon, authenticated;
EXCEPTION WHEN undefined_function THEN NULL; END $$;
DO $$ BEGIN GRANT EXECUTE ON FUNCTION public.resolve_sso_providers_for_domain(p_domain text) TO anon, authenticated;
EXCEPTION WHEN undefined_function THEN NULL; END $$;

-- 5. Corrigir SECURITY DEFINER sem search_path -----------------------------
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
             WHERE n.nspname = 'public' AND p.proname = 'is_user_admin') THEN
    ALTER FUNCTION public.is_user_admin() SET search_path = public, pg_catalog;
  END IF;
END $$;

-- 6. Mover extensões de 'public' para 'extensions' -------------------------
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension e JOIN pg_namespace n ON n.oid = e.extnamespace
             WHERE e.extname = 'pg_stat_statements' AND n.nspname = 'public') THEN
    ALTER EXTENSION pg_stat_statements SET SCHEMA extensions;
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension e JOIN pg_namespace n ON n.oid = e.extnamespace
             WHERE e.extname = 'pg_trgm' AND n.nspname = 'public') THEN
    ALTER EXTENSION pg_trgm SET SCHEMA extensions;
  END IF;
END $$;
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
DO $$ BEGIN ALTER ROLE supabase_admin SET statement_timeout = '0';
EXCEPTION WHEN insufficient_privilege THEN NULL; END $$;
DO $$
BEGIN
  EXECUTE 'ALTER DATABASE postgres SET idle_in_transaction_session_timeout = ''15min''';
EXCEPTION
  WHEN insufficient_privilege THEN
    RAISE NOTICE 'Sem privilégio para ALTER DATABASE postgres; timeout global mantido como está nesta réplica.';
END
$$;

-- 8. Publicação Realtime: adicionar performance_alerts ----------------------
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='performance_alerts')
     AND EXISTS (SELECT 1 FROM pg_publication WHERE pubname='supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.performance_alerts;
  END IF;
END $$;

-- 9. Enum tipo_cobranca (ausente no destino; usado por pagamentos_recorrentes)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='tipo_cobranca' AND typnamespace='public'::regnamespace)
  THEN CREATE TYPE public.tipo_cobranca AS ENUM (
    'transferencia','pix','boleto','debito_automatico','cartao_credito','cartao_debito','cheque','dinheiro');
  END IF;
END $$;

COMMIT;
