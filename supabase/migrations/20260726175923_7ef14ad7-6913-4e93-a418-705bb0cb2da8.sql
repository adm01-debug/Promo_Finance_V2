CREATE TABLE public.user_digest_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  ativo BOOLEAN NOT NULL DEFAULT true,
  frequencia TEXT NOT NULL DEFAULT 'diaria' CHECK (frequencia IN ('diaria','semanal','mensal')),
  dia_semana SMALLINT NOT NULL DEFAULT 1 CHECK (dia_semana BETWEEN 0 AND 6),
  dia_mes SMALLINT NOT NULL DEFAULT 1 CHECK (dia_mes BETWEEN 1 AND 28),
  hora_envio SMALLINT NOT NULL DEFAULT 8 CHECK (hora_envio BETWEEN 0 AND 23),
  severidade_minima TEXT NOT NULL DEFAULT 'media' CHECK (severidade_minima IN ('baixa','media','alta','critica')),
  tipos_ignorados TEXT[] NOT NULL DEFAULT '{}'::text[],
  empresas_filtro UUID[] NOT NULL DEFAULT '{}'::uuid[],
  email_alternativo TEXT CHECK (email_alternativo IS NULL OR email_alternativo ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  max_alertas INTEGER NOT NULL DEFAULT 50 CHECK (max_alertas BETWEEN 1 AND 500),
  ultimo_envio_em TIMESTAMP WITH TIME ZONE,
  ultimo_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_digest_preferences TO authenticated;
GRANT ALL ON public.user_digest_preferences TO service_role;

ALTER TABLE public.user_digest_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios gerenciam suas preferencias de digest"
  ON public.user_digest_preferences
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins visualizam preferencias de digest"
  ON public.user_digest_preferences
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_user_digest_preferences_ativo
  ON public.user_digest_preferences (ativo, frequencia, hora_envio);

CREATE TRIGGER tr_user_digest_preferences_updated_at
  BEFORE UPDATE ON public.user_digest_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();