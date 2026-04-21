import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type SSOTipo = 'oidc' | 'saml';
export type AppRole = 'admin' | 'financeiro' | 'operacional' | 'visualizador';

export interface SSOProvider {
  id: string;
  nome: string;
  tipo: SSOTipo;
  ativo: boolean;
  ordem: number;
  preset: string | null;
  client_id: string | null;
  client_secret_ref: string | null;
  discovery_url: string | null;
  authorization_endpoint: string | null;
  token_endpoint: string | null;
  userinfo_endpoint: string | null;
  jwks_uri: string | null;
  scopes: string[] | null;
  entity_id_idp: string | null;
  sso_url: string | null;
  slo_url: string | null;
  x509_cert: string | null;
  metadata_xml: string | null;
  name_id_format: string | null;
  signature_algorithm: string | null;
  allowed_domains: string[];
  claim_mapping: Record<string, string>;
  default_role: AppRole;
  auto_provision_users: boolean;
  force_sso_for_domains: boolean;
  ultimo_teste_em: string | null;
  ultimo_teste_sucesso: boolean | null;
  ultimo_teste_mensagem: string | null;
  created_at: string;
  updated_at: string;
}

export interface SSORoleMapping {
  id: string;
  provider_id: string;
  idp_group: string;
  app_role: AppRole;
  ordem: number;
}

export interface SSOLoginAttempt {
  id: string;
  provider_id: string | null;
  email: string | null;
  success: boolean;
  error_code: string | null;
  error_message: string | null;
  ip_address: string | null;
  user_agent: string | null;
  duration_ms: number | null;
  created_at: string;
  context?: Record<string, unknown> | null;
}

export function useSSOProviders() {
  return useQuery({
    queryKey: ['sso-providers'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('sso_providers')
        .select('*')
        .order('ordem', { ascending: true });
      if (error) throw error;
      return (data ?? []) as SSOProvider[];
    },
  });
}

export function useSSOLoginAttempts(limit = 50) {
  return useQuery({
    queryKey: ['sso-login-attempts', limit],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('sso_login_attempts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []) as SSOLoginAttempt[];
    },
  });
}

export function useSSORoleMappings(providerId?: string) {
  return useQuery({
    queryKey: ['sso-role-mappings', providerId],
    queryFn: async () => {
      if (!providerId) return [];
      const { data, error } = await (supabase as any)
        .from('sso_role_mappings')
        .select('*')
        .eq('provider_id', providerId)
        .order('ordem');
      if (error) throw error;
      return (data ?? []) as SSORoleMapping[];
    },
    enabled: !!providerId,
  });
}

export function useSaveSSOProvider() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (provider: Partial<SSOProvider> & { nome: string; tipo: SSOTipo }) => {
      const { id, ...rest } = provider;
      if (id) {
        const { data, error } = await (supabase as any).from('sso_providers').update(rest).eq('id', id).select().maybeSingle();
        if (error) throw error;
        return data;
      }
      const { data, error } = await (supabase as any).from('sso_providers').insert(rest).select().maybeSingle();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sso-providers'] });
      toast.success('Provedor SSO salvo');
    },
    onError: (e: Error) => toast.error('Erro ao salvar', { description: e.message }),
  });
}

export function useDeleteSSOProvider() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from('sso_providers').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sso-providers'] });
      toast.success('Provedor removido');
    },
    onError: (e: Error) => toast.error('Erro ao remover', { description: e.message }),
  });
}

export function useToggleSSOProvider() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const { error } = await (supabase as any).from('sso_providers').update({ ativo }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sso-providers'] }),
    onError: (e: Error) => toast.error('Erro', { description: e.message }),
  });
}

export function useTestSSOConfig() {
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const { data, error } = await supabase.functions.invoke('sso-validate-config', { body: payload });
      if (error) throw error;
      return data as { valid: boolean; message: string; discovered?: Record<string, unknown> };
    },
  });
}

export function useGenerateSSOMetadata() {
  return useMutation({
    mutationFn: async (payload: { tipo: SSOTipo; nome?: string }) => {
      const { data, error } = await supabase.functions.invoke('sso-generate-metadata', { body: payload });
      if (error) throw error;
      return data;
    },
  });
}

export function useTestSSOLogin() {
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const { data, error } = await supabase.functions.invoke('sso-test-login', { body: payload });
      if (error) throw error;
      return data as { success: boolean; preview: Record<string, unknown>; errors: string[] };
    },
  });
}

export function useSaveSSORoleMappings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ providerId, mappings }: { providerId: string; mappings: Array<{ idp_group: string; app_role: AppRole }> }) => {
      await (supabase as any).from('sso_role_mappings').delete().eq('provider_id', providerId);
      if (mappings.length) {
        const { error } = await (supabase as any).from('sso_role_mappings').insert(
          mappings.map((m, i) => ({ ...m, provider_id: providerId, ordem: i }))
        );
        if (error) throw error;
      }
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['sso-role-mappings', vars.providerId] });
      toast.success('Mapeamentos salvos');
    },
  });
}
