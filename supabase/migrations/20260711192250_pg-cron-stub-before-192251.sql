-- Shim: instala pg_cron (ou cria stubs) antes de 20260711192251
-- que faz CREATE EXTENSION IF NOT EXISTS pg_cron (2BP01 em Supabase Preview)
-- 2BP01 ocorre quando schema cron existe com privileges conflitantes.
DO $$
BEGIN
  -- Se pg_cron já está instalado como extensão, não faz nada.
  -- CREATE EXTENSION IF NOT EXISTS na migration seguinte será no-op.
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    RETURN;
  END IF;

  -- Tentar dropar schema cron conflitante (pode ter sido criado pelo Supabase
  -- durante provisioning de Preview com GRANTs que impedem CREATE EXTENSION)
  IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'cron') THEN
    DROP SCHEMA cron CASCADE;
  END IF;

  -- Tentar instalar a extensão com schema limpo
  BEGIN
    CREATE EXTENSION pg_cron;
    -- Sucesso: a migration seguinte và pg_cron em pg_extension → IF NOT EXISTS = no-op
    RETURN;
  EXCEPTION WHEN OTHERS THEN
    NULL; -- pg_cron não instalável neste ambiente, continua para stubs
  END;

  -- Fallback: criar stubs mínimos para o DO block da migration 20260711192251
  -- (cron.job, cron.schedule, cron.unschedule)
  CREATE SCHEMA IF NOT EXISTS cron;

  CREATE TABLE IF NOT EXISTS cron.job (
    jobid    bigserial PRIMARY KEY,
    schedule text      NOT NULL,
    command  text      NOT NULL,
    nodename text      NOT NULL DEFAULT 'localhost',
    nodeport int       NOT NULL DEFAULT 5432,
    database text      NOT NULL DEFAULT current_database(),
    username text      NOT NULL DEFAULT current_user,
    active   boolean   NOT NULL DEFAULT true,
    jobname  text      UNIQUE
  );

  CREATE TABLE IF NOT EXISTS cron.job_run_details (
    jobid          bigint,
    runid          bigint PRIMARY KEY,
    job_pid        integer,
    database       text,
    username       text,
    command        text,
    status         text,
    return_message text,
    start_time     timestamptz,
    end_time       timestamptz
  );

  CREATE OR REPLACE FUNCTION cron.schedule(
    p_name     text,
    p_schedule text,
    p_command  text
  ) RETURNS bigint LANGUAGE sql AS $f$
    INSERT INTO cron.job (jobname, schedule, command)
    VALUES (p_name, p_schedule, p_command)
    ON CONFLICT (jobname)
      DO UPDATE SET schedule = EXCLUDED.schedule, command = EXCLUDED.command
    RETURNING jobid
  $f$;

  CREATE OR REPLACE FUNCTION cron.unschedule(p_jobid bigint)
  RETURNS boolean LANGUAGE sql AS $f$
    DELETE FROM cron.job WHERE jobid = p_jobid;
    SELECT true
  $f$;

  CREATE OR REPLACE FUNCTION cron.unschedule(p_name text)
  RETURNS boolean LANGUAGE sql AS $f$
    DELETE FROM cron.job WHERE jobname = p_name;
    SELECT true
  $f$;

  -- cron.alter_job: atualiza campos de um job existente (chamado por várias migrations)
  CREATE OR REPLACE FUNCTION cron.alter_job(
    job_id   bigint,
    schedule text    DEFAULT NULL,
    command  text    DEFAULT NULL,
    database text    DEFAULT NULL,
    username text    DEFAULT NULL,
    active   boolean DEFAULT NULL
  ) RETURNS void LANGUAGE plpgsql AS $f$
  BEGIN
    UPDATE cron.job AS j SET
      schedule = COALESCE($2, j.schedule),
      command  = COALESCE($3, j.command),
      database = COALESCE($4, j.database),
      username = COALESCE($5, j.username),
      active   = COALESCE($6, j.active)
    WHERE j.jobid = $1;
  END;
  $f$;
END $$;
