-- Fix remaining Security Definer Views (change to SECURITY INVOKER)
-- Guard: 42P01 — views may not exist on preview branch
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_schema = 'public' AND table_name = 'drivers_safe_view') THEN
        EXECUTE 'ALTER VIEW public.drivers_safe_view SET (security_invoker = on)';
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_schema = 'public' AND table_name = 'orders_operator_view') THEN
        EXECUTE 'ALTER VIEW public.orders_operator_view SET (security_invoker = on)';
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_schema = 'public' AND table_name = 'orders_safe_view') THEN
        EXECUTE 'ALTER VIEW public.orders_safe_view SET (security_invoker = on)';
    END IF;
END $$;
