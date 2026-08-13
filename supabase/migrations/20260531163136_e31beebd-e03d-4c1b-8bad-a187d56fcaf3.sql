-- Grant permissions to core tables
DO $$
DECLARE
    t text;
    tables_to_grant text[] := ARRAY[
        'contas_pagar', 'contas_receber', 'clientes', 'fornecedores', 
        'empresas', 'categorias', 'centros_custo', 'profiles', 
        'user_roles', 'role_permissions', 'permissions', 'active_tracking',
        'alertas', 'alert_configurations', 'anomalias_detectadas', 
        'conciliacoes', 'contas_bancarias', 'contratos', 'extrato_bancario', 
        'faturamento_mensal', 'formas_pagamento', 'notas_fiscais', 
        'plano_contas', 'transacoes_bancarias', 'vendedores',
        'metas_financeiras', 'user_onboarding_progress'
    ];
BEGIN
    FOR t IN SELECT unnest(tables_to_grant)
    LOOP
        -- Check if table exists before granting
        IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = t) THEN
            EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
            EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
        END IF;
    END LOOP;
END;
$$;