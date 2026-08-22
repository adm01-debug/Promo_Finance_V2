-- Reconcilia estruturas consumidas pela Edge Function decidir-regime.
-- A migration e idempotente para recuperar ambientes cujo historico foi
-- marcado como aplicado sem que estas tabelas tenham sido materializadas.

CREATE TABLE IF NOT EXISTS public.tax_audit_trail (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
  ano INTEGER CHECK (ano BETWEEN 2000 AND 2100),
  mes INTEGER CHECK (mes BETWEEN 1 AND 12),
  action TEXT NOT NULL CHECK (action IN ('simulated', 'cache_hit', 'decided', 'exported')),
  parameters JSONB,
  prompt TEXT,
  response TEXT,
  is_ai_justified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tax_audit_empresa
  ON public.tax_audit_trail (empresa_id, created_at DESC);

REVOKE ALL ON public.tax_audit_trail FROM anon, authenticated;
GRANT SELECT ON public.tax_audit_trail TO authenticated;
GRANT ALL ON public.tax_audit_trail TO service_role;
ALTER TABLE public.tax_audit_trail ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tax_audit_select" ON public.tax_audit_trail;
CREATE POLICY "tax_audit_select" ON public.tax_audit_trail
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR (empresa_id IS NOT NULL AND public.empresa_acessivel(empresa_id))
  );

CREATE TABLE IF NOT EXISTS public.regime_decision_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  ano INTEGER NOT NULL CHECK (ano BETWEEN 2000 AND 2100),
  mes INTEGER NOT NULL CHECK (mes BETWEEN 1 AND 12),
  decisao JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT regime_cache_unico UNIQUE (empresa_id, ano, mes)
);

CREATE INDEX IF NOT EXISTS idx_regime_cache_exp
  ON public.regime_decision_cache (expires_at DESC);

REVOKE ALL ON public.regime_decision_cache FROM anon, authenticated;
GRANT SELECT ON public.regime_decision_cache TO authenticated;
GRANT ALL ON public.regime_decision_cache TO service_role;
ALTER TABLE public.regime_decision_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "regime_cache_select" ON public.regime_decision_cache;
CREATE POLICY "regime_cache_select" ON public.regime_decision_cache
  FOR SELECT TO authenticated
  USING (public.empresa_acessivel(empresa_id));

DROP TRIGGER IF EXISTS trg_regime_cache_updated_at ON public.regime_decision_cache;
CREATE TRIGGER trg_regime_cache_updated_at
  BEFORE UPDATE ON public.regime_decision_cache
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
