/**
 * Hero KPI Cards - Premium with count-up animations, gradient accents & intelligent empty states
 */

import { ReactNode, useState } from 'react';
import { motion } from 'framer-motion';
import { LucideIcon, TrendingUp, TrendingDown, ArrowRight, Sparkles, Info, Plus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { formatCurrency, formatPercentage } from '@/lib/formatters';
import { useCountUp } from '@/hooks/useCountUp';
import { Link } from 'react-router-dom';

interface HeroKPICardProps {
  title: string;
  value: number;
  previousValue?: number;
  variation?: number;
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  accentColor?: string;
  href?: string;
  isPercentage?: boolean;
  isCurrency?: boolean;
  loading?: boolean;
  tooltip?: string;
  badge?: string;
  badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline';
  size?: 'hero' | 'primary' | 'secondary' | 'mini';
  sparkline?: number[];
  insight?: string;
  emptyStateMessage?: string;
  emptyStateHref?: string;
}

const sizeConfig = {
  hero: {
    card: 'p-5 sm:p-6 md:p-8',
    title: 'text-xs sm:text-sm font-semibold uppercase tracking-wider',
    value: 'text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight',
    icon: 'h-10 w-10 sm:h-12 sm:w-12',
    iconWrapper: 'h-14 w-14 sm:h-16 sm:w-16 md:h-18 md:w-18 rounded-2xl',
    variation: 'text-xs sm:text-sm',
  },
  primary: {
    card: 'p-4 sm:p-5',
    title: 'text-[10px] sm:text-xs font-semibold uppercase tracking-wider',
    value: 'text-xl sm:text-2xl md:text-3xl font-bold',
    icon: 'h-6 w-6 sm:h-7 sm:w-7',
    iconWrapper: 'h-10 w-10 sm:h-12 sm:w-12 rounded-xl',
    variation: 'text-[10px] sm:text-xs',
  },
  secondary: {
    card: 'p-3 sm:p-4',
    title: 'text-[10px] sm:text-xs font-medium uppercase tracking-wider',
    value: 'text-lg sm:text-xl font-bold',
    icon: 'h-4 w-4 sm:h-5 sm:w-5',
    iconWrapper: 'h-8 w-8 sm:h-9 sm:w-9 rounded-lg',
    variation: 'text-[10px] sm:text-xs',
  },
  mini: {
    card: 'p-2 sm:p-3',
    title: 'text-[10px] font-medium',
    value: 'text-sm sm:text-base font-bold',
    icon: 'h-3 w-3 sm:h-4 sm:w-4',
    iconWrapper: 'h-6 w-6 sm:h-7 sm:w-7 rounded-md',
    variation: 'text-[10px]',
  },
};

const typeGradients: Record<string, string> = {
  'text-primary': 'from-primary/[0.04] to-transparent',
  'text-success': 'from-success/[0.04] to-transparent',
  'text-destructive': 'from-destructive/[0.04] to-transparent',
  'text-warning': 'from-warning/[0.04] to-transparent',
  'text-secondary': 'from-secondary/[0.04] to-transparent',
};

// Mini sparkline SVG component
function MiniSparkline({ data, color, className }: { data: number[]; color: string; className?: string }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 60;
  const h = 20;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={w} height={h} className={cn('opacity-40 group-hover:opacity-70 transition-opacity', className)} viewBox={`0 0 ${w} ${h}`}>
      <polyline fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" points={points} />
    </svg>
  );
}

