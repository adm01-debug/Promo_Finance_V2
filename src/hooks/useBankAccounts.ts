/**
 * Bank Account Management Hooks
 * CRUD operations for bank accounts
 */

import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Types
export interface BankAccount {
  id: string;
  banco: string;
  agencia: string;
  conta: string;
  tipo_conta: string;
  saldo_atual: number;
  saldo_disponivel: number;
  cor?: string;
  ativo: boolean;
  codigo_banco: string;
  empresa_id: string;
  created_at: string;
  updated_at: string;
}

export interface BankAccountInput {
  banco: string;
  agencia: string;
  conta: string;
  tipo_conta?: string;
  codigo_banco: string;
  empresa_id: string;
  saldo_atual?: number;
  saldo_disponivel?: number;
  cor?: string;
}

export interface BankTransaction {
  id: string;
  conta_bancaria_id: string;
  tipo: string;
  valor: number;
  descricao: string;
  data: string;
  created_at: string;
}

// Query keys
const QUERY_KEYS = {
  all: ['bank-accounts'] as const,
  detail: (id: string) => ['bank-accounts', id] as const,
  transactions: (id: string) => ['bank-accounts', id, 'transactions'] as const,
};

/**
 * Hook to fetch all bank accounts
 */
export function useBankAccounts() {
  return useQuery({
    queryKey: QUERY_KEYS.all,
    queryFn: async (): Promise<BankAccount[]> => {
      const { data, error } = await supabase
        .from('contas_bancarias')
        .select('*')
        .order('banco');

      if (error) throw error;
      return (data || []) as BankAccount[];
    },
  });
}

/**
 * Hook to fetch a single bank account
 */
export function useBankAccount(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.detail(id),
    queryFn: async (): Promise<BankAccount> => {
      const { data, error } = await supabase
        .from('contas_bancarias')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as BankAccount;
    },
    enabled: !!id,
  });
}

/**
 * Hook for bank account mutations
 */
export function useBankAccountMutations() {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (input: BankAccountInput): Promise<BankAccount> => {
      const { data, error } = await supabase
        .from('contas_bancarias')
        .insert(input)
        .select()
        .single();

      if (error) throw error;
      return data as BankAccount;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all });
      toast.success('Conta bancária criada com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao criar conta bancária');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data: input }: { id: string; data: Partial<BankAccountInput> }): Promise<BankAccount> => {
      const { data, error } = await supabase
        .from('contas_bancarias')
        .update({ ...input, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as BankAccount;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.detail(id) });
      toast.success('Conta bancária atualizada!');
    },
    onError: () => {
      toast.error('Erro ao atualizar conta bancária');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { error } = await supabase
        .from('contas_bancarias')
        .update({ ativo: false })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all });
      toast.success('Conta bancária desativada!');
    },
    onError: () => {
      toast.error('Erro ao desativar conta bancária');
    },
  });

  return {
    create: createMutation.mutateAsync,
    update: updateMutation.mutateAsync,
    delete: deleteMutation.mutateAsync,
    isLoading:
      createMutation.isPending ||
      updateMutation.isPending ||
      deleteMutation.isPending,
  };
}

/**
 * Hook for bank account totals
 */
export function useBankAccountTotals() {
  const { data: accounts, isLoading } = useBankAccounts();

  const totals = accounts?.reduce(
    (acc, account) => {
      if (!account.ativo) return acc;
      acc.total += account.saldo_atual;
      return acc;
    },
    { total: 0 }
  ) || { total: 0 };

  return { totals, isLoading };
}

/**
 * Hook for real-time balance updates
 */
export function useBankAccountRealtime(accountId?: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const subscription = supabase
      .channel('bank-accounts-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'contas_bancarias',
          filter: accountId ? `id=eq.${accountId}` : undefined,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all });
          if (accountId) {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.detail(accountId) });
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [accountId, queryClient]);
}

// Bank list for autocomplete
export const BANK_LIST = [
  { codigo: '001', nome: 'Banco do Brasil' },
  { codigo: '033', nome: 'Santander' },
  { codigo: '104', nome: 'Caixa Econômica Federal' },
  { codigo: '237', nome: 'Bradesco' },
  { codigo: '341', nome: 'Itaú' },
  { codigo: '260', nome: 'Nubank' },
  { codigo: '077', nome: 'Inter' },
  { codigo: '212', nome: 'Banco Original' },
  { codigo: '336', nome: 'C6 Bank' },
  { codigo: '290', nome: 'PagSeguro' },
  { codigo: '380', nome: 'PicPay' },
  { codigo: '323', nome: 'Mercado Pago' },
  { codigo: '000', nome: 'Outro' },
];

// Account type options
export const ACCOUNT_TYPE_OPTIONS = [
  { value: 'corrente', label: 'Conta Corrente' },
  { value: 'poupanca', label: 'Poupança' },
  { value: 'investimento', label: 'Investimento' },
  { value: 'caixa', label: 'Caixa' },
];

export default useBankAccounts;
