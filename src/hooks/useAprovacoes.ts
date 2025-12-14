import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ConfiguracaoAprovacao {
  id: string;
  valor_minimo_aprovacao: number;
  aprovadores_obrigatorios: number;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface SolicitacaoAprovacao {
  id: string;
  conta_pagar_id: string;
  solicitado_por: string;
  solicitado_em: string;
  status: 'pendente' | 'aprovado' | 'rejeitado';
  aprovado_por: string | null;
  aprovado_em: string | null;
  motivo_rejeicao: string | null;
  observacoes: string | null;
  created_at: string;
  conta_pagar?: {
    id: string;
    descricao: string;
    valor: number;
    fornecedor_nome: string;
    data_vencimento: string;
    status: string;
  };
  solicitante?: {
    full_name: string | null;
    email: string;
  };
  aprovador?: {
    full_name: string | null;
    email: string;
  };
}

export const useConfiguracaoAprovacao = () => {
  return useQuery({
    queryKey: ['configuracao-aprovacao'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('configuracoes_aprovacao')
        .select('*')
        .eq('ativo', true)
        .maybeSingle();

      if (error) throw error;
      return data as ConfiguracaoAprovacao | null;
    },
  });
};

export const useUpdateConfiguracaoAprovacao = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (config: Partial<ConfiguracaoAprovacao> & { id: string }) => {
      const { data, error } = await supabase
        .from('configuracoes_aprovacao')
        .update({
          valor_minimo_aprovacao: config.valor_minimo_aprovacao,
          aprovadores_obrigatorios: config.aprovadores_obrigatorios,
          ativo: config.ativo,
        })
        .eq('id', config.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configuracao-aprovacao'] });
      toast({
        title: 'Configuração atualizada',
        description: 'As configurações de aprovação foram salvas.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao salvar',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

export const useSolicitacoesAprovacao = () => {
  return useQuery({
    queryKey: ['solicitacoes-aprovacao'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('solicitacoes_aprovacao')
        .select(`
          *,
          conta_pagar:contas_pagar(id, descricao, valor, fornecedor_nome, data_vencimento, status)
        `)
        .order('solicitado_em', { ascending: false });

      if (error) throw error;
      return data as unknown as SolicitacaoAprovacao[];
    },
  });
};

export const useSolicitacoesPendentes = () => {
  return useQuery({
    queryKey: ['solicitacoes-pendentes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('solicitacoes_aprovacao')
        .select(`
          *,
          conta_pagar:contas_pagar(id, descricao, valor, fornecedor_nome, data_vencimento, status)
        `)
        .eq('status', 'pendente')
        .order('solicitado_em', { ascending: true });

      if (error) throw error;
      return data as unknown as SolicitacaoAprovacao[];
    },
  });
};

export const useCriarSolicitacaoAprovacao = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ contaPagarId, observacoes }: { contaPagarId: string; observacoes?: string }) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('solicitacoes_aprovacao')
        .insert({
          conta_pagar_id: contaPagarId,
          solicitado_por: userData.user.id,
          observacoes,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['solicitacoes-aprovacao'] });
      queryClient.invalidateQueries({ queryKey: ['solicitacoes-pendentes'] });
      toast({
        title: 'Solicitação enviada',
        description: 'O pagamento foi enviado para aprovação.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao solicitar aprovação',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

export const useAprovarSolicitacao = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (solicitacaoId: string) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Usuário não autenticado');

      // Update solicitacao
      const { data: solicitacao, error: solError } = await supabase
        .from('solicitacoes_aprovacao')
        .update({
          status: 'aprovado',
          aprovado_por: userData.user.id,
          aprovado_em: new Date().toISOString(),
        })
        .eq('id', solicitacaoId)
        .select('conta_pagar_id')
        .single();

      if (solError) throw solError;

      // Update conta_pagar with approval info
      const { error: cpError } = await supabase
        .from('contas_pagar')
        .update({
          aprovado_por: userData.user.id,
          aprovado_em: new Date().toISOString(),
        })
        .eq('id', solicitacao.conta_pagar_id);

      if (cpError) throw cpError;

      return solicitacao;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['solicitacoes-aprovacao'] });
      queryClient.invalidateQueries({ queryKey: ['solicitacoes-pendentes'] });
      queryClient.invalidateQueries({ queryKey: ['contas-pagar'] });
      toast({
        title: 'Pagamento aprovado',
        description: 'O pagamento foi aprovado com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao aprovar',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

export const useRejeitarSolicitacao = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ solicitacaoId, motivo }: { solicitacaoId: string; motivo: string }) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('solicitacoes_aprovacao')
        .update({
          status: 'rejeitado',
          aprovado_por: userData.user.id,
          aprovado_em: new Date().toISOString(),
          motivo_rejeicao: motivo,
        })
        .eq('id', solicitacaoId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['solicitacoes-aprovacao'] });
      queryClient.invalidateQueries({ queryKey: ['solicitacoes-pendentes'] });
      toast({
        title: 'Pagamento rejeitado',
        description: 'O pagamento foi rejeitado.',
        variant: 'destructive',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao rejeitar',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

export const useVerificarAprovacaoNecessaria = () => {
  const { data: config } = useConfiguracaoAprovacao();

  return (valor: number): boolean => {
    if (!config || !config.ativo) return false;
    return valor >= config.valor_minimo_aprovacao;
  };
};
