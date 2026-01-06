// ============================================
// HOOK: GESTÃO DE INCENTIVOS FISCAIS
// Interface para cadastrar/gerenciar incentivos
// ============================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface IncentivoFiscal {
  id: string;
  empresa_id: string;
  nome: string;
  tipo_incentivo: string;
  ano_inicio: number;
  ano_fim: number;
  limite_percentual: number;
  limite_valor: number;
  valor_utilizado_ano: number;
  numero_processo?: string;
  ato_concessorio?: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateIncentivoInput {
  empresa_id: string;
  nome: string;
  tipo_incentivo: string;
  ano_inicio: number;
  ano_fim: number;
  limite_percentual: number;
  limite_valor: number;
  numero_processo?: string;
  ato_concessorio?: string;
}

export function useIncentivosFiscais(empresaId?: string) {
  const queryClient = useQueryClient();

  // Buscar incentivos
  const { data: incentivos, isLoading, error } = useQuery({
    queryKey: ['incentivos-fiscais', empresaId],
    queryFn: async () => {
      let query = supabase
        .from('incentivos_fiscais')
        .select('*')
        .order('created_at', { ascending: false });

      if (empresaId && empresaId !== 'todas') {
        query = query.eq('empresa_id', empresaId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as IncentivoFiscal[];
    }
  });

  // Criar incentivo
  const criarIncentivo = useMutation({
    mutationFn: async (input: CreateIncentivoInput) => {
      const { data, error } = await supabase
        .from('incentivos_fiscais')
        .insert({
          ...input,
          ativo: true,
          valor_utilizado_ano: 0,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incentivos-fiscais'] });
      toast.success('Incentivo fiscal cadastrado com sucesso');
    },
    onError: (error: Error) => {
      toast.error('Erro ao cadastrar incentivo: ' + error.message);
    }
  });

  // Atualizar incentivo
  const atualizarIncentivo = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<IncentivoFiscal> & { id: string }) => {
      const { data, error } = await supabase
        .from('incentivos_fiscais')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incentivos-fiscais'] });
      toast.success('Incentivo atualizado');
    },
    onError: (error: Error) => {
      toast.error('Erro ao atualizar: ' + error.message);
    }
  });

  // Suspender incentivo
  const suspenderIncentivo = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('incentivos_fiscais')
        .update({ ativo: false, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incentivos-fiscais'] });
      toast.success('Incentivo suspenso');
    }
  });

  // Reativar incentivo
  const reativarIncentivo = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('incentivos_fiscais')
        .update({ ativo: true, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incentivos-fiscais'] });
      toast.success('Incentivo reativado');
    }
  });

  // Excluir incentivo
  const excluirIncentivo = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('incentivos_fiscais')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incentivos-fiscais'] });
      toast.success('Incentivo excluído');
    }
  });

  // Calcular economia com incentivos
  const calcularEconomia = (baseCalculo: number) => {
    if (!incentivos) return 0;

    const incentivosAtivos = incentivos.filter(i => i.ativo);
    let economiaTotal = 0;

    incentivosAtivos.forEach(incentivo => {
      let economia = baseCalculo * (incentivo.limite_percentual / 100);
      if (incentivo.limite_valor && economia > incentivo.limite_valor) {
        economia = incentivo.limite_valor;
      }
      economiaTotal += economia;
    });

    return economiaTotal;
  };

  // Resumo dos incentivos
  const resumo = {
    totalAtivos: incentivos?.filter(i => i.ativo).length || 0,
    totalInativos: incentivos?.filter(i => !i.ativo).length || 0,
    valorLimiteTotal: incentivos?.filter(i => i.ativo).reduce((acc, i) => acc + (i.limite_valor || 0), 0) || 0,
    valorUtilizado: incentivos?.filter(i => i.ativo).reduce((acc, i) => acc + (i.valor_utilizado_ano || 0), 0) || 0,
  };

  return {
    incentivos,
    isLoading,
    error,
    resumo,
    criarIncentivo,
    atualizarIncentivo,
    suspenderIncentivo,
    reativarIncentivo,
    excluirIncentivo,
    calcularEconomia,
  };
}

export default useIncentivosFiscais;
