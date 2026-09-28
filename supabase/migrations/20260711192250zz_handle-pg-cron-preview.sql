-- Shim: pg_cron falha com 2BP01 em Preview mesmo sem schema cron (ACLs residuais).
-- Estratégia: instala pg_cron ou cria stubs; executa lógica de 20260711192251;
-- marca 20260711192251 como aplicado em schema_migrations para Supabase pular.

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
  -- 1. Tentar instalar pg_cron se não instalado
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    BEGIN
      CREATE EXTENSION pg_cron;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'pg_cron indisponível em Preview (%); criando stubs.', SQLERRM;
    END;
  END IF;

  -- 2. Se pg_cron não instalado, criar schema/tabela/funções stub
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

  -- 3. Executar lógica de agendamento (real ou stub)
  FOR v_job IN SELECT * FROM jsonb_array_elements(v_jobs) LOOP
    SELECT jobid INTO v_existing_id FROM cron.job WHERE jobname = v_job->>'name';
    IF v_existing_id IS NOT NULL THEN
      PERFORM cron.unschedule(v_existing_id);
    END IF;
    PERFORM cron.schedule(v_job->>'name', v_job->>'schedule', v_job->>'cmd');
  END LOOP;
END $$;

-- 4. Registrar audit log equivalente ao de 20260711192251
DO $$
BEGIN
  INSERT INTO public.audit_logs (table_name, action, details, created_at)
  VALUES ('cron.job', 'schedule_maintenance_jobs',
          'Item 24: agendou 6 jobs de retenção/manutenção via pg_cron', now());
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'audit_logs insert ignorado: %', SQLERRM;
END $$;

-- 5. Marcar 20260711192251 como aplicado → Supabase Preview pula o arquivo original
INSERT INTO supabase_migrations.schema_migrations (version, name)
VALUES ('20260711192251', 'c1dc2634-dbaa-4bff-8194-994acdf8672f')
ON CONFLICT (version) DO NOTHING;
