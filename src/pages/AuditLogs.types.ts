export type AuditAction = string;

export interface AuditLog {
  id: string;
  user_id: string | null;
  user_email: string | null;
  action: string;
  table_name: string | null;
  record_id: string | null;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  details: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}
