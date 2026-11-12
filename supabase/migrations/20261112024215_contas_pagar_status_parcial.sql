-- contas_pagar: o pagamento parcial (RegistrarPagamentoDialog.tsx:178 e
-- fn_sync_valor_pago_movimentacao) grava status 'parcial', mas a constraint não
-- aceitava esse valor → todo pagamento parcial de conta a pagar falhava.
ALTER TABLE public.contas_pagar DROP CONSTRAINT IF EXISTS contas_pagar_status_check;
ALTER TABLE public.contas_pagar ADD CONSTRAINT contas_pagar_status_check
  CHECK ((status)::text = ANY (ARRAY['pendente','pago','atrasado','cancelado','parcial']::text[]));
