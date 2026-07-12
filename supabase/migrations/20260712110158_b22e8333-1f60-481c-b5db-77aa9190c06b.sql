-- Item 29: Consolidar sobrecargas duplicadas (stubs vazios) de generate_reconciliation_suggestions
-- Mantém apenas a assinatura real usada pelo frontend: (p_empresa_id, p_transaction_date, p_transaction_value, p_transaction_id)
DROP FUNCTION IF EXISTS public.generate_reconciliation_suggestions(uuid);
DROP FUNCTION IF EXISTS public.generate_reconciliation_suggestions(uuid, uuid);
DROP FUNCTION IF EXISTS public.generate_reconciliation_suggestions(uuid, uuid, date);

INSERT INTO public.audit_logs (action, table_name, details, user_id, created_at)
VALUES ('function_overloads_consolidated', 'pg_proc',
        'Removidas 3 sobrecargas stub de generate_reconciliation_suggestions; mantida assinatura real (uuid,date,numeric,uuid)',
        NULL, now());