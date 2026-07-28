-- ============================================================================
-- GATE GLOBAL DE PRIVILÉGIOS — baseline de superfície exposta ao cliente
-- ----------------------------------------------------------------------------
-- Objetivo: impedir que uma migration futura amplie silenciosamente a
-- superfície de ataque do banco. Diferente de
-- `test-observability-privileges.sql` (que valida uma lista fixa de funções
-- que devem estar bloqueadas), este script valida o CONJUNTO COMPLETO:
--
--   1) Toda função SECURITY DEFINER de `public` executável por `anon` ou
--      `authenticated` DEVE constar do allowlist abaixo, com justificativa.
--   2) Toda função do allowlist DEVE continuar existindo (evita allowlist
--      apodrecendo com entradas mortas que mascaram regressões).
--   3) Toda tabela de `public` DEVE ter RLS habilitado.
--   4) Nenhuma tabela de tokens/segredos pode ter GRANT para anon/authenticated.
--
-- Roda via: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f scripts/security/test-privilege-baseline.sql
-- Sai com erro (RAISE EXCEPTION) em qualquer violação — falha o CI.
-- ============================================================================
\set ON_ERROR_STOP on
\pset border 2

BEGIN;

-- ----------------------------------------------------------------------------
-- ALLOWLIST: funções SECURITY DEFINER legitimamente chamáveis pelo cliente.
-- Regra de ouro: só entra aqui quem (a) é realmente chamado via .rpc() pelo
-- frontend ou é predicado usado dentro de política RLS, e (b) possui checagem
-- interna de autorização (has_role / empresa_acessivel / auth.uid()).
-- ----------------------------------------------------------------------------
CREATE TEMP TABLE _allow(fn text, role_name text, motivo text) ON COMMIT DROP;

-- (a) Predicados usados DENTRO de políticas RLS.
--     Expressões de policy executam com o papel do chamador, portanto revogar
--     EXECUTE aqui quebraria toda a RLS do sistema.
INSERT INTO _allow VALUES
  ('public.has_role(_user_id uuid, _role app_role)',              'authenticated', 'predicado de RLS em ~429 políticas'),
  ('public.empresa_acessivel(_empresa_id uuid)',                  'authenticated', 'predicado de RLS multi-empresa'),
  ('public.is_org_membro(_org_id uuid, _user_id uuid)',           'authenticated', 'predicado de RLS de organizações'),
  ('public.is_org_responsavel(_org_id uuid, _user_id uuid)',      'authenticated', 'predicado de RLS de organizações');

-- (b) Painéis administrativos — todas exigem papel `admin` no corpo.
INSERT INTO _allow VALUES
  ('public.get_table_bloat()',                                                                              'authenticated', 'AdminBloatMonitor; exige admin'),
  ('public.get_bloat_history(p_days integer)',                                                              'authenticated', 'AdminBloatMonitor; exige admin'),
  ('public.get_retention_history(p_days integer)',                                                          'authenticated', 'RetentionHistoryPanel; exige admin'),
  ('public.get_integrity_alerts(p_limit integer, p_incluir_resolvidos boolean)',                            'authenticated', 'IntegrityAlertsPanel; exige admin'),
  ('public.resolve_integrity_alert(p_alert_id uuid)',                                                       'authenticated', 'IntegrityAlertsPanel; exige admin'),
  ('public.get_performance_alerts(p_days integer, p_severity text, p_source text, p_incluir_resolvidos boolean)', 'authenticated', 'PerformanceAlertsPanel; exige admin'),
  ('public.get_performance_alerts_weekly(p_weeks integer)',                                                 'authenticated', 'weekly-trend; exige admin'),
  ('public.get_catalogos_tributarios_health()',                                                             'authenticated', 'FiscalHealthBadge; exige admin'),
  ('public.get_catalogos_tributarios_history(_dias integer)',                                               'authenticated', 'CatalogosTributariosHistoryPanel; exige admin'),
  ('public.get_cobertura_fiscal_uf()',                                                                      'authenticated', 'CoberturaFiscalUFPanel; exige admin'),
  ('public.get_ultima_carga_fiscal()',                                                                      'authenticated', 'CoberturaFiscalUFPanel; exige admin'),
  ('public.get_cron_jobs()',                                                                                'authenticated', 'AutomacoesTab; exige admin'),
  ('public.get_cron_run_history(p_job_name text, p_limit integer)',                                         'authenticated', 'CronJobsStatus; exige admin'),
  ('public.toggle_cron_job(job_id bigint, is_active boolean)',                                              'authenticated', 'CronJobsPanel; exige admin'),
  ('public.delete_cron_job(job_id bigint)',                                                                 'authenticated', 'CronJobsPanel; exige admin');

