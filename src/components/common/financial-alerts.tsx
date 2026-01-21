import { useState, useMemo, useCallback } from 'react';
import {
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle,
  Bell,
  X,
  ChevronRight,
  Clock,
  TrendingDown,
  TrendingUp,
  CreditCard,
  Calendar,
  DollarSign,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/financial-calculations';

// Types
type AlertType = 'warning' | 'danger' | 'info' | 'success';
type AlertCategory =
  | 'budget'
  | 'bill'
  | 'goal'
  | 'subscription'
  | 'balance'
  | 'cashflow'
  | 'general';

interface FinancialAlert {
  id: string;
  type: AlertType;
  category: AlertCategory;
  title: string;
  message: string;
  amount?: number;
  actionLabel?: string;
  actionUrl?: string;
  onAction?: () => void;
  dismissible?: boolean;
  isRead?: boolean;
  createdAt: string;
  expiresAt?: string;
}

// Alert icons
const alertIcons = {
  warning: AlertTriangle,
  danger: AlertCircle,
  info: Info,
  success: CheckCircle,
};

const alertColors = {
  warning: {
    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    border: 'border-yellow-200 dark:border-yellow-800',
    icon: 'text-yellow-600',
    text: 'text-yellow-800 dark:text-yellow-200',
  },
  danger: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-200 dark:border-red-800',
    icon: 'text-red-600',
    text: 'text-red-800 dark:text-red-200',
  },
  info: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-800',
    icon: 'text-blue-600',
    text: 'text-blue-800 dark:text-blue-200',
  },
  success: {
    bg: 'bg-green-50 dark:bg-green-900/20',
    border: 'border-green-200 dark:border-green-800',
    icon: 'text-green-600',
    text: 'text-green-800 dark:text-green-200',
  },
};

const categoryIcons = {
  budget: TrendingDown,
  bill: Calendar,
  goal: TrendingUp,
  subscription: CreditCard,
  balance: DollarSign,
  cashflow: TrendingDown,
  general: Bell,
};

// Single Alert Component
interface AlertItemProps {
  alert: FinancialAlert;
  onDismiss?: (id: string) => void;
  onAction?: (alert: FinancialAlert) => void;
  compact?: boolean;
}

