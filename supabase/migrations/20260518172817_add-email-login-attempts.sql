-- Shim: adiciona email a login_attempts antes de 20260518175808
-- que faz UPDATE SET user_email = email (tabela criada em 20251231024758 sem coluna email)
ALTER TABLE public.login_attempts
ADD COLUMN IF NOT EXISTS email TEXT;
