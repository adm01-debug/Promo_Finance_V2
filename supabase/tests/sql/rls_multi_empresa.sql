-- ============================================================================
-- Suíte de validação de RLS multi-empresa
-- ----------------------------------------------------------------------------
-- Objetivo: garantir que nenhuma tabela com coluna `empresa_id` no schema
-- `public` esteja exposta ao role `authenticated` sem RLS habilitado, e que
-- as políticas cubram os quatro comandos (SELECT/INSERT/UPDATE/DELETE) ou
-- explicitamente restrinjam via ALL.
--
-- Execução:
--   psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f supabase/tests/sql/rls_multi_empresa.sql
--
-- Saída: erros lançam ROLLBACK; sucesso silencioso encerra o script com 0.
-- Integrar ao gate de CI (.github/workflows/ci.yml) na etapa security.
-- ============================================================================

\set ON_ERROR_STOP on
\pset pager off

BEGIN;

-- 1) Tabelas com empresa_id SEM RLS habilitado
DO $$
DECLARE
  offenders text[];
BEGIN
  SELECT array_agg(c.table_name ORDER BY c.table_name) INTO offenders
  FROM information_schema.columns c
  JOIN pg_class pc ON pc.relname = c.table_name AND pc.relnamespace = 'public'::regnamespace
  WHERE c.table_schema = 'public'
    AND c.column_name = 'empresa_id'
    AND pc.relkind = 'r'        -- somente tabelas físicas (exclui views/matviews)
    AND pc.relrowsecurity = false;

  IF offenders IS NOT NULL THEN
    RAISE EXCEPTION 'RLS desabilitado em tabelas multi-empresa: %', offenders;
  END IF;
END $$;

-- 2) Tabelas com empresa_id sem NENHUMA policy (RLS default-deny é bom,
--    mas expõe bug de "esquecemos a policy") — apenas WARN. Restrito a
--    tabelas físicas (relkind='r'): views com empresa_id não suportam
--    policy própria (usam security_invoker), então seriam ruído
--    permanente aqui sem o filtro.
DO $$
DECLARE
  missing text[];
BEGIN
  SELECT array_agg(c.table_name ORDER BY c.table_name) INTO missing
  FROM information_schema.columns c
  JOIN pg_class pc ON pc.relname = c.table_name AND pc.relnamespace = 'public'::regnamespace
  WHERE c.table_schema = 'public'
    AND c.column_name = 'empresa_id'
    AND pc.relkind = 'r'
    AND NOT EXISTS (
      SELECT 1 FROM pg_policies p
      WHERE p.schemaname = 'public' AND p.tablename = c.table_name
    );

  IF missing IS NOT NULL THEN
    RAISE WARNING 'Tabelas multi-empresa sem policies (default-deny): %', missing;
  END IF;
END $$;

