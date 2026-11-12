-- Os jobs `monitorar-erros-frontend` e `webhook-retry-worker-1min` enviam
-- x-cron-secret = public.internal_job_secret() (Vault `regua_cron_secret`), mas as
-- functions validam contra integration_secrets.chave = 'internal_jobs'
-- (exigirChamadaInterna, chave padrão em supabase/functions/_shared/auth-guard.ts:276
-- e :288; webhook-retry-worker/index.ts:49; monitorar-erros-frontend/index.ts:117).
-- - monitorar-erros-frontend: 401 chamada_nao_autorizada em 100% das execuções
--   (12/12 em 12/11/2026, edge_function_logs). Com o segredo `internal_jobs` a mesma
--   chamada responde 200 {"success":true,...} (net request 199266).
-- - webhook-retry-worker-1min: hoje responde 200 só porque a versão publicada diverge
--   do repo; com o segredo `internal_jobs` também responde 200 (net request 199467),
--   então a troca é segura e evita 401 no próximo deploy da function.
-- Troca só a origem do header; URL, body e agenda ficam iguais. Idempotente.
DO $$
DECLARE
  v_job text;
BEGIN
  FOREACH v_job IN ARRAY ARRAY['monitorar-erros-frontend', 'webhook-retry-worker-1min'] LOOP
    IF EXISTS (
      SELECT 1 FROM cron.job
      WHERE jobname = v_job
        AND command LIKE '%''x-cron-secret'', public.internal_job_secret()%'
    ) THEN
      PERFORM cron.alter_job(
        (SELECT jobid FROM cron.job WHERE jobname = v_job),
        command := replace(
          (SELECT command FROM cron.job WHERE jobname = v_job),
          '''x-cron-secret'', public.internal_job_secret()',
          '''x-cron-secret'', (SELECT valor FROM public.integration_secrets WHERE chave = ''internal_jobs'' LIMIT 1)'
        )
      );
    ELSE
      RAISE NOTICE 'job % não encontrado ou já migrado — nada a fazer', v_job;
    END IF;
  END LOOP;
END $$;
