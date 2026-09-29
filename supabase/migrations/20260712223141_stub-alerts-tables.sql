-- Shim: cria enums e tabelas do módulo de alertas que existem em produção
-- mas não foram geradas por migration. Necessário para o replay do Preview.
-- Em produção esta versão já está em schema_migrations (INSERT abaixo é no-op).

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'alert_severity') THEN
    CREATE TYPE public.alert_severity AS ENUM ('INFO', 'WARNING', 'CRITICAL');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'alert_type') THEN
    CREATE TYPE public.alert_type AS ENUM (
      'DRIVER_BLOCKED', 'ROUTE_DEVIATION', 'DRIVER_STOPPED',
      'LATE_DELIVERY', 'APPROVAL_REQUIRED', 'ORDER_CANCELLED'
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.alerts (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type        public.alert_type NOT NULL,
  severity    public.alert_severity NOT NULL DEFAULT 'INFO',
  title       text NOT NULL,
  message     text NOT NULL,
  order_id    uuid,
  driver_id   uuid,
  is_read     boolean DEFAULT false,
  is_dismissed boolean DEFAULT false,
  metadata    jsonb DEFAULT '{}',
  created_at  timestamptz NOT NULL DEFAULT now(),
  empresa_id  uuid
);

CREATE TABLE IF NOT EXISTS public.alert_configurations (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type           public.alert_type NOT NULL,
  channel              text NOT NULL,
  is_enabled           boolean DEFAULT true,
  recipients           text[] DEFAULT '{}',
  config               jsonb DEFAULT '{}',
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now(),
  name                 text,
  message_template     text,
  min_interval_seconds integer DEFAULT 300,
  notify_whatsapp      boolean DEFAULT false,
  whatsapp_numbers     text[],
  notify_email         boolean DEFAULT false,
  email_addresses      text[],
  notify_slack         boolean DEFAULT false,
  slack_channels       text[],
  notify_sms           boolean DEFAULT false,
  sms_numbers          text[],
  notify_bitrix24_task boolean DEFAULT false,
  bitrix24_user_ids    integer[],
  notify_n8n_webhook   boolean DEFAULT false,
  n8n_webhook_url      text,
  conditions           jsonb,
  created_by           text,
  empresa_id           uuid,
  UNIQUE (alert_type, channel)
);
