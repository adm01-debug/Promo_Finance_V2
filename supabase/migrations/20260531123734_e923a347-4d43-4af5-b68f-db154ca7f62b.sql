-- 1) Restore missing Multi-empresa core tables
CREATE TABLE IF NOT EXISTS public.user_empresas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL DEFAULT 'visualizador',
  is_default BOOLEAN NOT NULL DEFAULT false,
  provisioned_via TEXT NOT NULL DEFAULT 'manual' CHECK (provisioned_via IN ('manual','sso','scim')),
  scim_external_id TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, empresa_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_empresas TO authenticated;
GRANT ALL ON public.user_empresas TO service_role;

ALTER TABLE public.user_empresas ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_empresas' AND policyname = 'Users view own empresa links') THEN
    CREATE POLICY "Users view own empresa links" ON public.user_empresas FOR SELECT TO authenticated
    USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_empresas' AND policyname = 'Admins manage user_empresas') THEN
    CREATE POLICY "Admins manage user_empresas" ON public.user_empresas FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.scim_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID REFERENCES public.sso_providers(id) ON DELETE CASCADE,
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  token_prefix TEXT NOT NULL,
  nome TEXT NOT NULL,
  expires_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.scim_tokens TO authenticated;
GRANT ALL ON public.scim_tokens TO service_role;

ALTER TABLE public.scim_tokens ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'scim_tokens' AND policyname = 'Admins manage scim_tokens') THEN
    CREATE POLICY "Admins manage scim_tokens" ON public.scim_tokens FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));
  END IF;
END $$;

-- 2) Enable RLS on missing tables
ALTER TABLE public.verificacoes_conformidade ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidencias_pacotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regua_cobranca_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regimes_especiais_empresa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimentacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fluxos_aprovacao_niveis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creditos_tributarios ENABLE ROW LEVEL SECURITY;

-- 3) Add basic RLS policies for these tables (scoped to empresa_id)
DO $$ 
DECLARE
  t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY['verificacoes_conformidade', 'regua_cobranca_status', 'regimes_especiais_empresa', 'movimentacoes', 'fluxos_aprovacao_niveis', 'creditos_tributarios'])
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Access by empresa_id" ON public.%I', t);
    EXECUTE format('CREATE POLICY "Access by empresa_id" ON public.%I FOR ALL TO authenticated USING (
      empresa_id IN (SELECT empresa_id FROM public.user_empresas WHERE user_id = auth.uid() AND ativo = true) OR
      EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = ''admin'')
    )', t);
  END LOOP;
END $$;

-- Special policy for evidencias_pacotes (linked to verificacoes_conformidade)
-- Guard: 42703 — verificacao_id column may not exist on preview branch
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='evidencias_pacotes' AND column_name='verificacao_id') THEN
        DROP POLICY IF EXISTS "Access by verification_id" ON public.evidencias_pacotes;
        EXECUTE $sql$CREATE POLICY "Access by verification_id" ON public.evidencias_pacotes FOR ALL TO authenticated USING (
  verificacao_id IN (SELECT id FROM public.verificacoes_conformidade)
)$sql$;
    END IF;
END $$;

-- 4) Harden all SECURITY DEFINER functions with search_path
DO $$
DECLARE
  fn record;
  fn_signature text;
BEGIN
  FOR fn IN
    SELECT
      p.oid,
      n.nspname AS schema_name,
      p.proname AS fn_name,
      pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE p.prosecdef = true
      AND n.nspname = 'public'
  LOOP
    fn_signature := format('%I.%I(%s)', fn.schema_name, fn.fn_name, fn.args);
    BEGIN
      EXECUTE format(
        'ALTER FUNCTION %s SET search_path = public, pg_catalog',
        fn_signature
      );
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Could not pin search_path on %: %', fn_signature, SQLERRM;
    END;
  END LOOP;
END $$;

-- 5) Fix Views (Security Invoker)
DO $$
DECLARE
  v record;
BEGIN
  FOR v IN 
    SELECT viewname, definition 
    FROM pg_views 
    WHERE schemaname = 'public' 
      AND viewname NOT IN (
        SELECT relname 
        FROM pg_class c 
        JOIN pg_namespace n ON n.oid = c.relnamespace 
        WHERE n.nspname = 'public' AND relkind = 'v' AND reloptions @> ARRAY['security_invoker=on']
      )
  LOOP
    BEGIN
      EXECUTE format('CREATE OR REPLACE VIEW public.%I WITH (security_invoker = true) AS %s', v.viewname, v.definition);
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Could not recreate view % with security_invoker: %', v.viewname, SQLERRM;
    END;
  END LOOP;
END $$;
