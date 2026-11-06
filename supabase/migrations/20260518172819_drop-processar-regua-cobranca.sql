-- Shim: remove processar_regua_cobranca antes de 20260518180925
-- que faz CREATE OR REPLACE mudando o tipo de retorno (42P13)
-- (função existe com tipo diferente; CREATE OR REPLACE não pode alterar retorno)
DROP FUNCTION IF EXISTS public.processar_regua_cobranca(UUID, BOOLEAN);
DROP FUNCTION IF EXISTS public.processar_regua_cobranca();
