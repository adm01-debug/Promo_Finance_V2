-- Item 24: Automação de retenção e manutenção via pg_cron
-- Todas as tarefas chamam funções SQL internas (sem HTTP).

-- Instala pg_cron (no-op se já existe); captura 2BP01 em ambiente Preview.
DO $$
BEGIN
  CREATE EXTENSION IF NOT EXISTS pg_cron;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'pg_cron CREATE EXTENSION ignorado: %', SQLERRM;
END $$;

-- Se pg_cron não foi instalado (Preview), cria stubs compatíveis.
DO $$
BEGIN
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
END $$;

-- Agenda ou reagenda jobs idempotentemente.
DO $$
DECLARE
  v_jobs JSONB := '[
    {"name":"daily-log-retention",       "schedule":"0 3 * * *",   "cmd":"SELECT public.cleanup_log_tables();"},
    {"name":"monthly-partition-maint",   "schedule":"0 2 1 * *",   "cmd":"SELECT public.maintain_monthly_partitions();"},
    {"name":"capture-slow-queries",      "schedule":"*/15 * * * *","cmd":"SELECT public.capture_slow_queries(500);"},
    {"name":"cleanup-expired-tokens",    "schedule":"0 */6 * * *", "cmd":"SELECT public.cleanup_expired_tokens();"},
    {"name":"cleanup-login-attempts",    "schedule":"0 4 * * *",   "cmd":"SELECT public.cleanup_old_login_attempts();"},
    {"name":"cleanup-cron-logs",         "schedule":"0 5 * * 0",   "cmd":"SELECT public.cleanup_old_cron_logs();"}
  ]'::jsonb;
  v_job JSONB;
  v_existing_id BIGINT;
BEGIN
  FOR v_job IN SELECT * FROM jsonb_array_elements(v_jobs)
  LOOP
    SELECT jobid INTO v_existing_id
      FROM cron.job
     WHERE jobname = v_job->>'name';

    IF v_existing_id IS NOT NULL THEN
      PERFORM cron.unschedule(v_existing_id);
    END IF;

    PERFORM cron.schedule(
      v_job->>'name',
      v_job->>'schedule',
      v_job->>'cmd'
    );
  END LOOP;
END $$;

-- Registrar auditoria
INSERT INTO public.audit_logs (table_name, action, details, created_at)
VALUES ('cron.job', 'schedule_maintenance_jobs',
        'Item 24: agendou 6 jobs de retenção/manutenção via pg_cron',
        now());
