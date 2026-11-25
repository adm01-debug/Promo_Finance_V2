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

DROP POLICY IF EXISTS "Admin/financeiro can update creditos auditoria" ON public.elisao_creditos_auditoria

CREATE POLICY "Admin/financeiro can update creditos auditoria" ON public.elisao_creditos_auditoria
  FOR UPDATE
  TO authenticated
  USING (has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role]) AND empresa_acessivel(empresa_id))
  WITH CHECK (has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role]) AND empresa_acessivel(empresa_id))

-- A policy permissiva de oportunidades_elisao foi removida do banco pelo
-- endurecimento, mas as migrations de reconciliacao
-- (20260825100000_reconciliar_schema_completo.sql e
-- 20260825110000_reconciliar_schema_v3_completo.sql) ainda a recriam. Sem este
-- DROP, um `supabase db reset` / reapply do zero termina com a policy
-- permissiva de volta (ALL para qualquer um com empresa_acessivel), anulando o
-- endurecimento.
DROP POLICY IF EXISTS oportunidades_elisao_acesso ON public.oportunidades_elisao

-- O mesmo vale para a tabela desta migration: "Users can manage company audit
-- logs" e FOR ALL permissiva, recriada por 20260902230000 e conferida (por
-- existencia) em 20261102000000. Policies permissivas sao combinadas por OR,
-- entao enquanto ela existir a policy de UPDATE acima e irrelevante: qualquer
-- usuario com empresa_acessivel escreve na auditoria. O endurecimento a
-- removeu do banco de producao fora das migrations; sem este DROP um reapply do
-- zero a revive (achado do Devin Review na PR #546). A conferencia de
-- 20261102000000 roda antes desta migration (2026-11-02 < 2026-11-24), entao o
-- DROP nao quebra o reapply.
DROP POLICY IF EXISTS "Users can manage company audit logs" ON public.elisao_creditos_auditoria

-- A policy sozinha nao devolve a escrita: 20260728205758 revoga UPDATE de
-- `authenticated` nesta tabela (defesa em profundidade, para uma policy futura
-- mal escrita nao reabrir o caminho sozinha). Sem o GRANT o fluxo continuaria
-- quebrado, agora com erro de privilegio em vez de zero linhas silencioso.
-- O grant e por coluna: `decidirCredito` (useOportunidadesElisao.ts) escreve
-- exatamente estas quatro, e valor/empresa/nota seguem imutaveis pelo cliente
-- mesmo que apareca uma policy permissiva.
GRANT UPDATE (status_aprovacao, motivo_rejeicao, aprovador_id, data_aprovacao)
  ON public.elisao_creditos_auditoria TO authenticated

-- O GRANT devolve a escrita, mas `aprovador_id` e `data_aprovacao` chegariam do
-- payload: `decidirCredito` envia `user?.id` e `new Date().toISOString()`
-- (src/hooks/useOportunidadesElisao.ts:293-294) e pode ser chamado sobre uma
-- linha ja decidida. Com o GRANT por coluna, um admin/financeiro conseguiria
-- reescrever quem aprovou e quando uma linha ja decidida — e o gatilho de
-- historico nao registra isso, porque so grava mudanca de `status_aprovacao`
-- (achado do Devin Review na PR #546).
--
-- O gatilho existente passa a derivar as duas colunas do banco, com o mesmo
-- `auth.uid()`/`now()` que ele ja usa no historico, e a congelá-las quando o
-- status nao muda: autoria e data so mudam junto com a decisao.
CREATE OR REPLACE FUNCTION public.registrar_decisao_elisao()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status_aprovacao IS NOT DISTINCT FROM OLD.status_aprovacao THEN
        -- Mesma decisao: autoria e data ficam como estao.
        NEW.aprovador_id := OLD.aprovador_id;
        NEW.data_aprovacao := OLD.data_aprovacao;
    ELSIF NEW.status_aprovacao = 'pendente' THEN
        -- Reaberta: nao ha decisao para atribuir.
        NEW.aprovador_id := NULL;
        NEW.data_aprovacao := NULL;
    ELSE
        -- Decisao nova: quem e quando vem da sessao, nao do payload.
        NEW.aprovador_id := COALESCE(auth.uid(), NEW.aprovador_id);
        NEW.data_aprovacao := now();
    END IF;

    IF TG_OP = 'UPDATE' AND NEW.status_aprovacao IS DISTINCT FROM OLD.status_aprovacao THEN
        NEW.historico_decisoes = COALESCE(OLD.historico_decisoes, '[]'::jsonb) || jsonb_build_object(
            'status', NEW.status_aprovacao,
            'usuario_id', auth.uid(),
            'data', now(),
            'comentario', NEW.motivo_rejeicao
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql

-- O endurecimento de RLS tambem removeu o gatilho da trilha: a funcao acima nao
-- existia mais em producao em 2026-11-24 (o gate do CI acusou
-- "function public.registrar_decisao_elisao() does not exist"), e sem funcao o
-- gatilho que a usava tambem nao esta la. Recriar so a funcao deixaria a coluna
-- historico_decisoes sem nenhuma gravacao: a decisao de credito persistiria sem
-- autoria registrada. Idempotente para sobreviver a um reapply do zero.
DROP TRIGGER IF EXISTS tr_registrar_decisao_elisao ON public.elisao_creditos_auditoria

CREATE TRIGGER tr_registrar_decisao_elisao
BEFORE UPDATE ON public.elisao_creditos_auditoria
FOR EACH ROW
EXECUTE FUNCTION public.registrar_decisao_elisao()
