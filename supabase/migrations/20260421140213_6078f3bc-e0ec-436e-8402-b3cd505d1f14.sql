ALTER TABLE public.anomalias_detectadas REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.anomalias_detectadas;