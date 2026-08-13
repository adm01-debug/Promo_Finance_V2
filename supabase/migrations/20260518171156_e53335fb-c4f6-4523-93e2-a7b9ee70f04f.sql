-- 1. templates_cobranca
CREATE TABLE IF NOT EXISTS public.templates_cobranca (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    nome TEXT NOT NULL,
    descricao TEXT,
    canal TEXT NOT NULL, -- email, whatsapp, sms
    assunto TEXT,
    corpo TEXT NOT NULL,
    ativo BOOLEAN NOT NULL DEFAULT true,
    empresa_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. regua_cobranca
CREATE TABLE IF NOT EXISTS public.regua_cobranca (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    nome TEXT NOT NULL,
    ativo BOOLEAN NOT NULL DEFAULT true,
    empresa_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. regua_cobranca_etapas
CREATE TABLE IF NOT EXISTS public.regua_cobranca_etapas (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    regua_id UUID NOT NULL REFERENCES public.regua_cobranca(id) ON DELETE CASCADE,
    template_id UUID NOT NULL REFERENCES public.templates_cobranca(id),
    dias_offset INTEGER NOT NULL, -- -5 (5 dias antes), 0 (no dia), 5 (5 dias depois)
    ordem INTEGER NOT NULL DEFAULT 0,
    ativo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. fila_cobrancas
CREATE TABLE IF NOT EXISTS public.fila_cobrancas (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    cliente_id UUID REFERENCES public.clientes(id),
    cliente_nome TEXT, -- denormalized for performance
    conta_receber_id UUID REFERENCES public.contas_receber(id),
    etapa_id UUID REFERENCES public.regua_cobranca_etapas(id),
    etapa TEXT, -- nome da etapa
    canal TEXT, -- email, whatsapp, sms
    destinatario TEXT,
    status TEXT NOT NULL DEFAULT 'pendente', -- pendente, processando, enviado, falha, cancelado
    tentativas INTEGER NOT NULL DEFAULT 0,
    max_tentativas INTEGER NOT NULL DEFAULT 3,
    last_error TEXT,
    scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE,
    empresa_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5. historico_cobranca
CREATE TABLE IF NOT EXISTS public.historico_cobranca (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    cliente_id UUID REFERENCES public.clientes(id),
    conta_receber_id UUID REFERENCES public.contas_receber(id),
    canal TEXT,
    destinatario TEXT,
    status TEXT,
    mensagem TEXT,
    evento TEXT, -- disparo, leitura, clique, erro
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 6. pix_templates
CREATE TABLE IF NOT EXISTS public.pix_templates (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    nome TEXT NOT NULL,
    chave_pix TEXT NOT NULL,
    tipo_chave TEXT NOT NULL,
    beneficiario_nome TEXT NOT NULL,
    cidade TEXT NOT NULL,
    ativo BOOLEAN NOT NULL DEFAULT true,
    empresa_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.templates_cobranca ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regua_cobranca ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regua_cobranca_etapas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fila_cobrancas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historico_cobranca ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pix_templates ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view templates" ON public.templates_cobranca FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage templates" ON public.templates_cobranca FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view regua" ON public.regua_cobranca FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage regua" ON public.regua_cobranca FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view stages" ON public.regua_cobranca_etapas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage stages" ON public.regua_cobranca_etapas FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view queue" ON public.fila_cobrancas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage queue" ON public.fila_cobrancas FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view history" ON public.historico_cobranca FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can view pix" ON public.pix_templates FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage pix" ON public.pix_templates FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
