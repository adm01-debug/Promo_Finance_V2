DO $$ BEGIN
  CREATE TYPE public.subscription_frequencia AS ENUM ('imediata','horaria','diaria');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.saved_filter_subscriptions
  ADD COLUMN IF NOT EXISTS frequencia public.subscription_frequencia NOT NULL DEFAULT 'imediata',
  ADD COLUMN IF NOT EXISTS horario_preferido TIME NOT NULL DEFAULT '09:00:00',
  ADD COLUMN IF NOT EXISTS next_dispatch_at TIMESTAMPTZ;

COMMENT ON COLUMN public.saved_filter_subscriptions.frequencia IS 'Cadência de notificações: imediata=tempo real, horaria=agrupa por hora, diaria=envia uma vez por dia no horario_preferido';
COMMENT ON COLUMN public.saved_filter_subscriptions.horario_preferido IS 'Horário (timezone do usuário no client) usado para entregar notificações diárias e como referência para horárias';
COMMENT ON COLUMN public.saved_filter_subscriptions.next_dispatch_at IS 'Próximo instante em que o cliente pode despachar notificações pendentes acumuladas; NULL = imediata';