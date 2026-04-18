-- Tabela de cache CNPJá
CREATE TABLE public.cnpja_cache (
  cnpj TEXT PRIMARY KEY CHECK (length(cnpj) = 14),
  data JSONB NOT NULL,
  situacao_cadastral TEXT,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_cnpja_cache_expires_at ON public.cnpja_cache(expires_at);

ALTER TABLE public.cnpja_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins podem ver cache CNPJá"
  ON public.cnpja_cache FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Tabela de rate limit CNPJá
CREATE TABLE public.cnpja_rate_limit (
  user_id UUID NOT NULL,
  window_start TIMESTAMPTZ NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, window_start)
);

CREATE INDEX idx_cnpja_rate_limit_window ON public.cnpja_rate_limit(window_start);

ALTER TABLE public.cnpja_rate_limit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuário vê próprio uso CNPJá"
  ON public.cnpja_rate_limit FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Função para verificar e incrementar rate limit
CREATE OR REPLACE FUNCTION public.cnpja_check_rate_limit(
  _user_id UUID,
  _max INTEGER DEFAULT 10,
  _window_minutes INTEGER DEFAULT 60
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_window TIMESTAMPTZ;
  v_count INTEGER;
BEGIN
  v_window := date_trunc('minute', now()) - (EXTRACT(MINUTE FROM now())::INTEGER % _window_minutes) * INTERVAL '1 minute';

  INSERT INTO public.cnpja_rate_limit (user_id, window_start, request_count)
  VALUES (_user_id, v_window, 1)
  ON CONFLICT (user_id, window_start)
  DO UPDATE SET request_count = cnpja_rate_limit.request_count + 1
  RETURNING request_count INTO v_count;

  -- Limpa janelas antigas (best-effort)
  DELETE FROM public.cnpja_rate_limit
  WHERE window_start < now() - INTERVAL '1 day';

  RETURN v_count <= _max;
END;
$$;