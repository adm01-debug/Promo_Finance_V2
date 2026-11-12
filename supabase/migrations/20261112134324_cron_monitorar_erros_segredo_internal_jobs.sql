-- O job `monitorar-erros-frontend` envia x-cron-secret = public.internal_job_secret()
-- (Vault `regua_cron_secret`), mas a function valida contra
-- integration_secrets.chave = 'internal_jobs' (exigirChamadaInterna, chave padrão em
-- supabase/functions/_shared/auth-guard.ts:276 e :288) → 401 chamada_nao_autorizada
-- em 100% das execuções (12/12 em 12/11/2026, edge_function_logs). Com o segredo
-- `internal_jobs` a mesma chamada responde 200 {"success":true,...}.
-- Troca só a origem do header; URL, body e agenda ficam iguais. Idempotente.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM cron.job
    WHERE jobname = 'monitorar-erros-frontend'
      AND command LIKE '%''x-cron-secret'', public.internal_job_secret()%'
  ) THEN
    PERFORM cron.alter_job(
      (SELECT jobid FROM cron.job WHERE jobname = 'monitorar-erros-frontend'),
      command := replace(
        (SELECT command FROM cron.job WHERE jobname = 'monitorar-erros-frontend'),
        '''x-cron-secret'', public.internal_job_secret()',
        '''x-cron-secret'', (SELECT valor FROM public.integration_secrets WHERE chave = ''internal_jobs'' LIMIT 1)'
      )
    );
  END IF;
END $$;
