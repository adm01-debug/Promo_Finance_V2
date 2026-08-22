-- Reconcilia o contrato de relatórios agendados já consumido pela aplicação.
CREATE TABLE IF NOT EXISTS public.relatorios_agendados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  tipo_relatorio text NOT NULL,
  frequencia text NOT NULL CHECK (frequencia IN ('diario', 'semanal', 'quinzenal', 'mensal', 'trimestral')),
  dia_semana integer CHECK (dia_semana IS NULL OR dia_semana BETWEEN 0 AND 6),
  dia_mes integer CHECK (dia_mes IS NULL OR dia_mes BETWEEN 1 AND 31),
  hora_execucao time NOT NULL DEFAULT '08:00',
  empresa_id uuid REFERENCES public.empresas(id) ON DELETE CASCADE,
  centro_custo_id uuid,
  destinatarios text[] NOT NULL DEFAULT '{}',
  filtros jsonb NOT NULL DEFAULT '{}'::jsonb,
  ativo boolean NOT NULL DEFAULT true,
  ultimo_envio timestamptz,
  proximo_envio timestamptz,
  created_by uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.historico_relatorios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  relatorio_agendado_id uuid NOT NULL REFERENCES public.relatorios_agendados(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'sucesso' CHECK (status IN ('sucesso', 'erro', 'parcial')),
  dados_relatorio jsonb,
  erro_mensagem text,
  duracao_ms integer CHECK (duracao_ms IS NULL OR duracao_ms >= 0),
  executado_em timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.relatorios_agendados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historico_relatorios ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.relatorios_agendados TO authenticated;
GRANT SELECT ON public.historico_relatorios TO authenticated;
GRANT ALL ON public.relatorios_agendados, public.historico_relatorios TO service_role;

DROP POLICY IF EXISTS "relatorios_agendados_proprios" ON public.relatorios_agendados;
CREATE POLICY "relatorios_agendados_proprios" ON public.relatorios_agendados FOR ALL TO authenticated
  USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "historico_relatorios_leitura" ON public.historico_relatorios;
CREATE POLICY "historico_relatorios_leitura" ON public.historico_relatorios FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.relatorios_agendados r
    WHERE r.id = relatorio_agendado_id
      AND (r.created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  ));

CREATE INDEX IF NOT EXISTS idx_relat_agend_owner ON public.relatorios_agendados(created_by, ativo);
CREATE INDEX IF NOT EXISTS idx_relat_agend_proximo ON public.relatorios_agendados(proximo_envio) WHERE ativo;
CREATE INDEX IF NOT EXISTS idx_hist_relat_agendado ON public.historico_relatorios(relatorio_agendado_id, executado_em DESC);

DROP TRIGGER IF EXISTS trg_relat_agend_updated_at ON public.relatorios_agendados;
CREATE TRIGGER trg_relat_agend_updated_at BEFORE UPDATE ON public.relatorios_agendados
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

NOTIFY pgrst, 'reload schema';
