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
  -- Escopos legítimos que NÃO vazam tenant, aceitos pela checagem por desenho
  -- (espelham o gate canônico offline scripts/security/test-canonical-db-gates.mjs:
  -- EXPECTED_FIXED_POLICIES aceita owner `user_id = auth.uid()` e admin
  -- `has_role(auth.uid(),'admin'::app_role)`; ALLOWED_LITERAL_TRUE_POLICIES aceita
  -- as literal-true de service_role):
  --   owner_scope     : a linha pertence ao usuário autenticado (user_id/id = auth.uid())
  --   role_operacional: qualquer role que não seja admin/super_admin — se aparecer,
  --                     a policy NÃO é admin-global e segue como suspeita
  --   debito_conhecido: allowlist de políticas D1 pré-existentes (achado da auditoria
  --                     de 2026-11-20, PR #480) com papéis operacionais ou leitura
  --                     global por desenho, ainda pendentes de correção em PR dedicada
  --                     de migrations. O guard continua sendo firebreak: qualquer
  --                     policy NOVA fora destas cai na falha.
  owner_scope text := '(user_id|id)\s*=\s*(\(?\s*select\s*\(?\s*)*auth\.uid\(\)(\s+as\s+uid\s*\)?)*|auth\.uid\(\)(\s+as\s+uid\s*\)?)*\s*=\s*(user_id|id)';
  -- admin-global: policy cujo único role é admin/super_admin (has_role(...'admin'::app_role)
  -- ou profiles.role = ANY(ARRAY['admin','super_admin'])) — admin enxerga o tenant inteiro,
  -- não vaza entre tenants distintos; aceito pelo gate canônico (EXPECTED_FIXED_POLICIES).
  admin_scope text := '''admin''\s*::|''super_admin''\s*::';
  role_operacional text := 'financeiro|operacional|manager|operator|visualizador';
  debito_conhecido text[] := ARRAY[
    'overlay_rejeicoes_auditoria.Gestores atualizam auditoria de overlay',
    'overlay_rejeicoes_auditoria.Gestores inserem auditoria de overlay',
    'overlay_rejeicoes_auditoria.Gestores leem auditoria de overlay',
    'overlay_rejeicoes_auditoria.Gestores removem auditoria de overlay',
    'query_telemetry.Managers can view telemetry',
    'query_telemetry.System can insert telemetry',
    'bling_sync_logs.bling_sync_logs_insert',
    'bling_sync_logs.bling_sync_logs_select',
    'saved_filters.saved_filters_shared_read'
  ];
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
            OR (
              (
                p.qual !~* 'empresa_id'
                -- Substring, não match da expressão inteira: só conta como
                -- tautologia se NÃO houver, em outro trecho do mesmo qual, uma
                -- chamada real de escopo — senão uma policy legítima como
                -- "empresa_id IS NOT NULL AND empresa_acessivel(empresa_id)"
                -- seria falso-positivo (achado de 2 bot reviewers no PR #56).
                -- user_empresas entra no escape: `ue.empresa_id = <tab>.empresa_id`
                -- (subquery real de pertencimento) casava a tautologia por texto,
                -- mas é escopo legítimo de tenant.
                OR (p.qual ~* tautologia AND p.qual !~* 'empresa_acessivel|empresa_membro_ativo|user_empresas')
              )
              -- Isenções por desenho (espelham EXPECTED_FIXED_POLICIES /
              -- ALLOWED_LITERAL_TRUE_POLICIES do gate canônico): policy restrita
              -- à linha do próprio usuário (owner), global de admin puro,
              -- literal-true exclusiva de service_role (ignora RLS no Supabase)
              -- e allowlist D1 pré-existente (PR #480). Policy NOVA fora destes
              -- escopos continua falhando o guard.
              AND NOT (
                p.qual ~* owner_scope
                OR (p.qual ~* admin_scope AND p.qual !~* role_operacional)
                OR (p.qual ~* '^\s*true\s*$' AND p.roles = ARRAY['service_role']::name[])
                OR (p.tablename || '.' || p.policyname = ANY (debito_conhecido))
              )
            )
          )
        )
        OR
        -- comandos que aplicam WITH CHECK: aqui sim o Postgres usa USING
        -- como fallback quando WITH CHECK é omitido.
        (
          p.cmd IN ('INSERT', 'UPDATE', 'ALL')
          AND (
            COALESCE(p.with_check, p.qual) IS NULL
            OR (
              (
                COALESCE(p.with_check, p.qual) !~* 'empresa_id'
                OR (
                  COALESCE(p.with_check, p.qual) ~* tautologia
                  AND COALESCE(p.with_check, p.qual) !~* 'empresa_acessivel|empresa_membro_ativo|user_empresas'
                )
              )
              AND NOT (
                COALESCE(p.with_check, p.qual) ~* owner_scope
                OR (COALESCE(p.with_check, p.qual) ~* admin_scope AND COALESCE(p.with_check, p.qual) !~* role_operacional)
                OR (COALESCE(p.with_check, p.qual) ~* '^\s*true\s*$' AND p.roles = ARRAY['service_role']::name[])
                OR (p.tablename || '.' || p.policyname = ANY (debito_conhecido))
              )
            )
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

-- 7) Cobertura de comandos de escrita nas tabelas cujo fluxo de app escreve
--    pelo cliente autenticado.
--
--    Origem do gap: a checagem 3 valida apenas que cada policy remanescente
--    referencia a coluna empresa_id — não valida que os quatro comandos estão
--    cobertos. O endurecimento de RLS de 2026-11-24 removeu as policies
--    permissivas (ALL) e as substituiu por específicas; em
--    elisao_creditos_auditoria sobraram SELECT/INSERT/DELETE e NENHUMA de
--    UPDATE, sem nenhum gate acusar. O sintoma é silencioso: PostgREST
--    devolve `error: null` e zero linhas em UPDATE bloqueado por RLS, então
--    o app exibe sucesso e a decisão não persiste.
--
--    Lista explícita (firebreak): toda tabela cuja escrita por UPDATE vem do
--    cliente precisa de policy de UPDATE **e** não pode ter policy permissiva
--    (ALL) sobrando: policies permissivas são combinadas por OR, então uma ALL
--    anula a específica e o endurecimento vira fachada. Antes desta correção a
--    checagem aceitava `cmd = 'ALL'` como cobertura e passava trivialmente no
--    estado de reapply do zero (achado do Devin Review na PR #546).
DO $$
DECLARE
  requer_update text[] := ARRAY['elisao_creditos_auditoria'];
  t text;
  colunas text[];
  c text;
  offenders text := '';
BEGIN
  FOREACH t IN ARRAY requer_update LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies p
      WHERE p.schemaname = 'public'
        AND p.tablename = t
        AND p.cmd = 'UPDATE'
    ) THEN
      offenders := offenders || format(E'\n  - public.%s: sem policy de UPDATE', t);
    END IF;

    IF EXISTS (
      SELECT 1 FROM pg_policies p
      WHERE p.schemaname = 'public'
        AND p.tablename = t
        AND p.cmd = 'ALL'
        AND p.permissive = 'PERMISSIVE'
    ) THEN
      offenders := offenders || format(
        E'\n  - public.%s: policy permissiva (ALL) sobrepondo o endurecimento', t);
    END IF;

    -- Policy sem privilegio nao escreve nada: o endurecimento revoga UPDATE de
    -- `authenticated` nestas tabelas e o GRANT (por coluna) da migration de
    -- restauro e o que devolve a escrita. Sem esta checagem o gate ficava verde
    -- com o fluxo de aprovacao quebrado (achado do Devin Review na #546).
    -- Coluna a coluna, e nao `has_any_column_privilege`: um GRANT de uma unica
    -- coluna satisfazia o "qualquer" e o gate continuava verde, mas um UPDATE
    -- que nomeia qualquer coluna sem privilegio e rejeitado por inteiro — a
    -- decisao do credito nao persistiria. A lista e exatamente o que
    -- `decidirCredito` (src/hooks/useOportunidadesElisao.ts:288-296) escreve.
    colunas := CASE t
      WHEN 'elisao_creditos_auditoria' THEN
        ARRAY['status_aprovacao', 'motivo_rejeicao', 'aprovador_id', 'data_aprovacao']
      ELSE ARRAY[]::text[]
    END;
    FOREACH c IN ARRAY colunas LOOP
      IF NOT has_column_privilege('authenticated', format('public.%I', t), c, 'UPDATE') THEN
        offenders := offenders || format(
          E'\n  - public.%s: authenticated sem privilegio de UPDATE na coluna %s', t, c);
      END IF;
    END LOOP;
  END LOOP;

  IF offenders <> '' THEN
    RAISE EXCEPTION 'Tabelas escrevíveis por UPDATE sem policy correspondente:%', offenders;
  END IF;
END $$;

-- 7c) Trilha da decisao de credito (firebreak comportamental).
--
--     O gatilho e o unico registro de quem decidiu e quando: `decidirCredito`
--     (src/hooks/useOportunidadesElisao.ts:293-294) envia `user?.id` e
--     `new Date().toISOString()` no payload e pode ser chamado sobre linha ja
--     decidida. Derivar autoria/data do banco e congelar quando o status nao muda
--     e o que impede o cliente de reescrever a trilha.
--
--     Roda o gatilho REAL de producao contra uma tabela temporaria com as mesmas
--     colunas e constraints: valida comportamento sem escrever em linha de
--     negocio (achado do Devin Review na #546).
DO $$
DECLARE
  autor_a uuid := '00000000-0000-4000-8000-0000000000a1';
  autor_b uuid := '00000000-0000-4000-8000-0000000000b2';
  forjado uuid := '00000000-0000-4000-8000-00000000ff44';
  linha record;
  data_primeira timestamptz;
BEGIN
  CREATE TEMP TABLE tmp_decisao_credito (
    LIKE public.elisao_creditos_auditoria INCLUDING DEFAULTS INCLUDING CONSTRAINTS
  );
  CREATE TRIGGER trg_tmp_decisao_credito
    BEFORE UPDATE ON tmp_decisao_credito
    FOR EACH ROW EXECUTE FUNCTION public.registrar_decisao_elisao();
  INSERT INTO tmp_decisao_credito (status_aprovacao, historico_decisoes)
  VALUES ('pendente', '[]'::jsonb);

  -- Primeira decisao: autoria e data vem da sessao, nao do payload.
  PERFORM set_config('request.jwt.claim.sub', autor_a::text, true);
  UPDATE tmp_decisao_credito
     SET status_aprovacao = 'aprovado',
         aprovador_id    = forjado,
         data_aprovacao  = timestamptz '2020-01-01 00:00:00+00';

  SELECT aprovador_id, data_aprovacao, historico_decisoes INTO linha
    FROM tmp_decisao_credito;
  data_primeira := linha.data_aprovacao;

  IF linha.aprovador_id IS DISTINCT FROM autor_a THEN
    RAISE EXCEPTION 'Trilha de decisao: autoria deveria ser a da sessao (%), veio %',
      autor_a, COALESCE(linha.aprovador_id::text, 'NULL');
  END IF;
  IF linha.data_aprovacao IS NULL
     OR linha.data_aprovacao < now() - interval '5 minutes' THEN
    RAISE EXCEPTION 'Trilha de decisao: data deveria ser now(), veio %',
      COALESCE(linha.data_aprovacao::text, 'NULL');
  END IF;
  IF linha.historico_decisoes -> -1 ->> 'usuario_id' IS DISTINCT FROM autor_a::text THEN
    RAISE EXCEPTION 'Historico de decisao sem o autor da sessao: %', linha.historico_decisoes;
  END IF;

  -- Linha ja decidida, outro usuario tentando reescrever: congela.
  PERFORM set_config('request.jwt.claim.sub', autor_b::text, true);
  UPDATE tmp_decisao_credito
     SET aprovador_id   = forjado,
         data_aprovacao = timestamptz '1999-01-01 00:00:00+00';

  SELECT aprovador_id, data_aprovacao INTO linha FROM tmp_decisao_credito;
  IF linha.aprovador_id IS DISTINCT FROM autor_a THEN
    RAISE EXCEPTION 'Trilha de decisao: autoria reescrita na mesma decisao (% no lugar de %)',
      COALESCE(linha.aprovador_id::text, 'NULL'), autor_a;
  END IF;
  IF linha.data_aprovacao IS DISTINCT FROM data_primeira THEN
    RAISE EXCEPTION 'Trilha de decisao: data reescrita na mesma decisao (% no lugar de %)',
      COALESCE(linha.data_aprovacao::text, 'NULL'), data_primeira;
  END IF;

  -- Reabertura para pendente: nao ha decisao para atribuir.
  UPDATE tmp_decisao_credito
     SET status_aprovacao = 'pendente',
         aprovador_id     = forjado,
         data_aprovacao   = now();

  SELECT aprovador_id, data_aprovacao INTO linha FROM tmp_decisao_credito;
  IF linha.aprovador_id IS NOT NULL OR linha.data_aprovacao IS NOT NULL THEN
    RAISE EXCEPTION 'Trilha de decisao: linha reaberta manteve autoria/data (%, %)',
      COALESCE(linha.aprovador_id::text, 'NULL'),
      COALESCE(linha.data_aprovacao::text, 'NULL');
  END IF;

  DROP TABLE tmp_decisao_credito;
END $$;

-- 7b) Informativo (não falha o build): mesma classe de gap no restante do
--     schema — GRANT de escrita para authenticated sem policy do comando.
--     Há legado em prod sem uso de cliente, então isso aparece como WARNING
--     no log em vez de reprovar o gate.
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT g.table_name, g.privilege_type, array_agg(DISTINCT p.cmd) AS cmds
    FROM information_schema.role_table_grants g
    LEFT JOIN pg_policies p
      ON p.schemaname = 'public' AND p.tablename = g.table_name
    WHERE g.table_schema = 'public'
      AND g.grantee = 'authenticated'
      AND g.privilege_type IN ('UPDATE', 'INSERT', 'DELETE')
      AND EXISTS (
        SELECT 1 FROM information_schema.columns c
        WHERE c.table_schema = 'public'
          AND c.table_name = g.table_name
          AND c.column_name = 'empresa_id'
      )
    GROUP BY g.table_name, g.privilege_type
  LOOP
    IF NOT (
      r.privilege_type = ANY (COALESCE(r.cmds, ARRAY[]::text[]))
      OR 'ALL' = ANY (COALESCE(r.cmds, ARRAY[]::text[]))
    ) THEN
      RAISE WARNING 'Gap de RLS: %.% concedido a authenticated sem policy do comando (policies atuais: %)',
        'public', r.table_name, COALESCE(r.cmds::text, 'nenhuma');
    END IF;
  END LOOP;
END $$;

ROLLBACK;

\echo '✅ RLS multi-empresa suite: OK'