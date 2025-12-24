import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

export type FrequenciaPagamento = 'semanal' | 'quinzenal' | 'mensal' | 'bimestral' | 'trimestral' | 'semestral' | 'anual';
type TipoCobranca = Database['public']['Enums']['tipo_cobranca'];

export interface PagamentoRecorrente {
  id: string;
  descricao: string;
  fornecedor_id: string | null;
  fornecedor_nome: string;
  valor: number;
  dia_vencimento: number;
  frequencia: FrequenciaPagamento;
  data_inicio: string;
  data_fim: string | null;
  empresa_id: string;
  centro_custo_id: string | null;
  conta_bancaria_id: string | null;
  tipo_cobranca: TipoCobranca;
  observacoes: string | null;
  ativo: boolean;
  ultima_geracao: string | null;
  proxima_geracao: string | null;
  total_gerado: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CreatePagamentoRecorrenteData {
  descricao: string;
  fornecedor_id?: string | null;
  fornecedor_nome: string;
  valor: number;
  dia_vencimento: number;
  frequencia: FrequenciaPagamento;
  data_inicio: string;
  data_fim?: string | null;
  empresa_id: string;
  centro_custo_id?: string | null;
  conta_bancaria_id?: string | null;
  tipo_cobranca?: TipoCobranca;
  observacoes?: string | null;
}

export function usePagamentosRecorrentes() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: pagamentosRecorrentes = [], isLoading, error } = useQuery({
    queryKey: ['pagamentos-recorrentes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pagamentos_recorrentes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as PagamentoRecorrente[];
    },
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: async (data: CreatePagamentoRecorrenteData) => {
      if (!user) throw new Error('Usuário não autenticado');

      // Calcular próxima geração
      const proximaGeracao = data.data_inicio;

      const insertData = {
        descricao: data.descricao,
        fornecedor_id: data.fornecedor_id || null,
        fornecedor_nome: data.fornecedor_nome,
        valor: data.valor,
        dia_vencimento: data.dia_vencimento,
        frequencia: data.frequencia,
        data_inicio: data.data_inicio,
        data_fim: data.data_fim || null,
        empresa_id: data.empresa_id,
        centro_custo_id: data.centro_custo_id || null,
        conta_bancaria_id: data.conta_bancaria_id || null,
        tipo_cobranca: data.tipo_cobranca || 'transferencia' as TipoCobranca,
        observacoes: data.observacoes || null,
        proxima_geracao: proximaGeracao,
        created_by: user.id,
      };

      const { data: result, error } = await supabase
        .from('pagamentos_recorrentes')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pagamentos-recorrentes'] });
      toast.success('Pagamento recorrente criado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao criar pagamento recorrente:', error);
      toast.error('Erro ao criar pagamento recorrente');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Partial<Omit<PagamentoRecorrente, 'id' | 'created_at' | 'updated_at' | 'created_by'>>) => {
      const { data: result, error } = await supabase
        .from('pagamentos_recorrentes')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pagamentos-recorrentes'] });
      toast.success('Pagamento recorrente atualizado!');
    },
    onError: (error) => {
      console.error('Erro ao atualizar pagamento recorrente:', error);
      toast.error('Erro ao atualizar pagamento recorrente');
    },
  });

  const toggleAtivoMutation = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const { error } = await supabase
        .from('pagamentos_recorrentes')
        .update({ ativo })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['pagamentos-recorrentes'] });
      toast.success(variables.ativo ? 'Pagamento ativado!' : 'Pagamento pausado!');
    },
    onError: (error) => {
      console.error('Erro ao alterar status:', error);
      toast.error('Erro ao alterar status do pagamento');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('pagamentos_recorrentes')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pagamentos-recorrentes'] });
      toast.success('Pagamento recorrente excluído!');
    },
    onError: (error) => {
      console.error('Erro ao excluir pagamento recorrente:', error);
      toast.error('Erro ao excluir pagamento recorrente');
    },
  });

  const gerarContasMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('gerar_contas_recorrentes');
      if (error) throw error;
      return data as number;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['pagamentos-recorrentes'] });
      queryClient.invalidateQueries({ queryKey: ['contas-pagar'] });
      if (count > 0) {
        toast.success(`${count} conta(s) gerada(s) com sucesso!`);
      } else {
        toast.info('Nenhuma conta pendente para gerar');
      }
    },
    onError: (error) => {
      console.error('Erro ao gerar contas:', error);
      toast.error('Erro ao gerar contas recorrentes');
    },
  });

  // Estatísticas
  const stats = {
    total: pagamentosRecorrentes.length,
    ativos: pagamentosRecorrentes.filter(p => p.ativo).length,
    pausados: pagamentosRecorrentes.filter(p => !p.ativo).length,
    valorMensal: pagamentosRecorrentes
      .filter(p => p.ativo)
      .reduce((acc, p) => {
        const multiplicador = {
          semanal: 4,
          quinzenal: 2,
          mensal: 1,
          bimestral: 0.5,
          trimestral: 0.33,
          semestral: 0.17,
          anual: 0.08,
        };
        return acc + (p.valor * (multiplicador[p.frequencia] || 1));
      }, 0),
    proximosVencimentos: pagamentosRecorrentes
      .filter(p => p.ativo && p.proxima_geracao)
      .sort((a, b) => new Date(a.proxima_geracao!).getTime() - new Date(b.proxima_geracao!).getTime())
      .slice(0, 5),
  };

  return {
    pagamentosRecorrentes,
    isLoading,
    error,
    stats,
    createPagamentoRecorrente: createMutation.mutate,
    updatePagamentoRecorrente: updateMutation.mutate,
    toggleAtivo: toggleAtivoMutation.mutate,
    deletePagamentoRecorrente: deleteMutation.mutate,
    gerarContas: gerarContasMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isGenerating: gerarContasMutation.isPending,
  };
}
