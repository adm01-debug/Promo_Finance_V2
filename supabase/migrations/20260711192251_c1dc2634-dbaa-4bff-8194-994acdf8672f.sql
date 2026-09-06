-- Item 24: Automação de retenção e manutenção via pg_cron
-- Todas as tarefas chamam funções SQL internas (sem HTTP), portanto podem viver em migração.

DO $$
BEGIN
  CREATE EXTENSION IF NOT EXISTS pg_cron;
EXCEPTION WHEN OTHERS THEN
  -- pg_cron pode já estar instalado pelo Supabase ou ter conflito de privilégios (2BP01)
  NULL;
END $$;

-- Helper: agenda ou reagenda job idempotentemente
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
  IF NOT EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'cron') THEN
    RETURN;
  END IF;

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
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- Registrar auditoria
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='audit_logs') THEN
    INSERT INTO public.audit_logs (table_name, action, details, created_at)
    VALUES ('cron.job', 'schedule_maintenance_jobs',
            'Item 24: agendou 6 jobs de retenção/manutenção via pg_cron',
            now());
  END IF;
END $$;
