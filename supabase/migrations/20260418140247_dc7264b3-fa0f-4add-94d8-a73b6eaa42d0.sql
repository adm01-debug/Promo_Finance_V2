-- Remove acesso público da MV (corrige WARN 0016)
REVOKE ALL ON public.mv_benchmark_setorial FROM anon, authenticated;
GRANT SELECT ON public.mv_benchmark_setorial TO service_role;