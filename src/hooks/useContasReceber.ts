import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contasReceberService, ContaReceberFilters, ContaReceberInput } from '@/services/contas-receber.service';
import { queryKeys } from '@/lib/query-client';
import { toast } from 'sonner';

// List contas a receber
export function useContasReceber(filters?: ContaReceberFilters) {
  return useQuery({
    queryKey: queryKeys.contasReceber.list(filters as Record<string, unknown>),
    queryFn: () => contasReceberService.getAll(filters),
  });
}

// Get single conta a receber
export function useContaReceber(id: string) {
  return useQuery({
    queryKey: queryKeys.contasReceber.detail(id),
    queryFn: () => contasReceberService.getById(id),
    enabled: !!id,
  });
}

// Get totals
export function useContasReceberTotals() {
  return useQuery({
    queryKey: queryKeys.contasReceber.totals(),
    queryFn: () => contasReceberService.getTotalByStatus(),
  });
}

// Get overdue
export function useContasReceberOverdue() {
  return useQuery({
    queryKey: queryKeys.contasReceber.overdue(),
    queryFn: () => contasReceberService.getOverdue(),
  });
}

// Get upcoming
export function useContasReceberUpcoming(days: number = 7) {
  return useQuery({
    queryKey: queryKeys.contasReceber.upcoming(days),
    queryFn: () => contasReceberService.getDueThisWeek(),
  });
}

// Create mutation
export function useCreateContaReceber() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (conta: ContaReceberInput) => contasReceberService.create(conta),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.contasReceber.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all() });
      toast.success('Conta a receber criada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar conta: ${error.message}`);
    },
  });
}

// Update mutation
export function useUpdateContaReceber() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ContaReceberInput> }) =>
      contasReceberService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.contasReceber.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.contasReceber.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all() });
      toast.success('Conta atualizada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar conta: ${error.message}`);
    },
  });
}

// Delete mutation
export function useDeleteContaReceber() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => contasReceberService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.contasReceber.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all() });
      toast.success('Conta excluída com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao excluir conta: ${error.message}`);
    },
  });
}

// Mark as received mutation
export function useMarkContaReceberAsReceived() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, dataRecebimento }: { id: string; dataRecebimento: string }) =>
      contasReceberService.markAsReceived(id, dataRecebimento),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.contasReceber.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all() });
      toast.success('Conta marcada como recebida!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao marcar como recebida: ${error.message}`);
    },
  });
}

// Mark as canceled mutation
export function useMarkContaReceberAsCanceled() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => contasReceberService.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.contasReceber.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all() });
      toast.success('Conta cancelada!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao cancelar conta: ${error.message}`);
    },
  });
}
