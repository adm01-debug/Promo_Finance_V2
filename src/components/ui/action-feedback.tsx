/**
 * Action Feedback - Visual feedback for user actions
 * 
 * Provides animated feedback for button clicks, submissions, etc.
 */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Loader2 } from 'lucide-react';
import { Button, ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { haptic } from '@/lib/haptic-feedback';

type ActionState = 'idle' | 'loading' | 'success' | 'error';

interface ActionButtonProps extends Omit<ButtonProps, 'onClick'> {
  onClick: () => Promise<void> | void;
  successMessage?: string;
  errorMessage?: string;
  successDuration?: number;
  hapticFeedback?: boolean;
}

export function ActionButton({
  children,
  onClick,
  successMessage = 'Sucesso!',
  errorMessage = 'Erro!',
  successDuration = 2000,
  hapticFeedback = true,
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
    idle: { icon: null, text: children },
    loading: { icon: <Loader2 className="h-4 w-4 animate-spin" />, text: 'Aguarde...' },
    success: { icon: <Check className="h-4 w-4" />, text: successMessage },
    error: { icon: <X className="h-4 w-4" />, text: errorMessage },
  };

  const current = stateConfig[state];

  return (
    <Button
      onClick={handleClick}
      disabled={disabled || state === 'loading'}
      className={cn(
        'relative overflow-hidden transition-all',
        state === 'success' && 'bg-green-600 hover:bg-green-600',
        state === 'error' && 'bg-red-600 hover:bg-red-600',
        className
      )}
      {...props}
    >
      <AnimatePresence mode="wait">
        <motion.span
          key={state}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.15 }}
          className="flex items-center gap-2"
        >
          {current.icon}
          {current.text}
        </motion.span>
      </AnimatePresence>
    </Button>
  );
}

// Ripple effect for buttons
interface RippleProps {
  className?: string;
}

export function useRipple() {
  const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([]);

  const addRipple = useCallback((event: React.MouseEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const id = Date.now();

    setRipples((prev) => [...prev, { x, y, id }]);

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
            initial={{ scale: 0, opacity: 0.5 }}
            animate={{ scale: 4, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="absolute w-8 h-8 rounded-full bg-current"
            style={{
              left: ripple.x - 16,
              top: ripple.y - 16,
            }}
          />
        ))}
      </AnimatePresence>
    </span>
  );

  return { addRipple, RippleContainer };
}

// Success animation overlay
export function SuccessOverlay({ show, message }: { show: boolean; message?: string }) {
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
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="flex flex-col items-center gap-4"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: 'spring' }}
              className="p-6 rounded-full bg-green-100 dark:bg-green-900/30"
            >
              <motion.div
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ delay: 0.2, duration: 0.3 }}
              >
                <Check className="h-12 w-12 text-green-600" />
              </motion.div>
            </motion.div>
            {message && (
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-lg font-medium"
              >
                {message}
              </motion.p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
