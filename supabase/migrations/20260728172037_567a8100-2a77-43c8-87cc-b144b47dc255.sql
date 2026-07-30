-- ============================================================================
-- GAP #21 — Blindagem da trilha de auditoria contra forja e flood anônimo
-- ----------------------------------------------------------------------------
-- ACHADO: a política de INSERT em public.audit_logs era `TO public WITH CHECK
-- (true)`. Como `public` inclui o papel `anon`, QUALQUER pessoa com a chave
-- publicável (que é pública por natureza, embutida no bundle do frontend)
-- podia:
--   1. inserir registros de auditoria arbitrários (flood / poluição forense);
--   2. ATRIBUIR uma ação a outro usuário, preenchendo user_id e user_email
--      com a identidade de terceiros — destruindo o valor probatório da
--      trilha, que é justamente o artefato usado para investigar incidentes.
--
-- CONTEXTO VERIFICADO ANTES DA MUDANÇA:
--   * audit_trigger_generic(), log_audit() e log_sso_onboarding_event() são
--     SECURITY DEFINER  -> ignoram RLS, não são afetadas.
--   * As 15 gravações em Edge Functions usam service_role -> ignoram RLS.
--   * As 2 gravações do frontend (AuditLogs.tsx / ConviteUsuarioDialog.tsx)
--     sempre preenchem user_id com auth.uid() e user_email com o próprio
--     e-mail -> continuam funcionando sob a nova cláusula.
-- ============================================================================

DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;

CREATE POLICY "audit_logs_insert_self_attributed"
  ON public.audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- A autoria não pode ser forjada: o registro precisa apontar para quem
    -- de fato está autenticado na requisição.
    user_id = (SELECT auth.uid())
    -- E o e-mail, quando informado, precisa bater com o do próprio token.
    AND (
      user_email IS NULL
      OR user_email = (SELECT auth.jwt() ->> 'email')
    )
  );

-- Defesa em profundidade: o papel anônimo não tem qualquer motivo para
-- escrever, alterar ou remover a trilha de auditoria.
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.audit_logs FROM anon;
-- A trilha é append-only para o cliente: nem mesmo o usuário autenticado
-- pode reescrever ou apagar o próprio rastro.
REVOKE UPDATE, DELETE, TRUNCATE ON public.audit_logs FROM authenticated;

GRANT SELECT, INSERT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;