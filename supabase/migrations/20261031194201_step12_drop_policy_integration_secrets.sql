-- Step 12: Remover policy permissiva duplicada em integration_secrets
-- Mantém apenas a RESTRICTIVE policy integration_secrets_no_client_access
DROP POLICY IF EXISTS admin_only_integration_secrets ON public.integration_secrets;
