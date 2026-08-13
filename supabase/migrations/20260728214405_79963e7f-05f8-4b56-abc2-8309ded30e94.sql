DROP FUNCTION IF EXISTS public.gate_25_policies_sem_tenant();
CREATE FUNCTION public.gate_25_policies_sem_tenant()
RETURNS TABLE(tabela text, policy_name text, cmd text, vinculo text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH exempt AS (
    SELECT unnest(ARRAY[
      'profiles','user_empresas','user_roles','sso_providers','sso_role_mappings',
      'sso_sandbox_runs','sso_user_groups','scim_tokens','scim_operations_log',
      'empresas','relatorios_agendados','historico_relatorios'
    ]) AS tbl
  ),
  candidatas AS (
    SELECT p.tablename::text AS tabela, p.policyname::text AS policy_name, p.cmd::text AS cmd,
           CASE WHEN EXISTS (
             SELECT 1 FROM information_schema.columns c
             WHERE c.table_schema='public' AND c.table_name=p.tablename AND c.column_name='empresa_id'
           ) THEN 'direto' ELSE 'fk' END AS vinculo,
           EXISTS (
             SELECT 1 FROM information_schema.columns c
             WHERE c.table_schema='public' AND c.table_name=p.tablename AND c.column_name='empresa_id'
           ) AS tem_coluna,
           EXISTS (
             SELECT 1 FROM pg_constraint fk
             JOIN information_schema.columns pc
               ON pc.table_schema='public'
              AND pc.table_name = fk.confrelid::regclass::text
              AND pc.column_name = 'empresa_id'
             WHERE fk.contype='f'
               AND fk.connamespace='public'::regnamespace
               AND fk.conrelid::regclass::text = p.tablename
           ) AS tem_fk
    FROM pg_policies p
    WHERE p.schemaname='public'
      AND p.tablename NOT IN (SELECT tbl FROM exempt)
      AND (coalesce(p.qual,'') || coalesce(p.with_check,'')) LIKE '%has_role%'
      AND (coalesce(p.qual,'') || coalesce(p.with_check,'')) NOT LIKE '%empresa%'
  )
  SELECT tabela, policy_name, cmd, vinculo
  FROM candidatas
  WHERE tem_coluna OR tem_fk
  ORDER BY 1, 2;
$$;

REVOKE EXECUTE ON FUNCTION public.gate_25_policies_sem_tenant() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.gate_25_policies_sem_tenant() TO service_role;