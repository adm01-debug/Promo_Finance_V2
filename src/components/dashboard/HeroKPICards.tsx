/**
 * Hero KPI Cards - Premium Bento Grid Layout
 * 
 * Visual hierarchy: Hero card (large, left) + 3 primary cards (stacked, right)
 * Glassmorphism, gradient accents, polished micro-interactions
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
    title: 'text-sm sm:text-base font-semibold uppercase tracking-wider',
    value: 'text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight',
    icon: 'h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14',
    iconWrapper: 'h-16 w-16 sm:h-18 sm:w-18 md:h-20 md:w-20 rounded-2xl',
    variation: 'text-xs sm:text-sm',
    showSparkline: true,
  },
  primary: {
    card: 'p-4 sm:p-5',
    title: 'text-xs sm:text-sm font-semibold uppercase tracking-wider',
    value: 'text-xl sm:text-2xl md:text-3xl font-bold',
    icon: 'h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8',
    iconWrapper: 'h-11 w-11 sm:h-12 sm:w-12 md:h-14 md:w-14 rounded-xl',
    variation: 'text-[10px] sm:text-xs',
    showSparkline: false,
  },
  secondary: {
    card: 'p-3 sm:p-4',
    title: 'text-[10px] sm:text-xs font-medium uppercase tracking-wider',
    value: 'text-lg sm:text-xl md:text-2xl font-bold',
    icon: 'h-4 w-4 sm:h-5 sm:w-5',
    iconWrapper: 'h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 rounded-lg',
    variation: 'text-[10px] sm:text-xs',
    showSparkline: false,
  },
  mini: {
    card: 'p-2 sm:p-3',
    title: 'text-[10px] sm:text-xs font-medium',
    value: 'text-sm sm:text-base md:text-lg font-bold',
    icon: 'h-3 w-3 sm:h-4 sm:w-4',
    iconWrapper: 'h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 rounded-md sm:rounded-lg',
    variation: 'text-[10px] sm:text-xs',
    showSparkline: false,
  },
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

  const formattedValue = isPercentage 
    ? `${value.toFixed(1)}%` 
    : isCurrency 
      ? formatCurrency(value) 
      : value.toLocaleString('pt-BR');

  const variationValue = variation ?? (previousValue ? ((value - previousValue) / previousValue) * 100 : 0);
  const isPositive = variationValue >= 0;

  const content = (
    <motion.div
      whileHover={{ scale: 1.015, y: -3 }}
      whileTap={{ scale: 0.985 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="h-full"
    >
      <Card
        className={cn(
          'relative overflow-hidden transition-all duration-300 cursor-pointer group h-full',
          'border border-border/60',
          config.card,
          size === 'hero' && [
            'bg-gradient-to-br from-card via-card to-primary/[0.03]',
            'shadow-lg hover:shadow-xl',
          ],
          size === 'primary' && [
            'bg-card hover:bg-elevated-hover',
            'shadow-sm hover:shadow-md',
          ],
        )}
        style={accentColor ? { 
          borderColor: isHovered ? `${accentColor}30` : undefined,
          boxShadow: isHovered ? `0 8px 32px ${accentColor}15, 0 2px 8px ${accentColor}10` : undefined,
        } : undefined}
      >
        {/* Top accent gradient bar */}
        <div 
          className="absolute top-0 left-0 right-0 h-[3px] opacity-80"
          style={{ 
            background: accentColor 
              ? `linear-gradient(90deg, ${accentColor}, ${accentColor}60, transparent)` 
              : 'linear-gradient(90deg, hsl(var(--primary)), hsl(var(--primary) / 0.3), transparent)',
          }}
        />

        <CardContent className="p-0 h-full">
          <div className="flex items-start justify-between gap-3 h-full">
            {/* Content */}
            <div className="flex-1 flex flex-col justify-between min-h-full space-y-3">
              {/* Title row */}
              <div className="flex items-center gap-2 flex-wrap">
                <p className={cn('text-muted-foreground', config.title)}>
                  {title}
                </p>
                {badge && (
                  <Badge variant={badgeVariant} className="text-[10px] px-1.5 py-0 h-4 font-medium">
                    {badge}
                  </Badge>
                )}
                {tooltip && (
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-3.5 w-3.5 text-muted-foreground/40 hover:text-muted-foreground transition-colors" />
                    </TooltipTrigger>
                    <TooltipContent>{tooltip}</TooltipContent>
                  </Tooltip>
                )}
              </div>

              {/* Value */}
              {loading ? (
                <Skeleton className={cn('h-8', size === 'hero' ? 'w-48' : 'w-32')} />
              ) : (
                <motion.p 
                  className={cn(config.value, 'text-foreground')}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={value}
                >
                  {formattedValue}
                </motion.p>
              )}

              {/* Variation */}
              <div className={cn(
                'flex items-center gap-1.5 font-medium',
                config.variation,
                isPositive ? 'text-success' : 'text-destructive',
              )}>
                {isPositive ? (
                  <TrendingUp className="h-3.5 w-3.5" />
                ) : (
                  <TrendingDown className="h-3.5 w-3.5" />
                )}
                <span>{formatPercentage(Math.abs(variationValue))}</span>
                <span className="text-muted-foreground font-normal">vs mês anterior</span>
              </div>

              {/* Insight - hero only */}
              {insight && size === 'hero' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: isHovered ? 1 : 0, height: isHovered ? 'auto' : 0 }}
                  className="overflow-hidden"
                >
                  <div className="flex items-center gap-2 pt-1 text-xs text-muted-foreground border-t border-border/40 mt-1">
                    <Sparkles className="h-3 w-3 text-primary shrink-0" />
                    {insight}
                  </div>
                </motion.div>
              )}
            </div>

            {/* Icon */}
            <div className={cn(
              'flex items-center justify-center transition-all duration-300',
              'group-hover:scale-110 group-hover:rotate-3',
              iconBg,
              config.iconWrapper,
              size === 'hero' && 'shadow-md',
            )}>
              <Icon className={cn(iconColor, config.icon)} />
            </div>
          </div>

          {/* Link arrow */}
          {href && (
            <motion.div
              className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-60 transition-opacity"
              animate={{ x: isHovered ? 3 : 0 }}
            >
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );

  if (href) {
    return <Link to={href} className="h-full block">{content}</Link>;
  }

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
        {/* Hero card - spans 2 of 5 cols */}
        <div className="lg:col-span-2">
          {heroChild}
        </div>
        {/* Remaining cards - 3 of 5 cols, stacked in a sub-grid */}
        <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {otherChildren}
        </div>
      </motion.div>
    );
  }

  const gridClasses = {
    default: 'grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4',
    balanced: 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className={gridClasses[layout] || gridClasses.default}
    >
      {children}
    </motion.div>
  );
}

