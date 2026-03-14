import { cn } from '@/lib/utils';

interface ProgressProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  showValue?: boolean;
  showPercentage?: boolean;
  label?: string;
  className?: string;
  animated?: boolean;
  striped?: boolean;
}

export function Progress({
  value, max = 100, size = 'md', variant = 'default', showValue = false,
  showPercentage = false, label, className, animated = false, striped = false,
}: ProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const sizes = { sm: 'h-1', md: 'h-2', lg: 'h-4' };
  const colors = {
    default: 'bg-primary',
    success: 'bg-success',
    warning: 'bg-warning',
    danger: 'bg-destructive',
    info: 'bg-primary',
  };

  return (
    <div className={cn('w-full', className)}>
      {(label || showPercentage) && (
        <div className="flex justify-between items-center mb-1">
          {label && <span className="text-sm font-medium text-foreground">{label}</span>}
          {showPercentage && <span className="text-sm font-medium text-foreground">{Math.round(percentage)}%</span>}
        </div>
      )}
      <div className={cn('w-full bg-muted rounded-full overflow-hidden', sizes[size])} role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={max}>
        <div className={cn('h-full rounded-full transition-all duration-300 ease-out', colors[variant], striped && 'bg-stripes', animated && striped && 'animate-stripes')} style={{ width: `${percentage}%` }}>
          {showValue && size === 'lg' && <span className="flex items-center justify-center text-xs font-medium text-primary-foreground h-full">{Math.round(percentage)}%</span>}
        </div>
      </div>
    </div>
  );
}

// Circular Progress
interface CircularProgressProps {
  value: number; max?: number; size?: 'sm' | 'md' | 'lg' | 'xl'; thickness?: number;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'; showValue?: boolean; label?: string; className?: string;
}

export function CircularProgress({ value, max = 100, size = 'md', thickness = 4, variant = 'default', showValue = true, label, className }: CircularProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const sizes = { sm: 40, md: 60, lg: 80, xl: 120 };
  const colors = { default: 'text-primary', success: 'text-success', warning: 'text-warning', danger: 'text-destructive', info: 'text-primary' };
  const dimension = sizes[size];
  const radius = (dimension - thickness) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className={cn('relative inline-flex', className)}>
      <svg width={dimension} height={dimension} className="transform -rotate-90" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={max}>
        <circle cx={dimension / 2} cy={dimension / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={thickness} className="text-muted" />
        <circle cx={dimension / 2} cy={dimension / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={thickness} strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} className={cn('transition-all duration-300 ease-out', colors[variant])} />
      </svg>
      {showValue && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn('font-semibold text-foreground', size === 'sm' && 'text-xs', size === 'md' && 'text-sm', size === 'lg' && 'text-base', size === 'xl' && 'text-xl')}>{Math.round(percentage)}%</span>
          {label && size !== 'sm' && <span className="text-xs text-muted-foreground">{label}</span>}
        </div>
      )}
    </div>
  );
}

// Progress Steps
interface ProgressStep { label: string; description?: string; completed?: boolean; current?: boolean; }
interface ProgressStepsProps { steps: ProgressStep[]; orientation?: 'horizontal' | 'vertical'; variant?: 'default' | 'success'; className?: string; }

export function ProgressSteps({ steps, orientation = 'horizontal', variant = 'default', className }: ProgressStepsProps) {
  const completedColor = variant === 'success' ? 'bg-success' : 'bg-primary';
  const currentColor = variant === 'success' ? 'border-success' : 'border-primary';

  if (orientation === 'vertical') {
    return (
      <div className={cn('space-y-4', className)}>
        {steps.map((step, index) => (
          <div key={index} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className={cn('flex items-center justify-center w-8 h-8 rounded-full border-2 text-sm font-medium',
                step.completed ? cn(completedColor, 'border-transparent text-primary-foreground') : step.current ? cn(currentColor, 'bg-transparent text-primary') : 'border-border bg-transparent text-muted-foreground')}>
                {step.completed ? <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg> : index + 1}
              </div>
              {index < steps.length - 1 && <div className={cn('w-0.5 h-full min-h-[2rem] mt-2', step.completed ? completedColor : 'bg-border')} />}
            </div>
            <div className="pb-8">
              <p className={cn('font-medium', step.completed || step.current ? 'text-foreground' : 'text-muted-foreground')}>{step.label}</p>
              {step.description && <p className="text-sm text-muted-foreground mt-1">{step.description}</p>}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn('flex items-center', className)}>
      {steps.map((step, index) => (
        <div key={index} className="flex-1 flex items-center">
          <div className="flex flex-col items-center">
            <div className={cn('flex items-center justify-center w-8 h-8 rounded-full border-2 text-sm font-medium',
              step.completed ? cn(completedColor, 'border-transparent text-primary-foreground') : step.current ? cn(currentColor, 'bg-transparent text-primary') : 'border-border bg-transparent text-muted-foreground')}>
              {step.completed ? <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg> : index + 1}
            </div>
            <p className={cn('mt-2 text-sm font-medium text-center', step.completed || step.current ? 'text-foreground' : 'text-muted-foreground')}>{step.label}</p>
          </div>
          {index < steps.length - 1 && <div className={cn('flex-1 h-0.5 mx-4', step.completed ? completedColor : 'bg-border')} />}
        </div>
      ))}
    </div>
  );
}

// Indeterminate Progress
interface IndeterminateProgressProps { size?: 'sm' | 'md' | 'lg'; variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'; className?: string; }

export function IndeterminateProgress({ size = 'md', variant = 'default', className }: IndeterminateProgressProps) {
  const sizes = { sm: 'h-1', md: 'h-2', lg: 'h-3' };
  const colors = { default: 'bg-primary', success: 'bg-success', warning: 'bg-warning', danger: 'bg-destructive', info: 'bg-primary' };
  return (
    <div className={cn('w-full bg-muted rounded-full overflow-hidden', sizes[size], className)}>
      <div className={cn('h-full w-1/3 rounded-full animate-indeterminate', colors[variant])} />
    </div>
  );
}

export default Progress;