import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  DollarSign,
  Users,
  FileText,
  ArrowUpRight,
  ArrowDownRight,
  LucideIcon,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// ============================================================================
// Types
// ============================================================================

export type ActivityType =
  | 'conta_pagar_criada'
  | 'conta_pagar_paga'
  | 'conta_pagar_vencida'
  | 'conta_receber_criada'
  | 'conta_receber_recebida'
  | 'conta_receber_vencida'
  | 'cliente_criado'
  | 'fornecedor_criado'
  | 'relatorio_gerado'
  | 'custom';

export interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  description?: string;
  timestamp: Date;
  icon?: LucideIcon;
  iconColor?: string;
  metadata?: Record<string, any>;
  link?: string;
}

interface RecentActivityProps {
  activities: Activity[];
  maxItems?: number;
  onViewAll?: () => void;
  onActivityClick?: (activity: Activity) => void;
  className?: string;
  loading?: boolean;
}

interface ActivityItemProps {
  activity: Activity;
  onClick?: (activity: Activity) => void;
}

// ============================================================================
// Activity Type Config
// ============================================================================

const activityTypeConfig: Record<ActivityType, {
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
}> = {
  conta_pagar_criada: {
    icon: FileText,
    iconBg: 'bg-blue-100 dark:bg-blue-900/30',
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
  conta_pagar_paga: {
    icon: CheckCircle,
    iconBg: 'bg-green-100 dark:bg-green-900/30',
    iconColor: 'text-green-600 dark:text-green-400',
  },
  conta_pagar_vencida: {
    icon: AlertCircle,
    iconBg: 'bg-red-100 dark:bg-red-900/30',
    iconColor: 'text-red-600 dark:text-red-400',
  },
  conta_receber_criada: {
    icon: FileText,
    iconBg: 'bg-purple-100 dark:bg-purple-900/30',
    iconColor: 'text-purple-600 dark:text-purple-400',
  },
  conta_receber_recebida: {
    icon: ArrowDownRight,
    iconBg: 'bg-green-100 dark:bg-green-900/30',
    iconColor: 'text-green-600 dark:text-green-400',
  },
  conta_receber_vencida: {
    icon: AlertCircle,
    iconBg: 'bg-yellow-100 dark:bg-yellow-900/30',
    iconColor: 'text-yellow-600 dark:text-yellow-400',
  },
  cliente_criado: {
    icon: Users,
    iconBg: 'bg-blue-100 dark:bg-blue-900/30',
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
  fornecedor_criado: {
    icon: Users,
    iconBg: 'bg-indigo-100 dark:bg-indigo-900/30',
    iconColor: 'text-indigo-600 dark:text-indigo-400',
  },
  relatorio_gerado: {
    icon: FileText,
    iconBg: 'bg-gray-100 dark:bg-gray-700',
    iconColor: 'text-gray-600 dark:text-gray-400',
  },
  custom: {
    icon: Clock,
    iconBg: 'bg-gray-100 dark:bg-gray-700',
    iconColor: 'text-gray-600 dark:text-gray-400',
  },
};

// ============================================================================
// Activity Item Component
// ============================================================================

function ActivityItem({ activity, onClick }: ActivityItemProps) {
  const config = activityTypeConfig[activity.type];
  const Icon = activity.icon ?? config.icon;
  const iconBg = activity.iconColor ? `bg-${activity.iconColor}-100 dark:bg-${activity.iconColor}-900/30` : config.iconBg;
  const iconColor = activity.iconColor ? `text-${activity.iconColor}-600 dark:text-${activity.iconColor}-400` : config.iconColor;

  const timeAgo = formatDistanceToNow(new Date(activity.timestamp), {
    addSuffix: true,
    locale: ptBR,
  });

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-3 rounded-lg transition-colors',
        onClick && 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50'
      )}
      onClick={() => onClick?.(activity)}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {/* Icon */}
      <div
        className={cn(
          'flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-full',
          iconBg
        )}
      >
        <Icon className={cn('h-4 w-4', iconColor)} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
          {activity.title}
        </p>
        {activity.description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
            {activity.description}
          </p>
        )}
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          {timeAgo}
        </p>
      </div>

      {/* Arrow */}
      {onClick && (
        <ArrowUpRight className="h-4 w-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
      )}
    </div>
  );
}

// ============================================================================
// Activity Loading Skeleton
// ============================================================================

function ActivitySkeleton() {
  return (
    <div className="flex items-start gap-3 p-3 animate-pulse">
      <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-700" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
      </div>
    </div>
  );
}

// ============================================================================
// Recent Activity Component
// ============================================================================

export function RecentActivity({
  activities,
  maxItems = 5,
  onViewAll,
  onActivityClick,
  className,
  loading = false,
}: RecentActivityProps) {
  const displayedActivities = activities.slice(0, maxItems);
  const hasMore = activities.length > maxItems;

  return (
    <div
      className={cn(
        'bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
          Atividade Recente
        </h3>
        {onViewAll && hasMore && (
          <button
            onClick={onViewAll}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
          >
            Ver todas
          </button>
        )}
      </div>

      {/* Activity List */}
      <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
        {loading ? (
          Array.from({ length: maxItems }).map((_, i) => (
            <ActivitySkeleton key={i} />
          ))
        ) : displayedActivities.length > 0 ? (
          displayedActivities.map((activity) => (
            <ActivityItem
              key={activity.id}
              activity={activity}
              onClick={onActivityClick}
            />
          ))
        ) : (
          <div className="p-8 text-center">
            <Clock className="h-8 w-8 mx-auto text-gray-400 dark:text-gray-500 mb-2" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Nenhuma atividade recente
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      {onViewAll && hasMore && (
        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onViewAll}
            className={cn(
              'w-full text-sm text-center text-gray-600 dark:text-gray-400',
              'hover:text-gray-900 dark:hover:text-white transition-colors'
            )}
          >
            Ver mais {activities.length - maxItems} atividades
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Activity Timeline Component
// ============================================================================

interface ActivityTimelineProps {
  activities: Activity[];
  onActivityClick?: (activity: Activity) => void;
  className?: string;
}

export function ActivityTimeline({
  activities,
  onActivityClick,
  className,
}: ActivityTimelineProps) {
  return (
    <div className={cn('relative', className)}>
      {/* Timeline line */}
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />

      {/* Activities */}
      <div className="space-y-4">
        {activities.map((activity, index) => {
          const config = activityTypeConfig[activity.type];
          const Icon = activity.icon ?? config.icon;
          const timeAgo = formatDistanceToNow(new Date(activity.timestamp), {
            addSuffix: true,
            locale: ptBR,
          });

          return (
            <div
              key={activity.id}
              className={cn(
                'relative flex items-start gap-4 pl-10',
                onActivityClick && 'cursor-pointer'
              )}
              onClick={() => onActivityClick?.(activity)}
            >
              {/* Icon */}
              <div
                className={cn(
                  'absolute left-0 flex items-center justify-center w-8 h-8 rounded-full',
                  'border-2 border-white dark:border-gray-900',
                  config.iconBg
                )}
              >
                <Icon className={cn('h-4 w-4', config.iconColor)} />
              </div>

              {/* Content */}
              <div
                className={cn(
                  'flex-1 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4',
                  onActivityClick && 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {activity.title}
                    </p>
                    {activity.description && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {activity.description}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
                    {timeAgo}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
