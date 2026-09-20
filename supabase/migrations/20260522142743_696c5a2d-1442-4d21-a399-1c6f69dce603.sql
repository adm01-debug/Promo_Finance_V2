-- Fix remaining Security Definer Views (change to SECURITY INVOKER)
-- Guard de replay: estas views de entregas só são criadas em
-- 20260825100000_reconciliar_schema_completo — no replay do zero elas não
-- existem neste ponto e o ALTER nu quebrava o Supabase Preview (PR #88).
DO $$
BEGIN
  IF to_regclass('public.drivers_safe_view') IS NOT NULL THEN
    EXECUTE 'ALTER VIEW public.drivers_safe_view SET (security_invoker = on)';
  END IF;
  IF to_regclass('public.orders_operator_view') IS NOT NULL THEN
    EXECUTE 'ALTER VIEW public.orders_operator_view SET (security_invoker = on)';
  END IF;
  IF to_regclass('public.orders_safe_view') IS NOT NULL THEN
    EXECUTE 'ALTER VIEW public.orders_safe_view SET (security_invoker = on)';
  END IF;
END
$$;