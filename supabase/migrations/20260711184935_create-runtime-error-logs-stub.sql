-- Shim: cria tabela runtime_error_logs antes de 20260711184936
-- que faz ANALYZE public.runtime_error_logs (42P01 — does not exist)
-- Tabela criada fora do sistema de migrations em produção; Preview não a tem.
CREATE TABLE IF NOT EXISTS public.runtime_error_logs (
  id               uuid        NOT NULL DEFAULT gen_random_uuid(),
  error_id         text        NOT NULL,
  error_name       text        NOT NULL,
  error_message    text        NOT NULL,
  stack_trace      text,
  component_stack  text,
  source           text        NOT NULL DEFAULT 'unknown',
  severity         text        NOT NULL DEFAULT 'error',
  url              text,
  user_agent       text,
  user_id          uuid,
  app_version      text,
  fingerprint      text,
  occurrence_count integer     NOT NULL DEFAULT 1,
  first_seen_at    timestamptz NOT NULL DEFAULT now(),
  last_seen_at     timestamptz NOT NULL DEFAULT now(),
  metadata         jsonb       DEFAULT '{}'::jsonb,
  resolved         boolean     NOT NULL DEFAULT false,
  resolved_at      timestamptz,
  resolved_by      uuid,
  created_at       timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT runtime_error_logs_pkey PRIMARY KEY (id)
);
