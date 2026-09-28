-- Fix Supabase Preview replay: drop get_cron_jobs() antes de 20260728110753
-- mudar return type JSONB→TABLE (erro 42P13).
-- Aplicado manualmente em produção; este arquivo serve apenas para replay do Preview.
DROP FUNCTION IF EXISTS public.get_cron_jobs();
