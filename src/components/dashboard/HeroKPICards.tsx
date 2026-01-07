/**
 * Hero KPI Cards - Hierarquia Visual Aprimorada
 * 
 * Cards de KPI com destaque visual diferenciado,
 * animações e micro-interações
 */

import { ReactNode, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LucideIcon, TrendingUp, TrendingDown, ArrowRight, Sparkles, Info } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
    card: 'p-3 sm:p-4 md:p-6 min-h-[120px] sm:min-h-[150px] md:min-h-[180px]',
    title: 'text-xs sm:text-sm font-medium',
    value: 'text-xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight',
    icon: 'h-8 w-8 sm:h-10 sm:w-10 md:h-14 md:w-14',
    iconWrapper: 'h-12 w-12 sm:h-14 sm:w-14 md:h-20 md:w-20 rounded-xl md:rounded-2xl',
    variation: 'text-[10px] sm:text-xs md:text-sm',
    showSparkline: true,
  },
  primary: {
    card: 'p-3 sm:p-4 md:p-5',
    title: 'text-[10px] sm:text-xs md:text-sm font-medium',
    value: 'text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold',
    icon: 'h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8',
    iconWrapper: 'h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 rounded-lg md:rounded-xl',
    variation: 'text-[10px] sm:text-xs md:text-sm',
    showSparkline: false,
  },
  secondary: {
    card: 'p-2 sm:p-3 md:p-4',
    title: 'text-[10px] sm:text-xs font-medium',
    value: 'text-base sm:text-lg md:text-xl font-bold',
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

// Mini sparkline component
function MiniSparkline({ data, color = 'hsl(var(--primary))' }: { data: number[]; color?: string }) {
  if (!data || data.length < 2) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const height = 40;
  const width = 100;
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((value - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={width} height={height} className="opacity-50">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
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
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
        <Card
          className={cn(
            'relative overflow-hidden transition-all duration-300 cursor-pointer group',
            'hover:shadow-xl hover:shadow-primary/5',
            'border-transparent hover:border-primary/20',
            config.card,
            size === 'hero' && 'bg-gradient-to-br from-background via-background to-primary/5',
          )}
          style={accentColor ? { 
            borderColor: isHovered ? `${accentColor}40` : 'transparent',
            boxShadow: isHovered ? `0 20px 40px ${accentColor}10` : undefined,
          } : undefined}
        >
          {/* Gradient accent line */}
          <div 
            className={cn(
              'absolute bottom-0 left-0 right-0 h-1 transition-all duration-300',
              'bg-gradient-to-r opacity-0 group-hover:opacity-100',
            )}
            style={{ 
              background: accentColor 
                ? `linear-gradient(to right, ${accentColor}, ${accentColor}80)` 
                : 'linear-gradient(to right, hsl(var(--primary)), hsl(var(--primary) / 0.5))',
            }}
          />

          <CardContent className="p-0">
            <div className="flex items-start justify-between gap-4">
              {/* Content */}
              <div className="flex-1 space-y-2">
                {/* Title with badge */}
                <div className="flex items-center gap-2">
                  <p className={cn('text-muted-foreground', config.title)}>
                    {title}
                  </p>
                  {badge && (
                    <Badge variant={badgeVariant} className="text-[10px] px-1.5 py-0 h-4">
                      {badge}
                    </Badge>
                  )}
                  {tooltip && (
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-3.5 w-3.5 text-muted-foreground/50" />
                      </TooltipTrigger>
                      <TooltipContent>{tooltip}</TooltipContent>
                    </Tooltip>
                  )}
                </div>

                {/* Value */}
                {loading ? (
                  <Skeleton className={cn('h-8', size === 'hero' ? 'w-40' : 'w-28')} />
                ) : (
                  <motion.p 
                    className={cn(config.value)}
                    initial={{ opacity: 0, y: 10 }}
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
                  isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400',
                )}>
                  {isPositive ? (
                    <TrendingUp className="h-3.5 w-3.5" />
                  ) : (
                    <TrendingDown className="h-3.5 w-3.5" />
                  )}
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
                    <div className="flex items-center gap-2 pt-2 text-xs text-muted-foreground">
                      <Sparkles className="h-3 w-3 text-primary" />
                      {insight}
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Icon */}
              <div className={cn(
                'flex items-center justify-center transition-transform duration-300 group-hover:scale-110',
                iconBg,
                config.iconWrapper,
              )}>
                <Icon className={cn(iconColor, config.icon)} />
              </div>
            </div>

            {/* Sparkline for hero cards */}
            {config.showSparkline && sparkline && (
              <div className="absolute bottom-12 right-6 opacity-30 group-hover:opacity-60 transition-opacity">
                <MiniSparkline data={sparkline} color={accentColor || 'hsl(var(--primary))'} />
              </div>
            )}

            {/* Link indicator */}
            {href && (
              <motion.div
                className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity"
                animate={{ x: isHovered ? 4 : 0 }}
              >
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </motion.div>
            )}
          </CardContent>
        </Card>
    </motion.div>
  );

  if (href) {
    return <Link to={href}>{content}</Link>;
  }

  return content;
}

// Grid layout component for KPIs
interface HeroKPIGridProps {
  children: ReactNode;
  layout?: 'default' | 'hero-first' | 'balanced';
}

export function HeroKPIGrid({ children, layout = 'default' }: HeroKPIGridProps) {
  const gridClasses = {
    default: 'grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4',
    'hero-first': 'grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 [&>*:first-child]:col-span-2',
    balanced: 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4',
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ staggerChildren: 0.08 }}
      className={gridClasses[layout]}
    >
      {children}
    </motion.div>
  );
}

// Secondary KPIs row
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
