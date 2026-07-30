-- Tabela para IPs permitidos por usuário
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
WITH CHECK (true);