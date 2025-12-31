import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function useContasPagarData() {
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    dateRange: { start: null, end: null },
  });
  
  const queryClient = useQueryClient();
  
  const { data: contas, isLoading, error } = useQuery({
    queryKey: ['contas-pagar', filters],
    queryFn: async () => {
      let query = supabase
        .from('contas_pagar')
        .select('*')
        .order('vencimento', { ascending: true });
      
      if (filters.search) {
        query = query.ilike('descricao', `%${filters.search}%`);
      }
      
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (novaConta: any) => {
      const { data, error } = await supabase
        .from('contas_pagar')
        .insert(novaConta)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contas-pagar'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: any) => {
      const { data, error } = await supabase
        .from('contas_pagar')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contas-pagar'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('contas_pagar')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contas-pagar'] });
    },
  });

  return {
    contas,
    isLoading,
    error,
    filters,
    setFilters,
    create: createMutation.mutate,
    update: updateMutation.mutate,
    delete: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
