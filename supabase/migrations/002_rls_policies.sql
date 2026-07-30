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
