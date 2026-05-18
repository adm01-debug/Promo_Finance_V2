      WHERE user_id = auth.uid()
      AND role IN ('admin', 'auditor')
    )
  );

CREATE POLICY "Users podem ver seus próprios logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Comentários
COMMENT ON TABLE audit_logs IS 'Log de todas ações sensíveis no sistema';
COMMENT ON FUNCTION audit_trigger_func() IS 'Função genérica de auditoria para triggers';
COMMENT ON FUNCTION get_entity_history(text, uuid) IS 'Busca histórico completo de uma entidade';
-- Tabela para solicitações de reset de senha pendentes
CREATE TABLE public.password_reset_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado', 'rejeitado')),
  motivo_rejeicao text,
  solicitado_em timestamp with time zone NOT NULL DEFAULT now(),
  aprovado_por uuid,
  aprovado_em timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.password_reset_requests ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Qualquer um pode criar solicitação de reset"
ON public.password_reset_requests
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins podem ver todas solicitações"
ON public.password_reset_requests
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins podem atualizar solicitações"
ON public.password_reset_requests
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins podem deletar solicitações"
ON public.password_reset_requests
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));-- Tabela para IPs permitidos por usuário
CREATE TABLE public.allowed_ips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  ip_address text NOT NULL,
  descricao text,
  ativo boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid
);

-- Configuração global de segurança
CREATE TABLE public.security_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  require_2fa boolean DEFAULT false,
  restrict_by_ip boolean DEFAULT false,
  allowed_global_ips text[] DEFAULT '{}',
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_by uuid
);

-- Inserir configuração padrão
INSERT INTO public.security_settings (require_2fa, restrict_by_ip) VALUES (false, false);

-- Habilitar RLS
ALTER TABLE public.allowed_ips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_settings ENABLE ROW LEVEL SECURITY;

-- Políticas para allowed_ips
CREATE POLICY "Usuários podem ver seus próprios IPs"
ON public.allowed_ips
FOR SELECT
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins podem gerenciar IPs"
ON public.allowed_ips
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Políticas para security_settings
CREATE POLICY "Usuários autenticados podem ver configurações"
ON public.security_settings
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins podem atualizar configurações"
ON public.security_settings
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Logs de tentativas de login
CREATE TABLE public.login_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email text NOT NULL,
  ip_address text,
  user_agent text,
  success boolean NOT NULL,
  blocked_reason text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins podem ver tentativas de login"
ON public.login_attempts
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Sistema pode inserir tentativas"
ON public.login_attempts
FOR INSERT
WITH CHECK (true);-- Tabela para sessões ativas do usuário
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
ALTER PUBLICATION supabase_realtime ADD TABLE public.security_alerts;-- Create table to store known devices
CREATE TABLE public.known_devices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  device_fingerprint TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  browser TEXT,
  os TEXT,
  device_type TEXT,
  first_seen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_trusted BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.known_devices ENABLE ROW LEVEL SECURITY;

-- Users can view their own devices
CREATE POLICY "Users can view their own devices" 
ON public.known_devices 
FOR SELECT 
USING (auth.uid() = user_id);

-- Users can insert their own devices
CREATE POLICY "Users can insert their own devices" 
ON public.known_devices 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can update their own devices
CREATE POLICY "Users can update their own devices" 
ON public.known_devices 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Users can delete their own devices
CREATE POLICY "Users can delete their own devices" 
ON public.known_devices 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_known_devices_user_fingerprint ON public.known_devices(user_id, device_fingerprint);

-- Create table for new device alerts
CREATE TABLE public.new_device_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  device_id UUID REFERENCES public.known_devices(id) ON DELETE CASCADE,
  ip_address TEXT,
  user_agent TEXT,
  seen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  acknowledged BOOLEAN DEFAULT false,
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.new_device_alerts ENABLE ROW LEVEL SECURITY;

-- Users can view their own alerts
CREATE POLICY "Users can view their own alerts" 
ON public.new_device_alerts 
FOR SELECT 
USING (auth.uid() = user_id);

-- Users can insert their own alerts
CREATE POLICY "Users can insert their own alerts" 
ON public.new_device_alerts 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can update their own alerts
CREATE POLICY "Users can update their own alerts" 
ON public.new_device_alerts 
FOR UPDATE 
USING (auth.uid() = user_id);-- Create table for WebAuthn credentials
CREATE TABLE IF NOT EXISTS public.webauthn_credentials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  credential_id TEXT NOT NULL UNIQUE,
  public_key TEXT NOT NULL,
  counter INTEGER NOT NULL DEFAULT 0,
  device_name TEXT,
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_webauthn_credentials_user_id ON public.webauthn_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_webauthn_credentials_credential_id ON public.webauthn_credentials(credential_id);

-- Enable RLS
ALTER TABLE public.webauthn_credentials ENABLE ROW LEVEL SECURITY;

-- Users can only manage their own credentials
CREATE POLICY "Users can view their own webauthn credentials"
  ON public.webauthn_credentials
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own webauthn credentials"
  ON public.webauthn_credentials
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own webauthn credentials"
  ON public.webauthn_credentials
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own webauthn credentials"
  ON public.webauthn_credentials
  FOR DELETE
  USING (auth.uid() = user_id);

-- Allow reading credentials by credential_id for authentication (service role only via RPC)
CREATE OR REPLACE FUNCTION public.get_webauthn_credential_by_email(p_email TEXT)
RETURNS TABLE (
  credential_id TEXT,
  user_id UUID,
  public_key TEXT,
  counter INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    wc.credential_id,
    wc.user_id,
    wc.public_key,
    wc.counter
  FROM webauthn_credentials wc
  JOIN profiles p ON p.id = wc.user_id
  WHERE p.email = p_email;
END;
$$;
-- Tabela para países permitidos (whitelist)
CREATE TABLE public.allowed_countries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  country_code TEXT NOT NULL UNIQUE,
  country_name TEXT NOT NULL,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Habilitar RLS
ALTER TABLE public.allowed_countries ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Admins podem gerenciar países" 
ON public.allowed_countries 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Leitura pública para validação" 
ON public.allowed_countries 
FOR SELECT 
USING (true);

-- Adicionar configuração de geo restriction na security_settings
ALTER TABLE public.security_settings 
ADD COLUMN IF NOT EXISTS enable_geo_restriction BOOLEAN DEFAULT false;

-- Inserir Brasil como país padrão permitido
INSERT INTO public.allowed_countries (country_code, country_name) 
VALUES ('BR', 'Brasil');

-- Índice para performance
CREATE INDEX idx_allowed_countries_code ON public.allowed_countries(country_code) WHERE ativo = true;
-- Add lockout_count column to track number of lockouts for exponential backoff
ALTER TABLE public.account_lockouts 
ADD COLUMN IF NOT EXISTS lockout_count integer DEFAULT 0;

-- Update the increment_failed_attempts function with exponential backoff
CREATE OR REPLACE FUNCTION public.increment_failed_attempts(_email text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  current_attempts INTEGER;
  current_lockout_count INTEGER;
  max_attempts INTEGER := 5;
  base_lockout_minutes INTEGER := 1;
  calculated_lockout_minutes INTEGER;
BEGIN
  -- Get current lockout count for exponential calculation
  SELECT COALESCE(lockout_count, 0) INTO current_lockout_count 
  FROM public.account_lockouts WHERE user_email = _email;
  
  IF current_lockout_count IS NULL THEN
    current_lockout_count := 0;
  END IF;

  INSERT INTO public.account_lockouts (user_email, failed_attempts, last_failed_attempt, updated_at, lockout_count)
  VALUES (_email, 1, now(), now(), 0)
  ON CONFLICT (user_email) DO UPDATE
  SET failed_attempts = account_lockouts.failed_attempts + 1,
      last_failed_attempt = now(),
      updated_at = now();

  -- Check if we hit max attempts and need to apply lockout
  SELECT failed_attempts INTO current_attempts 
  FROM public.account_lockouts WHERE user_email = _email;
  
  IF current_attempts >= max_attempts THEN
    -- Calculate exponential lockout: base * 2^lockout_count
    -- 1st lockout: 1 min, 2nd: 2 min, 3rd: 4 min, 4th: 8 min, 5th: 16 min, etc.
    -- Cap at 24 hours (1440 minutes)
    calculated_lockout_minutes := LEAST(base_lockout_minutes * POWER(2, current_lockout_count)::INTEGER, 1440);
    
    UPDATE public.account_lockouts
    SET locked_until = now() + (calculated_lockout_minutes || ' minutes')::interval,
        lockout_count = lockout_count + 1,
        failed_attempts = 0  -- Reset attempts after lockout is applied
    WHERE user_email = _email;
    
    -- Create security alert with lockout duration info
    INSERT INTO public.security_alerts (type, severity, title, description, user_email)
    VALUES ('account_locked', 'high', 
            'Conta bloqueada por tentativas excessivas', 
            format('A conta %s foi bloqueada por %s minutos após %s tentativas falhas de login (bloqueio #%s)',
                   _email, calculated_lockout_minutes, max_attempts, current_lockout_count + 1),
            _email);
  END IF;
END;
$function$;

-- Update reset_failed_attempts to optionally reset lockout_count after successful login
CREATE OR REPLACE FUNCTION public.reset_failed_attempts(_email text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Reset failed attempts but keep lockout_count for progressive lockouts
  -- lockout_count will naturally decay over time or can be manually reset by admin
  UPDATE public.account_lockouts 
  SET failed_attempts = 0,
      locked_until = NULL
  WHERE user_email = _email;
  
  -- If no record exists, nothing to reset
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  -- Reset lockout_count if last lockout was more than 24 hours ago
  UPDATE public.account_lockouts
  SET lockout_count = 0
  WHERE user_email = _email
    AND (locked_until IS NULL OR locked_until < now() - INTERVAL '24 hours');
END;
$function$;-- Create function to get lockout details including remaining time
CREATE OR REPLACE FUNCTION public.get_lockout_details(_email text)
 RETURNS TABLE(is_locked boolean, remaining_minutes integer, lockout_count integer)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT 
    CASE WHEN locked_until > now() THEN true ELSE false END as is_locked,
    CASE WHEN locked_until > now() 
         THEN CEIL(EXTRACT(EPOCH FROM (locked_until - now())) / 60)::integer 
         ELSE 0 
    END as remaining_minutes,
    COALESCE(account_lockouts.lockout_count, 0) as lockout_count
  FROM public.account_lockouts
  WHERE user_email = _email
$function$;-- ============================================
-- MÓDULO REFORMA TRIBUTÁRIA - TABELAS PRINCIPAIS
-- Melhoria 1: Estrutura de dados para IBS/CBS/IS
-- ============================================

-- Tabela de Apurações Tributárias (mensal)
CREATE TABLE public.apuracoes_tributarias (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  competencia DATE NOT NULL, -- Primeiro dia do mês de competência
  ano INTEGER NOT NULL,
  mes INTEGER NOT NULL,
  
  -- CBS (Contribuição sobre Bens e Serviços)
  cbs_debitos NUMERIC(15,2) DEFAULT 0,
  cbs_creditos NUMERIC(15,2) DEFAULT 0,
  cbs_saldo_anterior NUMERIC(15,2) DEFAULT 0,
  cbs_a_pagar NUMERIC(15,2) DEFAULT 0,
  cbs_a_compensar NUMERIC(15,2) DEFAULT 0,
  
  -- IBS (Imposto sobre Bens e Serviços)
  ibs_debitos NUMERIC(15,2) DEFAULT 0,
  ibs_creditos NUMERIC(15,2) DEFAULT 0,
  ibs_saldo_anterior NUMERIC(15,2) DEFAULT 0,
  ibs_a_pagar NUMERIC(15,2) DEFAULT 0,
  ibs_a_compensar NUMERIC(15,2) DEFAULT 0,
  
  -- IS (Imposto Seletivo)
  is_debitos NUMERIC(15,2) DEFAULT 0,
  is_creditos NUMERIC(15,2) DEFAULT 0,
  is_a_pagar NUMERIC(15,2) DEFAULT 0,
  
  -- Tributos Residuais (período de transição)
  icms_residual NUMERIC(15,2) DEFAULT 0,
  iss_residual NUMERIC(15,2) DEFAULT 0,
  pis_residual NUMERIC(15,2) DEFAULT 0,
  cofins_residual NUMERIC(15,2) DEFAULT 0,
  
  -- Totais
  total_tributos_novos NUMERIC(15,2) DEFAULT 0,
  total_tributos_residuais NUMERIC(15,2) DEFAULT 0,
  total_geral NUMERIC(15,2) DEFAULT 0,
  
  -- Controle
  status VARCHAR(20) DEFAULT 'rascunho' CHECK (status IN ('rascunho', 'calculado', 'revisado', 'transmitido', 'retificado')),
  data_transmissao TIMESTAMP WITH TIME ZONE,
  protocolo_transmissao VARCHAR(100),
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID,
  
  UNIQUE(empresa_id, ano, mes)
);

-- Tabela de Créditos Tributários
CREATE TABLE public.creditos_tributarios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  
  -- Identificação
  tipo_tributo VARCHAR(10) NOT NULL CHECK (tipo_tributo IN ('CBS', 'IBS', 'IS')),
  tipo_credito VARCHAR(50) NOT NULL, -- 'aquisicao_insumos', 'ativo_imobilizado', 'energia', 'transporte', etc.
  
  -- Documento de origem
  documento_tipo VARCHAR(20), -- 'nfe', 'nfse', 'cte', 'manual'
  documento_numero VARCHAR(50),
  documento_serie VARCHAR(10),
  documento_chave VARCHAR(50),
  nota_fiscal_id UUID REFERENCES public.notas_fiscais(id),
  
  -- Fornecedor
  fornecedor_id UUID REFERENCES public.fornecedores(id),
  fornecedor_cnpj VARCHAR(20),
  fornecedor_nome VARCHAR(200),
  
  -- Valores
  valor_base NUMERIC(15,2) NOT NULL,
  aliquota NUMERIC(6,4) NOT NULL,
  valor_credito NUMERIC(15,2) NOT NULL,
  
  -- Período
  data_origem DATE NOT NULL,
  competencia_origem DATE NOT NULL,
  competencia_utilizacao DATE,
  
  -- Status
  status VARCHAR(20) DEFAULT 'disponivel' CHECK (status IN ('disponivel', 'utilizado', 'compensado', 'expirado', 'estornado', 'transferido')),
  
  -- Utilização
  apuracao_id UUID REFERENCES public.apuracoes_tributarias(id),
  valor_utilizado NUMERIC(15,2) DEFAULT 0,
  saldo_disponivel NUMERIC(15,2),
  
  -- Controle
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

-- Tabela de Operações Tributáveis (base para cálculo)
CREATE TABLE public.operacoes_tributaveis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  
  -- Tipo de operação
  tipo_operacao VARCHAR(30) NOT NULL CHECK (tipo_operacao IN ('venda', 'compra', 'servico_prestado', 'servico_tomado', 'importacao', 'exportacao', 'devolucao_venda', 'devolucao_compra')),
  
  -- Documento
  documento_tipo VARCHAR(20) NOT NULL,
  documento_numero VARCHAR(50),
  documento_serie VARCHAR(10),
  documento_chave VARCHAR(50),
  nota_fiscal_id UUID REFERENCES public.notas_fiscais(id),
  
  -- Partes
  cliente_id UUID REFERENCES public.clientes(id),
  fornecedor_id UUID REFERENCES public.fornecedores(id),
  cnpj_cpf_contraparte VARCHAR(20),
  nome_contraparte VARCHAR(200),
  
  -- Localização
  uf_origem VARCHAR(2),
  uf_destino VARCHAR(2),
  municipio_origem VARCHAR(10),
  municipio_destino VARCHAR(10),
  
  -- Classificação fiscal
  cfop VARCHAR(10),
  ncm VARCHAR(10),
  cest VARCHAR(10),
  
  -- Valores base
  valor_operacao NUMERIC(15,2) NOT NULL,
  valor_desconto NUMERIC(15,2) DEFAULT 0,
  valor_frete NUMERIC(15,2) DEFAULT 0,
  valor_seguro NUMERIC(15,2) DEFAULT 0,
  valor_outros NUMERIC(15,2) DEFAULT 0,
  base_calculo NUMERIC(15,2) NOT NULL,
  
  -- CBS
  cbs_aliquota NUMERIC(6,4) DEFAULT 0,
  cbs_valor NUMERIC(15,2) DEFAULT 0,
  cbs_credito NUMERIC(15,2) DEFAULT 0,
  
  -- IBS
  ibs_aliquota NUMERIC(6,4) DEFAULT 0,
  ibs_valor NUMERIC(15,2) DEFAULT 0,
  ibs_credito NUMERIC(15,2) DEFAULT 0,
  
  -- IS (Imposto Seletivo)
  is_categoria VARCHAR(50),
  is_aliquota NUMERIC(6,4) DEFAULT 0,
  is_valor NUMERIC(15,2) DEFAULT 0,
  
  -- Tributos Residuais
  icms_aliquota NUMERIC(6,4) DEFAULT 0,
  icms_valor NUMERIC(15,2) DEFAULT 0,
  iss_aliquota NUMERIC(6,4) DEFAULT 0,
  iss_valor NUMERIC(15,2) DEFAULT 0,
  pis_aliquota NUMERIC(6,4) DEFAULT 0,
  pis_valor NUMERIC(15,2) DEFAULT 0,
  cofins_aliquota NUMERIC(6,4) DEFAULT 0,
  cofins_valor NUMERIC(15,2) DEFAULT 0,
  
  -- Regimes especiais
  regime_especial VARCHAR(50),
  reducao_aliquota NUMERIC(6,4) DEFAULT 0,
  
  -- Isenções/Imunidades
  isento BOOLEAN DEFAULT FALSE,
  motivo_isencao TEXT,
  
  -- Split Payment
  split_payment BOOLEAN DEFAULT FALSE,
  split_payment_valor NUMERIC(15,2) DEFAULT 0,
  
  -- Período
  data_operacao DATE NOT NULL,
  competencia DATE NOT NULL,
  
  -- Controle
  apuracao_id UUID REFERENCES public.apuracoes_tributarias(id),
  status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'processado', 'erro', 'cancelado')),
  erro_mensagem TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

-- Tabela de Transações Split Payment
CREATE TABLE public.split_payment_transacoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  operacao_id UUID NOT NULL REFERENCES public.operacoes_tributaveis(id) ON DELETE CASCADE,
  
  -- Documento
  documento_tipo VARCHAR(20) NOT NULL,
  documento_numero VARCHAR(50),
  documento_chave VARCHAR(50),
  
  -- Valores
  valor_operacao NUMERIC(15,2) NOT NULL,
  valor_liquido NUMERIC(15,2) NOT NULL,
  
  -- Tributos retidos
  cbs_retido NUMERIC(15,2) DEFAULT 0,
  ibs_retido NUMERIC(15,2) DEFAULT 0,
  is_retido NUMERIC(15,2) DEFAULT 0,
  total_retido NUMERIC(15,2) DEFAULT 0,
  
  -- Destinação
  conta_fornecedor VARCHAR(50),
  conta_cbs VARCHAR(50),
  conta_ibs VARCHAR(50),
  conta_is VARCHAR(50),
  
  -- Status do pagamento
  status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'processando', 'concluido', 'erro')),
  data_processamento TIMESTAMP WITH TIME ZONE,
  protocolo VARCHAR(100),
  erro_mensagem TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de Configurações de Regime Especial por Empresa
