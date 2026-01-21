/**
 * Financial Calculations Utilities
 * Interest rates, installments, projections, and financial formulas
 */

// Interest calculation types
type InterestType = 'simple' | 'compound';

interface InstallmentResult {
  installmentNumber: number;
  principal: number;
  interest: number;
  total: number;
  balance: number;
  accumulatedPrincipal: number;
  accumulatedInterest: number;
}

interface LoanCalculation {
  principal: number;
  totalInterest: number;
  totalAmount: number;
  monthlyPayment: number;
  installments: InstallmentResult[];
}

interface InvestmentProjection {
  month: number;
  deposit: number;
  interest: number;
  balance: number;
  totalDeposits: number;
  totalInterest: number;
}

// =====================
// Interest Calculations
// =====================

/**
 * Calculate simple interest
 * Formula: I = P * r * t
 */
export function calculateSimpleInterest(
  principal: number,
  ratePerPeriod: number,
  periods: number
): number {
  return principal * ratePerPeriod * periods;
}

/**
 * Calculate compound interest
 * Formula: A = P * (1 + r)^t
 */
export function calculateCompoundInterest(
  principal: number,
  ratePerPeriod: number,
  periods: number
): number {
  return principal * Math.pow(1 + ratePerPeriod, periods) - principal;
}

/**
 * Calculate future value
 */
export function calculateFutureValue(
  principal: number,
  ratePerPeriod: number,
  periods: number,
  type: InterestType = 'compound'
): number {
  if (type === 'simple') {
    return principal + calculateSimpleInterest(principal, ratePerPeriod, periods);
  }
  return principal * Math.pow(1 + ratePerPeriod, periods);
}

/**
 * Calculate present value
 */
export function calculatePresentValue(
  futureValue: number,
  ratePerPeriod: number,
  periods: number
): number {
  return futureValue / Math.pow(1 + ratePerPeriod, periods);
}

// =======================
// Installment Calculations
// =======================

/**
 * Calculate PMT (monthly payment)
 * Formula: PMT = PV * [r(1+r)^n] / [(1+r)^n - 1]
 */
export function calculatePMT(
  principal: number,
  ratePerPeriod: number,
  periods: number
): number {
  if (ratePerPeriod === 0) {
    return principal / periods;
  }
  
  const x = Math.pow(1 + ratePerPeriod, periods);
  return principal * (ratePerPeriod * x) / (x - 1);
}

/**
 * Calculate loan amortization (Price table - most common in Brazil)
 */
export function calculatePriceAmortization(
  principal: number,
  annualRate: number,
  months: number
): LoanCalculation {
  const monthlyRate = annualRate / 12;
  const monthlyPayment = calculatePMT(principal, monthlyRate, months);
  
  const installments: InstallmentResult[] = [];
  let balance = principal;
  let accumulatedPrincipal = 0;
  let accumulatedInterest = 0;

  for (let i = 1; i <= months; i++) {
    const interest = balance * monthlyRate;
    const principalPayment = monthlyPayment - interest;
    balance -= principalPayment;
    
    accumulatedPrincipal += principalPayment;
    accumulatedInterest += interest;

    installments.push({
      installmentNumber: i,
      principal: principalPayment,
      interest,
      total: monthlyPayment,
      balance: Math.max(0, balance),
      accumulatedPrincipal,
      accumulatedInterest,
    });
  }

  return {
    principal,
    totalInterest: accumulatedInterest,
    totalAmount: principal + accumulatedInterest,
    monthlyPayment,
    installments,
  };
}

/**
 * Calculate SAC amortization (constant principal)
 */
export function calculateSACAmortization(
  principal: number,
  annualRate: number,
  months: number
): LoanCalculation {
  const monthlyRate = annualRate / 12;
  const constantPrincipal = principal / months;
  
  const installments: InstallmentResult[] = [];
  let balance = principal;
  let accumulatedPrincipal = 0;
  let accumulatedInterest = 0;

  for (let i = 1; i <= months; i++) {
    const interest = balance * monthlyRate;
    const total = constantPrincipal + interest;
    balance -= constantPrincipal;
    
    accumulatedPrincipal += constantPrincipal;
    accumulatedInterest += interest;

    installments.push({
      installmentNumber: i,
      principal: constantPrincipal,
      interest,
      total,
      balance: Math.max(0, balance),
      accumulatedPrincipal,
      accumulatedInterest,
    });
  }

  return {
    principal,
    totalInterest: accumulatedInterest,
    totalAmount: principal + accumulatedInterest,
    monthlyPayment: installments[0].total, // First installment (highest)
    installments,
  };
}

// =====================
// Investment Projections
// =====================

/**
 * Project investment growth with monthly deposits
 */
export function projectInvestment(
  initialDeposit: number,
  monthlyDeposit: number,
  annualRate: number,
  months: number
): InvestmentProjection[] {
  const monthlyRate = annualRate / 12;
  const projections: InvestmentProjection[] = [];
  
  let balance = initialDeposit;
  let totalDeposits = initialDeposit;
  let totalInterest = 0;

  for (let i = 1; i <= months; i++) {
    // Add monthly deposit at beginning of month
    const deposit = i === 1 ? initialDeposit : monthlyDeposit;
    if (i > 1) {
      balance += monthlyDeposit;
      totalDeposits += monthlyDeposit;
    }
    
    // Calculate interest for the month
    const interest = balance * monthlyRate;
    balance += interest;
    totalInterest += interest;

    projections.push({
      month: i,
      deposit,
      interest,
      balance,
      totalDeposits,
      totalInterest,
    });
  }

  return projections;
}

