-- Tabela para conversas de WhatsApp com IA
CREATE TABLE IF NOT EXISTS public.whatsapp_conversas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID REFERENCES public.clientes(id),
    mensagem TEXT NOT NULL,
    direcao TEXT CHECK (direcao IN ('entrada', 'saida')),
    status TEXT DEFAULT 'enviado',
    sentimento TEXT,
    intencao_pagamento BOOLEAN DEFAULT false,
    resumo_ia TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    empresa_id UUID REFERENCES public.empresas(id)
);

-- Tabela para histórico de cobrança específico do WhatsApp
CREATE TABLE IF NOT EXISTS public.historico_cobranca_whatsapp (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID REFERENCES public.clientes(id),
    mensagem TEXT NOT NULL,
    status TEXT DEFAULT 'enviado',
    lido_em TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    empresa_id UUID REFERENCES public.empresas(id),
    metadata JSONB
);

-- Habilitar RLS
ALTER TABLE public.whatsapp_conversas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historico_cobranca_whatsapp ENABLE ROW LEVEL SECURITY;

-- Políticas simplificadas (ajustar para multi-tenant se empresa_id for usado)
CREATE POLICY "Permitir acesso total whatsapp_conversas" ON public.whatsapp_conversas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir acesso total historico_cobranca_whatsapp" ON public.historico_cobranca_whatsapp FOR ALL USING (true) WITH CHECK (true);
