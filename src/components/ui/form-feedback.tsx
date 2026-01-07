/**
 * Form Feedback - Enhanced form feedback components
 * 
 * Provides visual feedback for form states: success, error, loading
 * With micro-interactions and celebratory effects
 */

import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, AlertCircle, Loader2, Info, X, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

interface FormFeedbackProps {
  type: 'success' | 'error' | 'warning' | 'info' | 'loading';
  message: string;
  description?: string;
  className?: string;
  onDismiss?: () => void;
  autoDismiss?: number;
  showConfetti?: boolean;
}

const feedbackConfig = {
  success: {
    icon: CheckCircle2,
    bgColor: 'bg-green-50 dark:bg-green-950/30',
    borderColor: 'border-green-200 dark:border-green-800',
    iconColor: 'text-green-600 dark:text-green-400',
    textColor: 'text-green-800 dark:text-green-200',
    glowColor: 'shadow-green-500/20',
  },
  error: {
    icon: XCircle,
    bgColor: 'bg-red-50 dark:bg-red-950/30',
    borderColor: 'border-red-200 dark:border-red-800',
    iconColor: 'text-red-600 dark:text-red-400',
    textColor: 'text-red-800 dark:text-red-200',
    glowColor: 'shadow-red-500/20',
  },
  warning: {
    icon: AlertCircle,
    bgColor: 'bg-yellow-50 dark:bg-yellow-950/30',
    borderColor: 'border-yellow-200 dark:border-yellow-800',
    iconColor: 'text-yellow-600 dark:text-yellow-400',
    textColor: 'text-yellow-800 dark:text-yellow-200',
    glowColor: 'shadow-yellow-500/20',
  },
  info: {
    icon: Info,
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
    borderColor: 'border-blue-200 dark:border-blue-800',
    iconColor: 'text-blue-600 dark:text-blue-400',
    textColor: 'text-blue-800 dark:text-blue-200',
    glowColor: 'shadow-blue-500/20',
  },
  loading: {
    icon: Loader2,
    bgColor: 'bg-muted/50',
    borderColor: 'border-border',
    iconColor: 'text-primary',
    textColor: 'text-foreground',
    glowColor: 'shadow-primary/20',
  },
};

// Sparkle particles for success celebrations
function SuccessSparkles() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ 
            opacity: 0, 
            scale: 0,
            x: '50%',
            y: '50%'
          }}
          animate={{ 
            opacity: [0, 1, 0],
            scale: [0, 1, 0.5],
            x: `${50 + (Math.random() - 0.5) * 100}%`,
            y: `${50 + (Math.random() - 0.5) * 100}%`
          }}
          transition={{ 
            duration: 0.8,
            delay: i * 0.1,
            ease: 'easeOut'
          }}
          className="absolute"
        >
          <Sparkles className="h-3 w-3 text-green-400" />
        </motion.div>
      ))}
    </div>
  );
}

export function FormFeedback({ 
  type, 
  message, 
  description, 
  className, 
  onDismiss,
  autoDismiss,
  showConfetti = false
}: FormFeedbackProps) {
  const config = feedbackConfig[type];
  const Icon = config.icon;

  useEffect(() => {
    if (autoDismiss && onDismiss) {
      const timer = setTimeout(onDismiss, autoDismiss);
      return () => clearTimeout(timer);
    }
  }, [autoDismiss, onDismiss]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className={cn(
        'relative flex items-start gap-3 p-4 rounded-lg border shadow-lg',
        config.bgColor,
        config.borderColor,
        config.glowColor,
        className
      )}
    >
      {type === 'success' && showConfetti && <SuccessSparkles />}
      
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 400 }}
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
        <motion.p 
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 }}
          className={cn('font-medium text-sm', config.textColor)}
        >
          {message}
        </motion.p>
        {description && (
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.8 }}
            transition={{ delay: 0.2 }}
            className={cn('text-xs mt-0.5', config.textColor)}
          >
            {description}
          </motion.p>
        )}
      </div>
      
      {onDismiss && type !== 'loading' && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onDismiss}
          className={cn(
            'p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors',
            config.textColor
          )}
        >
          <X className="h-4 w-4" />
        </motion.button>
      )}
      
      {autoDismiss && (
        <motion.div
          initial={{ scaleX: 1 }}
          animate={{ scaleX: 0 }}
          transition={{ duration: autoDismiss / 1000, ease: 'linear' }}
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-current opacity-30 origin-left"
          style={{ color: config.iconColor.replace('text-', '') }}
        />
      )}
    </motion.div>
  );
}

// Inline field validation feedback with shake animation
interface FieldFeedbackProps {
  type: 'success' | 'error' | 'warning';
  message: string;
  className?: string;
  shake?: boolean;
}

