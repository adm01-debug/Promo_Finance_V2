CREATE TABLE public.entregas_obrigacoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL,
  obrigacao_id TEXT NOT NULL,
  competencia TEXT NOT NULL,
  prazo DATE NOT NULL,
  data_entrega DATE,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente','entregue','dispensada','retificada')),
  protocolo TEXT,
  valor_multa NUMERIC(14,2) NOT NULL DEFAULT 0,
  observacoes TEXT,
  registrado_por UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT entregas_obrigacoes_unica UNIQUE (empresa_id, obrigacao_id, competencia),
  CONSTRAINT entregas_obrigacoes_competencia_fmt CHECK (competencia ~ '^[0-9]{4}-(0[1-9]|1[0-2])$')
);

CREATE INDEX idx_entregas_obrigacoes_empresa ON public.entregas_obrigacoes (empresa_id, competencia);
CREATE INDEX idx_entregas_obrigacoes_status ON public.entregas_obrigacoes (status, prazo);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.entregas_obrigacoes TO authenticated;
GRANT ALL ON public.entregas_obrigacoes TO service_role;

ALTER TABLE public.entregas_obrigacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY entregas_obrigacoes_admin_all ON public.entregas_obrigacoes
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY entregas_obrigacoes_empresa_select ON public.entregas_obrigacoes
  FOR SELECT TO authenticated
  USING (empresa_id IN (SELECT ue.empresa_id FROM public.user_empresas ue WHERE ue.user_id = auth.uid() AND ue.ativo = true));

CREATE POLICY entregas_obrigacoes_empresa_insert ON public.entregas_obrigacoes
  FOR INSERT TO authenticated
  WITH CHECK (empresa_id IN (SELECT ue.empresa_id FROM public.user_empresas ue WHERE ue.user_id = auth.uid() AND ue.ativo = true));

CREATE POLICY entregas_obrigacoes_empresa_update ON public.entregas_obrigacoes
  FOR UPDATE TO authenticated
  USING (empresa_id IN (SELECT ue.empresa_id FROM public.user_empresas ue WHERE ue.user_id = auth.uid() AND ue.ativo = true))
  WITH CHECK (empresa_id IN (SELECT ue.empresa_id FROM public.user_empresas ue WHERE ue.user_id = auth.uid() AND ue.ativo = true));

CREATE TRIGGER trg_entregas_obrigacoes_updated_at
  BEFORE UPDATE ON public.entregas_obrigacoes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();