CREATE TABLE public.regimes_especiais_empresa (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  
  regime_codigo VARCHAR(50) NOT NULL,
  regime_nome VARCHAR(200) NOT NULL,
  
  -- Reduções aplicáveis
  reducao_cbs NUMERIC(6,4) DEFAULT 0,
  reducao_ibs NUMERIC(6,4) DEFAULT 0,
  
  -- Vigência
  data_inicio DATE NOT NULL,
  data_fim DATE,
  
  -- Documentação
  ato_legal VARCHAR(200),
  numero_processo VARCHAR(50),
  
  ativo BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

-- Índices para performance
CREATE INDEX idx_apuracoes_empresa_periodo ON public.apuracoes_tributarias(empresa_id, ano, mes);
CREATE INDEX idx_creditos_empresa_status ON public.creditos_tributarios(empresa_id, status);
CREATE INDEX idx_creditos_competencia ON public.creditos_tributarios(competencia_origem);
CREATE INDEX idx_operacoes_empresa_competencia ON public.operacoes_tributaveis(empresa_id, competencia);
CREATE INDEX idx_operacoes_nota_fiscal ON public.operacoes_tributaveis(nota_fiscal_id);
CREATE INDEX idx_split_payment_operacao ON public.split_payment_transacoes(operacao_id);

-- Habilitar RLS
ALTER TABLE public.apuracoes_tributarias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creditos_tributarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operacoes_tributaveis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.split_payment_transacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regimes_especiais_empresa ENABLE ROW LEVEL SECURITY;

-- Políticas RLS (acesso autenticado)
CREATE POLICY "Usuários autenticados podem ver apurações" ON public.apuracoes_tributarias FOR SELECT TO authenticated USING (true);
CREATE POLICY "Usuários autenticados podem inserir apurações" ON public.apuracoes_tributarias FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Usuários autenticados podem atualizar apurações" ON public.apuracoes_tributarias FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Usuários autenticados podem deletar apurações" ON public.apuracoes_tributarias FOR DELETE TO authenticated USING (true);

CREATE POLICY "Usuários autenticados podem ver créditos" ON public.creditos_tributarios FOR SELECT TO authenticated USING (true);
CREATE POLICY "Usuários autenticados podem inserir créditos" ON public.creditos_tributarios FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Usuários autenticados podem atualizar créditos" ON public.creditos_tributarios FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Usuários autenticados podem deletar créditos" ON public.creditos_tributarios FOR DELETE TO authenticated USING (true);

CREATE POLICY "Usuários autenticados podem ver operações" ON public.operacoes_tributaveis FOR SELECT TO authenticated USING (true);
CREATE POLICY "Usuários autenticados podem inserir operações" ON public.operacoes_tributaveis FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Usuários autenticados podem atualizar operações" ON public.operacoes_tributaveis FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Usuários autenticados podem deletar operações" ON public.operacoes_tributaveis FOR DELETE TO authenticated USING (true);

CREATE POLICY "Usuários autenticados podem ver split payment" ON public.split_payment_transacoes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Usuários autenticados podem inserir split payment" ON public.split_payment_transacoes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Usuários autenticados podem atualizar split payment" ON public.split_payment_transacoes FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Usuários autenticados podem ver regimes especiais" ON public.regimes_especiais_empresa FOR SELECT TO authenticated USING (true);
CREATE POLICY "Usuários autenticados podem inserir regimes especiais" ON public.regimes_especiais_empresa FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Usuários autenticados podem atualizar regimes especiais" ON public.regimes_especiais_empresa FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Usuários autenticados podem deletar regimes especiais" ON public.regimes_especiais_empresa FOR DELETE TO authenticated USING (true);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_apuracoes_tributarias_updated_at BEFORE UPDATE ON public.apuracoes_tributarias FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_creditos_tributarios_updated_at BEFORE UPDATE ON public.creditos_tributarios FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_operacoes_tributaveis_updated_at BEFORE UPDATE ON public.operacoes_tributaveis FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_split_payment_transacoes_updated_at BEFORE UPDATE ON public.split_payment_transacoes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_regimes_especiais_empresa_updated_at BEFORE UPDATE ON public.regimes_especiais_empresa FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();-- ============================================
-- MÓDULO IRPJ/CSLL - LUCRO REAL
-- Tabelas para apuração trimestral/anual
-- ============================================

-- Tabela de Apurações IRPJ/CSLL
CREATE TABLE public.apuracoes_irpj_csll (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  
  -- Período
  tipo_apuracao VARCHAR(20) NOT NULL CHECK (tipo_apuracao IN ('trimestral', 'anual', 'estimativa')),
  ano INTEGER NOT NULL,
  trimestre INTEGER CHECK (trimestre BETWEEN 1 AND 4),
  mes INTEGER CHECK (mes BETWEEN 1 AND 12),
  
  -- Lucro Contábil
  lucro_contabil NUMERIC(15,2) DEFAULT 0,
  
  -- Adições ao Lucro Real
  adicoes_permanentes NUMERIC(15,2) DEFAULT 0,
  adicoes_temporarias NUMERIC(15,2) DEFAULT 0,
  total_adicoes NUMERIC(15,2) DEFAULT 0,
  
  -- Exclusões do Lucro Real
  exclusoes_permanentes NUMERIC(15,2) DEFAULT 0,
  exclusoes_temporarias NUMERIC(15,2) DEFAULT 0,
  total_exclusoes NUMERIC(15,2) DEFAULT 0,
  
  -- Lucro Real
  lucro_real_antes_compensacao NUMERIC(15,2) DEFAULT 0,
  compensacao_prejuizos NUMERIC(15,2) DEFAULT 0,
  lucro_real NUMERIC(15,2) DEFAULT 0,
  
  -- IRPJ
  irpj_aliquota_normal NUMERIC(6,4) DEFAULT 0.15,
  irpj_normal NUMERIC(15,2) DEFAULT 0,
  irpj_adicional_base NUMERIC(15,2) DEFAULT 0,
  irpj_adicional NUMERIC(15,2) DEFAULT 0,
  irpj_total NUMERIC(15,2) DEFAULT 0,
  
  -- CSLL
  csll_aliquota NUMERIC(6,4) DEFAULT 0.09,
  csll_base NUMERIC(15,2) DEFAULT 0,
  csll_total NUMERIC(15,2) DEFAULT 0,
  
  -- Deduções/Incentivos
  irpj_incentivos_deducoes NUMERIC(15,2) DEFAULT 0,
  
  -- Total a Pagar
  total_tributos NUMERIC(15,2) DEFAULT 0,
  
  -- Antecipações/Retenções
  irrf_retido NUMERIC(15,2) DEFAULT 0,
  csrf_retido NUMERIC(15,2) DEFAULT 0,
  saldo_negativo_anterior NUMERIC(15,2) DEFAULT 0,
  estimativas_pagas NUMERIC(15,2) DEFAULT 0,
  
  -- Saldo Final
  irpj_a_pagar NUMERIC(15,2) DEFAULT 0,
  csll_a_pagar NUMERIC(15,2) DEFAULT 0,
  saldo_negativo_irpj NUMERIC(15,2) DEFAULT 0,
  saldo_negativo_csll NUMERIC(15,2) DEFAULT 0,
  
  -- Controle
  status VARCHAR(20) DEFAULT 'rascunho' CHECK (status IN ('rascunho', 'calculado', 'revisado', 'transmitido', 'retificado')),
  data_transmissao TIMESTAMP WITH TIME ZONE,
  numero_recibo VARCHAR(50),
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

-- Índice único para evitar duplicatas
CREATE UNIQUE INDEX idx_apuracoes_irpj_unique ON public.apuracoes_irpj_csll(empresa_id, ano, tipo_apuracao, trimestre, mes) WHERE trimestre IS NOT NULL AND mes IS NOT NULL;
CREATE UNIQUE INDEX idx_apuracoes_irpj_trimestral ON public.apuracoes_irpj_csll(empresa_id, ano, tipo_apuracao, trimestre) WHERE tipo_apuracao = 'trimestral' AND mes IS NULL;
CREATE UNIQUE INDEX idx_apuracoes_irpj_anual ON public.apuracoes_irpj_csll(empresa_id, ano, tipo_apuracao) WHERE tipo_apuracao = 'anual' AND trimestre IS NULL AND mes IS NULL;

-- Tabela de Prejuízos Fiscais (LALUR Parte B)
CREATE TABLE public.prejuizos_fiscais (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('IRPJ', 'CSLL')),
  ano_origem INTEGER NOT NULL,
  trimestre_origem INTEGER,
  valor_original NUMERIC(15,2) NOT NULL,
  valor_compensado NUMERIC(15,2) DEFAULT 0,
  saldo_disponivel NUMERIC(15,2) NOT NULL,
  data_limite_compensacao DATE,
  status VARCHAR(20) DEFAULT 'disponivel' CHECK (status IN ('disponivel', 'parcial', 'compensado', 'prescrito')),
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de Adições e Exclusões (LALUR Parte A)
CREATE TABLE public.lalur_lancamentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  apuracao_id UUID REFERENCES public.apuracoes_irpj_csll(id) ON DELETE CASCADE,
  tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('adicao', 'exclusao')),
  natureza VARCHAR(15) NOT NULL CHECK (natureza IN ('permanente', 'temporaria')),
  codigo_lancamento VARCHAR(20),
  descricao TEXT NOT NULL,
  valor NUMERIC(15,2) NOT NULL,
  saldo_parte_b NUMERIC(15,2) DEFAULT 0,
  data_realizacao DATE,
  conta_contabil VARCHAR(20),
  historico TEXT,
  documento_suporte VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de Incentivos Fiscais
CREATE TABLE public.incentivos_fiscais (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  tipo_incentivo VARCHAR(50) NOT NULL,
  nome VARCHAR(200) NOT NULL,
  limite_percentual NUMERIC(6,4),
  limite_valor NUMERIC(15,2),
  ano_inicio INTEGER NOT NULL,
  ano_fim INTEGER,
  valor_utilizado_ano NUMERIC(15,2) DEFAULT 0,
  numero_processo VARCHAR(50),
  ato_concessorio VARCHAR(100),
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX idx_apuracoes_irpj_empresa ON public.apuracoes_irpj_csll(empresa_id, ano);
CREATE INDEX idx_prejuizos_empresa_tipo ON public.prejuizos_fiscais(empresa_id, tipo, status);
CREATE INDEX idx_lalur_apuracao ON public.lalur_lancamentos(apuracao_id);
CREATE INDEX idx_incentivos_empresa ON public.incentivos_fiscais(empresa_id, ativo);

-- RLS
ALTER TABLE public.apuracoes_irpj_csll ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prejuizos_fiscais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lalur_lancamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incentivos_fiscais ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Auth users can manage apuracoes_irpj" ON public.apuracoes_irpj_csll FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users can manage prejuizos" ON public.prejuizos_fiscais FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users can manage lalur" ON public.lalur_lancamentos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users can manage incentivos" ON public.incentivos_fiscais FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Triggers
CREATE TRIGGER update_apuracoes_irpj_updated_at BEFORE UPDATE ON public.apuracoes_irpj_csll FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_prejuizos_updated_at BEFORE UPDATE ON public.prejuizos_fiscais FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_lalur_updated_at BEFORE UPDATE ON public.lalur_lancamentos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_incentivos_updated_at BEFORE UPDATE ON public.incentivos_fiscais FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();-- ============================================
-- FUNÇÃO UPDATE_UPDATED_AT (se não existir)
-- ============================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TABELA DE RETENÇÕES NA FONTE
-- ============================================
CREATE TABLE public.retencoes_fonte (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    tipo_retencao TEXT NOT NULL CHECK (tipo_retencao IN (
        'irrf', 'csrf', 'pis_cofins_csll', 'inss', 'iss', 'cbs', 'ibs'
    )),
    tipo_operacao TEXT NOT NULL CHECK (tipo_operacao IN ('pagamento', 'recebimento')),
    nota_fiscal_id UUID,
    conta_pagar_id UUID,
    conta_receber_id UUID,
    cnpj_participante TEXT,
    nome_participante TEXT NOT NULL,
    valor_base NUMERIC(15,2) NOT NULL,
    aliquota NUMERIC(5,4) NOT NULL,
    valor_retido NUMERIC(15,2) NOT NULL,
    data_fato_gerador DATE NOT NULL,
    data_retencao DATE NOT NULL,
    data_recolhimento DATE,
    data_vencimento DATE NOT NULL,
    codigo_receita TEXT,
    numero_documento TEXT,
    darf_gerado BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'recolhido', 'compensado', 'cancelado')),
    competencia TEXT NOT NULL,
    observacoes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID
);

CREATE INDEX idx_retencoes_fonte_empresa ON public.retencoes_fonte(empresa_id);
CREATE INDEX idx_retencoes_fonte_comp ON public.retencoes_fonte(competencia);
CREATE INDEX idx_retencoes_fonte_tipo ON public.retencoes_fonte(tipo_retencao);
CREATE INDEX idx_retencoes_fonte_status ON public.retencoes_fonte(status);

ALTER TABLE public.retencoes_fonte ENABLE ROW LEVEL SECURITY;
CREATE POLICY "retencoes_fonte_all" ON public.retencoes_fonte FOR ALL USING (true) WITH CHECK (true);

CREATE TRIGGER set_retencoes_updated_at
    BEFORE UPDATE ON public.retencoes_fonte
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================
-- TABELA DARFS
-- ============================================
CREATE TABLE public.darfs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    codigo_receita TEXT NOT NULL,
    descricao_receita TEXT NOT NULL,
    competencia TEXT NOT NULL,
    valor_principal NUMERIC(15,2) NOT NULL,
    valor_multa NUMERIC(15,2) DEFAULT 0,
    valor_juros NUMERIC(15,2) DEFAULT 0,
    valor_total NUMERIC(15,2) NOT NULL,
    data_vencimento DATE NOT NULL,
    data_pagamento DATE,
    codigo_barras TEXT,
    linha_digitavel TEXT,
    status TEXT DEFAULT 'gerado' CHECK (status IN ('gerado', 'pago', 'vencido', 'cancelado')),
    retencoes_ids UUID[] DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID
);

CREATE INDEX idx_darfs_empresa ON public.darfs(empresa_id);
CREATE INDEX idx_darfs_competencia ON public.darfs(competencia);
CREATE INDEX idx_darfs_status ON public.darfs(status);

ALTER TABLE public.darfs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "darfs_all" ON public.darfs FOR ALL USING (true) WITH CHECK (true);

CREATE TRIGGER set_darfs_updated_at
    BEFORE UPDATE ON public.darfs
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();-- ============================================
-- TABELA DE ALERTAS TRIBUTÁRIOS
-- Prazos, vencimentos e compliance
-- ============================================

