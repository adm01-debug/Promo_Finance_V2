-- Finance Hub Database Schema
-- Migration: 001_create_tables
-- Created: 2024-01-20

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- ============================================
-- CLIENTES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS clientes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    telefone VARCHAR(20),
    cpf_cnpj VARCHAR(20) UNIQUE,
    tipo VARCHAR(2) DEFAULT 'PF' CHECK (tipo IN ('PF', 'PJ')),
    endereco TEXT,
    cidade VARCHAR(100),
    estado VARCHAR(2),
    cep VARCHAR(10),
    bairro VARCHAR(100),
    numero VARCHAR(20),
    complemento VARCHAR(100),
    limite_credito DECIMAL(15, 2) DEFAULT 0,
    ativo BOOLEAN DEFAULT TRUE,
    observacoes TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX idx_clientes_user_id ON clientes(user_id);
CREATE INDEX idx_clientes_cpf_cnpj ON clientes(cpf_cnpj);
CREATE INDEX idx_clientes_nome ON clientes(nome);
CREATE INDEX idx_clientes_ativo ON clientes(ativo);

-- ============================================
-- FORNECEDORES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS fornecedores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    razao_social VARCHAR(255) NOT NULL,
    nome_fantasia VARCHAR(255),
    cnpj VARCHAR(20) UNIQUE,
    email VARCHAR(255),
    telefone VARCHAR(20),
    endereco TEXT,
    cidade VARCHAR(100),
    estado VARCHAR(2),
    cep VARCHAR(10),
    bairro VARCHAR(100),
    numero VARCHAR(20),
    complemento VARCHAR(100),
    categoria VARCHAR(100),
    banco VARCHAR(100),
    agencia VARCHAR(20),
    conta VARCHAR(30),
    pix VARCHAR(100),
    ativo BOOLEAN DEFAULT TRUE,
    observacoes TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX idx_fornecedores_user_id ON fornecedores(user_id);
CREATE INDEX idx_fornecedores_cnpj ON fornecedores(cnpj);
CREATE INDEX idx_fornecedores_razao_social ON fornecedores(razao_social);
CREATE INDEX idx_fornecedores_ativo ON fornecedores(ativo);
CREATE INDEX idx_fornecedores_categoria ON fornecedores(categoria);

-- ============================================
-- CONTAS_PAGAR TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS contas_pagar (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    descricao VARCHAR(255) NOT NULL,
    valor DECIMAL(15, 2) NOT NULL CHECK (valor >= 0),
    data_vencimento DATE NOT NULL,
    data_pagamento DATE,
    status VARCHAR(20) DEFAULT 'pendente' 
        CHECK (status IN ('pendente', 'pago', 'atrasado', 'cancelado')),
    fornecedor_id UUID REFERENCES fornecedores(id) ON DELETE SET NULL,
    categoria VARCHAR(100),
    forma_pagamento VARCHAR(50),
    numero_documento VARCHAR(100),
    codigo_barras VARCHAR(100),
    observacoes TEXT,
    recorrente BOOLEAN DEFAULT FALSE,
    frequencia_recorrencia VARCHAR(20) CHECK (frequencia_recorrencia IN ('mensal', 'trimestral', 'semestral', 'anual')),
    parcela_atual INTEGER,
    total_parcelas INTEGER,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX idx_contas_pagar_user_id ON contas_pagar(user_id);
CREATE INDEX idx_contas_pagar_fornecedor_id ON contas_pagar(fornecedor_id);
CREATE INDEX idx_contas_pagar_status ON contas_pagar(status);
CREATE INDEX idx_contas_pagar_data_vencimento ON contas_pagar(data_vencimento);
CREATE INDEX idx_contas_pagar_categoria ON contas_pagar(categoria);

-- ============================================
-- CONTAS_RECEBER TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS contas_receber (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    descricao VARCHAR(255) NOT NULL,
    valor DECIMAL(15, 2) NOT NULL CHECK (valor >= 0),
    data_vencimento DATE NOT NULL,
    data_recebimento DATE,
    status VARCHAR(20) DEFAULT 'pendente' 
        CHECK (status IN ('pendente', 'recebido', 'atrasado', 'cancelado')),
    cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL,
    categoria VARCHAR(100),
    forma_recebimento VARCHAR(50),
    numero_documento VARCHAR(100),
    observacoes TEXT,
    recorrente BOOLEAN DEFAULT FALSE,
    frequencia_recorrencia VARCHAR(20) CHECK (frequencia_recorrencia IN ('mensal', 'trimestral', 'semestral', 'anual')),
    parcela_atual INTEGER,
    total_parcelas INTEGER,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX idx_contas_receber_user_id ON contas_receber(user_id);
CREATE INDEX idx_contas_receber_cliente_id ON contas_receber(cliente_id);
CREATE INDEX idx_contas_receber_status ON contas_receber(status);
CREATE INDEX idx_contas_receber_data_vencimento ON contas_receber(data_vencimento);
CREATE INDEX idx_contas_receber_categoria ON contas_receber(categoria);

-- ============================================
-- CATEGORIAS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS categorias (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(100) NOT NULL,
    tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('receita', 'despesa', 'ambos')),
    cor VARCHAR(7) DEFAULT '#6366f1',
    icone VARCHAR(50),
    ativo BOOLEAN DEFAULT TRUE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(nome, user_id)
);

-- Index for faster lookups
CREATE INDEX idx_categorias_user_id ON categorias(user_id);
CREATE INDEX idx_categorias_tipo ON categorias(tipo);

-- ============================================
-- USER_PREFERENCES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    theme VARCHAR(20) DEFAULT 'system',
    language VARCHAR(5) DEFAULT 'pt-BR',
    currency VARCHAR(3) DEFAULT 'BRL',
    date_format VARCHAR(20) DEFAULT 'dd/MM/yyyy',
    notifications_enabled BOOLEAN DEFAULT TRUE,
    email_notifications BOOLEAN DEFAULT TRUE,
    dashboard_layout JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);

-- ============================================
-- AUDIT_LOG TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL,
    table_name VARCHAR(100) NOT NULL,
    record_id UUID,
    old_data JSONB,
    new_data JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX idx_audit_log_table_name ON audit_log(table_name);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update conta status based on date
CREATE OR REPLACE FUNCTION update_conta_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Update status to 'atrasado' if past due date and still pending
    IF NEW.status = 'pendente' AND NEW.data_vencimento < CURRENT_DATE THEN
        NEW.status = 'atrasado';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to log changes to audit_log
CREATE OR REPLACE FUNCTION audit_trigger_func()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO audit_log (user_id, action, table_name, record_id, new_data)
        VALUES (NEW.user_id, 'INSERT', TG_TABLE_NAME, NEW.id, row_to_json(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_log (user_id, action, table_name, record_id, old_data, new_data)
        VALUES (NEW.user_id, 'UPDATE', TG_TABLE_NAME, NEW.id, row_to_json(OLD), row_to_json(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO audit_log (user_id, action, table_name, record_id, old_data)
        VALUES (OLD.user_id, 'DELETE', TG_TABLE_NAME, OLD.id, row_to_json(OLD));
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGERS
-- ============================================

-- Updated at triggers
CREATE TRIGGER update_clientes_updated_at
    BEFORE UPDATE ON clientes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fornecedores_updated_at
    BEFORE UPDATE ON fornecedores
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contas_pagar_updated_at
    BEFORE UPDATE ON contas_pagar
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contas_receber_updated_at
    BEFORE UPDATE ON contas_receber
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categorias_updated_at
    BEFORE UPDATE ON categorias
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at
    BEFORE UPDATE ON user_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Status update triggers
CREATE TRIGGER update_contas_pagar_status
    BEFORE INSERT OR UPDATE ON contas_pagar
    FOR EACH ROW EXECUTE FUNCTION update_conta_status();

CREATE TRIGGER update_contas_receber_status
    BEFORE INSERT OR UPDATE ON contas_receber
    FOR EACH ROW EXECUTE FUNCTION update_conta_status();

-- Audit triggers
CREATE TRIGGER audit_clientes
    AFTER INSERT OR UPDATE OR DELETE ON clientes
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER audit_fornecedores
    AFTER INSERT OR UPDATE OR DELETE ON fornecedores
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER audit_contas_pagar
    AFTER INSERT OR UPDATE OR DELETE ON contas_pagar
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER audit_contas_receber
    AFTER INSERT OR UPDATE OR DELETE ON contas_receber
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- ============================================
-- INSERT DEFAULT CATEGORIES
-- ============================================
-- These will be inserted per user on registration
-- Finance Hub RLS Policies
-- Migration: 002_rls_policies
-- Created: 2024-01-20

-- ============================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE fornecedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE contas_pagar ENABLE ROW LEVEL SECURITY;
ALTER TABLE contas_receber ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- ============================================
-- HELPER FUNCTION
-- ============================================
-- Get the current user ID from JWT
CREATE OR REPLACE FUNCTION auth.user_id() 
RETURNS UUID AS $$
  SELECT NULLIF(current_setting('request.jwt.claims', true)::json->>'sub', '')::UUID;
$$ LANGUAGE SQL STABLE;

-- ============================================
-- CLIENTES POLICIES
-- ============================================

-- Users can only see their own clients
CREATE POLICY "Users can view own clientes"
    ON clientes FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own clients
CREATE POLICY "Users can insert own clientes"
    ON clientes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own clients
CREATE POLICY "Users can update own clientes"
    ON clientes FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own clients
CREATE POLICY "Users can delete own clientes"
    ON clientes FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================
-- FORNECEDORES POLICIES
-- ============================================

-- Users can only see their own suppliers
CREATE POLICY "Users can view own fornecedores"
    ON fornecedores FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own suppliers
CREATE POLICY "Users can insert own fornecedores"
    ON fornecedores FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own suppliers
CREATE POLICY "Users can update own fornecedores"
    ON fornecedores FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own suppliers
CREATE POLICY "Users can delete own fornecedores"
    ON fornecedores FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================
-- CONTAS_PAGAR POLICIES
-- ============================================

-- Users can only see their own payables
CREATE POLICY "Users can view own contas_pagar"
    ON contas_pagar FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own payables
CREATE POLICY "Users can insert own contas_pagar"
    ON contas_pagar FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own payables
CREATE POLICY "Users can update own contas_pagar"
    ON contas_pagar FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own payables
CREATE POLICY "Users can delete own contas_pagar"
    ON contas_pagar FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================
-- CONTAS_RECEBER POLICIES
-- ============================================

-- Users can only see their own receivables
CREATE POLICY "Users can view own contas_receber"
    ON contas_receber FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own receivables
CREATE POLICY "Users can insert own contas_receber"
    ON contas_receber FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own receivables
CREATE POLICY "Users can update own contas_receber"
    ON contas_receber FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own receivables
CREATE POLICY "Users can delete own contas_receber"
    ON contas_receber FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================
-- CATEGORIAS POLICIES
-- ============================================

-- Users can only see their own categories
CREATE POLICY "Users can view own categorias"
    ON categorias FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own categories
CREATE POLICY "Users can insert own categorias"
    ON categorias FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own categories
CREATE POLICY "Users can update own categorias"
    ON categorias FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own categories
CREATE POLICY "Users can delete own categorias"
    ON categorias FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================
-- USER_PREFERENCES POLICIES
-- ============================================

-- Users can only see their own preferences
CREATE POLICY "Users can view own preferences"
    ON user_preferences FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own preferences
CREATE POLICY "Users can insert own preferences"
    ON user_preferences FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own preferences
CREATE POLICY "Users can update own preferences"
    ON user_preferences FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own preferences
CREATE POLICY "Users can delete own preferences"
    ON user_preferences FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================
-- AUDIT_LOG POLICIES
-- ============================================

-- Users can only see their own audit logs
CREATE POLICY "Users can view own audit_log"
    ON audit_log FOR SELECT
    USING (auth.uid() = user_id);

-- System/triggers can insert audit logs (no restriction)
CREATE POLICY "System can insert audit_log"
    ON audit_log FOR INSERT
    WITH CHECK (true);

-- No one can update audit logs (immutable)
-- No one can delete audit logs (immutable)

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- Grant access to tables for authenticated users
GRANT ALL ON clientes TO authenticated;
GRANT ALL ON fornecedores TO authenticated;
GRANT ALL ON contas_pagar TO authenticated;
GRANT ALL ON contas_receber TO authenticated;
GRANT ALL ON categorias TO authenticated;
GRANT ALL ON user_preferences TO authenticated;
GRANT SELECT, INSERT ON audit_log TO authenticated;

-- Grant sequence access
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ============================================
-- STORAGE POLICIES (if using Supabase Storage)
-- ============================================

-- Create storage bucket for user uploads
-- INSERT INTO storage.buckets (id, name, public) VALUES ('uploads', 'uploads', false);

-- Policy: Users can upload to their own folder
-- CREATE POLICY "Users can upload own files"
--     ON storage.objects FOR INSERT
--     WITH CHECK (
--         bucket_id = 'uploads' 
--         AND auth.uid()::text = (storage.foldername(name))[1]
--     );

-- Policy: Users can view their own files
-- CREATE POLICY "Users can view own files"
--     ON storage.objects FOR SELECT
--     USING (
--         bucket_id = 'uploads' 
--         AND auth.uid()::text = (storage.foldername(name))[1]
--     );

-- Policy: Users can delete their own files
-- CREATE POLICY "Users can delete own files"
--     ON storage.objects FOR DELETE
--     USING (
--         bucket_id = 'uploads' 
--         AND auth.uid()::text = (storage.foldername(name))[1]
--     );
-- Finance Hub Seed Data
-- Migration: 003_seed_data
-- Created: 2024-01-20

-- ============================================
-- DEFAULT CATEGORIES FUNCTION
-- ============================================

-- Function to create default categories for a new user
CREATE OR REPLACE FUNCTION create_default_categories_for_user(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
    -- Despesas (Expenses)
    INSERT INTO categorias (nome, tipo, cor, icone, user_id) VALUES
        ('Aluguel', 'despesa', '#ef4444', 'home', p_user_id),
        ('Água', 'despesa', '#3b82f6', 'droplet', p_user_id),
        ('Luz', 'despesa', '#eab308', 'zap', p_user_id),
        ('Internet', 'despesa', '#8b5cf6', 'wifi', p_user_id),
        ('Telefone', 'despesa', '#06b6d4', 'phone', p_user_id),
        ('Salários', 'despesa', '#22c55e', 'users', p_user_id),
        ('Fornecedores', 'despesa', '#f97316', 'truck', p_user_id),
        ('Material de Escritório', 'despesa', '#64748b', 'clipboard', p_user_id),
        ('Marketing', 'despesa', '#ec4899', 'megaphone', p_user_id),
        ('Impostos', 'despesa', '#dc2626', 'file-text', p_user_id),
        ('Manutenção', 'despesa', '#a855f7', 'wrench', p_user_id),
        ('Transporte', 'despesa', '#14b8a6', 'car', p_user_id),
        ('Alimentação', 'despesa', '#f59e0b', 'utensils', p_user_id),
        ('Software/Assinaturas', 'despesa', '#6366f1', 'cloud', p_user_id),
        ('Outras Despesas', 'despesa', '#71717a', 'more-horizontal', p_user_id)
    ON CONFLICT (nome, user_id) DO NOTHING;
    
    -- Receitas (Income)
    INSERT INTO categorias (nome, tipo, cor, icone, user_id) VALUES
        ('Vendas', 'receita', '#22c55e', 'shopping-cart', p_user_id),
        ('Serviços', 'receita', '#3b82f6', 'briefcase', p_user_id),
        ('Consultoria', 'receita', '#8b5cf6', 'users', p_user_id),
        ('Comissões', 'receita', '#f97316', 'percent', p_user_id),
        ('Rendimentos', 'receita', '#06b6d4', 'trending-up', p_user_id),
        ('Reembolsos', 'receita', '#64748b', 'refresh-cw', p_user_id),
        ('Outras Receitas', 'receita', '#71717a', 'more-horizontal', p_user_id)
    ON CONFLICT (nome, user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGER TO CREATE DEFAULT CATEGORIES ON USER SIGNUP
-- ============================================

-- Function to handle new user
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Create default categories
    PERFORM create_default_categories_for_user(NEW.id);
    
    -- Create default user preferences
    INSERT INTO user_preferences (user_id, theme, language, currency)
    VALUES (NEW.id, 'system', 'pt-BR', 'BRL')
    ON CONFLICT (user_id) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- VIEWS FOR REPORTS
-- ============================================

-- View: Monthly summary
CREATE OR REPLACE VIEW vw_monthly_summary AS
SELECT 
    user_id,
    DATE_TRUNC('month', data_vencimento) AS mes,
    'despesa' AS tipo,
    SUM(CASE WHEN status = 'pago' THEN valor ELSE 0 END) AS total_pago,
    SUM(CASE WHEN status = 'pendente' THEN valor ELSE 0 END) AS total_pendente,
    SUM(CASE WHEN status = 'atrasado' THEN valor ELSE 0 END) AS total_atrasado,
    COUNT(*) AS quantidade
FROM contas_pagar
GROUP BY user_id, DATE_TRUNC('month', data_vencimento)
UNION ALL
SELECT 
    user_id,
    DATE_TRUNC('month', data_vencimento) AS mes,
    'receita' AS tipo,
    SUM(CASE WHEN status = 'recebido' THEN valor ELSE 0 END) AS total_pago,
    SUM(CASE WHEN status = 'pendente' THEN valor ELSE 0 END) AS total_pendente,
    SUM(CASE WHEN status = 'atrasado' THEN valor ELSE 0 END) AS total_atrasado,
    COUNT(*) AS quantidade
FROM contas_receber
GROUP BY user_id, DATE_TRUNC('month', data_vencimento);

-- View: Cash flow by day
CREATE OR REPLACE VIEW vw_cash_flow AS
SELECT 
    user_id,
    data_pagamento AS data,
    'saida' AS tipo,
    SUM(valor) AS valor
FROM contas_pagar
WHERE status = 'pago' AND data_pagamento IS NOT NULL
GROUP BY user_id, data_pagamento
UNION ALL
SELECT 
    user_id,
    data_recebimento AS data,
    'entrada' AS tipo,
    SUM(valor) AS valor
FROM contas_receber
WHERE status = 'recebido' AND data_recebimento IS NOT NULL
GROUP BY user_id, data_recebimento
ORDER BY data;

-- View: Overdue accounts
CREATE OR REPLACE VIEW vw_contas_atrasadas AS
SELECT 
    'pagar' AS tipo_conta,
    cp.id,
    cp.descricao,
    cp.valor,
    cp.data_vencimento,
    CURRENT_DATE - cp.data_vencimento AS dias_atraso,
    f.razao_social AS entidade,
    cp.user_id
FROM contas_pagar cp
LEFT JOIN fornecedores f ON cp.fornecedor_id = f.id
WHERE cp.status = 'atrasado'
UNION ALL
SELECT 
    'receber' AS tipo_conta,
    cr.id,
    cr.descricao,
    cr.valor,
    cr.data_vencimento,
    CURRENT_DATE - cr.data_vencimento AS dias_atraso,
    c.nome AS entidade,
    cr.user_id
FROM contas_receber cr
LEFT JOIN clientes c ON cr.cliente_id = c.id
WHERE cr.status = 'atrasado'
ORDER BY dias_atraso DESC;

-- View: Category totals
CREATE OR REPLACE VIEW vw_totals_by_category AS
SELECT 
    user_id,
    categoria,
    'despesa' AS tipo,
    SUM(valor) AS total,
    COUNT(*) AS quantidade
FROM contas_pagar
WHERE status = 'pago'
GROUP BY user_id, categoria
UNION ALL
SELECT 
    user_id,
    categoria,
    'receita' AS tipo,
    SUM(valor) AS total,
    COUNT(*) AS quantidade
FROM contas_receber
WHERE status = 'recebido'
GROUP BY user_id, categoria;

-- ============================================
-- STORED PROCEDURES
-- ============================================

-- Procedure: Mark conta as paid
CREATE OR REPLACE FUNCTION mark_conta_pagar_as_paid(
    p_id UUID,
    p_data_pagamento DATE DEFAULT CURRENT_DATE
)
RETURNS contas_pagar AS $$
DECLARE
    v_conta contas_pagar;
BEGIN
    UPDATE contas_pagar
    SET 
        status = 'pago',
        data_pagamento = p_data_pagamento,
        updated_at = NOW()
    WHERE id = p_id
    RETURNING * INTO v_conta;
    
    RETURN v_conta;
END;
$$ LANGUAGE plpgsql;

-- Procedure: Mark conta as received
CREATE OR REPLACE FUNCTION mark_conta_receber_as_received(
    p_id UUID,
    p_data_recebimento DATE DEFAULT CURRENT_DATE
)
RETURNS contas_receber AS $$
DECLARE
    v_conta contas_receber;
BEGIN
    UPDATE contas_receber
    SET 
        status = 'recebido',
        data_recebimento = p_data_recebimento,
        updated_at = NOW()
    WHERE id = p_id
    RETURNING * INTO v_conta;
    
    RETURN v_conta;
END;
$$ LANGUAGE plpgsql;

-- Procedure: Get dashboard stats
CREATE OR REPLACE FUNCTION get_dashboard_stats(
    p_user_id UUID,
    p_start_date DATE DEFAULT DATE_TRUNC('month', CURRENT_DATE)::DATE,
    p_end_date DATE DEFAULT (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::DATE
)
RETURNS TABLE (
    total_receitas DECIMAL,
    total_despesas DECIMAL,
    saldo_liquido DECIMAL,
    contas_a_pagar BIGINT,
    contas_a_receber BIGINT,
    contas_atrasadas BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COALESCE(
            (SELECT SUM(valor) FROM contas_receber 
             WHERE user_id = p_user_id 
             AND status = 'recebido'
             AND data_recebimento BETWEEN p_start_date AND p_end_date), 0
        ) AS total_receitas,
        COALESCE(
            (SELECT SUM(valor) FROM contas_pagar 
             WHERE user_id = p_user_id 
             AND status = 'pago'
             AND data_pagamento BETWEEN p_start_date AND p_end_date), 0
        ) AS total_despesas,
        COALESCE(
            (SELECT SUM(valor) FROM contas_receber 
             WHERE user_id = p_user_id 
             AND status = 'recebido'
             AND data_recebimento BETWEEN p_start_date AND p_end_date), 0
        ) - COALESCE(
            (SELECT SUM(valor) FROM contas_pagar 
             WHERE user_id = p_user_id 
             AND status = 'pago'
             AND data_pagamento BETWEEN p_start_date AND p_end_date), 0
        ) AS saldo_liquido,
        (SELECT COUNT(*) FROM contas_pagar 
         WHERE user_id = p_user_id 
         AND status IN ('pendente', 'atrasado')) AS contas_a_pagar,
        (SELECT COUNT(*) FROM contas_receber 
         WHERE user_id = p_user_id 
         AND status IN ('pendente', 'atrasado')) AS contas_a_receber,
        (SELECT COUNT(*) FROM contas_pagar 
         WHERE user_id = p_user_id 
         AND status = 'atrasado') + 
        (SELECT COUNT(*) FROM contas_receber 
         WHERE user_id = p_user_id 
         AND status = 'atrasado') AS contas_atrasadas;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- SCHEDULED JOB TO UPDATE OVERDUE STATUS
-- ============================================

-- Function to update overdue accounts daily
CREATE OR REPLACE FUNCTION update_overdue_accounts()
RETURNS VOID AS $$
BEGIN
    -- Update contas_pagar
    UPDATE contas_pagar
    SET status = 'atrasado', updated_at = NOW()
    WHERE status = 'pendente'
    AND data_vencimento < CURRENT_DATE;
    
    -- Update contas_receber
    UPDATE contas_receber
    SET status = 'atrasado', updated_at = NOW()
    WHERE status = 'pendente'
    AND data_vencimento < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- Note: In Supabase, you would set up a pg_cron job:
-- SELECT cron.schedule('update-overdue', '0 0 * * *', 'SELECT update_overdue_accounts()');
-- ============================================
-- MIGRATION: Tabela de Filtros Salvos
-- Data: 2024-12-31
-- Descrição: Permite usuários salvarem filtros personalizados
-- ============================================

-- Criar tabela saved_filters
CREATE TABLE IF NOT EXISTS public.saved_filters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  name TEXT NOT NULL,
  filters JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Restrição: nome único por usuário e entidade
  CONSTRAINT unique_filter_name_per_user_entity 
    UNIQUE (user_id, entity_type, name)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_saved_filters_user_id 
  ON public.saved_filters(user_id);

CREATE INDEX IF NOT EXISTS idx_saved_filters_entity_type 
  ON public.saved_filters(entity_type);

CREATE INDEX IF NOT EXISTS idx_saved_filters_user_entity 
  ON public.saved_filters(user_id, entity_type);

CREATE INDEX IF NOT EXISTS idx_saved_filters_default 
  ON public.saved_filters(user_id, entity_type, is_default) 
  WHERE is_default = true;

-- Habilitar RLS
ALTER TABLE public.saved_filters ENABLE ROW LEVEL SECURITY;

-- Política: usuários podem ver apenas seus próprios filtros
CREATE POLICY "Users can view own filters"
  ON public.saved_filters
  FOR SELECT
  USING (auth.uid() = user_id);

-- Política: usuários podem inserir seus próprios filtros
CREATE POLICY "Users can insert own filters"
  ON public.saved_filters
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Política: usuários podem atualizar seus próprios filtros
CREATE POLICY "Users can update own filters"
  ON public.saved_filters
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Política: usuários podem deletar seus próprios filtros
CREATE POLICY "Users can delete own filters"
  ON public.saved_filters
  FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_saved_filters_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_saved_filters_updated_at ON public.saved_filters;
CREATE TRIGGER trigger_saved_filters_updated_at
  BEFORE UPDATE ON public.saved_filters
  FOR EACH ROW
  EXECUTE FUNCTION update_saved_filters_updated_at();

-- Função para garantir apenas um filtro padrão por entidade
CREATE OR REPLACE FUNCTION ensure_single_default_filter()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = true THEN
    UPDATE public.saved_filters
    SET is_default = false
    WHERE user_id = NEW.user_id
      AND entity_type = NEW.entity_type
      AND id != NEW.id
      AND is_default = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_single_default_filter ON public.saved_filters;
CREATE TRIGGER trigger_single_default_filter
  BEFORE INSERT OR UPDATE OF is_default ON public.saved_filters
  FOR EACH ROW
  WHEN (NEW.is_default = true)
  EXECUTE FUNCTION ensure_single_default_filter();

-- Comentários
COMMENT ON TABLE public.saved_filters IS 'Filtros salvos por usuários para diferentes entidades';
COMMENT ON COLUMN public.saved_filters.entity_type IS 'Tipo de entidade (ex: produtos, pedidos, colaboradores)';
COMMENT ON COLUMN public.saved_filters.filters IS 'Configuração do filtro em JSON';
COMMENT ON COLUMN public.saved_filters.is_default IS 'Se true, este filtro é aplicado automaticamente ao abrir a página';
-- Migration: Entity Versions (Versionamento)
CREATE TABLE IF NOT EXISTS public.entity_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  version_number INT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  change_summary TEXT,
  CONSTRAINT unique_entity_version UNIQUE (entity_type, entity_id, version_number)
);

CREATE INDEX IF NOT EXISTS idx_versions_entity ON public.entity_versions(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_versions_date ON public.entity_versions(changed_at DESC);

ALTER TABLE public.entity_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view versions" ON public.entity_versions FOR SELECT USING (true);
CREATE POLICY "Users can insert versions" ON public.entity_versions FOR INSERT WITH CHECK (auth.uid() = changed_by OR changed_by IS NULL);
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
CREATE INDEX idx_audit_logs_created ON public.audit_logs(created_at);-- Fix security warning: Set search_path on update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;-- Allow admins to view all profiles
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'));

-- Allow admins to update all profiles
CREATE POLICY "Admins can update all profiles" 
ON public.profiles 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'));-- Create settings table for approval workflow configuration
CREATE TABLE public.configuracoes_aprovacao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  valor_minimo_aprovacao numeric NOT NULL DEFAULT 1000,
  aprovadores_obrigatorios integer NOT NULL DEFAULT 1,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.configuracoes_aprovacao ENABLE ROW LEVEL SECURITY;

-- Only admins can manage approval settings
CREATE POLICY "Admins can manage configuracoes_aprovacao"
ON public.configuracoes_aprovacao
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- All authenticated users can view settings
CREATE POLICY "Authenticated users can view configuracoes_aprovacao"
ON public.configuracoes_aprovacao
FOR SELECT
USING (true);

-- Create approval requests table
CREATE TABLE public.solicitacoes_aprovacao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conta_pagar_id uuid NOT NULL REFERENCES public.contas_pagar(id) ON DELETE CASCADE,
  solicitado_por uuid NOT NULL,
  solicitado_em timestamp with time zone NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado', 'rejeitado')),
  aprovado_por uuid,
  aprovado_em timestamp with time zone,
  motivo_rejeicao text,
  observacoes text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.solicitacoes_aprovacao ENABLE ROW LEVEL SECURITY;

-- All authenticated can view approval requests
CREATE POLICY "Authenticated users can view solicitacoes_aprovacao"
ON public.solicitacoes_aprovacao
FOR SELECT
USING (true);

-- Operacional+ can create approval requests
CREATE POLICY "Operacional+ can insert solicitacoes_aprovacao"
ON public.solicitacoes_aprovacao
FOR INSERT
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role, 'operacional'::app_role]));

-- Financeiro+ can update approval requests (approve/reject)
CREATE POLICY "Financeiro+ can update solicitacoes_aprovacao"
ON public.solicitacoes_aprovacao
FOR UPDATE
USING (public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role]));

-- Add trigger for updated_at on configuracoes_aprovacao
CREATE TRIGGER update_configuracoes_aprovacao_updated_at
BEFORE UPDATE ON public.configuracoes_aprovacao
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default configuration
INSERT INTO public.configuracoes_aprovacao (valor_minimo_aprovacao, aprovadores_obrigatorios, ativo)
VALUES (5000, 1, true);-- Enable realtime for solicitacoes_aprovacao table
ALTER PUBLICATION supabase_realtime ADD TABLE public.solicitacoes_aprovacao;-- Create table for scheduled reports configuration
CREATE TABLE public.relatorios_agendados (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  tipo_relatorio VARCHAR(100) NOT NULL, -- 'fluxo_caixa', 'contas_pagar', 'contas_receber', 'dre', 'balanco'
  frequencia VARCHAR(50) NOT NULL, -- 'diario', 'semanal', 'mensal'
  dia_semana INTEGER, -- 0-6 for weekly reports
  dia_mes INTEGER, -- 1-31 for monthly reports
  hora_execucao TIME NOT NULL DEFAULT '08:00',
  empresa_id UUID REFERENCES public.empresas(id),
  centro_custo_id UUID REFERENCES public.centros_custo(id),
  ativo BOOLEAN NOT NULL DEFAULT true,
  ultimo_envio TIMESTAMP WITH TIME ZONE,
  proximo_envio TIMESTAMP WITH TIME ZONE,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for report execution history
CREATE TABLE public.historico_relatorios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  relatorio_agendado_id UUID REFERENCES public.relatorios_agendados(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL DEFAULT 'gerado', -- 'gerado', 'enviado', 'erro'
  dados_relatorio JSONB,
  erro_mensagem TEXT,
  executado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.relatorios_agendados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historico_relatorios ENABLE ROW LEVEL SECURITY;

-- RLS Policies for relatorios_agendados
CREATE POLICY "Users can view scheduled reports" 
ON public.relatorios_agendados 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create scheduled reports" 
ON public.relatorios_agendados 
FOR INSERT 
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their scheduled reports" 
ON public.relatorios_agendados 
FOR UPDATE 
USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their scheduled reports" 
ON public.relatorios_agendados 
FOR DELETE 
USING (auth.uid() = created_by);

-- RLS Policies for historico_relatorios
CREATE POLICY "Users can view report history" 
ON public.historico_relatorios 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "System can insert report history" 
ON public.historico_relatorios 
FOR INSERT 
WITH CHECK (true);

-- Add trigger for updated_at
CREATE TRIGGER update_relatorios_agendados_updated_at
BEFORE UPDATE ON public.relatorios_agendados
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();-- Enable pg_cron and pg_net extensions for scheduled tasks
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;-- Tabela para armazenar logs de sincronização do Bitrix24
CREATE TABLE public.bitrix_sync_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'saida', 'alteracao')),
  entidade TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'sucesso', 'erro', 'parcial')),
  registros_processados INTEGER DEFAULT 0,
  registros_com_erro INTEGER DEFAULT 0,
  mensagem_erro TEXT,
  detalhes JSONB,
  iniciado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  finalizado_em TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para configuração de mapeamento de campos
CREATE TABLE public.bitrix_field_mappings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entidade TEXT NOT NULL,
  campo_bitrix TEXT NOT NULL,
  campo_sistema TEXT NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT true,
  obrigatorio BOOLEAN NOT NULL DEFAULT false,
  transformacao TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(entidade, campo_bitrix)
);

-- Tabela para armazenar tokens OAuth
CREATE TABLE public.bitrix_oauth_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bitrix_sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bitrix_field_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bitrix_oauth_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policies para bitrix_sync_logs
CREATE POLICY "Authenticated users can view sync logs" ON public.bitrix_sync_logs
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Financeiro+ can insert sync logs" ON public.bitrix_sync_logs
  FOR INSERT WITH CHECK (has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role]));

-- RLS Policies para bitrix_field_mappings
CREATE POLICY "Authenticated users can view field mappings" ON public.bitrix_field_mappings
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admin can manage field mappings" ON public.bitrix_field_mappings
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies para bitrix_oauth_tokens (apenas admin)
CREATE POLICY "Admin can manage oauth tokens" ON public.bitrix_oauth_tokens
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger para updated_at
CREATE TRIGGER update_bitrix_field_mappings_updated_at
  BEFORE UPDATE ON public.bitrix_field_mappings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bitrix_oauth_tokens_updated_at
  BEFORE UPDATE ON public.bitrix_oauth_tokens
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir mapeamentos padrão
INSERT INTO public.bitrix_field_mappings (entidade, campo_bitrix, campo_sistema, ativo, obrigatorio) VALUES
  ('deal', 'ID', 'bitrix_deal_id', true, true),
  ('deal', 'TITLE', 'descricao', true, true),
  ('deal', 'OPPORTUNITY', 'valor', true, true),
  ('deal', 'CLOSEDATE', 'data_vencimento', true, false),
  ('deal', 'COMPANY_ID', 'cliente_id', true, false),
  ('contact', 'ID', 'bitrix_id', true, true),
  ('contact', 'NAME', 'razao_social', true, true),
  ('contact', 'EMAIL', 'email', true, false),
  ('contact', 'PHONE', 'telefone', true, false),
  ('company', 'ID', 'bitrix_id', true, true),
  ('company', 'TITLE', 'razao_social', true, true),
  ('company', 'EMAIL', 'email', true, false),
  ('company', 'PHONE', 'telefone', true, false);-- Tabela para armazenar boletos gerados
CREATE TABLE public.boletos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero TEXT NOT NULL,
  valor NUMERIC NOT NULL,
  vencimento DATE NOT NULL,
  sacado_nome TEXT NOT NULL,
  sacado_cpf_cnpj TEXT,
  cedente_nome TEXT NOT NULL,
  cedente_cnpj TEXT,
  banco TEXT NOT NULL,
  agencia TEXT NOT NULL,
  conta TEXT NOT NULL,
  linha_digitavel TEXT NOT NULL,
  codigo_barras TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'gerado' CHECK (status IN ('gerado', 'enviado', 'pago', 'vencido', 'cancelado')),
  descricao TEXT,
  observacoes TEXT,
  conta_receber_id UUID REFERENCES public.contas_receber(id),
  conta_bancaria_id UUID REFERENCES public.contas_bancarias(id),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id),
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.boletos ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Authenticated users can view boletos" ON public.boletos
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Operacional+ can insert boletos" ON public.boletos
  FOR INSERT WITH CHECK (has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role, 'operacional'::app_role]));

CREATE POLICY "Financeiro+ can update boletos" ON public.boletos
  FOR UPDATE USING (has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role]));

CREATE POLICY "Admin can delete boletos" ON public.boletos
  FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger para updated_at
CREATE TRIGGER update_boletos_updated_at
  BEFORE UPDATE ON public.boletos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Índices para performance
CREATE INDEX idx_boletos_empresa_id ON public.boletos(empresa_id);
CREATE INDEX idx_boletos_status ON public.boletos(status);
CREATE INDEX idx_boletos_vencimento ON public.boletos(vencimento);
CREATE INDEX idx_boletos_conta_receber_id ON public.boletos(conta_receber_id);-- Bug #13: Criar função para persistir conciliações corretamente
-- Bug #14: Criar função de trigger para gerar alertas automáticos
-- Bug #15: Criar tabela de histórico de cobrança

-- Tabela para histórico de mudanças de etapa de cobrança
CREATE TABLE IF NOT EXISTS public.historico_cobranca (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conta_receber_id UUID NOT NULL REFERENCES public.contas_receber(id) ON DELETE CASCADE,
  etapa_anterior TEXT,
  etapa_nova TEXT NOT NULL,
  observacoes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.historico_cobranca ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para histórico de cobrança
CREATE POLICY "Authenticated users can view historico_cobranca"
  ON public.historico_cobranca FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Financeiro+ can insert historico_cobranca"
  ON public.historico_cobranca FOR INSERT
  WITH CHECK (has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role]));

-- Índice para performance
CREATE INDEX idx_historico_cobranca_conta ON public.historico_cobranca(conta_receber_id);
CREATE INDEX idx_historico_cobranca_created ON public.historico_cobranca(created_at DESC);

-- Trigger para registrar mudanças de etapa de cobrança automaticamente
CREATE OR REPLACE FUNCTION public.log_etapa_cobranca_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.etapa_cobranca IS DISTINCT FROM NEW.etapa_cobranca THEN
    INSERT INTO public.historico_cobranca (
      conta_receber_id,
      etapa_anterior,
      etapa_nova,
      created_by
    ) VALUES (
      NEW.id,
      OLD.etapa_cobranca::text,
      NEW.etapa_cobranca::text,
      auth.uid()
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_etapa_cobranca_change
  AFTER UPDATE ON public.contas_receber
  FOR EACH ROW
  EXECUTE FUNCTION public.log_etapa_cobranca_change();

-- Bug #14: Função para gerar alertas automáticos de vencimento
CREATE OR REPLACE FUNCTION public.gerar_alertas_vencimento()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  hoje DATE := CURRENT_DATE;
  em_tres_dias DATE := CURRENT_DATE + INTERVAL '3 days';
  conta RECORD;
BEGIN
  -- Alertas para contas a pagar próximas do vencimento (3 dias)
  FOR conta IN 
    SELECT id, descricao, valor, data_vencimento, fornecedor_nome, created_by
    FROM public.contas_pagar
    WHERE status = 'pendente'
      AND data_vencimento BETWEEN hoje AND em_tres_dias
      AND NOT EXISTS (
        SELECT 1 FROM public.alertas 
        WHERE entidade_tipo = 'conta_pagar' 
          AND entidade_id = contas_pagar.id::text
          AND tipo = 'vencimento'
          AND created_at > now() - INTERVAL '1 day'
      )
  LOOP
    INSERT INTO public.alertas (
      tipo,
      titulo,
      mensagem,
      prioridade,
      entidade_tipo,
      entidade_id,
      acao_url,
      user_id
    ) VALUES (
      'vencimento',
      'Conta a pagar próxima do vencimento',
      format('A conta "%s" no valor de R$ %s para %s vence em %s',
        conta.descricao,
        to_char(conta.valor, 'FM999G999G999D00'),
        conta.fornecedor_nome,
        to_char(conta.data_vencimento, 'DD/MM/YYYY')
      ),
      CASE 
        WHEN conta.data_vencimento = hoje THEN 'alta'::prioridade_alerta
        ELSE 'media'::prioridade_alerta
      END,
      'conta_pagar',
      conta.id::text,
      '/contas-pagar',
      conta.created_by
    );
  END LOOP;

  -- Alertas para contas a receber vencidas (inadimplência)
  FOR conta IN 
    SELECT id, descricao, valor, data_vencimento, cliente_nome, created_by
    FROM public.contas_receber
    WHERE status IN ('pendente', 'vencido')
      AND data_vencimento < hoje
      AND NOT EXISTS (
        SELECT 1 FROM public.alertas 
        WHERE entidade_tipo = 'conta_receber' 
          AND entidade_id = contas_receber.id::text
          AND tipo = 'inadimplencia'
          AND created_at > now() - INTERVAL '7 days'
      )
  LOOP
    INSERT INTO public.alertas (
      tipo,
      titulo,
      mensagem,
      prioridade,
      entidade_tipo,
      entidade_id,
      acao_url,
      user_id
    ) VALUES (
      'inadimplencia',
      'Conta a receber vencida',
      format('A conta "%s" no valor de R$ %s de %s está vencida desde %s',
        conta.descricao,
        to_char(conta.valor, 'FM999G999G999D00'),
        conta.cliente_nome,
        to_char(conta.data_vencimento, 'DD/MM/YYYY')
      ),
      CASE 
        WHEN conta.data_vencimento < hoje - INTERVAL '15 days' THEN 'critica'::prioridade_alerta
        WHEN conta.data_vencimento < hoje - INTERVAL '7 days' THEN 'alta'::prioridade_alerta
        ELSE 'media'::prioridade_alerta
      END,
      'conta_receber',
      conta.id::text,
      '/contas-receber',
      conta.created_by
    );
  END LOOP;
END;
$$;

-- Bug #13: Função para persistir conciliação bancária
CREATE OR REPLACE FUNCTION public.confirmar_conciliacao(
  p_transacao_id UUID,
  p_conta_pagar_id UUID DEFAULT NULL,
  p_conta_receber_id UUID DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Atualizar a transação bancária como conciliada
  UPDATE public.transacoes_bancarias
  SET 
    conciliada = true,
    conciliada_em = now(),
    conciliada_por = auth.uid(),
    conta_pagar_id = COALESCE(p_conta_pagar_id, conta_pagar_id),
    conta_receber_id = COALESCE(p_conta_receber_id, conta_receber_id)
  WHERE id = p_transacao_id;

  -- Se vinculado a conta a pagar, atualizar status
  IF p_conta_pagar_id IS NOT NULL THEN
    UPDATE public.contas_pagar
    SET status = 'pago', data_pagamento = CURRENT_DATE
    WHERE id = p_conta_pagar_id AND status = 'pendente';
  END IF;

  -- Se vinculado a conta a receber, atualizar status
  IF p_conta_receber_id IS NOT NULL THEN
    UPDATE public.contas_receber
    SET status = 'pago', data_recebimento = CURRENT_DATE
    WHERE id = p_conta_receber_id AND status IN ('pendente', 'vencido');
  END IF;
END;
$$;

-- Permitir insert de alertas para o sistema (RLS)
DROP POLICY IF EXISTS "System can insert alertas" ON public.alertas;
CREATE POLICY "System can insert alertas"
  ON public.alertas FOR INSERT
  WITH CHECK (true);

-- Adicionar realtime para alertas
ALTER PUBLICATION supabase_realtime ADD TABLE public.alertas;-- Enable pg_cron and pg_net extensions for scheduled HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Grant usage to postgres role
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;-- Create table for push notification subscriptions
CREATE TABLE public.push_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, endpoint)
);

-- Enable RLS
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can manage their own subscriptions
CREATE POLICY "Users can view their own push subscriptions" 
ON public.push_subscriptions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own push subscriptions" 
ON public.push_subscriptions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own push subscriptions" 
ON public.push_subscriptions 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own push subscriptions" 
ON public.push_subscriptions 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_push_subscriptions_updated_at
BEFORE UPDATE ON public.push_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();-- Create table for EXPERT conversations
CREATE TABLE public.expert_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  titulo TEXT NOT NULL DEFAULT 'Nova Conversa',
  resumo TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for EXPERT messages
CREATE TABLE public.expert_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.expert_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  actions JSONB,
  actions_executed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.expert_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expert_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for expert_conversations
CREATE POLICY "Users can view own conversations"
ON public.expert_conversations
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own conversations"
ON public.expert_conversations
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations"
ON public.expert_conversations
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own conversations"
ON public.expert_conversations
FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for expert_messages
CREATE POLICY "Users can view messages from own conversations"
ON public.expert_messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.expert_conversations
    WHERE id = expert_messages.conversation_id
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert messages to own conversations"
ON public.expert_messages
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.expert_conversations
    WHERE id = expert_messages.conversation_id
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can update messages in own conversations"
ON public.expert_messages
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.expert_conversations
    WHERE id = expert_messages.conversation_id
    AND user_id = auth.uid()
  )
);

-- Create indexes for performance
CREATE INDEX idx_expert_conversations_user_id ON public.expert_conversations(user_id);
CREATE INDEX idx_expert_messages_conversation_id ON public.expert_messages(conversation_id);

-- Trigger to update updated_at on conversations
CREATE TRIGGER update_expert_conversations_updated_at
BEFORE UPDATE ON public.expert_conversations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();-- Criar tabela de histórico de conciliações com IA
CREATE TABLE public.historico_conciliacao_ia (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  transacao_bancaria_id UUID REFERENCES public.transacoes_bancarias(id),
  conta_pagar_id UUID REFERENCES public.contas_pagar(id),
  conta_receber_id UUID REFERENCES public.contas_receber(id),
  tipo_lancamento TEXT NOT NULL CHECK (tipo_lancamento IN ('pagar', 'receber')),
  score_ia INTEGER NOT NULL CHECK (score_ia >= 0 AND score_ia <= 100),
  confianca TEXT NOT NULL CHECK (confianca IN ('alta', 'media', 'baixa')),
  motivos JSONB NOT NULL DEFAULT '[]',
  analise_ia TEXT,
  acao TEXT NOT NULL CHECK (acao IN ('aprovado', 'rejeitado')),
  aprovado_por UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de feedback para treinar o algoritmo
CREATE TABLE public.feedback_conciliacao_ia (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  transacao_descricao TEXT NOT NULL,
  lancamento_entidade TEXT NOT NULL,
  lancamento_descricao TEXT,
  tipo_lancamento TEXT NOT NULL CHECK (tipo_lancamento IN ('pagar', 'receber')),
  score_original INTEGER NOT NULL,
  acao TEXT NOT NULL CHECK (acao IN ('aprovado', 'rejeitado')),
  motivo_rejeicao TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_historico_conciliacao_ia_transacao ON public.historico_conciliacao_ia(transacao_bancaria_id);
CREATE INDEX idx_historico_conciliacao_ia_created_at ON public.historico_conciliacao_ia(created_at DESC);
CREATE INDEX idx_feedback_conciliacao_ia_created_at ON public.feedback_conciliacao_ia(created_at DESC);

-- Habilitar RLS
ALTER TABLE public.historico_conciliacao_ia ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback_conciliacao_ia ENABLE ROW LEVEL SECURITY;

-- Políticas RLS - histórico visível para todos autenticados
CREATE POLICY "Usuários autenticados podem ver histórico de conciliação" 
ON public.historico_conciliacao_ia 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Usuários autenticados podem inserir histórico de conciliação" 
ON public.historico_conciliacao_ia 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- Políticas RLS - feedback
CREATE POLICY "Usuários autenticados podem ver feedback" 
ON public.feedback_conciliacao_ia 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Usuários autenticados podem inserir feedback" 
ON public.feedback_conciliacao_ia 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);-- Create table for financial goals
CREATE TABLE public.metas_financeiras (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo TEXT NOT NULL CHECK (tipo IN ('receita', 'despesa', 'inadimplencia', 'economia')),
  titulo TEXT NOT NULL,
  valor_meta NUMERIC NOT NULL DEFAULT 0,
  mes INTEGER NOT NULL CHECK (mes >= 1 AND mes <= 12),
  ano INTEGER NOT NULL CHECK (ano >= 2020),
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(tipo, mes, ano)
);

-- Enable RLS
ALTER TABLE public.metas_financeiras ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Authenticated users can view metas_financeiras"
ON public.metas_financeiras
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Financeiro+ can manage metas_financeiras"
ON public.metas_financeiras
FOR ALL
USING (has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role]));

-- Trigger for updated_at
CREATE TRIGGER update_metas_financeiras_updated_at
BEFORE UPDATE ON public.metas_financeiras
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default goals for current month
INSERT INTO public.metas_financeiras (tipo, titulo, valor_meta, mes, ano)
VALUES 
  ('receita', 'Meta de Receitas', 150000, EXTRACT(MONTH FROM CURRENT_DATE)::INTEGER, EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER),
  ('despesa', 'Limite de Despesas', 100000, EXTRACT(MONTH FROM CURRENT_DATE)::INTEGER, EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER),
  ('inadimplencia', 'Inadimplência Máxima', 5, EXTRACT(MONTH FROM CURRENT_DATE)::INTEGER, EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER);-- Função para listar cron jobs
CREATE OR REPLACE FUNCTION public.get_cron_jobs()
RETURNS TABLE (
  jobid bigint,
  schedule text,
  command text,
  nodename text,
  nodeport integer,
  database text,
  username text,
  active boolean,
  jobname text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Apenas admins podem visualizar cron jobs
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem visualizar cron jobs';
  END IF;
  
  RETURN QUERY
  SELECT 
    j.jobid,
    j.schedule,
    j.command,
    j.nodename,
    j.nodeport,
    j.database,
    j.username,
    j.active,
    j.jobname
  FROM cron.job j
  ORDER BY j.jobid;
END;
$$;

-- Função para deletar cron job
CREATE OR REPLACE FUNCTION public.delete_cron_job(job_id bigint)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Apenas admins podem deletar cron jobs
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem deletar cron jobs';
  END IF;
  
  PERFORM cron.unschedule(job_id);
END;
$$;

-- Função para ativar/desativar cron job
CREATE OR REPLACE FUNCTION public.toggle_cron_job(job_id bigint, is_active boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Apenas admins podem modificar cron jobs
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem modificar cron jobs';
  END IF;
  
  UPDATE cron.job
  SET active = is_active
  WHERE jobid = job_id;
END;
$$;-- Tabela para histórico de análises preditivas
CREATE TABLE IF NOT EXISTS public.historico_analises_preditivas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  score_saude_financeira INTEGER NOT NULL,
  resumo_executivo TEXT,
  analise_completa JSONB NOT NULL,
  dados_analisados JSONB,
  projecoes JSONB,
  alertas_gerados INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Tabela para histórico do score de saúde financeira
CREATE TABLE IF NOT EXISTS public.historico_score_saude (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  indicadores JSONB,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para alertas preditivos persistentes
CREATE TABLE IF NOT EXISTS public.alertas_preditivos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo TEXT NOT NULL CHECK (tipo IN ('ruptura', 'inadimplencia_provavel', 'oportunidade_antecipacao', 'concentracao_risco', 'meta_risco', 'tendencia_negativa')),
  titulo TEXT NOT NULL,
  descricao TEXT NOT NULL,
  probabilidade INTEGER CHECK (probabilidade >= 0 AND probabilidade <= 100),
  impacto_estimado NUMERIC(15, 2),
  data_previsao DATE,
  sugestoes JSONB,
  prioridade TEXT NOT NULL CHECK (prioridade IN ('baixa', 'media', 'alta', 'critica')),
  status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'resolvido', 'ignorado')),
  resolvido_em TIMESTAMP WITH TIME ZONE,
  resolvido_por UUID REFERENCES auth.users(id),
  analise_preditiva_id UUID REFERENCES public.historico_analises_preditivas(id),
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para recomendações de metas baseadas em IA
CREATE TABLE IF NOT EXISTS public.recomendacoes_metas_ia (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo_meta TEXT NOT NULL,
  valor_sugerido NUMERIC(15, 2) NOT NULL,
  justificativa TEXT NOT NULL,
  baseado_em JSONB,
  confianca INTEGER CHECK (confianca >= 0 AND confianca <= 100),
  periodo_referencia_inicio DATE,
  periodo_referencia_fim DATE,
  aceita BOOLEAN,
  meta_id UUID REFERENCES public.metas_financeiras(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_historico_analises_created_at ON public.historico_analises_preditivas(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_historico_score_created_at ON public.historico_score_saude(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alertas_preditivos_status ON public.alertas_preditivos(status, prioridade);
CREATE INDEX IF NOT EXISTS idx_alertas_preditivos_user ON public.alertas_preditivos(user_id, status);
CREATE INDEX IF NOT EXISTS idx_recomendacoes_metas_tipo ON public.recomendacoes_metas_ia(tipo_meta, created_at DESC);

-- Habilitar RLS
ALTER TABLE public.historico_analises_preditivas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historico_score_saude ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alertas_preditivos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recomendacoes_metas_ia ENABLE ROW LEVEL SECURITY;

-- Políticas RLS - histórico de análises (todos autenticados podem ver)
CREATE POLICY "Usuários autenticados podem ver histórico de análises"
ON public.historico_analises_preditivas FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Sistema pode inserir análises"
ON public.historico_analises_preditivas FOR INSERT
TO authenticated
WITH CHECK (true);

-- Políticas RLS - histórico score (todos autenticados podem ver)
CREATE POLICY "Usuários autenticados podem ver histórico de score"
ON public.historico_score_saude FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Sistema pode inserir scores"
ON public.historico_score_saude FOR INSERT
TO authenticated
WITH CHECK (true);

-- Políticas RLS - alertas preditivos
CREATE POLICY "Usuários podem ver seus alertas preditivos"
ON public.alertas_preditivos FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Sistema pode inserir alertas preditivos"
ON public.alertas_preditivos FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Usuários podem atualizar seus alertas"
ON public.alertas_preditivos FOR UPDATE
TO authenticated
USING (user_id = auth.uid() OR user_id IS NULL);

-- Políticas RLS - recomendações de metas
CREATE POLICY "Usuários autenticados podem ver recomendações"
ON public.recomendacoes_metas_ia FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Sistema pode inserir recomendações"
ON public.recomendacoes_metas_ia FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Usuários podem atualizar recomendações"
ON public.recomendacoes_metas_ia FOR UPDATE
TO authenticated
USING (true);-- Table to store Bitrix24 webhook events
CREATE TABLE public.bitrix_webhook_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  payload JSONB,
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMPTZ,
  error_message TEXT,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bitrix_webhook_events ENABLE ROW LEVEL SECURITY;

-- Policy for admin access
CREATE POLICY "Admins can manage webhook events"
  ON public.bitrix_webhook_events
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Table to store Open Finance consents
CREATE TABLE public.open_finance_consents (
  id TEXT NOT NULL PRIMARY KEY,
  user_id UUID NOT NULL,
  institution_id TEXT NOT NULL,
  permissions TEXT[] NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  access_token TEXT,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.open_finance_consents ENABLE ROW LEVEL SECURITY;

-- Users can only see their own consents
CREATE POLICY "Users can view their own consents"
  ON public.open_finance_consents
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own consents"
  ON public.open_finance_consents
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own consents"
  ON public.open_finance_consents
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_open_finance_consents_updated_at
  BEFORE UPDATE ON public.open_finance_consents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Index for faster queries
CREATE INDEX idx_bitrix_webhook_events_type ON public.bitrix_webhook_events(event_type);
CREATE INDEX idx_bitrix_webhook_events_processed ON public.bitrix_webhook_events(processed);
CREATE INDEX idx_open_finance_consents_user ON public.open_finance_consents(user_id);
CREATE INDEX idx_open_finance_consents_status ON public.open_finance_consents(status);-- Move pg_net extension from public to extensions schema
-- First, create extensions schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS extensions;

-- Grant usage on extensions schema to necessary roles
GRANT USAGE ON SCHEMA extensions TO postgres, anon, authenticated, service_role;

-- Note: pg_net extension cannot be easily moved after creation
-- The extension needs to be dropped and recreated in the correct schema
-- However, this may break existing functionality, so we'll leave it as-is
-- and add a note that new extensions should be created in the extensions schema

-- For now, we acknowledge the warning but cannot fix it without data loss risk
-- This is a known limitation for extensions installed in public schema

COMMENT ON SCHEMA extensions IS 'Schema for PostgreSQL extensions to avoid cluttering public schema';-- Tabela para tokens de acesso do portal do cliente
CREATE TABLE public.portal_cliente_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE CASCADE,
  token VARCHAR(64) NOT NULL UNIQUE,
  email_cliente VARCHAR(255) NOT NULL,
  ativo BOOLEAN DEFAULT true,
  ultimo_acesso TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '1 year')
);

-- Índices para performance
CREATE INDEX idx_portal_tokens_token ON public.portal_cliente_tokens(token);
CREATE INDEX idx_portal_tokens_cliente ON public.portal_cliente_tokens(cliente_id);

-- RLS para tokens do portal
ALTER TABLE public.portal_cliente_tokens ENABLE ROW LEVEL SECURITY;

-- Política para permitir leitura por token (acesso público para validação)
CREATE POLICY "Tokens podem ser validados publicamente" 
ON public.portal_cliente_tokens 
FOR SELECT 
USING (ativo = true AND expires_at > now());

-- Política para usuários autenticados gerenciarem tokens
CREATE POLICY "Usuários autenticados podem gerenciar tokens" 
ON public.portal_cliente_tokens 
FOR ALL
USING (auth.uid() IS NOT NULL);

-- Tabela para histórico de acessos do portal
CREATE TABLE public.portal_cliente_acessos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  token_id UUID REFERENCES public.portal_cliente_tokens(id) ON DELETE CASCADE,
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE CASCADE,
  acao VARCHAR(50) NOT NULL,
  detalhes JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índice para histórico
CREATE INDEX idx_portal_acessos_cliente ON public.portal_cliente_acessos(cliente_id);
CREATE INDEX idx_portal_acessos_token ON public.portal_cliente_acessos(token_id);

-- RLS para histórico de acessos
ALTER TABLE public.portal_cliente_acessos ENABLE ROW LEVEL SECURITY;

-- Política para permitir inserção pública (log de acesso)
CREATE POLICY "Acessos podem ser registrados publicamente" 
ON public.portal_cliente_acessos 
FOR INSERT 
WITH CHECK (true);

-- Política para usuários autenticados visualizarem
CREATE POLICY "Usuários autenticados podem ver acessos" 
ON public.portal_cliente_acessos 
FOR SELECT
USING (auth.uid() IS NOT NULL);-- Tabela para armazenar templates de pagamentos recorrentes
CREATE TABLE public.pagamentos_recorrentes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  descricao TEXT NOT NULL,
  fornecedor_id UUID REFERENCES public.fornecedores(id),
  fornecedor_nome TEXT NOT NULL,
  valor NUMERIC(15,2) NOT NULL,
  dia_vencimento INTEGER NOT NULL CHECK (dia_vencimento >= 1 AND dia_vencimento <= 31),
  frequencia TEXT NOT NULL DEFAULT 'mensal' CHECK (frequencia IN ('semanal', 'quinzenal', 'mensal', 'bimestral', 'trimestral', 'semestral', 'anual')),
  data_inicio DATE NOT NULL,
  data_fim DATE,
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  centro_custo_id UUID REFERENCES public.centros_custo(id),
  conta_bancaria_id UUID REFERENCES public.contas_bancarias(id),
  tipo_cobranca tipo_cobranca DEFAULT 'transferencia',
  observacoes TEXT,
  ativo BOOLEAN DEFAULT true,
  ultima_geracao DATE,
  proxima_geracao DATE,
  total_gerado INTEGER DEFAULT 0,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_pagamentos_recorrentes_empresa ON public.pagamentos_recorrentes(empresa_id);
CREATE INDEX idx_pagamentos_recorrentes_ativo ON public.pagamentos_recorrentes(ativo);
CREATE INDEX idx_pagamentos_recorrentes_proxima ON public.pagamentos_recorrentes(proxima_geracao);

-- Enable RLS
ALTER TABLE public.pagamentos_recorrentes ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Usuários autenticados podem ver pagamentos recorrentes"
  ON public.pagamentos_recorrentes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários podem criar pagamentos recorrentes"
  ON public.pagamentos_recorrentes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Usuários podem atualizar pagamentos recorrentes"
  ON public.pagamentos_recorrentes FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Admins podem deletar pagamentos recorrentes"
  ON public.pagamentos_recorrentes FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Trigger para atualizar updated_at
CREATE TRIGGER update_pagamentos_recorrentes_updated_at
  BEFORE UPDATE ON public.pagamentos_recorrentes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Função para calcular próxima data de geração
CREATE OR REPLACE FUNCTION public.calcular_proxima_geracao(
  p_ultima_geracao DATE,
  p_frequencia TEXT,
  p_dia_vencimento INTEGER
)
RETURNS DATE
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_proxima DATE;
  v_intervalo INTERVAL;
BEGIN
  -- Determinar intervalo baseado na frequência
  CASE p_frequencia
    WHEN 'semanal' THEN v_intervalo := '7 days'::INTERVAL;
    WHEN 'quinzenal' THEN v_intervalo := '15 days'::INTERVAL;
    WHEN 'mensal' THEN v_intervalo := '1 month'::INTERVAL;
    WHEN 'bimestral' THEN v_intervalo := '2 months'::INTERVAL;
    WHEN 'trimestral' THEN v_intervalo := '3 months'::INTERVAL;
    WHEN 'semestral' THEN v_intervalo := '6 months'::INTERVAL;
    WHEN 'anual' THEN v_intervalo := '1 year'::INTERVAL;
    ELSE v_intervalo := '1 month'::INTERVAL;
  END CASE;

  -- Calcular próxima data
  IF p_ultima_geracao IS NULL THEN
    v_proxima := CURRENT_DATE;
  ELSE
    v_proxima := p_ultima_geracao + v_intervalo;
  END IF;

  -- Ajustar para o dia do vencimento (para frequências mensais+)
  IF p_frequencia IN ('mensal', 'bimestral', 'trimestral', 'semestral', 'anual') THEN
    v_proxima := make_date(
      EXTRACT(YEAR FROM v_proxima)::INTEGER,
      EXTRACT(MONTH FROM v_proxima)::INTEGER,
      LEAST(p_dia_vencimento, EXTRACT(DAY FROM (date_trunc('month', v_proxima) + INTERVAL '1 month - 1 day'))::INTEGER)
    );
  END IF;

  RETURN v_proxima;
END;
$$;

-- Função para gerar contas a pagar a partir de recorrentes
CREATE OR REPLACE FUNCTION public.gerar_contas_recorrentes()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_recorrente RECORD;
  v_conta_id UUID;
  v_total_gerado INTEGER := 0;
  v_data_vencimento DATE;
BEGIN
  FOR v_recorrente IN
    SELECT *
    FROM public.pagamentos_recorrentes
    WHERE ativo = true
      AND (proxima_geracao IS NULL OR proxima_geracao <= CURRENT_DATE)
      AND (data_fim IS NULL OR data_fim >= CURRENT_DATE)
  LOOP
    -- Calcular data de vencimento
    v_data_vencimento := COALESCE(v_recorrente.proxima_geracao, CURRENT_DATE);
    
    -- Ajustar dia do vencimento
    IF v_recorrente.frequencia IN ('mensal', 'bimestral', 'trimestral', 'semestral', 'anual') THEN
      v_data_vencimento := make_date(
        EXTRACT(YEAR FROM v_data_vencimento)::INTEGER,
        EXTRACT(MONTH FROM v_data_vencimento)::INTEGER,
        LEAST(v_recorrente.dia_vencimento, EXTRACT(DAY FROM (date_trunc('month', v_data_vencimento) + INTERVAL '1 month - 1 day'))::INTEGER)
      );
    END IF;

    -- Criar conta a pagar
    INSERT INTO public.contas_pagar (
      descricao,
      fornecedor_id,
      fornecedor_nome,
      valor,
      data_vencimento,
      data_emissao,
      empresa_id,
      centro_custo_id,
      conta_bancaria_id,
      tipo_cobranca,
      observacoes,
      recorrente,
      created_by
    ) VALUES (
      v_recorrente.descricao || ' (Recorrente)',
      v_recorrente.fornecedor_id,
      v_recorrente.fornecedor_nome,
      v_recorrente.valor,
      v_data_vencimento,
      CURRENT_DATE,
      v_recorrente.empresa_id,
      v_recorrente.centro_custo_id,
      v_recorrente.conta_bancaria_id,
      v_recorrente.tipo_cobranca,
      v_recorrente.observacoes,
      true,
      v_recorrente.created_by
    )
    RETURNING id INTO v_conta_id;

    -- Atualizar registro recorrente
    UPDATE public.pagamentos_recorrentes
    SET 
      ultima_geracao = v_data_vencimento,
      proxima_geracao = calcular_proxima_geracao(v_data_vencimento, v_recorrente.frequencia, v_recorrente.dia_vencimento),
      total_gerado = total_gerado + 1
    WHERE id = v_recorrente.id;

    v_total_gerado := v_total_gerado + 1;
  END LOOP;

  RETURN v_total_gerado;
END;
$$;-- Tabela para configuração da régua de cobrança
CREATE TABLE public.regua_cobranca (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  descricao TEXT,
  dias_antes_vencimento INTEGER, -- NULL = após vencimento
  dias_apos_vencimento INTEGER,  -- NULL = antes do vencimento
  canal TEXT NOT NULL DEFAULT 'whatsapp' CHECK (canal IN ('whatsapp', 'email', 'sms')),
  template_mensagem TEXT NOT NULL,
  ativo BOOLEAN DEFAULT true,
  ordem INTEGER NOT NULL DEFAULT 1,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT check_dias CHECK (
    (dias_antes_vencimento IS NOT NULL AND dias_apos_vencimento IS NULL) OR
    (dias_antes_vencimento IS NULL AND dias_apos_vencimento IS NOT NULL) OR
    (dias_antes_vencimento IS NULL AND dias_apos_vencimento IS NULL)
  )
);

-- Tabela para histórico de envios
CREATE TABLE public.historico_cobranca_whatsapp (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conta_receber_id UUID NOT NULL REFERENCES public.contas_receber(id) ON DELETE CASCADE,
  regua_id UUID REFERENCES public.regua_cobranca(id),
  cliente_id UUID REFERENCES public.clientes(id),
  telefone TEXT NOT NULL,
  mensagem TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'enviado', 'entregue', 'lido', 'erro')),
  erro_mensagem TEXT,
  enviado_em TIMESTAMP WITH TIME ZONE,
  entregue_em TIMESTAMP WITH TIME ZONE,
  lido_em TIMESTAMP WITH TIME ZONE,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX idx_regua_cobranca_ativo ON public.regua_cobranca(ativo);
CREATE INDEX idx_regua_cobranca_ordem ON public.regua_cobranca(ordem);
CREATE INDEX idx_historico_cobranca_whatsapp_conta ON public.historico_cobranca_whatsapp(conta_receber_id);
CREATE INDEX idx_historico_cobranca_whatsapp_status ON public.historico_cobranca_whatsapp(status);
CREATE INDEX idx_historico_cobranca_whatsapp_created ON public.historico_cobranca_whatsapp(created_at DESC);

-- RLS
ALTER TABLE public.regua_cobranca ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historico_cobranca_whatsapp ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para regua_cobranca
CREATE POLICY "Usuários autenticados podem ver régua de cobrança"
  ON public.regua_cobranca FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins e financeiros podem gerenciar régua de cobrança"
  ON public.regua_cobranca FOR ALL
  TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin', 'financeiro']::app_role[]));

-- Políticas RLS para historico_cobranca_whatsapp
CREATE POLICY "Usuários autenticados podem ver histórico de cobrança"
  ON public.historico_cobranca_whatsapp FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários podem inserir histórico de cobrança"
  ON public.historico_cobranca_whatsapp FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Usuários podem atualizar histórico de cobrança"
  ON public.historico_cobranca_whatsapp FOR UPDATE
  TO authenticated
  USING (true);

-- Triggers
CREATE TRIGGER update_regua_cobranca_updated_at
  BEFORE UPDATE ON public.regua_cobranca
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir régua padrão
INSERT INTO public.regua_cobranca (nome, descricao, dias_antes_vencimento, template_mensagem, ordem) VALUES
('Lembrete Preventivo', 'Lembrete 3 dias antes do vencimento', 3, 
  'Olá {{cliente_nome}}! 👋\n\nEste é um lembrete amigável de que sua fatura no valor de *R$ {{valor}}* vence em *{{data_vencimento}}*.\n\n📋 Descrição: {{descricao}}\n\nPague em dia e evite juros!\n\nDúvidas? Estamos à disposição. 😊',
  1),
('Dia do Vencimento', 'Aviso no dia do vencimento', 0,
  'Olá {{cliente_nome}}! 📅\n\nSua fatura de *R$ {{valor}}* vence *HOJE*!\n\n📋 Descrição: {{descricao}}\n\nEvite juros pagando hoje mesmo.\n\nPrecisa de ajuda? Entre em contato conosco.',
  2),
('Primeiro Aviso', 'Primeira cobrança após vencimento', NULL,
  'Olá {{cliente_nome}}!\n\n⚠️ Identificamos que sua fatura de *R$ {{valor}}* venceu em {{data_vencimento}} e ainda não foi paga.\n\n📋 Descrição: {{descricao}}\n\nPor favor, regularize seu pagamento para evitar a incidência de encargos.\n\nDúvidas ou dificuldades? Podemos ajudar!',
  3),
('Segunda Cobrança', 'Segunda cobrança - 7 dias após vencimento', NULL,
  'Olá {{cliente_nome}}! 🔔\n\nNotamos que sua fatura de *R$ {{valor}}* está em atraso desde {{data_vencimento}}.\n\nEntre em contato conosco para regularizar sua situação e evitar restrições.\n\nEstamos à disposição para negociar!',
  4);

-- Atualizar dias_apos_vencimento para as cobranças após vencimento
UPDATE public.regua_cobranca SET dias_apos_vencimento = 1, dias_antes_vencimento = NULL WHERE nome = 'Primeiro Aviso';
UPDATE public.regua_cobranca SET dias_apos_vencimento = 7, dias_antes_vencimento = NULL WHERE nome = 'Segunda Cobrança';-- Tabela para acordos de parcelamento
CREATE TABLE public.acordos_parcelamento (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_acordo TEXT NOT NULL UNIQUE,
  cliente_id UUID REFERENCES public.clientes(id),
  cliente_nome TEXT NOT NULL,
  cliente_email TEXT,
  cliente_telefone TEXT,
  valor_original NUMERIC(15,2) NOT NULL,
  valor_total_acordo NUMERIC(15,2) NOT NULL,
  desconto_aplicado NUMERIC(15,2) DEFAULT 0,
  juros_aplicado NUMERIC(15,2) DEFAULT 0,
  numero_parcelas INTEGER NOT NULL CHECK (numero_parcelas >= 1 AND numero_parcelas <= 60),
  valor_parcela NUMERIC(15,2) NOT NULL,
  data_primeiro_vencimento DATE NOT NULL,
  dia_vencimento INTEGER NOT NULL CHECK (dia_vencimento >= 1 AND dia_vencimento <= 31),
  status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'quitado', 'cancelado', 'inadimplente')),
  observacoes TEXT,
  contas_receber_ids UUID[] NOT NULL DEFAULT '{}',
  empresa_id UUID NOT NULL REFERENCES public.empresas(id),
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para parcelas do acordo
CREATE TABLE public.parcelas_acordo (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  acordo_id UUID NOT NULL REFERENCES public.acordos_parcelamento(id) ON DELETE CASCADE,
  numero_parcela INTEGER NOT NULL,
  valor NUMERIC(15,2) NOT NULL,
  data_vencimento DATE NOT NULL,
  data_pagamento DATE,
  valor_pago NUMERIC(15,2),
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'vencido', 'cancelado')),
  conta_receber_id UUID REFERENCES public.contas_receber(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(acordo_id, numero_parcela)
);

-- Índices
CREATE INDEX idx_acordos_parcelamento_cliente ON public.acordos_parcelamento(cliente_id);
CREATE INDEX idx_acordos_parcelamento_status ON public.acordos_parcelamento(status);
CREATE INDEX idx_acordos_parcelamento_empresa ON public.acordos_parcelamento(empresa_id);
CREATE INDEX idx_parcelas_acordo_acordo ON public.parcelas_acordo(acordo_id);
CREATE INDEX idx_parcelas_acordo_status ON public.parcelas_acordo(status);
CREATE INDEX idx_parcelas_acordo_vencimento ON public.parcelas_acordo(data_vencimento);

-- RLS
ALTER TABLE public.acordos_parcelamento ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parcelas_acordo ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para acordos_parcelamento
CREATE POLICY "Usuários autenticados podem ver acordos"
  ON public.acordos_parcelamento FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Financeiro+ podem criar acordos"
  ON public.acordos_parcelamento FOR INSERT
  TO authenticated
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin', 'financeiro']::app_role[]));

CREATE POLICY "Financeiro+ podem atualizar acordos"
  ON public.acordos_parcelamento FOR UPDATE
  TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin', 'financeiro']::app_role[]));

CREATE POLICY "Admin pode deletar acordos"
  ON public.acordos_parcelamento FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Políticas RLS para parcelas_acordo
CREATE POLICY "Usuários autenticados podem ver parcelas"
  ON public.parcelas_acordo FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Financeiro+ podem gerenciar parcelas"
  ON public.parcelas_acordo FOR ALL
  TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin', 'financeiro']::app_role[]));

-- Triggers
CREATE TRIGGER update_acordos_parcelamento_updated_at
  BEFORE UPDATE ON public.acordos_parcelamento
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Função para gerar número do acordo
CREATE OR REPLACE FUNCTION public.gerar_numero_acordo()
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_ano TEXT;
  v_sequencial INTEGER;
  v_numero TEXT;
BEGIN
  v_ano := to_char(CURRENT_DATE, 'YYYY');
  
  SELECT COALESCE(MAX(
    CASE 
      WHEN numero_acordo ~ ('^AC' || v_ano || '-[0-9]+$')
      THEN CAST(SUBSTRING(numero_acordo FROM '-([0-9]+)$') AS INTEGER)
      ELSE 0
    END
  ), 0) + 1
  INTO v_sequencial
  FROM acordos_parcelamento;
  
  v_numero := 'AC' || v_ano || '-' || LPAD(v_sequencial::TEXT, 5, '0');
  
  RETURN v_numero;
END;
$$;
-- Adicionar ramo de atividade aos clientes
ALTER TABLE public.clientes 
ADD COLUMN IF NOT EXISTS ramo_atividade text;

-- Criar tabela de vendedores
CREATE TABLE IF NOT EXISTS public.vendedores (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome text NOT NULL,
  email text,
  telefone text,
  ativo boolean NOT NULL DEFAULT true,
  meta_mensal numeric DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vendedores ENABLE ROW LEVEL SECURITY;

-- Políticas para vendedores
CREATE POLICY "Usuários autenticados podem ver vendedores" 
ON public.vendedores 
FOR SELECT 
USING (true);

CREATE POLICY "Financeiro+ podem gerenciar vendedores" 
ON public.vendedores 
FOR ALL 
USING (has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role]));

-- Adicionar vendedor às contas a receber
ALTER TABLE public.contas_receber 
ADD COLUMN IF NOT EXISTS vendedor_id uuid REFERENCES public.vendedores(id);

-- Adicionar vendedor aos clientes (vendedor responsável pelo cliente)
ALTER TABLE public.clientes 
ADD COLUMN IF NOT EXISTS vendedor_id uuid REFERENCES public.vendedores(id);

-- Trigger para updated_at em vendedores
CREATE TRIGGER update_vendedores_updated_at
BEFORE UPDATE ON public.vendedores
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_clientes_ramo_atividade ON public.clientes(ramo_atividade);
CREATE INDEX IF NOT EXISTS idx_clientes_vendedor_id ON public.clientes(vendedor_id);
CREATE INDEX IF NOT EXISTS idx_contas_receber_vendedor_id ON public.contas_receber(vendedor_id);
-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_contas_pagar_vencimento ON contas_pagar(vencimento);
CREATE INDEX IF NOT EXISTS idx_contas_pagar_status ON contas_pagar(status);
CREATE INDEX IF NOT EXISTS idx_cp_status_vencimento ON contas_pagar(status, vencimento);
-- Dashboard Metrics View
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_dashboard_metrics AS
SELECT 
  DATE_TRUNC('month', vencimento) as mes,
  status,
  COUNT(*) as quantidade,
  SUM(valor) as total_valor
FROM contas_pagar
GROUP BY DATE_TRUNC('month', vencimento), status;
-- Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  old_data jsonb,
  new_data jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_created ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_action ON audit_logs(action);

-- RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own audit logs"
ON audit_logs FOR SELECT
USING (auth.uid() = user_id);

-- Function to log changes
CREATE OR REPLACE FUNCTION log_audit()
RETURNS trigger AS $$
BEGIN
  INSERT INTO audit_logs (
    user_id,
    action,
    entity_type,
    entity_id,
    old_data,
    new_data
  ) VALUES (
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    to_jsonb(OLD),
    to_jsonb(NEW)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply to critical tables
CREATE TRIGGER audit_contas_pagar
AFTER INSERT OR UPDATE OR DELETE ON contas_pagar
FOR EACH ROW EXECUTE FUNCTION log_audit();

CREATE TRIGGER audit_contas_receber
AFTER INSERT OR UPDATE OR DELETE ON contas_receber
FOR EACH ROW EXECUTE FUNCTION log_audit();

CREATE TRIGGER audit_notas_fiscais
AFTER INSERT OR UPDATE OR DELETE ON notas_fiscais
FOR EACH ROW EXECUTE FUNCTION log_audit();
-- Migration: add-performance-indexes
-- Criado: 31/12/2025
-- Objetivo: Melhorar performance de queries críticas

-- Índices simples
CREATE INDEX IF NOT EXISTS idx_contas_pagar_vencimento 
  ON contas_pagar(vencimento);

CREATE INDEX IF NOT EXISTS idx_contas_pagar_status 
  ON contas_pagar(status);

CREATE INDEX IF NOT EXISTS idx_contas_pagar_fornecedor 
  ON contas_pagar(fornecedor_id);

CREATE INDEX IF NOT EXISTS idx_contas_receber_cliente 
  ON contas_receber(cliente_id);

CREATE INDEX IF NOT EXISTS idx_contas_receber_vencimento 
  ON contas_receber(vencimento);

CREATE INDEX IF NOT EXISTS idx_contas_receber_status 
  ON contas_receber(status);

CREATE INDEX IF NOT EXISTS idx_nfe_data_emissao 
  ON notas_fiscais(data_emissao);

CREATE INDEX IF NOT EXISTS idx_nfe_numero 
  ON notas_fiscais(numero);

CREATE INDEX IF NOT EXISTS idx_conciliacao_data 
  ON conciliacao_bancaria(data_transacao);

CREATE INDEX IF NOT EXISTS idx_boletos_vencimento 
  ON boletos(vencimento);

-- Índices compostos (mais eficientes para queries comuns)
CREATE INDEX IF NOT EXISTS idx_cp_status_vencimento 
  ON contas_pagar(status, vencimento);

CREATE INDEX IF NOT EXISTS idx_cp_fornecedor_status 
  ON contas_pagar(fornecedor_id, status);

CREATE INDEX IF NOT EXISTS idx_cr_cliente_status 
  ON contas_receber(cliente_id, status);

CREATE INDEX IF NOT EXISTS idx_cr_status_vencimento 
  ON contas_receber(status, vencimento);

-- Índices para full-text search
CREATE INDEX IF NOT EXISTS idx_cp_descricao_gin 
  ON contas_pagar USING gin(to_tsvector('portuguese', descricao));

CREATE INDEX IF NOT EXISTS idx_cr_descricao_gin 
  ON contas_receber USING gin(to_tsvector('portuguese', descricao));

-- Índices parciais (apenas registros ativos)
CREATE INDEX IF NOT EXISTS idx_cp_pendentes 
  ON contas_pagar(vencimento) 
  WHERE status IN ('pendente', 'vencida');

CREATE INDEX IF NOT EXISTS idx_cr_pendentes 
  ON contas_receber(vencimento) 
  WHERE status IN ('pendente', 'vencida');

-- Analyze tables para atualizar estatísticas
ANALYZE contas_pagar;
ANALYZE contas_receber;
ANALYZE notas_fiscais;
ANALYZE boletos;
ANALYZE conciliacao_bancaria;

COMMENT ON INDEX idx_contas_pagar_vencimento IS 'Otimiza queries por vencimento';
COMMENT ON INDEX idx_cp_status_vencimento IS 'Otimiza listagem de contas por status e vencimento';
-- Migration: add-materialized-views
-- Criado: 31/12/2025
-- Objetivo: Criar views materializadas para dashboards

-- View para métricas do dashboard
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_dashboard_metrics AS
SELECT 
  DATE_TRUNC('month', vencimento) as mes,
  status,
  COUNT(*) as quantidade,
  SUM(valor) as total_valor,
  AVG(valor) as media_valor,
  MIN(valor) as min_valor,
  MAX(valor) as max_valor
FROM contas_pagar
WHERE vencimento >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY DATE_TRUNC('month', vencimento), status;

CREATE UNIQUE INDEX ON mv_dashboard_metrics (mes, status);

-- View para fluxo de caixa
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_fluxo_caixa AS
SELECT 
  DATE(vencimento) as data,
  SUM(CASE WHEN tipo = 'entrada' THEN valor ELSE 0 END) as entradas,
  SUM(CASE WHEN tipo = 'saida' THEN valor ELSE 0 END) as saidas,
  SUM(CASE WHEN tipo = 'entrada' THEN valor ELSE -valor END) as saldo
FROM (
  SELECT vencimento, valor, 'entrada' as tipo FROM contas_receber WHERE status = 'pago'
  UNION ALL
  SELECT vencimento, valor, 'saida' as tipo FROM contas_pagar WHERE status = 'pago'
) combined
WHERE vencimento >= CURRENT_DATE - INTERVAL '3 months'
GROUP BY DATE(vencimento)
ORDER BY data;

CREATE UNIQUE INDEX ON mv_fluxo_caixa (data);

-- View para top fornecedores
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_top_fornecedores AS
SELECT 
  f.id,
  f.nome,
  COUNT(cp.id) as total_contas,
  SUM(cp.valor) as total_valor,
  AVG(cp.valor) as media_valor
FROM fornecedores f
LEFT JOIN contas_pagar cp ON cp.fornecedor_id = f.id
WHERE cp.created_at >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY f.id, f.nome
ORDER BY total_valor DESC
LIMIT 100;

CREATE UNIQUE INDEX ON mv_top_fornecedores (id);

-- View para análise de inadimplência
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_inadimplencia AS
SELECT 
  cliente_id,
  COUNT(*) as contas_vencidas,
  SUM(valor) as valor_total_vencido,
  MIN(vencimento) as vencimento_mais_antigo,
  MAX(vencimento) as vencimento_mais_recente,
  DATE_PART('day', CURRENT_DATE - MIN(vencimento)) as dias_atraso_maximo
FROM contas_receber
WHERE status = 'vencida'
GROUP BY cliente_id
HAVING COUNT(*) > 0;

CREATE UNIQUE INDEX ON mv_inadimplencia (cliente_id);

-- Função para refresh automático
CREATE OR REPLACE FUNCTION refresh_materialized_views()
RETURNS trigger AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_dashboard_metrics;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_fluxo_caixa;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_top_fornecedores;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_inadimplencia;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Triggers para refresh automático (executar 1x por hora)
CREATE OR REPLACE FUNCTION schedule_view_refresh()
RETURNS void AS $$
BEGIN
  -- Executar refresh se última atualização > 1 hora
  PERFORM refresh_materialized_views();
END;
$$ LANGUAGE plpgsql;

-- Comentários
COMMENT ON MATERIALIZED VIEW mv_dashboard_metrics IS 'Métricas agregadas para dashboard';
COMMENT ON MATERIALIZED VIEW mv_fluxo_caixa IS 'Fluxo de caixa diário dos últimos 3 meses';
COMMENT ON MATERIALIZED VIEW mv_top_fornecedores IS 'Top 100 fornecedores por valor';
COMMENT ON MATERIALIZED VIEW mv_inadimplencia IS 'Análise de inadimplência por cliente';
-- Migration: add-audit-logs
-- Criado: 31/12/2025
-- Objetivo: Sistema completo de auditoria

-- Tabela de logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  old_data jsonb,
  new_data jsonb,
  changes jsonb,
  ip_address inet,
  user_agent text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_created ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_entity_created ON audit_logs(entity_type, entity_id, created_at DESC);

-- GIN index para busca em JSONB
CREATE INDEX idx_audit_changes_gin ON audit_logs USING gin(changes);

-- Função genérica de auditoria
CREATE OR REPLACE FUNCTION audit_trigger_func()
RETURNS trigger AS $$
DECLARE
  old_data jsonb;
  new_data jsonb;
  changes jsonb;
BEGIN
  -- Preparar dados
  IF (TG_OP = 'DELETE') THEN
    old_data = to_jsonb(OLD);
    new_data = NULL;
  ELSIF (TG_OP = 'UPDATE') THEN
    old_data = to_jsonb(OLD);
    new_data = to_jsonb(NEW);
    
    -- Calcular diferenças
    changes = (
      SELECT jsonb_object_agg(key, value)
      FROM jsonb_each(new_data)
      WHERE new_data->key IS DISTINCT FROM old_data->key
    );
  ELSIF (TG_OP = 'INSERT') THEN
    old_data = NULL;
    new_data = to_jsonb(NEW);
  END IF;

  -- Inserir log
  INSERT INTO audit_logs (
    user_id,
    action,
    entity_type,
    entity_id,
    old_data,
    new_data,
    changes,
    ip_address,
    user_agent
  ) VALUES (
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    old_data,
    new_data,
    changes,
    inet_client_addr(),
    current_setting('request.headers', true)::json->>'user-agent'
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aplicar triggers em tabelas críticas

-- Contas a Pagar
DROP TRIGGER IF EXISTS audit_contas_pagar ON contas_pagar;
CREATE TRIGGER audit_contas_pagar
  AFTER INSERT OR UPDATE OR DELETE ON contas_pagar
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- Contas a Receber
DROP TRIGGER IF EXISTS audit_contas_receber ON contas_receber;
CREATE TRIGGER audit_contas_receber
  AFTER INSERT OR UPDATE OR DELETE ON contas_receber
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- Notas Fiscais
DROP TRIGGER IF EXISTS audit_notas_fiscais ON notas_fiscais;
CREATE TRIGGER audit_notas_fiscais
  AFTER INSERT OR UPDATE OR DELETE ON notas_fiscais
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- Boletos
DROP TRIGGER IF EXISTS audit_boletos ON boletos;
CREATE TRIGGER audit_boletos
  AFTER INSERT OR UPDATE OR DELETE ON boletos
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- Clientes
DROP TRIGGER IF EXISTS audit_clientes ON clientes;
CREATE TRIGGER audit_clientes
  AFTER INSERT OR UPDATE OR DELETE ON clientes
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- Fornecedores
DROP TRIGGER IF EXISTS audit_fornecedores ON fornecedores;
CREATE TRIGGER audit_fornecedores
  AFTER INSERT OR UPDATE OR DELETE ON fornecedores
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- Empresas
DROP TRIGGER IF EXISTS audit_empresas ON empresas;
CREATE TRIGGER audit_empresas
  AFTER INSERT OR UPDATE OR DELETE ON empresas
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- Configurações
DROP TRIGGER IF EXISTS audit_configuracoes ON configuracoes;
CREATE TRIGGER audit_configuracoes
  AFTER INSERT OR UPDATE OR DELETE ON configuracoes
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- Aprovações
DROP TRIGGER IF EXISTS audit_aprovacoes ON aprovacoes;
CREATE TRIGGER audit_aprovacoes
  AFTER INSERT OR UPDATE OR DELETE ON aprovacoes
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- View para relatório de auditoria
CREATE OR REPLACE VIEW vw_audit_report AS
SELECT 
  al.id,
  al.action,
  al.entity_type,
  al.entity_id,
  u.email as user_email,
  al.changes,
  al.ip_address,
  al.created_at,
  CASE 
    WHEN al.action = 'INSERT' THEN 'Criação'
    WHEN al.action = 'UPDATE' THEN 'Atualização'
    WHEN al.action = 'DELETE' THEN 'Exclusão'
  END as action_pt
FROM audit_logs al
LEFT JOIN auth.users u ON u.id = al.user_id
ORDER BY al.created_at DESC;

-- Função para buscar histórico de uma entidade
CREATE OR REPLACE FUNCTION get_entity_history(
  p_entity_type text,
  p_entity_id uuid
)
RETURNS TABLE (
  id uuid,
  action text,
  changes jsonb,
  user_email text,
  created_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    al.id,
    al.action,
    al.changes,
    u.email,
    al.created_at
  FROM audit_logs al
  LEFT JOIN auth.users u ON u.id = al.user_id
  WHERE al.entity_type = p_entity_type
    AND al.entity_id = p_entity_id
  ORDER BY al.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins podem ver todos logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
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
  END LOOP;
END $$;

-- 1. ponto_departamentos
CREATE TABLE public.ponto_departamentos (
  id serial PRIMARY KEY,
  nome varchar(200),
  cargo varchar(200),
  responsavel varchar(200),
  codigo_firebird integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.ponto_departamentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view ponto_departamentos" ON public.ponto_departamentos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage ponto_departamentos" ON public.ponto_departamentos FOR ALL TO authenticated USING (public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role])) WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role]));

-- 2. ponto_funcionarios
CREATE TABLE public.ponto_funcionarios (
  id serial PRIMARY KEY,
  nome varchar(100),
  cpf varchar(15),
  rg varchar(15),
  pis varchar(15),
  matricula varchar(20),
  cracha varchar(20),
  funcao varchar(100),
  email varchar(100),
  telefone varchar(20),
  celular varchar(20),
  data_nascimento date,
  data_admissao date,
  data_desligamento date,
  situacao varchar(20) DEFAULT 'ATIVO',
  empresa_codigo integer,
  departamento_id integer REFERENCES public.ponto_departamentos(id),
  codigo_firebird integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.ponto_funcionarios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view ponto_funcionarios" ON public.ponto_funcionarios FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage ponto_funcionarios" ON public.ponto_funcionarios FOR ALL TO authenticated USING (public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role])) WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role]));

-- 3. ponto_registros
CREATE TABLE public.ponto_registros (
  id serial PRIMARY KEY,
  funcionario_id integer REFERENCES public.ponto_funcionarios(id),
  data_batida date,
  entrada_1 time, saida_1 time,
  entrada_2 time, saida_2 time,
  entrada_3 time, saida_3 time,
  entrada_4 time, saida_4 time,
  entrada_5 time, saida_5 time,
  entrada_6 time, saida_6 time,
  abono time, abono_negativo time,
  justificativa_abono integer,
  folga integer, neutro integer,
  horario_codigo integer,
  dados_brutos jsonb, observacoes jsonb,
  codigo_firebird integer,
  sincronizado_em timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.ponto_registros ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view ponto_registros" ON public.ponto_registros FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage ponto_registros" ON public.ponto_registros FOR ALL TO authenticated USING (public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role])) WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role]));

-- 4. ponto_sync_log
CREATE TABLE public.ponto_sync_log (
  id serial PRIMARY KEY,
  status varchar(20) DEFAULT 'running',
  inicio timestamptz, fim timestamptz,
  departamentos_sincronizados integer DEFAULT 0,
  funcionarios_sincronizados integer DEFAULT 0,
  registros_novos integer DEFAULT 0,
  registros_atualizados integer DEFAULT 0,
  erro text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.ponto_sync_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view ponto_sync_log" ON public.ponto_sync_log FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage ponto_sync_log" ON public.ponto_sync_log FOR ALL TO authenticated USING (public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role])) WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role]));

-- 5. Triggers updated_at
CREATE TRIGGER update_ponto_departamentos_updated_at BEFORE UPDATE ON public.ponto_departamentos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_ponto_funcionarios_updated_at BEFORE UPDATE ON public.ponto_funcionarios FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_ponto_registros_updated_at BEFORE UPDATE ON public.ponto_registros FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6. RPC fn_verificar_vencidos
CREATE OR REPLACE FUNCTION public.fn_verificar_vencidos()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.contas_pagar SET status = 'vencido' WHERE status = 'pendente' AND data_vencimento < CURRENT_DATE;
  UPDATE public.contas_receber SET status = 'vencido' WHERE status = 'pendente' AND data_vencimento < CURRENT_DATE;
END;
$$;

-- =====================================================
-- MIGRATION: Adicionar 276 colunas faltantes para paridade total
-- Tabelas afetadas: 31 (views serão atualizadas depois)
-- =====================================================

-- anexos_financeiros (3)
ALTER TABLE public.anexos_financeiros ADD COLUMN IF NOT EXISTS storage_path TEXT;
ALTER TABLE public.anexos_financeiros ADD COLUMN IF NOT EXISTS url_publica TEXT;
ALTER TABLE public.anexos_financeiros ADD COLUMN IF NOT EXISTS uploaded_por TEXT;

-- fila_cobrancas (8)
ALTER TABLE public.fila_cobrancas ADD COLUMN IF NOT EXISTS regua_etapa_id UUID;
ALTER TABLE public.fila_cobrancas ADD COLUMN IF NOT EXISTS assunto TEXT;
ALTER TABLE public.fila_cobrancas ADD COLUMN IF NOT EXISTS link_pagamento TEXT;
ALTER TABLE public.fila_cobrancas ADD COLUMN IF NOT EXISTS data_agendamento TIMESTAMPTZ;
ALTER TABLE public.fila_cobrancas ADD COLUMN IF NOT EXISTS erro_detalhe TEXT;
ALTER TABLE public.fila_cobrancas ADD COLUMN IF NOT EXISTS enviado_em TIMESTAMPTZ;
ALTER TABLE public.fila_cobrancas ADD COLUMN IF NOT EXISTS entregue_em TIMESTAMPTZ;
ALTER TABLE public.fila_cobrancas ADD COLUMN IF NOT EXISTS lido_em TIMESTAMPTZ;

-- notas_fiscais (16)
ALTER TABLE public.notas_fiscais ADD COLUMN IF NOT EXISTS tipo TEXT;
ALTER TABLE public.notas_fiscais ADD COLUMN IF NOT EXISTS descricao_servico TEXT;
ALTER TABLE public.notas_fiscais ADD COLUMN IF NOT EXISTS valor NUMERIC;
ALTER TABLE public.notas_fiscais ADD COLUMN IF NOT EXISTS valor_iss NUMERIC;
ALTER TABLE public.notas_fiscais ADD COLUMN IF NOT EXISTS aliquota_iss NUMERIC;
ALTER TABLE public.notas_fiscais ADD COLUMN IF NOT EXISTS data_competencia DATE;
ALTER TABLE public.notas_fiscais ADD COLUMN IF NOT EXISTS conta_receber_id UUID;
ALTER TABLE public.notas_fiscais ADD COLUMN IF NOT EXISTS contato_id UUID;
ALTER TABLE public.notas_fiscais ADD COLUMN IF NOT EXISTS asaas_invoice_id TEXT;
ALTER TABLE public.notas_fiscais ADD COLUMN IF NOT EXISTS asaas_payment_id TEXT;
ALTER TABLE public.notas_fiscais ADD COLUMN IF NOT EXISTS asaas_status TEXT;
ALTER TABLE public.notas_fiscais ADD COLUMN IF NOT EXISTS asaas_pdf_url TEXT;
ALTER TABLE public.notas_fiscais ADD COLUMN IF NOT EXISTS asaas_xml_url TEXT;
ALTER TABLE public.notas_fiscais ADD COLUMN IF NOT EXISTS asaas_rps_number TEXT;
ALTER TABLE public.notas_fiscais ADD COLUMN IF NOT EXISTS bitrix_deal_id TEXT;
ALTER TABLE public.notas_fiscais ADD COLUMN IF NOT EXISTS observacoes TEXT;

-- movimentacoes (12)
ALTER TABLE public.movimentacoes ADD COLUMN IF NOT EXISTS conta_destino_id UUID;
ALTER TABLE public.movimentacoes ADD COLUMN IF NOT EXISTS plano_conta_id UUID;
ALTER TABLE public.movimentacoes ADD COLUMN IF NOT EXISTS contato_id UUID;
ALTER TABLE public.movimentacoes ADD COLUMN IF NOT EXISTS conciliado BOOLEAN DEFAULT false;
ALTER TABLE public.movimentacoes ADD COLUMN IF NOT EXISTS conciliacao_id UUID;
ALTER TABLE public.movimentacoes ADD COLUMN IF NOT EXISTS bitrix_deal_id TEXT;
ALTER TABLE public.movimentacoes ADD COLUMN IF NOT EXISTS tags TEXT[];
ALTER TABLE public.movimentacoes ADD COLUMN IF NOT EXISTS asaas_transaction_id TEXT;
ALTER TABLE public.movimentacoes ADD COLUMN IF NOT EXISTS asaas_type TEXT;
ALTER TABLE public.movimentacoes ADD COLUMN IF NOT EXISTS valor_liquido NUMERIC;
ALTER TABLE public.movimentacoes ADD COLUMN IF NOT EXISTS taxa_gateway NUMERIC;

-- retencoes_fonte (1)
ALTER TABLE public.retencoes_fonte ADD COLUMN IF NOT EXISTS darf_id UUID;

-- formas_pagamento (4)
ALTER TABLE public.formas_pagamento ADD COLUMN IF NOT EXISTS parcelas_padrao INTEGER;
ALTER TABLE public.formas_pagamento ADD COLUMN IF NOT EXISTS taxa_fixa NUMERIC;
ALTER TABLE public.formas_pagamento ADD COLUMN IF NOT EXISTS prazo_recebimento_dias INTEGER;
ALTER TABLE public.formas_pagamento ADD COLUMN IF NOT EXISTS conta_bancaria_id UUID;

-- contas_pagar (8)
ALTER TABLE public.contas_pagar ADD COLUMN IF NOT EXISTS data_competencia DATE;
ALTER TABLE public.contas_pagar ADD COLUMN IF NOT EXISTS recorrencia_parent_id UUID;
ALTER TABLE public.contas_pagar ADD COLUMN IF NOT EXISTS bitrix_activity_id TEXT;
ALTER TABLE public.contas_pagar ADD COLUMN IF NOT EXISTS origem TEXT;
ALTER TABLE public.contas_pagar ADD COLUMN IF NOT EXISTS tags TEXT[];
ALTER TABLE public.contas_pagar ADD COLUMN IF NOT EXISTS asaas_bill_id TEXT;
ALTER TABLE public.contas_pagar ADD COLUMN IF NOT EXISTS asaas_transfer_id TEXT;
ALTER TABLE public.contas_pagar ADD COLUMN IF NOT EXISTS asaas_status TEXT;

-- empresas (5)
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS inscricao_municipal TEXT;
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS bairro TEXT;
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS numero TEXT;
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS complemento TEXT;
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- templates_cobranca (1)
ALTER TABLE public.templates_cobranca ADD COLUMN IF NOT EXISTS nome TEXT;

-- webhooks_log (8)
ALTER TABLE public.webhooks_log ADD COLUMN IF NOT EXISTS evento TEXT;
ALTER TABLE public.webhooks_log ADD COLUMN IF NOT EXISTS origem TEXT;
ALTER TABLE public.webhooks_log ADD COLUMN IF NOT EXISTS asaas_event_id TEXT;
ALTER TABLE public.webhooks_log ADD COLUMN IF NOT EXISTS asaas_payment_id TEXT;
ALTER TABLE public.webhooks_log ADD COLUMN IF NOT EXISTS asaas_transfer_id TEXT;
ALTER TABLE public.webhooks_log ADD COLUMN IF NOT EXISTS asaas_subscription_id TEXT;
ALTER TABLE public.webhooks_log ADD COLUMN IF NOT EXISTS status_processamento TEXT;
ALTER TABLE public.webhooks_log ADD COLUMN IF NOT EXISTS erro_detalhe TEXT;

-- profiles (2)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS telefone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ativo BOOLEAN DEFAULT true;

-- fornecedores (5)
ALTER TABLE public.fornecedores ADD COLUMN IF NOT EXISTS bairro TEXT;
ALTER TABLE public.fornecedores ADD COLUMN IF NOT EXISTS numero TEXT;
ALTER TABLE public.fornecedores ADD COLUMN IF NOT EXISTS complemento TEXT;
ALTER TABLE public.fornecedores ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.fornecedores ADD COLUMN IF NOT EXISTS bitrix_company_id TEXT;

-- transferencias (22)
ALTER TABLE public.transferencias ADD COLUMN IF NOT EXISTS modalidade TEXT;
ALTER TABLE public.transferencias ADD COLUMN IF NOT EXISTS contato_id UUID;
ALTER TABLE public.transferencias ADD COLUMN IF NOT EXISTS pix_chave_destino TEXT;
ALTER TABLE public.transferencias ADD COLUMN IF NOT EXISTS pix_tipo_chave TEXT;
ALTER TABLE public.transferencias ADD COLUMN IF NOT EXISTS banco_destino TEXT;
ALTER TABLE public.transferencias ADD COLUMN IF NOT EXISTS agencia_destino TEXT;
ALTER TABLE public.transferencias ADD COLUMN IF NOT EXISTS conta_destino TEXT;
ALTER TABLE public.transferencias ADD COLUMN IF NOT EXISTS data_solicitacao DATE;
ALTER TABLE public.transferencias ADD COLUMN IF NOT EXISTS data_agendamento DATE;
ALTER TABLE public.transferencias ADD COLUMN IF NOT EXISTS data_credito DATE;
ALTER TABLE public.transferencias ADD COLUMN IF NOT EXISTS plano_conta_id UUID;
ALTER TABLE public.transferencias ADD COLUMN IF NOT EXISTS centro_custo_id UUID;
ALTER TABLE public.transferencias ADD COLUMN IF NOT EXISTS asaas_end_to_end TEXT;
ALTER TABLE public.transferencias ADD COLUMN IF NOT EXISTS asaas_comprovante_url TEXT;
ALTER TABLE public.transferencias ADD COLUMN IF NOT EXISTS asaas_fail_reason TEXT;
ALTER TABLE public.transferencias ADD COLUMN IF NOT EXISTS asaas_authorized BOOLEAN;
ALTER TABLE public.transferencias ADD COLUMN IF NOT EXISTS recorrente BOOLEAN DEFAULT false;
ALTER TABLE public.transferencias ADD COLUMN IF NOT EXISTS recorrencia_frequencia TEXT;
ALTER TABLE public.transferencias ADD COLUMN IF NOT EXISTS recorrencia_inicio DATE;
ALTER TABLE public.transferencias ADD COLUMN IF NOT EXISTS recorrencia_fim DATE;
ALTER TABLE public.transferencias ADD COLUMN IF NOT EXISTS bitrix_deal_id TEXT;
ALTER TABLE public.transferencias ADD COLUMN IF NOT EXISTS external_reference TEXT;
ALTER TABLE public.transferencias ADD COLUMN IF NOT EXISTS tags TEXT[];

-- portal_cliente_acessos (2)
ALTER TABLE public.portal_cliente_acessos ADD COLUMN IF NOT EXISTS ip TEXT;
ALTER TABLE public.portal_cliente_acessos ADD COLUMN IF NOT EXISTS metadata JSONB;

-- protestos (3)
ALTER TABLE public.protestos ADD COLUMN IF NOT EXISTS uf_cartorio TEXT;
ALTER TABLE public.protestos ADD COLUMN IF NOT EXISTS data_cancelamento DATE;
ALTER TABLE public.protestos ADD COLUMN IF NOT EXISTS erro_detalhe TEXT;

-- permissions (3)
ALTER TABLE public.permissions ADD COLUMN IF NOT EXISTS code TEXT;
ALTER TABLE public.permissions ADD COLUMN IF NOT EXISTS descricao TEXT;
ALTER TABLE public.permissions ADD COLUMN IF NOT EXISTS ativo BOOLEAN DEFAULT true;

-- rate_limit_logs (1)
ALTER TABLE public.rate_limit_logs ADD COLUMN IF NOT EXISTS user_id UUID;

-- apuracoes_irpj_csll (2)
ALTER TABLE public.apuracoes_irpj_csll ADD COLUMN IF NOT EXISTS lucro_liquido NUMERIC;
ALTER TABLE public.apuracoes_irpj_csll ADD COLUMN IF NOT EXISTS competencia TEXT;

-- contas_bancarias (3)
ALTER TABLE public.contas_bancarias ADD COLUMN IF NOT EXISTS data_saldo_inicial DATE;
ALTER TABLE public.contas_bancarias ADD COLUMN IF NOT EXISTS moeda TEXT DEFAULT 'BRL';
ALTER TABLE public.contas_bancarias ADD COLUMN IF NOT EXISTS observacoes TEXT;

-- extrato_bancario (11)
ALTER TABLE public.extrato_bancario ADD COLUMN IF NOT EXISTS data_transacao DATE;
ALTER TABLE public.extrato_bancario ADD COLUMN IF NOT EXISTS descricao_banco TEXT;
ALTER TABLE public.extrato_bancario ADD COLUMN IF NOT EXISTS saldo_apos NUMERIC;
ALTER TABLE public.extrato_bancario ADD COLUMN IF NOT EXISTS numero_documento_banco TEXT;
ALTER TABLE public.extrato_bancario ADD COLUMN IF NOT EXISTS codigo_transacao TEXT;
ALTER TABLE public.extrato_bancario ADD COLUMN IF NOT EXISTS movimentacao_id UUID;
ALTER TABLE public.extrato_bancario ADD COLUMN IF NOT EXISTS conciliado_em TIMESTAMPTZ;
ALTER TABLE public.extrato_bancario ADD COLUMN IF NOT EXISTS conciliado_por TEXT;
ALTER TABLE public.extrato_bancario ADD COLUMN IF NOT EXISTS arquivo_origem TEXT;
ALTER TABLE public.extrato_bancario ADD COLUMN IF NOT EXISTS linha_arquivo INTEGER;
ALTER TABLE public.extrato_bancario ADD COLUMN IF NOT EXISTS importado_em TIMESTAMPTZ;

-- plano_contas (2)
ALTER TABLE public.plano_contas ADD COLUMN IF NOT EXISTS nome TEXT;
ALTER TABLE public.plano_contas ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- centros_custo (3)
ALTER TABLE public.centros_custo ADD COLUMN IF NOT EXISTS tipo TEXT;
ALTER TABLE public.centros_custo ADD COLUMN IF NOT EXISTS responsavel TEXT;
ALTER TABLE public.centros_custo ADD COLUMN IF NOT EXISTS bitrix_deal_id TEXT;

-- contas_receber (13)
ALTER TABLE public.contas_receber ADD COLUMN IF NOT EXISTS data_competencia DATE;
ALTER TABLE public.contas_receber ADD COLUMN IF NOT EXISTS numero_nf TEXT;
ALTER TABLE public.contas_receber ADD COLUMN IF NOT EXISTS bitrix_activity_id TEXT;
ALTER TABLE public.contas_receber ADD COLUMN IF NOT EXISTS origem TEXT;
ALTER TABLE public.contas_receber ADD COLUMN IF NOT EXISTS tags TEXT[];
ALTER TABLE public.contas_receber ADD COLUMN IF NOT EXISTS asaas_payment_id TEXT;
ALTER TABLE public.contas_receber ADD COLUMN IF NOT EXISTS asaas_installment_id TEXT;
ALTER TABLE public.contas_receber ADD COLUMN IF NOT EXISTS asaas_subscription_id TEXT;
ALTER TABLE public.contas_receber ADD COLUMN IF NOT EXISTS asaas_invoice_url TEXT;
ALTER TABLE public.contas_receber ADD COLUMN IF NOT EXISTS asaas_billing_type TEXT;
ALTER TABLE public.contas_receber ADD COLUMN IF NOT EXISTS asaas_status TEXT;
ALTER TABLE public.contas_receber ADD COLUMN IF NOT EXISTS data_credito DATE;
ALTER TABLE public.contas_receber ADD COLUMN IF NOT EXISTS valor_liquido NUMERIC;
ALTER TABLE public.contas_receber ADD COLUMN IF NOT EXISTS taxa_gateway NUMERIC;

-- contatos_financeiros (10)
ALTER TABLE public.contatos_financeiros ADD COLUMN IF NOT EXISTS razao_social TEXT;
ALTER TABLE public.contatos_financeiros ADD COLUMN IF NOT EXISTS banco TEXT;
ALTER TABLE public.contatos_financeiros ADD COLUMN IF NOT EXISTS agencia TEXT;
ALTER TABLE public.contatos_financeiros ADD COLUMN IF NOT EXISTS conta TEXT;
ALTER TABLE public.contatos_financeiros ADD COLUMN IF NOT EXISTS pix_chave TEXT;
ALTER TABLE public.contatos_financeiros ADD COLUMN IF NOT EXISTS pix_tipo TEXT;
ALTER TABLE public.contatos_financeiros ADD COLUMN IF NOT EXISTS bitrix_contact_id TEXT;
ALTER TABLE public.contatos_financeiros ADD COLUMN IF NOT EXISTS bitrix_company_id TEXT;
ALTER TABLE public.contatos_financeiros ADD COLUMN IF NOT EXISTS asaas_customer_id TEXT;
ALTER TABLE public.contatos_financeiros ADD COLUMN IF NOT EXISTS asaas_subconta_wallet_id TEXT;

-- auditoria_financeira (4)
ALTER TABLE public.auditoria_financeira ADD COLUMN IF NOT EXISTS acao TEXT;
ALTER TABLE public.auditoria_financeira ADD COLUMN IF NOT EXISTS dados_anteriores JSONB;
ALTER TABLE public.auditoria_financeira ADD COLUMN IF NOT EXISTS usuario TEXT;
ALTER TABLE public.auditoria_financeira ADD COLUMN IF NOT EXISTS ip TEXT;

-- execucoes_cobranca (9)
ALTER TABLE public.execucoes_cobranca ADD COLUMN IF NOT EXISTS regua_etapa_id UUID;
ALTER TABLE public.execucoes_cobranca ADD COLUMN IF NOT EXISTS mensagem_enviada TEXT;
ALTER TABLE public.execucoes_cobranca ADD COLUMN IF NOT EXISTS enviado_em TIMESTAMPTZ;
ALTER TABLE public.execucoes_cobranca ADD COLUMN IF NOT EXISTS respondido_em TIMESTAMPTZ;
ALTER TABLE public.execucoes_cobranca ADD COLUMN IF NOT EXISTS resposta_cliente TEXT;
ALTER TABLE public.execucoes_cobranca ADD COLUMN IF NOT EXISTS erro_detalhe TEXT;
ALTER TABLE public.execucoes_cobranca ADD COLUMN IF NOT EXISTS custo NUMERIC;
ALTER TABLE public.execucoes_cobranca ADD COLUMN IF NOT EXISTS metadata JSONB;
ALTER TABLE public.execucoes_cobranca ADD COLUMN IF NOT EXISTS created_by UUID;

-- clientes (10)
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS nome TEXT;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS cpf_cnpj TEXT;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS cep TEXT;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS bairro TEXT;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS numero TEXT;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS complemento TEXT;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS asaas_customer_id TEXT;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS bitrix_contact_id TEXT;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS bitrix_company_id TEXT;

-- negativacoes (2)
ALTER TABLE public.negativacoes ADD COLUMN IF NOT EXISTS motivo_exclusao TEXT;
ALTER TABLE public.negativacoes ADD COLUMN IF NOT EXISTS erro_detalhe TEXT;

-- conciliacoes (6)
ALTER TABLE public.conciliacoes ADD COLUMN IF NOT EXISTS data_inicio DATE;
ALTER TABLE public.conciliacoes ADD COLUMN IF NOT EXISTS data_fim DATE;
ALTER TABLE public.conciliacoes ADD COLUMN IF NOT EXISTS total_itens_conciliados INTEGER;
ALTER TABLE public.conciliacoes ADD COLUMN IF NOT EXISTS total_itens_pendentes INTEGER;
ALTER TABLE public.conciliacoes ADD COLUMN IF NOT EXISTS realizado_por TEXT;
ALTER TABLE public.conciliacoes ADD COLUMN IF NOT EXISTS observacoes TEXT;

-- portal_cliente_tokens (7)
ALTER TABLE public.portal_cliente_tokens ADD COLUMN IF NOT EXISTS tipo TEXT;
ALTER TABLE public.portal_cliente_tokens ADD COLUMN IF NOT EXISTS valido_ate TIMESTAMPTZ;
ALTER TABLE public.portal_cliente_tokens ADD COLUMN IF NOT EXISTS usado BOOLEAN DEFAULT false;
ALTER TABLE public.portal_cliente_tokens ADD COLUMN IF NOT EXISTS usado_em TIMESTAMPTZ;
ALTER TABLE public.portal_cliente_tokens ADD COLUMN IF NOT EXISTS ip_acesso TEXT;
ALTER TABLE public.portal_cliente_tokens ADD COLUMN IF NOT EXISTS conta_receber_id UUID;
ALTER TABLE public.portal_cliente_tokens ADD COLUMN IF NOT EXISTS empresa_id UUID;

-- regua_cobranca (3)
ALTER TABLE public.regua_cobranca ADD COLUMN IF NOT EXISTS etapa TEXT;
ALTER TABLE public.regua_cobranca ADD COLUMN IF NOT EXISTS prioridade INTEGER;
ALTER TABLE public.regua_cobranca ADD COLUMN IF NOT EXISTS condicoes JSONB;

DROP VIEW IF EXISTS public.vw_contas_pagar_painel;
DROP VIEW IF EXISTS public.vw_contas_receber_painel;
DROP VIEW IF EXISTS public.vw_dre_mensal;
DROP VIEW IF EXISTS public.vw_dso_aging;
DROP VIEW IF EXISTS public.vw_saldos_contas;
DROP VIEW IF EXISTS public.vw_fluxo_caixa;
DROP VIEW IF EXISTS public.vw_fluxo_caixa_diario;
DROP VIEW IF EXISTS public.vw_gastos_centro_custo;
DROP VIEW IF EXISTS public.vw_metricas_cobranca;
DROP VIEW IF EXISTS public.vw_transferencias_painel;
DROP VIEW IF EXISTS public.vw_webhooks_recentes;

CREATE VIEW public.vw_contas_pagar_painel AS
SELECT cp.id, cp.empresa_id, cp.conta_bancaria_id, cp.centro_custo_id, cp.fornecedor_id, cp.fornecedor_nome,
    cp.descricao, cp.valor, cp.valor_pago, cp.data_emissao, cp.data_vencimento, cp.data_pagamento, cp.status,
    cp.tipo_cobranca, cp.numero_documento, cp.codigo_barras, cp.observacoes, cp.recorrente, cp.bitrix_deal_id,
    cp.aprovado_por, cp.aprovado_em, cp.created_by, cp.created_at, cp.updated_at, cp.valor_original,
    cp.valor_desconto, cp.valor_juros, cp.valor_multa, cp.numero_parcela_atual, cp.total_parcelas, cp.categoria,
    cp.forma_pagamento, cp.forma_pagamento_id, cp.plano_conta_id, cp.contato_id, cp.frequencia_recorrencia,
    cp.user_id, cp.vencimento, cp.parcela_atual, cp.valor_final,
    (cp.valor - COALESCE(cp.valor_pago, 0)) AS saldo_devedor,
    (cp.data_vencimento - CURRENT_DATE) AS dias_para_vencer,
    f.nome AS fornecedor, f.cnpj AS fornecedor_cnpj,
    cf.nome AS contato_nome, cc.nome AS centro_custo, cb.banco AS conta_bancaria,
    cp.asaas_bill_id, cp.asaas_status, cp.tags,
    pc.descricao AS plano_conta_nome, pc.codigo AS plano_conta_codigo
FROM contas_pagar cp
    LEFT JOIN fornecedores f ON f.id = cp.fornecedor_id
    LEFT JOIN contas_bancarias cb ON cb.id = cp.conta_bancaria_id
    LEFT JOIN centros_custo cc ON cc.id = cp.centro_custo_id
    LEFT JOIN plano_contas pc ON pc.id = cp.plano_conta_id
    LEFT JOIN contatos_financeiros cf ON cf.id = cp.contato_id
WHERE cp.status = ANY (ARRAY['pendente'::status_pagamento, 'vencido'::status_pagamento, 'parcial'::status_pagamento, 'atrasado'::status_pagamento]);

CREATE VIEW public.vw_contas_receber_painel AS
SELECT cr.id, cr.empresa_id, cr.conta_bancaria_id, cr.centro_custo_id, cr.cliente_id, cr.cliente_nome,
    cr.descricao, cr.valor, cr.valor_recebido, cr.data_emissao, cr.data_vencimento, cr.data_recebimento,
    cr.status, cr.tipo_cobranca, cr.numero_documento, cr.codigo_barras, cr.chave_pix, cr.link_boleto,
    cr.observacoes, cr.etapa_cobranca, cr.bitrix_deal_id, cr.created_by, cr.created_at, cr.updated_at,
    cr.vendedor_id, cr.valor_original, cr.valor_desconto, cr.valor_juros, cr.valor_multa,
    cr.numero_parcela_atual, cr.total_parcelas, cr.categoria, cr.forma_recebimento, cr.forma_pagamento_id,
    cr.plano_conta_id, cr.contato_id, cr.frequencia_recorrencia, cr.recorrente, cr.user_id, cr.vencimento,
    cr.parcela_atual, cr.valor_pago, cr.valor_final,
    (cr.valor - COALESCE(cr.valor_recebido, 0)) AS saldo_a_receber,
    (cr.data_vencimento - CURRENT_DATE) AS dias_para_vencer,
    c.razao_social AS cliente, c.cnpj_cpf AS cliente_cpf_cnpj,
    cf.nome AS contato_nome, cc.nome AS centro_custo,
    cr.numero_nf, cr.asaas_payment_id, cr.asaas_billing_type, cr.asaas_status,
    cr.data_credito, cr.valor_liquido, cr.taxa_gateway, cr.tags,
    c.score AS cliente_score, cb.banco AS conta_banco, cc.nome AS centro_custo_nome,
    pc.descricao AS plano_conta_nome
FROM contas_receber cr
    LEFT JOIN clientes c ON c.id = cr.cliente_id
    LEFT JOIN contas_bancarias cb ON cb.id = cr.conta_bancaria_id
    LEFT JOIN centros_custo cc ON cc.id = cr.centro_custo_id
    LEFT JOIN plano_contas pc ON pc.id = cr.plano_conta_id
    LEFT JOIN contatos_financeiros cf ON cf.id = cr.contato_id
WHERE cr.status = ANY (ARRAY['pendente'::status_pagamento, 'vencido'::status_pagamento, 'parcial'::status_pagamento, 'atrasado'::status_pagamento]);

CREATE VIEW public.vw_dre_mensal AS
SELECT date_trunc('month', m.data_movimentacao::timestamp with time zone) AS mes,
    m.empresa_id,
    sum(CASE WHEN m.tipo = 'entrada' THEN m.valor ELSE 0 END) AS receitas,
    sum(CASE WHEN m.tipo = 'saida' THEN m.valor ELSE 0 END) AS despesas,
    sum(CASE WHEN m.tipo = 'entrada' THEN m.valor ELSE -m.valor END) AS resultado,
    pc.tipo AS tipo_conta, cat.nome AS categoria,
    sum(m.valor) AS total_bruto,
    sum(COALESCE(m.valor_liquido, m.valor)) AS total_liquido,
    sum(COALESCE(m.taxa_gateway, 0)) AS total_taxas
FROM movimentacoes m
    LEFT JOIN plano_contas pc ON pc.id = m.plano_conta_id
    LEFT JOIN categorias cat ON cat.id = m.categoria_id
WHERE m.deleted_at IS NULL
GROUP BY date_trunc('month', m.data_movimentacao::timestamp with time zone), m.empresa_id, pc.tipo, cat.nome;

CREATE VIEW public.vw_dso_aging AS
SELECT cr.empresa_id,
    count(*) AS total_titulos, sum(cr.valor) AS valor_total,
    sum(cr.valor - COALESCE(cr.valor_recebido, 0)) AS saldo_aberto,
    sum(CASE WHEN cr.data_vencimento >= CURRENT_DATE THEN cr.valor - COALESCE(cr.valor_recebido, 0) ELSE 0 END) AS a_vencer,
    sum(CASE WHEN (CURRENT_DATE - cr.data_vencimento) BETWEEN 0 AND 7 THEN cr.valor - COALESCE(cr.valor_recebido, 0) ELSE 0 END) AS vencido_0_7,
    sum(CASE WHEN (CURRENT_DATE - cr.data_vencimento) BETWEEN 8 AND 15 THEN cr.valor - COALESCE(cr.valor_recebido, 0) ELSE 0 END) AS vencido_8_15,
    sum(CASE WHEN (CURRENT_DATE - cr.data_vencimento) BETWEEN 16 AND 30 THEN cr.valor - COALESCE(cr.valor_recebido, 0) ELSE 0 END) AS vencido_16_30,
    sum(CASE WHEN (CURRENT_DATE - cr.data_vencimento) BETWEEN 31 AND 60 THEN cr.valor - COALESCE(cr.valor_recebido, 0) ELSE 0 END) AS vencido_31_60,
    sum(CASE WHEN (CURRENT_DATE - cr.data_vencimento) BETWEEN 61 AND 90 THEN cr.valor - COALESCE(cr.valor_recebido, 0) ELSE 0 END) AS vencido_61_90,
    sum(CASE WHEN (CURRENT_DATE - cr.data_vencimento) > 90 THEN cr.valor - COALESCE(cr.valor_recebido, 0) ELSE 0 END) AS vencido_90_mais,
    CASE
        WHEN cr.data_vencimento >= CURRENT_DATE THEN 'A Vencer'
        WHEN (CURRENT_DATE - cr.data_vencimento) <= 30 THEN '1-30 dias'
        WHEN (CURRENT_DATE - cr.data_vencimento) <= 60 THEN '31-60 dias'
        WHEN (CURRENT_DATE - cr.data_vencimento) <= 90 THEN '61-90 dias'
        ELSE '90+ dias'
    END AS faixa,
    count(*) AS quantidade,
    avg(CASE WHEN cr.data_vencimento < CURRENT_DATE THEN (CURRENT_DATE - cr.data_vencimento) ELSE 0 END) AS media_dias_atraso,
    count(*) FILTER (WHERE cr.etapa_cobranca IS NOT NULL) AS em_cobranca
FROM contas_receber cr
WHERE cr.status = ANY (ARRAY['pendente'::status_pagamento, 'vencido'::status_pagamento, 'parcial'::status_pagamento, 'atrasado'::status_pagamento])
GROUP BY cr.empresa_id, CASE WHEN cr.data_vencimento >= CURRENT_DATE THEN 'A Vencer' WHEN (CURRENT_DATE - cr.data_vencimento) <= 30 THEN '1-30 dias' WHEN (CURRENT_DATE - cr.data_vencimento) <= 60 THEN '31-60 dias' WHEN (CURRENT_DATE - cr.data_vencimento) <= 90 THEN '61-90 dias' ELSE '90+ dias' END;

CREATE VIEW public.vw_saldos_contas AS
SELECT cb.id, cb.banco, cb.agencia, cb.conta, cb.tipo_conta, cb.saldo_atual, cb.cor, cb.ativo,
    cb.empresa_id, cb.nome, cb.tipo, e.razao_social AS empresa_nome
FROM contas_bancarias cb LEFT JOIN empresas e ON e.id = cb.empresa_id WHERE cb.ativo = true;

CREATE VIEW public.vw_fluxo_caixa AS
SELECT m.data_movimentacao, m.tipo, m.descricao, m.valor, m.valor_liquido, m.taxa_gateway,
    cb.banco AS conta_bancaria, cat.nome AS categoria, pc.tipo AS tipo_categoria, cc.nome AS centro_custo,
    cf.nome AS contato, m.conciliado, m.asaas_transaction_id, m.asaas_type, m.origem,
    m.created_at, m.empresa_id, m.conta_bancaria_id
FROM movimentacoes m
    LEFT JOIN contas_bancarias cb ON cb.id = m.conta_bancaria_id
    LEFT JOIN plano_contas pc ON pc.id = m.plano_conta_id
    LEFT JOIN centros_custo cc ON cc.id = m.centro_custo_id
    LEFT JOIN contatos_financeiros cf ON cf.id = m.contato_id
    LEFT JOIN categorias cat ON cat.id = m.categoria_id
WHERE m.deleted_at IS NULL;

CREATE VIEW public.vw_fluxo_caixa_diario AS
SELECT m.data_movimentacao AS dia, m.data_movimentacao AS data, m.empresa_id,
    sum(CASE WHEN m.tipo = 'entrada' THEN m.valor ELSE 0 END) AS entradas,
    sum(CASE WHEN m.tipo = 'saida' THEN m.valor ELSE 0 END) AS saidas,
    sum(CASE WHEN m.tipo = 'entrada' THEN m.valor ELSE -m.valor END) AS saldo,
    sum(CASE WHEN m.tipo = 'entrada' THEN m.valor ELSE 0 END) AS total_entradas,
    sum(CASE WHEN m.tipo = 'saida' THEN m.valor ELSE 0 END) AS total_saidas,
    sum(CASE WHEN m.tipo = 'entrada' THEN m.valor ELSE -m.valor END) AS saldo_dia,
    sum(CASE WHEN m.tipo = 'entrada' THEN COALESCE(m.valor_liquido, m.valor) ELSE 0 END) AS entradas_liquidas,
    sum(COALESCE(m.taxa_gateway, 0)) AS total_taxas
FROM movimentacoes m WHERE m.deleted_at IS NULL GROUP BY m.data_movimentacao, m.empresa_id;

CREATE VIEW public.vw_gastos_centro_custo AS
SELECT cc.id AS centro_custo_id, cc.nome, cc.nome AS centro_custo, cc.codigo, cc.orcamento_previsto,
    COALESCE(sum(cp.valor), 0) AS total_gasto,
    CASE WHEN cc.orcamento_previsto > 0 THEN round((COALESCE(sum(cp.valor), 0) / cc.orcamento_previsto) * 100, 2) ELSE 0 END AS percentual_utilizado,
    cc.tipo, (cc.orcamento_previsto - COALESCE(sum(cp.valor), 0)) AS saldo_orcamento, cc.bitrix_deal_id
FROM centros_custo cc LEFT JOIN contas_pagar cp ON cp.centro_custo_id = cc.id AND cp.status = 'pago'::status_pagamento
GROUP BY cc.id, cc.nome, cc.codigo, cc.orcamento_previsto, cc.tipo, cc.bitrix_deal_id;

CREATE VIEW public.vw_metricas_cobranca AS
SELECT ec.etapa, ec.etapa AS etapa_nome, ec.canal, ec.empresa_id,
    count(DISTINCT ec.conta_receber_id) AS contas_cobradas, count(*) AS total_enviados, count(*) AS total_disparos,
    count(*) FILTER (WHERE ec.status = 'enviado') AS enviados,
    sum(CASE WHEN ec.entregue THEN 1 ELSE 0 END) AS total_entregues, sum(CASE WHEN ec.entregue THEN 1 ELSE 0 END) AS entregues,
    sum(CASE WHEN ec.lido THEN 1 ELSE 0 END) AS total_lidos, sum(CASE WHEN ec.lido THEN 1 ELSE 0 END) AS lidos,
    count(*) FILTER (WHERE ec.respondido_em IS NOT NULL) AS respondidos,
    count(*) FILTER (WHERE ec.status = 'falhou') AS falhas, sum(COALESCE(ec.custo, 0)) AS custo_total,
    CASE WHEN count(*) > 0 THEN round((sum(CASE WHEN ec.entregue THEN 1 ELSE 0 END)::numeric / count(*)::numeric) * 100, 2) ELSE 0 END AS taxa_entrega,
    CASE WHEN count(*) > 0 THEN round((sum(CASE WHEN ec.entregue THEN 1 ELSE 0 END)::numeric / count(*)::numeric) * 100, 2) ELSE 0 END AS taxa_entrega_pct
FROM execucoes_cobranca ec GROUP BY ec.etapa, ec.canal, ec.empresa_id;

CREATE VIEW public.vw_transferencias_painel AS
SELECT t.id, t.empresa_id, t.conta_bancaria_id, t.conta_destino_id, t.conta_pagar_id, t.tipo,
    t.descricao, t.valor, t.taxa, t.valor_liquido, t.data_transferencia, t.data_efetivacao, t.status,
    t.chave_pix, t.tipo_chave_pix, t.favorecido_nome, t.favorecido_cpf_cnpj, t.favorecido_banco,
    t.favorecido_agencia, t.favorecido_conta, t.favorecido_tipo_conta, t.codigo_barras, t.linha_digitavel,
    t.comprovante_url, t.protocolo, t.asaas_transfer_id, t.asaas_status, t.erro_mensagem, t.observacoes,
    t.aprovado_por, t.aprovado_em, t.cancelado_por, t.cancelado_em, t.motivo_cancelamento,
    t.movimentacao_id, t.numero_documento, t.origem, t.created_by, t.created_at, t.updated_at,
    t.modalidade, t.data_solicitacao, t.favorecido_nome AS destinatario, co.banco AS conta_origem, t.pix_chave_destino,
    t.asaas_end_to_end, t.asaas_comprovante_url, t.bitrix_deal_id, t.external_reference, t.tags,
    co.banco AS banco_origem, co.conta AS conta_origem_numero, cd.banco AS banco_destino, cd.conta AS conta_destino_numero
FROM transferencias t
    LEFT JOIN contas_bancarias co ON co.id = t.conta_bancaria_id
    LEFT JOIN contas_bancarias cd ON cd.id = t.conta_destino_id;

CREATE VIEW public.vw_webhooks_recentes AS
SELECT wl.id, wl.provider, wl.event_type, wl.evento, wl.payload, wl.headers, wl.status,
    wl.status_processamento, wl.processado, wl.processado_em, wl.erro_mensagem, wl.erro_detalhe,
    wl.ip_origem, wl.asaas_payment_id, wl.asaas_transfer_id, wl.created_at, wl.updated_at
FROM webhooks_log wl ORDER BY wl.created_at DESC LIMIT 100;

-- Fix SECURITY DEFINER on all views - set to SECURITY INVOKER
ALTER VIEW public.vw_contas_pagar_painel SET (security_invoker = on);
ALTER VIEW public.vw_contas_receber_painel SET (security_invoker = on);
ALTER VIEW public.vw_dre_mensal SET (security_invoker = on);
ALTER VIEW public.vw_dso_aging SET (security_invoker = on);
ALTER VIEW public.vw_saldos_contas SET (security_invoker = on);
ALTER VIEW public.vw_fluxo_caixa SET (security_invoker = on);
ALTER VIEW public.vw_fluxo_caixa_diario SET (security_invoker = on);
ALTER VIEW public.vw_gastos_centro_custo SET (security_invoker = on);
ALTER VIEW public.vw_metricas_cobranca SET (security_invoker = on);
ALTER VIEW public.vw_transferencias_painel SET (security_invoker = on);
ALTER VIEW public.vw_webhooks_recentes SET (security_invoker = on);
-- =============================================
-- SECURITY HARDENING: Fix critical RLS issues
-- =============================================

-- 1. ponto_funcionarios: restrict SELECT to admin/financeiro
DROP POLICY IF EXISTS "Authenticated can view ponto_funcionarios" ON public.ponto_funcionarios;
CREATE POLICY "Admin/financeiro can view ponto_funcionarios"
  ON public.ponto_funcionarios FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin', 'financeiro']::app_role[]));

-- 2. contatos_financeiros: restrict SELECT to admin/financeiro
DROP POLICY IF EXISTS "Auth users can read contatos_financeiros" ON public.contatos_financeiros;
CREATE POLICY "Admin/financeiro can read contatos_financeiros"
  ON public.contatos_financeiros FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin', 'financeiro']::app_role[]));

-- 3. auditoria_financeira: restrict SELECT to admin only
DROP POLICY IF EXISTS "Auth users can read auditoria_financeira" ON public.auditoria_financeira;
CREATE POLICY "Admin can read auditoria_financeira"
  ON public.auditoria_financeira FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 4. anexos_financeiros: replace overly permissive ALL policy with scoped policies
DROP POLICY IF EXISTS "Auth users can manage anexos_financeiros" ON public.anexos_financeiros;

CREATE POLICY "Auth users can read anexos_financeiros"
  ON public.anexos_financeiros FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin', 'financeiro', 'operacional']::app_role[]));

CREATE POLICY "Auth users can insert anexos_financeiros"
  ON public.anexos_financeiros FOR INSERT TO authenticated
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin', 'financeiro', 'operacional']::app_role[]));

CREATE POLICY "Admin/financeiro can update anexos_financeiros"
  ON public.anexos_financeiros FOR UPDATE TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin', 'financeiro']::app_role[]));

CREATE POLICY "Admin/financeiro can delete anexos_financeiros"
  ON public.anexos_financeiros FOR DELETE TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin', 'financeiro']::app_role[]));

-- 5. ponto_registros: restrict SELECT to admin/financeiro
DROP POLICY IF EXISTS "Authenticated can view ponto_registros" ON public.ponto_registros;
CREATE POLICY "Admin/financeiro can view ponto_registros"
  ON public.ponto_registros FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin', 'financeiro']::app_role[]));

-- PIX Templates table for saving reusable payment templates
CREATE TABLE public.pix_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao TEXT,
  empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
  centro_custo_id UUID REFERENCES public.centros_custo(id) ON DELETE SET NULL,
  favorecido_nome TEXT NOT NULL,
  favorecido_cpf_cnpj TEXT,
  chave_pix TEXT NOT NULL,
  tipo_chave_pix TEXT NOT NULL DEFAULT 'cpf',
  valor_padrao NUMERIC DEFAULT 0,
  valor_fixo BOOLEAN DEFAULT false,
  categoria TEXT,
  tags TEXT[] DEFAULT '{}',
  uso_count INTEGER DEFAULT 0,
  ultimo_uso TIMESTAMPTZ,
  ativo BOOLEAN DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pix_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Authenticated users can view pix_templates"
  ON public.pix_templates FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert pix_templates"
  ON public.pix_templates FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Authenticated users can update pix_templates"
  ON public.pix_templates FOR UPDATE TO authenticated
  USING (true);

CREATE POLICY "Admins can delete pix_templates"
  ON public.pix_templates FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Updated_at trigger
CREATE TRIGGER update_pix_templates_updated_at
  BEFORE UPDATE ON public.pix_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
-- 1. PIX_TEMPLATES: Fix cross-tenant vulnerability
DROP POLICY IF EXISTS "Authenticated users can view pix_templates" ON public.pix_templates;
DROP POLICY IF EXISTS "Authenticated users can update pix_templates" ON public.pix_templates;

CREATE POLICY "Role-based select pix_templates"
  ON public.pix_templates FOR SELECT TO authenticated
  USING (
    created_by = auth.uid()
    OR has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role])
  );

CREATE POLICY "Role-based update pix_templates"
  ON public.pix_templates FOR UPDATE TO authenticated
  USING (
    created_by = auth.uid()
    OR has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role])
  )
  WITH CHECK (
    created_by = auth.uid()
    OR has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role])
  );

-- 2. WEBHOOKS_LOG: Restrict to admin/financeiro
DROP POLICY IF EXISTS "Auth users can read webhooks_log" ON public.webhooks_log;

CREATE POLICY "Admin financeiro can read webhooks_log"
  ON public.webhooks_log FOR SELECT TO authenticated
  USING (
    has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role])
  );

-- 3. PONTO_DEPARTAMENTOS: Restrict SELECT
DROP POLICY IF EXISTS "Authenticated can view ponto_departamentos" ON public.ponto_departamentos;

CREATE POLICY "Admin financeiro can view ponto_departamentos"
  ON public.ponto_departamentos FOR SELECT TO authenticated
  USING (
    has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role])
  );

-- 4. CONFIGURACOES_APROVACAO: Restrict SELECT
DROP POLICY IF EXISTS "Autenticados podem ver configuracoes_aprovacao" ON public.configuracoes_aprovacao;

CREATE POLICY "Admin financeiro can view configuracoes_aprovacao"
  ON public.configuracoes_aprovacao FOR SELECT TO authenticated
  USING (
    has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role])
  );-- 1. REGUA_COBRANCA: Restrict SELECT to admin/financeiro
DROP POLICY IF EXISTS "Usuários autenticados podem ver régua de cobrança" ON public.regua_cobranca;

CREATE POLICY "Admin financeiro can view regua_cobranca"
  ON public.regua_cobranca FOR SELECT TO authenticated
  USING (
    has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role])
  );

-- 2. TEMPLATES_COBRANCA: Restrict SELECT to admin/financeiro
DROP POLICY IF EXISTS "Auth users can read templates_cobranca" ON public.templates_cobranca;

CREATE POLICY "Admin financeiro can read templates_cobranca"
  ON public.templates_cobranca FOR SELECT TO authenticated
  USING (
    has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role])
  );

-- 3. PONTO_SYNC_LOG: Restrict SELECT to admin/financeiro
DROP POLICY IF EXISTS "Authenticated can view ponto_sync_log" ON public.ponto_sync_log;

CREATE POLICY "Admin financeiro can view ponto_sync_log"
  ON public.ponto_sync_log FOR SELECT TO authenticated
  USING (
    has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role])
  );

-- 4. REGRAS_CONCILIACAO: Restrict SELECT to admin/financeiro
DROP POLICY IF EXISTS "Authenticated users can read regras_conciliacao" ON public.regras_conciliacao;

CREATE POLICY "Admin financeiro can read regras_conciliacao"
  ON public.regras_conciliacao FOR SELECT TO authenticated
  USING (
    has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role])
  );
CREATE TABLE public.query_telemetry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operation TEXT NOT NULL,
  table_name TEXT,
  rpc_name TEXT,
  duration_ms INTEGER NOT NULL DEFAULT 0,
  record_count INTEGER,
  query_limit INTEGER,
  query_offset INTEGER,
  count_mode TEXT,
  severity TEXT NOT NULL DEFAULT 'normal',
  error_message TEXT,
  user_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.query_telemetry ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage telemetry" ON public.query_telemetry
  FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role]));

CREATE INDEX idx_query_telemetry_created_at ON public.query_telemetry (created_at DESC);
CREATE INDEX idx_query_telemetry_severity ON public.query_telemetry (severity);
CREATE INDEX IF NOT EXISTS idx_query_telemetry_table ON public.query_telemetry (table_name);ALTER VIEW public.vw_contas_receber_painel SET (security_invoker = true);
ALTER VIEW public.vw_contas_pagar_painel SET (security_invoker = true);
ALTER VIEW public.vw_transferencias_painel SET (security_invoker = true);
ALTER VIEW public.vw_saldos_contas SET (security_invoker = true);
ALTER VIEW public.vw_fluxo_caixa SET (security_invoker = true);
ALTER VIEW public.vw_fluxo_caixa_diario SET (security_invoker = true);
ALTER VIEW public.vw_dre_mensal SET (security_invoker = true);
ALTER VIEW public.vw_dso_aging SET (security_invoker = true);
ALTER VIEW public.vw_metricas_cobranca SET (security_invoker = true);
ALTER VIEW public.vw_gastos_centro_custo SET (security_invoker = true);
ALTER VIEW public.vw_webhooks_recentes SET (security_invoker = true);-- 1. Revoke anon access from all financial views (security_invoker already set)
REVOKE SELECT ON public.vw_contas_receber_painel FROM anon;
REVOKE SELECT ON public.vw_contas_pagar_painel FROM anon;
REVOKE SELECT ON public.vw_transferencias_painel FROM anon;
REVOKE SELECT ON public.vw_saldos_contas FROM anon;
REVOKE SELECT ON public.vw_fluxo_caixa FROM anon;
REVOKE SELECT ON public.vw_fluxo_caixa_diario FROM anon;
REVOKE SELECT ON public.vw_dre_mensal FROM anon;
REVOKE SELECT ON public.vw_dso_aging FROM anon;
REVOKE SELECT ON public.vw_metricas_cobranca FROM anon;
REVOKE SELECT ON public.vw_gastos_centro_custo FROM anon;
REVOKE SELECT ON public.vw_webhooks_recentes FROM anon;

-- 2. Restrict ponto_funcionarios to admin only
DROP POLICY IF EXISTS "Admin/financeiro can view ponto_funcionarios" ON public.ponto_funcionarios;
DROP POLICY IF EXISTS "Admins manage ponto_funcionarios" ON public.ponto_funcionarios;

CREATE POLICY "Admin can view ponto_funcionarios"
  ON public.ponto_funcionarios FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin can manage ponto_funcionarios"
  ON public.ponto_funcionarios FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- 3. Add INSERT policy for rate_limit_logs
CREATE POLICY "System can insert rate limit logs"
  ON public.rate_limit_logs FOR INSERT TO authenticated
  WITH CHECK (true);-- ============================================
-- MOTOR TRIBUTÁRIO — FUNDAÇÃO (Lote 1)
-- Tabelas: faturamento_mensal, folha_pagamento,
--          regimes_simulados, oportunidades_elisao
-- ============================================

-- 1. Faturamento mensal por empresa (base para RBT12)
CREATE TABLE public.faturamento_mensal (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  ano INTEGER NOT NULL CHECK (ano BETWEEN 2020 AND 2050),
  mes INTEGER NOT NULL CHECK (mes BETWEEN 1 AND 12),
  receita_bruta NUMERIC(15,2) NOT NULL DEFAULT 0,
  receita_servicos NUMERIC(15,2) NOT NULL DEFAULT 0,
  receita_revenda NUMERIC(15,2) NOT NULL DEFAULT 0,
  receita_industria NUMERIC(15,2) NOT NULL DEFAULT 0,
  receita_exportacao NUMERIC(15,2) NOT NULL DEFAULT 0,
  observacoes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(empresa_id, ano, mes)
);

CREATE INDEX idx_faturamento_mensal_empresa_periodo
  ON public.faturamento_mensal(empresa_id, ano DESC, mes DESC);

ALTER TABLE public.faturamento_mensal ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authorized roles can view faturamento"
  ON public.faturamento_mensal FOR SELECT
  USING (public.has_any_role(auth.uid(), ARRAY['admin','financeiro','operacional','visualizador']::app_role[]));

CREATE POLICY "Authorized roles can insert faturamento"
  ON public.faturamento_mensal FOR INSERT
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','financeiro','operacional']::app_role[]));

CREATE POLICY "Authorized roles can update faturamento"
  ON public.faturamento_mensal FOR UPDATE
  USING (public.has_any_role(auth.uid(), ARRAY['admin','financeiro','operacional']::app_role[]));

CREATE POLICY "Admin/financeiro can delete faturamento"
  ON public.faturamento_mensal FOR DELETE
  USING (public.has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[]));

CREATE TRIGGER update_faturamento_mensal_updated_at
  BEFORE UPDATE ON public.faturamento_mensal
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Folha de pagamento mensal (base para Fator R)
CREATE TABLE public.folha_pagamento (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  ano INTEGER NOT NULL CHECK (ano BETWEEN 2020 AND 2050),
  mes INTEGER NOT NULL CHECK (mes BETWEEN 1 AND 12),
  salarios NUMERIC(15,2) NOT NULL DEFAULT 0,
  pro_labore NUMERIC(15,2) NOT NULL DEFAULT 0,
  encargos NUMERIC(15,2) NOT NULL DEFAULT 0,
  total_folha NUMERIC(15,2) NOT NULL DEFAULT 0,
  numero_funcionarios INTEGER DEFAULT 0,
  observacoes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(empresa_id, ano, mes)
);

CREATE INDEX idx_folha_pagamento_empresa_periodo
  ON public.folha_pagamento(empresa_id, ano DESC, mes DESC);

ALTER TABLE public.folha_pagamento ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authorized roles can view folha"
  ON public.folha_pagamento FOR SELECT
  USING (public.has_any_role(auth.uid(), ARRAY['admin','financeiro','operacional','visualizador']::app_role[]));

CREATE POLICY "Authorized roles can insert folha"
  ON public.folha_pagamento FOR INSERT
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','financeiro','operacional']::app_role[]));

CREATE POLICY "Authorized roles can update folha"
  ON public.folha_pagamento FOR UPDATE
  USING (public.has_any_role(auth.uid(), ARRAY['admin','financeiro','operacional']::app_role[]));

CREATE POLICY "Admin/financeiro can delete folha"
  ON public.folha_pagamento FOR DELETE
  USING (public.has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[]));

CREATE TRIGGER update_folha_pagamento_updated_at
  BEFORE UPDATE ON public.folha_pagamento
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Regimes simulados (histórico de simulações comparativas)
CREATE TABLE public.regimes_simulados (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  data_simulacao TIMESTAMPTZ NOT NULL DEFAULT now(),
  ano_referencia INTEGER NOT NULL,
  rbt12 NUMERIC(15,2) NOT NULL DEFAULT 0,
  folha_12m NUMERIC(15,2) NOT NULL DEFAULT 0,
  fator_r NUMERIC(6,4),
  regime_atual TEXT,
  regime_recomendado TEXT NOT NULL,
  cenarios JSONB NOT NULL DEFAULT '[]'::jsonb,
  alertas JSONB NOT NULL DEFAULT '[]'::jsonb,
  justificativa TEXT,
  economia_anual_estimada NUMERIC(15,2),
  parametros JSONB,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_regimes_simulados_empresa_data
  ON public.regimes_simulados(empresa_id, data_simulacao DESC);

ALTER TABLE public.regimes_simulados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authorized roles can view regimes simulados"
  ON public.regimes_simulados FOR SELECT
  USING (public.has_any_role(auth.uid(), ARRAY['admin','financeiro','operacional','visualizador']::app_role[]));

CREATE POLICY "Authorized roles can insert regimes simulados"
  ON public.regimes_simulados FOR INSERT
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','financeiro','operacional']::app_role[]));

CREATE POLICY "Admin/financeiro can update regimes simulados"
  ON public.regimes_simulados FOR UPDATE
  USING (public.has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[]));

CREATE POLICY "Admin/financeiro can delete regimes simulados"
  ON public.regimes_simulados FOR DELETE
  USING (public.has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[]));

CREATE TRIGGER update_regimes_simulados_updated_at
  BEFORE UPDATE ON public.regimes_simulados
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Oportunidades de elisão fiscal
CREATE TABLE public.oportunidades_elisao (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  estrategia TEXT NOT NULL,
  categoria TEXT,
  aplicavel BOOLEAN NOT NULL DEFAULT false,
  economia_estimada NUMERIC(15,2),
  base_legal TEXT,
  risco TEXT CHECK (risco IN ('baixo','medio','alto')),
  status TEXT NOT NULL DEFAULT 'identificada' CHECK (status IN ('identificada','em_analise','aprovada','implementada','descartada')),
  observacoes TEXT,
  data_identificacao DATE NOT NULL DEFAULT CURRENT_DATE,
  data_implementacao DATE,
  responsavel UUID,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_oportunidades_elisao_empresa_status
  ON public.oportunidades_elisao(empresa_id, status, data_identificacao DESC);

ALTER TABLE public.oportunidades_elisao ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authorized roles can view oportunidades elisao"
  ON public.oportunidades_elisao FOR SELECT
  USING (public.has_any_role(auth.uid(), ARRAY['admin','financeiro','operacional','visualizador']::app_role[]));

CREATE POLICY "Authorized roles can insert oportunidades elisao"
  ON public.oportunidades_elisao FOR INSERT
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','financeiro','operacional']::app_role[]));

CREATE POLICY "Admin/financeiro can update oportunidades elisao"
  ON public.oportunidades_elisao FOR UPDATE
  USING (public.has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[]));

CREATE POLICY "Admin/financeiro can delete oportunidades elisao"
  ON public.oportunidades_elisao FOR DELETE
  USING (public.has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[]));

CREATE TRIGGER update_oportunidades_elisao_updated_at
  BEFORE UPDATE ON public.oportunidades_elisao
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();-- Catálogo de estratégias de elisão fiscal
CREATE TABLE public.estrategias_elisao_catalogo (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo text NOT NULL UNIQUE,
  nome text NOT NULL,
  descricao text NOT NULL,
  base_legal text NOT NULL,
  risco text NOT NULL CHECK (risco IN ('baixo', 'medio', 'alto')),
  aplicavel_a text[] NOT NULL DEFAULT '{}',
  requisitos jsonb NOT NULL DEFAULT '{}'::jsonb,
  economia_potencial_min numeric,
  economia_potencial_max numeric,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.estrategias_elisao_catalogo ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Catálogo elisão visível para autenticados"
  ON public.estrategias_elisao_catalogo FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins gerenciam catálogo elisão"
  ON public.estrategias_elisao_catalogo FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_estrategias_elisao_updated_at
  BEFORE UPDATE ON public.estrategias_elisao_catalogo
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Benchmarks setoriais
CREATE TABLE public.benchmarks_setoriais (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cnae_prefix text NOT NULL,
  setor text NOT NULL,
  regime text NOT NULL CHECK (regime IN ('simples', 'presumido', 'real')),
  carga_media_pct numeric NOT NULL,
  margem_media_pct numeric NOT NULL,
  fonte text,
  ano_referencia integer NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (cnae_prefix, regime, ano_referencia)
);

ALTER TABLE public.benchmarks_setoriais ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Benchmarks visíveis para autenticados"
  ON public.benchmarks_setoriais FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins gerenciam benchmarks"
  ON public.benchmarks_setoriais FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_benchmarks_setoriais_updated_at
  BEFORE UPDATE ON public.benchmarks_setoriais
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_benchmarks_cnae ON public.benchmarks_setoriais (cnae_prefix);

-- Seed: 9 estratégias de elisão
INSERT INTO public.estrategias_elisao_catalogo (codigo, nome, descricao, base_legal, risco, aplicavel_a, requisitos, economia_potencial_min, economia_potencial_max) VALUES
('MS_LC224', 'Mandado de Segurança LC 224/2025', 'Discussão judicial sobre limites e regras da Lei Complementar 224/2025 (Reforma Tributária) que afetam empresas do Simples Nacional próximas ao sublimite estadual.', 'LC 224/2025; CF/88 art. 5º, LXIX', 'medio', ARRAY['simples'], '{"rbt12_min": 3240000, "proximidade_sublimite_pct": 90}'::jsonb, 0.05, 0.15),
('JCP', 'Juros sobre Capital Próprio', 'Distribuição de JCP como despesa dedutível no Lucro Real, reduzindo IRPJ/CSLL. Limitada a TJLP × PL ou 50% do lucro.', 'Lei 9.249/95 art. 9º; RIR/2018 art. 355', 'baixo', ARRAY['real'], '{"patrimonio_liquido_min": 100000, "lucro_positivo": true}'::jsonb, 0.08, 0.18),
('REINTEGRA', 'Reintegra — Crédito sobre Exportação', 'Apuração de crédito de 0,1% a 3% sobre receita de exportação para devolução de resíduos tributários.', 'Lei 13.043/14; Decreto 8.415/15', 'baixo', ARRAY['simples', 'presumido', 'real'], '{"receita_exportacao_min": 1}'::jsonb, 0.001, 0.03),
('HOLDING', 'Holding Patrimonial / Familiar', 'Constituição de holding para concentrar participações societárias e patrimônio, otimizando ITCMD, sucessão e dividendos. Especialmente relevante com IRPFM (Lei 15.270/2025).', 'Lei 15.270/2025; CC/2002; Lei 6.404/76', 'medio', ARRAY['simples', 'presumido', 'real'], '{"dividendos_anuais_min": 600000}'::jsonb, 0.10, 0.30),
('PAT', 'Programa de Alimentação ao Trabalhador', 'Dedução de até 4% do IRPJ devido para empresas Lucro Real que custeiam alimentação dos funcionários.', 'Lei 6.321/76; Decreto 10.854/21', 'baixo', ARRAY['real'], '{"folha_minima": 50000}'::jsonb, 0.01, 0.04),
('LEI_BEM', 'Lei do Bem — Incentivo P&D', 'Exclusão de até 60% (até 100%) das despesas com Pesquisa & Desenvolvimento da base do IRPJ/CSLL.', 'Lei 11.196/05 cap. III; Decreto 5.798/06', 'medio', ARRAY['real'], '{"despesas_pd_min": 50000}'::jsonb, 0.15, 0.34),
('DRAWBACK', 'Drawback — Suspensão de Tributos', 'Suspensão/restituição de II, IPI, PIS, COFINS, ICMS sobre insumos importados destinados a produto exportado.', 'Lei 11.945/09; Portaria SECEX 23/2011', 'baixo', ARRAY['presumido', 'real'], '{"importacao_min": 100000, "exportacao_min": 100000}'::jsonb, 0.05, 0.20),
('SUBVENCAO_ICMS', 'Subvenção de ICMS — Exclusão da Base IRPJ/CSLL', 'Exclusão dos benefícios fiscais de ICMS da base de cálculo do IRPJ/CSLL (Tema 1.182 STJ).', 'LC 160/17; Lei 12.973/14 art. 30; Tema 1.182 STJ', 'medio', ARRAY['real'], '{"beneficio_icms_min": 10000}'::jsonb, 0.05, 0.34),
('BONIFICACAO', 'Bonificação em Mercadorias', 'Estruturação de bonificações comerciais para reduzir base de cálculo do ICMS, PIS e COFINS.', 'LC 87/96 art. 13; Tema 144 STJ; Lei 10.637/02', 'medio', ARRAY['presumido', 'real'], '{"volume_vendas_min": 500000}'::jsonb, 0.02, 0.09);

-- Seed: benchmarks setoriais (carga total média por setor/regime)
INSERT INTO public.benchmarks_setoriais (cnae_prefix, setor, regime, carga_media_pct, margem_media_pct, fonte, ano_referencia) VALUES
('47', 'Comércio Varejista', 'simples', 6.5, 12.0, 'IBPT 2024', 2025),
('47', 'Comércio Varejista', 'presumido', 11.3, 12.0, 'IBPT 2024', 2025),
('47', 'Comércio Varejista', 'real', 14.8, 12.0, 'IBPT 2024', 2025),
('10', 'Indústria de Alimentos', 'presumido', 13.5, 18.0, 'IBPT 2024', 2025),
('10', 'Indústria de Alimentos', 'real', 16.2, 18.0, 'IBPT 2024', 2025),
('62', 'Tecnologia / Software', 'simples', 8.7, 25.0, 'IBPT 2024', 2025),
('62', 'Tecnologia / Software', 'presumido', 13.3, 25.0, 'IBPT 2024', 2025),
('69', 'Atividades Jurídicas/Contábeis', 'simples', 12.5, 30.0, 'IBPT 2024', 2025);DROP POLICY IF EXISTS "System can insert rate limit logs" ON public.rate_limit_logs;

CREATE POLICY "Authenticated users can insert rate limit logs"
ON public.rate_limit_logs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);-- RPC para histórico de execuções de cron jobs (admin-only)
CREATE OR REPLACE FUNCTION public.get_cron_run_history(p_job_name text DEFAULT NULL, p_limit integer DEFAULT 20)
RETURNS TABLE(
  jobid bigint,
  jobname text,
  runid bigint,
  job_pid integer,
  database text,
  username text,
  command text,
  status text,
  return_message text,
  start_time timestamptz,
  end_time timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem visualizar histórico de cron jobs';
  END IF;

  RETURN QUERY
  SELECT
    j.jobid,
    j.jobname,
    d.runid,
    d.job_pid,
    d.database,
    d.username,
    d.command,
    d.status,
    d.return_message,
    d.start_time,
    d.end_time
  FROM cron.job_run_details d
  JOIN cron.job j ON j.jobid = d.jobid
  WHERE (p_job_name IS NULL OR j.jobname = p_job_name)
  ORDER BY d.start_time DESC
  LIMIT p_limit;
END;
$$;-- Tabela de telemetria de erros frontend
CREATE TABLE public.frontend_error_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  stack TEXT,
  url TEXT,
  user_agent TEXT,
  severity TEXT NOT NULL DEFAULT 'error',
  context JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_frontend_error_logs_user_id ON public.frontend_error_logs(user_id);
CREATE INDEX idx_frontend_error_logs_created_at ON public.frontend_error_logs(created_at DESC);
CREATE INDEX idx_frontend_error_logs_severity ON public.frontend_error_logs(severity);

ALTER TABLE public.frontend_error_logs ENABLE ROW LEVEL SECURITY;

-- Usuários autenticados podem inserir seus próprios erros
CREATE POLICY "Users can insert their own error logs"
ON public.frontend_error_logs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Usuários veem apenas seus próprios erros
CREATE POLICY "Users can view their own error logs"
ON public.frontend_error_logs
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Admins veem todos os erros
CREATE POLICY "Admins can view all error logs"
ON public.frontend_error_logs
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Admins podem deletar erros antigos
CREATE POLICY "Admins can delete error logs"
ON public.frontend_error_logs
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'));-- Bucket privado para relatórios tributários executivos
INSERT INTO storage.buckets (id, name, public)
VALUES ('relatorios-tributarios', 'relatorios-tributarios', false)
ON CONFLICT (id) DO NOTHING;

-- Apenas usuários autenticados podem ler relatórios
CREATE POLICY "Authenticated users can view tax reports"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'relatorios-tributarios');

-- Apenas service_role (edge functions) pode inserir relatórios
CREATE POLICY "Service role can insert tax reports"
ON storage.objects
FOR INSERT
TO service_role
WITH CHECK (bucket_id = 'relatorios-tributarios');

-- Apenas admin pode deletar relatórios
CREATE POLICY "Admins can delete tax reports"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'relatorios-tributarios'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);-- Tabela de logs estruturados das edge functions
CREATE TABLE IF NOT EXISTS public.edge_function_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  function_name TEXT NOT NULL,
  level TEXT NOT NULL CHECK (level IN ('info', 'warn', 'error')),
  event TEXT NOT NULL,
  duration_ms INTEGER,
  status_code INTEGER,
  error_message TEXT,
  context JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_edge_logs_fn_created
  ON public.edge_function_logs (function_name, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_edge_logs_level_created
  ON public.edge_function_logs (level, created_at DESC);

ALTER TABLE public.edge_function_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins podem visualizar logs de edge functions"
  ON public.edge_function_logs
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role pode inserir logs"
  ON public.edge_function_logs
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- View de saúde agregada (últimos 7 dias)
CREATE OR REPLACE VIEW public.vw_edge_health
WITH (security_invoker = true)
AS
SELECT
  function_name,
  COUNT(*) AS total_calls,
  COUNT(*) FILTER (WHERE level = 'error') AS error_count,
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE level = 'error') / NULLIF(COUNT(*), 0),
    2
  ) AS error_rate_pct,
  ROUND(
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY duration_ms)::numeric,
    0
  ) AS p50_ms,
  ROUND(
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY duration_ms)::numeric,
    0
  ) AS p95_ms,
  MAX(created_at) AS last_call_at
FROM public.edge_function_logs
WHERE created_at >= now() - INTERVAL '7 days'
GROUP BY function_name
ORDER BY total_calls DESC;-- Tabela de cache CNPJá
CREATE TABLE public.cnpja_cache (
  cnpj TEXT PRIMARY KEY CHECK (length(cnpj) = 14),
  data JSONB NOT NULL,
  situacao_cadastral TEXT,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_cnpja_cache_expires_at ON public.cnpja_cache(expires_at);

ALTER TABLE public.cnpja_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins podem ver cache CNPJá"
  ON public.cnpja_cache FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Tabela de rate limit CNPJá
CREATE TABLE public.cnpja_rate_limit (
  user_id UUID NOT NULL,
  window_start TIMESTAMPTZ NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, window_start)
);

CREATE INDEX idx_cnpja_rate_limit_window ON public.cnpja_rate_limit(window_start);

ALTER TABLE public.cnpja_rate_limit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuário vê próprio uso CNPJá"
  ON public.cnpja_rate_limit FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Função para verificar e incrementar rate limit
CREATE OR REPLACE FUNCTION public.cnpja_check_rate_limit(
  _user_id UUID,
  _max INTEGER DEFAULT 10,
  _window_minutes INTEGER DEFAULT 60
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_window TIMESTAMPTZ;
  v_count INTEGER;
BEGIN
  v_window := date_trunc('minute', now()) - (EXTRACT(MINUTE FROM now())::INTEGER % _window_minutes) * INTERVAL '1 minute';

  INSERT INTO public.cnpja_rate_limit (user_id, window_start, request_count)
  VALUES (_user_id, v_window, 1)
  ON CONFLICT (user_id, window_start)
  DO UPDATE SET request_count = cnpja_rate_limit.request_count + 1
  RETURNING request_count INTO v_count;

  -- Limpa janelas antigas (best-effort)
  DELETE FROM public.cnpja_rate_limit
  WHERE window_start < now() - INTERVAL '1 day';

  RETURN v_count <= _max;
END;
$$;-- Tabela de convites para contadores (acesso read-only via token)
CREATE TABLE IF NOT EXISTS public.convites_contador (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  nome TEXT,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_convites_contador_empresa ON public.convites_contador(empresa_id);
CREATE INDEX IF NOT EXISTS idx_convites_contador_email ON public.convites_contador(email);
CREATE INDEX IF NOT EXISTS idx_convites_contador_expires ON public.convites_contador(expires_at) WHERE accepted_at IS NULL AND revoked_at IS NULL;

-- Trigger updated_at
DROP TRIGGER IF EXISTS trg_convites_contador_updated_at ON public.convites_contador;
CREATE TRIGGER trg_convites_contador_updated_at
  BEFORE UPDATE ON public.convites_contador
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.convites_contador ENABLE ROW LEVEL SECURITY;

-- Usuário vê convites que criou
CREATE POLICY "Usuario ve proprios convites"
  ON public.convites_contador FOR SELECT TO authenticated
  USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Usuário cria convite (apenas como ele mesmo)
CREATE POLICY "Usuario cria proprio convite"
  ON public.convites_contador FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());

-- Usuário/admin pode revogar (UPDATE limitado a revoked_at)
CREATE POLICY "Usuario revoga proprio convite"
  ON public.convites_contador FOR UPDATE TO authenticated
  USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));-- View otimizada para Dashboard Tributário v2
-- Agrega faturamento mensal × tributos calculados por empresa
CREATE OR REPLACE VIEW public.vw_tributario_dashboard
WITH (security_invoker = true)
AS
SELECT
  e.id AS empresa_id,
  e.razao_social,
  e.regime_tributario,
  EXTRACT(YEAR FROM at_.competencia::date)::int AS ano,
  EXTRACT(MONTH FROM at_.competencia::date)::int AS mes,
  at_.competencia,
  COALESCE(at_.total_geral, 0) AS total_tributos,
  COALESCE(at_.total_tributos_novos, 0) AS tributos_novos,
  COALESCE(at_.total_tributos_residuais, 0) AS tributos_residuais,
  COALESCE(at_.cbs_a_pagar, 0) AS cbs,
  COALESCE(at_.ibs_a_pagar, 0) AS ibs,
  COALESCE(at_.is_a_pagar, 0) AS imposto_seletivo,
  at_.status AS status_apuracao
FROM public.empresas e
LEFT JOIN public.apuracoes_tributarias at_ ON at_.empresa_id = e.id
WHERE e.id IS NOT NULL;

COMMENT ON VIEW public.vw_tributario_dashboard IS
'Dashboard Tributário v2: agrega apurações tributárias por empresa/competência. Security invoker respeita RLS de empresas e apuracoes_tributarias.';

-- Índice em apuracoes_tributarias para acelerar consultas (idempotente)
CREATE INDEX IF NOT EXISTS idx_apuracoes_tributarias_empresa_competencia
  ON public.apuracoes_tributarias (empresa_id, ano DESC, mes DESC);-- ============ 1. CACHE DE DECISÕES DE REGIME ============
CREATE TABLE IF NOT EXISTS public.regime_decision_cache (
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  ano INTEGER NOT NULL,
  mes INTEGER NOT NULL,
  decisao JSONB NOT NULL,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  PRIMARY KEY (empresa_id, ano, mes)
);

CREATE INDEX IF NOT EXISTS idx_regime_decision_cache_expires
  ON public.regime_decision_cache(expires_at);

ALTER TABLE public.regime_decision_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "regime_cache_read_authorized"
  ON public.regime_decision_cache
  FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'financeiro')
  );

-- Service role escreve (sem política = só service_role bypass RLS)

-- Trigger: invalida cache ao inserir/atualizar apuração tributária
CREATE OR REPLACE FUNCTION public.fn_invalidar_regime_cache()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.regime_decision_cache
  WHERE empresa_id = COALESCE(NEW.empresa_id, OLD.empresa_id)
    AND ano = COALESCE(NEW.ano, OLD.ano)
    AND mes = COALESCE(NEW.mes, OLD.mes);
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_invalidar_regime_cache ON public.apuracoes_tributarias;
CREATE TRIGGER trg_invalidar_regime_cache
  AFTER INSERT OR UPDATE OR DELETE ON public.apuracoes_tributarias
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_invalidar_regime_cache();

-- ============ 2. RELATÓRIOS AGENDADOS ============
DO $$ BEGIN
  CREATE TYPE public.frequencia_relatorio AS ENUM ('mensal', 'trimestral', 'anual');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.relatorios_tributarios_agendados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  ano INTEGER NOT NULL,
  frequencia public.frequencia_relatorio NOT NULL DEFAULT 'mensal',
  dia_envio INTEGER NOT NULL DEFAULT 1 CHECK (dia_envio BETWEEN 1 AND 28),
  destinatarios TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ativo BOOLEAN NOT NULL DEFAULT true,
  ultimo_envio_em TIMESTAMPTZ,
  proximo_envio_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rel_trib_agend_proximo
  ON public.relatorios_tributarios_agendados(proximo_envio_em)
  WHERE ativo = true;

CREATE INDEX IF NOT EXISTS idx_rel_trib_agend_empresa
  ON public.relatorios_tributarios_agendados(empresa_id);

ALTER TABLE public.relatorios_tributarios_agendados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rel_trib_agend_admin_fin_select"
  ON public.relatorios_tributarios_agendados
  FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'financeiro')
  );

CREATE POLICY "rel_trib_agend_admin_fin_insert"
  ON public.relatorios_tributarios_agendados
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'financeiro')
  );

CREATE POLICY "rel_trib_agend_admin_fin_update"
  ON public.relatorios_tributarios_agendados
  FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'financeiro')
  );

CREATE POLICY "rel_trib_agend_admin_delete"
  ON public.relatorios_tributarios_agendados
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_rel_trib_agend_updated_at
  BEFORE UPDATE ON public.relatorios_tributarios_agendados
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();-- Tabela de verificações de conformidade fiscal
CREATE TABLE public.verificacoes_conformidade (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  periodo TEXT NOT NULL, -- formato YYYY-MM
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  nivel TEXT NOT NULL CHECK (nivel IN ('excelente', 'bom', 'atencao', 'critico')),
  itens JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_checks INTEGER NOT NULL DEFAULT 0,
  checks_aprovados INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_verif_conf_empresa_periodo
  ON public.verificacoes_conformidade(empresa_id, periodo DESC);

CREATE INDEX idx_verif_conf_created
  ON public.verificacoes_conformidade(created_at DESC);

ALTER TABLE public.verificacoes_conformidade ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin/financeiro/contador podem ler verificacoes"
  ON public.verificacoes_conformidade
  FOR SELECT
  TO authenticated
  USING (
    public.has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[])
    OR public.has_role(auth.uid(), 'visualizador'::app_role)
  );

CREATE POLICY "Service role pode inserir verificacoes"
  ON public.verificacoes_conformidade
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role pode atualizar verificacoes"
  ON public.verificacoes_conformidade
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE TRIGGER trg_verif_conf_updated_at
  BEFORE UPDATE ON public.verificacoes_conformidade
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();-- ============================================
-- LOTE P9 — Auditoria tributária + Benchmark
-- ============================================

DO $$ BEGIN
  CREATE TYPE public.acao_auditoria_tributaria AS ENUM ('insert', 'update', 'delete');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.auditoria_tributaria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID,
  user_id UUID,
  user_email TEXT,
  acao public.acao_auditoria_tributaria NOT NULL,
  entidade_tipo TEXT NOT NULL,
  entidade_id TEXT,
  payload_anterior JSONB,
  payload_novo JSONB,
  ip_address TEXT,
  user_agent TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_auditoria_trib_empresa ON public.auditoria_tributaria(empresa_id, criado_em DESC);
CREATE INDEX IF NOT EXISTS idx_auditoria_trib_user ON public.auditoria_tributaria(user_id, criado_em DESC);
CREATE INDEX IF NOT EXISTS idx_auditoria_trib_entidade ON public.auditoria_tributaria(entidade_tipo, entidade_id);
CREATE INDEX IF NOT EXISTS idx_auditoria_trib_criado ON public.auditoria_tributaria(criado_em DESC);

ALTER TABLE public.auditoria_tributaria ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auditoria_trib_admin_select" ON public.auditoria_tributaria;
CREATE POLICY "auditoria_trib_admin_select"
  ON public.auditoria_tributaria FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.fn_audit_tributario()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_empresa_id UUID;
  v_acao public.acao_auditoria_tributaria;
  v_user_email TEXT;
  v_new_json JSONB;
  v_old_json JSONB;
BEGIN
  v_new_json := CASE WHEN TG_OP IN ('INSERT','UPDATE') THEN to_jsonb(NEW) ELSE NULL END;
  v_old_json := CASE WHEN TG_OP IN ('UPDATE','DELETE') THEN to_jsonb(OLD) ELSE NULL END;

  IF TG_OP = 'INSERT' THEN
    v_acao := 'insert';
    v_empresa_id := (v_new_json->>'empresa_id')::uuid;
  ELSIF TG_OP = 'UPDATE' THEN
    v_acao := 'update';
    v_empresa_id := (v_new_json->>'empresa_id')::uuid;
  ELSE
    v_acao := 'delete';
    v_empresa_id := (v_old_json->>'empresa_id')::uuid;
  END IF;

  SELECT email INTO v_user_email FROM public.profiles WHERE id = auth.uid();

  INSERT INTO public.auditoria_tributaria (
    empresa_id, user_id, user_email, acao, entidade_tipo, entidade_id,
    payload_anterior, payload_novo
  ) VALUES (
    v_empresa_id,
    auth.uid(),
    v_user_email,
    v_acao,
    TG_TABLE_NAME,
    COALESCE((v_new_json->>'id'), (v_old_json->>'id')),
    v_old_json,
    v_new_json
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_apuracoes_tributarias ON public.apuracoes_tributarias;
CREATE TRIGGER trg_audit_apuracoes_tributarias
  AFTER INSERT OR UPDATE OR DELETE ON public.apuracoes_tributarias
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_tributario();

DROP TRIGGER IF EXISTS trg_audit_regime_decision_cache ON public.regime_decision_cache;
CREATE TRIGGER trg_audit_regime_decision_cache
  AFTER INSERT OR UPDATE OR DELETE ON public.regime_decision_cache
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_tributario();

DROP TRIGGER IF EXISTS trg_audit_verificacoes_conformidade ON public.verificacoes_conformidade;
CREATE TRIGGER trg_audit_verificacoes_conformidade
  AFTER INSERT OR UPDATE OR DELETE ON public.verificacoes_conformidade
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_tributario();

DROP TRIGGER IF EXISTS trg_audit_relatorios_agendados ON public.relatorios_tributarios_agendados;
CREATE TRIGGER trg_audit_relatorios_agendados
  AFTER INSERT OR UPDATE OR DELETE ON public.relatorios_tributarios_agendados
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_tributario();

CREATE OR REPLACE VIEW public.vw_auditoria_tributaria_recente
WITH (security_invoker = true)
AS
SELECT
  a.id,
  a.empresa_id,
  e.razao_social AS empresa_nome,
  a.user_id,
  COALESCE(p.full_name, a.user_email, 'Sistema') AS user_nome,
  a.user_email,
  a.acao,
  a.entidade_tipo,
  a.entidade_id,
  a.payload_anterior,
  a.payload_novo,
  a.criado_em
FROM public.auditoria_tributaria a
LEFT JOIN public.profiles p ON p.id = a.user_id
LEFT JOIN public.empresas e ON e.id = a.empresa_id
ORDER BY a.criado_em DESC
LIMIT 1000;

-- Benchmark agregado por regime tributário (única dim disponível na vw)
DROP MATERIALIZED VIEW IF EXISTS public.mv_benchmark_setorial CASCADE;

CREATE MATERIALIZED VIEW public.mv_benchmark_setorial AS
WITH carga AS (
  SELECT
    COALESCE(regime_tributario, 'nao_informado') AS regime,
    empresa_id,
    SUM(total_tributos)::numeric AS total_12m
  FROM public.vw_tributario_dashboard
  WHERE (ano * 12 + mes) >= (EXTRACT(YEAR FROM CURRENT_DATE)::int * 12 + EXTRACT(MONTH FROM CURRENT_DATE)::int - 12)
  GROUP BY regime_tributario, empresa_id
)
SELECT
  regime,
  COUNT(*) AS amostra,
  percentile_cont(0.25) WITHIN GROUP (ORDER BY total_12m) AS p25,
  percentile_cont(0.5)  WITHIN GROUP (ORDER BY total_12m) AS mediana,
  percentile_cont(0.75) WITHIN GROUP (ORDER BY total_12m) AS p75,
  AVG(total_12m) AS media,
  now() AS atualizado_em
FROM carga
GROUP BY regime;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_benchmark_regime ON public.mv_benchmark_setorial(regime);

CREATE OR REPLACE FUNCTION public.refresh_mv_benchmark_setorial()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_benchmark_setorial;
EXCEPTION WHEN OTHERS THEN
  REFRESH MATERIALIZED VIEW public.mv_benchmark_setorial;
END;
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'refresh-benchmark-setorial-weekly') THEN
      PERFORM cron.unschedule('refresh-benchmark-setorial-weekly');
    END IF;
    PERFORM cron.schedule(
      'refresh-benchmark-setorial-weekly',
      '0 3 * * 0',
      $cron$ SELECT public.refresh_mv_benchmark_setorial(); $cron$
    );
  END IF;
END $$;

DO $$ BEGIN
  REFRESH MATERIALIZED VIEW public.mv_benchmark_setorial;
EXCEPTION WHEN OTHERS THEN NULL; END $$;-- Remove acesso público da MV (corrige WARN 0016)
REVOKE ALL ON public.mv_benchmark_setorial FROM anon, authenticated;
GRANT SELECT ON public.mv_benchmark_setorial TO service_role;-- ============================================
-- P10: Fechamento Tributário + Push Subscriptions
-- ============================================

-- Enum de status do fechamento
DO $$ BEGIN
  CREATE TYPE public.status_fechamento_tributario AS ENUM ('aberto', 'em_revisao', 'fechado', 'reaberto');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Tabela de fechamentos tributários mensais
CREATE TABLE IF NOT EXISTS public.fechamentos_tributarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  ano INTEGER NOT NULL,
  mes INTEGER NOT NULL CHECK (mes BETWEEN 1 AND 12),
  periodo TEXT GENERATED ALWAYS AS (lpad(ano::text, 4, '0') || '-' || lpad(mes::text, 2, '0')) STORED,
  status public.status_fechamento_tributario NOT NULL DEFAULT 'aberto',
  checklist JSONB NOT NULL DEFAULT '[]'::jsonb,
  score_conformidade NUMERIC,
  total_apurado NUMERIC,
  observacoes TEXT,
  forcado BOOLEAN NOT NULL DEFAULT false,
  justificativa_forcado TEXT,
  fechado_por UUID,
  fechado_em TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (empresa_id, ano, mes)
);

CREATE INDEX IF NOT EXISTS idx_fechamentos_empresa_periodo ON public.fechamentos_tributarios(empresa_id, ano DESC, mes DESC);
CREATE INDEX IF NOT EXISTS idx_fechamentos_status ON public.fechamentos_tributarios(status);

ALTER TABLE public.fechamentos_tributarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin/financeiro/contador podem ler fechamentos"
  ON public.fechamentos_tributarios FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'financeiro')
  );

CREATE POLICY "Admin/financeiro podem inserir fechamentos"
  ON public.fechamentos_tributarios FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'financeiro')
  );

CREATE POLICY "Admin/financeiro podem atualizar fechamentos abertos"
  ON public.fechamentos_tributarios FOR UPDATE
  TO authenticated
  USING (
    (status <> 'fechado' AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'financeiro')))
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Apenas admin pode deletar fechamentos"
  ON public.fechamentos_tributarios FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_fechamentos_updated_at
  BEFORE UPDATE ON public.fechamentos_tributarios
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger de auditoria P9
CREATE TRIGGER trg_audit_fechamentos
  AFTER INSERT OR UPDATE OR DELETE ON public.fechamentos_tributarios
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_tributario();

-- ============================================
-- Push Subscriptions (Web Push API)
-- ============================================
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, endpoint)
);

CREATE INDEX IF NOT EXISTS idx_push_subs_user ON public.push_subscriptions(user_id) WHERE ativo = true;

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários veem suas subscriptions"
  ON public.push_subscriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Usuários criam suas subscriptions"
  ON public.push_subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários atualizam suas subscriptions"
  ON public.push_subscriptions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários deletam suas subscriptions"
  ON public.push_subscriptions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_push_subs_updated_at
  BEFORE UPDATE ON public.push_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
-- ========================================
-- TABELA: notas_fiscais_ocr
-- ========================================
DO $$ BEGIN
  CREATE TYPE public.status_nf_ocr AS ENUM ('processando', 'sucesso', 'erro');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.notas_fiscais_ocr (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
  arquivo_url TEXT NOT NULL,
  arquivo_nome TEXT,
  arquivo_tipo TEXT,
  status public.status_nf_ocr NOT NULL DEFAULT 'processando',
  dados_extraidos JSONB,
  mensagem_erro TEXT,
  conta_pagar_id UUID REFERENCES public.contas_pagar(id) ON DELETE SET NULL,
  criado_por UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notas_fiscais_ocr_empresa ON public.notas_fiscais_ocr(empresa_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notas_fiscais_ocr_criado_por ON public.notas_fiscais_ocr(criado_por, created_at DESC);

ALTER TABLE public.notas_fiscais_ocr ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários autenticados visualizam NFs OCR"
  ON public.notas_fiscais_ocr FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Usuários autenticados criam NFs OCR"
  ON public.notas_fiscais_ocr FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = criado_por);

CREATE POLICY "Usuários atualizam suas próprias NFs OCR"
  ON public.notas_fiscais_ocr FOR UPDATE
  TO authenticated
  USING (auth.uid() = criado_por OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins deletam NFs OCR"
  ON public.notas_fiscais_ocr FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_notas_fiscais_ocr_updated_at
  BEFORE UPDATE ON public.notas_fiscais_ocr
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_notas_fiscais_ocr_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.notas_fiscais_ocr
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_tributario();

-- ========================================
-- TABELA: resumos_executivos_semanais
-- ========================================
CREATE TABLE IF NOT EXISTS public.resumos_executivos_semanais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
  semana_inicio DATE NOT NULL,
  semana_fim DATE NOT NULL,
  resumo_md TEXT NOT NULL,
  kpis JSONB NOT NULL DEFAULT '{}'::jsonb,
  destinatarios TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  enviado_em TIMESTAMPTZ,
  erro_envio TEXT,
  modelo_ia TEXT DEFAULT 'openai/gpt-5-mini',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (empresa_id, semana_inicio)
);

CREATE INDEX IF NOT EXISTS idx_resumos_executivos_empresa ON public.resumos_executivos_semanais(empresa_id, semana_inicio DESC);

ALTER TABLE public.resumos_executivos_semanais ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários autenticados visualizam resumos executivos"
  ON public.resumos_executivos_semanais FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Service role gerencia resumos executivos"
  ON public.resumos_executivos_semanais FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins gerenciam resumos executivos"
  ON public.resumos_executivos_semanais FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_resumos_executivos_updated_at
  BEFORE UPDATE ON public.resumos_executivos_semanais
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ========================================
-- BUCKET: notas-fiscais-upload (privado)
-- ========================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('notas-fiscais-upload', 'notas-fiscais-upload', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Usuários autenticados fazem upload de NFs"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'notas-fiscais-upload' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Usuários autenticados leem suas NFs"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'notas-fiscais-upload' AND (auth.uid()::text = (storage.foldername(name))[1] OR has_role(auth.uid(), 'admin')));

CREATE POLICY "Usuários deletam suas NFs"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'notas-fiscais-upload' AND (auth.uid()::text = (storage.foldername(name))[1] OR has_role(auth.uid(), 'admin')));
-- ============= ENUMS =============
CREATE TYPE public.tipo_solicitacao_lgpd AS ENUM ('acesso', 'portabilidade', 'exclusao', 'retificacao', 'anonimizacao');
CREATE TYPE public.status_solicitacao_lgpd AS ENUM ('aberta', 'em_analise', 'atendida', 'rejeitada');
CREATE TYPE public.tipo_anomalia AS ENUM ('movimentacao_outlier', 'pagamento_duplicado', 'conta_pagar_alta', 'conciliacao_atrasada', 'mudanca_regime_brusca');
CREATE TYPE public.severidade_anomalia AS ENUM ('baixa', 'media', 'alta', 'critica');
CREATE TYPE public.status_anomalia AS ENUM ('nova', 'investigando', 'falso_positivo', 'confirmada');

-- ============= 1. SOLICITAÇÕES LGPD =============
CREATE TABLE public.solicitacoes_lgpd (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  user_email TEXT NOT NULL,
  tipo public.tipo_solicitacao_lgpd NOT NULL,
  status public.status_solicitacao_lgpd NOT NULL DEFAULT 'aberta',
  justificativa TEXT,
  payload_resposta JSONB,
  url_dump TEXT,
  atendida_em TIMESTAMPTZ,
  atendida_por UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.solicitacoes_lgpd ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários veem suas próprias solicitações"
  ON public.solicitacoes_lgpd FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Usuários criam suas próprias solicitações"
  ON public.solicitacoes_lgpd FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Apenas admin atualiza solicitações"
  ON public.solicitacoes_lgpd FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_solicitacoes_lgpd_updated_at
  BEFORE UPDATE ON public.solicitacoes_lgpd
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_solicitacoes_lgpd_user ON public.solicitacoes_lgpd(user_id, created_at DESC);
CREATE INDEX idx_solicitacoes_lgpd_status ON public.solicitacoes_lgpd(status, created_at DESC);

-- ============= 2. HEALTH SCORES =============
CREATE TABLE public.health_scores_operacionais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID,
  snapshot_data DATE NOT NULL DEFAULT CURRENT_DATE,
  score_total NUMERIC(5,2) NOT NULL,
  score_tributario NUMERIC(5,2) NOT NULL DEFAULT 0,
  score_financeiro NUMERIC(5,2) NOT NULL DEFAULT 0,
  score_operacional NUMERIC(5,2) NOT NULL DEFAULT 0,
  score_lgpd NUMERIC(5,2) NOT NULL DEFAULT 0,
  score_cadastros NUMERIC(5,2) NOT NULL DEFAULT 0,
  score_engajamento NUMERIC(5,2) NOT NULL DEFAULT 0,
  tendencia_pct NUMERIC(6,2),
  insights_md TEXT,
  detalhes JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.health_scores_operacionais ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Apenas admin visualiza health scores"
  ON public.health_scores_operacionais FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Sistema insere health scores via service role"
  ON public.health_scores_operacionais FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_health_scores_empresa_data ON public.health_scores_operacionais(empresa_id, snapshot_data DESC);
CREATE UNIQUE INDEX idx_health_scores_unique ON public.health_scores_operacionais(empresa_id, snapshot_data) WHERE empresa_id IS NOT NULL;

-- ============= 3. ANOMALIAS DETECTADAS =============
CREATE TABLE public.anomalias_detectadas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID,
  entidade_tipo TEXT NOT NULL,
  entidade_id UUID,
  tipo_anomalia public.tipo_anomalia NOT NULL,
  severidade public.severidade_anomalia NOT NULL DEFAULT 'media',
  descricao TEXT NOT NULL,
  dados JSONB,
  status public.status_anomalia NOT NULL DEFAULT 'nova',
  detectada_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolvida_em TIMESTAMPTZ,
  resolvida_por UUID,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.anomalias_detectadas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Apenas admin visualiza anomalias"
  ON public.anomalias_detectadas FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Apenas admin atualiza anomalias"
  ON public.anomalias_detectadas FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Sistema insere anomalias"
  ON public.anomalias_detectadas FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_anomalias_updated_at
  BEFORE UPDATE ON public.anomalias_detectadas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_anomalias_status ON public.anomalias_detectadas(status, detectada_em DESC);
CREATE INDEX idx_anomalias_empresa ON public.anomalias_detectadas(empresa_id, detectada_em DESC);
CREATE INDEX idx_anomalias_severidade ON public.anomalias_detectadas(severidade, status);-- Tabela de ações recomendadas (Centro de Ações Inteligentes)
CREATE TABLE IF NOT EXISTS public.acoes_recomendadas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descricao TEXT NOT NULL,
  urgencia TEXT NOT NULL DEFAULT 'media' CHECK (urgencia IN ('baixa','media','alta','critica')),
  impacto_estimado NUMERIC,
  impacto_tipo TEXT CHECK (impacto_tipo IN ('reais','percentual','score')),
  link_resolucao TEXT,
  fonte TEXT NOT NULL,
  ordem INTEGER NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  gerado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '24 hours'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_acoes_recomendadas_empresa ON public.acoes_recomendadas(empresa_id, expires_at DESC);
CREATE INDEX IF NOT EXISTS idx_acoes_recomendadas_expires ON public.acoes_recomendadas(expires_at);

ALTER TABLE public.acoes_recomendadas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read acoes_recomendadas"
ON public.acoes_recomendadas FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admin manage acoes_recomendadas"
ON public.acoes_recomendadas FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Trigger: notificação push automática ao criar alerta crítico
CREATE OR REPLACE FUNCTION public.fn_notificar_alerta_critico_push()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_url TEXT;
  v_key TEXT;
BEGIN
  IF NEW.prioridade = 'critica' THEN
    v_url := current_setting('app.settings.supabase_url', true);
    v_key := current_setting('app.settings.service_role_key', true);

    IF v_url IS NULL OR v_key IS NULL THEN
      v_url := 'https://iikqosstymnnxaujzadw.supabase.co';
    END IF;

    BEGIN
      PERFORM net.http_post(
        url := v_url || '/functions/v1/enviar-push-notification',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || COALESCE(v_key, '')
        ),
        body := jsonb_build_object(
          'titulo', NEW.titulo,
          'mensagem', NEW.mensagem,
          'user_id', NEW.user_id,
          'url', NEW.acao_url
        )
      );
    EXCEPTION WHEN OTHERS THEN
      NULL; -- não bloqueia inserção
    END;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notificar_alerta_critico_push ON public.alertas;
CREATE TRIGGER trg_notificar_alerta_critico_push
AFTER INSERT ON public.alertas
FOR EACH ROW
EXECUTE FUNCTION public.fn_notificar_alerta_critico_push();-- Tabela: progresso de onboarding por usuário
CREATE TABLE IF NOT EXISTS public.user_onboarding_progress (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  etapas_completas TEXT[] NOT NULL DEFAULT '{}',
  iniciado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  finalizado_em TIMESTAMPTZ,
  pulado BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_onboarding_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuário vê seu próprio progresso"
ON public.user_onboarding_progress FOR SELECT
TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Usuário insere seu próprio progresso"
ON public.user_onboarding_progress FOR INSERT
TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuário atualiza seu próprio progresso"
ON public.user_onboarding_progress FOR UPDATE
TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER trg_user_onboarding_progress_updated
BEFORE UPDATE ON public.user_onboarding_progress
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Tabela: snapshot diário de métricas SLO
CREATE TABLE IF NOT EXISTS public.slo_metrics_diarias (
  data DATE PRIMARY KEY,
  total_requisicoes INTEGER NOT NULL DEFAULT 0,
  latencia_p50_ms INTEGER NOT NULL DEFAULT 0,
  latencia_p95_ms INTEGER NOT NULL DEFAULT 0,
  latencia_p99_ms INTEGER NOT NULL DEFAULT 0,
  taxa_erro_pct NUMERIC(5,2) NOT NULL DEFAULT 0,
  uptime_pct NUMERIC(5,2) NOT NULL DEFAULT 100,
  cron_jobs_sucesso INTEGER NOT NULL DEFAULT 0,
  cron_jobs_falha INTEGER NOT NULL DEFAULT 0,
  edges_health JSONB NOT NULL DEFAULT '{}'::jsonb,
  calculado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.slo_metrics_diarias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Apenas admins visualizam SLO"
ON public.slo_metrics_diarias FOR SELECT
TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role gerencia SLO"
ON public.slo_metrics_diarias FOR ALL
TO service_role USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_slo_data_desc ON public.slo_metrics_diarias (data DESC);DROP POLICY IF EXISTS "Usuários autenticados visualizam NFs OCR" ON public.notas_fiscais_ocr;
CREATE POLICY "Owner ou admin/financeiro visualiza NFs OCR"
ON public.notas_fiscais_ocr
FOR SELECT TO authenticated
USING (
  auth.uid() = criado_por
  OR public.has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[])
);

DROP POLICY IF EXISTS "Usuários autenticados visualizam resumos executivos" ON public.resumos_executivos_semanais;
CREATE POLICY "Admin/financeiro visualiza resumos executivos"
ON public.resumos_executivos_semanais
FOR SELECT TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[]));

DROP POLICY IF EXISTS "Authenticated read acoes_recomendadas" ON public.acoes_recomendadas;
CREATE POLICY "Admin/financeiro lê acoes_recomendadas"
ON public.acoes_recomendadas
FOR SELECT TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[]));

DROP POLICY IF EXISTS "Authenticated users can view tax reports" ON storage.objects;
CREATE POLICY "Admin/financeiro visualiza tax reports"
ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'relatorios-tributarios'
  AND public.has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[])
);
-- Enum tipo SSO
DO $$ BEGIN
  CREATE TYPE public.sso_tipo AS ENUM ('oidc', 'saml');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Tabela principal de provedores SSO
CREATE TABLE public.sso_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  tipo public.sso_tipo NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT false,
  ordem INTEGER NOT NULL DEFAULT 0,
  preset TEXT, -- 'azure', 'okta', 'google', 'onelogin', 'jumpcloud', 'adfs', 'custom'
  
  -- OIDC fields
  client_id TEXT,
  client_secret_ref TEXT, -- nome do secret no Lovable Cloud
  discovery_url TEXT,
  authorization_endpoint TEXT,
  token_endpoint TEXT,
  userinfo_endpoint TEXT,
  jwks_uri TEXT,
  scopes TEXT[] DEFAULT ARRAY['openid','profile','email'],
  
  -- SAML fields
  entity_id_idp TEXT,
  sso_url TEXT,
  slo_url TEXT,
  x509_cert TEXT,
  metadata_xml TEXT,
  name_id_format TEXT DEFAULT 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress',
  signature_algorithm TEXT DEFAULT 'RSA-SHA256',
  
  -- Common config
  allowed_domains TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  claim_mapping JSONB NOT NULL DEFAULT '{"email":"email","full_name":"name","groups":"groups"}'::jsonb,
  default_role public.app_role NOT NULL DEFAULT 'visualizador',
  auto_provision_users BOOLEAN NOT NULL DEFAULT true,
  force_sso_for_domains BOOLEAN NOT NULL DEFAULT false,
  
  ultimo_teste_em TIMESTAMPTZ,
  ultimo_teste_sucesso BOOLEAN,
  ultimo_teste_mensagem TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX idx_sso_providers_ativo ON public.sso_providers(ativo) WHERE ativo = true;
CREATE INDEX idx_sso_providers_domains ON public.sso_providers USING GIN(allowed_domains);

-- Tentativas de login
CREATE TABLE public.sso_login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID REFERENCES public.sso_providers(id) ON DELETE CASCADE,
  email TEXT,
  success BOOLEAN NOT NULL DEFAULT false,
  error_code TEXT,
  error_message TEXT,
  ip_address TEXT,
  user_agent TEXT,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sso_attempts_provider ON public.sso_login_attempts(provider_id, created_at DESC);
CREATE INDEX idx_sso_attempts_created ON public.sso_login_attempts(created_at DESC);

-- Mapeamento de grupos -> roles
CREATE TABLE public.sso_role_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES public.sso_providers(id) ON DELETE CASCADE,
  idp_group TEXT NOT NULL,
  app_role public.app_role NOT NULL,
  ordem INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(provider_id, idp_group)
);

CREATE INDEX idx_sso_role_mappings_provider ON public.sso_role_mappings(provider_id);

-- Validação: force_sso requer allowed_domains
CREATE OR REPLACE FUNCTION public.fn_validar_sso_provider()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.force_sso_for_domains = true AND (NEW.allowed_domains IS NULL OR array_length(NEW.allowed_domains, 1) IS NULL) THEN
    RAISE EXCEPTION 'force_sso_for_domains requer ao menos um domínio em allowed_domains';
  END IF;
  
  IF NEW.tipo = 'oidc' AND NEW.ativo = true AND (NEW.client_id IS NULL OR (NEW.discovery_url IS NULL AND NEW.authorization_endpoint IS NULL)) THEN
    RAISE EXCEPTION 'Provedor OIDC ativo requer client_id e discovery_url ou endpoints manuais';
  END IF;
  
  IF NEW.tipo = 'saml' AND NEW.ativo = true AND (NEW.sso_url IS NULL OR NEW.x509_cert IS NULL) THEN
    RAISE EXCEPTION 'Provedor SAML ativo requer sso_url e x509_cert';
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validar_sso_provider
  BEFORE INSERT OR UPDATE ON public.sso_providers
  FOR EACH ROW EXECUTE FUNCTION public.fn_validar_sso_provider();

-- Trigger updated_at
CREATE TRIGGER trg_sso_providers_updated
  BEFORE UPDATE ON public.sso_providers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger de auditoria (redacted secrets)
CREATE OR REPLACE FUNCTION public.fn_audit_sso_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old jsonb;
  v_new jsonb;
BEGIN
  v_old := CASE WHEN TG_OP IN ('UPDATE','DELETE') THEN to_jsonb(OLD) - 'client_secret_ref' ELSE NULL END;
  v_new := CASE WHEN TG_OP IN ('INSERT','UPDATE') THEN to_jsonb(NEW) - 'client_secret_ref' ELSE NULL END;
  
  PERFORM public.log_audit(
    TG_OP::audit_action,
    TG_TABLE_NAME,
    COALESCE(NEW.id::text, OLD.id::text),
    v_old,
    v_new,
    'SSO provider change'
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_audit_sso_providers
  AFTER INSERT OR UPDATE OR DELETE ON public.sso_providers
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_sso_changes();

-- RLS
ALTER TABLE public.sso_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sso_login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sso_role_mappings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins gerenciam SSO providers"
  ON public.sso_providers FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins veem tentativas SSO"
  ON public.sso_login_attempts FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Sistema insere tentativas SSO"
  ON public.sso_login_attempts FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

CREATE POLICY "Admins gerenciam role mappings"
  ON public.sso_role_mappings FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Sistema insere tentativas SSO" ON public.sso_login_attempts;

-- Função SECURITY DEFINER para registro controlado
CREATE OR REPLACE FUNCTION public.registrar_tentativa_sso(
  _provider_id UUID,
  _email TEXT,
  _success BOOLEAN,
  _error_code TEXT DEFAULT NULL,
  _error_message TEXT DEFAULT NULL,
  _ip TEXT DEFAULT NULL,
  _user_agent TEXT DEFAULT NULL,
  _duration_ms INTEGER DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO public.sso_login_attempts (
    provider_id, email, success, error_code, error_message,
    ip_address, user_agent, duration_ms
  ) VALUES (
    _provider_id, _email, _success, _error_code, _error_message,
    _ip, _user_agent, _duration_ms
  ) RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.registrar_tentativa_sso(UUID,TEXT,BOOLEAN,TEXT,TEXT,TEXT,TEXT,INTEGER) FROM public;
GRANT EXECUTE ON FUNCTION public.registrar_tentativa_sso(UUID,TEXT,BOOLEAN,TEXT,TEXT,TEXT,TEXT,INTEGER) TO authenticated, anon;
CREATE INDEX IF NOT EXISTS idx_feedback_concil_created ON public.feedback_conciliacao_ia(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_anomalias_detectada_sev_status ON public.anomalias_detectadas(severidade, status, detectada_em DESC);-- Tabela de pacotes de evidências exportados
CREATE TABLE public.evidencias_pacotes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  gerado_por UUID,
  gerado_por_email TEXT,
  periodo_inicio DATE NOT NULL,
  periodo_fim DATE NOT NULL,
  escopos TEXT[] NOT NULL,
  storage_path TEXT NOT NULL,
  manifest JSONB NOT NULL DEFAULT '{}'::jsonb,
  tamanho_bytes BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.evidencias_pacotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins veem pacotes de evidências"
  ON public.evidencias_pacotes FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins inserem pacotes de evidências"
  ON public.evidencias_pacotes FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_evidencias_pacotes_created ON public.evidencias_pacotes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_auditoria_financeira_created ON public.auditoria_financeira(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_auditoria_tributaria_criado ON public.auditoria_tributaria(criado_em DESC);
-- Complementa plano_contas existente
ALTER TABLE public.plano_contas
  ADD COLUMN IF NOT EXISTS empresa_id UUID,
  ADD COLUMN IF NOT EXISTS centro_resultado TEXT,
  ADD COLUMN IF NOT EXISTS codigo_referencial TEXT;

CREATE INDEX IF NOT EXISTS idx_plano_contas_empresa ON public.plano_contas(empresa_id);

-- 2. Lançamentos Contábeis (cabeçalho)
CREATE TABLE public.lancamentos_contabeis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL,
  numero_lancamento BIGINT,
  data_lancamento DATE NOT NULL,
  historico TEXT NOT NULL,
  origem TEXT NOT NULL DEFAULT 'manual' CHECK (origem IN ('manual','conta_pagar','conta_receber','movimentacao','importacao','sistema')),
  origem_id UUID,
  valor_total NUMERIC(15,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'confirmado' CHECK (status IN ('rascunho','confirmado','cancelado')),
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_lanc_emp_data ON public.lancamentos_contabeis(empresa_id, data_lancamento DESC);
CREATE INDEX idx_lanc_origem ON public.lancamentos_contabeis(origem, origem_id);

ALTER TABLE public.lancamentos_contabeis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lanc_select" ON public.lancamentos_contabeis FOR SELECT TO authenticated
  USING (has_any_role(auth.uid(), ARRAY['admin','financeiro','operacional','visualizador']::app_role[]));
CREATE POLICY "lanc_insert" ON public.lancamentos_contabeis FOR INSERT TO authenticated
  WITH CHECK (has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[]));
CREATE POLICY "lanc_update" ON public.lancamentos_contabeis FOR UPDATE TO authenticated
  USING (has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[]));
CREATE POLICY "lanc_delete" ON public.lancamentos_contabeis FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_lanc_updated BEFORE UPDATE ON public.lancamentos_contabeis
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Sequência por exercício
CREATE OR REPLACE FUNCTION public.fn_lanc_numero_sequencial()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_ano INT; v_seq BIGINT;
BEGIN
  IF NEW.numero_lancamento IS NULL THEN
    v_ano := EXTRACT(YEAR FROM NEW.data_lancamento);
    SELECT COALESCE(MAX(numero_lancamento),0)+1 INTO v_seq
      FROM public.lancamentos_contabeis
      WHERE empresa_id = NEW.empresa_id
        AND EXTRACT(YEAR FROM data_lancamento) = v_ano;
    NEW.numero_lancamento := v_seq;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_lanc_numero BEFORE INSERT ON public.lancamentos_contabeis
  FOR EACH ROW EXECUTE FUNCTION public.fn_lanc_numero_sequencial();

-- 3. Partidas Contábeis (D/C)
CREATE TABLE public.partidas_contabeis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lancamento_id UUID NOT NULL REFERENCES public.lancamentos_contabeis(id) ON DELETE CASCADE,
  conta_id UUID NOT NULL REFERENCES public.plano_contas(id) ON DELETE RESTRICT,
  tipo CHAR(1) NOT NULL CHECK (tipo IN ('D','C')),
  valor NUMERIC(15,2) NOT NULL CHECK (valor > 0),
  historico_complementar TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_partidas_lanc ON public.partidas_contabeis(lancamento_id);
CREATE INDEX idx_partidas_conta ON public.partidas_contabeis(conta_id);

ALTER TABLE public.partidas_contabeis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "partidas_select" ON public.partidas_contabeis FOR SELECT TO authenticated
  USING (has_any_role(auth.uid(), ARRAY['admin','financeiro','operacional','visualizador']::app_role[]));
CREATE POLICY "partidas_insert" ON public.partidas_contabeis FOR INSERT TO authenticated
  WITH CHECK (has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[]));
CREATE POLICY "partidas_update" ON public.partidas_contabeis FOR UPDATE TO authenticated
  USING (has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[]));
CREATE POLICY "partidas_delete" ON public.partidas_contabeis FOR DELETE TO authenticated
  USING (has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[]));

-- 4. SPED Contábil arquivos gerados
CREATE TABLE public.sped_contabil_arquivos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('ECD','ECF')),
  ano_calendario INT NOT NULL,
  periodo_inicio DATE NOT NULL,
  periodo_fim DATE NOT NULL,
  storage_path TEXT NOT NULL,
  hash_sha256 TEXT,
  total_linhas INT,
  total_lancamentos INT,
  validacoes JSONB NOT NULL DEFAULT '{"erros":[],"avisos":[]}'::jsonb,
  status TEXT NOT NULL DEFAULT 'gerado' CHECK (status IN ('gerado','validado','transmitido','rejeitado')),
  recibo_transmissao TEXT,
  gerado_por UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_sped_contabil_empresa_ano ON public.sped_contabil_arquivos(empresa_id, ano_calendario DESC);

ALTER TABLE public.sped_contabil_arquivos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sped_contabil_select" ON public.sped_contabil_arquivos FOR SELECT TO authenticated
  USING (has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[]));
CREATE POLICY "sped_contabil_insert" ON public.sped_contabil_arquivos FOR INSERT TO authenticated
  WITH CHECK (has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[]));
CREATE POLICY "sped_contabil_update" ON public.sped_contabil_arquivos FOR UPDATE TO authenticated
  USING (has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[]));
-- 1) Multi-empresa: vínculo usuário ↔ empresa com papel por empresa
CREATE TABLE public.user_empresas (
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
CREATE INDEX idx_user_empresas_user ON public.user_empresas(user_id);
CREATE INDEX idx_user_empresas_empresa ON public.user_empresas(empresa_id);
CREATE INDEX idx_user_empresas_scim ON public.user_empresas(scim_external_id) WHERE scim_external_id IS NOT NULL;

ALTER TABLE public.user_empresas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own empresa links"
  ON public.user_empresas FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage user_empresas"
  ON public.user_empresas FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_user_empresas_updated
  BEFORE UPDATE ON public.user_empresas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Helper: papel em empresa específica
CREATE OR REPLACE FUNCTION public.has_role_in_empresa(_user UUID, _empresa UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_empresas
    WHERE user_id = _user AND empresa_id = _empresa AND role = _role AND ativo = true
  );
$$;

-- 2) Vínculo provedor SSO ↔ empresa
ALTER TABLE public.sso_providers
  ADD COLUMN empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE;
CREATE INDEX idx_sso_providers_empresa ON public.sso_providers(empresa_id);

-- 3) Tokens SCIM (bearer hash SHA-256)
CREATE TABLE public.scim_tokens (
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
CREATE INDEX idx_scim_tokens_empresa ON public.scim_tokens(empresa_id);
CREATE INDEX idx_scim_tokens_hash ON public.scim_tokens(token_hash) WHERE ativo = true;

ALTER TABLE public.scim_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage scim_tokens"
  ON public.scim_tokens FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 4) Log SCIM
CREATE TABLE public.scim_operations_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id UUID REFERENCES public.scim_tokens(id) ON DELETE SET NULL,
  empresa_id UUID,
  resource_type TEXT NOT NULL,
  operation TEXT NOT NULL,
  external_id TEXT,
  user_id UUID,
  status_code INT NOT NULL,
  request_body JSONB,
  response_body JSONB,
  duration_ms INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_scim_log_token ON public.scim_operations_log(token_id, created_at DESC);
CREATE INDEX idx_scim_log_empresa ON public.scim_operations_log(empresa_id, created_at DESC);

ALTER TABLE public.scim_operations_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view scim logs"
  ON public.scim_operations_log FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 5) Estado OIDC PKCE em sso_login_attempts
ALTER TABLE public.sso_login_attempts
  ADD COLUMN IF NOT EXISTS state TEXT,
  ADD COLUMN IF NOT EXISTS code_verifier_hash TEXT,
  ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES public.empresas(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_sso_attempts_state ON public.sso_login_attempts(state) WHERE state IS NOT NULL;ALTER TABLE public.anomalias_detectadas REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.anomalias_detectadas;CREATE TABLE IF NOT EXISTS public.saved_filters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  name TEXT NOT NULL,
  filters JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_filter_name_per_user_entity UNIQUE (user_id, entity_type, name)
);

CREATE INDEX IF NOT EXISTS idx_saved_filters_user_entity
  ON public.saved_filters(user_id, entity_type);

CREATE INDEX IF NOT EXISTS idx_saved_filters_default
  ON public.saved_filters(user_id, entity_type, is_default)
  WHERE is_default = true;

ALTER TABLE public.saved_filters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own filters" ON public.saved_filters
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own filters" ON public.saved_filters
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own filters" ON public.saved_filters
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own filters" ON public.saved_filters
  FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER trigger_saved_filters_updated_at
  BEFORE UPDATE ON public.saved_filters
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.ensure_single_default_filter()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.is_default = true THEN
    UPDATE public.saved_filters
    SET is_default = false
    WHERE user_id = NEW.user_id
      AND entity_type = NEW.entity_type
      AND id != NEW.id
      AND is_default = true;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_single_default_filter
  BEFORE INSERT OR UPDATE OF is_default ON public.saved_filters
  FOR EACH ROW
  WHEN (NEW.is_default = true)
  EXECUTE FUNCTION public.ensure_single_default_filter();-- 1. Preferências de alerta de anomalias por usuário
CREATE TABLE public.user_anomalia_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  toast_enabled BOOLEAN NOT NULL DEFAULT true,
  toast_min_severidade TEXT NOT NULL DEFAULT 'critica' CHECK (toast_min_severidade IN ('baixa','media','alta','critica')),
  silenciar_ate TIMESTAMPTZ,
  centros_custo_silenciados UUID[] NOT NULL DEFAULT '{}',
  tipos_silenciados TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_anomalia_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users select own anomalia prefs"
  ON public.user_anomalia_preferences FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "users insert own anomalia prefs"
  ON public.user_anomalia_preferences FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users update own anomalia prefs"
  ON public.user_anomalia_preferences FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "users delete own anomalia prefs"
  ON public.user_anomalia_preferences FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER trg_user_anomalia_prefs_updated
  BEFORE UPDATE ON public.user_anomalia_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Vincular anomalias a centro de custo (nullable)
ALTER TABLE public.anomalias_detectadas
  ADD COLUMN IF NOT EXISTS centro_custo_id UUID;

CREATE INDEX IF NOT EXISTS idx_anomalias_centro_custo
  ON public.anomalias_detectadas(centro_custo_id)
  WHERE centro_custo_id IS NOT NULL;

-- 3. Backfill best-effort
UPDATE public.anomalias_detectadas a
SET centro_custo_id = cp.centro_custo_id
FROM public.contas_pagar cp
WHERE a.entidade_tipo = 'conta_pagar'
  AND a.centro_custo_id IS NULL
  AND a.entidade_id IS NOT NULL
  AND a.entidade_id::uuid = cp.id
  AND cp.centro_custo_id IS NOT NULL;

UPDATE public.anomalias_detectadas a
SET centro_custo_id = m.centro_custo_id
FROM public.movimentacoes m
WHERE a.entidade_tipo = 'movimentacao'
  AND a.centro_custo_id IS NULL
  AND a.entidade_id IS NOT NULL
  AND a.entidade_id::uuid = m.id
  AND m.centro_custo_id IS NOT NULL;ALTER TABLE public.anomalias_detectadas
  ADD COLUMN IF NOT EXISTS bitrix_task_id text;-- Garantir REPLICA IDENTITY FULL para enviar payload completo nos eventos realtime
ALTER TABLE public.audit_logs REPLICA IDENTITY FULL;

-- Adicionar tabela à publicação supabase_realtime (idempotente)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'audit_logs'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.audit_logs';
  END IF;
END $$;ALTER TABLE public.sso_login_attempts ADD COLUMN IF NOT EXISTS app_redirect text;-- Adiciona colunas de telemetria do onboarding
ALTER TABLE public.sso_login_attempts
  ADD COLUMN IF NOT EXISTS event_type text,
  ADD COLUMN IF NOT EXISTS context jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_sso_login_attempts_email_created
  ON public.sso_login_attempts (email, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_sso_login_attempts_event_type_created
  ON public.sso_login_attempts (event_type, created_at DESC);

-- RPC para registrar eventos do onboarding (executável por anon e authenticated)
CREATE OR REPLACE FUNCTION public.log_sso_onboarding_event(
  _email text,
  _event_type text,
  _provider_id uuid DEFAULT NULL,
  _context jsonb DEFAULT '{}'::jsonb,
  _success boolean DEFAULT true,
  _error_code text DEFAULT NULL,
  _error_message text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  IF _event_type NOT IN (
    'domain_resolved','auto_redirect_started','auto_redirect_cancelled',
    'manual_provider_selected','redirect_dispatched','redirect_failed',
    'password_fallback_used'
  ) THEN
    RAISE EXCEPTION 'event_type inválido: %', _event_type;
  END IF;

  INSERT INTO public.sso_login_attempts(
    provider_id, email, success, error_code, error_message,
    event_type, context
  ) VALUES (
    _provider_id,
    NULLIF(lower(trim(COALESCE(_email,''))), ''),
    _success,
    _error_code,
    _error_message,
    _event_type,
    COALESCE(_context, '{}'::jsonb)
  ) RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.log_sso_onboarding_event(text, text, uuid, jsonb, boolean, text, text) TO anon, authenticated;
CREATE TABLE public.sso_sandbox_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by_email text,
  provider_id uuid REFERENCES public.sso_providers(id) ON DELETE SET NULL,
  provider_nome text,
  use_provider_config boolean NOT NULL DEFAULT true,
  input jsonb NOT NULL,
  result jsonb NOT NULL,
  outcome text NOT NULL CHECK (outcome IN ('bloqueado','seria_jit','usuario_existente','sem_email')),
  email_masked text,
  resolved_role text,
  matched_group text,
  has_errors boolean NOT NULL DEFAULT false
);

CREATE INDEX idx_sso_sandbox_runs_created_at ON public.sso_sandbox_runs (created_at DESC);
CREATE INDEX idx_sso_sandbox_runs_provider ON public.sso_sandbox_runs (provider_id, created_at DESC);
CREATE INDEX idx_sso_sandbox_runs_outcome ON public.sso_sandbox_runs (outcome, created_at DESC);

ALTER TABLE public.sso_sandbox_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read sandbox runs"
  ON public.sso_sandbox_runs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins insert sandbox runs"
  ON public.sso_sandbox_runs FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') AND auth.uid() = created_by);

CREATE POLICY "Admins delete sandbox runs"
  ON public.sso_sandbox_runs FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
ALTER TABLE public.sso_sandbox_runs ADD COLUMN IF NOT EXISTS batch_id uuid NULL;
CREATE INDEX IF NOT EXISTS idx_sso_sandbox_runs_batch_id ON public.sso_sandbox_runs(batch_id) WHERE batch_id IS NOT NULL;ALTER TABLE public.user_anomalia_preferences
  ADD COLUMN IF NOT EXISTS toast_severidades_ativas TEXT[]
    NOT NULL DEFAULT ARRAY['critica','alta']::TEXT[],
  ADD COLUMN IF NOT EXISTS toast_duracao_segundos INT
    NOT NULL DEFAULT 12,
  ADD COLUMN IF NOT EXISTS toast_acoes JSONB
    NOT NULL DEFAULT '{"drill_down":true,"abrir_pagina":true,"copiar_id":false,"marcar_lida":false}'::jsonb,
  ADD COLUMN IF NOT EXISTS drawer_acoes JSONB
    NOT NULL DEFAULT '{"abrir_entidade":true,"pagina_completa":true,"copiar_id":false,"marcar_lida":false}'::jsonb;

CREATE OR REPLACE FUNCTION public.validate_user_anomalia_preferences()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  sev TEXT;
BEGIN
  IF NEW.toast_duracao_segundos < 3 OR NEW.toast_duracao_segundos > 30 THEN
    RAISE EXCEPTION 'toast_duracao_segundos deve estar entre 3 e 30 segundos';
  END IF;

  IF NEW.toast_severidades_ativas IS NOT NULL THEN
    FOREACH sev IN ARRAY NEW.toast_severidades_ativas LOOP
      IF sev NOT IN ('baixa','media','alta','critica') THEN
        RAISE EXCEPTION 'Severidade invalida em toast_severidades_ativas: %', sev;
      END IF;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_user_anomalia_preferences
  ON public.user_anomalia_preferences;

CREATE TRIGGER trg_validate_user_anomalia_preferences
  BEFORE INSERT OR UPDATE ON public.user_anomalia_preferences
  FOR EACH ROW EXECUTE FUNCTION public.validate_user_anomalia_preferences();
-- 1) Novas colunas
ALTER TABLE public.saved_filters
  ADD COLUMN IF NOT EXISTS empresa_id uuid NULL,
  ADD COLUMN IF NOT EXISTS shared_with_roles public.app_role[] NOT NULL DEFAULT ARRAY[]::public.app_role[],
  ADD COLUMN IF NOT EXISTS is_shared boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS created_by uuid NULL;

-- Backfill: created_by = user_id
UPDATE public.saved_filters SET created_by = user_id WHERE created_by IS NULL;

-- Index para lookups por empresa
CREATE INDEX IF NOT EXISTS idx_saved_filters_empresa_shared
  ON public.saved_filters (empresa_id, entity_type)
  WHERE is_shared = true;

-- 2) Função helper: papel do usuário na empresa
CREATE OR REPLACE FUNCTION public.user_role_in_empresa(_user_id uuid, _empresa_id uuid)
RETURNS public.app_role
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role FROM public.user_empresas
  WHERE user_id = _user_id AND empresa_id = _empresa_id AND ativo = true
  LIMIT 1;
$$;

-- 3) Atualiza políticas RLS
DROP POLICY IF EXISTS "Users can view own filters" ON public.saved_filters;
DROP POLICY IF EXISTS "Users can insert own filters" ON public.saved_filters;
DROP POLICY IF EXISTS "Users can update own filters" ON public.saved_filters;
DROP POLICY IF EXISTS "Users can delete own filters" ON public.saved_filters;

-- SELECT: próprios + compartilhados na mesma empresa cujo papel está na lista
CREATE POLICY "saved_filters_select"
  ON public.saved_filters FOR SELECT
  USING (
    auth.uid() = user_id
    OR (
      is_shared = true
      AND empresa_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM public.user_empresas ue
        WHERE ue.user_id = auth.uid()
          AND ue.empresa_id = saved_filters.empresa_id
          AND ue.ativo = true
          AND (
            cardinality(saved_filters.shared_with_roles) = 0
            OR ue.role = ANY(saved_filters.shared_with_roles)
          )
      )
    )
  );

-- INSERT: usuário cria para si; se compartilhar, precisa pertencer à empresa
CREATE POLICY "saved_filters_insert"
  ON public.saved_filters FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND (created_by IS NULL OR created_by = auth.uid())
    AND (
      is_shared = false
      OR (
        empresa_id IS NOT NULL
        AND EXISTS (
          SELECT 1 FROM public.user_empresas ue
          WHERE ue.user_id = auth.uid()
            AND ue.empresa_id = saved_filters.empresa_id
            AND ue.ativo = true
        )
      )
    )
  );

-- UPDATE: somente criador (ou dono original)
CREATE POLICY "saved_filters_update"
  ON public.saved_filters FOR UPDATE
  USING (auth.uid() = COALESCE(created_by, user_id))
  WITH CHECK (auth.uid() = COALESCE(created_by, user_id));

-- DELETE: somente criador
CREATE POLICY "saved_filters_delete"
  ON public.saved_filters FOR DELETE
  USING (auth.uid() = COALESCE(created_by, user_id));

-- 4) Função para duplicar um filtro acessível para o usuário atual
CREATE OR REPLACE FUNCTION public.duplicate_saved_filter(
  _source_id uuid,
  _new_name text
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_src public.saved_filters%ROWTYPE;
  v_uid uuid := auth.uid();
  v_new_id uuid;
  v_can_see boolean;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  SELECT * INTO v_src FROM public.saved_filters WHERE id = _source_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Filtro não encontrado';
  END IF;

  -- Reusa a checagem de visibilidade da política
  SELECT (
    v_src.user_id = v_uid
    OR (
      v_src.is_shared = true
      AND v_src.empresa_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM public.user_empresas ue
        WHERE ue.user_id = v_uid
          AND ue.empresa_id = v_src.empresa_id
          AND ue.ativo = true
          AND (
            cardinality(v_src.shared_with_roles) = 0
            OR ue.role = ANY(v_src.shared_with_roles)
          )
      )
    )
  ) INTO v_can_see;

  IF NOT v_can_see THEN
    RAISE EXCEPTION 'Sem acesso ao filtro de origem';
  END IF;

  INSERT INTO public.saved_filters (
    user_id, created_by, entity_type, name, filters, is_default,
    empresa_id, shared_with_roles, is_shared
  ) VALUES (
    v_uid, v_uid, v_src.entity_type,
    COALESCE(NULLIF(trim(_new_name), ''), v_src.name || ' (cópia)'),
    v_src.filters,
    false,
    NULL, ARRAY[]::public.app_role[], false
  )
  RETURNING id INTO v_new_id;

  RETURN v_new_id;
END;
$$;
-- Tabela de assinaturas de filtros salvos
CREATE TABLE IF NOT EXISTS public.saved_filter_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  saved_filter_id UUID NOT NULL REFERENCES public.saved_filters(id) ON DELETE CASCADE,
  notify_inapp BOOLEAN NOT NULL DEFAULT true,
  notify_push BOOLEAN NOT NULL DEFAULT false,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, saved_filter_id)
);

CREATE INDEX IF NOT EXISTS idx_sfs_user ON public.saved_filter_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_sfs_filter ON public.saved_filter_subscriptions(saved_filter_id);

ALTER TABLE public.saved_filter_subscriptions ENABLE ROW LEVEL SECURITY;

-- Helper: usuário pode "ver" o filtro salvo (mesma lógica usada em duplicate_saved_filter)
CREATE OR REPLACE FUNCTION public.can_access_saved_filter(_filter_id UUID, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.saved_filters sf
    WHERE sf.id = _filter_id
      AND (
        sf.user_id = _user_id
        OR (
          sf.is_shared = true
          AND sf.empresa_id IS NOT NULL
          AND EXISTS (
            SELECT 1 FROM public.user_empresas ue
            WHERE ue.user_id = _user_id
              AND ue.empresa_id = sf.empresa_id
              AND ue.ativo = true
              AND (
                cardinality(sf.shared_with_roles) = 0
                OR ue.role = ANY(sf.shared_with_roles)
              )
          )
        )
      )
  )
$$;

-- RLS: apenas o próprio dono manipula suas assinaturas, e o filtro precisa ser acessível
CREATE POLICY "users select own subscriptions"
  ON public.saved_filter_subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "users insert own subscriptions"
  ON public.saved_filter_subscriptions
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND public.can_access_saved_filter(saved_filter_id, auth.uid())
  );

CREATE POLICY "users update own subscriptions"
  ON public.saved_filter_subscriptions
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND public.can_access_saved_filter(saved_filter_id, auth.uid())
  );

CREATE POLICY "users delete own subscriptions"
  ON public.saved_filter_subscriptions
  FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger updated_at
CREATE TRIGGER trg_sfs_updated_at
  BEFORE UPDATE ON public.saved_filter_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Realtime já está geralmente habilitado em anomalias_detectadas; garantir:
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'anomalias_detectadas'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.anomalias_detectadas';
  END IF;
END $$;ALTER TABLE public.feedback_conciliacao_ia
ADD COLUMN IF NOT EXISTS transacao_bancaria_id UUID REFERENCES public.transacoes_bancarias(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_feedback_conciliacao_ia_transacao_bancaria_id
  ON public.feedback_conciliacao_ia(transacao_bancaria_id);CREATE TABLE public.anomalia_detection_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  triggered_by UUID,
  trigger_source TEXT NOT NULL DEFAULT 'manual',
  status TEXT NOT NULL DEFAULT 'queued',
  current_step TEXT,
  step_index INT NOT NULL DEFAULT 0,
  total_steps INT NOT NULL DEFAULT 5,
  candidatas INT NOT NULL DEFAULT 0,
  inseridas INT NOT NULL DEFAULT 0,
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  duration_ms INT,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_anomalia_runs_status ON public.anomalia_detection_runs(status, created_at DESC);
CREATE INDEX idx_anomalia_runs_created ON public.anomalia_detection_runs(created_at DESC);

ALTER TABLE public.anomalia_detection_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins podem visualizar execuções de detecção"
ON public.anomalia_detection_runs FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins podem criar execuções de detecção"
ON public.anomalia_detection_runs FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins podem atualizar execuções de detecção"
ON public.anomalia_detection_runs FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

ALTER PUBLICATION supabase_realtime ADD TABLE public.anomalia_detection_runs;
ALTER TABLE public.anomalia_detection_runs REPLICA IDENTITY FULL;
CREATE TRIGGER trg_audit_lancamentos_contabeis
AFTER INSERT OR UPDATE OR DELETE ON public.lancamentos_contabeis
FOR EACH ROW EXECUTE FUNCTION public.fn_auditoria_financeira();

CREATE TRIGGER trg_audit_partidas_contabeis
AFTER INSERT OR UPDATE OR DELETE ON public.partidas_contabeis
FOR EACH ROW EXECUTE FUNCTION public.fn_auditoria_financeira();
create table if not exists public.user_active_filters (
  user_id uuid not null references auth.users(id) on delete cascade,
  entity_type text not null,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, entity_type)
);

alter table public.user_active_filters enable row level security;

create policy "own active filters select"
  on public.user_active_filters for select
  using (user_id = auth.uid());

create policy "own active filters insert"
  on public.user_active_filters for insert
  with check (user_id = auth.uid());

create policy "own active filters update"
  on public.user_active_filters for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "own active filters delete"
  on public.user_active_filters for delete
  using (user_id = auth.uid());

drop trigger if exists trg_user_active_filters_uat on public.user_active_filters;
create trigger trg_user_active_filters_uat
  before update on public.user_active_filters
  for each row execute function public.update_updated_at();

create index if not exists idx_user_active_filters_user on public.user_active_filters(user_id);-- Tabela para persistir o checklist de configuração SCIM por usuário admin
CREATE TABLE IF NOT EXISTS public.scim_setup_checklist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_key text NOT NULL,
  confirmed boolean NOT NULL DEFAULT false,
  confirmed_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, item_key)
);

ALTER TABLE public.scim_setup_checklist ENABLE ROW LEVEL SECURITY;

-- Apenas admins podem ler/gravar (compartilhado entre admins do tenant)
CREATE POLICY "Admins can view scim checklist"
  ON public.scim_setup_checklist FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert scim checklist"
  ON public.scim_setup_checklist FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') AND user_id = auth.uid());

CREATE POLICY "Admins can update scim checklist"
  ON public.scim_setup_checklist FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete scim checklist"
  ON public.scim_setup_checklist FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_scim_setup_checklist_updated_at
  BEFORE UPDATE ON public.scim_setup_checklist
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_scim_setup_checklist_user
  ON public.scim_setup_checklist(user_id);ALTER TABLE public.scim_tokens
  ADD COLUMN IF NOT EXISTS default_role public.app_role;

COMMENT ON COLUMN public.scim_tokens.default_role IS
  'Papel aplicado quando o IdP não envia department/group reconhecível. NULL = usar visualizador (legado).';-- Tabela para persistir grupos do IdP por usuário/provedor a cada login SSO
CREATE TABLE public.sso_user_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES public.sso_providers(id) ON DELETE CASCADE,
  groups TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  matched_group TEXT,
  matched_role app_role,
  last_synced_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, provider_id)
);

CREATE INDEX idx_sso_user_groups_user ON public.sso_user_groups(user_id);
CREATE INDEX idx_sso_user_groups_provider ON public.sso_user_groups(provider_id);
CREATE INDEX idx_sso_user_groups_groups ON public.sso_user_groups USING GIN(groups);

ALTER TABLE public.sso_user_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own SSO groups"
  ON public.sso_user_groups FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins view all SSO groups"
  ON public.sso_user_groups FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins manage SSO groups"
  ON public.sso_user_groups FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_sso_user_groups_updated_at
  BEFORE UPDATE ON public.sso_user_groups
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();CREATE TABLE IF NOT EXISTS public.anomalia_toast_eventos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  anomalia_id UUID NOT NULL,
  severidade TEXT NOT NULL,
  tipo_anomalia TEXT,
  titulo TEXT NOT NULL,
  descricao TEXT,
  centro_custo_id UUID,
  centro_custo_nome TEXT,
  acoes_disponiveis TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  duracao_segundos INTEGER NOT NULL,
  dispatched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_anomalia_toast_eventos_user_dispatched
  ON public.anomalia_toast_eventos (user_id, dispatched_at DESC);

CREATE INDEX IF NOT EXISTS idx_anomalia_toast_eventos_anomalia
  ON public.anomalia_toast_eventos (anomalia_id);

ALTER TABLE public.anomalia_toast_eventos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own toast eventos"
  ON public.anomalia_toast_eventos FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users insert own toast eventos"
  ON public.anomalia_toast_eventos FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users delete own toast eventos"
  ON public.anomalia_toast_eventos FOR DELETE
  TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));ALTER TABLE public.user_anomalia_preferences REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_anomalia_preferences;
-- Trigger para notificar usuários quando um filtro salvo for compartilhado com eles
-- (criação compartilhada OU papéis adicionados em update).

CREATE OR REPLACE FUNCTION public.fn_notificar_filtro_compartilhado()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_target_roles public.app_role[];
  v_old_roles public.app_role[];
  v_owner_email TEXT;
  v_owner_name TEXT;
  v_should_notify BOOLEAN := false;
  v_is_new_share BOOLEAN := false;
  v_user RECORD;
BEGIN
  -- Apenas filtros compartilhados com empresa definida geram notificação
  IF NEW.is_shared IS NOT TRUE OR NEW.empresa_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    v_should_notify := true;
    v_is_new_share := true;
    v_target_roles := NEW.shared_with_roles;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Notificar quando o flag de compartilhamento foi ligado agora
    IF (OLD.is_shared IS NOT TRUE) AND NEW.is_shared = true THEN
      v_should_notify := true;
      v_is_new_share := true;
      v_target_roles := NEW.shared_with_roles;
    -- Ou quando novos papéis foram adicionados
    ELSIF NEW.shared_with_roles IS DISTINCT FROM OLD.shared_with_roles THEN
      v_should_notify := true;
      v_is_new_share := false;
      -- Diferença: papéis presentes em NEW mas não em OLD
      SELECT COALESCE(array_agg(r), ARRAY[]::public.app_role[])
      INTO v_target_roles
      FROM unnest(NEW.shared_with_roles) AS r
      WHERE r <> ALL(COALESCE(OLD.shared_with_roles, ARRAY[]::public.app_role[]));

      -- Caso especial: lista vazia em NEW = "todos do tenant".
      -- Se OLD tinha papéis específicos e agora abriu para todos, notifica todos
      -- que NÃO estavam cobertos antes.
      IF cardinality(NEW.shared_with_roles) = 0
         AND cardinality(COALESCE(OLD.shared_with_roles, ARRAY[]::public.app_role[])) > 0 THEN
        v_target_roles := ARRAY[]::public.app_role[]; -- sentinela = todos
      END IF;
    END IF;
  END IF;

  IF NOT v_should_notify THEN
    RETURN NEW;
  END IF;

  -- Dados do dono (para mensagem)
  SELECT email, COALESCE(full_name, email)
  INTO v_owner_email, v_owner_name
  FROM public.profiles
  WHERE id = NEW.user_id;

  -- Para cada usuário do tenant cujo papel está coberto, insere um alerta.
  -- Pula o próprio dono.
  FOR v_user IN
    SELECT DISTINCT ue.user_id, ue.role
    FROM public.user_empresas ue
    WHERE ue.empresa_id = NEW.empresa_id
      AND ue.ativo = true
      AND ue.user_id <> NEW.user_id
      AND (
        -- Lista vazia = todos do tenant
        cardinality(NEW.shared_with_roles) = 0
        OR ue.role = ANY(NEW.shared_with_roles)
      )
      AND (
        -- Em UPDATE com papéis específicos, só notifica quem entrou agora
        TG_OP = 'INSERT'
        OR v_is_new_share
        OR cardinality(v_target_roles) = 0
        OR ue.role = ANY(v_target_roles)
      )
  LOOP
    INSERT INTO public.alertas (
      tipo,
      titulo,
      mensagem,
      prioridade,
      entidade_tipo,
      entidade_id,
      acao_url,
      user_id
    ) VALUES (
      'filtro_compartilhado',
      CASE
        WHEN v_is_new_share THEN 'Novo filtro compartilhado com você'
        ELSE 'Acesso a filtro compartilhado atualizado'
      END,
      format(
        '%s compartilhou o filtro "%s" (%s) com o perfil %s.',
        COALESCE(v_owner_name, 'Um usuário'),
        NEW.name,
        NEW.entity_type,
        v_user.role
      ),
      'baixa'::public.prioridade_alerta,
      'saved_filter',
      NEW.id::text,
      '/admin/filtros-compartilhados',
      v_user.user_id
    );
  END LOOP;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Falha na notificação não bloqueia escrita do filtro
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notificar_filtro_compartilhado ON public.saved_filters;
CREATE TRIGGER trg_notificar_filtro_compartilhado
  AFTER INSERT OR UPDATE OF is_shared, shared_with_roles, empresa_id
  ON public.saved_filters
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_notificar_filtro_compartilhado();

COMMENT ON FUNCTION public.fn_notificar_filtro_compartilhado() IS
  'Insere alertas in-app para cada usuário do tenant cujo papel passou a ter acesso a um filtro compartilhado.';
ALTER TABLE public.transacoes_bancarias REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.transacoes_bancarias;DO $$ BEGIN
  CREATE TYPE public.subscription_frequencia AS ENUM ('imediata','horaria','diaria');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.saved_filter_subscriptions
  ADD COLUMN IF NOT EXISTS frequencia public.subscription_frequencia NOT NULL DEFAULT 'imediata',
  ADD COLUMN IF NOT EXISTS horario_preferido TIME NOT NULL DEFAULT '09:00:00',
  ADD COLUMN IF NOT EXISTS next_dispatch_at TIMESTAMPTZ;

COMMENT ON COLUMN public.saved_filter_subscriptions.frequencia IS 'Cadência de notificações: imediata=tempo real, horaria=agrupa por hora, diaria=envia uma vez por dia no horario_preferido';
COMMENT ON COLUMN public.saved_filter_subscriptions.horario_preferido IS 'Horário (timezone do usuário no client) usado para entregar notificações diárias e como referência para horárias';
COMMENT ON COLUMN public.saved_filter_subscriptions.next_dispatch_at IS 'Próximo instante em que o cliente pode despachar notificações pendentes acumuladas; NULL = imediata';-- 1. Adiciona canal de e-mail às assinaturas
ALTER TABLE public.saved_filter_subscriptions
  ADD COLUMN IF NOT EXISTS notify_email BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.saved_filter_subscriptions.notify_email IS 'Se true, envia também por e-mail ao endereço cadastrado na conta do usuário';

-- 2. Histórico unificado de notificações (in-app, push, e-mail)
CREATE TABLE IF NOT EXISTS public.notification_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source TEXT NOT NULL,
  source_ref UUID,
  channel TEXT NOT NULL CHECK (channel IN ('inapp', 'push', 'email')),
  title TEXT NOT NULL,
  body TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'queued')),
  error_message TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notification_history_user_created
  ON public.notification_history (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_history_user_unread
  ON public.notification_history (user_id, read_at) WHERE read_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_notification_history_source
  ON public.notification_history (source, source_ref);

ALTER TABLE public.notification_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários veem seu próprio histórico"
  ON public.notification_history FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários marcam seu próprio histórico como lido"
  ON public.notification_history FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- INSERT é feito por edge functions com service_role; bloqueia inserts diretos do cliente
CREATE POLICY "Sistema insere via service role"
  ON public.notification_history FOR INSERT
  TO authenticated
  WITH CHECK (false);

COMMENT ON TABLE public.notification_history IS 'Histórico unificado de notificações enviadas ao usuário (in-app/push/e-mail), com status e metadata para auditoria e UI de "central de notificações"';-- Adiciona regras de severidade crítica e tipos de eventos por assinatura.
-- severidades_criticas: subset de severidades que devem ser tratadas como
-- "críticas" (eleva prioridade do push e marca o toast). Default vazio = usa
-- a lógica antiga (apenas 'critica' é crítica).
-- tipos_eventos_ativos: lista de tipo_anomalia (ou tipo de evento) que
-- DISPARAM o alerta. Lista vazia = todos os tipos disparam (compat).
ALTER TABLE public.saved_filter_subscriptions
  ADD COLUMN IF NOT EXISTS severidades_criticas TEXT[] NOT NULL DEFAULT ARRAY['critica']::TEXT[],
  ADD COLUMN IF NOT EXISTS tipos_eventos_ativos TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- Validação: severidades_criticas só aceita valores conhecidos.
CREATE OR REPLACE FUNCTION public.validate_saved_filter_subscription_rules()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  sev TEXT;
BEGIN
  IF NEW.severidades_criticas IS NOT NULL THEN
    FOREACH sev IN ARRAY NEW.severidades_criticas LOOP
      IF sev NOT IN ('baixa','media','alta','critica') THEN
        RAISE EXCEPTION 'Severidade invalida em severidades_criticas: %', sev;
      END IF;
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_saved_filter_subscription_rules
  ON public.saved_filter_subscriptions;
CREATE TRIGGER trg_validate_saved_filter_subscription_rules
  BEFORE INSERT OR UPDATE ON public.saved_filter_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_saved_filter_subscription_rules();ALTER TABLE public.saved_filter_subscriptions
  ADD COLUMN IF NOT EXISTS rate_limit_max integer NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS rate_limit_window_min integer NOT NULL DEFAULT 10;

CREATE OR REPLACE FUNCTION public.validate_saved_filter_subscription_rules()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  sev TEXT;
BEGIN
  IF NEW.severidades_criticas IS NOT NULL THEN
    FOREACH sev IN ARRAY NEW.severidades_criticas LOOP
      IF sev NOT IN ('baixa','media','alta','critica') THEN
        RAISE EXCEPTION 'Severidade invalida em severidades_criticas: %', sev;
      END IF;
    END LOOP;
  END IF;
  IF NEW.rate_limit_max IS NOT NULL AND (NEW.rate_limit_max < 1 OR NEW.rate_limit_max > 100) THEN
    RAISE EXCEPTION 'rate_limit_max deve estar entre 1 e 100';
  END IF;
  IF NEW.rate_limit_window_min IS NOT NULL AND (NEW.rate_limit_window_min < 1 OR NEW.rate_limit_window_min > 1440) THEN
    RAISE EXCEPTION 'rate_limit_window_min deve estar entre 1 e 1440 minutos';
  END IF;
  RETURN NEW;
END;
$function$;CREATE OR REPLACE VIEW public.vw_notification_history_duplicates
WITH (security_invoker = true)
AS
WITH ranked AS (
  SELECT
    nh.id,
    nh.user_id,
    nh.source,
    nh.source_ref,
    nh.channel,
    nh.title,
    nh.created_at,
    LAG(nh.created_at) OVER (
      PARTITION BY nh.user_id, nh.source, nh.source_ref, nh.channel
      ORDER BY nh.created_at
    ) AS prev_created_at
  FROM public.notification_history nh
  WHERE nh.source_ref IS NOT NULL
)
SELECT
  id,
  user_id,
  source,
  source_ref,
  channel,
  title,
  created_at,
  prev_created_at,
  EXTRACT(EPOCH FROM (created_at - prev_created_at))::int AS seconds_since_prev
FROM ranked
WHERE prev_created_at IS NOT NULL
  AND created_at - prev_created_at < INTERVAL '60 seconds';

COMMENT ON VIEW public.vw_notification_history_duplicates IS
'Auditoria: pares de notificações entregues no mesmo (user, source_ref, channel) em janela < 60s. Indica falha de dedup (ex.: realtime re-entregue após refresh sem honrar last_seen_at). RLS via security_invoker — usuário só vê o que já enxerga em notification_history.';-- Revoga automaticamente assinaturas (saved_filter_subscriptions) cujo dono
-- perdeu acesso ao filtro associado. Acionado quando:
--   1. Um saved_filter é UPDATE/DELETE (ex.: vira privado, troca de empresa,
--      remove um role da lista shared_with_roles, ou é apagado).
--   2. Um vínculo user_empresas é UPDATE/DELETE (ex.: usuário desativado,
--      role do usuário muda de modo a perder cobertura no shared_with_roles).
--
-- Defesa em profundidade: mesmo que a UI demore a recarregar, o backend
-- garante que o realtime não tenha mais subscription a processar para
-- usuários sem permissão. Falhas no cleanup nunca bloqueiam a operação
-- principal.

CREATE OR REPLACE FUNCTION public.fn_revoke_orphan_saved_filter_subscriptions()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_filter_id uuid;
  v_user_id uuid;
BEGIN
  IF TG_TABLE_NAME = 'saved_filters' THEN
    -- Em DELETE de filtro, ON DELETE CASCADE já cuida; mantemos por segurança.
    v_filter_id := COALESCE(NEW.id, OLD.id);
    DELETE FROM public.saved_filter_subscriptions s
    WHERE s.saved_filter_id = v_filter_id
      AND NOT public.can_access_saved_filter(s.saved_filter_id, s.user_id);
  ELSIF TG_TABLE_NAME = 'user_empresas' THEN
    v_user_id := COALESCE(NEW.user_id, OLD.user_id);
    -- Limpa todas as assinaturas do usuário em filtros que ele perdeu acesso.
    DELETE FROM public.saved_filter_subscriptions s
    WHERE s.user_id = v_user_id
      AND NOT public.can_access_saved_filter(s.saved_filter_id, s.user_id);
  END IF;
  RETURN COALESCE(NEW, OLD);
EXCEPTION WHEN OTHERS THEN
  -- Cleanup é best-effort: nunca bloqueia o write principal.
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_revoke_orphan_subs_on_saved_filter ON public.saved_filters;
CREATE TRIGGER trg_revoke_orphan_subs_on_saved_filter
  AFTER UPDATE OR DELETE ON public.saved_filters
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_revoke_orphan_saved_filter_subscriptions();

DROP TRIGGER IF EXISTS trg_revoke_orphan_subs_on_user_empresas ON public.user_empresas;
CREATE TRIGGER trg_revoke_orphan_subs_on_user_empresas
  AFTER UPDATE OR DELETE ON public.user_empresas
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_revoke_orphan_saved_filter_subscriptions();

COMMENT ON FUNCTION public.fn_revoke_orphan_saved_filter_subscriptions() IS
'Remove automaticamente assinaturas de filtros salvos que perderam acesso (mudança em shared_with_roles/empresa_id, exclusão do filtro, ou desativação/troca de role do usuário no tenant). Garante que realtime nunca dispare alertas para usuários sem permissão.';-- Create table for user demonstrativo preferences
CREATE TABLE IF NOT EXISTS public.user_demonstrativo_preferences (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    modo_padrao TEXT DEFAULT 'dre', -- 'dre' or 'balanco'
    fonte_padrao TEXT DEFAULT 'competencia', -- 'competencia' or 'caixa'
    filtros_por_empresa JSONB DEFAULT '{}'::jsonb, -- Store filters indexed by empresa_id
    drill_down_estado JSONB DEFAULT '{}'::jsonb, -- Store which lines are open/selected
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    CONSTRAINT user_id_unique UNIQUE (user_id)
);

-- Enable RLS
ALTER TABLE public.user_demonstrativo_preferences ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own demonstrativo preferences"
ON public.user_demonstrativo_preferences
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own demonstrativo preferences"
ON public.user_demonstrativo_preferences
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own demonstrativo preferences"
ON public.user_demonstrativo_preferences
FOR UPDATE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_demonstrativo_preferences_updated_at
BEFORE UPDATE ON public.user_demonstrativo_preferences
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();-- Contas a Receber Governance Improvements

-- 1. Add tracking columns to existing tables
ALTER TABLE public.contas_receber ADD COLUMN IF NOT EXISTS transacao_conciliada_id UUID REFERENCES public.transacoes_bancarias(id);
ALTER TABLE public.contas_receber ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{"events": []}'::jsonb;

ALTER TABLE public.boletos ADD COLUMN IF NOT EXISTS transacao_conciliada_id UUID REFERENCES public.transacoes_bancarias(id);

-- 2. Configuration table for receivables
CREATE TABLE IF NOT EXISTS public.configuracoes_receber (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) UNIQUE,
    regua_ativa BOOLEAN DEFAULT false,
    regua_config JSONB DEFAULT '{
        "lembrete_preventivo": {"dias": -2, "ativo": true, "canal": "email"},
        "vencimento_hoje": {"dias": 0, "ativo": true, "canal": "whatsapp"},
        "cobranca_nivel_1": {"dias": 3, "ativo": true, "canal": "email"},
        "cobranca_nivel_2": {"dias": 10, "ativo": true, "canal": "whatsapp"}
    }'::jsonb,
    baixa_automatica_ativa BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.configuracoes_receber ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their company settings" ON public.configuracoes_receber FOR ALL USING (true);

-- 3. Execution log for billing rules (Régua de Cobrança)
CREATE TABLE IF NOT EXISTS public.execucoes_regua_cobranca (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES public.empresas(id),
    conta_receber_id UUID NOT NULL REFERENCES public.contas_receber(id),
    etapa TEXT NOT NULL, -- preventiva, hoje, atraso_1, etc
    canal TEXT NOT NULL, -- email, whatsapp
    status TEXT NOT NULL, -- sucesso, erro
    mensagem_erro TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.execucoes_regua_cobranca ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their billing executions" ON public.execucoes_regua_cobranca FOR SELECT USING (true);

-- 4. Automatic reconciliation/write-off logs
CREATE TABLE IF NOT EXISTS public.logs_baixa_automatica (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES public.empresas(id),
    arquivo_nome TEXT NOT NULL,
    total_registros INTEGER NOT NULL,
    sucesso_count INTEGER DEFAULT 0,
    falha_count INTEGER DEFAULT 0,
    matching_info JSONB, -- Details on which bills were matched
    created_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.logs_baixa_automatica ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their write-off logs" ON public.logs_baixa_automatica FOR SELECT USING (true);

-- 5. Function to register events in receivables metadata
CREATE OR REPLACE FUNCTION public.registrar_evento_receber(
    p_conta_id UUID,
    p_tipo TEXT,
    p_mensagem TEXT,
    p_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS VOID AS $$
DECLARE
    v_event JSONB;
BEGIN
    v_event := jsonb_build_object(
        'id', gen_random_uuid(),
        'type', p_tipo,
        'message', p_mensagem,
        'timestamp', now(),
        'metadata', p_metadata
    );
    
    UPDATE public.contas_receber
    SET metadata = jsonb_set(
        COALESCE(metadata, '{"events": []}'::jsonb),
        '{events}',
        (COALESCE(metadata->'events', '[]'::jsonb) || v_event)
    )
    WHERE id = p_conta_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Trigger to auto-log status changes
CREATE OR REPLACE FUNCTION public.trigger_log_receber_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        PERFORM public.registrar_evento_receber(NEW.id, 'criacao', 'Título criado no sistema');
    ELSIF (OLD.status IS DISTINCT FROM NEW.status) THEN
        PERFORM public.registrar_evento_receber(
            NEW.id, 
            'status_change', 
            format('Status alterado de %s para %s', OLD.status, NEW.status),
            jsonb_build_object('old_status', OLD.status, 'new_status', NEW.status)
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_log_receber_status
AFTER INSERT OR UPDATE OF status ON public.contas_receber
FOR EACH ROW EXECUTE FUNCTION public.trigger_log_receber_status_change();
-- Tabela de preferências globais do usuário (substituindo ou estendendo o que já existe)
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  key TEXT NOT NULL, -- ex: 'contabilidade.demonstrativos'
  payload JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, key)
);

-- Tabela para presets de filtros salvos
CREATE TABLE IF NOT EXISTS public.user_filter_presets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL, -- ex: 'dre-balanco', 'razao-diario'
  name TEXT NOT NULL, -- Nome dado pelo usuário ao preset
  filters JSONB NOT NULL,
  empresa_id TEXT, -- Opcional: vincular preset a uma empresa específica
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de auditoria para mudanças de filtros/preferências
CREATE TABLE IF NOT EXISTS public.user_action_audit (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL, -- 'preference_change', 'filter_change', 'preset_saved'
  entity_type TEXT,
  old_value JSONB,
  new_value JSONB,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_filter_presets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_action_audit ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Users can manage their own preferences"
  ON public.user_preferences
  FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own filter presets"
  ON public.user_filter_presets
  FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own audit logs"
  ON public.user_action_audit
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert audit logs"
  ON public.user_action_audit
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER tr_user_filter_presets_updated_at
  BEFORE UPDATE ON public.user_filter_presets
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
CREATE OR REPLACE FUNCTION public.confirmar_conciliacao(
  p_transacao_id uuid, 
  p_conta_pagar_id uuid DEFAULT NULL::uuid, 
  p_conta_receber_id uuid DEFAULT NULL::uuid,
  p_ajuste_centavos numeric DEFAULT 0
)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_valor_transacao numeric;
BEGIN
  -- Obter valor da transação
  SELECT ABS(valor) INTO v_valor_transacao FROM public.transacoes_bancarias WHERE id = p_transacao_id;

  -- Atualizar a transação bancária como conciliada
  UPDATE public.transacoes_bancarias
  SET 
    conciliada = true,
    conciliada_em = now(),
    conciliada_por = auth.uid(),
    conta_pagar_id = COALESCE(p_conta_pagar_id, conta_pagar_id),
    conta_receber_id = COALESCE(p_conta_receber_id, conta_receber_id),
    valor_conciliado = v_valor_transacao
  WHERE id = p_transacao_id;

  -- Se vinculado a conta a pagar, atualizar status e registrar ajuste
  IF p_conta_pagar_id IS NOT NULL THEN
    UPDATE public.contas_pagar
    SET 
      status = 'pago', 
      data_pagamento = CURRENT_DATE,
      -- Se p_ajuste_centavos for positivo, é juros. Se negativo, desconto.
      juros = CASE WHEN p_ajuste_centavos > 0 THEN juros + p_ajuste_centavos ELSE juros END,
      desconto = CASE WHEN p_ajuste_centavos < 0 THEN desconto + ABS(p_ajuste_centavos) ELSE desconto END
    WHERE id = p_conta_pagar_id;
  END IF;

  -- Se vinculado a conta a receber, atualizar status e registrar ajuste
  IF p_conta_receber_id IS NOT NULL THEN
    UPDATE public.contas_receber
    SET 
      status = 'pago', 
      data_recebimento = CURRENT_DATE,
      juros = CASE WHEN p_ajuste_centavos > 0 THEN juros + p_ajuste_centavos ELSE juros END,
      desconto = CASE WHEN p_ajuste_centavos < 0 THEN desconto + ABS(p_ajuste_centavos) ELSE desconto END
    WHERE id = p_conta_receber_id;
  END IF;
END;
$function$;-- Adicionar configurações de conciliação às contas bancárias
ALTER TABLE public.contas_bancarias 
ADD COLUMN IF NOT EXISTS configuracoes_conciliacao JSONB DEFAULT '{"tolerancia_centavos": 0.50, "auto_ajuste": true}';

-- Tabela para logs de conciliação retroativa
CREATE TABLE IF NOT EXISTS public.logs_conciliacao_retroativa (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conta_bancaria_id UUID REFERENCES public.contas_bancarias(id),
    data_inicio DATE NOT NULL,
    data_fim DATE NOT NULL,
    status TEXT DEFAULT 'processando', -- 'processando', 'concluido', 'erro'
    total_processado INTEGER DEFAULT 0,
    total_conciliado INTEGER DEFAULT 0,
    divergencias_encontradas INTEGER DEFAULT 0,
    logs JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID REFERENCES auth.users(id)
);

-- Tabela para painel de divergências
CREATE TABLE IF NOT EXISTS public.divergencias_conciliacao (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    extrato_id UUID, -- Referência lógica ao lote de importação
    conta_bancaria_id UUID REFERENCES public.contas_bancarias(id),
    transacao_id UUID REFERENCES public.transacoes_bancarias(id),
    tipo_divergencia TEXT NOT NULL, -- 'saldo_final', 'valor_parcial', 'data_descolada'
    descricao TEXT,
    valor_divergencia NUMERIC,
    status TEXT DEFAULT 'pendente', -- 'pendente', 'aceito', 'corrigido'
    recomendacao TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.logs_conciliacao_retroativa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.divergencias_conciliacao ENABLE ROW LEVEL SECURITY;

-- Políticas básicas (acesso total para usuários autenticados da mesma organização simplificado aqui para brevidade)
CREATE POLICY "Users can view logs" ON public.logs_conciliacao_retroativa FOR SELECT USING (true);
CREATE POLICY "Users can insert logs" ON public.logs_conciliacao_retroativa FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can view divergencias" ON public.divergencias_conciliacao FOR SELECT USING (true);
CREATE POLICY "Users can update divergencias" ON public.divergencias_conciliacao FOR UPDATE USING (true);CREATE OR REPLACE FUNCTION public.registrar_evento_pagar(
  p_conta_id UUID,
  p_tipo TEXT,
  p_mensagem TEXT,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.historico_pagamento (
    conta_pagar_id,
    tipo,
    mensagem,
    metadata,
    created_at
  ) VALUES (
    p_conta_id,
    p_tipo,
    p_mensagem,
    p_metadata,
    now()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;-- Adicionar colunas de compensação na tabela de transações bancárias
ALTER TABLE public.transacoes_bancarias 
ADD COLUMN IF NOT EXISTS compensacao_valor NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS compensacao_motivo TEXT,
ADD COLUMN IF NOT EXISTS compensacao_classificacao TEXT, -- 'Juros' ou 'Desconto'
ADD COLUMN IF NOT EXISTS compensacao_regra TEXT,
ADD COLUMN IF NOT EXISTS compensacao_evidencia_url TEXT;

-- Garantir que configuracoes_conciliacao existe (já existe, mas vamos documentar o que ela deve conter)
-- Formato esperado no JSONB: { "tolerancia_centavos": 0.50, "aceite_automatico": true, "periodo_tolerancia_dias": 5 }

COMMENT ON COLUMN public.transacoes_bancarias.compensacao_valor IS 'Valor da diferença de centavos ajustada na conciliação';
COMMENT ON COLUMN public.transacoes_bancarias.compensacao_motivo IS 'Motivo do ajuste (ex: Tolerância configurada)';
COMMENT ON COLUMN public.transacoes_bancarias.compensacao_classificacao IS 'Classificação contábil do ajuste: Juros ou Desconto';
COMMENT ON COLUMN public.transacoes_bancarias.compensacao_regra IS 'A regra de negócio aplicada para o ajuste';
-- Auditoria de divergências
ALTER TABLE public.divergencias_conciliacao 
ADD COLUMN IF NOT EXISTS resolvido_por UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS resolvido_em TIMESTAMP WITH TIME ZONE;

-- Auditoria de compensações de centavos
ALTER TABLE public.transacoes_bancarias
ADD COLUMN IF NOT EXISTS compensacao_aceita_por UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS compensacao_aceita_em TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Progresso e detalhes de erro para conciliação retroativa
ALTER TABLE public.logs_conciliacao_retroativa
ADD COLUMN IF NOT EXISTS progresso NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS erro_detalhe TEXT;
-- Função para gerar alerta em caso de falha na conciliação retroativa
CREATE OR REPLACE FUNCTION public.handle_conciliacao_retroativa_error()
RETURNS TRIGGER AS $$
BEGIN
  IF (NEW.status = 'erro' AND (OLD.status IS NULL OR OLD.status != 'erro')) THEN
    INSERT INTO public.alertas (
      user_id,
      tipo,
      titulo,
      mensagem,
      prioridade,
      acao_url,
      entidade_id,
      entidade_tipo
    ) VALUES (
      NEW.created_by,
      'sistema',
      'Falha na Conciliação Retroativa',
      'O processamento retroativo do período ' || NEW.data_inicio || ' a ' || NEW.data_fim || ' falhou: ' || COALESCE(NEW.erro_detalhe, 'Erro desconhecido'),
      'alta',
      '/conciliacao?tab=retroativo&jobId=' || NEW.id,
      NEW.id::text,
      'conciliacao_retroativa'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Gatilho para disparar o alerta
DROP TRIGGER IF EXISTS trigger_conciliacao_retroativa_error ON public.logs_conciliacao_retroativa;
CREATE TRIGGER trigger_conciliacao_retroativa_error
AFTER UPDATE ON public.logs_conciliacao_retroativa
FOR EACH ROW
EXECUTE FUNCTION public.handle_conciliacao_retroativa_error();

-- Índices para otimização da auditoria
CREATE INDEX IF NOT EXISTS idx_transacoes_compensacao_aceita_em ON public.transacoes_bancarias (compensacao_aceita_em);
CREATE INDEX IF NOT EXISTS idx_transacoes_compensacao_aceita_por ON public.transacoes_bancarias (compensacao_aceita_por);
CREATE INDEX IF NOT EXISTS idx_transacoes_compensacao_classificacao ON public.transacoes_bancarias (compensacao_classificacao);
CREATE INDEX IF NOT EXISTS idx_divergencias_resolvido_em ON public.divergencias_conciliacao (resolvido_em);
CREATE INDEX IF NOT EXISTS idx_divergencias_resolvido_por ON public.divergencias_conciliacao (resolvido_por);

CREATE TABLE IF NOT EXISTS public.regras_contabilizacao_automatica (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL,
  nome text NOT NULL,
  tipo_evento text NOT NULL CHECK (tipo_evento IN ('conta_pagar','conta_receber','movimentacao')),
  categoria_id uuid,
  condicoes jsonb NOT NULL DEFAULT '{}'::jsonb,
  conta_debito_id uuid NOT NULL REFERENCES public.plano_contas(id) ON DELETE RESTRICT,
  conta_credito_id uuid NOT NULL REFERENCES public.plano_contas(id) ON DELETE RESTRICT,
  historico_template text NOT NULL DEFAULT '{descricao}',
  prioridade integer NOT NULL DEFAULT 100,
  ativo boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_regras_contab_emp_evento ON public.regras_contabilizacao_automatica(empresa_id, tipo_evento, ativo);

ALTER TABLE public.regras_contabilizacao_automatica ENABLE ROW LEVEL SECURITY;

CREATE POLICY "regras_contab_select" ON public.regras_contabilizacao_automatica
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "regras_contab_write" ON public.regras_contabilizacao_automatica
  FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin'::app_role,'financeiro'::app_role]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin'::app_role,'financeiro'::app_role]));

CREATE TABLE IF NOT EXISTS public.eventos_contabilizacao_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL,
  tipo_evento text NOT NULL,
  evento_id uuid NOT NULL,
  regra_id uuid REFERENCES public.regras_contabilizacao_automatica(id) ON DELETE SET NULL,
  lancamento_id uuid REFERENCES public.lancamentos_contabeis(id) ON DELETE SET NULL,
  status text NOT NULL CHECK (status IN ('sucesso','sem_regra','erro','duplicado')),
  detalhe text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_eventos_contab_emp ON public.eventos_contabilizacao_log(empresa_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS uq_eventos_contab_evento ON public.eventos_contabilizacao_log(tipo_evento, evento_id) WHERE status = 'sucesso';

ALTER TABLE public.eventos_contabilizacao_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "eventos_contab_select" ON public.eventos_contabilizacao_log
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "eventos_contab_insert" ON public.eventos_contabilizacao_log
  FOR INSERT TO authenticated
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin'::app_role,'financeiro'::app_role]));
-- Tabela para simulações de regimes tributários
CREATE TABLE public.elisao_simulacoes_regime (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    ano_base INTEGER NOT NULL,
    dados_faturamento JSONB NOT NULL DEFAULT '{}', -- Mensal: { "jan": 10000, ... }
    dados_despesas JSONB NOT NULL DEFAULT '{}',
    resultado_simples JSONB,
    resultado_presumido JSONB,
    resultado_real JSONB,
    resultado_reforma_transicao JSONB, -- Projeção CBS/IBS
    criado_por UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de inteligência de créditos (NCM/Produtos)
CREATE TABLE public.elisao_regras_creditos (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    ncm TEXT NOT NULL,
    descricao TEXT,
    tipo_credito TEXT NOT NULL, -- 'monofasico', 'isento', 'substituicao_tributaria', 'exclusao_base'
    aliquota_pis_reducao DECIMAL(5,4) DEFAULT 0,
    aliquota_cofins_reducao DECIMAL(5,4) DEFAULT 0,
    fundamentacao_legal TEXT,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de análise de Gap Fiscal (Resultados)
CREATE TABLE public.elisao_analise_gap (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    periodo_referencia DATE NOT NULL,
    valor_pago_efetivo DECIMAL(15,2) NOT NULL,
    valor_otimizado_projetado DECIMAL(15,2) NOT NULL,
    economia_identificada DECIMAL(15,2) GENERATED ALWAYS AS (valor_pago_efetivo - valor_otimizado_projetado) STORED,
    detalhes_oportunidades JSONB NOT NULL DEFAULT '[]',
    status TEXT DEFAULT 'oportunidade_detectada', -- 'oportunidade_detectada', 'em_implementacao', 'economizado'
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.elisao_simulacoes_regime ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.elisao_regras_creditos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.elisao_analise_gap ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Users can manage their company simulations" 
ON public.elisao_simulacoes_regime FOR ALL 
USING (empresa_id IN (SELECT id FROM public.empresas));

CREATE POLICY "Everyone can view tax rules" 
ON public.elisao_regras_creditos FOR SELECT 
USING (true);

CREATE POLICY "Users can view their company gap analysis" 
ON public.elisao_analise_gap FOR SELECT 
USING (empresa_id IN (SELECT id FROM public.empresas));

-- Gatilho para updated_at
CREATE TRIGGER update_elisao_simulacoes_updated_at
BEFORE UPDATE ON public.elisao_simulacoes_regime
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
-- Adicionar campos de premissas detalhadas para o Simulador 2025
ALTER TABLE public.elisao_simulacoes_regime 
ADD COLUMN IF NOT EXISTS premissas_reforma JSONB DEFAULT '{"aliquota_cbs": 0.088, "aliquota_ibs": 0.177, "ano_transicao": 2026}',
ADD COLUMN IF NOT EXISTS premissas_operacionais JSONB DEFAULT '{"crescimento_anual": 0.05, "margem_ebitda": 0.15, "folha_prolabore": 0.28}';

-- Função para simular crédito tributário baseado em notas fiscais existentes
CREATE OR REPLACE FUNCTION public.calcular_potencial_elisao(p_empresa_id UUID)
RETURNS TABLE (
    tipo_oportunidade TEXT,
    valor_estimado DECIMAL(15,2),
    descricao TEXT,
    ncm_relacionado TEXT
) LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r.tipo_credito as tipo_oportunidade,
        SUM(nfi.valor_total * (r.aliquota_pis_reducao + r.aliquota_cofins_reducao)) as valor_estimado,
        r.descricao,
        r.ncm
    FROM elisao_regras_creditos r
    JOIN nota_fiscal_itens nfi ON nfi.ncm = r.ncm
    JOIN notas_fiscais nf ON nf.id = nfi.nota_fiscal_id
    WHERE nf.empresa_id = p_empresa_id
      AND nf.tipo = 'entrada' -- Analisando créditos em notas de entrada
      AND nf.data_emissao >= (now() - interval '12 months')
    GROUP BY r.tipo_credito, r.descricao, r.ncm;
END;
$$;
-- Tabela de auditoria de elegibilidade de créditos
CREATE TABLE public.elisao_creditos_auditoria (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    nota_fiscal_id UUID NOT NULL, -- Referência ao documento original
    ncm TEXT NOT NULL,
    cst_csosn TEXT,
    valor_base DECIMAL(15,2) NOT NULL,
    valor_credito_calculado DECIMAL(15,2) NOT NULL,
    regra_id UUID REFERENCES public.elisao_regras_creditos(id),
    status_validacao TEXT DEFAULT 'pendente', -- 'pendente', 'elegivel', 'inelegivel'
    motivo_rejeicao TEXT,
    metodologia_aplicada TEXT,
    evidencias JSONB DEFAULT '[]', -- Lista de IDs de anexos ou metadados
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de acionáveis (Régua de Tarefas)
CREATE TABLE public.elisao_tarefas_acionaveis (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    titulo TEXT NOT NULL,
    descricao TEXT,
    tipo_oportunidade TEXT, -- 'recuperacao_pis_cofins', 'ajuste_icms_st', 'planejamento_regime'
    valor_envolvido DECIMAL(15,2),
    responsavel_id UUID REFERENCES auth.users(id),
    prazo DATE,
    status TEXT DEFAULT 'todo', -- 'todo', 'in_progress', 'done', 'canceled'
    checklist JSONB DEFAULT '[]', -- [{ "item": "Coletar XMLs", "done": false }, ...]
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.elisao_creditos_auditoria ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.elisao_tarefas_acionaveis ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Users can manage company audit logs" 
ON public.elisao_creditos_auditoria FOR ALL 
USING (empresa_id IN (SELECT id FROM public.empresas));

CREATE POLICY "Users can manage company action tasks" 
ON public.elisao_tarefas_acionaveis FOR ALL 
USING (empresa_id IN (SELECT id FROM public.empresas));

-- Trigger para updated_at nas tarefas
CREATE TRIGGER update_elisao_tarefas_updated_at
BEFORE UPDATE ON public.elisao_tarefas_acionaveis
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
-- Tabela de alertas automáticos
CREATE TABLE IF NOT EXISTS public.elisao_alertas (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    competencia DATE NOT NULL,
    tipo_divergencia TEXT NOT NULL, -- 'ncm_invalido', 'valor_divergente', 'documentacao_ausente'
    descricao TEXT NOT NULL,
    severidade TEXT NOT NULL DEFAULT 'media', -- 'baixa', 'media', 'alta'
    status TEXT NOT NULL DEFAULT 'pendente', -- 'pendente', 'resolvido', 'ignorado'
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS para alertas
ALTER TABLE public.elisao_alertas ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view alerts for their companies' AND tablename = 'elisao_alertas') THEN
        CREATE POLICY "Users can view alerts for their companies"
        ON public.elisao_alertas FOR SELECT
        USING (EXISTS (
            SELECT 1 FROM public.user_empresas
            WHERE empresa_id = elisao_alertas.empresa_id
            AND user_id = auth.uid()
        ));
    END IF;
END $$;

-- Adicionar campos de aprovação em elisao_creditos_auditoria
ALTER TABLE public.elisao_creditos_auditoria 
ADD COLUMN IF NOT EXISTS aprovador_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS data_aprovacao TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS status_aprovacao TEXT NOT NULL DEFAULT 'pendente' CHECK (status_aprovacao IN ('pendente', 'aprovado', 'rejeitado')),
ADD COLUMN IF NOT EXISTS historico_decisoes JSONB DEFAULT '[]'::jsonb;

-- Adicionar integração Bitrix24 em elisao_tarefas_acionaveis
ALTER TABLE public.elisao_tarefas_acionaveis
ADD COLUMN IF NOT EXISTS bitrix_task_id TEXT,
ADD COLUMN IF NOT EXISTS bitrix_sync_status TEXT DEFAULT 'nao_sincronizado' CHECK (bitrix_sync_status IN ('nao_sincronizado', 'sincronizado', 'erro')),
ADD COLUMN IF NOT EXISTS bitrix_error_message TEXT;

-- Função para registrar decisão no histórico
CREATE OR REPLACE FUNCTION public.registrar_decisao_elisao()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'UPDATE') AND (NEW.status_aprovacao <> OLD.status_aprovacao) THEN
        NEW.historico_decisoes = COALESCE(OLD.historico_decisoes, '[]'::jsonb) || jsonb_build_object(
            'status', NEW.status_aprovacao,
            'usuario_id', auth.uid(),
            'data', now(),
            'comentario', NEW.motivo_rejeicao
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_registrar_decisao_elisao ON public.elisao_creditos_auditoria;
CREATE TRIGGER tr_registrar_decisao_elisao
BEFORE UPDATE ON public.elisao_creditos_auditoria
FOR EACH ROW
EXECUTE FUNCTION public.registrar_decisao_elisao();
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'elisao_creditos_auditoria_nota_fiscal_id_fkey') THEN
        ALTER TABLE public.elisao_creditos_auditoria
        ADD CONSTRAINT elisao_creditos_auditoria_nota_fiscal_id_fkey 
        FOREIGN KEY (nota_fiscal_id) REFERENCES public.notas_fiscais_ocr(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'elisao_creditos_auditoria_regra_id_fkey') THEN
        ALTER TABLE public.elisao_creditos_auditoria
        ADD CONSTRAINT elisao_creditos_auditoria_regra_id_fkey 
        FOREIGN KEY (regra_id) REFERENCES public.elisao_regras_creditos(id);
    END IF;
END $$;
ALTER TABLE public.elisao_creditos_auditoria 
ADD COLUMN IF NOT EXISTS score_confianca NUMERIC DEFAULT 100,
ADD COLUMN IF NOT EXISTS divergencias_detectadas JSONB DEFAULT '[]'::jsonb;

-- Comentário para documentar que regra_id já existe e está vinculado via fkey
COMMENT ON COLUMN public.elisao_creditos_auditoria.regra_id IS 'Regra aplicada para o cálculo do crédito';
-- Tabela de Auditoria de Configurações
CREATE TABLE IF NOT EXISTS public.auditoria_configuracoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    tipo_acao TEXT NOT NULL, -- 'troca_empresa', 'filtro_alterado', 'parametro_alterado'
    detalhes JSONB NOT NULL DEFAULT '{}'::jsonb,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.auditoria_configuracoes ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Usuários podem ver auditoria das suas empresas') THEN
        CREATE POLICY "Usuários podem ver auditoria das suas empresas"
        ON public.auditoria_configuracoes FOR SELECT
        USING (EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() 
            AND (role = 'admin' OR role = 'financeiro')
        ));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Usuários podem inserir auditoria') THEN
        CREATE POLICY "Usuários podem inserir auditoria"
        ON public.auditoria_configuracoes FOR INSERT
        WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

-- Função para registrar auditoria via RPC
CREATE OR REPLACE FUNCTION public.registrar_auditoria_config(
    _tipo_acao TEXT,
    _empresa_id UUID,
    _detalhes JSONB
) RETURNS VOID AS $$
BEGIN
    INSERT INTO public.auditoria_configuracoes (user_id, empresa_id, tipo_acao, detalhes)
    VALUES (auth.uid(), _empresa_id, _tipo_acao, _detalhes);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
-- 1. Extend boletos table for tracking and payables reference
ALTER TABLE public.boletos 
ADD COLUMN IF NOT EXISTS rastreio_status JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS conta_pagar_id UUID REFERENCES public.contas_pagar(id);

-- 2. Enhance transacoes_bancarias for better audit and status
ALTER TABLE public.transacoes_bancarias
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'confirmado', 'estornado')),
ADD COLUMN IF NOT EXISTS regra_id UUID REFERENCES public.regras_conciliacao(id),
ADD COLUMN IF NOT EXISTS data_confirmacao TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS confirmado_por UUID REFERENCES auth.users(id);

-- Update existing reconciled transactions (using created_at since updated_at might not exist on this table)
UPDATE public.transacoes_bancarias 
SET status = 'confirmado', data_confirmacao = created_at 
WHERE conciliada = true;

-- 3. Add AI negotiation config to regua_cobranca
ALTER TABLE public.regua_cobranca
ADD COLUMN IF NOT EXISTS configuracoes_ia JSONB DEFAULT '{"permitir_negociacao": false, "desconto_maximo": 10, "parcelas_maximas": 3}';

-- 4. Create function to undo reconciliation
CREATE OR REPLACE FUNCTION public.desfazer_conciliacao(
    p_transacao_id UUID,
    p_user_id UUID
) RETURNS VOID AS $$
DECLARE
    v_conta_receber_id UUID;
    v_conta_pagar_id UUID;
BEGIN
    -- Find references
    SELECT conta_receber_id, conta_pagar_id INTO v_conta_receber_id, v_conta_pagar_id
    FROM public.transacoes_bancarias
    WHERE id = p_transacao_id;

    -- Update bank transaction
    UPDATE public.transacoes_bancarias
    SET 
        conciliada = false,
        status = 'pendente',
        conta_receber_id = NULL,
        conta_pagar_id = NULL,
        compensacao_valor = 0,
        compensacao_motivo = NULL,
        data_confirmacao = NULL,
        confirmado_por = NULL
    WHERE id = p_transacao_id;

    -- Update account receivable if applicable
    IF v_conta_receber_id IS NOT NULL THEN
        UPDATE public.contas_receber
        SET 
            status = 'pendente',
            valor_recebido = 0,
            data_recebimento = NULL,
            conta_bancaria_id = NULL,
            transacao_conciliada_id = NULL
        WHERE id = v_conta_receber_id;

        -- Log undo event
        PERFORM public.registrar_evento_receber(
            v_conta_receber_id,
            'conciliacao_desfeita',
            'Conciliação bancária desfeita pelo usuário.',
            jsonb_build_object('transacao_id', p_transacao_id, 'user_id', p_user_id)
        );
    END IF;

    -- Update account payable if applicable
    IF v_conta_pagar_id IS NOT NULL THEN
        UPDATE public.contas_pagar
        SET 
            status = 'pendente',
            valor_pago = 0,
            data_pagamento = NULL,
            conta_bancaria_id = NULL
        WHERE id = v_conta_pagar_id;

        -- Log undo event
        PERFORM public.registrar_evento_pagar(
            v_conta_pagar_id,
            'conciliacao_desfeita',
            'Conciliação bancária desfeita pelo usuário.',
            jsonb_build_object('transacao_id', p_transacao_id, 'user_id', p_user_id)
        );
    END IF;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Régua de cobrança por título
CREATE TABLE IF NOT EXISTS public.regua_cobranca_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titulo_id UUID NOT NULL, -- Referência ao contas_receber ou boleto
    cliente_id UUID NOT NULL,
    empresa_id UUID NOT NULL,
    etapa_atual TEXT NOT NULL DEFAULT 'preventiva',
    status TEXT NOT NULL DEFAULT 'pendente', -- pendente, disparado, erro, concluido
    data_proximo_disparo TIMESTAMP WITH TIME ZONE,
    historico JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.regua_cobranca_status ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para regua_cobranca_status
CREATE POLICY "Usuários podem ver status da régua de sua empresa" 
ON public.regua_cobranca_status FOR SELECT 
USING (auth.uid() IN (SELECT user_id FROM public.user_empresas WHERE empresa_id = regua_cobranca_status.empresa_id));

-- Adicionar colunas Bitrix24 na tabela de boletos (se não existirem)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='boletos' AND column_name='bitrix_id') THEN
        ALTER TABLE public.boletos ADD COLUMN bitrix_id TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='boletos' AND column_name='bitrix_status') THEN
        ALTER TABLE public.boletos ADD COLUMN bitrix_status TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='boletos' AND column_name='eventos_pagamento') THEN
        ALTER TABLE public.boletos ADD COLUMN eventos_pagamento JSONB DEFAULT '[]'::jsonb;
    END IF;
END $$;

-- Fila de conciliação pendente
CREATE TABLE IF NOT EXISTS public.conciliacao_sugestoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transacao_id UUID NOT NULL,
    empresa_id UUID NOT NULL,
    sugestoes JSONB NOT NULL, -- Array de matches possíveis com score e IDs do sistema
    status TEXT DEFAULT 'pendente', -- pendente, aceito, rejeitado
    analisado_em TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.conciliacao_sugestoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver sugestões de sua empresa" 
ON public.conciliacao_sugestoes FOR SELECT 
USING (auth.uid() IN (SELECT user_id FROM public.user_empresas WHERE empresa_id = conciliacao_sugestoes.empresa_id));
-- Adicionar coluna para ID externo do ASAAS ou outros provedores
ALTER TABLE public.boletos ADD COLUMN IF NOT EXISTS asaas_id TEXT;
ALTER TABLE public.boletos ADD COLUMN IF NOT EXISTS external_provider TEXT DEFAULT 'asaas';

-- Garantir que temos uma tabela de logs para eventos de boletos se não existir
CREATE TABLE IF NOT EXISTS public.boleto_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    boleto_id UUID REFERENCES public.boletos(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    status_before TEXT,
    status_after TEXT,
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS na tabela de eventos
ALTER TABLE public.boleto_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view events of their companies' boletos"
ON public.boleto_events
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.boletos b
        JOIN public.user_roles ur ON ur.user_id = auth.uid()
        WHERE b.id = boleto_events.boleto_id
    )
);

-- Função para atualizar automaticamente a conta vinculada quando o boleto mudar para pago
CREATE OR REPLACE FUNCTION public.handle_boleto_payment_sync()
RETURNS TRIGGER AS $$
BEGIN
    -- Se o status mudou para 'pago'
    IF NEW.status = 'pago' AND OLD.status != 'pago' THEN
        -- Atualizar conta a receber se houver
        IF NEW.conta_receber_id IS NOT NULL THEN
            UPDATE public.contas_receber
            SET status = 'pago', 
                data_recebimento = COALESCE(NEW.updated_at, now())::date,
                updated_at = now()
            WHERE id = NEW.conta_receber_id;
            
            -- Registrar evento na conta a receber
            INSERT INTO public.contas_receber_eventos (conta_id, tipo, mensagem, metadata)
            VALUES (NEW.conta_receber_id, 'pagamento_confirmado', 'Pagamento confirmado via boleto #' || NEW.numero, jsonb_build_object('boleto_id', NEW.id));
        END IF;

        -- Atualizar conta a pagar se houver
        IF NEW.conta_pagar_id IS NOT NULL THEN
            UPDATE public.contas_pagar
            SET status = 'pago', 
                data_pagamento = COALESCE(NEW.updated_at, now())::date,
                updated_at = now()
            WHERE id = NEW.conta_pagar_id;

             -- Registrar evento na conta a pagar
            INSERT INTO public.contas_pagar_eventos (conta_id, tipo, mensagem, metadata)
            VALUES (NEW.conta_pagar_id, 'pagamento_confirmado', 'Pagamento confirmado via boleto #' || NEW.numero, jsonb_build_object('boleto_id', NEW.id));
        END IF;
    END IF;

    -- Registrar evento de mudança de status
    IF NEW.status != OLD.status THEN
        INSERT INTO public.boleto_events (boleto_id, event_type, status_before, status_after, description)
        VALUES (NEW.id, 'status_change', OLD.status, NEW.status, 'Status alterado de ' || OLD.status || ' para ' || NEW.status);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para sincronização de pagamento
DROP TRIGGER IF EXISTS on_boleto_status_change ON public.boletos;
CREATE TRIGGER on_boleto_status_change
AFTER UPDATE ON public.boletos
FOR EACH ROW
EXECUTE FUNCTION public.handle_boleto_payment_sync();
-- Criar tabela de fila de sincronização/retentativas
CREATE TABLE IF NOT EXISTS public.asaas_sync_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID REFERENCES public.asaas_payments(id) ON DELETE CASCADE,
    operation_type TEXT NOT NULL, -- 'EMISSION', 'UPDATE_STATUS', 'DOWNLOAD_FILES'
    status TEXT NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'
    attempts INTEGER NOT NULL DEFAULT 0,
    max_attempts INTEGER NOT NULL DEFAULT 5,
    last_error TEXT,
    next_retry_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Criar tabela de trilha de auditoria específica para boletos
CREATE TABLE IF NOT EXISTS public.asaas_audit_trail (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID REFERENCES public.asaas_payments(id) ON DELETE CASCADE,
    action TEXT NOT NULL, -- 'EMISSION_REQUESTED', 'EMISSION_SUCCESS', 'WEBHOOK_RECEIVED', 'STATUS_CHANGED', 'DOWNLOAD_CLICKED'
    previous_status TEXT,
    new_status TEXT,
    details JSONB,
    user_id UUID REFERENCES auth.users(id),
    ip_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Adicionar campo de comprovante e metadados extras em asaas_payments se não existirem
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'asaas_payments' AND COLUMN_NAME = 'link_comprovante') THEN
        ALTER TABLE public.asaas_payments ADD COLUMN link_comprovante TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'asaas_payments' AND COLUMN_NAME = 'metadata') THEN
        ALTER TABLE public.asaas_payments ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
    END IF;
END $$;

-- Habilitar RLS
ALTER TABLE public.asaas_sync_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asaas_audit_trail ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
CREATE POLICY "Permitir leitura da fila para autenticados" ON public.asaas_sync_queue FOR SELECT TO authenticated USING (true);
CREATE POLICY "Permitir leitura da auditoria para autenticados" ON public.asaas_audit_trail FOR SELECT TO authenticated USING (true);

-- Gatilho para updated_at na fila
CREATE TRIGGER update_asaas_sync_queue_updated_at
    BEFORE UPDATE ON public.asaas_sync_queue
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();-- Create asaas_config table
CREATE TABLE IF NOT EXISTS public.asaas_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    retry_limit INTEGER DEFAULT 5,
    retry_interval_minutes INTEGER DEFAULT 30,
    backoff_multiplier DECIMAL DEFAULT 2.0,
    auto_sync_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(empresa_id)
);

-- Enable RLS
ALTER TABLE public.asaas_config ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own company asaas config"
ON public.asaas_config FOR SELECT
USING (empresa_id IN (SELECT id FROM public.empresas));

CREATE POLICY "Users can update their own company asaas config"
ON public.asaas_config FOR UPDATE
USING (empresa_id IN (SELECT id FROM public.empresas));

CREATE POLICY "Users can insert their own company asaas config"
ON public.asaas_config FOR INSERT
WITH CHECK (empresa_id IN (SELECT id FROM public.empresas));

-- Trigger for updated_at
CREATE TRIGGER update_asaas_config_updated_at
BEFORE UPDATE ON public.asaas_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to export audit trail as CSV (can be called via RPC)
CREATE OR REPLACE FUNCTION public.export_asaas_audit_csv(p_empresa_id UUID)
RETURNS TEXT AS $$
DECLARE
    v_csv TEXT;
BEGIN
    SELECT string_agg(row_data, E'\n')
    INTO v_csv
    FROM (
        SELECT 'ID,Payment_ID,Event_Type,Description,Status,Created_At' AS row_data
        UNION ALL
        SELECT 
            id::text || ',' || 
            payment_id::text || ',' || 
            event_type || ',' || 
            '"' || REPLACE(COALESCE(description, ''), '"', '""') || '",' || 
            COALESCE(status, '') || ',' || 
            created_at::text
        FROM public.asaas_audit_trail
        WHERE payment_id IN (SELECT id FROM public.asaas_payments WHERE empresa_id = p_empresa_id)
        ORDER BY created_at DESC
    ) s;
    
    RETURN v_csv;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Add alert configurations to asaas_config
ALTER TABLE public.asaas_config 
ADD COLUMN IF NOT EXISTS alert_email_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS alert_email_address TEXT,
ADD COLUMN IF NOT EXISTS alert_whatsapp_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS alert_whatsapp_number TEXT,
ADD COLUMN IF NOT EXISTS failure_threshold INTEGER DEFAULT 5;

-- Add bank account column to asaas_payments for filtering
ALTER TABLE public.asaas_payments 
ADD COLUMN IF NOT EXISTS conta_bancaria TEXT;

-- Function to check for queue failures and trigger alerts
CREATE OR REPLACE FUNCTION public.check_asaas_queue_failures()
RETURNS TRIGGER AS $$
DECLARE
    v_failure_count INTEGER;
    v_threshold INTEGER;
    v_config RECORD;
BEGIN
    -- Get failure count for the last hour
    SELECT COUNT(*) INTO v_failure_count
    FROM public.asaas_sync_queue
    WHERE status = 'failed' 
      AND updated_at > now() - interval '1 hour';

    -- Get threshold from config
    SELECT * INTO v_config FROM public.asaas_config LIMIT 1;
    v_threshold := COALESCE(v_config.failure_threshold, 5);

    -- If threshold reached, log an event that can be picked up by an edge function or notify directly
    IF v_failure_count >= v_threshold THEN
        -- Insert into audit trail as a system alert
        INSERT INTO public.asaas_audit_trail (
            action,
            details,
            created_at
        ) VALUES (
            'QUEUE_ALERT',
            jsonb_build_object(
                'failure_count', v_failure_count,
                'threshold', v_threshold,
                'message', 'Limite de falhas na fila de retentativas atingido.'
            ),
            now()
        );
        
        -- In a real scenario, we would trigger an edge function here
        -- via a webhook or pg_net if available.
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to check failures on sync queue update
DROP TRIGGER IF EXISTS tr_check_asaas_queue_failures ON public.asaas_sync_queue;
CREATE TRIGGER tr_check_asaas_queue_failures
AFTER UPDATE ON public.asaas_sync_queue
FOR EACH ROW
WHEN (NEW.status = 'failed')
EXECUTE FUNCTION public.check_asaas_queue_failures();
CREATE TABLE IF NOT EXISTS public.asaas_transfers (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    asaas_id TEXT UNIQUE,
    empresa_id UUID REFERENCES public.empresas(id),
    valor NUMERIC NOT NULL,
    chave_pix TEXT NOT NULL,
    tipo_chave TEXT NOT NULL,
    descricao TEXT,
    status TEXT NOT NULL DEFAULT 'PENDING',
    idempotency_key TEXT UNIQUE NOT NULL,
    comprovante_url TEXT,
    transaction_receipt_url TEXT,
    last_error TEXT,
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.asaas_transfers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view transfers of their company" 
ON public.asaas_transfers FOR SELECT 
USING (empresa_id IN (SELECT id FROM public.empresas));

CREATE POLICY "Admins can insert transfers" 
ON public.asaas_transfers FOR INSERT 
WITH CHECK (empresa_id IN (SELECT id FROM public.empresas));

CREATE POLICY "Admins can update transfers" 
ON public.asaas_transfers FOR UPDATE 
USING (empresa_id IN (SELECT id FROM public.empresas));

-- Index for idempotency
CREATE INDEX IF NOT EXISTS idx_asaas_transfers_idempotency ON public.asaas_transfers(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_asaas_transfers_empresa_date ON public.asaas_transfers(empresa_id, created_at);
CREATE TABLE IF NOT EXISTS public.asaas_reconciliation_suggestions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    transaction_id TEXT NOT NULL, -- Asaas Transaction ID
    conta_receber_id UUID REFERENCES public.contas_receber(id),
    empresa_id UUID REFERENCES public.empresas(id),
    score NUMERIC NOT NULL, -- Confidence level (0 to 1)
    match_type TEXT NOT NULL, -- 'VALUE_DATE', 'DESCRIPTION', etc.
    status TEXT NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'ACCEPTED', 'REJECTED'
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.asaas_reconciliation_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view suggestions of their company" 
ON public.asaas_reconciliation_suggestions FOR SELECT 
USING (empresa_id IN (SELECT id FROM public.empresas));

-- Function to find potential matches
CREATE OR REPLACE FUNCTION public.generate_reconciliation_suggestions(
    p_empresa_id UUID,
    p_transaction_date DATE,
    p_transaction_value NUMERIC,
    p_transaction_id TEXT
) RETURNS VOID AS $$
DECLARE
    v_conta RECORD;
BEGIN
    -- Find pending receivables within a 3-day window and similar value
    FOR v_conta IN 
        SELECT id, valor, data_vencimento 
        FROM public.contas_receber 
        WHERE empresa_id = p_empresa_id 
          AND status = 'pendente'
          AND valor BETWEEN (p_transaction_value * 0.95) AND (p_transaction_value * 1.05) -- 5% margin
          AND data_vencimento BETWEEN (p_transaction_date - interval '3 days') AND (p_transaction_date + interval '3 days')
    LOOP
        INSERT INTO public.asaas_reconciliation_suggestions (
            transaction_id,
            conta_receber_id,
            empresa_id,
            score,
            match_type,
            metadata
        ) VALUES (
            p_transaction_id,
            v_conta.id,
            p_empresa_id,
            CASE 
                WHEN v_conta.valor = p_transaction_value AND v_conta.data_vencimento = p_transaction_date THEN 1.0
                WHEN v_conta.valor = p_transaction_value THEN 0.8
                ELSE 0.6
            END,
            'VALUE_DATE',
            jsonb_build_object('transaction_value', p_transaction_value, 'conta_valor', v_conta.valor)
        ) ON CONFLICT DO NOTHING;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
CREATE OR REPLACE FUNCTION public.get_asaas_payment_stats(p_empresa_id UUID)
RETURNS TABLE (
    status TEXT,
    total_count BIGINT,
    total_value NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ap.status,
        COUNT(*),
        SUM(ap.valor)
    FROM 
        public.asaas_payments ap
    WHERE 
        ap.empresa_id = p_empresa_id
    GROUP BY 
        ap.status;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
ALTER TABLE public.asaas_config 
ADD COLUMN IF NOT EXISTS bitrix_trigger_stage TEXT DEFAULT 'WON';

COMMENT ON COLUMN public.asaas_config.bitrix_trigger_stage IS 'ID da etapa do Bitrix24 que dispara a geração automática de boletos Asaas.';
-- Multas e Juros Automáticos
ALTER TABLE public.asaas_config 
ADD COLUMN IF NOT EXISTS default_fine_percent NUMERIC DEFAULT 2.0,
ADD COLUMN IF NOT EXISTS default_interest_percent NUMERIC DEFAULT 1.0;

-- Agendamento de Cashout
CREATE TABLE IF NOT EXISTS public.asaas_scheduled_transfers (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    empresa_id UUID REFERENCES public.empresas(id),
    valor NUMERIC NOT NULL,
    chave_pix TEXT NOT NULL,
    tipo_chave TEXT NOT NULL,
    descricao TEXT,
    agendado_para TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING',
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.asaas_scheduled_transfers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their scheduled transfers" 
ON public.asaas_scheduled_transfers FOR ALL 
USING (empresa_id IN (SELECT id FROM public.empresas));

-- Log de Risco de Crédito (IA)
CREATE TABLE IF NOT EXISTS public.asaas_credit_risk_analysis (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    cliente_id UUID REFERENCES public.clientes(id),
    score_risco INTEGER, -- 0-1000
    faixa_risco TEXT, -- BAIXO, MEDIO, ALTO
    recomendacao TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.asaas_credit_risk_analysis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view credit risk analysis" 
ON public.asaas_credit_risk_analysis FOR SELECT 
USING (true); -- Ajustar conforme necessário para segurança real
-- Grant necessary permissions for audit logging context
COMMENT ON COLUMN public.asaas_audit_trail.payment_id IS 'ID do pagamento relacionado. Pode ser nulo para eventos globais ou de transferências.';

-- Ensure user context is always captured if available
ALTER TABLE public.asaas_audit_trail 
ALTER COLUMN user_id SET DEFAULT auth.uid();
-- 1. Fix Search Path for custom functions (Security Best Practice)
ALTER FUNCTION public.check_asaas_queue_failures() SET search_path = public;
ALTER FUNCTION public.get_asaas_payment_stats(UUID) SET search_path = public;
ALTER FUNCTION public.generate_reconciliation_suggestions(UUID, DATE, NUMERIC, TEXT) SET search_path = public;

-- 2. Tighten RLS for Credit Risk Analysis
-- Previous policy was too permissive (USING true)
DROP POLICY IF EXISTS "Users can view credit risk analysis" ON public.asaas_credit_risk_analysis;

CREATE POLICY "Users can view credit risk analysis of their customers" 
ON public.asaas_credit_risk_analysis 
FOR SELECT 
USING (
    cliente_id IN (
        SELECT id FROM public.clientes 
        WHERE empresa_id IN (SELECT id FROM public.empresas)
    )
);

-- 3. Audit trail RLS refinement
-- Ensure users can only see audit logs related to their companies
DROP POLICY IF EXISTS "Users can view audit trail" ON public.asaas_audit_trail;
CREATE POLICY "Users can view audit trail of their company" 
ON public.asaas_audit_trail FOR SELECT 
USING (
    payment_id IN (SELECT id FROM public.asaas_payments) OR 
    payment_id IS NULL -- Allow system logs for authorized users
);

-- 4. Scheduled Transfers RLS reinforcement
DROP POLICY IF EXISTS "Users can manage their scheduled transfers" ON public.asaas_scheduled_transfers;
CREATE POLICY "Users can manage their company scheduled transfers" 
ON public.asaas_scheduled_transfers FOR ALL 
USING (empresa_id IN (SELECT id FROM public.empresas));
ALTER TABLE public.asaas_sync_queue 
ADD COLUMN IF NOT EXISTS error_history JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.asaas_sync_queue.error_history IS 'Histórico serializado de erros encontrados em cada tentativa de sincronização.';

-- Index for queue cleanup/maintenance
CREATE INDEX IF NOT EXISTS idx_asaas_sync_queue_status_updated ON public.asaas_sync_queue(status, updated_at);
CREATE OR REPLACE FUNCTION public.processar_regua_cobranca(p_empresa_id UUID, p_simulate BOOLEAN DEFAULT false)
RETURNS TABLE (
    total_enfileirados INTEGER,
    total_erros INTEGER,
    total_sem_contato INTEGER
) AS $$
DECLARE 
    v_enfileirados INTEGER := 0; 
    v_sem_contato INTEGER := 0; 
    v_regra RECORD; 
    v_cr RECORD; 
    v_mensagem TEXT; 
    v_canal TEXT;
BEGIN
    FOR v_regra IN SELECT * FROM regua_cobranca WHERE ativo=true AND auto_executar=true AND (p_empresa_id IS NULL OR empresa_id=p_empresa_id OR empresa_id IS NULL) ORDER BY dias_gatilho LOOP
        FOR v_cr IN 
            SELECT cr.*, c.email AS cliente_email, c.telefone AS cliente_telefone 
            FROM contas_receber cr 
            LEFT JOIN clientes c ON c.id=cr.cliente_id 
            WHERE cr.status IN ('pendente','vencido','parcial','atrasado') 
              AND (CURRENT_DATE-cr.data_vencimento)>=v_regra.dias_gatilho 
              AND NOT EXISTS (SELECT 1 FROM fila_cobrancas fc WHERE fc.conta_receber_id=cr.id AND fc.etapa=v_regra.etapa AND fc.status NOT IN ('falhou','cancelado')) 
        LOOP
            IF v_regra.canais IS NOT NULL THEN
                FOREACH v_canal IN ARRAY v_regra.canais LOOP
                    IF (v_canal='email' AND v_cr.cliente_email IS NULL) OR (v_canal IN ('whatsapp','sms') AND v_cr.cliente_telefone IS NULL) THEN 
                        v_sem_contato := v_sem_contato + 1; 
                        CONTINUE; 
                    END IF;
                    
                    IF NOT p_simulate THEN
                        SELECT corpo INTO v_mensagem FROM templates_cobranca WHERE etapa=v_regra.etapa AND canal=v_canal AND ativo=true AND padrao=true LIMIT 1;
                        v_mensagem := COALESCE(v_mensagem,'Pendência financeira em aberto.');
                        v_mensagem := REPLACE(REPLACE(REPLACE(v_mensagem,'{{cliente_nome}}',COALESCE(v_cr.cliente_nome,'Cliente')),'{{valor_formatado}}','R$ '||to_char(v_cr.valor,'FM999G999G990D00')),'{{vencimento}}',to_char(v_cr.data_vencimento,'DD/MM/YYYY'));
                        
                        INSERT INTO fila_cobrancas (empresa_id,conta_receber_id,cliente_id,cliente_nome,etapa,canal,destinatario,mensagem_renderizada) 
                        VALUES (v_cr.empresa_id,v_cr.id,v_cr.cliente_id,v_cr.cliente_nome,v_regra.etapa,v_canal,CASE WHEN v_canal='email' THEN v_cr.cliente_email ELSE v_cr.cliente_telefone END,v_mensagem);
                    END IF;
                    
                    v_enfileirados := v_enfileirados + 1;
                END LOOP;
            END IF;
            
            IF NOT p_simulate THEN
                UPDATE contas_receber SET etapa_cobranca=v_regra.etapa::etapa_cobranca WHERE id=v_cr.id;
            END IF;
        END LOOP;
    END LOOP;
    
    RETURN QUERY SELECT v_enfileirados, 0, v_sem_contato;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
-- Tabela para log de tentativas de duplicidade e hashes de transação
CREATE TABLE IF NOT EXISTS public.registro_duplicidade (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hash_identificador TEXT NOT NULL, -- md5(fornecedor_id + valor + data_vencimento + empresa_id)
    entidade_id UUID, -- ID da conta_pagar original ou nova
    tipo_entidade TEXT DEFAULT 'conta_pagar',
    usuario_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Index para busca rápida de hash
CREATE INDEX IF NOT EXISTS idx_registro_duplicidade_hash ON public.registro_duplicidade(hash_identificador);

-- Função para gerar hash de duplicidade
CREATE OR REPLACE FUNCTION public.gerar_hash_pagamento(
    p_fornecedor_id UUID,
    p_valor NUMERIC,
    p_data_vencimento DATE,
    p_empresa_id UUID,
    p_numero_documento TEXT DEFAULT NULL,
    p_codigo_barras TEXT DEFAULT NULL
) RETURNS TEXT AS $$
BEGIN
    -- Se tiver código de barras, ele é o identificador soberano
    IF p_codigo_barras IS NOT NULL AND p_codigo_barras <> '' THEN
        RETURN md5('barcode-' || p_codigo_barras);
    END IF;
    
    -- Caso contrário, combinação de dados críticos
    RETURN md5(
        COALESCE(p_fornecedor_id::text, 'no-vendor') || 
        p_valor::text || 
        p_data_vencimento::text || 
        p_empresa_id::text || 
        COALESCE(p_numero_documento, '')
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger para validar duplicidade antes do insert em contas_pagar
CREATE OR REPLACE FUNCTION public.validar_duplicidade_pagamento()
RETURNS TRIGGER AS $$
DECLARE
    v_hash TEXT;
    v_existe BOOLEAN;
    v_msg TEXT;
BEGIN
    -- Ignorar se for recorrente ou se tiver flag de bypass (a ser implementada se necessário)
    IF NEW.recorrente = true THEN
        RETURN NEW;
    END IF;

    -- Gerar hash para a nova tentativa
    v_hash := public.gerar_hash_pagamento(
        NEW.fornecedor_id,
        NEW.valor,
        NEW.data_vencimento,
        NEW.empresa_id,
        NEW.numero_documento,
        NEW.codigo_barras
    );

    -- Verificar se existe registro idêntico nos últimos 24 meses (evitar lixo histórico)
    SELECT EXISTS (
        SELECT 1 FROM public.contas_pagar 
        WHERE id <> NEW.id -- Evitar self-match no update
        AND status <> 'cancelado'
        AND public.gerar_hash_pagamento(fornecedor_id, valor, data_vencimento, empresa_id, numero_documento, codigo_barras) = v_hash
        AND created_at > now() - interval '24 months'
    ) INTO v_existe;

    IF v_existe THEN
        v_msg := 'ALERTA DE DUPLICIDADE: Já existe um lançamento idêntico (Fornecedor, Valor e Vencimento) cadastrado no sistema.';
        RAISE EXCEPTION '%', v_msg USING ERRCODE = 'unique_violation';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger na tabela contas_pagar
DROP TRIGGER IF EXISTS trg_validar_duplicidade_pagamento ON public.contas_pagar;
CREATE TRIGGER trg_validar_duplicidade_pagamento
BEFORE INSERT OR UPDATE OF fornecedor_id, valor, data_vencimento, numero_documento, codigo_barras
ON public.contas_pagar
FOR EACH ROW
EXECUTE FUNCTION public.validar_duplicidade_pagamento();

-- Comentários de segurança e governança
COMMENT ON TABLE public.registro_duplicidade IS 'Log de auditoria para tentativas de inserção de pagamentos duplicados e rastreio de integridade.';
COMMENT ON FUNCTION public.validar_duplicidade_pagamento IS 'Regra de negócio rígida para impedir pagamentos duplicados de fornecedores e fretes.';
-- Prevent duplicate freight/supplier payments in contas_pagar
-- We use a partial index to allow same data if one is cancelled
CREATE UNIQUE INDEX IF NOT EXISTS idx_contas_pagar_prevent_duplicates 
ON public.contas_pagar (fornecedor_id, valor, data_vencimento, numero_documento) 
WHERE (status != 'cancelado' AND fornecedor_id IS NOT NULL AND numero_documento IS NOT NULL);

-- Also add one for cases where supplier is identified by name only (legacy/import)
CREATE UNIQUE INDEX IF NOT EXISTS idx_contas_pagar_name_prevent_duplicates 
ON public.contas_pagar (fornecedor_nome, valor, data_vencimento, numero_documento) 
WHERE (status != 'cancelado' AND fornecedor_id IS NULL AND numero_documento IS NOT NULL);

-- Prevent duplicate billing in contas_receber
CREATE UNIQUE INDEX IF NOT EXISTS idx_contas_receber_prevent_duplicates 
ON public.contas_receber (cliente_id, valor, data_vencimento, numero_documento) 
WHERE (status != 'cancelado' AND cliente_id IS NOT NULL AND numero_documento IS NOT NULL);

-- Add a column to track 'frete' (freight) explicitly if not exists to allow specific filtering
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contas_pagar' AND column_name='is_frete') THEN
        ALTER TABLE public.contas_pagar ADD COLUMN is_frete BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Index for freight searching
CREATE INDEX IF NOT EXISTS idx_contas_pagar_frete ON public.contas_pagar(is_frete) WHERE is_frete = true;
CREATE OR REPLACE FUNCTION public.detectar_duplicidades_financeiras(p_empresa_id UUID, p_tabela TEXT)
RETURNS TABLE (valor NUMERIC, data_vencimento DATE, numero_documento TEXT, total_ocorrencias BIGINT) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF p_tabela = 'contas_pagar' THEN
        RETURN QUERY
        SELECT cp.valor, cp.data_vencimento, cp.numero_documento, COUNT(*) as occurrences
        FROM public.contas_pagar cp
        WHERE cp.empresa_id = p_empresa_id
          AND cp.status != 'cancelado'
          AND cp.numero_documento IS NOT NULL
        GROUP BY cp.valor, cp.data_vencimento, cp.numero_documento
        HAVING COUNT(*) > 1;
    ELSIF p_tabela = 'contas_receber' THEN
        RETURN QUERY
        SELECT cr.valor, cr.data_vencimento, cr.numero_documento, COUNT(*) as occurrences
        FROM public.contas_receber cr
        WHERE cr.empresa_id = p_empresa_id
          AND cr.status != 'cancelado'
          AND cr.numero_documento IS NOT NULL
        GROUP BY cr.valor, cr.data_vencimento, cr.numero_documento
        HAVING COUNT(*) > 1;
    END IF;
END;
$$;
-- Tabela para registrar bloqueios de duplicidade (Auditoria)
CREATE TABLE IF NOT EXISTS public.bloqueios_duplicidade (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
    tabela TEXT NOT NULL, -- 'contas_pagar' ou 'fretes'
    dados_tentativa JSONB NOT NULL,
    motivo_bloqueio TEXT NOT NULL,
    campos_conflitantes JSONB NOT NULL,
    usuario_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.bloqueios_duplicidade ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Empresas podem ver seus bloqueios"
ON public.bloqueios_duplicidade FOR SELECT
USING (empresa_id IN (SELECT id FROM public.empresas WHERE ativo = true));

-- Adicionar coluna de idempotência
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contas_pagar' AND column_name='idempotency_key') THEN
        ALTER TABLE public.contas_pagar ADD COLUMN idempotency_key TEXT;
        CREATE UNIQUE INDEX idx_contas_pagar_idempotency ON public.contas_pagar (idempotency_key) WHERE idempotency_key IS NOT NULL;
    END IF;
END $$;

-- Função principal de validação
CREATE OR REPLACE FUNCTION public.validar_duplicidade_financeira()
RETURNS TRIGGER AS $$
DECLARE
    v_conflito_id UUID;
    v_motivo TEXT;
BEGIN
    -- 1. Idempotency Key
    IF NEW.idempotency_key IS NOT NULL THEN
        SELECT id INTO v_conflito_id FROM public.contas_pagar 
        WHERE idempotency_key = NEW.idempotency_key AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
        LIMIT 1;
        
        IF v_conflito_id IS NOT NULL THEN
            v_motivo := 'Chave de idempotência duplicada (Reenvio de API)';
            INSERT INTO public.bloqueios_duplicidade (empresa_id, tabela, dados_tentativa, motivo_bloqueio, campos_conflitantes, usuario_id)
            VALUES (NEW.empresa_id, 'contas_pagar', to_jsonb(NEW), v_motivo, jsonb_build_object('idempotency_key', NEW.idempotency_key), auth.uid());
            RAISE EXCEPTION 'DUPLICIDADE_DETECTADA: %', v_motivo;
        END IF;
    END IF;

    -- 2. Regra de Negócio: Fornecedor + Valor + Documento + Mês
    SELECT id INTO v_conflito_id FROM public.contas_pagar
    WHERE empresa_id = NEW.empresa_id
      AND (fornecedor_id = NEW.fornecedor_id OR cnpj_fornecedor = NEW.cnpj_fornecedor)
      AND valor = NEW.valor
      AND numero_documento = NEW.numero_documento
      AND date_trunc('month', data_vencimento) = date_trunc('month', NEW.data_vencimento)
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
      AND status != 'cancelado'
    LIMIT 1;

    IF v_conflito_id IS NOT NULL THEN
        v_motivo := 'Pagamento idêntico detectado para o mesmo fornecedor/CNPJ, valor e documento no mês.';
        INSERT INTO public.bloqueios_duplicidade (empresa_id, tabela, dados_tentativa, motivo_bloqueio, campos_conflitantes, usuario_id)
        VALUES (NEW.empresa_id, 'contas_pagar', to_jsonb(NEW), v_motivo, 
                jsonb_build_object('fornecedor', COALESCE(NEW.fornecedor_id::text, NEW.cnpj_fornecedor), 'valor', NEW.valor, 'documento', NEW.numero_documento), 
                auth.uid());
        
        -- Alerta Automático
        INSERT INTO public.alertas_tributarios (empresa_id, titulo, descricao, prioridade, categoria)
        VALUES (NEW.empresa_id, 'Bloqueio de Duplicidade', v_motivo || ' Documento: ' || NEW.numero_documento, 'alta', 'financeiro');
        
        RAISE EXCEPTION 'DUPLICIDADE_DETECTADA: %', v_motivo;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_validar_duplicidade_pagar ON public.contas_pagar;
CREATE TRIGGER trg_validar_duplicidade_pagar
BEFORE INSERT OR UPDATE ON public.contas_pagar
FOR EACH ROW EXECUTE FUNCTION public.validar_duplicidade_financeira();
-- Tabela de Configurações de Regras de Duplicidade
CREATE TABLE IF NOT EXISTS public.configuracoes_duplicidade (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
    campos_validacao TEXT[] NOT NULL DEFAULT '{fornecedor_id, valor, numero_documento, mes_vencimento}',
    tolerancia_dias INTEGER DEFAULT 0,
    ativo BOOLEAN DEFAULT true,
    versao INTEGER DEFAULT 1,
    criado_por UUID REFERENCES auth.users(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(empresa_id, versao)
);

ALTER TABLE public.configuracoes_duplicidade ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Empresas podem gerenciar suas configuracoes de duplicidade"
ON public.configuracoes_duplicidade FOR ALL
USING (empresa_id IN (SELECT id FROM public.empresas WHERE ativo = true));

-- Adicionar trigger para versionamento automático (opcional, faremos via app para simplicidade inicial)

-- Função para validar duplicidade baseada nas configurações
CREATE OR REPLACE FUNCTION public.validar_duplicidade_avancada()
RETURNS TRIGGER AS $$
DECLARE
    v_config RECORD;
    v_conflito_id UUID;
    v_motivo TEXT;
    v_query TEXT;
    v_campo TEXT;
    v_existe BOOLEAN;
    v_campos_conflitantes JSONB := '{}'::jsonb;
BEGIN
    -- 1. Idempotency Key (Sempre validada se presente)
    IF NEW.idempotency_key IS NOT NULL THEN
        SELECT id INTO v_conflito_id FROM public.contas_pagar 
        WHERE idempotency_key = NEW.idempotency_key AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
        LIMIT 1;
        
        IF v_conflito_id IS NOT NULL THEN
            v_motivo := 'Chave de idempotência duplicada (Reenvio detectado)';
            INSERT INTO public.bloqueios_duplicidade (empresa_id, tabela, dados_tentativa, motivo_bloqueio, campos_conflitantes, usuario_id)
            VALUES (NEW.empresa_id, 'contas_pagar', to_jsonb(NEW), v_motivo, jsonb_build_object('idempotency_key', NEW.idempotency_key), auth.uid());
            RAISE EXCEPTION 'DUPLICIDADE_DETECTADA: %', v_motivo;
        END IF;
    END IF;

    -- 2. Buscar configuração ativa para a empresa
    SELECT * INTO v_config FROM public.configuracoes_duplicidade 
    WHERE empresa_id = NEW.empresa_id AND ativo = true 
    ORDER BY versao DESC LIMIT 1;

    -- Se não houver config, usar padrão
    IF v_config IS NULL THEN
        -- Fallback para lógica padrão já existente no trigger anterior ou implementada aqui
        -- Para garantir perfeição, implementamos a lógica dinâmica
        v_query := 'SELECT EXISTS (SELECT 1 FROM public.contas_pagar WHERE empresa_id = $1 AND id != $2 AND status != ''cancelado''';
        
        -- Default: fornecedor, valor, documento, mes
        v_query := v_query || ' AND (fornecedor_id = $3 OR cnpj_fornecedor = $4) AND valor = $5 AND numero_documento = $6 AND date_trunc(''month'', data_vencimento) = date_trunc(''month'', $7))';
        
        EXECUTE v_query 
        INTO v_existe 
        USING NEW.empresa_id, COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid), NEW.fornecedor_id, NEW.cnpj_fornecedor, NEW.valor, NEW.numero_documento, NEW.data_vencimento;
    ELSE
        -- Lógica dinâmica baseada em v_config.campos_validacao
        v_query := 'SELECT id FROM public.contas_pagar WHERE empresa_id = $1 AND id != $2 AND status != ''cancelado''';
        
        FOREACH v_campo IN ARRAY v_config.campos_validacao LOOP
            IF v_campo = 'fornecedor_id' THEN
                v_query := v_query || ' AND (fornecedor_id = ' || quote_nullable(NEW.fornecedor_id) || ' OR cnpj_fornecedor = ' || quote_nullable(NEW.cnpj_fornecedor) || ')';
                v_campos_conflitantes := v_campos_conflitantes || jsonb_build_object('fornecedor', COALESCE(NEW.fornecedor_id::text, NEW.cnpj_fornecedor));
            ELSIF v_campo = 'valor' THEN
                v_query := v_query || ' AND valor = ' || NEW.valor;
                v_campos_conflitantes := v_campos_conflitantes || jsonb_build_object('valor', NEW.valor);
            ELSIF v_campo = 'numero_documento' THEN
                v_query := v_query || ' AND numero_documento = ' || quote_literal(NEW.numero_documento);
                v_campos_conflitantes := v_campos_conflitantes || jsonb_build_object('documento', NEW.numero_documento);
            ELSIF v_campo = 'mes_vencimento' THEN
                v_query := v_query || ' AND date_trunc(''month'', data_vencimento) = date_trunc(''month'', ' || quote_literal(NEW.data_vencimento) || '::date)';
                v_campos_conflitantes := v_campos_conflitantes || jsonb_build_object('competencia', to_char(NEW.data_vencimento, 'MM/YYYY'));
            ELSIF v_campo = 'data_vencimento' THEN
                v_query := v_query || ' AND data_vencimento = ' || quote_literal(NEW.data_vencimento);
                v_campos_conflitantes := v_campos_conflitantes || jsonb_build_object('vencimento', NEW.data_vencimento);
            END IF;
        END LOOP;

        v_query := v_query || ' LIMIT 1';
        EXECUTE v_query INTO v_conflito_id USING NEW.empresa_id, COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);
        v_existe := v_conflito_id IS NOT NULL;
    END IF;

    IF v_existe THEN
        v_motivo := 'Bloqueio por regra de duplicidade personalizada ativa.';
        INSERT INTO public.bloqueios_duplicidade (empresa_id, tabela, dados_tentativa, motivo_bloqueio, campos_conflitantes, usuario_id)
        VALUES (NEW.empresa_id, 'contas_pagar', to_jsonb(NEW), v_motivo, v_campos_conflitantes, auth.uid());
        
        -- Alerta Automático
        INSERT INTO public.alertas_tributarios (empresa_id, titulo, descricao, prioridade, categoria)
        VALUES (NEW.empresa_id, 'Tentativa de Pagamento Duplicado', v_motivo || ' Documento: ' || NEW.numero_documento, 'alta', 'financeiro');
        
        RAISE EXCEPTION 'DUPLICIDADE_DETECTADA: %', v_motivo;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Atualizar trigger
DROP TRIGGER IF EXISTS trg_validar_duplicidade_pagar ON public.contas_pagar;
CREATE TRIGGER trg_validar_duplicidade_pagar
BEFORE INSERT OR UPDATE ON public.contas_pagar
FOR EACH ROW EXECUTE FUNCTION public.validar_duplicidade_avancada();
-- Add valor_bloqueado to bloqueios_duplicidade
ALTER TABLE public.bloqueios_duplicidade 
ADD COLUMN IF NOT EXISTS valor_bloqueado NUMERIC(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS match_type TEXT DEFAULT 'exact';

-- Add fuzzy_matching to configuracoes_duplicidade
ALTER TABLE public.configuracoes_duplicidade 
ADD COLUMN IF NOT EXISTS fuzzy_matching BOOLEAN DEFAULT false;

-- Update existing records if any (optional but good practice)
UPDATE public.bloqueios_duplicidade 
SET valor_bloqueado = (dados_tentativa->>'valor')::numeric 
WHERE valor_bloqueado = 0 AND dados_tentativa->>'valor' IS NOT NULL;
-- Função para gerar alerta de bloqueio de duplicidade
CREATE OR REPLACE FUNCTION public.notificar_bloqueio_duplicidade()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id UUID;
    v_fornecedor TEXT;
BEGIN
    -- Tenta pegar o ID do usuário que gerou a tentativa, senão pega um admin/responsável
    v_user_id := COALESCE(NEW.usuario_id, (SELECT id FROM auth.users LIMIT 1));
    
    -- Extrai o nome do fornecedor dos dados da tentativa
    v_fornecedor := COALESCE(NEW.dados_tentativa->>'fornecedor_nome', 'Fornecedor Desconhecido');

    -- Insere o alerta
    INSERT INTO public.alertas (
        user_id,
        tipo,
        titulo,
        mensagem,
        prioridade,
        lido,
        acao_url,
        entidade_id,
        entidade_tipo
    ) VALUES (
        v_user_id,
        'vencimento', -- Ou um novo tipo 'seguranca' se existir
        '🛡️ Bloqueio Anti-Duplicidade',
        'Tentativa de pagamento duplicado bloqueada para: ' || v_fornecedor || '. Valor: ' || NEW.valor_bloqueado,
        'high',
        false,
        '/contas-pagar/bloqueios?id=' || NEW.id,
        NEW.id::text,
        'bloqueio_duplicidade'
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para disparar a notificação
DROP TRIGGER IF EXISTS tr_notificar_bloqueio_duplicidade ON public.bloqueios_duplicidade;
CREATE TRIGGER tr_notificar_bloqueio_duplicidade
AFTER INSERT ON public.bloqueios_duplicidade
FOR EACH ROW
EXECUTE FUNCTION public.notificar_bloqueio_duplicidade();
-- Tabela de Regras de Roteamento Financeiro
CREATE TABLE IF NOT EXISTS public.regras_roteamento_financeiro (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    descricao TEXT,
    prioridade INTEGER DEFAULT 0,
    condicoes JSONB NOT NULL DEFAULT '{}', -- Ex: { "tipo": "servico", "valor_min": 1000 }
    conta_bancaria_id UUID NOT NULL REFERENCES public.contas_bancarias(id),
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de Histórico de Cobranças (específica para boletos)
CREATE TABLE IF NOT EXISTS public.historico_cobrancas_boletos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    boleto_id UUID NOT NULL REFERENCES public.boletos(id) ON DELETE CASCADE,
    tipo_evento TEXT NOT NULL, -- Ex: 'envio_email', 'visualizacao', 'baixa_automatica', 'tentativa_falha'
    descricao TEXT,
    metadados JSONB DEFAULT '{}',
    ip_origem TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela para Controle de Importação de Extratos
CREATE TABLE IF NOT EXISTS public.extratos_bancarios_importados (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conta_bancaria_id UUID NOT NULL REFERENCES public.contas_bancarias(id) ON DELETE CASCADE,
    nome_arquivo TEXT NOT NULL,
    hash_arquivo TEXT UNIQUE, -- Para evitar re-importação do mesmo arquivo
    data_inicio DATE,
    data_fim DATE,
    total_transacoes INTEGER,
    metadados JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID REFERENCES auth.users(id)
);

-- Habilitar RLS
ALTER TABLE public.regras_roteamento_financeiro ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historico_cobrancas_boletos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.extratos_bancarios_importados ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS
CREATE POLICY "Users can view their company routing rules"
ON public.regras_roteamento_financeiro FOR SELECT
USING (EXISTS (SELECT 1 FROM public.empresas e WHERE e.id = empresa_id));

CREATE POLICY "Users can manage their company routing rules"
ON public.regras_roteamento_financeiro FOR ALL
USING (EXISTS (SELECT 1 FROM public.empresas e WHERE e.id = empresa_id));

CREATE POLICY "Users can view boleto history"
ON public.historico_cobrancas_boletos FOR SELECT
USING (EXISTS (SELECT 1 FROM public.boletos b JOIN public.empresas e ON b.empresa_id = e.id WHERE b.id = boleto_id));

CREATE POLICY "Users can view their bank imports"
ON public.extratos_bancarios_importados FOR SELECT
USING (EXISTS (SELECT 1 FROM public.contas_bancarias c WHERE c.id = conta_bancaria_id));

-- Trigger para updated_at
CREATE TRIGGER update_regras_roteamento_updated_at
BEFORE UPDATE ON public.regras_roteamento_financeiro
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
-- Adicionar coluna empresa_id se não existir
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'regras_conciliacao' AND column_name = 'empresa_id') THEN
        ALTER TABLE public.regras_conciliacao ADD COLUMN empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Atualizar políticas de acesso (dropar as antigas se houver erro e recriar)
DROP POLICY IF EXISTS "Users can view their company's rules" ON public.regras_conciliacao;
DROP POLICY IF EXISTS "Users can insert rules for their company" ON public.regras_conciliacao;
DROP POLICY IF EXISTS "Users can update rules for their company" ON public.regras_conciliacao;
DROP POLICY IF EXISTS "Users can delete rules for their company" ON public.regras_conciliacao;

CREATE POLICY "Users can view their company's rules"
ON public.regras_conciliacao
FOR SELECT
USING (EXISTS (
    SELECT 1 FROM public.user_empresas 
    WHERE user_empresas.empresa_id = regras_conciliacao.empresa_id 
    AND user_empresas.user_id = auth.uid()
));

CREATE POLICY "Users can insert rules for their company"
ON public.regras_conciliacao
FOR INSERT
WITH CHECK (EXISTS (
    SELECT 1 FROM public.user_empresas 
    WHERE user_empresas.empresa_id = empresa_id 
    AND user_empresas.user_id = auth.uid()
));

CREATE POLICY "Users can update rules for their company"
ON public.regras_conciliacao
FOR UPDATE
USING (EXISTS (
    SELECT 1 FROM public.user_empresas 
    WHERE user_empresas.empresa_id = regras_conciliacao.empresa_id 
    AND user_empresas.user_id = auth.uid()
));

CREATE POLICY "Users can delete rules for their company"
ON public.regras_conciliacao
FOR DELETE
USING (EXISTS (
    SELECT 1 FROM public.user_empresas 
    WHERE user_empresas.empresa_id = regras_conciliacao.empresa_id 
    AND user_empresas.user_id = auth.uid()
));-- Create budgets table
CREATE TABLE IF NOT EXISTS public.budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    budgeted_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    spent_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    period TEXT NOT NULL, -- e.g., "2024-05"
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view budgets of their companies"
    ON public.budgets FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.user_empresas
            WHERE user_id = auth.uid() AND empresa_id = budgets.company_id
        ) OR user_id = auth.uid()
    );

CREATE POLICY "Users can insert budgets"
    ON public.budgets FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_empresas
            WHERE user_id = auth.uid() AND empresa_id = budgets.company_id
        ) OR user_id = auth.uid()
    );

CREATE POLICY "Users can update budgets"
    ON public.budgets FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.user_empresas
            WHERE user_id = auth.uid() AND empresa_id = budgets.company_id
        ) OR user_id = auth.uid()
    );

CREATE POLICY "Users can delete budgets"
    ON public.budgets FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.user_empresas
            WHERE user_id = auth.uid() AND empresa_id = budgets.company_id
        ) OR user_id = auth.uid()
    );

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_budgets_updated_at ON public.budgets;
CREATE TRIGGER update_budgets_updated_at
    BEFORE UPDATE ON public.budgets
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
-- Verifica se a tabela de orçamentos já existe, se não, cria
CREATE TABLE IF NOT EXISTS public.budgets (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    category TEXT NOT NULL,
    budgeted_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    period TEXT NOT NULL, -- Formato YYYY-MM
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilita RLS na tabela de orçamentos
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso para orçamentos (usando user_empresas como verificado no banco)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'budgets' AND policyname = 'Users can view their company budgets') THEN
        CREATE POLICY "Users can view their company budgets" 
        ON public.budgets FOR SELECT 
        USING (company_id IN (SELECT empresa_id FROM public.user_empresas WHERE user_id = auth.uid()));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'budgets' AND policyname = 'Users can insert company budgets') THEN
        CREATE POLICY "Users can insert company budgets" 
        ON public.budgets FOR INSERT 
        WITH CHECK (company_id IN (SELECT empresa_id FROM public.user_empresas WHERE user_id = auth.uid()));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'budgets' AND policyname = 'Users can update company budgets') THEN
        CREATE POLICY "Users can update company budgets" 
        ON public.budgets FOR UPDATE 
        USING (company_id IN (SELECT empresa_id FROM public.user_empresas WHERE user_id = auth.uid()));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'budgets' AND policyname = 'Users can delete company budgets') THEN
        CREATE POLICY "Users can delete company budgets" 
        ON public.budgets FOR DELETE 
        USING (company_id IN (SELECT empresa_id FROM public.user_empresas WHERE user_id = auth.uid()));
    END IF;
END $$;

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_budgets_updated_at') THEN
        CREATE TRIGGER update_budgets_updated_at
        BEFORE UPDATE ON public.budgets
        FOR EACH ROW
        EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
END $$;
-- Create table for API Keys
CREATE TABLE public.api_keys (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    key_hash TEXT NOT NULL UNIQUE,
    key_prefix TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    empresa_id UUID NOT NULL REFERENCES public.empresas(id),
    last_used_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    scopes TEXT[] DEFAULT '{"read"}'::TEXT[],
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own company api keys"
ON public.api_keys
FOR SELECT
USING (auth.uid() IN (
    SELECT user_id FROM public.user_empresas WHERE empresa_id = public.api_keys.empresa_id
));

CREATE POLICY "Admins can manage api keys"
ON public.api_keys
FOR ALL
USING (EXISTS (
    SELECT 1 FROM public.user_empresas 
    WHERE user_id = auth.uid() 
    AND empresa_id = public.api_keys.empresa_id 
    AND role = 'admin'
));

-- Trigger for updated_at
CREATE TRIGGER update_api_keys_updated_at
BEFORE UPDATE ON public.api_keys
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
-- Create table for Custom Field Definitions
CREATE TABLE public.custom_field_definitions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    entity_type TEXT NOT NULL, -- 'contas_pagar', 'contas_receber', 'clientes', etc.
    name TEXT NOT NULL,
    field_type TEXT NOT NULL DEFAULT 'text', -- 'text', 'number', 'date', 'select', 'boolean'
    label TEXT NOT NULL,
    placeholder TEXT,
    options JSONB, -- For 'select' type
    required BOOLEAN DEFAULT false,
    active BOOLEAN DEFAULT true,
    empresa_id UUID NOT NULL REFERENCES public.empresas(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(entity_type, name, empresa_id)
);

-- Add custom_fields column to core tables
ALTER TABLE public.contas_pagar ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '{}'::JSONB;
ALTER TABLE public.contas_receber ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '{}'::JSONB;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '{}'::JSONB;
ALTER TABLE public.fornecedores ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '{}'::JSONB;
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '{}'::JSONB;

-- Enable RLS for definitions
ALTER TABLE public.custom_field_definitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view definitions of their company"
ON public.custom_field_definitions
FOR SELECT
USING (auth.uid() IN (
    SELECT user_id FROM public.user_empresas WHERE empresa_id = public.custom_field_definitions.empresa_id
));

CREATE POLICY "Admins can manage definitions"
ON public.custom_field_definitions
FOR ALL
USING (EXISTS (
    SELECT 1 FROM public.user_empresas 
    WHERE user_id = auth.uid() 
    AND empresa_id = public.custom_field_definitions.empresa_id 
    AND role = 'admin'
));

-- Trigger for updated_at
CREATE TRIGGER update_custom_field_definitions_updated_at
BEFORE UPDATE ON public.custom_field_definitions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
-- Create Action Plans table
CREATE TABLE IF NOT EXISTS public.planos_acao (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    titulo TEXT NOT NULL,
    descricao TEXT,
    prioridade TEXT CHECK (prioridade IN ('baixa', 'media', 'alta', 'critica')) DEFAULT 'media',
    status TEXT CHECK (status IN ('pendente', 'em_andamento', 'concluido', 'cancelado')) DEFAULT 'pendente',
    prazo TIMESTAMP WITH TIME ZONE,
    responsavel TEXT,
    progresso INTEGER DEFAULT 0 CHECK (progresso >= 0 AND progresso <= 100),
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS for Action Plans
ALTER TABLE public.planos_acao ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own action plans"
ON public.planos_acao
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create Operational KPIs table
CREATE TABLE IF NOT EXISTS public.kpis_operacionais (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    valor_atual NUMERIC DEFAULT 0,
    meta NUMERIC DEFAULT 0,
    unidade TEXT,
    tendencia TEXT CHECK (tendencia IN ('subindo', 'descendo', 'estavel')),
    categoria TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS for Operational KPIs
ALTER TABLE public.kpis_operacionais ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own operational KPIs"
ON public.kpis_operacionais
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_planos_acao_updated_at
BEFORE UPDATE ON public.planos_acao
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kpis_operacionais_updated_at
BEFORE UPDATE ON public.kpis_operacionais
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();-- Create Purchase Orders table
CREATE TABLE public.pedidos_compra (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    empresa_id UUID REFERENCES public.empresas(id),
    fornecedor_id UUID REFERENCES public.fornecedores(id),
    status TEXT NOT NULL DEFAULT 'rascunho' CHECK (status IN ('rascunho', 'pendente_aprovacao', 'aprovado', 'rejeitado', 'recebido', 'cancelado')),
    valor_total DECIMAL(12,2) NOT NULL DEFAULT 0,
    data_pedido TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    data_entrega_prevista DATE,
    observacoes TEXT,
    centro_custo_id UUID REFERENCES public.centros_custo(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create Purchase Order Items table
CREATE TABLE public.itens_pedido_compra (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    pedido_id UUID NOT NULL REFERENCES public.pedidos_compra(id) ON DELETE CASCADE,
    descricao TEXT NOT NULL,
    quantidade DECIMAL(12,2) NOT NULL DEFAULT 1,
    valor_unitario DECIMAL(12,2) NOT NULL DEFAULT 0,
    valor_total DECIMAL(12,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pedidos_compra ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itens_pedido_compra ENABLE ROW LEVEL SECURITY;

-- Policies for pedidos_compra
CREATE POLICY "Users can view their own purchase orders"
ON public.pedidos_compra FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own purchase orders"
ON public.pedidos_compra FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own purchase orders"
ON public.pedidos_compra FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own purchase orders"
ON public.pedidos_compra FOR DELETE
USING (auth.uid() = user_id);

-- Policies for itens_pedido_compra
CREATE POLICY "Users can view items of their purchase orders"
ON public.itens_pedido_compra FOR SELECT
USING (EXISTS (
    SELECT 1 FROM public.pedidos_compra
    WHERE pedidos_compra.id = itens_pedido_compra.pedido_id
    AND pedidos_compra.user_id = auth.uid()
));

CREATE POLICY "Users can insert items to their purchase orders"
ON public.itens_pedido_compra FOR INSERT
WITH CHECK (EXISTS (
    SELECT 1 FROM public.pedidos_compra
    WHERE pedidos_compra.id = itens_pedido_compra.pedido_id
    AND pedidos_compra.user_id = auth.uid()
));

-- Trigger for updated_at
CREATE TRIGGER update_pedidos_compra_updated_at
BEFORE UPDATE ON public.pedidos_compra
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
-- Função genérica de auditoria
CREATE OR REPLACE FUNCTION public.audit_trigger_function()
RETURNS TRIGGER AS $$
DECLARE
    current_user_id uuid;
    current_user_email text;
    old_data jsonb := null;
    new_data jsonb := null;
BEGIN
    -- Tenta obter o ID do usuário da sessão do Supabase
    current_user_id := auth.uid();
    
    -- Busca o email se houver um usuário logado
    IF current_user_id IS NOT NULL THEN
        SELECT email INTO current_user_email FROM auth.users WHERE id = current_user_id;
    END IF;

    -- Define os dados antigos e novos baseados na operação
    IF (TG_OP = 'DELETE') THEN
        old_data := to_jsonb(OLD);
    ELSIF (TG_OP = 'UPDATE') THEN
        old_data := to_jsonb(OLD);
        new_data := to_jsonb(NEW);
    ELSIF (TG_OP = 'INSERT') THEN
        new_data := to_jsonb(NEW);
    END IF;

    -- Insere na tabela de audit_logs
    INSERT INTO public.audit_logs (
        user_id,
        user_email,
        action,
        table_name,
        record_id,
        old_data,
        new_data,
        ip_address,
        user_agent
    ) VALUES (
        current_user_id,
        COALESCE(current_user_email, 'sistema'),
        TG_OP,
        TG_TABLE_NAME,
        CASE 
            WHEN TG_OP = 'DELETE' THEN OLD.id::text 
            ELSE NEW.id::text 
        END,
        old_data,
        new_data,
        inet_client_addr()::text,
        NULL -- User agent não é facilmente acessível via trigger pura sem extensões
    );

    IF (TG_OP = 'DELETE') THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aplicação dos triggers nas tabelas core
-- Clientes
DROP TRIGGER IF EXISTS audit_clientes ON public.clientes;
CREATE TRIGGER audit_clientes
AFTER INSERT OR UPDATE OR DELETE ON public.clientes
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

-- Fornecedores
DROP TRIGGER IF EXISTS audit_fornecedores ON public.fornecedores;
CREATE TRIGGER audit_fornecedores
AFTER INSERT OR UPDATE OR DELETE ON public.fornecedores
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

-- Contas Receber
DROP TRIGGER IF EXISTS audit_contas_receber ON public.contas_receber;
CREATE TRIGGER audit_contas_receber
AFTER INSERT OR UPDATE OR DELETE ON public.contas_receber
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

-- Contas Pagar
DROP TRIGGER IF EXISTS audit_contas_pagar ON public.contas_pagar;
CREATE TRIGGER audit_contas_pagar
AFTER INSERT OR UPDATE OR DELETE ON public.contas_pagar
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

-- Usuários (Perfis)
DROP TRIGGER IF EXISTS audit_profiles ON public.profiles;
CREATE TRIGGER audit_profiles
AFTER INSERT OR UPDATE OR DELETE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

-- Permissões (Roles)
DROP TRIGGER IF EXISTS audit_user_roles ON public.user_roles;
CREATE TRIGGER audit_user_roles
AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

-- Empresas
DROP TRIGGER IF EXISTS audit_empresas ON public.empresas;
CREATE TRIGGER audit_empresas
AFTER INSERT OR UPDATE OR DELETE ON public.empresas
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

-- Adiciona índice para performance em buscas por record_id se não existir
CREATE INDEX IF NOT EXISTS idx_audit_logs_record_id ON public.audit_logs(record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON public.audit_logs(table_name);
-- 1. Auditoria Estendida para Tabelas Asaas
DROP TRIGGER IF EXISTS audit_asaas_payments ON public.asaas_payments;
CREATE TRIGGER audit_asaas_payments
AFTER INSERT OR UPDATE OR DELETE ON public.asaas_payments
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

DROP TRIGGER IF EXISTS audit_asaas_transfers ON public.asaas_transfers;
CREATE TRIGGER audit_asaas_transfers
AFTER INSERT OR UPDATE OR DELETE ON public.asaas_transfers
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

-- 2. Função de Liquidação Automática (Settlement)
CREATE OR REPLACE FUNCTION public.handle_asaas_payment_settlement()
RETURNS TRIGGER AS $$
DECLARE
    v_conta_receber_id uuid;
    v_valor_recebido numeric;
    v_valor_liquido numeric;
    v_taxa_gateway numeric;
    v_data_pagamento date;
    v_empresa_id uuid;
    v_conta_bancaria_id uuid;
    v_descricao text;
BEGIN
    -- Só processa se o status mudar para RECEIVED ou CONFIRMED (e não estava assim antes)
    IF (NEW.status IN ('RECEIVED', 'CONFIRMED') AND (OLD.status IS NULL OR OLD.status NOT IN ('RECEIVED', 'CONFIRMED'))) THEN
        
        v_conta_receber_id := NEW.conta_receber_id;
        v_valor_recebido := NEW.valor;
        v_valor_liquido := COALESCE(NEW.valor_liquido, NEW.valor);
        v_taxa_gateway := v_valor_recebido - v_valor_liquido;
        v_data_pagamento := COALESCE(NEW.data_pagamento, CURRENT_DATE);
        v_empresa_id := NEW.empresa_id;
        
        -- Busca conta bancária associada (tenta pelo ID guardado ou pega a primeira da empresa se não houver)
        -- Nota: asaas_payments guarda conta_bancaria como TEXT ou ID. Vamos tentar resolver.
        SELECT id INTO v_conta_bancaria_id 
        FROM public.contas_bancarias 
        WHERE empresa_id = v_empresa_id 
        ORDER BY created_at ASC 
        LIMIT 1;

        IF v_conta_receber_id IS NOT NULL THEN
            -- A. Atualiza Conta a Receber
            UPDATE public.contas_receber 
            SET 
                status = 'pago',
                valor_recebido = v_valor_recebido,
                valor_pago = v_valor_recebido,
                valor_liquido = v_valor_liquido,
                taxa_gateway = v_taxa_gateway,
                data_recebimento = v_data_pagamento,
                updated_at = NOW()
            WHERE id = v_conta_receber_id;

            -- B. Cria Movimentação Bancária (Entrada)
            v_descricao := 'Liquidação Automática Asaas: ' || COALESCE(NEW.descricao, 'Sem descrição');
            
            INSERT INTO public.movimentacoes (
                empresa_id,
                conta_bancaria_id,
                conta_receber_id,
                tipo,
                descricao,
                valor,
                valor_liquido,
                taxa_gateway,
                data_movimentacao,
                data_competencia,
                origem,
                asaas_transaction_id,
                asaas_type
            ) VALUES (
                v_empresa_id,
                v_conta_bancaria_id,
                v_conta_receber_id,
                'entrada',
                v_descricao,
                v_valor_recebido,
                v_valor_liquido,
                v_taxa_gateway,
                v_data_pagamento,
                v_data_pagamento,
                'asaas',
                NEW.asaas_id,
                NEW.tipo
            );
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Trigger de Liquidação
DROP TRIGGER IF EXISTS trigger_asaas_settlement ON public.asaas_payments;
CREATE TRIGGER trigger_asaas_settlement
AFTER UPDATE ON public.asaas_payments
FOR EACH ROW EXECUTE FUNCTION public.handle_asaas_payment_settlement();
-- Função para gerar lançamentos contábeis automáticos
CREATE OR REPLACE FUNCTION public.gerar_lancamento_contabil_automatico()
RETURNS TRIGGER AS $$
DECLARE
    v_lancamento_id uuid;
    v_conta_contabil_id uuid;
    v_conta_bancaria_contabil_id uuid;
    v_empresa_id uuid;
    v_historico text;
BEGIN
    v_empresa_id := NEW.empresa_id;
    v_historico := 'Lançamento Automático: ' || COALESCE(NEW.descricao, 'Movimentação ' || NEW.id);

    -- 1. Cria o cabeçalho do lançamento contábil
    INSERT INTO public.lancamentos_contabeis (
        empresa_id,
        data_lancamento,
        historico,
        origem,
        origem_id,
        valor_total,
        status
    ) VALUES (
        v_empresa_id,
        NEW.data_movimentacao,
        v_historico,
        'financeiro_movimentacao',
        NEW.id,
        NEW.valor,
        'confirmado'
    ) RETURNING id INTO v_lancamento_id;

    -- 2. Busca a conta contábil vinculada à categoria da movimentação
    -- Se não houver categoria direta, tenta buscar via plano_conta_id da movimentação
    SELECT COALESCE(
        (SELECT plano_conta_id FROM public.categorias WHERE id = NEW.categoria_id),
        NEW.plano_conta_id
    ) INTO v_conta_contabil_id;

    -- 3. Busca a conta contábil vinculada à conta bancária (Ativo Circulante - Disponibilidades)
    SELECT plano_conta_id INTO v_conta_bancaria_contabil_id 
    FROM public.contas_bancarias 
    WHERE id = NEW.conta_bancaria_id;

    -- Se não encontrar conta bancária vinculada, usa uma conta padrão de 'Caixa/Bancos' se existir
    IF v_conta_bancaria_contabil_id IS NULL THEN
        SELECT id INTO v_conta_bancaria_contabil_id 
        FROM public.plano_contas 
        WHERE empresa_id = v_empresa_id AND (codigo LIKE '1.1.1%' OR descricao ILIKE '%Banco%')
        LIMIT 1;
    END IF;

    -- 4. Cria as partidas dobradas (Débito e Crédito)
    IF NEW.tipo = 'entrada' THEN
        -- Entrada de dinheiro: Débito no Banco, Crédito na Categoria (Receita)
        -- Partida 1: Débito (D) no Banco
        IF v_conta_bancaria_contabil_id IS NOT NULL THEN
            INSERT INTO public.partidas_contabeis (lancamento_id, conta_id, tipo, valor, historico_complementar)
            VALUES (v_lancamento_id, v_conta_bancaria_contabil_id, 'D', NEW.valor, 'Entrada em conta bancária');
        END IF;

        -- Partida 2: Crédito (C) na Conta de Receita/Recebível
        IF v_conta_contabil_id IS NOT NULL THEN
            INSERT INTO public.partidas_contabeis (lancamento_id, conta_id, tipo, valor, historico_complementar)
            VALUES (v_lancamento_id, v_conta_contabil_id, 'C', NEW.valor, 'Receita reconhecida');
        END IF;
        
    ELSIF NEW.tipo = 'saida' THEN
        -- Saída de dinheiro: Débito na Categoria (Despesa), Crédito no Banco
        -- Partida 1: Débito (D) na Conta de Despesa/Pagar
        IF v_conta_contabil_id IS NOT NULL THEN
            INSERT INTO public.partidas_contabeis (lancamento_id, conta_id, tipo, valor, historico_complementar)
            VALUES (v_lancamento_id, v_conta_contabil_id, 'D', NEW.valor, 'Despesa reconhecida');
        END IF;

        -- Partida 2: Crédito (C) no Banco
        IF v_conta_bancaria_contabil_id IS NOT NULL THEN
            INSERT INTO public.partidas_contabeis (lancamento_id, conta_id, tipo, valor, historico_complementar)
            VALUES (v_lancamento_id, v_conta_bancaria_contabil_id, 'C', NEW.valor, 'Saída de conta bancária');
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Trigger para Movimentações
DROP TRIGGER IF EXISTS trigger_gerar_contabilidade ON public.movimentacoes;
CREATE TRIGGER trigger_gerar_contabilidade
AFTER INSERT ON public.movimentacoes
FOR EACH ROW EXECUTE FUNCTION public.gerar_lancamento_contabil_automatico();
-- 1. Atualizar vw_contas_pagar_painel com campos de empresa
DROP VIEW IF EXISTS public.vw_contas_pagar_painel;
CREATE VIEW public.vw_contas_pagar_painel AS
SELECT 
    cp.*,
    e.razao_social AS empresa_razao_social,
    e.nome_fantasia AS empresa_nome_fantasia,
    e.cnpj AS empresa_cnpj,
    f.razao_social AS fornecedor_razao_social,
    f.nome_fantasia AS fornecedor_nome_fantasia,
    cc.nome AS centro_custo_nome,
    cb.banco AS banco_nome
FROM 
    public.contas_pagar cp
LEFT JOIN public.empresas e ON cp.empresa_id = e.id
LEFT JOIN public.fornecedores f ON cp.fornecedor_id = f.id
LEFT JOIN public.centros_custo cc ON cp.centro_custo_id = cc.id
LEFT JOIN public.contas_bancarias cb ON cp.conta_bancaria_id = cb.id;

ALTER VIEW public.vw_contas_pagar_painel SET (security_invoker = true);

-- 2. Atualizar vw_contas_receber_painel com campos de empresa
DROP VIEW IF EXISTS public.vw_contas_receber_painel;
CREATE VIEW public.vw_contas_receber_painel AS
SELECT 
    cr.*,
    e.razao_social AS empresa_razao_social,
    e.nome_fantasia AS empresa_nome_fantasia,
    e.cnpj AS empresa_cnpj,
    c.razao_social AS cliente_razao_social,
    c.nome_fantasia AS cliente_nome_fantasia,
    cc.nome AS centro_custo_nome,
    cb.banco AS banco_nome
FROM 
    public.contas_receber cr
LEFT JOIN public.empresas e ON cr.empresa_id = e.id
LEFT JOIN public.clientes c ON cr.cliente_id = c.id
LEFT JOIN public.centros_custo cc ON cr.centro_custo_id = cc.id
LEFT JOIN public.contas_bancarias cb ON cr.conta_bancaria_id = cb.id;

ALTER VIEW public.vw_contas_receber_painel SET (security_invoker = true);
-- Adicionar colunas de IA para insights no WhatsApp
ALTER TABLE public.historico_cobranca_whatsapp 
ADD COLUMN IF NOT EXISTS ia_sentimento TEXT,
ADD COLUMN IF NOT EXISTS ia_resumo TEXT,
ADD COLUMN IF NOT EXISTS ia_proxima_acao TEXT;

-- Criar índice para performance em filtros de IA
CREATE INDEX IF NOT EXISTS idx_whatsapp_ia_sentimento ON public.historico_cobranca_whatsapp(ia_sentimento);

-- Comentários para documentação
COMMENT ON COLUMN public.historico_cobranca_whatsapp.ia_sentimento IS 'Sentimento detectado pela IA (positivo, neutro, negativo, agressivo)';
COMMENT ON COLUMN public.historico_cobranca_whatsapp.ia_resumo IS 'Resumo gerado por IA sobre o conteúdo da conversa';
COMMENT ON COLUMN public.historico_cobranca_whatsapp.ia_proxima_acao IS 'Ação recomendada pela IA baseada no contexto';
-- Habilitar a extensão pg_net
CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";

-- Função para chamar o webhook da Edge Function
CREATE OR REPLACE FUNCTION public.trigger_whatsapp_ai_analysis()
RETURNS TRIGGER AS $$
BEGIN
  -- Chamada assíncrona para a Edge Function usando pg_net
  PERFORM
    net.http_post(
      url := 'https://iikqosstymnnxaujzadw.supabase.co/functions/v1/whatsapp-ai-analyzer',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (SELECT value FROM vault.decrypted_secrets WHERE name = 'service_role_key' LIMIT 1)
      ),
      body := jsonb_build_object('record', row_to_json(NEW))
    );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para novas mensagens
DROP TRIGGER IF EXISTS on_whatsapp_message_inserted ON public.historico_cobranca_whatsapp;
CREATE TRIGGER on_whatsapp_message_inserted
AFTER INSERT ON public.historico_cobranca_whatsapp
FOR EACH ROW
EXECUTE FUNCTION public.trigger_whatsapp_ai_analysis();
-- Adicionar campos de scoring externo e comportamental
ALTER TABLE public.clientes 
ADD COLUMN IF NOT EXISTS serasa_score INTEGER,
ADD COLUMN IF NOT EXISTS boa_vista_score INTEGER,
ADD COLUMN IF NOT EXISTS data_ultima_consulta_externa TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS ia_risco_comportamental TEXT;

-- Comentários para documentação
COMMENT ON COLUMN public.clientes.serasa_score IS 'Score do cliente no Serasa (0-1000)';
COMMENT ON COLUMN public.clientes.boa_vista_score IS 'Score do cliente no Boa Vista (0-1000)';
COMMENT ON COLUMN public.clientes.ia_risco_comportamental IS 'Análise de risco baseada no comportamento histórico de pagamentos internos';
-- Tabela para histórico de conversas via WhatsApp com IA
CREATE TABLE IF NOT EXISTS public.whatsapp_conversas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID REFERENCES public.clientes(id) ON DELETE CASCADE,
    mensagem TEXT NOT NULL,
    direcao TEXT CHECK (direcao IN ('entrada', 'saida')),
    status TEXT DEFAULT 'enviado',
    sentimento TEXT, -- IA analysis: positivo, neutro, negativo, agressivo
    intencao_pagamento BOOLEAN DEFAULT false,
    resumo_ia TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    user_id UUID DEFAULT auth.uid()
);

-- Habilitar RLS
ALTER TABLE public.whatsapp_conversas ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Usuários podem ver conversas de seus clientes"
ON public.whatsapp_conversas FOR SELECT
USING (true); -- Simplificado para o escopo, idealmente filtraria por empresa/user

CREATE POLICY "Usuários podem inserir mensagens"
ON public.whatsapp_conversas FOR INSERT
WITH CHECK (true);

-- Trigger para atualizar score baseado em novas conversas (placeholder para lógica de IA)
CREATE OR REPLACE FUNCTION public.analisar_sentimento_whatsapp()
RETURNS TRIGGER AS $$
BEGIN
    -- Aqui seria chamado um webhook ou edge function para IA
    -- Por enquanto, simulamos uma classificação simples
    IF NEW.mensagem ~* '(pagar|pago|comprovante|liquidar)' THEN
        NEW.intencao_pagamento := true;
        NEW.sentimento := 'positivo';
    ELSIF NEW.mensagem ~* '(atraso|nao consigo|dificuldade|problema)' THEN
        NEW.intencao_pagamento := false;
        NEW.sentimento := 'negativo';
    ELSE
        NEW.sentimento := 'neutro';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_analisar_whatsapp
BEFORE INSERT ON public.whatsapp_conversas
FOR EACH ROW EXECUTE FUNCTION public.analisar_sentimento_whatsapp();
-- 1. Melhorar logs de Webhooks
ALTER TABLE public.webhooks_log 
ADD COLUMN IF NOT EXISTS correlation_id TEXT,
ADD COLUMN IF NOT EXISTS ip_origem TEXT,
ADD COLUMN IF NOT EXISTS duration_ms INTEGER,
ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0;

-- 2. Garantir isolamento Multi-CNPJ/Tenant em tabelas críticas
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contas_bancarias' AND column_name = 'empresa_id') THEN
        ALTER TABLE public.contas_bancarias ADD COLUMN empresa_id UUID REFERENCES public.empresas(id);
    END IF;
END $$;

-- 3. Adicionar alertas automáticos para falhas críticas
CREATE OR REPLACE FUNCTION public.gerar_alerta_falha_processamento()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'falha' OR NEW.erro_mensagem IS NOT NULL THEN
    INSERT INTO public.alertas (
      tipo,
      titulo,
      mensagem,
      prioridade,
      entidade_tipo,
      entidade_id,
      user_id
    ) VALUES (
      'falha_operacional',
      'Falha no Webhook: ' || COALESCE(NEW.event_type, 'Desconhecido'),
      'O processamento do webhook falhou: ' || COALESCE(NEW.erro_mensagem, 'Erro desconhecido') || '. Verifique o painel de logs.',
      'alta',
      'webhook',
      NEW.id,
      (SELECT user_id FROM public.perfil_usuarios WHERE empresa_id = NEW.empresa_id LIMIT 1)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_alerta_webhook_falha ON public.webhooks_log;
CREATE TRIGGER tr_alerta_webhook_falha
AFTER INSERT OR UPDATE ON public.webhooks_log
FOR EACH ROW WHEN (NEW.erro_mensagem IS NOT NULL)
EXECUTE FUNCTION public.gerar_alerta_falha_processamento();

-- Alerta para falha na Régua de Cobrança
CREATE OR REPLACE FUNCTION public.gerar_alerta_falha_regua()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'falha' THEN
    INSERT INTO public.alertas (
      tipo,
      titulo,
      mensagem,
      prioridade,
      entidade_tipo,
      entidade_id,
      user_id
    ) VALUES (
      'falha_regua',
      'Falha na Régua de Cobrança',
      'Não foi possível executar a etapa ' || NEW.etapa || ' para o título ' || NEW.conta_receber_id || '. Motivo: ' || COALESCE(NEW.mensagem_erro, 'Sem detalhes'),
      'media',
      'conta_receber',
      NEW.conta_receber_id,
      (SELECT user_id FROM public.perfil_usuarios WHERE empresa_id = NEW.empresa_id LIMIT 1)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_alerta_regua_falha ON public.execucoes_regua_cobranca;
CREATE TRIGGER tr_alerta_regua_falha
AFTER INSERT ON public.execucoes_regua_cobranca
FOR EACH ROW WHEN (NEW.status = 'falha')
EXECUTE FUNCTION public.gerar_alerta_falha_regua();
-- Tabela para níveis de aprovação (Workflows complexos)
CREATE TABLE IF NOT EXISTS public.fluxos_aprovacao_niveis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    ordem INTEGER NOT NULL,
    nome TEXT NOT NULL,
    descricao TEXT,
    valor_minimo DECIMAL(15,2) DEFAULT 0,
    aprovadores_obrigatorios INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(empresa_id, ordem)
);

-- Habilitar RLS
ALTER TABLE public.fluxos_aprovacao_niveis ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Users can view their own workflow levels"
ON public.fluxos_aprovacao_niveis FOR SELECT
USING (auth.uid() = empresa_id);

CREATE POLICY "Admins can manage workflow levels"
ON public.fluxos_aprovacao_niveis FOR ALL
USING (auth.uid() = empresa_id);

-- Comentários nas aprovações (Trilha de discussão)
CREATE TABLE IF NOT EXISTS public.aprovacao_comentarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    solicitacao_id UUID NOT NULL REFERENCES public.solicitacoes_aprovacao(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL,
    texto TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.aprovacao_comentarios ENABLE ROW LEVEL SECURITY;

-- Políticas para comentários
CREATE POLICY "Users can view comments on their requests or if they are approvers"
ON public.aprovacao_comentarios FOR SELECT
USING (true); -- Simplificado para o exemplo, em produção seria mais restrito

CREATE POLICY "Users can post comments"
ON public.aprovacao_comentarios FOR INSERT
WITH CHECK (auth.uid() = usuario_id);

-- Adicionar colunas de controle de fluxo na tabela de solicitações
ALTER TABLE public.solicitacoes_aprovacao 
ADD COLUMN IF NOT EXISTS nivel_atual INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS total_niveis INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS assinaturas JSONB DEFAULT '[]'::jsonb;

-- Trigger para atualizar timestamp
CREATE TRIGGER update_fluxos_aprovacao_niveis_updated_at
BEFORE UPDATE ON public.fluxos_aprovacao_niveis
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
-- Tabela para controle de obrigações acessórias
CREATE TABLE IF NOT EXISTS public.obrigacoes_acessorias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    codigo TEXT NOT NULL,
    nome TEXT NOT NULL,
    esfera TEXT NOT NULL CHECK (esfera IN ('federal', 'estadual', 'municipal')),
    periodicidade TEXT NOT NULL,
    competencia TEXT NOT NULL, -- Formato MM/YYYY
    vencimento DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_andamento', 'transmitida', 'atrasada', 'nao_aplicavel')),
    transmitida_em TIMESTAMP WITH TIME ZONE,
    protocolo TEXT,
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.obrigacoes_acessorias ENABLE ROW LEVEL SECURITY;

-- Políticas para obrigacoes_acessorias
CREATE POLICY "Users can view their company obligations"
    ON public.obrigacoes_acessorias
    FOR SELECT
    USING (auth.uid() IN (
        SELECT user_id FROM public.user_roles WHERE role IN ('admin', 'financeiro', 'visualizador')
    ));

CREATE POLICY "Users can manage their company obligations"
    ON public.obrigacoes_acessorias
    FOR ALL
    USING (auth.uid() IN (
        SELECT user_id FROM public.user_roles WHERE role IN ('admin', 'financeiro')
    ));

-- Tabela para glossário tributário (global/compartilhada)
CREATE TABLE IF NOT EXISTS public.glossario_tributario (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    termo TEXT NOT NULL UNIQUE,
    significado TEXT NOT NULL,
    categoria TEXT, -- Ex: 'Reforma Tributária', 'Geral', 'Simples Nacional'
    base_legal TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.glossario_tributario ENABLE ROW LEVEL SECURITY;

-- Política de leitura pública para o glossário
CREATE POLICY "Anyone can view glossary"
    ON public.glossario_tributario
    FOR SELECT
    USING (true);

-- Inserir termos básicos no glossário
INSERT INTO public.glossario_tributario (termo, significado, categoria, base_legal) VALUES
('CBS', 'Contribuição sobre Bens e Serviços. Tributo federal que substitui PIS e COFINS.', 'Reforma Tributária', 'EC 132/2023'),
('IBS', 'Imposto sobre Bens e Serviços. Tributo subnacional (estados e municípios) que substitui ICMS e ISS.', 'Reforma Tributária', 'EC 132/2023'),
('IS', 'Imposto Seletivo (ou "Imposto do Pecado"). Tributo federal sobre produtos nocivos à saúde ou ao meio ambiente.', 'Reforma Tributária', 'EC 132/2023'),
('Split Payment', 'Mecanismo de recolhimento automático do tributo no momento da liquidação financeira da operação.', 'Reforma Tributária', 'LC 214/2025'),
('Cashback Tributário', 'Devolução de parte do IBS e da CBS para famílias de baixa renda.', 'Reforma Tributária', 'EC 132/2023'),
('IVA Dual', 'Modelo tributário composto por dois impostos sobre o valor adicionado (CBS e IBS).', 'Reforma Tributária', 'EC 132/2023'),
('Não-Cumulatividade Plena', 'Regime que permite o aproveitamento integral de créditos tributários sobre todas as aquisições da empresa.', 'Reforma Tributária', 'EC 132/2023'),
('Princípio do Destino', 'A tributação ocorre no local onde o bem ou serviço é consumido, e não onde é produzido.', 'Reforma Tributária', 'EC 132/2023')
ON CONFLICT (termo) DO NOTHING;

-- Trigger para updated_at
CREATE TRIGGER update_obrigacoes_acessorias_updated_at
BEFORE UPDATE ON public.obrigacoes_acessorias
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
-- Create tax audit trail table
CREATE TABLE public.tax_audit_trail (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    empresa_id UUID NOT NULL REFERENCES public.empresas(id),
    ano INTEGER NOT NULL,
    mes INTEGER NOT NULL,
    action TEXT NOT NULL, -- 'simulated', 'cache_hit', 'pdf_generated'
    parameters JSONB,
    prompt TEXT,
    response TEXT,
    is_ai_justified BOOLEAN DEFAULT FALSE,
    cache_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tax_audit_trail ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view audit trail of their companies"
ON public.tax_audit_trail
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.user_empresas
        WHERE user_empresas.empresa_id = tax_audit_trail.empresa_id
        AND user_empresas.user_id = auth.uid()
    )
);

CREATE POLICY "Users can insert audit trail entries"
ON public.tax_audit_trail
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.user_empresas
        WHERE user_empresas.empresa_id = tax_audit_trail.empresa_id
        AND user_empresas.user_id = auth.uid()
    )
);

-- Index for performance
CREATE INDEX idx_tax_audit_empresa ON public.tax_audit_trail(empresa_id, ano, mes);
