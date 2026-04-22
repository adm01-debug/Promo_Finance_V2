import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfDay, endOfDay } from 'date-fns';
import type { SandboxOutcome, SandboxResult } from '@/components/admin/sso/sandbox/outcome';

export interface SandboxRun {
  id: string;
  created_at: string;
  created_by: string | null;
  created_by_email: string | null;
  provider_id: string | null;
  provider_nome: string | null;
  use_provider_config: boolean;
  input: Record<string, unknown>;
  result: SandboxResult;
  outcome: SandboxOutcome;
  email_masked: string | null;
  resolved_role: string | null;
  matched_group: string | null;
  has_errors: boolean;
  batch_id?: string | null;
}

export interface SandboxRunsFilters {
  providerId?: string;
  outcome?: SandboxOutcome | 'all';
  email?: string;
  from?: Date;
  to?: Date;
  limit?: number;
  batchId?: string;
}

export function useSSOSandboxRuns(filters: SandboxRunsFilters = {}) {
  return useQuery({
    queryKey: [
      'sso-sandbox-runs',
      filters.providerId ?? null,
      filters.outcome ?? null,
      filters.email ?? null,
      filters.from?.toISOString() ?? null,
      filters.to?.toISOString() ?? null,
      filters.limit ?? 50,
      filters.batchId ?? null,
    ],
    queryFn: async () => {
      let q = (supabase as any)
        .from('sso_sandbox_runs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(filters.limit ?? 50);
      if (filters.providerId) q = q.eq('provider_id', filters.providerId);
      if (filters.outcome && filters.outcome !== 'all') q = q.eq('outcome', filters.outcome);
      if (filters.email) q = q.ilike('email_masked', `%${filters.email}%`);
      if (filters.from) q = q.gte('created_at', startOfDay(filters.from).toISOString());
      if (filters.to) q = q.lte('created_at', endOfDay(filters.to).toISOString());
      if (filters.batchId) q = q.eq('batch_id', filters.batchId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as SandboxRun[];
    },
  });
}

interface SaveRunInput {
  providerId: string | null;
  providerNome: string | null;
  useProviderConfig: boolean;
  input: Record<string, unknown>;
  result: SandboxResult;
  outcome: SandboxOutcome;
  batchId?: string | null;
}

export function useSaveSSOSandboxRun() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: SaveRunInput) => {
      const { data: userRes } = await supabase.auth.getUser();
      const user = userRes.user;
      if (!user) throw new Error('Não autenticado');
      const row = {
        created_by: user.id,
        created_by_email: user.email ?? null,
        provider_id: payload.providerId,
        provider_nome: payload.providerNome,
        use_provider_config: payload.useProviderConfig,
        input: payload.input,
        result: payload.result,
        outcome: payload.outcome,
        email_masked: payload.result.preview.email,
        resolved_role: payload.result.preview.resolved_role ?? null,
        matched_group: payload.result.preview.matched_group ?? null,
        has_errors: (payload.result.errors?.length ?? 0) > 0,
      };
      const { error } = await (supabase as any).from('sso_sandbox_runs').insert(row);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sso-sandbox-runs'] }),
  });
}

export function useDeleteSSOSandboxRun() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from('sso_sandbox_runs').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sso-sandbox-runs'] }),
  });
}
