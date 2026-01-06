/**
 * Shake Animation Component
 * 
 * Wrapper que adiciona animação de shake para feedback de erro
 */

import { ReactNode, useState, useEffect, forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ShakeProps {
  children: ReactNode;
  trigger?: boolean;
  intensity?: 'light' | 'medium' | 'strong';
  className?: string;
}

const shakeVariants = {
  light: {
    x: [0, -5, 5, -5, 5, 0],
    transition: { duration: 0.4 },
  },
  medium: {
    x: [0, -10, 10, -10, 10, -5, 5, 0],
    transition: { duration: 0.5 },
  },
  strong: {
    x: [0, -15, 15, -15, 15, -10, 10, -5, 5, 0],
    transition: { duration: 0.6 },
  },
};

export const Shake = forwardRef<HTMLDivElement, ShakeProps>(
  ({ children, trigger = false, intensity = 'medium', className }, ref) => {
    const [shouldShake, setShouldShake] = useState(false);

    useEffect(() => {
      if (trigger) {
        setShouldShake(true);
        const timer = setTimeout(() => setShouldShake(false), 600);
        return () => clearTimeout(timer);
      }
    }, [trigger]);

    return (
      <motion.div
        ref={ref}
        animate={shouldShake ? shakeVariants[intensity] : {}}
        className={cn(className)}
      >
        {children}
      </motion.div>
    );
  }
);

Shake.displayName = 'Shake';

// Hook para usar shake animation
export function useShake() {
  const [shake, setShake] = useState(false);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 600);
  };

  return { shake, triggerShake };
}

// Error shake wrapper for forms
interface FormShakeProps {
  children: ReactNode;
  hasError?: boolean;
  className?: string;
}

export function FormShake({ children, hasError = false, className }: FormShakeProps) {
  const [prevError, setPrevError] = useState(false);
  const [shouldShake, setShouldShake] = useState(false);

  useEffect(() => {
    // Only shake when error changes from false to true
    if (hasError && !prevError) {
      setShouldShake(true);
      setTimeout(() => setShouldShake(false), 600);
    }
    setPrevError(hasError);
  }, [hasError, prevError]);

  return (
    <Shake trigger={shouldShake} intensity="medium" className={className}>
      {children}
    </Shake>
  );
}

// Input shake on invalid
export function InputShake({ 
  children, 
  isInvalid = false,
  className,
}: { 
  children: ReactNode; 
  isInvalid?: boolean;
  className?: string;
}) {
  return (
    <FormShake hasError={isInvalid} className={className}>
      <div className={cn(
        'transition-all duration-200',
        isInvalid && 'ring-2 ring-destructive/50 rounded-md'
      )}>
        {children}
      </div>
    </FormShake>
  );
}
