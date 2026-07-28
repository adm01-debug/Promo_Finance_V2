-- test-tenant-policy-scope.sql — Gate #25
--
-- Falha o pipeline quando uma policy baseada apenas em papel (has_role) protege
-- uma tabela multi-inquilino, seja pelo vínculo direto (coluna empresa_id) ou
-- indireto (FK para uma tabela que possui empresa_id).
--
-- Racional: `has_role(uid,'admin')` é global — sem `empresa_acessivel(...)` um
-- administrador de uma empresa enxerga/edita dados de todas as outras.
--
-- Tabelas de identidade, provisionamento e catálogo global são isentas: o
-- escopo transversal ali é intencional.

\set ON_ERROR_STOP on
\pset pager off

DO $$
DECLARE
  v_violacoes text;
  v_total int;
BEGIN
  WITH exempt AS (
    SELECT unnest(ARRAY[
      'profiles','user_empresas','user_roles','sso_providers','sso_role_mappings',
      'sso_sandbox_runs','sso_user_groups','scim_tokens','scim_operations_log',
      'empresas','relatorios_agendados','historico_relatorios'
    ]) AS tbl
  ),
  candidatas AS (
    SELECT
      p.tablename::text AS tabela,
      p.policyname::text AS policy_name,
      p.cmd::text AS cmd,
      EXISTS (
        SELECT 1 FROM information_schema.columns c
        WHERE c.table_schema = 'public'
          AND c.table_name = p.tablename
          AND c.column_name = 'empresa_id'
      ) AS tem_coluna,
      EXISTS (
        SELECT 1
        FROM pg_constraint fk
        JOIN information_schema.columns pc
          ON pc.table_schema = 'public'
         AND pc.table_name = fk.confrelid::regclass::text
         AND pc.column_name = 'empresa_id'
        WHERE fk.contype = 'f'
          AND fk.connamespace = 'public'::regnamespace
          AND fk.conrelid::regclass::text = p.tablename
      ) AS tem_fk
    FROM pg_policies p
    WHERE p.schemaname = 'public'
      AND p.tablename NOT IN (SELECT tbl FROM exempt)
      AND (coalesce(p.qual,'') || coalesce(p.with_check,'')) LIKE '%has_role%'
      AND (coalesce(p.qual,'') || coalesce(p.with_check,'')) NOT LIKE '%empresa%'
  )
  SELECT count(*),
         string_agg(
           format('  - %s.%s (%s, vínculo %s)',
                  tabela, policy_name, cmd,
                  CASE WHEN tem_coluna THEN 'direto' ELSE 'fk' END),
           E'\n' ORDER BY tabela, policy_name)
    INTO v_total, v_violacoes
  FROM candidatas
  WHERE tem_coluna OR tem_fk;

  IF v_total > 0 THEN
    RAISE EXCEPTION E'Gate #25 falhou: % policy(ies) sem escopo de empresa:\n%',
      v_total, v_violacoes;
  END IF;

  RAISE NOTICE 'Gate #25 OK — nenhuma policy multi-inquilino baseada só em papel.';
END $$;
