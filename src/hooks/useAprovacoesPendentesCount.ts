import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useAprovacoesPendentesCount = () => {
  const queryClient = useQueryClient();
  const [realtimeCount, setRealtimeCount] = useState<number | null>(null);

  const query = useQuery({
    queryKey: ['aprovacoes-pendentes-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('solicitacoes_aprovacao')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pendente');

      if (error) throw error;
      return count || 0;
    },
    refetchInterval: 30000, // Refetch every 30 seconds as fallback
  });

  useEffect(() => {
    // Subscribe to real-time changes on solicitacoes_aprovacao
    const channel = supabase
      .channel('aprovacoes-pendentes-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'solicitacoes_aprovacao',
        },
        async () => {
          // Refetch the count when any change happens
          const { count } = await supabase
            .from('solicitacoes_aprovacao')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'pendente');
          
          setRealtimeCount(count || 0);
          queryClient.invalidateQueries({ queryKey: ['aprovacoes-pendentes-count'] });
          queryClient.invalidateQueries({ queryKey: ['solicitacoes-pendentes'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return {
    count: realtimeCount ?? query.data ?? 0,
    isLoading: query.isLoading,
  };
};
