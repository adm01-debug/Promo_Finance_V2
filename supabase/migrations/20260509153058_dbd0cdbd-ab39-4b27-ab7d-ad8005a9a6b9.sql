-- Adicionar colunas de IA para insights no WhatsApp
ALTER TABLE public.historico_cobranca_whatsapp 
ADD COLUMN IF NOT EXISTS ia_sentimento TEXT,
ADD COLUMN IF NOT EXISTS ia_resumo TEXT,
ADD COLUMN IF NOT EXISTS ia_proxima_acao TEXT;

-- Criar índice para performance em filtros de IA
CREATE INDEX IF NOT EXISTS idx_whatsapp_ia_sentimento ON public.historico_cobranca_whatsapp(ia_sentimento);

-- Comentários para documentação
COMMENT ON COLUMN public.historico_cobranca_whatsapp.ia_sentimento IS 'Sentimento detectado pela IA (positivo, neutro, negativo, agressivo)';
COMMENT ON COLUMN public.historico_cobranca_whatsapp.ia_resumo IS 'Resumo gerado por IA sobre o conteúdo da conversa';
COMMENT ON COLUMN public.historico_cobranca_whatsapp.ia_proxima_acao IS 'Ação recomendada pela IA baseada no contexto';
