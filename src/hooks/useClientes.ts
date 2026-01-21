import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clientesService, ClienteFilters, ClienteInsert, ClienteUpdate } from '@/services/clientes.service';
import { queryKeys } from '@/lib/query-client';
import { toast } from 'sonner';

// List clientes
export function useClientes(filters?: ClienteFilters) {
  return useQuery({
    queryKey: queryKeys.clientes.list(filters),
    queryFn: () => clientesService.list(filters),
  });
}

// Get single cliente
export function useCliente(id: string) {
  return useQuery({
    queryKey: queryKeys.clientes.detail(id),
    queryFn: () => clientesService.getById(id),
    enabled: !!id,
  });
}

// Get stats
export function useClientesStats() {
  return useQuery({
    queryKey: queryKeys.clientes.stats(),
    queryFn: () => clientesService.getStats(),
  });
}

// Search clientes
export function useSearchClientes(query: string) {
  return useQuery({
    queryKey: queryKeys.clientes.search(query),
    queryFn: () => clientesService.searchByName(query),
    enabled: query.length >= 2,
  });
}

// Get active clientes
export function useClientesAtivos() {
  return useQuery({
    queryKey: queryKeys.clientes.list({ ativo: true }),
    queryFn: () => clientesService.getActive(),
  });
}

// Create mutation
export function useCreateCliente() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (cliente: ClienteInsert) => clientesService.create(cliente),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clientes.all() });
      toast.success('Cliente criado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar cliente: ${error.message}`);
    },
  });
}

// Update mutation
export function useUpdateCliente() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ClienteUpdate }) =>
      clientesService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clientes.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.clientes.detail(variables.id) });
      toast.success('Cliente atualizado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar cliente: ${error.message}`);
    },
  });
}

// Delete mutation
export function useDeleteCliente() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => clientesService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clientes.all() });
      toast.success('Cliente excluído com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao excluir cliente: ${error.message}`);
    },
  });
}

// Toggle active mutation
export function useToggleClienteActive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ativo }: { id: string; ativo: boolean }) =>
      clientesService.toggleActive(id, ativo),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clientes.all() });
      toast.success(variables.ativo ? 'Cliente ativado!' : 'Cliente desativado!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao alterar status: ${error.message}`);
    },
  });
}

// Check CPF/CNPJ exists
export function useCheckCpfCnpjExists(cpfCnpj: string) {
  return useQuery({
    queryKey: ['cliente-cpf-cnpj', cpfCnpj],
    queryFn: () => clientesService.getByCpfCnpj(cpfCnpj),
    enabled: cpfCnpj.length >= 11, // CPF ou CNPJ
    staleTime: 0,
  });
}
