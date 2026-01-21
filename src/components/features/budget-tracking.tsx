import { useState } from 'react';
import { 
  Target, 
  Plus, 
  Edit, 
  Trash2, 
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Calendar,
  DollarSign
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { format, differenceInDays, isAfter, isBefore } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type BudgetType = 'income' | 'expense' | 'savings';
type BudgetPeriod = 'monthly' | 'quarterly' | 'yearly' | 'custom';
type BudgetStatus = 'on_track' | 'at_risk' | 'exceeded' | 'completed';

interface Budget {
  id: string;
  name: string;
  description?: string;
  type: BudgetType;
  category?: string;
  categoryColor?: string;
  targetAmount: number;
  currentAmount: number;
  period: BudgetPeriod;
  startDate: Date;
  endDate: Date;
  alertThreshold?: number; // Percentage (e.g., 80 = alert at 80%)
  status: BudgetStatus;
}

interface BudgetTrackingProps {
  budgets: Budget[];
  onAdd: () => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  className?: string;
}

const typeConfig: Record<BudgetType, {
  label: string;
  color: string;
  bgColor: string;
  icon: typeof Target;
}> = {
  income: {
    label: 'Receita',
    color: 'text-green-600',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    icon: TrendingUp,
  },
  expense: {
    label: 'Despesa',
    color: 'text-red-600',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    icon: TrendingDown,
  },
  savings: {
    label: 'Economia',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    icon: DollarSign,
  },
};

const statusConfig: Record<BudgetStatus, {
  label: string;
  color: string;
  bgColor: string;
  icon: typeof CheckCircle;
}> = {
  on_track: {
    label: 'No caminho',
    color: 'text-green-600',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    icon: CheckCircle,
  },
  at_risk: {
    label: 'Em risco',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
    icon: AlertCircle,
  },
  exceeded: {
    label: 'Excedido',
    color: 'text-red-600',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    icon: AlertCircle,
  },
  completed: {
    label: 'Concluído',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    icon: CheckCircle,
  },
};

export function BudgetTracking({
  budgets,
  onAdd,
  onEdit,
  onDelete,
  className,
}: BudgetTrackingProps) {
  const [filter, setFilter] = useState<BudgetType | 'all'>('all');

  const filteredBudgets = budgets.filter((b) => {
    if (filter === 'all') return true;
    return b.type === filter;
  });

  // Calculate summary
  const summary = {
    total: budgets.length,
    onTrack: budgets.filter((b) => b.status === 'on_track').length,
    atRisk: budgets.filter((b) => b.status === 'at_risk').length,
    exceeded: budgets.filter((b) => b.status === 'exceeded').length,
  };

  return (
    <div className={cn('', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-gray-500" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Metas e Orçamentos
          </h2>
        </div>
        <Button onClick={onAdd}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Meta
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <SummaryCard
          label="Total de Metas"
          value={summary.total}
          icon={<Target className="w-5 h-5" />}
          color="text-gray-600"
        />
        <SummaryCard
          label="No Caminho"
          value={summary.onTrack}
          icon={<CheckCircle className="w-5 h-5" />}
          color="text-green-600"
        />
        <SummaryCard
          label="Em Risco"
          value={summary.atRisk}
          icon={<AlertCircle className="w-5 h-5" />}
          color="text-yellow-600"
        />
        <SummaryCard
          label="Excedidas"
          value={summary.exceeded}
          icon={<AlertCircle className="w-5 h-5" />}
          color="text-red-600"
        />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-4">
        {(['all', 'expense', 'income', 'savings'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
              filter === f
                ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
            )}
          >
            {f === 'all' ? 'Todas' : typeConfig[f].label}
          </button>
        ))}
      </div>

      {/* Budget list */}
      {filteredBudgets.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <Target className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Nenhuma meta encontrada
          </p>
          <Button onClick={onAdd}>
            <Plus className="w-4 h-4 mr-2" />
            Criar Primeira Meta
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBudgets.map((budget) => (
            <BudgetCard
              key={budget.id}
              budget={budget}
              onEdit={() => onEdit(budget.id)}
              onDelete={() => onDelete(budget.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Summary card component
interface SummaryCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}

function SummaryCard({ label, value, icon, color }: SummaryCardProps) {
  return (
    <div className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
      <div className="flex items-center gap-3">
        <div className={cn('opacity-70', color)}>{icon}</div>
        <div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
        </div>
      </div>
    </div>
  );
}

// Individual budget card
interface BudgetCardProps {
  budget: Budget;
  onEdit: () => void;
  onDelete: () => void;
}

function BudgetCard({ budget, onEdit, onDelete }: BudgetCardProps) {
  const typeConf = typeConfig[budget.type];
  const statusConf = statusConfig[budget.status];
  const TypeIcon = typeConf.icon;
  const StatusIcon = statusConf.icon;

  const percentage = Math.min((budget.currentAmount / budget.targetAmount) * 100, 100);
  const isExpense = budget.type === 'expense';
  const remaining = budget.targetAmount - budget.currentAmount;
  const daysRemaining = differenceInDays(budget.endDate, new Date());
  const isExpired = daysRemaining < 0;

  // For expenses, exceeding is bad. For income/savings, exceeding is good.
  const progressColor = isExpense
    ? percentage >= 100 ? 'bg-red-500' : percentage >= 80 ? 'bg-yellow-500' : 'bg-green-500'
    : percentage >= 100 ? 'bg-green-500' : percentage >= 80 ? 'bg-blue-500' : 'bg-gray-400';

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={cn('p-2 rounded-lg', typeConf.bgColor)}>
            <TypeIcon className={cn('w-5 h-5', typeConf.color)} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {budget.name}
              </h3>
              <span className={cn('px-2 py-0.5 text-xs font-medium rounded-full flex items-center gap-1', statusConf.bgColor, statusConf.color)}>
                <StatusIcon className="w-3 h-3" />
                {statusConf.label}
              </span>
            </div>
            {budget.category && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {budget.category}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={onEdit}>
            <Edit className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onDelete}>
            <Trash2 className="w-4 h-4 text-red-500" />
          </Button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-gray-500 dark:text-gray-400">
            {formatCurrency(budget.currentAmount)} de {formatCurrency(budget.targetAmount)}
          </span>
          <span className={cn('font-medium', statusConf.color)}>
            {percentage.toFixed(0)}%
          </span>
        </div>
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all', progressColor)}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 text-sm">
        <div>
          <p className="text-gray-500 dark:text-gray-400">
            {isExpense ? 'Disponível' : 'Faltam'}
          </p>
          <p className={cn(
            'font-semibold',
            isExpense
              ? remaining >= 0 ? 'text-green-600' : 'text-red-600'
              : remaining <= 0 ? 'text-green-600' : 'text-gray-900 dark:text-white'
          )}>
            {formatCurrency(Math.abs(remaining))}
          </p>
        </div>
        <div>
          <p className="text-gray-500 dark:text-gray-400">Período</p>
          <p className="font-semibold text-gray-900 dark:text-white">
            {format(budget.startDate, 'dd/MM', { locale: ptBR })} - {format(budget.endDate, 'dd/MM', { locale: ptBR })}
          </p>
        </div>
        <div>
          <p className="text-gray-500 dark:text-gray-400">Dias restantes</p>
          <p className={cn(
            'font-semibold',
            isExpired ? 'text-red-600' : daysRemaining <= 7 ? 'text-yellow-600' : 'text-gray-900 dark:text-white'
          )}>
            {isExpired ? 'Expirado' : `${daysRemaining} dias`}
          </p>
        </div>
      </div>

      {/* Description */}
      {budget.description && (
        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 pt-4">
          {budget.description}
        </p>
      )}
    </div>
  );
}

// Budget form for creating/editing
interface BudgetFormData {
  name: string;
  description?: string;
  type: BudgetType;
  category?: string;
  targetAmount: number;
  period: BudgetPeriod;
  startDate: Date;
  endDate: Date;
  alertThreshold?: number;
}

interface BudgetFormProps {
  initialData?: Partial<BudgetFormData>;
  onSubmit: (data: BudgetFormData) => void;
  onCancel: () => void;
}

export function BudgetForm({ initialData, onSubmit, onCancel }: BudgetFormProps) {
  const [formData, setFormData] = useState<BudgetFormData>({
    name: initialData?.name || '',
    description: initialData?.description || '',
    type: initialData?.type || 'expense',
    category: initialData?.category || '',
    targetAmount: initialData?.targetAmount || 0,
    period: initialData?.period || 'monthly',
    startDate: initialData?.startDate || new Date(),
    endDate: initialData?.endDate || new Date(),
    alertThreshold: initialData?.alertThreshold || 80,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Nome da Meta
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Tipo
          </label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as BudgetType })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="expense">Despesa</option>
            <option value="income">Receita</option>
            <option value="savings">Economia</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Valor Alvo
          </label>
          <input
            type="number"
            value={formData.targetAmount}
            onChange={(e) => setFormData({ ...formData, targetAmount: parseFloat(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            min="0"
            step="0.01"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Data Início
          </label>
          <input
            type="date"
            value={format(formData.startDate, 'yyyy-MM-dd')}
            onChange={(e) => setFormData({ ...formData, startDate: new Date(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Data Fim
          </label>
          <input
            type="date"
            value={format(formData.endDate, 'yyyy-MM-dd')}
            onChange={(e) => setFormData({ ...formData, endDate: new Date(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Descrição (opcional)
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          rows={3}
        />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">
          Salvar
        </Button>
      </div>
    </form>
  );
}

// Helper functions
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export type { Budget, BudgetType, BudgetPeriod, BudgetStatus, BudgetFormData };
export default BudgetTracking;
