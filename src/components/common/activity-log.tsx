import { useState } from 'react';
import { 
  Activity, 
  User, 
  FileText, 
  Settings, 
  LogIn, 
  LogOut,
  Edit,
  Trash2,
  Plus,
  Eye,
  Download,
  Upload,
  Shield,
  RefreshCw,
  Filter,
  Calendar,
  ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type ActivityType = 
  | 'create' 
  | 'update' 
  | 'delete' 
  | 'view' 
  | 'export' 
  | 'import' 
  | 'login' 
  | 'logout' 
  | 'settings'
  | 'payment'
  | 'permission';

interface ActivityLogEntry {
  id: string;
  type: ActivityType;
  action: string;
  description: string;
  resource?: string;
  resourceId?: string;
  userId: string;
  userName: string;
  userEmail: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

interface ActivityLogProps {
  logs: ActivityLogEntry[];
  isLoading?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
  onFilterChange?: (filters: ActivityFilters) => void;
  className?: string;
}

interface ActivityFilters {
  type?: ActivityType;
  userId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
}

const activityConfig: Record<ActivityType, {
  icon: typeof Activity;
  color: string;
  bgColor: string;
  label: string;
}> = {
  create: {
    icon: Plus,
    color: 'text-green-500',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    label: 'Criação',
  },
  update: {
    icon: Edit,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    label: 'Edição',
  },
  delete: {
    icon: Trash2,
    color: 'text-red-500',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    label: 'Exclusão',
  },
  view: {
    icon: Eye,
    color: 'text-gray-500',
    bgColor: 'bg-gray-50 dark:bg-gray-800',
    label: 'Visualização',
  },
  export: {
    icon: Download,
    color: 'text-purple-500',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    label: 'Exportação',
  },
  import: {
    icon: Upload,
    color: 'text-orange-500',
    bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    label: 'Importação',
  },
  login: {
    icon: LogIn,
    color: 'text-green-500',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    label: 'Login',
  },
  logout: {
    icon: LogOut,
    color: 'text-gray-500',
    bgColor: 'bg-gray-50 dark:bg-gray-800',
    label: 'Logout',
  },
  settings: {
    icon: Settings,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    label: 'Configurações',
  },
  payment: {
    icon: FileText,
    color: 'text-green-500',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    label: 'Pagamento',
  },
  permission: {
    icon: Shield,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
    label: 'Permissão',
  },
};

export function ActivityLog({
  logs,
  isLoading,
  onLoadMore,
  hasMore,
  onFilterChange,
  className,
}: ActivityLogProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<ActivityFilters>({});

  const handleFilterChange = (newFilters: Partial<ActivityFilters>) => {
    const updated = { ...filters, ...newFilters };
    setFilters(updated);
    onFilterChange?.(updated);
  };

  const clearFilters = () => {
    setFilters({});
    onFilterChange?.({});
  };

  const groupedLogs = groupLogsByDate(logs);

  return (
    <div className={cn('', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-gray-500" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Log de Atividades
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filtros
            <ChevronDown className={cn('w-4 h-4 ml-2 transition-transform', showFilters && 'rotate-180')} />
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tipo
              </label>
              <select
                value={filters.type || ''}
                onChange={(e) => handleFilterChange({ type: e.target.value as ActivityType || undefined })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Todos</option>
                {Object.entries(activityConfig).map(([key, config]) => (
                  <option key={key} value={key}>{config.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Data início
              </label>
              <input
                type="date"
                value={filters.dateFrom ? format(filters.dateFrom, 'yyyy-MM-dd') : ''}
                onChange={(e) => handleFilterChange({ dateFrom: e.target.value ? new Date(e.target.value) : undefined })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Data fim
              </label>
              <input
                type="date"
                value={filters.dateTo ? format(filters.dateTo, 'yyyy-MM-dd') : ''}
                onChange={(e) => handleFilterChange({ dateTo: e.target.value ? new Date(e.target.value) : undefined })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Buscar
              </label>
              <input
                type="text"
                placeholder="Buscar..."
                value={filters.search || ''}
                onChange={(e) => handleFilterChange({ search: e.target.value || undefined })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Limpar filtros
            </Button>
          </div>
        </div>
      )}

      {/* Activity list */}
      {logs.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <Activity className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            Nenhuma atividade registrada
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedLogs).map(([date, dayLogs]) => (
            <div key={date}>
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-4 h-4 text-gray-400" />
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {date}
                </h3>
              </div>
              <div className="space-y-2">
                {dayLogs.map((log) => (
                  <ActivityItem key={log.id} log={log} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Load more */}
      {hasMore && (
        <div className="mt-6 text-center">
          <Button
            variant="outline"
            onClick={onLoadMore}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Carregando...
              </>
            ) : (
              'Carregar mais'
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

// Individual activity item
interface ActivityItemProps {
  log: ActivityLogEntry;
}

function ActivityItem({ log }: ActivityItemProps) {
  const [expanded, setExpanded] = useState(false);
  const config = activityConfig[log.type];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg',
        'hover:border-gray-300 dark:hover:border-gray-600 transition-colors cursor-pointer'
      )}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className={cn('p-2 rounded-lg', config.bgColor)}>
          <Icon className={cn('w-4 h-4', config.color)} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-gray-900 dark:text-white">
              {log.action}
            </span>
            <span className={cn('px-2 py-0.5 text-xs font-medium rounded-full', config.bgColor, config.color)}>
              {config.label}
            </span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {log.description}
          </p>
          <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <User className="w-3 h-3" />
              {log.userName}
            </span>
            <span>
              {format(log.createdAt, 'HH:mm', { locale: ptBR })}
            </span>
          </div>
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-gray-500 dark:text-gray-400">Usuário</dt>
              <dd className="text-gray-900 dark:text-white">{log.userEmail}</dd>
            </div>
            {log.ipAddress && (
              <div>
                <dt className="text-gray-500 dark:text-gray-400">IP</dt>
                <dd className="text-gray-900 dark:text-white">{log.ipAddress}</dd>
              </div>
            )}
            {log.resource && (
              <div>
                <dt className="text-gray-500 dark:text-gray-400">Recurso</dt>
                <dd className="text-gray-900 dark:text-white">{log.resource}</dd>
              </div>
            )}
            {log.resourceId && (
              <div>
                <dt className="text-gray-500 dark:text-gray-400">ID</dt>
                <dd className="text-gray-900 dark:text-white font-mono text-xs">{log.resourceId}</dd>
              </div>
            )}
            <div className="col-span-2">
              <dt className="text-gray-500 dark:text-gray-400">Data/Hora</dt>
              <dd className="text-gray-900 dark:text-white">
                {format(log.createdAt, "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}
              </dd>
            </div>
            {log.metadata && Object.keys(log.metadata).length > 0 && (
              <div className="col-span-2">
                <dt className="text-gray-500 dark:text-gray-400 mb-1">Detalhes</dt>
                <dd className="text-gray-900 dark:text-white">
                  <pre className="text-xs bg-gray-50 dark:bg-gray-900 p-2 rounded overflow-auto">
                    {JSON.stringify(log.metadata, null, 2)}
                  </pre>
                </dd>
              </div>
            )}
          </dl>
        </div>
      )}
    </div>
  );
}

// Helper function to group logs by date
function groupLogsByDate(logs: ActivityLogEntry[]): Record<string, ActivityLog[]> {
  const grouped: Record<string, ActivityLog[]> = {};

  logs.forEach((log) => {
    const dateKey = format(log.createdAt, "EEEE, dd 'de' MMMM", { locale: ptBR });
    if (!grouped[dateKey]) {
      grouped[dateKey] = [];
    }
    grouped[dateKey].push(log);
  });

  return grouped;
}

// Service for logging activities
export const activityService = {
  log: async (data: Omit<ActivityLog, 'id' | 'createdAt'>): Promise<void> => {
    // In a real app, this would send to an API
    console.log('[Activity Log]', data);
  },

  create: (resource: string, resourceId: string, description: string) =>
    activityService.log({
      type: 'create',
      action: `Criou ${resource}`,
      description,
      resource,
      resourceId,
      userId: 'current-user',
      userName: 'Current User',
      userEmail: 'user@example.com',
    }),

  update: (resource: string, resourceId: string, description: string) =>
    activityService.log({
      type: 'update',
      action: `Editou ${resource}`,
      description,
      resource,
      resourceId,
      userId: 'current-user',
      userName: 'Current User',
      userEmail: 'user@example.com',
    }),

  delete: (resource: string, resourceId: string, description: string) =>
    activityService.log({
      type: 'delete',
      action: `Excluiu ${resource}`,
      description,
      resource,
      resourceId,
      userId: 'current-user',
      userName: 'Current User',
      userEmail: 'user@example.com',
    }),
};

export type { ActivityLogEntry, ActivityType, ActivityFilters };
export default ActivityLog;
