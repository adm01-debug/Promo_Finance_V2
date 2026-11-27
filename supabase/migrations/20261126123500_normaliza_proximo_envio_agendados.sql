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
WITH alvo AS (
  SELECT id,
         ((date_trunc('month', now() AT TIME ZONE 'UTC')
           + make_interval(days => least(dia_envio, 28) - 1, hours => 6)) AT TIME ZONE 'UTC') AS base,
         CASE frequencia WHEN 'mensal' THEN 1 WHEN 'trimestral' THEN 3 ELSE 12 END AS meses
  FROM public.relatorios_tributarios_agendados
  WHERE proximo_envio_em = created_at
),
candidatos AS (
  SELECT a.id, a.base + make_interval(months => n * a.meses) AS quando
  FROM alvo a,
       generate_series(0, 12) AS n
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
