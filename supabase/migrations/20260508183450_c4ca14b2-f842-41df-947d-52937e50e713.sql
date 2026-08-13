-- Grant necessary permissions for audit logging context
COMMENT ON COLUMN public.asaas_audit_trail.payment_id IS 'ID do pagamento relacionado. Pode ser nulo para eventos globais ou de transferências.';

-- Ensure user context is always captured if available
ALTER TABLE public.asaas_audit_trail 
ALTER COLUMN user_id SET DEFAULT auth.uid();
