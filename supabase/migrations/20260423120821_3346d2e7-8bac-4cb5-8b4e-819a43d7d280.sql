ALTER TABLE public.user_anomalia_preferences REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_anomalia_preferences;