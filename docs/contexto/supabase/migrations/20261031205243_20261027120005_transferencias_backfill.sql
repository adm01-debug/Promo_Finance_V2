DO $$
DECLARE
  v_expr text;
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'transferencias'
      AND column_name = 'conta_bancaria_id'
  ) THEN
    v_expr := 'COALESCE(t.conta_origem_id, t.conta_bancaria_id)';
  ELSE
    v_expr := 't.conta_origem_id';
  END IF;

  DELETE FROM movimentacoes m
  USING transferencias t
  WHERE m.transferencia_id = t.id
    AND m.tipo = 'saida'
    AND t.conta_destino_id IS NULL
    AND t.status IN ('realizado', 'concluido')
    AND m.origem = 'transferencia'
    AND m.deleted_at IS NULL
    AND NOT EXISTS (
      SELECT 1 FROM lancamentos_contabeis l
      WHERE l.origem = 'financeiro_movimentacao' AND l.origem_id = m.id
    );

  EXECUTE format(
    'INSERT INTO movimentacoes (empresa_id, conta_bancaria_id, tipo, descricao, valor, data_movimentacao, transferencia_id, origem)
     SELECT t.empresa_id, %s, ''saida'', t.descricao, t.valor, t.data_transferencia, t.id,
            CASE WHEN t.conta_destino_id IS NULL THEN ''transferencia_externa'' ELSE ''transferencia'' END
     FROM transferencias t
     WHERE t.status IN (''realizado'', ''concluido'')
       AND %s IS NOT NULL
       AND NOT EXISTS (
         SELECT 1 FROM movimentacoes m
         WHERE m.transferencia_id = t.id AND m.tipo = ''saida''
       )',
    v_expr,
    v_expr
  );

  INSERT INTO movimentacoes (empresa_id, conta_bancaria_id, tipo, descricao, valor, data_movimentacao, transferencia_id, origem)
  SELECT t.empresa_id, t.conta_destino_id, 'entrada', t.descricao, t.valor, t.data_transferencia, t.id, 'transferencia'
  FROM transferencias t
  WHERE t.status IN ('realizado', 'concluido')
    AND t.conta_destino_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM movimentacoes m
      WHERE m.transferencia_id = t.id AND m.tipo = 'entrada'
    );

  UPDATE transferencias t
  SET movimentacao_id = m.id
  FROM movimentacoes m
  WHERE m.transferencia_id = t.id
    AND m.tipo = 'saida'
    AND m.deleted_at IS NULL
    AND t.conta_destino_id IS NULL
    AND (t.movimentacao_id IS NULL
         OR NOT EXISTS (SELECT 1 FROM movimentacoes x WHERE x.id = t.movimentacao_id));

  UPDATE movimentacoes m
  SET origem = 'transferencia_externa'
  FROM transferencias t
  WHERE m.transferencia_id = t.id
    AND m.tipo = 'saida'
    AND t.conta_destino_id IS NULL
    AND m.origem = 'transferencia'
    AND (m.deleted_at IS NOT NULL
         OR EXISTS (
           SELECT 1 FROM lancamentos_contabeis l
           WHERE l.origem = 'financeiro_movimentacao' AND l.origem_id = m.id
         ));
END $$;
