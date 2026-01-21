import { cn } from '@/lib/utils';
import {
  ArrowUpRight,
  ArrowDownLeft,
  MoreHorizontal,
  Eye,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
} from 'lucide-react';

type TransactionType = 'receita' | 'despesa';
type TransactionStatus = 'pendente' | 'pago' | 'vencido' | 'cancelado';

interface Transaction {
  id: string;
  description: string;
  value: number;
  type: TransactionType;
  status: TransactionStatus;
  date: string;
  category?: string;
  entity?: string; // Cliente ou Fornecedor
}

interface RecentTransactionsProps {
  transactions: Transaction[];
  title?: string;
  maxItems?: number;
  onViewAll?: () => void;
  onViewTransaction?: (id: string) => void;
  className?: string;
}

const statusConfig = {
  pendente: {
    label: 'Pendente',
    icon: Clock,
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-100 dark:bg-amber-900/30',
  },
  pago: {
    label: 'Pago',
    icon: CheckCircle,
    color: 'text-green-600 dark:text-green-400',
    bg: 'bg-green-100 dark:bg-green-900/30',
  },
  vencido: {
    label: 'Vencido',
    icon: AlertTriangle,
    color: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-100 dark:bg-red-900/30',
  },
  cancelado: {
    label: 'Cancelado',
    icon: XCircle,
    color: 'text-gray-600 dark:text-gray-400',
    bg: 'bg-gray-100 dark:bg-gray-700',
  },
};

export function RecentTransactions({
  transactions,
  title = 'Transações Recentes',
  maxItems = 5,
  onViewAll,
  onViewTransaction,
  className,
}: RecentTransactionsProps) {
  const displayedTransactions = transactions.slice(0, maxItems);

  return (
    <div
      className={cn(
        'bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700',
        className
      )}
    >
      <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-white">{title}</h3>
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
          >
            Ver todas
          </button>
        )}
      </div>

      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {displayedTransactions.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            <p>Nenhuma transação encontrada</p>
          </div>
        ) : (
          displayedTransactions.map((transaction) => (
            <TransactionItem
              key={transaction.id}
              transaction={transaction}
              onView={onViewTransaction}
            />
          ))
        )}
      </div>
    </div>
  );
}

interface TransactionItemProps {
  transaction: Transaction;
  onView?: (id: string) => void;
}

function TransactionItem({ transaction, onView }: TransactionItemProps) {
  const isReceita = transaction.type === 'receita';
  const status = statusConfig[transaction.status];
  const StatusIcon = status.icon;

  return (
    <div className="flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
      {/* Icon */}
      <div
        className={cn(
          'flex-shrink-0 p-2 rounded-lg',
          isReceita
            ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
            : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
        )}
      >
        {isReceita ? (
          <ArrowDownLeft className="h-5 w-5" />
        ) : (
          <ArrowUpRight className="h-5 w-5" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium text-gray-900 dark:text-white truncate">
            {transaction.description}
          </p>
          <span className={cn('flex items-center gap-1 px-2 py-0.5 rounded-full text-xs', status.bg, status.color)}>
            <StatusIcon className="h-3 w-3" />
            {status.label}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-1">
          {transaction.entity && (
            <span className="text-sm text-gray-500 dark:text-gray-400 truncate">
              {transaction.entity}
            </span>
          )}
          {transaction.category && (
            <>
              <span className="text-gray-300 dark:text-gray-600">•</span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {transaction.category}
              </span>
            </>
          )}
          <span className="text-gray-300 dark:text-gray-600">•</span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {transaction.date}
          </span>
        </div>
      </div>

      {/* Value */}
      <div className="flex-shrink-0 text-right">
        <p
          className={cn(
            'font-semibold',
            isReceita
              ? 'text-green-600 dark:text-green-400'
              : 'text-red-600 dark:text-red-400'
          )}
        >
          {isReceita ? '+' : '-'}{' '}
          {transaction.value.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL',
          })}
        </p>
      </div>

      {/* Actions */}
      {onView && (
        <button
          onClick={() => onView(transaction.id)}
          className="flex-shrink-0 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <Eye className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

// Lista simplificada de transações
interface SimpleTransactionListProps {
  transactions: Array<{
    id: string;
    description: string;
    value: number;
    type: 'receita' | 'despesa';
    date: string;
  }>;
  className?: string;
}

export function SimpleTransactionList({
  transactions,
  className,
}: SimpleTransactionListProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {transactions.map((t) => (
        <div
          key={t.id}
          className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
        >
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'p-1.5 rounded',
                t.type === 'receita'
                  ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
              )}
            >
              {t.type === 'receita' ? (
                <ArrowDownLeft className="h-4 w-4" />
              ) : (
                <ArrowUpRight className="h-4 w-4" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {t.description}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{t.date}</p>
            </div>
          </div>
          <p
            className={cn(
              'text-sm font-semibold',
              t.type === 'receita'
                ? 'text-green-600 dark:text-green-400'
                : 'text-red-600 dark:text-red-400'
            )}
          >
            {t.type === 'receita' ? '+' : '-'}{' '}
            {t.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </p>
        </div>
      ))}
    </div>
  );
}

export default RecentTransactions;
