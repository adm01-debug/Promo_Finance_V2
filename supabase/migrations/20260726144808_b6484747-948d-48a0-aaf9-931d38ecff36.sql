REVOKE EXECUTE ON FUNCTION public.lancamento_contabil_before_insert() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.lancamento_contabil_before_update() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validar_partidas_dobradas() FROM PUBLIC, anon, authenticated;