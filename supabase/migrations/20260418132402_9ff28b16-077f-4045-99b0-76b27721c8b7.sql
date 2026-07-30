-- ============ 1. CACHE DE DECISÕES DE REGIME ============
CREATE TABLE IF NOT EXISTS public.regime_decision_cache (
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  ano INTEGER NOT NULL,
  mes INTEGER NOT NULL,
  decisao JSONB NOT NULL,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  PRIMARY KEY (empresa_id, ano, mes)
);

CREATE INDEX IF NOT EXISTS idx_regime_decision_cache_expires
  ON public.regime_decision_cache(expires_at);

ALTER TABLE public.regime_decision_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "regime_cache_read_authorized"
  ON public.regime_decision_cache
  FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'financeiro')
  );

-- Service role escreve (sem política = só service_role bypass RLS)

-- Trigger: invalida cache ao inserir/atualizar apuração tributária
CREATE OR REPLACE FUNCTION public.fn_invalidar_regime_cache()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.regime_decision_cache
  WHERE empresa_id = COALESCE(NEW.empresa_id, OLD.empresa_id)
    AND ano = COALESCE(NEW.ano, OLD.ano)
    AND mes = COALESCE(NEW.mes, OLD.mes);
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_invalidar_regime_cache ON public.apuracoes_tributarias;
CREATE TRIGGER trg_invalidar_regime_cache
  AFTER INSERT OR UPDATE OR DELETE ON public.apuracoes_tributarias
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_invalidar_regime_cache();

-- ============ 2. RELATÓRIOS AGENDADOS ============
DO $$ BEGIN
  CREATE TYPE public.frequencia_relatorio AS ENUM ('mensal', 'trimestral', 'anual');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.relatorios_tributarios_agendados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  ano INTEGER NOT NULL,
  frequencia public.frequencia_relatorio NOT NULL DEFAULT 'mensal',
  dia_envio INTEGER NOT NULL DEFAULT 1 CHECK (dia_envio BETWEEN 1 AND 28),
  destinatarios TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ativo BOOLEAN NOT NULL DEFAULT true,
  ultimo_envio_em TIMESTAMPTZ,
  proximo_envio_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rel_trib_agend_proximo
  ON public.relatorios_tributarios_agendados(proximo_envio_em)
  WHERE ativo = true;

CREATE INDEX IF NOT EXISTS idx_rel_trib_agend_empresa
  ON public.relatorios_tributarios_agendados(empresa_id);

ALTER TABLE public.relatorios_tributarios_agendados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rel_trib_agend_admin_fin_select"
  ON public.relatorios_tributarios_agendados
  FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'financeiro')
  );

CREATE POLICY "rel_trib_agend_admin_fin_insert"
  ON public.relatorios_tributarios_agendados
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'financeiro')
  );

CREATE POLICY "rel_trib_agend_admin_fin_update"
  ON public.relatorios_tributarios_agendados
  FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'financeiro')
  );

CREATE POLICY "rel_trib_agend_admin_delete"
  ON public.relatorios_tributarios_agendados
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_rel_trib_agend_updated_at
  BEFORE UPDATE ON public.relatorios_tributarios_agendados
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();