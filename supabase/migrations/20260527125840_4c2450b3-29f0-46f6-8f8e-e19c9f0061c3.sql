-- Fix security issues and search paths for existing functions
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column' AND pronamespace = 'public'::regnamespace) THEN
        ALTER FUNCTION public.update_updated_at_column() SET search_path = public;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_conta_status' AND pronamespace = 'public'::regnamespace) THEN
        ALTER FUNCTION public.update_conta_status() SET search_path = public;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'audit_trigger_func' AND pronamespace = 'public'::regnamespace) THEN
        ALTER FUNCTION public.audit_trigger_func() SET search_path = public;
    END IF;
END $$;

-- Fix RLS policy for audit_log if it exists
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'audit_log') THEN
        DROP POLICY IF EXISTS "System can insert audit_log" ON public.audit_log;
        CREATE POLICY "System and auth users can insert audit_log"
            ON public.audit_log FOR INSERT
            WITH CHECK (auth.uid() IS NOT NULL AND (user_id = auth.uid() OR user_id IS NULL));
    END IF;
END $$;
