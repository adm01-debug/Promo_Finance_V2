-- Shim: adiciona verificacao_id a evidencias_pacotes antes de 20260531123734
-- que cria POLICY "Access by verification_id" referenciando verificacao_id (42703)
-- tabela criada em 20260421122811 sem essa coluna; 20260519122543 tentou CREATE IF NOT EXISTS
-- mas a tabela já existia, então a coluna nunca foi adicionada
ALTER TABLE public.evidencias_pacotes
ADD COLUMN IF NOT EXISTS verificacao_id UUID REFERENCES public.verificacoes_conformidade(id);
