
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

  IF p_external_id IS NULL THEN
    INSERT INTO public.webhooks_log(source, external_id, event_type, payload, status, attempts, max_attempts)
    VALUES (p_source, NULL, p_event_type, COALESCE(p_payload, '{}'::jsonb), 'processing', 1, GREATEST(1, p_max_attempts))
    RETURNING * INTO v_row;
    id := v_row.id; status := v_row.status; attempts := v_row.attempts; already_processed := false;
    RETURN NEXT; RETURN;
  END IF;

  INSERT INTO public.webhooks_log(source, external_id, event_type, payload, status, attempts, max_attempts)
  VALUES (p_source, p_external_id, p_event_type, COALESCE(p_payload, '{}'::jsonb), 'processing', 1, GREATEST(1, p_max_attempts))
  ON CONFLICT (source, external_id) WHERE external_id IS NOT NULL DO NOTHING
  RETURNING * INTO v_row;

  IF v_row.id IS NOT NULL THEN
    id := v_row.id; status := v_row.status; attempts := v_row.attempts; already_processed := false;
    RETURN NEXT; RETURN;
  END IF;

  SELECT * INTO v_row
    FROM public.webhooks_log AS w
   WHERE w.source = p_source AND w.external_id = p_external_id
   FOR UPDATE;

  IF v_row.status = 'success' THEN
    id := v_row.id; status := v_row.status; attempts := v_row.attempts; already_processed := true;
    RETURN NEXT; RETURN;
  END IF;

  UPDATE public.webhooks_log AS w
     SET status        = 'processing',
         attempts      = w.attempts + 1,
         last_error_at = NULL
   WHERE w.id = v_row.id
  RETURNING * INTO v_row;

  id := v_row.id; status := v_row.status; attempts := v_row.attempts; already_processed := false;
  RETURN NEXT;
END;
$$;
