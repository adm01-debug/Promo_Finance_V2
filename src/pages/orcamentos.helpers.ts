import type { BudgetWithSpent } from './orcamentos.types';

export function obterDadosOrcamentos(budgets: BudgetWithSpent[]) {
  const totalBudgeted = budgets.reduce(
    (total, budget) => total + Number(budget.budgeted_amount),
    0
  );
  const totalSpent = budgets.reduce((total, budget) => total + budget.actual_spent, 0);
  const remaining = totalBudgeted - totalSpent;
  const percent = totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0;
  return {
    totals: { totalBudgeted, totalSpent, remaining, percent },
    chartData: budgets.map((budget) => ({
      name: budget.category,
      Orçado: Number(budget.budgeted_amount),
      Gasto: budget.actual_spent,
    })),
  };
}
