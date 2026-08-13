CREATE OR REPLACE FUNCTION public.get_retencoes_pendentes_count(p_empresa_id UUID)
RETURNS BIGINT AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)
        FROM public.retencoes_fonte
        WHERE empresa_id = p_empresa_id
          AND status = 'pendente'
          AND darf_gerado = false
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
