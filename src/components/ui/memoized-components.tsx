/**
 * Componentes Memoizados
 * Otimização de re-renders para componentes pesados
 */

import React, { memo, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { LucideIcon } from 'lucide-react';

// ============================================
// KPI Card Memoizado
// ============================================
interface KPICardProps {
  title: string;
  value: string | number;
  icon?: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  subtitle?: string;
  className?: string;
  isLoading?: boolean;
}

export const MemoizedKPICard = memo(function KPICard({
  title,
  value,
  icon: Icon,
  trend,
  subtitle,
  className,
  isLoading,
}: KPICardProps) {
  if (isLoading) {
    return (
      <Card className={cn('animate-pulse', className)}>
        <CardHeader className="pb-2">
          <div className="h-4 bg-muted rounded w-1/2" />
        </CardHeader>
        <CardContent>
          <div className="h-8 bg-muted rounded w-3/4" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {(trend || subtitle) && (
          <div className="flex items-center gap-2 mt-1">
            {trend && (
              <span
                className={cn(
                  'text-xs font-medium',
                  trend.isPositive ? 'text-success' : 'text-destructive'
                )}
              >
                {trend.isPositive ? '+' : ''}{trend.value}%
              </span>
            )}
            {subtitle && (
              <span className="text-xs text-muted-foreground">{subtitle}</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
});

// ============================================
// Table Row Memoizado
// ============================================
interface TableRowData {
  id: string;
  [key: string]: unknown;
}

interface MemoizedTableRowProps<T extends TableRowData> {
  data: T;
  columns: {
    key: keyof T;
    render?: (value: T[keyof T], row: T) => React.ReactNode;
  }[];
  onClick?: (row: T) => void;
  isSelected?: boolean;
  className?: string;
}

export const MemoizedTableRow = memo(function TableRow<T extends TableRowData>({
  data,
  columns,
  onClick,
  isSelected,
  className,
}: MemoizedTableRowProps<T>) {
  return (
    <tr
      onClick={() => onClick?.(data)}
      className={cn(
        'border-b transition-colors hover:bg-muted/50',
        isSelected && 'bg-muted',
        onClick && 'cursor-pointer',
        className
      )}
    >
      {columns.map((col, index) => (
        <td key={String(col.key) + index} className="p-4">
          {col.render ? col.render(data[col.key], data) : String(data[col.key] ?? '')}
        </td>
      ))}
    </tr>
  );
}) as <T extends TableRowData>(props: MemoizedTableRowProps<T>) => JSX.Element;

// ============================================
// Status Badge Memoizado
// ============================================
interface StatusBadgeProps {
  status: string;
  statusMap?: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }>;
}

const defaultStatusMap: StatusBadgeProps['statusMap'] = {
  pendente: { label: 'Pendente', variant: 'secondary' },
  pago: { label: 'Pago', variant: 'default' },
  vencido: { label: 'Vencido', variant: 'destructive' },
  cancelado: { label: 'Cancelado', variant: 'outline' },
  aguardando_aprovacao: { label: 'Aguardando Aprovação', variant: 'secondary' },
  aprovado: { label: 'Aprovado', variant: 'default' },
  rejeitado: { label: 'Rejeitado', variant: 'destructive' },
};

export const MemoizedStatusBadge = memo(function StatusBadge({
  status,
  statusMap = defaultStatusMap,
}: StatusBadgeProps) {
  const config = statusMap[status] || { label: status, variant: 'secondary' as const };
  
  return (
    <Badge variant={config.variant}>
      {config.label}
    </Badge>
  );
});

// ============================================
// Currency Display Memoizado
// ============================================
interface CurrencyDisplayProps {
  value: number;
  showSign?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const MemoizedCurrencyDisplay = memo(function CurrencyDisplay({
  value,
  showSign = false,
  className,
  size = 'md',
}: CurrencyDisplayProps) {
  const formattedValue = useMemo(() => formatCurrency(value), [value]);
  const isNegative = value < 0;
  const isPositive = value > 0;

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg font-semibold',
  };

  return (
    <span
      className={cn(
        sizeClasses[size],
        showSign && isNegative && 'text-destructive',
        showSign && isPositive && 'text-success',
        className
      )}
    >
      {showSign && isPositive && '+'}
      {formattedValue}
    </span>
  );
});

// ============================================
// Date Display Memoizado
// ============================================
interface DateDisplayProps {
  date: string | Date;
  format?: 'short' | 'long' | 'relative';
  showTime?: boolean;
  className?: string;
}

export const MemoizedDateDisplay = memo(function DateDisplay({
  date,
  format = 'short',
  className,
}: DateDisplayProps) {
  const formattedDate = useMemo(() => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (format === 'relative') {
      const now = new Date();
      const diff = now.getTime() - dateObj.getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      
      if (days === 0) return 'Hoje';
      if (days === 1) return 'Ontem';
      if (days < 7) return `${days} dias atrás`;
      if (days < 30) return `${Math.floor(days / 7)} semanas atrás`;
      return formatDate(dateObj);
    }
    
    return formatDate(dateObj);
  }, [date, format]);

  return (
    <span className={cn('text-muted-foreground', className)}>
      {formattedDate}
    </span>
  );
});

// ============================================
// List Item Memoizado
// ============================================
interface ListItemProps {
  title: string;
  subtitle?: string;
  value?: string | number;
  icon?: LucideIcon;
  badge?: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export const MemoizedListItem = memo(function ListItem({
  title,
  subtitle,
  value,
  icon: Icon,
  badge,
  onClick,
  className,
}: ListItemProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'flex items-center justify-between p-3 rounded-lg',
        'hover:bg-muted/50 transition-colors',
        onClick && 'cursor-pointer',
        className
      )}
    >
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="p-2 rounded-full bg-primary/10">
            <Icon className="h-4 w-4 text-primary" />
          </div>
        )}
        <div>
          <p className="font-medium">{title}</p>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {value !== undefined && (
          <span className="font-semibold">
            {typeof value === 'number' ? formatCurrency(value) : value}
          </span>
        )}
        {badge}
      </div>
    </div>
  );
});

// ============================================
// Chart Tooltip Memoizado
// ============================================
interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color: string }>;
  label?: string;
  formatter?: (value: number) => string;
}

export const MemoizedChartTooltip = memo(function ChartTooltip({
  active,
  payload,
  label,
  formatter = formatCurrency,
}: ChartTooltipProps) {
  if (!active || !payload?.length) return null;

  return (
    <div className="bg-popover border rounded-lg shadow-lg p-3">
      {label && <p className="font-medium mb-2">{label}</p>}
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2 text-sm">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-medium">{formatter(entry.value)}</span>
        </div>
      ))}
    </div>
  );
});

// ============================================
// Empty State Memoizado
// ============================================
interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export const MemoizedEmptyState = memo(function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 text-center', className)}>
      {Icon && (
        <div className="p-4 rounded-full bg-muted mb-4">
          <Icon className="h-8 w-8 text-muted-foreground" />
        </div>
      )}
      <h3 className="text-lg font-semibold">{title}</h3>
      {description && (
        <p className="text-muted-foreground mt-1 max-w-sm">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
});