CREATE TABLE public.alertas_tributarios (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
    user_id UUID,
    
    -- Tipo e origem
    tipo TEXT NOT NULL CHECK (tipo IN (
        'vencimento_apuracao', 'vencimento_darf', 'vencimento_obrigacao',
        'prazo_credito', 'limite_compensacao', 'pendencia_conciliacao',
        'inconsistencia_fiscal', 'atualizacao_legislacao', 'split_payment',
        'retencao_pendente', 'nfe_rejeitada', 'saldo_negativo'
    )),
    
    -- Conteúdo
    titulo TEXT NOT NULL,
    mensagem TEXT NOT NULL,
    
    -- Prioridade
    prioridade TEXT NOT NULL DEFAULT 'media' CHECK (prioridade IN ('baixa', 'media', 'alta', 'critica')),
    
    -- Datas
    data_vencimento DATE,
    data_lembrete DATE,
    
    -- Referência
    entidade_tipo TEXT, -- 'apuracao', 'darf', 'credito', etc
    entidade_id UUID,
    competencia TEXT,
    
    -- Status
    lido BOOLEAN DEFAULT false,
    resolvido BOOLEAN DEFAULT false,
    resolvido_em TIMESTAMPTZ,
    resolvido_por UUID,
    
    -- Ação
    acao_url TEXT,
    acao_label TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX idx_alertas_trib_empresa ON public.alertas_tributarios(empresa_id);
CREATE INDEX idx_alertas_trib_user ON public.alertas_tributarios(user_id);
CREATE INDEX idx_alertas_trib_tipo ON public.alertas_tributarios(tipo);
CREATE INDEX idx_alertas_trib_prioridade ON public.alertas_tributarios(prioridade);
CREATE INDEX idx_alertas_trib_vencimento ON public.alertas_tributarios(data_vencimento);
CREATE INDEX idx_alertas_trib_resolvido ON public.alertas_tributarios(resolvido);

-- RLS
ALTER TABLE public.alertas_tributarios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "alertas_tributarios_all" ON public.alertas_tributarios FOR ALL USING (true) WITH CHECK (true);

-- Trigger updated_at
CREATE TRIGGER set_alertas_tributarios_updated_at
    BEFORE UPDATE ON public.alertas_tributarios
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Habilitar realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.alertas_tributarios;-- ============================================
-- MELHORIA 1: INTEGRAÇÃO NF-e → CRÉDITOS CBS/IBS
-- Apenas tabela PER/DCOMP (outras já existem)
-- ============================================

-- TABELA: PER/DCOMP (Pedidos de Restituição/Compensação)
CREATE TABLE IF NOT EXISTS public.per_dcomp (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    tipo TEXT NOT NULL CHECK (tipo IN ('per', 'dcomp')),
    numero_processo TEXT,
    numero_recibo TEXT,
    data_transmissao TIMESTAMPTZ,
    tipo_credito_origem TEXT NOT NULL,
    tributo_origem TEXT NOT NULL,
    competencia_origem TEXT NOT NULL,
    valor_original NUMERIC(15,2) NOT NULL,
    valor_atualizado NUMERIC(15,2),
    tributo_destino TEXT,
    competencia_destino TEXT,
    valor_compensado NUMERIC(15,2),
    creditos_ids UUID[] DEFAULT '{}',
    status TEXT DEFAULT 'rascunho' CHECK (status IN (
        'rascunho', 'aguardando_transmissao', 'transmitido', 
        'em_analise', 'deferido', 'indeferido', 'cancelado'
    )),
    data_protocolo DATE,
    data_decisao DATE,
    prazo_recurso DATE,
    justificativa TEXT,
    fundamentacao_legal TEXT,
    observacoes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID
);

CREATE INDEX IF NOT EXISTS idx_per_dcomp_empresa ON public.per_dcomp(empresa_id);
CREATE INDEX IF NOT EXISTS idx_per_dcomp_tipo ON public.per_dcomp(tipo);
CREATE INDEX IF NOT EXISTS idx_per_dcomp_status ON public.per_dcomp(status);

ALTER TABLE public.per_dcomp ENABLE ROW LEVEL SECURITY;
CREATE POLICY "per_dcomp_all" ON public.per_dcomp FOR ALL USING (true) WITH CHECK (true);

CREATE TRIGGER set_per_dcomp_updated_at
    BEFORE UPDATE ON public.per_dcomp
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
-- 1. Tabela de regras automáticas aprendidas
CREATE TABLE public.regras_conciliacao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  padrao_descricao TEXT NOT NULL,
  lancamento_tipo TEXT NOT NULL CHECK (lancamento_tipo IN ('pagar', 'receber')),
  entidade_nome TEXT NOT NULL,
  entidade_id UUID,
  categoria TEXT,
  vezes_aplicada INTEGER DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.regras_conciliacao ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read regras_conciliacao" ON public.regras_conciliacao
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert regras_conciliacao" ON public.regras_conciliacao
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update regras_conciliacao" ON public.regras_conciliacao
  FOR UPDATE TO authenticated USING (true);

-- 2. Tabela de conciliação parcial (split)
CREATE TABLE public.conciliacoes_parciais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transacao_bancaria_id UUID REFERENCES public.transacoes_bancarias(id) ON DELETE CASCADE NOT NULL,
  conta_pagar_id UUID REFERENCES public.contas_pagar(id),
  conta_receber_id UUID REFERENCES public.contas_receber(id),
  valor_parcial NUMERIC NOT NULL,
  observacoes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.conciliacoes_parciais ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read conciliacoes_parciais" ON public.conciliacoes_parciais
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert conciliacoes_parciais" ON public.conciliacoes_parciais
  FOR INSERT TO authenticated WITH CHECK (true);

-- 3. Adicionar campo para conciliação parcial na transacoes_bancarias
ALTER TABLE public.transacoes_bancarias 
  ADD COLUMN IF NOT EXISTS conciliacao_parcial BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS valor_conciliado NUMERIC DEFAULT 0;

-- Trigger para updated_at na regras_conciliacao
CREATE TRIGGER update_regras_conciliacao_updated_at
  BEFORE UPDATE ON public.regras_conciliacao
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Função para gerar alertas de transações não conciliadas após X dias
CREATE OR REPLACE FUNCTION public.gerar_alertas_pendencias_conciliacao()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  hoje DATE := CURRENT_DATE;
  dias_limite INTEGER := 7;
  transacao RECORD;
BEGIN
  FOR transacao IN
    SELECT tb.id, tb.descricao, tb.valor, tb.data, tb.tipo, cb.banco, cb.conta
    FROM public.transacoes_bancarias tb
    LEFT JOIN public.contas_bancarias cb ON cb.id = tb.conta_bancaria_id
    WHERE tb.conciliada = false
      AND tb.data < hoje - (dias_limite || ' days')::INTERVAL
      AND NOT EXISTS (
        SELECT 1 FROM public.alertas
        WHERE entidade_tipo = 'transacao_bancaria'
          AND entidade_id = tb.id::text
          AND tipo = 'pendencia_conciliacao'
          AND created_at > now() - INTERVAL '7 days'
      )
  LOOP
    INSERT INTO public.alertas (
      tipo, titulo, mensagem, prioridade,
      entidade_tipo, entidade_id, acao_url
    ) VALUES (
      'pendencia_conciliacao',
      'Transação não conciliada há mais de ' || dias_limite || ' dias',
      format('A transação "%s" no valor de R$ %s do banco %s (conta %s) de %s está pendente de conciliação.',
        transacao.descricao,
        to_char(transacao.valor, 'FM999G999G999D00'),
        COALESCE(transacao.banco, 'N/A'),
        COALESCE(transacao.conta, 'N/A'),
        to_char(transacao.data, 'DD/MM/YYYY')
      ),
      'media'::prioridade_alerta,
      'transacao_bancaria',
      transacao.id::text,
      '/conciliacao'
    );
  END LOOP;
END;
$$;
-- Fix overly permissive RLS policies: replace USING(true)/WITH CHECK(true) 
-- with auth.uid() IS NOT NULL on non-SELECT operations.

-- account_lockouts
DROP POLICY IF EXISTS "System can manage account lockouts" ON public.account_lockouts;
CREATE POLICY "System can manage account lockouts" ON public.account_lockouts FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- alertas INSERT
DROP POLICY IF EXISTS "System can insert alertas" ON public.alertas;
CREATE POLICY "System can insert alertas" ON public.alertas FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- alertas_preditivos INSERT
DROP POLICY IF EXISTS "Sistema pode inserir alertas preditivos" ON public.alertas_preditivos;
CREATE POLICY "Sistema pode inserir alertas preditivos" ON public.alertas_preditivos FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- alertas_tributarios ALL
DROP POLICY IF EXISTS "alertas_tributarios_all" ON public.alertas_tributarios;
CREATE POLICY "alertas_tributarios_all" ON public.alertas_tributarios FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- apuracoes_irpj_csll ALL
DROP POLICY IF EXISTS "Auth users can manage apuracoes_irpj" ON public.apuracoes_irpj_csll;
CREATE POLICY "Auth users can manage apuracoes_irpj" ON public.apuracoes_irpj_csll FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- apuracoes_tributarias INSERT/UPDATE/DELETE
DROP POLICY IF EXISTS "Usuários autenticados podem inserir apurações" ON public.apuracoes_tributarias;
CREATE POLICY "Usuários autenticados podem inserir apurações" ON public.apuracoes_tributarias FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar apurações" ON public.apuracoes_tributarias;
CREATE POLICY "Usuários autenticados podem atualizar apurações" ON public.apuracoes_tributarias FOR UPDATE USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "Usuários autenticados podem deletar apurações" ON public.apuracoes_tributarias;
CREATE POLICY "Usuários autenticados podem deletar apurações" ON public.apuracoes_tributarias FOR DELETE USING (auth.uid() IS NOT NULL);

-- blocked_ips INSERT
DROP POLICY IF EXISTS "System can insert blocked IPs" ON public.blocked_ips;
CREATE POLICY "System can insert blocked IPs" ON public.blocked_ips FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- conciliacoes_parciais INSERT
DROP POLICY IF EXISTS "Authenticated users can insert conciliacoes_parciais" ON public.conciliacoes_parciais;
CREATE POLICY "Authenticated users can insert conciliacoes_parciais" ON public.conciliacoes_parciais FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- creditos_tributarios INSERT/UPDATE/DELETE
DROP POLICY IF EXISTS "Usuários autenticados podem inserir créditos" ON public.creditos_tributarios;
CREATE POLICY "Usuários autenticados podem inserir créditos" ON public.creditos_tributarios FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar créditos" ON public.creditos_tributarios;
CREATE POLICY "Usuários autenticados podem atualizar créditos" ON public.creditos_tributarios FOR UPDATE USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "Usuários autenticados podem deletar créditos" ON public.creditos_tributarios;
CREATE POLICY "Usuários autenticados podem deletar créditos" ON public.creditos_tributarios FOR DELETE USING (auth.uid() IS NOT NULL);

-- darfs ALL
DROP POLICY IF EXISTS "darfs_all" ON public.darfs;
CREATE POLICY "darfs_all" ON public.darfs FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- historico_analises_preditivas INSERT
DROP POLICY IF EXISTS "Sistema pode inserir análises" ON public.historico_analises_preditivas;
CREATE POLICY "Sistema pode inserir análises" ON public.historico_analises_preditivas FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- historico_cobranca_whatsapp INSERT/UPDATE
DROP POLICY IF EXISTS "Usuários podem inserir histórico de cobrança" ON public.historico_cobranca_whatsapp;
CREATE POLICY "Usuários podem inserir histórico de cobrança" ON public.historico_cobranca_whatsapp FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "Usuários podem atualizar histórico de cobrança" ON public.historico_cobranca_whatsapp;
CREATE POLICY "Usuários podem atualizar histórico de cobrança" ON public.historico_cobranca_whatsapp FOR UPDATE USING (auth.uid() IS NOT NULL);

-- historico_relatorios INSERT
DROP POLICY IF EXISTS "System can insert report history" ON public.historico_relatorios;
CREATE POLICY "System can insert report history" ON public.historico_relatorios FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- historico_score_saude INSERT
DROP POLICY IF EXISTS "Sistema pode inserir scores" ON public.historico_score_saude;
CREATE POLICY "Sistema pode inserir scores" ON public.historico_score_saude FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- incentivos_fiscais ALL
DROP POLICY IF EXISTS "Auth users can manage incentivos" ON public.incentivos_fiscais;
CREATE POLICY "Auth users can manage incentivos" ON public.incentivos_fiscais FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- lalur_lancamentos ALL
DROP POLICY IF EXISTS "Auth users can manage lalur" ON public.lalur_lancamentos;
CREATE POLICY "Auth users can manage lalur" ON public.lalur_lancamentos FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- login_attempts INSERT
DROP POLICY IF EXISTS "Sistema pode inserir tentativas" ON public.login_attempts;
CREATE POLICY "Sistema pode inserir tentativas" ON public.login_attempts FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- operacoes_tributaveis INSERT/UPDATE/DELETE
DROP POLICY IF EXISTS "Usuários autenticados podem inserir operações" ON public.operacoes_tributaveis;
CREATE POLICY "Usuários autenticados podem inserir operações" ON public.operacoes_tributaveis FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar operações" ON public.operacoes_tributaveis;
CREATE POLICY "Usuários autenticados podem atualizar operações" ON public.operacoes_tributaveis FOR UPDATE USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "Usuários autenticados podem deletar operações" ON public.operacoes_tributaveis;
CREATE POLICY "Usuários autenticados podem deletar operações" ON public.operacoes_tributaveis FOR DELETE USING (auth.uid() IS NOT NULL);

-- pagamentos_recorrentes UPDATE
DROP POLICY IF EXISTS "Usuários podem atualizar pagamentos recorrentes" ON public.pagamentos_recorrentes;
CREATE POLICY "Usuários podem atualizar pagamentos recorrentes" ON public.pagamentos_recorrentes FOR UPDATE USING (auth.uid() IS NOT NULL);

-- per_dcomp ALL
DROP POLICY IF EXISTS "per_dcomp_all" ON public.per_dcomp;
CREATE POLICY "per_dcomp_all" ON public.per_dcomp FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- prejuizos_fiscais ALL
DROP POLICY IF EXISTS "Auth users can manage prejuizos" ON public.prejuizos_fiscais;
CREATE POLICY "Auth users can manage prejuizos" ON public.prejuizos_fiscais FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- regimes_especiais_empresa ALL
DROP POLICY IF EXISTS "Auth users can manage regimes_especiais" ON public.regimes_especiais_empresa;
CREATE POLICY "Auth users can manage regimes_especiais" ON public.regimes_especiais_empresa FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- retencoes_fonte ALL
DROP POLICY IF EXISTS "retencoes_fonte_all" ON public.retencoes_fonte;
CREATE POLICY "retencoes_fonte_all" ON public.retencoes_fonte FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- split_payment_transacoes ALL
DROP POLICY IF EXISTS "split_payment_all" ON public.split_payment_transacoes;
CREATE POLICY "split_payment_all" ON public.split_payment_transacoes FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- security_settings ALL
DROP POLICY IF EXISTS "security_settings_all" ON public.security_settings;
CREATE POLICY "security_settings_all" ON public.security_settings FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);-- Fix remaining permissive RLS policies (batch 2)

-- rate_limit_logs ALL
DROP POLICY IF EXISTS "System can manage rate limit logs" ON public.rate_limit_logs;
CREATE POLICY "System can manage rate limit logs" ON public.rate_limit_logs FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- recomendacoes_metas_ia UPDATE/INSERT
DROP POLICY IF EXISTS "Usuários podem atualizar recomendações" ON public.recomendacoes_metas_ia;
CREATE POLICY "Usuários podem atualizar recomendações" ON public.recomendacoes_metas_ia FOR UPDATE USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "Sistema pode inserir recomendações" ON public.recomendacoes_metas_ia;
CREATE POLICY "Sistema pode inserir recomendações" ON public.recomendacoes_metas_ia FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- regimes_especiais_empresa (individual policies not caught by ALL policy)
DROP POLICY IF EXISTS "Usuários autenticados podem deletar regimes especiais" ON public.regimes_especiais_empresa;
CREATE POLICY "Usuários autenticados podem deletar regimes especiais" ON public.regimes_especiais_empresa FOR DELETE USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "Usuários autenticados podem inserir regimes especiais" ON public.regimes_especiais_empresa;
CREATE POLICY "Usuários autenticados podem inserir regimes especiais" ON public.regimes_especiais_empresa FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar regimes especiais" ON public.regimes_especiais_empresa;
CREATE POLICY "Usuários autenticados podem atualizar regimes especiais" ON public.regimes_especiais_empresa FOR UPDATE USING (auth.uid() IS NOT NULL);

-- regras_conciliacao UPDATE/INSERT
DROP POLICY IF EXISTS "Authenticated users can update regras_conciliacao" ON public.regras_conciliacao;
CREATE POLICY "Authenticated users can update regras_conciliacao" ON public.regras_conciliacao FOR UPDATE USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "Authenticated users can insert regras_conciliacao" ON public.regras_conciliacao;
CREATE POLICY "Authenticated users can insert regras_conciliacao" ON public.regras_conciliacao FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- security_alerts INSERT
DROP POLICY IF EXISTS "System can insert security alerts" ON public.security_alerts;
CREATE POLICY "System can insert security alerts" ON public.security_alerts FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- split_payment_transacoes INSERT/UPDATE (individual policies)
DROP POLICY IF EXISTS "Usuários autenticados podem inserir split payment" ON public.split_payment_transacoes;
CREATE POLICY "Usuários autenticados podem inserir split payment" ON public.split_payment_transacoes FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar split payment" ON public.split_payment_transacoes;
CREATE POLICY "Usuários autenticados podem atualizar split payment" ON public.split_payment_transacoes FOR UPDATE USING (auth.uid() IS NOT NULL);

