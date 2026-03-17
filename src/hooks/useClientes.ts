import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clientesService, ClienteFilters, ClienteInput } from '@/services/clientes.service';
import { queryKeys } from '@/lib/queryClient';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

// List clientes from external DB
export function useClientes(filters?: ClienteFilters) {
  return useQuery({
    queryKey: queryKeys.clientes.list(filters as Record<string, unknown>),
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Não autenticado');

      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const url = `https://${projectId}.supabase.co/functions/v1/external-data?tabela=clientes&limit=200`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Erro ao buscar clientes externos');
      }

      const result = await response.json();
      return result.data || [];
    },
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
export function useClientesStats(clienteId: string) {
  return useQuery({
    queryKey: queryKeys.clientes.stats(),
    queryFn: () => clientesService.getStats(clienteId),
    enabled: !!clienteId,
  });
}

// Search clientes
export function useSearchClientes(query: string) {
  return useQuery({
    queryKey: queryKeys.clientes.search(query),
    queryFn: () => clientesService.search(query),
    enabled: query.length >= 2,
  });
}

// Get active clientes
export function useClientesAtivos() {
  return useQuery({
    queryKey: queryKeys.clientes.list({ ativo: true }),
    queryFn: () => clientesService.getAll({ ativo: true }),
  });
}

// Create mutation
export function useCreateCliente() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (cliente: ClienteInput) => clientesService.create(cliente),
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
    mutationFn: ({ id, data }: { id: string; data: Partial<ClienteInput> }) =>
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
      ativo ? clientesService.activate(id) : clientesService.deactivate(id),
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
    enabled: cpfCnpj.length >= 11,
    staleTime: 0,
  });
}
