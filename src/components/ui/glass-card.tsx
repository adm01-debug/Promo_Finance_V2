import { cn } from '@/lib/utils';
import { motion, HTMLMotionProps } from 'framer-motion';
import { forwardRef } from 'react';

interface GlassCardProps extends HTMLMotionProps<'div'> {
  variant?: 'default' | 'subtle' | 'strong' | 'colored';
  blur?: 'sm' | 'md' | 'lg' | 'xl';
  hover?: boolean;
  glow?: boolean;
  children: React.ReactNode;
}

const blurLevels = {
  sm: 'backdrop-blur-sm',
  md: 'backdrop-blur-md',
  lg: 'backdrop-blur-lg',
  xl: 'backdrop-blur-xl',
};

const variants = {
  default: 'bg-background/60 border-border/50',
  subtle: 'bg-background/30 border-border/30',
  strong: 'bg-background/80 border-border/70',
  colored: 'bg-primary/10 border-primary/20',
};

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(({
  variant = 'default',
  blur = 'md',
  hover = true,
  glow = false,
  className,
  children,
  ...props
}, ref) => {
  return (
    <motion.div
      ref={ref}
      className={cn(
        'rounded-xl border shadow-lg',
        blurLevels[blur],
        variants[variant],
        hover && 'transition-all duration-300 hover:shadow-xl hover:border-border',
        glow && 'shadow-[0_0_15px_rgba(var(--primary-rgb),0.15)]',
        className
      )}
      whileHover={hover ? { y: -2, scale: 1.01 } : undefined}
      transition={{ duration: 0.2 }}
      {...props}
    >
      {children}
    </motion.div>
  );
});
GlassCard.displayName = 'GlassCard';

// Glass panel for modals/dialogs
export function GlassPanel({ 
  children, 
  className 
}: { 
  children: React.ReactNode; 
  className?: string;
}) {
  return (
    <div className={cn(
      'backdrop-blur-xl bg-background/70 border border-border/50 rounded-2xl shadow-2xl',
      className
    )}>
      {children}
    </div>
  );
}

// Frosted glass effect
export function FrostedGlass({ 
  children, 
  className,
  intensity = 'medium'
}: { 
  children: React.ReactNode; 
  className?: string;
  intensity?: 'light' | 'medium' | 'heavy';
}) {
  const intensities = {
    light: 'backdrop-blur-sm bg-white/5 dark:bg-black/5',
    medium: 'backdrop-blur-md bg-white/10 dark:bg-black/10',
    heavy: 'backdrop-blur-xl bg-white/20 dark:bg-black/20',
  };

  return (
    <div className={cn(
      'rounded-lg border border-white/10',
      intensities[intensity],
      className
    )}>
      {children}
    </div>
  );
}

// Neumorphic card
export function NeumorphicCard({ 
  children, 
  className,
  pressed = false
}: { 
  children: React.ReactNode; 
  className?: string;
  pressed?: boolean;
}) {
  return (
    <div className={cn(
      'rounded-xl bg-background transition-all duration-200',
      pressed 
        ? 'shadow-[inset_4px_4px_8px_rgba(0,0,0,0.1),inset_-4px_-4px_8px_rgba(255,255,255,0.05)]'
        : 'shadow-[8px_8px_16px_rgba(0,0,0,0.1),-8px_-8px_16px_rgba(255,255,255,0.05)]',
      className
    )}>
      {children}
    </div>
  );
}

// Gradient border card
export function GradientBorderCard({ 
  children, 
  className,
  gradient = 'from-primary via-accent to-primary'
}: { 
  children: React.ReactNode; 
  className?: string;
  gradient?: string;
}) {
  return (
    <div className={cn('relative p-[1px] rounded-xl bg-gradient-to-r', gradient, className)}>
      <div className="rounded-xl bg-background p-4">
        {children}
      </div>
    </div>
  );
}
