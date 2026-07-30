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
