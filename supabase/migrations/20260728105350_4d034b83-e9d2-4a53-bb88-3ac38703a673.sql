CREATE OR REPLACE FUNCTION public.drop_old_partitions(
  p_table text,
  p_retention_months int
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_cutoff date := (date_trunc('month', now()) - make_interval(months => p_retention_months))::date;
  v_rec record;
  v_dropped text[] := ARRAY[]::text[];
  v_upper date;
BEGIN
  IF p_retention_months IS NULL OR p_retention_months < 1 THEN
    RAISE EXCEPTION 'retention_months deve ser >= 1';
  END IF;

  FOR v_rec IN
    SELECT c.relname, pg_get_expr(c.relpartbound, c.oid) AS bound
    FROM pg_class parent
    JOIN pg_inherits i ON i.inhparent = parent.oid
    JOIN pg_class c ON c.oid = i.inhrelid
    JOIN pg_namespace n ON n.oid = parent.relnamespace
    WHERE n.nspname = 'public' AND parent.relname = p_table
  LOOP
    IF v_rec.bound IS NULL OR v_rec.bound ILIKE '%DEFAULT%' THEN
      CONTINUE;
    END IF;

    v_upper := (regexp_match(v_rec.bound, $re$TO \('([0-9]{4}-[0-9]{2}-[0-9]{2})$re$))[1]::date;
    IF v_upper IS NOT NULL AND v_upper <= v_cutoff THEN
      EXECUTE format('DROP TABLE IF EXISTS public.%I', v_rec.relname);
      v_dropped := v_dropped || v_rec.relname;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'table', p_table,
    'cutoff', v_cutoff,
    'dropped', v_dropped,
    'dropped_count', cardinality(v_dropped)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.drop_old_partitions(text, int) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.drop_old_partitions(text, int) TO service_role;