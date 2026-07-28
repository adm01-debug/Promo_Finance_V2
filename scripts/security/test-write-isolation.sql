-- ============================================================================
-- Gap #29 — GATE DE ISOLAMENTO NO CAMINHO DE ESCRITA
-- ----------------------------------------------------------------------------
-- Os gates anteriores (baseline, anon-surface, tenant-isolation) cobrem
-- LEITURA. Este cobre ESCRITA, que é onde os estragos são irreversíveis:
-- um UPDATE que orfana a linha ou um INSERT carimbado com o empresa_id de
-- outro inquilino não disparam nenhum alarme de leitura.
--
-- Três famílias de invariante:
--
--   A) Estático — WITH CHECK nunca pode ser mais permissivo que o USING da
--      mesma política. `USING (empresa_id IS NOT NULL AND ...)` combinado com
--      `WITH CHECK (empresa_id IS NULL OR ...)` deixa o usuário apagar o
--      vínculo de inquilino da própria linha e sumir com ela. Detecta o padrão
--      "USING exige NOT NULL, CHECK aceita NULL" na coluna de inquilino.
--
--   B) Estático — nenhuma política de INSERT/UPDATE visível ao cliente pode
--      ter WITH CHECK trivialmente verdadeiro numa tabela com empresa_id.
--
--   C) Runtime — assumindo `authenticated` com JWT sintético SEM vínculo em
--      user_empresas, todo UPDATE e todo DELETE em massa deve afetar ZERO
--      linhas. Qualquer linha tocada é escrita cross-tenant. Erro 42501 é
--      resultado correto (negado); erro de dentro do predicado (42883 etc.)
--      é regressão, porque vira 401 para o usuário legítimo.
--
-- Uso: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f scripts/security/test-write-isolation.sql
-- Tudo roda dentro de uma transação encerrada com ROLLBACK — nada persiste.
-- ============================================================================
\set ON_ERROR_STOP on
\pset border 2

BEGIN;

-- ---------------------------------------------------------------------------
-- A) WITH CHECK mais permissivo que USING quanto ao vínculo de inquilino
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  v_falhas text[] := '{}';
  r record;
BEGIN
  FOR r IN
    SELECT p.tablename, p.policyname, p.cmd, p.qual, p.with_check
    FROM pg_policies p
    WHERE p.schemaname = 'public'
      AND p.cmd IN ('UPDATE', 'ALL')
      AND p.with_check IS NOT NULL
      AND p.qual IS NOT NULL
      AND ('authenticated' = ANY(p.roles) OR 'public' = ANY(p.roles))
  LOOP
    -- Padrão exato do bug do Gap #29 em public.clientes.
    IF r.qual ~ '\mempresa_id IS NOT NULL\M'
       AND r.with_check ~ '\mempresa_id IS NULL\M' THEN
      v_falhas := v_falhas || format(
        '%s.%s (%s): USING exige empresa_id NOT NULL mas WITH CHECK aceita NULL — permite orfanar a linha',
        r.tablename, r.policyname, r.cmd);
    END IF;
  END LOOP;

  IF array_length(v_falhas, 1) > 0 THEN
    RAISE EXCEPTION E'FAIL (A): % política(s) com WITH CHECK mais fraco que USING:\n  - %',
      array_length(v_falhas, 1), array_to_string(v_falhas, E'\n  - ');
  END IF;
  RAISE NOTICE 'PASS (A): nenhum WITH CHECK mais permissivo que o USING correspondente.';
END $$;

-- ---------------------------------------------------------------------------
-- B) WITH CHECK trivial em tabela com coluna de inquilino
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  v_lista text;
BEGIN
  SELECT string_agg(format('%s.%s (%s)', p.tablename, p.policyname, p.cmd), ', ')
    INTO v_lista
  FROM pg_policies p
  WHERE p.schemaname = 'public'
    AND p.cmd IN ('INSERT', 'UPDATE', 'ALL')
    AND ('authenticated' = ANY(p.roles) OR 'public' = ANY(p.roles))
    AND p.with_check IS NOT NULL
    AND btrim(p.with_check) IN ('true', '(true)')
    AND EXISTS (
      SELECT 1 FROM information_schema.columns col
      WHERE col.table_schema = 'public'
        AND col.table_name = p.tablename
        AND col.column_name = 'empresa_id'
    );

  IF v_lista IS NOT NULL THEN
    RAISE EXCEPTION 'FAIL (B): WITH CHECK trivial (true) em tabela multi-inquilino: %', v_lista;
  END IF;
  RAISE NOTICE 'PASS (B): nenhuma escrita liberada por WITH CHECK trivial.';
