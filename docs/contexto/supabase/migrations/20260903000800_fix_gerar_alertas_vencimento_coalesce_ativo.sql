DROP FUNCTION IF EXISTS public.gerar_alertas_vencimento() CASCADE

CREATE OR REPLACE FUNCTION public.gerar_alertas_vencimento() RETURNS integer — substitui COALESCE(ue.ativo, true) por ue.ativo = true no CTE destinos (alinha com empresa_acessivel)
