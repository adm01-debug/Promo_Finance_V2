import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type ScimDefaultRole = 'admin' | 'financeiro' | 'operacional' | 'visualizador';

export interface ScimToken {
  id: string;
  provider_id: string | null;
  empresa_id: string;
  token_prefix: string;
  nome: string;
  expires_at: string | null;
  last_used_at: string | null;
  ativo: boolean;
  default_role: ScimDefaultRole | null;
  created_at: string;
}

async function sha256Hex(s: string) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}

function generateToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return 'scim_' + btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function useScimTokens(empresaId?: string) {
  return useQuery({
    queryKey: ['scim-tokens', empresaId],
    queryFn: async () => {
      if (!empresaId) return [];
      const { data, error } = await (supabase as any)
        .from('scim_tokens').select('*').eq('empresa_id', empresaId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as ScimToken[];
    },
    enabled: !!empresaId,
  });
}

export function useCreateScimToken() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { empresa_id: string; nome: string; provider_id?: string; expires_at?: string; default_role?: ScimDefaultRole | null }) => {
      const token = generateToken();
      const token_hash = await sha256Hex(token);
      const token_prefix = token.slice(0, 12);
      const { data, error } = await (supabase as any).from('scim_tokens').insert({
        empresa_id: input.empresa_id,
        nome: input.nome,
        provider_id: input.provider_id ?? null,
        expires_at: input.expires_at ?? null,
        default_role: input.default_role ?? null,
        token_hash, token_prefix,
      }).select().single();
      if (error) throw error;
      return { ...(data as ScimToken), token }; // token só retornado uma vez
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['scim-tokens', vars.empresa_id] });
      toast.success('Token SCIM criado — copie agora, não será exibido novamente');
    },
    onError: (e: Error) => toast.error('Erro ao criar token', { description: e.message }),
  });
}

export function useRevokeScimToken() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from('scim_tokens').update({ ativo: false }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['scim-tokens'] });
      toast.success('Token revogado');
    },
  });
}
