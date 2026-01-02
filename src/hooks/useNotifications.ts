/**
 * Hook Completo para Sistema de Notificações
 * 
 * @module hooks/useNotifications
 * @description Sistema unificado de notificações com suporte a:
 * - In-app notifications (realtime)
 * - Push notifications
 * - Email
 * - SMS
 * - WhatsApp
 * 
 * Features:
 * - Realtime updates via Supabase
 * - Agrupamento de notificações
 * - Preferências por usuário
 * - Do Not Disturb
 * - Digest diário
 * 
 * @example
 * ```tsx
 * const {
 *   notifications,
 *   unreadCount,
 *   markAsRead,
 *   markAllAsRead,
 *   deleteNotification
 * } = useNotifications();
 * ```
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';

// ============================================
// TIPOS
// ============================================

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'urgent';
  category: 'approval' | 'alert' | 'reminder' | 'system' | 'social';
  source_system: string;
  source_entity_type?: string;
  source_entity_id?: string;
  channels: string[];
  is_read: boolean;
  read_at: string | null;
  group_key: string | null;
  is_grouped: boolean;
  group_count: number;
  action_url: string | null;
  action_label: string | null;
  action_data: any;
  priority: number;
  scheduled_for: string | null;
  expires_at: string | null;
  delivered_at: string | null;
  delivery_status: Record<string, string>;
  created_at: string;
  updated_at: string;
}

export interface NotificationPreferences {
  id: string;
  user_id: string;
  email_enabled: boolean;
  push_enabled: boolean;
  sms_enabled: boolean;
  whatsapp_enabled: boolean;
  preferences: Record<string, any>;
  dnd_enabled: boolean;
  dnd_start_time: string | null;
  dnd_end_time: string | null;
  dnd_days: number[] | null;
  digest_enabled: boolean;
  digest_frequency: 'daily' | 'weekly';
  digest_time: string;
  digest_days: number[] | null;
  grouping_enabled: boolean;
  grouping_window_minutes: number;
  phone_number: string | null;
  whatsapp_number: string | null;
  created_at: string;
  updated_at: string;
}

interface UseNotificationsOptions {
  /** Número máximo de notificações para buscar */
  limit?: number;
  /** Filtrar apenas não lidas */
  unreadOnly?: boolean;
  /** Auto-atualizar a cada X ms */
  refreshInterval?: number;
  /** Ativar som de notificação */
  enableSound?: boolean;
}

interface UseNotificationsReturn {
  /** Lista de notificações */
  notifications: Notification[];
  /** Contador de não lidas */
  unreadCount: number;
  /** Estado de carregamento */
  isLoading: boolean;
  /** Erro se houver */
  error: Error | null;
  /** Marcar notificação como lida */
  markAsRead: (id: string) => void;
  /** Marcar todas como lidas */
  markAllAsRead: () => void;
  /** Deletar notificação */
  deleteNotification: (id: string) => void;
  /** Notificações não lidas */
  unreadNotifications: Notification[];
  /** Notificações por categoria */
  notificationsByCategory: Record<string, Notification[]>;
  /** Última notificação */
  latestNotification: Notification | null;
}

// ============================================
// HOOK PRINCIPAL
// ============================================