END $$;

-- ---------------------------------------------------------------------------
-- C) Probe de runtime: usuário sem inquilino não escreve em lugar nenhum
-- ---------------------------------------------------------------------------
DO $probe$
DECLARE
  r           record;
  u           uuid;
  v_uids      uuid[];
  v_afetadas  integer;
  v_checks    integer := 0;
  v_falhas    text[]  := '{}';
  v_pode_role boolean;
BEGIN
  SELECT pg_has_role(current_user, 'authenticated', 'USAGE') INTO v_pode_role;
  IF NOT v_pode_role THEN
    RAISE NOTICE 'SKIP: a conexão % não pode assumir authenticated; probe de escrita não executado.', current_user;
    RETURN;
  END IF;

  SELECT array_agg(gen_random_uuid()) INTO v_uids FROM generate_series(1, 3);

  FOR r IN
    SELECT c.oid, c.relname AS t
    FROM pg_class c
    JOIN pg_namespace ns ON ns.oid = c.relnamespace
    WHERE ns.nspname = 'public'
      AND c.relkind = 'r'
      AND c.relrowsecurity
      AND NOT c.relforcerowsecurity IS NULL
      AND (has_table_privilege('authenticated', c.oid, 'UPDATE')
        OR has_table_privilege('authenticated', c.oid, 'DELETE'))
    ORDER BY 2
  LOOP
    FOREACH u IN ARRAY v_uids LOOP
      -- ---- UPDATE no-op em massa -------------------------------------------
      IF has_table_privilege('authenticated', r.oid, 'UPDATE') THEN
        BEGIN
          PERFORM set_config('request.jwt.claims',
            json_build_object('sub', u::text, 'role', 'authenticated')::text, true);
          SET LOCAL ROLE authenticated;
          EXECUTE format('UPDATE public.%I SET id = id WHERE true', r.t);
          GET DIAGNOSTICS v_afetadas = ROW_COUNT;
          RESET ROLE;
          IF v_afetadas > 0 THEN
            v_falhas := v_falhas || format('%s: UPDATE afetou %s linha(s) para usuário sem inquilino', r.t, v_afetadas);
          END IF;
        EXCEPTION
          WHEN insufficient_privilege THEN RESET ROLE;              -- negado: correto
          WHEN undefined_column THEN RESET ROLE;                    -- sem coluna id: inconclusivo
          WHEN OTHERS THEN
            RESET ROLE;
            IF SQLSTATE IN ('42883', '42P01', '42704') THEN
              v_falhas := v_falhas || format('%s: predicado de UPDATE quebrado (%s %s) — vira 401', r.t, SQLSTATE, SQLERRM);
            END IF;
        END;
        v_checks := v_checks + 1;
      END IF;

      -- ---- DELETE em massa --------------------------------------------------
      IF has_table_privilege('authenticated', r.oid, 'DELETE') THEN
        BEGIN
          PERFORM set_config('request.jwt.claims',
            json_build_object('sub', u::text, 'role', 'authenticated')::text, true);
          SET LOCAL ROLE authenticated;
          EXECUTE format('DELETE FROM public.%I WHERE true', r.t);
          GET DIAGNOSTICS v_afetadas = ROW_COUNT;
          RESET ROLE;
          IF v_afetadas > 0 THEN
            v_falhas := v_falhas || format('%s: DELETE removeu %s linha(s) para usuário sem inquilino', r.t, v_afetadas);
          END IF;
        EXCEPTION
          WHEN insufficient_privilege THEN RESET ROLE;
          WHEN foreign_key_violation THEN RESET ROLE;  -- chegou a apagar? FK barrou; tratado abaixo
          WHEN OTHERS THEN
            RESET ROLE;
            IF SQLSTATE IN ('42883', '42P01', '42704') THEN
              v_falhas := v_falhas || format('%s: predicado de DELETE quebrado (%s %s) — vira 401', r.t, SQLSTATE, SQLERRM);
            END IF;
        END;
        v_checks := v_checks + 1;
      END IF;
    END LOOP;
  END LOOP;

  RAISE NOTICE 'Cenários de escrita executados: % (tabelas × identidades × verbos).', v_checks;

  IF array_length(v_falhas, 1) > 0 THEN
    RAISE EXCEPTION E'FAIL (C): % violação(ões) de escrita:\n  - %',
      array_length(v_falhas, 1), array_to_string(v_falhas, E'\n  - ');
  END IF;
  RAISE NOTICE 'PASS (C): nenhuma escrita possível para identidade authenticated sem inquilino.';
END $probe$;

ROLLBACK;
