-- Tabela de convites para contadores (acesso read-only via token)
CREATE TABLE IF NOT EXISTS public.convites_contador (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  nome TEXT,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_convites_contador_empresa ON public.convites_contador(empresa_id);
CREATE INDEX IF NOT EXISTS idx_convites_contador_email ON public.convites_contador(email);
CREATE INDEX IF NOT EXISTS idx_convites_contador_expires ON public.convites_contador(expires_at) WHERE accepted_at IS NULL AND revoked_at IS NULL;

-- Trigger updated_at
DROP TRIGGER IF EXISTS trg_convites_contador_updated_at ON public.convites_contador;
CREATE TRIGGER trg_convites_contador_updated_at
  BEFORE UPDATE ON public.convites_contador
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.convites_contador ENABLE ROW LEVEL SECURITY;

-- Usuário vê convites que criou
CREATE POLICY "Usuario ve proprios convites"
  ON public.convites_contador FOR SELECT TO authenticated
  USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Usuário cria convite (apenas como ele mesmo)
CREATE POLICY "Usuario cria proprio convite"
  ON public.convites_contador FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());

-- Usuário/admin pode revogar (UPDATE limitado a revoked_at)
CREATE POLICY "Usuario revoga proprio convite"
  ON public.convites_contador FOR UPDATE TO authenticated
  USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));