CREATE OR REPLACE FUNCTION public.registrar_decisao_elisao()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    IF NEW.status_aprovacao IS NOT DISTINCT FROM OLD.status_aprovacao THEN
        -- Mesma decisao: autoria e data ficam como estao.
        NEW.aprovador_id := OLD.aprovador_id;
        NEW.data_aprovacao := OLD.data_aprovacao;
    ELSIF NEW.status_aprovacao = 'pendente' THEN
        -- Reaberta: nao ha decisao para atribuir.
        NEW.aprovador_id := NULL;
        NEW.data_aprovacao := NULL;
    ELSE
        -- Decisao nova: quem e quando vem da sessao, nao do payload.
        NEW.aprovador_id := COALESCE(auth.uid(), NEW.aprovador_id);
        NEW.data_aprovacao := now();
    END IF;

    IF TG_OP = 'UPDATE' AND NEW.status_aprovacao IS DISTINCT FROM OLD.status_aprovacao THEN
        NEW.historico_decisoes = COALESCE(OLD.historico_decisoes, '[]'::jsonb) || jsonb_build_object(
            'status', NEW.status_aprovacao,
            'usuario_id', auth.uid(),
            'data', now(),
            'comentario', NEW.motivo_rejeicao
        );
    END IF;
    RETURN NEW;
END;
$function$
