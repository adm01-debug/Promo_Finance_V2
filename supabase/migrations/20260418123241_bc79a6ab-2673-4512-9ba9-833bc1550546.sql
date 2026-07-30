-- View otimizada para Dashboard Tributário v2
-- Agrega faturamento mensal × tributos calculados por empresa
CREATE OR REPLACE VIEW public.vw_tributario_dashboard
WITH (security_invoker = true)
AS
SELECT
  e.id AS empresa_id,
  e.razao_social,
  e.regime_tributario,
  EXTRACT(YEAR FROM at_.competencia::date)::int AS ano,
  EXTRACT(MONTH FROM at_.competencia::date)::int AS mes,
  at_.competencia,
  COALESCE(at_.total_geral, 0) AS total_tributos,
  COALESCE(at_.total_tributos_novos, 0) AS tributos_novos,
  COALESCE(at_.total_tributos_residuais, 0) AS tributos_residuais,
  COALESCE(at_.cbs_a_pagar, 0) AS cbs,
  COALESCE(at_.ibs_a_pagar, 0) AS ibs,
  COALESCE(at_.is_a_pagar, 0) AS imposto_seletivo,
  at_.status AS status_apuracao
FROM public.empresas e
LEFT JOIN public.apuracoes_tributarias at_ ON at_.empresa_id = e.id
WHERE e.id IS NOT NULL;

COMMENT ON VIEW public.vw_tributario_dashboard IS
'Dashboard Tributário v2: agrega apurações tributárias por empresa/competência. Security invoker respeita RLS de empresas e apuracoes_tributarias.';

-- Índice em apuracoes_tributarias para acelerar consultas (idempotente)
CREATE INDEX IF NOT EXISTS idx_apuracoes_tributarias_empresa_competencia
  ON public.apuracoes_tributarias (empresa_id, ano DESC, mes DESC);