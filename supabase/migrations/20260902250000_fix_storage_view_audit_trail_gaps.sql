-- SECURITY FIX: 3 vazamentos cross-tenant achados pela simulação
-- adversarial (agente 5) — nenhum tocado pelo PR #54, que só cobriu
-- tabelas com RLS, não storage.objects nem a view legada.

BEGIN;

-- ============ bucket relatorios-tributarios ============
-- Policy de SELECT ("Admin/financeiro visualiza tax reports",
-- 20260418153626) checava só role, sem escopo de empresa nem de path —
-- qualquer financeiro lista/baixa SPED/DRE/pacotes de evidência de
-- QUALQUER empresa. Reescreve no mesmo padrão do bucket nfe-xml
-- (path prefixado por empresa_id, checado contra user_empresas).
-- Os uploads que gravavam sem prefixo empresa_id (gerar-sped-ecd/ecf,
-- exportar-sped-contribuicoes, e enviar-relatorios-tributarios-agendados,
-- que prefixava com "agendados/{empresa_id}/..." — achado do coderabbitai:
-- split_part(name,'/',1) resolvia para "agendados", não empresa_id) foram
-- corrigidos para escrever em "{empresa_id}/...". gerar-pdf-tributario já
-- prefixava corretamente.
DROP POLICY IF EXISTS "Admin/financeiro visualiza tax reports" ON storage.objects;
CREATE POLICY "Admin/financeiro visualiza tax reports" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'relatorios-tributarios'
    AND has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[])
    AND EXISTS (
      SELECT 1 FROM public.user_empresas ue
      WHERE ue.user_id = auth.uid()
        AND ue.ativo = true
        AND ue.empresa_id::text = split_part(name, '/', 1)
    )
  );

DROP POLICY IF EXISTS "Admins can delete tax reports" ON storage.objects;
CREATE POLICY "Admins can delete tax reports" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'relatorios-tributarios'
    AND has_role(auth.uid(), 'admin'::app_role)
    AND EXISTS (
      SELECT 1 FROM public.user_empresas ue
      WHERE ue.user_id = auth.uid()
        AND ue.ativo = true
        AND ue.empresa_id::text = split_part(name, '/', 1)
    )
  );

-- Mesmo padrão sistêmico já existia em nfe-xml: bypass "has_role(admin)
-- OR vínculo" sem AND — um admin de QUALQUER empresa lia XML de NFe de
-- outra. Corrige exigindo o vínculo também para admin.
DROP POLICY IF EXISTS "nfe_xml_empresa_read" ON storage.objects;
CREATE POLICY "nfe_xml_empresa_read" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'nfe-xml' AND
    EXISTS (
      SELECT 1 FROM public.user_empresas ue
      WHERE ue.user_id = auth.uid()
        AND ue.ativo = true
        AND ue.empresa_id::text = split_part(name, '/', 1)
    )
  );

-- ============ vw_audit_report ============
-- View sem security_invoker (20251231000300), nunca coberta pelo
-- hardening de views legadas (20260902160000, que só tratou
-- vw_monthly_summary/vw_cash_flow/vw_contas_atrasadas/
-- vw_totals_by_category). Roda como dono da view (bypass de RLS de
-- audit_logs) e expõe old_data/new_data de TODAS as empresas para
-- authenticated. Não referenciada em src/ nem supabase/functions/ —
-- morta para usuários finais, revoga como as outras 4 legadas. REVOKE
-- direto falha (e aborta a migration inteira) se a view não existir;
-- segue o mesmo guard de existência via pg_class de 20260902160000
-- (achado do coderabbitai).
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'vw_audit_report' AND c.relkind = 'v'
  ) THEN
    REVOKE ALL ON public.vw_audit_report FROM PUBLIC, anon, authenticated;
  END IF;
END;
$$;

-- ============ asaas_audit_trail (payment_id IS NULL) ============
-- A cláusula "OR payment_id IS NULL" que eu mesmo adicionei na migration
-- 20260902230000 (ao consolidar as policies problemáticas) preservou uma
-- brecha: linhas sem payment_id (ex.: PIX_CASHOUT_CREATED, que grava
-- chave PIX + valor do saque) ficavam visíveis para QUALQUER
-- authenticated, sem checar nem dono nem empresa — pior que a tautologia
-- original. asaas_audit_trail não tem empresa_id, só payment_id/user_id;
-- linhas sem payment_id têm user_id do ator (confirmado no código de
-- supabase/functions/asaas-proxy/index.ts) — escopa por dono em vez de
-- abrir geral. Linhas sem os dois (ex.: BACKOFF_SIMULATION, diagnóstico
-- de sistema) ficam só para admin, via asaas_audit_admin_all abaixo.
DROP POLICY IF EXISTS "Permitir leitura da auditoria para autenticados" ON public.asaas_audit_trail;
DROP POLICY IF EXISTS "Users can view audit trail of their company" ON public.asaas_audit_trail;
CREATE POLICY "Users can view audit trail of their company" ON public.asaas_audit_trail
  FOR SELECT TO authenticated
  USING (
    payment_id IN (SELECT p.id FROM public.asaas_payments p WHERE empresa_acessivel(p.empresa_id))
    OR (payment_id IS NULL AND user_id = auth.uid())
  );

-- FOR ALL com WITH CHECK dava a admin INSERT/UPDATE/DELETE nesta trilha de
-- auditoria — escrita real já acontece via service_role (bypassa RLS);
-- manter admin com UPDATE/DELETE por RLS permite apagar/alterar a própria
-- evidência de auditoria (achado do coderabbitai). Restrito a SELECT.
DROP POLICY IF EXISTS asaas_audit_admin_all ON public.asaas_audit_trail;
CREATE POLICY asaas_audit_admin_all ON public.asaas_audit_trail AS PERMISSIVE FOR SELECT TO authenticated
  USING (
    has_role((SELECT auth.uid()), 'admin'::app_role)
    AND (
      payment_id IN (SELECT p.id FROM public.asaas_payments p WHERE empresa_acessivel(p.empresa_id))
      OR payment_id IS NULL
    )
  );

COMMIT;

INSERT INTO supabase_migrations.schema_migrations(version,name)
VALUES('20260902250000','fix_storage_view_audit_trail_gaps')
ON CONFLICT (version) DO NOTHING;
