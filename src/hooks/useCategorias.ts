import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface Categoria {
  id: string;
  nome: string;
  tipo: string;
  cor: string | null;
  icone: string | null;
  ativo: boolean;
  plano_conta_id: string | null;
  empresa_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CategoriaInput {
  nome: string;
  tipo: 'despesa' | 'receita';
  cor?: string;
  icone?: string;
  empresa_id?: string;
}

// HOOKS

export function useCategorias(tipo?: 'despesa' | 'receita') {
  const { currentEmpresaId } = useAuth();
  const {
    data: categorias = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['categorias', tipo, currentEmpresaId],
    queryFn: async () => {
      if (!currentEmpresaId) return [];

      let query = supabase
        .from('categorias')
        .select('*')
        .eq('ativo', true)
        .eq('empresa_id', currentEmpresaId)
        .order('nome');

      if (tipo) {
        query = query.eq('tipo', tipo);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as Categoria[];
    },
    enabled: Boolean(currentEmpresaId),
  });

  const categoriasDespesa = categorias.filter((c) => c.tipo === 'despesa');
  const categoriasReceita = categorias.filter((c) => c.tipo === 'receita');

  return {
    categorias,
    categoriasDespesa,
    categoriasReceita,
    isLoading,
    error,
    refetch,
  };
}

export function useCategoria(id: string | undefined) {
  const { currentEmpresaId } = useAuth();
  return useQuery({
    queryKey: ['categorias', 'detail', id, currentEmpresaId],
    queryFn: async () => {
      if (!id || !currentEmpresaId) return null;
      const { data, error } = await supabase
        .from('categorias')
        .select('*')
        .eq('id', id)
        .eq('empresa_id', currentEmpresaId)
        .maybeSingle();
      if (error) throw error;
      return data as Categoria | null;
    },
    enabled: Boolean(id && currentEmpresaId),
  });
}

export function useCreateCategoria() {
  const queryClient = useQueryClient();
  const { currentEmpresaId } = useAuth();

  return useMutation({
    mutationFn: async (input: CategoriaInput) => {
      if (!currentEmpresaId) throw new Error('Empresa não selecionada');
      const { empresa_id: _empresaIdIgnorada, ...dados } = input;
      const { data, error } = await supabase
        .from('categorias')
        .insert({ ...dados, ativo: true, empresa_id: currentEmpresaId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categorias'] });
      toast.success('Categoria criada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar categoria: ${error.message}`);
    },
  });
}

export function useUpdateCategoria() {
  const queryClient = useQueryClient();
  const { currentEmpresaId } = useAuth();

  return useMutation({
    mutationFn: async ({ id, data: input }: { id: string; data: Partial<CategoriaInput> }) => {
      if (!currentEmpresaId) throw new Error('Empresa não selecionada');
      const { empresa_id: _empresaIdIgnorada, ...dados } = input;
      const { data, error } = await supabase
        .from('categorias')
        .update(dados)
        .eq('id', id)
        .eq('empresa_id', currentEmpresaId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categorias'] });
      toast.success('Categoria atualizada!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar categoria: ${error.message}`);
    },
  });
}

export function useDeleteCategoria() {
  const queryClient = useQueryClient();
  const { currentEmpresaId } = useAuth();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!currentEmpresaId) throw new Error('Empresa não selecionada');
      const { error } = await supabase
        .from('categorias')
        .update({ ativo: false })
        .eq('id', id)
        .eq('empresa_id', currentEmpresaId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categorias'] });
      toast.success('Categoria desativada!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao desativar categoria: ${error.message}`);
    },
  });
}

// Predefined colors for categories
export const CATEGORY_COLORS = [
  '#EF4444',
  '#F97316',
  '#F59E0B',
  '#EAB308',
  '#84CC16',
  '#22C55E',
  '#10B981',
  '#14B8A6',
  '#06B6D4',
  '#0EA5E9',
  '#3B82F6',
  '#6366F1',
  '#8B5CF6',
  '#A855F7',
  '#D946EF',
  '#EC4899',
  '#F43F5E',
  '#6B7280',
];

// Predefined icons for categories
export const CATEGORY_ICONS = [
  'home',
  'droplet',
  'zap',
  'wifi',
  'phone',
  'users',
  'truck',
  'package',
  'megaphone',
  'file-text',
  'wrench',
  'car',
  'utensils',
  'monitor',
  'shopping-cart',
  'briefcase',
  'credit-card',
  'dollar-sign',
  'percent',
  'gift',
  'heart',
  'star',
  'tag',
  'folder',
];

export default useCategorias;
