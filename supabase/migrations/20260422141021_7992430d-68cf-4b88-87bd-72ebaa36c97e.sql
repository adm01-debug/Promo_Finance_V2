ALTER TABLE public.feedback_conciliacao_ia
ADD COLUMN IF NOT EXISTS transacao_bancaria_id UUID REFERENCES public.transacoes_bancarias(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_feedback_conciliacao_ia_transacao_bancaria_id
  ON public.feedback_conciliacao_ia(transacao_bancaria_id);