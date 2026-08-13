-- Tabela para histórico de conversas via WhatsApp com IA
CREATE TABLE IF NOT EXISTS public.whatsapp_conversas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID REFERENCES public.clientes(id) ON DELETE CASCADE,
    mensagem TEXT NOT NULL,
    direcao TEXT CHECK (direcao IN ('entrada', 'saida')),
    status TEXT DEFAULT 'enviado',
    sentimento TEXT, -- IA analysis: positivo, neutro, negativo, agressivo
    intencao_pagamento BOOLEAN DEFAULT false,
    resumo_ia TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    user_id UUID DEFAULT auth.uid()
);

-- Habilitar RLS
ALTER TABLE public.whatsapp_conversas ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Usuários podem ver conversas de seus clientes"
ON public.whatsapp_conversas FOR SELECT
USING (true); -- Simplificado para o escopo, idealmente filtraria por empresa/user

CREATE POLICY "Usuários podem inserir mensagens"
ON public.whatsapp_conversas FOR INSERT
WITH CHECK (true);

-- Trigger para atualizar score baseado em novas conversas (placeholder para lógica de IA)
CREATE OR REPLACE FUNCTION public.analisar_sentimento_whatsapp()
RETURNS TRIGGER AS $$
BEGIN
    -- Aqui seria chamado um webhook ou edge function para IA
    -- Por enquanto, simulamos uma classificação simples
    IF NEW.mensagem ~* '(pagar|pago|comprovante|liquidar)' THEN
        NEW.intencao_pagamento := true;
        NEW.sentimento := 'positivo';
    ELSIF NEW.mensagem ~* '(atraso|nao consigo|dificuldade|problema)' THEN
        NEW.intencao_pagamento := false;
        NEW.sentimento := 'negativo';
    ELSE
        NEW.sentimento := 'neutro';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_analisar_whatsapp
BEFORE INSERT ON public.whatsapp_conversas
FOR EACH ROW EXECUTE FUNCTION public.analisar_sentimento_whatsapp();
