import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

type AuditAction = 'INSERT' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'LOGIN_FAILED' | 'MFA_ENABLED' | 'MFA_DISABLED' | 'ROLE_CHANGED' | 'PERMISSION_CHANGED' | 'EXPORT' | 'IMPORT' | 'APPROVE' | 'REJECT' | 'PASSWORD_CHANGE' | 'SETTINGS_CHANGE' | 'PASSWORD_RESET_REQUEST' | 'PASSWORD_RESET_APPROVE' | 'PASSWORD_RESET_REJECT';

export function useLogAudit() {
  return useMutation({
    mutationFn: async (params: {
      action: AuditAction;
      tableName?: string;
      recordId?: string;
      oldData?: Record<string, unknown>;
      newData?: Record<string, unknown>;
      details?: string;
    }) => {
      const { data, error } = await supabase.rpc('log_audit', {
        _action: params.action,
        _table_name: params.tableName || null,
        _record_id: params.recordId || null,
        _old_data: params.oldData ? JSON.stringify(params.oldData) : null,
        _new_data: params.newData ? JSON.stringify(params.newData) : null,
        _details: params.details || null,
      });
      if (error) throw error;
      return data;
    },
  });
}
