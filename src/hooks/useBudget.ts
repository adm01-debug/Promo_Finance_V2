import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Budget {
  id: string;
  company_id: string | null;
  user_id: string | null;
  category: string;
  budgeted_amount: number;
  spent_amount: number;
  period: string;
  created_at: string;
  updated_at: string;
}

export interface BudgetInput {
  category: string;
  budgeted_amount: number;
  period: string;
  company_id?: string;
}

export function useBudgets(period?: string) {
  return useQuery({
    queryKey: ['budgets', period],
    queryFn: async () => {
      let query = supabase.from('budgets').select('*');
      if (period) {
        query = query.eq('period', period);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data as Budget[];
    },
  });
}

export function useBudgetsWithSpent(period: string) {
  return useQuery({
    queryKey: ['budgets-with-spent', period],
    queryFn: async () => {
      // 1. Fetch budgets for the period
      const { data: budgets, error: budgetError } = await supabase
        .from('budgets')
        .select('*')
        .eq('period', period);
      
      if (budgetError) throw budgetError;

      // 2. Fetch actual spent from contas_pagar for this period
      // Note: This is a simplified calculation. In a real app, you'd filter by category and date.
      const { data: spentData, error: spentError } = await supabase
        .from('contas_pagar')
        .select('valor_pago, categoria:categorias(nome)')
        .eq('status', 'pago')
        // Simplified period filtering (assuming period is YYYY-MM)
        .gte('data_pagamento', `${period}-01`)
        .lt('data_pagamento', period === '2026-12' ? '2027-01-01' : `${period.split('-')[0]}-${String(Number(period.split('-')[1]) + 1).padStart(2, '0')}-01`);

      if (spentError) throw spentError;

      // Group spent data by category
      const spentByCategory: Record<string, number> = {};
      spentData?.forEach((item: any) => {
        const catName = item.categoria?.nome || 'Sem Categoria';
        spentByCategory[catName] = (spentByCategory[catName] || 0) + Number(item.valor_pago);
      });

      // Merge data
      return budgets.map(budget => ({
        ...budget,
        actual_spent: spentByCategory[budget.category] || 0,
        remaining: budget.budgeted_amount - (spentByCategory[budget.category] || 0),
        percent_used: (spentByCategory[budget.category] || 0) / budget.budgeted_amount * 100
      }));
    }
  });
}

export function useCreateBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: BudgetInput) => {
      const { data, error } = await supabase
        .from('budgets')
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['budgets-with-spent'] });
      toast.success('Orçamento criado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar orçamento: ${error.message}`);
    }
  });
}

export function useUpdateBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<BudgetInput> }) => {
      const { data: updated, error } = await supabase
        .from('budgets')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['budgets-with-spent'] });
      toast.success('Orçamento atualizado!');
    }
  });
}

export function useDeleteBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('budgets').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['budgets-with-spent'] });
      toast.success('Orçamento excluído!');
    }
  });
}
