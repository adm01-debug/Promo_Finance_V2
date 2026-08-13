CREATE OR REPLACE FUNCTION public.detectar_duplicidades_financeiras(p_empresa_id UUID, p_tabela TEXT)
RETURNS TABLE (valor NUMERIC, data_vencimento DATE, numero_documento TEXT, total_ocorrencias BIGINT) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF p_tabela = 'contas_pagar' THEN
        RETURN QUERY
        SELECT cp.valor, cp.data_vencimento, cp.numero_documento, COUNT(*) as occurrences
        FROM public.contas_pagar cp
        WHERE cp.empresa_id = p_empresa_id
          AND cp.status != 'cancelado'
          AND cp.numero_documento IS NOT NULL
        GROUP BY cp.valor, cp.data_vencimento, cp.numero_documento
        HAVING COUNT(*) > 1;
    ELSIF p_tabela = 'contas_receber' THEN
        RETURN QUERY
        SELECT cr.valor, cr.data_vencimento, cr.numero_documento, COUNT(*) as occurrences
        FROM public.contas_receber cr
        WHERE cr.empresa_id = p_empresa_id
          AND cr.status != 'cancelado'
          AND cr.numero_documento IS NOT NULL
        GROUP BY cr.valor, cr.data_vencimento, cr.numero_documento
        HAVING COUNT(*) > 1;
    END IF;
END;
$$;
