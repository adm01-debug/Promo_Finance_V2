import { supabase } from '@/integrations/supabase/client';

// Types
interface HistoricalData {
  date: string;
  income: number;
  expenses: number;
  balance: number;
}

interface ProjectionPoint {
  date: string;
  income: number;
  expenses: number;
  balance: number;
  isProjected: boolean;
  confidence?: number;
}

interface ProjectionScenario {
  id: string;
  name: string;
  description?: string;
  assumptions: ProjectionAssumptions;
  projections: ProjectionPoint[];
  summary: {
    endBalance: number;
    totalIncome: number;
    totalExpenses: number;
    netChange: number;
    growthRate: number;
  };
}

interface ProjectionAssumptions {
  incomeGrowthRate: number; // Monthly percentage
  expenseGrowthRate: number;
  includeRecurring: boolean;
  includeSeasonality: boolean;
  inflationRate?: number;
  customAdjustments?: Array<{
    date: string;
    type: 'income' | 'expense' | 'both';
    amount: number;
    description?: string;
  }>;
}

interface CashFlowProjection {
  date: string;
  openingBalance: number;
  inflows: number;
  outflows: number;
  netFlow: number;
  closingBalance: number;
  cumulativeBalance: number;
}

// Projection Service
export const projectionService = {
  // Get historical data for analysis
  async getHistoricalData(months: number = 12): Promise<HistoricalData[]> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const { data, error } = await supabase
      .from('transactions')
      .select('date, amount, type')
      .gte('date', startDate.toISOString().split('T')[0])
      .lte('date', endDate.toISOString().split('T')[0])
      .order('date');

    if (error) throw error;

    // Group by month
    const monthlyData: Record<string, { income: number; expenses: number }> = {};

    (data || []).forEach((tx: any) => {
      const month = tx.date.substring(0, 7);
      if (!monthlyData[month]) {
        monthlyData[month] = { income: 0, expenses: 0 };
      }
      if (tx.type === 'income') {
        monthlyData[month].income += tx.amount;
      } else {
        monthlyData[month].expenses += tx.amount;
      }
    });

    let runningBalance = 0;
    return Object.entries(monthlyData)
      .map(([date, data]) => {
        const balance = data.income - data.expenses;
        runningBalance += balance;
        return {
          date,
          income: data.income,
          expenses: data.expenses,
          balance: runningBalance,
        };
      })
      .sort((a, b) => a.date.localeCompare(b.date));
  },

  // Calculate trends from historical data
  calculateTrends(historicalData: HistoricalData[]): {
    avgIncome: number;
    avgExpenses: number;
    incomeGrowth: number;
    expenseGrowth: number;
    volatility: number;
  } {
    if (historicalData.length < 2) {
      return {
        avgIncome: 0,
        avgExpenses: 0,
        incomeGrowth: 0,
        expenseGrowth: 0,
        volatility: 0,
      };
    }

    const incomes = historicalData.map((d) => d.income);
    const expenses = historicalData.map((d) => d.expenses);

    const avgIncome = incomes.reduce((a, b) => a + b, 0) / incomes.length;
    const avgExpenses = expenses.reduce((a, b) => a + b, 0) / expenses.length;

    // Calculate growth rates
    const incomeGrowths: number[] = [];
    const expenseGrowths: number[] = [];

    for (let i = 1; i < historicalData.length; i++) {
      if (historicalData[i - 1].income > 0) {
        incomeGrowths.push(
          (historicalData[i].income - historicalData[i - 1].income) /
            historicalData[i - 1].income
        );
      }
      if (historicalData[i - 1].expenses > 0) {
        expenseGrowths.push(
          (historicalData[i].expenses - historicalData[i - 1].expenses) /
            historicalData[i - 1].expenses
        );
      }
    }

    const incomeGrowth =
      incomeGrowths.length > 0
        ? incomeGrowths.reduce((a, b) => a + b, 0) / incomeGrowths.length
        : 0;
    const expenseGrowth =
      expenseGrowths.length > 0
        ? expenseGrowths.reduce((a, b) => a + b, 0) / expenseGrowths.length
        : 0;

    // Calculate volatility (standard deviation of balance changes)
    const balanceChanges = historicalData
      .slice(1)
      .map((d, i) => d.balance - historicalData[i].balance);
    const avgChange =
      balanceChanges.reduce((a, b) => a + b, 0) / balanceChanges.length;
    const volatility = Math.sqrt(
      balanceChanges.reduce((sum, c) => sum + Math.pow(c - avgChange, 2), 0) /
        balanceChanges.length
    );

    return {
      avgIncome,
      avgExpenses,
      incomeGrowth: incomeGrowth * 100,
      expenseGrowth: expenseGrowth * 100,
      volatility,
    };
  },

  // Generate projections
  generateProjections(
    historicalData: HistoricalData[],
    assumptions: ProjectionAssumptions,
    months: number = 12
  ): ProjectionPoint[] {
    const projections: ProjectionPoint[] = [];

    // Start from last historical data point
    const lastData = historicalData[historicalData.length - 1];
    let currentDate = new Date(lastData?.date || new Date());
    let currentIncome = lastData?.income || 0;
    let currentExpenses = lastData?.expenses || 0;
    let currentBalance = lastData?.balance || 0;

    // Calculate trends for confidence estimation
    const trends = this.calculateTrends(historicalData);

    for (let i = 0; i < months; i++) {
      currentDate.setMonth(currentDate.getMonth() + 1);
      const dateStr = currentDate.toISOString().slice(0, 7);

      // Apply growth rates
      currentIncome *= 1 + assumptions.incomeGrowthRate / 100;
      currentExpenses *= 1 + assumptions.expenseGrowthRate / 100;

      // Apply inflation if specified
      if (assumptions.inflationRate) {
        currentExpenses *= 1 + assumptions.inflationRate / 100 / 12;
      }

      // Apply seasonality (simplified: +10% in Dec, -5% in Jan-Feb)
      if (assumptions.includeSeasonality) {
        const month = currentDate.getMonth();
        if (month === 11) {
          // December
          currentExpenses *= 1.1;
        } else if (month === 0 || month === 1) {
          // Jan-Feb
          currentIncome *= 0.95;
        }
      }

      // Apply custom adjustments
      assumptions.customAdjustments?.forEach((adj) => {
        if (adj.date.startsWith(dateStr)) {
          if (adj.type === 'income' || adj.type === 'both') {
            currentIncome += adj.amount;
          }
          if (adj.type === 'expense' || adj.type === 'both') {
            currentExpenses += adj.amount;
          }
        }
      });

      currentBalance += currentIncome - currentExpenses;

      // Calculate confidence (decreases over time)
      const baseConfidence = 0.9;
      const monthDecay = 0.02;
      const volatilityFactor = Math.max(
        0,
        1 - trends.volatility / (trends.avgIncome + trends.avgExpenses || 1)
      );
      const confidence = Math.max(
        0.3,
        (baseConfidence - i * monthDecay) * volatilityFactor
      );

      projections.push({
        date: dateStr,
        income: Math.round(currentIncome * 100) / 100,
        expenses: Math.round(currentExpenses * 100) / 100,
        balance: Math.round(currentBalance * 100) / 100,
        isProjected: true,
        confidence,
      });
    }

    return projections;
  },

  // Generate scenario
  generateScenario(
    name: string,
    historicalData: HistoricalData[],
    assumptions: ProjectionAssumptions,
    months: number = 12
  ): ProjectionScenario {
    const projections = this.generateProjections(
      historicalData,
      assumptions,
      months
    );

    const lastProjection = projections[projections.length - 1];
    const firstProjection = projections[0];
    const totalIncome = projections.reduce((sum, p) => sum + p.income, 0);
    const totalExpenses = projections.reduce((sum, p) => sum + p.expenses, 0);

    return {
      id: `scenario-${Date.now()}`,
      name,
      assumptions,
      projections,
      summary: {
        endBalance: lastProjection?.balance || 0,
        totalIncome,
        totalExpenses,
        netChange: totalIncome - totalExpenses,
        growthRate:
          firstProjection?.balance && firstProjection.balance > 0
            ? ((lastProjection?.balance || 0) / firstProjection.balance - 1) * 100
            : 0,
      },
    };
  },

  // Generate multiple scenarios (optimistic, realistic, pessimistic)
  generateScenarios(
    historicalData: HistoricalData[],
    months: number = 12
  ): ProjectionScenario[] {
    const trends = this.calculateTrends(historicalData);

    // Optimistic scenario
    const optimistic = this.generateScenario(
      'Otimista',
      historicalData,
      {
        incomeGrowthRate: Math.max(trends.incomeGrowth + 2, 5),
        expenseGrowthRate: Math.min(trends.expenseGrowth - 1, 2),
        includeRecurring: true,
        includeSeasonality: true,
      },
      months
    );

    // Realistic scenario
    const realistic = this.generateScenario(
      'Realista',
      historicalData,
      {
        incomeGrowthRate: trends.incomeGrowth,
        expenseGrowthRate: trends.expenseGrowth,
        includeRecurring: true,
        includeSeasonality: true,
      },
      months
    );

    // Pessimistic scenario
    const pessimistic = this.generateScenario(
      'Pessimista',
      historicalData,
      {
        incomeGrowthRate: Math.min(trends.incomeGrowth - 3, 0),
        expenseGrowthRate: Math.max(trends.expenseGrowth + 2, 5),
        includeRecurring: true,
        includeSeasonality: true,
        inflationRate: 5,
      },
      months
    );

    return [optimistic, realistic, pessimistic];
  },

  // Generate cash flow projection
  generateCashFlowProjection(
    openingBalance: number,
    projections: ProjectionPoint[]
  ): CashFlowProjection[] {
    let cumulativeBalance = openingBalance;

    return projections.map((p) => {
      const openingBal = cumulativeBalance;
      const netFlow = p.income - p.expenses;
      cumulativeBalance += netFlow;

      return {
        date: p.date,
        openingBalance: openingBal,
        inflows: p.income,
        outflows: p.expenses,
        netFlow,
        closingBalance: cumulativeBalance,
        cumulativeBalance,
      };
    });
  },

  // Calculate break-even point
  calculateBreakEven(
    fixedCosts: number,
    variableCostPercentage: number,
    averageIncome: number
  ): {
    breakEvenRevenue: number;
    breakEvenUnits?: number;
    marginOfSafety?: number;
  } {
    // Break-even revenue = Fixed Costs / (1 - Variable Cost %)
    const breakEvenRevenue =
      variableCostPercentage < 1
        ? fixedCosts / (1 - variableCostPercentage)
        : Infinity;

    const marginOfSafety =
      averageIncome > breakEvenRevenue
        ? ((averageIncome - breakEvenRevenue) / averageIncome) * 100
        : 0;

    return {
      breakEvenRevenue,
      marginOfSafety,
    };
  },

  // What-if analysis
  whatIfAnalysis(
    baseScenario: ProjectionScenario,
    changes: Partial<ProjectionAssumptions>
  ): ProjectionScenario {
    // This would need historical data to regenerate
    // For now, return modified projections based on percentage changes
    const modifiedAssumptions = {
      ...baseScenario.assumptions,
      ...changes,
    };

    const incomeMultiplier =
      1 +
      (changes.incomeGrowthRate !== undefined
        ? changes.incomeGrowthRate - baseScenario.assumptions.incomeGrowthRate
        : 0) /
        100;
    const expenseMultiplier =
      1 +
      (changes.expenseGrowthRate !== undefined
        ? changes.expenseGrowthRate - baseScenario.assumptions.expenseGrowthRate
        : 0) /
        100;

    const modifiedProjections = baseScenario.projections.map((p, i) => ({
      ...p,
      income: p.income * Math.pow(incomeMultiplier, i + 1),
      expenses: p.expenses * Math.pow(expenseMultiplier, i + 1),
      balance:
        p.balance +
        (p.income * Math.pow(incomeMultiplier, i + 1) - p.income) -
        (p.expenses * Math.pow(expenseMultiplier, i + 1) - p.expenses),
    }));

    const totalIncome = modifiedProjections.reduce((sum, p) => sum + p.income, 0);
    const totalExpenses = modifiedProjections.reduce(
      (sum, p) => sum + p.expenses,
      0
    );

    return {
      id: `what-if-${Date.now()}`,
      name: `What-If: ${baseScenario.name}`,
      assumptions: modifiedAssumptions,
      projections: modifiedProjections,
      summary: {
        endBalance: modifiedProjections[modifiedProjections.length - 1]?.balance || 0,
        totalIncome,
        totalExpenses,
        netChange: totalIncome - totalExpenses,
        growthRate:
          (modifiedProjections[modifiedProjections.length - 1]?.balance || 0) /
            (modifiedProjections[0]?.balance || 1) -
          1,
      },
    };
  },
};

export type {
  HistoricalData,
  ProjectionPoint,
  ProjectionScenario,
  ProjectionAssumptions,
  CashFlowProjection,
};
export default projectionService;
