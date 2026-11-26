-- Etapa 80 do plano RT/RFB: agendamento do espelho local dos catalogos NCM e
-- NBS a partir da API publica de dados abertos da RFB.
--
-- Por que existe: `catalogo_ncm` e `catalogo_nbs` foram criados na etapa 16
-- (20261122023000) e nunca receberam carga. Sem eles o validador da etapa 46
-- (`src/lib/tributario/validador-ncm-cst.ts`) nao tem contra o que comparar o
-- NCM do item, ou seja, a etapa 46 estava inerte em producao.
--
-- Nao ha carga inicial nesta migration: o conjunto tem ~10 mil NCMs e ~2 mil
-- NBS, uma vez que a API publica a lista vigente e nao permite paginar. O
-- primeiro carregamento e a primeira execucao do job (ou um disparo manual da
-- edge `sync-catalogo-ncm-nbs`), logo apos o deploy da function.
--
-- Seguranca da escrita: a edge so faz upsert por (codigo, vigencia) e so
-- encerra vigencia quando a resposta da API nao esta truncada (piso de 1.000
-- NCM / 200 NBS e teto de 10% de ausentes). Resposta curta — inclusive o HTML
-- 200 que o WAF do piloto devolve — nao escreve nada.
--
-- REGRA 8: contem DDL de producao (pg_cron). Nao aplicar sem aprovacao do dono.
--
-- Pre-requisito 1: o segredo `internal_jobs` em integration_secrets — o mesmo
-- consultado por `exigirChamadaInterna` (supabase/functions/_shared/auth-guard.ts).
-- Pre-requisito 2: `verify_jwt = false` para `sync-catalogo-ncm-nbs` em
-- supabase/config.toml — o pg_cron nao envia JWT de usuario.
-- Pre-requisito 3: a function precisa estar deployada
-- (functions-deploy.yml, `deploy_all = true`).

CREATE EXTENSION IF NOT EXISTS pg_net SCHEMA extensions

SELECT cron.unschedule('sync-catalogo-ncm-nbs')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'sync-catalogo-ncm-nbs'
)

-- Diario as 08:00 UTC = 05:00 em Brasilia (o pg_cron agenda em UTC; `0 5 * * *`
-- disparava as 02:00 de Brasilia): 20 min depois do job do cClassTrib, que
-- consulta a mesma base oficial e sofre o mesmo limite de taxa do WAF. Rodar em
-- sequencia evita que os dois disputem a janela e leva o bloqueio por IP.
--
-- `timeout_milliseconds`: o pg_net espera 5 s por padrao, mas a carga baixa as
-- duas listas (~10 mil NCMs e ~2 mil NBS) e grava por upsert; sem o parametro o
-- disparo expira sempre, mesmo com a API respondendo normalmente.
SELECT cron.schedule(
  'sync-catalogo-ncm-nbs',
  '0 8 * * *',
  $$
    SELECT net.http_post(
      url     := 'https://bwwbeyolnnzppeuhgkcd.supabase.co/functions/v1/sync-catalogo-ncm-nbs',
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
)
