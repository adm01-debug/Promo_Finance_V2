-- Régua de cobrança por título
CREATE TABLE IF NOT EXISTS public.regua_cobranca_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titulo_id UUID NOT NULL, -- Referência ao contas_receber ou boleto
    cliente_id UUID NOT NULL,
    empresa_id UUID NOT NULL,
    etapa_atual TEXT NOT NULL DEFAULT 'preventiva',
    status TEXT NOT NULL DEFAULT 'pendente', -- pendente, disparado, erro, concluido
    data_proximo_disparo TIMESTAMP WITH TIME ZONE,
    historico JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.regua_cobranca_status ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para regua_cobranca_status
CREATE POLICY "Usuários podem ver status da régua de sua empresa" 
ON public.regua_cobranca_status FOR SELECT 
USING (auth.uid() IN (SELECT user_id FROM public.user_empresas WHERE empresa_id = regua_cobranca_status.empresa_id));

-- Adicionar colunas Bitrix24 na tabela de boletos (se não existirem)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='boletos' AND column_name='bitrix_id') THEN
        ALTER TABLE public.boletos ADD COLUMN bitrix_id TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='boletos' AND column_name='bitrix_status') THEN
        ALTER TABLE public.boletos ADD COLUMN bitrix_status TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='boletos' AND column_name='eventos_pagamento') THEN
        ALTER TABLE public.boletos ADD COLUMN eventos_pagamento JSONB DEFAULT '[]'::jsonb;
    END IF;
END $$;

-- Fila de conciliação pendente
CREATE TABLE IF NOT EXISTS public.conciliacao_sugestoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transacao_id UUID NOT NULL,
    empresa_id UUID NOT NULL,
    sugestoes JSONB NOT NULL, -- Array de matches possíveis com score e IDs do sistema
    status TEXT DEFAULT 'pendente', -- pendente, aceito, rejeitado
    analisado_em TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.conciliacao_sugestoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver sugestões de sua empresa" 
ON public.conciliacao_sugestoes FOR SELECT 
USING (auth.uid() IN (SELECT user_id FROM public.user_empresas WHERE empresa_id = conciliacao_sugestoes.empresa_id));
