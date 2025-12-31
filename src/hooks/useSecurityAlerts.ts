import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';

interface SecurityAlert {
  id: string;
  type: string;
  severity: string;
  title: string;
  description: string | null;
  ip_address: string | null;
  user_id: string | null;
  user_email: string | null;
  metadata: Json | null;
  resolved: boolean;
  resolved_at: string | null;
  resolved_by: string | null;
  created_at: string;
}

export function useSecurityAlerts() {
  const { user, isAdmin } = useAuth();
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [unresolvedCount, setUnresolvedCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAlerts = useCallback(async () => {
    if (!user || !isAdmin) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('security_alerts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Erro ao buscar alertas:', error);
        return;
      }

      setAlerts(data || []);
      setUnresolvedCount(data?.filter(a => !a.resolved).length || 0);
    } catch (error) {
      console.error('Erro ao buscar alertas:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, isAdmin]);

  useEffect(() => {
    fetchAlerts();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('security-alerts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'security_alerts',
        },
        (payload) => {
          const newAlert = payload.new as SecurityAlert;
          setAlerts(prev => [newAlert, ...prev]);
          setUnresolvedCount(prev => prev + 1);
          
          // Show toast notification for new alerts
          toast.warning(`Alerta de Segurança: ${newAlert.title}`, {
            description: newAlert.description || undefined,
            duration: 10000,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchAlerts]);

  const resolveAlert = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('security_alerts')
        .update({
          resolved: true,
          resolved_at: new Date().toISOString(),
          resolved_by: user?.id,
        })
        .eq('id', alertId);

      if (error) throw error;

      setAlerts(prev => 
        prev.map(a => 
          a.id === alertId 
            ? { ...a, resolved: true, resolved_at: new Date().toISOString(), resolved_by: user?.id || null }
            : a
        )
      );
      setUnresolvedCount(prev => Math.max(0, prev - 1));
      toast.success('Alerta resolvido');
    } catch (error) {
      console.error('Erro ao resolver alerta:', error);
      toast.error('Erro ao resolver alerta');
    }
  };

  const getAlertsByType = (type: string) => alerts.filter(a => a.type === type);
  const getAlertsBySeverity = (severity: string) => alerts.filter(a => a.severity === severity);

  return {
    alerts,
    unresolvedCount,
    isLoading,
    resolveAlert,
    getAlertsByType,
    getAlertsBySeverity,
    refresh: fetchAlerts,
  };
}
