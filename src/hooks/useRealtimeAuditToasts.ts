import { useEffect, useRef } from 'react';
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

// Janelas de deduplicação
const ID_TTL_MS = 5 * 60 * 1000; // mesmo id nunca repete em 5 min
const SIG_WINDOW_MS = 10 * 1000; // mesma "assinatura" agrupa em 10s
const MAX_IDS = 500; // limite do cache de ids

interface PendingGroup {
  toastId: string | number;
  count: number;
  sample: AuditLogRow;
  priority: ReturnType<typeof classifyAuditPriority>;
  firstAt: number;
  timer: ReturnType<typeof setTimeout>;
}

/**
 * Subscribes to new `audit_logs` inserts and shows a toast with a
 * "Ver detalhes" action that deep-links to the corresponding trilha
 * record in /admin/compliance.
 *
 * Deduplicação:
 *  - Mesmo `id` é ignorado por 5 minutos (anti-eco do canal realtime).
 *  - Eventos com mesma "assinatura" (action + table + user) numa janela
 *    de 10s são agrupados em um único toast com contador "(xN)".
 *
 * Only active for admins (matches RLS visibility).
 */
export function useRealtimeAuditToasts() {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();

  // Refs persistem entre renders sem reassinar o canal.
  const seenIds = useRef<Map<string, number>>(new Map());
  const pendingGroups = useRef<Map<string, PendingGroup>>(new Map());

  useEffect(() => {
    if (!user || !isAdmin) return;

    const seen = seenIds.current;
    const groups = pendingGroups.current;

    const pruneSeen = () => {
      const now = Date.now();
      for (const [id, ts] of seen) {
        if (now - ts > ID_TTL_MS) seen.delete(id);
      }
      // Hard cap (LRU-ish: descarta os mais antigos).
      if (seen.size > MAX_IDS) {
        const overflow = seen.size - MAX_IDS;
        const it = seen.keys();
        for (let i = 0; i < overflow; i++) {
          const k = it.next().value;
          if (k !== undefined) seen.delete(k);
        }
      }
    };

    const channel = supabase
      .channel('audit-logs-toast-stream')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'audit_logs' },
        (payload) => {
          const row = payload.new as AuditLogRow;
          if (!row?.id) return;

          // 1) Dedup por id (anti-eco).
          if (seen.has(row.id)) {
            logger.debug('[useRealtimeAuditToasts] dedup id', row.id);
            return;
          }
          seen.set(row.id, Date.now());
          pruneSeen();

          const priority = classifyAuditPriority({
            action: row.action,
            details: row.details,
            table_name: row.table_name,
          });

          // Skip noise: não toasta eventos informativos (login/logout).
          if (priority === 'info') return;

          const tab = (row.table_name && TABLE_TO_TAB[row.table_name]) ?? 'sistema';
          const target = `/admin/compliance?tab=${tab}&record=${row.id}`;

          // 2) Coalescência por assinatura (action + table + user).
          const sig = `${row.action}|${row.table_name ?? ''}|${row.user_email ?? ''}`;
          const existing = groups.get(sig);

          if (existing) {
            existing.count += 1;
            existing.sample = row;
            const title = `Auditoria: ${row.action}${row.table_name ? ` · ${row.table_name}` : ''} (x${existing.count})`;
            const description = row.user_email
              ? `${existing.count} eventos de ${row.user_email}`
              : `${existing.count} eventos agrupados`;

            // Reaproveita o mesmo toastId — o sonner atualiza no lugar.
            toastForPriority(existing.priority, title, {
              description,
              duration: existing.priority === 'critical' ? 15000 : 8000,
              action: {
                label: 'Ver último',
                onClick: () => navigate(target),
              },
              id: existing.toastId,
            });
            return;
          }

          const title = `Auditoria: ${row.action}${row.table_name ? ` · ${row.table_name}` : ''}`;
          const description =
            row.details ||
            (row.user_email ? `Por ${row.user_email}` : 'Novo evento de auditoria registrado');

          const toastId = `audit-${sig}-${Date.now()}`;
          toastForPriority(priority, title, {
            description,
            duration: priority === 'critical' ? 15000 : 8000,
            action: {
              label: 'Ver detalhes',
              onClick: () => navigate(target),
            },
            id: toastId,
          });

          const timer = setTimeout(() => {
            groups.delete(sig);
          }, SIG_WINDOW_MS);

          groups.set(sig, {
            toastId,
            count: 1,
            sample: row,
            priority,
            firstAt: Date.now(),
            timer,
          });

          logger.debug('[useRealtimeAuditToasts] toast emitted', {
            id: row.id,
            sig,
            priority,
            target,
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      // Limpa timers pendentes para não vazar entre remounts.
      for (const g of groups.values()) clearTimeout(g.timer);
      groups.clear();
      // Mantemos `seen` para evitar reentrega após reassinatura rápida.
    };
  }, [user, isAdmin, navigate]);
}
