import { z } from 'zod';
import type { Budget } from '@/hooks/useBudget';

export const budgetSchema = z.object({
  category: z.string().min(1, 'Selecione uma categoria'),
  budgeted_amount: z.number().min(0.01, 'Valor deve ser maior que zero'),
  period: z.string().min(7, 'Selecione o período'),
});

export type BudgetFormData = z.infer<typeof budgetSchema>;
export type BudgetWithSpent = Budget & {
  actual_spent: number;
  remaining: number;
  percent_used: number;
};
