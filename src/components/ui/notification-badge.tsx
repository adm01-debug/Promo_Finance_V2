/**
 * Notification Badge - Badge animado para notificações
 */

import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface NotificationBadgeProps {
  count: number;
  max?: number;
  className?: string;
  variant?: 'default' | 'destructive' | 'success' | 'warning';
  showZero?: boolean;
  pulse?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const variantClasses = {
  default: 'bg-primary text-primary-foreground',
  destructive: 'bg-destructive text-destructive-foreground',
  success: 'bg-green-500 text-white',
  warning: 'bg-yellow-500 text-black',
};

const sizeClasses = {
  sm: 'h-4 min-w-4 text-[10px] px-1',
  md: 'h-5 min-w-5 text-xs px-1.5',
  lg: 'h-6 min-w-6 text-sm px-2',
};

export function NotificationBadge({
  count,
  max = 99,
  className,
  variant = 'destructive',
  showZero = false,
  pulse = true,
  size = 'md',
}: NotificationBadgeProps) {
  const shouldShow = count > 0 || showZero;
  const displayCount = count > max ? `${max}+` : count.toString();

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{
            type: 'spring',
            stiffness: 500,
            damping: 25,
          }}
          className={cn(
            'relative inline-flex items-center justify-center rounded-full font-semibold',
            variantClasses[variant],
            sizeClasses[size],
            className
          )}
        >
          <motion.span
            key={count}
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            {displayCount}
          </motion.span>
          
          {pulse && count > 0 && (
            <motion.span
              className={cn(
                'absolute inset-0 rounded-full',
                variantClasses[variant]
              )}
              animate={{
                scale: [1, 1.5],
                opacity: [0.5, 0],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'easeOut',
              }}
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Dot badge (no count, just indicator)
interface DotBadgeProps {
  show?: boolean;
  className?: string;
  variant?: 'default' | 'destructive' | 'success' | 'warning';
  pulse?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const dotSizes = {
  sm: 'h-2 w-2',
  md: 'h-2.5 w-2.5',
  lg: 'h-3 w-3',
};

export function DotBadge({
  show = true,
  className,
  variant = 'destructive',
  pulse = true,
  size = 'md',
}: DotBadgeProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0 }}
          className={cn(
            'relative rounded-full',
            variantClasses[variant],
            dotSizes[size],
            className
          )}
        >
          {pulse && (
            <motion.span
              className={cn(
                'absolute inset-0 rounded-full',
                variantClasses[variant]
              )}
              animate={{
                scale: [1, 2],
                opacity: [0.5, 0],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'easeOut',
              }}
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Badge wrapper that positions badge on children
interface BadgeWrapperProps {
  children: React.ReactNode;
  badge: React.ReactNode;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  offset?: number;
  className?: string;
}

const positionClasses = {
  'top-right': 'top-0 right-0 -translate-y-1/2 translate-x-1/2',
  'top-left': 'top-0 left-0 -translate-y-1/2 -translate-x-1/2',
  'bottom-right': 'bottom-0 right-0 translate-y-1/2 translate-x-1/2',
  'bottom-left': 'bottom-0 left-0 translate-y-1/2 -translate-x-1/2',
};

export function BadgeWrapper({
  children,
  badge,
  position = 'top-right',
  className,
}: BadgeWrapperProps) {
  return (
    <div className={cn('relative inline-flex', className)}>
      {children}
      <div className={cn('absolute', positionClasses[position])}>
        {badge}
      </div>
    </div>
  );
}

export default NotificationBadge;
