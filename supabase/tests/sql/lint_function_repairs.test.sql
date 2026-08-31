-- ============================================================
-- pgTAP: regressão dos 12 erros reais de `supabase db lint`
-- Migration: 20260831153000_corrigir_12_erros_lint_funcoes.sql
-- ============================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgtap;

SELECT plan(60);

-- ---------------------------------------------------------------------------
-- 1. Assinaturas públicas preservadas.
-- ---------------------------------------------------------------------------
SELECT has_function(
  'public', 'sefaz_process_batch',
  ARRAY['text','text','uuid','bigint','bigint','text','text','jsonb'],
  'sefaz_process_batch preserva a assinatura canônica'
);
SELECT has_function(
  'public', 'claim_frontend_error_alerts',
  ARRAY['integer','integer','integer','integer'],
  'claim_frontend_error_alerts preserva a assinatura canônica'
);
SELECT has_function(
  'public', 'get_catalogos_tributarios_health', ARRAY[]::text[],
  'get_catalogos_tributarios_health preserva a assinatura canônica'
);
SELECT has_function(
  'public', 'increment_failed_attempts', ARRAY['text'],
  'increment_failed_attempts preserva a assinatura canônica'
);
SELECT has_function(
  'public', 'silenciar_alerta_erro_frontend', ARRAY['text','integer','text'],
  'silenciar_alerta_erro_frontend preserva a assinatura canônica'
);
SELECT has_function(
  'public', 'capture_index_usage_snapshot', ARRAY[]::text[],
  'capture_index_usage_snapshot preserva a assinatura canônica'
);
SELECT has_function(
  'public', 'confirmar_conciliacao',
  ARRAY['uuid','uuid','uuid','uuid','uuid','numeric'],
  'confirmar_conciliacao preserva a assinatura canônica'
);
SELECT has_function(
  'public', 'confirmar_conciliacao_manual',
  ARRAY['uuid','uuid','uuid','numeric'],
  'confirmar_conciliacao_manual preserva a assinatura canônica'
);
SELECT has_function(
  'public', 'confirmar_conciliacao_manual',
  ARRAY['uuid','uuid','uuid','uuid','numeric'],
  'confirmar_conciliacao_manual expõe overload interno com p_user_id'
);
SELECT has_function(
  'public', 'desfazer_conciliacao_manual', ARRAY['uuid'],
  'desfazer_conciliacao_manual preserva a assinatura canônica'
);
SELECT has_function(
  'public', 'desfazer_conciliacao_manual', ARRAY['uuid','uuid'],
  'desfazer_conciliacao_manual expõe overload interno com p_user_id'
);
SELECT has_function(
  'public', 'is_country_allowed_for_login', ARRAY['text'],
  'is_country_allowed_for_login preserva a assinatura canônica'
);
SELECT has_function(
  'public', 'is_ip_allowed_for_login', ARRAY['inet'],
  'is_ip_allowed_for_login preserva a assinatura canônica'
);
SELECT has_function(
  'public', 'watch_cron_failures', ARRAY[]::text[],
  'watch_cron_failures() legado continua disponível'
);

-- ---------------------------------------------------------------------------
-- 2. UPSERTs respaldados por índices únicos compatíveis.
-- ---------------------------------------------------------------------------
SELECT ok(
  EXISTS (
    SELECT 1
    FROM pg_index i
    WHERE i.indexrelid = to_regclass('public.uq_frontend_error_alert_state_assinatura')
      AND i.indrelid = 'public.frontend_error_alert_state'::regclass
      AND i.indisunique
      AND i.indpred IS NULL
      AND i.indexprs IS NULL
  ),
  'assinatura possui índice único não parcial'
);

SELECT ok(
  EXISTS (
    SELECT 1
    FROM pg_index i
    WHERE i.indexrelid = to_regclass('public.uq_index_usage_snapshots_snapshot_schema_index')
      AND i.indrelid = 'public.index_usage_snapshots'::regclass
      AND i.indisunique
      AND i.indpred IS NULL
      AND i.indexprs IS NULL
  ),
  'snapshot de índice possui chave natural única não parcial'
);

SELECT is(
  (
    SELECT count(*)::integer
    FROM (
      SELECT assinatura
      FROM public.frontend_error_alert_state
      GROUP BY assinatura
      HAVING count(*) > 1
    ) d
  ),
  0,
  'não existem assinaturas duplicadas'
);

