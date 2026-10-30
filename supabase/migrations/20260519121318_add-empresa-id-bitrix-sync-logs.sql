-- Shim: adiciona empresa_id a bitrix_sync_logs antes de 20260519121319
-- que cria policy referenciando empresa_id (tabela criada em 20251214201733 sem essa coluna)
ALTER TABLE public.bitrix_sync_logs
ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES public.empresas(id);
