-- Step 21: DEFAULT seguro em colunas asaas de boletos
-- Verificado: boletos.asaas_id e boletos.external_provider existem como TEXT nullable sem DEFAULT.
-- NÃO adicionamos NOT NULL sem DEFAULT em produção — apenas defaults seguros.

ALTER TABLE boletos ALTER COLUMN asaas_id SET DEFAULT '';
ALTER TABLE boletos ALTER COLUMN external_provider SET DEFAULT 'none';
