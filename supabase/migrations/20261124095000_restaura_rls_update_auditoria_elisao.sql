-- Restaura a policy de UPDATE de public.elisao_creditos_auditoria.
--
-- O endurecimento de RLS aplicado no projeto removeu a policy permissiva
-- "Users can manage company audit logs" (FOR ALL USING empresa_acessivel) e a
-- substituiu por tres policies especificas: SELECT, INSERT e DELETE
-- (creditos_auditoria_select / _insert / _delete_admin). Nenhuma delas cobre
-- UPDATE, entao a tabela ficou sem nenhuma policy de UPDATE.
--
-- Efeito pratico: o PostgREST nao devolve erro em UPDATE bloqueado por RLS -
-- retorna zero linhas com `error: null`. O unico caminho de escrita dessa
-- tabela e o cliente (nao ha funcao/trigger que a atualize em migrations), e
-- `src/hooks/useOportunidadesElisao.ts` (decidirCredito) checa apenas `error`,
-- logo concluia que aprovava/rejeitava um credito que continuava com
-- status_aprovacao pendente, e ainda gravava a tarefa em
-- elisao_tarefas_acionaveis como se a decisao tivesse sido persistida.
--
-- Escopo alinhado com a tabela irma oportunidades_elisao (decisao de credito e
-- papel de admin/financeiro) e com o DELETE ja endurecido desta tabela:
-- admin/financeiro, restrito a empresa acessivel.

DROP POLICY IF EXISTS "Admin/financeiro can update creditos auditoria" ON public.elisao_creditos_auditoria;
CREATE POLICY "Admin/financeiro can update creditos auditoria" ON public.elisao_creditos_auditoria
  FOR UPDATE
  TO authenticated
  USING (has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role]) AND empresa_acessivel(empresa_id))
  WITH CHECK (has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role]) AND empresa_acessivel(empresa_id));

-- A policy permissiva de oportunidades_elisao foi removida do banco pelo
-- endurecimento, mas as migrations de reconciliacao
-- (20260825100000_reconciliar_schema_completo.sql e
-- 20260825110000_reconciliar_schema_v3_completo.sql) ainda a recriam. Sem este
-- DROP, um `supabase db reset` / reapply do zero termina com a policy
-- permissiva de volta (ALL para qualquer um com empresa_acessivel), anulando o
-- endurecimento.
DROP POLICY IF EXISTS oportunidades_elisao_acesso ON public.oportunidades_elisao;

-- O mesmo vale para a tabela desta migration: "Users can manage company audit
-- logs" e FOR ALL permissiva, recriada por 20260902230000 e conferida (por
-- existencia) em 20261102000000. Policies permissivas sao combinadas por OR,
-- entao enquanto ela existir a policy de UPDATE acima e irrelevante: qualquer
-- usuario com empresa_acessivel escreve na auditoria. O endurecimento a
-- removeu do banco de producao fora das migrations; sem este DROP um reapply do
-- zero a revive (achado do Devin Review na PR #546). A conferencia de
-- 20261102000000 roda antes desta migration (2026-11-02 < 2026-11-24), entao o
-- DROP nao quebra o reapply.
DROP POLICY IF EXISTS "Users can manage company audit logs" ON public.elisao_creditos_auditoria;