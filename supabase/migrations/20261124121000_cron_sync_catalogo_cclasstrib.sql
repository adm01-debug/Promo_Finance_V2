-- Etapa 79 do plano RT/RFB: agendamento do espelho local do catalogo
-- cClassTrib a partir da API publica de dados abertos da RFB.
--
-- Sem este job o espelho nasce semeado (migration de carga) e envelhece: um
-- cClassTrib novo ou com percentual de reducao revisado passa a divergir do
-- catalogo local, e o validador acusa REG-011/REG-013 em cima de nota correta.
--
-- Seguranca da escrita: a edge so faz upsert por (cclasstrib, vigencia) e so
-- encerra vigencia quando a resposta da API nao esta truncada (piso de 100
-- classificacoes e teto de 10% de ausentes). Resposta curta nao escreve nada.
--
-- REGRA 8: contem DDL de producao (pg_cron). Nao aplicar sem aprovacao do dono.
--
-- Pre-requisito: o segredo `internal_jobs` em integration_secrets — o mesmo
-- consultado por `exigirChamadaInterna` (chave padrao em
-- supabase/functions/_shared/auth-guard.ts). `cron_secret` NAO e lido pela
-- guarda: usar aquela chave resultava em 401 em 100% das execucoes.
-- Pre-requisito 2: `verify_jwt = false` para `sync-catalogo-cclasstrib` em
-- supabase/config.toml — o pg_cron nao envia JWT de usuario e o gateway
-- rejeitava a chamada antes do handler.
-- Pre-requisito 3: a function precisa estar deployada; a migration de carga
-- (20261124110000) e a fonte inicial, este job so mantem.

CREATE EXTENSION IF NOT EXISTS pg_net SCHEMA extensions;

SELECT cron.unschedule('sync-catalogo-cclasstrib')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'sync-catalogo-cclasstrib'
);

-- Diario as 04:40 (Brasilia): depois do puxador SEFAZ da madrugada e fora da
-- janela do reprocessamento de creditos (:20 de cada hora), para nao competir
-- por conexao nem disputar a mesma tabela.
SELECT cron.schedule(
  'sync-catalogo-cclasstrib',
  '40 4 * * *',
  $$
    SELECT net.http_post(
      url     := 'https://bwwbeyolnnzppeuhgkcd.supabase.co/functions/v1/sync-catalogo-cclasstrib',
      headers := jsonb_build_object(
        'Content-Type',  'application/json',
        'x-cron-secret', (
          SELECT valor FROM integration_secrets WHERE chave = 'internal_jobs' LIMIT 1
        )
      ),
      body    := '{"source":"pg_cron"}'::jsonb
    );
  $$
);