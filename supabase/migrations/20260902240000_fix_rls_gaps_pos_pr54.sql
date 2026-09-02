-- SECURITY FIX: gaps de RLS que sobreviveram ao PR #54 — achados por
-- auditoria adversarial de 5 agentes especializados coordenados nesta
-- sessão (2026-09-02), cada um verificado manualmente contra o código
-- fonte (grep + leitura direta) antes de entrar nesta migration.
--
-- Causa raiz destes 6 casos: o PR #54 corrigiu policies por NOME em cada
-- migration dedicada, mas quando uma tabela tinha MÚLTIPLAS gerações de
-- policy com nomes diferentes cobrindo o mesmo caso de uso (ex.: uma de
-- 2026-03 "Financeiro+ podem ver X" e outra mais nova "X_tenant_rw"), só
-- a mais recente foi capturada pela varredura — a mais antiga, ainda
-- viva e ainda PERMISSIVE (combina via OR), ficou para trás.

BEGIN;

-- ============ regua_cobranca ============
-- "Admins can manage regua" (20260518171156, recriada idêntica em
-- 20260825230000) nunca foi tocada — só "regua_cobranca_tenant_rw" e
-- "Admins e financeiros podem gerenciar régua de cobrança" foram
-- dropadas em 20260902200000 (Grupo C).
DROP POLICY IF EXISTS "Admins can manage regua" ON public.regua_cobranca;

-- ============ lancamentos_contabeis ============
-- "lanc_delete" (FOR DELETE, has_role admin, sem empresa_id) nunca foi
-- dropada — 20260902190000 (Grupo A) só pegou lanc_select/insert/update.
DROP POLICY IF EXISTS "lanc_delete" ON public.lancamentos_contabeis;

-- "Lancamentos scoped by empresa" (FOR ALL) tem o próprio bypass
-- embutido: "user_id=uid() OR has_role(admin) OR empresa_id IN (...)" —
-- o branch has_role(admin) NÃO está AND-ado ao escopo de empresa, então
-- neutraliza o isolamento sozinha, independente de lanc_delete. Reescreve
-- preservando user_id/role/empresa_acessivel, só corrigindo o agrupamento.
DROP POLICY IF EXISTS "Lancamentos scoped by empresa" ON public.lancamentos_contabeis;
CREATE POLICY "Lancamentos scoped by empresa" ON public.lancamentos_contabeis
  AS PERMISSIVE FOR ALL TO authenticated
  USING (
    empresa_acessivel(empresa_id)
    AND (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role) OR empresa_id IN (
      SELECT ue.empresa_id FROM public.user_empresas ue WHERE ue.user_id = auth.uid() AND ue.ativo = true
    ))
  )
  WITH CHECK (
    empresa_acessivel(empresa_id)
    AND (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role) OR empresa_id IN (
      SELECT ue.empresa_id FROM public.user_empresas ue WHERE ue.user_id = auth.uid() AND ue.ativo = true
    ))
  );

-- ============ centros_custo / parcelas_acordo ============
-- "Financeiro+ podem ver X" (20260314213748, FOR SELECT, sem empresa_id)
-- é NOME DIFERENTE de "Financeiro+ can manage X" / "*_tenant_rw", já
-- dropadas em 20260902140000/150000 — geração mais antiga sobrevivente.
DROP POLICY IF EXISTS "Financeiro+ podem ver centros_custo" ON public.centros_custo;
DROP POLICY IF EXISTS "Financeiro+ podem ver parcelas_acordo" ON public.parcelas_acordo;

-- ============ historico_conciliacao_ia ============
-- Sem empresa_id direto — escopa via conta_pagar_id/conta_receber_id
-- (mutuamente exclusivos por tipo_lancamento, mas a policy antiga não
-- validava nenhum dos dois).
DROP POLICY IF EXISTS "Financeiro+ podem ver historico_conciliacao_ia" ON public.historico_conciliacao_ia;
CREATE POLICY "Financeiro+ podem ver historico_conciliacao_ia"
  ON public.historico_conciliacao_ia FOR SELECT TO authenticated
  USING (
    has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[])
    AND (
      (conta_pagar_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.contas_pagar cp WHERE cp.id = conta_pagar_id AND empresa_acessivel(cp.empresa_id)
      ))
      OR (conta_receber_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.contas_receber cr WHERE cr.id = conta_receber_id AND empresa_acessivel(cr.empresa_id)
      ))
    )
  );

DROP POLICY IF EXISTS "Financeiro+ podem inserir historico_conciliacao_ia" ON public.historico_conciliacao_ia;
CREATE POLICY "Financeiro+ podem inserir historico_conciliacao_ia"
  ON public.historico_conciliacao_ia FOR INSERT TO authenticated
  WITH CHECK (
    has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[])
    AND (
      (conta_pagar_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.contas_pagar cp WHERE cp.id = conta_pagar_id AND empresa_acessivel(cp.empresa_id)
      ))
      OR (conta_receber_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.contas_receber cr WHERE cr.id = conta_receber_id AND empresa_acessivel(cr.empresa_id)
      ))
    )
  );

