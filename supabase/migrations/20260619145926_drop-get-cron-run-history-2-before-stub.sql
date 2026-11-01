-- Shim: dropa get_cron_run_history(text, integer) antes de 20260619150007
-- que tenta CREATE OR REPLACE sem defaults mas a função existe com defaults (42P13)
DROP FUNCTION IF EXISTS public.get_cron_run_history(text, integer);
