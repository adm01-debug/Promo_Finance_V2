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
