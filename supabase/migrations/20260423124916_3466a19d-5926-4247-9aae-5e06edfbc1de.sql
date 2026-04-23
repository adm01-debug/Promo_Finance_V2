-- 1. Adiciona canal de e-mail às assinaturas
ALTER TABLE public.saved_filter_subscriptions
  ADD COLUMN IF NOT EXISTS notify_email BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.saved_filter_subscriptions.notify_email IS 'Se true, envia também por e-mail ao endereço cadastrado na conta do usuário';

-- 2. Histórico unificado de notificações (in-app, push, e-mail)
CREATE TABLE IF NOT EXISTS public.notification_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source TEXT NOT NULL,
  source_ref UUID,
  channel TEXT NOT NULL CHECK (channel IN ('inapp', 'push', 'email')),
  title TEXT NOT NULL,
  body TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'queued')),
  error_message TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notification_history_user_created
  ON public.notification_history (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_history_user_unread
  ON public.notification_history (user_id, read_at) WHERE read_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_notification_history_source
  ON public.notification_history (source, source_ref);

ALTER TABLE public.notification_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários veem seu próprio histórico"
  ON public.notification_history FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários marcam seu próprio histórico como lido"
  ON public.notification_history FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- INSERT é feito por edge functions com service_role; bloqueia inserts diretos do cliente
CREATE POLICY "Sistema insere via service role"
  ON public.notification_history FOR INSERT
  TO authenticated
  WITH CHECK (false);

COMMENT ON TABLE public.notification_history IS 'Histórico unificado de notificações enviadas ao usuário (in-app/push/e-mail), com status e metadata para auditoria e UI de "central de notificações"';