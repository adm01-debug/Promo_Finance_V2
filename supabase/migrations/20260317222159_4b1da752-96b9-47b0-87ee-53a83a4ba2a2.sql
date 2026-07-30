-- 1. PIX_TEMPLATES: Fix cross-tenant vulnerability
DROP POLICY IF EXISTS "Authenticated users can view pix_templates" ON public.pix_templates;
DROP POLICY IF EXISTS "Authenticated users can update pix_templates" ON public.pix_templates;

CREATE POLICY "Role-based select pix_templates"
  ON public.pix_templates FOR SELECT TO authenticated
  USING (
    created_by = auth.uid()
    OR has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role])
  );

CREATE POLICY "Role-based update pix_templates"
  ON public.pix_templates FOR UPDATE TO authenticated
  USING (
    created_by = auth.uid()
    OR has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role])
  )
  WITH CHECK (
    created_by = auth.uid()
    OR has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role])
  );

-- 2. WEBHOOKS_LOG: Restrict to admin/financeiro
DROP POLICY IF EXISTS "Auth users can read webhooks_log" ON public.webhooks_log;

CREATE POLICY "Admin financeiro can read webhooks_log"
  ON public.webhooks_log FOR SELECT TO authenticated
  USING (
    has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role])
  );

-- 3. PONTO_DEPARTAMENTOS: Restrict SELECT
DROP POLICY IF EXISTS "Authenticated can view ponto_departamentos" ON public.ponto_departamentos;

CREATE POLICY "Admin financeiro can view ponto_departamentos"
  ON public.ponto_departamentos FOR SELECT TO authenticated
  USING (
    has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role])
  );

-- 4. CONFIGURACOES_APROVACAO: Restrict SELECT
DROP POLICY IF EXISTS "Autenticados podem ver configuracoes_aprovacao" ON public.configuracoes_aprovacao;

CREATE POLICY "Admin financeiro can view configuracoes_aprovacao"
  ON public.configuracoes_aprovacao FOR SELECT TO authenticated
  USING (
    has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role])
  );