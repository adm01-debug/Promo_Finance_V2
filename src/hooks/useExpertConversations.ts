import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ExpertAction } from './useExpertActions';

export interface ExpertMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  actions?: ExpertAction[];
  actions_executed: boolean;
  created_at: string;
}

export interface ExpertConversation {
  id: string;
  user_id: string;
  titulo: string;
  resumo: string | null;
  created_at: string;
  updated_at: string;
}

export function useExpertConversations() {
  return useQuery({
    queryKey: ['expert-conversations'],
    queryFn: async (): Promise<ExpertConversation[]> => {
      const { data, error } = await supabase
        .from('expert_conversations')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data || [];
    },
  });
}

export function useExpertMessages(conversationId: string | null) {
  return useQuery({
    queryKey: ['expert-messages', conversationId],
    queryFn: async (): Promise<ExpertMessage[]> => {
      if (!conversationId) return [];

      const { data, error } = await supabase
        .from('expert_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      return (data || []).map(msg => ({
        ...msg,
        role: msg.role as 'user' | 'assistant',
        actions: msg.actions as unknown as ExpertAction[] | undefined,
      }));
    },
    enabled: !!conversationId,
  });
}

export function useCreateConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (titulo?: string): Promise<ExpertConversation> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('expert_conversations')
        .insert({
          user_id: user.id,
          titulo: titulo || 'Nova Conversa',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expert-conversations'] });
    },
  });
}

export function useUpdateConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, titulo, resumo }: { id: string; titulo?: string; resumo?: string }) => {
      const { error } = await supabase
        .from('expert_conversations')
        .update({ 
          titulo: titulo,
          resumo: resumo,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expert-conversations'] });
    },
  });
}

export function useDeleteConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('expert_conversations')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expert-conversations'] });
      toast.success('Conversa excluída');
    },
    onError: () => {
      toast.error('Erro ao excluir conversa');
    },
  });
}

export function useSaveMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (message: {
      conversation_id: string;
      role: 'user' | 'assistant';
      content: string;
      actions?: ExpertAction[];
      actions_executed?: boolean;
    }) => {
      const { data, error } = await supabase
        .from('expert_messages')
        .insert({
          conversation_id: message.conversation_id,
          role: message.role,
          content: message.content,
          actions: message.actions as any,
          actions_executed: message.actions_executed || false,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['expert-messages', variables.conversation_id] });
    },
  });
}

export function useUpdateMessageActions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ messageId, conversationId }: { messageId: string; conversationId: string }) => {
      const { error } = await supabase
        .from('expert_messages')
        .update({ actions_executed: true })
        .eq('id', messageId);

      if (error) throw error;
      return conversationId;
    },
    onSuccess: (conversationId) => {
      queryClient.invalidateQueries({ queryKey: ['expert-messages', conversationId] });
    },
  });
}
