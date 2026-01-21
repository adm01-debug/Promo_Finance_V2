import { useMemo, useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  AlertTriangle,
  ArrowRight,
  Filter,
  Download,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/financial-calculations';

// Types
interface CashFlowEntry {
  id: string;
  date: Date;
  description: string;
  category: string;
  type: 'income' | 'expense';
  amount: number;
  status: 'confirmed' | 'pending' | 'projected';
  recurrence?: 'weekly' | 'monthly' | 'yearly';
}

interface DailyBalance {
  date: Date;
  income: number;
  expenses: number;
  balance: number;
  runningBalance: number;
  entries: CashFlowEntry[];
  isNegative: boolean;
}

interface CashFlowProjectionProps {
  entries: CashFlowEntry[];
  initialBalance?: number;
  daysToProject?: number;
  showDetails?: boolean;
  onEntryClick?: (entry: CashFlowEntry) => void;
  className?: string;
}

export function CashFlowProjection({
  entries,
  initialBalance = 0,
  daysToProject = 30,
  showDetails = true,
  onEntryClick,
  className,
}: CashFlowProjectionProps) {
  const [viewMode, setViewMode] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [showOnlyNegative, setShowOnlyNegative] = useState(false);

  // Calculate daily balances
  const projection = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + daysToProject);

    const dailyData: Map<string, DailyBalance> = new Map();
    let runningBalance = initialBalance;

    // Initialize all days
    for (let d = new Date(today); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateKey = d.toISOString().split('T')[0];
      dailyData.set(dateKey, {
        date: new Date(d),
        income: 0,
        expenses: 0,
        balance: 0,
        runningBalance: 0,
        entries: [],
        isNegative: false,
      });
    }

    // Expand recurring entries
    const expandedEntries: CashFlowEntry[] = [];
    entries.forEach(entry => {
      if (entry.recurrence) {
        let nextDate = new Date(entry.date);
        while (nextDate <= endDate) {
          if (nextDate >= today) {
            expandedEntries.push({
              ...entry,
              id: `${entry.id}-${nextDate.toISOString()}`,
              date: new Date(nextDate),
              status: nextDate.getTime() === entry.date.getTime() ? entry.status : 'projected',
            });
          }
          // Move to next occurrence
          switch (entry.recurrence) {
            case 'weekly':
              nextDate.setDate(nextDate.getDate() + 7);
              break;
            case 'monthly':
              nextDate.setMonth(nextDate.getMonth() + 1);
              break;
            case 'yearly':
              nextDate.setFullYear(nextDate.getFullYear() + 1);
              break;
          }
        }
      } else {
        if (entry.date >= today && entry.date <= endDate) {
          expandedEntries.push(entry);
        }
      }
    });

    // Group entries by date
    expandedEntries.forEach(entry => {
      const dateKey = entry.date.toISOString().split('T')[0];
      const dayData = dailyData.get(dateKey);
      if (dayData) {
        dayData.entries.push(entry);
        if (entry.type === 'income') {
          dayData.income += entry.amount;
        } else {
          dayData.expenses += entry.amount;
        }
      }
    });

    // Calculate running balances
    const result: DailyBalance[] = [];
    dailyData.forEach((dayData, dateKey) => {
      dayData.balance = dayData.income - dayData.expenses;
      runningBalance += dayData.balance;
      dayData.runningBalance = runningBalance;
      dayData.isNegative = runningBalance < 0;
      result.push(dayData);
    });

    return result;
  }, [entries, initialBalance, daysToProject]);

  // Summary stats
  const summary = useMemo(() => {
    const totalIncome = projection.reduce((sum, d) => sum + d.income, 0);
    const totalExpenses = projection.reduce((sum, d) => sum + d.expenses, 0);
    const negativeDays = projection.filter(d => d.isNegative).length;
    const lowestBalance = Math.min(...projection.map(d => d.runningBalance));
    const highestBalance = Math.max(...projection.map(d => d.runningBalance));
    const finalBalance = projection[projection.length - 1]?.runningBalance || initialBalance;

    return {
      totalIncome,
      totalExpenses,
      netFlow: totalIncome - totalExpenses,
      negativeDays,
      lowestBalance,
      highestBalance,
      finalBalance,
    };
  }, [projection, initialBalance]);

  // Filter data for display
  const displayData = useMemo(() => {
    let data = projection;
    if (showOnlyNegative) {
      data = data.filter(d => d.isNegative);
    }
    return data;
  }, [projection, showOnlyNegative]);

  // Group data by week/month if needed
  const groupedData = useMemo(() => {
    if (viewMode === 'daily') return displayData;

    const groups = new Map<string, DailyBalance>();
    
    displayData.forEach(day => {
      let groupKey: string;
      const date = new Date(day.date);
      
      if (viewMode === 'weekly') {
        // Get week start (Sunday)
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        groupKey = weekStart.toISOString().split('T')[0];
      } else {
        // Monthly
        groupKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }

      const existing = groups.get(groupKey);
      if (existing) {
        existing.income += day.income;
        existing.expenses += day.expenses;
        existing.balance += day.balance;
        existing.entries.push(...day.entries);
        existing.runningBalance = day.runningBalance;
        existing.isNegative = existing.isNegative || day.isNegative;
      } else {
        groups.set(groupKey, {
          date: day.date,
          income: day.income,
          expenses: day.expenses,
          balance: day.balance,
          runningBalance: day.runningBalance,
          entries: [...day.entries],
          isNegative: day.isNegative,
        });
      }
    });

    return Array.from(groups.values());
  }, [displayData, viewMode]);

  return (
    <div className={cn('space-y-6', className)}>
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard
          label="Total Entradas"
          value={summary.totalIncome}
          icon={<TrendingUp className="w-5 h-5" />}
          color="green"
        />
        <SummaryCard
          label="Total Saídas"
          value={summary.totalExpenses}
          icon={<TrendingDown className="w-5 h-5" />}
          color="red"
        />
        <SummaryCard
          label="Saldo Final"
          value={summary.finalBalance}
          icon={<Calendar className="w-5 h-5" />}
          color={summary.finalBalance >= 0 ? 'blue' : 'red'}
        />
        {summary.negativeDays > 0 && (
          <SummaryCard
            label="Dias no Vermelho"
            value={summary.negativeDays}
            isCurrency={false}
            icon={<AlertTriangle className="w-5 h-5" />}
            color="yellow"
          />
        )}
      </div>

      {/* Balance Range */}
      <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
        <div className="flex items-center justify-between text-sm">
          <div>
            <span className="text-gray-500">Saldo Mínimo</span>
            <p className={cn(
              'text-lg font-bold',
              summary.lowestBalance < 0 ? 'text-red-600' : 'text-gray-900 dark:text-white'
            )}>
              {formatCurrency(summary.lowestBalance)}
            </p>
          </div>
          <ArrowRight className="w-5 h-5 text-gray-400" />
          <div className="text-right">
            <span className="text-gray-500">Saldo Máximo</span>
            <p className="text-lg font-bold text-green-600">
              {formatCurrency(summary.highestBalance)}
            </p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('daily')}
            className={cn(
              'px-3 py-1.5 text-sm rounded-lg transition-colors',
              viewMode === 'daily'
                ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
            )}
          >
            Diário
          </button>
          <button
            onClick={() => setViewMode('weekly')}
            className={cn(
              'px-3 py-1.5 text-sm rounded-lg transition-colors',
              viewMode === 'weekly'
                ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
            )}
          >
            Semanal
          </button>
          <button
            onClick={() => setViewMode('monthly')}
            className={cn(
              'px-3 py-1.5 text-sm rounded-lg transition-colors',
              viewMode === 'monthly'
                ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
            )}
          >
            Mensal
          </button>
        </div>
        
        <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <input
            type="checkbox"
            checked={showOnlyNegative}
            onChange={(e) => setShowOnlyNegative(e.target.checked)}
            className="rounded border-gray-300"
          />
          Apenas dias no vermelho
        </label>
      </div>

      {/* Projection Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900/50">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Data
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Entradas
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Saídas
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Saldo Dia
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Saldo Acumulado
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {groupedData.map((day, index) => (
                <TableRow
                  key={index}
                  day={day}
                  viewMode={viewMode}
                  showDetails={showDetails}
                  onEntryClick={onEntryClick}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Summary Card Component
interface SummaryCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: 'green' | 'red' | 'blue' | 'yellow';
  isCurrency?: boolean;
}

function SummaryCard({ label, value, icon, color, isCurrency = true }: SummaryCardProps) {
  const colors = {
    green: 'bg-green-50 dark:bg-green-900/20 text-green-600',
    red: 'bg-red-50 dark:bg-red-900/20 text-red-600',
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600',
    yellow: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600',
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
      <div className={cn('inline-flex p-2 rounded-lg mb-2', colors[color])}>
        {icon}
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">
        {isCurrency ? formatCurrency(value) : value}
      </p>
    </div>
  );
}

// Table Row Component
interface TableRowProps {
  day: DailyBalance;
  viewMode: 'daily' | 'weekly' | 'monthly';
  showDetails: boolean;
  onEntryClick?: (entry: CashFlowEntry) => void;
}

function TableRow({ day, viewMode, showDetails, onEntryClick }: TableRowProps) {
  const [expanded, setExpanded] = useState(false);

  const formatDate = (date: Date) => {
    if (viewMode === 'monthly') {
      return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    }
    if (viewMode === 'weekly') {
      const weekEnd = new Date(date);
      weekEnd.setDate(weekEnd.getDate() + 6);
      return `${date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} - ${weekEnd.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}`;
    }
    return date.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' });
  };

  return (
    <>
      <tr
        className={cn(
          'hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors',
          day.isNegative && 'bg-red-50/50 dark:bg-red-900/10',
          showDetails && day.entries.length > 0 && 'cursor-pointer'
        )}
        onClick={() => showDetails && day.entries.length > 0 && setExpanded(!expanded)}
      >
        <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
          {formatDate(day.date)}
          {showDetails && day.entries.length > 0 && (
            <span className="ml-2 text-xs text-gray-400">
              ({day.entries.length})
            </span>
          )}
        </td>
        <td className="px-4 py-3 text-sm text-right text-green-600 font-medium">
          {day.income > 0 ? formatCurrency(day.income) : '-'}
        </td>
        <td className="px-4 py-3 text-sm text-right text-red-600 font-medium">
          {day.expenses > 0 ? formatCurrency(day.expenses) : '-'}
        </td>
        <td className={cn(
          'px-4 py-3 text-sm text-right font-medium',
          day.balance >= 0 ? 'text-green-600' : 'text-red-600'
        )}>
          {formatCurrency(day.balance)}
        </td>
        <td className={cn(
          'px-4 py-3 text-sm text-right font-bold',
          day.runningBalance >= 0 ? 'text-gray-900 dark:text-white' : 'text-red-600'
        )}>
          {formatCurrency(day.runningBalance)}
        </td>
      </tr>
      {expanded && day.entries.map((entry) => (
        <tr
          key={entry.id}
          className="bg-gray-50/50 dark:bg-gray-900/30"
          onClick={(e) => {
            e.stopPropagation();
            onEntryClick?.(entry);
          }}
        >
          <td className="px-4 py-2 pl-8 text-xs text-gray-600 dark:text-gray-400">
            {entry.description}
            <span className={cn(
              'ml-2 px-1.5 py-0.5 rounded text-[10px]',
              entry.status === 'confirmed' && 'bg-green-100 text-green-700',
              entry.status === 'pending' && 'bg-yellow-100 text-yellow-700',
              entry.status === 'projected' && 'bg-gray-100 text-gray-600'
            )}>
              {entry.status === 'confirmed' ? 'Confirmado' : entry.status === 'pending' ? 'Pendente' : 'Projetado'}
            </span>
          </td>
          <td className="px-4 py-2 text-xs text-right text-green-600">
            {entry.type === 'income' ? formatCurrency(entry.amount) : ''}
          </td>
          <td className="px-4 py-2 text-xs text-right text-red-600">
            {entry.type === 'expense' ? formatCurrency(entry.amount) : ''}
          </td>
          <td colSpan={2}></td>
        </tr>
      ))}
    </>
  );
}

export type { CashFlowEntry, DailyBalance };
export default CashFlowProjection;
