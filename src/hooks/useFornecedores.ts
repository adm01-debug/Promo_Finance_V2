import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fornecedoresService, FornecedorFilters, FornecedorInput } from '@/services/fornecedores.service';
import { queryKeys } from '@/lib/query-client';
import { toast } from 'sonner';

// List fornecedores
export function useFornecedores(filters?: FornecedorFilters) {
  return useQuery({
    queryKey: queryKeys.fornecedores.list(filters as Record<string, unknown>),
    queryFn: () => fornecedoresService.getAll(filters),
  });
}

// Get single fornecedor
export function useFornecedor(id: string) {
  return useQuery({
    queryKey: queryKeys.fornecedores.detail(id),
    queryFn: () => fornecedoresService.getById(id),
    enabled: !!id,
  });
}

// Get stats
export function useFornecedoresStats(fornecedorId: string) {
  return useQuery({
    queryKey: queryKeys.fornecedores.stats(),
    queryFn: () => fornecedoresService.getStats(fornecedorId),
    enabled: !!fornecedorId,
  });
}

// Search fornecedores
export function useSearchFornecedores(query: string) {
  return useQuery({
    queryKey: queryKeys.fornecedores.search(query),
    queryFn: () => fornecedoresService.search(query),
    enabled: query.length >= 2,
  });
}

// Get active fornecedores
export function useFornecedoresAtivos() {
  return useQuery({
    queryKey: queryKeys.fornecedores.list({ ativo: true }),
    queryFn: () => fornecedoresService.getAll({ ativo: true }),
  });
}

// Create mutation
export function useCreateFornecedor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (fornecedor: FornecedorInput) => fornecedoresService.create(fornecedor),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.fornecedores.all() });
      toast.success('Fornecedor criado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar fornecedor: ${error.message}`);
    },
  });
}

// Update mutation
export function useUpdateFornecedor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<FornecedorInput> }) =>
      fornecedoresService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.fornecedores.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.fornecedores.detail(variables.id) });
      toast.success('Fornecedor atualizado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar fornecedor: ${error.message}`);
    },
  });
}

// Delete mutation
export function useDeleteFornecedor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => fornecedoresService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.fornecedores.all() });
      toast.success('Fornecedor excluído com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao excluir fornecedor: ${error.message}`);
    },
  });
}

// Toggle active mutation
export function useToggleFornecedorActive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ativo }: { id: string; ativo: boolean }) =>
      ativo ? fornecedoresService.activate(id) : fornecedoresService.deactivate(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.fornecedores.all() });
      toast.success(variables.ativo ? 'Fornecedor ativado!' : 'Fornecedor desativado!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao alterar status: ${error.message}`);
    },
  });
}

// Check CNPJ exists
export function useCheckCnpjExists(cnpj: string) {
  return useQuery({
    queryKey: ['fornecedor-cnpj', cnpj],
    queryFn: () => fornecedoresService.getByCnpj(cnpj),
    enabled: cnpj.length === 14 || cnpj.length === 18,
    staleTime: 0,
  });
}
