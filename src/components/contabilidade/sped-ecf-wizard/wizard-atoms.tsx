import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AnimatedCounter } from '@/components/reforma-tributaria/AnimatedCounter';
import { STEPS, type Step } from './types';

export function StepPills({ step }: { step: Step }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {STEPS.map((s, i) => {
        const completed = step > s.n;
        const current = step === s.n;
        return (
          <div key={s.n} className="flex items-center gap-2">
            <div
              className={cn(
                'flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium transition-all duration-300',
                completed && 'bg-success/15 text-success',
                current && 'bg-primary/15 text-primary ring-1 ring-primary/30',
                !completed && !current && 'bg-muted text-muted-foreground',
              )}
            >
              <span
                className={cn(
                  'flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold',
                  completed && 'bg-success text-success-foreground',
                  current && 'bg-primary text-primary-foreground',
                  !completed && !current && 'bg-background text-muted-foreground',
                )}
              >
                {completed ? <Check className="h-3 w-3" /> : s.n}
              </span>
              {s.label}
            </div>
            {i < STEPS.length - 1 && (
              <div className={cn('h-px w-4 transition-colors', step > s.n ? 'bg-success/40' : 'bg-border')} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export function MetaField({
  icon: Icon,
  label,
  value,
  mono,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="space-y-1">
      <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-muted-foreground font-medium">
        <Icon className="h-3 w-3 text-primary/70" />
        {label}
      </p>
      <p className={cn('text-sm font-medium text-foreground', mono && 'font-mono')}>{value}</p>
    </div>
  );
}

export function KpiChip({
  label,
  value,
  tone,
  Icon,
}: {
  label: string;
  value: number;
  tone: 'success' | 'destructive' | 'warning';
  Icon: React.ComponentType<{ className?: string }>;
}) {
  const toneClass =
    tone === 'success'
      ? 'bg-success/10 text-success border-success/20'
      : tone === 'destructive'
        ? 'bg-destructive/10 text-destructive border-destructive/20'
        : 'bg-warning/10 text-warning border-warning/20';
  return (
    <div className={cn('rounded-xl border p-3 flex items-center gap-3 transition-all duration-200', toneClass)}>
      <div className="h-8 w-8 rounded-lg bg-background/40 flex items-center justify-center">
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] uppercase tracking-wide opacity-80 font-medium">{label}</p>
        <p className="text-xl font-display font-semibold leading-none mt-0.5">
          <AnimatedCounter value={value} formatFn={(v) => Math.round(v).toString()} />
        </p>
      </div>
    </div>
  );
}

export function KpiCard({ label, value, mono }: { label: string; value: number | string; mono?: boolean }) {
  return (
    <div className="rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm p-4">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">{label}</p>
      {typeof value === 'number' ? (
        <p className="text-2xl font-display font-semibold tracking-tight mt-1 tabular-nums">
          <AnimatedCounter value={value} formatFn={(v) => Math.round(v).toLocaleString('pt-BR')} />
        </p>
      ) : (
        <p className={cn('text-2xl font-display font-semibold tracking-tight mt-1', mono && 'font-mono')}>{value}</p>
      )}
    </div>
  );
}
