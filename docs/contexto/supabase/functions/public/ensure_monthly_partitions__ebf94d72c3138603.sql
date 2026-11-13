CREATE OR REPLACE FUNCTION public.ensure_monthly_partitions(p_table text, p_months_back integer DEFAULT 6, p_months_forward integer DEFAULT 3)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_start date;
  v_end date;
  v_partition_name text;
  v_created int := 0;
  v_relkind "char";
  i int;
BEGIN
  SELECT c.relkind INTO v_relkind
  FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relname = p_table;

  IF v_relkind IS DISTINCT FROM 'p' THEN
    RAISE NOTICE 'ensure_monthly_partitions: public.% não particionada (relkind %) — nada criado',
      p_table, coalesce(v_relkind::text, 'inexistente');
    RETURN 0;
  END IF;

  FOR i IN -p_months_back..p_months_forward LOOP
    v_start := date_trunc('month', now() + make_interval(months => i))::date;
    v_end := (v_start + interval '1 month')::date;
    v_partition_name := format('%s_%s', p_table, to_char(v_start, 'YYYY_MM'));

    IF NOT EXISTS (
      SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relname = v_partition_name
    ) THEN
      EXECUTE format(
        'CREATE TABLE public.%I PARTITION OF public.%I FOR VALUES FROM (%L) TO (%L)',
        v_partition_name, p_table, v_start, v_end
      );
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', v_partition_name);
      v_created := v_created + 1;
    END IF;
  END LOOP;

  IF NOT EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname='public' AND c.relname = p_table || '_default'
  ) THEN
    EXECUTE format(
      'CREATE TABLE public.%I PARTITION OF public.%I DEFAULT',
      p_table || '_default', p_table
    );
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', p_table || '_default');
  END IF;

  RETURN v_created;
END;
$function$
