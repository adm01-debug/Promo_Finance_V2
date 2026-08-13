-- ============================================================
-- pgTAP: ciclo de integridade (2026-07-28)
-- ------------------------------------------------------------
-- Testes de regressão para:
--   * CHECK de domínio em integrity_alerts (inclui 'nfe' e 'nfe_sefaz')
--   * close_stale_integrity_alerts: encerramento, reincidência,
--     janela de carência, idempotência e isolamento por domínio
--   * run_integrity_cycle: contrato de retorno e ausência de exceção
--   * Blindagem de execução (anon/authenticated não executam)
--
-- Como rodar:
--   psql "$DATABASE_URL" -f supabase/tests/sql/integrity_cycle.test.sql
--   supabase test db
-- ============================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgtap;

SELECT plan(23);

-- Horas de referência determinísticas (fora de qualquer hora real de produção
-- para não colidir com o unique (domain, invariant, alert_hour)).
CREATE TEMP TABLE _t AS
SELECT
  timestamptz '2001-01-01 10:00:00+00' AS h_velha,
  timestamptz '2001-01-01 12:00:00+00' AS h_media,
  timestamptz '2001-01-01 14:00:00+00' AS h_atual;

-- ---------------------------------------------------------------------------
-- 1) CHECK de domínio deve aceitar 'nfe' (regressão: bloqueava
--    check_nfe_xml_path_invariants com 23514)
-- ---------------------------------------------------------------------------
SELECT lives_ok(
  $$INSERT INTO public.integrity_alerts
      (domain, invariant, severity, alert_hour, affected_count, reason)
    VALUES ('nfe','_t_layout','warning', timestamptz '2001-01-01 10:00:00+00', 3, 'fixture')$$,
  'integrity_alerts deve aceitar domain = nfe'
);

SELECT lives_ok(
  $$INSERT INTO public.integrity_alerts
      (domain, invariant, severity, alert_hour, affected_count, reason)
    VALUES ('nfe_sefaz','_t_gap','critical', timestamptz '2001-01-01 10:00:00+00', 1, 'fixture')$$,
  'integrity_alerts deve aceitar domain = nfe_sefaz'
);

SELECT throws_ok(
  $$INSERT INTO public.integrity_alerts
      (domain, invariant, severity, alert_hour, affected_count, reason)
    VALUES ('dominio_inexistente','_t','warning', timestamptz '2001-01-01 10:00:00+00', 1, 'fixture')$$,
  '23514',
  NULL,
  'domínio desconhecido deve ser rejeitado pelo CHECK'
);

SELECT throws_ok(
  $$INSERT INTO public.integrity_alerts
      (domain, invariant, severity, alert_hour, affected_count, reason)
    VALUES ('nfe','_t','urgentissimo', timestamptz '2001-01-01 10:00:00+00', 1, 'fixture')$$,
  '23514',
  NULL,
  'severidade fora do CHECK deve ser rejeitada'
);

-- ---------------------------------------------------------------------------
-- 2) Fixtures do cenário de encerramento
--    (nfe_sefaz/_t_gap @10:00 já foi criado no teste 2 acima)
-- ---------------------------------------------------------------------------
INSERT INTO public.integrity_alerts
  (domain, invariant, severity, alert_hour, affected_count, reason)
VALUES
  -- (a) antigo e não reincidente -> deve encerrar
  ('financeiro','_t_orfao','warning', timestamptz '2001-01-01 10:00:00+00', 2, 'fixture orfao'),
  -- (b) antigo MAS reincidente na hora atual -> deve permanecer aberto
  ('financeiro','_t_vivo','critical', timestamptz '2001-01-01 10:00:00+00', 5, 'fixture vivo'),
  ('financeiro','_t_vivo','critical', timestamptz '2001-01-01 14:00:00+00', 5, 'fixture vivo atual'),
  -- (c) domínio fora da lista -> intocado
  ('entrega','_t_outro','warning', timestamptz '2001-01-01 10:00:00+00', 1, 'fixture outro dominio'),
  -- (d) recente (dentro da carência de 3h) -> intocado quando há grace
  ('nfe_sefaz','_t_recente','warning', timestamptz '2001-01-01 12:00:00+00', 1, 'fixture recente');

-- ---------------------------------------------------------------------------
-- 3) Encerramento sem carência
-- ---------------------------------------------------------------------------
SELECT is(
  public.close_stale_integrity_alerts(
    timestamptz '2001-01-01 14:00:00+00', ARRAY['financeiro'], interval '0'
  ),
  1,
  'deve encerrar exatamente 1 alerta (o não reincidente)'
);

SELECT isnt(
  (SELECT resolved_at FROM public.integrity_alerts
    WHERE domain='financeiro' AND invariant='_t_orfao'),
  NULL,
  'alerta não reincidente deve ficar com resolved_at preenchido'
);

SELECT matches(
  (SELECT resolved_reason FROM public.integrity_alerts
    WHERE domain='financeiro' AND invariant='_t_orfao'),
  '^auto:',
  'resolved_reason deve registrar a origem automática do encerramento'
);

SELECT is(
  (SELECT count(*)::int FROM public.integrity_alerts
    WHERE domain='financeiro' AND invariant='_t_vivo' AND resolved_at IS NULL),
  2,
  'invariante reincidente na hora atual não pode ser encerrado'
);

SELECT is(
  (SELECT resolved_at FROM public.integrity_alerts
    WHERE domain='entrega' AND invariant='_t_outro'),
  NULL,
  'domínio fora de p_domains deve permanecer intocado'
);

