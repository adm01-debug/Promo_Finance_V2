-- Tabela de pacotes de evidências exportados
CREATE TABLE public.evidencias_pacotes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  gerado_por UUID,
  gerado_por_email TEXT,
  periodo_inicio DATE NOT NULL,
  periodo_fim DATE NOT NULL,
  escopos TEXT[] NOT NULL,
  storage_path TEXT NOT NULL,
  manifest JSONB NOT NULL DEFAULT '{}'::jsonb,
  tamanho_bytes BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.evidencias_pacotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins veem pacotes de evidências"
  ON public.evidencias_pacotes FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins inserem pacotes de evidências"
  ON public.evidencias_pacotes FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_evidencias_pacotes_created ON public.evidencias_pacotes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_auditoria_financeira_created ON public.auditoria_financeira(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_auditoria_tributaria_criado ON public.auditoria_tributaria(criado_em DESC);