DO $$ BEGIN
  CREATE TYPE public.tipo_cobranca AS ENUM ('boleto','pix','transferencia','cartao','debito_automatico','dinheiro','cheque');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============ RELATÓRIOS AGENDADOS ============
CREATE TABLE public.relatorios_agendados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  tipo_relatorio TEXT NOT NULL,
  frequencia TEXT NOT NULL CHECK (frequencia IN ('diario','semanal','quinzenal','mensal','trimestral')),
  dia_semana INTEGER CHECK (dia_semana IS NULL OR dia_semana BETWEEN 0 AND 6),
  dia_mes INTEGER CHECK (dia_mes IS NULL OR dia_mes BETWEEN 1 AND 31),
  hora_execucao TIME NOT NULL DEFAULT '08:00',
  empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
  centro_custo_id UUID,
  destinatarios TEXT[] NOT NULL DEFAULT '{}',
  filtros JSONB NOT NULL DEFAULT '{}'::jsonb,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  ultimo_envio TIMESTAMPTZ,
  proximo_envio TIMESTAMPTZ,
  created_by UUID NOT NULL DEFAULT auth.uid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_relat_agend_owner ON public.relatorios_agendados(created_by, ativo);
CREATE INDEX idx_relat_agend_proximo ON public.relatorios_agendados(proximo_envio) WHERE ativo;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.relatorios_agendados TO authenticated;
GRANT ALL ON public.relatorios_agendados TO service_role;
ALTER TABLE public.relatorios_agendados ENABLE ROW LEVEL SECURITY;
CREATE POLICY "relatorios_agendados_proprios" ON public.relatorios_agendados FOR ALL TO authenticated
  USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_relat_agend_updated_at BEFORE UPDATE ON public.relatorios_agendados
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============ HISTÓRICO DE EXECUÇÕES ============
CREATE TABLE public.historico_relatorios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  relatorio_agendado_id UUID NOT NULL REFERENCES public.relatorios_agendados(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'sucesso' CHECK (status IN ('sucesso','erro','parcial')),
  dados_relatorio JSONB,
  erro_mensagem TEXT,
  duracao_ms INTEGER,
  executado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_hist_relat_agendado ON public.historico_relatorios(relatorio_agendado_id, executado_em DESC);

GRANT SELECT ON public.historico_relatorios TO authenticated;
GRANT ALL ON public.historico_relatorios TO service_role;
ALTER TABLE public.historico_relatorios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "historico_relatorios_leitura" ON public.historico_relatorios FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.relatorios_agendados r
    WHERE r.id = relatorio_agendado_id
      AND (r.created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  ));

-- ============ PAGAMENTOS RECORRENTES ============
CREATE TABLE public.pagamentos_recorrentes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  descricao TEXT NOT NULL,
  fornecedor_id UUID,
  fornecedor_nome TEXT NOT NULL,
  valor NUMERIC(15,2) NOT NULL CHECK (valor >= 0),
  dia_vencimento INTEGER NOT NULL CHECK (dia_vencimento BETWEEN 1 AND 31),
  frequencia TEXT NOT NULL
    CHECK (frequencia IN ('semanal','quinzenal','mensal','bimestral','trimestral','semestral','anual')),
  data_inicio DATE NOT NULL,
  data_fim DATE,
  centro_custo_id UUID,
  conta_bancaria_id UUID,
  tipo_cobranca public.tipo_cobranca NOT NULL DEFAULT 'transferencia',
  observacoes TEXT,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  ultima_geracao DATE,
  proxima_geracao DATE,
  total_gerado INTEGER NOT NULL DEFAULT 0 CHECK (total_gerado >= 0),
  created_by UUID NOT NULL DEFAULT auth.uid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT pag_recorrente_periodo CHECK (data_fim IS NULL OR data_fim >= data_inicio)
);
CREATE INDEX idx_pag_recorr_empresa ON public.pagamentos_recorrentes(empresa_id, ativo);
CREATE INDEX idx_pag_recorr_proxima ON public.pagamentos_recorrentes(proxima_geracao) WHERE ativo;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.pagamentos_recorrentes TO authenticated;
GRANT ALL ON public.pagamentos_recorrentes TO service_role;
ALTER TABLE public.pagamentos_recorrentes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pagamentos_recorrentes_acesso" ON public.pagamentos_recorrentes FOR ALL TO authenticated
  USING (public.empresa_acessivel(empresa_id)) WITH CHECK (public.empresa_acessivel(empresa_id));
CREATE TRIGGER trg_pag_recorr_updated_at BEFORE UPDATE ON public.pagamentos_recorrentes
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();