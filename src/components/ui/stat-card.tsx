import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { LucideIcon, TrendingUp, TrendingDown, Minus, Sparkles } from 'lucide-react';
import { Card, CardContent } from './card';
import { AnimatedCounter } from './micro-interactions';

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: LucideIcon;
  trend?: {
    value: number;
    label?: string;
  };
  description?: string;
  variant?: 'default' | 'success' | 'warning' | 'destructive' | 'primary' | 'gradient';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  loading?: boolean;
  animate?: boolean;
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
  animate = true,
}: StatCardProps) {
  const variantStyles = {
    default: {
      iconBg: 'bg-muted',
      iconColor: 'text-muted-foreground',
      accent: 'bg-muted',
      cardBg: '',
    },
    primary: {
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary',
      accent: 'bg-gradient-to-r from-primary to-primary/70',
      cardBg: 'bg-gradient-to-br from-primary/5 to-transparent',
    },
    success: {
      iconBg: 'bg-green-500/10',
      iconColor: 'text-green-600',
      accent: 'bg-gradient-to-r from-green-500 to-emerald-500',
      cardBg: 'bg-gradient-to-br from-green-500/5 to-transparent',
    },
    warning: {
      iconBg: 'bg-yellow-500/10',
      iconColor: 'text-yellow-600',
      accent: 'bg-gradient-to-r from-yellow-500 to-orange-500',
      cardBg: 'bg-gradient-to-br from-yellow-500/5 to-transparent',
    },
    destructive: {
      iconBg: 'bg-red-500/10',
      iconColor: 'text-red-600',
      accent: 'bg-gradient-to-r from-red-500 to-rose-500',
      cardBg: 'bg-gradient-to-br from-red-500/5 to-transparent',
    },
    gradient: {
      iconBg: 'bg-gradient-to-br from-primary/20 to-purple-500/20',
      iconColor: 'text-primary',
      accent: 'bg-gradient-to-r from-primary via-purple-500 to-pink-500',
      cardBg: 'bg-gradient-to-br from-primary/5 via-purple-500/5 to-pink-500/5',
    },
  };

  const sizeStyles = {
    sm: { padding: 'p-4', icon: 'h-10 w-10', iconSize: 'h-5 w-5', title: 'text-xs', value: 'text-xl' },
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
      ? 'text-green-600'
      : trend.value < 0
        ? 'text-red-500'
        : 'text-muted-foreground'
    : '';

  const CardWrapper = animate ? motion.div : 'div';
  const cardAnimateProps = animate ? {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    whileHover: { y: -4, transition: { duration: 0.2 } },
  } : {};

  return (
    <CardWrapper {...cardAnimateProps}>
      <Card className={cn('overflow-hidden group hover:shadow-lg transition-all duration-300', styles.cardBg, className)}>
        <CardContent className={sizes.padding}>
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1">
              <p className={cn('font-medium text-muted-foreground', sizes.title)}>
                {title}
              </p>
              {loading ? (
                <div className="space-y-2">
                  <div className={cn('h-8 w-28 bg-muted animate-pulse rounded')} />
                  <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                </div>
              ) : (
                <>
                  <motion.p 
                    className={cn('font-bold tabular-nums', sizes.value)}
                    initial={animate ? { opacity: 0, scale: 0.9 } : undefined}
                    animate={animate ? { opacity: 1, scale: 1 } : undefined}
                    transition={{ delay: 0.1 }}
                  >
                    {typeof value === 'number' ? (
                      <AnimatedCounter value={value} duration={800} />
                    ) : (
                      value
                    )}
                  </motion.p>
                  {trend && (
                    <motion.div 
                      className={cn('flex items-center gap-1.5 text-sm', trendColor)}
                      initial={animate ? { opacity: 0, x: -10 } : undefined}
                      animate={animate ? { opacity: 1, x: 0 } : undefined}
                      transition={{ delay: 0.2 }}
                    >
                      {TrendIcon && (
                        <motion.div
                          animate={trend.value > 0 ? { y: [0, -2, 0] } : trend.value < 0 ? { y: [0, 2, 0] } : {}}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        >
                          <TrendIcon className="h-4 w-4" />
                        </motion.div>
                      )}
                      <span className="font-semibold">
                        {trend.value > 0 ? '+' : ''}{trend.value}%
                      </span>
                      {trend.label && (
                        <span className="text-muted-foreground text-xs">
                          {trend.label}
                        </span>
                      )}
                    </motion.div>
                  )}
                  {description && (
                    <p className="text-xs text-muted-foreground">{description}</p>
                  )}
                </>
              )}
            </div>
            {Icon && (
              <motion.div 
                className={cn(
                  'rounded-xl flex items-center justify-center shadow-sm',
                  styles.iconBg,
                  sizes.icon
                )}
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <Icon className={cn(sizes.iconSize, styles.iconColor)} />
              </motion.div>
            )}
          </div>
        </CardContent>
        <motion.div 
          className={cn('h-1 w-full', styles.accent)}
          initial={animate ? { scaleX: 0 } : undefined}
          animate={animate ? { scaleX: 1 } : undefined}
          transition={{ delay: 0.3, duration: 0.5 }}
          style={{ originX: 0 }}
        />
      </Card>
    </CardWrapper>
  );
}

// Hero Stat Card - Extra large for key metrics
interface HeroStatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: { value: number; label?: string };
  sparkline?: number[];
  className?: string;
}

