import { useQuery } from '@tanstack/react-query';
import { supabaseDyn } from '@/lib/supabase-dynamic';

export function useBlingSyncLogs() {
  return useQuery({
    queryKey: ['bling-sync-logs'],
    queryFn: async () => {
      const { data, error } = await supabaseDyn
        .from('bling_sync_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
  });
}

export function useBlingWebhookEvents() {
  return useQuery({
    queryKey: ['bling-webhook-events'],
    queryFn: async () => {
      const { data, error } = await supabaseDyn
        .from('bling_webhook_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data || [];
    },
  });
}