-- user_sessions ALL
DROP POLICY IF EXISTS "System can manage sessions" ON public.user_sessions;
CREATE POLICY "System can manage sessions" ON public.user_sessions FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);-- Security hardening: remove overly broad authenticated-write policies

-- 1) security_settings: only admins can mutate
DROP POLICY IF EXISTS "security_settings_all" ON public.security_settings;
CREATE POLICY "Admins can insert security settings"
ON public.security_settings
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete security settings"
ON public.security_settings
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 2) account_lockouts: remove broad ALL; restrict reads/changes to admins
DROP POLICY IF EXISTS "System can manage account lockouts" ON public.account_lockouts;

CREATE POLICY "Admins can view account lockouts"
ON public.account_lockouts
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update account lockouts"
ON public.account_lockouts
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete account lockouts"
ON public.account_lockouts
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 3) user_sessions: remove broad ALL and keep user-scoped writes
DROP POLICY IF EXISTS "System can manage sessions" ON public.user_sessions;

CREATE POLICY "Users can insert own sessions"
ON public.user_sessions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions"
ON public.user_sessions
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 4) portal_cliente_tokens: remove public/any-auth access, restrict to finance/admin
DROP POLICY IF EXISTS "Tokens podem ser validados publicamente" ON public.portal_cliente_tokens;
DROP POLICY IF EXISTS "Usuários autenticados podem gerenciar tokens" ON public.portal_cliente_tokens;

CREATE POLICY "Financeiro e admin podem gerenciar tokens"
ON public.portal_cliente_tokens
FOR ALL
TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role]))
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role]));

-- 5) solicitacoes_aprovacao: require authenticated users for SELECT
DROP POLICY IF EXISTS "Authenticated users can view solicitacoes_aprovacao" ON public.solicitacoes_aprovacao;
CREATE POLICY "Authenticated users can view solicitacoes_aprovacao"
ON public.solicitacoes_aprovacao
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

-- 6) password_reset_requests: avoid fully-open WITH CHECK(true)
DROP POLICY IF EXISTS "Qualquer um pode criar solicitação de reset" ON public.password_reset_requests;
CREATE POLICY "Qualquer um pode criar solicitação de reset"
ON public.password_reset_requests
FOR INSERT
TO public
WITH CHECK (
  status = 'pendente'
  AND user_email IS NOT NULL
  AND length(trim(user_email)) >= 5
  AND position('@' in user_email) > 1
);

-- 7) portal_cliente_acessos: avoid fully-open WITH CHECK(true)
DROP POLICY IF EXISTS "Acessos podem ser registrados publicamente" ON public.portal_cliente_acessos;
CREATE POLICY "Acessos podem ser registrados publicamente"
ON public.portal_cliente_acessos
FOR INSERT
TO public
WITH CHECK (
  token_id IS NOT NULL
  AND acao IS NOT NULL
  AND length(trim(acao)) > 0
);

-- 8) rate_limit_logs: remove broad ALL; keep admin access only
DROP POLICY IF EXISTS "System can manage rate limit logs" ON public.rate_limit_logs;

CREATE POLICY "Admins can update rate limit logs"
ON public.rate_limit_logs
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete rate limit logs"
ON public.rate_limit_logs
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 9) blocked_ips: remove redundant broad insert policy
DROP POLICY IF EXISTS "System can insert blocked IPs" ON public.blocked_ips;

-- 10) historico_cobranca_whatsapp: restrict sensitive reads to financeiro/admin
DROP POLICY IF EXISTS "Usuários autenticados podem ver histórico de cobrança" ON public.historico_cobranca_whatsapp;
CREATE POLICY "Financeiro e admin podem ver histórico de cobrança"
ON public.historico_cobranca_whatsapp
FOR SELECT
TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role]));

-- 11) mutable function search_path warning
ALTER FUNCTION public.update_updated_at() SET search_path = public;-- Auditoria de segurança: endurecimento de RLS e funções para validação de acesso sem expor configurações sensíveis

-- 1) Funções de validação para login (evita expor whitelist de IP/geo no cliente)
CREATE OR REPLACE FUNCTION public.is_ip_allowed_for_login(_ip text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_restrict_by_ip boolean := false;
  v_global_ips text[] := ARRAY[]::text[];
BEGIN
  SELECT COALESCE(restrict_by_ip, false), COALESCE(allowed_global_ips, ARRAY[]::text[])
  INTO v_restrict_by_ip, v_global_ips
  FROM public.security_settings
  ORDER BY created_at DESC
  LIMIT 1;

  IF NOT v_restrict_by_ip THEN
    RETURN true;
  END IF;

  IF _ip IS NULL OR length(trim(_ip)) = 0 THEN
    RETURN true;
  END IF;

  IF _ip = ANY(v_global_ips) THEN
    RETURN true;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.allowed_ips ai
    WHERE ai.ativo = true
      AND ai.ip_address = _ip
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.is_country_allowed_for_login(_country text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_geo_enabled boolean := false;
BEGIN
  SELECT COALESCE(enable_geo_restriction, false)
  INTO v_geo_enabled
  FROM public.security_settings
  ORDER BY created_at DESC
  LIMIT 1;

  IF NOT v_geo_enabled THEN
    RETURN true;
  END IF;

  IF _country IS NULL OR length(trim(_country)) = 0 THEN
    RETURN true;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.allowed_countries ac
    WHERE ac.ativo = true
      AND ac.country_code = _country
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_ip_allowed_for_login(text) TO public;
GRANT EXECUTE ON FUNCTION public.is_country_allowed_for_login(text) TO public;

-- 2) alertas: remover leitura pública indireta e inserção ampla
DROP POLICY IF EXISTS "Users can view own alertas" ON public.alertas;
DROP POLICY IF EXISTS "System can insert alertas" ON public.alertas;
DROP POLICY IF EXISTS "Users can update own alertas" ON public.alertas;

CREATE POLICY "Users can view own or privileged system alertas"
ON public.alertas
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  OR (
    user_id IS NULL
    AND public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role])
  )
);

CREATE POLICY "Users can insert own or privileged system alertas"
ON public.alertas
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL
  AND (
    user_id = auth.uid()
    OR (
      user_id IS NULL
      AND public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role])
    )
  )
);

CREATE POLICY "Users can update own or privileged system alertas"
ON public.alertas
FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id
  OR public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role])
)
WITH CHECK (
  auth.uid() = user_id
  OR public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role])
);

-- 3) vendedores: exigir autenticação para leitura e restringir escrita por papel
DROP POLICY IF EXISTS "Usuários autenticados podem ver vendedores" ON public.vendedores;
DROP POLICY IF EXISTS "Financeiro+ podem gerenciar vendedores" ON public.vendedores;

CREATE POLICY "Usuários autenticados podem ver vendedores"
ON public.vendedores
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Financeiro+ podem gerenciar vendedores"
ON public.vendedores
FOR ALL
TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role]))
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role]));

-- 4) security_settings: somente admin lê/altera configurações completas
DROP POLICY IF EXISTS "Usuários autenticados podem ver configurações" ON public.security_settings;
DROP POLICY IF EXISTS "Admins podem atualizar configurações" ON public.security_settings;

CREATE POLICY "Admins podem ver configurações"
ON public.security_settings
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins podem atualizar configurações"
ON public.security_settings
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 5) historico_relatorios: leitura restrita por dono ou papel elevado
DROP POLICY IF EXISTS "Users can view report history" ON public.historico_relatorios;
DROP POLICY IF EXISTS "System can insert report history" ON public.historico_relatorios;

CREATE POLICY "Users can view own report history or elevated"
ON public.historico_relatorios
FOR SELECT
TO authenticated
USING (
  public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role])
  OR EXISTS (
    SELECT 1
    FROM public.relatorios_agendados ra
    WHERE ra.id = historico_relatorios.relatorio_agendado_id
      AND ra.created_by = auth.uid()
  )
);

CREATE POLICY "Users can insert own report history or elevated"
ON public.historico_relatorios
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role])
  OR EXISTS (
    SELECT 1
    FROM public.relatorios_agendados ra
    WHERE ra.id = historico_relatorios.relatorio_agendado_id
      AND ra.created_by = auth.uid()
  )
);

-- 6) historico_analises_preditivas: restringir por ownership/papel
DROP POLICY IF EXISTS "Usuários autenticados podem ver histórico de análises" ON public.historico_analises_preditivas;
DROP POLICY IF EXISTS "Sistema pode inserir análises" ON public.historico_analises_preditivas;

CREATE POLICY "Usuários podem ver próprias análises ou papel elevado"
ON public.historico_analises_preditivas
FOR SELECT
TO authenticated
USING (
  created_by = auth.uid()
  OR public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role])
);

CREATE POLICY "Usuários podem inserir próprias análises ou papel elevado"
ON public.historico_analises_preditivas
FOR INSERT
TO authenticated
WITH CHECK (
  created_by = auth.uid()
  OR public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role])
);

-- 7) historico_score_saude: restringir a perfis financeiros/admin
DROP POLICY IF EXISTS "Usuários autenticados podem ver histórico de score" ON public.historico_score_saude;
DROP POLICY IF EXISTS "Sistema pode inserir scores" ON public.historico_score_saude;

CREATE POLICY "Financeiro e admin podem ver histórico de score"
ON public.historico_score_saude
FOR SELECT
TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role]));

CREATE POLICY "Financeiro e admin podem inserir histórico de score"
ON public.historico_score_saude
FOR INSERT
TO authenticated
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role]));

-- 8) alertas_tributarios: remover ALL amplo e aplicar ownership/papel
DROP POLICY IF EXISTS "alertas_tributarios_all" ON public.alertas_tributarios;

CREATE POLICY "Users can view own or elevated alertas_tributarios"
ON public.alertas_tributarios
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role])
);

CREATE POLICY "Users can insert own or elevated alertas_tributarios"
ON public.alertas_tributarios
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  OR public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role])
);

CREATE POLICY "Users can update own or elevated alertas_tributarios"
ON public.alertas_tributarios
FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid()
  OR public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role])
)
WITH CHECK (
  user_id = auth.uid()
  OR public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role])
);

CREATE POLICY "Users can delete own or elevated alertas_tributarios"
ON public.alertas_tributarios
FOR DELETE
TO authenticated
USING (
  user_id = auth.uid()
  OR public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role])
);

-- 9) portal_cliente_acessos: restringir leitura de logs sensíveis
DROP POLICY IF EXISTS "Usuários autenticados podem ver acessos" ON public.portal_cliente_acessos;

CREATE POLICY "Financeiro e admin podem ver acessos"
ON public.portal_cliente_acessos
FOR SELECT
TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role]));

-- 10) relatorios_agendados: leitura ampla -> dono ou papel elevado
DROP POLICY IF EXISTS "Users can view scheduled reports" ON public.relatorios_agendados;
DROP POLICY IF EXISTS "Users can create scheduled reports" ON public.relatorios_agendados;
DROP POLICY IF EXISTS "Users can update their scheduled reports" ON public.relatorios_agendados;
DROP POLICY IF EXISTS "Users can delete their scheduled reports" ON public.relatorios_agendados;

CREATE POLICY "Users can view own scheduled reports or elevated"
ON public.relatorios_agendados
FOR SELECT
TO authenticated
USING (
  created_by = auth.uid()
  OR public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role])
);

CREATE POLICY "Users can create scheduled reports"
ON public.relatorios_agendados
FOR INSERT
TO authenticated
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update own scheduled reports or elevated"
ON public.relatorios_agendados
FOR UPDATE
TO authenticated
USING (
  created_by = auth.uid()
  OR public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role])
)
WITH CHECK (
  created_by = auth.uid()
  OR public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role])
);

CREATE POLICY "Users can delete own scheduled reports or elevated"
ON public.relatorios_agendados
FOR DELETE
TO authenticated
USING (
  created_by = auth.uid()
  OR public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role])
);-- Auditoria final: endurecer RLS em tabelas restantes

-- 1) clientes: leitura apenas por operacional+
DROP POLICY IF EXISTS "Authenticated users can view clientes" ON public.clientes;
CREATE POLICY "Operacional+ podem ver clientes"
ON public.clientes FOR SELECT TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role, 'operacional'::public.app_role]));

-- 2) boletos: leitura apenas por operacional+
DROP POLICY IF EXISTS "Authenticated users can view boletos" ON public.boletos;
CREATE POLICY "Operacional+ podem ver boletos"
ON public.boletos FOR SELECT TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role, 'operacional'::public.app_role]));

-- 3) fornecedores: leitura apenas por operacional+
DROP POLICY IF EXISTS "Authenticated users can view fornecedores" ON public.fornecedores;
CREATE POLICY "Operacional+ podem ver fornecedores"
ON public.fornecedores FOR SELECT TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role, 'operacional'::public.app_role]));

-- 4) acordos_parcelamento: leitura restrita a financeiro/admin
DROP POLICY IF EXISTS "Usuários autenticados podem ver acordos" ON public.acordos_parcelamento;
CREATE POLICY "Financeiro+ podem ver acordos"
ON public.acordos_parcelamento FOR SELECT TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role]));

-- 5) notas_fiscais: leitura apenas por operacional+
DROP POLICY IF EXISTS "Authenticated users can view notas_fiscais" ON public.notas_fiscais;
CREATE POLICY "Operacional+ podem ver notas fiscais"
ON public.notas_fiscais FOR SELECT TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role, 'operacional'::public.app_role]));

-- 6) configuracoes_aprovacao: leitura apenas por autenticados (era {public})
DROP POLICY IF EXISTS "Authenticated users can view configuracoes_aprovacao" ON public.configuracoes_aprovacao;
CREATE POLICY "Autenticados podem ver configuracoes_aprovacao"
ON public.configuracoes_aprovacao FOR SELECT TO authenticated
USING (true);

-- 7) regras_conciliacao: escrita restrita a financeiro/admin
DROP POLICY IF EXISTS "Authenticated users can insert regras_conciliacao" ON public.regras_conciliacao;
DROP POLICY IF EXISTS "Authenticated users can update regras_conciliacao" ON public.regras_conciliacao;

CREATE POLICY "Financeiro+ podem inserir regras_conciliacao"
ON public.regras_conciliacao FOR INSERT TO authenticated
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role]));

CREATE POLICY "Financeiro+ podem atualizar regras_conciliacao"
ON public.regras_conciliacao FOR UPDATE TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role]))
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role]));

-- 8) alertas_preditivos: inserção e update restritos
DROP POLICY IF EXISTS "Sistema pode inserir alertas preditivos" ON public.alertas_preditivos;
DROP POLICY IF EXISTS "Usuários podem atualizar seus alertas" ON public.alertas_preditivos;

CREATE POLICY "Inserir alertas preditivos restrito"
ON public.alertas_preditivos FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
  OR (user_id IS NULL AND public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role]))
);

CREATE POLICY "Atualizar alertas preditivos restrito"
ON public.alertas_preditivos FOR UPDATE TO authenticated
USING (
  user_id = auth.uid()
  OR (user_id IS NULL AND public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role]))
)
WITH CHECK (
  user_id = auth.uid()
  OR (user_id IS NULL AND public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role]))
);

-- 9) recomendacoes_metas_ia: update restrito
DROP POLICY IF EXISTS "Usuários podem atualizar recomendações" ON public.recomendacoes_metas_ia;

CREATE POLICY "Financeiro+ podem atualizar recomendações"
ON public.recomendacoes_metas_ia FOR UPDATE TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role]))
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role]));

-- 10) historico_cobranca_whatsapp: inserção e update restritos a financeiro/admin
DROP POLICY IF EXISTS "Usuários podem inserir histórico de cobrança" ON public.historico_cobranca_whatsapp;
DROP POLICY IF EXISTS "Usuários podem atualizar histórico de cobrança" ON public.historico_cobranca_whatsapp;

CREATE POLICY "Financeiro+ podem inserir historico cobranca whatsapp"
ON public.historico_cobranca_whatsapp FOR INSERT TO authenticated
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role]));

CREATE POLICY "Financeiro+ podem atualizar historico cobranca whatsapp"
ON public.historico_cobranca_whatsapp FOR UPDATE TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role]))
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role]));-- Rodada final: endurecer tabelas tributárias, pagamentos recorrentes, alertas preditivos, recomendações e login_attempts

-- 1) 12 tabelas tributárias: restringir a financeiro/admin
DO $$
DECLARE
  t text;
  tables text[] := ARRAY['apuracoes_tributarias','operacoes_tributaveis','creditos_tributarios','split_payment_transacoes','regimes_especiais_empresa','apuracoes_irpj_csll','prejuizos_fiscais','lalur_lancamentos','incentivos_fiscais','retencoes_fonte','darfs','per_dcomp'];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    -- Drop broad policies
    EXECUTE format('DROP POLICY IF EXISTS "Authenticated users can view %1$s" ON public.%1$I', t);
    EXECUTE format('DROP POLICY IF EXISTS "Authenticated users can insert %1$s" ON public.%1$I', t);
    EXECUTE format('DROP POLICY IF EXISTS "Authenticated users can update %1$s" ON public.%1$I', t);
    EXECUTE format('DROP POLICY IF EXISTS "Authenticated users can delete %1$s" ON public.%1$I', t);

    -- Create role-scoped policies
    EXECUTE format('CREATE POLICY "Financeiro+ podem ver %1$s" ON public.%1$I FOR SELECT TO authenticated USING (public.has_any_role(auth.uid(), ARRAY[''admin''::public.app_role, ''financeiro''::public.app_role]))', t);
    EXECUTE format('CREATE POLICY "Financeiro+ podem inserir %1$s" ON public.%1$I FOR INSERT TO authenticated WITH CHECK (public.has_any_role(auth.uid(), ARRAY[''admin''::public.app_role, ''financeiro''::public.app_role]))', t);
    EXECUTE format('CREATE POLICY "Financeiro+ podem atualizar %1$s" ON public.%1$I FOR UPDATE TO authenticated USING (public.has_any_role(auth.uid(), ARRAY[''admin''::public.app_role, ''financeiro''::public.app_role])) WITH CHECK (public.has_any_role(auth.uid(), ARRAY[''admin''::public.app_role, ''financeiro''::public.app_role]))', t);
    EXECUTE format('CREATE POLICY "Admin pode deletar %1$s" ON public.%1$I FOR DELETE TO authenticated USING (public.has_role(auth.uid(), ''admin''::public.app_role))', t);
  END LOOP;
