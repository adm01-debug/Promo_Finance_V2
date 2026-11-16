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
  empresa_id  uuid REFERENCES public.empresas(id) ON DELETE RESTRICT
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
  empresa_id           uuid REFERENCES public.empresas(id) ON DELETE RESTRICT,
  UNIQUE (alert_type, channel)
);

ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_configurations ENABLE ROW LEVEL SECURITY;

-- Indice da FK empresa_id, no MESMO arquivo que cria a FK.
--
-- Sem isto o replay da cadeia ABORTA 16 dias de timestamp depois, no gate de
-- 20260728104452_cb4be287-2b31-4328-86ea-e0c5406ec659.sql:21-38, que conta
-- chave estrangeira de coluna unica sem indice de suporte e levanta
-- "Ainda existem % chaves estrangeiras sem indice de suporte". As duas FKs sao
-- as declaradas inline acima (:30 e :59), e o indice da cadeia para elas so
-- aparece em 20260728215040_cc625266-...sql:38,42 — timestamp POSTERIOR ao
-- gate.
--
-- Em producao nada muda: este arquivo ja foi aplicado, e lá os indices existem
-- com OUTRO nome (idx_alerts_empresa_id, idx_alert_configurations_empresa_id,
-- com sufixo _id), razao pela qual o gate sempre passou em producao e nunca
-- passou num ambiente reconstruido. Os nomes abaixo sao os que a cadeia usa em
-- 20260728215040, para nao criar um terceiro nome para a mesma coluna.
--
-- Corrigido aqui, e nao com um arquivo de timestamp novo, porque o indice
-- pertence a FK: um arquivo posterior nao conserta o replay, ja que o gate roda
-- antes dele. E nao com um arquivo de timestamp ANTERIOR, porque isso quebraria
-- a regra de versao estritamente crescente do AGENTS.md secao 4 e apareceria
-- como versao local ausente do ledger remoto.
CREATE INDEX IF NOT EXISTS idx_alerts_empresa ON public.alerts(empresa_id);
CREATE INDEX IF NOT EXISTS idx_alert_configurations_empresa ON public.alert_configurations(empresa_id);
