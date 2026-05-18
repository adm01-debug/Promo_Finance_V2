-- 1. Create vendedores table
CREATE TABLE IF NOT EXISTS public.vendedores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID REFERENCES public.empresas(id),
    nome TEXT NOT NULL,
    email TEXT,
    meta_mensal NUMERIC(15,2),
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Create acoes_recomendadas table
CREATE TABLE IF NOT EXISTS public.acoes_recomendadas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID REFERENCES public.empresas(id),
    titulo TEXT NOT NULL,
    descricao TEXT,
    prioridade TEXT,
    status TEXT DEFAULT 'pendente',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Create parcelas_acordo table
CREATE TABLE IF NOT EXISTS public.parcelas_acordo (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    acordo_id UUID REFERENCES public.acordos_parcelamento(id) ON DELETE CASCADE,
    numero_parcela INTEGER NOT NULL,
    valor NUMERIC(15,2) NOT NULL,
    data_vencimento DATE NOT NULL,
    status TEXT DEFAULT 'pendente',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. Update acordos_parcelamento
ALTER TABLE public.acordos_parcelamento ADD COLUMN IF NOT EXISTS numero_acordo TEXT;
ALTER TABLE public.acordos_parcelamento ADD COLUMN IF NOT EXISTS cliente_id UUID REFERENCES public.clientes(id);
ALTER TABLE public.acordos_parcelamento ADD COLUMN IF NOT EXISTS cliente_nome TEXT;

-- 5. Update solicitacoes_aprovacao
ALTER TABLE public.solicitacoes_aprovacao ADD COLUMN IF NOT EXISTS aprovado_por UUID REFERENCES auth.users(id);
ALTER TABLE public.solicitacoes_aprovacao ADD COLUMN IF NOT EXISTS conta_pagar_id UUID REFERENCES public.contas_pagar(id);

-- 6. Enable RLS
ALTER TABLE public.vendedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.acoes_recomendadas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parcelas_acordo ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own vendedores" ON public.vendedores FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Users can manage acoes_recomendadas" ON public.acoes_recomendadas FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Users can manage parcelas_acordo" ON public.parcelas_acordo FOR ALL TO authenticated USING (true) WITH CHECK (true);

GRANT ALL ON public.vendedores TO authenticated;
GRANT ALL ON public.acoes_recomendadas TO authenticated;
GRANT ALL ON public.parcelas_acordo TO authenticated;
