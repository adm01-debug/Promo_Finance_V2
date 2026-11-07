-- Step 12: DROP POLICY dead — remove policy obsoleta admin_only_integration_secrets
-- Verificado: a policy NÃO existe no banco (apenas integration_secrets_no_client_access existe).
-- DROP IF EXISTS é no-op seguro.

DROP POLICY IF EXISTS admin_only_integration_secrets ON integration_secrets;