END$$;

-- 2) pagamentos_recorrentes: restringir leitura e escrita
DROP POLICY IF EXISTS "Authenticated users can view pagamentos_recorrentes" ON public.pagamentos_recorrentes;
DROP POLICY IF EXISTS "Authenticated users can update pagamentos_recorrentes" ON public.pagamentos_recorrentes;

CREATE POLICY "Operacional+ podem ver pagamentos_recorrentes"
ON public.pagamentos_recorrentes FOR SELECT TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role, 'operacional'::public.app_role]));

CREATE POLICY "Financeiro+ podem atualizar pagamentos_recorrentes"
ON public.pagamentos_recorrentes FOR UPDATE TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role]))
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role]));

-- 3) alertas_preditivos: restringir SELECT de alertas de sistema
DROP POLICY IF EXISTS "Usuários podem ver seus alertas preditivos" ON public.alertas_preditivos;
CREATE POLICY "Usuários podem ver alertas preditivos com escopo"
ON public.alertas_preditivos FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR (user_id IS NULL AND public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role]))
);

-- 4) recomendacoes_metas_ia: restringir SELECT
DROP POLICY IF EXISTS "Usuários autenticados podem ver recomendações" ON public.recomendacoes_metas_ia;
CREATE POLICY "Financeiro+ podem ver recomendações"
ON public.recomendacoes_metas_ia FOR SELECT TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role]));

-- 5) login_attempts: restringir INSERT a server-side function
DROP POLICY IF EXISTS "System can insert login attempts" ON public.login_attempts;
CREATE POLICY "Usuários podem registrar próprias tentativas"
ON public.login_attempts FOR INSERT TO authenticated
WITH CHECK (user_email = (SELECT email FROM public.profiles WHERE id = auth.uid()));

-- 6) portal_cliente_acessos INSERT: restringir a autenticados
DROP POLICY IF EXISTS "Acessos podem ser registrados publicamente" ON public.portal_cliente_acessos;
CREATE POLICY "Autenticados podem registrar acessos"
ON public.portal_cliente_acessos FOR INSERT TO authenticated
WITH CHECK (token_id IS NOT NULL AND acao IS NOT NULL AND length(trim(acao)) > 0);-- Remove conflicting broad policies that override role-restricted ones

-- Tributárias
DROP POLICY IF EXISTS "Usuários autenticados podem ver apurações" ON public.apuracoes_tributarias;
DROP POLICY IF EXISTS "Usuários autenticados podem inserir apurações" ON public.apuracoes_tributarias;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar apurações" ON public.apuracoes_tributarias;
DROP POLICY IF EXISTS "Usuários autenticados podem deletar apurações" ON public.apuracoes_tributarias;

DROP POLICY IF EXISTS "Usuários autenticados podem ver operações" ON public.operacoes_tributaveis;
DROP POLICY IF EXISTS "Usuários autenticados podem inserir operações" ON public.operacoes_tributaveis;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar operações" ON public.operacoes_tributaveis;
DROP POLICY IF EXISTS "Usuários autenticados podem deletar operações" ON public.operacoes_tributaveis;

DROP POLICY IF EXISTS "Usuários autenticados podem ver créditos" ON public.creditos_tributarios;
DROP POLICY IF EXISTS "Usuários autenticados podem inserir créditos" ON public.creditos_tributarios;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar créditos" ON public.creditos_tributarios;
DROP POLICY IF EXISTS "Usuários autenticados podem deletar créditos" ON public.creditos_tributarios;

DROP POLICY IF EXISTS "Auth users can manage apuracoes_irpj" ON public.apuracoes_irpj_csll;
DROP POLICY IF EXISTS "retencoes_fonte_all" ON public.retencoes_fonte;
DROP POLICY IF EXISTS "darfs_all" ON public.darfs;
DROP POLICY IF EXISTS "per_dcomp_all" ON public.per_dcomp;

DROP POLICY IF EXISTS "split_payment_all" ON public.split_payment_transacoes;
DROP POLICY IF EXISTS "Usuários autenticados podem ver split payment" ON public.split_payment_transacoes;
DROP POLICY IF EXISTS "Usuários autenticados podem inserir split payment" ON public.split_payment_transacoes;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar split payment" ON public.split_payment_transacoes;

DROP POLICY IF EXISTS "Auth users can manage regimes_especiais" ON public.regimes_especiais_empresa;
DROP POLICY IF EXISTS "Usuários autenticados podem ver regimes especiais" ON public.regimes_especiais_empresa;
DROP POLICY IF EXISTS "Usuários autenticados podem inserir regimes especiais" ON public.regimes_especiais_empresa;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar regimes especiais" ON public.regimes_especiais_empresa;
DROP POLICY IF EXISTS "Usuários autenticados podem deletar regimes especiais" ON public.regimes_especiais_empresa;

DROP POLICY IF EXISTS "Auth users can manage prejuizos" ON public.prejuizos_fiscais;
DROP POLICY IF EXISTS "Auth users can manage lalur" ON public.lalur_lancamentos;
DROP POLICY IF EXISTS "Auth users can manage incentivos" ON public.incentivos_fiscais;

-- Pagamentos recorrentes
DROP POLICY IF EXISTS "Usuários autenticados podem ver pagamentos recorrentes" ON public.pagamentos_recorrentes;
DROP POLICY IF EXISTS "Usuários podem atualizar pagamentos recorrentes" ON public.pagamentos_recorrentes;

-- Login attempts
DROP POLICY IF EXISTS "Sistema pode inserir tentativas" ON public.login_attempts;

-- Allowed countries: restrict to authenticated
DROP POLICY IF EXISTS "Leitura pública para validação" ON public.allowed_countries;
CREATE POLICY "Autenticados podem ver allowed_countries"
ON public.allowed_countries FOR SELECT TO authenticated
USING (true);-- Final audit: harden all remaining RLS policies

-- 1) contas_bancarias: restrict SELECT to financeiro/admin
DROP POLICY IF EXISTS "Authenticated users can view contas_bancarias" ON public.contas_bancarias;
CREATE POLICY "Financeiro+ podem ver contas_bancarias"
ON public.contas_bancarias FOR SELECT TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role]));

-- 2) transacoes_bancarias: restrict SELECT to financeiro/admin
DROP POLICY IF EXISTS "Authenticated users can view transacoes_bancarias" ON public.transacoes_bancarias;
CREATE POLICY "Financeiro+ podem ver transacoes_bancarias"
ON public.transacoes_bancarias FOR SELECT TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role]));

-- 3) contas_receber: restrict SELECT to operacional+
DROP POLICY IF EXISTS "Authenticated users can view contas_receber" ON public.contas_receber;
CREATE POLICY "Operacional+ podem ver contas_receber"
ON public.contas_receber FOR SELECT TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role, 'operacional'::public.app_role]));

-- 4) contas_pagar: restrict SELECT to operacional+
DROP POLICY IF EXISTS "Authenticated users can view contas_pagar" ON public.contas_pagar;
CREATE POLICY "Operacional+ podem ver contas_pagar"
ON public.contas_pagar FOR SELECT TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role, 'operacional'::public.app_role]));

-- 5) vendedores: restrict SELECT to operacional+
DROP POLICY IF EXISTS "Autenticados podem ver vendedores" ON public.vendedores;
DROP POLICY IF EXISTS "Authenticated users can view vendedores" ON public.vendedores;
CREATE POLICY "Operacional+ podem ver vendedores"
ON public.vendedores FOR SELECT TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role, 'operacional'::public.app_role]));

-- 6) conciliacoes_parciais: restrict to financeiro/admin
DROP POLICY IF EXISTS "Authenticated users can view conciliacoes_parciais" ON public.conciliacoes_parciais;
DROP POLICY IF EXISTS "Authenticated users can insert conciliacoes_parciais" ON public.conciliacoes_parciais;
CREATE POLICY "Financeiro+ podem ver conciliacoes_parciais"
ON public.conciliacoes_parciais FOR SELECT TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role]));
CREATE POLICY "Financeiro+ podem inserir conciliacoes_parciais"
ON public.conciliacoes_parciais FOR INSERT TO authenticated
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role]));

-- 7) workflow_aprovacoes: restrict SELECT
DROP POLICY IF EXISTS "Authenticated users can view workflow_aprovacoes" ON public.workflow_aprovacoes;
CREATE POLICY "Aprovações visíveis ao solicitante ou financeiro+"
ON public.workflow_aprovacoes FOR SELECT TO authenticated
USING (
  solicitante_id = auth.uid()
  OR public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role])
);

-- 8) solicitacoes_aprovacao: restrict SELECT
DROP POLICY IF EXISTS "Authenticated users can view solicitacoes_aprovacao" ON public.solicitacoes_aprovacao;
CREATE POLICY "Solicitações visíveis ao solicitante ou financeiro+"
ON public.solicitacoes_aprovacao FOR SELECT TO authenticated
USING (
  solicitado_por = auth.uid()
  OR public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role])
);

-- 9) contratos: restrict SELECT to financeiro/admin
DROP POLICY IF EXISTS "Authenticated users can view contratos" ON public.contratos;
CREATE POLICY "Financeiro+ podem ver contratos"
ON public.contratos FOR SELECT TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role]));

-- 10) parcelas_acordo: restrict SELECT to financeiro/admin
DROP POLICY IF EXISTS "Authenticated users can view parcelas_acordo" ON public.parcelas_acordo;
DROP POLICY IF EXISTS "Usuários autenticados podem ver parcelas" ON public.parcelas_acordo;
CREATE POLICY "Financeiro+ podem ver parcelas_acordo"
ON public.parcelas_acordo FOR SELECT TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role]));

-- 11) metas_financeiras: restrict SELECT to financeiro/admin
DROP POLICY IF EXISTS "Authenticated users can view metas_financeiras" ON public.metas_financeiras;
CREATE POLICY "Financeiro+ podem ver metas_financeiras"
ON public.metas_financeiras FOR SELECT TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role]));

-- 12) historico_conciliacao_ia: restrict to financeiro/admin
DROP POLICY IF EXISTS "Authenticated users can view historico_conciliacao_ia" ON public.historico_conciliacao_ia;
DROP POLICY IF EXISTS "Authenticated users can insert historico_conciliacao_ia" ON public.historico_conciliacao_ia;
CREATE POLICY "Financeiro+ podem ver historico_conciliacao_ia"
ON public.historico_conciliacao_ia FOR SELECT TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role]));
CREATE POLICY "Financeiro+ podem inserir historico_conciliacao_ia"
ON public.historico_conciliacao_ia FOR INSERT TO authenticated
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role]));

-- 13) historico_cobranca: restrict SELECT to financeiro/admin
DROP POLICY IF EXISTS "Authenticated users can view historico_cobranca" ON public.historico_cobranca;
CREATE POLICY "Financeiro+ podem ver historico_cobranca"
ON public.historico_cobranca FOR SELECT TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role]));

-- 14) empresas: restrict SELECT to operacional+
DROP POLICY IF EXISTS "Authenticated users can view empresas" ON public.empresas;
CREATE POLICY "Operacional+ podem ver empresas"
ON public.empresas FOR SELECT TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role, 'operacional'::public.app_role]));

-- 15) centros_custo: restrict SELECT to financeiro/admin
DROP POLICY IF EXISTS "Authenticated users can view centros_custo" ON public.centros_custo;
CREATE POLICY "Financeiro+ podem ver centros_custo"
ON public.centros_custo FOR SELECT TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role]));

-- 16) security_alerts: restrict INSERT to admin only
DROP POLICY IF EXISTS "System can insert security alerts" ON public.security_alerts;
CREATE POLICY "Admin pode inserir security_alerts"
ON public.security_alerts FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));-- Drop conflicting broad policies that override the restricted ones

-- contas_bancarias
DROP POLICY IF EXISTS "Authenticated users can view contas" ON public.contas_bancarias;

-- transacoes_bancarias
DROP POLICY IF EXISTS "Authenticated users can view transacoes" ON public.transacoes_bancarias;

-- workflow_aprovacoes
DROP POLICY IF EXISTS "Usuários autenticados podem ver aprovações" ON public.workflow_aprovacoes;

-- contratos
DROP POLICY IF EXISTS "Usuários autenticados podem ver contratos" ON public.contratos;

-- vendedores
DROP POLICY IF EXISTS "Usuários autenticados podem ver vendedores" ON public.vendedores;

-- security_alerts (broad insert)
DROP POLICY IF EXISTS "Usuários autenticados podem inserir alertas de segurança" ON public.security_alerts;-- Drop remaining conflicting broad policies

-- historico_conciliacao_ia
DROP POLICY IF EXISTS "Usuários autenticados podem ver histórico de conciliação" ON public.historico_conciliacao_ia;
DROP POLICY IF EXISTS "Usuários autenticados podem inserir histórico de conciliaçã" ON public.historico_conciliacao_ia;
DROP POLICY IF EXISTS "Usuários autenticados podem inserir histórico de conciliação" ON public.historico_conciliacao_ia;

-- conciliacoes_parciais
DROP POLICY IF EXISTS "Authenticated users can read conciliacoes_parciais" ON public.conciliacoes_parciais;

-- feedback_conciliacao_ia
DROP POLICY IF EXISTS "Usuários autenticados podem ver feedback" ON public.feedback_conciliacao_ia;
DROP POLICY IF EXISTS "Usuários autenticados podem inserir feedback" ON public.feedback_conciliacao_ia;

CREATE POLICY "Usuário vê próprio feedback"
ON public.feedback_conciliacao_ia FOR SELECT TO authenticated
USING (created_by = auth.uid() OR public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role]));

CREATE POLICY "Financeiro+ podem inserir feedback"
ON public.feedback_conciliacao_ia FOR INSERT TO authenticated
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role]));
-- ============================================
-- ASAAS Integration Tables
-- ============================================

-- Tabela de clientes sincronizados com ASAAS
CREATE TABLE public.asaas_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
  empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE NOT NULL,
  asaas_id TEXT NOT NULL UNIQUE,
  nome TEXT NOT NULL,
  cpf_cnpj TEXT,
  email TEXT,
  telefone TEXT,
  endereco JSONB,
  sincronizado_em TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de cobranças/pagamentos do ASAAS
CREATE TABLE public.asaas_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE NOT NULL,
  asaas_id TEXT NOT NULL UNIQUE,
  asaas_customer_id TEXT,
  conta_receber_id UUID REFERENCES public.contas_receber(id) ON DELETE SET NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('boleto', 'pix', 'credit_card', 'debit_card')),
  valor NUMERIC(14,2) NOT NULL,
  valor_liquido NUMERIC(14,2),
  data_vencimento DATE NOT NULL,
  data_pagamento DATE,
  status TEXT NOT NULL DEFAULT 'PENDING',
  descricao TEXT,
  nosso_numero TEXT,
  codigo_barras TEXT,
  linha_digitavel TEXT,
  pix_qrcode TEXT,
  pix_copia_cola TEXT,
  link_boleto TEXT,
  link_fatura TEXT,
  webhook_payload JSONB,
  erro_mensagem TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX idx_asaas_customers_empresa ON public.asaas_customers(empresa_id);
CREATE INDEX idx_asaas_customers_cliente ON public.asaas_customers(cliente_id);
CREATE INDEX idx_asaas_payments_empresa ON public.asaas_payments(empresa_id);
CREATE INDEX idx_asaas_payments_status ON public.asaas_payments(status);
CREATE INDEX idx_asaas_payments_conta_receber ON public.asaas_payments(conta_receber_id);

-- Triggers updated_at
CREATE TRIGGER update_asaas_customers_updated_at
  BEFORE UPDATE ON public.asaas_customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_asaas_payments_updated_at
  BEFORE UPDATE ON public.asaas_payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE public.asaas_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asaas_payments ENABLE ROW LEVEL SECURITY;

-- Policies asaas_customers
CREATE POLICY "Admins e financeiro podem ver clientes ASAAS"
  ON public.asaas_customers FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin', 'financeiro']::app_role[]));

CREATE POLICY "Admins e financeiro podem inserir clientes ASAAS"
  ON public.asaas_customers FOR INSERT TO authenticated
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin', 'financeiro']::app_role[]));

CREATE POLICY "Admins e financeiro podem atualizar clientes ASAAS"
  ON public.asaas_customers FOR UPDATE TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin', 'financeiro']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin', 'financeiro']::app_role[]));

