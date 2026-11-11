-- Shim: cria job 'enviar-digest-conformidade-diario' no pg_cron para que
-- a migration 20260726180529 possa cron.unschedule() sem 'could not find valid entry'.
-- Em produção o job já existe — IF NOT EXISTS garante no-op.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'enviar-digest-conformidade-diario') THEN
    PERFORM cron.schedule('enviar-digest-conformidade-diario', '0 8 * * *', 'SELECT 1');
  END IF;
END $$;
