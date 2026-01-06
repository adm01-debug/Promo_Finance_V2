import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Check, Circle, Loader2 } from 'lucide-react';

interface Step {
  id: string;
  title: string;
  description?: string;
}

interface ProgressStepsProps {
  steps: Step[];
  currentStep: number;
  orientation?: 'horizontal' | 'vertical';
  className?: string;
  onStepClick?: (stepIndex: number) => void;
}

export function ProgressSteps({ 
  steps, 
  currentStep, 
  orientation = 'horizontal',
  className,
  onStepClick
}: ProgressStepsProps) {
  const isVertical = orientation === 'vertical';

  return (
    <div className={cn(
      'flex',
      isVertical ? 'flex-col gap-4' : 'items-center justify-between',
      className
    )}>
      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isCurrent = index === currentStep;
        const isPending = index > currentStep;

        return (
          <div 
            key={step.id}
            className={cn(
              'flex items-center',
              isVertical ? 'gap-4' : 'flex-1',
              !isVertical && index !== steps.length - 1 && 'after:content-[""] after:flex-1 after:h-0.5 after:mx-4',
              !isVertical && isCompleted && 'after:bg-primary',
              !isVertical && !isCompleted && 'after:bg-muted'
            )}
          >
            <button
              onClick={() => onStepClick?.(index)}
              disabled={!onStepClick}
              className={cn(
                'flex items-center gap-3',
                onStepClick && 'cursor-pointer hover:opacity-80 transition-opacity'
              )}
            >
              <motion.div
                initial={false}
                animate={{
                  scale: isCurrent ? 1.1 : 1,
                  backgroundColor: isCompleted || isCurrent 
                    ? 'hsl(var(--primary))' 
                    : 'hsl(var(--muted))',
                }}
                className={cn(
                  'relative flex items-center justify-center w-10 h-10 rounded-full',
                  'text-primary-foreground transition-colors duration-300'
                )}
              >
                {isCompleted ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  >
                    <Check className="w-5 h-5" />
                  </motion.div>
                ) : isCurrent ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  >
                    <Loader2 className="w-5 h-5 animate-spin" />
                  </motion.div>
                ) : (
                  <span className="text-sm font-medium text-muted-foreground">
                    {index + 1}
                  </span>
                )}
                
                {/* Pulse ring for current step */}
                {isCurrent && (
                  <motion.span
                    initial={{ scale: 1, opacity: 0.5 }}
                    animate={{ scale: 1.5, opacity: 0 }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="absolute inset-0 rounded-full bg-primary"
                  />
                )}
              </motion.div>

              <div className={cn('text-left', isVertical && 'flex-1')}>
                <p className={cn(
                  'text-sm font-medium',
                  (isCompleted || isCurrent) ? 'text-foreground' : 'text-muted-foreground'
                )}>
                  {step.title}
                </p>
                {step.description && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {step.description}
                  </p>
                )}
              </div>
            </button>
          </div>
        );
      })}
    </div>
  );
}

// Circular progress indicator
interface CircularProgressProps {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  showValue?: boolean;
  className?: string;
  color?: 'primary' | 'success' | 'warning' | 'destructive';
}

export function CircularProgress({ 
  value, 
  max = 100,
  size = 120,
  strokeWidth = 8,
  showValue = true,
  className,
  color = 'primary'
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / max) * circumference;

  const colors = {
    primary: 'stroke-primary',
    success: 'stroke-success',
    warning: 'stroke-warning',
    destructive: 'stroke-destructive',
  };

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          fill="none"
          className="stroke-muted"
        />
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          className={colors[color]}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          style={{
            strokeDasharray: circumference,
          }}
        />
      </svg>
      {showValue && (
        <motion.span 
          className="absolute text-2xl font-bold"
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          {Math.round(value)}%
        </motion.span>
      )}
    </div>
  );
}

// Linear progress with label
interface LabeledProgressProps {
  value: number;
  label: string;
  showPercentage?: boolean;
  color?: 'primary' | 'success' | 'warning' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LabeledProgress({
  value,
  label,
  showPercentage = true,
  color = 'primary',
  size = 'md',
  className
}: LabeledProgressProps) {
  const heights = { sm: 'h-1.5', md: 'h-2.5', lg: 'h-4' };
  const colors = {
    primary: 'bg-primary',
    success: 'bg-success',
    warning: 'bg-warning',
    destructive: 'bg-destructive',
  };

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium">{label}</span>
        {showPercentage && (
          <span className="text-sm text-muted-foreground">{Math.round(value)}%</span>
        )}
      </div>
      <div className={cn('w-full bg-muted rounded-full overflow-hidden', heights[size])}>
        <motion.div
          className={cn('h-full rounded-full', colors[color])}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}
