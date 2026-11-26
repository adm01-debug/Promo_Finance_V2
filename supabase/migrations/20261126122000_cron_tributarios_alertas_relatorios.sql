-- Agendamento dos dois jobs tributarios que existiam so no codigo.
--
-- Antes desta migration:
--   * `public.alertas_tributarios` nao tinha produtor. A edge
--     `gerar-alertas-tributarios` (guard `exigirChamadaInterna`) estava escrita,
--     o hook `useAlertasTributarios` e a tela admin liam a tabela, e o painel
--     `src/components/admin/CronJobsStatus.tsx:24` ja consultava
--     `get_cron_run_history` pelo jobname `gerar-alertas-tributarios-diario` —
--     jobname que NENHUM cron.schedule criava. Resultado: tabela vazia em
--     producao e painel eternamente "sem execucao".
--   * `public.relatorios_tributarios_agendados` nao tinha consumidor. A edge
--     `enviar-relatorios-tributarios-agendados` gera o PDF e envia por e-mail
--     tudo que esta com `proximo_envio_em <= now()`, mas nada a chamava.
--
-- Ou seja: tela pronta, backend pronto, produtor ausente. Sem este agendamento
-- nenhuma das duas funcionalidades acontece de verdade.
--
-- Idempotente: `cron.unschedule` antes de cada `cron.schedule` e segredos
-- semeados com ON CONFLICT DO NOTHING (a coluna `valor` tem
-- DEFAULT encode(gen_random_bytes(32),'hex'), entao a linha nasce com segredo
-- forte sem aparecer neste arquivo).
--
-- REGRA 8: DDL de producao (pg_net/pg_cron) + `verify_jwt = false` em
-- supabase/config.toml. Nao aplicar sem aval do dono.
--
-- Pre-requisitos ja garantidos no repo:
--   * `verify_jwt = false` para as duas funcoes em supabase/config.toml — o
--     pg_cron nao envia JWT e o gateway rejeitava antes do handler; a prova de
--     origem passa a ser o header `x-cron-secret` conferido por
--     `exigirChamadaInterna` (supabase/functions/_shared/auth-guard.ts).
--   * as chaves de segredo abaixo sao exatamente as que cada funcao passa para
--     `exigirChamadaInterna`, senao o job levaria 401 em 100% das execucoes.

CREATE EXTENSION IF NOT EXISTS pg_net SCHEMA extensions;

INSERT INTO public.integration_secrets (chave, descricao)
VALUES
  (
    'gerar_alertas_tributarios',
    'Segredo x-cron-secret do job gerar-alertas-tributarios-diario (exigirChamadaInterna)'
  ),
  (
    'relatorios_tributarios_cron',
    'Segredo x-cron-secret do job enviar-relatorios-tributarios (exigirChamadaInterna)'
  )
ON CONFLICT (chave) DO NOTHING;

SELECT cron.unschedule('gerar-alertas-tributarios-diario')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'gerar-alertas-tributarios-diario'
);

-- Diario as 06:15: antes do horario comercial (o alerta precisa estar na tela
-- quando o contador abre o sistema) e fora das janelas de faturamento,
-- vencimento (08:00) e regua de cobranca (09:00).
SELECT cron.schedule(
  'gerar-alertas-tributarios-diario',
  '15 6 * * *',
  $$
    SELECT net.http_post(
      url     := 'https://bwwbeyolnnzppeuhgkcd.supabase.co/functions/v1/gerar-alertas-tributarios',
      headers := jsonb_build_object(
        'Content-Type',  'application/json',
        'x-cron-secret', (
          SELECT valor FROM public.integration_secrets
          WHERE chave = 'gerar_alertas_tributarios' LIMIT 1
        )
      ),
      body    := '{"source":"pg_cron"}'::jsonb
    );
  $$
);

SELECT cron.unschedule('enviar-relatorios-tributarios')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'enviar-relatorios-tributarios'
);

-- De hora em hora: a edge so processa agendamentos com
-- `proximo_envio_em <= now()` (limite de 50 por chamada) e, sem nada vencido,
-- encerra sem escrever. Rodar de hora em hora evita atraso de um dia inteiro
-- quando o horario de envio cai num instante que ja passou.
SELECT cron.schedule(
  'enviar-relatorios-tributarios',
  '5 * * * *',
  $$
    SELECT net.http_post(
      url     := 'https://bwwbeyolnnzppeuhgkcd.supabase.co/functions/v1/enviar-relatorios-tributarios-agendados',
      headers := jsonb_build_object(
        'Content-Type',  'application/json',
        'x-cron-secret', (
          SELECT valor FROM public.integration_secrets
          WHERE chave = 'relatorios_tributarios_cron' LIMIT 1
        )
      ),
      body    := '{"source":"pg_cron"}'::jsonb
    );
  $$
);