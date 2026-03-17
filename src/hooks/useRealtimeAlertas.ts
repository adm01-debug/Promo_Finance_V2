import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Subscribes to realtime INSERT events on the alertas table.
 * When a new alert arrives, it invalidates relevant queries and shows a toast.
 */
export function useRealtimeAlertas() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('alertas-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'alertas' },
        (payload) => {
          // Invalidate queries so badge counts update
          queryClient.invalidateQueries({ queryKey: ['alertas'] });
          queryClient.invalidateQueries({ queryKey: ['alertas-nao-lidos-count'] });

          const alerta = payload.new as {
            titulo?: string;
            prioridade?: string;
            acao_url?: string;
          };

          // Show toast notification for new alerts
          if (alerta.titulo) {
            const isCritico = alerta.prioridade === 'critica' || alerta.prioridade === 'alta';
            toast[isCritico ? 'error' : 'info'](alerta.titulo, {
              action: alerta.acao_url
                ? { label: 'Ver', onClick: () => window.location.assign(alerta.acao_url!) }
                : undefined,
              duration: isCritico ? 8000 : 5000,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}
