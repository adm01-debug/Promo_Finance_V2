-- 1. negativacoes
CREATE TABLE IF NOT EXISTS public.negativacoes (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    cliente_id UUID REFERENCES public.clientes(id),
    conta_receber_id UUID REFERENCES public.contas_receber(id),
    valor NUMERIC NOT NULL,
    status TEXT NOT NULL DEFAULT 'ativo', -- ativo, baixado, cancelado
    bureau TEXT, -- serasa, boa_vista
    motivo TEXT,
    data_negativacao DATE DEFAULT CURRENT_DATE,
    data_baixa DATE,
    empresa_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. protestos
CREATE TABLE IF NOT EXISTS public.protestos (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    cliente_id UUID REFERENCES public.clientes(id),
    conta_receber_id UUID REFERENCES public.contas_receber(id),
    valor NUMERIC NOT NULL,
    status TEXT NOT NULL DEFAULT 'ativo',
    cartorio TEXT,
    numero_protesto TEXT,
    data_protesto DATE DEFAULT CURRENT_DATE,
    data_cancelamento DATE,
    empresa_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Views

-- vw_webhooks_recentes
CREATE OR REPLACE VIEW public.vw_webhooks_recentes AS
SELECT 
    event_type,
    status,
    COUNT(*) as total,
    MAX(created_at) as last_seen
FROM public.webhooks_log
GROUP BY event_type, status;

-- vw_metricas_cobranca
CREATE OR REPLACE VIEW public.vw_metricas_cobranca AS
SELECT 
    status,
    canal,
    COUNT(*) as total,
    SUM(tentativas) as total_tentativas
FROM public.fila_cobrancas
GROUP BY status, canal;

-- vw_fluxo_caixa_diario
CREATE OR REPLACE VIEW public.vw_fluxo_caixa_diario AS
SELECT 
    data_vencimento as data,
    SUM(valor) as total_previsto,
    'receber' as tipo
FROM public.contas_receber
GROUP BY data_vencimento
UNION ALL
SELECT 
    data_vencimento as data,
    SUM(valor) as total_previsto,
    'pagar' as tipo
FROM public.contas_pagar
GROUP BY data_vencimento;

-- vw_saldos_contas
CREATE OR REPLACE VIEW public.vw_saldos_contas AS
SELECT 
    'Mock Bank' as banco,
    '0001' as agencia,
    '12345-6' as conta,
    150000.00 as saldo_atual,
    NOW() as ultima_atualizacao;


-- 4. Enable RLS and add policies
ALTER TABLE public.negativacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.protestos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view negativacoes" ON public.negativacoes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage negativacoes" ON public.negativacoes FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view protestos" ON public.protestos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage protestos" ON public.protestos FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 5. Fix asaas_reconciliation_suggestions relationships (explicitly)
ALTER TABLE public.asaas_reconciliation_suggestions DROP CONSTRAINT IF EXISTS asaas_reconciliation_suggestions_contas_receber_id_fkey;
ALTER TABLE public.asaas_reconciliation_suggestions ADD CONSTRAINT asaas_reconciliation_suggestions_contas_receber_id_fkey 
    FOREIGN KEY (contas_receber_id) REFERENCES public.contas_receber(id);

ALTER TABLE public.asaas_reconciliation_suggestions DROP CONSTRAINT IF EXISTS asaas_reconciliation_suggestions_contas_pagar_id_fkey;
ALTER TABLE public.asaas_reconciliation_suggestions ADD CONSTRAINT asaas_reconciliation_suggestions_contas_pagar_id_fkey 
    FOREIGN KEY (contas_pagar_id) REFERENCES public.contas_pagar(id);
