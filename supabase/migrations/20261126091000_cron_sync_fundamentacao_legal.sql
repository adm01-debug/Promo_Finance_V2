-- Etapa 82 do plano RT/RFB: agendamento do espelho local das fundamentacoes
-- legais por cClassTrib/CST (`catalogo_fundamentacao`), publicado em
-- `/fundamentacoes-legais` da API publica de dados abertos da RFB.
--
-- Por que existe: `catalogo_cclasstrib` (etapa 37) diz quanto cada cClassTrib
-- reduz, nao por que. Sem a fundamentacao, o alerta fiscal do item mostra a
-- divergencia sem a base legal que a sustenta.
--
-- Um unico job, e nao varios: a rota devolve a base inteira em uma requisicao
-- (170 linhas em 2026-06-01), ao contrario de `/aliquota-uf` (etapa 81), que
-- exige uma chamada por ente. O limite de taxa do WAF por IP, portanto, nao e
-- restricao aqui.
--
-- Nao ha carga inicial nesta migration: o primeiro carregamento e a primeira
-- execucao do job (ou disparo manual da edge), depois do deploy da function.
--
-- REGRA 8: contem DDL de producao (pg_cron). Nao aplicar sem aprovacao do dono.
--
-- Pre-requisito 1: o segredo `internal_jobs` em integration_secrets — o mesmo
-- consultado por `exigirChamadaInterna` (supabase/functions/_shared/auth-guard.ts).
-- Pre-requisito 2: `verify_jwt = false` para `sync-fundamentacao-legal` em
-- supabase/config.toml — o pg_cron nao envia JWT de usuario.
-- Pre-requisito 3: a function precisa estar deployada
-- (functions-deploy.yml, `deploy_all = true`).
-- Pre-requisito 4: a tabela `catalogo_fundamentacao` precisa existir
-- (20261126090000). Sem ela o job falha no primeiro upsert.

CREATE EXTENSION IF NOT EXISTS pg_net SCHEMA extensions;

SELECT cron.unschedule('sync-fundamentacao-legal')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'sync-fundamentacao-legal'
);

-- Diario as 08:30 UTC = 05:30 em Brasilia (o pg_cron agenda em UTC; `30 5 * * *`
-- disparava as 02:30 de Brasilia): 10 min depois do job das aliquotas de
-- referencia (08:20 UTC) e 30 depois do NCM/NBS (08:00 UTC). Os cinco consultam
-- a mesma base oficial; em sequencia, um nao derruba o outro pelo limite de taxa
-- por IP.
--
-- `timeout_milliseconds`: o timeout padrao do pg_net e de 5 s, menor que a
-- resposta da function; sem ele o disparo fica orfao.
SELECT cron.schedule(
  'sync-fundamentacao-legal',
  '30 8 * * *',
  $$
    SELECT net.http_post(
      url     := 'https://bwwbeyolnnzppeuhgkcd.supabase.co/functions/v1/sync-fundamentacao-legal',
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
