-- SECURITY FIX: achado real do cubic-dev-ai no PR #55 sobre a migration
-- 20260902240000 — as policies de historico_conciliacao_ia usavam
-- "(conta_pagar_id ... empresa_acessivel) OR (conta_receber_id ... empresa_acessivel)"
-- sem exigir qual das duas colunas é a relevante para o registro. A tabela
-- não tem CHECK amarrando tipo_lancamento à coluna populada (ambas são
-- nullable, nada impede as duas estarem preenchidas ao mesmo tempo) —
-- um registro com conta_pagar_id da empresa A e conta_receber_id da
-- empresa B fica visível/gravável por usuários de QUALQUER uma das duas,
-- mesmo que a referência relevante (via tipo_lancamento) seja só uma.
-- Corrige amarrando cada branch ao tipo_lancamento do registro.

BEGIN;

DROP POLICY IF EXISTS "Financeiro+ podem ver historico_conciliacao_ia" ON public.historico_conciliacao_ia;
CREATE POLICY "Financeiro+ podem ver historico_conciliacao_ia"
  ON public.historico_conciliacao_ia FOR SELECT TO authenticated
  USING (
    has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[])
    AND (
      (tipo_lancamento = 'pagar' AND conta_pagar_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.contas_pagar cp WHERE cp.id = conta_pagar_id AND empresa_acessivel(cp.empresa_id)
      ))
      OR (tipo_lancamento = 'receber' AND conta_receber_id IS NOT NULL AND EXISTS (
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
      (tipo_lancamento = 'pagar' AND conta_pagar_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.contas_pagar cp WHERE cp.id = conta_pagar_id AND empresa_acessivel(cp.empresa_id)
      ))
      OR (tipo_lancamento = 'receber' AND conta_receber_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.contas_receber cr WHERE cr.id = conta_receber_id AND empresa_acessivel(cr.empresa_id)
      ))
    )
  );

COMMIT;

INSERT INTO supabase_migrations.schema_migrations(version,name)
VALUES('20260902260000','fix_historico_conciliacao_ia_or_bypass')
ON CONFLICT (version) DO NOTHING;
