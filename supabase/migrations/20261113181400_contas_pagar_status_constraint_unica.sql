-- contas_pagar: duas CHECK de status contraditórias coexistiam em produção:
--   chk_contas_pagar_status   (20260712113738:3-7)  pendente,pago,vencido,cancelado,parcial
--   contas_pagar_status_check (20261112024215:4-6)  pendente,pago,atrasado,cancelado,parcial
-- A interseção efetiva rejeitava 'vencido' e 'atrasado'. Mas 'vencido' é o status de
-- conta vencida que o sistema lê: StatusPagamento (src/types/financial.ts:1),
-- statusConfig (src/components/contas-pagar/ContasPagarTableRow.helpers.ts:29),
-- filtro (ContasPagarFilters.tsx:82), totais (useContasPagarLogic.calculos.ts:44 e
-- função totais_contas_pagar). 'atrasado' não tem gravador nem tipo no front; só é lido
-- de forma defensiva junto com 'vencido' (nfe_suggest_contas_pagar, copilot-global).
-- Efeito: fica UMA constraint, com a lista do tipo StatusPagamento; 'vencido' passa a ser
-- aceito, 'atrasado' continua rejeitado (como já era). Dados atuais: pendente/pago/cancelado.
ALTER TABLE public.contas_pagar DROP CONSTRAINT IF EXISTS contas_pagar_status_check;
ALTER TABLE public.contas_pagar DROP CONSTRAINT IF EXISTS chk_contas_pagar_status;
ALTER TABLE public.contas_pagar ADD CONSTRAINT chk_contas_pagar_status
  CHECK ((status)::text = ANY (ARRAY['pendente','pago','vencido','cancelado','parcial']::text[])) NOT VALID;
ALTER TABLE public.contas_pagar VALIDATE CONSTRAINT chk_contas_pagar_status;