/**
 * Calculate time to reach a goal
 */
export function calculateTimeToGoal(
  currentAmount: number,
  goalAmount: number,
  monthlyDeposit: number,
  annualRate: number
): number {
  const monthlyRate = annualRate / 12;
  
  if (monthlyRate === 0) {
    return Math.ceil((goalAmount - currentAmount) / monthlyDeposit);
  }
  
  let balance = currentAmount;
  let months = 0;
  
  while (balance < goalAmount && months < 1200) { // Max 100 years
    balance += monthlyDeposit;
    balance *= (1 + monthlyRate);
    months++;
  }
  
  return months;
}

/**
 * Calculate required monthly deposit to reach goal
 */
export function calculateRequiredDeposit(
  currentAmount: number,
  goalAmount: number,
  annualRate: number,
  months: number
): number {
  const monthlyRate = annualRate / 12;
  
  if (monthlyRate === 0) {
    return (goalAmount - currentAmount) / months;
  }
  
  const fvCurrent = currentAmount * Math.pow(1 + monthlyRate, months);
  const remaining = goalAmount - fvCurrent;
  
  // PMT formula for annuity
  const x = Math.pow(1 + monthlyRate, months);
  return remaining * monthlyRate / (x - 1);
}

// =====================
// Financial Ratios
// =====================

/**
 * Calculate profit margin
 */
export function calculateProfitMargin(revenue: number, profit: number): number {
  if (revenue === 0) return 0;
  return (profit / revenue) * 100;
}

/**
 * Calculate ROI (Return on Investment)
 */
export function calculateROI(gain: number, cost: number): number {
  if (cost === 0) return 0;
  return ((gain - cost) / cost) * 100;
}

/**
 * Calculate break-even point
 */
export function calculateBreakEvenPoint(
  fixedCosts: number,
  pricePerUnit: number,
  variableCostPerUnit: number
): number {
  const contributionMargin = pricePerUnit - variableCostPerUnit;
  if (contributionMargin <= 0) return Infinity;
  return fixedCosts / contributionMargin;
}

/**
 * Calculate DSO (Days Sales Outstanding)
 */
export function calculateDSO(
  accountsReceivable: number,
  netCreditSales: number,
  days: number = 365
): number {
  if (netCreditSales === 0) return 0;
  return (accountsReceivable / netCreditSales) * days;
}

/**
 * Calculate DPO (Days Payable Outstanding)
 */
export function calculateDPO(
  accountsPayable: number,
  costOfGoodsSold: number,
  days: number = 365
): number {
  if (costOfGoodsSold === 0) return 0;
  return (accountsPayable / costOfGoodsSold) * days;
}

// =====================
// Cash Flow Projections
// =====================

interface CashFlowItem {
  date: Date;
  amount: number;
  type: 'receita' | 'despesa';
  description?: string;
}

interface CashFlowProjection {
  date: Date;
  receipts: number;
  expenses: number;
  netFlow: number;
  balance: number;
}

/**
 * Project cash flow
 */
export function projectCashFlow(
  initialBalance: number,
  items: CashFlowItem[],
  startDate: Date,
  days: number
): CashFlowProjection[] {
  const projections: CashFlowProjection[] = [];
  let currentBalance = initialBalance;
  
  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    
    const dayItems = items.filter(
      (item) => item.date.toDateString() === date.toDateString()
    );
    
    const receipts = dayItems
      .filter((item) => item.type === 'receita')
      .reduce((sum, item) => sum + item.amount, 0);
    
    const expenses = dayItems
      .filter((item) => item.type === 'despesa')
      .reduce((sum, item) => sum + item.amount, 0);
    
    const netFlow = receipts - expenses;
    currentBalance += netFlow;
    
    projections.push({
      date,
      receipts,
      expenses,
      netFlow,
      balance: currentBalance,
    });
  }
  
  return projections;
}

// =====================
// Formatting Helpers
// =====================

/**
 * Format currency (BRL)
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

/**
 * Format percentage
 */
export function formatPercentage(value: number, decimals: number = 2): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Convert annual rate to monthly
 */
export function annualToMonthlyRate(annualRate: number): number {
  return Math.pow(1 + annualRate, 1 / 12) - 1;
}

/**
 * Convert monthly rate to annual
 */
export function monthlyToAnnualRate(monthlyRate: number): number {
  return Math.pow(1 + monthlyRate, 12) - 1;
}

export default {
  calculateSimpleInterest,
  calculateCompoundInterest,
  calculateFutureValue,
  calculatePresentValue,
  calculatePMT,
  calculatePriceAmortization,
  calculateSACAmortization,
  projectInvestment,
  calculateTimeToGoal,
  calculateRequiredDeposit,
  calculateProfitMargin,
  calculateROI,
  calculateBreakEvenPoint,
  calculateDSO,
  calculateDPO,
  projectCashFlow,
  formatCurrency,
  formatPercentage,
  annualToMonthlyRate,
  monthlyToAnnualRate,
};
