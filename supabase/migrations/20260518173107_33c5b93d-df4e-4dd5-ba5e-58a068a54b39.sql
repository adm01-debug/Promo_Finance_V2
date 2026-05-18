
-- profiles.empresa_id
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS empresa_id uuid;

-- divergencias_conciliacao.status
ALTER TABLE public.divergencias_conciliacao
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'aberta';

-- extrato_bancario
CREATE TABLE IF NOT EXISTS public.extrato_bancario (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  conta_bancaria_id uuid REFERENCES public.contas_bancarias(id) ON DELETE CASCADE,
  data date NOT NULL,
  descricao text NOT NULL,
  valor numeric NOT NULL,
  tipo text NOT NULL,
  numero_documento text,
  numero_documento_banco text,
  codigo_transacao text,
  arquivo_origem text,
  importado_de text,
  importado_em timestamptz,
  linha_arquivo integer,
  hash_transacao text UNIQUE,
  saldo numeric,
  conciliado boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.extrato_bancario ENABLE ROW LEVEL SECURITY;
CREATE POLICY "extrato_owner_all" ON public.extrato_bancario
  FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- conciliacoes (sessões)
CREATE TABLE IF NOT EXISTS public.conciliacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  empresa_id uuid,
  status text NOT NULL DEFAULT 'em_andamento',
  total_conciliados integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.conciliacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "conciliacoes_owner_all" ON public.conciliacoes
  FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- configuracoes_duplicidade
CREATE TABLE IF NOT EXISTS public.configuracoes_duplicidade (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid,
  campos_validacao jsonb NOT NULL DEFAULT '[]'::jsonb,
  fuzzy_matching boolean NOT NULL DEFAULT false,
  tolerancia_dias integer NOT NULL DEFAULT 0,
  versao integer NOT NULL DEFAULT 1,
  ativo boolean NOT NULL DEFAULT true,
  criado_por uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.configuracoes_duplicidade ENABLE ROW LEVEL SECURITY;
CREATE POLICY "config_dup_admin_all" ON public.configuracoes_duplicidade
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(),'admin'::public.app_role));
CREATE POLICY "config_dup_auth_select" ON public.configuracoes_duplicidade
  FOR SELECT TO authenticated USING (true);

-- security_settings
CREATE TABLE IF NOT EXISTS public.security_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  require_2fa boolean NOT NULL DEFAULT false,
  restrict_by_ip boolean NOT NULL DEFAULT false,
  allowed_global_ips jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.security_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sec_settings_admin_all" ON public.security_settings
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(),'admin'::public.app_role));
CREATE POLICY "sec_settings_auth_select" ON public.security_settings
  FOR SELECT TO authenticated USING (true);

-- allowed_ips
CREATE TABLE IF NOT EXISTS public.allowed_ips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  ip_address text NOT NULL,
  descricao text,
  ativo boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.allowed_ips ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allowed_ips_admin_all" ON public.allowed_ips
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(),'admin'::public.app_role));
