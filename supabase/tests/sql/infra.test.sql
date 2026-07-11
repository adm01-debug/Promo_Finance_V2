-- ============================================================
-- pgTAP: infraestrutura pós-auditoria sênior (2026-07-11)
-- ------------------------------------------------------------
-- Testes de regressão para:
--   * Particionamento mensal (audit_logs, frontend_error_logs)
--   * FORCE ROW LEVEL SECURITY em tabelas sensíveis
--   * Webhook DLQ (enqueue_webhook_retry, reprocess_dlq)
--   * Retenção (cleanup_log_tables)
--   * Observabilidade (capture_slow_queries)
--
-- Como rodar:
--   psql "$DATABASE_URL" -f supabase/tests/sql/infra.test.sql
--   supabase test db
-- ============================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgtap;

SELECT plan(24);

-- ---------------------------------------------------------------------------
-- 1) Particionamento — audit_logs deve ser tabela particionada
-- ---------------------------------------------------------------------------
SELECT is(
  (SELECT c.relkind::text FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
   WHERE n.nspname='public' AND c.relname='audit_logs'),
  'p',
  'audit_logs deve ser tabela particionada (relkind=p)'
);

SELECT is(
  (SELECT c.relkind::text FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
   WHERE n.nspname='public' AND c.relname='frontend_error_logs'),
  'p',
  'frontend_error_logs deve ser tabela particionada (relkind=p)'
);

-- ---------------------------------------------------------------------------
-- 2) Particionamento — deve haver >= 9 partições mensais + default
-- ---------------------------------------------------------------------------
SELECT cmp_ok(
  (SELECT count(*)::int FROM pg_inherits i
    JOIN pg_class parent ON parent.oid = i.inhparent
   WHERE parent.relname='audit_logs'),
  '>=', 10,
  'audit_logs deve ter >= 10 partições (6 back + atual + 3 forward + default)'
);

SELECT cmp_ok(
  (SELECT count(*)::int FROM pg_inherits i
    JOIN pg_class parent ON parent.oid = i.inhparent
   WHERE parent.relname='frontend_error_logs'),
  '>=', 10,
  'frontend_error_logs deve ter >= 10 partições'
);

-- ---------------------------------------------------------------------------
-- 3) Partição default deve existir
-- ---------------------------------------------------------------------------
SELECT has_table(
  'public', 'audit_logs_default',
  'audit_logs_default (partição default) deve existir'
);
SELECT has_table(
  'public', 'frontend_error_logs_default',
  'frontend_error_logs_default deve existir'
);

-- ---------------------------------------------------------------------------
-- 4) RLS habilitado em todas as partições filhas
-- ---------------------------------------------------------------------------
SELECT is(
  (SELECT count(*)::int FROM pg_class c
    JOIN pg_namespace n ON n.oid=c.relnamespace
    JOIN pg_inherits i ON i.inhrelid=c.oid
    JOIN pg_class parent ON parent.oid=i.inhparent
   WHERE n.nspname='public'
     AND parent.relname IN ('audit_logs','frontend_error_logs')
     AND c.relrowsecurity = false),
  0,
  'todas as partições filhas devem ter RLS habilitado'
);

-- ---------------------------------------------------------------------------
-- 5) FORCE RLS em tabelas sensíveis
-- ---------------------------------------------------------------------------
SELECT is(
  (SELECT c.relforcerowsecurity FROM pg_class c
    JOIN pg_namespace n ON n.oid=c.relnamespace
   WHERE n.nspname='public' AND c.relname='user_roles'),
  true,
  'user_roles deve ter FORCE ROW LEVEL SECURITY'
);
SELECT is(
  (SELECT c.relforcerowsecurity FROM pg_class c
    JOIN pg_namespace n ON n.oid=c.relnamespace
   WHERE n.nspname='public' AND c.relname='profiles'),
  true,
  'profiles deve ter FORCE ROW LEVEL SECURITY'
);
SELECT is(
  (SELECT c.relforcerowsecurity FROM pg_class c
    JOIN pg_namespace n ON n.oid=c.relnamespace
   WHERE n.nspname='public' AND c.relname='password_reset_tokens'),
  true,
  'password_reset_tokens deve ter FORCE ROW LEVEL SECURITY'
);
SELECT is(
  (SELECT c.relforcerowsecurity FROM pg_class c
    JOIN pg_namespace n ON n.oid=c.relnamespace
   WHERE n.nspname='public' AND c.relname='webhook_dlq'),
  true,
  'webhook_dlq deve ter FORCE ROW LEVEL SECURITY'
);

