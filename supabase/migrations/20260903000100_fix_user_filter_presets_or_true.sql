-- Corrige a policy users_own_presets de public.user_filter_presets.
--
-- A otimização initplan (20260825230000_initplan_rls_e67.sql, linha 800)
-- recriou a policy com USING ((user_id = (SELECT auth.uid())) OR true) —
-- o "OR true" é tautologia: abria os presets de TODOS os usuários (e o
-- FOR ALL sem WITH CHECK herdava o USING aberto também para escrita)
-- a qualquer sessão authenticated.
--
-- Achado do replay local das 571 migrations (auditoria R2, apêndice R2.3;
-- evidência em docs/evidencias/replay-2026-09-03/). Restaura o escopo
-- dono-somente, agora com WITH CHECK explícito.

DROP POLICY IF EXISTS users_own_presets ON public.user_filter_presets;

CREATE POLICY users_own_presets ON public.user_filter_presets
  AS PERMISSIVE
  FOR ALL
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));