export function FieldFeedback({ type, message, className, shake = false }: FieldFeedbackProps) {
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
      initial={{ opacity: 0, height: 0, y: -5 }}
      animate={{ 
        opacity: 1, 
        height: 'auto', 
        y: 0,
        x: shake && type === 'error' ? [0, -5, 5, -5, 5, 0] : 0
      }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ 
        x: { duration: 0.4, ease: 'easeInOut' }
      }}
      className={cn('flex items-center gap-1.5 mt-1.5 overflow-hidden', colors[type], className)}
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 500 }}
      >
        <Icon className="h-3.5 w-3.5 flex-shrink-0" />
      </motion.div>
      <span className="text-xs">{message}</span>
    </motion.div>
  );
}

// Progress indicator for multi-step forms with animations
interface FormProgressProps {
  currentStep: number;
  totalSteps: number;
  labels?: string[];
  className?: string;
  variant?: 'dots' | 'bar' | 'steps';
}

export function FormProgress({ 
  currentStep, 
  totalSteps, 
  labels, 
  className,
  variant = 'bar'
}: FormProgressProps) {
  if (variant === 'dots') {
    return (
      <div className={cn('flex items-center justify-center gap-2', className)}>
        {Array.from({ length: totalSteps }).map((_, i) => (
          <motion.div
            key={i}
            initial={false}
            animate={{
              scale: i === currentStep - 1 ? 1.2 : 1,
              backgroundColor: i < currentStep 
                ? 'hsl(var(--primary))' 
                : 'hsl(var(--muted))'
            }}
            className={cn(
              'h-2.5 w-2.5 rounded-full transition-colors',
              i === currentStep - 1 && 'ring-2 ring-primary/30'
            )}
          />
        ))}
      </div>
    );
  }

  if (variant === 'steps') {
    return (
      <div className={cn('flex items-center', className)}>
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div key={i} className="flex items-center">
            <motion.div
              initial={false}
              animate={{
                scale: i === currentStep - 1 ? 1.1 : 1,
                backgroundColor: i < currentStep 
                  ? 'hsl(var(--primary))' 
                  : 'hsl(var(--muted))'
              }}
              className={cn(
                'h-8 w-8 rounded-full flex items-center justify-center text-xs font-medium',
                i < currentStep ? 'text-primary-foreground' : 'text-muted-foreground'
              )}
            >
              {i < currentStep - 1 ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring' }}
                >
                  <CheckCircle2 className="h-4 w-4" />
                </motion.div>
              ) : (
                i + 1
              )}
            </motion.div>
            {i < totalSteps - 1 && (
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: i < currentStep - 1 ? 1 : 0 }}
                className="h-0.5 w-8 bg-primary origin-left"
              />
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Passo {currentStep} de {totalSteps}</span>
        <motion.span
          key={currentStep}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {Math.round((currentStep / totalSteps) * 100)}%
        </motion.span>
      </div>
      <div className="relative h-2 bg-muted rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${(currentStep / totalSteps) * 100}%` }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-primary/80 rounded-full"
        />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
          style={{ width: `${(currentStep / totalSteps) * 100}%` }}
        />
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

// Saving indicator with pulse animation
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
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className={cn('flex items-center gap-1.5 text-xs text-muted-foreground', className)}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          >
            <Loader2 className="h-3 w-3" />
          </motion.div>
          <motion.span
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          >
            Salvando...
          </motion.span>
        </motion.div>
      ) : lastSaved ? (
        <motion.div
          key="saved"
          initial={{ opacity: 0, scale: 0.9, y: 5 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className={cn('flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400', className)}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.2, 1] }}
            transition={{ duration: 0.3 }}
          >
            <CheckCircle2 className="h-3 w-3" />
          </motion.div>
          <span>
            Salvo às {lastSaved.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

// Form submission button with states
interface SubmitButtonFeedbackProps {
  state: 'idle' | 'loading' | 'success' | 'error';
  idleText: string;
  loadingText?: string;
  successText?: string;
  errorText?: string;
  className?: string;
}

export function SubmitButtonFeedback({
  state,
  idleText,
  loadingText = 'Processando...',
  successText = 'Concluído!',
  errorText = 'Erro!',
  className
}: SubmitButtonFeedbackProps) {
  const stateConfig = {
    idle: { icon: null, text: idleText, bg: 'bg-primary' },
    loading: { icon: Loader2, text: loadingText, bg: 'bg-primary' },
    success: { icon: CheckCircle2, text: successText, bg: 'bg-green-600' },
    error: { icon: XCircle, text: errorText, bg: 'bg-red-600' },
  };

  const config = stateConfig[state];
  const Icon = config.icon;

  return (
    <motion.div
      initial={false}
      animate={{
        backgroundColor: state === 'success' ? 'rgb(22 163 74)' : 
                         state === 'error' ? 'rgb(220 38 38)' : 
                         'hsl(var(--primary))'
      }}
      className={cn(
        'inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md text-primary-foreground font-medium',
        className
      )}
    >
      <AnimatePresence mode="wait">
        {Icon && (
          <motion.div
            key={state}
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0 }}
          >
            <Icon className={cn('h-4 w-4', state === 'loading' && 'animate-spin')} />
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence mode="wait">
        <motion.span
          key={state}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
        >
          {config.text}
        </motion.span>
      </AnimatePresence>
    </motion.div>
  );
}
