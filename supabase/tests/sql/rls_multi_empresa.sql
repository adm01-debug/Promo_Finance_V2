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
    AND pc.relkind IN ('r', 'p') -- tabelas físicas + particionadas (exclui views/matviews)
    AND pc.relrowsecurity = false;

  IF offenders IS NOT NULL THEN
    RAISE EXCEPTION 'RLS desabilitado em tabelas multi-empresa: %', offenders;
  END IF;
END $$;

-- 2) Tabelas com empresa_id sem NENHUMA policy (RLS default-deny é bom,
--    mas expõe bug de "esquecemos a policy") — apenas WARN. Restrito a
--    tabelas físicas + particionadas (relkind IN ('r','p')): views com
--    empresa_id não suportam policy própria (usam security_invoker),
--    então seriam ruído permanente aqui sem o filtro.
DO $$
DECLARE
  missing text[];
BEGIN
  SELECT array_agg(c.table_name ORDER BY c.table_name) INTO missing
  FROM information_schema.columns c
  JOIN pg_class pc ON pc.relname = c.table_name AND pc.relnamespace = 'public'::regnamespace
  WHERE c.table_schema = 'public'
    AND c.column_name = 'empresa_id'
    AND pc.relkind IN ('r', 'p')
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
--
-- Fallback USING <-> WITH CHECK: no Postgres, quando uma cláusula é
-- omitida a outra é usada no lugar dela (e se as DUAS forem omitidas, a
-- policy equivale a USING(true)/WITH CHECK(true) — totalmente aberta). A
-- primeira versão desta checagem só examinava qual/with_check quando
-- NÃO eram NULL, então uma policy sem USING nenhum (ex.: `FOR SELECT`
-- sem cláusula) passava batida — mesma categoria do bug original.
-- USING vale para SELECT/DELETE/UPDATE/ALL; WITH CHECK vale para
-- INSERT/UPDATE/ALL (ver CREATE POLICY na doc do Postgres).
--
-- Nota de limitação conhecida: a checagem é busca textual, não parsing
-- estrutural do SQL — uma policy tautológica que referencie `empresa_id`
-- de uma tabela não relacionada (ex.: EXISTS numa subquery que nunca
-- amarra a linha externa) tecnicamente escaparia. Construir um parser
-- SQL em plpgsql para eliminar esse caso é desproporcional para um
-- smoke-test de CI; todas as policies do schema atual foram verificadas
-- manualmente na auditoria (PR #54) e referenciam a própria coluna.
DO $$
DECLARE
  suspect record;
  offenders text := '';
  -- Além do "empresa_id IN (SELECT id FROM empresas)", cobre dois outros
  -- padrões tautológicos reais encontrados em auditoria: um NOT NULL
  -- sozinho (não restringe A empresa, só exige que a coluna esteja
  -- preenchida) e a comparação trivial empresa_id = empresa_id.
  tautologia text := '(\w+\.)?empresa_id\s+in\s*\(\s*select\s+(\w+\.)?id\s+from\s+(public\.)?empresas(\s+\w+)?\s*\)'
    || '|(\w+\.)?empresa_id\s+is\s+not\s+null'
    || '|(\w+\.)?empresa_id\s*=\s*(\w+\.)?empresa_id\b';
BEGIN
  FOR suspect IN
    SELECT p.tablename, p.policyname, p.cmd,
           COALESCE(p.qual, '<NULL>') AS qual,
           COALESCE(p.with_check, '<NULL>') AS with_check
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
        -- comandos que aplicam USING: o Postgres NÃO usa WITH CHECK como
        -- fallback aqui — se USING é omitido, o padrão é `true` (aberto),
        -- não o WITH CHECK. Uma policy de UPDATE/ALL só com WITH CHECK
        -- filtrando empresa_id passaria batida se aplicássemos o fallback
        -- errado (achado do coderabbitai). Usa p.qual puro.
        (
          p.cmd IN ('SELECT', 'DELETE', 'UPDATE', 'ALL')
          AND (
            p.qual IS NULL
            OR p.qual !~* 'empresa_id'
            OR p.qual ~* tautologia
          )
        )
        OR
        -- comandos que aplicam WITH CHECK: aqui sim o Postgres usa USING
        -- como fallback quando WITH CHECK é omitido.
        (
          p.cmd IN ('INSERT', 'UPDATE', 'ALL')
          AND (
            COALESCE(p.with_check, p.qual) IS NULL
            OR COALESCE(p.with_check, p.qual) !~* 'empresa_id'
            OR COALESCE(p.with_check, p.qual) ~* tautologia
          )
        )
      )
  LOOP
    offenders := offenders || format(E'\n  - %s.%s [%s] USING: %s | WITH CHECK: %s',
      suspect.tablename, suspect.policyname, suspect.cmd, suspect.qual, suspect.with_check);
  END LOOP;

  IF offenders <> '' THEN
    RAISE EXCEPTION 'Policies sem escopo de empresa_id (ou tautológicas, ou sem USING/WITH CHECK) em tabelas multi-empresa:%', offenders;
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
    AND pc.relkind IN ('r', 'p');

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
      RAISE EXCEPTION '% ausente OU sem SECURITY DEFINER + search_path fixo', fn;
    END IF;
  END LOOP;
END $$;

-- 6) Tabelas multi-empresa SEM empresa_id direto (escopo por FK indireta,
--    ex.: historico_conciliacao_ia via conta_pagar_id/conta_receber_id) são
--    invisíveis às checagens 1-5 acima, que filtram por
--    information_schema.columns.column_name = 'empresa_id'. É exatamente
--    a classe de blind spot que deixou historico_conciliacao_ia_role_select
--    (has_role(admin) OR has_role(financeiro), zero referência a empresa)
--    sobreviver a três rodadas de fix consecutivas. Allowlist explícita —
--    adicionar aqui qualquer nova tabela multi-tenant sem empresa_id direto.
--    Critério: toda policy PERMISSIVE deve pelo menos MENCIONAR
--    empresa_acessivel/empresa_membro_ativo/empresa_id em algum lugar do
--    USING ou WITH CHECK — não valida a lógica da referência (mesma
--    limitação textual documentada acima na checagem 3), só pega o caso
--    "role sozinho, zero menção a empresa" que já vazou em produção.
DO $$
DECLARE
  suspect record;
  offenders text := '';
  tabelas_fk_indireta text[] := ARRAY['historico_conciliacao_ia'];
BEGIN
  FOR suspect IN
    SELECT p.tablename, p.policyname, p.cmd,
           COALESCE(p.qual, '<NULL>') AS qual,
           COALESCE(p.with_check, '<NULL>') AS with_check
    FROM pg_policies p
    WHERE p.schemaname = 'public'
      AND p.permissive = 'PERMISSIVE'
      AND p.tablename = ANY (tabelas_fk_indireta)
      AND NOT (
        COALESCE(p.qual, '') ~* 'empresa_acessivel|empresa_membro_ativo|empresa_id'
        OR COALESCE(p.with_check, '') ~* 'empresa_acessivel|empresa_membro_ativo|empresa_id'
      )
  LOOP
    offenders := offenders || format(E'\n  - %s.%s [%s] USING: %s | WITH CHECK: %s',
      suspect.tablename, suspect.policyname, suspect.cmd, suspect.qual, suspect.with_check);
  END LOOP;

  IF offenders <> '' THEN
    RAISE EXCEPTION 'Policies sem NENHUMA referência a empresa (FK indireta) em tabelas multi-empresa:%', offenders;
  END IF;
END $$;

ROLLBACK;

\echo '✅ RLS multi-empresa suite: OK'