export function HeroKPICard({
  title,
  value,
  previousValue,
  variation,
  icon: Icon,
  iconColor = 'text-primary',
  iconBg = 'bg-primary/10',
  accentColor,
  href,
  isPercentage = false,
  isCurrency = true,
  loading = false,
  tooltip,
  badge,
  badgeVariant = 'secondary',
  size = 'primary',
  sparkline,
  insight,
  emptyStateMessage,
  emptyStateHref,
}: HeroKPICardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const config = sizeConfig[size];
  const animatedValue = useCountUp(value, { duration: 1400, decimals: isPercentage ? 1 : 2 });
  const isZero = value === 0;

  const formattedValue = isPercentage
    ? `${animatedValue.toFixed(1)}%`
    : isCurrency
      ? formatCurrency(animatedValue)
      : animatedValue.toLocaleString('pt-BR');

  const variationValue = variation ?? (previousValue ? ((value - previousValue) / previousValue) * 100 : 0);
  const isPositive = variationValue >= 0;
  const bgGradient = typeGradients[iconColor] || 'from-transparent to-transparent';

  const content = (
    <motion.div
      whileHover={{ scale: 1.012, y: -2 }}
      whileTap={{ scale: 0.99 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="h-full"
    >
      <Card
        className={cn(
          'relative overflow-hidden transition-all duration-500 cursor-pointer group h-full',
          'border border-white/10 bg-background/20 backdrop-blur-2xl',
          'shadow-[0_8px_32px_-8px_rgba(0,0,0,0.2)] hover:shadow-[0_24px_48px_-12px_rgba(0,0,0,0.3)]',
          'ring-1 ring-white/5 hover:ring-white/20',
          config.card,
          size === 'hero' && 'rounded-[2rem]',
          size !== 'hero' && 'rounded-[1.5rem]',
        )}
        style={accentColor ? {
          borderColor: isHovered ? `${accentColor}40` : undefined,
          boxShadow: isHovered ? `0 20px 50px ${accentColor}15` : undefined,
        } : undefined}
      >
        {/* Top accent line */}
        <div
          className="absolute top-0 left-0 right-0 h-[2px]"
          style={{
            background: accentColor
              ? `linear-gradient(90deg, ${accentColor}80, ${accentColor}30, transparent)`
              : 'linear-gradient(90deg, hsl(var(--primary)/0.5), transparent)',
          }}
        />

        <CardContent className="p-8 h-full">
          <div className="flex flex-col justify-between h-full space-y-8">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className={cn('text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60', size === 'hero' ? 'text-xs' : '')}>{title}</p>
                  {badge && (
                    <Badge variant={badgeVariant} className="text-[9px] font-black uppercase px-2 py-0.5 h-auto rounded-md border-none bg-current/10">
                      {badge}
                    </Badge>
                  )}
                </div>
                
                {loading ? (
                  <Skeleton className={cn('h-10', size === 'hero' ? 'w-64' : 'w-40')} />
                ) : (
                  <div className="flex items-baseline gap-3">
                    <p className={cn(
                      config.value, 
                      'text-foreground tabular-nums font-black tracking-tighter',
                      isZero && 'text-muted-foreground/40',
                      size === 'hero' ? 'text-5xl md:text-6xl' : 'text-3xl'
                    )}>
                      {formattedValue}
                    </p>
                  </div>
                )}
              </div>

              <motion.div
                className={cn(
                  'flex items-center justify-center transition-all duration-500 rounded-2xl shadow-xl',
                  iconBg,
                  size === 'hero' ? 'h-16 w-16' : 'h-12 w-12'
                )}
                whileHover={{ scale: 1.1, rotate: 10 }}
              >
                <Icon className={cn(iconColor, size === 'hero' ? 'h-8 w-8' : 'h-6 w-6')} />
              </motion.div>
            </div>

            <div className="space-y-4">
              {sparkline && sparkline.length > 1 && (
                <div className="w-full h-12 flex items-end">
                  <MiniSparkline 
                    data={sparkline} 
                    color={accentColor || 'hsl(var(--primary))'}
                    className="w-full h-full opacity-60"
                  />
                </div>
              )}

              <div className="flex items-center justify-between">
                {isZero && emptyStateMessage ? (
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                    <span className="text-[10px] font-bold text-primary uppercase tracking-widest">{emptyStateMessage}</span>
                  </div>
                ) : (
                  <div className={cn(
                    'flex items-center gap-2 px-3 py-1 rounded-full bg-current/5 border border-current/10',
                    isPositive ? 'text-success' : 'text-destructive',
                  )}>
                    {isPositive ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                    <span className="text-xs font-black tabular-nums">{formatPercentage(Math.abs(variationValue))}</span>
                  </div>
                )}

                {insight && size === 'hero' && (
                  <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest">
                    <Sparkles className="h-3 w-3 text-primary" />
                    Intelligence Insight
                  </div>
                )}
              </div>
            </div>
          </div>

          {href && (
            <motion.div
              className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-50 transition-opacity"
              animate={{ x: isHovered ? 2 : 0 }}
            >
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );

  if (href) return <Link to={href} className="h-full block">{content}</Link>;
  return content;
}

// ============================================
// BENTO GRID LAYOUT
// ============================================
interface HeroKPIGridProps {
  children: ReactNode;
  layout?: 'default' | 'hero-first' | 'balanced';
}

export function HeroKPIGrid({ children, layout = 'default' }: HeroKPIGridProps) {
  if (layout === 'hero-first') {
    const childArray = Array.isArray(children) ? children : [children];
    const heroChild = childArray[0];
    const otherChildren = childArray.slice(1);

    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="grid grid-cols-1 lg:grid-cols-5 gap-3 sm:gap-4"
      >
        <div className="lg:col-span-2">{heroChild}</div>
        <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {otherChildren}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className={layout === 'balanced'
        ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4'
        : 'grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4'
      }
    >
      {children}
    </motion.div>
  );
}

// Secondary KPIs row
export function SecondaryKPIs({ items }: {
  items: Array<{ title: string; value: number | string; icon: LucideIcon; iconColor?: string; iconBg?: string; loading?: boolean }>;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 sm:gap-3"
    >
      {items.map((item, index) => (
        <motion.div key={item.title} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }}>
          <Card className="p-2 sm:p-3 hover:shadow-md transition-shadow">
            <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-3">
              <div className={cn('p-1.5 sm:p-2 rounded-md sm:rounded-lg shrink-0', item.iconBg || 'bg-muted')}>
                <item.icon className={cn('h-3 w-3 sm:h-4 sm:w-4', item.iconColor || 'text-muted-foreground')} />
              </div>
              <div className="text-center sm:text-left min-w-0">
                <p className="text-[9px] sm:text-xs text-muted-foreground truncate">{item.title}</p>
                {item.loading ? <Skeleton className="h-4 w-8 mt-0.5 mx-auto sm:mx-0" /> : (
                  <p className="text-sm sm:text-base font-bold truncate">{item.value}</p>
                )}
              </div>
            </div>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  );
}
