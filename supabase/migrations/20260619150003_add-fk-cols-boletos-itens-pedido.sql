-- Shim: adiciona conta_receber_id a historico_cobrancas_boletos e
-- pedido_id a itens_pedido_compra antes de 20260619150341
-- que cria policies usando essas colunas como JOIN (42703)
ALTER TABLE public.historico_cobrancas_boletos
ADD COLUMN IF NOT EXISTS conta_receber_id UUID REFERENCES public.contas_receber(id);

ALTER TABLE public.itens_pedido_compra
ADD COLUMN IF NOT EXISTS pedido_id UUID REFERENCES public.pedidos_compra(id);