SELECT is(
  (
    SELECT count(*)::integer
    FROM (
      SELECT snapshot_date, schema_name, index_name
      FROM public.index_usage_snapshots
      GROUP BY snapshot_date, schema_name, index_name
      HAVING count(*) > 1
    ) d
  ),
  0,
  'não existem snapshots duplicados pela chave natural'
);

-- ---------------------------------------------------------------------------
-- 3. Definições não reintroduzem os identificadores inválidos.
-- ---------------------------------------------------------------------------
SELECT is(
  pg_get_function_result('public.validar_catalogos_tributarios()'::regprocedure),
  'TABLE(tabela text, registros bigint, status text)',
  'retorno canônico do validador fiscal foi preservado'
);

SELECT ok(
  position(
    '::public.sefaz_ambiente' IN pg_get_functiondef(
      'public.sefaz_process_batch(text,text,uuid,bigint,bigint,text,text,jsonb)'::regprocedure
    )
  ) > 0,
  'SEFAZ usa o enum public.sefaz_ambiente'
);

SELECT is(
  position(
    '::ambiente_sefaz' IN pg_get_functiondef(
      'public.sefaz_process_batch(text,text,uuid,bigint,bigint,text,text,jsonb)'::regprocedure
    )
  ),
  0,
  'SEFAZ não referencia mais o enum inexistente ambiente_sefaz'
);

SELECT ok(
  position(
    'signature, assinatura' IN pg_get_functiondef(
      'public.claim_frontend_error_alerts(integer,integer,integer,integer)'::regprocedure
    )
  ) > 0,
  'claim preenche as duas colunas de compatibilidade da assinatura'
);

SELECT ok(
  position(
    'signature, assinatura' IN pg_get_functiondef(
      'public.silenciar_alerta_erro_frontend(text,integer,text)'::regprocedure
    )
  ) > 0,
  'silenciamento preenche as duas colunas de compatibilidade da assinatura'
);

SELECT is(
  position(
    'is_active' IN pg_get_functiondef(
      'public.is_country_allowed_for_login(text)'::regprocedure
    )
  ),
  0,
  'allowlist de país não referencia is_active inexistente'
);

SELECT ok(
  position(
    'coalesce(ac.ativo, ac.enabled, false)' IN pg_get_functiondef(
      'public.is_country_allowed_for_login(text)'::regprocedure
    )
  ) > 0,
  'allowlist de país usa ativo com fallback legado enabled'
);

SELECT is(
  position(
    'is_active' IN pg_get_functiondef(
      'public.is_ip_allowed_for_login(inet)'::regprocedure
    )
  ),
  0,
  'allowlist de IP não referencia is_active inexistente'
);

SELECT ok(
  position(
    'pg_input_is_valid' IN pg_get_functiondef(
      'public.is_ip_allowed_for_login(inet)'::regprocedure
    )
  ) > 0,
  'allowlist de IP valida o texto antes de convertê-lo para inet'
);

SELECT ok(
  position(
    'c.tabela' IN pg_get_functiondef(
      'public.get_catalogos_tributarios_health()'::regprocedure
    )
  ) > 0,
  'agregador fiscal consome a coluna tabela do retorno canônico'
);

SELECT ok(
  position(
    'c.registros' IN pg_get_functiondef(
      'public.get_catalogos_tributarios_health()'::regprocedure
    )
  ) > 0,
  'agregador fiscal consome a coluna registros do retorno canônico'
);

SELECT ok(
  position(
    'c.status' IN pg_get_functiondef(
      'public.get_catalogos_tributarios_health()'::regprocedure
    )
  ) > 0,
  'agregador fiscal consome a coluna status do retorno canônico'
);

SELECT ok(
  position(
    'coalesce(p_user_id, auth.uid())' IN pg_get_functiondef(
      'public.confirmar_conciliacao_manual(uuid,uuid,uuid,uuid,numeric)'::regprocedure
    )
  ) > 0,
  'overload interno de confirmar usa identidade explícita com fallback controlado'
);

SELECT ok(
  position(
    'coalesce(p_user_id, auth.uid())' IN pg_get_functiondef(
      'public.desfazer_conciliacao_manual(uuid,uuid)'::regprocedure
    )
  ) > 0,
  'overload interno de desfazer usa identidade explícita com fallback controlado'
);

