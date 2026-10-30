-- Shim: dropa get_cron_jobs() antes de 20260619150007
-- que tenta CREATE OR REPLACE com RETURNS SETOF record mas a função
-- existe como RETURNS jsonb desde 20260518170823 (42P13)
-- 20260728110753 recria a função corretamente mais adiante.
DROP FUNCTION IF EXISTS public.get_cron_jobs();