-- (c) Fluxos de usuário final — escopo restrito ao próprio usuário/empresa.
INSERT INTO _allow VALUES
  ('public.get_user_roles(user_id uuid)',                          'authenticated', 'useStartupDiagnostic; bloqueia consulta a terceiros'),
  ('public.get_user_permissions(user_id uuid)',                    'authenticated', 'useStartupDiagnostic; bloqueia consulta a terceiros'),
  ('public.get_retencoes_pendentes_count(p_empresa_id uuid)',      'authenticated', 'useAlertasTributarios; valida empresa_acessivel'),
  ('public.registrar_auditoria_config(_tipo_acao text, _empresa_id uuid, _detalhes jsonb)', 'authenticated', 'useUserEmpresas; valida empresa_acessivel'),
  ('public.registrar_evento_pagar(p_conta_id uuid, p_tipo text, p_mensagem text, p_metadata jsonb)', 'authenticated', 'registrarEvento; valida empresa_acessivel'),
  ('public.registrar_evento_receber(p_conta_id uuid, p_evento text, p_detalhes jsonb, p_tipo text, p_mensagem text, p_metadata jsonb)', 'authenticated', 'registrarEvento; valida empresa_acessivel'),
  ('public.get_frontend_error_groups(p_desde timestamp with time zone, p_severity text, p_limit integer)', 'authenticated', 'AdminErrosFrontend; exige has_role admin no corpo'),
  ('public.get_frontend_error_occurrences(p_assinatura text, p_desde timestamp with time zone, p_limit integer)', 'authenticated', 'AdminErrosFrontend; exige has_role admin no corpo'),
  ('public.silenciar_alerta_erro_frontend(p_assinatura text, p_horas integer, p_motivo text)', 'authenticated', 'AlertasProativosErros; exige has_role admin e audita em audit_logs'),
  ('public.get_silenciamentos_expirando(p_horas integer)', 'authenticated', 'SilenciamentosExpirando (Gap #28); exige has_role admin, somente leitura, clamp de 720h'),
  ('public.empresa_membro_ativo(_empresa_id uuid)', 'authenticated', 'Predicado de RLS de public.clientes (Gap #29); só responde sobre o vínculo do PRÓPRIO auth.uid(), não vaza nada de terceiros');



-- (d) Pré-autenticação — descoberta de SSO por domínio na tela de login.
--     Retorna apenas metadados públicos do provedor (nome, tipo, domínios).
INSERT INTO _allow VALUES
  ('public.resolve_sso_providers_for_domain(p_domain text)',       'anon',          'SsoLoginButtons pré-login; metadados não sensíveis'),
  ('public.resolve_sso_providers_for_domain(p_domain text)',       'authenticated', 'SsoLoginButtons pré-login; metadados não sensíveis');

-- ----------------------------------------------------------------------------
-- Estado real do banco
-- ----------------------------------------------------------------------------
CREATE TEMP TABLE _atual AS
SELECT 'public.' || p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')' AS fn,
       r.rolname AS role_name
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
CROSS JOIN (VALUES ('anon'), ('authenticated')) AS r(rolname)
WHERE n.nspname = 'public'
  AND p.prosecdef
  AND has_function_privilege(r.rolname, p.oid, 'EXECUTE');