-- Policies asaas_payments
CREATE POLICY "Admins e financeiro podem ver pagamentos ASAAS"
  ON public.asaas_payments FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin', 'financeiro']::app_role[]));

CREATE POLICY "Admins e financeiro podem inserir pagamentos ASAAS"
  ON public.asaas_payments FOR INSERT TO authenticated
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin', 'financeiro']::app_role[]));

CREATE POLICY "Admins e financeiro podem atualizar pagamentos ASAAS"
  ON public.asaas_payments FOR UPDATE TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin', 'financeiro']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin', 'financeiro']::app_role[]));

-- Service role policy for webhook (inserts/updates without auth)
CREATE POLICY "Service role full access asaas_payments"
  ON public.asaas_payments FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access asaas_customers"
  ON public.asaas_customers FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Bling OAuth tokens storage
CREATE TABLE public.bling_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  access_token text NOT NULL,
  refresh_token text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL
);

ALTER TABLE public.bling_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage bling tokens" ON public.bling_tokens
  FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role]));

-- Bling sync logs
CREATE TABLE public.bling_sync_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo text NOT NULL,
  modulo text NOT NULL,
  status text NOT NULL DEFAULT 'pendente',
  registros_processados int DEFAULT 0,
  registros_com_erro int DEFAULT 0,
  detalhes jsonb,
  mensagem_erro text,
  iniciado_em timestamptz NOT NULL DEFAULT now(),
  finalizado_em timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.bling_sync_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and financeiro can view bling sync logs" ON public.bling_sync_logs
  FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role, 'operacional'::app_role]));

CREATE POLICY "Admins and financeiro can insert bling sync logs" ON public.bling_sync_logs
  FOR INSERT TO authenticated
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role]));

-- Bling webhook events
CREATE TABLE public.bling_webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  module text NOT NULL,
  resource_id text,
  payload jsonb,
  processed boolean DEFAULT false,
  processed_at timestamptz,
  error_message text,
  retries int DEFAULT 0,
  received_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.bling_webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view bling webhook events" ON public.bling_webhook_events
  FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role]));

-- Indexes
CREATE INDEX idx_bling_webhook_events_processed ON public.bling_webhook_events(processed);
CREATE INDEX idx_bling_webhook_events_module ON public.bling_webhook_events(module);
CREATE INDEX idx_bling_sync_logs_modulo ON public.bling_sync_logs(modulo);
CREATE INDEX idx_bling_sync_logs_status ON public.bling_sync_logs(status);

-- Trigger for updated_at on bling_tokens
CREATE TRIGGER set_bling_tokens_updated_at
  BEFORE UPDATE ON public.bling_tokens
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- =====================================================
-- MIGRAÇÃO 1: Tabelas ausentes do módulo Core Financeiro
-- =====================================================

-- Tabela: contatos_financeiros (20 cols)
CREATE TABLE IF NOT EXISTS public.contatos_financeiros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  email TEXT,
  telefone TEXT,
  whatsapp TEXT,
  cpf_cnpj TEXT,
  tipo TEXT DEFAULT 'cliente' CHECK (tipo IN ('cliente', 'fornecedor', 'ambos', 'outro')),
  cargo TEXT,
  departamento TEXT,
  empresa TEXT,
  endereco TEXT,
  cidade TEXT,
  estado TEXT,
  cep TEXT,
  observacoes TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  empresa_id UUID REFERENCES public.empresas(id),
  origem TEXT DEFAULT 'manual',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela: categorias (10 cols)
CREATE TABLE IF NOT EXISTS public.categorias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'ambos' CHECK (tipo IN ('receita', 'despesa', 'ambos')),
  cor TEXT DEFAULT '#6B7280',
  icone TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  user_id UUID,
  plano_conta_id UUID REFERENCES public.plano_contas(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela: formas_pagamento (11 cols)
CREATE TABLE IF NOT EXISTS public.formas_pagamento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  codigo TEXT UNIQUE,
  tipo TEXT DEFAULT 'ambos' CHECK (tipo IN ('entrada', 'saida', 'ambos')),
  taxa_percentual NUMERIC DEFAULT 0,
  dias_compensacao INTEGER DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT true,
  requer_dados_bancarios BOOLEAN DEFAULT false,
  icone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela: movimentacoes (27 cols)
CREATE TABLE IF NOT EXISTS public.movimentacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES public.empresas(id),
  conta_bancaria_id UUID REFERENCES public.contas_bancarias(id),
  conta_pagar_id UUID REFERENCES public.contas_pagar(id),
  conta_receber_id UUID REFERENCES public.contas_receber(id),
  transferencia_id UUID,
  tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'saida', 'transferencia')),
  descricao TEXT NOT NULL,
  valor NUMERIC NOT NULL,
  data_movimentacao DATE NOT NULL DEFAULT CURRENT_DATE,
  data_competencia DATE,
  categoria_id UUID,
  centro_custo_id UUID REFERENCES public.centros_custo(id),
  forma_pagamento_id UUID,
  numero_documento TEXT,
  observacoes TEXT,
  conciliada BOOLEAN DEFAULT false,
  conciliada_em TIMESTAMPTZ,
  conciliada_por UUID,
  estornada BOOLEAN DEFAULT false,
  estornada_em TIMESTAMPTZ,
  movimentacao_estorno_id UUID,
  origem TEXT DEFAULT 'manual',
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- Tabela: transferencias (40 cols)
CREATE TABLE IF NOT EXISTS public.transferencias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES public.empresas(id),
  conta_bancaria_id UUID REFERENCES public.contas_bancarias(id),
  conta_destino_id UUID REFERENCES public.contas_bancarias(id),
  conta_pagar_id UUID REFERENCES public.contas_pagar(id),
  tipo TEXT NOT NULL DEFAULT 'pix' CHECK (tipo IN ('pix', 'ted', 'transferencia_interna', 'boleto_pagamento')),
  descricao TEXT NOT NULL,
  valor NUMERIC NOT NULL,
  taxa NUMERIC DEFAULT 0,
  valor_liquido NUMERIC,
  data_transferencia DATE NOT NULL DEFAULT CURRENT_DATE,
  data_efetivacao DATE,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'agendado', 'realizado', 'cancelado', 'estornado', 'erro')),
  chave_pix TEXT,
  tipo_chave_pix TEXT,
  favorecido_nome TEXT,
  favorecido_cpf_cnpj TEXT,
  favorecido_banco TEXT,
  favorecido_agencia TEXT,
  favorecido_conta TEXT,
  favorecido_tipo_conta TEXT,
  codigo_barras TEXT,
  linha_digitavel TEXT,
  comprovante_url TEXT,
  protocolo TEXT,
  asaas_transfer_id TEXT,
  asaas_status TEXT,
  erro_mensagem TEXT,
  observacoes TEXT,
  aprovado_por UUID,
  aprovado_em TIMESTAMPTZ,
  cancelado_por UUID,
  cancelado_em TIMESTAMPTZ,
  motivo_cancelamento TEXT,
  movimentacao_id UUID,
  numero_documento TEXT,
  origem TEXT DEFAULT 'manual',
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela: extrato_bancario (17 cols)
CREATE TABLE IF NOT EXISTS public.extrato_bancario (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conta_bancaria_id UUID NOT NULL REFERENCES public.contas_bancarias(id),
  empresa_id UUID REFERENCES public.empresas(id),
  data DATE NOT NULL,
  descricao TEXT NOT NULL,
  valor NUMERIC NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('credito', 'debito')),
  saldo NUMERIC,
  numero_documento TEXT,
  categoria TEXT,
  importado_de TEXT,
  hash_transacao TEXT,
  conciliado BOOLEAN DEFAULT false,
  transacao_bancaria_id UUID REFERENCES public.transacoes_bancarias(id),
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela: conciliacoes (14 cols)
CREATE TABLE IF NOT EXISTS public.conciliacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES public.empresas(id),
  conta_bancaria_id UUID NOT NULL REFERENCES public.contas_bancarias(id),
  periodo_inicio DATE NOT NULL,
  periodo_fim DATE NOT NULL,
  saldo_banco NUMERIC NOT NULL DEFAULT 0,
  saldo_sistema NUMERIC NOT NULL DEFAULT 0,
  total_conciliados INTEGER DEFAULT 0,
  total_pendentes INTEGER DEFAULT 0,
  status TEXT DEFAULT 'em_andamento' CHECK (status IN ('em_andamento', 'finalizada', 'cancelada')),
  finalizada_em TIMESTAMPTZ,
  finalizada_por UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela: anexos_financeiros (11 cols)
CREATE TABLE IF NOT EXISTS public.anexos_financeiros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entidade_tipo TEXT NOT NULL,
  entidade_id UUID NOT NULL,
  nome_arquivo TEXT NOT NULL,
  url TEXT NOT NULL,
  tipo_arquivo TEXT,
  tamanho_bytes BIGINT,
  descricao TEXT,
  uploaded_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela: auditoria_financeira (9 cols)
CREATE TABLE IF NOT EXISTS public.auditoria_financeira (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tabela TEXT NOT NULL,
  operacao TEXT NOT NULL CHECK (operacao IN ('INSERT', 'UPDATE', 'DELETE')),
  registro_id UUID,
  dados_antigos JSONB,
  dados_novos JSONB,
  user_id UUID,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela: webhooks_log (12 cols)
CREATE TABLE IF NOT EXISTS public.webhooks_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB,
  headers JSONB,
  status TEXT DEFAULT 'recebido',
  processado BOOLEAN DEFAULT false,
  processado_em TIMESTAMPTZ,
  erro_mensagem TEXT,
  ip_origem TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.contatos_financeiros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.formas_pagamento ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimentacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transferencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.extrato_bancario ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conciliacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anexos_financeiros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auditoria_financeira ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhooks_log ENABLE ROW LEVEL SECURITY;

-- RLS policies for authenticated users with role checks
CREATE POLICY "Auth users can manage contatos_financeiros" ON public.contatos_financeiros FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users can manage categorias" ON public.categorias FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users can read formas_pagamento" ON public.formas_pagamento FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can manage movimentacoes" ON public.movimentacoes FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users can manage transferencias" ON public.transferencias FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users can manage extrato_bancario" ON public.extrato_bancario FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users can manage conciliacoes" ON public.conciliacoes FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users can manage anexos_financeiros" ON public.anexos_financeiros FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users can read auditoria_financeira" ON public.auditoria_financeira FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can read webhooks_log" ON public.webhooks_log FOR SELECT TO authenticated USING (true);

-- updated_at triggers for new tables
CREATE TRIGGER update_contatos_financeiros_updated_at BEFORE UPDATE ON public.contatos_financeiros FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_categorias_updated_at BEFORE UPDATE ON public.categorias FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_formas_pagamento_updated_at BEFORE UPDATE ON public.formas_pagamento FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_movimentacoes_updated_at BEFORE UPDATE ON public.movimentacoes FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_transferencias_updated_at BEFORE UPDATE ON public.transferencias FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_extrato_bancario_updated_at BEFORE UPDATE ON public.extrato_bancario FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_conciliacoes_updated_at BEFORE UPDATE ON public.conciliacoes FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_anexos_financeiros_updated_at BEFORE UPDATE ON public.anexos_financeiros FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_webhooks_log_updated_at BEFORE UPDATE ON public.webhooks_log FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- MIGRAÇÃO 2: Tabelas de Cobrança ausentes
-- =====================================================

-- Tabela: templates_cobranca (14 cols)
CREATE TABLE IF NOT EXISTS public.templates_cobranca (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES public.empresas(id),
  etapa TEXT NOT NULL,
  canal TEXT NOT NULL CHECK (canal IN ('email', 'whatsapp', 'sms', 'telefone')),
  assunto TEXT,
  corpo TEXT NOT NULL,
  tom TEXT DEFAULT 'profissional' CHECK (tom IN ('amigavel', 'profissional', 'firme', 'urgente', 'juridico')),
  padrao BOOLEAN DEFAULT false,
  ativo BOOLEAN NOT NULL DEFAULT true,
  variaveis_disponiveis TEXT[],
  versao INTEGER DEFAULT 1,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela: fila_cobrancas (22 cols)
CREATE TABLE IF NOT EXISTS public.fila_cobrancas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES public.empresas(id),
  conta_receber_id UUID REFERENCES public.contas_receber(id),
  cliente_id UUID REFERENCES public.clientes(id),
  cliente_nome TEXT,
  etapa TEXT NOT NULL,
  canal TEXT NOT NULL CHECK (canal IN ('email', 'whatsapp', 'sms', 'telefone')),
  destinatario TEXT,
  template_id UUID REFERENCES public.templates_cobranca(id),
  mensagem_renderizada TEXT,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'processando', 'enviado', 'entregue', 'lido', 'respondido', 'falhou', 'cancelado')),
  tentativas INTEGER DEFAULT 0,
  max_tentativas INTEGER DEFAULT 3,
  proxima_tentativa TIMESTAMPTZ,
  erro_mensagem TEXT,
  prioridade INTEGER DEFAULT 5,
  agendado_para TIMESTAMPTZ,
  processado_em TIMESTAMPTZ,
  processado_por TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela: execucoes_cobranca (22 cols)
CREATE TABLE IF NOT EXISTS public.execucoes_cobranca (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES public.empresas(id),
  fila_id UUID REFERENCES public.fila_cobrancas(id),
  conta_receber_id UUID REFERENCES public.contas_receber(id),
  cliente_id UUID REFERENCES public.clientes(id),
  cliente_nome TEXT,
  etapa TEXT NOT NULL,
  canal TEXT NOT NULL,
  destinatario TEXT,
  mensagem TEXT,
  status TEXT NOT NULL DEFAULT 'enviado',
  provider TEXT,
  provider_message_id TEXT,
  entregue BOOLEAN DEFAULT false,
  entregue_em TIMESTAMPTZ,
  lido BOOLEAN DEFAULT false,
  lido_em TIMESTAMPTZ,
  respondido BOOLEAN DEFAULT false,
  resposta TEXT,
  erro_mensagem TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela: negativacoes (15 cols)
CREATE TABLE IF NOT EXISTS public.negativacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES public.empresas(id),
  cliente_id UUID REFERENCES public.clientes(id),
  conta_receber_id UUID REFERENCES public.contas_receber(id),
  bureau TEXT NOT NULL CHECK (bureau IN ('serasa', 'spc', 'boa_vista')),
  valor NUMERIC NOT NULL,
  data_inclusao DATE,
  data_exclusao DATE,
  protocolo TEXT,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'incluido', 'excluido', 'erro', 'cancelado')),
  motivo TEXT,
  observacoes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela: protestos (18 cols)
CREATE TABLE IF NOT EXISTS public.protestos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES public.empresas(id),
  cliente_id UUID REFERENCES public.clientes(id),
  conta_receber_id UUID REFERENCES public.contas_receber(id),
  cartorio TEXT,
  cidade_cartorio TEXT,
  estado_cartorio TEXT,
  valor NUMERIC NOT NULL,
  data_protocolo DATE,
  data_protesto DATE,
  data_pagamento DATE,
  protocolo TEXT,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'protocolado', 'protestado', 'pago', 'cancelado', 'sustado', 'erro')),
  custas NUMERIC DEFAULT 0,
  observacoes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.templates_cobranca ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fila_cobrancas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.execucoes_cobranca ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.negativacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.protestos ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Auth users can manage templates_cobranca" ON public.templates_cobranca FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users can manage fila_cobrancas" ON public.fila_cobrancas FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users can manage execucoes_cobranca" ON public.execucoes_cobranca FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users can manage negativacoes" ON public.negativacoes FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users can manage protestos" ON public.protestos FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- updated_at triggers
CREATE TRIGGER update_templates_cobranca_updated_at BEFORE UPDATE ON public.templates_cobranca FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_fila_cobrancas_updated_at BEFORE UPDATE ON public.fila_cobrancas FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_execucoes_cobranca_updated_at BEFORE UPDATE ON public.execucoes_cobranca FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_negativacoes_updated_at BEFORE UPDATE ON public.negativacoes FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_protestos_updated_at BEFORE UPDATE ON public.protestos FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- MIGRAÇÃO 3: Colunas faltantes nas tabelas existentes
-- =====================================================

-- ==================== CONTAS_PAGAR ====================
-- Adicionar colunas financeiras para cálculo de valor_final
ALTER TABLE public.contas_pagar ADD COLUMN IF NOT EXISTS valor_original NUMERIC;
ALTER TABLE public.contas_pagar ADD COLUMN IF NOT EXISTS valor_desconto NUMERIC DEFAULT 0;
ALTER TABLE public.contas_pagar ADD COLUMN IF NOT EXISTS valor_juros NUMERIC DEFAULT 0;
ALTER TABLE public.contas_pagar ADD COLUMN IF NOT EXISTS valor_multa NUMERIC DEFAULT 0;

-- Colunas de parcelamento
ALTER TABLE public.contas_pagar ADD COLUMN IF NOT EXISTS numero_parcela_atual INTEGER DEFAULT 1;
ALTER TABLE public.contas_pagar ADD COLUMN IF NOT EXISTS total_parcelas INTEGER DEFAULT 1;

