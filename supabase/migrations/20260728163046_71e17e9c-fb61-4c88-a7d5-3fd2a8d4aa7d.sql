-- ============ 1) Fechamentos tributários ============
CREATE TABLE IF NOT EXISTS public.fechamentos_tributarios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  ano INTEGER NOT NULL CHECK (ano BETWEEN 2000 AND 2100),
  mes INTEGER NOT NULL CHECK (mes BETWEEN 1 AND 12),
  status TEXT NOT NULL DEFAULT 'aberto' CHECK (status IN ('aberto','em_revisao','fechado','reaberto')),
  checklist JSONB NOT NULL DEFAULT '[]'::jsonb,
  score_conformidade NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (score_conformidade BETWEEN 0 AND 100),
  total_apurado NUMERIC(16,2) NOT NULL DEFAULT 0,
  observacoes TEXT,
  forcado BOOLEAN NOT NULL DEFAULT false,
  justificativa_forcado TEXT,
  fechado_por UUID,
  fechado_em TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT fechamento_unico UNIQUE (empresa_id, ano, mes),
  CONSTRAINT fechamento_forcado_justificado CHECK (
    NOT forcado OR (justificativa_forcado IS NOT NULL AND char_length(btrim(justificativa_forcado)) >= 10)
  )
);

CREATE INDEX IF NOT EXISTS idx_fechamentos_empresa_periodo
  ON public.fechamentos_tributarios (empresa_id, ano DESC, mes DESC);

GRANT SELECT, INSERT, UPDATE ON public.fechamentos_tributarios TO authenticated;
GRANT ALL ON public.fechamentos_tributarios TO service_role;
ALTER TABLE public.fechamentos_tributarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fechamentos_select" ON public.fechamentos_tributarios
  FOR SELECT TO authenticated USING (public.empresa_acessivel(empresa_id));
CREATE POLICY "fechamentos_insert" ON public.fechamentos_tributarios
  FOR INSERT TO authenticated WITH CHECK (public.empresa_acessivel(empresa_id));
CREATE POLICY "fechamentos_update" ON public.fechamentos_tributarios
  FOR UPDATE TO authenticated
  USING (public.empresa_acessivel(empresa_id))
  WITH CHECK (public.empresa_acessivel(empresa_id));

CREATE TRIGGER trg_fechamentos_updated_at
  BEFORE UPDATE ON public.fechamentos_tributarios
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============ 2) Auditoria tributária ============
CREATE TABLE IF NOT EXISTS public.auditoria_tributaria (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID REFERENCES public.empresas(id) ON DELETE SET NULL,
  user_id UUID,
  user_email TEXT,
  acao TEXT NOT NULL CHECK (acao IN ('insert','update','delete')),
  entidade_tipo TEXT NOT NULL CHECK (char_length(entidade_tipo) BETWEEN 1 AND 120),
  entidade_id UUID,
  payload_anterior JSONB,
  payload_novo JSONB,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_auditoria_trib_criado ON public.auditoria_tributaria (criado_em DESC);
CREATE INDEX IF NOT EXISTS idx_auditoria_trib_entidade ON public.auditoria_tributaria (entidade_tipo, entidade_id);

GRANT SELECT ON public.auditoria_tributaria TO authenticated;
GRANT ALL ON public.auditoria_tributaria TO service_role;
ALTER TABLE public.auditoria_tributaria ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auditoria_trib_select_admin" ON public.auditoria_tributaria
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE VIEW public.vw_auditoria_tributaria_recente
WITH (security_invoker = true) AS
SELECT
  a.id,
  a.empresa_id,
  e.razao_social AS empresa_nome,
  a.user_id,
  p.full_name AS user_nome,
  a.user_email,
  a.acao,
  a.entidade_tipo,
  a.entidade_id,
  a.payload_anterior,
  a.payload_novo,
  a.criado_em
FROM public.auditoria_tributaria a
LEFT JOIN public.empresas e ON e.id = a.empresa_id
LEFT JOIN public.profiles p ON p.user_id = a.user_id
ORDER BY a.criado_em DESC
LIMIT 500;

GRANT SELECT ON public.vw_auditoria_tributaria_recente TO authenticated;

-- ============ 3) Trilha e cache de decisão de regime ============
CREATE TABLE IF NOT EXISTS public.tax_audit_trail (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
  ano INTEGER CHECK (ano BETWEEN 2000 AND 2100),
  mes INTEGER CHECK (mes BETWEEN 1 AND 12),
  action TEXT NOT NULL CHECK (action IN ('simulated','cache_hit','decided','exported')),
  parameters JSONB,
  prompt TEXT,
  response TEXT,
  is_ai_justified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tax_audit_empresa ON public.tax_audit_trail (empresa_id, created_at DESC);

GRANT SELECT ON public.tax_audit_trail TO authenticated;
GRANT ALL ON public.tax_audit_trail TO service_role;
ALTER TABLE public.tax_audit_trail ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tax_audit_select" ON public.tax_audit_trail
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR (empresa_id IS NOT NULL AND public.empresa_acessivel(empresa_id)));

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

