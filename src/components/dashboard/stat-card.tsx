import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus, ArrowUpRight, ArrowDownRight, LucideIcon } from 'lucide-react';

type TrendDirection = 'up' | 'down' | 'neutral';
type StatVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger';

interface StatCardProps {
  title: string; value: string | number; subtitle?: string; icon?: LucideIcon | ReactNode;
  trend?: { value: number; direction?: TrendDirection; label?: string };
  variant?: StatVariant; loading?: boolean; onClick?: () => void; className?: string;
}

const variantStyles: Record<StatVariant, { bg: string; iconBg: string; iconColor: string }> = {
  default: { bg: 'bg-card', iconBg: 'bg-muted', iconColor: 'text-muted-foreground' },
  primary: { bg: 'bg-card', iconBg: 'bg-secondary/10', iconColor: 'text-secondary' },
  success: { bg: 'bg-card', iconBg: 'bg-success/10', iconColor: 'text-success' },
  warning: { bg: 'bg-card', iconBg: 'bg-warning/10', iconColor: 'text-warning' },
  danger: { bg: 'bg-card', iconBg: 'bg-destructive/10', iconColor: 'text-destructive' },
};

const trendStyles: Record<TrendDirection, { color: string; bgColor: string; Icon: LucideIcon }> = {
  up: { color: 'text-success', bgColor: 'bg-success/10', Icon: TrendingUp },
  down: { color: 'text-destructive', bgColor: 'bg-destructive/10', Icon: TrendingDown },
  neutral: { color: 'text-muted-foreground', bgColor: 'bg-muted', Icon: Minus },
};

export function StatCard({ title, value, subtitle, icon, trend, variant = 'default', loading = false, onClick, className }: StatCardProps) {
  const styles = variantStyles[variant];
  const trendDirection = trend?.direction ?? (trend?.value !== undefined ? trend.value > 0 ? 'up' : trend.value < 0 ? 'down' : 'neutral' : undefined);
  const trendStyle = trendDirection ? trendStyles[trendDirection] : null;
  const TrendIcon = trendStyle?.Icon;

  const renderIcon = () => {
    if (!icon) return null;
    if (typeof icon !== 'function') return icon;
    const IconComponent = icon as LucideIcon;
    return <IconComponent className={cn('h-6 w-6', styles.iconColor)} />;
  };

  return (
    <div className={cn('relative rounded-lg border border-border p-6', styles.bg, onClick && 'cursor-pointer hover:shadow-md transition-shadow', className)} onClick={onClick} role={onClick ? 'button' : undefined} tabIndex={onClick ? 0 : undefined}>
      {loading ? (
        <div className="space-y-3 animate-pulse">
          <div className="h-4 bg-muted rounded w-24" /><div className="h-8 bg-muted rounded w-32" /><div className="h-3 bg-muted rounded w-20" />
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
              <p className="mt-2 text-3xl font-bold text-foreground">{value}</p>
            </div>
            {icon && (<div className={cn('flex items-center justify-center w-12 h-12 rounded-lg', styles.iconBg)}>{renderIcon()}</div>)}
          </div>
          <div className="mt-4 flex items-center justify-between">
            {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
            {trend && trendStyle && TrendIcon && (
              <div className={cn('flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium', trendStyle.bgColor, trendStyle.color)}>
                <TrendIcon className="h-3 w-3" />
                <span>{trend.value > 0 ? '+' : ''}{trend.value}%</span>
                {trend.label && <span className="ml-1 opacity-75">{trend.label}</span>}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export function StatCardCompact({ title, value, icon: Icon, trend, variant = 'default', className }: {
  title: string; value: string | number; icon?: LucideIcon; trend?: number; variant?: StatVariant; className?: string;
}) {
  const styles = variantStyles[variant];
  const isPositive = trend !== undefined && trend > 0;
  const isNegative = trend !== undefined && trend < 0;

  return (
    <div className={cn('flex items-center gap-4 rounded-lg border border-border p-4', styles.bg, className)}>
      {Icon && (<div className={cn('flex items-center justify-center w-10 h-10 rounded-lg', styles.iconBg)}><Icon className={cn('h-5 w-5', styles.iconColor)} /></div>)}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-muted-foreground truncate">{title}</p>
        <div className="flex items-center gap-2">
          <p className="text-xl font-bold text-foreground">{value}</p>
          {trend !== undefined && (
            <span className={cn('flex items-center text-xs font-medium', isPositive && 'text-success', isNegative && 'text-destructive', !isPositive && !isNegative && 'text-muted-foreground')}>
              {isPositive ? <ArrowUpRight className="h-3 w-3" /> : isNegative ? <ArrowDownRight className="h-3 w-3" /> : null}
              {Math.abs(trend)}%
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function StatCardGroup({ children, columns = 4, className }: { children: ReactNode; columns?: 2 | 3 | 4; className?: string }) {
  const gridCols = { 2: 'grid-cols-1 sm:grid-cols-2', 3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3', 4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4' };
  return <div className={cn('grid gap-4', gridCols[columns], className)}>{children}</div>;
}

export function MiniStatCard({ label, value, color = 'gray', className }: { label: string; value: string | number; color?: 'gray' | 'blue' | 'green' | 'yellow' | 'red'; className?: string }) {
  const colorStyles = {
    gray: 'border-l-muted-foreground', blue: 'border-l-secondary', green: 'border-l-success', yellow: 'border-l-warning', red: 'border-l-destructive',
  };

  return (
    <div className={cn('bg-card rounded-lg border border-border border-l-4 p-4', colorStyles[color], className)}>
      <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="mt-1 text-2xl font-bold text-foreground">{value}</p>
    </div>
  );
}