export function useNotifications(
  options: UseNotificationsOptions = {}
): UseNotificationsReturn {
  const {
    limit = 50,
    unreadOnly = false,
    refreshInterval,
    enableSound = true
  } = options;

  const queryClient = useQueryClient();

  // ============================================
  // QUERY - NOTIFICAÇÕES
  // ============================================

  const {
    data: notifications,
    isLoading,
    error
  } = useQuery({
    queryKey: ['notifications', { limit, unreadOnly }],
    queryFn: async () => {
      let query = supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (unreadOnly) {
        query = query.eq('is_read', false);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as Notification[];
    },
    refetchInterval: refreshInterval,
    staleTime: 30000,
  });

  // ============================================
  // QUERY - CONTADOR NÃO LIDAS
  // ============================================

  const { data: unreadCount } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('is_read', false);

      if (error) throw error;
      return count || 0;
    },
    refetchInterval: refreshInterval,
    staleTime: 10000,
  });

  // ============================================
  // MUTATIONS
  // ============================================

  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc('mark_notification_read', {
        p_notification_id: id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (error) => {
      console.error('Erro ao marcar como lida:', error);
      toast.error('Erro ao marcar notificação como lida');
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc('mark_all_notifications_read');
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Todas as notificações marcadas como lidas');
    },
    onError: (error) => {
      console.error('Erro ao marcar todas:', error);
      toast.error('Erro ao marcar todas como lidas');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Notificação removida');
    },
    onError: (error) => {
      console.error('Erro ao deletar:', error);
      toast.error('Erro ao remover notificação');
    },
  });

  // ============================================
  // REALTIME SUBSCRIPTION
  // ============================================

  useEffect(() => {
    const setupRealtime = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const channel = supabase
        .channel('notifications-realtime')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });

            const notif = payload.new as Notification;

            // Toast para notificações importantes
            if (notif.priority >= 2) {
              toast.info(notif.title, {
                description: notif.message,
                duration: notif.priority === 3 ? 10000 : 5000,
                action: notif.action_url ? {
                  label: notif.action_label || 'Ver',
                  onClick: () => {
                    if (notif.action_url) {
                      window.location.href = notif.action_url;
                    }
                  },
                } : undefined,
              });

              // Som de notificação
              if (enableSound) {
                playNotificationSound(notif.priority);
              }
            }

            // Notificação do navegador (se permitido)
            if (notif.priority >= 2 && 'Notification' in window) {
              if (Notification.permission === 'granted') {
                new Notification(notif.title, {
                  body: notif.message,
                  icon: '/icon-192x192.png',
                  badge: '/icon-192x192.png',
                  tag: notif.id,
                });
              }
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    setupRealtime();
  }, [queryClient, enableSound]);

  // ============================================
  // COMPUTED VALUES
  // ============================================

  const unreadNotifications = useMemo(() => {
    return (notifications || []).filter(n => !n.is_read);
  }, [notifications]);

  const notificationsByCategory = useMemo(() => {
    const grouped: Record<string, Notification[]> = {};
    (notifications || []).forEach(notif => {
      const cat = notif.category || 'other';
      if (!grouped[cat]) {
        grouped[cat] = [];
      }
      grouped[cat].push(notif);
    });
    return grouped;
  }, [notifications]);

  const latestNotification = useMemo(() => {
    if (!notifications || notifications.length === 0) return null;
    return notifications[0];
  }, [notifications]);

  // ============================================
  // CALLBACKS
  // ============================================

  const markAsRead = useCallback((id: string) => {
    markAsReadMutation.mutate(id);
  }, [markAsReadMutation]);

  const markAllAsRead = useCallback(() => {
    markAllAsReadMutation.mutate();
  }, [markAllAsReadMutation]);

  const deleteNotification = useCallback((id: string) => {
    deleteMutation.mutate(id);
  }, [deleteMutation]);

  // ============================================
  // RETURN
  // ============================================

  return {
    notifications: notifications || [],
    unreadCount: unreadCount || 0,
    isLoading,
    error: error as Error | null,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    unreadNotifications,
    notificationsByCategory,
    latestNotification,
  };
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function playNotificationSound(priority: number) {
  try {
    const soundFile = priority === 3 
      ? '/sounds/urgent.mp3' 
      : '/sounds/notification.mp3';
    
    const audio = new Audio(soundFile);
    audio.volume = priority === 3 ? 0.5 : 0.3;
    audio.play().catch(() => {
      // Ignorar se autoplay bloqueado
    });
  } catch (error) {
    console.error('Erro ao tocar som:', error);
  }
}

// ============================================
// HOOKS AUXILIARES
// ============================================

/**
 * Hook para preferências de notificação
 */
export function useNotificationPreferences() {
  const queryClient = useQueryClient();

  const { data: preferences, isLoading } = useQuery({
    queryKey: ['notification-preferences'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');

      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data as NotificationPreferences | null;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<NotificationPreferences>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');

      const { error } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: user.id,
          ...updates,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-preferences'] });
      toast.success('Preferências atualizadas!');
    },
    onError: (error) => {
      console.error('Erro ao atualizar preferências:', error);
      toast.error('Erro ao salvar preferências');
    },
  });

  return {
    preferences,
    isLoading,
    updatePreferences: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
  };
}

/**
 * Hook simplificado para contador de não lidas
 */
export function useUnreadCount() {
  const { data: count } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('is_read', false);

      if (error) throw error;
      return count || 0;
    },
    refetchInterval: 30000,
    staleTime: 10000,
  });

  return count || 0;
}