-- Colunas de classificação
ALTER TABLE public.contas_pagar ADD COLUMN IF NOT EXISTS categoria TEXT;
ALTER TABLE public.contas_pagar ADD COLUMN IF NOT EXISTS forma_pagamento TEXT;
ALTER TABLE public.contas_pagar ADD COLUMN IF NOT EXISTS forma_pagamento_id UUID REFERENCES public.formas_pagamento(id);
ALTER TABLE public.contas_pagar ADD COLUMN IF NOT EXISTS plano_conta_id UUID REFERENCES public.plano_contas(id);
ALTER TABLE public.contas_pagar ADD COLUMN IF NOT EXISTS contato_id UUID REFERENCES public.contatos_financeiros(id);

-- Colunas de recorrência e user
ALTER TABLE public.contas_pagar ADD COLUMN IF NOT EXISTS frequencia_recorrencia TEXT;
ALTER TABLE public.contas_pagar ADD COLUMN IF NOT EXISTS user_id UUID;

-- ==================== CONTAS_RECEBER ====================
ALTER TABLE public.contas_receber ADD COLUMN IF NOT EXISTS valor_original NUMERIC;
ALTER TABLE public.contas_receber ADD COLUMN IF NOT EXISTS valor_desconto NUMERIC DEFAULT 0;
ALTER TABLE public.contas_receber ADD COLUMN IF NOT EXISTS valor_juros NUMERIC DEFAULT 0;
ALTER TABLE public.contas_receber ADD COLUMN IF NOT EXISTS valor_multa NUMERIC DEFAULT 0;

ALTER TABLE public.contas_receber ADD COLUMN IF NOT EXISTS numero_parcela_atual INTEGER DEFAULT 1;
ALTER TABLE public.contas_receber ADD COLUMN IF NOT EXISTS total_parcelas INTEGER DEFAULT 1;

ALTER TABLE public.contas_receber ADD COLUMN IF NOT EXISTS categoria TEXT;
ALTER TABLE public.contas_receber ADD COLUMN IF NOT EXISTS forma_recebimento TEXT;
ALTER TABLE public.contas_receber ADD COLUMN IF NOT EXISTS forma_pagamento_id UUID REFERENCES public.formas_pagamento(id);
ALTER TABLE public.contas_receber ADD COLUMN IF NOT EXISTS plano_conta_id UUID REFERENCES public.plano_contas(id);
ALTER TABLE public.contas_receber ADD COLUMN IF NOT EXISTS contato_id UUID REFERENCES public.contatos_financeiros(id);

ALTER TABLE public.contas_receber ADD COLUMN IF NOT EXISTS frequencia_recorrencia TEXT;
ALTER TABLE public.contas_receber ADD COLUMN IF NOT EXISTS recorrente BOOLEAN DEFAULT false;
ALTER TABLE public.contas_receber ADD COLUMN IF NOT EXISTS user_id UUID;

-- ==================== FORNECEDORES ====================
ALTER TABLE public.fornecedores ADD COLUMN IF NOT EXISTS cnpj TEXT;
ALTER TABLE public.fornecedores ADD COLUMN IF NOT EXISTS cep TEXT;
ALTER TABLE public.fornecedores ADD COLUMN IF NOT EXISTS categoria TEXT;
ALTER TABLE public.fornecedores ADD COLUMN IF NOT EXISTS banco TEXT;
ALTER TABLE public.fornecedores ADD COLUMN IF NOT EXISTS agencia TEXT;
ALTER TABLE public.fornecedores ADD COLUMN IF NOT EXISTS conta TEXT;
ALTER TABLE public.fornecedores ADD COLUMN IF NOT EXISTS pix TEXT;
ALTER TABLE public.fornecedores ADD COLUMN IF NOT EXISTS contato_nome TEXT;
ALTER TABLE public.fornecedores ADD COLUMN IF NOT EXISTS contato_telefone TEXT;
ALTER TABLE public.fornecedores ADD COLUMN IF NOT EXISTS score INTEGER DEFAULT 100;
ALTER TABLE public.fornecedores ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES public.empresas(id);
ALTER TABLE public.fornecedores ADD COLUMN IF NOT EXISTS contato_financeiro_id UUID REFERENCES public.contatos_financeiros(id);

-- ==================== CONTAS_BANCARIAS ====================
ALTER TABLE public.contas_bancarias ADD COLUMN IF NOT EXISTS nome TEXT;
ALTER TABLE public.contas_bancarias ADD COLUMN IF NOT EXISTS tipo TEXT DEFAULT 'corrente';
ALTER TABLE public.contas_bancarias ADD COLUMN IF NOT EXISTS saldo_inicial NUMERIC DEFAULT 0;

-- ==================== CLIENTES ====================
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS tipo TEXT DEFAULT 'PJ' CHECK (tipo IN ('PF', 'PJ'));
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS contato_financeiro_id UUID REFERENCES public.contatos_financeiros(id);
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES public.empresas(id);

-- ==================== EMPRESAS ====================
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS regime_tributario TEXT;
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS tipo_pessoa TEXT DEFAULT 'PJ';

-- ==================== REGUA_COBRANCA ====================
-- Verificar e adicionar colunas faltantes
ALTER TABLE public.regua_cobranca ADD COLUMN IF NOT EXISTS dias_gatilho INTEGER DEFAULT 0;
ALTER TABLE public.regua_cobranca ADD COLUMN IF NOT EXISTS canais TEXT[];
ALTER TABLE public.regua_cobranca ADD COLUMN IF NOT EXISTS auto_executar BOOLEAN DEFAULT false;
ALTER TABLE public.regua_cobranca ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES public.empresas(id);

-- ==================== PROFILES ====================
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS user_id UUID UNIQUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cargo TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES public.empresas(id);

-- =====================================================
-- MIGRAÇÃO 4: Colunas GENERATED + Triggers Core
-- =====================================================

-- ==================== COLUNAS GENERATED ====================

-- contas_pagar: vencimento (alias de data_vencimento)
ALTER TABLE public.contas_pagar ADD COLUMN IF NOT EXISTS vencimento DATE GENERATED ALWAYS AS (data_vencimento) STORED;

-- contas_pagar: parcela_atual (alias de numero_parcela_atual)
ALTER TABLE public.contas_pagar ADD COLUMN IF NOT EXISTS parcela_atual INTEGER GENERATED ALWAYS AS (numero_parcela_atual) STORED;

-- contas_pagar: valor_final (calculado)
ALTER TABLE public.contas_pagar ADD COLUMN IF NOT EXISTS valor_final NUMERIC GENERATED ALWAYS AS (COALESCE(valor_original, valor) - COALESCE(valor_desconto, 0) + COALESCE(valor_juros, 0) + COALESCE(valor_multa, 0)) STORED;

-- contas_receber: vencimento (alias)
ALTER TABLE public.contas_receber ADD COLUMN IF NOT EXISTS vencimento DATE GENERATED ALWAYS AS (data_vencimento) STORED;

-- contas_receber: parcela_atual (alias)
ALTER TABLE public.contas_receber ADD COLUMN IF NOT EXISTS parcela_atual INTEGER GENERATED ALWAYS AS (numero_parcela_atual) STORED;

-- contas_receber: valor_pago (alias de valor_recebido)
ALTER TABLE public.contas_receber ADD COLUMN IF NOT EXISTS valor_pago NUMERIC GENERATED ALWAYS AS (COALESCE(valor_recebido, 0)) STORED;

-- contas_receber: valor_final (calculado)
ALTER TABLE public.contas_receber ADD COLUMN IF NOT EXISTS valor_final NUMERIC GENERATED ALWAYS AS (COALESCE(valor_original, valor) - COALESCE(valor_desconto, 0) + COALESCE(valor_juros, 0) + COALESCE(valor_multa, 0)) STORED;

-- fornecedores: nome (COALESCE)
ALTER TABLE public.fornecedores ADD COLUMN IF NOT EXISTS nome TEXT GENERATED ALWAYS AS (COALESCE(nome_fantasia, razao_social)) STORED;

-- conciliacoes: diferenca
ALTER TABLE public.conciliacoes ADD COLUMN IF NOT EXISTS diferenca NUMERIC GENERATED ALWAYS AS (saldo_banco - saldo_sistema) STORED;

-- ==================== TRIGGER: Sync Valor CP ====================
CREATE OR REPLACE FUNCTION public.fn_sync_valor_cp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Se valor foi definido mas valor_original não, copiar
  IF NEW.valor IS NOT NULL AND NEW.valor_original IS NULL THEN
    NEW.valor_original := NEW.valor;
  END IF;
  -- Se valor_original foi definido mas valor não, copiar
  IF NEW.valor_original IS NOT NULL AND NEW.valor IS NULL THEN
    NEW.valor := NEW.valor_original;
  END IF;
  -- Em UPDATE, sincronizar bidirecionalmente
  IF TG_OP = 'UPDATE' THEN
    IF NEW.valor IS DISTINCT FROM OLD.valor AND NEW.valor_original IS NOT DISTINCT FROM OLD.valor_original THEN
      NEW.valor_original := NEW.valor;
    ELSIF NEW.valor_original IS DISTINCT FROM OLD.valor_original AND NEW.valor IS NOT DISTINCT FROM OLD.valor THEN
      NEW.valor := NEW.valor_original;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_sync_valor_cp
  BEFORE INSERT OR UPDATE ON public.contas_pagar
  FOR EACH ROW EXECUTE FUNCTION fn_sync_valor_cp();

-- ==================== TRIGGER: Sync Valor CR ====================
CREATE OR REPLACE FUNCTION public.fn_sync_valor_cr()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.valor IS NOT NULL AND NEW.valor_original IS NULL THEN
    NEW.valor_original := NEW.valor;
  END IF;
  IF NEW.valor_original IS NOT NULL AND NEW.valor IS NULL THEN
    NEW.valor := NEW.valor_original;
  END IF;
  IF TG_OP = 'UPDATE' THEN
    IF NEW.valor IS DISTINCT FROM OLD.valor AND NEW.valor_original IS NOT DISTINCT FROM OLD.valor_original THEN
      NEW.valor_original := NEW.valor;
    ELSIF NEW.valor_original IS DISTINCT FROM OLD.valor_original AND NEW.valor IS NOT DISTINCT FROM OLD.valor THEN
      NEW.valor := NEW.valor_original;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_sync_valor_cr
  BEFORE INSERT OR UPDATE ON public.contas_receber
  FOR EACH ROW EXECUTE FUNCTION fn_sync_valor_cr();

-- ==================== TRIGGER: Saldo (movimentacoes) ====================
CREATE OR REPLACE FUNCTION public.fn_atualizar_saldo_movimentacao()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.tipo = 'entrada' THEN
      UPDATE contas_bancarias SET saldo_atual = saldo_atual + NEW.valor WHERE id = NEW.conta_bancaria_id;
    ELSIF NEW.tipo = 'saida' THEN
      UPDATE contas_bancarias SET saldo_atual = saldo_atual - NEW.valor WHERE id = NEW.conta_bancaria_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.tipo = 'entrada' THEN
      UPDATE contas_bancarias SET saldo_atual = saldo_atual - OLD.valor WHERE id = OLD.conta_bancaria_id;
    ELSIF OLD.tipo = 'saida' THEN
      UPDATE contas_bancarias SET saldo_atual = saldo_atual + OLD.valor WHERE id = OLD.conta_bancaria_id;
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_saldo_movimentacao
  AFTER INSERT OR DELETE ON public.movimentacoes
  FOR EACH ROW EXECUTE FUNCTION fn_atualizar_saldo_movimentacao();

-- ==================== TRIGGER: Auto-Sync Valor Pago/Recebido ====================
CREATE OR REPLACE FUNCTION public.fn_sync_valor_pago_movimentacao()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total NUMERIC;
  v_valor_conta NUMERIC;
BEGIN
  -- Atualizar valor_pago em contas_pagar
  IF (TG_OP = 'INSERT' AND NEW.conta_pagar_id IS NOT NULL) OR
     (TG_OP = 'DELETE' AND OLD.conta_pagar_id IS NOT NULL) THEN
    DECLARE
      v_cp_id UUID := COALESCE(NEW.conta_pagar_id, OLD.conta_pagar_id);
    BEGIN
      SELECT COALESCE(SUM(valor), 0) INTO v_total
      FROM movimentacoes WHERE conta_pagar_id = v_cp_id AND deleted_at IS NULL;

      SELECT valor INTO v_valor_conta FROM contas_pagar WHERE id = v_cp_id;

      UPDATE contas_pagar SET
        valor_pago = v_total,
        status = CASE
          WHEN v_total >= v_valor_conta THEN 'pago'::status_pagamento
          WHEN v_total > 0 THEN 'parcial'::status_pagamento
          ELSE 'pendente'::status_pagamento
        END,
        data_pagamento = CASE WHEN v_total >= v_valor_conta THEN CURRENT_DATE ELSE NULL END
      WHERE id = v_cp_id;
    END;
  END IF;

  -- Atualizar valor_recebido em contas_receber
  IF (TG_OP = 'INSERT' AND NEW.conta_receber_id IS NOT NULL) OR
     (TG_OP = 'DELETE' AND OLD.conta_receber_id IS NOT NULL) THEN
    DECLARE
      v_cr_id UUID := COALESCE(NEW.conta_receber_id, OLD.conta_receber_id);
    BEGIN
      SELECT COALESCE(SUM(valor), 0) INTO v_total
      FROM movimentacoes WHERE conta_receber_id = v_cr_id AND deleted_at IS NULL;

      SELECT valor INTO v_valor_conta FROM contas_receber WHERE id = v_cr_id;

      UPDATE contas_receber SET
        valor_recebido = v_total,
        status = CASE
          WHEN v_total >= v_valor_conta THEN 'pago'::status_pagamento
          WHEN v_total > 0 THEN 'parcial'::status_pagamento
          ELSE 'pendente'::status_pagamento
        END,
        data_recebimento = CASE WHEN v_total >= v_valor_conta THEN CURRENT_DATE ELSE NULL END
      WHERE id = v_cr_id;
    END;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_sync_valor_pago
  AFTER INSERT OR DELETE ON public.movimentacoes
  FOR EACH ROW EXECUTE FUNCTION fn_sync_valor_pago_movimentacao();

-- ==================== TRIGGER: Transferências → Movimentação ====================
CREATE OR REPLACE FUNCTION public.fn_transferencia_movimentacao()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_mov_id UUID;
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'realizado' THEN
    INSERT INTO movimentacoes (empresa_id, conta_bancaria_id, tipo, descricao, valor, data_movimentacao, transferencia_id, created_by, origem)
    VALUES (NEW.empresa_id, NEW.conta_bancaria_id, 'saida', NEW.descricao, NEW.valor, NEW.data_transferencia, NEW.id, NEW.created_by, 'transferencia')
    RETURNING id INTO v_mov_id;

    UPDATE transferencias SET movimentacao_id = v_mov_id WHERE id = NEW.id;
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.status = 'cancelado' AND OLD.status = 'realizado' THEN
    DELETE FROM movimentacoes WHERE transferencia_id = NEW.id;
    UPDATE transferencias SET movimentacao_id = NULL WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_transferencia_movimentacao
  AFTER INSERT OR UPDATE ON public.transferencias
  FOR EACH ROW EXECUTE FUNCTION fn_transferencia_movimentacao();

