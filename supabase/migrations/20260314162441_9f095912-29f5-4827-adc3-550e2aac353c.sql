
-- 1. Tabela de regras automáticas aprendidas
CREATE TABLE public.regras_conciliacao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  padrao_descricao TEXT NOT NULL,
  lancamento_tipo TEXT NOT NULL CHECK (lancamento_tipo IN ('pagar', 'receber')),
  entidade_nome TEXT NOT NULL,
  entidade_id UUID,
  categoria TEXT,
  vezes_aplicada INTEGER DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.regras_conciliacao ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read regras_conciliacao" ON public.regras_conciliacao
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert regras_conciliacao" ON public.regras_conciliacao
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update regras_conciliacao" ON public.regras_conciliacao
  FOR UPDATE TO authenticated USING (true);

-- 2. Tabela de conciliação parcial (split)
CREATE TABLE public.conciliacoes_parciais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transacao_bancaria_id UUID REFERENCES public.transacoes_bancarias(id) ON DELETE CASCADE NOT NULL,
  conta_pagar_id UUID REFERENCES public.contas_pagar(id),
  conta_receber_id UUID REFERENCES public.contas_receber(id),
  valor_parcial NUMERIC NOT NULL,
  observacoes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.conciliacoes_parciais ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read conciliacoes_parciais" ON public.conciliacoes_parciais
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert conciliacoes_parciais" ON public.conciliacoes_parciais
  FOR INSERT TO authenticated WITH CHECK (true);

-- 3. Adicionar campo para conciliação parcial na transacoes_bancarias
ALTER TABLE public.transacoes_bancarias 
  ADD COLUMN IF NOT EXISTS conciliacao_parcial BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS valor_conciliado NUMERIC DEFAULT 0;

-- Trigger para updated_at na regras_conciliacao
CREATE TRIGGER update_regras_conciliacao_updated_at
  BEFORE UPDATE ON public.regras_conciliacao
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
