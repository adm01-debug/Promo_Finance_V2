
-- Função para gerar alertas de transações não conciliadas após X dias
CREATE OR REPLACE FUNCTION public.gerar_alertas_pendencias_conciliacao()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  hoje DATE := CURRENT_DATE;
  dias_limite INTEGER := 7;
  transacao RECORD;
BEGIN
  FOR transacao IN
    SELECT tb.id, tb.descricao, tb.valor, tb.data, tb.tipo, cb.banco, cb.conta
    FROM public.transacoes_bancarias tb
    LEFT JOIN public.contas_bancarias cb ON cb.id = tb.conta_bancaria_id
    WHERE tb.conciliada = false
      AND tb.data < hoje - (dias_limite || ' days')::INTERVAL
      AND NOT EXISTS (
        SELECT 1 FROM public.alertas
        WHERE entidade_tipo = 'transacao_bancaria'
          AND entidade_id = tb.id::text
          AND tipo = 'pendencia_conciliacao'
          AND created_at > now() - INTERVAL '7 days'
      )
  LOOP
    INSERT INTO public.alertas (
      tipo, titulo, mensagem, prioridade,
      entidade_tipo, entidade_id, acao_url
    ) VALUES (
      'pendencia_conciliacao',
      'Transação não conciliada há mais de ' || dias_limite || ' dias',
      format('A transação "%s" no valor de R$ %s do banco %s (conta %s) de %s está pendente de conciliação.',
        transacao.descricao,
        to_char(transacao.valor, 'FM999G999G999D00'),
        COALESCE(transacao.banco, 'N/A'),
        COALESCE(transacao.conta, 'N/A'),
        to_char(transacao.data, 'DD/MM/YYYY')
      ),
      'media'::prioridade_alerta,
      'transacao_bancaria',
      transacao.id::text,
      '/conciliacao'
    );
  END LOOP;
END;
$$;
