CREATE OR REPLACE FUNCTION public.registrar_auditoria_config(
    _tipo_acao TEXT,
    _empresa_id UUID DEFAULT NULL,
    _detalhes JSONB DEFAULT '{}'::jsonb
) RETURNS VOID AS $$
DECLARE
    v_user_id UUID;
BEGIN
    v_user_id := auth.uid();
    
    INSERT INTO public.audit_logs (
        user_id,
        action,
        table_name,
        details,
        new_data,
        created_at
    ) VALUES (
        v_user_id,
        _tipo_acao,
        'config_change',
        'Config change for empresa ' || COALESCE(_empresa_id::text, 'global'),
        _detalhes,
        now()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.registrar_auditoria_config TO authenticated;
