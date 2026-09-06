-- SECURITY FIX: policies RLS "tautológicas" — variante diferente do padrão
-- has_role-sem-empresa já corrigido nas migrations anteriores. Aqui a
-- condição É sobre empresa_id, mas de forma que sempre avalia verdadeiro:
--   USING (empresa_id IN (SELECT id FROM public.empresas))
-- "SELECT id FROM empresas" retorna o ID de TODAS as empresas cadastradas
-- (sem filtro nenhum), então a condição é satisfeita por qualquer
-- empresa_id válido — equivale a não ter policy nenhuma. Mesmo padrão em
-- asaas_audit_trail (payment_id IN (SELECT id FROM asaas_payments), sem
-- checar dono do payment) e asaas_credit_risk_analysis (mesma tautologia
-- aninhada dentro de um subselect em clientes).
--
-- Onde já existe uma policy irmã com EXATAMENTE o mesmo comando e a mesma
-- amplitude de role (nenhuma) já corretamente escopada por
-- empresa_acessivel/user_empresas, a solta é removida (duplicata). Nos
-- demais casos, a condição é reescrita no lugar preservando a amplitude de
-- role original (nenhuma delas tinha checagem de role — corrigir isso
-- seria mudança de comportamento além do escopo desta correção).

BEGIN;

-- asaas_config: sem policy irmã de SELECT/INSERT/UPDATE sem-role — reescreve as 3
DROP POLICY IF EXISTS "Users can view their own company asaas config" ON public.asaas_config;
CREATE POLICY "Users can view their own company asaas config" ON public.asaas_config
  FOR SELECT USING (empresa_acessivel(empresa_id));

DROP POLICY IF EXISTS "Users can update their own company asaas config" ON public.asaas_config;
CREATE POLICY "Users can update their own company asaas config" ON public.asaas_config
  FOR UPDATE USING (empresa_acessivel(empresa_id));

DROP POLICY IF EXISTS "Users can insert their own company asaas config" ON public.asaas_config;
CREATE POLICY "Users can insert their own company asaas config" ON public.asaas_config
  FOR INSERT WITH CHECK (empresa_acessivel(empresa_id));

-- asaas_transfers: SELECT já tem irmã idêntica (asaas_transfers_empresa_select) -> DROP.
-- INSERT/UPDATE não têm irmã sem-role equivalente -> reescreve.
DROP POLICY IF EXISTS "Users can view transfers of their company" ON public.asaas_transfers;

DROP POLICY IF EXISTS "Admins can insert transfers" ON public.asaas_transfers;
CREATE POLICY "Admins can insert transfers" ON public.asaas_transfers
  FOR INSERT WITH CHECK (empresa_acessivel(empresa_id));

DROP POLICY IF EXISTS "Admins can update transfers" ON public.asaas_transfers;
CREATE POLICY "Admins can update transfers" ON public.asaas_transfers
  FOR UPDATE USING (empresa_acessivel(empresa_id));

-- asaas_reconciliation_suggestions: SELECT já tem irmã idêntica
-- (asaas_recon_empresa_select) -> DROP.
DROP POLICY IF EXISTS "Users can view suggestions of their company" ON public.asaas_reconciliation_suggestions;

-- asaas_scheduled_transfers: sem policy irmã -> reescreve (só o nome vigente,
-- "Users can manage their scheduled transfers" já foi renomeado/dropado em
-- 20260508184054 para este).
DROP POLICY IF EXISTS "Users can manage their company scheduled transfers" ON public.asaas_scheduled_transfers;
CREATE POLICY "Users can manage their company scheduled transfers" ON public.asaas_scheduled_transfers
  FOR ALL USING (empresa_acessivel(empresa_id));

-- asaas_credit_risk_analysis: tautologia aninhada via clientes -> reescreve
-- preservando o join, só troca o filtro interno.
DROP POLICY IF EXISTS "Users can view credit risk analysis of their customers" ON public.asaas_credit_risk_analysis;
CREATE POLICY "Users can view credit risk analysis of their customers"
  ON public.asaas_credit_risk_analysis
  FOR SELECT
  USING (
    cliente_id IN (
      SELECT id FROM public.clientes
      WHERE empresa_acessivel(empresa_id)
    )
  );

-- asaas_audit_trail: 3 policies problemáticas coexistindo com a irmã
-- corretamente escopada asaas_audit_tenant_select (admin-only, via join em
-- asaas_payments). "Permitir leitura..." é USING(true) puro (pior caso:
-- nenhuma condição, nem tautológica); "...of their company" usa a mesma
-- tautologia via asaas_payments; "asaas_audit_admin_all" é FOR ALL só com
-- has_role(admin), sem empresa, cobrindo INSERT/UPDATE/DELETE sem escopo.
DROP POLICY IF EXISTS "Permitir leitura da auditoria para autenticados" ON public.asaas_audit_trail;
CREATE POLICY "Permitir leitura da auditoria para autenticados" ON public.asaas_audit_trail
  FOR SELECT TO authenticated
  USING (payment_id IN (SELECT p.id FROM public.asaas_payments p WHERE empresa_acessivel(p.empresa_id)));

DROP POLICY IF EXISTS "Users can view audit trail of their company" ON public.asaas_audit_trail;
CREATE POLICY "Users can view audit trail of their company" ON public.asaas_audit_trail
  FOR SELECT
  USING (
    payment_id IN (SELECT p.id FROM public.asaas_payments p WHERE empresa_acessivel(p.empresa_id))
    OR payment_id IS NULL
  );

DROP POLICY IF EXISTS asaas_audit_admin_all ON public.asaas_audit_trail;
CREATE POLICY asaas_audit_admin_all ON public.asaas_audit_trail AS PERMISSIVE FOR ALL TO authenticated
  USING (has_role((SELECT auth.uid()), 'admin'::app_role) AND payment_id IN (SELECT p.id FROM public.asaas_payments p WHERE empresa_acessivel(p.empresa_id)))
  WITH CHECK (has_role((SELECT auth.uid()), 'admin'::app_role) AND payment_id IN (SELECT p.id FROM public.asaas_payments p WHERE empresa_acessivel(p.empresa_id)));

-- elisao_simulacoes_regime / elisao_analise_gap / elisao_creditos_auditoria /
-- elisao_tarefas_acionaveis: sem policy irmã -> reescreve as 4.
DROP POLICY IF EXISTS "Users can manage their company simulations" ON public.elisao_simulacoes_regime;
CREATE POLICY "Users can manage their company simulations" ON public.elisao_simulacoes_regime
  FOR ALL USING (empresa_acessivel(empresa_id));

DROP POLICY IF EXISTS "Users can view their company gap analysis" ON public.elisao_analise_gap;
CREATE POLICY "Users can view their company gap analysis" ON public.elisao_analise_gap
  FOR SELECT USING (empresa_acessivel(empresa_id));

DROP POLICY IF EXISTS "Users can manage company audit logs" ON public.elisao_creditos_auditoria;
CREATE POLICY "Users can manage company audit logs" ON public.elisao_creditos_auditoria
  FOR ALL USING (empresa_acessivel(empresa_id));

DROP POLICY IF EXISTS "Users can manage company action tasks" ON public.elisao_tarefas_acionaveis;
CREATE POLICY "Users can manage company action tasks" ON public.elisao_tarefas_acionaveis
  FOR ALL USING (empresa_acessivel(empresa_id));

COMMIT;

INSERT INTO supabase_migrations.schema_migrations(version,name)
VALUES('20260902230000','fix_rls_tautologia_empresas_asaas_elisao')
ON CONFLICT (version) DO NOTHING;
