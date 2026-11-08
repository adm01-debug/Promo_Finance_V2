CREATE OR REPLACE FUNCTION public.purge_old_rows(p_table regclass, p_column text, p_days integer, p_where text DEFAULT NULL::text, p_batch integer DEFAULT 10000, p_max_batches integer DEFAULT 50)
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_total bigint := 0;
  v_count bigint;
  v_i integer := 0;
  v_sql text;
BEGIN
  IF p_days IS NULL OR p_days < 1 THEN
    RAISE EXCEPTION 'purge_old_rows: p_days deve ser >= 1 (recebido %)', p_days;
  END IF;
  IF p_batch < 1 OR p_batch > 100000 THEN
    RAISE EXCEPTION 'purge_old_rows: p_batch fora da faixa permitida (1..100000)';
  END IF;

  -- valida que a coluna existe e é temporal (evita injeção via p_column)
  PERFORM 1
    FROM pg_attribute a
    JOIN pg_type t ON t.oid = a.atttypid
   WHERE a.attrelid = p_table
     AND a.attname = p_column
     AND a.attnum > 0
     AND NOT a.attisdropped
     AND t.typname IN ('timestamptz','timestamp','date');
  IF NOT FOUND THEN
    RAISE EXCEPTION 'purge_old_rows: coluna temporal % inexistente em %', p_column, p_table::text;
  END IF;

  v_sql := format(
    'DELETE FROM %s WHERE ctid IN (SELECT ctid FROM %s WHERE %I < now() - ($1 || '' days'')::interval %s LIMIT %s)',
    p_table::text, p_table::text, p_column,
    CASE WHEN p_where IS NULL OR btrim(p_where) = '' THEN '' ELSE 'AND (' || p_where || ')' END,
    p_batch
  );

  LOOP
    v_i := v_i + 1;
    EXECUTE v_sql USING p_days;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_total := v_total + v_count;
    EXIT WHEN v_count < p_batch OR v_i >= p_max_batches;
  END LOOP;

  RETURN v_total;
END;
$function$
