import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contasPagarService, ContaPagarFilters, ContaPagarInput } from '@/services/contas-pagar.service';
import { queryKeys } from '@/lib/queryClient';
import { toast } from 'sonner';

// List contas a pagar
export function useContasPagar(filters?: ContaPagarFilters) {
  return useQuery({
    queryKey: queryKeys.contasPagar.list(filters as Record<string, unknown>),
    queryFn: () => contasPagarService.getAll(filters),
  });
}

// Get single conta a pagar
export function useContaPagar(id: string) {
  return useQuery({
    queryKey: queryKeys.contasPagar.detail(id),
    queryFn: () => contasPagarService.getById(id),
    enabled: !!id,
  });
}

// Get totals
export function useContasPagarTotals() {
  return useQuery({
    queryKey: queryKeys.contasPagar.totals(),
    queryFn: () => contasPagarService.getTotalByStatus(),
  });
}

// Get overdue
export function useContasPagarOverdue() {
  return useQuery({
    queryKey: queryKeys.contasPagar.overdue(),
    queryFn: () => contasPagarService.getOverdue(),
  });
}

// Get upcoming
export function useContasPagarUpcoming(days: number = 7) {
  return useQuery({
    queryKey: queryKeys.contasPagar.upcoming(days),
    queryFn: () => contasPagarService.getDueThisWeek(),
  });
}

// Create mutation
export function useCreateContaPagar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (conta: ContaPagarInput) => contasPagarService.create(conta),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.contasPagar.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all() });
      toast.success('Conta a pagar criada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar conta: ${error.message}`);
    },
  });
}

// Update mutation
export function useUpdateContaPagar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ContaPagarInput> }) =>
      contasPagarService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.contasPagar.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.contasPagar.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all() });
      toast.success('Conta atualizada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar conta: ${error.message}`);
    },
  });
}

// Delete mutation
export function useDeleteContaPagar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => contasPagarService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.contasPagar.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all() });
      toast.success('Conta excluída com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao excluir conta: ${error.message}`);
    },
  });
}

// Mark as paid mutation
export function useMarkContaPagarAsPaid() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, dataPagamento }: { id: string; dataPagamento: string }) =>
      contasPagarService.markAsPaid(id, dataPagamento),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.contasPagar.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all() });
      toast.success('Conta marcada como paga!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao marcar como paga: ${error.message}`);
    },
  });
}

// Mark as canceled mutation
export function useMarkContaPagarAsCanceled() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => contasPagarService.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.contasPagar.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all() });
      toast.success('Conta cancelada!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao cancelar conta: ${error.message}`);
    },
  });
}
