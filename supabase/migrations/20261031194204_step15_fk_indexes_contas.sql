-- Step 15: Índices FK ausentes em contas_pagar e contas_receber
CREATE INDEX IF NOT EXISTS idx_contas_pagar_centro_custo ON public.contas_pagar(centro_custo_id);
CREATE INDEX IF NOT EXISTS idx_contas_pagar_conta_bancaria ON public.contas_pagar(conta_bancaria_id);
CREATE INDEX IF NOT EXISTS idx_contas_receber_centro_custo ON public.contas_receber(centro_custo_id);
CREATE INDEX IF NOT EXISTS idx_contas_receber_conta_bancaria ON public.contas_receber(conta_bancaria_id);
