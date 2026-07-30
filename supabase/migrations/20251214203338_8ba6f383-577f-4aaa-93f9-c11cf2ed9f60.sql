-- Bug #13: Criar função para persistir conciliações corretamente
-- Bug #14: Criar função de trigger para gerar alertas automáticos
-- Bug #15: Criar tabela de histórico de cobrança

-- Tabela para histórico de mudanças de etapa de cobrança
CREATE TABLE IF NOT EXISTS public.historico_cobranca (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conta_receber_id UUID NOT NULL REFERENCES public.contas_receber(id) ON DELETE CASCADE,
  etapa_anterior TEXT,
  etapa_nova TEXT NOT NULL,
  observacoes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.historico_cobranca ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para histórico de cobrança
CREATE POLICY "Authenticated users can view historico_cobranca"
  ON public.historico_cobranca FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Financeiro+ can insert historico_cobranca"
  ON public.historico_cobranca FOR INSERT
  WITH CHECK (has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role]));

-- Índice para performance
CREATE INDEX idx_historico_cobranca_conta ON public.historico_cobranca(conta_receber_id);
CREATE INDEX idx_historico_cobranca_created ON public.historico_cobranca(created_at DESC);

-- Trigger para registrar mudanças de etapa de cobrança automaticamente
CREATE OR REPLACE FUNCTION public.log_etapa_cobranca_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.etapa_cobranca IS DISTINCT FROM NEW.etapa_cobranca THEN
    INSERT INTO public.historico_cobranca (
      conta_receber_id,
      etapa_anterior,
      etapa_nova,
      created_by
    ) VALUES (
      NEW.id,
      OLD.etapa_cobranca::text,
      NEW.etapa_cobranca::text,
      auth.uid()
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_etapa_cobranca_change
  AFTER UPDATE ON public.contas_receber
  FOR EACH ROW
  EXECUTE FUNCTION public.log_etapa_cobranca_change();

-- Bug #14: Função para gerar alertas automáticos de vencimento
CREATE OR REPLACE FUNCTION public.gerar_alertas_vencimento()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  hoje DATE := CURRENT_DATE;
  em_tres_dias DATE := CURRENT_DATE + INTERVAL '3 days';
  conta RECORD;
BEGIN
  -- Alertas para contas a pagar próximas do vencimento (3 dias)
  FOR conta IN 
    SELECT id, descricao, valor, data_vencimento, fornecedor_nome, created_by
    FROM public.contas_pagar
    WHERE status = 'pendente'
      AND data_vencimento BETWEEN hoje AND em_tres_dias
      AND NOT EXISTS (
        SELECT 1 FROM public.alertas 
        WHERE entidade_tipo = 'conta_pagar' 
          AND entidade_id = contas_pagar.id::text
          AND tipo = 'vencimento'
          AND created_at > now() - INTERVAL '1 day'
      )
  LOOP
    INSERT INTO public.alertas (
      tipo,
      titulo,
      mensagem,
      prioridade,
      entidade_tipo,
      entidade_id,
      acao_url,
      user_id
    ) VALUES (
      'vencimento',
      'Conta a pagar próxima do vencimento',
      format('A conta "%s" no valor de R$ %s para %s vence em %s',
        conta.descricao,
        to_char(conta.valor, 'FM999G999G999D00'),
        conta.fornecedor_nome,
        to_char(conta.data_vencimento, 'DD/MM/YYYY')
      ),
      CASE 
        WHEN conta.data_vencimento = hoje THEN 'alta'::prioridade_alerta
        ELSE 'media'::prioridade_alerta
      END,
      'conta_pagar',
      conta.id::text,
      '/contas-pagar',
      conta.created_by
    );
  END LOOP;

  -- Alertas para contas a receber vencidas (inadimplência)
  FOR conta IN 
    SELECT id, descricao, valor, data_vencimento, cliente_nome, created_by
    FROM public.contas_receber
    WHERE status IN ('pendente', 'vencido')
      AND data_vencimento < hoje
      AND NOT EXISTS (
        SELECT 1 FROM public.alertas 
        WHERE entidade_tipo = 'conta_receber' 
          AND entidade_id = contas_receber.id::text
          AND tipo = 'inadimplencia'
          AND created_at > now() - INTERVAL '7 days'
      )
  LOOP
    INSERT INTO public.alertas (
      tipo,
      titulo,
      mensagem,
      prioridade,
      entidade_tipo,
      entidade_id,
      acao_url,
      user_id
    ) VALUES (
      'inadimplencia',
      'Conta a receber vencida',
      format('A conta "%s" no valor de R$ %s de %s está vencida desde %s',
        conta.descricao,
        to_char(conta.valor, 'FM999G999G999D00'),
        conta.cliente_nome,
        to_char(conta.data_vencimento, 'DD/MM/YYYY')
      ),
      CASE 
        WHEN conta.data_vencimento < hoje - INTERVAL '15 days' THEN 'critica'::prioridade_alerta
        WHEN conta.data_vencimento < hoje - INTERVAL '7 days' THEN 'alta'::prioridade_alerta
        ELSE 'media'::prioridade_alerta
      END,
      'conta_receber',
      conta.id::text,
      '/contas-receber',
      conta.created_by
    );
  END LOOP;
END;
$$;

-- Bug #13: Função para persistir conciliação bancária
CREATE OR REPLACE FUNCTION public.confirmar_conciliacao(
  p_transacao_id UUID,
  p_conta_pagar_id UUID DEFAULT NULL,
  p_conta_receber_id UUID DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Atualizar a transação bancária como conciliada
  UPDATE public.transacoes_bancarias
  SET 
    conciliada = true,
    conciliada_em = now(),
    conciliada_por = auth.uid(),
    conta_pagar_id = COALESCE(p_conta_pagar_id, conta_pagar_id),
    conta_receber_id = COALESCE(p_conta_receber_id, conta_receber_id)
  WHERE id = p_transacao_id;

  -- Se vinculado a conta a pagar, atualizar status
  IF p_conta_pagar_id IS NOT NULL THEN
    UPDATE public.contas_pagar
    SET status = 'pago', data_pagamento = CURRENT_DATE
    WHERE id = p_conta_pagar_id AND status = 'pendente';
  END IF;

  -- Se vinculado a conta a receber, atualizar status
  IF p_conta_receber_id IS NOT NULL THEN
    UPDATE public.contas_receber
    SET status = 'pago', data_recebimento = CURRENT_DATE
    WHERE id = p_conta_receber_id AND status IN ('pendente', 'vencido');
  END IF;
END;
$$;

-- Permitir insert de alertas para o sistema (RLS)
DROP POLICY IF EXISTS "System can insert alertas" ON public.alertas;
CREATE POLICY "System can insert alertas"
  ON public.alertas FOR INSERT
  WITH CHECK (true);

-- Adicionar realtime para alertas
ALTER PUBLICATION supabase_realtime ADD TABLE public.alertas;