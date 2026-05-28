-- ============================================================
-- Harden SECURITY DEFINER functions: enforce a fixed search_path
-- ============================================================
--
-- Problem: ~30 SECURITY DEFINER functions across the codebase were
-- created without `SET search_path = …` on the function definition.
-- That lets a malicious unprivileged user create same-named helpers
-- in a schema earlier in their search_path and trick the SECURITY
-- DEFINER function into executing those (search_path injection).
-- This migration locks every SECURITY DEFINER function in the
-- `public` schema to a known good search_path. Idempotent: running
-- it again is a no-op.
--
-- The function names below are computed at runtime so any new
-- SECURITY DEFINER functions introduced later in the project are
-- still hardened — we don't have to enumerate them by hand.

DO $$
DECLARE
  fn record;
  fn_signature text;
  has_setting boolean;
BEGIN
  FOR fn IN
    SELECT
      p.oid,
      n.nspname AS schema_name,
      p.proname AS fn_name,
      pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE p.prosecdef = true
      AND n.nspname = 'public'
  LOOP
    -- Skip if a search_path is already pinned on the function.
    SELECT EXISTS (
      SELECT 1
      FROM unnest(coalesce(
        (SELECT proconfig FROM pg_proc WHERE oid = fn.oid),
        ARRAY[]::text[]
      )) AS cfg(item)
      WHERE item LIKE 'search_path=%'
    ) INTO has_setting;

    IF has_setting THEN
      CONTINUE;
    END IF;

    fn_signature := format('%I.%I(%s)', fn.schema_name, fn.fn_name, fn.args);

    BEGIN
      EXECUTE format(
        'ALTER FUNCTION %s SET search_path = public, pg_catalog',
        fn_signature
      );
      RAISE NOTICE 'Hardened search_path on %', fn_signature;
    EXCEPTION WHEN OTHERS THEN
      -- Don't abort the whole migration for one bad function; log and continue.
      RAISE WARNING 'Could not pin search_path on %: %', fn_signature, SQLERRM;
    END;
  END LOOP;
END
$$;
