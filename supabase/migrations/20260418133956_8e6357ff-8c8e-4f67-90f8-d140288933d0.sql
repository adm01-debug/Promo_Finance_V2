-- Tabela de verificações de conformidade fiscal
CREATE TABLE public.verificacoes_conformidade (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  periodo TEXT NOT NULL, -- formato YYYY-MM
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  nivel TEXT NOT NULL CHECK (nivel IN ('excelente', 'bom', 'atencao', 'critico')),
  itens JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_checks INTEGER NOT NULL DEFAULT 0,
  checks_aprovados INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_verif_conf_empresa_periodo
  ON public.verificacoes_conformidade(empresa_id, periodo DESC);

CREATE INDEX idx_verif_conf_created
  ON public.verificacoes_conformidade(created_at DESC);

ALTER TABLE public.verificacoes_conformidade ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin/financeiro/contador podem ler verificacoes"
  ON public.verificacoes_conformidade
  FOR SELECT
  TO authenticated
  USING (
    public.has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[])
    OR public.has_role(auth.uid(), 'visualizador'::app_role)
  );

CREATE POLICY "Service role pode inserir verificacoes"
  ON public.verificacoes_conformidade
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role pode atualizar verificacoes"
  ON public.verificacoes_conformidade
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE TRIGGER trg_verif_conf_updated_at
  BEFORE UPDATE ON public.verificacoes_conformidade
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();