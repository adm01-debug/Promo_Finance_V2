/**
 * Animated Button - Botão com micro-interações
 * 
 * Combina:
 * - Animações de hover/tap do framer-motion
 * - Feedback háptico
 * - Sons opcionais
 * - Estados visuais de loading/success/error
 */

import { forwardRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Check, X, LucideIcon } from 'lucide-react';
import { Button, ButtonProps } from './button';
import { cn } from '@/lib/utils';
import { haptic } from '@/lib/haptic-feedback';
import { playSound } from '@/lib/sound-feedback';

interface AnimatedButtonProps extends Omit<ButtonProps, 'onClick'> {
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void | Promise<void>;
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  hapticFeedback?: 'light' | 'medium' | 'heavy' | 'success' | 'error' | false;
  soundFeedback?: 'click' | 'success' | 'error' | false;
  successDuration?: number;
  showSuccessState?: boolean;
  animationVariant?: 'scale' | 'bounce' | 'glow' | 'none';
}

const animationVariants = {
  scale: {
    whileHover: { scale: 1.02 },
    whileTap: { scale: 0.98 },
  },
  bounce: {
    whileHover: { scale: 1.05, y: -2 },
    whileTap: { scale: 0.95, y: 0 },
  },
  glow: {
    whileHover: { scale: 1.02, boxShadow: '0 0 20px rgba(var(--primary), 0.3)' },
    whileTap: { scale: 0.98 },
  },
  none: {},
};

export const AnimatedButton = forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  ({
    children,
    onClick,
    icon: Icon,
    iconPosition = 'left',
    hapticFeedback = 'light',
    soundFeedback = false,
    successDuration = 1500,
    showSuccessState = true,
    animationVariant = 'scale',
    className,
    disabled,
    ...props
  }, ref) => {
    const [state, setState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

    const handleClick = useCallback(async (e: React.MouseEvent<HTMLButtonElement>) => {
      if (disabled || state === 'loading') return;

      // Trigger haptic
      if (hapticFeedback) {
        haptic(hapticFeedback);
      }

      // Trigger sound
      if (soundFeedback) {
        playSound(soundFeedback);
      }

      if (!onClick) return;

      try {
        const result = onClick(e);
        
        // If it's a promise, show loading state
        if (result instanceof Promise) {
          setState('loading');
          await result;
          
          if (showSuccessState) {
            setState('success');
            haptic('success');
            if (soundFeedback) playSound('success');
            
            setTimeout(() => setState('idle'), successDuration);
          } else {
            setState('idle');
          }
        }
      } catch (error) {
        setState('error');
        haptic('error');
        if (soundFeedback) playSound('error');
        
        setTimeout(() => setState('idle'), successDuration);
      }
    }, [onClick, disabled, state, hapticFeedback, soundFeedback, showSuccessState, successDuration]);

    const isDisabled = disabled || state === 'loading';
    const variant = animationVariants[animationVariant];

    const iconElement = (
      <AnimatePresence mode="wait">
        {state === 'loading' && (
          <motion.div
            key="loading"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
          >
            <Loader2 className="h-4 w-4 animate-spin" />
          </motion.div>
        )}
        {state === 'success' && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
          >
            <Check className="h-4 w-4 text-green-500" />
          </motion.div>
        )}
        {state === 'error' && (
          <motion.div
            key="error"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
          >
            <X className="h-4 w-4 text-red-500" />
          </motion.div>
        )}
        {state === 'idle' && Icon && (
          <motion.div
            key="icon"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
          >
            <Icon className="h-4 w-4" />
          </motion.div>
        )}
      </AnimatePresence>
    );

    return (
      <motion.div
        {...variant}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      >
        <Button
          ref={ref}
          onClick={handleClick}
          disabled={isDisabled}
          className={cn(
            'relative overflow-hidden transition-all',
            state === 'success' && 'bg-green-500 hover:bg-green-500 text-white',
            state === 'error' && 'bg-red-500 hover:bg-red-500 text-white',
            className
          )}
          {...props}
        >
          {iconPosition === 'left' && (Icon || state !== 'idle') && (
            <span className="mr-2">{iconElement}</span>
          )}
          
          <span className={cn(state === 'loading' && 'opacity-70')}>
            {children}
          </span>
          
          {iconPosition === 'right' && (Icon || state !== 'idle') && (
            <span className="ml-2">{iconElement}</span>
          )}
        </Button>
      </motion.div>
    );
  }
);

AnimatedButton.displayName = 'AnimatedButton';

export default AnimatedButton;
