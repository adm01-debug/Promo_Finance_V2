
-- 1) Colunas de controle
ALTER TABLE public.webhooks_log
  ADD COLUMN IF NOT EXISTS processed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS max_attempts INTEGER NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS dlq_id UUID REFERENCES public.webhook_dlq(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS last_response JSONB;

-- 2) Índice único (source, external_id) — idempotência atômica
--    Só quando external_id não é nulo (webhooks sem ID não podem ser deduplicados).
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'webhooks_log'
      AND column_name = 'source'
  ) THEN
    CREATE UNIQUE INDEX IF NOT EXISTS ux_webhooks_log_source_external
      ON public.webhooks_log (source, external_id)
      WHERE external_id IS NOT NULL;
  END IF;
END $$;

-- 3) Reserva atômica (claim). Se já existir (source, external_id):
--    - devolve linha existente + already_processed=true quando status='success'
--    - devolve linha existente + already_processed=false para permitir replay explícito
--    Se não existir: cria com status='processing' e attempts=1.
CREATE OR REPLACE FUNCTION public.webhook_claim(
  p_source        TEXT,
  p_external_id   TEXT,
  p_event_type    TEXT,
  p_payload       JSONB,
  p_max_attempts  INTEGER DEFAULT 5
) RETURNS TABLE (
  id UUID,
  status TEXT,
  attempts INTEGER,
  already_processed BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.webhooks_log%ROWTYPE;
BEGIN
  IF p_source IS NULL OR length(trim(p_source)) = 0 THEN
    RAISE EXCEPTION 'source is required';
  END IF;

  -- Sem external_id: insere sempre, sem dedup (webhook incapaz de ser deduplicado).
  IF p_external_id IS NULL THEN
    INSERT INTO public.webhooks_log(source, external_id, event_type, payload, status, attempts, max_attempts)
    VALUES (p_source, NULL, p_event_type, COALESCE(p_payload, '{}'::jsonb), 'processing', 1, GREATEST(1, p_max_attempts))
    RETURNING * INTO v_row;
    RETURN QUERY SELECT v_row.id, v_row.status, v_row.attempts, false;
    RETURN;
  END IF;

  -- Tenta inserir; conflito → carrega existente.
  INSERT INTO public.webhooks_log(source, external_id, event_type, payload, status, attempts, max_attempts)
  VALUES (p_source, p_external_id, p_event_type, COALESCE(p_payload, '{}'::jsonb), 'processing', 1, GREATEST(1, p_max_attempts))
  ON CONFLICT (source, external_id) WHERE external_id IS NOT NULL DO NOTHING
  RETURNING * INTO v_row;

  IF v_row.id IS NOT NULL THEN
    RETURN QUERY SELECT v_row.id, v_row.status, v_row.attempts, false;
    RETURN;
  END IF;

  -- Já existe: bloqueia a linha para decisão de replay/reprocesso.
  SELECT * INTO v_row
    FROM public.webhooks_log
   WHERE source = p_source AND external_id = p_external_id
   FOR UPDATE;

  IF v_row.status = 'success' THEN
    RETURN QUERY SELECT v_row.id, v_row.status, v_row.attempts, true;
    RETURN;
  END IF;

  -- Reprocesso: incrementa attempts, marca como processing.
  UPDATE public.webhooks_log
     SET status        = 'processing',
         attempts      = attempts + 1,
         last_error_at = NULL
   WHERE id = v_row.id
  RETURNING * INTO v_row;

  RETURN QUERY SELECT v_row.id, v_row.status, v_row.attempts, false;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.webhook_claim(TEXT,TEXT,TEXT,JSONB,INTEGER) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.webhook_claim(TEXT,TEXT,TEXT,JSONB,INTEGER) TO service_role;

-- 4) Marca sucesso
CREATE OR REPLACE FUNCTION public.webhook_mark_success(
  p_id UUID,
  p_response JSONB DEFAULT NULL
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.webhooks_log
     SET status        = 'success',
         processed_at  = now(),
         last_response = p_response,
         error_message = NULL,
         next_retry_at = NULL
   WHERE id = p_id;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.webhook_mark_success(UUID,JSONB) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.webhook_mark_success(UUID,JSONB) TO service_role;

-- 5) Marca falha com backoff exponencial (2^attempts min, cap 60min) + promoção a DLQ.
CREATE OR REPLACE FUNCTION public.webhook_mark_failure(
  p_id UUID,
  p_error TEXT,
  p_retryable BOOLEAN DEFAULT true
) RETURNS TABLE (status TEXT, will_retry BOOLEAN, next_retry_at TIMESTAMPTZ, dlq_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.webhooks_log%ROWTYPE;
  v_backoff INTERVAL;
  v_dlq UUID;
  v_final_status TEXT;
  v_will_retry BOOLEAN := false;
  v_next TIMESTAMPTZ;
BEGIN
  SELECT * INTO v_row FROM public.webhooks_log WHERE id = p_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'webhook % not found', p_id;
  END IF;

  IF p_retryable AND v_row.attempts < v_row.max_attempts THEN
    -- 2^attempts minutos, cap 60min
    v_backoff := make_interval(mins => LEAST(60, POWER(2, v_row.attempts)::INT));
    v_next := now() + v_backoff;
    v_final_status := 'retrying';
    v_will_retry := true;

    UPDATE public.webhooks_log
       SET status        = 'retrying',
           error_message = p_error,
           last_error_at = now(),
           next_retry_at = v_next
     WHERE id = p_id;
  ELSE
    -- Sem retry: promove ao DLQ
    v_final_status := 'dead';
    INSERT INTO public.webhook_dlq(source, event_type, external_id, payload, error_message, attempts)
    VALUES (v_row.source, v_row.event_type, v_row.external_id, v_row.payload, p_error, v_row.attempts)
    RETURNING id INTO v_dlq;

    UPDATE public.webhooks_log
       SET status        = 'dead',
           error_message = p_error,
           last_error_at = now(),
           next_retry_at = NULL,
           dlq_id        = v_dlq
     WHERE id = p_id;
  END IF;

  RETURN QUERY SELECT v_final_status, v_will_retry, v_next, v_dlq;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.webhook_mark_failure(UUID,TEXT,BOOLEAN) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.webhook_mark_failure(UUID,TEXT,BOOLEAN) TO service_role;

-- 6) Replay explícito (admin ou service_role): agenda para reprocessamento imediato.
CREATE OR REPLACE FUNCTION public.webhook_replay(p_id UUID)
RETURNS public.webhooks_log
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.webhooks_log%ROWTYPE;
BEGIN
  -- Guarda: só admin ou service_role (auth.uid() nulo).
  IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'unauthorized: admin role required to replay webhooks';
  END IF;

  UPDATE public.webhooks_log
     SET status        = 'pending',
         next_retry_at = now(),
         attempts      = LEAST(attempts, max_attempts - 1),
         error_message = NULL,
         last_error_at = NULL,
         dlq_id        = NULL
   WHERE id = p_id
  RETURNING * INTO v_row;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'webhook % not found', p_id;
  END IF;

  -- Se veio de DLQ, marca DLQ como resolvido.
  IF v_row.dlq_id IS NOT NULL THEN
    UPDATE public.webhook_dlq
       SET resolved_at = now(),
           notes = COALESCE(notes,'') || E'\nRe-enfileirado via webhook_replay em ' || now()::text
     WHERE id = v_row.dlq_id;
  END IF;

  RETURN v_row;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.webhook_replay(UUID) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.webhook_replay(UUID) TO authenticated, service_role;

-- 7) Fila de reprocessamento: retorna N webhooks prontos para retry, bloqueando-os.
CREATE OR REPLACE FUNCTION public.webhook_dequeue_retries(p_limit INTEGER DEFAULT 25)
RETURNS SETOF public.webhooks_log
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  UPDATE public.webhooks_log
     SET status = 'processing'
   WHERE id IN (
     SELECT id
       FROM public.webhooks_log
      WHERE status IN ('pending','retrying')
        AND next_retry_at IS NOT NULL
        AND next_retry_at <= now()
      ORDER BY next_retry_at ASC
      LIMIT GREATEST(1, p_limit)
      FOR UPDATE SKIP LOCKED
   )
  RETURNING *;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.webhook_dequeue_retries(INTEGER) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.webhook_dequeue_retries(INTEGER) TO service_role;
