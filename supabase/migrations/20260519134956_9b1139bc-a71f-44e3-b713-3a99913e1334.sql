-- Create user_action_audit table
CREATE TABLE IF NOT EXISTS public.user_action_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    action_type TEXT NOT NULL,
    entity_type TEXT,
    old_value JSONB,
    new_value JSONB,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_action_audit ENABLE ROW LEVEL SECURITY;

-- Policies for user_action_audit
-- Guard: 42710 — policies may already exist on preview branch
DROP POLICY IF EXISTS "Users can view their own audit logs" ON public.user_action_audit;
CREATE POLICY "Users can view their own audit logs"
    ON public.user_action_audit FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own audit logs" ON public.user_action_audit;
CREATE POLICY "Users can insert their own audit logs"
    ON public.user_action_audit FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Create sso_login_attempts table
CREATE TABLE IF NOT EXISTS public.sso_login_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT,
    provider_id TEXT,
    event_type TEXT NOT NULL,
    success BOOLEAN DEFAULT true,
    error_code TEXT,
    error_message TEXT,
    context JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sso_login_attempts ENABLE ROW LEVEL SECURITY;

-- Policies for sso_login_attempts (admin only or restricted)
-- Guard: 42710 — policy may already exist on preview branch
DROP POLICY IF EXISTS "Admins can view SSO login attempts" ON public.sso_login_attempts;
CREATE POLICY "Admins can view SSO login attempts"
    ON public.sso_login_attempts FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'super_admin')
    ));

-- Function to log SSO onboarding events (SECURITY DEFINER to allow logging without auth)
CREATE OR REPLACE FUNCTION public.log_sso_onboarding_event(
    _email TEXT,
    _event_type TEXT,
    _provider_id TEXT DEFAULT NULL,
    _context JSONB DEFAULT '{}'::jsonb,
    _success BOOLEAN DEFAULT true,
    _error_code TEXT DEFAULT NULL,
    _error_message TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
    INSERT INTO public.sso_login_attempts (
        email,
        event_type,
        provider_id,
        context,
        success,
        error_code,
        error_message
    ) VALUES (
        _email,
        _event_type,
        _provider_id,
        _context,
        _success,
        _error_code,
        _error_message
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant execution to public (the function handles the security/insertion)
GRANT EXECUTE ON FUNCTION public.log_sso_onboarding_event TO anon, authenticated;
