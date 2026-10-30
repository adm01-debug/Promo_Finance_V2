-- Shim: remove has_permission antes de 20260531163029
-- que faz CREATE OR REPLACE renomeando o parâmetro _permission -> _permission_name (42P13)
-- (função existe com parâmetro _permission TEXT; mesmo tipo, nome diferente = erro)
DROP FUNCTION IF EXISTS public.has_permission(uuid, text);