-- ----------------------------------------------------------------------------
-- 1) Nenhuma função exposta fora do allowlist
-- ----------------------------------------------------------------------------
DO $$
DECLARE v_txt text;
BEGIN
  SELECT string_agg(format('  - %s → %s', a.fn, a.role_name), E'\n' ORDER BY a.fn)
    INTO v_txt
  FROM _atual a
  WHERE NOT EXISTS (
    SELECT 1 FROM _allow w WHERE w.fn = a.fn AND w.role_name = a.role_name
  );

  IF v_txt IS NOT NULL THEN
    RAISE EXCEPTION E'FAIL: função(ões) SECURITY DEFINER expostas sem allowlist:\n%\n\nRevogue o EXECUTE ou adicione ao allowlist com justificativa em scripts/security/test-privilege-baseline.sql', v_txt;
  END IF;
  RAISE NOTICE 'PASS: nenhuma função SECURITY DEFINER exposta fora do allowlist.';
END $$;

-- ----------------------------------------------------------------------------
-- 2) Allowlist sem entradas mortas (função removida ou EXECUTE já revogado)
-- ----------------------------------------------------------------------------
DO $$
DECLARE v_txt text;
BEGIN
  SELECT string_agg(format('  - %s → %s (%s)', w.fn, w.role_name, w.motivo), E'\n' ORDER BY w.fn)
    INTO v_txt
  FROM _allow w
  WHERE NOT EXISTS (
    SELECT 1 FROM _atual a WHERE a.fn = w.fn AND a.role_name = w.role_name
  );

  IF v_txt IS NOT NULL THEN
    RAISE EXCEPTION E'FAIL: allowlist com entradas obsoletas (remova-as):\n%', v_txt;
  END IF;
  RAISE NOTICE 'PASS: allowlist sincronizado com o estado real do banco.';
END $$;

-- ----------------------------------------------------------------------------
-- 3) RLS habilitado em 100% das tabelas de public
-- ----------------------------------------------------------------------------
DO $$
DECLARE v_txt text;
BEGIN
  SELECT string_agg('  - public.' || c.relname, E'\n' ORDER BY c.relname)
    INTO v_txt
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relkind IN ('r', 'p')
    AND NOT c.relrowsecurity;

  IF v_txt IS NOT NULL THEN
    RAISE EXCEPTION E'FAIL: tabela(s) de public sem RLS habilitado:\n%', v_txt;
  END IF;
  RAISE NOTICE 'PASS: RLS habilitado em todas as tabelas de public.';
END $$;

-- ----------------------------------------------------------------------------
-- 4) Cofres de credenciais — matriz de privilégios brutos
--    (a) NENHUM cofre pode conceder qualquer privilégio a `anon`.
--    (b) Cofres exclusivos de servidor não podem conceder nada a
--        `authenticated` — o acesso é apenas via service_role.
--    (c) Cofres administrados pela UI só podem conceder a `authenticated` os
--        privilégios que possuem política RLS correspondente.
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  v_txt text;
BEGIN
  CREATE TEMP TABLE _cofres(tabela text, role_name text, privs text[]) ON COMMIT DROP;

  -- (b) somente service_role
  INSERT INTO _cofres VALUES
    ('bling_tokens',         'authenticated', ARRAY[]::text[]),
    ('bitrix_oauth_tokens',  'authenticated', ARRAY[]::text[]),
    ('integration_secrets',  'authenticated', ARRAY[]::text[]);

  -- Cofre de sessões da integração Lalamove (cookies/tokens da UAPI):
  -- leitura apenas para admins autenticados; escrita só via service_role.
  INSERT INTO _cofres VALUES
    ('lalamove_uapi_sessions', 'authenticated', ARRAY['SELECT']);

  -- (c) administrados pela UI (RLS exige papel admin / empresa acessível)
  INSERT INTO _cofres VALUES
    ('bitrix24_tokens',        'authenticated', ARRAY['SELECT','INSERT','UPDATE','DELETE']),
    ('api_keys',               'authenticated', ARRAY['SELECT','DELETE']),
    ('empresas_certificados',  'authenticated', ARRAY['SELECT','INSERT','UPDATE','DELETE']),
    ('password_reset_tokens',  'authenticated', ARRAY['SELECT','INSERT','DELETE']),
    ('portal_cliente_tokens',  'authenticated', ARRAY['SELECT','INSERT','UPDATE','DELETE']);

  -- (a) anon nunca pode ter nada
  INSERT INTO _cofres
  SELECT DISTINCT tabela, 'anon', ARRAY[]::text[] FROM _cofres;

  SELECT string_agg(format('  - public.%s → %s pode %s (não permitido)', c.tabela, c.role_name, p.priv), E'\n')
    INTO v_txt
  FROM _cofres c
  JOIN pg_class t ON t.relname = c.tabela
  JOIN pg_namespace n ON n.oid = t.relnamespace AND n.nspname = 'public'
  CROSS JOIN (VALUES ('SELECT'), ('INSERT'), ('UPDATE'), ('DELETE')) AS p(priv)
  WHERE has_table_privilege(c.role_name, t.oid, p.priv)
    AND NOT (p.priv = ANY (c.privs));

  IF v_txt IS NOT NULL THEN
    RAISE EXCEPTION E'FAIL: cofre(s) de credenciais com GRANT indevido:\n%', v_txt;
  END IF;
  RAISE NOTICE 'PASS: cofres de credenciais dentro da matriz de menor privilégio.';
