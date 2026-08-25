-- E10/E11: REVOKE anon cirúrgico (2026-08-25)
-- Todas as edge functions usam SERVICE_ROLE_KEY ou JWT (authenticated)
-- anon nunca chega ao banco com dados sensíveis em produção
-- EXCEÇÃO: frontend_error_logs INSERT (browser tracking sem login)

-- REVOKE ALL em tabelas
DO $$ DECLARE r record; cnt integer:=0;
BEGIN
  FOR r IN SELECT c.relname FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
           WHERE n.nspname='public' AND c.relkind IN ('r','v','f','p') ORDER BY c.relname LOOP
    BEGIN EXECUTE format('REVOKE ALL ON public.%I FROM anon', r.relname); cnt:=cnt+1;
    EXCEPTION WHEN OTHERS THEN NULL; END;
  END LOOP;
  RAISE NOTICE 'REVOKE ALL FROM anon: % tabelas', cnt;
END $$;

-- REVOKE EXECUTE em funções
DO $$ DECLARE r record; cnt integer:=0;
BEGIN
  FOR r IN SELECT p.oid, p.proname, pg_get_function_identity_arguments(p.oid) AS args
           FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' LOOP
    BEGIN EXECUTE format('REVOKE EXECUTE ON FUNCTION public.%I(%s) FROM anon', r.proname, r.args); cnt:=cnt+1;
    EXCEPTION WHEN OTHERS THEN NULL; END;
  END LOOP;
  RAISE NOTICE 'REVOKE EXECUTE FROM anon: % funções', cnt;
END $$;

-- Reatribuir exceção legítima
GRANT INSERT ON public.frontend_error_logs TO anon;
