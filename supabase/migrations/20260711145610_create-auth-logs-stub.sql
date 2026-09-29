-- Shim: cria tabela auth_logs antes de 20260711145611
-- que cria INDEX idx_auth_logs_ip_created ON public.auth_logs (42P01)
-- Tabela criada fora do sistema de migrations em produção; Preview não a tem.
CREATE TABLE IF NOT EXISTS public.auth_logs (
  id             uuid        NOT NULL DEFAULT gen_random_uuid(),
  user_id        uuid,
  event_type     text        NOT NULL,
  ip_address     inet,
  user_agent     text,
  success        boolean     DEFAULT true,
  failure_reason text,
  metadata       jsonb       DEFAULT '{}'::jsonb,
  created_at     timestamptz DEFAULT now(),
  CONSTRAINT auth_logs_pkey PRIMARY KEY (id)
);
