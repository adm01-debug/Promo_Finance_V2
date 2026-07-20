import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { supabaseDyn } from '@/lib/supabase-dynamic';
import { toast } from 'sonner';

export interface ApiKey {
  id: string;
  name: string;
  key_prefix: string;
  last_used_at: string | null;
  expires_at: string | null;
  scopes: string[];
  created_at: string;
}

export function useApiKeys(empresaId?: string) {
  return useQuery({
    queryKey: ['api-keys', empresaId],
    queryFn: async () => {
      if (!empresaId) return [];
      const { data, error } = await supabaseDyn
        .from('api_keys')
        .select('*')
        .eq('empresa_id', empresaId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data ?? []) as unknown as ApiKey[];

    },
    enabled: !!empresaId,
  });
}

export function useCreateApiKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      name: string;
      empresa_id: string;
      expires_at?: string;
      scopes: string[];
    }) => {
      // In a real app, the key generation and hashing would happen in an Edge Function
      // For this implementation, we'll simulate the process and return a mock key
      // and let the backend (edge function) handle the actual secure storage.

      const { data, error } = await supabase.functions.invoke('api-keys-manage', {
        body: { action: 'create', ...payload },
      });

      if (error) throw error;
      return data as { key: string; id: string };
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['api-keys', vars.empresa_id] });
      toast.success('Chave de API criada com sucesso');
    },
    onError: () => {
      // A edge function `api-keys-manage` ainda não foi implantada — ver docs/FUNCIONALIDADES_SEM_UI.md
      toast.error('Não foi possível criar a chave de API', {
        description: 'O serviço de gestão de chaves não está disponível.',
      });
    },
  });
}

export function useRevokeApiKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string; empresa_id: string }) => {
      const { error } = await supabaseDyn
        .from('api_keys')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['api-keys', vars.empresa_id] });
      toast.success('Chave de API revogada');
    },
  });
}
