CREATE OR REPLACE FUNCTION public.reset_failed_attempts(_email text) — adiciona verificacao auth.email() para impedir reset do counter de outro usuario
