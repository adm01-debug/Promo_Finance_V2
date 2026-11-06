-- Shim: remove is_country_allowed_for_login antes de 20260519121217
-- que faz CREATE OR REPLACE renomeando o parâmetro _country -> p_country_code (42P13)
-- (função existe com parâmetro _country TEXT; mesmo tipo, nome diferente = erro)
DROP FUNCTION IF EXISTS public.is_country_allowed_for_login(TEXT);
