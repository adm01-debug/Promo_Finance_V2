-- ============================================================================
-- Gap #27 — Isolamento multi-inquilino: rescopo de políticas `TO public`
-- ----------------------------------------------------------------------------
-- Políticas criadas com `TO public` são avaliadas também para a identidade
-- `anon`. Quando o predicado depende de auth.uid() (ou de funções sem EXECUTE
-- para anon), o visitante recebe 401/42501 em vez de resultado vazio — a mesma
-- classe de bug corrigida no Gap #23. Aqui eliminamos o resíduo remanescente.
-- Semântica preservada: todos os predicados são recriados byte-a-byte.
-- ============================================================================

-- aprovacao_comentarios ------------------------------------------------------
-- Nota: coluna é "usuario_id" (criada em 20260509163954), não "user_id".
DROP POLICY IF EXISTS "Users can insert their own comments" ON public.aprovacao_comentarios;
CREATE POLICY "Users can insert their own comments" ON public.aprovacao_comentarios
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = usuario_id);

-- auth_logs ------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own auth logs" ON public.auth_logs;
CREATE POLICY "Users can view own auth logs" ON public.auth_logs
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- email_verifications --------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own verifications" ON public.email_verifications;
CREATE POLICY "Users can view own verifications" ON public.email_verifications
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- expert_conversations (duas políticas idênticas → consolidadas em uma) -------
DROP POLICY IF EXISTS "Usuários veem suas próprias conversas" ON public.expert_conversations;
DROP POLICY IF EXISTS "Users can manage their own conversations" ON public.expert_conversations;
CREATE POLICY "Users can manage their own conversations" ON public.expert_conversations
  FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- expert_messages ------------------------------------------------------------
DROP POLICY IF EXISTS "Users can insert messages to their conversations" ON public.expert_messages;
CREATE POLICY "Users can insert messages to their conversations" ON public.expert_messages
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.expert_conversations c
    WHERE c.id = expert_messages.conversation_id AND c.user_id = (SELECT auth.uid())
  ));

DROP POLICY IF EXISTS "Users can view messages from their conversations" ON public.expert_messages;
CREATE POLICY "Users can view messages from their conversations" ON public.expert_messages
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.expert_conversations c
    WHERE c.id = expert_messages.conversation_id AND c.user_id = (SELECT auth.uid())
  ));

DROP POLICY IF EXISTS "Usuários veem mensagens de suas conversas" ON public.expert_messages;
CREATE POLICY "Usuários veem mensagens de suas conversas" ON public.expert_messages
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.expert_conversations c
    WHERE c.id = expert_messages.conversation_id AND c.user_id = (SELECT auth.uid())
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.expert_conversations c
    WHERE c.id = expert_messages.conversation_id AND c.user_id = (SELECT auth.uid())
  ));

-- frontend_error_logs --------------------------------------------------------
-- Telemetria anônima é intencional (Gap #22/#25): mantemos anon, mas de forma
-- EXPLÍCITA em vez de herdada de `TO public`.
DROP POLICY IF EXISTS "frontend_error_user_insert" ON public.frontend_error_logs;
CREATE POLICY "frontend_error_user_insert" ON public.frontend_error_logs
  FOR INSERT TO anon, authenticated
  WITH CHECK (((SELECT auth.uid()) = user_id) OR user_id IS NULL);

-- open_finance_consents ------------------------------------------------------
DROP POLICY IF EXISTS "Users can manage their own consents" ON public.open_finance_consents;
CREATE POLICY "Users can manage their own consents" ON public.open_finance_consents
  FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- password_reset_tokens (duas políticas idênticas → consolidadas) -------------
-- Nota: tabela pode não existir em Preview (sem CREATE TABLE na history).
DO $ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'password_reset_tokens'
  ) THEN
    DROP POLICY IF EXISTS "Users can view own reset tokens" ON public.password_reset_tokens;
    DROP POLICY IF EXISTS "Users can select own reset tokens" ON public.password_reset_tokens;
    EXECUTE $$CREATE POLICY "Users can select own reset tokens" ON public.password_reset_tokens
      FOR SELECT TO authenticated
      USING ((SELECT auth.uid()) = user_id)$$;
  END IF;
END $;

-- permissions / role_permissions --------------------------------------------
DROP POLICY IF EXISTS "Anyone authenticated can view permissions" ON public.permissions;
CREATE POLICY "Anyone authenticated can view permissions" ON public.permissions
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS "Anyone authenticated can view role_permissions" ON public.role_permissions;
CREATE POLICY "Anyone authenticated can view role_permissions" ON public.role_permissions
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL);

-- user_action_audit ----------------------------------------------------------
DROP POLICY IF EXISTS "Users can insert their own audit logs" ON public.user_action_audit;
CREATE POLICY "Users can insert their own audit logs" ON public.user_action_audit
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can view their own audit logs" ON public.user_action_audit;
CREATE POLICY "Users can view their own audit logs" ON public.user_action_audit
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- user_demonstrativo_preferences ---------------------------------------------
DROP POLICY IF EXISTS "Users can manage their own preferences" ON public.user_demonstrativo_preferences;
CREATE POLICY "Users can manage their own preferences" ON public.user_demonstrativo_preferences
  FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- user_filter_presets --------------------------------------------------------
DROP POLICY IF EXISTS "Users can manage their presets" ON public.user_filter_presets;
CREATE POLICY "Users can manage their presets" ON public.user_filter_presets
  FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- user_onboarding_progress ---------------------------------------------------
DROP POLICY IF EXISTS "Users can insert their own onboarding progress" ON public.user_onboarding_progress;
CREATE POLICY "Users can insert their own onboarding progress" ON public.user_onboarding_progress
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update their own onboarding progress" ON public.user_onboarding_progress;
CREATE POLICY "Users can update their own onboarding progress" ON public.user_onboarding_progress
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can view their own onboarding progress" ON public.user_onboarding_progress;
CREATE POLICY "Users can view their own onboarding progress" ON public.user_onboarding_progress
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- webhook_simulation_* -------------------------------------------------------
DROP POLICY IF EXISTS "Users can view simulation results" ON public.webhook_simulation_results;
CREATE POLICY "Users can view simulation results" ON public.webhook_simulation_results
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.webhook_simulation_runs r
    WHERE r.id = webhook_simulation_results.run_id AND r.created_by = (SELECT auth.uid())
  ));

DROP POLICY IF EXISTS "Users can insert simulation runs" ON public.webhook_simulation_runs;
CREATE POLICY "Users can insert simulation runs" ON public.webhook_simulation_runs
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = created_by);

DROP POLICY IF EXISTS "Users can view simulation runs" ON public.webhook_simulation_runs;
CREATE POLICY "Users can view simulation runs" ON public.webhook_simulation_runs
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = created_by);
