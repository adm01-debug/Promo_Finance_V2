import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type CentroCusto = Tables<'centros_custo'>;
export type CentroCustoInsert = TablesInsert<'centros_custo'>;
export type CentroCustoUpdate = TablesUpdate<'centros_custo'>;

export function useAllCentrosCusto() {
  return useQuery({
    queryKey: ['centros_custo', 'all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('centros_custo')
        .select('*')
        .order('codigo');
      if (error) throw error;
      return data as CentroCusto[];
    },
  });
}

export function useCriarCentroCusto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (centro: CentroCustoInsert) => {
      const { data, error } = await supabase
        .from('centros_custo')
        .insert(centro)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['centros_custo'] });
      toast.success('Centro de custo cadastrado com sucesso!');
    },
    onError: (error: Error) => {
      logger.error('Erro ao cadastrar centro de custo:', error);
      toast.error('Erro ao cadastrar centro de custo: ' + error.message);
    },
  });
}

export function useAtualizarCentroCusto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: CentroCustoUpdate }) => {
      const { data: result, error } = await supabase
        .from('centros_custo')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['centros_custo'] });
      toast.success('Centro de custo atualizado com sucesso!');
    },
    onError: (error: Error) => {
      logger.error('Erro ao atualizar centro de custo:', error);
      toast.error('Erro ao atualizar centro de custo: ' + error.message);
    },
  });
}

export function useExcluirCentroCusto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Soft delete - apenas desativa
      const { error } = await supabase
        .from('centros_custo')
        .update({ ativo: false })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['centros_custo'] });
      toast.success('Centro de custo desativado com sucesso!');
    },
    onError: (error: Error) => {
      logger.error('Erro ao desativar centro de custo:', error);
      toast.error('Erro ao desativar centro de custo: ' + error.message);
    },
  });
}

export function useReativarCentroCusto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('centros_custo')
        .update({ ativo: true })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['centros_custo'] });
      toast.success('Centro de custo reativado com sucesso!');
    },
    onError: (error: Error) => {
      logger.error('Erro ao reativar centro de custo:', error);
      toast.error('Erro ao reativar centro de custo: ' + error.message);
    },
  });
}
