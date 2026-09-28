-- Shim: dropa schema cron criado pelo stub em 20260711192250
-- para que CREATE EXTENSION pg_cron em 20260711192251 rode sem 2BP01.
-- 2BP01 ocorre quando cron schema existe com ACLs conflitantes;
-- com namespace limpo, pg_cron instala sem conflito (mesma build do prod v1.6.4).
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    RETURN; -- já instalado, no-op
  END IF;
  IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'cron') THEN
    DROP SCHEMA cron CASCADE;
  END IF;
END $$;
