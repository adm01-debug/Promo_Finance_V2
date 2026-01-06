/**
 * Enhanced Card - AnimatedCard with sensible defaults
 */

import { forwardRef, ReactNode, ComponentProps } from 'react';
import { AnimatedCard, StaggeredCards, StaggerItem } from '@/components/ui/animated-card';
import { CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type AnimatedCardProps = ComponentProps<typeof AnimatedCard>;

interface EnhancedCardProps extends AnimatedCardProps {
  variant?: 'default' | 'kpi' | 'action' | 'info';
}

const variantStyles = {
  default: '',
  kpi: 'stat-card hover:shadow-lg hover:shadow-primary/5',
  action: 'cursor-pointer hover:border-primary/20',
  info: 'bg-muted/30 border-transparent',
};

export const EnhancedCard = forwardRef<HTMLDivElement, EnhancedCardProps>(
  ({ variant = 'default', className, hoverEffect = 'lift', enterAnimation = 'fade', children, ...props }, ref) => {
    return (
      <AnimatedCard
        ref={ref}
        hoverEffect={hoverEffect}
        enterAnimation={enterAnimation}
        className={cn(variantStyles[variant], className)}
        {...props}
      >
        {children}
      </AnimatedCard>
    );
  }
);

EnhancedCard.displayName = 'EnhancedCard';

// KPI Card variant
interface KPICardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  trend?: { value: number; isPositive: boolean };
  className?: string;
  onClick?: () => void;
}

export function KPICard({ title, value, icon, trend, className, onClick }: KPICardProps) {
  return (
    <EnhancedCard
      variant="kpi"
      interactive={!!onClick}
      onClick={onClick}
      className={cn('group', className)}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold font-display">{value}</p>
            {trend && (
              <p className={cn(
                'text-xs font-medium flex items-center gap-1',
                trend.isPositive ? 'text-success' : 'text-destructive'
              )}>
                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
              </p>
            )}
          </div>
          {icon && (
            <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center transition-transform group-hover:scale-110">
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </EnhancedCard>
  );
}

// Re-export for convenience
export {
  StaggeredCards,
  StaggerItem,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
};

export default EnhancedCard;
