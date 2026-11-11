-- Shim: adiciona empresa_id a auditoria_financeira antes de 20260619145930
-- que cria POLICY "auditoria_financeira_empresa_select" referenciando empresa_id (42703)
-- tabela criada em 20260317000749 sem essa coluna; 20260518165826 tentou CREATE IF NOT EXISTS
-- mas a tabela já existia, então a coluna nunca foi adicionada
ALTER TABLE public.auditoria_financeira
ADD COLUMN IF NOT EXISTS empresa_id UUID;
