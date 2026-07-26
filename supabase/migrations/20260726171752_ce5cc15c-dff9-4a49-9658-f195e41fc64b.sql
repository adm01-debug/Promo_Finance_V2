CREATE TABLE public.conformidade_snapshots (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id uuid NOT NULL,
  competencia text NOT NULL,
  score numeric(5,1) NOT NULL,
  nivel text NOT NULL,
  total_obrigacoes integer NOT NULL DEFAULT 0,
  entregues integer NOT NULL DEFAULT 0,
  vencidas_pendentes integer NOT NULL DEFAULT 0,
  entregues_com_atraso integer NOT NULL DEFAULT 0,
  pontualidade numeric(5,1) NOT NULL DEFAULT 100,
  multa_registrada numeric(14,2) NOT NULL DEFAULT 0,
  gerado_por uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT conformidade_snapshots_competencia_fmt CHECK (competencia ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'),
  CONSTRAINT conformidade_snapshots_score_range CHECK (score >= 0 AND score <= 100),
  CONSTRAINT conformidade_snapshots_pontualidade_range CHECK (pontualidade >= 0 AND pontualidade <= 100),
  CONSTRAINT conformidade_snapshots_nivel_check CHECK (nivel IN ('critico','atencao','bom','excelente')),
  CONSTRAINT conformidade_snapshots_unica UNIQUE (empresa_id, competencia)
);

CREATE INDEX idx_conformidade_snapshots_empresa ON public.conformidade_snapshots (empresa_id, competencia DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.conformidade_snapshots TO authenticated;
GRANT ALL ON public.conformidade_snapshots TO service_role;

ALTER TABLE public.conformidade_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY conformidade_snapshots_admin_all ON public.conformidade_snapshots
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY conformidade_snapshots_empresa_select ON public.conformidade_snapshots
  FOR SELECT TO authenticated
  USING (empresa_id IN (SELECT ue.empresa_id FROM public.user_empresas ue WHERE ue.user_id = auth.uid() AND ue.ativo = true));

CREATE POLICY conformidade_snapshots_empresa_insert ON public.conformidade_snapshots
  FOR INSERT TO authenticated
  WITH CHECK (empresa_id IN (SELECT ue.empresa_id FROM public.user_empresas ue WHERE ue.user_id = auth.uid() AND ue.ativo = true));

CREATE POLICY conformidade_snapshots_empresa_update ON public.conformidade_snapshots
  FOR UPDATE TO authenticated
  USING (empresa_id IN (SELECT ue.empresa_id FROM public.user_empresas ue WHERE ue.user_id = auth.uid() AND ue.ativo = true))
  WITH CHECK (empresa_id IN (SELECT ue.empresa_id FROM public.user_empresas ue WHERE ue.user_id = auth.uid() AND ue.ativo = true));

CREATE TRIGGER trg_conformidade_snapshots_updated_at
  BEFORE UPDATE ON public.conformidade_snapshots
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();