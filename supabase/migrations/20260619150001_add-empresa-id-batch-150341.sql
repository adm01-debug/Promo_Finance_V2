-- Shim batch: adiciona empresa_id às tabelas que precisam antes de 20260619150341
-- que cria policies referenciando empresa_id diretamente (42703)
-- As tabelas apuracoes_tributarias, bitrix_field_mappings, bitrix_sync_logs, centros_custo
-- já tinham empresa_id (statements 3-10 passaram). As demais abaixo faltavam.
ALTER TABLE public.configuracoes_aprovacao
ADD COLUMN IF NOT EXISTS empresa_id UUID;

ALTER TABLE public.execucoes_cobranca
ADD COLUMN IF NOT EXISTS empresa_id UUID;

ALTER TABLE public.fila_cobrancas
ADD COLUMN IF NOT EXISTS empresa_id UUID;

ALTER TABLE public.historico_cobranca
ADD COLUMN IF NOT EXISTS empresa_id UUID;

ALTER TABLE public.notas_fiscais
ADD COLUMN IF NOT EXISTS empresa_id UUID;

ALTER TABLE public.operacoes_tributaveis
ADD COLUMN IF NOT EXISTS empresa_id UUID;

ALTER TABLE public.pedidos_compra
ADD COLUMN IF NOT EXISTS empresa_id UUID;

ALTER TABLE public.pix_templates
ADD COLUMN IF NOT EXISTS empresa_id UUID;

ALTER TABLE public.regimes_simulados
ADD COLUMN IF NOT EXISTS empresa_id UUID;

ALTER TABLE public.regua_cobranca
ADD COLUMN IF NOT EXISTS empresa_id UUID;

ALTER TABLE public.split_payment_transacoes
ADD COLUMN IF NOT EXISTS empresa_id UUID;
