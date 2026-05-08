-- 1. Fix Search Path for custom functions (Security Best Practice)
ALTER FUNCTION public.check_asaas_queue_failures() SET search_path = public;
ALTER FUNCTION public.get_asaas_payment_stats(UUID) SET search_path = public;
ALTER FUNCTION public.generate_reconciliation_suggestions(UUID, DATE, NUMERIC, TEXT) SET search_path = public;

-- 2. Tighten RLS for Credit Risk Analysis
-- Previous policy was too permissive (USING true)
DROP POLICY IF EXISTS "Users can view credit risk analysis" ON public.asaas_credit_risk_analysis;

CREATE POLICY "Users can view credit risk analysis of their customers" 
ON public.asaas_credit_risk_analysis 
FOR SELECT 
USING (
    cliente_id IN (
        SELECT id FROM public.clientes 
        WHERE empresa_id IN (SELECT id FROM public.empresas)
    )
);

-- 3. Audit trail RLS refinement
-- Ensure users can only see audit logs related to their companies
DROP POLICY IF EXISTS "Users can view audit trail" ON public.asaas_audit_trail;
CREATE POLICY "Users can view audit trail of their company" 
ON public.asaas_audit_trail FOR SELECT 
USING (
    payment_id IN (SELECT id FROM public.asaas_payments) OR 
    payment_id IS NULL -- Allow system logs for authorized users
);

-- 4. Scheduled Transfers RLS reinforcement
DROP POLICY IF EXISTS "Users can manage their scheduled transfers" ON public.asaas_scheduled_transfers;
CREATE POLICY "Users can manage their company scheduled transfers" 
ON public.asaas_scheduled_transfers FOR ALL 
USING (empresa_id IN (SELECT id FROM public.empresas));
