DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_matviews
    WHERE schemaname = 'public'
      AND matviewname IN (
        'mv_dashboard_metrics',
        'mv_fluxo_caixa',
        'mv_top_fornecedores',
        'mv_inadimplencia'
      )
  ) THEN
    RAISE NOTICE '20251231000200: views materializadas já existem; mantendo definições canônicas.';
  ELSE
    RAISE NOTICE '20251231000200: pacote legado de views materializadas não é criado no schema canônico.';
  END IF;
END
$$;
