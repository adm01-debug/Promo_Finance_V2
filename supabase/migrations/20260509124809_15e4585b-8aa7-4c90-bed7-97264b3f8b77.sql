-- Create Purchase Orders table
CREATE TABLE public.pedidos_compra (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    empresa_id UUID REFERENCES public.empresas(id),
    fornecedor_id UUID REFERENCES public.fornecedores(id),
    status TEXT NOT NULL DEFAULT 'rascunho' CHECK (status IN ('rascunho', 'pendente_aprovacao', 'aprovado', 'rejeitado', 'recebido', 'cancelado')),
    valor_total DECIMAL(12,2) NOT NULL DEFAULT 0,
    data_pedido TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    data_entrega_prevista DATE,
    observacoes TEXT,
    centro_custo_id UUID REFERENCES public.centros_custo(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create Purchase Order Items table
CREATE TABLE public.itens_pedido_compra (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    pedido_id UUID NOT NULL REFERENCES public.pedidos_compra(id) ON DELETE CASCADE,
    descricao TEXT NOT NULL,
    quantidade DECIMAL(12,2) NOT NULL DEFAULT 1,
    valor_unitario DECIMAL(12,2) NOT NULL DEFAULT 0,
    valor_total DECIMAL(12,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pedidos_compra ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itens_pedido_compra ENABLE ROW LEVEL SECURITY;

-- Policies for pedidos_compra
CREATE POLICY "Users can view their own purchase orders"
ON public.pedidos_compra FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own purchase orders"
ON public.pedidos_compra FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own purchase orders"
ON public.pedidos_compra FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own purchase orders"
ON public.pedidos_compra FOR DELETE
USING (auth.uid() = user_id);

-- Policies for itens_pedido_compra
CREATE POLICY "Users can view items of their purchase orders"
ON public.itens_pedido_compra FOR SELECT
USING (EXISTS (
    SELECT 1 FROM public.pedidos_compra
    WHERE pedidos_compra.id = itens_pedido_compra.pedido_id
    AND pedidos_compra.user_id = auth.uid()
));

CREATE POLICY "Users can insert items to their purchase orders"
ON public.itens_pedido_compra FOR INSERT
WITH CHECK (EXISTS (
    SELECT 1 FROM public.pedidos_compra
    WHERE pedidos_compra.id = itens_pedido_compra.pedido_id
    AND pedidos_compra.user_id = auth.uid()
));

-- Trigger for updated_at
CREATE TRIGGER update_pedidos_compra_updated_at
BEFORE UPDATE ON public.pedidos_compra
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
