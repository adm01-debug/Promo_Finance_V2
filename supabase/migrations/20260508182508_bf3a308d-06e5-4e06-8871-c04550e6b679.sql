ALTER TABLE public.asaas_config 
ADD COLUMN IF NOT EXISTS bitrix_trigger_stage TEXT DEFAULT 'WON';

COMMENT ON COLUMN public.asaas_config.bitrix_trigger_stage IS 'ID da etapa do Bitrix24 que dispara a geração automática de boletos Asaas.';
