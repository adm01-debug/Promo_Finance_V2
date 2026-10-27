-- Shim: remove log_sso_onboarding_event(uuid) antes de 20260519134956
-- que redefine _provider_id como TEXT (vs UUID na 20260421191905)
-- sem o drop, GRANT na linha final falha com 42725 (nome não único)
DROP FUNCTION IF EXISTS public.log_sso_onboarding_event(text, text, uuid, jsonb, boolean, text, text);
