-- Etapa 81 do plano RT/RFB: agendamento do espelho local das aliquotas de
-- referencia (CBS nacional, IBS por UF e por municipio) a partir da API publica
-- de dados abertos da RFB.
--
-- Por que existe: `catalogo_aliquota_referencia` foi criada na etapa 38
-- (20261122023000) e nunca recebeu carga. Sem ela, a aliquota de referencia de
-- cada ano da transicao nao existe em nenhum lugar do sistema.
--
-- Dois jobs, e nao um, porque a fonte bloqueia por taxa (WAF por IP, ~30
-- requisicoes seguidas, resposta 200 com HTML): 27 UFs + uniao cabem numa
-- execucao, a varredura de municipios nao. A edge e incremental — prioriza o que
-- ainda nao existe para o ano — entao a tabela converge em poucas rodadas.
--
-- Nao ha carga inicial nesta migration: o primeiro carregamento e a primeira
-- execucao dos jobs (ou disparo manual da edge), depois do deploy da function.
--
-- Os valores publicados em 2026 sao 0,9% para a CBS, 0,1% para o IBS estadual e
-- 0,0% para o IBS municipal; a edge grava fracao (0.0090 / 0.0010 / 0.0000).
-- A partir de 2027 as rotas respondem 404 ("aliquota de referencia ou padrao nao
-- encontrada"), que a edge registra como "nao publicada" e nao como falha.
--
-- REGRA 8: contem DDL de producao (pg_cron). Nao aplicar sem aprovacao do dono.
--
-- Pre-requisito 1: o segredo `internal_jobs` em integration_secrets — o mesmo
-- consultado por `exigirChamadaInterna` (supabase/functions/_shared/auth-guard.ts).
-- Pre-requisito 2: `verify_jwt = false` para `sync-aliquota-referencia` em
-- supabase/config.toml — o pg_cron nao envia JWT de usuario.
-- Pre-requisito 3: a function precisa estar deployada
-- (functions-deploy.yml, `deploy_all = true`).
-- Pre-requisito 4: `aliquotas_iss_municipal` e a origem da lista de municipios
-- consultados; com a tabela vazia o job de municipio nao escreve nada (e nao
-- falha) — a aliquota nacional e estadual entram normalmente.

CREATE EXTENSION IF NOT EXISTS pg_net SCHEMA extensions

SELECT cron.unschedule('sync-aliquota-referencia-uf')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'sync-aliquota-referencia-uf'
)

SELECT cron.unschedule('sync-aliquota-referencia-municipio')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'sync-aliquota-referencia-municipio'
)

-- Diario as 08:20 UTC = 05:20 em Brasilia (o pg_cron agenda em UTC): 20 min
-- depois do job de NCM/NBS (08:00 UTC) e 40 depois do cClassTrib (07:40 UTC).
-- Os tres consultam a mesma base oficial e sofrem o mesmo limite de taxa por IP;
-- em sequencia, um nao derruba o outro.
--
-- `timeout_milliseconds`: a rodada estadual faz 27 consultas com pausa de 1,2 s
-- entre elas (~40 s) e so grava o lote no fim. O timeout padrao do pg_net (5 s)
-- expirava antes de a funcao responder.
SELECT cron.schedule(
  'sync-aliquota-referencia-uf',
  '20 8 * * *',
  $$
    SELECT net.http_post(
      url     := 'https://bwwbeyolnnzppeuhgkcd.supabase.co/functions/v1/sync-aliquota-referencia?escopo=uf',
      headers := jsonb_build_object(
        'Content-Type',  'application/json',
        'x-cron-secret', (
          SELECT valor FROM integration_secrets WHERE chave = 'internal_jobs' LIMIT 1
        )
      ),
      body    := '{"source":"pg_cron"}'::jsonb,
      timeout_milliseconds := 90000
    );
  $$
)

-- Semanal, domingo as 08:50 UTC = 05:50 em Brasilia. A aliquota municipal
-- publicada em 2026 e 0,0% para todos os entes, entao nao ha ganho em consultar
-- todo dia — e cada rodada de municipio consome a cota de requisicoes do WAF.
-- A varredura de municipios e a mais longa das quatro: 150 s de timeout.
SELECT cron.schedule(
  'sync-aliquota-referencia-municipio',
  '50 8 * * 0',
  $$
    SELECT net.http_post(
      url     := 'https://bwwbeyolnnzppeuhgkcd.supabase.co/functions/v1/sync-aliquota-referencia?escopo=municipio',
      headers := jsonb_build_object(
        'Content-Type',  'application/json',
        'x-cron-secret', (
          SELECT valor FROM integration_secrets WHERE chave = 'internal_jobs' LIMIT 1
        )
      ),
      body    := '{"source":"pg_cron"}'::jsonb,
      timeout_milliseconds := 150000
    );
  $$
)
