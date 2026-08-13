
-- Item 32: Triggers de updated_at automáticos
DO $$
DECLARE
  r RECORD;
  trg_name TEXT;
BEGIN
  FOR r IN
    SELECT c.relname AS tbl
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    JOIN pg_attribute a ON a.attrelid = c.oid AND a.attname='updated_at' AND NOT a.attisdropped
    WHERE n.nspname='public' AND c.relkind='r'
      AND NOT EXISTS (
        SELECT 1 FROM pg_trigger t
        WHERE t.tgrelid = c.oid AND NOT t.tgisinternal
          AND pg_get_triggerdef(t.oid) ILIKE '%update_updated_at%'
      )
  LOOP
    trg_name := 'set_updated_at_' || left(md5(r.tbl), 20);
    BEGIN
      EXECUTE format(
        'CREATE TRIGGER %I BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()',
        trg_name, r.tbl
      );
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Skip %: %', r.tbl, SQLERRM;
    END;
  END LOOP;
END $$;

INSERT INTO public.audit_logs (table_name, action, details, created_at)
VALUES ('pg_trigger', 'updated_at_triggers_created',
        'Item 32: triggers automáticos de updated_at aplicados em tabelas remanescentes.',
        now());
