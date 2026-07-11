-- Função: capture_slow_queries
-- Descrição: Lê pg_stat_statements e persiste top queries com tempo médio
--            acima do threshold (default 500ms) em slow_query_alerts.
--            Também espelha alertas warning/critical em query_telemetry.
-- Segurança: SECURITY DEFINER + advisory lock
-- Grants: service_role
-- Agendamento: pg_cron 'capture-slow-queries' — a cada 15 minutos
-- Última migration: 20260711153324

-- Ver migration 20260711153324 para corpo completo.
