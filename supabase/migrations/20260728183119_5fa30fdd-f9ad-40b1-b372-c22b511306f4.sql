-- Gap #28 — agendamento semanal do digest de silenciamentos.
-- Segunda-feira, 11:00 UTC (08:00 BRT): o time recebe a lista antes do
-- planejamento da semana e decide renovar ou tratar a causa raiz.
DO $do$
BEGIN
  PERFORM cron.unschedule('digest-silenciamentos-erro')
  WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'digest-silenciamentos-erro');

  PERFORM cron.schedule(
    'digest-silenciamentos-erro',
    '0 11 * * 1',
    $cmd$
    SELECT net.http_post(
      url := 'https://lszcmoymovkpckehlagr.supabase.co/functions/v1/digest-silenciamentos-erro',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'apikey', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzemNtb3ltb3ZrcGNrZWhsYWdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2ODE2MTAsImV4cCI6MjA5NDI1NzYxMH0.ksTr8881Ic6U5doXsrEETVL9fGsaddNPf-m1lAt1pw0'
      ),
      body := jsonb_build_object('janelaHoras', 168, 'minIntervaloHoras', 144)
    ) AS request_id;
    $cmd$
  );
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'pg_cron schedule skipped: %', SQLERRM;
END
$do$;