END $$;

-- ---------------------------------------------------------------------------
-- 5) Nenhuma política de ESCRITA incondicional alcançável por anônimos
-- ---------------------------------------------------------------------------
-- Uma política `FOR INSERT/UPDATE/ALL TO public WITH CHECK (true)` é escrita
-- aberta à internet: `public` engloba `anon`, e a chave publicável está no
-- bundle do frontend. Foi exatamente assim que a trilha de auditoria ficou
-- forjável. Toda política que alcance `anon` precisa de um predicado que
-- amarre a linha a uma identidade (auth.uid()) ou a um papel (has_role).
DO $$
DECLARE v_txt text;
BEGIN
  SELECT string_agg(format('  %s.%s [%s] WITH CHECK (%s)',
                           tablename, policyname, cmd, with_check), E'\n' ORDER BY tablename)
    INTO v_txt
  FROM pg_policies
  WHERE schemaname = 'public'
    AND cmd IN ('INSERT', 'UPDATE', 'ALL')
    AND ('anon' = ANY(roles) OR 'public' = ANY(roles))
    AND btrim(coalesce(with_check, qual, 'true')) IN ('true', '(true)')
    -- O papel só é de fato alcançável se o GRANT bruto existir.
    AND has_table_privilege('anon', format('public.%I', tablename)::regclass,
                            CASE cmd WHEN 'UPDATE' THEN 'UPDATE' ELSE 'INSERT' END);

  IF v_txt IS NOT NULL THEN
    RAISE EXCEPTION E'FAIL: escrita incondicional exposta a anônimos:\n%', v_txt;
  END IF;
  RAISE NOTICE 'PASS: nenhuma política de escrita aberta a anônimos.';
END $$;

-- ---------------------------------------------------------------------------
-- 6) Toda view exposta ao cliente precisa ser SECURITY INVOKER
-- ---------------------------------------------------------------------------
-- Uma view sem `security_invoker = true` executa com os privilégios do dono
-- (postgres) e, portanto, IGNORA a RLS das tabelas-base: o cliente enxerga
-- todas as linhas de todas as empresas. Views agregadoras de painel são o
-- vetor clássico desse vazamento.
DO $$
DECLARE v_txt text;
BEGIN
  SELECT string_agg('  public.' || c.relname, E'\n' ORDER BY c.relname)
    INTO v_txt
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relkind = 'v'
    AND (has_table_privilege('anon', c.oid, 'SELECT')
      OR has_table_privilege('authenticated', c.oid, 'SELECT'))
    AND coalesce(
          (SELECT option_value FROM pg_options_to_table(c.reloptions)
            WHERE option_name = 'security_invoker'), 'off'
        ) NOT IN ('true', 'on');

  IF v_txt IS NOT NULL THEN
    RAISE EXCEPTION E'FAIL: view(s) exposta(s) ao cliente sem security_invoker (RLS ignorada):\n%', v_txt;
  END IF;
  RAISE NOTICE 'PASS: todas as views expostas rodam com security_invoker.';
