// @ts-nocheck - Uses tables not yet in schema (transactions)
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
  incomeGrowthRate: number;
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

export const projectionService = {
  async getHistoricalData(months: number = 12): Promise<HistoricalData[]> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const { data, error } = await supabase
      .from('transacoes_bancarias')
      .select('data, valor, tipo')
      .gte('data', startDate.toISOString().split('T')[0])
      .lte('data', endDate.toISOString().split('T')[0])
      .order('data');

    if (error) throw error;

    const monthlyData: Record<string, { income: number; expenses: number }> = {};

    (data || []).forEach((tx: any) => {
      const month = (tx.data as string).substring(0, 7);
      if (!monthlyData[month]) {
        monthlyData[month] = { income: 0, expenses: 0 };
      }
      if (tx.tipo === 'receita') {
        monthlyData[month].income += Number(tx.valor) || 0;
      } else {
        monthlyData[month].expenses += Number(tx.valor) || 0;
      }
    });

    let runningBalance = 0;
    return Object.entries(monthlyData)
      .map(([date, d]) => {
        const balance = d.income - d.expenses;
        runningBalance += balance;
        return { date, income: d.income, expenses: d.expenses, balance: runningBalance };
      })
      .sort((a, b) => a.date.localeCompare(b.date));
  },

  calculateTrends(historicalData: HistoricalData[]) {
    if (historicalData.length < 2) {
      return { avgIncome: 0, avgExpenses: 0, incomeGrowth: 0, expenseGrowth: 0, volatility: 0 };
    }

    const incomes = historicalData.map((d) => d.income);
    const expenses = historicalData.map((d) => d.expenses);
    const avgIncome = incomes.reduce((a, b) => a + b, 0) / incomes.length;
    const avgExpenses = expenses.reduce((a, b) => a + b, 0) / expenses.length;

    const incomeGrowths: number[] = [];
    const expenseGrowths: number[] = [];

    for (let i = 1; i < historicalData.length; i++) {
      if (historicalData[i - 1].income > 0) {
        incomeGrowths.push((historicalData[i].income - historicalData[i - 1].income) / historicalData[i - 1].income);
      }
      if (historicalData[i - 1].expenses > 0) {
        expenseGrowths.push((historicalData[i].expenses - historicalData[i - 1].expenses) / historicalData[i - 1].expenses);
      }
    }

    const incomeGrowth = incomeGrowths.length > 0 ? incomeGrowths.reduce((a, b) => a + b, 0) / incomeGrowths.length : 0;
    const expenseGrowth = expenseGrowths.length > 0 ? expenseGrowths.reduce((a, b) => a + b, 0) / expenseGrowths.length : 0;

    const balanceChanges = historicalData.slice(1).map((d, i) => d.balance - historicalData[i].balance);
    const avgChange = balanceChanges.reduce((a, b) => a + b, 0) / balanceChanges.length;
    const volatility = Math.sqrt(balanceChanges.reduce((sum, c) => sum + Math.pow(c - avgChange, 2), 0) / balanceChanges.length);

    return { avgIncome, avgExpenses, incomeGrowth: incomeGrowth * 100, expenseGrowth: expenseGrowth * 100, volatility };
  },

  generateProjections(historicalData: HistoricalData[], assumptions: ProjectionAssumptions, months: number = 12): ProjectionPoint[] {
    const projections: ProjectionPoint[] = [];
    const lastData = historicalData[historicalData.length - 1];
    let currentDate = new Date(lastData?.date || new Date());
    let currentIncome = lastData?.income || 0;
    let currentExpenses = lastData?.expenses || 0;
    let currentBalance = lastData?.balance || 0;
    const trends = this.calculateTrends(historicalData);

    for (let i = 0; i < months; i++) {
      currentDate.setMonth(currentDate.getMonth() + 1);
      const dateStr = currentDate.toISOString().slice(0, 7);
      currentIncome *= 1 + assumptions.incomeGrowthRate / 100;
      currentExpenses *= 1 + assumptions.expenseGrowthRate / 100;

      if (assumptions.inflationRate) {
        currentExpenses *= 1 + assumptions.inflationRate / 100 / 12;
      }

      if (assumptions.includeSeasonality) {
        const month = currentDate.getMonth();
        if (month === 11) currentExpenses *= 1.1;
        else if (month === 0 || month === 1) currentIncome *= 0.95;
      }

      assumptions.customAdjustments?.forEach((adj) => {
        if (adj.date.startsWith(dateStr)) {
          if (adj.type === 'income' || adj.type === 'both') currentIncome += adj.amount;
          if (adj.type === 'expense' || adj.type === 'both') currentExpenses += adj.amount;
        }
      });

      currentBalance += currentIncome - currentExpenses;
      const baseConfidence = 0.9;
      const monthDecay = 0.02;
      const volatilityFactor = Math.max(0, 1 - trends.volatility / (trends.avgIncome + trends.avgExpenses || 1));
      const confidence = Math.max(0.3, (baseConfidence - i * monthDecay) * volatilityFactor);

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

  generateScenario(name: string, historicalData: HistoricalData[], assumptions: ProjectionAssumptions, months: number = 12): ProjectionScenario {
    const projections = this.generateProjections(historicalData, assumptions, months);
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
        growthRate: firstProjection?.balance && firstProjection.balance > 0
          ? ((lastProjection?.balance || 0) / firstProjection.balance - 1) * 100
          : 0,
      },
    };
  },

  generateScenarios(historicalData: HistoricalData[], months: number = 12): ProjectionScenario[] {
    const trends = this.calculateTrends(historicalData);

    const optimistic = this.generateScenario('Otimista', historicalData, {
      incomeGrowthRate: Math.max(trends.incomeGrowth + 2, 5),
      expenseGrowthRate: Math.min(trends.expenseGrowth - 1, 2),
      includeRecurring: true,
      includeSeasonality: true,
    }, months);

    const realistic = this.generateScenario('Realista', historicalData, {
      incomeGrowthRate: trends.incomeGrowth,
      expenseGrowthRate: trends.expenseGrowth,
      includeRecurring: true,
      includeSeasonality: true,
    }, months);

    const pessimistic = this.generateScenario('Pessimista', historicalData, {
      incomeGrowthRate: Math.min(trends.incomeGrowth - 3, 0),
      expenseGrowthRate: Math.max(trends.expenseGrowth + 2, 5),
      includeRecurring: true,
      includeSeasonality: true,
      inflationRate: 5,
    }, months);

    return [optimistic, realistic, pessimistic];
  },

  generateCashFlowProjection(openingBalance: number, projections: ProjectionPoint[]): CashFlowProjection[] {
    let cumulativeBalance = openingBalance;
    return projections.map((p) => {
      const openingBal = cumulativeBalance;
      const netFlow = p.income - p.expenses;
      cumulativeBalance += netFlow;
      return { date: p.date, openingBalance: openingBal, inflows: p.income, outflows: p.expenses, netFlow, closingBalance: cumulativeBalance, cumulativeBalance };
    });
  },

  calculateBreakEven(fixedCosts: number, variableCostPercentage: number, averageIncome: number) {
    const breakEvenRevenue = variableCostPercentage < 1 ? fixedCosts / (1 - variableCostPercentage) : Infinity;
    const marginOfSafety = averageIncome > breakEvenRevenue ? ((averageIncome - breakEvenRevenue) / averageIncome) * 100 : 0;
    return { breakEvenRevenue, marginOfSafety };
  },

  whatIfAnalysis(baseScenario: ProjectionScenario, changes: Partial<ProjectionAssumptions>): ProjectionScenario {
    const modifiedAssumptions = { ...baseScenario.assumptions, ...changes };
    const incomeMultiplier = 1 + (changes.incomeGrowthRate !== undefined ? changes.incomeGrowthRate - baseScenario.assumptions.incomeGrowthRate : 0) / 100;
    const expenseMultiplier = 1 + (changes.expenseGrowthRate !== undefined ? changes.expenseGrowthRate - baseScenario.assumptions.expenseGrowthRate : 0) / 100;

    const modifiedProjections = baseScenario.projections.map((p, i) => ({
      ...p,
      income: p.income * Math.pow(incomeMultiplier, i + 1),
      expenses: p.expenses * Math.pow(expenseMultiplier, i + 1),
      balance: p.balance + (p.income * Math.pow(incomeMultiplier, i + 1) - p.income) - (p.expenses * Math.pow(expenseMultiplier, i + 1) - p.expenses),
    }));

    const totalIncome = modifiedProjections.reduce((sum, p) => sum + p.income, 0);
    const totalExpenses = modifiedProjections.reduce((sum, p) => sum + p.expenses, 0);

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
        growthRate: (modifiedProjections[modifiedProjections.length - 1]?.balance || 0) / (modifiedProjections[0]?.balance || 1) - 1,
      },
    };
  },
};

export type { HistoricalData, ProjectionPoint, ProjectionScenario, ProjectionAssumptions, CashFlowProjection };
export default projectionService;
