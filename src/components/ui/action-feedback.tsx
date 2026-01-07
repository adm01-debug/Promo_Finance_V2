/**
 * Action Feedback - Visual feedback for user actions
 * 
 * Provides animated feedback for button clicks, submissions, etc.
 */

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { Check, X, Loader2, AlertCircle, Info, Sparkles } from 'lucide-react';
import { Button, ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { haptic } from '@/lib/haptic-feedback';

type ActionState = 'idle' | 'loading' | 'success' | 'error';

interface ActionButtonProps extends Omit<ButtonProps, 'onClick'> {
  onClick: () => Promise<void> | void;
  successMessage?: string;
  errorMessage?: string;
  loadingMessage?: string;
  successDuration?: number;
  hapticFeedback?: boolean;
  /** Show confetti on success */
  celebrate?: boolean;
  /** Icon to show in idle state */
  icon?: React.ReactNode;
}

export function ActionButton({
  children,
  onClick,
  successMessage = 'Sucesso!',
  errorMessage = 'Erro!',
  loadingMessage = 'Aguarde...',
  successDuration = 2000,
  hapticFeedback = true,
  celebrate = false,
  icon,
  className,
  disabled,
  ...props
}: ActionButtonProps) {
  const [state, setState] = useState<ActionState>('idle');

  const handleClick = useCallback(async () => {
    if (state !== 'idle') return;

    setState('loading');
    if (hapticFeedback) haptic('light');

    try {
      await onClick();
      setState('success');
      if (hapticFeedback) haptic('success');
      
      setTimeout(() => {
        setState('idle');
      }, successDuration);
    } catch (error) {
      setState('error');
      if (hapticFeedback) haptic('error');
      
      setTimeout(() => {
        setState('idle');
      }, successDuration);
    }
  }, [onClick, state, hapticFeedback, successDuration]);

  const stateConfig = {
    idle: { icon: icon, text: children, bgClass: '' },
    loading: { icon: <Loader2 className="h-4 w-4 animate-spin" />, text: loadingMessage, bgClass: '' },
    success: { icon: <Check className="h-4 w-4" />, text: successMessage, bgClass: 'bg-green-600 hover:bg-green-600 border-green-600' },
    error: { icon: <X className="h-4 w-4" />, text: errorMessage, bgClass: 'bg-destructive hover:bg-destructive border-destructive' },
  };

  const current = stateConfig[state];

  return (
    <div className="relative">
      <Button
        onClick={handleClick}
        disabled={disabled || state === 'loading'}
        className={cn(
          'relative overflow-hidden transition-all duration-300',
          current.bgClass,
          className
        )}
        {...props}
      >
        <AnimatePresence mode="wait">
          <motion.span
            key={state}
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.9 }}
            transition={{ duration: 0.15 }}
            className="flex items-center gap-2"
          >
            {current.icon}
            {current.text}
          </motion.span>
        </AnimatePresence>
      </Button>
      
      {/* Success sparkles effect */}
      {celebrate && state === 'success' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 pointer-events-none"
        >
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ 
                scale: 0, 
                x: '50%', 
                y: '50%',
                opacity: 1 
              }}
              animate={{ 
                scale: [0, 1, 0],
                x: `${50 + (Math.random() - 0.5) * 100}%`,
                y: `${50 + (Math.random() - 0.5) * 100}%`,
                opacity: [1, 1, 0]
              }}
              transition={{ duration: 0.6, delay: i * 0.05 }}
              className="absolute w-2 h-2 text-yellow-400"
            >
              <Sparkles className="h-full w-full" />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}

// Enhanced ripple effect for buttons
interface RippleProps {
  className?: string;
}

