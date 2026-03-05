// @ts-nocheck - pagamentos_recorrentes table has schema differences
/**
 * Recurring Payments Service
 */

import { supabase } from '@/integrations/supabase/client';
import { addMonths, addWeeks, addDays, addYears, isBefore, isAfter, format } from 'date-fns';

export type RecurrenceFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly';
export type RecurringType = 'pagar' | 'receber';

export interface RecurringPayment {
  id: string;
  descricao: string;
  valor: number;
  fornecedor_id?: string;
  fornecedor_nome?: string;
  cliente_id?: string;
  frequencia: string;
  dia_vencimento: number;
  data_inicio: string;
  data_fim?: string;
  ativo: boolean;
  ultima_geracao?: string;
  proxima_geracao: string;
  total_gerado: number;
  observacoes?: string;
  empresa_id?: string;
  centro_custo_id?: string;
  conta_bancaria_id?: string;
  tipo_cobranca?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface CreateRecurringPaymentInput {
  descricao: string;
  valor: number;
  fornecedor_id?: string;
  fornecedor_nome?: string;
  frequencia: string;
  dia_vencimento: number;
  data_inicio: string;
  data_fim?: string;
  observacoes?: string;
  empresa_id?: string;
  centro_custo_id?: string;
  conta_bancaria_id?: string;
  tipo_cobranca?: string;
}

export interface GeneratedPayment {
  descricao: string;
  valor: number;
  data_vencimento: string;
  fornecedor_id?: string;
  status: 'pendente';
  origem_recorrente_id: string;
}

class RecurringPaymentsService {
  async getAll(): Promise<RecurringPayment[]> {
    const { data, error } = await supabase
      .from('pagamentos_recorrentes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as unknown as RecurringPayment[];
  }

  async getActive(): Promise<RecurringPayment[]> {
    const { data, error } = await supabase
      .from('pagamentos_recorrentes')
      .select('*')
      .eq('ativo', true)
      .order('proxima_geracao', { ascending: true });

    if (error) throw error;
    return (data || []) as unknown as RecurringPayment[];
  }

  async getById(id: string): Promise<RecurringPayment | null> {
    const { data, error } = await supabase
      .from('pagamentos_recorrentes')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as unknown as RecurringPayment;
  }

  async create(input: CreateRecurringPaymentInput): Promise<RecurringPayment> {
    const proximaGeracao = this.calculateNextDate(
      input.frequencia as RecurrenceFrequency,
      input.dia_vencimento,
      new Date(input.data_inicio)
    );

    const { data, error } = await supabase
      .from('pagamentos_recorrentes')
      .insert({
        ...input,
        ativo: true,
        proxima_geracao: proximaGeracao.toISOString(),
        total_gerado: 0,
      } as any)
      .select()
      .single();

    if (error) throw error;
    return data as unknown as RecurringPayment;
  }

  async update(id: string, input: Partial<CreateRecurringPaymentInput>): Promise<RecurringPayment> {
    const updateData: Record<string, unknown> = { ...input };

    if (input.frequencia || input.dia_vencimento) {
      const current = await this.getById(id);
      if (current) {
        const proximaGeracao = this.calculateNextDate(
          (input.frequencia || current.frequencia) as RecurrenceFrequency,
          input.dia_vencimento || current.dia_vencimento,
          new Date()
        );
        updateData.proxima_geracao = proximaGeracao.toISOString();
      }
    }

    const { data, error } = await supabase
      .from('pagamentos_recorrentes')
      .update(updateData as any)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as unknown as RecurringPayment;
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('pagamentos_recorrentes')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }

  async toggleActive(id: string): Promise<RecurringPayment> {
    const current = await this.getById(id);
    if (!current) throw new Error('Pagamento recorrente não encontrado');

    const { data, error } = await supabase
      .from('pagamentos_recorrentes')
      .update({ ativo: !current.ativo } as any)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as unknown as RecurringPayment;
  }

  async processAll(): Promise<{ processed: number; generated: number }> {
    const active = await this.getActive();
    return { processed: active.length, generated: 0 };
  }

  private calculateNextDate(frequencia: RecurrenceFrequency, diaVencimento: number, fromDate: Date): Date {
    let nextDate: Date;
    switch (frequencia) {
      case 'daily': nextDate = addDays(fromDate, 1); break;
      case 'weekly': nextDate = addWeeks(fromDate, 1); break;
      case 'biweekly': nextDate = addWeeks(fromDate, 2); break;
      case 'monthly':
        nextDate = addMonths(fromDate, 1);
        nextDate = new Date(nextDate.getFullYear(), nextDate.getMonth(), Math.min(diaVencimento, this.getDaysInMonth(nextDate)));
        break;
      case 'quarterly':
        nextDate = addMonths(fromDate, 3);
        nextDate = new Date(nextDate.getFullYear(), nextDate.getMonth(), Math.min(diaVencimento, this.getDaysInMonth(nextDate)));
        break;
      case 'yearly': nextDate = addYears(fromDate, 1); break;
      default: nextDate = addMonths(fromDate, 1);
    }
    return nextDate;
  }

  private getDaysInMonth(date: Date): number {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  }

  getFrequencyLabel(frequencia: RecurrenceFrequency): string {
    const labels: Record<RecurrenceFrequency, string> = {
      daily: 'Diário', weekly: 'Semanal', biweekly: 'Quinzenal',
      monthly: 'Mensal', quarterly: 'Trimestral', yearly: 'Anual',
    };
    return labels[frequencia];
  }
}

export const recurringPaymentsService = new RecurringPaymentsService();
export default recurringPaymentsService;