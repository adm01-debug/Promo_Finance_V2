import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { logger } from '@/lib/logger';

interface RateLimitLog {
  id: string;
  ip_address: string;
  endpoint: string;
  request_count: number;
  window_start: string;
  blocked: boolean;
  created_at: string;
}

interface BlockedIP {
  id: string;
  ip_address: string;
  reason: string | null;
  blocked_at: string;
  blocked_until: string | null;
  permanent: boolean;
  blocked_by: string | null;
  unblocked_at: string | null;
  unblocked_by: string | null;
  created_at: string;
}

interface RateLimitStats {
  totalRequests: number;
  blockedRequests: number;
  uniqueIPs: number;
  topEndpoints: { endpoint: string; count: number }[];
  topIPs: { ip: string; count: number }[];
}

export function useRateLimitLogs() {
  const { user, isAdmin } = useAuth();
  const [logs, setLogs] = useState<RateLimitLog[]>([]);
  const [blockedIPs, setBlockedIPs] = useState<BlockedIP[]>([]);
  const [stats, setStats] = useState<RateLimitStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    if (!user || !isAdmin) {
      setIsLoading(false);
      return;
    }

    try {
      // Fetch rate limit logs
      const { data: logsData, error: logsError } = await supabase
        .from('rate_limit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);

      if (logsError) {
        logger.error('Erro ao buscar logs:', logsError);
        return;
      }

      // ip_address vem como `unknown` do Postgrest (tipo inet do Postgres serializado como string).
      const logs = (logsData ?? []) as unknown as RateLimitLog[];
      setLogs(logs);

      // Fetch blocked IPs
      const { data: blockedData, error: blockedError } = await supabase
        .from('blocked_ips')
        .select('*')
        .order('blocked_at', { ascending: false });

      if (blockedError) {
        logger.error('Erro ao buscar IPs bloqueados:', blockedError);
        return;
      }

      setBlockedIPs((blockedData ?? []) as unknown as BlockedIP[]);

      // Calculate stats
      if (logs.length) {
        const totalRequests = logs.reduce((sum, log) => sum + log.request_count, 0);
        const blockedRequests = logs.filter((log) => log.blocked).length;
        const uniqueIPs = new Set(logs.map((log) => log.ip_address)).size;

        // Top endpoints
        const endpointCounts = logs.reduce(
          (acc, log) => {
            acc[log.endpoint] = (acc[log.endpoint] || 0) + log.request_count;
            return acc;
          },
          {} as Record<string, number>
        );

        const topEndpoints = Object.entries(endpointCounts)
          .map(([endpoint, count]) => ({ endpoint, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10);

        // Top IPs
        const ipCounts = logs.reduce(
          (acc, log) => {
            acc[log.ip_address] = (acc[log.ip_address] || 0) + log.request_count;
            return acc;
          },
          {} as Record<string, number>
        );

        const topIPs = Object.entries(ipCounts)
          .map(([ip, count]) => ({ ip, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10);

        setStats({
          totalRequests,
          blockedRequests,
          uniqueIPs,
          topEndpoints,
          topIPs,
        });
      }
    } catch (error: unknown) {
      logger.error('Erro ao buscar dados:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, isAdmin]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const blockIP = async (
    ipAddress: string,
    reason: string,
    permanent: boolean = false,
    blockedUntil?: string
  ) => {
    try {
      const { error } = await supabase.from('blocked_ips').insert({
        ip_address: ipAddress,
        reason,
        permanent,
        blocked_until: blockedUntil || null,
        blocked_by: user?.id,
      });

      if (error) throw error;
      await fetchLogs();
      return true;
    } catch (error: unknown) {
      logger.error('Erro ao bloquear IP:', error);
      throw error;
    }
  };

  const unblockIP = async (id: string) => {
    try {
      const { error } = await supabase
        .from('blocked_ips')
        .update({
          unblocked_at: new Date().toISOString(),
          unblocked_by: user?.id,
        })
        .eq('id', id);

      if (error) throw error;
      await fetchLogs();
      return true;
    } catch (error: unknown) {
      logger.error('Erro ao desbloquear IP:', error);
      throw error;
    }
  };

  const clearOldLogs = async (daysOld: number = 30) => {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const { error } = await supabase
        .from('rate_limit_logs')
        .delete()
        .lt('created_at', cutoffDate.toISOString());

      if (error) throw error;
      await fetchLogs();
      return true;
    } catch (error: unknown) {
      logger.error('Erro ao limpar logs:', error);
      throw error;
    }
  };

  return {
    logs,
    blockedIPs,
    stats,
    isLoading,
    blockIP,
    unblockIP,
    clearOldLogs,
    refresh: fetchLogs,
  };
}
