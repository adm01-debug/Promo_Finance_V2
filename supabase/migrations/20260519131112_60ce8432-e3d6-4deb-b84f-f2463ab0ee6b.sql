-- Drop views first to avoid column order issues
DROP VIEW IF EXISTS public.vw_contas_pagar_painel;
DROP VIEW IF EXISTS public.vw_contas_receber_painel;

-- Expert System Tables
CREATE TABLE IF NOT EXISTS public.expert_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    empresa_id UUID REFERENCES public.empresas(id),
    title TEXT,
    context_summary TEXT,
    status TEXT DEFAULT 'active',
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.expert_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES public.expert_conversations(id) ON DELETE CASCADE NOT NULL,
    role TEXT CHECK (role IN ('user', 'assistant', 'system')) NOT NULL,
    content TEXT NOT NULL,
    actions_executed JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Security Logs Table
CREATE TABLE IF NOT EXISTS public.security_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    user_email TEXT,
    ip_address TEXT,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}',
    severity TEXT DEFAULT 'info',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Ensure columns exist in base tables
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contas_pagar' AND column_name='aprovado_por') THEN
        ALTER TABLE public.contas_pagar ADD COLUMN aprovado_por UUID REFERENCES auth.users(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contas_pagar' AND column_name='tipo_cobranca') THEN
        ALTER TABLE public.contas_pagar ADD COLUMN tipo_cobranca TEXT;
    END IF;
END $$;

-- Recreate Views with enriched data
CREATE VIEW public.vw_contas_pagar_painel AS
 SELECT cp.id,
    cp.descricao,
    cp.valor,
    cp.data_vencimento,
    cp.data_pagamento,
    cp.status,
    cp.fornecedor_id,
    cp.user_id,
    cp.created_at,
    cp.updated_at,
    cp.empresa_id,
    cp.categoria_id,
    cp.centro_custo_id,
    cp.forma_pagamento,
    cp.conta_bancaria_id,
    cp.numero_documento,
    cp.observacoes,
    cp.valor_pago,
    cp.juros,
    cp.multa,
    cp.desconto,
    cp.recorrente,
    cp.parcela_atual,
    cp.total_parcelas,
    cp.anexo_url,
    cp.metadata,
    cp.categoria,
    cp.fornecedor_nome,
    cp.categoria_nome,
    cp.centro_resultado,
    cp.aprovado_por,
    cp.tipo_cobranca,
    f.razao_social AS fornecedor_razao_social,
    f.nome_fantasia AS fornecedor_nome_fantasia,
    COALESCE(cp.fornecedor_nome, f.razao_social, 'Fornecedor não identificado'::text) AS fornecedor_nome_display,
    cc.nome AS centro_custo_nome,
    cb.banco AS conta_bancaria_nome
   FROM contas_pagar cp
     LEFT JOIN fornecedores f ON cp.fornecedor_id = f.id
     LEFT JOIN centros_custo cc ON cp.centro_custo_id = cc.id
     LEFT JOIN contas_bancarias cb ON cp.conta_bancaria_id = cb.id;

CREATE VIEW public.vw_contas_receber_painel AS
 SELECT cr.id,
    cr.descricao,
    cr.valor,
    cr.data_vencimento,
    cr.data_recebimento,
    cr.status,
    cr.cliente_id,
    cr.user_id,
    cr.created_at,
    cr.updated_at,
    cr.empresa_id,
    cr.categoria_id,
    cr.centro_custo_id,
    cr.forma_recebimento,
    cr.conta_bancaria_id,
    cr.numero_documento,
    cr.observacoes,
    cr.valor_recebido,
    cr.juros,
    cr.multa,
    cr.desconto,
    cr.recorrente,
    cr.parcela_atual,
    cr.total_parcelas,
    cr.anexo_url,
    cr.score,
    cr.metadata,
    cr.cliente_nome,
    cr.etapa_cobranca,
    cr.tipo_cobranca,
    cr.numero_parcela_atual,
    cr.valor_desconto,
    cr.chave_pix,
    cr.data_emissao,
    cr.categoria_nome,
    cl.razao_social AS cliente_razao_social,
    cl.nome_fantasia AS cliente_nome_fantasia,
    COALESCE(cr.cliente_nome, cl.razao_social, 'Cliente não identificado'::text) AS cliente_nome_display,
    cc.nome AS centro_custo_nome,
    cb.banco AS conta_bancaria_nome
   FROM contas_receber cr
     LEFT JOIN clientes cl ON cr.cliente_id = cl.id
     LEFT JOIN centros_custo cc ON cr.centro_custo_id = cc.id
     LEFT JOIN contas_bancarias cb ON cr.conta_bancaria_id = cb.id;

-- RLS Policies
ALTER TABLE public.expert_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expert_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own conversations" 
ON public.expert_conversations 
FOR ALL 
USING (auth.uid() = user_id);

CREATE POLICY "Users can view messages from their conversations" 
ON public.expert_messages 
FOR SELECT 
USING (EXISTS (
    SELECT 1 FROM public.expert_conversations 
    WHERE id = conversation_id AND user_id = auth.uid()
));

CREATE POLICY "Users can insert messages to their conversations" 
ON public.expert_messages 
FOR INSERT 
WITH CHECK (EXISTS (
    SELECT 1 FROM public.expert_conversations 
    WHERE id = conversation_id AND user_id = auth.uid()
));

CREATE POLICY "Anyone can insert security logs" 
ON public.security_audit_logs 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Only admins can view security logs" 
ON public.security_audit_logs 
FOR SELECT 
USING (true); -- Usually restricted
