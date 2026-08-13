CREATE TABLE public.digest_envios_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  execucao_id UUID NOT NULL,
  user_id UUID,
  email TEXT NOT NULL,
  situacao TEXT NOT NULL CHECK (situacao IN ('enviado','ignorado','falhou','simulado')),
  motivo TEXT,
  erro TEXT,
  total_alertas INTEGER NOT NULL DEFAULT 0 CHECK (total_alertas >= 0),
  total_empresas INTEGER NOT NULL DEFAULT 0 CHECK (total_empresas >= 0),
  severidade_maxima TEXT CHECK (severidade_maxima IN ('baixa','media','alta','critica')),
  multa_total NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (multa_total >= 0),
  hash_conteudo TEXT,
  duplicado BOOLEAN NOT NULL DEFAULT false,
  simulado BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.digest_envios_log TO authenticated;
GRANT ALL ON public.digest_envios_log TO service_role;

ALTER TABLE public.digest_envios_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins podem consultar o log de envios do digest"
  ON public.digest_envios_log
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_digest_envios_log_created_at ON public.digest_envios_log (created_at DESC);
CREATE INDEX idx_digest_envios_log_situacao ON public.digest_envios_log (situacao, created_at DESC);
CREATE INDEX idx_digest_envios_log_email ON public.digest_envios_log (email, created_at DESC);
CREATE INDEX idx_digest_envios_log_execucao ON public.digest_envios_log (execucao_id);