-- ---------------------------------------------------------------------------
-- 6) Funções de manutenção existem e estão em SECURITY DEFINER
-- ---------------------------------------------------------------------------
SELECT has_function(
  'public', 'ensure_monthly_partitions',
  ARRAY['text','integer','integer'],
  'ensure_monthly_partitions(text,int,int) deve existir'
);
SELECT has_function(
  'public', 'maintain_monthly_partitions',
  ARRAY[]::text[],
  'maintain_monthly_partitions() deve existir'
);
SELECT has_function(
  'public', 'cleanup_log_tables',
  ARRAY[]::text[],
  'cleanup_log_tables() deve existir'
);
SELECT has_function(
  'public', 'capture_slow_queries',
  ARRAY['numeric'],
  'capture_slow_queries(numeric) deve existir'
);
SELECT has_function(
  'public', 'enqueue_webhook_retry',
  ARRAY['uuid','text','text','text','jsonb','text','jsonb'],
  'enqueue_webhook_retry deve existir com assinatura canônica'
);
SELECT has_function(
  'public', 'reprocess_dlq',
  ARRAY['uuid','text'],
  'reprocess_dlq(uuid,text) deve existir'
);

-- ---------------------------------------------------------------------------
-- 7) Todas as funções críticas são SECURITY DEFINER
-- ---------------------------------------------------------------------------
SELECT is(
  (SELECT p.prosecdef FROM pg_proc p
    JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname='public' AND p.proname='ensure_monthly_partitions'
   LIMIT 1),
  true,
  'ensure_monthly_partitions deve ser SECURITY DEFINER'
);
SELECT is(
  (SELECT p.prosecdef FROM pg_proc p
    JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname='public' AND p.proname='cleanup_log_tables'
   LIMIT 1),
  true,
  'cleanup_log_tables deve ser SECURITY DEFINER'
);

-- ---------------------------------------------------------------------------
-- 8) Insert em partição atual funciona (smoke test)
-- ---------------------------------------------------------------------------
SELECT lives_ok(
  $$INSERT INTO public.audit_logs (action, details) VALUES ('pgtap_test', 'ok')$$,
  'insert em audit_logs deve rotear para partição correta'
);

SELECT is(
  (SELECT count(*)::int FROM public.audit_logs WHERE action='pgtap_test'),
  1,
  'registro pgtap_test deve estar visível via tabela pai'
);

-- ---------------------------------------------------------------------------
-- 9) Índices essenciais existem
-- ---------------------------------------------------------------------------
SELECT has_index(
  'public', 'audit_logs', 'idx_audit_logs_created_at',
  'idx_audit_logs_created_at deve existir'
);
SELECT has_index(
  'public', 'audit_logs', 'idx_audit_logs_user_id',
  'idx_audit_logs_user_id deve existir'
);

-- ---------------------------------------------------------------------------
-- 10) webhook_dlq: schema básico
-- ---------------------------------------------------------------------------
SELECT has_column('public','webhook_dlq','source','webhook_dlq.source existe');
SELECT has_column('public','webhook_dlq','payload','webhook_dlq.payload existe');
SELECT has_column('public','webhook_dlq','attempts','webhook_dlq.attempts existe');
SELECT has_column('public','webhook_dlq','resolved_at','webhook_dlq.resolved_at existe');

SELECT * FROM finish();
ROLLBACK;
