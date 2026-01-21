import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatTrendProps {
  value: number;
  label?: string;
  inverted?: boolean;
  showIcon?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function StatTrend({
  value,
  label,
  inverted = false,
  showIcon = true,
  className,
  size = 'md',
}: StatTrendProps) {
  const isPositive = value > 0;
  const isNegative = value < 0;
  const isNeutral = value === 0;

  // When inverted, positive means bad (e.g., expenses going up)
  const isGood = inverted ? isNegative : isPositive;
  const isBad = inverted ? isPositive : isNegative;

  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const Icon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 font-medium',
        sizeClasses[size],
        isGood && 'text-green-600 dark:text-green-400',
        isBad && 'text-red-600 dark:text-red-400',
        isNeutral && 'text-gray-500 dark:text-gray-400',
        className
      )}
    >
      {showIcon && <Icon className={iconSizes[size]} />}
      <span>
        {isPositive && '+'}
        {value.toFixed(1)}%
      </span>
      {label && <span className="text-gray-500 dark:text-gray-400 font-normal">{label}</span>}
    </span>
  );
}

interface StatComparisonProps {
  current: number;
  previous: number;
  format?: (value: number) => string;
  inverted?: boolean;
  className?: string;
}

export function StatComparison({
  current,
  previous,
  format = (v) => v.toLocaleString(),
  inverted = false,
  className,
}: StatComparisonProps) {
  const diff = previous !== 0 ? ((current - previous) / previous) * 100 : 0;

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span className="text-gray-500 dark:text-gray-400 text-sm">
        vs {format(previous)}
      </span>
      <StatTrend value={diff} inverted={inverted} size="sm" />
    </div>
  );
}

export default StatTrend;
