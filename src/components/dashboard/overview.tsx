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
  blue: { bg: 'bg-secondary/10', icon: 'bg-secondary/20 text-secondary', border: 'border-l-secondary' },
  green: { bg: 'bg-success/10', icon: 'bg-success/20 text-success', border: 'border-l-success' },
  red: { bg: 'bg-destructive/10', icon: 'bg-destructive/20 text-destructive', border: 'border-l-destructive' },
  yellow: { bg: 'bg-warning/10', icon: 'bg-warning/20 text-warning', border: 'border-l-warning' },
  purple: { bg: 'bg-primary/10', icon: 'bg-primary/20 text-primary', border: 'border-l-primary' },
};

function StatCard({ title, value, change, changeLabel, icon, color, format = 'currency' }: StatCardProps) {
  const colors = colorClasses[color];
  const formattedValue = format === 'currency' && typeof value === 'number'
    ? formatCurrency(value) : format === 'percent' && typeof value === 'number'
    ? `${value.toFixed(1)}%` : value;

  return (
    <div className={cn('bg-card rounded-lg shadow p-4 border-l-4', colors.border)}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold text-foreground mt-1">{formattedValue}</p>
          {change !== undefined && (
            <div className="flex items-center gap-1 mt-2">
              {change >= 0 ? <TrendingUp className="w-4 h-4 text-success" /> : <TrendingDown className="w-4 h-4 text-destructive" />}
              <span className={cn('text-sm font-medium', change >= 0 ? 'text-success' : 'text-destructive')}>
                {change >= 0 ? '+' : ''}{change.toFixed(1)}%
              </span>
              {changeLabel && <span className="text-xs text-muted-foreground">{changeLabel}</span>}
            </div>
          )}
        </div>
        <div className={cn('p-3 rounded-lg', colors.icon)}>{icon}</div>
      </div>
    </div>
  );
}

interface DashboardOverviewProps {
  stats?: {
    saldoAtual?: number; totalReceitas?: number; totalDespesas?: number;
    contasAReceber?: number; contasAPagar?: number; contasAtrasadas?: number;
    totalClientes?: number; totalFornecedores?: number;
    receitasChange?: number; despesasChange?: number;
  };
  isLoading?: boolean;
}

export function DashboardOverview({ stats, isLoading }: DashboardOverviewProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="bg-card rounded-lg shadow p-4 animate-pulse">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="h-4 w-24 bg-muted rounded mb-2" />
                <div className="h-8 w-32 bg-muted rounded" />
              </div>
              <div className="w-12 h-12 bg-muted rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const {
    saldoAtual = 0, totalReceitas = 0, totalDespesas = 0,
    contasAReceber = 0, contasAPagar = 0, contasAtrasadas = 0,
    totalClientes = 0, totalFornecedores = 0, receitasChange, despesasChange,
  } = stats || {};

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard title="Saldo Atual" value={saldoAtual} icon={<DollarSign className="w-6 h-6" />} color={saldoAtual >= 0 ? 'blue' : 'red'} />
      <StatCard title="Receitas (Mês)" value={totalReceitas} change={receitasChange} changeLabel="vs mês anterior" icon={<TrendingUp className="w-6 h-6" />} color="green" />
      <StatCard title="Despesas (Mês)" value={totalDespesas} change={despesasChange} changeLabel="vs mês anterior" icon={<TrendingDown className="w-6 h-6" />} color="red" />
      <StatCard title="A Receber" value={contasAReceber} icon={<CheckCircle className="w-6 h-6" />} color="green" />
      <StatCard title="A Pagar" value={contasAPagar} icon={<CreditCard className="w-6 h-6" />} color="yellow" />
      <StatCard title="Contas Atrasadas" value={contasAtrasadas} icon={<AlertCircle className="w-6 h-6" />} color="red" format="number" />
      <StatCard title="Clientes" value={totalClientes} icon={<Users className="w-6 h-6" />} color="purple" format="number" />
      <StatCard title="Fornecedores" value={totalFornecedores} icon={<Building className="w-6 h-6" />} color="blue" format="number" />
    </div>
  );
}

export default DashboardOverview;
