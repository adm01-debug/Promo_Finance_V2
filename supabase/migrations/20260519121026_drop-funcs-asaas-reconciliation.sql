-- Shim: remove funções antes de 20260519121027
-- que faz CREATE OR REPLACE mudando tipo de retorno (42P13)
DROP FUNCTION IF EXISTS public.get_asaas_payment_stats(UUID);
DROP FUNCTION IF EXISTS public.generate_reconciliation_suggestions(UUID);
DROP FUNCTION IF EXISTS public.export_asaas_audit_csv(UUID);
