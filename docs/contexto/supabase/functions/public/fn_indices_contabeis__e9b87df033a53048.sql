CREATE OR REPLACE FUNCTION public.fn_indices_contabeis(p_empresa_id uuid, p_data_inicio date, p_data_fim date)
 RETURNS TABLE(ativo_total numeric, ativo_circulante numeric, ativo_nao_circulante numeric, realizavel_lp numeric, imobilizado numeric, disponibilidades numeric, clientes numeric, estoques numeric, passivo_circulante numeric, passivo_nao_circulante numeric, fornecedores numeric, patrimonio_liquido numeric, receita_bruta numeric, deducoes_receita numeric, receita_liquida numeric, cmv numeric, lucro_liquido numeric, dias_periodo integer)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  WITH bal AS (
    SELECT
      b.saldo_final, b.debitos, b.creditos, b.aceita_lancamento,
      public.fn_norm_conta_codigo(
        COALESCE(NULLIF(pc.codigo_referencial, ''), b.codigo)
      ) AS k
    FROM public.fn_balancete(p_empresa_id, p_data_inicio, p_data_fim) b
    JOIN public.plano_contas pc ON pc.id = b.conta_id
    WHERE b.aceita_lancamento
  ),
  agg AS (
    SELECT
      SUM(CASE WHEN k LIKE '01%'     THEN saldo_final ELSE 0 END) AS ativo_total,
      SUM(CASE WHEN k LIKE '0101%'   THEN saldo_final ELSE 0 END) AS ativo_circulante,
      SUM(CASE WHEN k LIKE '0102%'   THEN saldo_final ELSE 0 END) AS ativo_nao_circulante,
      SUM(CASE WHEN k LIKE '010201%' THEN saldo_final ELSE 0 END) AS realizavel_lp,
      SUM(CASE WHEN k LIKE '010203%' THEN saldo_final ELSE 0 END) AS imobilizado,
      SUM(CASE WHEN k LIKE '010101%' OR k LIKE '010102%'
               THEN saldo_final ELSE 0 END)                        AS disponibilidades,
      SUM(CASE WHEN k LIKE '010103%' THEN saldo_final ELSE 0 END) AS clientes,
      SUM(CASE WHEN k LIKE '010104%' THEN saldo_final ELSE 0 END) AS estoques,
      SUM(CASE WHEN k LIKE '0201%'   THEN -saldo_final ELSE 0 END) AS passivo_circulante,
      SUM(CASE WHEN k LIKE '0202%'   THEN -saldo_final ELSE 0 END) AS passivo_nao_circulante,
      SUM(CASE WHEN k LIKE '020101%' THEN -saldo_final ELSE 0 END) AS fornecedores,
      SUM(CASE WHEN k LIKE '0203%'   THEN -saldo_final ELSE 0 END) AS patrimonio_liquido,
      SUM(CASE WHEN k LIKE '0301%'   THEN (creditos - debitos) ELSE 0 END) AS receita_bruta,
      SUM(CASE WHEN k LIKE '0302%'   THEN (debitos - creditos) ELSE 0 END) AS deducoes_receita,
      SUM(CASE WHEN k LIKE '0303%'   THEN (debitos - creditos) ELSE 0 END) AS cmv,
      SUM(CASE WHEN k LIKE '03%'     THEN (creditos - debitos) ELSE 0 END) AS lucro_liquido
    FROM bal
  )
  SELECT
    COALESCE(ativo_total,            0)::numeric,
    COALESCE(ativo_circulante,       0)::numeric,
    COALESCE(ativo_nao_circulante,   0)::numeric,
    COALESCE(realizavel_lp,          0)::numeric,
    COALESCE(imobilizado,            0)::numeric,
    COALESCE(disponibilidades,       0)::numeric,
    COALESCE(clientes,               0)::numeric,
    COALESCE(estoques,               0)::numeric,
    COALESCE(passivo_circulante,     0)::numeric,
    COALESCE(passivo_nao_circulante, 0)::numeric,
    COALESCE(fornecedores,           0)::numeric,
    COALESCE(patrimonio_liquido,     0)::numeric,
    COALESCE(receita_bruta,          0)::numeric,
    COALESCE(deducoes_receita,       0)::numeric,
    (COALESCE(receita_bruta, 0) - COALESCE(deducoes_receita, 0))::numeric,
    COALESCE(cmv,                    0)::numeric,
    COALESCE(lucro_liquido,          0)::numeric,
    GREATEST((p_data_fim - p_data_inicio) + 1, 1)::integer
  FROM agg;
$function$