SELECT is(
  position(
    'ON CONFLICT (email)' IN pg_get_functiondef(
      'public.increment_failed_attempts(text)'::regprocedure
    )
  ),
  0,
  'incremento de tentativas não exige UNIQUE(email) inexistente'
);

SELECT ok(
  position(
    'pg_advisory_xact_lock' IN pg_get_functiondef(
      'public.increment_failed_attempts(text)'::regprocedure
    )
  ) > 0,
  'incremento de tentativas serializa concorrência por email'
);

SELECT is(
  position(
    'confirmado_em' IN pg_get_functiondef(
      'public.confirmar_conciliacao(uuid,uuid,uuid,uuid,uuid,numeric)'::regprocedure
    )
  ),
  0,
  'conciliação não referencia confirmado_em ausente'
);

SELECT is(
  position(
    'updated_at' IN pg_get_functiondef(
      'public.confirmar_conciliacao(uuid,uuid,uuid,uuid,uuid,numeric)'::regprocedure
    )
  ),
  0,
  'conciliação não referencia updated_at ausente em conciliacoes'
);

SELECT is(
  position(
    'status=' IN pg_get_functiondef('public.watch_cron_failures()'::regprocedure)
  ),
  0,
  'watcher legado não usa cron_job_logs.status'
);

SELECT ok(
  position(
    'success IS FALSE' IN pg_get_functiondef('public.watch_cron_failures()'::regprocedure)
  ) > 0,
  'watcher legado usa cron_job_logs.success'
);

-- ---------------------------------------------------------------------------
-- 4. Contratos de segurança/ACL observados antes do reparo.
-- ---------------------------------------------------------------------------
WITH funcoes(assinatura) AS (
  VALUES
    ('public.capture_index_usage_snapshot()'),
    ('public.claim_frontend_error_alerts(integer,integer,integer,integer)'),
    ('public.confirmar_conciliacao_manual(uuid,uuid,uuid,numeric)'),
    ('public.confirmar_conciliacao(uuid,uuid,uuid,uuid,uuid,numeric)'),
    ('public.desfazer_conciliacao_manual(uuid)'),
    ('public.get_catalogos_tributarios_health()'),
    ('public.increment_failed_attempts(text)'),
    ('public.is_country_allowed_for_login(text)'),
    ('public.is_ip_allowed_for_login(inet)'),
    ('public.sefaz_process_batch(text,text,uuid,bigint,bigint,text,text,jsonb)'),
    ('public.silenciar_alerta_erro_frontend(text,integer,text)'),
    ('public.watch_cron_failures()')
)
SELECT is(
  (
    SELECT count(*)::integer
    FROM funcoes f
    JOIN pg_proc p ON p.oid = to_regprocedure(f.assinatura)
    WHERE p.prosecdef
  ),
  11,
  'as 11 rotinas originalmente SECURITY DEFINER continuam elevadas'
);

SELECT is(
  (
    SELECT prosecdef
    FROM pg_proc
    WHERE oid = 'public.watch_cron_failures()'::regprocedure
  ),
  false,
  'watch_cron_failures() legado continua SECURITY INVOKER'
);

WITH funcoes(assinatura) AS (
  VALUES
    ('public.capture_index_usage_snapshot()'),
    ('public.claim_frontend_error_alerts(integer,integer,integer,integer)'),
    ('public.confirmar_conciliacao_manual(uuid,uuid,uuid,numeric)'),
    ('public.confirmar_conciliacao(uuid,uuid,uuid,uuid,uuid,numeric)'),
    ('public.desfazer_conciliacao_manual(uuid)'),
    ('public.get_catalogos_tributarios_health()'),
    ('public.increment_failed_attempts(text)'),
    ('public.is_country_allowed_for_login(text)'),
    ('public.is_ip_allowed_for_login(inet)'),
    ('public.sefaz_process_batch(text,text,uuid,bigint,bigint,text,text,jsonb)'),
    ('public.silenciar_alerta_erro_frontend(text,integer,text)'),
    ('public.watch_cron_failures()')
)
SELECT is(
  (
    SELECT count(*)::integer
    FROM funcoes f
    WHERE has_function_privilege('service_role', f.assinatura, 'EXECUTE')
  ),
  12,
  'service_role mantém EXECUTE nas 12 rotinas reparadas'
);

