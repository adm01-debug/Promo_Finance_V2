-- Tabela para acordos de parcelamento
CREATE TABLE public.acordos_parcelamento (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_acordo TEXT NOT NULL UNIQUE,
  cliente_id UUID REFERENCES public.clientes(id),
  cliente_nome TEXT NOT NULL,
  cliente_email TEXT,
  cliente_telefone TEXT,
  valor_original NUMERIC(15,2) NOT NULL,
  valor_total_acordo NUMERIC(15,2) NOT NULL,
  desconto_aplicado NUMERIC(15,2) DEFAULT 0,
  juros_aplicado NUMERIC(15,2) DEFAULT 0,
  numero_parcelas INTEGER NOT NULL CHECK (numero_parcelas >= 1 AND numero_parcelas <= 60),
  valor_parcela NUMERIC(15,2) NOT NULL,
  data_primeiro_vencimento DATE NOT NULL,
  dia_vencimento INTEGER NOT NULL CHECK (dia_vencimento >= 1 AND dia_vencimento <= 31),
  status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'quitado', 'cancelado', 'inadimplente')),
  observacoes TEXT,
  contas_receber_ids UUID[] NOT NULL DEFAULT '{}',
  empresa_id UUID NOT NULL REFERENCES public.empresas(id),
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para parcelas do acordo
CREATE TABLE public.parcelas_acordo (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  acordo_id UUID NOT NULL REFERENCES public.acordos_parcelamento(id) ON DELETE CASCADE,
  numero_parcela INTEGER NOT NULL,
  valor NUMERIC(15,2) NOT NULL,
  data_vencimento DATE NOT NULL,
  data_pagamento DATE,
  valor_pago NUMERIC(15,2),
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'vencido', 'cancelado')),
  conta_receber_id UUID REFERENCES public.contas_receber(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(acordo_id, numero_parcela)
);

-- Índices
CREATE INDEX idx_acordos_parcelamento_cliente ON public.acordos_parcelamento(cliente_id);
CREATE INDEX idx_acordos_parcelamento_status ON public.acordos_parcelamento(status);
CREATE INDEX idx_acordos_parcelamento_empresa ON public.acordos_parcelamento(empresa_id);
CREATE INDEX idx_parcelas_acordo_acordo ON public.parcelas_acordo(acordo_id);
CREATE INDEX idx_parcelas_acordo_status ON public.parcelas_acordo(status);
CREATE INDEX idx_parcelas_acordo_vencimento ON public.parcelas_acordo(data_vencimento);

-- RLS
ALTER TABLE public.acordos_parcelamento ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parcelas_acordo ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para acordos_parcelamento
CREATE POLICY "Usuários autenticados podem ver acordos"
  ON public.acordos_parcelamento FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Financeiro+ podem criar acordos"
  ON public.acordos_parcelamento FOR INSERT
  TO authenticated
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin', 'financeiro']::app_role[]));

CREATE POLICY "Financeiro+ podem atualizar acordos"
  ON public.acordos_parcelamento FOR UPDATE
  TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin', 'financeiro']::app_role[]));

CREATE POLICY "Admin pode deletar acordos"
  ON public.acordos_parcelamento FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Políticas RLS para parcelas_acordo
CREATE POLICY "Usuários autenticados podem ver parcelas"
  ON public.parcelas_acordo FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Financeiro+ podem gerenciar parcelas"
  ON public.parcelas_acordo FOR ALL
  TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin', 'financeiro']::app_role[]));

-- Triggers
CREATE TRIGGER update_acordos_parcelamento_updated_at
  BEFORE UPDATE ON public.acordos_parcelamento
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Função para gerar número do acordo
CREATE OR REPLACE FUNCTION public.gerar_numero_acordo()
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_ano TEXT;
  v_sequencial INTEGER;
  v_numero TEXT;
BEGIN
  v_ano := to_char(CURRENT_DATE, 'YYYY');
  
  SELECT COALESCE(MAX(
    CASE 
      WHEN numero_acordo ~ ('^AC' || v_ano || '-[0-9]+$')
      THEN CAST(SUBSTRING(numero_acordo FROM '-([0-9]+)$') AS INTEGER)
      ELSE 0
    END
  ), 0) + 1
  INTO v_sequencial
  FROM acordos_parcelamento;
  
  v_numero := 'AC' || v_ano || '-' || LPAD(v_sequencial::TEXT, 5, '0');
  
  RETURN v_numero;
END;
$$;