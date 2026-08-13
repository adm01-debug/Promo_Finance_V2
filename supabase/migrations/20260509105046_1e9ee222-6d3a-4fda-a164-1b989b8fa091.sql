-- Função para gerar alerta de bloqueio de duplicidade
CREATE OR REPLACE FUNCTION public.notificar_bloqueio_duplicidade()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id UUID;
    v_fornecedor TEXT;
BEGIN
    -- Tenta pegar o ID do usuário que gerou a tentativa, senão pega um admin/responsável
    v_user_id := COALESCE(NEW.usuario_id, (SELECT id FROM auth.users LIMIT 1));
    
    -- Extrai o nome do fornecedor dos dados da tentativa
    v_fornecedor := COALESCE(NEW.dados_tentativa->>'fornecedor_nome', 'Fornecedor Desconhecido');

    -- Insere o alerta
    INSERT INTO public.alertas (
        user_id,
        tipo,
        titulo,
        mensagem,
        prioridade,
        lido,
        acao_url,
        entidade_id,
        entidade_tipo
    ) VALUES (
        v_user_id,
        'vencimento', -- Ou um novo tipo 'seguranca' se existir
        '🛡️ Bloqueio Anti-Duplicidade',
        'Tentativa de pagamento duplicado bloqueada para: ' || v_fornecedor || '. Valor: ' || NEW.valor_bloqueado,
        'high',
        false,
        '/contas-pagar/bloqueios?id=' || NEW.id,
        NEW.id::text,
        'bloqueio_duplicidade'
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para disparar a notificação
DROP TRIGGER IF EXISTS tr_notificar_bloqueio_duplicidade ON public.bloqueios_duplicidade;
CREATE TRIGGER tr_notificar_bloqueio_duplicidade
AFTER INSERT ON public.bloqueios_duplicidade
FOR EACH ROW
EXECUTE FUNCTION public.notificar_bloqueio_duplicidade();