-- 3) Toda policy (USING e WITH CHECK) em tabela com empresa_id direto deve
--    referenciar a própria coluna empresa_id. Isto pega tanto o padrão
--    "has_role(...) sem empresa_id" (uma role sozinha NÃO é escopo de
--    tenant — o achado central da auditoria de 2026-09-02, PR #54) quanto
--    qualquer outra policy que ignore a coluna por completo. A checagem
--    antiga só sinalizava `USING (true)` literal e EXCLUÍA qualquer qual
--    que mencionasse has_role/auth.uid — exatamente o padrão que vazou
--    dados cross-tenant por meses sem o CI acusar.
DO $$
DECLARE
  suspect record;
  offenders text := '';
BEGIN
  FOR suspect IN
    SELECT p.tablename, p.policyname, p.cmd,
           COALESCE(p.qual, '') AS qual,
           COALESCE(p.with_check, '') AS with_check
    FROM pg_policies p
    JOIN information_schema.columns c
      ON c.table_schema = p.schemaname
     AND c.table_name  = p.tablename
     AND c.column_name = 'empresa_id'
    WHERE p.schemaname = 'public'
      -- RESTRICTIVE policies só estreitam acesso (AND com as PERMISSIVE) —
      -- nunca são a origem de um vazamento; checar só as PERMISSIVE, que
      -- combinam via OR e foram a causa raiz do bug original.
      AND p.permissive = 'PERMISSIVE'
      AND (
        -- USING presente mas sem referência a empresa_id
        (p.qual IS NOT NULL AND p.qual !~* 'empresa_id')
        -- WITH CHECK presente mas sem referência a empresa_id
        OR (p.with_check IS NOT NULL AND p.with_check !~* 'empresa_id')
        -- tautologia: "empresa_id IN (SELECT id FROM empresas)" sem
        -- filtro nenhum no subselect — sempre verdadeiro para qualquer
        -- empresa_id válido, equivale a não ter policy nenhuma. Tolera
        -- alias de tabela/coluna (ex.: "t.empresa_id IN (SELECT e.id FROM
        -- empresas e)") para não deixar passar a mesma tautologia só por
        -- causa de um alias.
        OR (p.qual ~* '(\w+\.)?empresa_id\s+in\s*\(\s*select\s+(\w+\.)?id\s+from\s+(public\.)?empresas(\s+\w+)?\s*\)')
        OR (p.with_check ~* '(\w+\.)?empresa_id\s+in\s*\(\s*select\s+(\w+\.)?id\s+from\s+(public\.)?empresas(\s+\w+)?\s*\)')
      )
  LOOP
    offenders := offenders || format(E'\n  - %s.%s [%s] USING: %s | WITH CHECK: %s',
      suspect.tablename, suspect.policyname, suspect.cmd, suspect.qual, suspect.with_check);
  END LOOP;

  IF offenders <> '' THEN
    RAISE EXCEPTION 'Policies sem escopo de empresa_id (ou tautológicas) em tabelas multi-empresa:%', offenders;
  END IF;
END $$;

-- 4) Nenhuma tabela multi-empresa pode conceder DELETE/UPDATE/INSERT direto
--    para anon. (service_role tem bypass implícito de RLS no Supabase —
--    não é checado aqui por não precisar de GRANT explícito.)
DO $$
DECLARE
  bad text[];
BEGIN
  -- anon jamais deve receber DELETE/UPDATE/INSERT direto em tabelas multi-empresa
  SELECT array_agg(DISTINCT c.table_name ORDER BY c.table_name) INTO bad
  FROM information_schema.columns c
  JOIN pg_class pc ON pc.relname = c.table_name AND pc.relnamespace = 'public'::regnamespace
  JOIN information_schema.role_table_grants g
    ON g.table_schema = 'public'
   AND g.table_name = c.table_name
   AND g.grantee = 'anon'
   AND g.privilege_type IN ('DELETE','UPDATE','INSERT')
  WHERE c.table_schema = 'public'
    AND c.column_name = 'empresa_id'
    AND pc.relkind = 'r';

  IF bad IS NOT NULL THEN
    RAISE EXCEPTION 'anon com GRANT de escrita direto em tabelas multi-empresa: %', bad;
  END IF;
END $$;

-- 5) Sanidade: helpers empresa_acessivel/empresa_membro_ativo existem e são
--    SECURITY DEFINER com search_path fixo (nomes reais em uso no schema —
--    "user_has_empresa_access", checado aqui antes, nunca existiu em
--    nenhuma migration).
DO $$
DECLARE
  fn text;
BEGIN
  FOREACH fn IN ARRAY ARRAY['empresa_acessivel', 'empresa_membro_ativo']
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = 'public'
        AND p.proname = fn
        AND p.prosecdef = true
        AND array_to_string(p.proconfig, ',') LIKE '%search_path=%'
    ) THEN
      RAISE WARNING '% ausente OU sem SECURITY DEFINER + search_path fixo', fn;
    END IF;
  END LOOP;
END $$;

ROLLBACK;

\echo '✅ RLS multi-empresa suite: OK'
