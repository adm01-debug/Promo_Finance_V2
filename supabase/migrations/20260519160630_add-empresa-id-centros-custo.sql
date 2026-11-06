-- Shim: adiciona empresa_id a centros_custo antes de 20260519160631
-- que faz CREATE VIEW vw_gastos_centro_custo SELECT empresa_id FROM centros_custo (42703)
-- tabela criada em 20251214170739 sem essa coluna; 20260518153331 tentou CREATE IF NOT EXISTS
-- mas a tabela já existia, então a coluna nunca foi adicionada
ALTER TABLE public.centros_custo
ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE;
