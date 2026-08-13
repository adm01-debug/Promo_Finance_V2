-- 1. fornecedores
ALTER TABLE public.fornecedores ADD COLUMN IF NOT EXISTS nome_fantasia TEXT;
ALTER TABLE public.fornecedores ADD COLUMN IF NOT EXISTS razao_social TEXT;

-- 2. pedidos_compra
CREATE TABLE IF NOT EXISTS public.pedidos_compra (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    fornecedor_id UUID REFERENCES public.fornecedores(id),
    status TEXT NOT NULL DEFAULT 'rascunho',
    valor_total NUMERIC NOT NULL DEFAULT 0,
    data_emissao DATE DEFAULT CURRENT_DATE,
    previsao_entrega DATE,
    observacoes TEXT,
    empresa_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. itens_pedido_compra
CREATE TABLE IF NOT EXISTS public.itens_pedido_compra (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    pedido_id UUID NOT NULL REFERENCES public.pedidos_compra(id) ON DELETE CASCADE,
    descricao TEXT NOT NULL,
    quantidade NUMERIC NOT NULL DEFAULT 1,
    valor_unitario NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. transacoes_bancarias
CREATE TABLE IF NOT EXISTS public.transacoes_bancarias (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    conta_bancaria_id UUID, -- Placeholder if table exists
    data DATE NOT NULL,
    descricao TEXT NOT NULL,
    valor NUMERIC NOT NULL,
    tipo TEXT NOT NULL, -- entrada, saida
    status TEXT NOT NULL DEFAULT 'pendente',
    categoria_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5. audit_logs adjustment
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS user_email TEXT;

-- 6. RLS
ALTER TABLE public.pedidos_compra ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itens_pedido_compra ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transacoes_bancarias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view everything" ON public.pedidos_compra FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can view items" ON public.itens_pedido_compra FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can view transactions" ON public.transacoes_bancarias FOR SELECT TO authenticated USING (true);
