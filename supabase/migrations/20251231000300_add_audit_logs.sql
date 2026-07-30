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
