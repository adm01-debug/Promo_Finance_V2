-- Shim: adiciona empresa_id a bitrix_field_mappings e budgets antes de 20260519121419
-- que cria policies referenciando empresa_id (tabelas criadas sem essa coluna)
ALTER TABLE public.bitrix_field_mappings
ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES public.empresas(id);

ALTER TABLE public.budgets
ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES public.empresas(id);