WITH funcoes(assinatura) AS (
  VALUES
    ('public.capture_index_usage_snapshot()'),
    ('public.claim_frontend_error_alerts(integer,integer,integer,integer)'),
    ('public.confirmar_conciliacao_manual(uuid,uuid,uuid,numeric)'),
    ('public.confirmar_conciliacao(uuid,uuid,uuid,uuid,uuid,numeric)'),
    ('public.desfazer_conciliacao_manual(uuid)'),
    ('public.get_catalogos_tributarios_health()'),
    ('public.increment_failed_attempts(text)'),
    ('public.is_country_allowed_for_login(text)'),
    ('public.is_ip_allowed_for_login(inet)'),
    ('public.sefaz_process_batch(text,text,uuid,bigint,bigint,text,text,jsonb)'),
    ('public.silenciar_alerta_erro_frontend(text,integer,text)'),
    ('public.watch_cron_failures()')
)
SELECT is(
  (
    SELECT count(*)::integer
    FROM funcoes f
    WHERE has_function_privilege('anon', f.assinatura, 'EXECUTE')
  ),
  0,
  'anon continua sem EXECUTE nas 12 rotinas'
);

WITH funcoes(assinatura) AS (
  VALUES
    ('public.capture_index_usage_snapshot()'),
    ('public.claim_frontend_error_alerts(integer,integer,integer,integer)'),
    ('public.confirmar_conciliacao_manual(uuid,uuid,uuid,numeric)'),
    ('public.confirmar_conciliacao(uuid,uuid,uuid,uuid,uuid,numeric)'),
    ('public.desfazer_conciliacao_manual(uuid)'),
    ('public.get_catalogos_tributarios_health()'),
    ('public.increment_failed_attempts(text)'),
    ('public.is_country_allowed_for_login(text)'),
    ('public.is_ip_allowed_for_login(inet)'),
    ('public.sefaz_process_batch(text,text,uuid,bigint,bigint,text,text,jsonb)'),
    ('public.silenciar_alerta_erro_frontend(text,integer,text)'),
    ('public.watch_cron_failures()')
)
SELECT is(
  (
    SELECT count(*)::integer
    FROM funcoes f
    WHERE has_function_privilege('authenticated', f.assinatura, 'EXECUTE')
  ),
  4,
  'authenticated mantém exatamente as quatro permissões observadas'
);

SELECT ok(
  has_function_privilege(
    'service_role',
    'public.confirmar_conciliacao_manual(uuid,uuid,uuid,uuid,numeric)',
    'EXECUTE'
  ),
  'service_role possui EXECUTE no overload interno de confirmar'
);

SELECT ok(
  has_function_privilege(
    'service_role',
    'public.desfazer_conciliacao_manual(uuid,uuid)',
    'EXECUTE'
  ),
  'service_role possui EXECUTE no overload interno de desfazer'
);

SELECT ok(
  NOT has_function_privilege(
    'anon',
    'public.confirmar_conciliacao_manual(uuid,uuid,uuid,uuid,numeric)',
    'EXECUTE'
  ),
  'anon segue sem EXECUTE no overload interno de confirmar'
);

SELECT ok(
  NOT has_function_privilege(
    'anon',
    'public.desfazer_conciliacao_manual(uuid,uuid)',
    'EXECUTE'
  ),
  'anon segue sem EXECUTE no overload interno de desfazer'
);

SELECT ok(
  NOT has_function_privilege(
    'authenticated',
    'public.confirmar_conciliacao_manual(uuid,uuid,uuid,uuid,numeric)',
    'EXECUTE'
  ),
  'authenticated segue sem EXECUTE no overload interno de confirmar'
);

SELECT ok(
  NOT has_function_privilege(
    'authenticated',
    'public.desfazer_conciliacao_manual(uuid,uuid)',
    'EXECUTE'
  ),
  'authenticated segue sem EXECUTE no overload interno de desfazer'
);

SELECT is(
  (
    SELECT proconfig
    FROM pg_proc
    WHERE oid = 'public.capture_index_usage_snapshot()'::regprocedure
  ),
  ARRAY['search_path=public, pg_catalog']::text[],
  'search_path do snapshot permanece restrito'
);

SELECT is(
  (
    SELECT proconfig
    FROM pg_proc
    WHERE oid = 'public.claim_frontend_error_alerts(integer,integer,integer,integer)'::regprocedure
  ),
  ARRAY['search_path=public']::text[],
  'search_path do claim permanece restrito'
);

