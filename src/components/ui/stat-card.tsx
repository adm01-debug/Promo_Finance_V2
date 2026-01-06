import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardContent } from './card';

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: LucideIcon;
  trend?: {
    value: number;
    label?: string;
  };
  description?: string;
  variant?: 'default' | 'success' | 'warning' | 'destructive' | 'primary';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  loading?: boolean;
}

export function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  description,
  variant = 'default',
  size = 'md',
  className,
  loading = false,
}: StatCardProps) {
  const variantStyles = {
    default: {
      iconBg: 'bg-muted',
      iconColor: 'text-muted-foreground',
      accent: 'bg-muted',
    },
    primary: {
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary',
      accent: 'bg-primary',
    },
    success: {
      iconBg: 'bg-success/10',
      iconColor: 'text-success',
      accent: 'bg-success',
    },
    warning: {
      iconBg: 'bg-warning/10',
      iconColor: 'text-warning',
      accent: 'bg-warning',
    },
    destructive: {
      iconBg: 'bg-destructive/10',
      iconColor: 'text-destructive',
      accent: 'bg-destructive',
    },
  };

  const sizeStyles = {
    sm: { padding: 'p-4', icon: 'h-8 w-8', iconSize: 'h-4 w-4', title: 'text-xs', value: 'text-lg' },
    md: { padding: 'p-5', icon: 'h-12 w-12', iconSize: 'h-6 w-6', title: 'text-sm', value: 'text-2xl' },
    lg: { padding: 'p-6', icon: 'h-14 w-14', iconSize: 'h-7 w-7', title: 'text-base', value: 'text-3xl' },
  };

  const styles = variantStyles[variant];
  const sizes = sizeStyles[size];

  const TrendIcon = trend 
    ? trend.value > 0 
      ? TrendingUp 
      : trend.value < 0 
        ? TrendingDown 
        : Minus
    : null;

  const trendColor = trend
    ? trend.value > 0
      ? 'text-success'
      : trend.value < 0
        ? 'text-destructive'
        : 'text-muted-foreground'
    : '';

  return (
    <Card className={cn('overflow-hidden group', className)}>
      <CardContent className={sizes.padding}>
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className={cn('font-medium text-muted-foreground', sizes.title)}>
              {title}
            </p>
            {loading ? (
              <div className={cn('h-8 w-24 bg-muted animate-pulse rounded', sizes.value)} />
            ) : (
              <motion.p 
                className={cn('font-bold', sizes.value)}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {value}
              </motion.p>
            )}
            {trend && (
              <div className={cn('flex items-center gap-1 text-sm', trendColor)}>
                {TrendIcon && <TrendIcon className="h-4 w-4" />}
                <span className="font-medium">
                  {trend.value > 0 ? '+' : ''}{trend.value}%
                </span>
                {trend.label && (
                  <span className="text-muted-foreground text-xs">
                    {trend.label}
                  </span>
                )}
              </div>
            )}
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
          {Icon && (
            <motion.div 
              className={cn(
                'rounded-xl flex items-center justify-center',
                styles.iconBg,
                sizes.icon
              )}
              whileHover={{ scale: 1.05, rotate: 5 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <Icon className={cn(sizes.iconSize, styles.iconColor)} />
            </motion.div>
          )}
        </div>
      </CardContent>
      <div className={cn('h-1 w-full', styles.accent)} />
    </Card>
  );
}

// Mini stat for compact displays
interface MiniStatProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  className?: string;
}

export function MiniStat({ label, value, icon: Icon, className }: MiniStatProps) {
  return (
    <div className={cn('flex items-center gap-3 p-3 rounded-lg bg-muted/50', className)}>
      {Icon && (
        <div className="h-8 w-8 rounded-lg bg-background flex items-center justify-center">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
      )}
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold">{value}</p>
      </div>
    </div>
  );
}

// Comparison stat
interface ComparisonStatProps {
  title: string;
  current: number;
  previous: number;
  formatter?: (value: number) => string;
  className?: string;
}

export function ComparisonStat({ 
  title, 
  current, 
  previous, 
  formatter = (v) => v.toLocaleString('pt-BR'),
  className 
}: ComparisonStatProps) {
  const diff = current - previous;
  const percentChange = previous !== 0 ? ((diff / previous) * 100) : 0;
  const isPositive = diff >= 0;

  return (
    <div className={cn('space-y-2', className)}>
      <p className="text-sm text-muted-foreground">{title}</p>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold">{formatter(current)}</span>
        <span className={cn(
          'text-sm font-medium',
          isPositive ? 'text-success' : 'text-destructive'
        )}>
          {isPositive ? '+' : ''}{percentChange.toFixed(1)}%
        </span>
      </div>
      <p className="text-xs text-muted-foreground">
        vs. anterior: {formatter(previous)}
      </p>
    </div>
  );
}

// Stat with sparkline
interface SparklineStatProps {
  title: string;
  value: string | number;
  data: number[];
  className?: string;
}

export function SparklineStat({ title, value, data, className }: SparklineStatProps) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - ((v - min) / range) * 100;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className={cn('space-y-2', className)}>
      <p className="text-sm text-muted-foreground">{title}</p>
      <p className="text-2xl font-bold">{value}</p>
      <svg className="w-full h-8" viewBox="0 0 100 100" preserveAspectRatio="none">
        <polyline
          points={points}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
