/**
 * Recurring Transactions Hooks
 * Manage recurring bills and payments
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
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

// API functions
const recurringApi = {
  async getAll(tipo?: 'pagar' | 'receber'): Promise<RecurringTransaction[]> {
    let query = supabase
      .from('transacoes_recorrentes')
      .select(`
        *,
        categoria:categorias(id, nome, cor)
      `)
      .order('proximo_vencimento');

    if (tipo) {
      query = query.eq('tipo', tipo);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map(mapToRecurring);
  },

  async getById(id: string): Promise<RecurringTransaction> {
    const { data, error } = await supabase
      .from('transacoes_recorrentes')
      .select(`
        *,
        categoria:categorias(id, nome, cor)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return mapToRecurring(data);
  },

  async create(input: RecurringTransactionInput): Promise<RecurringTransaction> {
    const proximoVencimento = calcularProximoVencimento(
      input.dataInicio,
      input.diaVencimento,
      input.recorrencia
    );

    const { data, error } = await supabase
      .from('transacoes_recorrentes')
      .insert({
        tipo: input.tipo,
        descricao: input.descricao,
        valor: input.valor,
        categoria_id: input.categoriaId,
        fornecedor_id: input.fornecedorId,
        cliente_id: input.clienteId,
        conta_bancaria_id: input.contaBancariaId,
        recorrencia: input.recorrencia,
        dia_vencimento: input.diaVencimento,
        data_inicio: input.dataInicio,
        data_fim: input.dataFim,
        proximo_vencimento: proximoVencimento,
        total_gerado: 0,
        ativo: true,
        observacoes: input.observacoes,
      })
      .select()
      .single();

    if (error) throw error;
    return mapToRecurring(data);
  },

  async update(id: string, input: Partial<RecurringTransactionInput>): Promise<RecurringTransaction> {
    const { data, error } = await supabase
      .from('transacoes_recorrentes')
      .update({
        descricao: input.descricao,
        valor: input.valor,
        categoria_id: input.categoriaId,
        fornecedor_id: input.fornecedorId,
        cliente_id: input.clienteId,
        conta_bancaria_id: input.contaBancariaId,
        recorrencia: input.recorrencia,
        dia_vencimento: input.diaVencimento,
        data_fim: input.dataFim,
        observacoes: input.observacoes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return mapToRecurring(data);
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('transacoes_recorrentes')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async toggleActive(id: string, ativo: boolean): Promise<void> {
    const { error } = await supabase
      .from('transacoes_recorrentes')
      .update({ ativo })
      .eq('id', id);

    if (error) throw error;
  },

  async generateNext(id: string): Promise<void> {
    const { error } = await supabase.rpc('gerar_proxima_recorrencia', {
      p_recorrente_id: id,
    });

    if (error) throw error;
  },

  async generateAllPending(): Promise<number> {
    const { data, error } = await supabase.rpc('gerar_recorrencias_pendentes');
    if (error) throw error;
    return data as number;
  },
};

// Mapper
function mapToRecurring(data: Record<string, unknown>): RecurringTransaction {
  const categoria = data.categoria as Record<string, unknown> | null;
  
  return {
    id: data.id as string,
    tipo: data.tipo as 'pagar' | 'receber',
    descricao: data.descricao as string,
    valor: data.valor as number,
    categoriaId: data.categoria_id as string | undefined,
    categoria: categoria ? {
      id: categoria.id as string,
      nome: categoria.nome as string,
      cor: categoria.cor as string,
    } : undefined,
    fornecedorId: data.fornecedor_id as string | undefined,
    clienteId: data.cliente_id as string | undefined,
    contaBancariaId: data.conta_bancaria_id as string | undefined,
    recorrencia: data.recorrencia as RecurrenceType,
    diaVencimento: data.dia_vencimento as number,
    dataInicio: data.data_inicio as string,
    dataFim: data.data_fim as string | undefined,
    proximoVencimento: data.proximo_vencimento as string,
    totalGerado: data.total_gerado as number,
    ativo: data.ativo as boolean,
    observacoes: data.observacoes as string | undefined,
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
  };
}

// Calculate next due date
function calcularProximoVencimento(
  dataInicio: string,
  diaVencimento: number,
  recorrencia: RecurrenceType
): string {
  const inicio = new Date(dataInicio);
  const hoje = new Date();
  let proximo = new Date(inicio);

  // Set the day
  proximo.setDate(Math.min(diaVencimento, getDaysInMonth(proximo)));

  // If it's in the past, calculate next occurrence
  while (proximo <= hoje) {
    proximo = addRecurrenceInterval(proximo, recorrencia);
  }

  return proximo.toISOString().split('T')[0];
}

function addRecurrenceInterval(date: Date, recorrencia: RecurrenceType): Date {
  const result = new Date(date);
  
  switch (recorrencia) {
    case 'diaria':
      result.setDate(result.getDate() + 1);
      break;
    case 'semanal':
      result.setDate(result.getDate() + 7);
      break;
    case 'quinzenal':
      result.setDate(result.getDate() + 15);
      break;
    case 'mensal':
      result.setMonth(result.getMonth() + 1);
      break;
    case 'bimestral':
      result.setMonth(result.getMonth() + 2);
      break;
    case 'trimestral':
      result.setMonth(result.getMonth() + 3);
      break;
    case 'semestral':
      result.setMonth(result.getMonth() + 6);
      break;
    case 'anual':
      result.setFullYear(result.getFullYear() + 1);
      break;
  }
  
  return result;
}

function getDaysInMonth(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

// Query keys
const QUERY_KEYS = {
  all: ['recurring-transactions'] as const,
  byType: (tipo: 'pagar' | 'receber') => ['recurring-transactions', tipo] as const,
  detail: (id: string) => ['recurring-transactions', id] as const,
};

/**
 * Hook to fetch all recurring transactions
 */
