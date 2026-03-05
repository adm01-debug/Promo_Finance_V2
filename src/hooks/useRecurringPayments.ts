import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { 
  recurringPaymentsService,
  RecurringPayment,
  CreateRecurringPaymentInput,
  RecurringType,
} from '@/services/recurring-payments.service';

const QUERY_KEY = 'recurring-payments';

/**
 * Hook for recurring payments management
 */
export function useRecurringPayments(tipo?: RecurringType) {
  const queryClient = useQueryClient();

  // Get all recurring payments
  const {
    data: recurringPayments = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: [QUERY_KEY, tipo],
    queryFn: () => recurringPaymentsService.getAll(),
  });

  // Get active recurring payments
  const { data: activePayments = [] } = useQuery({
    queryKey: [QUERY_KEY, 'active', tipo],
    queryFn: () => recurringPaymentsService.getActive(),
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (input: CreateRecurringPaymentInput) =>
      recurringPaymentsService.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success('Pagamento recorrente criado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao criar pagamento recorrente');
      console.error('Create error:', error);
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<CreateRecurringPaymentInput> }) =>
      recurringPaymentsService.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success('Pagamento recorrente atualizado!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar pagamento recorrente');
      console.error('Update error:', error);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => recurringPaymentsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success('Pagamento recorrente excluído!');
    },
    onError: (error) => {
      toast.error('Erro ao excluir pagamento recorrente');
      console.error('Delete error:', error);
    },
  });

  // Toggle active mutation
  const toggleActiveMutation = useMutation({
    mutationFn: (id: string) => recurringPaymentsService.toggleActive(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success(
        data.ativo
          ? 'Pagamento recorrente ativado!'
          : 'Pagamento recorrente desativado!'
      );
    },
    onError: (error) => {
      toast.error('Erro ao alterar status');
      console.error('Toggle error:', error);
    },
  });

  // Generate payments mutation
  const generatePaymentsMutation = useMutation({
    mutationFn: (id: string) => recurringPaymentsService.processAll(),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: ['contas-pagar'] });
      queryClient.invalidateQueries({ queryKey: ['contas-receber'] });
      
      if (result.generated > 0) {
        toast.success(`${result.generated} pagamento(s) gerado(s)!`);
      } else {
        toast.info('Nenhum pagamento a gerar no momento');
      }
    },
    onError: (error) => {
      toast.error('Erro ao gerar pagamentos');
      console.error('Generate error:', error);
    },
  });

  // Process all mutation
  const processAllMutation = useMutation({
    mutationFn: () => recurringPaymentsService.processAll(),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: ['contas-pagar'] });
      queryClient.invalidateQueries({ queryKey: ['contas-receber'] });
      
      toast.success(
        `Processados: ${result.processed} | Gerados: ${result.generated}`
      );
    },
    onError: (error) => {
      toast.error('Erro ao processar pagamentos recorrentes');
      console.error('Process error:', error);
    },
  });

  return {
    // Data
    recurringPayments,
    activePayments,
    isLoading,
    error,

    // Actions
    refetch,
    create: createMutation.mutate,
    update: updateMutation.mutate,
    delete: deleteMutation.mutate,
    toggleActive: toggleActiveMutation.mutate,
    generatePayments: generatePaymentsMutation.mutate,
    processAll: processAllMutation.mutate,

    // Loading states
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isToggling: toggleActiveMutation.isPending,
    isGenerating: generatePaymentsMutation.isPending,
    isProcessing: processAllMutation.isPending,

    // Helpers
    getFrequencyLabel: recurringPaymentsService.getFrequencyLabel,
  };
}

/**
 * Hook for single recurring payment
 */
export function useRecurringPayment(id: string | undefined) {
  const queryClient = useQueryClient();

  const {
    data: recurringPayment,
    isLoading,
    error,
  } = useQuery({
    queryKey: [QUERY_KEY, id],
    queryFn: () => (id ? recurringPaymentsService.getById(id) : null),
    enabled: !!id,
  });

  const updateMutation = useMutation({
    mutationFn: (input: Partial<CreateRecurringPaymentInput>) =>
      recurringPaymentsService.update(id!, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success('Pagamento recorrente atualizado!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar');
      console.error('Update error:', error);
    },
  });

  return {
    recurringPayment,
    isLoading,
    error,
    update: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
  };
}

export default useRecurringPayments;