SELECT is(
  (
    SELECT proconfig
    FROM pg_proc
    WHERE oid = 'public.confirmar_conciliacao_manual(uuid,uuid,uuid,numeric)'::regprocedure
  ),
  ARRAY['search_path=public, pg_catalog']::text[],
  'search_path da conciliação manual permanece restrito'
);

-- ---------------------------------------------------------------------------
-- 5. Simulações transacionais de comportamento.
-- ---------------------------------------------------------------------------
DELETE FROM public.allowed_countries WHERE country_code = 'ZZ';
INSERT INTO public.allowed_countries (country_code, country_name, enabled, ativo)
VALUES ('ZZ', 'Teste pgTAP', true, NULL);

SELECT is(
  public.is_country_allowed_for_login('ZZ'),
  true,
  'enabled legado é aceito quando ativo ainda é nulo'
);

UPDATE public.allowed_countries SET ativo = false WHERE country_code = 'ZZ';
SELECT is(
  public.is_country_allowed_for_login('ZZ'),
  false,
  'ativo=false prevalece e bloqueia o país'
);

DELETE FROM public.allowed_ips WHERE ip_address = '203.0.113.254/32';
INSERT INTO public.allowed_ips (ip_address, descricao, ativo)
VALUES ('203.0.113.254/32', 'Teste pgTAP', true);

SELECT is(
  public.is_ip_allowed_for_login('203.0.113.254'::inet),
  true,
  'IP textual com prefixo é comparado corretamente como inet'
);

UPDATE public.allowed_ips SET ativo = false WHERE ip_address = '203.0.113.254/32';
SELECT is(
  public.is_ip_allowed_for_login('203.0.113.254'::inet),
  false,
  'IP inativo é bloqueado'
);

DELETE FROM public.login_attempts WHERE email = '__pgtap_lint_repair@example.invalid';
INSERT INTO public.login_attempts (email, attempt_count, last_attempt_at, success)
VALUES
  ('__pgtap_lint_repair@example.invalid', 2, now() - interval '2 minutes', false),
  ('__pgtap_lint_repair@example.invalid', 5, now() - interval '1 minute', false);

SELECT lives_ok(
  $$SELECT public.increment_failed_attempts('__pgtap_lint_repair@example.invalid')$$,
  'incremento aceita email com linhas legadas duplicadas'
);

SELECT is(
  (
    SELECT count(*)::integer
    FROM public.login_attempts
    WHERE email = '__pgtap_lint_repair@example.invalid'
  ),
  2,
  'incremento preserva as duas linhas históricas, sem DELETE'
);

SELECT is(
  (
    SELECT min(attempt_count)
    FROM public.login_attempts
    WHERE email = '__pgtap_lint_repair@example.invalid'
  ),
  6,
  'todas as duplicatas recebem o próximo contador determinístico'
);

SELECT is(
  (
    SELECT max(attempt_count)
    FROM public.login_attempts
    WHERE email = '__pgtap_lint_repair@example.invalid'
  ),
  6,
  'nenhuma duplicata permanece com contador defasado'
);

SELECT throws_ok(
  $$SELECT public.increment_failed_attempts(NULL::text)$$,
  '22023',
  NULL,
  'email nulo é rejeitado explicitamente'
);

SELECT lives_ok(
  $$SELECT public.watch_cron_failures()$$,
  'watcher legado executa contra cron_job_logs.success'
);

SELECT is(
  (
    SELECT pg_get_function_result(
      'public.claim_frontend_error_alerts(integer,integer,integer,integer)'::regprocedure
    )
  ),
  'TABLE(assinatura text, exemplo_mensagem text, severity text, ocorrencias bigint, usuarios_afetados bigint, urls_distintas bigint, primeira_ocorrencia timestamp with time zone, ultima_ocorrencia timestamp with time zone, is_nova boolean)',
  'retorno tabular do claim não sofreu drift'
);

SELECT is(
  (
    SELECT pg_get_function_result(
      'public.silenciar_alerta_erro_frontend(text,integer,text)'::regprocedure
    )
  ),
  'frontend_error_alert_state',
  'retorno composto do silenciamento não sofreu drift'
);

SELECT is(
  (
    SELECT count(*)::integer
    FROM public.allowed_ips
    WHERE NOT pg_input_is_valid(btrim(ip_address), 'inet')
  ),
  0,
  'todos os IPs atuais continuam conversíveis para inet'
);

SELECT * FROM finish();

ROLLBACK;
