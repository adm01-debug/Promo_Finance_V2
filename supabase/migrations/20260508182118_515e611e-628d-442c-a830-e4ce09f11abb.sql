CREATE TABLE IF NOT EXISTS public.asaas_reconciliation_suggestions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    transaction_id TEXT NOT NULL, -- Asaas Transaction ID
    conta_receber_id UUID REFERENCES public.contas_receber(id),
    empresa_id UUID REFERENCES public.empresas(id),
    score NUMERIC NOT NULL, -- Confidence level (0 to 1)
    match_type TEXT NOT NULL, -- 'VALUE_DATE', 'DESCRIPTION', etc.
    status TEXT NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'ACCEPTED', 'REJECTED'
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.asaas_reconciliation_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view suggestions of their company" 
ON public.asaas_reconciliation_suggestions FOR SELECT 
USING (empresa_id IN (SELECT id FROM public.empresas));

-- Function to find potential matches
CREATE OR REPLACE FUNCTION public.generate_reconciliation_suggestions(
    p_empresa_id UUID,
    p_transaction_date DATE,
    p_transaction_value NUMERIC,
    p_transaction_id TEXT
) RETURNS VOID AS $$
DECLARE
    v_conta RECORD;
BEGIN
    -- Find pending receivables within a 3-day window and similar value
    FOR v_conta IN 
        SELECT id, valor, data_vencimento 
        FROM public.contas_receber 
        WHERE empresa_id = p_empresa_id 
          AND status = 'pendente'
          AND valor BETWEEN (p_transaction_value * 0.95) AND (p_transaction_value * 1.05) -- 5% margin
          AND data_vencimento BETWEEN (p_transaction_date - interval '3 days') AND (p_transaction_date + interval '3 days')
    LOOP
        INSERT INTO public.asaas_reconciliation_suggestions (
            transaction_id,
            conta_receber_id,
            empresa_id,
            score,
            match_type,
            metadata
        ) VALUES (
            p_transaction_id,
            v_conta.id,
            p_empresa_id,
            CASE 
                WHEN v_conta.valor = p_transaction_value AND v_conta.data_vencimento = p_transaction_date THEN 1.0
                WHEN v_conta.valor = p_transaction_value THEN 0.8
                ELSE 0.6
            END,
            'VALUE_DATE',
            jsonb_build_object('transaction_value', p_transaction_value, 'conta_valor', v_conta.valor)
        ) ON CONFLICT DO NOTHING;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
