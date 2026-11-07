-- 20261102000000_registrar_grupo_b_rls_cross_tenant.sql
-- Reconciliacao da PR #238: registra no schema_migrations as 15 migrations 20260902* do Grupo B
-- (fix_rls_cross_tenant) que ja foram aplicadas manualmente no banco, mas nao constam rastreadas.
-- Nao reexecuta DDL: somente INSERT de registro (idempotente via ON CONFLICT DO NOTHING).
-- Evidencia (2026-11-01): policies RLS com empresa_acessivel/empresa_membro_ativo existem no banco;
-- nenhuma versao 20260902% em supabase_migrations.schema_migrations.

BEGIN;

-- supabase/migrations/20260902130000_fix_rls_cross_tenant_leak_financeiro.sql
INSERT INTO supabase_migrations.schema_migrations(version) VALUES ('20260902130000') ON CONFLICT DO NOTHING;

-- supabase/migrations/20260902140000_fix_rls_cross_tenant_leak_financeiro_parte2.sql
INSERT INTO supabase_migrations.schema_migrations(version) VALUES ('20260902140000') ON CONFLICT DO NOTHING;

-- supabase/migrations/20260902150000_fix_rls_cross_tenant_leak_financeiro_parte3.sql
INSERT INTO supabase_migrations.schema_migrations(version) VALUES ('20260902150000') ON CONFLICT DO NOTHING;

-- supabase/migrations/20260902160000_fix_bypass_views_matviews_legadas.sql
INSERT INTO supabase_migrations.schema_migrations(version) VALUES ('20260902160000') ON CONFLICT DO NOTHING;

-- supabase/migrations/20260902170000_fix_rpcs_security_definer_sem_escopo.sql
INSERT INTO supabase_migrations.schema_migrations(version) VALUES ('20260902170000') ON CONFLICT DO NOTHING;

-- supabase/migrations/20260902180000_fix_nfe_vinculo_rpcs_sem_escopo.sql
INSERT INTO supabase_migrations.schema_migrations(version) VALUES ('20260902180000') ON CONFLICT DO NOTHING;

-- supabase/migrations/20260902190000_fix_rls_cross_tenant_leak_grupo_a.sql
INSERT INTO supabase_migrations.schema_migrations(version) VALUES ('20260902190000') ON CONFLICT DO NOTHING;

-- supabase/migrations/20260902200000_fix_rls_cross_tenant_leak_grupo_c.sql
INSERT INTO supabase_migrations.schema_migrations(version) VALUES ('20260902200000') ON CONFLICT DO NOTHING;

-- supabase/migrations/20260902210000_fix_rls_cross_tenant_leak_grupo_b1.sql
INSERT INTO supabase_migrations.schema_migrations(version) VALUES ('20260902210000') ON CONFLICT DO NOTHING;

-- supabase/migrations/20260902220000_fix_rls_cross_tenant_leak_sensiveis.sql
INSERT INTO supabase_migrations.schema_migrations(version) VALUES ('20260902220000') ON CONFLICT DO NOTHING;

-- supabase/migrations/20260902230000_fix_rls_tautologia_empresas_asaas_elisao.sql
INSERT INTO supabase_migrations.schema_migrations(version) VALUES ('20260902230000') ON CONFLICT DO NOTHING;

-- supabase/migrations/20260902240000_fix_rls_gaps_pos_pr54.sql
INSERT INTO supabase_migrations.schema_migrations(version) VALUES ('20260902240000') ON CONFLICT DO NOTHING;

-- supabase/migrations/20260902250000_fix_storage_view_audit_trail_gaps.sql
INSERT INTO supabase_migrations.schema_migrations(version) VALUES ('20260902250000') ON CONFLICT DO NOTHING;

-- supabase/migrations/20260902260000_fix_historico_conciliacao_ia_or_bypass.sql
INSERT INTO supabase_migrations.schema_migrations(version) VALUES ('20260902260000') ON CONFLICT DO NOTHING;

-- supabase/migrations/20260902270000_fix_orphan_policies_pos_pr55.sql
INSERT INTO supabase_migrations.schema_migrations(version) VALUES ('20260902270000') ON CONFLICT DO NOTHING;

COMMIT;