-- ============ 12 tabelas tributárias (Reforma Tributária) ============
-- Migration 20260314212617 criou, via loop EXECUTE format(...), 4
-- policies por tabela (SELECT/INSERT/UPDATE/DELETE) só com
-- has_any_role/has_role — nunca tocadas por nenhuma migration de
-- setembro (confirmado: zero ocorrência dos nomes de policy nos fixes
-- do PR #54). Todas as 12 têm empresa_id NOT NULL desde a criação
-- (20260106105751/111021/112335, 20260728160259).
DO $$
DECLARE
  t text;
  tables text[] := ARRAY['apuracoes_tributarias','operacoes_tributaveis','creditos_tributarios',
    'split_payment_transacoes','regimes_especiais_empresa','apuracoes_irpj_csll',
    'prejuizos_fiscais','lalur_lancamentos','incentivos_fiscais','retencoes_fonte',
    'darfs','per_dcomp'];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Financeiro+ podem ver %1$s" ON public.%1$I', t);
    EXECUTE format(
      'CREATE POLICY "Financeiro+ podem ver %1$s" ON public.%1$I FOR SELECT TO authenticated USING (has_any_role(auth.uid(), ARRAY[''admin'',''financeiro'']::app_role[]) AND empresa_acessivel(empresa_id))',
      t
    );

    EXECUTE format('DROP POLICY IF EXISTS "Financeiro+ podem inserir %1$s" ON public.%1$I', t);
    EXECUTE format(
      'CREATE POLICY "Financeiro+ podem inserir %1$s" ON public.%1$I FOR INSERT TO authenticated WITH CHECK (has_any_role(auth.uid(), ARRAY[''admin'',''financeiro'']::app_role[]) AND empresa_acessivel(empresa_id))',
      t
    );

    EXECUTE format('DROP POLICY IF EXISTS "Financeiro+ podem atualizar %1$s" ON public.%1$I', t);
    EXECUTE format(
      'CREATE POLICY "Financeiro+ podem atualizar %1$s" ON public.%1$I FOR UPDATE TO authenticated USING (has_any_role(auth.uid(), ARRAY[''admin'',''financeiro'']::app_role[]) AND empresa_acessivel(empresa_id)) WITH CHECK (has_any_role(auth.uid(), ARRAY[''admin'',''financeiro'']::app_role[]) AND empresa_acessivel(empresa_id))',
      t
    );

    EXECUTE format('DROP POLICY IF EXISTS "Admin pode deletar %1$s" ON public.%1$I', t);
    EXECUTE format(
      'CREATE POLICY "Admin pode deletar %1$s" ON public.%1$I FOR DELETE TO authenticated USING (has_role(auth.uid(), ''admin''::app_role) AND empresa_acessivel(empresa_id))',
      t
    );
  END LOOP;
END$$;

-- ============ pagamentos_recorrentes ============
-- INSERT ("Usuários podem criar pagamentos recorrentes", 20251224130327)
-- só checava auth.uid() = created_by, sem empresa_acessivel(empresa_id) —
-- nunca tocado pelo fix de DELETE/SELECT/UPDATE em 20260902210000. Como
-- policies permissivas combinam via OR, qualquer authenticated inseria
-- pagamento recorrente com empresa_id de outra empresa (achado do
-- coderabbitai).
DROP POLICY IF EXISTS "Usuários podem criar pagamentos recorrentes" ON public.pagamentos_recorrentes;
CREATE POLICY "Usuários podem criar pagamentos recorrentes"
  ON public.pagamentos_recorrentes FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by AND empresa_acessivel(empresa_id));

DROP POLICY IF EXISTS "Operacional+ podem ver pagamentos_recorrentes" ON public.pagamentos_recorrentes;
CREATE POLICY "Operacional+ podem ver pagamentos_recorrentes"
  ON public.pagamentos_recorrentes FOR SELECT TO authenticated
  USING (has_any_role(auth.uid(), ARRAY['admin','financeiro','operacional']::app_role[]) AND empresa_acessivel(empresa_id));

DROP POLICY IF EXISTS "Financeiro+ podem atualizar pagamentos_recorrentes" ON public.pagamentos_recorrentes;
CREATE POLICY "Financeiro+ podem atualizar pagamentos_recorrentes"
  ON public.pagamentos_recorrentes FOR UPDATE TO authenticated
  USING (has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[]) AND empresa_acessivel(empresa_id))
  WITH CHECK (has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[]) AND empresa_acessivel(empresa_id));

COMMIT;

INSERT INTO supabase_migrations.schema_migrations(version,name)
VALUES('20260902240000','fix_rls_gaps_pos_pr54')
ON CONFLICT (version) DO NOTHING;