END $$;

-- ---------------------------------------------------------------------------
-- 7) Materialized views nunca podem ser expostas via Data API
-- ---------------------------------------------------------------------------
-- Matviews não suportam RLS nem security_invoker: um GRANT SELECT para
-- anon/authenticated entrega o conteúdo inteiro, sem filtro de empresa.
DO $$
DECLARE v_txt text;
BEGIN
  SELECT string_agg('  public.' || c.relname, E'\n' ORDER BY c.relname)
    INTO v_txt
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relkind = 'm'
    AND (has_table_privilege('anon', c.oid, 'SELECT')
      OR has_table_privilege('authenticated', c.oid, 'SELECT'));

  IF v_txt IS NOT NULL THEN
    RAISE EXCEPTION E'FAIL: materialized view(s) legíveis pelo cliente (sem RLS possível):\n%', v_txt;
  END IF;
  RAISE NOTICE 'PASS: nenhuma materialized view exposta ao cliente.';
END $$;

-- ---------------------------------------------------------------------------
-- 8) Trilha de auditoria é append-only e auto-atribuída
-- ---------------------------------------------------------------------------
DO $$
DECLARE v_bad text;
BEGIN
  IF has_table_privilege('anon', 'public.audit_logs', 'INSERT')
     OR has_table_privilege('authenticated', 'public.audit_logs', 'UPDATE')
     OR has_table_privilege('authenticated', 'public.audit_logs', 'DELETE') THEN
    RAISE EXCEPTION 'FAIL: audit_logs deixou de ser append-only/anon-proof.';
  END IF;

  SELECT string_agg('  ' || policyname, E'\n')
    INTO v_bad
  FROM pg_policies
  WHERE schemaname = 'public' AND tablename = 'audit_logs' AND cmd = 'INSERT'
    AND with_check NOT LIKE '%auth.uid()%';

  IF v_bad IS NOT NULL THEN
    RAISE EXCEPTION E'FAIL: política de INSERT em audit_logs sem amarração de autoria:\n%', v_bad;
  END IF;
  RAISE NOTICE 'PASS: trilha de auditoria append-only e com autoria verificada.';
END $$;

-- ---------------------------------------------------------------------------
-- 9) Políticas baseadas em has_role não são avaliadas pelo papel anônimo
--    (anon sem EXECUTE em has_role => erro 42501 em vez de resultado vazio)
-- ---------------------------------------------------------------------------
DO $$
DECLARE v_bad text;
BEGIN
  SELECT string_agg(format('  %s.%s', tablename, policyname), E'\n')
    INTO v_bad
  FROM pg_policies
  WHERE schemaname = 'public'
    AND roles::text = '{public}'
    AND (coalesce(qual, '') || coalesce(with_check, '')) LIKE '%has_role%';

  IF v_bad IS NOT NULL THEN
    RAISE EXCEPTION E'FAIL: política(s) TO public usando has_role (vazam erro para anon):\n%', v_bad;
  END IF;
  RAISE NOTICE 'PASS: políticas com has_role escopadas para authenticated.';
END $$;

