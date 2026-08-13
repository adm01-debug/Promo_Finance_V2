CREATE TABLE public.overlay_rejeicoes_auditoria (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  catalogo TEXT NOT NULL CHECK (catalogo IN ('icms','iss','ncm','monofasico')),
  identificador TEXT NOT NULL,
  descricao TEXT,
  campo TEXT NOT NULL,
  motivo TEXT NOT NULL,
  valor_recebido TEXT,
  severidade TEXT NOT NULL DEFAULT 'critico' CHECK (severidade IN ('critico','atencao')),
  referencia DATE NOT NULL,
  ocorrencias INTEGER NOT NULL DEFAULT 1,
  primeira_deteccao TIMESTAMPTZ NOT NULL DEFAULT now(),
  ultima_deteccao TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolvido_em TIMESTAMPTZ,
  resolvido_por UUID,
  observacao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT overlay_rejeicoes_unicidade UNIQUE (catalogo, identificador, campo, motivo, referencia)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.overlay_rejeicoes_auditoria TO authenticated;
GRANT ALL ON public.overlay_rejeicoes_auditoria TO service_role;

ALTER TABLE public.overlay_rejeicoes_auditoria ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados leem auditoria de overlay"
  ON public.overlay_rejeicoes_auditoria FOR SELECT TO authenticated USING (true);

CREATE POLICY "Gestores inserem auditoria de overlay"
  ON public.overlay_rejeicoes_auditoria FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

CREATE POLICY "Gestores atualizam auditoria de overlay"
  ON public.overlay_rejeicoes_auditoria FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

CREATE POLICY "Gestores removem auditoria de overlay"
  ON public.overlay_rejeicoes_auditoria FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

CREATE INDEX idx_overlay_rejeicoes_catalogo ON public.overlay_rejeicoes_auditoria (catalogo, referencia DESC);
CREATE INDEX idx_overlay_rejeicoes_abertas ON public.overlay_rejeicoes_auditoria (resolvido_em) WHERE resolvido_em IS NULL;

CREATE TRIGGER trg_overlay_rejeicoes_updated_at
  BEFORE UPDATE ON public.overlay_rejeicoes_auditoria
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();