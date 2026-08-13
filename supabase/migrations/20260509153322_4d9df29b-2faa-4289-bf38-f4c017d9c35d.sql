-- Adicionar campos de scoring externo e comportamental
ALTER TABLE public.clientes 
ADD COLUMN IF NOT EXISTS serasa_score INTEGER,
ADD COLUMN IF NOT EXISTS boa_vista_score INTEGER,
ADD COLUMN IF NOT EXISTS data_ultima_consulta_externa TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS ia_risco_comportamental TEXT;

-- Comentários para documentação
COMMENT ON COLUMN public.clientes.serasa_score IS 'Score do cliente no Serasa (0-1000)';
COMMENT ON COLUMN public.clientes.boa_vista_score IS 'Score do cliente no Boa Vista (0-1000)';
COMMENT ON COLUMN public.clientes.ia_risco_comportamental IS 'Análise de risco baseada no comportamento histórico de pagamentos internos';
