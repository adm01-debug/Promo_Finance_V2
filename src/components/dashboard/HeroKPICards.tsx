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
  riskLevel?: 'none' | 'low' | 'medium' | 'high' | 'critical';
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
  riskLevel = 'none',
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
        'relative overflow-hidden transition-all duration-500 cursor-pointer group h-full premium-card border-white/10',
        size === 'hero' && 'bg-gradient-to-br from-white to-primary/[0.02] dark:from-zinc-900 dark:to-primary/[0.05]',
        riskLevel === 'high' && 'border-orange-500/30 shadow-[0_0_15px_rgba(249,115,22,0.1)]',
        riskLevel === 'critical' && 'border-rose-500/40 shadow-[0_0_20px_rgba(244,63,94,0.15)] animate-pulse-subtle'
      )}
    >
      <div className={cn(
        "absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl transition-opacity group-hover:opacity-100 opacity-50",
        size === 'hero' ? 'opacity-70' : 'opacity-0',
        riskLevel === 'critical' && 'bg-rose-500/10'
      )} />

      <CardContent className={cn("p-6 flex flex-col justify-between h-full relative z-10", size === 'hero' ? 'p-8' : 'p-6')}>
        <div className="flex items-start justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <p className="text-caption">{title}</p>
              {badge && (
                <Badge 
                  variant={badgeVariant} 
                  className={cn(
                    "text-[9px] font-black px-2 py-0.5 h-auto rounded-full uppercase tracking-wider border-none shadow-sm",
                    badgeVariant === 'destructive' ? 'bg-rose-500/10 text-rose-600' : 'bg-primary/10 text-primary'
                  )}
                >
                  {badge}
                </Badge>
              )}
            </div>
            
            {loading ? (
              <Skeleton className="h-10 w-40" />
            ) : (
              <p className={cn(
                'text-foreground font-black tabular-nums tracking-tighter leading-none font-heading transition-all duration-300 group-hover:translate-x-1',
                size === 'hero' ? 'text-4xl' : 'text-2xl',
                isZero && 'text-muted-foreground'
              )}>
                {formattedValue}
              </p>
            )}
          </div>

          <div className={cn(
            'flex items-center justify-center rounded-2xl border border-white/20 shadow-xl transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110',
            iconBg,
            size === 'hero' ? 'h-14 w-14' : 'h-10 w-10'
          )}>
            <Icon className={cn(iconColor, size === 'hero' ? 'h-6 w-6' : 'h-5 w-5')} />
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between">
          {isZero && emptyStateMessage ? (
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{emptyStateMessage}</span>
          ) : (
            <div className={cn(
              'flex items-center gap-1.5 text-[11px] font-black px-2 py-1 rounded-lg',
              isPositive ? 'text-emerald-600 bg-emerald-500/5' : 'text-rose-600 bg-rose-500/5',
            )}>
              {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              <span>{formatPercentage(Math.abs(variationValue))}</span>
            </div>
          )}

          {href && (
            <div className="h-8 w-8 rounded-full bg-muted/50 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all duration-300">
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (href) return <Link to={href} className="h-full block no-underline">{content}</Link>;
  return content;
}

export function HeroKPIGrid({ children, layout = 'default' }: { children: ReactNode; layout?: string }) {
  if (layout === 'hero-first') {
    const childArray = Array.isArray(children) ? children : [children];
    const heroChild = childArray[0];
    const otherChildren = childArray.slice(1);

    return (
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 h-full">{heroChild}</div>
        <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-8 h-full">
          {otherChildren}
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
      {children}
    </div>
  );
}