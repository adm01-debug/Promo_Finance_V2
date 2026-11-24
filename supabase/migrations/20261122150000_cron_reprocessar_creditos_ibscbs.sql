-- Etapa 50 do plano RT/RFB: agendamento do reprocessamento retroativo do
-- grupo IBS/CBS das NF-e ja ingeridas.
--
-- Sem este job, toda NF-e puxada antes da etapa 49 fica com credito
-- "estimado" para sempre, mesmo com valor destacado no documento — o
-- contribuinte perde credito real por atraso de deploy, nao por falta de
-- direito.
--
-- Idempotente: o job chama a edge, que por sua vez so olha notas com
-- `raw_metadata->ibscbs` nulo e troca o conjunto de creditos via
-- `reprocessar_creditos_nfe`. Rodar de hora em hora e seguro.
--
-- REGRA 8: contem DDL de producao (pg_cron). Nao aplicar sem aprovacao do dono.
--
-- Pre-requisito: o segredo `internal_jobs` em integration_secrets — o mesmo
-- consultado por `exigirChamadaInterna` (chave padrao em
-- supabase/functions/_shared/auth-guard.ts). `cron_secret` NAO e lido pela
-- guarda: usar aquela chave resultava em 401 em 100% das execucoes.
-- Pre-requisito 2: a function precisa de `verify_jwt = false` em
-- supabase/config.toml, porque o pg_cron nao envia JWT de usuario e o gateway
-- rejeitava a chamada antes do handler. A autorizacao passa a ser feita pela
-- propria guarda interna (header x-cron-secret).

CREATE EXTENSION IF NOT EXISTS pg_net SCHEMA extensions;

SELECT cron.unschedule('reprocessar-creditos-ibscbs')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'reprocessar-creditos-ibscbs'
);

-- De hora em hora, aos 20 min: fora da janela dos jobs de faturamento e longe
-- do puxador SEFAZ (que roda em minutos fixos), para nao competir por conexao.
SELECT cron.schedule(
  'reprocessar-creditos-ibscbs',
  '20 * * * *',
  $$
    SELECT net.http_post(
      url     := 'https://bwwbeyolnnzppeuhgkcd.supabase.co/functions/v1/reprocessar-creditos-ibscbs',
      headers := jsonb_build_object(
        'Content-Type',  'application/json',
        'x-cron-secret', (
          SELECT valor FROM integration_secrets WHERE chave = 'internal_jobs' LIMIT 1
        )
      ),
      body    := '{"source":"pg_cron","limite":200}'::jsonb
    );
  $$
);
