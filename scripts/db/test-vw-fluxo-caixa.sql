-- Teste de regressão da agregação de public.vw_fluxo_caixa.
--
-- Cobre os casos que a review pediu: duas empresas no mesmo vencimento,
-- pagamento/recebimento parcial e título excluído logicamente.
--
-- Contrato: o script devolve ZERO linhas quando tudo passa. Cada linha
-- devolvida é uma expectativa quebrada, com o valor esperado e o obtido.
--
-- Como rodar:
--   psql "$DATABASE_URL" -f scripts/db/test-vw-fluxo-caixa.sql
--   (ou cole o bloco num SQL editor; é uma única instrução, sem DO/plpgsql,
--    e não escreve nada em tabela nenhuma)

WITH empresas_fx(id, nome) AS (
  VALUES
    ('aaaaaaaa-0000-0000-0000-000000000001'::uuid, 'Empresa A'),
    ('bbbbbbbb-0000-0000-0000-000000000002'::uuid, 'Empresa B')
),
-- D+3 para as duas empresas; a B tem recebimento parcial.
cr_fx(empresa_id, data_vencimento, valor, valor_recebido, status, deleted_at) AS (
  VALUES
    ('aaaaaaaa-0000-0000-0000-000000000001'::uuid, CURRENT_DATE + 3, 4000.00::numeric, NULL::numeric,     'pendente', NULL::timestamptz),
    ('bbbbbbbb-0000-0000-0000-000000000002'::uuid, CURRENT_DATE + 3, 1000.00::numeric,  400.00::numeric,  'parcial',  NULL::timestamptz),
    -- excluído logicamente: não pode entrar na previsão
    ('aaaaaaaa-0000-0000-0000-000000000001'::uuid, CURRENT_DATE + 3, 9999.00::numeric, NULL::numeric,     'pendente', now()),
    -- já recebido: fora dos status de previsão
    ('aaaaaaaa-0000-0000-0000-000000000001'::uuid, CURRENT_DATE + 3, 7777.00::numeric, 7777.00::numeric,  'recebido', NULL::timestamptz),
    -- fora da janela de 90 dias
    ('aaaaaaaa-0000-0000-0000-000000000001'::uuid, CURRENT_DATE + 200, 5555.00::numeric, NULL::numeric,   'pendente', NULL::timestamptz)
),
cp_fx(empresa_id, data_vencimento, valor, valor_pago, status, deleted_at) AS (
  VALUES
    ('aaaaaaaa-0000-0000-0000-000000000001'::uuid, CURRENT_DATE + 3, 1000.00::numeric, 250.00::numeric, 'parcial',  NULL::timestamptz),
    ('bbbbbbbb-0000-0000-0000-000000000002'::uuid, CURRENT_DATE + 3,  600.00::numeric, NULL::numeric,   'pendente', NULL::timestamptz),
    ('bbbbbbbb-0000-0000-0000-000000000002'::uuid, CURRENT_DATE + 3,  800.00::numeric, NULL::numeric,   'pendente', now())
),
-- Mesmo corpo de public.vw_fluxo_caixa, com as fixtures no lugar das tabelas.
obtido AS (
  SELECT
    e.id AS empresa_id,
    d.dia::date AS dia,
    COALESCE(r.valor, 0) AS receitas_previstas,
    COALESCE(p.valor, 0) AS despesas_previstas,
    COALESCE(r.valor, 0) - COALESCE(p.valor, 0) AS saldo_dia
  FROM empresas_fx e
  CROSS JOIN generate_series(
    CURRENT_DATE::timestamp,
    (CURRENT_DATE + 90)::timestamp,
    '1 day'::interval
  ) AS d(dia)
  LEFT JOIN (
    SELECT empresa_id, data_vencimento AS dia, SUM(valor - COALESCE(valor_recebido, 0)) AS valor
    FROM cr_fx
    WHERE status IN ('pendente', 'parcial') AND deleted_at IS NULL
    GROUP BY 1, 2
  ) r ON r.empresa_id = e.id AND r.dia = d.dia::date
  LEFT JOIN (
    SELECT empresa_id, data_vencimento AS dia, SUM(valor - COALESCE(valor_pago, 0)) AS valor
    FROM cp_fx
    WHERE status IN ('pendente', 'parcial') AND deleted_at IS NULL
    GROUP BY 1, 2
  ) p ON p.empresa_id = e.id AND p.dia = d.dia::date
),
esperado(caso, empresa_id, dia, receitas_previstas, despesas_previstas, saldo_dia) AS (
  VALUES
    -- A: 4000 a receber (o excluído, o recebido e o de D+200 ficam fora);
    --    1000 - 250 pago = 750 a pagar
    ('A em D+3: ignora excluido, recebido e fora da janela',
      'aaaaaaaa-0000-0000-0000-000000000001'::uuid, CURRENT_DATE + 3, 4000.00::numeric, 750.00::numeric, 3250.00::numeric),
    -- B: 1000 - 400 recebido = 600 a receber; 600 a pagar (o excluido fica fora)
    ('B em D+3: recebimento parcial e pagavel excluido',
      'bbbbbbbb-0000-0000-0000-000000000002'::uuid, CURRENT_DATE + 3,  600.00::numeric, 600.00::numeric,    0.00::numeric),
    -- o titulo de D+200 nao pode vazar para dentro da janela
    ('A em D+4: dia sem titulo fica zerado',
      'aaaaaaaa-0000-0000-0000-000000000001'::uuid, CURRENT_DATE + 4,    0.00::numeric,   0.00::numeric,    0.00::numeric),
    ('B em D+4: dia sem titulo fica zerado',
      'bbbbbbbb-0000-0000-0000-000000000002'::uuid, CURRENT_DATE + 4,    0.00::numeric,   0.00::numeric,    0.00::numeric)
)
SELECT
  esp.caso,
  esp.empresa_id,
  esp.dia,
  esp.receitas_previstas AS receitas_esperadas,
  obt.receitas_previstas AS receitas_obtidas,
  esp.despesas_previstas AS despesas_esperadas,
  obt.despesas_previstas AS despesas_obtidas,
  esp.saldo_dia          AS saldo_esperado,
  obt.saldo_dia          AS saldo_obtido
FROM esperado esp
LEFT JOIN obtido obt
  ON obt.empresa_id = esp.empresa_id AND obt.dia = esp.dia
WHERE obt.empresa_id IS NULL
   OR obt.receitas_previstas <> esp.receitas_previstas
   OR obt.despesas_previstas <> esp.despesas_previstas
   OR obt.saldo_dia <> esp.saldo_dia;