CREATE INDEX IF NOT EXISTS idx_regime_cache_exp ON public.regime_decision_cache (expires_at DESC);

GRANT SELECT ON public.regime_decision_cache TO authenticated;
GRANT ALL ON public.regime_decision_cache TO service_role;
ALTER TABLE public.regime_decision_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "regime_cache_select" ON public.regime_decision_cache
  FOR SELECT TO authenticated USING (public.empresa_acessivel(empresa_id));

CREATE TRIGGER trg_regime_cache_updated_at
  BEFORE UPDATE ON public.regime_decision_cache
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============ 4) Relatórios tributários agendados ============
CREATE TABLE IF NOT EXISTS public.relatorios_tributarios_agendados (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  ano INTEGER NOT NULL CHECK (ano BETWEEN 2000 AND 2100),
  frequencia TEXT NOT NULL DEFAULT 'mensal' CHECK (frequencia IN ('mensal','trimestral','anual')),
  dia_envio INTEGER NOT NULL DEFAULT 1 CHECK (dia_envio BETWEEN 1 AND 28),
  destinatarios TEXT[] NOT NULL DEFAULT '{}'::text[],
  ativo BOOLEAN NOT NULL DEFAULT true,
  ultimo_envio_em TIMESTAMPTZ,
  proximo_envio_em TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rel_trib_agend_proximo
  ON public.relatorios_tributarios_agendados (ativo, proximo_envio_em);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.relatorios_tributarios_agendados TO authenticated;
GRANT ALL ON public.relatorios_tributarios_agendados TO service_role;
ALTER TABLE public.relatorios_tributarios_agendados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rel_trib_agend_all" ON public.relatorios_tributarios_agendados
  FOR ALL TO authenticated
  USING (public.empresa_acessivel(empresa_id))
  WITH CHECK (public.empresa_acessivel(empresa_id));

CREATE TRIGGER trg_rel_trib_agend_updated_at
  BEFORE UPDATE ON public.relatorios_tributarios_agendados
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============ 5) Painel tributário + benchmark setorial ============
CREATE OR REPLACE VIEW public.vw_tributario_dashboard
WITH (security_invoker = true) AS
SELECT
  e.id AS empresa_id,
  e.razao_social,
  COALESCE(rt.regime_nome, 'nao_informado') AS regime_tributario,
  at_.ano,
  at_.mes,
  at_.competencia,
  COALESCE(at_.total_geral, 0) AS total_tributos,
  COALESCE(at_.total_tributos_novos, 0) AS tributos_novos,
  COALESCE(at_.total_tributos_residuais, 0) AS tributos_residuais,
  COALESCE(at_.cbs_a_pagar, 0) AS cbs,
  COALESCE(at_.ibs_a_pagar, 0) AS ibs,
  COALESCE(at_.is_a_pagar, 0) AS imposto_seletivo,
  at_.status AS status_apuracao
FROM public.empresas e
JOIN public.apuracoes_tributarias at_ ON at_.empresa_id = e.id
LEFT JOIN LATERAL (
  SELECT r.regime_nome
  FROM public.regimes_tributarios r
  WHERE r.empresa_id = e.id AND COALESCE(r.ativo, true)
  ORDER BY r.data_inicio DESC NULLS LAST
  LIMIT 1
) rt ON true;

GRANT SELECT ON public.vw_tributario_dashboard TO authenticated;

DROP MATERIALIZED VIEW IF EXISTS public.mv_benchmark_setorial;
CREATE MATERIALIZED VIEW public.mv_benchmark_setorial AS
WITH carga AS (
  SELECT regime_tributario AS regime, empresa_id, SUM(total_tributos)::numeric AS total_12m
  FROM public.vw_tributario_dashboard
  WHERE ano IS NOT NULL AND mes IS NOT NULL
    AND (ano * 12 + mes) >= (EXTRACT(YEAR FROM CURRENT_DATE)::int * 12 + EXTRACT(MONTH FROM CURRENT_DATE)::int - 12)
  GROUP BY regime_tributario, empresa_id
)
SELECT
  regime,
  COUNT(*) AS amostra,
  percentile_cont(0.25) WITHIN GROUP (ORDER BY total_12m) AS p25,
  percentile_cont(0.5)  WITHIN GROUP (ORDER BY total_12m) AS mediana,
  percentile_cont(0.75) WITHIN GROUP (ORDER BY total_12m) AS p75,
  AVG(total_12m) AS media,
  now() AS atualizado_em
FROM carga
GROUP BY regime;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_benchmark_regime ON public.mv_benchmark_setorial(regime);