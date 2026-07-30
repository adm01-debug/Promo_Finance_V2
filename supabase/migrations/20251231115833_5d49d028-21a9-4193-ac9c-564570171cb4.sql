-- Tabela para sessões ativas do usuário
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  device_info text,
  ip_address text,
  user_agent text,
  last_activity timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  is_current boolean DEFAULT false,
  revoked boolean DEFAULT false,
  revoked_at timestamp with time zone
);

-- Tabela para rate limiting
CREATE TABLE IF NOT EXISTS public.rate_limit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address text NOT NULL,
  endpoint text NOT NULL,
  requests_count integer DEFAULT 1,
  window_start timestamp with time zone DEFAULT now(),
  blocked boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- Tabela para IPs bloqueados automaticamente
CREATE TABLE IF NOT EXISTS public.blocked_ips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address text NOT NULL UNIQUE,
  reason text,
  blocked_at timestamp with time zone DEFAULT now(),
  blocked_until timestamp with time zone,
  permanent boolean DEFAULT false,
  blocked_by uuid,
  unblocked_at timestamp with time zone,
  unblocked_by uuid,
  created_at timestamp with time zone DEFAULT now()
);

-- Tabela para configuração de permissões granulares
CREATE TABLE IF NOT EXISTS public.permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  module text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Tabela para vincular roles com permissões
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role app_role NOT NULL,
  permission_id uuid REFERENCES public.permissions(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(role, permission_id)
);

-- Tabela para alertas de segurança
CREATE TABLE IF NOT EXISTS public.security_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  severity text NOT NULL DEFAULT 'medium',
  title text NOT NULL,
  description text,
  ip_address text,
  user_id uuid,
  user_email text,
  metadata jsonb,
  resolved boolean DEFAULT false,
  resolved_at timestamp with time zone,
  resolved_by uuid,
  created_at timestamp with time zone DEFAULT now()
);

-- Tabela para lockout de conta
CREATE TABLE IF NOT EXISTS public.account_lockouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email text NOT NULL,
  failed_attempts integer DEFAULT 0,
  locked_until timestamp with time zone,
  last_failed_attempt timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Inserir permissões padrão do sistema
INSERT INTO public.permissions (name, description, module) VALUES
  ('dashboard.view', 'Visualizar dashboard', 'dashboard'),
  ('dashboard.edit', 'Editar configurações do dashboard', 'dashboard'),
  ('contas_pagar.view', 'Visualizar contas a pagar', 'financeiro'),
  ('contas_pagar.create', 'Criar contas a pagar', 'financeiro'),
  ('contas_pagar.edit', 'Editar contas a pagar', 'financeiro'),
  ('contas_pagar.delete', 'Excluir contas a pagar', 'financeiro'),
  ('contas_receber.view', 'Visualizar contas a receber', 'financeiro'),
  ('contas_receber.create', 'Criar contas a receber', 'financeiro'),
  ('contas_receber.edit', 'Editar contas a receber', 'financeiro'),
  ('contas_receber.delete', 'Excluir contas a receber', 'financeiro'),
  ('usuarios.view', 'Visualizar usuários', 'admin'),
  ('usuarios.create', 'Criar usuários', 'admin'),
  ('usuarios.edit', 'Editar usuários', 'admin'),
  ('usuarios.delete', 'Excluir usuários', 'admin'),
  ('roles.manage', 'Gerenciar roles e permissões', 'admin'),
  ('security.view', 'Visualizar configurações de segurança', 'admin'),
  ('security.manage', 'Gerenciar configurações de segurança', 'admin'),
  ('relatorios.view', 'Visualizar relatórios', 'relatorios'),
  ('relatorios.export', 'Exportar relatórios', 'relatorios'),
  ('audit.view', 'Visualizar logs de auditoria', 'admin'),
  ('clientes.view', 'Visualizar clientes', 'cadastro'),
  ('clientes.manage', 'Gerenciar clientes', 'cadastro'),
  ('fornecedores.view', 'Visualizar fornecedores', 'cadastro'),
  ('fornecedores.manage', 'Gerenciar fornecedores', 'cadastro'),
  ('nfe.view', 'Visualizar notas fiscais', 'fiscal'),
  ('nfe.emit', 'Emitir notas fiscais', 'fiscal'),
  ('nfe.cancel', 'Cancelar notas fiscais', 'fiscal')
