-- Hardening do banco (auditoria 11/11/2026). Já aplicado em produção via SQL; esta
-- migration registra a mudança no repositório e é idempotente.
--
-- 1) Fixa search_path em todas as functions de `public` que não o definiam
--    (lint `function_search_path_mutable` — 18 functions). Mantém o caminho
--    efetivo anterior (public, extensions) e coloca pg_temp por último.
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p
    JOIN pg_namespace ns ON ns.oid = p.pronamespace
    WHERE ns.nspname = 'public'
      AND p.prokind = 'f'
      AND NOT EXISTS (
        SELECT 1 FROM unnest(coalesce(p.proconfig, '{}'::text[])) c
        WHERE c LIKE 'search_path=%'
      )
      AND NOT EXISTS (
        SELECT 1 FROM pg_depend d WHERE d.objid = p.oid AND d.deptype = 'e'
      )
  LOOP
    EXECUTE format('ALTER FUNCTION %s SET search_path = public, extensions, pg_temp', r.sig);
  END LOOP;
END $$;

-- 2) Remove o job `evaluate-delivery-alerts-every-min`: chamava a edge function
--    `evaluate-delivery-alerts`, que não existe no repositório nem no projeto
--    (404 a cada minuto).
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'evaluate-delivery-alerts-every-min') THEN
    PERFORM cron.unschedule('evaluate-delivery-alerts-every-min');
  END IF;
END $$;
