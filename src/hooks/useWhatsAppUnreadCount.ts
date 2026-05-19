// @ts-nocheck
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useWhatsAppUnreadCount() {
  return useQuery({
    queryKey: ['whatsapp-unread-count'],
    queryFn: async () => {
      // Simplificação: conta mensagens 'recebidas' que não tenham sido 'lidas'
      // Note: adjust table/column names if you have a real 'lido' flag
      const { count, error } = await supabase
        .from('historico_cobranca_whatsapp')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'recebido')
        .is('lido_em', null);
      
      if (error) return 0;
      return count || 0;
    },
    refetchInterval: 30000, // a cada 30s
  });
}
