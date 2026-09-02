DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_matviews
    WHERE schemaname = 'public'
      AND matviewname = 'mv_dashboard_metrics'
  ) THEN
    RAISE NOTICE '20251231000002: mv_dashboard_metrics já existe; mantendo definição canônica.';
  ELSE
    RAISE NOTICE '20251231000002: view materializada legada não é criada no schema canônico.';
  END IF;
END
$$;
