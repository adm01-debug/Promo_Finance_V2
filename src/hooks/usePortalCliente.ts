import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// ============================================
// PORTAL CLIENTE TOKENS
// ============================================

export function usePortalClienteTokens(clienteId?: string) {
  return useQuery({
    queryKey: ['portal-cliente-tokens', clienteId],
    queryFn: async () => {
      let query = supabase
        .from('portal_cliente_tokens')
        .select('*')
        .order('created_at', { ascending: false });

      if (clienteId) query = query.eq('cliente_id', clienteId);

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });
}

export function useCreatePortalToken() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { cliente_id: string; email_cliente: string }) => {
      const token = crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      const { data, error } = await supabase
        .from('portal_cliente_tokens')
        .insert({
          cliente_id: input.cliente_id,
          email_cliente: input.email_cliente,
          token,
          expires_at: expiresAt.toISOString(),
          ativo: true,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['portal-cliente-tokens'] });
      toast.success('Token do portal gerado!');
    },
    onError: (e: Error) => toast.error(`Erro: ${e.message}`),
  });
}

export function useRevokePortalToken() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (tokenId: string) => {
      const { error } = await supabase
        .from('portal_cliente_tokens')
        .update({ ativo: false })
        .eq('id', tokenId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['portal-cliente-tokens'] });
      toast.success('Token revogado!');
    },
    onError: (e: Error) => toast.error(`Erro: ${e.message}`),
  });
}

// ============================================
// PORTAL CLIENTE ACESSOS (logs)
// ============================================

export function usePortalClienteAcessos(clienteId?: string) {
  return useQuery({
    queryKey: ['portal-cliente-acessos', clienteId],
    queryFn: async () => {
      let query = supabase
        .from('portal_cliente_acessos')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (clienteId) query = query.eq('cliente_id', clienteId);

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });
}
