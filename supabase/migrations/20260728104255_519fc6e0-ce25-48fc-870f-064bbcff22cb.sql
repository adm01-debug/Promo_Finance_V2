-- =====================================================================
-- Otimização RLS: initplan de auth.uid()/auth.jwt()/auth.role()
-- Envolve as chamadas em (select ...) para que o planner as avalie
-- uma única vez por query (InitPlan) em vez de por linha.
-- A semântica das políticas permanece idêntica.
-- =====================================================================
DO $$
DECLARE
  r RECORD;
  novo_qual TEXT;
  novo_check TEXT;
  sql TEXT;
  alteradas INT := 0;
BEGIN
  FOR r IN
    SELECT schemaname, tablename, policyname, cmd, qual, with_check
    FROM pg_policies
    WHERE schemaname = 'public'
      AND (
        qual ~ 'auth\.(uid|jwt|role)\(\)'
        OR with_check ~ 'auth\.(uid|jwt|role)\(\)'
      )
    ORDER BY tablename, policyname
  LOOP
    -- 1) desfaz wrappers já existentes para evitar aninhamento duplicado
    -- 2) envolve cada chamada em (select ...)
    novo_qual := CASE WHEN r.qual IS NULL THEN NULL ELSE
      regexp_replace(
        regexp_replace(r.qual, '\(\s*SELECT\s+(auth\.[a-z_]+\(\))(\s+AS\s+[a-z_]+)?\s*\)', '\1', 'gi'),
        '(auth\.(uid|jwt|role)\(\))', '(select \1)', 'g')
    END;

    novo_check := CASE WHEN r.with_check IS NULL THEN NULL ELSE
      regexp_replace(
        regexp_replace(r.with_check, '\(\s*SELECT\s+(auth\.[a-z_]+\(\))(\s+AS\s+[a-z_]+)?\s*\)', '\1', 'gi'),
        '(auth\.(uid|jwt|role)\(\))', '(select \1)', 'g')
    END;

    IF novo_qual IS NOT DISTINCT FROM r.qual
       AND novo_check IS NOT DISTINCT FROM r.with_check THEN
      CONTINUE;
    END IF;

    sql := format('ALTER POLICY %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
    IF novo_qual IS NOT NULL THEN
      sql := sql || format(' USING (%s)', novo_qual);
    END IF;
    IF novo_check IS NOT NULL THEN
      sql := sql || format(' WITH CHECK (%s)', novo_check);
    END IF;

    BEGIN
      EXECUTE sql;
    EXCEPTION WHEN OTHERS THEN
      RAISE EXCEPTION 'Falha ao otimizar policy "%" da tabela %.%: % | SQL: %',
        r.policyname, r.schemaname, r.tablename, SQLERRM, sql;
    END;

    alteradas := alteradas + 1;
  END LOOP;

  RAISE NOTICE 'Políticas RLS otimizadas: %', alteradas;

  -- Verificação final: nenhuma chamada direta pode restar
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND (
        (qual ~ 'auth\.(uid|jwt|role)\(\)' AND qual !~ '\(\s*SELECT\s+auth\.')
        OR (with_check ~ 'auth\.(uid|jwt|role)\(\)' AND with_check !~ '\(\s*SELECT\s+auth\.')
      )
  ) THEN
    -- só falha se sobrou alguma chamada NÃO envolvida em select
    IF EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public'
        AND (
          regexp_replace(coalesce(qual,''), '\(\s*SELECT\s+auth\.[a-z_]+\(\)(\s+AS\s+[a-z_]+)?\s*\)', '', 'gi') ~ 'auth\.(uid|jwt|role)\(\)'
          OR regexp_replace(coalesce(with_check,''), '\(\s*SELECT\s+auth\.[a-z_]+\(\)(\s+AS\s+[a-z_]+)?\s*\)', '', 'gi') ~ 'auth\.(uid|jwt|role)\(\)'
        )
    ) THEN
      RAISE EXCEPTION 'Ainda existem políticas com auth.*() avaliado por linha após a otimização';
    END IF;
  END IF;
END $$;