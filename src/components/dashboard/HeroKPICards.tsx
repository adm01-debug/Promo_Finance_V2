/**
 * Hero KPI Cards - Premium with count-up animations & gradient accents
 */

import { ReactNode, useState } from 'react';
import { motion } from 'framer-motion';
import { LucideIcon, TrendingUp, TrendingDown, ArrowRight, Sparkles, Info } from 'lucide-react';
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

// Color scheme per card type for subtle background gradient
const typeGradients: Record<string, string> = {
  'text-primary': 'from-primary/[0.04] to-transparent',
  'text-success': 'from-success/[0.04] to-transparent',
  'text-destructive': 'from-destructive/[0.04] to-transparent',
  'text-warning': 'from-warning/[0.04] to-transparent',
  'text-secondary': 'from-secondary/[0.04] to-transparent',
};

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
}: HeroKPICardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const config = sizeConfig[size];
  const animatedValue = useCountUp(value, { duration: 1400, decimals: isPercentage ? 1 : 2 });

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
          'relative overflow-hidden transition-all duration-300 cursor-pointer group h-full',
          'border border-border/50',
          `bg-gradient-to-br ${bgGradient}`,
          config.card,
          size === 'hero' && 'shadow-md hover:shadow-lg',
          size === 'primary' && 'shadow-sm hover:shadow-md',
        )}
        style={accentColor ? {
          borderColor: isHovered ? `${accentColor}25` : undefined,
          boxShadow: isHovered ? `0 8px 28px ${accentColor}12` : undefined,
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

        <CardContent className="p-0 h-full">
          <div className="flex items-start justify-between gap-3 h-full">
            <div className="flex-1 flex flex-col justify-between min-h-full space-y-2.5">
              {/* Title */}
              <div className="flex items-center gap-2 flex-wrap">
                <p className={cn('text-muted-foreground', config.title)}>{title}</p>
                {badge && (
                  <Badge variant={badgeVariant} className="text-[9px] px-1.5 py-0 h-4 font-medium">
                    {badge}
                  </Badge>
                )}
                {tooltip && (
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-3 w-3 text-muted-foreground/40 hover:text-muted-foreground transition-colors" />
                    </TooltipTrigger>
                    <TooltipContent>{tooltip}</TooltipContent>
                  </Tooltip>
                )}
              </div>

              {/* Value with count-up */}
              {loading ? (
                <Skeleton className={cn('h-8', size === 'hero' ? 'w-48' : 'w-32')} />
              ) : (
                <p className={cn(config.value, 'text-foreground tabular-nums')}>
                  {formattedValue}
                </p>
              )}

              {/* Variation */}
              <div className={cn(
                'flex items-center gap-1.5 font-medium',
                config.variation,
                isPositive ? 'text-success' : 'text-destructive',
              )}>
                {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                <span>{formatPercentage(Math.abs(variationValue))}</span>
                <span className="text-muted-foreground font-normal">vs mês anterior</span>
              </div>

              {/* Insight */}
              {insight && size === 'hero' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: isHovered ? 1 : 0, height: isHovered ? 'auto' : 0 }}
                  className="overflow-hidden"
                >
                  <div className="flex items-center gap-2 pt-2 text-xs text-muted-foreground border-t border-border/30">
                    <Sparkles className="h-3 w-3 text-primary shrink-0" />
                    {insight}
                  </div>
                </motion.div>
              )}
            </div>

            {/* Icon */}
            <div className={cn(
              'flex items-center justify-center transition-all duration-300',
              'group-hover:scale-110',
              iconBg,
              config.iconWrapper,
            )}>
              <Icon className={cn(iconColor, config.icon)} />
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
