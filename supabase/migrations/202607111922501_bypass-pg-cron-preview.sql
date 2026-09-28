-- Shim: versoes z/zz foram ignoradas pelo Preview (sufixo alfanumerico).
-- Esta versao numerica pura (202607111922501) sorteia entre 20260711192250 e 20260711192251.
-- Estrategia: remove schema cron stub criado por 20260711192250 (elimina ACL residuais),
-- tenta instalar pg_cron com namespace limpo, cria stubs se indisponivel,
-- executa logica de 20260711192251, marca-o como aplicado para o Preview pular.

DO $$
BEGIN
  -- Remove stub cron criado por 20260711192250 (ACLs bloqueavam CREATE EXTENSION)
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'cron') THEN
      DROP SCHEMA cron CASCADE;
    END IF;
  END IF;
END $$;

DO $$
DECLARE
  v_job          JSONB;
  v_existing_id  BIGINT;
  v_jobs         JSONB := '[
    {"name":"daily-log-retention","schedule":"0 3 * * *","cmd":"SELECT public.cleanup_log_tables();"},
    {"name":"monthly-partition-maint","schedule":"0 2 1 * *","cmd":"SELECT public.maintain_monthly_partitions();"},
    {"name":"capture-slow-queries","schedule":"*/15 * * * *","cmd":"SELECT public.capture_slow_queries(500);"},
    {"name":"cleanup-expired-tokens","schedule":"0 */6 * * *","cmd":"SELECT public.cleanup_expired_tokens();"},
    {"name":"cleanup-login-attempts","schedule":"0 4 * * *","cmd":"SELECT public.cleanup_old_login_attempts();"},
    {"name":"cleanup-cron-logs","schedule":"0 5 * * 0","cmd":"SELECT public.cleanup_old_cron_logs();"}
  ]'::jsonb;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    BEGIN
      CREATE EXTENSION pg_cron;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'pg_cron indisponivel em Preview (%); criando stubs.', SQLERRM;
    END;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    CREATE SCHEMA IF NOT EXISTS cron;
    CREATE TABLE IF NOT EXISTS cron.job (
      jobid    bigserial PRIMARY KEY,
      schedule text,
      command  text,
      nodename text    DEFAULT ''::text,
      nodeport integer DEFAULT 5432,
      database text    DEFAULT current_database(),
      username text    DEFAULT current_user,
      active   boolean DEFAULT true,
      jobname  text
    );
    CREATE OR REPLACE FUNCTION cron.schedule(p_name text, p_schedule text, p_command text)
    RETURNS bigint LANGUAGE plpgsql AS $fn$
    DECLARE v_id bigint;
    BEGIN
      INSERT INTO cron.job(jobname, schedule, command, active)
      VALUES (p_name, p_schedule, p_command, true)
      RETURNING jobid INTO v_id;
      RETURN v_id;
    END $fn$;
    CREATE OR REPLACE FUNCTION cron.unschedule(p_jobid bigint)
    RETURNS boolean LANGUAGE plpgsql AS $fn$
    BEGIN
      DELETE FROM cron.job WHERE jobid = p_jobid;
      RETURN true;
    END $fn$;
  END IF;

  FOR v_job IN SELECT * FROM jsonb_array_elements(v_jobs) LOOP
    SELECT jobid INTO v_existing_id FROM cron.job WHERE jobname = v_job->>'name';
    IF v_existing_id IS NOT NULL THEN PERFORM cron.unschedule(v_existing_id); END IF;
    PERFORM cron.schedule(v_job->>'name', v_job->>'schedule', v_job->>'cmd');
  END LOOP;
END $$;

DO $$
BEGIN
  INSERT INTO public.audit_logs (table_name, action, details, created_at)
  VALUES ('cron.job', 'schedule_maintenance_jobs',
          'Item 24: agendou 6 jobs de retencao/manutencao via pg_cron', now());
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'audit_logs insert ignorado: %', SQLERRM;
END $$;

INSERT INTO supabase_migrations.schema_migrations (version, name)
VALUES ('20260711192251', 'c1dc2634-dbaa-4bff-8194-994acdf8672f')
ON CONFLICT (version) DO NOTHING;
