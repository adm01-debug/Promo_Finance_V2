import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfDay, endOfDay } from 'date-fns';

export type JitVia = 'oidc-jit' | 'saml-broker-jit';
export type JitRole = 'admin' | 'financeiro' | 'operacional' | 'visualizador';

export interface JitNewData {
  provider_id?: string;
  provider_nome?: string;
  provider_tipo?: 'oidc' | 'saml';
  empresa_id?: string | null;
  role?: JitRole;
  default_role?: string;
  matched_group?: string | null;
  groups_received?: string[];
  via?: JitVia;
}

export interface JitAuditEvent {
  id: string;
  created_at: string;
  user_id: string | null;
  user_email: string | null;
  ip_address: string | null;
  details: string | null;
  new_data: JitNewData | null;
}

interface Filters {
  from?: Date;
  to?: Date;
}

export function useSSOJitEvents(filters: Filters = {}) {
  return useQuery({
    queryKey: ['sso-jit-events', filters.from?.toISOString(), filters.to?.toISOString()],
    queryFn: async () => {
      let q = supabase
        .from('audit_logs')
        .select('id, created_at, user_id, user_email, ip_address, details, new_data')
        .eq('table_name', 'sso_jit_provisioning')
        .order('created_at', { ascending: false })
        .limit(1000);
      if (filters.from) q = q.gte('created_at', startOfDay(filters.from).toISOString());
      if (filters.to) q = q.lte('created_at', endOfDay(filters.to).toISOString());
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as JitAuditEvent[];
    },
  });
}
