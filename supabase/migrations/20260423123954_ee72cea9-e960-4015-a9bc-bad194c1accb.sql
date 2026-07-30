ALTER TABLE public.transacoes_bancarias REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.transacoes_bancarias;