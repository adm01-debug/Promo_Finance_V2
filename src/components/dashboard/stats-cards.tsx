import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import {
  ArrowUp,
  ArrowDown,
  Minus,
  TrendingUp,
  TrendingDown,
  DollarSign,
  CreditCard,
  Wallet,
  PiggyBank,
  Receipt,
  Users,
  Building2,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
} from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  trend?: {
    value: number;
    label?: string;
    isPositive?: boolean;
  };
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const variantStyles = {
  default: {
    bg: 'bg-white dark:bg-gray-800',
    icon: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
  },
  success: {
    bg: 'bg-white dark:bg-gray-800',
    icon: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  },
  warning: {
    bg: 'bg-white dark:bg-gray-800',
    icon: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  },
  danger: {
    bg: 'bg-white dark:bg-gray-800',
    icon: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  },
  info: {
    bg: 'bg-white dark:bg-gray-800',
    icon: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  },
};

const sizeStyles = {
  sm: {
    padding: 'p-4',
    iconSize: 'h-8 w-8',
    titleSize: 'text-xs',
    valueSize: 'text-lg',
    iconWrapper: 'p-2',
  },
  md: {
    padding: 'p-5',
    iconSize: 'h-10 w-10',
    titleSize: 'text-sm',
    valueSize: 'text-2xl',
    iconWrapper: 'p-2.5',
  },
  lg: {
    padding: 'p-6',
    iconSize: 'h-12 w-12',
    titleSize: 'text-sm',
    valueSize: 'text-3xl',
    iconWrapper: 'p-3',
  },
};

export function StatCard({
  title,
  value,
  icon,
  trend,
  variant = 'default',
  size = 'md',
  className,
}: StatCardProps) {
  const styles = variantStyles[variant];
  const sizes = sizeStyles[size];

  return (
    <div
      className={cn(
        'rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm',
        styles.bg,
        sizes.padding,
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className={cn('font-medium text-gray-500 dark:text-gray-400', sizes.titleSize)}>
            {title}
          </p>
          <p className={cn('font-bold text-gray-900 dark:text-white mt-1', sizes.valueSize)}>
            {typeof value === 'number' ? value.toLocaleString('pt-BR') : value}
          </p>
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              {trend.value > 0 ? (
                <ArrowUp className="h-3 w-3 text-green-500" />
              ) : trend.value < 0 ? (
                <ArrowDown className="h-3 w-3 text-red-500" />
              ) : (
                <Minus className="h-3 w-3 text-gray-400" />
              )}
              <span
                className={cn(
                  'text-xs font-medium',
                  trend.value > 0
                    ? 'text-green-600 dark:text-green-400'
                    : trend.value < 0
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-gray-500'
                )}
              >
                {Math.abs(trend.value)}%
              </span>
              {trend.label && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {trend.label}
                </span>
              )}
            </div>
          )}
        </div>
        {icon && (
          <div className={cn('rounded-lg', styles.icon, sizes.iconWrapper)}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

// Presets para cards financeiros
export function TotalReceitasCard({
  value,
  trend,
  className,
}: {
  value: number;
  trend?: number;
  className?: string;
}) {
  return (
    <StatCard
      title="Total Receitas"
      value={value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
      icon={<TrendingUp className="h-5 w-5" />}
      variant="success"
      trend={trend ? { value: trend, label: 'vs mês anterior' } : undefined}
      className={className}
    />
  );
}

export function TotalDespesasCard({
  value,
  trend,
  className,
}: {
  value: number;
  trend?: number;
  className?: string;
}) {
  return (
    <StatCard
      title="Total Despesas"
      value={value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
      icon={<TrendingDown className="h-5 w-5" />}
      variant="danger"
      trend={trend ? { value: trend, label: 'vs mês anterior', isPositive: trend < 0 } : undefined}
      className={className}
    />
  );
}

export function SaldoCard({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  return (
    <StatCard
      title="Saldo Atual"
      value={value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
      icon={<Wallet className="h-5 w-5" />}
      variant={value >= 0 ? 'info' : 'danger'}
      className={className}
    />
  );
}

export function ContasPagarCard({
  total,
  vencidas,
  className,
}: {
  total: number;
  vencidas?: number;
  className?: string;
}) {
  return (
    <StatCard
      title="Contas a Pagar"
      value={total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
      icon={<Receipt className="h-5 w-5" />}
      variant={vencidas && vencidas > 0 ? 'warning' : 'default'}
      trend={vencidas ? { value: vencidas, label: 'vencidas' } : undefined}
      className={className}
    />
  );
}

export function ContasReceberCard({
  total,
  vencidas,
  className,
}: {
  total: number;
  vencidas?: number;
  className?: string;
}) {
  return (
    <StatCard
      title="Contas a Receber"
      value={total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
      icon={<DollarSign className="h-5 w-5" />}
      variant="info"
      trend={vencidas ? { value: vencidas, label: 'vencidas' } : undefined}
      className={className}
    />
  );
}

export function ClientesCard({
  total,
  novos,
  className,
}: {
  total: number;
  novos?: number;
  className?: string;
}) {
  return (
    <StatCard
      title="Clientes"
      value={total}
      icon={<Users className="h-5 w-5" />}
      variant="info"
      trend={novos ? { value: novos, label: 'novos este mês' } : undefined}
      className={className}
    />
  );
}

export function FornecedoresCard({
  total,
  className,
}: {
  total: number;
  className?: string;
}) {
  return (
    <StatCard
      title="Fornecedores"
      value={total}
      icon={<Building2 className="h-5 w-5" />}
      variant="default"
      className={className}
    />
  );
}

// Grid de stats
interface DashboardStatsProps {
  children: ReactNode;
  columns?: 2 | 3 | 4;
  className?: string;
}

export function DashboardStats({
  children,
  columns = 4,
  className,
}: DashboardStatsProps) {
  const gridCols = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div className={cn('grid gap-4', gridCols[columns], className)}>
      {children}
    </div>
  );
}

export default StatCard;
