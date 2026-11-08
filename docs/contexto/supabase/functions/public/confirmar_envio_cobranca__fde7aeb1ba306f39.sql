CREATE OR REPLACE FUNCTION public.confirmar_envio_cobranca(p_fila_id uuid, p_provider text DEFAULT NULL::text, p_provider_message_id text DEFAULT NULL::text, p_sucesso boolean DEFAULT true, p_erro text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
    UPDATE public.fila_cobrancas
    SET 
        status = CASE WHEN p_sucesso THEN 'enviado' ELSE 'falhou' END,
        provider = p_provider,
        updated_at = now()
    WHERE id = p_fila_id;

    INSERT INTO public.historico_cobranca (
        empresa_id,
        fila_id,
        provider,
        provider_message_id,
        status,
        mensagem,
        created_at
    )
    SELECT 
        empresa_id,
        id,
        p_provider,
        p_provider_message_id,
        CASE WHEN p_sucesso THEN 'enviado' ELSE 'falhou' END,
        p_erro,
        now()
    FROM public.fila_cobrancas
    WHERE id = p_fila_id;
END;
$function$
