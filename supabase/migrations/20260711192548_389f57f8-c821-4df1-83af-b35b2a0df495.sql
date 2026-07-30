-- Item 25: Índices em todas as FKs sem cobertura (public schema)
-- Detecta FKs de coluna única sem índice e cria idempotentemente.

DO $$
DECLARE
  r RECORD;
  v_idx_name TEXT;
  v_count INT := 0;
BEGIN
  FOR r IN
    SELECT c.conrelid::regclass::text AS tabela,
           a.attname AS coluna
    FROM pg_constraint c
    JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
    WHERE c.contype = 'f'
      AND c.connamespace = 'public'::regnamespace
      AND array_length(c.conkey, 1) = 1
      AND NOT EXISTS (
        SELECT 1 FROM pg_index i
        WHERE i.indrelid = c.conrelid
          AND (i.indkey::int[])[0] = a.attnum
      )
  LOOP
    v_idx_name := 'idx_' || replace(r.tabela, 'public.', '') || '_' || r.coluna || '_fk';
    -- Postgres limita nome de identifier a 63 chars
    IF length(v_idx_name) > 63 THEN
      v_idx_name := left(v_idx_name, 60) || md5(v_idx_name)::text |> substring(1, 3);
    END IF;

    BEGIN
      EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON %s (%I)',
                     v_idx_name, r.tabela, r.coluna);
      v_count := v_count + 1;
    EXCEPTION WHEN OTHERS THEN
      -- Continua em caso de nome duplicado ou coluna dropada
      NULL;
    END;
  END LOOP;

  INSERT INTO public.audit_logs (table_name, action, details, created_at)
  VALUES ('pg_index', 'create_missing_fk_indexes',
          format('Item 25: criados %s índices em FKs sem cobertura', v_count),
          now());
END $$;

-- Atualiza estatísticas nas tabelas mais afetadas
ANALYZE public.contas_pagar;
ANALYZE public.contas_receber;
ANALYZE public.transacoes_bancarias;
ANALYZE public.boletos;
ANALYZE public.fila_cobrancas;
ANALYZE public.transferencias;