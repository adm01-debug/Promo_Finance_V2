import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Categoria {
  id: string;
  nome: string;
  tipo: string;
  cor: string | null;
  icone: string | null;
  ativo: boolean;
  plano_conta_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CategoriaInput {
  nome: string;
  tipo: 'despesa' | 'receita';
  cor?: string;
  icone?: string;
}

// ============================================
// HOOKS
// ============================================

export function useCategorias(tipo?: 'despesa' | 'receita') {
  const {
    data: categorias = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['categorias', tipo],
    queryFn: async () => {
      let query = supabase
        .from('categorias')
        .select('*')
        .eq('ativo', true)
        .order('nome');

      if (tipo) {
        query = query.eq('tipo', tipo);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as Categoria[];
    },
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
  return useQuery({
    queryKey: ['categorias', 'detail', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('categorias')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return data as Categoria | null;
    },
    enabled: !!id,
  });
}

export function useCreateCategoria() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CategoriaInput) => {
      const { data, error } = await supabase
        .from('categorias')
        .insert({ ...input, ativo: true })
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

  return useMutation({
    mutationFn: async ({ id, data: input }: { id: string; data: Partial<CategoriaInput> }) => {
      const { data, error } = await supabase
        .from('categorias')
        .update(input)
        .eq('id', id)
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

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('categorias')
        .update({ ativo: false })
        .eq('id', id);
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
  '#EF4444', '#F97316', '#F59E0B', '#EAB308', '#84CC16',
  '#22C55E', '#10B981', '#14B8A6', '#06B6D4', '#0EA5E9',
  '#3B82F6', '#6366F1', '#8B5CF6', '#A855F7', '#D946EF',
  '#EC4899', '#F43F5E', '#6B7280',
];

// Predefined icons for categories
export const CATEGORY_ICONS = [
  'home', 'droplet', 'zap', 'wifi', 'phone', 'users',
  'truck', 'package', 'megaphone', 'file-text', 'wrench',
  'car', 'utensils', 'monitor', 'shopping-cart', 'briefcase',
  'credit-card', 'dollar-sign', 'percent', 'gift', 'heart',
  'star', 'tag', 'folder',
];

export default useCategorias;
