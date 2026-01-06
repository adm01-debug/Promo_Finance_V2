/**
 * Animated List - Lista com animações staggered
 * 
 * Lista que anima itens de forma escalonada
 */

import { ReactNode, Children, cloneElement, isValidElement } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AnimatedListProps {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
  animation?: 'fade' | 'slide-up' | 'slide-left' | 'scale';
  showEmpty?: boolean;
  emptyState?: ReactNode;
}

const itemVariants: Record<string, Variants> = {
  fade: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 },
  },
  'slide-up': {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
  },
  'slide-left': {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
  },
  scale: {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.9 },
  },
};

export function AnimatedList({
  children,
  className,
  staggerDelay = 0.05,
  animation = 'slide-up',
  showEmpty = true,
  emptyState,
}: AnimatedListProps) {
  const childArray = Children.toArray(children);
  const isEmpty = childArray.length === 0;

  if (isEmpty && showEmpty && emptyState) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      >
        {emptyState}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: staggerDelay,
          },
        },
        exit: {
          transition: {
            staggerChildren: staggerDelay / 2,
            staggerDirection: -1,
          },
        },
      }}
      className={className}
    >
      <AnimatePresence mode="popLayout">
        {childArray.map((child, index) => {
          if (!isValidElement(child)) return child;

          return (
            <motion.div
              key={child.key || index}
              variants={itemVariants[animation]}
              transition={{
                type: 'spring',
                stiffness: 300,
                damping: 25,
              }}
              layout
            >
              {child}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </motion.div>
  );
}

// Individual animated list item with hover effects
interface AnimatedListItemProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  hoverEffect?: 'lift' | 'glow' | 'scale' | 'highlight' | 'none';
}

const hoverEffects = {
  lift: {
    rest: { y: 0 },
    hover: { y: -2 },
  },
  glow: {
    rest: { boxShadow: '0 0 0 0 transparent' },
    hover: { boxShadow: '0 0 20px 0 hsl(var(--primary) / 0.1)' },
  },
  scale: {
    rest: { scale: 1 },
    hover: { scale: 1.01 },
  },
  highlight: {
    rest: { backgroundColor: 'transparent' },
    hover: { backgroundColor: 'hsl(var(--muted) / 0.5)' },
  },
  none: {
    rest: {},
    hover: {},
  },
};

export function AnimatedListItem({
  children,
  className,
  onClick,
  hoverEffect = 'highlight',
}: AnimatedListItemProps) {
  const effect = hoverEffects[hoverEffect];

  return (
    <motion.div
      variants={effect}
      initial="rest"
      whileHover="hover"
      whileTap={{ scale: onClick ? 0.99 : 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      onClick={onClick}
      className={cn(
        'rounded-lg transition-colors',
        onClick && 'cursor-pointer',
        className
      )}
    >
      {children}
    </motion.div>
  );
}

// Animated table rows
interface AnimatedTableRowsProps {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
}

export function AnimatedTableRows({
  children,
  className,
  staggerDelay = 0.03,
}: AnimatedTableRowsProps) {
  const childArray = Children.toArray(children);

  return (
    <AnimatePresence mode="popLayout">
      {childArray.map((child, index) => {
        if (!isValidElement(child)) return child;

        return (
          <motion.tr
            key={child.key || index}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 25,
              delay: index * staggerDelay,
            }}
            className={cn('transition-colors hover:bg-muted/50', className)}
            layout
          >
            {child.props.children}
          </motion.tr>
        );
      })}
    </AnimatePresence>
  );
}

export default AnimatedList;
