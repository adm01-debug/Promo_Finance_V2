SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('webhooks_log','webhook_events','extrato_bancario','movimentacoes','profiles')
ORDER BY table_name, ordinal_position;
