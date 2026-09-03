-- Migration 20260903000300
-- PROBLEMA: policies de asaas_config usam apenas empresa_acessivel(empresa_id) sem
-- checar role — qualquer membro autenticado da empresa (inclusive 'operacional') pode
-- LER e MODIFICAR chaves de API Asaas. Dado de altíssima sensibilidade.
-- FIX: restringir SELECT a roles com permissão financeira; UPDATE/INSERT/DELETE a
-- roles admin/financeiro. Roles aceitos: 'admin', 'financeiro', 'contador'.

BEGIN;

-- Remove policies permissivas existentes
DROP POLICY IF EXISTS "asaas_config_select" ON public.asaas_config;
DROP POLICY IF EXISTS "asaas_config_insert" ON public.asaas_config;
DROP POLICY IF EXISTS "asaas_config_update" ON public.asaas_config;
DROP POLICY IF EXISTS "asaas_config_delete" ON public.asaas_config;
-- nomes alternativos que possam existir
DROP POLICY IF EXISTS "asaas_config_empresa_select" ON public.asaas_config;
DROP POLICY IF EXISTS "asaas_config_empresa_insert" ON public.asaas_config;
DROP POLICY IF EXISTS "asaas_config_empresa_update" ON public.asaas_config;
DROP POLICY IF EXISTS "asaas_config_empresa_delete" ON public.asaas_config;

-- SELECT: apenas roles com acesso financeiro
CREATE POLICY "asaas_config_select_financeiro"
  ON public.asaas_config
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING (
    empresa_acessivel(empresa_id)
    AND EXISTS (
      SELECT 1 FROM public.user_empresas ue
      WHERE ue.user_id = (SELECT auth.uid())
        AND ue.empresa_id = asaas_config.empresa_id
        AND ue.ativo = true
        AND ue.role IN ('admin', 'financeiro', 'contador')
    )
  );

-- INSERT: apenas admin
CREATE POLICY "asaas_config_insert_admin"
  ON public.asaas_config
  AS PERMISSIVE
  FOR INSERT
  TO authenticated
  WITH CHECK (
    empresa_acessivel(empresa_id)
    AND EXISTS (
      SELECT 1 FROM public.user_empresas ue
      WHERE ue.user_id = (SELECT auth.uid())
        AND ue.empresa_id = asaas_config.empresa_id
        AND ue.ativo = true
        AND ue.role IN ('admin', 'financeiro')
    )
  );

-- UPDATE: apenas admin/financeiro
CREATE POLICY "asaas_config_update_admin"
  ON public.asaas_config
  AS PERMISSIVE
  FOR UPDATE
  TO authenticated
  USING (
    empresa_acessivel(empresa_id)
    AND EXISTS (
      SELECT 1 FROM public.user_empresas ue
      WHERE ue.user_id = (SELECT auth.uid())
        AND ue.empresa_id = asaas_config.empresa_id
        AND ue.ativo = true
        AND ue.role IN ('admin', 'financeiro')
    )
  )
  WITH CHECK (
    empresa_acessivel(empresa_id)
    AND EXISTS (
      SELECT 1 FROM public.user_empresas ue
      WHERE ue.user_id = (SELECT auth.uid())
        AND ue.empresa_id = asaas_config.empresa_id
        AND ue.ativo = true
        AND ue.role IN ('admin', 'financeiro')
    )
  );

-- DELETE: apenas admin
CREATE POLICY "asaas_config_delete_admin"
  ON public.asaas_config
  AS PERMISSIVE
  FOR DELETE
  TO authenticated
  USING (
    empresa_acessivel(empresa_id)
    AND EXISTS (
      SELECT 1 FROM public.user_empresas ue
      WHERE ue.user_id = (SELECT auth.uid())
        AND ue.empresa_id = asaas_config.empresa_id
        AND ue.ativo = true
        AND ue.role = 'admin'
    )
  );

COMMIT;

INSERT INTO supabase_migrations.schema_migrations (version, name, statements)
VALUES (
  '20260903000300',
  'fix_asaas_config_rls_role_check',
  ARRAY[
    'DROP POLICY IF EXISTS "asaas_config_select" ON public.asaas_config',
    'DROP POLICY IF EXISTS "asaas_config_insert" ON public.asaas_config',
    'DROP POLICY IF EXISTS "asaas_config_update" ON public.asaas_config',
    'DROP POLICY IF EXISTS "asaas_config_delete" ON public.asaas_config',
    'CREATE POLICY "asaas_config_select_financeiro" ON public.asaas_config AS PERMISSIVE FOR SELECT TO authenticated USING (empresa_acessivel(empresa_id) AND EXISTS (SELECT 1 FROM public.user_empresas ue WHERE ue.user_id = (SELECT auth.uid()) AND ue.empresa_id = asaas_config.empresa_id AND ue.ativo = true AND ue.role IN (''admin'', ''financeiro'', ''contador'')))',
    'CREATE POLICY "asaas_config_insert_admin" ON public.asaas_config AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (empresa_acessivel(empresa_id) AND EXISTS (SELECT 1 FROM public.user_empresas ue WHERE ue.user_id = (SELECT auth.uid()) AND ue.empresa_id = asaas_config.empresa_id AND ue.ativo = true AND ue.role IN (''admin'', ''financeiro'')))',
    'CREATE POLICY "asaas_config_update_admin" ON public.asaas_config AS PERMISSIVE FOR UPDATE TO authenticated USING (empresa_acessivel(empresa_id) AND EXISTS (SELECT 1 FROM public.user_empresas ue WHERE ue.user_id = (SELECT auth.uid()) AND ue.empresa_id = asaas_config.empresa_id AND ue.ativo = true AND ue.role IN (''admin'', ''financeiro''))) WITH CHECK (empresa_acessivel(empresa_id) AND EXISTS (SELECT 1 FROM public.user_empresas ue WHERE ue.user_id = (SELECT auth.uid()) AND ue.empresa_id = asaas_config.empresa_id AND ue.ativo = true AND ue.role IN (''admin'', ''financeiro'')))',
    'CREATE POLICY "asaas_config_delete_admin" ON public.asaas_config AS PERMISSIVE FOR DELETE TO authenticated USING (empresa_acessivel(empresa_id) AND EXISTS (SELECT 1 FROM public.user_empresas ue WHERE ue.user_id = (SELECT auth.uid()) AND ue.empresa_id = asaas_config.empresa_id AND ue.ativo = true AND ue.role = ''admin''))'
  ]
)
ON CONFLICT (version) DO NOTHING;
