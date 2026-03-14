import { useMemo } from 'react';
import {
  TrendingUp, TrendingDown, DollarSign, ArrowUpRight, ArrowDownRight,
  Clock, AlertTriangle, CheckCircle, Calendar, PieChart, BarChart3,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/financial-calculations';

// =====================
// Stat Card Widget
// =====================

interface StatCardProps {
  title: string;
  value: number | string;
  change?: number;
  changeLabel?: string;
  icon?: typeof DollarSign;
  trend?: 'up' | 'down' | 'neutral';
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple';
  loading?: boolean;
  isCurrency?: boolean;
}

export function StatCard({
  title, value, change, changeLabel, icon: Icon = DollarSign,
  trend, color = 'blue', loading = false, isCurrency = true,
}: StatCardProps) {
  const colorClasses = {
    blue: 'bg-secondary/10 text-secondary',
    green: 'bg-success/10 text-success',
    red: 'bg-destructive/10 text-destructive',
    yellow: 'bg-warning/10 text-warning',
    purple: 'bg-primary/10 text-primary',
  };

  const trendColor = trend === 'up' ? 'text-success' : trend === 'down' ? 'text-destructive' : 'text-muted-foreground';
  const TrendIcon = trend === 'up' ? ArrowUpRight : ArrowDownRight;

  if (loading) {
    return (
      <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-muted rounded w-24" />
          <div className="h-8 bg-muted rounded w-32" />
          <div className="h-3 bg-muted rounded w-20" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">{title}</span>
        <div className={cn('p-2 rounded-lg', colorClasses[color])}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="mt-3">
        <span className="text-2xl font-bold text-foreground">
          {isCurrency && typeof value === 'number' ? formatCurrency(value) : value}
        </span>
      </div>
      {(change !== undefined || changeLabel) && (
        <div className="mt-2 flex items-center gap-1">
          {change !== undefined && (
            <>
              <TrendIcon className={cn('w-4 h-4', trendColor)} />
              <span className={cn('text-sm font-medium', trendColor)}>
                {change > 0 ? '+' : ''}{change}%
              </span>
            </>
          )}
          {changeLabel && <span className="text-sm text-muted-foreground">{changeLabel}</span>}
        </div>
      )}
    </div>
  );
}

// =====================
// Mini Chart Widget
// =====================

interface MiniChartProps { data: number[]; color?: string; height?: number; }

export function MiniChart({ data, color = 'hsl(var(--primary))', height = 40 }: MiniChartProps) {
  const points = useMemo(() => {
    if (data.length === 0) return '';
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    const width = 100;
    const step = width / (data.length - 1);
    return data.map((value, i) => {
      const x = i * step;
      const y = height - ((value - min) / range) * (height - 4);
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
  }, [data, height]);

  if (data.length === 0) return null;

  return (
    <svg viewBox={`0 0 100 ${height}`} className="w-full" preserveAspectRatio="none">
      <path d={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// =====================
// Due Bills Widget
// =====================

interface Bill { id: string; description: string; value: number; dueDate: Date; status: 'pending' | 'overdue' | 'paid'; }

interface DueBillsWidgetProps {
  bills: Bill[]; title?: string; onViewAll?: () => void; onPayBill?: (id: string) => void;
}

export function DueBillsWidget({ bills, title = 'Próximos Vencimentos', onViewAll, onPayBill }: DueBillsWidgetProps) {
  const sortedBills = useMemo(() => {
    return [...bills].filter((b) => b.status !== 'paid')
      .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime()).slice(0, 5);
  }, [bills]);

  const formatDate = (date: Date) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (date.toDateString() === today.toDateString()) return 'Hoje';
    if (date.toDateString() === tomorrow.toDateString()) return 'Amanhã';
    return date.toLocaleDateString('pt-BR');
  };

  const getStatusColor = (bill: Bill) => {
    if (bill.status === 'overdue') return 'text-destructive bg-destructive/10';
    const today = new Date();
    const daysDiff = Math.ceil((bill.dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff <= 3) return 'text-warning bg-warning/10';
    return 'text-muted-foreground bg-muted';
  };

  return (
    <div className="bg-card rounded-xl shadow-sm border border-border">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <Calendar className="w-5 h-5 text-muted-foreground" />
          {title}
        </h3>
        {onViewAll && (
          <button onClick={onViewAll} className="text-sm text-primary hover:text-primary/80">Ver todos</button>
        )}
      </div>
      <div className="divide-y divide-border">
        {sortedBills.length === 0 ? (
          <div className="px-6 py-8 text-center text-muted-foreground">
            <CheckCircle className="w-10 h-10 mx-auto mb-2 text-success" />
            <p>Nenhuma conta pendente</p>
          </div>
        ) : (
          sortedBills.map((bill) => (
            <div key={bill.id} className="px-6 py-3 flex items-center justify-between hover:bg-muted/50">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{bill.description}</p>
                <p className="text-sm text-muted-foreground">{formatCurrency(bill.value)}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={cn('px-2 py-1 rounded text-xs font-medium', getStatusColor(bill))}>
                  {formatDate(bill.dueDate)}
                </span>
                {onPayBill && bill.status !== 'paid' && (
                  <button onClick={() => onPayBill(bill.id)} className="p-1.5 hover:bg-muted rounded" title="Pagar">
                    <CheckCircle className="w-4 h-4 text-muted-foreground" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// =====================
// Cash Flow Summary Widget
// =====================

interface CashFlowSummaryProps { income: number; expenses: number; period?: string; }

export function CashFlowSummary({ income, expenses, period = 'Este mês' }: CashFlowSummaryProps) {
  const balance = income - expenses;
  const isPositive = balance >= 0;

  return (
    <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground">Fluxo de Caixa</h3>
        <span className="text-sm text-muted-foreground">{period}</span>
      </div>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded bg-success/10"><TrendingUp className="w-4 h-4 text-success" /></div>
            <span className="text-sm text-muted-foreground">Receitas</span>
          </div>
          <span className="font-semibold text-success">{formatCurrency(income)}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded bg-destructive/10"><TrendingDown className="w-4 h-4 text-destructive" /></div>
            <span className="text-sm text-muted-foreground">Despesas</span>
          </div>
          <span className="font-semibold text-destructive">{formatCurrency(expenses)}</span>
        </div>
        <div className="pt-3 border-t border-border">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Saldo</span>
            <span className={cn('text-lg font-bold', isPositive ? 'text-success' : 'text-destructive')}>
              {formatCurrency(balance)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// =====================
// Alert Widget
// =====================

interface AlertItem { id: string; type: 'warning' | 'danger' | 'info'; message: string; action?: { label: string; onClick: () => void }; }

interface AlertsWidgetProps { alerts: AlertItem[]; title?: string; }

export function AlertsWidget({ alerts, title = 'Alertas' }: AlertsWidgetProps) {
  const icons = { warning: AlertTriangle, danger: AlertTriangle, info: Clock };
  const colors = {
    warning: 'bg-warning/10 text-warning border-warning/20',
    danger: 'bg-destructive/10 text-destructive border-destructive/20',
    info: 'bg-secondary/10 text-secondary border-secondary/20',
  };

  if (alerts.length === 0) return null;

  return (
    <div className="bg-card rounded-xl shadow-sm border border-border">
      <div className="px-6 py-4 border-b border-border">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-warning" />
          {title}
          <span className="ml-2 px-2 py-0.5 bg-destructive/10 text-destructive text-xs font-medium rounded-full">
            {alerts.length}
          </span>
        </h3>
      </div>
      <div className="p-4 space-y-3">
        {alerts.map((alert) => {
          const Icon = icons[alert.type];
          return (
            <div key={alert.id} className={cn('flex items-start gap-3 p-3 rounded-lg border', colors[alert.type])}>
              <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm">{alert.message}</p>
                {alert.action && (
                  <button onClick={alert.action.onClick} className="mt-2 text-sm font-medium underline hover:no-underline">
                    {alert.action.label}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// =====================
// Quick Stats Row
// =====================

interface QuickStatsRowProps {
  stats: Array<{ label: string; value: number | string; trend?: 'up' | 'down' | 'neutral'; isCurrency?: boolean; }>;
}

export function QuickStatsRow({ stats }: QuickStatsRowProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <div key={index} className="bg-card rounded-lg p-4 shadow-sm border border-border">
          <p className="text-sm text-muted-foreground">{stat.label}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xl font-bold text-foreground">
              {stat.isCurrency !== false && typeof stat.value === 'number' ? formatCurrency(stat.value) : stat.value}
            </span>
            {stat.trend && (
              stat.trend === 'up' ? <TrendingUp className="w-4 h-4 text-success" />
              : stat.trend === 'down' ? <TrendingDown className="w-4 h-4 text-destructive" /> : null
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default { StatCard, MiniChart, DueBillsWidget, CashFlowSummary, AlertsWidget, QuickStatsRow };
