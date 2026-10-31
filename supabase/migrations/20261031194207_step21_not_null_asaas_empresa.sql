-- Step 21: Enforçar NOT NULL em asaas_payments.empresa_id e asaas_customers.empresa_id
-- Pré-condição verificada: 0 nulos em ambas as tabelas antes da execução
ALTER TABLE public.asaas_payments ALTER COLUMN empresa_id SET NOT NULL;
ALTER TABLE public.asaas_customers ALTER COLUMN empresa_id SET NOT NULL;
