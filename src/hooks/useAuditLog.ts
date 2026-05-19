import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

type AuditAction = 'INSERT' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'EXPORT' | 'APPROVE' | 'REJECT';

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
        p_action: params.action,
        p_table_name: params.tableName || null,
        p_record_id: params.recordId || null,
        p_old_data: params.oldData ? (params.oldData as any) : null,
        p_new_data: params.newData ? (params.newData as any) : null,
        p_details: params.details || null,
      });
      if (error) throw error;
      return data;
    },
  });
}
