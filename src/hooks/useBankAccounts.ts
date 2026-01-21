/**
 * Bank Account Management Hooks
 * CRUD operations for bank accounts
 */

import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Types
export interface BankAccount {
  id: string;
  nome: string;
  banco: string;
  agencia: string;
  conta: string;
  tipo: 'corrente' | 'poupanca' | 'investimento' | 'caixa';
  saldoInicial: number;
  saldoAtual: number;
  cor?: string;
  icone?: string;
  ativo: boolean;
  principal: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BankAccountInput {
  nome: string;
  banco: string;
  agencia: string;
  conta: string;
  tipo: BankAccount['tipo'];
  saldoInicial?: number;
  cor?: string;
  icone?: string;
  principal?: boolean;
}

export interface BankTransaction {
  id: string;
  contaBancariaId: string;
  tipo: 'entrada' | 'saida' | 'transferencia';
  valor: number;
  saldoAnterior: number;
  saldoPosterior: number;
  descricao: string;
  data: string;
  contaDestinoId?: string;
  contaPagarId?: string;
  contaReceberId?: string;
  createdAt: string;
}

// API functions
const bankAccountApi = {
  async getAll(): Promise<BankAccount[]> {
    const { data, error } = await supabase
      .from('contas_bancarias')
      .select('*')
      .order('principal', { ascending: false })
      .order('nome');

    if (error) throw error;
    return (data || []).map(mapToAccount);
  },

  async getById(id: string): Promise<BankAccount> {
    const { data, error } = await supabase
      .from('contas_bancarias')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return mapToAccount(data);
  },

  async create(input: BankAccountInput): Promise<BankAccount> {
    const { data, error } = await supabase
      .from('contas_bancarias')
      .insert({
        nome: input.nome,
        banco: input.banco,
        agencia: input.agencia,
        conta: input.conta,
        tipo: input.tipo,
        saldo_inicial: input.saldoInicial || 0,
        saldo_atual: input.saldoInicial || 0,
        cor: input.cor,
        icone: input.icone,
        principal: input.principal || false,
        ativo: true,
      })
      .select()
      .single();

    if (error) throw error;
    return mapToAccount(data);
  },

  async update(id: string, input: Partial<BankAccountInput>): Promise<BankAccount> {
    const { data, error } = await supabase
      .from('contas_bancarias')
      .update({
        nome: input.nome,
        banco: input.banco,
        agencia: input.agencia,
        conta: input.conta,
        tipo: input.tipo,
        cor: input.cor,
        icone: input.icone,
        principal: input.principal,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return mapToAccount(data);
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('contas_bancarias')
      .update({ ativo: false })
      .eq('id', id);

    if (error) throw error;
  },

  async getTransactions(accountId: string, limit = 50): Promise<BankTransaction[]> {
    const { data, error } = await supabase
      .from('movimentacoes_bancarias')
      .select('*')
      .eq('conta_bancaria_id', accountId)
      .order('data', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []).map(mapToTransaction);
  },

  async transfer(
    fromAccountId: string,
    toAccountId: string,
    valor: number,
    descricao: string
  ): Promise<void> {
    // Use a transaction for consistency
    const { error } = await supabase.rpc('transferir_entre_contas', {
      p_conta_origem_id: fromAccountId,
      p_conta_destino_id: toAccountId,
      p_valor: valor,
      p_descricao: descricao,
    });

    if (error) throw error;
  },

  async adjustBalance(
    accountId: string,
    novoSaldo: number,
    motivo: string
  ): Promise<void> {
    const { error } = await supabase.rpc('ajustar_saldo_conta', {
      p_conta_id: accountId,
      p_novo_saldo: novoSaldo,
      p_motivo: motivo,
    });

    if (error) throw error;
  },
};

// Mappers
function mapToAccount(data: Record<string, unknown>): BankAccount {
  return {
    id: data.id as string,
    nome: data.nome as string,
    banco: data.banco as string,
    agencia: data.agencia as string,
    conta: data.conta as string,
    tipo: data.tipo as BankAccount['tipo'],
    saldoInicial: data.saldo_inicial as number,
    saldoAtual: data.saldo_atual as number,
    cor: data.cor as string | undefined,
    icone: data.icone as string | undefined,
    ativo: data.ativo as boolean,
    principal: data.principal as boolean,
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
  };
}

function mapToTransaction(data: Record<string, unknown>): BankTransaction {
  return {
    id: data.id as string,
    contaBancariaId: data.conta_bancaria_id as string,
    tipo: data.tipo as BankTransaction['tipo'],
    valor: data.valor as number,
    saldoAnterior: data.saldo_anterior as number,
    saldoPosterior: data.saldo_posterior as number,
    descricao: data.descricao as string,
    data: data.data as string,
    contaDestinoId: data.conta_destino_id as string | undefined,
    contaPagarId: data.conta_pagar_id as string | undefined,
    contaReceberId: data.conta_receber_id as string | undefined,
    createdAt: data.created_at as string,
  };
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
    queryFn: bankAccountApi.getAll,
  });
}

/**
 * Hook to fetch a single bank account
 */
export function useBankAccount(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.detail(id),
    queryFn: () => bankAccountApi.getById(id),
    enabled: !!id,
  });
}