-- ---------------------------------------------------------------------------
-- 10) Telemetria de erros: cliente não controla id nem carimbo de partição
-- ---------------------------------------------------------------------------
DO $$
DECLARE r text;
BEGIN
  FOREACH r IN ARRAY ARRAY['anon', 'authenticated'] LOOP
    IF has_column_privilege(r, 'public.frontend_error_logs', 'created_at', 'INSERT')
       OR has_column_privilege(r, 'public.frontend_error_logs', 'id', 'INSERT') THEN
      RAISE EXCEPTION 'FAIL: % pode definir id/created_at em frontend_error_logs (sequestro de partição).', r;
    END IF;
    IF NOT has_column_privilege(r, 'public.frontend_error_logs', 'error_message', 'INSERT') THEN
      RAISE EXCEPTION 'FAIL: % perdeu INSERT em error_message; telemetria ficaria cega.', r;
    END IF;
    IF has_table_privilege(r, 'public.frontend_error_logs', 'UPDATE')
       OR has_table_privilege(r, 'public.frontend_error_logs', 'DELETE') THEN
      RAISE EXCEPTION 'FAIL: % pode alterar/remover logs de erro (trilha não é append-only).', r;
    END IF;
  END LOOP;
  RAISE NOTICE 'PASS: telemetria de erros append-only e com carimbo do servidor.';
END $$;

-- ---------------------------------------------------------------------------
-- 11) Alerta proativo de erros: estado e claim restritos ao backend
-- ---------------------------------------------------------------------------
DO $$
DECLARE r text;
BEGIN
  FOREACH r IN ARRAY ARRAY['anon', 'authenticated'] LOOP
    IF has_table_privilege(r, 'public.frontend_error_alert_state', 'INSERT')
       OR has_table_privilege(r, 'public.frontend_error_alert_state', 'UPDATE')
       OR has_table_privilege(r, 'public.frontend_error_alert_state', 'DELETE') THEN
      RAISE EXCEPTION 'FAIL: % pode gravar em frontend_error_alert_state (burlaria cooldown de alertas).', r;
    END IF;
    IF has_function_privilege(
         r,
         'public.claim_frontend_error_alerts(integer,integer,integer,integer)',
         'EXECUTE') THEN
      RAISE EXCEPTION 'FAIL: % pode executar claim_frontend_error_alerts (dispararia alertas).', r;
    END IF;
  END LOOP;

  IF NOT has_function_privilege(
       'service_role',
       'public.claim_frontend_error_alerts(integer,integer,integer,integer)',
       'EXECUTE') THEN
    RAISE EXCEPTION 'FAIL: service_role perdeu EXECUTE em claim_frontend_error_alerts; monitor ficaria cego.';
  END IF;

  RAISE NOTICE 'PASS: alerta proativo de erros restrito ao backend.';
END $$;