export function useRipple() {
  const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number; size: number }>>([]);

  const addRipple = useCallback((event: React.MouseEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const size = Math.max(rect.width, rect.height) * 2;
    const id = Date.now();

    setRipples((prev) => [...prev, { x, y, id, size }]);

    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== id));
    }, 600);
  }, []);

  const RippleContainer = ({ className }: RippleProps) => (
    <span className={cn('absolute inset-0 overflow-hidden rounded-inherit pointer-events-none', className)}>
      <AnimatePresence>
        {ripples.map((ripple) => (
          <motion.span
            key={ripple.id}
            initial={{ scale: 0, opacity: 0.4 }}
            animate={{ scale: 1, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="absolute rounded-full bg-current"
            style={{
              left: ripple.x - ripple.size / 2,
              top: ripple.y - ripple.size / 2,
              width: ripple.size,
              height: ripple.size,
            }}
          />
        ))}
      </AnimatePresence>
    </span>
  );

  return { addRipple, RippleContainer };
}

// Progress button for long operations
interface ProgressButtonProps extends Omit<ButtonProps, 'onClick'> {
  onClick: () => Promise<void>;
  progress?: number;
}

export function ProgressButton({
  children,
  onClick,
  progress = 0,
  className,
  disabled,
  ...props
}: ProgressButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [currentProgress, setCurrentProgress] = useState(0);

  const handleClick = async () => {
    setIsLoading(true);
    setCurrentProgress(0);
    try {
      await onClick();
    } finally {
      setIsLoading(false);
      setCurrentProgress(0);
    }
  };

  useEffect(() => {
    if (progress > 0) {
      setCurrentProgress(progress);
    }
  }, [progress]);

  return (
    <Button
      onClick={handleClick}
      disabled={disabled || isLoading}
      className={cn('relative overflow-hidden', className)}
      {...props}
    >
      {/* Progress bar */}
      {isLoading && (
        <motion.div
          className="absolute inset-0 bg-primary-foreground/20"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: currentProgress / 100 }}
          style={{ transformOrigin: 'left' }}
          transition={{ duration: 0.3 }}
        />
      )}
      <span className="relative z-10 flex items-center gap-2">
        {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
        {children}
      </span>
    </Button>
  );
}

// Success animation overlay with enhanced visuals
export function SuccessOverlay({ 
  show, 
  message,
  subtitle 
}: { 
  show: boolean; 
  message?: string;
  subtitle?: string;
}) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="flex flex-col items-center gap-4"
          >
            {/* Animated circle with check */}
            <div className="relative">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                className="p-6 rounded-full bg-green-100 dark:bg-green-900/30"
              >
                <motion.svg
                  viewBox="0 0 24 24"
                  className="h-12 w-12 text-green-600"
                  initial="hidden"
                  animate="visible"
                >
                  <motion.path
                    d="M5 13l4 4L19 7"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={3}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ delay: 0.2, duration: 0.4, ease: "easeOut" }}
                  />
                </motion.svg>
              </motion.div>
              
              {/* Pulse rings */}
              <motion.div
                initial={{ scale: 1, opacity: 0.5 }}
                animate={{ scale: 1.5, opacity: 0 }}
                transition={{ duration: 1, repeat: 2 }}
                className="absolute inset-0 rounded-full bg-green-500/20"
              />
            </div>
            
            {message && (
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-xl font-semibold"
              >
                {message}
              </motion.p>
            )}
            
            {subtitle && (
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-sm text-muted-foreground"
              >
                {subtitle}
              </motion.p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Toast-like inline feedback
interface InlineFeedbackProps {
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  show: boolean;
  onDismiss?: () => void;
  duration?: number;
}

export function InlineFeedback({
  type,
  message,
  show,
  onDismiss,
  duration = 3000,
}: InlineFeedbackProps) {
  useEffect(() => {
    if (show && onDismiss && duration > 0) {
      const timer = setTimeout(onDismiss, duration);
      return () => clearTimeout(timer);
    }
  }, [show, onDismiss, duration]);

  const config = {
    success: { 
      icon: Check, 
      bg: 'bg-green-50 dark:bg-green-900/20', 
      border: 'border-green-200 dark:border-green-800',
      text: 'text-green-700 dark:text-green-300' 
    },
    error: { 
      icon: X, 
      bg: 'bg-red-50 dark:bg-red-900/20', 
      border: 'border-red-200 dark:border-red-800',
      text: 'text-red-700 dark:text-red-300' 
    },
    info: { 
      icon: Info, 
      bg: 'bg-blue-50 dark:bg-blue-900/20', 
      border: 'border-blue-200 dark:border-blue-800',
      text: 'text-blue-700 dark:text-blue-300' 
    },
    warning: { 
      icon: AlertCircle, 
      bg: 'bg-yellow-50 dark:bg-yellow-900/20', 
      border: 'border-yellow-200 dark:border-yellow-800',
      text: 'text-yellow-700 dark:text-yellow-300' 
    },
  };

  const { icon: Icon, bg, border, text } = config[type];

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, height: 0, marginTop: 0 }}
          animate={{ opacity: 1, height: 'auto', marginTop: 8 }}
          exit={{ opacity: 0, height: 0, marginTop: 0 }}
          className={cn('rounded-lg border p-3 flex items-center gap-2', bg, border, text)}
        >
          <Icon className="h-4 w-4 flex-shrink-0" />
          <span className="text-sm">{message}</span>
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="ml-auto hover:opacity-70 transition-opacity"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Skeleton button for loading states
export function SkeletonButton({ className }: { className?: string }) {
  return (
    <div className={cn(
      "h-10 px-4 rounded-md bg-muted animate-pulse",
      className
    )} />
  );
}
