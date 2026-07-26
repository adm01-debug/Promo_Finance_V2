-- Índice de apoio para agregação por conta
CREATE INDEX IF NOT EXISTS partidas_contabeis_conta_lanc_idx
  ON public.partidas_contabeis (conta_id, lancamento_id) INCLUDE (tipo, valor);

CREATE INDEX IF NOT EXISTS lancamentos_contabeis_empresa_comp_idx
  ON public.lancamentos_contabeis (empresa_id, competencia);

-- =====================================================================
-- fn_balancete: saldo anterior / débitos / créditos / saldo final
-- com totalização hierárquica (contas sintéticas somam descendentes).
-- SECURITY INVOKER: RLS do chamador é aplicada.
-- =====================================================================
CREATE OR REPLACE FUNCTION public.fn_balancete(
  p_empresa_id uuid,
  p_data_inicio date,
  p_data_fim date,
  p_nivel_max integer DEFAULT NULL
)
RETURNS TABLE (
  conta_id uuid,
  codigo text,
  nome text,
  tipo text,
  natureza text,
  nivel integer,
  aceita_lancamento boolean,
  saldo_anterior numeric,
  debitos numeric,
  creditos numeric,
  saldo_final numeric
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  WITH RECURSIVE mov AS (
    SELECT
      p.conta_id AS c_id,
      SUM(CASE WHEN l.data_lancamento < p_data_inicio
               THEN CASE WHEN p.tipo = 'D' THEN p.valor ELSE -p.valor END
               ELSE 0 END) AS saldo_anterior,
      SUM(CASE WHEN l.data_lancamento >= p_data_inicio AND l.data_lancamento <= p_data_fim AND p.tipo = 'D'
               THEN p.valor ELSE 0 END) AS debitos,
      SUM(CASE WHEN l.data_lancamento >= p_data_inicio AND l.data_lancamento <= p_data_fim AND p.tipo = 'C'
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
    COALESCE(SUM(m.debitos), 0)::numeric,
    COALESCE(SUM(m.creditos), 0)::numeric,
    (COALESCE(SUM(m.saldo_anterior), 0) + COALESCE(SUM(m.debitos), 0) - COALESCE(SUM(m.creditos), 0))::numeric
  FROM public.plano_contas pc
  JOIN closure cl ON cl.ancestor_id = pc.id
  LEFT JOIN mov m ON m.c_id = cl.descendant_id
  WHERE pc.empresa_id = p_empresa_id
    AND COALESCE(pc.ativo, true) = true
    AND (p_nivel_max IS NULL OR COALESCE(pc.nivel, 1) <= p_nivel_max)
  GROUP BY pc.id, pc.codigo, pc.nome, pc.tipo, pc.natureza, pc.nivel, pc.aceita_lancamento
  ORDER BY pc.codigo;
$$;

-- =====================================================================
-- fn_livro_razao: movimentos com saldo corrido por conta
-- =====================================================================
CREATE OR REPLACE FUNCTION public.fn_livro_razao(
  p_empresa_id uuid,
  p_data_inicio date,
  p_data_fim date,
  p_conta_id uuid DEFAULT NULL
)
RETURNS TABLE (
  conta_id uuid,
  codigo text,
  nome text,
  saldo_anterior numeric,
  lancamento_id uuid,
  data_lancamento date,
  numero_lancamento bigint,
  historico text,
  debito numeric,
  credito numeric,
  saldo_corrido numeric
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  WITH base AS (
    SELECT
      p.conta_id AS c_id,
      pc.codigo AS c_codigo,
      pc.nome AS c_nome,
      l.id AS l_id,
      l.data_lancamento AS l_data,
      l.numero_lancamento AS l_numero,
      COALESCE(l.historico, COALESCE(p.historico_complementar, '')) AS l_hist,
      CASE WHEN p.tipo = 'D' THEN p.valor ELSE 0 END AS deb,
      CASE WHEN p.tipo = 'C' THEN p.valor ELSE 0 END AS cred,
      (l.data_lancamento < p_data_inicio) AS anterior,
      COALESCE(p.ordem, 0) AS p_ordem
    FROM public.partidas_contabeis p
    JOIN public.lancamentos_contabeis l ON l.id = p.lancamento_id
    JOIN public.plano_contas pc ON pc.id = p.conta_id
    WHERE l.empresa_id = p_empresa_id
      AND l.data_lancamento <= p_data_fim
      AND COALESCE(l.status, 'ativo') <> 'cancelado'
      AND (p_conta_id IS NULL OR p.conta_id = p_conta_id)
  ),
  ant AS (
    SELECT c_id, COALESCE(SUM(deb - cred), 0) AS saldo_anterior
    FROM base WHERE anterior GROUP BY c_id
  )
  SELECT
    b.c_id,
    b.c_codigo,
    b.c_nome,
    COALESCE(a.saldo_anterior, 0)::numeric,
    b.l_id,
    b.l_data,
    b.l_numero,
    b.l_hist,
    b.deb::numeric,
    b.cred::numeric,
    (COALESCE(a.saldo_anterior, 0) + SUM(b.deb - b.cred) OVER (
        PARTITION BY b.c_id ORDER BY b.l_data, b.l_numero NULLS LAST, b.p_ordem, b.l_id
        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW))::numeric
  FROM base b
  LEFT JOIN ant a ON a.c_id = b.c_id
  WHERE NOT b.anterior
  ORDER BY b.c_codigo, b.l_data, b.l_numero NULLS LAST, b.p_ordem;
$$;

REVOKE ALL ON FUNCTION public.fn_balancete(uuid, date, date, integer) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.fn_livro_razao(uuid, date, date, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_balancete(uuid, date, date, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_livro_razao(uuid, date, date, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_balancete(uuid, date, date, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.fn_livro_razao(uuid, date, date, uuid) TO service_role;