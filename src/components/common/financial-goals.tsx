import { useMemo } from 'react';
import {
  Target,
  TrendingUp,
  Calendar,
  Wallet,
  PiggyBank,
  Car,
  Home,
  Plane,
  GraduationCap,
  Heart,
  Gift,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/financial-calculations';

// Types
interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: Date;
  icon?: string;
  color?: string;
  category?: 'savings' | 'purchase' | 'investment' | 'emergency' | 'other';
  priority?: 'high' | 'medium' | 'low';
  autoContribution?: {
    amount: number;
    frequency: 'daily' | 'weekly' | 'monthly';
  };
}

interface GoalProgress {
  goal: Goal;
  percentage: number;
  remaining: number;
  daysRemaining: number | null;
  monthlyNeeded: number | null;
  isOnTrack: boolean;
  projectedCompletion: Date | null;
}

// Icon mapping
const goalIcons: Record<string, typeof Target> = {
  savings: PiggyBank,
  car: Car,
  home: Home,
  travel: Plane,
  education: GraduationCap,
  health: Heart,
  gift: Gift,
  investment: TrendingUp,
  default: Target,
};

// Calculate goal progress
function calculateGoalProgress(goal: Goal): GoalProgress {
  const percentage = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
  const remaining = Math.max(goal.targetAmount - goal.currentAmount, 0);
  
  let daysRemaining: number | null = null;
  let monthlyNeeded: number | null = null;
  let projectedCompletion: Date | null = null;
  let isOnTrack = true;

  if (goal.deadline) {
    const now = new Date();
    const deadline = new Date(goal.deadline);
    daysRemaining = Math.max(0, Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    
    if (daysRemaining > 0) {
      const monthsRemaining = daysRemaining / 30;
      monthlyNeeded = remaining / monthsRemaining;
      
      // Check if on track with auto contribution
      if (goal.autoContribution) {
        const monthlyContribution = goal.autoContribution.frequency === 'monthly'
          ? goal.autoContribution.amount
          : goal.autoContribution.frequency === 'weekly'
          ? goal.autoContribution.amount * 4
          : goal.autoContribution.amount * 30;
        
        isOnTrack = monthlyContribution >= monthlyNeeded;
        
        // Calculate projected completion
        if (monthlyContribution > 0) {
          const monthsToComplete = remaining / monthlyContribution;
          projectedCompletion = new Date(now.getTime() + monthsToComplete * 30 * 24 * 60 * 60 * 1000);
        }
      }
    }
  }

  return {
    goal,
    percentage,
    remaining,
    daysRemaining,
    monthlyNeeded,
    isOnTrack,
    projectedCompletion,
  };
}

// Single Goal Card
interface GoalCardProps {
  goal: Goal;
  onClick?: () => void;
  onContribute?: () => void;
  compact?: boolean;
}

export function GoalCard({ goal, onClick, onContribute, compact = false }: GoalCardProps) {
  const progress = useMemo(() => calculateGoalProgress(goal), [goal]);
  
  const Icon = goalIcons[goal.icon || 'default'] || goalIcons.default;
  const color = goal.color || '#3b82f6';

  if (compact) {
    return (
      <div
        onClick={onClick}
        className={cn(
          'flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700',
          onClick && 'cursor-pointer hover:shadow-md transition-shadow'
        )}
      >
        <div
          className="p-2 rounded-lg"
          style={{ backgroundColor: `${color}20` }}
        >
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {goal.name}
          </p>
          <div className="mt-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${progress.percentage}%`,
                backgroundColor: color,
              }}
            />
          </div>
        </div>
        <span className="text-sm font-medium" style={{ color }}>
          {progress.percentage.toFixed(0)}%
        </span>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={cn(
        'p-5 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700',
        onClick && 'cursor-pointer hover:shadow-lg transition-shadow'
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className="p-3 rounded-xl"
            style={{ backgroundColor: `${color}15` }}
          >
            <Icon className="w-6 h-6" style={{ color }} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {goal.name}
            </h3>
            {goal.priority && (
              <span
                className={cn(
                  'inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full',
                  goal.priority === 'high' && 'bg-red-100 text-red-700',
                  goal.priority === 'medium' && 'bg-yellow-100 text-yellow-700',
                  goal.priority === 'low' && 'bg-green-100 text-green-700'
                )}
              >
                {goal.priority === 'high' ? 'Alta' : goal.priority === 'medium' ? 'Média' : 'Baixa'} prioridade
              </span>
            )}
          </div>
        </div>
        <Sparkles
          className={cn(
            'w-5 h-5',
            progress.percentage >= 100 ? 'text-yellow-500' : 'text-gray-300'
          )}
        />
      </div>

      {/* Progress */}
      <div className="mt-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-600 dark:text-gray-400">
            {formatCurrency(goal.currentAmount)}
          </span>
          <span className="font-medium text-gray-900 dark:text-white">
            {formatCurrency(goal.targetAmount)}
          </span>
        </div>
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${progress.percentage}%`,
              backgroundColor: color,
            }}
          />
        </div>
        <div className="mt-2 flex justify-between items-center">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Restam {formatCurrency(progress.remaining)}
          </span>
          <span className="text-sm font-medium" style={{ color }}>
            {progress.percentage.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Details */}
      <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 grid grid-cols-2 gap-4">
        {goal.deadline && (
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Prazo</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {progress.daysRemaining !== null
                  ? `${progress.daysRemaining} dias`
                  : new Date(goal.deadline).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>
        )}
        {progress.monthlyNeeded && (
          <div className="flex items-center gap-2">
            <Wallet className="w-4 h-4 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Necessário/mês</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {formatCurrency(progress.monthlyNeeded)}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Status indicator */}
      {goal.deadline && (
        <div
          className={cn(
            'mt-4 px-3 py-2 rounded-lg text-sm',
            progress.isOnTrack
              ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
              : 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400'
          )}
        >
          {progress.isOnTrack
            ? '✓ No caminho certo para atingir a meta'
            : '⚠ Contribuição atual abaixo do necessário'}
        </div>
      )}

      {/* Action button */}
      {onContribute && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onContribute();
          }}
          className="mt-4 w-full py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
        >
          Contribuir
        </button>
      )}
    </div>
  );
}

// Goals list/grid
interface GoalsListProps {
  goals: Goal[];
  layout?: 'grid' | 'list';
  onGoalClick?: (goal: Goal) => void;
  onContribute?: (goal: Goal) => void;
  emptyMessage?: string;
}

export function GoalsList({
  goals,
  layout = 'grid',
  onGoalClick,
  onContribute,
  emptyMessage = 'Nenhuma meta cadastrada',
}: GoalsListProps) {
  if (goals.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>{emptyMessage}</p>
      </div>
    );
  }

  if (layout === 'list') {
    return (
      <div className="space-y-3">
        {goals.map((goal) => (
          <GoalCard
            key={goal.id}
            goal={goal}
            compact
            onClick={() => onGoalClick?.(goal)}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {goals.map((goal) => (
        <GoalCard
          key={goal.id}
          goal={goal}
          onClick={() => onGoalClick?.(goal)}
          onContribute={() => onContribute?.(goal)}
        />
      ))}
    </div>
  );
}

// Goals summary widget
interface GoalsSummaryProps {
  goals: Goal[];
}

export function GoalsSummary({ goals }: GoalsSummaryProps) {
  const summary = useMemo(() => {
    const progresses = goals.map(calculateGoalProgress);
    
    const totalTarget = goals.reduce((sum, g) => sum + g.targetAmount, 0);
    const totalCurrent = goals.reduce((sum, g) => sum + g.currentAmount, 0);
    const overallPercentage = totalTarget > 0 ? (totalCurrent / totalTarget) * 100 : 0;
    
    const completed = progresses.filter((p) => p.percentage >= 100).length;
    const onTrack = progresses.filter((p) => p.isOnTrack && p.percentage < 100).length;
    const needsAttention = progresses.filter((p) => !p.isOnTrack && p.percentage < 100).length;

    return {
      totalTarget,
      totalCurrent,
      overallPercentage,
      total: goals.length,
      completed,
      onTrack,
      needsAttention,
    };
  }, [goals]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <Target className="w-5 h-5 text-primary-600" />
        Resumo das Metas
      </h3>

      {/* Overall progress */}
      <div className="mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-600 dark:text-gray-400">Progresso geral</span>
          <span className="font-medium text-gray-900 dark:text-white">
            {summary.overallPercentage.toFixed(0)}%
          </span>
        </div>
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary-600 rounded-full transition-all duration-500"
            style={{ width: `${summary.overallPercentage}%` }}
          />
        </div>
        <div className="mt-2 flex justify-between text-sm">
          <span className="text-gray-500">{formatCurrency(summary.totalCurrent)}</span>
          <span className="text-gray-900 dark:text-white font-medium">
            {formatCurrency(summary.totalTarget)}
          </span>
        </div>
      </div>

      {/* Status breakdown */}
      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100 dark:border-gray-700">
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{summary.completed}</div>
          <div className="text-xs text-gray-500">Concluídas</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{summary.onTrack}</div>
          <div className="text-xs text-gray-500">No caminho</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-600">{summary.needsAttention}</div>
          <div className="text-xs text-gray-500">Atenção</div>
        </div>
      </div>
    </div>
  );
}

export type { Goal, GoalProgress };
export default GoalCard;
