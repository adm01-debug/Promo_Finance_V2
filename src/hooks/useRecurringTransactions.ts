/**
 * Recurring Transactions Hooks
 * Manage recurring bills and payments - stub implementation
 * Note: The 'transacoes_recorrentes' table does not exist in the current schema.
 * These hooks provide the interface for future implementation.
 */

import { useState, useCallback } from 'react';
import { toast } from 'sonner';

// Types
export type RecurrenceType = 'diaria' | 'semanal' | 'quinzenal' | 'mensal' | 'bimestral' | 'trimestral' | 'semestral' | 'anual';

export interface RecurringTransaction {
  id: string;
  tipo: 'pagar' | 'receber';
  descricao: string;
  valor: number;
  categoriaId?: string;
  categoria?: { id: string; nome: string; cor: string };
  fornecedorId?: string;
  clienteId?: string;
  contaBancariaId?: string;
  recorrencia: RecurrenceType;
  diaVencimento: number;
  dataInicio: string;
  dataFim?: string;
  proximoVencimento: string;
  totalGerado: number;
  ativo: boolean;
  observacoes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RecurringTransactionInput {
  tipo: 'pagar' | 'receber';
  descricao: string;
  valor: number;
  categoriaId?: string;
  fornecedorId?: string;
  clienteId?: string;
  contaBancariaId?: string;
  recorrencia: RecurrenceType;
  diaVencimento: number;
  dataInicio: string;
  dataFim?: string;
  observacoes?: string;
}

/**
 * Hook to fetch all recurring transactions (stub)
 */
export function useRecurringTransactions(_tipo?: 'pagar' | 'receber') {
  return {
    data: [] as RecurringTransaction[],
    isLoading: false,
    error: null,
  };
}

/**
 * Hook to fetch a single recurring transaction (stub)
 */
export function useRecurringTransaction(_id: string) {
  return {
    data: undefined as RecurringTransaction | undefined,
    isLoading: false,
    error: null,
  };
}

/**
 * Hook for recurring transaction mutations (stub)
 */
export function useRecurringTransactionMutations() {
  const [isLoading, setIsLoading] = useState(false);

  const stubAsync = useCallback(async () => {
    setIsLoading(true);
    toast.info('Funcionalidade de transações recorrentes em desenvolvimento');
    setIsLoading(false);
  }, []);

  return {
    create: stubAsync,
    update: stubAsync,
    delete: stubAsync,
    toggleActive: stubAsync,
    generateNext: stubAsync,
    generateAllPending: stubAsync,
    isLoading,
  };
}

// Recurrence options for forms
export const RECURRENCE_OPTIONS: { value: RecurrenceType; label: string }[] = [
  { value: 'diaria', label: 'Diária' },
  { value: 'semanal', label: 'Semanal' },
  { value: 'quinzenal', label: 'Quinzenal' },
  { value: 'mensal', label: 'Mensal' },
  { value: 'bimestral', label: 'Bimestral' },
  { value: 'trimestral', label: 'Trimestral' },
  { value: 'semestral', label: 'Semestral' },
  { value: 'anual', label: 'Anual' },
];

// Format recurrence for display
export function formatRecurrence(recorrencia: RecurrenceType): string {
  const option = RECURRENCE_OPTIONS.find((opt) => opt.value === recorrencia);
  return option?.label || recorrencia;
}

export default useRecurringTransactions;
