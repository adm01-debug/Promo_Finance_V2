import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { blingAction } from './client';

export function useBlingFinanceiro(tipo: 'receber' | 'pagar', filtros?: Record<string, any>) {
  const action = tipo === 'receber' ? 'listar_contas_receber' : 'listar_contas_pagar';
  return useQuery({
    queryKey: ['bling-financeiro', tipo, filtros],
    queryFn: () => blingAction(action, { filtros: { limite: 100, ...filtros } }),
    enabled: false,
  });
}

export function useBlingFinanceiroMutations() {
  const queryClient = useQueryClient();

  const criarContaReceber = useMutation({
    mutationFn: (data: Record<string, unknown>) => blingAction('criar_conta_receber', { data }),
    onSuccess: () => { toast.success('Conta a receber criada no Bling'); queryClient.invalidateQueries({ queryKey: ['bling-financeiro'] }); },
    onError: (err: Error) => toast.error(`Erro: ${err.message}`),
  });

  const criarContaPagar = useMutation({
    mutationFn: (data: Record<string, unknown>) => blingAction('criar_conta_pagar', { data }),
    onSuccess: () => { toast.success('Conta a pagar criada no Bling'); queryClient.invalidateQueries({ queryKey: ['bling-financeiro'] }); },
    onError: (err: Error) => toast.error(`Erro: ${err.message}`),
  });

  const darBaixaReceber = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => blingAction('baixa_conta_receber', { id, data }),
    onSuccess: () => { toast.success('Baixa registrada no Bling'); queryClient.invalidateQueries({ queryKey: ['bling-financeiro'] }); },
    onError: (err: Error) => toast.error(`Erro: ${err.message}`),
  });

  const darBaixaPagar = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => blingAction('baixa_conta_pagar', { id, data }),
    onSuccess: () => { toast.success('Baixa registrada no Bling'); queryClient.invalidateQueries({ queryKey: ['bling-financeiro'] }); },
    onError: (err: Error) => toast.error(`Erro: ${err.message}`),
  });

  const estornarBaixaReceber = useMutation({
    mutationFn: ({ id, baixaId }: { id: string; baixaId: string }) => blingAction('estornar_baixa_receber', { id, baixaId }),
    onSuccess: () => { toast.success('Baixa estornada'); queryClient.invalidateQueries({ queryKey: ['bling-financeiro'] }); },
    onError: (err: Error) => toast.error(`Erro: ${err.message}`),
  });

  const estornarBaixaPagar = useMutation({
    mutationFn: ({ id, baixaId }: { id: string; baixaId: string }) => blingAction('estornar_baixa_pagar', { id, baixaId }),
    onSuccess: () => { toast.success('Baixa estornada'); queryClient.invalidateQueries({ queryKey: ['bling-financeiro'] }); },
    onError: (err: Error) => toast.error(`Erro: ${err.message}`),
  });

  const excluirContaReceber = useMutation({
    mutationFn: (id: string) => blingAction('excluir_conta_receber', { id }),
    onSuccess: () => { toast.success('Conta excluída'); queryClient.invalidateQueries({ queryKey: ['bling-financeiro'] }); },
    onError: (err: Error) => toast.error(`Erro: ${err.message}`),
  });

  const excluirContaPagar = useMutation({
    mutationFn: (id: string) => blingAction('excluir_conta_pagar', { id }),
    onSuccess: () => { toast.success('Conta excluída'); queryClient.invalidateQueries({ queryKey: ['bling-financeiro'] }); },
    onError: (err: Error) => toast.error(`Erro: ${err.message}`),
  });

  return { criarContaReceber, criarContaPagar, darBaixaReceber, darBaixaPagar, estornarBaixaReceber, estornarBaixaPagar, excluirContaReceber, excluirContaPagar };
}

export function useBlingBorderos(filtros?: Record<string, any>) {
  return useQuery({
    queryKey: ['bling-borderos', filtros],
    queryFn: () => blingAction('listar_borderos', { filtros }),
    enabled: false,
  });
}

export function useBlingContasContabeis() {
  return useQuery({
    queryKey: ['bling-contas-contabeis'],
    queryFn: () => blingAction('listar_contas_contabeis'),
    enabled: false,
  });
}

export function useBlingFormasPagamento() {
  return useQuery({
    queryKey: ['bling-formas-pagamento'],
    queryFn: () => blingAction('formas_pagamento'),
    enabled: false,
  });
}

export function useBlingCategoriasFinanceiras() {
  return useQuery({
    queryKey: ['bling-categorias-financeiras'],
    queryFn: () => blingAction('categorias_receitas_despesas'),
    enabled: false,
  });
}
