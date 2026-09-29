-- Shim: remove políticas de user_action_audit antes de 20260519134956
-- que tenta CREATE POLICY já existente desde 20260508114653 (42710)
DROP POLICY IF EXISTS "Users can view their own audit logs" ON public.user_action_audit;
DROP POLICY IF EXISTS "System can insert audit logs" ON public.user_action_audit;
