/**
 * Hook para Sistema de Notificações
 * 
 * @module hooks/useNotifications
 * @description Sistema simplificado de notificações usando alertas existentes
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// ============================================
// TIPOS
// ============================================

export interface Notification {
  id: string;
  titulo: string;
  mensagem: string;
  tipo: string;
  prioridade: string;
  lido: boolean;
  created_at: string;
  acao_url?: string;
}

// ============================================
// HOOK
// ============================================

export function useNotifications() {
  const queryClient = useQueryClient();

  // Buscar notificações (usando tabela alertas)
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('alertas')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return (data || []).map(a => ({
        id: a.id,
        titulo: a.titulo,
        mensagem: a.mensagem,
        tipo: a.tipo,
        prioridade: a.prioridade,
        lido: a.lido,
        created_at: a.created_at,
        acao_url: a.acao_url,
      })) as Notification[];
    },
  });

  // Contagem de não lidas
  const unreadCount = notifications.filter(n => !n.lido).length;

  // Marcar como lida
  const markAsRead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('alertas')
        .update({ lido: true })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Marcar todas como lidas
  const markAllAsRead = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('alertas')
        .update({ lido: true })
        .eq('user_id', user.id)
        .eq('lido', false);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Todas notificações marcadas como lidas');
    },
  });

  // Deletar notificação
  const deleteNotification = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('alertas')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead: markAsRead.mutate,
    markAllAsRead: markAllAsRead.mutate,
    deleteNotification: deleteNotification.mutate,
  };
}

export default useNotifications;
