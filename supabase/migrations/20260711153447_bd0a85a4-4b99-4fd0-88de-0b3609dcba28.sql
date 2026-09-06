
-- 1) Colunas de retry em webhooks_log
ALTER TABLE public.webhooks_log
  ADD COLUMN IF NOT EXISTS attempts INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS next_retry_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_error_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS external_id TEXT;

CREATE INDEX IF NOT EXISTS idx_webhooks_log_next_retry
  ON public.webhooks_log (next_retry_at)
  WHERE status IN ('pending','retrying') AND next_retry_at IS NOT NULL;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='webhooks_log' AND column_name='source') THEN
    CREATE INDEX IF NOT EXISTS idx_webhooks_log_source_ext
      ON public.webhooks_log (source, external_id)
      WHERE external_id IS NOT NULL;
  END IF;
END $$;

-- 2) DLQ
CREATE TABLE IF NOT EXISTS public.webhook_dlq (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source TEXT NOT NULL,
  event_type TEXT,
  external_id TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  headers JSONB DEFAULT '{}'::jsonb,
  error_message TEXT,
  attempts INTEGER NOT NULL DEFAULT 3,
  first_failed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_attempt_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, UPDATE ON public.webhook_dlq TO authenticated;
GRANT ALL ON public.webhook_dlq TO service_role;

ALTER TABLE public.webhook_dlq ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins podem visualizar DLQ" ON public.webhook_dlq;
CREATE POLICY "Admins podem visualizar DLQ"
ON public.webhook_dlq FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins podem atualizar DLQ" ON public.webhook_dlq;
CREATE POLICY "Admins podem atualizar DLQ"
ON public.webhook_dlq FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE INDEX IF NOT EXISTS idx_webhook_dlq_source ON public.webhook_dlq (source, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhook_dlq_unresolved ON public.webhook_dlq (created_at DESC) WHERE resolved_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_webhook_dlq_external ON public.webhook_dlq (source, external_id) WHERE external_id IS NOT NULL;

DROP TRIGGER IF EXISTS trg_webhook_dlq_updated ON public.webhook_dlq;
CREATE TRIGGER trg_webhook_dlq_updated
BEFORE UPDATE ON public.webhook_dlq
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3) Função de enfileiramento com backoff
CREATE OR REPLACE FUNCTION public.enqueue_webhook_retry(
  p_log_id UUID,
  p_source TEXT,
  p_event_type TEXT,
  p_external_id TEXT,
  p_payload JSONB,
  p_error TEXT,
  p_headers JSONB DEFAULT '{}'::jsonb
) RETURNS TABLE(action TEXT, next_retry_at TIMESTAMPTZ, attempts INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public','pg_catalog'
AS $$
DECLARE
  v_attempts INTEGER := 0;
  v_next TIMESTAMPTZ;
  v_backoff INTERVAL;
BEGIN
  -- Determinar tentativa atual
  IF p_log_id IS NOT NULL THEN
    SELECT COALESCE(wl.attempts, 0) + 1 INTO v_attempts
      FROM public.webhooks_log wl WHERE wl.id = p_log_id;
  ELSE
    v_attempts := 1;
  END IF;

  IF v_attempts >= 3 THEN
    -- Move para DLQ
    INSERT INTO public.webhook_dlq (
      source, event_type, external_id, payload, headers,
      error_message, attempts, last_attempt_at
    ) VALUES (
      p_source, p_event_type, p_external_id, COALESCE(p_payload,'{}'::jsonb),
      COALESCE(p_headers,'{}'::jsonb), p_error, v_attempts, now()
    );

    IF p_log_id IS NOT NULL THEN
      UPDATE public.webhooks_log
         SET status='dead', attempts=v_attempts, last_error_at=now(),
             error_message=p_error, next_retry_at=NULL
       WHERE id = p_log_id;
    END IF;

    RETURN QUERY SELECT 'moved_to_dlq'::TEXT, NULL::TIMESTAMPTZ, v_attempts;
    RETURN;
  END IF;

  -- Backoff exponencial: 1min, 5min, 30min
  v_backoff := CASE v_attempts
    WHEN 1 THEN INTERVAL '1 minute'
    WHEN 2 THEN INTERVAL '5 minutes'
    ELSE INTERVAL '30 minutes'
  END;
  v_next := now() + v_backoff;

  IF p_log_id IS NOT NULL THEN
    UPDATE public.webhooks_log
       SET status='retrying', attempts=v_attempts,
           next_retry_at=v_next, last_error_at=now(),
           error_message=p_error
     WHERE id = p_log_id;
  ELSE
    INSERT INTO public.webhooks_log (
      source, event_type, external_id, payload, status,
      error_message, attempts, next_retry_at, last_error_at
    ) VALUES (
      p_source, p_event_type, p_external_id, COALESCE(p_payload,'{}'::jsonb),
      'retrying', p_error, v_attempts, v_next, now()
    );
  END IF;

  RETURN QUERY SELECT 'scheduled_retry'::TEXT, v_next, v_attempts;
END;
$$;

REVOKE ALL ON FUNCTION public.enqueue_webhook_retry(UUID,TEXT,TEXT,TEXT,JSONB,TEXT,JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.enqueue_webhook_retry(UUID,TEXT,TEXT,TEXT,JSONB,TEXT,JSONB) TO service_role;

-- 4) Reprocessamento manual pelo admin
CREATE OR REPLACE FUNCTION public.reprocess_dlq(p_dlq_id UUID, p_notes TEXT DEFAULT NULL)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public','pg_catalog'
AS $$
DECLARE
  v_dlq public.webhook_dlq%ROWTYPE;
  v_new_log_id UUID;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem reprocessar DLQ.';
  END IF;

  SELECT * INTO v_dlq FROM public.webhook_dlq WHERE id = p_dlq_id AND resolved_at IS NULL;
  IF v_dlq IS NULL THEN
    RAISE EXCEPTION 'DLQ item não encontrado ou já resolvido';
  END IF;

  INSERT INTO public.webhooks_log (
    source, event_type, external_id, payload, status,
    attempts, next_retry_at
  ) VALUES (
    v_dlq.source, v_dlq.event_type, v_dlq.external_id, v_dlq.payload,
    'pending', 0, now()
  ) RETURNING id INTO v_new_log_id;

  UPDATE public.webhook_dlq
     SET resolved_at = now(),
         resolved_by = auth.uid(),
         notes = COALESCE(p_notes, notes)
   WHERE id = p_dlq_id;

  RETURN v_new_log_id;
END;
$$;

REVOKE ALL ON FUNCTION public.reprocess_dlq(UUID,TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reprocess_dlq(UUID,TEXT) TO authenticated;
