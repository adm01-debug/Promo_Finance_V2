-- Adicionar coluna vendedor_id em contas_receber se não existir
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'contas_receber' AND COLUMN_NAME = 'vendedor_id') THEN
        ALTER TABLE public.contas_receber ADD COLUMN vendedor_id UUID;
    END IF;
END $$;

-- Criar tabela de vendedores
CREATE TABLE IF NOT EXISTS public.vendedores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    email TEXT,
    meta_mensal DECIMAL(12,2) DEFAULT 0,
    empresa_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Ativar RLS para vendedores
ALTER TABLE public.vendedores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendedores visualizáveis por todos da empresa" ON public.vendedores
    FOR SELECT USING (true);

-- Criar tabelas para conversas com IA
CREATE TABLE IF NOT EXISTS public.expert_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    titulo TEXT NOT NULL,
    resumo TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.expert_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários veem suas próprias conversas" ON public.expert_conversations
    FOR ALL USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.expert_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES public.expert_conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    actions JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.expert_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários veem mensagens de suas conversas" ON public.expert_messages
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.expert_conversations 
            WHERE id = conversation_id AND user_id = auth.uid()
        )
    );

-- Corrigir tabela budgets
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'budgets' AND COLUMN_NAME = 'company_id') THEN
        ALTER TABLE public.budgets ADD COLUMN company_id UUID;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'budgets' AND COLUMN_NAME = 'user_id') THEN
        ALTER TABLE public.budgets ADD COLUMN user_id UUID;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'budgets' AND COLUMN_NAME = 'category') THEN
        ALTER TABLE public.budgets ADD COLUMN category TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'budgets' AND COLUMN_NAME = 'budgeted_amount') THEN
        ALTER TABLE public.budgets ADD COLUMN budgeted_amount DECIMAL(12,2);
    END IF;
END $$;
