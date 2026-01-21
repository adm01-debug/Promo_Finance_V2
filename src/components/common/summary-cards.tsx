import { ReactNode } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  CreditCard, 
  ArrowUpCircle, 
  ArrowDownCircle,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import { cn } from '@/lib/utils';
import { StatTrend } from './stat-trend';

interface SummaryCardProps {
  title: string;
  value: number | string;
  change?: number;
  changeLabel?: string;
  icon?: ReactNode;
  variant?: 'default' | 'success' | 'danger' | 'warning' | 'info';
  loading?: boolean;
  className?: string;
}

const variantStyles = {
  default: {
    bg: 'bg-gray-100 dark:bg-gray-700',
    icon: 'text-gray-600 dark:text-gray-400',
    value: 'text-gray-900 dark:text-white',
  },
  success: {
    bg: 'bg-green-100 dark:bg-green-900/30',
    icon: 'text-green-600 dark:text-green-400',
    value: 'text-green-600 dark:text-green-400',
  },
  danger: {
    bg: 'bg-red-100 dark:bg-red-900/30',
    icon: 'text-red-600 dark:text-red-400',
    value: 'text-red-600 dark:text-red-400',
  },
  warning: {
    bg: 'bg-yellow-100 dark:bg-yellow-900/30',
    icon: 'text-yellow-600 dark:text-yellow-400',
    value: 'text-yellow-600 dark:text-yellow-400',
  },
  info: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    icon: 'text-blue-600 dark:text-blue-400',
    value: 'text-blue-600 dark:text-blue-400',
  },
};

export function SummaryCard({
  title,
  value,
  change,
  changeLabel,
  icon,
  variant = 'default',
  loading = false,
  className,
}: SummaryCardProps) {
  const styles = variantStyles[variant];

  if (loading) {
    return (
      <div className={cn('bg-white dark:bg-gray-800 rounded-lg shadow p-4', className)}>
        <div className="animate-pulse">
          <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded mb-3"></div>
          <div className="h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('bg-white dark:bg-gray-800 rounded-lg shadow p-4', className)}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
          <p className={cn('text-2xl font-bold mt-1', styles.value)}>
            {typeof value === 'number' ? formatCurrency(value) : value}
          </p>
          {change !== undefined && (
            <div className="mt-2">
              <StatTrend 
                value={change} 
                label={changeLabel} 
                inverted={variant === 'danger'}
                size="sm"
              />
            </div>
          )}
        </div>
        {icon && (
          <div className={cn('p-2 rounded-lg', styles.bg)}>
            <div className={styles.icon}>{icon}</div>
          </div>
        )}
      </div>
    </div>
  );
}

// Pre-configured summary cards
interface FinancialSummaryProps {
  totalReceitas: number;
  totalDespesas: number;
  saldo: number;
  receitasPendentes?: number;
  despesasPendentes?: number;
  contasAtrasadas?: number;
  loading?: boolean;
  className?: string;
}

export function FinancialSummary({
  totalReceitas,
  totalDespesas,
  saldo,
  receitasPendentes,
  despesasPendentes,
  contasAtrasadas,
  loading = false,
  className,
}: FinancialSummaryProps) {
  return (
    <div className={cn('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4', className)}>
      <SummaryCard
        title="Total Receitas"
        value={totalReceitas}
        icon={<ArrowUpCircle className="w-6 h-6" />}
        variant="success"
        loading={loading}
      />
      <SummaryCard
        title="Total Despesas"
        value={totalDespesas}
        icon={<ArrowDownCircle className="w-6 h-6" />}
        variant="danger"
        loading={loading}
      />
      <SummaryCard
        title="Saldo"
        value={saldo}
        icon={<DollarSign className="w-6 h-6" />}
        variant={saldo >= 0 ? 'info' : 'danger'}
        loading={loading}
      />
      {contasAtrasadas !== undefined && (
        <SummaryCard
          title="Contas Atrasadas"
          value={contasAtrasadas}
          icon={<AlertTriangle className="w-6 h-6" />}
          variant={contasAtrasadas > 0 ? 'warning' : 'default'}
          loading={loading}
        />
      )}
    </div>
  );
}

// Compact summary for dashboard widgets
interface CompactSummaryProps {
  items: {
    label: string;
    value: number | string;
    color?: string;
  }[];
  className?: string;
}

export function CompactSummary({ items, className }: CompactSummaryProps) {
  return (
    <div className={cn('flex items-center divide-x divide-gray-200 dark:divide-gray-700', className)}>
      {items.map((item, index) => (
        <div key={index} className={cn('px-4 text-center', index === 0 && 'pl-0')}>
          <p className="text-xs text-gray-500 dark:text-gray-400">{item.label}</p>
          <p 
            className={cn(
              'text-lg font-semibold',
              item.color || 'text-gray-900 dark:text-white'
            )}
          >
            {typeof item.value === 'number' ? formatCurrency(item.value) : item.value}
          </p>
        </div>
      ))}
    </div>
  );
}

// Upcoming payments/receipts summary
interface UpcomingSummaryProps {
  title: string;
  items: {
    id: string;
    descricao: string;
    valor: number;
    vencimento: string;
    status: string;
  }[];
  emptyMessage?: string;
  onItemClick?: (id: string) => void;
  className?: string;
}

export function UpcomingSummary({
  title,
  items,
  emptyMessage = 'Nenhum item próximo',
  onItemClick,
  className,
}: UpcomingSummaryProps) {
  return (
    <div className={cn('bg-white dark:bg-gray-800 rounded-lg shadow', className)}>
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Clock className="w-5 h-5 text-gray-400" />
          {title}
        </h3>
      </div>
      <div className="p-4">
        {items.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
            {emptyMessage}
          </p>
        ) : (
          <div className="space-y-3">
            {items.slice(0, 5).map((item) => (
              <div
                key={item.id}
                onClick={() => onItemClick?.(item.id)}
                className={cn(
                  'flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors',
                  onItemClick && 'cursor-pointer'
                )}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {item.descricao}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Vencimento: {item.vencimento}
                  </p>
                </div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white ml-4">
                  {formatCurrency(item.valor)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default SummaryCard;
