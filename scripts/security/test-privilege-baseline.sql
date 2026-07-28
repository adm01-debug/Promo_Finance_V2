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
  ('public.registrar_evento_receber(p_conta_id uuid, p_evento text, p_detalhes jsonb, p_tipo text, p_mensagem text, p_metadata jsonb)', 'authenticated', 'registrarEvento; valida empresa_acessivel');

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
-- 4) Cofres de credenciais permanecem inacessíveis a anon/authenticated
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  v_cofres text[] := ARRAY[
    'bling_tokens', 'bitrix_oauth_tokens', 'bitrix24_tokens',
    'integration_secrets', 'api_keys', 'empresas_certificados',
    'password_reset_tokens', 'portal_cliente_tokens'
  ];
  v_txt text;
BEGIN
  SELECT string_agg(format('  - public.%s → %s (%s)', t.relname, g.rolname, g.priv), E'\n')
    INTO v_txt
  FROM unnest(v_cofres) AS cofre
  JOIN pg_class t ON t.relname = cofre
  JOIN pg_namespace n ON n.oid = t.relnamespace AND n.nspname = 'public'
  CROSS JOIN LATERAL (
    SELECT r.rolname, p.priv
    FROM (VALUES ('anon'), ('authenticated')) AS r(rolname)
    CROSS JOIN (VALUES ('SELECT'), ('INSERT'), ('UPDATE'), ('DELETE')) AS p(priv)
    WHERE has_table_privilege(r.rolname, t.oid, p.priv)
  ) g;

  IF v_txt IS NOT NULL THEN
    RAISE EXCEPTION E'FAIL: cofre(s) de credenciais com GRANT indevido:\n%', v_txt;
  END IF;
  RAISE NOTICE 'PASS: cofres de credenciais restritos a service_role.';
END $$;

ROLLBACK;
