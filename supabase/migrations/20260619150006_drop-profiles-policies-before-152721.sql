-- Shim: dropa policies de profiles antes de 20260619152721
-- que recria "Users can view own profile", "Users can update own profile"
-- e "Admins can manage profiles" (42710 — already exists)
-- Criadas originalmente em 20251214170739 e já existem no banco
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage profiles" ON public.profiles;
