-- Garantir REPLICA IDENTITY FULL para enviar payload completo nos eventos realtime
ALTER TABLE public.audit_logs REPLICA IDENTITY FULL;

-- Adicionar tabela à publicação supabase_realtime (idempotente)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'audit_logs'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.audit_logs';
  END IF;
END $$;