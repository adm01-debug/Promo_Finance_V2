CREATE OR REPLACE FUNCTION public.drop_old_partitions(p_schema text DEFAULT 'public'::text, p_keep_months integer DEFAULT 12)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
DECLARE v_dropped text[]:='{}'; rec record;
BEGIN
  FOR rec IN SELECT schemaname,tablename FROM pg_tables
    WHERE schemaname=p_schema AND tablename~'_\d{4}_\d{2}$'
      AND to_date(substring(tablename FROM '_(\d{4}_\d{2})$'),'YYYY_MM')
          < date_trunc('month',now())-(p_keep_months||' months')::interval
  LOOP
    EXECUTE format('DROP TABLE IF EXISTS %I.%I',rec.schemaname,rec.tablename);
    v_dropped:=array_append(v_dropped,rec.tablename);
  END LOOP;
  RETURN jsonb_build_object('dropped',v_dropped,'count',array_length(v_dropped,1));
END;
$function$