-- ==================== TRIGGER: Auditoria Financeira ====================
CREATE OR REPLACE FUNCTION public.fn_auditoria_financeira()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO auditoria_financeira (tabela, operacao, registro_id, dados_antigos, dados_novos, user_id)
  VALUES (
    TG_TABLE_NAME,
    TG_OP,
    COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END,
    auth.uid()
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Auditoria nas 6 tabelas core
CREATE TRIGGER trg_auditoria_contas_pagar AFTER INSERT OR UPDATE OR DELETE ON public.contas_pagar FOR EACH ROW EXECUTE FUNCTION fn_auditoria_financeira();
CREATE TRIGGER trg_auditoria_contas_receber AFTER INSERT OR UPDATE OR DELETE ON public.contas_receber FOR EACH ROW EXECUTE FUNCTION fn_auditoria_financeira();
CREATE TRIGGER trg_auditoria_contas_bancarias AFTER INSERT OR UPDATE OR DELETE ON public.contas_bancarias FOR EACH ROW EXECUTE FUNCTION fn_auditoria_financeira();
CREATE TRIGGER trg_auditoria_contatos_financeiros AFTER INSERT OR UPDATE OR DELETE ON public.contatos_financeiros FOR EACH ROW EXECUTE FUNCTION fn_auditoria_financeira();
CREATE TRIGGER trg_auditoria_movimentacoes AFTER INSERT OR UPDATE OR DELETE ON public.movimentacoes FOR EACH ROW EXECUTE FUNCTION fn_auditoria_financeira();
CREATE TRIGGER trg_auditoria_transferencias AFTER INSERT OR UPDATE OR DELETE ON public.transferencias FOR EACH ROW EXECUTE FUNCTION fn_auditoria_financeira();

-- Primeiro adicionar 'atrasado' ao enum status_pagamento
ALTER TYPE public.status_pagamento ADD VALUE IF NOT EXISTS 'atrasado';

-- Views corrigidas (clientes usa cnpj_cpf não cpf_cnpj)

CREATE OR REPLACE VIEW public.vw_contas_pagar_painel AS
SELECT cp.*, f.nome AS fornecedor_display, f.cnpj AS fornecedor_cnpj_display, cb.banco AS conta_banco, cc.nome AS centro_custo_nome, pc.descricao AS plano_conta_nome, pc.codigo AS plano_conta_codigo
FROM contas_pagar cp LEFT JOIN fornecedores f ON f.id=cp.fornecedor_id LEFT JOIN contas_bancarias cb ON cb.id=cp.conta_bancaria_id LEFT JOIN centros_custo cc ON cc.id=cp.centro_custo_id LEFT JOIN plano_contas pc ON pc.id=cp.plano_conta_id
WHERE cp.status IN ('pendente','vencido','parcial','atrasado');

CREATE OR REPLACE VIEW public.vw_contas_receber_painel AS
SELECT cr.*, c.razao_social AS cliente_display, c.cnpj_cpf AS cliente_cpf_cnpj_display, c.score AS cliente_score, cb.banco AS conta_banco, cc.nome AS centro_custo_nome, pc.descricao AS plano_conta_nome
FROM contas_receber cr LEFT JOIN clientes c ON c.id=cr.cliente_id LEFT JOIN contas_bancarias cb ON cb.id=cr.conta_bancaria_id LEFT JOIN centros_custo cc ON cc.id=cr.centro_custo_id LEFT JOIN plano_contas pc ON pc.id=cr.plano_conta_id
WHERE cr.status IN ('pendente','vencido','parcial','atrasado');

CREATE OR REPLACE VIEW public.vw_dre_mensal AS
SELECT date_trunc('month',m.data_movimentacao) AS mes, m.empresa_id, SUM(CASE WHEN m.tipo='entrada' THEN m.valor ELSE 0 END) AS receitas, SUM(CASE WHEN m.tipo='saida' THEN m.valor ELSE 0 END) AS despesas, SUM(CASE WHEN m.tipo='entrada' THEN m.valor ELSE -m.valor END) AS resultado
FROM movimentacoes m WHERE m.deleted_at IS NULL GROUP BY 1,2;

CREATE OR REPLACE VIEW public.vw_fluxo_caixa AS
SELECT d.dia, COALESCE(r.valor,0) AS receitas_previstas, COALESCE(p.valor,0) AS despesas_previstas, COALESCE(r.valor,0)-COALESCE(p.valor,0) AS saldo_dia
FROM generate_series(CURRENT_DATE,CURRENT_DATE+INTERVAL '90 days','1 day') AS d(dia)
LEFT JOIN (SELECT data_vencimento AS dia, SUM(valor-COALESCE(valor_recebido,0)) AS valor FROM contas_receber WHERE status IN ('pendente','parcial') GROUP BY 1) r ON r.dia=d.dia
LEFT JOIN (SELECT data_vencimento AS dia, SUM(valor-COALESCE(valor_pago,0)) AS valor FROM contas_pagar WHERE status IN ('pendente','parcial') GROUP BY 1) p ON p.dia=d.dia;

CREATE OR REPLACE VIEW public.vw_fluxo_caixa_diario AS
SELECT m.data_movimentacao AS dia, m.empresa_id, SUM(CASE WHEN m.tipo='entrada' THEN m.valor ELSE 0 END) AS entradas, SUM(CASE WHEN m.tipo='saida' THEN m.valor ELSE 0 END) AS saidas, SUM(CASE WHEN m.tipo='entrada' THEN m.valor ELSE -m.valor END) AS saldo
FROM movimentacoes m WHERE m.deleted_at IS NULL GROUP BY 1,2;

CREATE OR REPLACE VIEW public.vw_gastos_centro_custo AS
SELECT cc.id AS centro_custo_id, cc.nome, cc.codigo, cc.orcamento_previsto, COALESCE(SUM(cp.valor),0) AS total_gasto, CASE WHEN cc.orcamento_previsto>0 THEN ROUND((COALESCE(SUM(cp.valor),0)/cc.orcamento_previsto)*100,2) ELSE 0 END AS percentual_utilizado
FROM centros_custo cc LEFT JOIN contas_pagar cp ON cp.centro_custo_id=cc.id AND cp.status='pago' GROUP BY 1,2,3,4;

CREATE OR REPLACE VIEW public.vw_saldos_contas AS
SELECT cb.id,cb.banco,cb.agencia,cb.conta,cb.tipo_conta,cb.saldo_atual,cb.cor,cb.ativo,cb.empresa_id,e.razao_social AS empresa_nome FROM contas_bancarias cb LEFT JOIN empresas e ON e.id=cb.empresa_id WHERE cb.ativo=true;

CREATE OR REPLACE VIEW public.vw_transferencias_painel AS
SELECT t.*,co.banco AS banco_origem,co.conta AS conta_origem_numero,cd.banco AS banco_destino,cd.conta AS conta_destino_numero FROM transferencias t LEFT JOIN contas_bancarias co ON co.id=t.conta_bancaria_id LEFT JOIN contas_bancarias cd ON cd.id=t.conta_destino_id;

CREATE OR REPLACE VIEW public.vw_webhooks_recentes AS SELECT * FROM webhooks_log ORDER BY created_at DESC LIMIT 100;

CREATE OR REPLACE VIEW public.vw_dso_aging AS
SELECT cr.empresa_id, COUNT(*) AS total_titulos, SUM(cr.valor) AS valor_total, SUM(cr.valor-COALESCE(cr.valor_recebido,0)) AS saldo_aberto,
SUM(CASE WHEN cr.data_vencimento>=CURRENT_DATE THEN cr.valor-COALESCE(cr.valor_recebido,0) ELSE 0 END) AS a_vencer,
SUM(CASE WHEN CURRENT_DATE-cr.data_vencimento BETWEEN 0 AND 7 THEN cr.valor-COALESCE(cr.valor_recebido,0) ELSE 0 END) AS vencido_0_7,
SUM(CASE WHEN CURRENT_DATE-cr.data_vencimento BETWEEN 8 AND 15 THEN cr.valor-COALESCE(cr.valor_recebido,0) ELSE 0 END) AS vencido_8_15,
SUM(CASE WHEN CURRENT_DATE-cr.data_vencimento BETWEEN 16 AND 30 THEN cr.valor-COALESCE(cr.valor_recebido,0) ELSE 0 END) AS vencido_16_30,
SUM(CASE WHEN CURRENT_DATE-cr.data_vencimento BETWEEN 31 AND 60 THEN cr.valor-COALESCE(cr.valor_recebido,0) ELSE 0 END) AS vencido_31_60,
SUM(CASE WHEN CURRENT_DATE-cr.data_vencimento BETWEEN 61 AND 90 THEN cr.valor-COALESCE(cr.valor_recebido,0) ELSE 0 END) AS vencido_61_90,
SUM(CASE WHEN CURRENT_DATE-cr.data_vencimento>90 THEN cr.valor-COALESCE(cr.valor_recebido,0) ELSE 0 END) AS vencido_90_mais
FROM contas_receber cr WHERE cr.status IN ('pendente','vencido','parcial','atrasado') GROUP BY 1;

CREATE OR REPLACE VIEW public.vw_metricas_cobranca AS
SELECT ec.etapa,ec.canal,ec.empresa_id, COUNT(*) AS total_enviados, SUM(CASE WHEN ec.entregue THEN 1 ELSE 0 END) AS total_entregues, SUM(CASE WHEN ec.lido THEN 1 ELSE 0 END) AS total_lidos,
CASE WHEN COUNT(*)>0 THEN ROUND((SUM(CASE WHEN ec.entregue THEN 1 ELSE 0 END)::NUMERIC/COUNT(*))*100,2) ELSE 0 END AS taxa_entrega
FROM execucoes_cobranca ec GROUP BY 1,2,3;

-- RPCs de Cobrança
CREATE OR REPLACE FUNCTION public.processar_regua_cobranca(p_empresa_id UUID DEFAULT NULL)
RETURNS TABLE(total_enfileirados INTEGER, total_ja_cobrados INTEGER, total_sem_contato INTEGER)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_enfileirados INTEGER:=0; v_sem_contato INTEGER:=0; v_regra RECORD; v_cr RECORD; v_mensagem TEXT; v_canal TEXT;
BEGIN
  FOR v_regra IN SELECT * FROM regua_cobranca WHERE ativo=true AND auto_executar=true AND (p_empresa_id IS NULL OR empresa_id=p_empresa_id OR empresa_id IS NULL) ORDER BY dias_gatilho LOOP
    FOR v_cr IN SELECT cr.*, c.email AS cliente_email, c.telefone AS cliente_telefone FROM contas_receber cr LEFT JOIN clientes c ON c.id=cr.cliente_id WHERE cr.status IN ('pendente','vencido','parcial','atrasado') AND (CURRENT_DATE-cr.data_vencimento)>=v_regra.dias_gatilho AND NOT EXISTS (SELECT 1 FROM fila_cobrancas fc WHERE fc.conta_receber_id=cr.id AND fc.etapa=v_regra.etapa AND fc.status NOT IN ('falhou','cancelado')) LOOP
      IF v_regra.canais IS NOT NULL THEN
        FOREACH v_canal IN ARRAY v_regra.canais LOOP
          IF (v_canal='email' AND v_cr.cliente_email IS NULL) OR (v_canal IN ('whatsapp','sms') AND v_cr.cliente_telefone IS NULL) THEN v_sem_contato:=v_sem_contato+1; CONTINUE; END IF;
          SELECT corpo INTO v_mensagem FROM templates_cobranca WHERE etapa=v_regra.etapa AND canal=v_canal AND ativo=true AND padrao=true LIMIT 1;
          v_mensagem:=COALESCE(v_mensagem,'Pendência financeira em aberto.');
          v_mensagem:=REPLACE(REPLACE(REPLACE(v_mensagem,'{{cliente_nome}}',COALESCE(v_cr.cliente_nome,'Cliente')),'{{valor_formatado}}','R$ '||to_char(v_cr.valor,'FM999G999G990D00')),'{{vencimento}}',to_char(v_cr.data_vencimento,'DD/MM/YYYY'));
          INSERT INTO fila_cobrancas (empresa_id,conta_receber_id,cliente_id,cliente_nome,etapa,canal,destinatario,mensagem_renderizada) VALUES (v_cr.empresa_id,v_cr.id,v_cr.cliente_id,v_cr.cliente_nome,v_regra.etapa,v_canal,CASE WHEN v_canal='email' THEN v_cr.cliente_email ELSE v_cr.cliente_telefone END,v_mensagem);
          v_enfileirados:=v_enfileirados+1;
        END LOOP;
      END IF;
      UPDATE contas_receber SET etapa_cobranca=v_regra.etapa::etapa_cobranca WHERE id=v_cr.id;
    END LOOP;
  END LOOP;
  RETURN QUERY SELECT v_enfileirados, 0, v_sem_contato;
END; $$;

CREATE OR REPLACE FUNCTION public.processar_fila_cobrancas(p_limite INTEGER DEFAULT 50)
RETURNS TABLE(fila_id UUID, canal TEXT, destinatario TEXT, mensagem TEXT, cliente_nome TEXT, etapa TEXT, conta_receber_id UUID)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN QUERY UPDATE fila_cobrancas fc SET status='processando',processado_em=now()
  WHERE fc.id IN (SELECT f.id FROM fila_cobrancas f WHERE f.status='pendente' AND (f.agendado_para IS NULL OR f.agendado_para<=now()) ORDER BY f.prioridade,f.created_at LIMIT p_limite FOR UPDATE SKIP LOCKED)
  RETURNING fc.id,fc.canal,fc.destinatario,fc.mensagem_renderizada,fc.cliente_nome,fc.etapa,fc.conta_receber_id;
END; $$;

CREATE OR REPLACE FUNCTION public.confirmar_envio_cobranca(p_fila_id UUID, p_provider TEXT DEFAULT NULL, p_provider_message_id TEXT DEFAULT NULL, p_sucesso BOOLEAN DEFAULT true, p_erro TEXT DEFAULT NULL)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_fila RECORD;
BEGIN
  SELECT * INTO v_fila FROM fila_cobrancas WHERE id=p_fila_id;
  IF p_sucesso THEN
    UPDATE fila_cobrancas SET status='enviado' WHERE id=p_fila_id;
    INSERT INTO execucoes_cobranca (empresa_id,fila_id,conta_receber_id,cliente_id,cliente_nome,etapa,canal,destinatario,mensagem,status,provider,provider_message_id) VALUES (v_fila.empresa_id,p_fila_id,v_fila.conta_receber_id,v_fila.cliente_id,v_fila.cliente_nome,v_fila.etapa,v_fila.canal,v_fila.destinatario,v_fila.mensagem_renderizada,'enviado',p_provider,p_provider_message_id);
  ELSE
    UPDATE fila_cobrancas SET status=CASE WHEN tentativas+1>=max_tentativas THEN 'falhou' ELSE 'pendente' END, tentativas=tentativas+1, erro_mensagem=p_erro, proxima_tentativa=CASE WHEN tentativas+1<max_tentativas THEN now()+INTERVAL '30 minutes' ELSE NULL END WHERE id=p_fila_id;
  END IF;
END; $$;

-- Harden RLS: Replace USING(true) with proper role-based policies

-- MOVIMENTACOES
DROP POLICY IF EXISTS "Auth users can manage movimentacoes" ON movimentacoes;
CREATE POLICY "Fin users can read movimentacoes" ON movimentacoes FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','financeiro','operacional']::app_role[]));
CREATE POLICY "Fin users can insert movimentacoes" ON movimentacoes FOR INSERT TO authenticated
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[]));
CREATE POLICY "Fin users can update movimentacoes" ON movimentacoes FOR UPDATE TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[]));
CREATE POLICY "Admin can delete movimentacoes" ON movimentacoes FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- TRANSFERENCIAS
DROP POLICY IF EXISTS "Auth users can manage transferencias" ON transferencias;
CREATE POLICY "Fin users can read transferencias" ON transferencias FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','financeiro','operacional']::app_role[]));
CREATE POLICY "Fin users can insert transferencias" ON transferencias FOR INSERT TO authenticated
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[]));
CREATE POLICY "Fin users can update transferencias" ON transferencias FOR UPDATE TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[]));
CREATE POLICY "Admin can delete transferencias" ON transferencias FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- CONTATOS_FINANCEIROS
DROP POLICY IF EXISTS "Auth users can manage contatos_financeiros" ON contatos_financeiros;
CREATE POLICY "Auth users can read contatos_financeiros" ON contatos_financeiros FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);
CREATE POLICY "Fin users can manage contatos_financeiros" ON contatos_financeiros FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[]));

-- CATEGORIAS
DROP POLICY IF EXISTS "Auth users can manage categorias" ON categorias;
CREATE POLICY "Auth users can read categorias" ON categorias FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admin/fin can manage categorias" ON categorias FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[]));

-- EXTRATO_BANCARIO
DROP POLICY IF EXISTS "Auth users can manage extrato_bancario" ON extrato_bancario;
CREATE POLICY "Fin users can read extrato_bancario" ON extrato_bancario FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','financeiro','operacional']::app_role[]));
CREATE POLICY "Fin users can manage extrato_bancario" ON extrato_bancario FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[]));

-- CONCILIACOES
DROP POLICY IF EXISTS "Auth users can manage conciliacoes" ON conciliacoes;
CREATE POLICY "Fin users can read conciliacoes" ON conciliacoes FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','financeiro','operacional']::app_role[]));
CREATE POLICY "Fin users can manage conciliacoes" ON conciliacoes FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[]));

-- TEMPLATES_COBRANCA
DROP POLICY IF EXISTS "Auth users can manage templates_cobranca" ON templates_cobranca;
CREATE POLICY "Auth users can read templates_cobranca" ON templates_cobranca FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admin can manage templates_cobranca" ON templates_cobranca FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- FILA_COBRANCAS
DROP POLICY IF EXISTS "Auth users can manage fila_cobrancas" ON fila_cobrancas;
CREATE POLICY "Fin users can read fila_cobrancas" ON fila_cobrancas FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[]));
CREATE POLICY "Fin users can manage fila_cobrancas" ON fila_cobrancas FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[]));

-- EXECUCOES_COBRANCA
DROP POLICY IF EXISTS "Auth users can manage execucoes_cobranca" ON execucoes_cobranca;
CREATE POLICY "Fin users can read execucoes_cobranca" ON execucoes_cobranca FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[]));
CREATE POLICY "System can insert execucoes_cobranca" ON execucoes_cobranca FOR INSERT TO authenticated
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[]));

-- NEGATIVACOES
DROP POLICY IF EXISTS "Auth users can manage negativacoes" ON negativacoes;
CREATE POLICY "Fin users can read negativacoes" ON negativacoes FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[]));
CREATE POLICY "Fin users can manage negativacoes" ON negativacoes FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[]));

-- PROTESTOS
DROP POLICY IF EXISTS "Auth users can manage protestos" ON protestos;
CREATE POLICY "Fin users can read protestos" ON protestos FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[]));
CREATE POLICY "Fin users can manage protestos" ON protestos FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[]));

-- Fix security definer views by recreating with security_invoker=true

-- Get view definitions first, then recreate
DO $$
DECLARE
  v_views TEXT[] := ARRAY[
    'vw_contas_pagar_painel', 'vw_contas_receber_painel', 'vw_dre_mensal',
    'vw_dso_aging', 'vw_fluxo_caixa', 'vw_fluxo_caixa_diario',
    'vw_gastos_centro_custo', 'vw_metricas_cobranca', 'vw_saldos_contas',
    'vw_transferencias_painel', 'vw_webhooks_recentes'
  ];
  v_view TEXT;
BEGIN
  FOREACH v_view IN ARRAY v_views LOOP
    EXECUTE format('ALTER VIEW public.%I SET (security_invoker = true)', v_view);
