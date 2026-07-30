-- ============================================================================
-- Gap #27 — PROBE DE RUNTIME COM IDENTIDADE `authenticated`
-- ----------------------------------------------------------------------------
-- Os gates anteriores validam a *forma* das políticas (catálogo). Este script
-- valida o *comportamento*: assume o papel `authenticated` com um JWT sintético
-- (usuário que não pertence a nenhuma empresa e não tem papel algum) e executa
-- um SELECT em TODA tabela de `public` com RLS visível ao cliente.
--
-- Invariantes verificados, para cada tabela e para vários UIDs aleatórios:
--   1. A leitura NÃO pode falhar. Erro 42501/42883 dentro de uma policy é a
--      regressão do Gap #23 (predicado chamando função sem EXECUTE) e vira 401
--      para o usuário final — nunca é "seguro por acidente".
--   2. A leitura NÃO pode devolver linhas. Um usuário sem vínculo em
--      user_empresas e sem papel não tem inquilino algum: qualquer linha
--      visível é vazamento cross-tenant.
--   3. RPCs administrativas devem NEGAR (exceção) esse usuário, e não devolver
--      dados.
--
-- Uso:  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f scripts/security/test-tenant-isolation.sql
--
-- Nota: conexões que não podem `SET ROLE authenticated` (sandbox de dev, papel
-- sem membership) registram SKIP explícito em vez de falso-positivo. No CI a
-- conexão é privilegiada e o probe roda de verdade.
-- ============================================================================
\set ON_ERROR_STOP on
\pset border 2

BEGIN;

DO $probe$
DECLARE
  r            record;
  u            uuid;
  n            integer;
  v_uids       uuid[];
  v_checks     integer := 0;
  v_falhas     text[]  := '{}';
  v_pode_role  boolean;
  v_rpc        text;
  v_admin_rpcs text[] := ARRAY[
    'get_frontend_error_groups',
    'get_catalogos_tributarios_health',
    'get_cobertura_fiscal_uf',
    'get_table_bloat',
    'get_cron_jobs'
  ];
BEGIN
  -- ---------------------------------------------------------------- guarda --
  SELECT pg_has_role(current_user, 'authenticated', 'USAGE') INTO v_pode_role;
  IF NOT v_pode_role THEN
    RAISE NOTICE 'SKIP: a conexão % não pode assumir o papel authenticated; probe de runtime não executado.', current_user;
    RETURN;
  END IF;

  -- Vários UIDs distintos → centenas de cenários (tabelas × identidades).
  SELECT array_agg(gen_random_uuid()) INTO v_uids FROM generate_series(1, 5);

  -- ------------------------------------------------- 1) leitura por tabela --
  FOR r IN
    SELECT c.oid, c.relname AS t
    FROM pg_class c
    JOIN pg_namespace ns ON ns.oid = c.relnamespace
    WHERE ns.nspname = 'public'
      AND c.relkind = 'r'
      AND c.relrowsecurity
      AND has_table_privilege('authenticated', c.oid, 'SELECT')
    ORDER BY 2
  LOOP
    FOREACH u IN ARRAY v_uids LOOP
      BEGIN
        PERFORM set_config(
          'request.jwt.claims',
          json_build_object('sub', u::text, 'role', 'authenticated')::text,
          true
        );
        SET LOCAL ROLE authenticated;
        EXECUTE format('SELECT count(*) FROM (SELECT 1 FROM public.%I LIMIT 5) x', r.t) INTO n;
        RESET ROLE;

        IF n > 0 THEN
          v_falhas := v_falhas || format('%s: %s linha(s) visíveis a usuário sem inquilino — VAZAMENTO', r.t, n);
        END IF;
      EXCEPTION WHEN OTHERS THEN
        RESET ROLE;
        v_falhas := v_falhas || format('%s: policy falhou (%s %s) — vira 401 para o usuário', r.t, SQLSTATE, SQLERRM);
      END;
      v_checks := v_checks + 1;
    END LOOP;
  END LOOP;

  -- --------------------------------------------- 2) RPCs administrativas ----
  FOREACH v_rpc IN ARRAY v_admin_rpcs LOOP
    IF to_regprocedure(format('public.%s()', v_rpc)) IS NULL THEN
      CONTINUE;
    END IF;
    BEGIN
      PERFORM set_config(
        'request.jwt.claims',
        json_build_object('sub', v_uids[1]::text, 'role', 'authenticated')::text,
        true
      );
      SET LOCAL ROLE authenticated;
      EXECUTE format('SELECT count(*) FROM public.%I()', v_rpc) INTO n;
      RESET ROLE;
      v_falhas := v_falhas || format('%s: executou para usuário sem papel admin (retornou %s linha(s))', v_rpc, n);
    EXCEPTION WHEN OTHERS THEN
      -- Negar é o comportamento correto.
      RESET ROLE;
    END;
    v_checks := v_checks + 1;
  END LOOP;

  RAISE NOTICE 'Cenários executados: % (tabelas × identidades + RPCs).', v_checks;

  IF array_length(v_falhas, 1) > 0 THEN
    RAISE EXCEPTION E'FAIL: % violação(ões) de isolamento:\n  - %',
      array_length(v_falhas, 1), array_to_string(v_falhas, E'\n  - ');
  END IF;

  RAISE NOTICE 'PASS: nenhuma linha nem erro de policy para identidade authenticated sem inquilino.';
END $probe$;

ROLLBACK;
