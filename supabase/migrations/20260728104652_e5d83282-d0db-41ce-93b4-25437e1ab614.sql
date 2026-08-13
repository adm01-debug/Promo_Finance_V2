DO $$
DECLARE
  v_names text[] := ARRAY[
    'cleanup_rpc_observability_metrics',
    'log_rpc_observability_call',
    'run_observability_rpc',
    'compare_pg_stat_baseline',
    'get_bloat_snapshots',
    'get_integrity_alerts',
    'use_reset_token',
    'sefaz_cursor_advance',
    'reprocess_dlq',
    'webhook_replay',
    'confirmar_conciliacao',
    'desfazer_conciliacao',
    'registrar_evento_cobranca',
    'get_asaas_payment_stats',
    'export_asaas_audit_csv'
  ];
  r record;
  v_left int;
BEGIN
  FOR r IN
    SELECT p.oid,
           format('%I.%I(%s)', n.nspname, p.proname,
                  pg_get_function_identity_arguments(p.oid)) AS sig
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prosecdef
      AND p.proname = ANY (v_names)
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', r.sig);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', r.sig);
  END LOOP;

  SELECT count(*) INTO v_left
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.proname = ANY (v_names)
    AND (has_function_privilege('anon', p.oid, 'EXECUTE')
         OR has_function_privilege('authenticated', p.oid, 'EXECUTE'));

  IF v_left > 0 THEN
    RAISE EXCEPTION 'Ainda existem % funcoes internas executaveis por roles publicas', v_left;
  END IF;
END $$;