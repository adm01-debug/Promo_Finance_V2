-- Função para gerar alerta em caso de falha na conciliação retroativa
CREATE OR REPLACE FUNCTION public.handle_conciliacao_retroativa_error()
RETURNS TRIGGER AS $$
BEGIN
  IF (NEW.status = 'erro' AND (OLD.status IS NULL OR OLD.status != 'erro')) THEN
    INSERT INTO public.alertas (
      user_id,
      tipo,
      titulo,
      mensagem,
      prioridade,
      acao_url,
      entidade_id,
      entidade_tipo
    ) VALUES (
      NEW.created_by,
      'sistema',
      'Falha na Conciliação Retroativa',
      'O processamento retroativo do período ' || NEW.data_inicio || ' a ' || NEW.data_fim || ' falhou: ' || COALESCE(NEW.erro_detalhe, 'Erro desconhecido'),
      'alta',
      '/conciliacao?tab=retroativo&jobId=' || NEW.id,
      NEW.id::text,
      'conciliacao_retroativa'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Gatilho para disparar o alerta
DROP TRIGGER IF EXISTS trigger_conciliacao_retroativa_error ON public.logs_conciliacao_retroativa;
CREATE TRIGGER trigger_conciliacao_retroativa_error
AFTER UPDATE ON public.logs_conciliacao_retroativa
FOR EACH ROW
EXECUTE FUNCTION public.handle_conciliacao_retroativa_error();

-- Índices para otimização da auditoria
CREATE INDEX IF NOT EXISTS idx_transacoes_compensacao_aceita_em ON public.transacoes_bancarias (compensacao_aceita_em);
CREATE INDEX IF NOT EXISTS idx_transacoes_compensacao_aceita_por ON public.transacoes_bancarias (compensacao_aceita_por);
CREATE INDEX IF NOT EXISTS idx_transacoes_compensacao_classificacao ON public.transacoes_bancarias (compensacao_classificacao);
CREATE INDEX IF NOT EXISTS idx_divergencias_resolvido_em ON public.divergencias_conciliacao (resolvido_em);
CREATE INDEX IF NOT EXISTS idx_divergencias_resolvido_por ON public.divergencias_conciliacao (resolvido_por);
