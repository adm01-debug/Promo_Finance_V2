-- Tabela para armazenar boletos gerados
CREATE TABLE public.boletos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero TEXT NOT NULL,
  valor NUMERIC NOT NULL,
  vencimento DATE NOT NULL,
  sacado_nome TEXT NOT NULL,
  sacado_cpf_cnpj TEXT,
  cedente_nome TEXT NOT NULL,
  cedente_cnpj TEXT,
  banco TEXT NOT NULL,
  agencia TEXT NOT NULL,
  conta TEXT NOT NULL,
  linha_digitavel TEXT NOT NULL,
  codigo_barras TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'gerado' CHECK (status IN ('gerado', 'enviado', 'pago', 'vencido', 'cancelado')),
  descricao TEXT,
  observacoes TEXT,
  conta_receber_id UUID REFERENCES public.contas_receber(id),
  conta_bancaria_id UUID REFERENCES public.contas_bancarias(id),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id),
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.boletos ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Authenticated users can view boletos" ON public.boletos
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Operacional+ can insert boletos" ON public.boletos
  FOR INSERT WITH CHECK (has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role, 'operacional'::app_role]));

CREATE POLICY "Financeiro+ can update boletos" ON public.boletos
  FOR UPDATE USING (has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role]));

CREATE POLICY "Admin can delete boletos" ON public.boletos
  FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger para updated_at
CREATE TRIGGER update_boletos_updated_at
  BEFORE UPDATE ON public.boletos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Índices para performance
CREATE INDEX idx_boletos_empresa_id ON public.boletos(empresa_id);
CREATE INDEX idx_boletos_status ON public.boletos(status);
CREATE INDEX idx_boletos_vencimento ON public.boletos(vencimento);
CREATE INDEX idx_boletos_conta_receber_id ON public.boletos(conta_receber_id);