import { useMemo } from 'react';
import {
  FileText,
  User,
  Building2,
  CreditCard,
  Download,
  Upload,
  Settings,
  LogIn,
  LogOut,
  Edit,
  Trash2,
  Plus,
  CheckCircle,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type ActivityType =
  | 'create'
  | 'update'
  | 'delete'
  | 'pay'
  | 'receive'
  | 'export'
  | 'import'
  | 'login'
  | 'logout'
  | 'settings';

type ResourceType =
  | 'conta_pagar'
  | 'conta_receber'
  | 'cliente'
  | 'fornecedor'
  | 'categoria'
  | 'usuario'
  | 'sistema';

interface Activity {
  id: string;
  type: ActivityType;
  resource: ResourceType;
  resourceId?: string;
  resourceName?: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  description: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

interface ActivityFeedProps {
  activities: Activity[];
  title?: string;
  maxItems?: number;
  showLoadMore?: boolean;
  onLoadMore?: () => void;
  isLoading?: boolean;
  onActivityClick?: (activity: Activity) => void;
}

const typeIcons: Record<ActivityType, typeof FileText> = {
  create: Plus,
  update: Edit,
  delete: Trash2,
  pay: CreditCard,
  receive: CreditCard,
  export: Download,
  import: Upload,
  login: LogIn,
  logout: LogOut,
  settings: Settings,
};

const resourceIcons: Record<ResourceType, typeof FileText> = {
  conta_pagar: FileText,
  conta_receber: FileText,
  cliente: User,
  fornecedor: Building2,
  categoria: Settings,
  usuario: User,
  sistema: Settings,
};

const typeColors: Record<ActivityType, string> = {
  create: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  update: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  delete: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  pay: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
  receive: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
  export: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
  import: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400',
  login: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
  logout: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
  settings: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400',
};

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);

  if (seconds < 60) return 'agora mesmo';
  if (minutes < 60) return `há ${minutes} min`;
  if (hours < 24) return `há ${hours}h`;
  if (days < 7) return `há ${days} dia${days > 1 ? 's' : ''}`;
  if (weeks < 4) return `há ${weeks} semana${weeks > 1 ? 's' : ''}`;
  return `há ${months} mês${months > 1 ? 'es' : ''}`;
}

function groupActivitiesByDate(activities: Activity[]): Map<string, Activity[]> {
  const groups = new Map<string, Activity[]>();
  
  activities.forEach((activity) => {
    const date = activity.timestamp.toDateString();
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    
    let label: string;
    if (date === today) {
      label = 'Hoje';
    } else if (date === yesterday) {
      label = 'Ontem';
    } else {
      label = activity.timestamp.toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      });
    }
    
    if (!groups.has(label)) {
      groups.set(label, []);
    }
    groups.get(label)!.push(activity);
  });
  
  return groups;
}

export function ActivityFeed({
  activities,
  title = 'Atividade Recente',
  maxItems = 20,
  showLoadMore = false,
  onLoadMore,
  isLoading = false,
  onActivityClick,
}: ActivityFeedProps) {
  const displayedActivities = useMemo(() => {
    return activities.slice(0, maxItems);
  }, [activities, maxItems]);

  const groupedActivities = useMemo(() => {
    return groupActivitiesByDate(displayedActivities);
  }, [displayedActivities]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Clock className="w-5 h-5 text-gray-400" />
          {title}
        </h3>
      </div>

      {/* Activity List */}
      <div className="divide-y divide-gray-100 dark:divide-gray-700">
        {activities.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
            <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Nenhuma atividade recente</p>
          </div>
        ) : (
          Array.from(groupedActivities.entries()).map(([dateLabel, groupActivities]) => (
            <div key={dateLabel}>
              {/* Date Header */}
              <div className="px-6 py-2 bg-gray-50 dark:bg-gray-900/50">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  {dateLabel}
                </span>
              </div>
              
              {/* Activities for this date */}
              <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
                {groupActivities.map((activity) => (
                  <ActivityItem
                    key={activity.id}
                    activity={activity}
                    onClick={onActivityClick}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Load More */}
      {showLoadMore && activities.length > maxItems && (
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onLoadMore}
            disabled={isLoading}
            className="w-full py-2 text-sm text-primary-600 hover:text-primary-700 font-medium disabled:opacity-50"
          >
            {isLoading ? 'Carregando...' : 'Carregar mais'}
          </button>
        </div>
      )}
    </div>
  );
}

// Single Activity Item
interface ActivityItemProps {
  activity: Activity;
  onClick?: (activity: Activity) => void;
}

function ActivityItem({ activity, onClick }: ActivityItemProps) {
  const TypeIcon = typeIcons[activity.type];
  
  return (
    <button
      onClick={() => onClick?.(activity)}
      className={cn(
        'w-full px-6 py-3 flex items-start gap-3 text-left transition-colors',
        onClick && 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
      )}
    >
      {/* Avatar */}
      <div className="flex-shrink-0">
        {activity.userAvatar ? (
          <img
            src={activity.userAvatar}
            alt={activity.userName}
            className="w-8 h-8 rounded-full"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {activity.userName.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900 dark:text-white text-sm">
            {activity.userName}
          </span>
          <div className={cn('p-1 rounded', typeColors[activity.type])}>
            <TypeIcon className="w-3 h-3" />
          </div>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
          {activity.description}
        </p>
        {activity.resourceName && (
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            {activity.resourceName}
          </p>
        )}
      </div>

      {/* Time */}
      <div className="flex-shrink-0">
        <span className="text-xs text-gray-400">
          {formatRelativeTime(activity.timestamp)}
        </span>
      </div>
    </button>
  );
}

// Compact Activity List (for sidebar or smaller areas)
interface CompactActivityListProps {
  activities: Activity[];
  maxItems?: number;
}

export function CompactActivityList({ activities, maxItems = 5 }: CompactActivityListProps) {
  const displayedActivities = activities.slice(0, maxItems);

  return (
    <div className="space-y-2">
      {displayedActivities.map((activity) => {
        const TypeIcon = typeIcons[activity.type];
        return (
          <div
            key={activity.id}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
          >
            <div className={cn('p-1.5 rounded', typeColors[activity.type])}>
              <TypeIcon className="w-3 h-3" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-900 dark:text-white truncate">
                {activity.description}
              </p>
              <p className="text-xs text-gray-500">
                {activity.userName} • {formatRelativeTime(activity.timestamp)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Timeline Activity (for resource detail pages)
interface TimelineActivityProps {
  activities: Activity[];
}

export function TimelineActivity({ activities }: TimelineActivityProps) {
  return (
    <div className="flow-root">
      <ul className="-mb-8">
        {activities.map((activity, index) => {
          const TypeIcon = typeIcons[activity.type];
          const isLast = index === activities.length - 1;
          
          return (
            <li key={activity.id}>
              <div className="relative pb-8">
                {!isLast && (
                  <span
                    className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200 dark:bg-gray-700"
                    aria-hidden="true"
                  />
                )}
                <div className="relative flex items-start space-x-3">
                  <div className={cn('relative flex h-8 w-8 items-center justify-center rounded-full', typeColors[activity.type])}>
                    <TypeIcon className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div>
                      <div className="text-sm">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {activity.userName}
                        </span>
                      </div>
                      <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                        {activity.description}
                      </p>
                    </div>
                    <div className="mt-2 text-xs text-gray-400">
                      {activity.timestamp.toLocaleString('pt-BR')}
                    </div>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export type { Activity, ActivityType, ResourceType };
export default ActivityFeed;
