-- Adiciona colunas de conciliação em transacoes_bancarias
ALTER TABLE public.transacoes_bancarias 
ADD COLUMN IF NOT EXISTS regra_id UUID REFERENCES public.regras_conciliacao(id),
ADD COLUMN IF NOT EXISTS data_confirmacao TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS confirmado_por UUID REFERENCES auth.users(id);

-- Ajusta regua_cobranca_status para suportar o que o hook de cobrança precisa
-- Primeiro verificamos se as colunas existem antes de renomear ou adicionar
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'regua_cobranca_status' AND column_name = 'titulo_id') THEN
        ALTER TABLE public.regua_cobranca_status ADD COLUMN titulo_id UUID REFERENCES public.contas_receber(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'regua_cobranca_status' AND column_name = 'cliente_id') THEN
        ALTER TABLE public.regua_cobranca_status ADD COLUMN cliente_id UUID REFERENCES public.clientes(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'regua_cobranca_status' AND column_name = 'status') THEN
        ALTER TABLE public.regua_cobranca_status ADD COLUMN status TEXT DEFAULT 'pendente';
    END IF;
END $$;

-- Garante que o status_cobranca atual reflita o status simplificado se necessário
-- Mas vamos manter as colunas que o hook usa para evitar quebra de tipos.
