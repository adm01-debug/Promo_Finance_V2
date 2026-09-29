-- Shim: cria tabela webhook_events antes de 20260711152458
-- que cria INDEX idx_webhook_events_event_type ON public.webhook_events (42P01)
-- Tabela criada fora do sistema de migrations em produção; Preview não a tem.
CREATE TABLE IF NOT EXISTS public.webhook_events (
  id               uuid        NOT NULL DEFAULT gen_random_uuid(),
  event_type       text        NOT NULL,
  lalamove_order_id text,
  raw_payload      jsonb       NOT NULL,
  processed        boolean     DEFAULT false,
  processed_at     timestamptz,
  error_message    text,
  received_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT webhook_events_pkey PRIMARY KEY (id)
);
