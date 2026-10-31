-- Migration: 20261101200000_monitor_health_cron.sql
-- Step 46 — PLANO_50: agendar cron job de monitoramento de saúde.
--
-- ⚠ REGRA 8: esta migration contém DDL que altera produção (pg_cron).
-- NÃO aplicar sem aprovação explícita.
--
-- Pré-requisito:
--   Inserir o segredo em integration_secrets ANTES de aplicar:
--   INSERT INTO integration_secrets (chave, valor)
--   VALUES ('monitor_health_cron', '<gerar-uuid-aleatorio>')
--   ON CONFLICT (chave) DO UPDATE SET valor = EXCLUDED.valor;

-- Habilitar extensão pg_net se não estiver ativa (necessária para net.http_post).
CREATE EXTENSION IF NOT EXISTS pg_net SCHEMA extensions;

-- Remover o job caso já exista (idempotente).
SELECT cron.unschedule('monitor-health-check')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'monitor-health-check'
);

-- Agendar chamada HTTP a cada 30 minutos.
-- O pg_cron usa net.http_post da extensão pg_net.
-- O x-cron-secret deve corresponder ao valor em integration_secrets.monitor_health_cron.
SELECT cron.schedule(
  'monitor-health-check',
  '*/30 * * * *',
  $$
    SELECT net.http_post(
      url     := 'https://bwwbeyolnnzppeuhgkcd.supabase.co/functions/v1/monitor-health',
      headers := jsonb_build_object(
        'Content-Type',  'application/json',
        'x-cron-secret', (
          SELECT valor
          FROM integration_secrets
          WHERE chave = 'monitor_health_cron'
          LIMIT 1
        )
      ),
      body    := '{"source":"pg_cron"}'::jsonb
    );
  $$
);