export function HeroStatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  sparkline,
  className,
}: HeroStatCardProps) {
  const TrendIcon = trend 
    ? trend.value > 0 ? TrendingUp : trend.value < 0 ? TrendingDown : Minus
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -6 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={cn(
        'relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-purple-500/5',
        'border-primary/20 hover:border-primary/40 transition-all duration-300',
        'hover:shadow-xl hover:shadow-primary/10',
        className
      )}>
        {/* Decorative background */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute -top-20 -right-20 w-40 h-40 bg-primary/10 rounded-full blur-3xl"
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 4, repeat: Infinity }}
          />
          <motion.div
            className="absolute -bottom-10 -left-10 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl"
            animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 5, repeat: Infinity }}
          />
        </div>

        <CardContent className="relative p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-2">
              {Icon && (
                <motion.div
                  className="p-2 rounded-lg bg-primary/10"
                  whileHover={{ rotate: 10 }}
                >
                  <Icon className="h-5 w-5 text-primary" />
                </motion.div>
              )}
              <span className="text-sm font-medium text-muted-foreground">{title}</span>
            </div>
            <Sparkles className="h-4 w-4 text-primary/50" />
          </div>

          <motion.p
            className="text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            {typeof value === 'number' ? (
              <AnimatedCounter value={value} duration={1000} />
            ) : (
              value
            )}
          </motion.p>

          {subtitle && (
            <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
          )}

          <div className="flex items-center justify-between mt-4">
            {trend && TrendIcon && (
              <motion.div
                className={cn(
                  'flex items-center gap-1 text-sm font-medium',
                  trend.value > 0 ? 'text-green-600' : trend.value < 0 ? 'text-red-500' : 'text-muted-foreground'
                )}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <TrendIcon className="h-4 w-4" />
                <span>{trend.value > 0 ? '+' : ''}{trend.value}%</span>
                {trend.label && <span className="text-muted-foreground text-xs ml-1">{trend.label}</span>}
              </motion.div>
            )}

            {sparkline && sparkline.length > 0 && (
              <svg className="w-24 h-8" viewBox="0 0 100 30" preserveAspectRatio="none">
                <motion.polyline
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1, delay: 0.3 }}
                  points={sparkline.map((v, i) => {
                    const max = Math.max(...sparkline);
                    const min = Math.min(...sparkline);
                    const range = max - min || 1;
                    const x = (i / (sparkline.length - 1)) * 100;
                    const y = 30 - ((v - min) / range) * 28;
                    return `${x},${y}`;
                  }).join(' ')}
                  fill="none"
                  stroke="hsl(var(--primary))"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
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
