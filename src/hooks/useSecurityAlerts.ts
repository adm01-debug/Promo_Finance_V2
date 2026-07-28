import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';
import { logger } from '@/lib/logger';

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

// Function to send push notification for security alerts
async function sendSecurityPushAlert(alert: SecurityAlert) {
  try {
    const prioridade = alert.severity === 'critical' ? 'critica' : 
                       alert.severity === 'high' ? 'alta' : 
                       alert.severity === 'medium' ? 'media' : 'baixa';

    await supabase.functions.invoke('send-push-notification', {
      body: {
        userId: alert.user_id,
        title: `🔒 ${alert.title}`,
        body: alert.description || 'Novo alerta de segurança detectado',
        tag: `security-${alert.type}`,
        prioridade,
        data: { 
          url: '/seguranca',
          alertId: alert.id,
          type: alert.type
        }
      }
    });
    
    logger.debug('[useSecurityAlerts] Push notification sent for alert:', alert.id);
  } catch (error: unknown) {
    logger.error('[useSecurityAlerts] Error sending push notification:', error);
  }
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
        logger.error('Erro ao buscar alertas:', error);
        return;
      }

      setAlerts(data || []);
      setUnresolvedCount(data?.filter(a => !a.resolved).length || 0);
    } catch (error: unknown) {
      logger.error('Erro ao buscar alertas:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, isAdmin]);

  useEffect(() => {
    fetchAlerts();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('security-alerts-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'security_alerts',
        },
        async (payload) => {
          const newAlert = payload.new as SecurityAlert;
          setAlerts(prev => [newAlert, ...prev]);
          setUnresolvedCount(prev => prev + 1);
          
          // Show toast notification for new alerts
          const toastType = newAlert.severity === 'critical' || newAlert.severity === 'high' 
            ? toast.error 
            : toast.warning;
          
          toastType(`🔒 Alerta de Segurança: ${newAlert.title}`, {
            description: newAlert.description || undefined,
            duration: 15000,
            action: {
              label: 'Ver detalhes',
              onClick: () => window.location.href = '/seguranca'
            }
          });

          // Send push notification
          await sendSecurityPushAlert(newAlert);
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
    } catch (error: unknown) {
      logger.error('Erro ao resolver alerta:', error);
      toast.error('Erro ao resolver alerta');
    }
  };

  // Function to create a security alert manually (useful for testing)
  const createAlert = async (
    type: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    title: string,
    description?: string,
    metadata?: Record<string, unknown>
  ) => {
    try {
      const { data, error } = await supabase
        .from('security_alerts')
        .insert({
          type,
          severity,
          title,
          description,
          user_id: user?.id,
          user_email: user?.email,
          metadata: metadata as Json
        })
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error: unknown) {
      logger.error('Erro ao criar alerta:', error);
      throw error;
    }
  };

  const getAlertsByType = (type: string) => alerts.filter(a => a.type === type);
  const getAlertsBySeverity = (severity: string) => alerts.filter(a => a.severity === severity);

  return {
    alerts,
    unresolvedCount,
    isLoading,
    resolveAlert,
    createAlert,
    getAlertsByType,
    getAlertsBySeverity,
    refresh: fetchAlerts,
  };
}