export function AlertItem({
  alert,
  onDismiss,
  onAction,
  compact = false,
}: AlertItemProps) {
  const colors = alertColors[alert.type];
  const Icon = alertIcons[alert.type];
  const CategoryIcon = categoryIcons[alert.category];

  if (compact) {
    return (
      <div
        className={cn(
          'flex items-center gap-3 p-3 rounded-lg border',
          colors.bg,
          colors.border,
          !alert.isRead && 'ring-2 ring-offset-2 ring-primary-500/20'
        )}
      >
        <Icon className={cn('w-4 h-4 flex-shrink-0', colors.icon)} />
        <div className="flex-1 min-w-0">
          <p className={cn('text-sm font-medium truncate', colors.text)}>
            {alert.title}
          </p>
        </div>
        {alert.dismissible && onDismiss && (
          <button
            onClick={() => onDismiss(alert.id)}
            className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/5"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'p-4 rounded-xl border',
        colors.bg,
        colors.border,
        !alert.isRead && 'ring-2 ring-offset-2 ring-primary-500/20'
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn('p-2 rounded-lg', colors.bg)}>
          <Icon className={cn('w-5 h-5', colors.icon)} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className={cn('font-semibold', colors.text)}>{alert.title}</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {alert.message}
              </p>
            </div>
            {alert.dismissible && onDismiss && (
              <button
                onClick={() => onDismiss(alert.id)}
                className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            )}
          </div>

          {alert.amount !== undefined && (
            <p className={cn('text-lg font-bold mt-2', colors.text)}>
              {formatCurrency(alert.amount)}
            </p>
          )}

          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <CategoryIcon className="w-3 h-3" />
              <span>{alert.category}</span>
              <span>•</span>
              <Clock className="w-3 h-3" />
              <span>
                {new Date(alert.createdAt).toLocaleDateString('pt-BR')}
              </span>
            </div>

            {(alert.actionLabel || alert.onAction) && (
              <button
                onClick={() => {
                  if (alert.onAction) {
                    alert.onAction();
                  } else {
                    onAction?.(alert);
                  }
                }}
                className="flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700"
              >
                {alert.actionLabel || 'Ver detalhes'}
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Alerts List
interface AlertsListProps {
  alerts: FinancialAlert[];
  onDismiss?: (id: string) => void;
  onAction?: (alert: FinancialAlert) => void;
  onDismissAll?: () => void;
  showFilters?: boolean;
  compact?: boolean;
  maxItems?: number;
  className?: string;
}

export function AlertsList({
  alerts,
  onDismiss,
  onAction,
  onDismissAll,
  showFilters = false,
  compact = false,
  maxItems,
  className,
}: AlertsListProps) {
  const [filterType, setFilterType] = useState<AlertType | 'all'>('all');
  const [filterCategory, setFilterCategory] = useState<AlertCategory | 'all'>('all');

  const filteredAlerts = useMemo(() => {
    let result = alerts;

    if (filterType !== 'all') {
      result = result.filter((a) => a.type === filterType);
    }

    if (filterCategory !== 'all') {
      result = result.filter((a) => a.category === filterCategory);
    }

    // Sort by date (newest first) and unread first
    result = [...result].sort((a, b) => {
      if (!a.isRead && b.isRead) return -1;
      if (a.isRead && !b.isRead) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    if (maxItems) {
      result = result.slice(0, maxItems);
    }

    return result;
  }, [alerts, filterType, filterCategory, maxItems]);

  const unreadCount = alerts.filter((a) => !a.isRead).length;

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-gray-500" />
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Alertas
          </h3>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-full">
              {unreadCount} novo{unreadCount > 1 ? 's' : ''}
            </span>
          )}
        </div>

        {alerts.length > 0 && onDismissAll && (
          <button
            onClick={onDismissAll}
            className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            Limpar tudo
          </button>
        )}
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          <button
            onClick={() => setFilterType('all')}
            className={cn(
              'px-3 py-1 text-xs font-medium rounded-full whitespace-nowrap transition-colors',
              filterType === 'all'
                ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
            )}
          >
            Todos
          </button>
          {(['danger', 'warning', 'info', 'success'] as AlertType[]).map((type) => {
            const count = alerts.filter((a) => a.type === type).length;
            if (count === 0) return null;

            return (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={cn(
                  'px-3 py-1 text-xs font-medium rounded-full whitespace-nowrap transition-colors',
                  filterType === type
                    ? alertColors[type].bg + ' ' + alertColors[type].text
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                )}
              >
                {type === 'danger' && 'Críticos'}
                {type === 'warning' && 'Alertas'}
                {type === 'info' && 'Info'}
                {type === 'success' && 'Positivos'}
                {' '}({count})
              </button>
            );
          })}
        </div>
      )}

      {/* Alerts */}
      {filteredAlerts.length === 0 ? (
        <div className="py-8 text-center">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
          <p className="text-gray-500 dark:text-gray-400">
            Nenhum alerta no momento
          </p>
        </div>
      ) : (
        <div className={cn('space-y-3', compact && 'space-y-2')}>
          {filteredAlerts.map((alert) => (
            <AlertItem
              key={alert.id}
              alert={alert}
              onDismiss={onDismiss}
              onAction={onAction}
              compact={compact}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Alert Banner (for top of page)
interface AlertBannerProps {
  alert: FinancialAlert;
  onDismiss?: () => void;
  onAction?: () => void;
}

export function AlertBanner({ alert, onDismiss, onAction }: AlertBannerProps) {
  const colors = alertColors[alert.type];
  const Icon = alertIcons[alert.type];

  return (
    <div className={cn('px-4 py-3', colors.bg, colors.border, 'border-b')}>
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Icon className={cn('w-5 h-5', colors.icon)} />
          <p className={cn('text-sm font-medium', colors.text)}>
            <span className="font-semibold">{alert.title}:</span> {alert.message}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {alert.actionLabel && onAction && (
            <button
              onClick={onAction}
              className={cn(
                'px-3 py-1 text-sm font-medium rounded-lg transition-colors',
                colors.text,
                'hover:bg-black/5 dark:hover:bg-white/5'
              )}
            >
              {alert.actionLabel}
            </button>
          )}
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Alert Settings (for configuring alert preferences)
interface AlertSetting {
  id: string;
  category: AlertCategory;
  label: string;
  description: string;
  enabled: boolean;
  threshold?: number;
}

interface AlertSettingsProps {
  settings: AlertSetting[];
  onChange: (id: string, enabled: boolean, threshold?: number) => void;
  className?: string;
}

export function AlertSettings({ settings, onChange, className }: AlertSettingsProps) {
  return (
    <div className={className}>
      <div className="flex items-center gap-2 mb-4">
        <Settings className="w-5 h-5 text-gray-500" />
        <h3 className="font-semibold text-gray-900 dark:text-white">
          Configurações de Alertas
        </h3>
      </div>

      <div className="space-y-4">
        {settings.map((setting) => {
          const CategoryIcon = categoryIcons[setting.category];

          return (
            <div
              key={setting.id}
              className="flex items-start justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-white dark:bg-gray-700 rounded-lg">
                  <CategoryIcon className="w-4 h-4 text-gray-500" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {setting.label}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {setting.description}
                  </p>
                  {setting.threshold !== undefined && (
                    <div className="mt-2 flex items-center gap-2">
                      <label className="text-xs text-gray-500">Limite:</label>
                      <input
                        type="number"
                        value={setting.threshold}
                        onChange={(e) =>
                          onChange(setting.id, setting.enabled, Number(e.target.value))
                        }
                        className="w-20 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900"
                      />
                    </div>
                  )}
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={setting.enabled}
                  onChange={(e) =>
                    onChange(setting.id, e.target.checked, setting.threshold)
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-primary-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600" />
              </label>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Generate common financial alerts
export function generateFinancialAlerts(data: {
  overduesBills?: number;
  overdueBillsAmount?: number;
  upcomingBills?: number;
  upcomingBillsAmount?: number;
  budgetUsage?: number;
  lowBalance?: boolean;
  currentBalance?: number;
  goalProgress?: { name: string; progress: number }[];
  expiringSubscriptions?: { name: string; daysUntil: number }[];
}): FinancialAlert[] {
  const alerts: FinancialAlert[] = [];
  const now = new Date().toISOString();

  if (data.overduesBills && data.overduesBills > 0) {
    alerts.push({
      id: 'overdue-bills',
      type: 'danger',
      category: 'bill',
      title: 'Contas vencidas',
      message: `Você tem ${data.overduesBills} conta${data.overduesBills > 1 ? 's' : ''} vencida${data.overduesBills > 1 ? 's' : ''}`,
      amount: data.overdueBillsAmount,
      actionLabel: 'Ver contas',
      dismissible: false,
      createdAt: now,
    });
  }

  if (data.budgetUsage && data.budgetUsage >= 80) {
    alerts.push({
      id: 'budget-warning',
      type: data.budgetUsage >= 100 ? 'danger' : 'warning',
      category: 'budget',
      title: data.budgetUsage >= 100 ? 'Orçamento excedido' : 'Orçamento próximo do limite',
      message: `Você utilizou ${data.budgetUsage.toFixed(0)}% do seu orçamento mensal`,
      actionLabel: 'Ver orçamento',
      dismissible: true,
      createdAt: now,
    });
  }

  if (data.lowBalance && data.currentBalance !== undefined) {
    alerts.push({
      id: 'low-balance',
      type: 'warning',
      category: 'balance',
      title: 'Saldo baixo',
      message: 'Seu saldo está abaixo do recomendado',
      amount: data.currentBalance,
      actionLabel: 'Ver detalhes',
      dismissible: true,
      createdAt: now,
    });
  }

  if (data.upcomingBills && data.upcomingBills > 0) {
    alerts.push({
      id: 'upcoming-bills',
      type: 'info',
      category: 'bill',
      title: 'Contas a vencer',
      message: `${data.upcomingBills} conta${data.upcomingBills > 1 ? 's' : ''} vence${data.upcomingBills > 1 ? 'm' : ''} nos próximos 7 dias`,
      amount: data.upcomingBillsAmount,
      actionLabel: 'Ver contas',
      dismissible: true,
      createdAt: now,
    });
  }

  data.goalProgress?.forEach((goal) => {
    if (goal.progress >= 100) {
      alerts.push({
        id: `goal-${goal.name}`,
        type: 'success',
        category: 'goal',
        title: 'Meta atingida! 🎉',
        message: `Você atingiu sua meta "${goal.name}"`,
        actionLabel: 'Ver metas',
        dismissible: true,
        createdAt: now,
      });
    }
  });

  data.expiringSubscriptions?.forEach((sub) => {
    if (sub.daysUntil <= 3) {
      alerts.push({
        id: `sub-${sub.name}`,
        type: 'info',
        category: 'subscription',
        title: 'Assinatura expirando',
        message: `${sub.name} expira em ${sub.daysUntil} dia${sub.daysUntil > 1 ? 's' : ''}`,
        actionLabel: 'Ver assinatura',
        dismissible: true,
        createdAt: now,
      });
    }
  });

  return alerts;
}

export type { FinancialAlert, AlertType, AlertCategory, AlertSetting };
export default AlertsList;