// Secondary KPIs row (kept for backward compat)
interface SecondaryKPIsProps {
  items: Array<{
    title: string;
    value: number | string;
    icon: LucideIcon;
    iconColor?: string;
    iconBg?: string;
    loading?: boolean;
  }>;
}

export function SecondaryKPIs({ items }: SecondaryKPIsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 sm:gap-3"
    >
      {items.map((item, index) => (
        <motion.div
          key={item.title}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <Card className="p-2 sm:p-3 hover:shadow-md transition-shadow">
            <div className="flex flex-col sm:flex-row items-center sm:items-center gap-1 sm:gap-3">
              <div className={cn(
                'p-1.5 sm:p-2 rounded-md sm:rounded-lg shrink-0',
                item.iconBg || 'bg-muted',
              )}>
                <item.icon className={cn('h-3 w-3 sm:h-4 sm:w-4', item.iconColor || 'text-muted-foreground')} />
              </div>
              <div className="text-center sm:text-left min-w-0">
                <p className="text-[9px] sm:text-xs text-muted-foreground truncate">{item.title}</p>
                {item.loading ? (
                  <Skeleton className="h-4 sm:h-5 w-6 sm:w-8 mt-0.5 mx-auto sm:mx-0" />
                ) : (
                  <p className="text-sm sm:text-base md:text-lg font-bold truncate">{item.value}</p>
                )}
              </div>
            </div>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  );
}
