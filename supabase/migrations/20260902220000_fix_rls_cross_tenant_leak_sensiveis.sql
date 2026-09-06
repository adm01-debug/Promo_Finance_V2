-- SECURITY FIX (Grupo B — tabelas sensíveis de infraestrutura de
-- autorização): mesmo padrão sistêmico (has_role/has_any_role sem
-- empresa_id) nas tabelas que sustentam o próprio modelo multi-tenant —
-- profiles, user_empresas, sso_providers, sso_login_attempts,
-- scim_operations_log — mais o achado bônus em empresas (a tabela raiz).
-- Tratadas separadamente do Grupo A/B por serem foundational: um erro
-- aqui pode travar login/provisionamento pro sistema inteiro. Nenhuma
-- delas tem policy irmã escopada, então cada policy solta é REESCRITA
-- (DROP + CREATE preservando a lógica de role/self-access original, só
-- adicionando o filtro de empresa) em vez de removida.
--
-- empresa_acessivel()/empresa_membro_ativo() são SECURITY DEFINER — usá-
-- las dentro da própria policy de user_empresas não causa recursão
-- (rodam com privilégio do dono da função, RLS não se reaplica).
--
-- user_roles NÃO está incluída aqui: has_role() lê user_roles sem filtro
-- de empresa por design (papel é global no modelo atual). Restringir
-- quem-concede-papel por empresa é decisão de produto (papéis deveriam
-- ser por empresa?), não um simples fechamento de brecha — fica de fora,
-- registrada no relatório para decisão.

BEGIN;

-- ============ empresas (tabela raiz — escopo é pelo próprio id) ============
DROP POLICY IF EXISTS "Financeiro+ can manage empresas" ON public.empresas;
CREATE POLICY "Financeiro+ can manage empresas" ON public.empresas
  FOR ALL TO authenticated
  USING ((public.has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[]) AND public.empresa_acessivel(id)))
  WITH CHECK ((public.has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[]) AND public.empresa_acessivel(id)));

DROP POLICY IF EXISTS "Operacional+ podem ver empresas" ON public.empresas;
CREATE POLICY "Operacional+ podem ver empresas" ON public.empresas AS PERMISSIVE FOR SELECT TO authenticated
  USING ((has_any_role((SELECT auth.uid()), ARRAY['admin'::app_role, 'financeiro'::app_role, 'operacional'::app_role]) AND empresa_acessivel(id)));

-- ============ profiles ============
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING ((has_role(auth.uid(), 'admin') AND empresa_acessivel(empresa_id)));

DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can update all profiles" ON public.profiles
  FOR UPDATE TO authenticated
  USING ((has_role(auth.uid(), 'admin') AND empresa_acessivel(empresa_id)));

DROP POLICY IF EXISTS "Admins can manage profiles" ON public.profiles;
CREATE POLICY "Admins can manage profiles" ON public.profiles AS PERMISSIVE FOR ALL TO authenticated
  USING ((has_role((SELECT auth.uid()), 'admin'::app_role) AND empresa_acessivel(empresa_id)))
  WITH CHECK ((has_role((SELECT auth.uid()), 'admin'::app_role) AND empresa_acessivel(empresa_id)));

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles AS PERMISSIVE FOR SELECT TO authenticated
  USING ((((SELECT auth.uid()) = id) OR ((SELECT auth.uid()) = user_id) OR (has_role((SELECT auth.uid()), 'admin'::app_role) AND empresa_acessivel(empresa_id))));

-- ============ user_empresas (base do modelo de autorização) ============
DROP POLICY IF EXISTS "Admins manage user_empresas" ON public.user_empresas;
CREATE POLICY "Admins manage user_empresas" ON public.user_empresas AS PERMISSIVE FOR ALL TO authenticated
  USING ((has_role((SELECT auth.uid()), 'admin'::app_role) AND empresa_acessivel(empresa_id)))
  WITH CHECK ((has_role((SELECT auth.uid()), 'admin'::app_role) AND empresa_acessivel(empresa_id)));

DROP POLICY IF EXISTS "Users view own empresa links" ON public.user_empresas;
CREATE POLICY "Users view own empresa links" ON public.user_empresas AS PERMISSIVE FOR SELECT TO authenticated
  USING ((((SELECT auth.uid()) = user_id) OR (has_role((SELECT auth.uid()), 'admin'::app_role) AND empresa_acessivel(empresa_id))));

-- ============ sso_providers ============
DROP POLICY IF EXISTS "Admins manage sso providers" ON public.sso_providers;
CREATE POLICY "Admins manage sso providers" ON public.sso_providers AS PERMISSIVE FOR ALL TO authenticated
  USING ((has_role((SELECT auth.uid()), 'admin'::app_role) AND empresa_acessivel(empresa_id)))
  WITH CHECK ((has_role((SELECT auth.uid()), 'admin'::app_role) AND empresa_acessivel(empresa_id)));

-- ============ sso_login_attempts (sem empresa_id direto; escopa via
-- provider_id -> sso_providers.empresa_id) ============
DROP POLICY IF EXISTS "Admins veem tentativas SSO" ON public.sso_login_attempts;
CREATE POLICY "Admins veem tentativas SSO" ON public.sso_login_attempts
  FOR SELECT TO authenticated
  USING ((public.has_role(auth.uid(), 'admin') AND public.empresa_acessivel((SELECT sp.empresa_id FROM public.sso_providers sp WHERE sp.id = sso_login_attempts.provider_id))));

DROP POLICY IF EXISTS "Admins can view SSO login attempts" ON public.sso_login_attempts;
CREATE POLICY "Admins can view SSO login attempts" ON public.sso_login_attempts AS PERMISSIVE FOR SELECT TO authenticated
  USING ((has_role((SELECT auth.uid()), 'admin'::app_role) AND empresa_acessivel((SELECT sp.empresa_id FROM public.sso_providers sp WHERE sp.id = sso_login_attempts.provider_id))));

-- ============ scim_operations_log ============
DROP POLICY IF EXISTS "Admins view scim logs" ON public.scim_operations_log;
CREATE POLICY "Admins view scim logs" ON public.scim_operations_log
  FOR SELECT TO authenticated
  USING ((public.has_role(auth.uid(), 'admin') AND public.empresa_acessivel(empresa_id)));

DROP POLICY IF EXISTS scim_operations_log_admin_select ON public.scim_operations_log;
CREATE POLICY scim_operations_log_admin_select ON public.scim_operations_log AS PERMISSIVE FOR SELECT TO authenticated
  USING ((has_role((SELECT auth.uid()), 'admin'::app_role) AND empresa_acessivel(empresa_id)));

COMMIT;

INSERT INTO supabase_migrations.schema_migrations(version,name)
VALUES('20260902220000','fix_rls_cross_tenant_leak_sensiveis')
ON CONFLICT (version) DO NOTHING;
