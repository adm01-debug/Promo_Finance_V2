/**
 * Recurring Payments Service
 * Gerenciamento de pagamentos recorrentes
 */

import { supabase } from '@/integrations/supabase/client';
import { addMonths, addWeeks, addDays, addYears, isBefore, isAfter, format } from 'date-fns';

export type RecurrenceFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly';
export type RecurringType = 'pagar' | 'receber';

export interface RecurringPayment {
  id: string;
  user_id: string;
  tipo: RecurringType;
  descricao: string;
  valor: number;
  categoria_id?: string;
  fornecedor_id?: string;
  cliente_id?: string;
  frequencia: RecurrenceFrequency;
  dia_vencimento: number; // Day of month (1-31) or day of week (0-6)
  data_inicio: string;
  data_fim?: string;
  ativo: boolean;
  ultima_geracao?: string;
  proxima_geracao: string;
  total_gerados: number;
  observacoes?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateRecurringPaymentInput {
  tipo: RecurringType;
  descricao: string;
  valor: number;
  categoria_id?: string;
  fornecedor_id?: string;
  cliente_id?: string;
  frequencia: RecurrenceFrequency;
  dia_vencimento: number;
  data_inicio: string;
  data_fim?: string;
  observacoes?: string;
}

export interface GeneratedPayment {
  descricao: string;
  valor: number;
  data_vencimento: string;
  categoria_id?: string;
  fornecedor_id?: string;
  cliente_id?: string;
  status: 'pendente';
  origem_recorrente_id: string;
}

class RecurringPaymentsService {
  /**
   * Get all recurring payments
   */
  async getAll(tipo?: RecurringType): Promise<RecurringPayment[]> {
    let query = supabase
      .from('pagamentos_recorrentes')
      .select('*')
      .order('created_at', { ascending: false });

    if (tipo) {
      query = query.eq('tipo', tipo);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  /**
   * Get active recurring payments
   */
  async getActive(tipo?: RecurringType): Promise<RecurringPayment[]> {
    let query = supabase
      .from('pagamentos_recorrentes')
      .select('*')
      .eq('ativo', true)
      .order('proxima_geracao', { ascending: true });

    if (tipo) {
      query = query.eq('tipo', tipo);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  /**
   * Get by ID
   */
  async getById(id: string): Promise<RecurringPayment | null> {
    const { data, error } = await supabase
      .from('pagamentos_recorrentes')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Create recurring payment
   */
  async create(input: CreateRecurringPaymentInput): Promise<RecurringPayment> {
    const proximaGeracao = this.calculateNextDate(
      input.frequencia,
      input.dia_vencimento,
      new Date(input.data_inicio)
    );

    const { data, error } = await supabase
      .from('pagamentos_recorrentes')
      .insert({
        ...input,
        ativo: true,
        proxima_geracao: proximaGeracao.toISOString(),
        total_gerados: 0,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update recurring payment
   */
  async update(id: string, input: Partial<CreateRecurringPaymentInput>): Promise<RecurringPayment> {
    const updateData: Record<string, unknown> = { ...input };

    // Recalculate next date if frequency or day changed
    if (input.frequencia || input.dia_vencimento) {
      const current = await this.getById(id);
      if (current) {
        const proximaGeracao = this.calculateNextDate(
          input.frequencia || current.frequencia,
          input.dia_vencimento || current.dia_vencimento,
          new Date()
        );
        updateData.proxima_geracao = proximaGeracao.toISOString();
      }
    }

    const { data, error } = await supabase
      .from('pagamentos_recorrentes')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Delete recurring payment
   */
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('pagamentos_recorrentes')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  /**
   * Toggle active status
   */
  async toggleActive(id: string): Promise<RecurringPayment> {
    const current = await this.getById(id);
    if (!current) throw new Error('Pagamento recorrente não encontrado');

    const { data, error } = await supabase
      .from('pagamentos_recorrentes')
      .update({ ativo: !current.ativo })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Generate payments for a recurring payment
   */
  async generatePayments(recurringId: string): Promise<GeneratedPayment[]> {
    const recurring = await this.getById(recurringId);
    if (!recurring || !recurring.ativo) {
      return [];
    }

    const now = new Date();
    const generated: GeneratedPayment[] = [];

    // Check if end date passed
    if (recurring.data_fim && isAfter(now, new Date(recurring.data_fim))) {
      await this.update(recurringId, { ativo: false } as Partial<CreateRecurringPaymentInput>);
      return [];
    }

    let nextDate = new Date(recurring.proxima_geracao);

    // Generate payments up to current date
    while (isBefore(nextDate, now) || format(nextDate, 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd')) {
      // Check end date
      if (recurring.data_fim && isAfter(nextDate, new Date(recurring.data_fim))) {
        break;
      }

      const payment: GeneratedPayment = {
        descricao: recurring.descricao,
        valor: recurring.valor,
        data_vencimento: nextDate.toISOString(),
        categoria_id: recurring.categoria_id,
        fornecedor_id: recurring.fornecedor_id,
        cliente_id: recurring.cliente_id,
        status: 'pendente',
        origem_recorrente_id: recurring.id,
      };

      generated.push(payment);

      // Calculate next date
      nextDate = this.calculateNextDate(
        recurring.frequencia,
        recurring.dia_vencimento,
        nextDate
      );
    }

    // Insert generated payments
    if (generated.length > 0) {
      const tableName = recurring.tipo === 'pagar' ? 'contas_pagar' : 'contas_receber';
      
      const { error } = await supabase.from(tableName).insert(
        generated.map((p) => ({
          ...p,
          user_id: recurring.user_id,
        }))
      );

      if (error) throw error;

      // Update recurring payment
      await supabase
        .from('pagamentos_recorrentes')
        .update({
          ultima_geracao: new Date().toISOString(),
          proxima_geracao: nextDate.toISOString(),
          total_gerados: recurring.total_gerados + generated.length,
        })
        .eq('id', recurringId);
    }

    return generated;
  }

  /**
   * Process all active recurring payments
   */
  async processAll(): Promise<{ processed: number; generated: number }> {
    const active = await this.getActive();
    let totalGenerated = 0;

    for (const recurring of active) {
      try {
        const generated = await this.generatePayments(recurring.id);
        totalGenerated += generated.length;
      } catch (error) {
        console.error(`Error processing recurring ${recurring.id}:`, error);
      }
    }

    return {
      processed: active.length,
      generated: totalGenerated,
    };
  }

  /**
   * Calculate next date based on frequency
   */
  private calculateNextDate(
    frequencia: RecurrenceFrequency,
    diaVencimento: number,
    fromDate: Date
  ): Date {
    let nextDate: Date;

    switch (frequencia) {
      case 'daily':
        nextDate = addDays(fromDate, 1);
        break;
      case 'weekly':
        nextDate = addWeeks(fromDate, 1);
        break;
      case 'biweekly':
        nextDate = addWeeks(fromDate, 2);
        break;
      case 'monthly':
        nextDate = addMonths(fromDate, 1);
        // Adjust to specific day
        nextDate = new Date(nextDate.getFullYear(), nextDate.getMonth(), Math.min(diaVencimento, this.getDaysInMonth(nextDate)));
        break;
      case 'quarterly':
        nextDate = addMonths(fromDate, 3);
        nextDate = new Date(nextDate.getFullYear(), nextDate.getMonth(), Math.min(diaVencimento, this.getDaysInMonth(nextDate)));
        break;
      case 'yearly':
        nextDate = addYears(fromDate, 1);
        break;
      default:
        nextDate = addMonths(fromDate, 1);
    }

    return nextDate;
  }

  /**
   * Get days in month
   */
  private getDaysInMonth(date: Date): number {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  }

  /**
   * Get frequency label
   */
  getFrequencyLabel(frequencia: RecurrenceFrequency): string {
    const labels: Record<RecurrenceFrequency, string> = {
      daily: 'Diário',
      weekly: 'Semanal',
      biweekly: 'Quinzenal',
      monthly: 'Mensal',
      quarterly: 'Trimestral',
      yearly: 'Anual',
    };
    return labels[frequencia];
  }
}

export const recurringPaymentsService = new RecurringPaymentsService();

export default recurringPaymentsService;