ON CONFLICT (name) DO NOTHING;

-- Vincular permissões padrão aos roles
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'admin'::app_role, id FROM public.permissions
ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role, permission_id)
SELECT 'financeiro'::app_role, id FROM public.permissions 
WHERE module IN ('dashboard', 'financeiro', 'relatorios', 'cadastro')
ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role, permission_id)
SELECT 'operacional'::app_role, id FROM public.permissions 
WHERE name IN ('dashboard.view', 'contas_pagar.view', 'contas_pagar.create', 'contas_receber.view', 'contas_receber.create', 'clientes.view', 'fornecedores.view')
ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role, permission_id)
SELECT 'visualizador'::app_role, id FROM public.permissions 
WHERE name LIKE '%.view'
ON CONFLICT DO NOTHING;

-- Enable RLS
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_ips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_lockouts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own sessions" ON public.user_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions" ON public.user_sessions
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "System can manage sessions" ON public.user_sessions
  FOR ALL USING (true);

CREATE POLICY "Admins can view rate limit logs" ON public.rate_limit_logs
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "System can manage rate limit logs" ON public.rate_limit_logs
  FOR ALL USING (true);

CREATE POLICY "Admins can manage blocked IPs" ON public.blocked_ips
  FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert blocked IPs" ON public.blocked_ips
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated can view permissions" ON public.permissions
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage permissions" ON public.permissions
  FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated can view role_permissions" ON public.role_permissions
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage role_permissions" ON public.role_permissions
  FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view security alerts" ON public.security_alerts
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update security alerts" ON public.security_alerts
  FOR UPDATE USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert security alerts" ON public.security_alerts
  FOR INSERT WITH CHECK (true);

CREATE POLICY "System can manage account lockouts" ON public.account_lockouts
  FOR ALL USING (true);

-- Função para verificar permissão
CREATE OR REPLACE FUNCTION public.has_permission(_user_id uuid, _permission text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.role_permissions rp ON rp.role = ur.role
    JOIN public.permissions p ON p.id = rp.permission_id
    WHERE ur.user_id = _user_id
      AND p.name = _permission
  )
$$;

-- Função para verificar lockout
CREATE OR REPLACE FUNCTION public.check_account_lockout(_email text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.account_lockouts
    WHERE user_email = _email
      AND locked_until > now()
  )
$$;

-- Função para incrementar tentativas falhas
CREATE OR REPLACE FUNCTION public.increment_failed_attempts(_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_attempts INTEGER;
  max_attempts INTEGER := 5;
  lockout_minutes INTEGER := 30;
BEGIN
  INSERT INTO public.account_lockouts (user_email, failed_attempts, last_failed_attempt, updated_at)
  VALUES (_email, 1, now(), now())
  ON CONFLICT (user_email) DO UPDATE
  SET failed_attempts = account_lockouts.failed_attempts + 1,
      last_failed_attempt = now(),
      updated_at = now(),
      locked_until = CASE 
        WHEN account_lockouts.failed_attempts + 1 >= max_attempts 
        THEN now() + (lockout_minutes || ' minutes')::interval
        ELSE account_lockouts.locked_until
      END;
  
  -- Verificar se atingiu o limite e criar alerta
  SELECT failed_attempts INTO current_attempts 
  FROM public.account_lockouts WHERE user_email = _email;
  
  IF current_attempts >= max_attempts THEN
    INSERT INTO public.security_alerts (type, severity, title, description, user_email)
    VALUES ('account_locked', 'high', 'Conta bloqueada por tentativas excessivas', 
            format('A conta %s foi bloqueada após %s tentativas falhas de login', _email, current_attempts),
            _email);
  END IF;
END;
$$;

-- Função para resetar tentativas após login bem-sucedido
CREATE OR REPLACE FUNCTION public.reset_failed_attempts(_email text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.account_lockouts WHERE user_email = _email;
$$;

-- Criar índice único para lockouts
CREATE UNIQUE INDEX IF NOT EXISTS idx_account_lockouts_email ON public.account_lockouts(user_email);

-- Enable realtime para alertas de segurança
ALTER PUBLICATION supabase_realtime ADD TABLE public.security_alerts;