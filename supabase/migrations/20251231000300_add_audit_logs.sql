DO $$
DECLARE
  v_missing text[];
BEGIN
  SELECT array_agg(coluna ORDER BY coluna)
  INTO v_missing
  FROM (
    SELECT coluna
    FROM unnest(
      ARRAY[
        'action',
        'created_at',
        'id',
        'new_data',
        'old_data',
        'record_id',
        'table_name',
        'user_agent',
        'user_id'
      ]
    ) AS coluna
    WHERE NOT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'audit_logs'
        AND column_name = coluna
    )
  ) AS faltantes;

  IF v_missing IS NOT NULL THEN
    RAISE EXCEPTION
      '20251231000300 exige a estrutura canônica de audit_logs. Colunas ausentes: %',
      array_to_string(v_missing, ', ');
  END IF;

  RAISE NOTICE '20251231000300: estrutura canônica de audit_logs confirmada; pacote legado mantido como no-op.';
END
$$;
