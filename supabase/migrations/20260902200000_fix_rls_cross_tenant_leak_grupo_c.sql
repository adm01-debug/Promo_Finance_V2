-- SECURITY FIX (Grupo C — varredura exaustiva): 10 policies soltas onde a
-- policy irmã escopada cobre só 'admin', mas a solta também concedia a
-- 'financeiro' — diferente do Grupo A, aqui um DROP simples da solta seria
-- REGRESSÃO FUNCIONAL (tiraria acesso legítimo de financeiro), não só
-- fechamento de brecha. Como o padrão se repete idêntico em 7 tabelas
-- (mesma decisão de produto: financeiro deveria gerenciar régua de
-- cobrança/ASAAS/pix/negativações/protestos, não é bug isolado por tabela),
-- a correção é ampliar a policy irmã de has_role('admin') para
-- has_any_role('admin','financeiro') e só então remover a solta.
--
-- sped_contabil_arquivos.sped_arquivos_update_admin é o único caso
-- avulso, mesmo tratamento.

BEGIN;

DROP POLICY IF EXISTS asaas_customers_tenant_rw ON public.asaas_customers;
CREATE POLICY asaas_customers_tenant_rw ON public.asaas_customers AS PERMISSIVE FOR ALL TO authenticated
  USING ((has_any_role((SELECT auth.uid()), ARRAY['admin','financeiro']::app_role[]) AND empresa_acessivel(empresa_id)))
  WITH CHECK ((has_any_role((SELECT auth.uid()), ARRAY['admin','financeiro']::app_role[]) AND empresa_acessivel(empresa_id)));
DROP POLICY IF EXISTS "Admins e financeiro podem inserir clientes ASAAS" ON public.asaas_customers;
DROP POLICY IF EXISTS "Admins e financeiro podem atualizar clientes ASAAS" ON public.asaas_customers;

DROP POLICY IF EXISTS asaas_payments_tenant_rw ON public.asaas_payments;
CREATE POLICY asaas_payments_tenant_rw ON public.asaas_payments AS PERMISSIVE FOR ALL TO authenticated
  USING ((has_any_role((SELECT auth.uid()), ARRAY['admin','financeiro']::app_role[]) AND empresa_acessivel(empresa_id)))
  WITH CHECK ((has_any_role((SELECT auth.uid()), ARRAY['admin','financeiro']::app_role[]) AND empresa_acessivel(empresa_id)));
DROP POLICY IF EXISTS "Admins e financeiro podem inserir pagamentos ASAAS" ON public.asaas_payments;
DROP POLICY IF EXISTS "Admins e financeiro podem atualizar pagamentos ASAAS" ON public.asaas_payments;

DROP POLICY IF EXISTS fila_cobrancas_tenant_rw ON public.fila_cobrancas;
CREATE POLICY fila_cobrancas_tenant_rw ON public.fila_cobrancas AS PERMISSIVE FOR ALL TO authenticated
  USING ((has_any_role((SELECT auth.uid()), ARRAY['admin','financeiro']::app_role[]) AND empresa_acessivel(empresa_id)))
  WITH CHECK ((has_any_role((SELECT auth.uid()), ARRAY['admin','financeiro']::app_role[]) AND empresa_acessivel(empresa_id)));
DROP POLICY IF EXISTS "Fin users can manage fila_cobrancas" ON public.fila_cobrancas;

DROP POLICY IF EXISTS negativacoes_tenant_rw ON public.negativacoes;
CREATE POLICY negativacoes_tenant_rw ON public.negativacoes AS PERMISSIVE FOR ALL TO authenticated
  USING ((has_any_role((SELECT auth.uid()), ARRAY['admin','financeiro']::app_role[]) AND empresa_acessivel(empresa_id)))
  WITH CHECK ((has_any_role((SELECT auth.uid()), ARRAY['admin','financeiro']::app_role[]) AND empresa_acessivel(empresa_id)));
DROP POLICY IF EXISTS "Fin users can manage negativacoes" ON public.negativacoes;

DROP POLICY IF EXISTS pix_templates_tenant_rw ON public.pix_templates;
CREATE POLICY pix_templates_tenant_rw ON public.pix_templates AS PERMISSIVE FOR ALL TO authenticated
  USING ((has_any_role((SELECT auth.uid()), ARRAY['admin','financeiro']::app_role[]) AND empresa_acessivel(empresa_id)))
  WITH CHECK ((has_any_role((SELECT auth.uid()), ARRAY['admin','financeiro']::app_role[]) AND empresa_acessivel(empresa_id)));
DROP POLICY IF EXISTS "Role-based update pix_templates" ON public.pix_templates;

DROP POLICY IF EXISTS protestos_tenant_rw ON public.protestos;
CREATE POLICY protestos_tenant_rw ON public.protestos AS PERMISSIVE FOR ALL TO authenticated
  USING ((has_any_role((SELECT auth.uid()), ARRAY['admin','financeiro']::app_role[]) AND empresa_acessivel(empresa_id)))
  WITH CHECK ((has_any_role((SELECT auth.uid()), ARRAY['admin','financeiro']::app_role[]) AND empresa_acessivel(empresa_id)));
DROP POLICY IF EXISTS "Fin users can manage protestos" ON public.protestos;

DROP POLICY IF EXISTS regua_cobranca_tenant_rw ON public.regua_cobranca;
CREATE POLICY regua_cobranca_tenant_rw ON public.regua_cobranca AS PERMISSIVE FOR ALL TO authenticated
  USING ((has_any_role((SELECT auth.uid()), ARRAY['admin','financeiro']::app_role[]) AND empresa_acessivel(empresa_id)))
  WITH CHECK ((has_any_role((SELECT auth.uid()), ARRAY['admin','financeiro']::app_role[]) AND empresa_acessivel(empresa_id)));
DROP POLICY IF EXISTS "Admins e financeiros podem gerenciar régua de cobrança" ON public.regua_cobranca;

DROP POLICY IF EXISTS sped_arquivos_update_admin ON public.sped_contabil_arquivos;
CREATE POLICY sped_arquivos_update_admin ON public.sped_contabil_arquivos AS PERMISSIVE FOR UPDATE TO authenticated
  USING ((has_any_role((SELECT auth.uid()), ARRAY['admin','financeiro']::app_role[]) AND empresa_acessivel(empresa_id)))
  WITH CHECK ((has_any_role((SELECT auth.uid()), ARRAY['admin','financeiro']::app_role[]) AND empresa_acessivel(empresa_id)));
DROP POLICY IF EXISTS sped_contabil_update ON public.sped_contabil_arquivos;

COMMIT;
