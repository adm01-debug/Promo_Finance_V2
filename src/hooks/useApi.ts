import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import {
  contasPagarService,
  contasReceberService,
  clientesService,
  fornecedoresService,
  categoriasService,
} from '@/services/database.service';
import { showToast } from '@/lib/toast';

// Query keys factory
export const queryKeys = {
  contasPagar: {
    all: ['contas-pagar'] as const,
    lists: () => [...queryKeys.contasPagar.all, 'list'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.contasPagar.lists(), filters] as const,
    details: () => [...queryKeys.contasPagar.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.contasPagar.details(), id] as const,
  },
  contasReceber: {
    all: ['contas-receber'] as const,
    lists: () => [...queryKeys.contasReceber.all, 'list'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.contasReceber.lists(), filters] as const,
    details: () => [...queryKeys.contasReceber.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.contasReceber.details(), id] as const,
  },
  clientes: {
    all: ['clientes'] as const,
    lists: () => [...queryKeys.clientes.all, 'list'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.clientes.lists(), filters] as const,
    details: () => [...queryKeys.clientes.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.clientes.details(), id] as const,
  },
  fornecedores: {
    all: ['fornecedores'] as const,
    lists: () => [...queryKeys.fornecedores.all, 'list'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.fornecedores.lists(), filters] as const,
    details: () => [...queryKeys.fornecedores.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.fornecedores.details(), id] as const,
  },
  categorias: {
    all: ['categorias'] as const,
    lists: () => [...queryKeys.categorias.all, 'list'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.categorias.lists(), filters] as const,
    details: () => [...queryKeys.categorias.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.categorias.details(), id] as const,
  },
};

// ============================================
// CONTAS A PAGAR HOOKS
// ============================================

export function useContasPagar(filters: Record<string, any> = {}) {
  return useQuery({
    queryKey: queryKeys.contasPagar.list(filters),
    queryFn: () => contasPagarService.getAll({ filter: filters }),
  });
}

export function useContaPagar(id: string) {
  return useQuery({
    queryKey: queryKeys.contasPagar.detail(id),
    queryFn: () => contasPagarService.getById(id),
    enabled: !!id,
  });
}

export function useContasPagarPaginated(page: number, pageSize: number, filters: Record<string, any> = {}) {
  return useQuery({
    queryKey: [...queryKeys.contasPagar.list(filters), page, pageSize],
    queryFn: () => contasPagarService.getPaginated(page, pageSize, { filter: filters }),
  });
}

export function useCreateContaPagar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => contasPagarService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.contasPagar.all });
      showToast.success('Conta a pagar criada com sucesso!');
    },
    onError: (error: Error) => {
      showToast.error(`Erro ao criar conta: ${error.message}`);
    },
  });
}

export function useUpdateContaPagar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => contasPagarService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.contasPagar.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.contasPagar.detail(variables.id) });
      showToast.success('Conta a pagar atualizada com sucesso!');
    },
    onError: (error: Error) => {
      showToast.error(`Erro ao atualizar conta: ${error.message}`);
    },
  });
}

export function useDeleteContaPagar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => contasPagarService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.contasPagar.all });
      showToast.success('Conta a pagar excluída com sucesso!');
    },
    onError: (error: Error) => {
      showToast.error(`Erro ao excluir conta: ${error.message}`);
    },
  });
}

// ============================================
// CONTAS A RECEBER HOOKS
// ============================================

export function useContasReceber(filters: Record<string, any> = {}) {
  return useQuery({
    queryKey: queryKeys.contasReceber.list(filters),
    queryFn: () => contasReceberService.getAll({ filter: filters }),
  });
}

export function useContaReceber(id: string) {
  return useQuery({
    queryKey: queryKeys.contasReceber.detail(id),
    queryFn: () => contasReceberService.getById(id),
    enabled: !!id,
  });
}

export function useContasReceberPaginated(page: number, pageSize: number, filters: Record<string, any> = {}) {
  return useQuery({
    queryKey: [...queryKeys.contasReceber.list(filters), page, pageSize],
    queryFn: () => contasReceberService.getPaginated(page, pageSize, { filter: filters }),
  });
}

export function useCreateContaReceber() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => contasReceberService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.contasReceber.all });
      showToast.success('Conta a receber criada com sucesso!');
    },
    onError: (error: Error) => {
      showToast.error(`Erro ao criar conta: ${error.message}`);
    },
  });
}

export function useUpdateContaReceber() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => contasReceberService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.contasReceber.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.contasReceber.detail(variables.id) });
      showToast.success('Conta a receber atualizada com sucesso!');
    },
    onError: (error: Error) => {
      showToast.error(`Erro ao atualizar conta: ${error.message}`);
    },
  });
}