-- ---------------------------------------------------------------------------
-- 4) Idempotência — segunda execução não deve encerrar nada de novo
-- ---------------------------------------------------------------------------
SELECT is(
  public.close_stale_integrity_alerts(
    timestamptz '2001-01-01 14:00:00+00', ARRAY['financeiro'], interval '0'
  ),
  0,
  'reexecução deve ser idempotente (0 novos encerramentos)'
);

-- ---------------------------------------------------------------------------
-- 5) Janela de carência — alerta dentro do grace não pode ser encerrado
-- ---------------------------------------------------------------------------
SELECT is(
  public.close_stale_integrity_alerts(
    timestamptz '2001-01-01 14:00:00+00', ARRAY['nfe_sefaz'], interval '3 hours'
  ),
  1,
  'grace de 3h encerra o alerta de 10:00 e preserva o de 12:00'
);

SELECT is(
  public.close_stale_integrity_alerts(
    timestamptz '2001-01-01 14:00:00+00', ARRAY['nfe_sefaz'], interval '0'
  ),
  1,
  'sem grace, o alerta de 12:00 também deve encerrar'
);

-- ---------------------------------------------------------------------------
-- 6) Guardas de entrada
-- ---------------------------------------------------------------------------
SELECT is(
  public.close_stale_integrity_alerts(NULL, ARRAY['financeiro']),
  0,
  'hora nula deve retornar 0 sem efeito colateral'
);

SELECT is(
  public.close_stale_integrity_alerts(timestamptz '2001-01-01 14:00:00+00', ARRAY[]::text[]),
  0,
  'lista de domínios vazia deve retornar 0 sem efeito colateral'
);

-- ---------------------------------------------------------------------------
-- 7) Contrato do ciclo — não pode lançar exceção e deve reportar as 3 frentes
-- ---------------------------------------------------------------------------
SELECT lives_ok(
  $$SELECT public.run_integrity_cycle()$$,
  'run_integrity_cycle não pode lançar exceção'
);

SELECT ok(
  (SELECT public.run_integrity_cycle() ?& ARRAY['nfe_xml','sefaz','alertas_encerrados','escalonamento']),
  'run_integrity_cycle deve retornar nfe_xml, sefaz, escalonamento e alertas_encerrados'
);

-- ---------------------------------------------------------------------------
-- 7b) Escalonamento de alertas críticos esquecidos (>24h)
-- ---------------------------------------------------------------------------
-- Alerta crítico aberto há 3 dias deve gerar plantão em performance_alerts
INSERT INTO public.integrity_alerts
  (domain, invariant, severity, alert_hour, affected_count, reason, created_at)
VALUES
  ('financeiro', 'teste_escalonamento', 'critical',
   date_trunc('hour', now() - interval '3 days'), 7,
   'alerta crítico esquecido', now() - interval '3 days');

SELECT ok(
  (public.escalate_stale_integrity_alerts(interval '24 hours') ->> 'escalated')::bigint >= 1,
  'crítico aberto há 3 dias deve ser escalonado'
);

SELECT is(
  (SELECT count(*) FROM public.performance_alerts
    WHERE source = 'cron' AND alert_key = 'integrity_stale_critical'
      AND alert_hour = date_trunc('hour', now())
      AND resolved_at IS NULL AND severity = 'critical'),
  1::bigint,
  'escalonamento deve abrir exatamente um alerta de plantão na hora corrente'
);

-- Idempotência: reexecutar não duplica linhas nem reabre em duplicidade
SELECT lives_ok(
  $$SELECT public.escalate_stale_integrity_alerts(interval '24 hours')$$,
  'escalonamento deve ser idempotente'
);

SELECT is(
  (SELECT count(*) FROM public.performance_alerts
    WHERE source = 'cron' AND alert_key = 'integrity_stale_critical'
      AND alert_hour = date_trunc('hour', now())),
  1::bigint,
  'reexecução não pode duplicar o alerta de plantão'
);

-- Metadados de diagnóstico devem acompanhar o plantão
SELECT ok(
  (SELECT metadata ? 'dominios' AND metadata ? 'mais_antigo' AND metadata ? 'idade_horas'
     FROM public.performance_alerts
    WHERE source = 'cron' AND alert_key = 'integrity_stale_critical'
      AND alert_hour = date_trunc('hour', now())),
  'plantão deve registrar domínios, alerta mais antigo e idade em horas'
);

-- Janela maior que a idade do incidente não deve escalonar
SELECT is(
  (public.escalate_stale_integrity_alerts(interval '365 days') ->> 'escalated')::bigint,
  0::bigint,
  'incidente mais novo que a janela configurada não deve ser escalonado'
);

-- ---------------------------------------------------------------------------
-- 8) Blindagem — nenhuma role exposta pode executar as rotinas de manutenção
-- ---------------------------------------------------------------------------
SELECT ok(
  NOT has_function_privilege('authenticated', 'public.run_integrity_cycle()', 'EXECUTE')
  AND NOT has_function_privilege('anon', 'public.run_integrity_cycle()', 'EXECUTE')
  AND NOT has_function_privilege(
    'authenticated',
    'public.close_stale_integrity_alerts(timestamptz, text[], interval)',
    'EXECUTE'
  )
  AND NOT has_function_privilege(
    'authenticated', 'public.escalate_stale_integrity_alerts(interval)', 'EXECUTE'
  )
  AND NOT has_function_privilege(
    'anon', 'public.escalate_stale_integrity_alerts(interval)', 'EXECUTE'
  ),
  'ciclo e encerramento automático não podem ser executáveis por anon/authenticated'
);

SELECT * FROM finish();

ROLLBACK;
