import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowUpRight,
  ArrowDownRight,
  LucideIcon,
} from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

type TrendDirection = 'up' | 'down' | 'neutral';
type StatVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon | ReactNode;
  trend?: {
    value: number;
    direction?: TrendDirection;
    label?: string;
  };
  variant?: StatVariant;
  loading?: boolean;
  onClick?: () => void;
  className?: string;
}

interface StatCardGroupProps {
  children: ReactNode;
  columns?: 2 | 3 | 4;
  className?: string;
}

// ============================================================================
// Variant Styles
// ============================================================================

const variantStyles: Record<StatVariant, {
  bg: string;
  iconBg: string;
  iconColor: string;
}> = {
  default: {
    bg: 'bg-white dark:bg-gray-800',
    iconBg: 'bg-gray-100 dark:bg-gray-700',
    iconColor: 'text-gray-600 dark:text-gray-300',
  },
  primary: {
    bg: 'bg-white dark:bg-gray-800',
    iconBg: 'bg-blue-100 dark:bg-blue-900/30',
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
  success: {
    bg: 'bg-white dark:bg-gray-800',
    iconBg: 'bg-green-100 dark:bg-green-900/30',
    iconColor: 'text-green-600 dark:text-green-400',
  },
  warning: {
    bg: 'bg-white dark:bg-gray-800',
    iconBg: 'bg-yellow-100 dark:bg-yellow-900/30',
    iconColor: 'text-yellow-600 dark:text-yellow-400',
  },
  danger: {
    bg: 'bg-white dark:bg-gray-800',
    iconBg: 'bg-red-100 dark:bg-red-900/30',
    iconColor: 'text-red-600 dark:text-red-400',
  },
};

const trendStyles: Record<TrendDirection, {
  color: string;
  bgColor: string;
  Icon: LucideIcon;
}> = {
  up: {
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    Icon: TrendingUp,
  },
  down: {
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    Icon: TrendingDown,
  },
  neutral: {
    color: 'text-gray-600 dark:text-gray-400',
    bgColor: 'bg-gray-50 dark:bg-gray-900/20',
    Icon: Minus,
  },
};

// ============================================================================
// StatCard Component
// ============================================================================

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  variant = 'default',
  loading = false,
  onClick,
  className,
}: StatCardProps) {
  const styles = variantStyles[variant];
  
  const trendDirection = trend?.direction ?? 
    (trend?.value !== undefined 
      ? trend.value > 0 
        ? 'up' 
        : trend.value < 0 
          ? 'down' 
          : 'neutral'
      : undefined);
  
  const trendStyle = trendDirection ? trendStyles[trendDirection] : null;
  const TrendIcon = trendStyle?.Icon;

  const renderIcon = () => {
    if (!icon) return null;
    
    if (typeof icon !== 'function') {
      return icon;
    }
    
    const IconComponent = icon as LucideIcon;
    return <IconComponent className={cn('h-6 w-6', styles.iconColor)} />;
  };

  return (
    <div
      className={cn(
        'relative rounded-lg border border-gray-200 dark:border-gray-700 p-6',
        styles.bg,
        onClick && 'cursor-pointer hover:shadow-md transition-shadow',
        className
      )}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {loading ? (
        <div className="space-y-3 animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24" />
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-32" />
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20" />
        </div>
      ) : (
        <>
          {/* Header with icon */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {title}
              </p>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                {value}
              </p>
            </div>
            
            {icon && (
              <div
                className={cn(
                  'flex items-center justify-center w-12 h-12 rounded-lg',
                  styles.iconBg
                )}
              >
                {renderIcon()}
              </div>
            )}
          </div>

          {/* Subtitle and trend */}
          <div className="mt-4 flex items-center justify-between">
            {subtitle && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {subtitle}
              </p>
            )}
            
            {trend && trendStyle && TrendIcon && (
              <div
                className={cn(
                  'flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
                  trendStyle.bgColor,
                  trendStyle.color
                )}
              >
                <TrendIcon className="h-3 w-3" />
                <span>
                  {trend.value > 0 ? '+' : ''}
                  {trend.value}%
                </span>
                {trend.label && (
                  <span className="ml-1 opacity-75">{trend.label}</span>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ============================================================================
// StatCardCompact Component
// ============================================================================

interface StatCardCompactProps {
  title: string;
  value: string | number;
  icon?: LucideIcon;
  trend?: number;
  variant?: StatVariant;
  className?: string;
}

export function StatCardCompact({
  title,
  value,
  icon: Icon,
  trend,
  variant = 'default',
  className,
}: StatCardCompactProps) {
  const styles = variantStyles[variant];
  const isPositive = trend !== undefined && trend > 0;
  const isNegative = trend !== undefined && trend < 0;

  return (
    <div
      className={cn(
        'flex items-center gap-4 rounded-lg border border-gray-200 dark:border-gray-700 p-4',
        styles.bg,
        className
      )}
    >
      {Icon && (
        <div
          className={cn(
            'flex items-center justify-center w-10 h-10 rounded-lg',
            styles.iconBg
          )}
        >
          <Icon className={cn('h-5 w-5', styles.iconColor)} />
        </div>
      )}
      
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
          {title}
        </p>
        <div className="flex items-center gap-2">
          <p className="text-xl font-bold text-gray-900 dark:text-white">
            {value}
          </p>
          {trend !== undefined && (
            <span
              className={cn(
                'flex items-center text-xs font-medium',
                isPositive && 'text-green-600',
                isNegative && 'text-red-600',
                !isPositive && !isNegative && 'text-gray-500'
              )}
            >
              {isPositive ? (
                <ArrowUpRight className="h-3 w-3" />
              ) : isNegative ? (
                <ArrowDownRight className="h-3 w-3" />
              ) : null}
              {Math.abs(trend)}%
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// StatCardGroup Component
// ============================================================================

export function StatCardGroup({
  children,
  columns = 4,
  className,
}: StatCardGroupProps) {
  const gridCols = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div className={cn('grid gap-4', gridCols[columns], className)}>
      {children}
    </div>
  );
}

// ============================================================================
// MiniStatCard Component
// ============================================================================

interface MiniStatCardProps {
  label: string;
  value: string | number;
  color?: 'gray' | 'blue' | 'green' | 'yellow' | 'red';
  className?: string;
}

export function MiniStatCard({
  label,
  value,
  color = 'gray',
  className,
}: MiniStatCardProps) {
  const colorStyles = {
    gray: 'border-l-gray-500',
    blue: 'border-l-blue-500',
    green: 'border-l-green-500',
    yellow: 'border-l-yellow-500',
    red: 'border-l-red-500',
  };

  return (
    <div
      className={cn(
        'bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700',
        'border-l-4 p-4',
        colorStyles[color],
        className
      )}
    >
      <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
        {value}
      </p>
    </div>
  );
}
