-- Destrava o cron `refresh-performance-alerts-weekly` (falhando desde 30/08/2026).
-- public.refresh_performance_alerts_weekly() insere meta-alertas com
-- source = 'weekly_trend', valor ausente da CHECK performance_alerts_source_check
-- (erro: new row for relation "performance_alerts" violates check constraint
-- "performance_alerts_source_check"). Única origem faltante: as demais funções
-- que inserem em performance_alerts usam 'cron', 'query_telemetry' e
-- 'pg_stat_statements'. Ampliar a lista não invalida nenhuma linha existente.
ALTER TABLE public.performance_alerts DROP CONSTRAINT IF EXISTS performance_alerts_source_check;
ALTER TABLE public.performance_alerts ADD CONSTRAINT performance_alerts_source_check
  CHECK (source = ANY (ARRAY['query_telemetry'::text, 'pg_stat_statements'::text, 'cron'::text, 'weekly_trend'::text]));
