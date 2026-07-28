-- ============================================================
-- pgTAP: sobrecargas SQL de conciliação e eventos
-- ------------------------------------------------------------
-- Testes de regressão para as funções sobrecarregadas identificadas
-- na auditoria (docs/AUDITORIA_BACKEND_SENIOR.md), garantindo que
-- cada assinatura permanece resolvível e comporta-se conforme esperado
-- antes de qualquer consolidação futura.
--
-- Como rodar (local, com Supabase CLI + pgTAP instalado):
--   psql "$DATABASE_URL" -f supabase/tests/sql/overloads.test.sql
--
-- Também roda pelo runner oficial:
--   supabase test db
-- ============================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgtap;

SELECT plan(18);

-- ---------------------------------------------------------------------------
-- 1) Após consolidação (2026-07-11), existe apenas 1 versão canônica
--    de confirmar_conciliacao e desfazer_conciliacao.
-- ---------------------------------------------------------------------------
SELECT has_function(
  'public', 'confirmar_conciliacao',
  ARRAY['uuid', 'uuid', 'uuid', 'uuid', 'uuid', 'numeric'],
  'confirmar_conciliacao canônica (6 args) deve existir'
);
SELECT is(
  (SELECT count(*)::int FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname='public' AND p.proname='confirmar_conciliacao'),
  1,
  'existe apenas 1 sobrecarga de confirmar_conciliacao'
);

-- Todas SECURITY DEFINER
SELECT is(
  (SELECT bool_and(p.prosecdef)
   FROM pg_proc p
   JOIN pg_namespace n ON n.oid = p.pronamespace
   WHERE n.nspname = 'public' AND p.proname = 'confirmar_conciliacao'),
  true,
  'confirmar_conciliacao permanece SECURITY DEFINER'
);

-- ---------------------------------------------------------------------------
-- 2) desfazer_conciliacao consolidada em uma única assinatura
-- ---------------------------------------------------------------------------
SELECT has_function(
  'public', 'desfazer_conciliacao', ARRAY['uuid', 'uuid', 'uuid'],
  'desfazer_conciliacao canônica (3 args) deve existir'
);
SELECT is(
  (SELECT count(*)::int FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname='public' AND p.proname='desfazer_conciliacao'),
  1,
  'existe apenas 1 sobrecarga de desfazer_conciliacao'
);


-- ---------------------------------------------------------------------------
-- 3) registrar_evento_receber consolidada (2026-07-28)
--    A sobrecarga legada (uuid, text, jsonb) foi removida: ela não validava
--    sessão nem acesso à empresa e permitia forjar trilha de auditoria.
-- ---------------------------------------------------------------------------
SELECT has_function(
  'public', 'registrar_evento_receber',
  ARRAY['uuid', 'text', 'jsonb', 'text', 'text', 'jsonb'],
  'registrar_evento_receber canônica (6 args) deve existir'
);
SELECT is(
  (SELECT count(*)::int FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname='public' AND p.proname='registrar_evento_receber'),
  1,
  'existe apenas 1 sobrecarga de registrar_evento_receber'
);

-- ---------------------------------------------------------------------------
-- 4) Comportamento — regressão do fluxo básico
--    Usamos SAVEPOINT + ROLLBACK para não sujar dados.
-- ---------------------------------------------------------------------------
SAVEPOINT tests_data;

-- 4a) Sem sessão autenticada, a rotina recusa o registro (blindagem de auditoria)
SELECT throws_ok(
  $$ SELECT public.registrar_evento_receber(
       gen_random_uuid(), 'teste_regressao', '{"src":"pgtap"}'::jsonb
     ) $$,
  NULL,
  'Acesso negado: autenticacao requerida',
  'registrar_evento_receber exige sessão autenticada'
);


-- 4b) desfazer_conciliacao(uuid, uuid, uuid) apaga a linha correspondente
DO $$
DECLARE
  v_id uuid;
  v_count bigint;
BEGIN
  INSERT INTO public.conciliacoes (status)
  VALUES ('pendente')
  RETURNING id INTO v_id;
  PERFORM public.desfazer_conciliacao(v_id, NULL, NULL);
  SELECT count(*) INTO v_count FROM public.conciliacoes WHERE id = v_id;
  PERFORM ok(v_count = 0, 'desfazer_conciliacao canônica remove a linha');
END $$;

-- 4c) confirmar_conciliacao canônica marca como confirmado
DO $$
DECLARE
  v_id uuid;
  v_status text;
  v_user uuid := gen_random_uuid();
BEGIN
  INSERT INTO public.conciliacoes (status) VALUES ('pendente') RETURNING id INTO v_id;
  PERFORM public.confirmar_conciliacao(v_id, v_user, NULL, NULL, NULL, 0);
  SELECT status INTO v_status FROM public.conciliacoes WHERE id = v_id;
  PERFORM ok(v_status = 'confirmado', 'confirmar_conciliacao canônica marca confirmado');
END $$;


ROLLBACK TO SAVEPOINT tests_data;

-- ---------------------------------------------------------------------------
-- 5) has_role continua sendo executável (base do RLS)
-- ---------------------------------------------------------------------------
SELECT has_function(
  'public', 'has_role', ARRAY['uuid', 'app_role'],
  'has_role(uuid, app_role) deve existir'
);
SELECT is(
  public.has_role('00000000-0000-0000-0000-000000000000'::uuid, 'admin'::public.app_role),
  false,
  'has_role retorna false para uuid inexistente'
);

-- ---------------------------------------------------------------------------
-- 6) Índice de investigação IP/Geo em auth_logs existe
-- ---------------------------------------------------------------------------
SELECT has_index(
  'public', 'auth_logs', 'idx_auth_logs_ip_created',
  'índice idx_auth_logs_ip_created deve existir'
);

-- ---------------------------------------------------------------------------
-- 7) Menor privilégio: anon NÃO pode executar funções admin/cleanup
-- ---------------------------------------------------------------------------
SELECT is(
  has_function_privilege('anon', 'public.run_daily_cleanup()', 'EXECUTE'),
  false,
  'anon não pode executar run_daily_cleanup'
);
SELECT is(
  has_function_privilege('anon', 'public.cleanup_expired_tokens()', 'EXECUTE'),
  false,
  'anon não pode executar cleanup_expired_tokens'
);
SELECT is(
  has_function_privilege('anon', 'public.get_cron_jobs()', 'EXECUTE'),
  false,
  'anon não pode executar get_cron_jobs'
);
SELECT is(
  has_function_privilege('anon', 'public.clear_login_attempts(text)', 'EXECUTE'),
  false,
  'anon não pode executar clear_login_attempts'
);

-- Sanity: has_role continua executável (necessário para RLS via SECURITY DEFINER)
SELECT is(
  has_function_privilege('authenticated', 'public.has_role(uuid, public.app_role)', 'EXECUTE'),
  true,
  'authenticated ainda pode executar has_role'
);

SELECT * FROM finish();
ROLLBACK;
