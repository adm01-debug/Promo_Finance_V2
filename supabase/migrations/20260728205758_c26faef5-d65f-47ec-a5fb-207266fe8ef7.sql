-- ============================================================================
-- Gap #34 — trilhas de auditoria à prova de adulteração (anti-forensics)
-- ----------------------------------------------------------------------------
-- Contexto: as três tabelas abaixo são EVIDÊNCIA de ações financeiras/fiscais.
-- Todas usavam uma única policy `FOR ALL`, o que concede UPDATE e DELETE ao
-- mesmo principal que originou o fato registrado. Isso permite que o autor de
-- uma baixa indevida apague o próprio rastro — a trilha deixa de ter valor
-- probatório exatamente no cenário para o qual foi criada.
--
-- Remediação: quebrar o `FOR ALL` em verbos explícitos.
--   - SELECT/INSERT: mantidos idênticos (nenhuma regressão funcional).
--   - UPDATE: removido do cliente em todas as três (append-only).
--   - DELETE: admin-only na auditoria de créditos; inexistente para o cliente
--     nos dois logs financeiros (retenção roda via service_role/pg_cron, que
--     ignora RLS por construção).
-- ============================================================================

-- ---------------------------------------------------------------- 1/3
DROP POLICY IF EXISTS "creditos_auditoria_acesso" ON public.elisao_creditos_auditoria;

CREATE POLICY "creditos_auditoria_select"
  ON public.elisao_creditos_auditoria FOR SELECT TO authenticated
  USING (public.empresa_acessivel(empresa_id));

CREATE POLICY "creditos_auditoria_insert"
  ON public.elisao_creditos_auditoria FOR INSERT TO authenticated
  WITH CHECK (public.empresa_acessivel(empresa_id));

-- Expurgo de evidência exige papel administrativo E vínculo com a empresa:
-- admin de um inquilino não pode apagar trilha de outro.
CREATE POLICY "creditos_auditoria_delete_admin"
  ON public.elisao_creditos_auditoria FOR DELETE TO authenticated
  USING (
    public.has_role((SELECT auth.uid()), 'admin'::app_role)
    AND public.empresa_acessivel(empresa_id)
  );

-- ---------------------------------------------------------------- 2/3
DROP POLICY IF EXISTS "Owner manage logs_baixa" ON public.logs_baixa_automatica;

CREATE POLICY "logs_baixa_select_owner"
  ON public.logs_baixa_automatica FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "logs_baixa_insert_owner"
  ON public.logs_baixa_automatica FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- ---------------------------------------------------------------- 3/3
DROP POLICY IF EXISTS "logs_retro_owner_all" ON public.logs_conciliacao_retroativa;

CREATE POLICY "logs_retro_select_owner"
  ON public.logs_conciliacao_retroativa FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "logs_retro_insert_owner"
  ON public.logs_conciliacao_retroativa FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- ----------------------------------------------------------------------------
-- Privilégio: remover UPDATE/DELETE de `authenticated` nos dois logs onde o
-- cliente não tem mais nenhuma policy para esses verbos. Defesa em profundidade
-- (RLS já nega; o privilégio removido garante que uma policy futura mal escrita
-- não reabra o caminho sozinha).
-- ----------------------------------------------------------------------------
REVOKE UPDATE, DELETE ON public.logs_baixa_automatica FROM authenticated;
REVOKE UPDATE, DELETE ON public.logs_conciliacao_retroativa FROM authenticated;
REVOKE UPDATE ON public.elisao_creditos_auditoria FROM authenticated;

-- service_role permanece integralmente habilitado para retenção/expurgo.
GRANT ALL ON public.logs_baixa_automatica TO service_role;
GRANT ALL ON public.logs_conciliacao_retroativa TO service_role;
GRANT ALL ON public.elisao_creditos_auditoria TO service_role;