export function useRecurringTransactions(tipo?: 'pagar' | 'receber') {
  return useQuery({
    queryKey: tipo ? QUERY_KEYS.byType(tipo) : QUERY_KEYS.all,
    queryFn: () => recurringApi.getAll(tipo),
  });
}

/**
 * Hook to fetch a single recurring transaction
 */
export function useRecurringTransaction(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.detail(id),
    queryFn: () => recurringApi.getById(id),
    enabled: !!id,
  });
}

/**
 * Hook for recurring transaction mutations
 */
export function useRecurringTransactionMutations() {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: recurringApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all });
      toast.success('Transação recorrente criada!');
    },
    onError: (error) => {
      toast.error('Erro ao criar transação recorrente');
      console.error(error);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<RecurringTransactionInput> }) =>
      recurringApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.detail(id) });
      toast.success('Transação recorrente atualizada!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar transação recorrente');
      console.error(error);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: recurringApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all });
      toast.success('Transação recorrente excluída!');
    },
    onError: (error) => {
      toast.error('Erro ao excluir transação recorrente');
      console.error(error);
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, ativo }: { id: string; ativo: boolean }) =>
      recurringApi.toggleActive(id, ativo),
    onSuccess: (_, { ativo }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all });
      toast.success(ativo ? 'Recorrência ativada!' : 'Recorrência pausada!');
    },
    onError: (error) => {
      toast.error('Erro ao alterar status');
      console.error(error);
    },
  });

  const generateNextMutation = useMutation({
    mutationFn: recurringApi.generateNext,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all });
      toast.success('Próxima parcela gerada!');
    },
    onError: (error) => {
      toast.error('Erro ao gerar próxima parcela');
      console.error(error);
    },
  });

  const generateAllPendingMutation = useMutation({
    mutationFn: recurringApi.generateAllPending,
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all });
      toast.success(`${count} parcelas geradas!`);
    },
    onError: (error) => {
      toast.error('Erro ao gerar parcelas');
      console.error(error);
    },
  });

  return {
    create: createMutation.mutateAsync,
    update: updateMutation.mutateAsync,
    delete: deleteMutation.mutateAsync,
    toggleActive: toggleActiveMutation.mutateAsync,
    generateNext: generateNextMutation.mutateAsync,
    generateAllPending: generateAllPendingMutation.mutateAsync,
    isLoading:
      createMutation.isPending ||
      updateMutation.isPending ||
      deleteMutation.isPending ||
      toggleActiveMutation.isPending ||
      generateNextMutation.isPending ||
      generateAllPendingMutation.isPending,
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
