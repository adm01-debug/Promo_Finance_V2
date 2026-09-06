-- Migration 20260903000200
-- PROBLEMA: migration 20260902190000 removeu a policy SELECT de alertas_preditivos
-- mas migration 20260902210000 só criou INSERT e UPDATE — sem SELECT.
-- Resultado: RLS habilitado + sem SELECT = fail-closed. Usuários não veem seus alertas.
-- FIX: recriar SELECT scoped por empresa_acessivel.

BEGIN;

CREATE POLICY "alertas_preditivos_select_empresa"
  ON public.alertas_preditivos
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING (empresa_acessivel(empresa_id));

COMMIT;