/**
 * Hook to fetch bank account transactions
 */
export function useBankTransactions(accountId: string, limit = 50) {
  return useQuery({
    queryKey: QUERY_KEYS.transactions(accountId),
    queryFn: () => bankAccountApi.getTransactions(accountId, limit),
    enabled: !!accountId,
  });
}

/**
 * Hook for bank account mutations
 */
export function useBankAccountMutations() {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: bankAccountApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all });
      toast.success('Conta bancária criada com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao criar conta bancária');
      console.error(error);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<BankAccountInput> }) =>
      bankAccountApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.detail(id) });
      toast.success('Conta bancária atualizada!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar conta bancária');
      console.error(error);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: bankAccountApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all });
      toast.success('Conta bancária desativada!');
    },
    onError: (error) => {
      toast.error('Erro ao desativar conta bancária');
      console.error(error);
    },
  });

  const transferMutation = useMutation({
    mutationFn: ({
      fromAccountId,
      toAccountId,
      valor,
      descricao,
    }: {
      fromAccountId: string;
      toAccountId: string;
      valor: number;
      descricao: string;
    }) => bankAccountApi.transfer(fromAccountId, toAccountId, valor, descricao),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all });
      toast.success('Transferência realizada com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao realizar transferência');
      console.error(error);
    },
  });

  const adjustBalanceMutation = useMutation({
    mutationFn: ({
      accountId,
      novoSaldo,
      motivo,
    }: {
      accountId: string;
      novoSaldo: number;
      motivo: string;
    }) => bankAccountApi.adjustBalance(accountId, novoSaldo, motivo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all });
      toast.success('Saldo ajustado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao ajustar saldo');
      console.error(error);
    },
  });

  return {
    create: createMutation.mutateAsync,
    update: updateMutation.mutateAsync,
    delete: deleteMutation.mutateAsync,
    transfer: transferMutation.mutateAsync,
    adjustBalance: adjustBalanceMutation.mutateAsync,
    isLoading:
      createMutation.isPending ||
      updateMutation.isPending ||
      deleteMutation.isPending ||
      transferMutation.isPending ||
      adjustBalanceMutation.isPending,
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

      acc.total += account.saldoAtual;

      switch (account.tipo) {
        case 'corrente':
          acc.corrente += account.saldoAtual;
          break;
        case 'poupanca':
          acc.poupanca += account.saldoAtual;
          break;
        case 'investimento':
          acc.investimento += account.saldoAtual;
          break;
        case 'caixa':
          acc.caixa += account.saldoAtual;
          break;
      }

      return acc;
    },
    { total: 0, corrente: 0, poupanca: 0, investimento: 0, caixa: 0 }
  ) || { total: 0, corrente: 0, poupanca: 0, investimento: 0, caixa: 0 };

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
