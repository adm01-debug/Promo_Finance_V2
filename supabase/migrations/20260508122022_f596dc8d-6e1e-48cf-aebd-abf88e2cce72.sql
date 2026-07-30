-- Adicionar colunas de compensação na tabela de transações bancárias
ALTER TABLE public.transacoes_bancarias 
ADD COLUMN IF NOT EXISTS compensacao_valor NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS compensacao_motivo TEXT,
ADD COLUMN IF NOT EXISTS compensacao_classificacao TEXT, -- 'Juros' ou 'Desconto'
ADD COLUMN IF NOT EXISTS compensacao_regra TEXT,
ADD COLUMN IF NOT EXISTS compensacao_evidencia_url TEXT;

-- Garantir que configuracoes_conciliacao existe (já existe, mas vamos documentar o que ela deve conter)
-- Formato esperado no JSONB: { "tolerancia_centavos": 0.50, "aceite_automatico": true, "periodo_tolerancia_dias": 5 }

COMMENT ON COLUMN public.transacoes_bancarias.compensacao_valor IS 'Valor da diferença de centavos ajustada na conciliação';
COMMENT ON COLUMN public.transacoes_bancarias.compensacao_motivo IS 'Motivo do ajuste (ex: Tolerância configurada)';
COMMENT ON COLUMN public.transacoes_bancarias.compensacao_classificacao IS 'Classificação contábil do ajuste: Juros ou Desconto';
COMMENT ON COLUMN public.transacoes_bancarias.compensacao_regra IS 'A regra de negócio aplicada para o ajuste';