export function useDeleteContaReceber() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => contasReceberService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.contasReceber.all });
      showToast.success('Conta a receber excluída com sucesso!');
    },
    onError: (error: Error) => {
      showToast.error(`Erro ao excluir conta: ${error.message}`);
    },
  });
}

// ============================================
// CLIENTES HOOKS
// ============================================

export function useClientes(filters: Record<string, any> = {}) {
  return useQuery({
    queryKey: queryKeys.clientes.list(filters),
    queryFn: () => clientesService.getAll({ filter: filters }),
  });
}

export function useCliente(id: string) {
  return useQuery({
    queryKey: queryKeys.clientes.detail(id),
    queryFn: () => clientesService.getById(id),
    enabled: !!id,
  });
}

export function useClientesPaginated(page: number, pageSize: number, filters: Record<string, any> = {}) {
  return useQuery({
    queryKey: [...queryKeys.clientes.list(filters), page, pageSize],
    queryFn: () => clientesService.getPaginated(page, pageSize, { filter: filters }),
  });
}

export function useCreateCliente() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => clientesService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clientes.all });
      showToast.success('Cliente criado com sucesso!');
    },
    onError: (error: Error) => {
      showToast.error(`Erro ao criar cliente: ${error.message}`);
    },
  });
}

export function useUpdateCliente() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => clientesService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clientes.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.clientes.detail(variables.id) });
      showToast.success('Cliente atualizado com sucesso!');
    },
    onError: (error: Error) => {
      showToast.error(`Erro ao atualizar cliente: ${error.message}`);
    },
  });
}

export function useDeleteCliente() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => clientesService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clientes.all });
      showToast.success('Cliente excluído com sucesso!');
    },
    onError: (error: Error) => {
      showToast.error(`Erro ao excluir cliente: ${error.message}`);
    },
  });
}

// ============================================
// FORNECEDORES HOOKS
// ============================================

export function useFornecedores(filters: Record<string, any> = {}) {
  return useQuery({
    queryKey: queryKeys.fornecedores.list(filters),
    queryFn: () => fornecedoresService.getAll({ filter: filters }),
  });
}

export function useFornecedor(id: string) {
  return useQuery({
    queryKey: queryKeys.fornecedores.detail(id),
    queryFn: () => fornecedoresService.getById(id),
    enabled: !!id,
  });
}

export function useFornecedoresPaginated(page: number, pageSize: number, filters: Record<string, any> = {}) {
  return useQuery({
    queryKey: [...queryKeys.fornecedores.list(filters), page, pageSize],
    queryFn: () => fornecedoresService.getPaginated(page, pageSize, { filter: filters }),
  });
}

export function useCreateFornecedor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => fornecedoresService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.fornecedores.all });
      showToast.success('Fornecedor criado com sucesso!');
    },
    onError: (error: Error) => {
      showToast.error(`Erro ao criar fornecedor: ${error.message}`);
    },
  });
}

export function useUpdateFornecedor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => fornecedoresService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.fornecedores.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.fornecedores.detail(variables.id) });
      showToast.success('Fornecedor atualizado com sucesso!');
    },
    onError: (error: Error) => {
      showToast.error(`Erro ao atualizar fornecedor: ${error.message}`);
    },
  });
}

export function useDeleteFornecedor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => fornecedoresService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.fornecedores.all });
      showToast.success('Fornecedor excluído com sucesso!');
    },
    onError: (error: Error) => {
      showToast.error(`Erro ao excluir fornecedor: ${error.message}`);
    },
  });
}

// ============================================
// CATEGORIAS HOOKS
// ============================================

export function useCategorias(filters: Record<string, any> = {}) {
  return useQuery({
    queryKey: queryKeys.categorias.list(filters),
    queryFn: () => categoriasService.getAll({ filter: filters }),
  });
}

export function useCategoria(id: string) {
  return useQuery({
    queryKey: queryKeys.categorias.detail(id),
    queryFn: () => categoriasService.getById(id),
    enabled: !!id,
  });
}

export function useCreateCategoria() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => categoriasService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categorias.all });
      showToast.success('Categoria criada com sucesso!');
    },
    onError: (error: Error) => {
      showToast.error(`Erro ao criar categoria: ${error.message}`);
    },
  });
}

export function useUpdateCategoria() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => categoriasService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categorias.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.categorias.detail(variables.id) });
      showToast.success('Categoria atualizada com sucesso!');
    },
    onError: (error: Error) => {
      showToast.error(`Erro ao atualizar categoria: ${error.message}`);
    },
  });
}

export function useDeleteCategoria() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => categoriasService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categorias.all });
      showToast.success('Categoria excluída com sucesso!');
    },
    onError: (error: Error) => {
      showToast.error(`Erro ao excluir categoria: ${error.message}`);
    },
  });
}
