import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface PortalClienteToken {
  id: string;
  cliente_id: string;
  token: string;
  email_cliente: string;
  ativo: boolean;
  ultimo_acesso: string | null;
  created_at: string;
  expires_at: string;
}

export function usePortalCliente() {
  const [isGenerating, setIsGenerating] = useState(false);

  // Gerar token único
  const generateToken = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    for (let i = 0; i < 32; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
  };

  // Criar token de acesso para cliente
  const criarTokenAcesso = async (clienteId: string, emailCliente: string): Promise<string | null> => {
    setIsGenerating(true);
    try {
      const token = generateToken();
      
      const { error } = await supabase
        .from('portal_cliente_tokens')
        .insert({
          cliente_id: clienteId,
          email_cliente: emailCliente,
          token,
        });

      if (error) throw error;

      toast.success('Link de acesso gerado com sucesso!');
      return token;
    } catch (error) {
      console.error('Erro ao gerar token:', error);
      toast.error('Erro ao gerar link de acesso');
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  // Buscar tokens de um cliente
  const useTokensCliente = (clienteId: string) => {
    return useQuery({
      queryKey: ['portal-tokens', clienteId],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('portal_cliente_tokens')
          .select('*')
          .eq('cliente_id', clienteId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        return data as PortalClienteToken[];
      },
      enabled: !!clienteId,
    });
  };

  // Revogar token
  const revogarToken = async (tokenId: string) => {
    const { error } = await supabase
      .from('portal_cliente_tokens')
      .update({ ativo: false })
      .eq('id', tokenId);

    if (error) {
      toast.error('Erro ao revogar acesso');
      throw error;
    }
    toast.success('Acesso revogado');
  };

  // Validar token e retornar dados do cliente
  const validarToken = async (token: string) => {
    const { data, error } = await supabase
      .from('portal_cliente_tokens')
      .select(`
        *,
        clientes:cliente_id (
          id, razao_social, nome_fantasia, email, telefone
        )
      `)
      .eq('token', token)
      .eq('ativo', true)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error || !data) return null;

    // Atualizar último acesso
    await supabase
      .from('portal_cliente_tokens')
      .update({ ultimo_acesso: new Date().toISOString() })
      .eq('id', data.id);

    return data;
  };

  // Buscar faturas do cliente
  const useFaturasCliente = (clienteId: string | undefined) => {
    return useQuery({
      queryKey: ['portal-faturas', clienteId],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('contas_receber')
          .select('id, descricao, valor, valor_recebido, data_vencimento, status, chave_pix, link_boleto')
          .eq('cliente_id', clienteId)
          .in('status', ['pendente', 'vencido', 'parcial'])
          .order('data_vencimento', { ascending: true });

        if (error) throw error;
        return data;
      },
      enabled: !!clienteId,
    });
  };

  // Gerar URL do portal
  const getPortalUrl = (token: string) => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/portal/${token}`;
  };

  return {
    isGenerating,
    criarTokenAcesso,
    useTokensCliente,
    revogarToken,
    validarToken,
    useFaturasCliente,
    getPortalUrl,
  };
}
