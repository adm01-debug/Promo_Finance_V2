import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type Empresa = Tables<'empresas'>;
export type EmpresaInsert = TablesInsert<'empresas'>;
export type EmpresaUpdate = TablesUpdate<'empresas'>;

export function useAllEmpresas() {
  return useQuery({
    queryKey: ['empresas', 'all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('empresas')
        .select('*')
        .order('razao_social');
      if (error) throw error;
      return data as Empresa[];
    },
  });
}

export function useCriarEmpresa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (empresa: EmpresaInsert) => {
      const { data, error } = await supabase
        .from('empresas')
        .insert(empresa)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['empresas'] });
      toast.success('Empresa cadastrada com sucesso!');
    },
    onError: (error: Error) => {
      logger.error('Erro ao cadastrar empresa:', error);
      toast.error('Erro ao cadastrar empresa: ' + error.message);
    },
  });
}

export function useAtualizarEmpresa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: EmpresaUpdate }) => {
      const { data: result, error } = await supabase
        .from('empresas')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['empresas'] });
      toast.success('Empresa atualizada com sucesso!');
    },
    onError: (error: Error) => {
      logger.error('Erro ao atualizar empresa:', error);
      toast.error('Erro ao atualizar empresa: ' + error.message);
    },
  });
}

export function useExcluirEmpresa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Soft delete - apenas desativa
      const { error } = await supabase
        .from('empresas')
        .update({ ativo: false })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['empresas'] });
      toast.success('Empresa desativada com sucesso!');
    },
    onError: (error: Error) => {
      logger.error('Erro ao desativar empresa:', error);
      toast.error('Erro ao desativar empresa: ' + error.message);
    },
  });
}

export function useReativarEmpresa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('empresas')
        .update({ ativo: true })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['empresas'] });
      toast.success('Empresa reativada com sucesso!');
    },
    onError: (error: Error) => {
      logger.error('Erro ao reativar empresa:', error);
      toast.error('Erro ao reativar empresa: ' + error.message);
    },
  });
}
