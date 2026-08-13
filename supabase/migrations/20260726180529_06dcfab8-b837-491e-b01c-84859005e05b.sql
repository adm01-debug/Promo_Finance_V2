SELECT cron.unschedule('enviar-digest-conformidade-diario');

SELECT cron.schedule(
  'enviar-digest-conformidade-horario',
  '30 * * * *',
  $$
  select net.http_post(
    url := 'https://lszcmoymovkpckehlagr.supabase.co/functions/v1/enviar-digest-conformidade',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzemNtb3ltb3ZrcGNrZWhsYWdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2ODE2MTAsImV4cCI6MjA5NDI1NzYxMH0.ksTr8881Ic6U5doXsrEETVL9fGsaddNPf-m1lAt1pw0',
      'x-cron-secret', (select valor from public.integration_secrets where chave = 'conformidade_cron' limit 1)
    ),
    body := jsonb_build_object('severidadeMinima', 'baixa', 'limite', 300)
  ) as request_id;
  $$
);