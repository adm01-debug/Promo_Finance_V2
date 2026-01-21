import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Categoria {
  id: string;
  user_id: string;
  nome: string;
  tipo: 'despesa' | 'receita';
  cor: string;
  icone?: string;
  ativo: boolean;
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
// SERVICE
// ============================================

const categoriasService = {
  async getAll(tipo?: 'despesa' | 'receita'): Promise<Categoria[]> {
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
    return data as Categoria[];
  },

  async getById(id: string): Promise<Categoria> {
    const { data, error } = await supabase
      .from('categorias')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as Categoria;
  },

  async create(categoria: CategoriaInput): Promise<Categoria> {
    const { data, error } = await supabase
      .from('categorias')
      .insert({
        ...categoria,
        cor: categoria.cor || '#6B7280',
      })
      .select()
      .single();

    if (error) throw error;
    return data as Categoria;
  },

  async update(id: string, categoria: Partial<CategoriaInput>): Promise<Categoria> {
    const { data, error } = await supabase
      .from('categorias')
      .update(categoria)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Categoria;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('categorias')
      .update({ ativo: false })
      .eq('id', id);

    if (error) throw error;
  },
};

// ============================================
// HOOKS
// ============================================

export function useCategorias(tipo?: 'despesa' | 'receita') {
  const queryClient = useQueryClient();

  const {
    data: categorias = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['categorias', tipo],
    queryFn: () => categoriasService.getAll(tipo),
  });

  const createMutation = useMutation({
    mutationFn: (data: CategoriaInput) => categoriasService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categorias'] });
      toast.success('Categoria criada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar categoria: ${error.message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CategoriaInput> }) =>
      categoriasService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categorias'] });
      toast.success('Categoria atualizada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar categoria: ${error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => categoriasService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categorias'] });
      toast.success('Categoria excluída com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao excluir categoria: ${error.message}`);
    },
  });

  // Separate by type
  const categoriasDespesa = categorias.filter((c) => c.tipo === 'despesa');
  const categoriasReceita = categorias.filter((c) => c.tipo === 'receita');

  return {
    categorias,
    categoriasDespesa,
    categoriasReceita,
    isLoading,
    error,
    refetch,
    create: createMutation.mutateAsync,
    update: updateMutation.mutateAsync,
    delete: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

export function useCategoria(id: string | undefined) {
  const { data: categoria, isLoading, error } = useQuery({
    queryKey: ['categorias', id],
    queryFn: () => categoriasService.getById(id!),
    enabled: !!id,
  });

  return {
    categoria,
    isLoading,
    error,
  };
}

// Predefined colors for categories
export const CATEGORY_COLORS = [
  '#EF4444', // Red
  '#F97316', // Orange
  '#F59E0B', // Amber
  '#EAB308', // Yellow
  '#84CC16', // Lime
  '#22C55E', // Green
  '#10B981', // Emerald
  '#14B8A6', // Teal
  '#06B6D4', // Cyan
  '#0EA5E9', // Sky
  '#3B82F6', // Blue
  '#6366F1', // Indigo
  '#8B5CF6', // Violet
  '#A855F7', // Purple
  '#D946EF', // Fuchsia
  '#EC4899', // Pink
  '#F43F5E', // Rose
  '#6B7280', // Gray
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
