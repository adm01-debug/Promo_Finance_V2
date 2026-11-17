-- Fixture do replay local: objetos que a PLATAFORMA Supabase provê.
-- Nada aqui corrige migration; serve para o replay poder rodar fora da Supabase.
-- Usado por scripts/db/replay-migrations.sh (issue #90).
-- Objetos que a PLATAFORMA Supabase provê e que o replay local não tem.
-- Nada aqui é correção de repo: é fixture para o replay poder rodar.
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS btree_gist;
DO $$ BEGIN CREATE ROLE anon NOLOGIN; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE ROLE authenticated NOLOGIN; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE ROLE service_role NOLOGIN BYPASSRLS; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE ROLE supabase_admin SUPERUSER NOLOGIN; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE ROLE supabase_auth_admin NOLOGIN; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE ROLE supabase_storage_admin NOLOGIN; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE ROLE dashboard_user NOLOGIN; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE ROLE authenticator NOINHERIT NOLOGIN; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE ROLE pgbouncer NOLOGIN; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS storage;
CREATE SCHEMA IF NOT EXISTS extensions;
CREATE SCHEMA IF NOT EXISTS graphql_public;
CREATE SCHEMA IF NOT EXISTS realtime;
CREATE SCHEMA IF NOT EXISTS vault;
-- publicação do realtime: criada pela plataforma
DO $$ BEGIN CREATE PUBLICATION supabase_realtime; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
-- auth: tabelas e funções que as migrations referenciam
CREATE TABLE IF NOT EXISTS auth.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text, phone text, encrypted_password text,
  raw_user_meta_data jsonb, raw_app_meta_data jsonb,
  email_confirmed_at timestamptz, last_sign_in_at timestamptz,
  banned_until timestamptz, deleted_at timestamptz,
  created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);
CREATE TABLE IF NOT EXISTS auth.sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now(),
  not_after timestamptz
);
CREATE TABLE IF NOT EXISTS auth.identities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  provider text, identity_data jsonb, created_at timestamptz DEFAULT now()
);
CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $f$ SELECT NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid $f$;
CREATE OR REPLACE FUNCTION auth.role() RETURNS text LANGUAGE sql STABLE AS $f$ SELECT COALESCE(NULLIF(current_setting('request.jwt.claim.role', true), ''), 'authenticated') $f$;
CREATE OR REPLACE FUNCTION auth.email() RETURNS text LANGUAGE sql STABLE AS $f$ SELECT NULLIF(current_setting('request.jwt.claim.email', true), '') $f$;
CREATE OR REPLACE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql STABLE AS $f$ SELECT COALESCE(NULLIF(current_setting('request.jwt.claims', true), '')::jsonb, '{}'::jsonb) $f$;
-- storage
CREATE TABLE IF NOT EXISTS storage.buckets (
  id text PRIMARY KEY, name text NOT NULL, owner uuid, public boolean DEFAULT false,
  file_size_limit bigint, allowed_mime_types text[],
  created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);
CREATE TABLE IF NOT EXISTS storage.objects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), bucket_id text REFERENCES storage.buckets(id),
  name text, owner uuid, metadata jsonb, path_tokens text[],
  created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);
CREATE OR REPLACE FUNCTION storage.foldername(name text) RETURNS text[] LANGUAGE sql IMMUTABLE AS $f$ SELECT string_to_array(name, '/') $f$;
-- vault (secrets)
CREATE TABLE IF NOT EXISTS vault.secrets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text UNIQUE, secret text, created_at timestamptz DEFAULT now()
);
-- controle de migrations: criado pelo CLI do Supabase, não por migration
CREATE SCHEMA IF NOT EXISTS supabase_migrations;
CREATE TABLE IF NOT EXISTS supabase_migrations.schema_migrations (
  version text PRIMARY KEY, statements text[], name text
);
-- pg_cron / pg_net / http: extensões da plataforma
-- pg_cron não tem biblioteca .so aqui: simulação fiel do que as migrations usam
CREATE SCHEMA IF NOT EXISTS cron;
CREATE TABLE IF NOT EXISTS cron.job (
  jobid bigserial PRIMARY KEY, schedule text, command text, nodename text DEFAULT 'localhost',
  nodeport int DEFAULT 5432, database text, username text, active boolean DEFAULT true,
  jobname text UNIQUE
);
CREATE TABLE IF NOT EXISTS cron.job_run_details (
  jobid bigint, runid bigserial PRIMARY KEY, job_pid int, database text, username text,
  command text, status text, return_message text, start_time timestamptz, end_time timestamptz
);
CREATE OR REPLACE FUNCTION cron.schedule(p_jobname text, p_schedule text, p_command text) RETURNS bigint
  LANGUAGE sql AS $f$ INSERT INTO cron.job(jobname, schedule, command) VALUES (p_jobname, p_schedule, p_command)
    ON CONFLICT (jobname) DO UPDATE SET schedule = excluded.schedule, command = excluded.command
    RETURNING jobid $f$;
CREATE OR REPLACE FUNCTION cron.schedule(p_schedule text, p_command text) RETURNS bigint
  LANGUAGE sql AS $f$ INSERT INTO cron.job(schedule, command) VALUES (p_schedule, p_command) RETURNING jobid $f$;
CREATE OR REPLACE FUNCTION cron.unschedule(p_jobname text) RETURNS boolean
  LANGUAGE sql AS $f$ DELETE FROM cron.job WHERE jobname = p_jobname RETURNING true $f$;
CREATE OR REPLACE FUNCTION cron.unschedule(p_jobid bigint) RETURNS boolean
  LANGUAGE sql AS $f$ DELETE FROM cron.job WHERE jobid = p_jobid RETURNING true $f$;
CREATE OR REPLACE FUNCTION cron.alter_job(job_id bigint, schedule text DEFAULT NULL, command text DEFAULT NULL,
  database text DEFAULT NULL, username text DEFAULT NULL, active boolean DEFAULT NULL) RETURNS void
  LANGUAGE sql AS $f$ UPDATE cron.job SET schedule = coalesce(alter_job.schedule, job.schedule),
    command = coalesce(alter_job.command, job.command), active = coalesce(alter_job.active, job.active)
    WHERE jobid = job_id $f$;
DO $$ BEGIN CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA extensions; EXCEPTION WHEN OTHERS THEN NULL; END $$;
CREATE EXTENSION IF NOT EXISTS pg_stat_statements WITH SCHEMA extensions;
