
-- Habilita RLS em todas as partições existentes de audit_logs e frontend_error_logs
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT c.relname
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    JOIN pg_inherits i ON i.inhrelid = c.oid
    JOIN pg_class parent ON parent.oid = i.inhparent
    WHERE n.nspname = 'public'
      AND parent.relname IN ('audit_logs','frontend_error_logs')
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', r.relname);
  END LOOP;
END $$;

-- Atualiza função para habilitar RLS em novas partições
CREATE OR REPLACE FUNCTION public.ensure_monthly_partitions(
  p_table text,
  p_months_back int DEFAULT 6,
  p_months_forward int DEFAULT 3
) RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_start date;
  v_end date;
  v_partition_name text;
  v_created int := 0;
  i int;
BEGIN
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
$$;
