import { useState, useMemo } from 'react';
import {
  Repeat,
  Calendar,
  Clock,
  Plus,
  Edit2,
  Trash2,
  Pause,
  Play,
  AlertCircle,
  CheckCircle,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/financial-calculations';
import { Button } from '@/components/ui/button';

// Types
type RecurrenceFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly';

interface RecurringTransaction {
  id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  categoryColor?: string;
  frequency: RecurrenceFrequency;
  dayOfMonth?: number; // For monthly
  dayOfWeek?: number; // For weekly (0-6)
  startDate: Date;
  endDate?: Date;
  lastExecuted?: Date;
  nextExecution: Date;
  isActive: boolean;
  totalExecutions?: number;
  notes?: string;
}

interface RecurringTransactionManagerProps {
  transactions: RecurringTransaction[];
  onAdd?: () => void;
  onEdit?: (transaction: RecurringTransaction) => void;
  onDelete?: (id: string) => void;
  onToggle?: (id: string, active: boolean) => void;
  onExecuteNow?: (transaction: RecurringTransaction) => void;
  className?: string;
}

// Frequency labels
const frequencyLabels: Record<RecurrenceFrequency, string> = {
  daily: 'Diário',
  weekly: 'Semanal',
  biweekly: 'Quinzenal',
  monthly: 'Mensal',
  quarterly: 'Trimestral',
  yearly: 'Anual',
};

// Day of week labels
const dayOfWeekLabels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export function RecurringTransactionManager({
  transactions,
  onAdd,
  onEdit,
  onDelete,
  onToggle,
  onExecuteNow,
  className,
}: RecurringTransactionManagerProps) {
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [showInactive, setShowInactive] = useState(false);

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      if (!showInactive && !t.isActive) return false;
      if (filter === 'income' && t.type !== 'income') return false;
      if (filter === 'expense' && t.type !== 'expense') return false;
      return true;
    });
  }, [transactions, filter, showInactive]);

  // Calculate summary
  const summary = useMemo(() => {
    const active = transactions.filter(t => t.isActive);
    
    const monthlyIncome = active
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + getMonthlyAmount(t), 0);
    
    const monthlyExpenses = active
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + getMonthlyAmount(t), 0);

    const upcomingThisWeek = active.filter(t => {
      const daysDiff = Math.ceil(
        (t.nextExecution.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      return daysDiff >= 0 && daysDiff <= 7;
    });

    return {
      totalActive: active.length,
      totalInactive: transactions.length - active.length,
      monthlyIncome,
      monthlyExpenses,
      monthlyNet: monthlyIncome - monthlyExpenses,
      upcomingThisWeek,
    };
  }, [transactions]);

  return (
    <div className={cn('space-y-6', className)}>
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard
          label="Receitas Mensais"
          value={summary.monthlyIncome}
          color="green"
        />
        <SummaryCard
          label="Despesas Mensais"
          value={summary.monthlyExpenses}
          color="red"
        />
        <SummaryCard
          label="Saldo Mensal"
          value={summary.monthlyNet}
          color={summary.monthlyNet >= 0 ? 'blue' : 'red'}
        />
        <SummaryCard
          label="Próximos 7 dias"
          value={summary.upcomingThisWeek.length}
          isCurrency={false}
          color="purple"
        />
      </div>

      {/* Upcoming This Week */}
      {summary.upcomingThisWeek.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4">
          <h3 className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Próximos 7 dias
          </h3>
          <div className="space-y-2">
            {summary.upcomingThisWeek.slice(0, 5).map(t => (
              <div
                key={t.id}
                className="flex items-center justify-between text-sm"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: t.categoryColor || '#6b7280' }}
                  />
                  <span className="text-gray-700 dark:text-gray-300">{t.description}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-gray-500">
                    {t.nextExecution.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' })}
                  </span>
                  <span className={t.type === 'income' ? 'text-green-600' : 'text-red-600'}>
                    {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilter('all')}
            className={cn(
              'px-3 py-1.5 text-sm rounded-lg transition-colors',
              filter === 'all'
                ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            )}
          >
            Todos
          </button>
          <button
            onClick={() => setFilter('income')}
            className={cn(
              'px-3 py-1.5 text-sm rounded-lg transition-colors',
              filter === 'income'
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            )}
          >
            Receitas
          </button>
          <button
            onClick={() => setFilter('expense')}
            className={cn(
              'px-3 py-1.5 text-sm rounded-lg transition-colors',
              filter === 'expense'
                ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            )}
          >
            Despesas
          </button>
        </div>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="rounded border-gray-300"
            />
            Mostrar inativos
          </label>

          {onAdd && (
            <Button onClick={onAdd} size="sm">
              <Plus className="w-4 h-4 mr-1" />
              Nova Recorrência
            </Button>
          )}
        </div>
      </div>

      {/* Transactions List */}
      <div className="space-y-3">
        {filteredTransactions.map(transaction => (
          <TransactionCard
            key={transaction.id}
            transaction={transaction}
            onEdit={() => onEdit?.(transaction)}
            onDelete={() => onDelete?.(transaction.id)}
            onToggle={() => onToggle?.(transaction.id, !transaction.isActive)}
            onExecuteNow={() => onExecuteNow?.(transaction)}
          />
        ))}

        {filteredTransactions.length === 0 && (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <Repeat className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Nenhuma transação recorrente encontrada</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Summary Card
interface SummaryCardProps {
  label: string;
  value: number;
  color: 'green' | 'red' | 'blue' | 'purple';
  isCurrency?: boolean;
}

function SummaryCard({ label, value, color, isCurrency = true }: SummaryCardProps) {
  const colors = {
    green: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
    red: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
    blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
    purple: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800',
  };

  return (
    <div className={cn('rounded-xl p-4 border', colors[color])}>
      <p className="text-sm text-gray-600 dark:text-gray-400">{label}</p>
      <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">
        {isCurrency ? formatCurrency(value) : value}
      </p>
    </div>
  );
}

// Transaction Card
interface TransactionCardProps {
  transaction: RecurringTransaction;
  onEdit?: () => void;
  onDelete?: () => void;
  onToggle?: () => void;
  onExecuteNow?: () => void;
}

function TransactionCard({
  transaction,
  onEdit,
  onDelete,
  onToggle,
  onExecuteNow,
}: TransactionCardProps) {
  const [showActions, setShowActions] = useState(false);

  const frequencyText = getFrequencyText(transaction);
  const daysUntilNext = Math.ceil(
    (transaction.nextExecution.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div
      className={cn(
        'bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4',
        !transaction.isActive && 'opacity-60'
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          {/* Category indicator */}
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{
              backgroundColor: transaction.categoryColor
                ? `${transaction.categoryColor}20`
                : '#e5e7eb',
            }}
          >
            <Repeat
              className="w-5 h-5"
              style={{ color: transaction.categoryColor || '#6b7280' }}
            />
          </div>

          {/* Info */}
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-medium text-gray-900 dark:text-white">
                {transaction.description}
              </h4>
              {!transaction.isActive && (
                <span className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">
                  Pausado
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400">
              <span>{transaction.category}</span>
              <span>•</span>
              <span>{frequencyText}</span>
            </div>
          </div>
        </div>

        {/* Amount */}
        <div className="text-right">
          <p className={cn(
            'text-lg font-bold',
            transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
          )}>
            {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {formatCurrency(getMonthlyAmount(transaction))}/mês
          </p>
        </div>
      </div>

      {/* Next execution */}
      <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span className="text-gray-600 dark:text-gray-400">
            Próxima:{' '}
            <span className="font-medium text-gray-900 dark:text-white">
              {transaction.nextExecution.toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: 'short',
              })}
            </span>
          </span>
          {daysUntilNext <= 3 && daysUntilNext >= 0 && (
            <span className="px-1.5 py-0.5 text-xs bg-amber-100 text-amber-700 rounded">
              {daysUntilNext === 0 ? 'Hoje' : daysUntilNext === 1 ? 'Amanhã' : `Em ${daysUntilNext} dias`}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className={cn(
          'flex items-center gap-1 transition-opacity',
          showActions ? 'opacity-100' : 'opacity-0'
        )}>
          {onExecuteNow && transaction.isActive && (
            <button
              onClick={onExecuteNow}
              className="p-1.5 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded text-blue-600"
              title="Executar agora"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
          {onToggle && (
            <button
              onClick={onToggle}
              className={cn(
                'p-1.5 rounded',
                transaction.isActive
                  ? 'hover:bg-amber-100 dark:hover:bg-amber-900/20 text-amber-600'
                  : 'hover:bg-green-100 dark:hover:bg-green-900/20 text-green-600'
              )}
              title={transaction.isActive ? 'Pausar' : 'Ativar'}
            >
              {transaction.isActive ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4" />
              )}
            </button>
          )}
          {onEdit && (
            <button
              onClick={onEdit}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-600"
              title="Editar"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={onDelete}
              className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/20 rounded text-red-600"
              title="Excluir"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper functions
function getFrequencyText(t: RecurringTransaction): string {
  switch (t.frequency) {
    case 'daily':
      return 'Todo dia';
    case 'weekly':
      return `Toda ${t.dayOfWeek !== undefined ? dayOfWeekLabels[t.dayOfWeek] : 'semana'}`;
    case 'biweekly':
      return 'A cada 15 dias';
    case 'monthly':
      return t.dayOfMonth ? `Todo dia ${t.dayOfMonth}` : 'Todo mês';
    case 'quarterly':
      return 'A cada 3 meses';
    case 'yearly':
      return 'Anual';
    default:
      return frequencyLabels[t.frequency];
  }
}

function getMonthlyAmount(t: RecurringTransaction): number {
  switch (t.frequency) {
    case 'daily':
      return t.amount * 30;
    case 'weekly':
      return t.amount * 4;
    case 'biweekly':
      return t.amount * 2;
    case 'monthly':
      return t.amount;
    case 'quarterly':
      return t.amount / 3;
    case 'yearly':
      return t.amount / 12;
    default:
      return t.amount;
  }
}

export type { RecurringTransaction, RecurrenceFrequency };
export default RecurringTransactionManager;
