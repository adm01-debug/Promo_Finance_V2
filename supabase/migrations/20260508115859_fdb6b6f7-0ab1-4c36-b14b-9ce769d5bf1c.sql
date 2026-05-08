-- Adicionar configurações de conciliação às contas bancárias
ALTER TABLE public.contas_bancarias 
ADD COLUMN IF NOT EXISTS configuracoes_conciliacao JSONB DEFAULT '{"tolerancia_centavos": 0.50, "auto_ajuste": true}';

-- Tabela para logs de conciliação retroativa
CREATE TABLE IF NOT EXISTS public.logs_conciliacao_retroativa (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conta_bancaria_id UUID REFERENCES public.contas_bancarias(id),
    data_inicio DATE NOT NULL,
    data_fim DATE NOT NULL,
    status TEXT DEFAULT 'processando', -- 'processando', 'concluido', 'erro'
    total_processado INTEGER DEFAULT 0,
    total_conciliado INTEGER DEFAULT 0,
    divergencias_encontradas INTEGER DEFAULT 0,
    logs JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID REFERENCES auth.users(id)
);

-- Tabela para painel de divergências
CREATE TABLE IF NOT EXISTS public.divergencias_conciliacao (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    extrato_id UUID, -- Referência lógica ao lote de importação
    conta_bancaria_id UUID REFERENCES public.contas_bancarias(id),
    transacao_id UUID REFERENCES public.transacoes_bancarias(id),
    tipo_divergencia TEXT NOT NULL, -- 'saldo_final', 'valor_parcial', 'data_descolada'
    descricao TEXT,
    valor_divergencia NUMERIC,
    status TEXT DEFAULT 'pendente', -- 'pendente', 'aceito', 'corrigido'
    recomendacao TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.logs_conciliacao_retroativa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.divergencias_conciliacao ENABLE ROW LEVEL SECURITY;

-- Políticas básicas (acesso total para usuários autenticados da mesma organização simplificado aqui para brevidade)
CREATE POLICY "Users can view logs" ON public.logs_conciliacao_retroativa FOR SELECT USING (true);
CREATE POLICY "Users can insert logs" ON public.logs_conciliacao_retroativa FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can view divergencias" ON public.divergencias_conciliacao FOR SELECT USING (true);
CREATE POLICY "Users can update divergencias" ON public.divergencias_conciliacao FOR UPDATE USING (true);