-- 15_views_pii_rpcs.sql — regressões específicas de hardening focal.
--
-- Cobre só achados com correção inequivocamente segura:
-- - `gerar_numero_acordo()` não pode ser executada por `anon`;
-- - `resolve_sso_providers_for_domain(text)` continua anônima por desenho pré-login;
-- - views expostas no app continuam com `security_invoker`;
-- - views com `chave_pix` continuam usando máscara por papel.
\pset format unaligned
\pset tuples_only on
\pset fieldsep '\t'

WITH checks AS (
  SELECT
    'rpc.anon_cannot_execute_gerar_numero_acordo'::text AS assertion,
    CASE
      WHEN has_function_privilege('anon', 'public.gerar_numero_acordo()', 'EXECUTE')
        THEN 'fail' ELSE 'pass'
    END AS status,
    'false'::text AS expected,
    has_function_privilege('anon', 'public.gerar_numero_acordo()', 'EXECUTE')::text AS actual,
    'gerar_numero_acordo deve ficar fora da superfície anônima'::text AS detail

  UNION ALL

  SELECT
    'rpc.anon_can_execute_resolve_sso',
    CASE
      WHEN has_function_privilege('anon', 'public.resolve_sso_providers_for_domain(text)', 'EXECUTE')
        THEN 'pass' ELSE 'fail'
    END,
    'true',
    has_function_privilege('anon', 'public.resolve_sso_providers_for_domain(text)', 'EXECUTE')::text,
    'resolve_sso_providers_for_domain permanece público por fluxo pré-login'

  UNION ALL

  SELECT
    'views.named_security_invoker',
    CASE WHEN count(*) = 0 THEN 'pass' ELSE 'fail' END,
    '0',
    count(*)::text,
    COALESCE(
      string_agg(relname || ' sem security_invoker', ', ' ORDER BY relname),
      'views expostas mantêm security_invoker'
    )
  FROM (
    SELECT c.relname
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind = 'v'
      AND c.relname IN (
        'vw_edge_health',
        'vw_auditoria_tributaria_recente',
        'vw_contas_receber_painel',
        'vw_transferencias_painel',
        'vw_webhooks_recentes',
        'vw_rpc_hotspots',
        'v_table_bloat',
        'extratos_bancarios_importados',
        'vw_fluxo_caixa_diario',
        'v_sefaz_observability',
        'vw_dre_mensal',
        'vw_dso_aging',
        'vw_fluxo_caixa',
        'vw_gastos_centro_custo',
        'vw_metricas_cobranca',
        'vw_rpc_slow_calls',
        'vw_saldos_contas'
      )
      AND NOT EXISTS (
        SELECT 1
        FROM unnest(COALESCE(c.reloptions, '{}'::text[])) o
        WHERE lower(o) IN ('security_invoker=on', 'security_invoker=true')
      )
  ) bad_views

  UNION ALL

  SELECT
    'views.matview_not_exposed_to_clients',
    CASE
      WHEN to_regclass('public.mv_performance_alerts_weekly') IS NULL THEN 'pass'
      WHEN has_table_privilege('anon', 'public.mv_performance_alerts_weekly', 'SELECT')
        OR has_table_privilege('authenticated', 'public.mv_performance_alerts_weekly', 'SELECT')
        THEN 'fail'
      ELSE 'pass'
    END,
    'false',
    CASE
      WHEN to_regclass('public.mv_performance_alerts_weekly') IS NULL THEN 'ausente'
      ELSE (
        has_table_privilege('anon', 'public.mv_performance_alerts_weekly', 'SELECT')
        OR has_table_privilege('authenticated', 'public.mv_performance_alerts_weekly', 'SELECT')
      )::text
    END,
    'materialized view sem RLS não pode ser exposta às roles clientes'

  UNION ALL

  SELECT
    'pii.named_views_mask_chave_pix',
    CASE WHEN count(*) = 0 THEN 'pass' ELSE 'fail' END,
    '0',
    count(*)::text,
    COALESCE(
      string_agg(view_name || ' sem máscara', ', ' ORDER BY view_name),
      'views com chave_pix mantêm máscara por papel'
    )
  FROM (
    SELECT v.view_name
    FROM information_schema.views v
    WHERE v.table_schema = 'public'
      AND v.view_name IN ('vw_contas_receber_painel', 'vw_transferencias_painel')
      AND (
        v.view_definition NOT ILIKE '%mascarar_chave_pix%'
        OR v.view_definition NOT ILIKE '%pode_ver_dado_sensivel%'
      )
  ) bad_pii
)
SELECT assertion, status, expected, actual, detail
FROM checks;
