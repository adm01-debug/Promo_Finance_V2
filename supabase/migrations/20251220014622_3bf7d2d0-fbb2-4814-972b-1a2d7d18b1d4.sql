-- Criar tabela de histórico de conciliações com IA
CREATE TABLE public.historico_conciliacao_ia (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  transacao_bancaria_id UUID REFERENCES public.transacoes_bancarias(id),
  conta_pagar_id UUID REFERENCES public.contas_pagar(id),
  conta_receber_id UUID REFERENCES public.contas_receber(id),
  tipo_lancamento TEXT NOT NULL CHECK (tipo_lancamento IN ('pagar', 'receber')),
  score_ia INTEGER NOT NULL CHECK (score_ia >= 0 AND score_ia <= 100),
  confianca TEXT NOT NULL CHECK (confianca IN ('alta', 'media', 'baixa')),
  motivos JSONB NOT NULL DEFAULT '[]',
  analise_ia TEXT,
  acao TEXT NOT NULL CHECK (acao IN ('aprovado', 'rejeitado')),
  aprovado_por UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de feedback para treinar o algoritmo
CREATE TABLE public.feedback_conciliacao_ia (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  transacao_descricao TEXT NOT NULL,
  lancamento_entidade TEXT NOT NULL,
  lancamento_descricao TEXT,
  tipo_lancamento TEXT NOT NULL CHECK (tipo_lancamento IN ('pagar', 'receber')),
  score_original INTEGER NOT NULL,
  acao TEXT NOT NULL CHECK (acao IN ('aprovado', 'rejeitado')),
  motivo_rejeicao TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_historico_conciliacao_ia_transacao ON public.historico_conciliacao_ia(transacao_bancaria_id);
CREATE INDEX idx_historico_conciliacao_ia_created_at ON public.historico_conciliacao_ia(created_at DESC);
CREATE INDEX idx_feedback_conciliacao_ia_created_at ON public.feedback_conciliacao_ia(created_at DESC);

-- Habilitar RLS
ALTER TABLE public.historico_conciliacao_ia ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback_conciliacao_ia ENABLE ROW LEVEL SECURITY;

-- Políticas RLS - histórico visível para todos autenticados
CREATE POLICY "Usuários autenticados podem ver histórico de conciliação" 
ON public.historico_conciliacao_ia 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Usuários autenticados podem inserir histórico de conciliação" 
ON public.historico_conciliacao_ia 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- Políticas RLS - feedback
CREATE POLICY "Usuários autenticados podem ver feedback" 
ON public.feedback_conciliacao_ia 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Usuários autenticados podem inserir feedback" 
ON public.feedback_conciliacao_ia 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);