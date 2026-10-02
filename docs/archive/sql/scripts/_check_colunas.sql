SELECT column_name, data_type FROM information_schema.columns
WHERE table_schema='public' AND table_name IN ('contas_pagar','contas_receber','contas_bancarias','transacoes_bancarias')
ORDER BY table_name, ordinal_position;
