-- Reaplica GRANTs de public.audit_logs, frontend_error_logs e planos_acao
-- para a role authenticated, conforme declarado nas migrations do repo:
--   20260711164339 (audit_logs, frontend_error_logs)
--   20260728172037 (audit_logs)
--   20260728161227 (planos_acao)
-- Causa: prod perdeu esses GRANTs (drift); app recebia 403 no /rest/v1/audit_logs.
GRANT SELECT, INSERT ON public.audit_logs TO authenticated;
GRANT SELECT, INSERT ON public.frontend_error_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.planos_acao TO authenticated;
