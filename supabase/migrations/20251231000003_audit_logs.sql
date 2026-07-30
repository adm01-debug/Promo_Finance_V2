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
