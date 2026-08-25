import type { ReactNode } from 'react';
import { Card } from '../ui/card';
import { AnimatedNumber } from './AnimatedNumber';
import { cn } from '@/lib/utils';

export interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: ReactNode;
  iconColor?: string;
  iconBg?: string;
  delta?: { value: string; positive: boolean };
  sparkline?: ReactNode;
  className?: string;
  /** Classe extra para o valor (ex.: colorir saldo negativo com text-bad). */
  valueClassName?: string;
  /** Torna o card clicável (deep-link de KPI para aba). */
  onClick?: () => void;
}

export function StatCard({
  label,
  value,
  sub,
  icon,
  iconColor = 'var(--acc)',
  iconBg = 'var(--acc-soft)',
  delta,
  sparkline,
  className,
  valueClassName,
  onClick,
}: StatCardProps) {
  return (
    <Card
      onClick={onClick}
      className={cn(
        'min-w-0',
        onClick && 'cursor-pointer transition-colors hover:border-[var(--line-2)]',
        className
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[13px]"
          style={{ background: iconBg, color: iconColor }}
        >
          {icon}
        </div>
        {delta && (
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-bold',
              delta.positive ? 'text-ok bg-ok-soft' : 'text-bad bg-bad-soft'
            )}
          >
            {delta.positive ? '↗' : '↘'} {delta.value}
          </span>
        )}
      </div>
      <p className="mt-4 truncate text-xs font-medium text-t1">{label}</p>
      <AnimatedNumber
        value={value}
        className={cn('mt-1 block truncate text-2xl font-extrabold text-t0', valueClassName)}
      />
      {sub && <p className="mt-0.5 truncate text-xs text-t2">{sub}</p>}
      {sparkline && <div className="mt-3 h-9">{sparkline}</div>}
    </Card>
  );
}
