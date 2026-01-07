import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, LucideIcon, InfoIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: {
    value: number;
    label?: string;
    inverted?: boolean; // Se true, negativo é bom (ex: despesas)
  };
  format?: 'currency' | 'percentage' | 'number' | 'none';
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  tooltip?: string;
  className?: string;
  onClick?: () => void;
}

const variantStyles = {
  default: {
    container: 'bg-card',
    icon: 'bg-muted text-muted-foreground',
    value: 'text-foreground',
  },
  success: {
    container: 'bg-card border-green-200 dark:border-green-900',
    icon: 'bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400',
    value: 'text-green-600 dark:text-green-400',
  },
  warning: {
    container: 'bg-card border-amber-200 dark:border-amber-900',
    icon: 'bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400',
    value: 'text-amber-600 dark:text-amber-400',
  },
  danger: {
    container: 'bg-card border-red-200 dark:border-red-900',
    icon: 'bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400',
    value: 'text-red-600 dark:text-red-400',
  },
  info: {
    container: 'bg-card border-blue-200 dark:border-blue-900',
    icon: 'bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400',
    value: 'text-blue-600 dark:text-blue-400',
  },
};

const sizeStyles = {
  sm: {
    container: 'p-4',
    icon: 'h-8 w-8',
    iconWrapper: 'p-2',
    title: 'text-xs',
    value: 'text-xl',
    subtitle: 'text-xs',
  },
  md: {
    container: 'p-5',
    icon: 'h-10 w-10',
    iconWrapper: 'p-2.5',
    title: 'text-sm',
    value: 'text-2xl',
    subtitle: 'text-sm',
  },
  lg: {
    container: 'p-6',
    icon: 'h-12 w-12',
    iconWrapper: 'p-3',
    title: 'text-sm',
    value: 'text-3xl',
    subtitle: 'text-sm',
  },
};

function formatValue(value: string | number, format: KPICardProps['format']): string {
  if (typeof value === 'string') return value;

  switch (format) {
    case 'currency':
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2,
      }).format(value);
    case 'percentage':
      return `${value.toFixed(1)}%`;
    case 'number':
      return new Intl.NumberFormat('pt-BR').format(value);
    default:
      return String(value);
  }
}

export function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  format = 'none',
  variant = 'default',
  size = 'md',
  loading = false,
  tooltip,
  className,
  onClick,
}: KPICardProps) {
  const styles = variantStyles[variant];
  const sizes = sizeStyles[size];

  const getTrendColor = () => {
    if (!trend) return '';
    const isPositive = trend.inverted ? trend.value < 0 : trend.value > 0;
    const isNegative = trend.inverted ? trend.value > 0 : trend.value < 0;
    if (isPositive) return 'text-green-600 dark:text-green-400';
    if (isNegative) return 'text-red-600 dark:text-red-400';
    return 'text-muted-foreground';
  };

  const TrendIcon = trend
    ? trend.value > 0
      ? TrendingUp
      : trend.value < 0
      ? TrendingDown
      : Minus
    : null;

  const content = (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={onClick ? { scale: 1.02 } : undefined}
      className={cn(
        'rounded-xl border shadow-sm transition-all duration-200',
        styles.container,
        sizes.container,
        onClick && 'cursor-pointer hover:shadow-md',
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className={cn('font-medium text-muted-foreground truncate', sizes.title)}>
              {title}
            </p>
            {tooltip && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <InfoIcon className="h-3.5 w-3.5 text-muted-foreground/50 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-[200px]">{tooltip}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>

          {loading ? (
            <div className={cn('mt-2 h-8 w-24 bg-muted rounded animate-pulse', sizes.value)} />
          ) : (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={cn('font-bold mt-1 truncate', sizes.value, styles.value)}
            >
              {formatValue(value, format)}
            </motion.p>
          )}

          {(subtitle || trend) && (
            <div className="flex items-center gap-2 mt-2">
              {trend && TrendIcon && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={cn('flex items-center gap-0.5 font-medium', getTrendColor())}
                >
                  <TrendIcon className="h-3.5 w-3.5" />
                  <span className="text-xs">
                    {Math.abs(trend.value).toFixed(1)}%
                  </span>
                </motion.span>
              )}
              {(subtitle || trend?.label) && (
                <span className={cn('text-muted-foreground', sizes.subtitle)}>
                  {trend?.label || subtitle}
                </span>
              )}
            </div>
          )}
        </div>

        {Icon && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className={cn('rounded-xl flex-shrink-0', styles.icon, sizes.iconWrapper)}
          >
            <Icon className={sizes.icon} />
          </motion.div>
        )}
      </div>
    </motion.div>
  );

  return content;
}

// Grid de KPIs
interface KPIGridProps {
  children: React.ReactNode;
  columns?: 2 | 3 | 4 | 5;
  className?: string;
}

export function KPIGrid({ children, columns = 4, className }: KPIGridProps) {
  const gridCols = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5',
  };

  return (
    <div className={cn('grid gap-4', gridCols[columns], className)}>
      {children}
    </div>
  );
}
