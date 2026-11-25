-- Correcao de fuso do agendamento do cClassTrib (etapa 79).
--
-- `20261124121000` agendou o job as `'40 4 * * *'` com comentario "04:40
-- (Brasilia)". O pg_cron agenda em UTC: a execucao real era 01:40 de Brasilia,
-- tres horas antes do anunciado — e fora da janela em que a cadeia dos
-- catalogos RFB (etapas 79 a 82) foi desenhada para rodar em sequencia sem
-- disputar o limite de taxa do WAF.
--
-- A migration original nao foi editada: ela ja esta no historico e pode ja ter
-- sido aplicada. Este job reinscreve o mesmo nome (`cron.unschedule` +
-- `cron.schedule` e idempotente), entao o resultado e o mesmo nas duas
-- situacoes.
--
-- Cadeia correta em UTC (Brasilia = UTC-3):
--   07:40 cClassTrib | 08:00 NCM/NBS | 08:20 aliquotas UF | 08:50 municipios
--
-- `timeout_milliseconds`: o timeout padrao do pg_net e de 5 s e o disparo
-- expirava antes de a funcao responder (mesma correcao aplicada aos jobs das
-- etapas 80 e 81).
--
-- REGRA 8: contem DDL de producao (pg_cron). Nao aplicar sem aprovacao do dono.

SELECT cron.unschedule('sync-catalogo-cclasstrib')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'sync-catalogo-cclasstrib'
);

SELECT cron.schedule(
  'sync-catalogo-cclasstrib',
  '40 7 * * *',
  $$
    SELECT net.http_post(
      url     := 'https://bwwbeyolnnzppeuhgkcd.supabase.co/functions/v1/sync-catalogo-cclasstrib',
      headers := jsonb_build_object(
        'Content-Type',  'application/json',
        'x-cron-secret', (
          SELECT valor FROM integration_secrets WHERE chave = 'internal_jobs' LIMIT 1
        )
      ),
      body    := '{"source":"pg_cron"}'::jsonb,
      timeout_milliseconds := 60000
    );
  $$
);
