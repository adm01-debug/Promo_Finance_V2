import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Categoria {
  id: string;
  nome: string;
  tipo: string;
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
// SERVICE (inline, no separate table needed - uses contas_pagar/contas_receber categorias)
// ============================================

// Since there's no 'categorias' table in the DB, we derive categories from existing data
const categoriasService = {
  async getAll(tipo?: 'despesa' | 'receita'): Promise<Categoria[]> {
    // Get unique categories from contas_pagar and contas_receber
    const categories: Categoria[] = [];
    
    if (!tipo || tipo === 'despesa') {
      const { data: pagar } = await supabase
        .from('contas_pagar')
        .select('tipo_cobranca')
        .not('tipo_cobranca', 'is', null);
      
      const uniquePagar = [...new Set((pagar || []).map(p => p.tipo_cobranca))];
      uniquePagar.forEach((cat, i) => {
        categories.push({
          id: `despesa-${i}`,
          nome: cat,
          tipo: 'despesa',
          cor: '#EF4444',
          ativo: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      });
    }

    if (!tipo || tipo === 'receita') {
      const { data: receber } = await supabase
        .from('contas_receber')
        .select('tipo_cobranca')
        .not('tipo_cobranca', 'is', null);
      
      const uniqueReceber = [...new Set((receber || []).map(r => r.tipo_cobranca))];
      uniqueReceber.forEach((cat, i) => {
        categories.push({
          id: `receita-${i}`,
          nome: cat,
          tipo: 'receita',
          cor: '#22C55E',
          ativo: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      });
    }

    return categories;
  },
};

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
    queryFn: () => categoriasService.getAll(tipo),
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
  const { categorias } = useCategorias();
  const categoria = categorias.find(c => c.id === id);

  return {
    categoria,
    isLoading: false,
    error: null,
  };
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
