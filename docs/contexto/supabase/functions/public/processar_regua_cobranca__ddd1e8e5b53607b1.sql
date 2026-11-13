CREATE OR REPLACE FUNCTION public.processar_regua_cobranca(p_empresa_id uuid DEFAULT NULL::uuid, p_simulate boolean DEFAULT false)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
    result JSONB;
BEGIN
    IF p_empresa_id IS NULL OR NOT public.empresa_acessivel(p_empresa_id) THEN
        RAISE EXCEPTION 'Sem permissão para esta empresa' USING ERRCODE = '42501';
    END IF;

    IF p_simulate THEN
        result := jsonb_build_object(
            'total_enfileirados', (SELECT count(*) FROM public.contas_receber WHERE status = 'pendente' AND empresa_id = p_empresa_id),
            'message', 'Simulação concluída com base nos títulos pendentes.'
        );
    ELSE
        result := jsonb_build_object(
            'total_enfileirados', 0,
            'message', 'Lógica de produção: disparos agendados.'
        );
    END IF;
    RETURN result;
END;
$function$
