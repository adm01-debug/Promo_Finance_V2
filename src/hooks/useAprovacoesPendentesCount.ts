import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

// Singleton channel — o hook é chamado em múltiplos componentes (Sidebar,
// MobileBottomNav, Dashboard). Usar um único channel compartilhado evita
// o erro "cannot add postgres_changes callbacks after subscribe()" que
// acontecia quando cada mount registrávamos um channel com o mesmo nome.
let sharedChannel: RealtimeChannel | null = null;
let subscriberCount = 0;
const listeners = new Set<(count: number) => void>();

const ensureChannel = (queryClient: ReturnType<typeof useQueryClient>): RealtimeChannel => {
  if (sharedChannel) return sharedChannel;

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
        try {
          const { count, error } = await supabase
            .from('solicitacoes_aprovacao')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'pendente');

          if (!error) {
            listeners.forEach((cb) => cb(count || 0));
          }
        } catch (err) {
          console.error('[Realtime] Failed to refetch approval count:', err);
        }

        queryClient.invalidateQueries({ queryKey: ['aprovacoes-pendentes-count'] });
        queryClient.invalidateQueries({ queryKey: ['solicitacoes-pendentes'] });
      }
    );

  sharedChannel = channel.subscribe();
  return sharedChannel;
};

const releaseChannel = () => {
  if (sharedChannel && subscriberCount === 0) {
    supabase.removeChannel(sharedChannel);
    sharedChannel = null;
  }
};

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
    refetchInterval: 30000, // fallback
  });

  useEffect(() => {
    subscriberCount += 1;
    const listener = (count: number) => setRealtimeCount(count);
    listeners.add(listener);
    ensureChannel(queryClient);

    return () => {
      listeners.delete(listener);
      subscriberCount -= 1;
      if (subscriberCount <= 0) {
        subscriberCount = 0;
        releaseChannel();
      }
    };
  }, [queryClient]);

  return {
    count: realtimeCount ?? query.data ?? 0,
    isLoading: query.isLoading,
  };
};
