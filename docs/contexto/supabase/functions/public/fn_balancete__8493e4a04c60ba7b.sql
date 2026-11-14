CREATE OR REPLACE FUNCTION public.fn_balancete(p_empresa_id uuid, p_data_inicio date, p_data_fim date, p_nivel_max integer DEFAULT NULL::integer)
 RETURNS TABLE(conta_id uuid, codigo text, nome text, tipo text, natureza text, nivel integer, aceita_lancamento boolean, saldo_anterior numeric, debitos numeric, creditos numeric, saldo_final numeric)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  WITH RECURSIVE mov AS (
    SELECT
      p.conta_id AS c_id,
      SUM(CASE WHEN l.data_lancamento < p_data_inicio
               THEN CASE WHEN p.tipo = 'debito' THEN p.valor ELSE -p.valor END
               ELSE 0 END) AS saldo_anterior,
      SUM(CASE WHEN l.data_lancamento >= p_data_inicio
               AND  l.data_lancamento <= p_data_fim
               AND  p.tipo = 'debito'
               THEN p.valor ELSE 0 END) AS debitos,
      SUM(CASE WHEN l.data_lancamento >= p_data_inicio
               AND  l.data_lancamento <= p_data_fim
               AND  p.tipo = 'credito'
               THEN p.valor ELSE 0 END) AS creditos
    FROM public.partidas_contabeis p
    JOIN public.lancamentos_contabeis l ON l.id = p.lancamento_id
    WHERE l.empresa_id = p_empresa_id
      AND l.data_lancamento <= p_data_fim
      AND COALESCE(l.status, 'ativo') <> 'cancelado'
    GROUP BY p.conta_id
  ),
  closure AS (
    SELECT pc.id AS ancestor_id, pc.id AS descendant_id
    FROM public.plano_contas pc
    WHERE pc.empresa_id = p_empresa_id
    UNION ALL
    SELECT c.ancestor_id, pc.id
    FROM closure c
    JOIN public.plano_contas pc ON pc.parent_id = c.descendant_id
    WHERE pc.empresa_id = p_empresa_id
  )
  SELECT
    pc.id,
    pc.codigo,
    pc.nome,
    pc.tipo,
    pc.natureza,
    COALESCE(pc.nivel, 1)::integer,
    COALESCE(pc.aceita_lancamento, true),
    COALESCE(SUM(m.saldo_anterior), 0)::numeric,
    COALESCE(SUM(m.debitos),        0)::numeric,
    COALESCE(SUM(m.creditos),       0)::numeric,
    (COALESCE(SUM(m.saldo_anterior), 0)
     + COALESCE(SUM(m.debitos),      0)
     - COALESCE(SUM(m.creditos),     0))::numeric
  FROM public.plano_contas pc
  JOIN closure cl ON cl.ancestor_id = pc.id
  LEFT JOIN mov m ON m.c_id = cl.descendant_id
  WHERE pc.empresa_id = p_empresa_id
    AND COALESCE(pc.ativo, true) = true
    AND (p_nivel_max IS NULL OR COALESCE(pc.nivel, 1) <= p_nivel_max)
  GROUP BY pc.id, pc.codigo, pc.nome, pc.tipo, pc.natureza, pc.nivel, pc.aceita_lancamento
  ORDER BY pc.codigo;
$function$
