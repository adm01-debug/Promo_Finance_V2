/**
 * Animated Card - Card com micro-interações
 * 
 * Card com animações suaves de entrada, hover e interação
 */

import { forwardRef, ReactNode } from 'react';
import { motion, MotionProps } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from './card';
import { cn } from '@/lib/utils';

interface AnimatedCardProps {
  children: ReactNode;
  className?: string;
  hoverEffect?: 'lift' | 'glow' | 'border' | 'scale' | 'none';
  enterAnimation?: 'fade' | 'slide-up' | 'slide-left' | 'scale' | 'none';
  delay?: number;
  onClick?: () => void;
  interactive?: boolean;
}

const hoverVariants = {
  lift: {
    rest: { y: 0, boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)' },
    hover: { y: -4, boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' },
  },
  glow: {
    rest: { boxShadow: '0 0 0 0 hsl(var(--primary) / 0)' },
    hover: { boxShadow: '0 0 30px 0 hsl(var(--primary) / 0.15)' },
  },
  border: {
    rest: { borderColor: 'hsl(var(--border))' },
    hover: { borderColor: 'hsl(var(--primary))' },
  },
  scale: {
    rest: { scale: 1 },
    hover: { scale: 1.02 },
  },
  none: {
    rest: {},
    hover: {},
  },
};

const enterVariants = {
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
  },
  'slide-up': {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
  },
  'slide-left': {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
  },
  scale: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
  },
  none: {
    initial: {},
    animate: {},
  },
};

export const AnimatedCard = forwardRef<HTMLDivElement, AnimatedCardProps>(
  ({
    children,
    className,
    hoverEffect = 'lift',
    enterAnimation = 'slide-up',
    delay = 0,
    onClick,
    interactive = false,
  }, ref) => {
    const hover = hoverVariants[hoverEffect];
    const enter = enterVariants[enterAnimation];

    return (
      <motion.div
        ref={ref}
        initial={enter.initial}
        animate={enter.animate}
        variants={hover}
        whileHover="hover"
        whileTap={interactive ? { scale: 0.98 } : undefined}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 25,
          delay,
        }}
        onClick={onClick}
        className={cn(interactive && 'cursor-pointer')}
      >
        <Card className={cn('transition-colors duration-200', className)}>
          {children}
        </Card>
      </motion.div>
    );
  }
);

AnimatedCard.displayName = 'AnimatedCard';

// Staggered cards container
interface StaggeredCardsProps {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
}

export function StaggeredCards({ children, className, staggerDelay = 0.05 }: StaggeredCardsProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: staggerDelay,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Stagger item wrapper
interface StaggerItemProps {
  children: ReactNode;
  className?: string;
}

export function StaggerItem({ children, className }: StaggerItemProps) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
      }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 25,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Re-export card components for convenience
export { CardContent, CardHeader, CardTitle, CardDescription, CardFooter };

export default AnimatedCard;
