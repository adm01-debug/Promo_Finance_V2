import { TrendingUp, TrendingDown, DollarSign, CreditCard, Users, Building, AlertCircle, CheckCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: number | string;
  change?: number;
  changeLabel?: string;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'red' | 'yellow' | 'purple';
  format?: 'currency' | 'number' | 'percent';
}

const colorClasses = {
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    icon: 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400',
    border: 'border-l-blue-500',
  },
  green: {
    bg: 'bg-green-50 dark:bg-green-900/20',
    icon: 'bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400',
    border: 'border-l-green-500',
  },
  red: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    icon: 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400',
    border: 'border-l-red-500',
  },
  yellow: {
    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    icon: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-600 dark:text-yellow-400',
    border: 'border-l-yellow-500',
  },
  purple: {
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    icon: 'bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400',
    border: 'border-l-purple-500',
  },
};

function StatCard({ title, value, change, changeLabel, icon, color, format = 'currency' }: StatCardProps) {
  const colors = colorClasses[color];
  
  const formattedValue = format === 'currency' && typeof value === 'number'
    ? formatCurrency(value)
    : format === 'percent' && typeof value === 'number'
    ? `${value.toFixed(1)}%`
    : value;

  return (
    <div className={cn(
      'bg-white dark:bg-gray-800 rounded-lg shadow p-4 border-l-4',
      colors.border
    )}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {formattedValue}
          </p>
          {change !== undefined && (
            <div className="flex items-center gap-1 mt-2">
              {change >= 0 ? (
                <TrendingUp className="w-4 h-4 text-green-500" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-500" />
              )}
              <span className={cn(
                'text-sm font-medium',
                change >= 0 ? 'text-green-600' : 'text-red-600'
              )}>
                {change >= 0 ? '+' : ''}{change.toFixed(1)}%
              </span>
              {changeLabel && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {changeLabel}
                </span>
              )}
            </div>
          )}
        </div>
        <div className={cn('p-3 rounded-lg', colors.icon)}>
          {icon}
        </div>
      </div>
    </div>
  );
}

interface DashboardOverviewProps {
  stats?: {
    saldoAtual?: number;
    totalReceitas?: number;
    totalDespesas?: number;
    contasAReceber?: number;
    contasAPagar?: number;
    contasAtrasadas?: number;
    totalClientes?: number;
    totalFornecedores?: number;
    receitasChange?: number;
    despesasChange?: number;
  };
  isLoading?: boolean;
}

export function DashboardOverview({ stats, isLoading }: DashboardOverviewProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 animate-pulse">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
                <div className="h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
              </div>
              <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const {
    saldoAtual = 0,
    totalReceitas = 0,
    totalDespesas = 0,
    contasAReceber = 0,
    contasAPagar = 0,
    contasAtrasadas = 0,
    totalClientes = 0,
    totalFornecedores = 0,
    receitasChange,
    despesasChange,
  } = stats || {};

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Saldo Atual"
        value={saldoAtual}
        icon={<DollarSign className="w-6 h-6" />}
        color={saldoAtual >= 0 ? 'blue' : 'red'}
      />
      
      <StatCard
        title="Receitas (Mês)"
        value={totalReceitas}
        change={receitasChange}
        changeLabel="vs mês anterior"
        icon={<TrendingUp className="w-6 h-6" />}
        color="green"
      />
      
      <StatCard
        title="Despesas (Mês)"
        value={totalDespesas}
        change={despesasChange}
        changeLabel="vs mês anterior"
        icon={<TrendingDown className="w-6 h-6" />}
        color="red"
      />
      
      <StatCard
        title="A Receber"
        value={contasAReceber}
        icon={<CheckCircle className="w-6 h-6" />}
        color="green"
      />
      
      <StatCard
        title="A Pagar"
        value={contasAPagar}
        icon={<CreditCard className="w-6 h-6" />}
        color="yellow"
      />
      
      <StatCard
        title="Contas Atrasadas"
        value={contasAtrasadas}
        icon={<AlertCircle className="w-6 h-6" />}
        color="red"
        format="number"
      />
      
      <StatCard
        title="Clientes"
        value={totalClientes}
        icon={<Users className="w-6 h-6" />}
        color="purple"
        format="number"
      />
      
      <StatCard
        title="Fornecedores"
        value={totalFornecedores}
        icon={<Building className="w-6 h-6" />}
        color="blue"
        format="number"
      />
    </div>
  );
}

export default DashboardOverview;
