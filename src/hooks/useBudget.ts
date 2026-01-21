import { useState, useCallback, useMemo, useEffect } from 'react';
import { useLocalStorage } from './useLocalStorage';

interface Budget {
  id: string;
  categoryId: string;
  categoryName: string;
  amount: number;
  period: 'monthly' | 'weekly' | 'yearly';
  startDate: string;
  endDate?: string;
  color?: string;
  alertThreshold?: number; // Percentage (e.g., 80 = 80%)
}

interface BudgetSpent {
  categoryId: string;
  spent: number;
  transactions: number;
}

interface BudgetSummary extends Budget {
  spent: number;
  remaining: number;
  percentUsed: number;
  status: 'under' | 'warning' | 'over';
  transactions: number;
  dailyAverage: number;
  projectedTotal: number;
  daysRemaining: number;
}

interface UseBudgetOptions {
  onBudgetAlert?: (budget: BudgetSummary) => void;
  alertThreshold?: number;
}

export function useBudget(
  initialBudgets: Budget[] = [],
  spentData: BudgetSpent[] = [],
  options: UseBudgetOptions = {}
) {
  const { onBudgetAlert, alertThreshold = 80 } = options;
  
  const [budgets, setBudgets] = useLocalStorage<Budget[]>('budgets', initialBudgets);
  const [alertedBudgets, setAlertedBudgets] = useState<Set<string>>(new Set());

  // Create budget
  const createBudget = useCallback((budget: Omit<Budget, 'id'>) => {
    const newBudget: Budget = {
      ...budget,
      id: `budget-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      alertThreshold: budget.alertThreshold ?? alertThreshold,
    };
    setBudgets((prev) => [...prev, newBudget]);
    return newBudget;
  }, [setBudgets, alertThreshold]);

  // Update budget
  const updateBudget = useCallback((id: string, updates: Partial<Budget>) => {
    setBudgets((prev) =>
      prev.map((budget) =>
        budget.id === id ? { ...budget, ...updates } : budget
      )
    );
  }, [setBudgets]);

  // Delete budget
  const deleteBudget = useCallback((id: string) => {
    setBudgets((prev) => prev.filter((budget) => budget.id !== id));
    setAlertedBudgets((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, [setBudgets]);

  // Calculate budget summaries
  const budgetSummaries = useMemo((): BudgetSummary[] => {
    const now = new Date();
    
    return budgets.map((budget) => {
      const spentInfo = spentData.find((s) => s.categoryId === budget.categoryId);
      const spent = spentInfo?.spent || 0;
      const transactions = spentInfo?.transactions || 0;
      
      const remaining = budget.amount - spent;
      const percentUsed = (spent / budget.amount) * 100;
      
      // Calculate period dates
      const startDate = new Date(budget.startDate);
      let endDate: Date;
      
      switch (budget.period) {
        case 'weekly':
          endDate = new Date(startDate);
          endDate.setDate(endDate.getDate() + 7);
          break;
        case 'yearly':
          endDate = new Date(startDate);
          endDate.setFullYear(endDate.getFullYear() + 1);
          break;
        case 'monthly':
        default:
          endDate = new Date(startDate);
          endDate.setMonth(endDate.getMonth() + 1);
      }
      
      const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const elapsedDays = Math.max(1, Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
      const daysRemaining = Math.max(0, totalDays - elapsedDays);
      
      const dailyAverage = spent / elapsedDays;
      const projectedTotal = dailyAverage * totalDays;
      
      // Determine status
      const threshold = budget.alertThreshold ?? alertThreshold;
      let status: 'under' | 'warning' | 'over';
      if (percentUsed >= 100) {
        status = 'over';
      } else if (percentUsed >= threshold) {
        status = 'warning';
      } else {
        status = 'under';
      }
      
      return {
        ...budget,
        spent,
        remaining,
        percentUsed,
        status,
        transactions,
        dailyAverage,
        projectedTotal,
        daysRemaining,
      };
    });
  }, [budgets, spentData, alertThreshold]);

  // Check for alerts
  useEffect(() => {
    if (!onBudgetAlert) return;

    budgetSummaries.forEach((summary) => {
      if (
        (summary.status === 'warning' || summary.status === 'over') &&
        !alertedBudgets.has(summary.id)
      ) {
        onBudgetAlert(summary);
        setAlertedBudgets((prev) => new Set([...prev, summary.id]));
      }
    });
  }, [budgetSummaries, alertedBudgets, onBudgetAlert]);

  // Reset alerted budgets when a new period starts
  const resetAlerts = useCallback(() => {
    setAlertedBudgets(new Set());
  }, []);

  // Get budget by category
  const getBudgetByCategory = useCallback(
    (categoryId: string): BudgetSummary | undefined => {
      return budgetSummaries.find((b) => b.categoryId === categoryId);
    },
    [budgetSummaries]
  );

  // Get budgets by status
  const getBudgetsByStatus = useCallback(
    (status: 'under' | 'warning' | 'over'): BudgetSummary[] => {
      return budgetSummaries.filter((b) => b.status === status);
    },
    [budgetSummaries]
  );

  // Calculate totals
  const totals = useMemo(() => {
    const totalBudgeted = budgetSummaries.reduce((sum, b) => sum + b.amount, 0);
    const totalSpent = budgetSummaries.reduce((sum, b) => sum + b.spent, 0);
    const totalRemaining = totalBudgeted - totalSpent;
    const overallPercentUsed = (totalSpent / totalBudgeted) * 100 || 0;
    
    return {
      totalBudgeted,
      totalSpent,
      totalRemaining,
      overallPercentUsed,
      budgetsUnder: budgetSummaries.filter((b) => b.status === 'under').length,
      budgetsWarning: budgetSummaries.filter((b) => b.status === 'warning').length,
      budgetsOver: budgetSummaries.filter((b) => b.status === 'over').length,
    };
  }, [budgetSummaries]);

  // Duplicate budget for next period
  const duplicateBudget = useCallback((id: string) => {
    const budget = budgets.find((b) => b.id === id);
    if (!budget) return null;

    const startDate = new Date();
    let endDate: Date | undefined;

    switch (budget.period) {
      case 'weekly':
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 7);
        break;
      case 'yearly':
        endDate = new Date(startDate);
        endDate.setFullYear(endDate.getFullYear() + 1);
        break;
      case 'monthly':
      default:
        endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + 1);
    }

    return createBudget({
      ...budget,
      startDate: startDate.toISOString(),
      endDate: endDate?.toISOString(),
    });
  }, [budgets, createBudget]);

  return {
    // Data
    budgets,
    budgetSummaries,
    totals,
    
    // Actions
    createBudget,
    updateBudget,
    deleteBudget,
    duplicateBudget,
    resetAlerts,
    
    // Queries
    getBudgetByCategory,
    getBudgetsByStatus,
  };
}

// Hook for budget tracking with automatic category detection
export function useBudgetTracking(budgetId?: string) {
  const [tracking, setTracking] = useState({
    isTracking: false,
    startedAt: null as Date | null,
    categoryId: null as string | null,
  });

  const startTracking = useCallback((categoryId: string) => {
    setTracking({
      isTracking: true,
      startedAt: new Date(),
      categoryId,
    });
  }, []);

  const stopTracking = useCallback(() => {
    setTracking({
      isTracking: false,
      startedAt: null,
      categoryId: null,
    });
  }, []);

  return {
    ...tracking,
    startTracking,
    stopTracking,
  };
}

// Helper hook for budget alerts
export function useBudgetAlerts(budgetSummaries: BudgetSummary[]) {
  const alerts = useMemo(() => {
    return budgetSummaries
      .filter((b) => b.status === 'warning' || b.status === 'over')
      .map((b) => ({
        id: b.id,
        type: b.status === 'over' ? 'error' : 'warning',
        title: b.status === 'over' ? 'Orçamento excedido!' : 'Orçamento próximo do limite',
        message: `${b.categoryName}: ${b.percentUsed.toFixed(0)}% usado (R$ ${b.spent.toFixed(2)} de R$ ${b.amount.toFixed(2)})`,
        budget: b,
      }));
  }, [budgetSummaries]);

  return {
    alerts,
    hasAlerts: alerts.length > 0,
    warningCount: alerts.filter((a) => a.type === 'warning').length,
    errorCount: alerts.filter((a) => a.type === 'error').length,
  };
}

export type { Budget, BudgetSpent, BudgetSummary };
export default useBudget;
