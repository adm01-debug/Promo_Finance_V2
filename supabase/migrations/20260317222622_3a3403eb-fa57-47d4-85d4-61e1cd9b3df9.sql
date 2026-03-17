-- 1. REGUA_COBRANCA: Restrict SELECT to admin/financeiro
DROP POLICY IF EXISTS "Usuários autenticados podem ver régua de cobrança" ON public.regua_cobranca;

CREATE POLICY "Admin financeiro can view regua_cobranca"
  ON public.regua_cobranca FOR SELECT TO authenticated
  USING (
    has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role])
  );

-- 2. TEMPLATES_COBRANCA: Restrict SELECT to admin/financeiro
DROP POLICY IF EXISTS "Auth users can read templates_cobranca" ON public.templates_cobranca;

CREATE POLICY "Admin financeiro can read templates_cobranca"
  ON public.templates_cobranca FOR SELECT TO authenticated
  USING (
    has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role])
  );

-- 3. PONTO_SYNC_LOG: Restrict SELECT to admin/financeiro
DROP POLICY IF EXISTS "Authenticated can view ponto_sync_log" ON public.ponto_sync_log;

CREATE POLICY "Admin financeiro can view ponto_sync_log"
  ON public.ponto_sync_log FOR SELECT TO authenticated
  USING (
    has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role])
  );

-- 4. REGRAS_CONCILIACAO: Restrict SELECT to admin/financeiro
DROP POLICY IF EXISTS "Authenticated users can read regras_conciliacao" ON public.regras_conciliacao;

CREATE POLICY "Admin financeiro can read regras_conciliacao"
  ON public.regras_conciliacao FOR SELECT TO authenticated
  USING (
    has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role])
  );