-- vw_fluxo_caixa: termina a projeção de 90 dias e a torna utilizável.
--
-- Havia duas definições em desacordo, e a tela não funcionava com nenhuma:
--
--   * PRODUÇÃO tinha o saldo REALIZADO, agrupado de movimentacoes:
--       empresa_id, date(data_movimentacao) AS data, total_creditos,
--       total_debitos, saldo_dia
--     Isso duplica vw_fluxo_caixa_diario, que já serve o realizado.
--
--   * O REPO declara, em 20260904000600_add_contas_pagar_valor_pago.sql, a
--     PROJEÇÃO de 90 dias a partir de contas_receber/contas_pagar pendentes:
--       dia, receitas_previstas, despesas_previstas, saldo_dia
--     mas sem empresa_id — num sistema multi-empresa a projeção não dá para
--     filtrar por empresa, e por isso nunca foi aplicada.
--
-- O consumidor (src/hooks/useViews.ts:36, useFluxoCaixaView, comentado como
-- "projeção por título") ordena por `dia` e filtra por `empresa_id`: quebrava
-- contra produção (não tem `dia`) e quebraria contra a declarada (não tem
-- `empresa_id`).
--
-- Esta migration fica com a PROJEÇÃO — que é a intenção declarada e o que a
-- tela pede — e acrescenta o `empresa_id` que faltava, vindo do CROSS JOIN com
-- empresas. Também filtra `deleted_at IS NULL`: título excluído logicamente não
-- entra em previsão.
--
-- Nada é perdido: view não guarda dado, e o realizado continua em
-- vw_fluxo_caixa_diario. Conferido antes: nenhum outro objeto depende de
-- vw_fluxo_caixa (pg_depend/pg_rewrite, 0 linhas).
--
-- security_invoker = on: a view respeita a RLS de quem consulta (AGENTS §4).

DROP VIEW IF EXISTS public.vw_fluxo_caixa;

CREATE VIEW public.vw_fluxo_caixa WITH (security_invoker = 'on') AS
SELECT
  e.id AS empresa_id,
  d.dia::date AS dia,
  COALESCE(r.valor, 0) AS receitas_previstas,
  COALESCE(p.valor, 0) AS despesas_previstas,
  COALESCE(r.valor, 0) - COALESCE(p.valor, 0) AS saldo_dia
FROM public.empresas e
CROSS JOIN generate_series(
  CURRENT_DATE::timestamp,
  (CURRENT_DATE + 90)::timestamp,
  '1 day'::interval
) AS d(dia)
LEFT JOIN (
  SELECT
    empresa_id,
    data_vencimento AS dia,
    SUM(valor - COALESCE(valor_recebido, 0)) AS valor
  FROM public.contas_receber
  WHERE status IN ('pendente', 'parcial')
    AND deleted_at IS NULL
  GROUP BY 1, 2
) r ON r.empresa_id = e.id AND r.dia = d.dia::date
LEFT JOIN (
  SELECT
    empresa_id,
    data_vencimento AS dia,
    SUM(valor - COALESCE(valor_pago, 0)) AS valor
  FROM public.contas_pagar
  WHERE status IN ('pendente', 'parcial')
    AND deleted_at IS NULL
  GROUP BY 1, 2
) p ON p.empresa_id = e.id AND p.dia = d.dia::date;
