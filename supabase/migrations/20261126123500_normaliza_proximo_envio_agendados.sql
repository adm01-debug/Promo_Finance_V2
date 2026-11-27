-- Agendamentos criados antes deste ajuste herdaram `proximo_envio_em = now()`
-- (DEFAULT da coluna), entao o cron de relatorios os pegaria na hora seguinte ao
-- cadastro, e nao no dia escolhido. Aqui a coluna passa a valer o proximo envio
-- real: `dia_envio` (limitado a 28) as 06:00 UTC, na frequencia configurada —
-- exatamente a regra de `proximoEnvioInicial()` em
-- src/hooks/useRelatoriosTributariosAgendados.ts.
--
-- Idempotente e restrito a quem nunca teve a coluna recalculada
-- (`proximo_envio_em = created_at`). Nao filtra por `ativo`: o toggle de reativar
-- so muda a flag, entao um agendamento pausado com a data de cadastro voltaria a
-- ser enviado fora do dia escolhido na primeira rodada apos a reativacao.
--
-- O ciclo e ancorado no mes de `created_at`, nao em `now()`: o cadastro define o
-- mes de referencia (o formulario calcula a primeira data a partir do mes da
-- criacao), e ancorar no mes da migration deslocaria a fase dos relatorios
-- trimestrais e anuais para o mes do deploy. Com a ancora em `created_at` a
-- cadencia original e preservada e o proximo envio continua sendo a primeira
-- ocorrencia futura desse ciclo.
WITH alvo AS (
  SELECT id,
         ((date_trunc('month', created_at AT TIME ZONE 'UTC')
           + make_interval(days => least(dia_envio, 28) - 1, hours => 6)) AT TIME ZONE 'UTC') AS base,
         CASE frequencia WHEN 'mensal' THEN 1 WHEN 'trimestral' THEN 3 ELSE 12 END AS meses
  FROM public.relatorios_tributarios_agendados
  WHERE proximo_envio_em = created_at
),
candidatos AS (
  -- 60 meses cobrem 5 anos de ciclo mensal ja com a ancora em `created_at`
  -- (agendamento antigo ainda precisa alcancar a primeira ocorrencia futura).
  SELECT a.id, a.base + make_interval(months => n * a.meses) AS quando
  FROM alvo a,
       generate_series(0, 60) AS n
)
UPDATE public.relatorios_tributarios_agendados ag
SET proximo_envio_em = c.quando
FROM (
  SELECT id, min(quando) AS quando
  FROM candidatos
  WHERE quando > now()
  GROUP BY id
) c
WHERE ag.id = c.id;
