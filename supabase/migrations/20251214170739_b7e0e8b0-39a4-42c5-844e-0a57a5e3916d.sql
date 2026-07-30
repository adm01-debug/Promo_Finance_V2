-- ============================================
-- SISTEMA FINANCEIRO PROMO BRINDES
-- Schema Completo com RBAC e Auditoria
-- ============================================

-- 1. ENUM TYPES
-- ============================================

CREATE TYPE public.app_role AS ENUM ('admin', 'financeiro', 'operacional', 'visualizador');
CREATE TYPE public.status_pagamento AS ENUM ('pago', 'pendente', 'vencido', 'parcial', 'cancelado');
CREATE TYPE public.tipo_transacao AS ENUM ('receita', 'despesa');
CREATE TYPE public.tipo_cobranca AS ENUM ('boleto', 'pix', 'cartao', 'transferencia', 'dinheiro');
CREATE TYPE public.prioridade_alerta AS ENUM ('baixa', 'media', 'alta', 'critica');
CREATE TYPE public.etapa_cobranca AS ENUM ('preventiva', 'lembrete', 'cobranca', 'negociacao', 'juridico');
CREATE TYPE public.status_nfe AS ENUM ('autorizada', 'pendente', 'cancelada', 'denegada', 'inutilizada');
CREATE TYPE public.audit_action AS ENUM ('INSERT', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'EXPORT', 'APPROVE', 'REJECT');

-- 2. PROFILES TABLE (user data)
-- ============================================

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- 3. USER ROLES TABLE (RBAC)
-- ============================================

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'visualizador',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (prevents infinite recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Check if user has any of the allowed roles
CREATE OR REPLACE FUNCTION public.has_any_role(_user_id UUID, _roles app_role[])
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = ANY(_roles)
  )
$$;

-- Get user's highest role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles
  WHERE user_id = _user_id
  ORDER BY 
    CASE role 
      WHEN 'admin' THEN 1 
      WHEN 'financeiro' THEN 2 
      WHEN 'operacional' THEN 3 
      WHEN 'visualizador' THEN 4 
    END
  LIMIT 1
$$;

CREATE POLICY "Admins can manage all roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

-- 4. AUDIT LOG TABLE
-- ============================================

CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  user_email TEXT,
  action audit_action NOT NULL,
  table_name TEXT,
  record_id TEXT,
  old_data JSONB,
  new_data JSONB,
  ip_address TEXT,
  user_agent TEXT,
  details TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs" ON public.audit_logs
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Function to log audit events
CREATE OR REPLACE FUNCTION public.log_audit(
  _action audit_action,
  _table_name TEXT DEFAULT NULL,
  _record_id TEXT DEFAULT NULL,
  _old_data JSONB DEFAULT NULL,
  _new_data JSONB DEFAULT NULL,
  _details TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _audit_id UUID;
  _user_email TEXT;
BEGIN
  SELECT email INTO _user_email FROM public.profiles WHERE id = auth.uid();
  
  INSERT INTO public.audit_logs (user_id, user_email, action, table_name, record_id, old_data, new_data, details)
  VALUES (auth.uid(), _user_email, _action, _table_name, _record_id, _old_data, _new_data, _details)
  RETURNING id INTO _audit_id;
  
  RETURN _audit_id;
END;
$$;

-- 5. EMPRESAS (CNPJs)
-- ============================================

CREATE TABLE public.empresas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cnpj TEXT NOT NULL UNIQUE,
  razao_social TEXT NOT NULL,
  nome_fantasia TEXT,
  inscricao_estadual TEXT,
  endereco TEXT,
  cidade TEXT,
  estado TEXT,
  cep TEXT,
  telefone TEXT,
  email TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view empresas" ON public.empresas
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Financeiro+ can manage empresas" ON public.empresas
  FOR ALL USING (public.has_any_role(auth.uid(), ARRAY['admin', 'financeiro']::app_role[]));

-- 6. CONTAS BANCÁRIAS
-- ============================================

CREATE TABLE public.contas_bancarias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE NOT NULL,
  banco TEXT NOT NULL,
  codigo_banco TEXT NOT NULL,
  agencia TEXT NOT NULL,
  conta TEXT NOT NULL,
  tipo_conta TEXT NOT NULL DEFAULT 'corrente',
  saldo_atual DECIMAL(15,2) NOT NULL DEFAULT 0,
  saldo_disponivel DECIMAL(15,2) NOT NULL DEFAULT 0,
  cor TEXT DEFAULT '#3B82F6',
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.contas_bancarias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view contas" ON public.contas_bancarias
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Financeiro+ can manage contas" ON public.contas_bancarias
  FOR ALL USING (public.has_any_role(auth.uid(), ARRAY['admin', 'financeiro']::app_role[]));

-- 7. CENTROS DE CUSTO
-- ============================================

CREATE TABLE public.centros_custo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT NOT NULL UNIQUE,
  nome TEXT NOT NULL,
  descricao TEXT,
  orcamento_previsto DECIMAL(15,2) NOT NULL DEFAULT 0,
  orcamento_realizado DECIMAL(15,2) NOT NULL DEFAULT 0,
  parent_id UUID REFERENCES public.centros_custo(id),
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.centros_custo ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view centros_custo" ON public.centros_custo
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Financeiro+ can manage centros_custo" ON public.centros_custo
  FOR ALL USING (public.has_any_role(auth.uid(), ARRAY['admin', 'financeiro']::app_role[]));

-- 8. FORNECEDORES
-- ============================================

CREATE TABLE public.fornecedores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cnpj_cpf TEXT,
  razao_social TEXT NOT NULL,
  nome_fantasia TEXT,
  endereco TEXT,
  cidade TEXT,
  estado TEXT,
  telefone TEXT,
  email TEXT,
  contato TEXT,
  observacoes TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.fornecedores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view fornecedores" ON public.fornecedores
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Operacional+ can manage fornecedores" ON public.fornecedores
  FOR ALL USING (public.has_any_role(auth.uid(), ARRAY['admin', 'financeiro', 'operacional']::app_role[]));

-- 9. CLIENTES
-- ============================================

CREATE TABLE public.clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cnpj_cpf TEXT,
  razao_social TEXT NOT NULL,
  nome_fantasia TEXT,
  endereco TEXT,
  cidade TEXT,
  estado TEXT,
  telefone TEXT,
  email TEXT,
  contato TEXT,
  limite_credito DECIMAL(15,2) DEFAULT 0,
  score INTEGER DEFAULT 100,
  bitrix_id TEXT,
  observacoes TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view clientes" ON public.clientes
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Operacional+ can manage clientes" ON public.clientes
  FOR ALL USING (public.has_any_role(auth.uid(), ARRAY['admin', 'financeiro', 'operacional']::app_role[]));

-- 10. CONTAS A PAGAR
-- ============================================

CREATE TABLE public.contas_pagar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES public.empresas(id) NOT NULL,
  conta_bancaria_id UUID REFERENCES public.contas_bancarias(id),
  centro_custo_id UUID REFERENCES public.centros_custo(id),
  fornecedor_id UUID REFERENCES public.fornecedores(id),
  fornecedor_nome TEXT NOT NULL,
  descricao TEXT NOT NULL,
  valor DECIMAL(15,2) NOT NULL,
  valor_pago DECIMAL(15,2) DEFAULT 0,
  data_emissao DATE NOT NULL DEFAULT CURRENT_DATE,
  data_vencimento DATE NOT NULL,
  data_pagamento DATE,
  status status_pagamento NOT NULL DEFAULT 'pendente',
  tipo_cobranca tipo_cobranca NOT NULL DEFAULT 'boleto',
  numero_documento TEXT,
  codigo_barras TEXT,
  observacoes TEXT,
  recorrente BOOLEAN NOT NULL DEFAULT false,
  bitrix_deal_id TEXT,
  aprovado_por UUID REFERENCES auth.users(id),
  aprovado_em TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.contas_pagar ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view contas_pagar" ON public.contas_pagar
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Operacional+ can insert contas_pagar" ON public.contas_pagar
  FOR INSERT WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin', 'financeiro', 'operacional']::app_role[]));

CREATE POLICY "Financeiro+ can update contas_pagar" ON public.contas_pagar
  FOR UPDATE USING (public.has_any_role(auth.uid(), ARRAY['admin', 'financeiro']::app_role[]));

CREATE POLICY "Admin can delete contas_pagar" ON public.contas_pagar
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- 11. CONTAS A RECEBER
-- ============================================

CREATE TABLE public.contas_receber (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES public.empresas(id) NOT NULL,
  conta_bancaria_id UUID REFERENCES public.contas_bancarias(id),
  centro_custo_id UUID REFERENCES public.centros_custo(id),
  cliente_id UUID REFERENCES public.clientes(id),
  cliente_nome TEXT NOT NULL,
  descricao TEXT NOT NULL,
  valor DECIMAL(15,2) NOT NULL,
  valor_recebido DECIMAL(15,2) DEFAULT 0,
  data_emissao DATE NOT NULL DEFAULT CURRENT_DATE,
  data_vencimento DATE NOT NULL,
  data_recebimento DATE,
  status status_pagamento NOT NULL DEFAULT 'pendente',
  tipo_cobranca tipo_cobranca NOT NULL DEFAULT 'boleto',
  numero_documento TEXT,
  codigo_barras TEXT,
  chave_pix TEXT,
  link_boleto TEXT,
  observacoes TEXT,
  etapa_cobranca etapa_cobranca DEFAULT 'preventiva',
  bitrix_deal_id TEXT,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.contas_receber ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view contas_receber" ON public.contas_receber
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Operacional+ can insert contas_receber" ON public.contas_receber
  FOR INSERT WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin', 'financeiro', 'operacional']::app_role[]));

CREATE POLICY "Financeiro+ can update contas_receber" ON public.contas_receber
  FOR UPDATE USING (public.has_any_role(auth.uid(), ARRAY['admin', 'financeiro']::app_role[]));

CREATE POLICY "Admin can delete contas_receber" ON public.contas_receber
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- 12. TRANSAÇÕES BANCÁRIAS (Conciliação)
-- ============================================

CREATE TABLE public.transacoes_bancarias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conta_bancaria_id UUID REFERENCES public.contas_bancarias(id) ON DELETE CASCADE NOT NULL,
  data DATE NOT NULL,
  descricao TEXT NOT NULL,
  valor DECIMAL(15,2) NOT NULL,
  tipo tipo_transacao NOT NULL,
  saldo DECIMAL(15,2) NOT NULL,
  conciliada BOOLEAN NOT NULL DEFAULT false,
  conta_pagar_id UUID REFERENCES public.contas_pagar(id),
  conta_receber_id UUID REFERENCES public.contas_receber(id),
  conciliada_por UUID REFERENCES auth.users(id),
  conciliada_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.transacoes_bancarias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view transacoes" ON public.transacoes_bancarias
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Financeiro+ can manage transacoes" ON public.transacoes_bancarias
  FOR ALL USING (public.has_any_role(auth.uid(), ARRAY['admin', 'financeiro']::app_role[]));

-- 13. NOTAS FISCAIS
-- ============================================

CREATE TABLE public.notas_fiscais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES public.empresas(id) NOT NULL,
  numero TEXT NOT NULL,
  serie TEXT NOT NULL DEFAULT '1',
  chave_acesso TEXT UNIQUE,
  natureza_operacao TEXT NOT NULL,
  data_emissao TIMESTAMPTZ NOT NULL DEFAULT now(),
  data_saida TIMESTAMPTZ,
  cliente_id UUID REFERENCES public.clientes(id),
  cliente_nome TEXT NOT NULL,
  cliente_cnpj TEXT,
  valor_produtos DECIMAL(15,2) NOT NULL,
  valor_frete DECIMAL(15,2) DEFAULT 0,
  valor_seguro DECIMAL(15,2) DEFAULT 0,
  valor_desconto DECIMAL(15,2) DEFAULT 0,
  valor_icms DECIMAL(15,2) DEFAULT 0,
  valor_ipi DECIMAL(15,2) DEFAULT 0,
  valor_total DECIMAL(15,2) NOT NULL,
  status status_nfe NOT NULL DEFAULT 'pendente',
  protocolo TEXT,
  motivo_cancelamento TEXT,
  xml_nfe TEXT,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.notas_fiscais ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view notas_fiscais" ON public.notas_fiscais
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Operacional+ can manage notas_fiscais" ON public.notas_fiscais
  FOR ALL USING (public.has_any_role(auth.uid(), ARRAY['admin', 'financeiro', 'operacional']::app_role[]));

-- 14. ALERTAS
-- ============================================

CREATE TABLE public.alertas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  titulo TEXT NOT NULL,
  mensagem TEXT NOT NULL,
  prioridade prioridade_alerta NOT NULL DEFAULT 'media',
  lido BOOLEAN NOT NULL DEFAULT false,
  acao_url TEXT,
  entidade_id TEXT,
  entidade_tipo TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.alertas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own alertas" ON public.alertas
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update own alertas" ON public.alertas
  FOR UPDATE USING (auth.uid() = user_id);

-- 15. TRIGGERS FOR UPDATED_AT
-- ============================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_empresas_updated_at BEFORE UPDATE ON public.empresas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_contas_bancarias_updated_at BEFORE UPDATE ON public.contas_bancarias
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_centros_custo_updated_at BEFORE UPDATE ON public.centros_custo
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_fornecedores_updated_at BEFORE UPDATE ON public.fornecedores
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_clientes_updated_at BEFORE UPDATE ON public.clientes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_contas_pagar_updated_at BEFORE UPDATE ON public.contas_pagar
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_contas_receber_updated_at BEFORE UPDATE ON public.contas_receber
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_notas_fiscais_updated_at BEFORE UPDATE ON public.notas_fiscais
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 16. TRIGGER TO CREATE PROFILE ON SIGNUP
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id, 
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  
  -- First user gets admin role, others get visualizador
  IF (SELECT COUNT(*) FROM public.user_roles) = 0 THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'visualizador');
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 17. INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX idx_contas_pagar_vencimento ON public.contas_pagar(data_vencimento);
CREATE INDEX idx_contas_pagar_status ON public.contas_pagar(status);
CREATE INDEX idx_contas_pagar_empresa ON public.contas_pagar(empresa_id);

CREATE INDEX idx_contas_receber_vencimento ON public.contas_receber(data_vencimento);
CREATE INDEX idx_contas_receber_status ON public.contas_receber(status);
CREATE INDEX idx_contas_receber_empresa ON public.contas_receber(empresa_id);

CREATE INDEX idx_transacoes_data ON public.transacoes_bancarias(data);
CREATE INDEX idx_transacoes_conta ON public.transacoes_bancarias(conta_bancaria_id);

CREATE INDEX idx_notas_fiscais_data ON public.notas_fiscais(data_emissao);
CREATE INDEX idx_notas_fiscais_status ON public.notas_fiscais(status);

CREATE INDEX idx_audit_logs_user ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX idx_audit_logs_created ON public.audit_logs(created_at);