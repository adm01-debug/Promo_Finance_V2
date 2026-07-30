DO $$
DECLARE
  r RECORD;
  pol_name TEXT;
BEGIN
  FOR r IN
    SELECT c.relname AS partition_name
    FROM pg_inherits i
    JOIN pg_class c ON c.oid = i.inhrelid
    JOIN pg_class p ON p.oid = i.inhparent
    JOIN pg_namespace n ON n.oid = p.relnamespace
    WHERE n.nspname = 'public'
      AND p.relname IN ('audit_logs', 'frontend_error_logs')
  LOOP
    -- Garante RLS habilitada
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', r.partition_name);

    pol_name := 'admin_only_' || r.partition_name;

    -- Cria política admin-only se ainda não existir
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = r.partition_name
        AND policyname = pol_name
    ) THEN
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING (public.has_role(auth.uid(), ''admin''::public.app_role)) WITH CHECK (public.has_role(auth.uid(), ''admin''::public.app_role))',
        pol_name, r.partition_name
      );
    END IF;
  END LOOP;
END $$;