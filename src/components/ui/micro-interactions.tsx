import * as React from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

// Animated counter for numbers
interface AnimatedCounterProps {
  value: number;
  duration?: number;
  className?: string;
  formatter?: (value: number) => string;
}

export function AnimatedCounter({ 
  value, 
  duration = 1000, 
  className,
  formatter = (v) => v.toLocaleString('pt-BR'),
}: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = React.useState(0);
  
  React.useEffect(() => {
    const startTime = Date.now();
    const startValue = displayValue;
    const diff = value - startValue;
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Easing function
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(startValue + diff * eased));
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }, [value, duration]);
  
  return <span className={className}>{formatter(displayValue)}</span>;
}

// Pulse dot indicator
interface PulseDotProps {
  color?: 'success' | 'warning' | 'destructive' | 'primary';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function PulseDot({ color = 'success', size = 'md', className }: PulseDotProps) {
  const colors = {
    success: 'bg-success',
    warning: 'bg-warning',
    destructive: 'bg-destructive',
    primary: 'bg-primary',
  };
  
  const sizes = {
    sm: 'h-2 w-2',
    md: 'h-3 w-3',
    lg: 'h-4 w-4',
  };
  
  return (
    <span className={cn("relative flex", sizes[size], className)}>
      <span className={cn(
        "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
        colors[color]
      )} />
      <span className={cn(
        "relative inline-flex rounded-full h-full w-full",
        colors[color]
      )} />
    </span>
  );
}

// Shimmer effect wrapper
export function Shimmer({ 
  children, 
  className 
}: { 
  children: React.ReactNode; 
  className?: string; 
}) {
  return (
    <div className={cn("relative overflow-hidden", className)}>
      {children}
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </div>
  );
}

// Success checkmark animation
export function SuccessCheck({ show }: { show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          className="flex items-center justify-center"
        >
          <motion.svg
            className="h-16 w-16 text-success"
            viewBox="0 0 52 52"
            initial="hidden"
            animate="visible"
          >
            <motion.circle
              cx="26"
              cy="26"
              r="25"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
            <motion.path
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M14.1 27.2l7.1 7.2 16.7-16.8"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.3, delay: 0.5 }}
            />
          </motion.svg>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Hover lift effect wrapper
export function HoverLift({ 
  children, 
  className 
}: { 
  children: React.ReactNode; 
  className?: string; 
}) {
  return (
    <motion.div
      className={className}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.98 }}
    >
      {children}
    </motion.div>
  );
}

// Stagger children animation wrapper
interface StaggerContainerProps {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
}

export function StaggerContainer({ 
  children, 
  className,
  staggerDelay = 0.05,
}: StaggerContainerProps) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: { staggerChildren: staggerDelay },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ 
  children, 
  className 
}: { 
  children: React.ReactNode; 
  className?: string; 
}) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { 
          opacity: 1, 
          y: 0,
          transition: { type: 'spring', stiffness: 300, damping: 24 },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

// Empty state with animation
interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "flex flex-col items-center justify-center py-12 px-4 text-center",
        className
      )}
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', delay: 0.1 }}
        className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4"
      >
        {icon}
      </motion.div>
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground mt-1 max-w-sm">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </motion.div>
  );
}
