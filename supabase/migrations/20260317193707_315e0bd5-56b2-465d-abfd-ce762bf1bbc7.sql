-- =============================================
-- SECURITY HARDENING: Fix critical RLS issues
-- =============================================

-- 1. ponto_funcionarios: restrict SELECT to admin/financeiro
DROP POLICY IF EXISTS "Authenticated can view ponto_funcionarios" ON public.ponto_funcionarios;
CREATE POLICY "Admin/financeiro can view ponto_funcionarios"
  ON public.ponto_funcionarios FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin', 'financeiro']::app_role[]));

-- 2. contatos_financeiros: restrict SELECT to admin/financeiro
DROP POLICY IF EXISTS "Auth users can read contatos_financeiros" ON public.contatos_financeiros;
CREATE POLICY "Admin/financeiro can read contatos_financeiros"
  ON public.contatos_financeiros FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin', 'financeiro']::app_role[]));

-- 3. auditoria_financeira: restrict SELECT to admin only
DROP POLICY IF EXISTS "Auth users can read auditoria_financeira" ON public.auditoria_financeira;
CREATE POLICY "Admin can read auditoria_financeira"
  ON public.auditoria_financeira FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 4. anexos_financeiros: replace overly permissive ALL policy with scoped policies
DROP POLICY IF EXISTS "Auth users can manage anexos_financeiros" ON public.anexos_financeiros;

CREATE POLICY "Auth users can read anexos_financeiros"
  ON public.anexos_financeiros FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin', 'financeiro', 'operacional']::app_role[]));

CREATE POLICY "Auth users can insert anexos_financeiros"
  ON public.anexos_financeiros FOR INSERT TO authenticated
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin', 'financeiro', 'operacional']::app_role[]));

CREATE POLICY "Admin/financeiro can update anexos_financeiros"
  ON public.anexos_financeiros FOR UPDATE TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin', 'financeiro']::app_role[]));

CREATE POLICY "Admin/financeiro can delete anexos_financeiros"
  ON public.anexos_financeiros FOR DELETE TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin', 'financeiro']::app_role[]));

-- 5. ponto_registros: restrict SELECT to admin/financeiro
DROP POLICY IF EXISTS "Authenticated can view ponto_registros" ON public.ponto_registros;
CREATE POLICY "Admin/financeiro can view ponto_registros"
  ON public.ponto_registros FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin', 'financeiro']::app_role[]));
