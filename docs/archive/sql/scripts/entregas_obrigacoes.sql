-- Tabela: entregas_obrigacoes (Etapa I — Obrigações Acessórias)
-- Schema derivado de src/hooks/useEntregasObrigacoes.ts

CREATE TABLE IF NOT EXISTS public.entregas_obrigacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  obrigacao_id text NOT NULL,
  competencia text NOT NULL,
  prazo date NOT NULL,
  data_entrega date,
  status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'entregue', 'dispensada', 'retificada')),
  protocolo text,
  valor_multa numeric(18,2) NOT NULL DEFAULT 0,
  observacoes text,
  registrado_por uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT entregas_obrigacoes_uniq UNIQUE (empresa_id, obrigacao_id, competencia)
);

CREATE INDEX IF NOT EXISTS idx_entregas_obrigacoes_empresa ON public.entregas_obrigacoes(empresa_id);
CREATE INDEX IF NOT EXISTS idx_entregas_obrigacoes_competencia ON public.entregas_obrigacoes(competencia);
CREATE INDEX IF NOT EXISTS idx_entregas_obrigacoes_status ON public.entregas_obrigacoes(status);

ALTER TABLE public.entregas_obrigacoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS entregas_obrigacoes_select_all ON public.entregas_obrigacoes;
CREATE POLICY entregas_obrigacoes_select_all ON public.entregas_obrigacoes
  FOR SELECT USING (true);

DROP POLICY IF EXISTS entregas_obrigacoes_admin_all ON public.entregas_obrigacoes;
CREATE POLICY entregas_obrigacoes_admin_all ON public.entregas_obrigacoes
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'super_admin'))
  );

NOTIFY pgrst, 'reload schema';
