-- Create split_payment_transacoes table if not exists
CREATE TABLE IF NOT EXISTS public.split_payment_transacoes (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    operacao_id TEXT,
    documento_tipo TEXT,
    documento_numero TEXT,
    documento_chave TEXT,
    valor_operacao DECIMAL(15,2) NOT NULL DEFAULT 0,
    valor_liquido DECIMAL(15,2) NOT NULL DEFAULT 0,
    cbs_retido DECIMAL(15,2) NOT NULL DEFAULT 0,
    ibs_retido DECIMAL(15,2) NOT NULL DEFAULT 0,
    is_retido DECIMAL(15,2) NOT NULL DEFAULT 0,
    total_retido DECIMAL(15,2) NOT NULL DEFAULT 0,
    conta_fornecedor TEXT,
    conta_cbs TEXT,
    conta_ibs TEXT,
    conta_is TEXT,
    status TEXT NOT NULL DEFAULT 'pendente',
    data_processamento TIMESTAMP WITH TIME ZONE,
    protocolo TEXT,
    erro_mensagem TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.split_payment_transacoes ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view split transactions of their companies" 
ON public.split_payment_transacoes 
FOR SELECT 
USING (EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() 
));

CREATE POLICY "Users can insert split transactions" 
ON public.split_payment_transacoes 
FOR INSERT 
WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() 
));

CREATE POLICY "Users can update split transactions" 
ON public.split_payment_transacoes 
FOR UPDATE 
USING (EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() 
));

-- Create trigger for updated_at
CREATE TRIGGER update_split_payment_transacoes_updated_at
BEFORE UPDATE ON public.split_payment_transacoes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_split_payment_empresa ON public.split_payment_transacoes(empresa_id);
CREATE INDEX IF NOT EXISTS idx_split_payment_status ON public.split_payment_transacoes(status);
CREATE INDEX IF NOT EXISTS idx_split_payment_created ON public.split_payment_transacoes(created_at);