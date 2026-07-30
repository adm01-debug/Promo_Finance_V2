
CREATE TABLE IF NOT EXISTS public.regras_contabilizacao_automatica (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL,
  nome text NOT NULL,
  tipo_evento text NOT NULL CHECK (tipo_evento IN ('conta_pagar','conta_receber','movimentacao')),
  categoria_id uuid,
  condicoes jsonb NOT NULL DEFAULT '{}'::jsonb,
  conta_debito_id uuid NOT NULL REFERENCES public.plano_contas(id) ON DELETE RESTRICT,
  conta_credito_id uuid NOT NULL REFERENCES public.plano_contas(id) ON DELETE RESTRICT,
  historico_template text NOT NULL DEFAULT '{descricao}',
  prioridade integer NOT NULL DEFAULT 100,
  ativo boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_regras_contab_emp_evento ON public.regras_contabilizacao_automatica(empresa_id, tipo_evento, ativo);

ALTER TABLE public.regras_contabilizacao_automatica ENABLE ROW LEVEL SECURITY;

CREATE POLICY "regras_contab_select" ON public.regras_contabilizacao_automatica
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "regras_contab_write" ON public.regras_contabilizacao_automatica
  FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin'::app_role,'financeiro'::app_role]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin'::app_role,'financeiro'::app_role]));

CREATE TABLE IF NOT EXISTS public.eventos_contabilizacao_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL,
  tipo_evento text NOT NULL,
  evento_id uuid NOT NULL,
  regra_id uuid REFERENCES public.regras_contabilizacao_automatica(id) ON DELETE SET NULL,
  lancamento_id uuid REFERENCES public.lancamentos_contabeis(id) ON DELETE SET NULL,
  status text NOT NULL CHECK (status IN ('sucesso','sem_regra','erro','duplicado')),
  detalhe text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_eventos_contab_emp ON public.eventos_contabilizacao_log(empresa_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS uq_eventos_contab_evento ON public.eventos_contabilizacao_log(tipo_evento, evento_id) WHERE status = 'sucesso';

ALTER TABLE public.eventos_contabilizacao_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "eventos_contab_select" ON public.eventos_contabilizacao_log
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "eventos_contab_insert" ON public.eventos_contabilizacao_log
  FOR INSERT TO authenticated
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin'::app_role,'financeiro'::app_role]));
