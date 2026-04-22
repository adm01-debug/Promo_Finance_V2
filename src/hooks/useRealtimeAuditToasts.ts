import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { classifyAuditPriority, toastForPriority } from '@/lib/audit-priority';
import { logger } from '@/lib/logger';

interface AuditLogRow {
  id: string;
  action: string;
  table_name: string | null;
  details: string | null;
  user_email: string | null;
  created_at: string;
}

const TABLE_TO_TAB: Record<string, 'financeira' | 'tributaria' | 'sistema'> = {
  // Financial tables route to "financeira" tab if surfaced via audit_logs (rare); default = sistema
};

/**
 * Subscribes to new `audit_logs` inserts and shows a toast with a
 * "Ver detalhes" action that deep-links to the corresponding trilha
 * record in /admin/compliance.
 *
 * Only active for admins (matches RLS visibility).
 */
export function useRealtimeAuditToasts() {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();

  useEffect(() => {
    if (!user || !isAdmin) return;

    const channel = supabase
      .channel('audit-logs-toast-stream')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'audit_logs' },
        (payload) => {
          const row = payload.new as AuditLogRow;
          if (!row?.id) return;

          const priority = classifyAuditPriority({
            action: row.action,
            details: row.details,
            table_name: row.table_name,
          });

          // Skip noise: don't toast informational events (logins/logouts).
          if (priority === 'info') return;

          const tab = (row.table_name && TABLE_TO_TAB[row.table_name]) ?? 'sistema';
          const target = `/admin/compliance?tab=${tab}&record=${row.id}`;

          const title = `Auditoria: ${row.action}${row.table_name ? ` · ${row.table_name}` : ''}`;
          const description =
            row.details ||
            (row.user_email ? `Por ${row.user_email}` : 'Novo evento de auditoria registrado');

          toastForPriority(priority, title, {
            description,
            duration: priority === 'critical' ? 15000 : 8000,
            action: {
              label: 'Ver detalhes',
              onClick: () => navigate(target),
            },
          });

          logger.debug('[useRealtimeAuditToasts] toast emitted', {
            id: row.id,
            priority,
            target,
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, isAdmin, navigate]);
}
