/**
 * Form Feedback - Enhanced form feedback components
 * 
 * Provides visual feedback for form states: success, error, loading
 */

import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, AlertCircle, Loader2, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FormFeedbackProps {
  type: 'success' | 'error' | 'warning' | 'info' | 'loading';
  message: string;
  description?: string;
  className?: string;
  onDismiss?: () => void;
}

const feedbackConfig = {
  success: {
    icon: CheckCircle2,
    bgColor: 'bg-green-50 dark:bg-green-950/30',
    borderColor: 'border-green-200 dark:border-green-800',
    iconColor: 'text-green-600 dark:text-green-400',
    textColor: 'text-green-800 dark:text-green-200',
  },
  error: {
    icon: XCircle,
    bgColor: 'bg-red-50 dark:bg-red-950/30',
    borderColor: 'border-red-200 dark:border-red-800',
    iconColor: 'text-red-600 dark:text-red-400',
    textColor: 'text-red-800 dark:text-red-200',
  },
  warning: {
    icon: AlertCircle,
    bgColor: 'bg-yellow-50 dark:bg-yellow-950/30',
    borderColor: 'border-yellow-200 dark:border-yellow-800',
    iconColor: 'text-yellow-600 dark:text-yellow-400',
    textColor: 'text-yellow-800 dark:text-yellow-200',
  },
  info: {
    icon: Info,
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
    borderColor: 'border-blue-200 dark:border-blue-800',
    iconColor: 'text-blue-600 dark:text-blue-400',
    textColor: 'text-blue-800 dark:text-blue-200',
  },
  loading: {
    icon: Loader2,
    bgColor: 'bg-muted/50',
    borderColor: 'border-border',
    iconColor: 'text-primary',
    textColor: 'text-foreground',
  },
};

export function FormFeedback({ type, message, description, className, onDismiss }: FormFeedbackProps) {
  const config = feedbackConfig[type];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className={cn(
        'flex items-start gap-3 p-4 rounded-lg border',
        config.bgColor,
        config.borderColor,
        className
      )}
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, type: 'spring' }}
      >
        <Icon 
          className={cn(
            'h-5 w-5',
            config.iconColor,
            type === 'loading' && 'animate-spin'
          )} 
        />
      </motion.div>
      <div className="flex-1 min-w-0">
        <p className={cn('font-medium text-sm', config.textColor)}>{message}</p>
        {description && (
          <p className={cn('text-xs mt-0.5 opacity-80', config.textColor)}>
            {description}
          </p>
        )}
      </div>
      {onDismiss && type !== 'loading' && (
        <button
          onClick={onDismiss}
          className={cn('p-0.5 rounded hover:bg-black/5 transition-colors', config.textColor)}
        >
          <XCircle className="h-4 w-4" />
        </button>
      )}
    </motion.div>
  );
}

// Inline field validation feedback
interface FieldFeedbackProps {
  type: 'success' | 'error' | 'warning';
  message: string;
  className?: string;
}

export function FieldFeedback({ type, message, className }: FieldFeedbackProps) {
  const colors = {
    success: 'text-green-600 dark:text-green-400',
    error: 'text-red-600 dark:text-red-400',
    warning: 'text-yellow-600 dark:text-yellow-400',
  };

  const icons = {
    success: CheckCircle2,
    error: XCircle,
    warning: AlertCircle,
  };

  const Icon = icons[type];

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className={cn('flex items-center gap-1.5 mt-1.5', colors[type], className)}
    >
      <Icon className="h-3.5 w-3.5 flex-shrink-0" />
      <span className="text-xs">{message}</span>
    </motion.div>
  );
}

// Progress indicator for multi-step forms
interface FormProgressProps {
  currentStep: number;
  totalSteps: number;
  labels?: string[];
  className?: string;
}

export function FormProgress({ currentStep, totalSteps, labels, className }: FormProgressProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Passo {currentStep} de {totalSteps}</span>
        <span>{Math.round((currentStep / totalSteps) * 100)}%</span>
      </div>
      <div className="flex gap-1.5">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <motion.div
            key={i}
            className={cn(
              'h-1.5 flex-1 rounded-full transition-colors',
              i < currentStep ? 'bg-primary' : 'bg-muted'
            )}
            initial={i === currentStep - 1 ? { scaleX: 0 } : undefined}
            animate={i === currentStep - 1 ? { scaleX: 1 } : undefined}
            transition={{ duration: 0.3 }}
            style={{ originX: 0 }}
          />
        ))}
      </div>
      {labels && labels[currentStep - 1] && (
        <motion.p
          key={currentStep}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm font-medium text-center"
        >
          {labels[currentStep - 1]}
        </motion.p>
      )}
    </div>
  );
}

// Saving indicator
interface SavingIndicatorProps {
  isSaving: boolean;
  lastSaved?: Date;
  className?: string;
}

export function SavingIndicator({ isSaving, lastSaved, className }: SavingIndicatorProps) {
  return (
    <AnimatePresence mode="wait">
      {isSaving ? (
        <motion.div
          key="saving"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={cn('flex items-center gap-1.5 text-xs text-muted-foreground', className)}
        >
          <Loader2 className="h-3 w-3 animate-spin" />
          <span>Salvando...</span>
        </motion.div>
      ) : lastSaved ? (
        <motion.div
          key="saved"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={cn('flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400', className)}
        >
          <CheckCircle2 className="h-3 w-3" />
          <span>
            Salvo às {lastSaved.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
