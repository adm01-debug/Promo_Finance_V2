import { ReactNode, useState } from 'react';
import { motion } from 'framer-motion';
import { LucideIcon, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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

export function HeroKPICard({
  title,
  value,
  previousValue,
  variation,
  icon: Icon,
  iconColor = 'text-primary',
  iconBg = 'bg-primary/10',
  href,
  isPercentage = false,
  isCurrency = true,
  loading = false,
  badge,
  badgeVariant = 'secondary',
  size = 'primary',
  emptyStateMessage,
}: HeroKPICardProps) {
  const animatedValue = useCountUp(value, { duration: 1000, decimals: isPercentage ? 1 : 2 });
  const isZero = value === 0;

  const formattedValue = isPercentage
    ? `${animatedValue.toFixed(1)}%`
    : isCurrency
      ? formatCurrency(animatedValue)
      : animatedValue.toLocaleString('pt-BR');

  const variationValue = variation ?? (previousValue ? ((value - previousValue) / previousValue) * 100 : 0);
  const isPositive = variationValue >= 0;

  const content = (
    <Card
      className={cn(
        'relative overflow-hidden transition-all duration-200 cursor-pointer group h-full border border-border bg-card shadow-sm hover:shadow-md rounded-md'
      )}
    >
      <CardContent className={cn("p-6 flex flex-col justify-between h-full", size === 'hero' ? 'p-8' : 'p-6')}>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
              {badge && (
                <Badge variant={badgeVariant} className="text-[9px] font-bold px-1.5 py-0 h-auto rounded-sm">
                  {badge}
                </Badge>
              )}
            </div>
            
            {loading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <p className={cn(
                'text-foreground font-semibold tabular-nums tracking-tight',
                size === 'hero' ? 'text-3xl' : 'text-xl',
                isZero && 'text-[#94a3b8]'
              )}>
                {formattedValue}
              </p>
            )}
          </div>

          <div className={cn(
            'flex items-center justify-center rounded-lg shadow-sm',
            iconBg,
            size === 'hero' ? 'h-10 w-10' : 'h-8 w-8'
          )}>
            <Icon className={cn(iconColor, size === 'hero' ? 'h-5 w-5' : 'h-4 w-4')} />
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          {isZero && emptyStateMessage ? (
            <span className="text-[10px] font-semibold text-[#64748b]">{emptyStateMessage}</span>
          ) : (
            <div className={cn(
              'flex items-center gap-1 text-[11px] font-bold',
              isPositive ? 'text-emerald-600' : 'text-rose-600',
            )}>
              {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              <span>{formatPercentage(Math.abs(variationValue))}</span>
            </div>
          )}

          {href && (
            <ArrowRight className="h-3 w-3 text-[#94a3b8] group-hover:text-primary transition-colors" />
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (href) return <Link to={href} className="h-full block">{content}</Link>;
  return content;
}

export function HeroKPIGrid({ children, layout = 'default' }: { children: ReactNode; layout?: string }) {
  if (layout === 'hero-first') {
    const childArray = Array.isArray(children) ? children : [children];
    const heroChild = childArray[0];
    const otherChildren = childArray.slice(1);

    return (
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">{heroChild}</div>
        <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-6">
          {otherChildren}
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {children}
    </div>
  );
}