-- ----------------------------------------------------------------------------
-- 12) Canário do probe HTTP anônimo (Gap #25)
--     O gate scripts/security/test-anon-surface.ts insere uma linha marcada em
--     frontend_error_logs a cada execução de CI. O gatilho de sanitização deve
--     descartá-la, senão o painel administrativo e o alerta proativo (Gap #24)
--     seriam poluídos por ruído de pipeline.
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  v_antes bigint;
  v_depois bigint;
BEGIN
  SELECT count(*) INTO v_antes FROM public.frontend_error_logs;

  INSERT INTO public.frontend_error_logs (error_message, severity, url)
  VALUES ('[ci-anon-surface-probe] canário de regressão', 'warning', 'https://ci.local/anon-surface-probe');

  SELECT count(*) INTO v_depois FROM public.frontend_error_logs;

  IF v_depois <> v_antes THEN
    RAISE EXCEPTION 'FAIL: canário do probe anônimo foi persistido (% linha(s)); o gatilho de sanitização regrediu.', v_depois - v_antes;
  END IF;

  RAISE NOTICE 'PASS: canário do probe anônimo é descartado pelo gatilho de sanitização.';
END $$;

-- ----------------------------------------------------------------------------
-- 13) Silenciamento de alertas de erro é auditado e restrito (Gap #26)
--     A tabela de estado não pode aceitar escrita direta do cliente e a RPC
--     silenciar_alerta_erro_frontend jamais pode ser executável por anon.
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  v_grants text;
BEGIN
  IF has_function_privilege('anon', 'public.silenciar_alerta_erro_frontend(text, integer, text)', 'EXECUTE') THEN
    RAISE EXCEPTION 'FAIL: anon pode executar silenciar_alerta_erro_frontend.';
  END IF;

  IF NOT has_function_privilege('authenticated', 'public.silenciar_alerta_erro_frontend(text, integer, text)', 'EXECUTE') THEN
    RAISE EXCEPTION 'FAIL: authenticated perdeu EXECUTE em silenciar_alerta_erro_frontend (UI admin quebraria).';
  END IF;

  SELECT string_agg(DISTINCT privilege_type, ',') INTO v_grants
  FROM information_schema.role_table_grants
  WHERE table_schema = 'public'
    AND table_name = 'frontend_error_alert_state'
    AND grantee IN ('anon', 'authenticated')
    AND privilege_type IN ('INSERT', 'UPDATE', 'DELETE', 'TRUNCATE');

  IF v_grants IS NOT NULL THEN
    RAISE EXCEPTION 'FAIL: escrita direta em frontend_error_alert_state concedida ao cliente (%).', v_grants;
  END IF;

  RAISE NOTICE 'PASS: silenciamento de alertas só via RPC admin auditada.';
END $$;

-- ----------------------------------------------------------------------------
-- 14) Nenhuma política pode ser criada `TO public` (Gap #27)
--     `TO public` inclui a identidade `anon`. Quando o predicado depende de
--     auth.uid() ou de funções sem EXECUTE para anon, o visitante recebe
--     401/42501 em vez de resultado vazio — a regressão do Gap #23.
--     Exceção única e explícita: telemetria de erro do frontend, que declara
--     `TO anon, authenticated` (nunca `public`).
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  v_lista text;
BEGIN
  SELECT string_agg(format('%s.%s', tablename, policyname), ', ' ORDER BY tablename)
    INTO v_lista
  FROM pg_policies
  WHERE schemaname = 'public' AND roles::text = '{public}';

  IF v_lista IS NOT NULL THEN
    RAISE EXCEPTION 'FAIL: políticas com TO public (avaliadas para anon): %', v_lista;
  END IF;

  RAISE NOTICE 'PASS: nenhuma política TO public — superfície anônima é explícita.';
END $$;

-- ----------------------------------------------------------------------------
-- 15) Toda política de tabela multi-inquilino precisa de predicado de escopo
--     (Gap #27). Um predicado `true`/ausente em tabela com empresa_id/user_id
--     significa que qualquer usuário logado enxerga dados de outros inquilinos.
--     Observação: em políticas FOR ALL/UPDATE sem WITH CHECK, o Postgres reusa
--     o USING — por isso o teste aceita `qual` OU `with_check` escopados.
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  v_lista text;
BEGIN
  SELECT string_agg(DISTINCT format('%s.%s (%s)', p.tablename, p.policyname, p.cmd), ', ')
    INTO v_lista
  FROM pg_policies p
  WHERE p.schemaname = 'public'
    AND p.permissive = 'PERMISSIVE'
    AND p.roles::text ~ 'authenticated|public'
    AND EXISTS (
      SELECT 1 FROM information_schema.columns c
      WHERE c.table_schema = 'public'
        AND c.table_name = p.tablename
        AND c.column_name IN ('empresa_id', 'user_id')
    )
    AND coalesce(p.qual, '') !~ 'auth\.uid|has_role|empresa_acessivel|is_org|has_permission'
    AND coalesce(p.with_check, '') !~ 'auth\.uid|has_role|empresa_acessivel|is_org|has_permission';

  IF v_lista IS NOT NULL THEN
    RAISE EXCEPTION 'FAIL: políticas sem predicado de inquilino em tabelas multi-empresa: %', v_lista;
  END IF;

  RAISE NOTICE 'PASS: toda política multi-inquilino filtra por dono/empresa/papel.';
END $$;


-- ----------------------------------------------------------------------------
-- 16) RPCs exclusivas do agendador não podem virar superfície de usuário
--     (Gap #28). Funções de "claim" gravam estado (trilha de digest, cooldown
--     de alerta) e devolvem dados operacionais de todo o sistema: se um
--     usuário logado puder chamá-las, ele consome a janela de idempotência e
--     suprime a notificação real dos administradores.
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  v_lista text;
BEGIN
  SELECT string_agg(p.proname, ', ' ORDER BY p.proname)
    INTO v_lista
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.proname IN ('claim_silenciamentos_digest', 'claim_frontend_error_alerts')
    AND (
      has_function_privilege('anon', p.oid, 'EXECUTE')
      OR has_function_privilege('authenticated', p.oid, 'EXECUTE')
    );

  IF v_lista IS NOT NULL THEN
    RAISE EXCEPTION 'FAIL: RPCs de agendador executáveis por anon/authenticated: %', v_lista;
  END IF;

  RAISE NOTICE 'PASS: RPCs de agendador restritas a service_role.';
END $$;

-- ----------------------------------------------------------------------------
-- 17) Trilhas de notificação são somente-leitura para o cliente (Gap #28).
--     A trilha do digest é a trava de idempotência: se o cliente puder
--     inserir/apagar linhas, ele forja "digest já enviado" e cala o resumo
--     semanal — ou o dispara em loop.
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  v_lista text;
BEGIN
  SELECT string_agg(format('%s:%s', c.relname, pr.privilege_type), ', ')
    INTO v_lista
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  CROSS JOIN LATERAL (VALUES ('INSERT'), ('UPDATE'), ('DELETE')) AS pr(privilege_type)
  WHERE n.nspname = 'public'
    AND c.relname IN ('frontend_error_silence_digest_log', 'frontend_error_alert_state')
    AND (
      has_table_privilege('anon', c.oid, pr.privilege_type)
      OR has_table_privilege('authenticated', c.oid, pr.privilege_type)
    );

  IF v_lista IS NOT NULL THEN
    RAISE EXCEPTION 'FAIL: trilhas de notificação graváveis pelo cliente: %', v_lista;
  END IF;

  RAISE NOTICE 'PASS: trilhas de notificação são somente-leitura para o cliente.';
END $$;

-- ----------------------------------------------------------------------------
-- 18) Escrita não pode escapar do inquilino (Gap #29).
--     Encontrado em produção: `clientes_grupo_update` tinha
--     USING (empresa_id IS NOT NULL AND ...) mas WITH CHECK (empresa_id IS NULL
--     OR ...). O usuário lia a linha, gravava empresa_id = NULL e ela sumia de
--     todas as políticas — perda de dado silenciosa e irreversível pela UI.
--     Gate detalhado (com probe de runtime) em test-write-isolation.sql; aqui
--     fica a trava estática, barata, que roda em toda execução da baseline.
-- ----------------------------------------------------------------------------
DO $$
DECLARE v_txt text;
BEGIN
  SELECT string_agg(format('%s.%s (%s)', p.tablename, p.policyname, p.cmd), ', ')
    INTO v_txt
  FROM pg_policies p
  WHERE p.schemaname = 'public'
    AND p.cmd IN ('INSERT', 'UPDATE', 'ALL')
    AND ('authenticated' = ANY(p.roles) OR 'public' = ANY(p.roles))
    AND p.with_check IS NOT NULL
    AND (
      -- WITH CHECK aceita órfã enquanto o USING exige vínculo
      (p.qual IS NOT NULL
        AND p.qual ~ '\mempresa_id IS NOT NULL\M'
        AND p.with_check ~ '\mempresa_id IS NULL\M')
      -- ou WITH CHECK trivial em tabela multi-inquilino
      OR (btrim(p.with_check) IN ('true', '(true)')
        AND EXISTS (
          SELECT 1 FROM information_schema.columns col
          WHERE col.table_schema = 'public'
            AND col.table_name = p.tablename
            AND col.column_name = 'empresa_id'))
    );

  IF v_txt IS NOT NULL THEN
    RAISE EXCEPTION 'FAIL: política(s) de escrita permitem escapar do inquilino: %', v_txt;
  END IF;

  RAISE NOTICE 'PASS: nenhuma política de escrita permite orfanar ou realocar linha entre inquilinos.';
END $$;

ROLLBACK;
