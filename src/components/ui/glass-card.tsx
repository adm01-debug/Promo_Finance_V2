import { cn } from '@/lib/utils';
import { motion, HTMLMotionProps } from 'framer-motion';
import { forwardRef, ReactNode } from 'react';

interface GlassCardProps extends HTMLMotionProps<'div'> {
  variant?: 'default' | 'subtle' | 'strong' | 'colored' | 'rainbow';
  blur?: 'sm' | 'md' | 'lg' | 'xl';
  hover?: boolean;
  glow?: boolean;
  glowColor?: string;
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
  rainbow: 'bg-background/50 border-transparent',
};

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(({
  variant = 'default',
  blur = 'md',
  hover = true,
  glow = false,
  glowColor,
  className,
  children,
  ...props
}, ref) => {
  const isRainbow = variant === 'rainbow';
  
  return (
    <motion.div
      ref={ref}
      className={cn(
        'relative rounded-xl border shadow-lg overflow-hidden',
        blurLevels[blur],
        variants[variant],
        hover && 'transition-all duration-300 hover:shadow-xl',
        glow && !glowColor && 'shadow-[0_0_20px_rgba(var(--primary-rgb),0.2)]',
        className
      )}
      style={glow && glowColor ? { boxShadow: `0 0 20px ${glowColor}` } : undefined}
      whileHover={hover ? { y: -3, scale: 1.01 } : undefined}
      transition={{ duration: 0.2 }}
      {...props}
    >
      {/* Rainbow border effect */}
      {isRainbow && (
        <motion.div
          className="absolute inset-0 -z-10 rounded-xl bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 p-[1px]"
          animate={{ 
            background: [
              'linear-gradient(90deg, #ec4899, #8b5cf6, #06b6d4)',
              'linear-gradient(180deg, #8b5cf6, #06b6d4, #ec4899)',
              'linear-gradient(270deg, #06b6d4, #ec4899, #8b5cf6)',
              'linear-gradient(360deg, #ec4899, #8b5cf6, #06b6d4)',
            ]
          }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        />
      )}
      <div className={cn(isRainbow && 'bg-background/90 rounded-xl')}>
        {children}
      </div>
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
    <motion.div 
      className={cn(
        'backdrop-blur-xl bg-background/70 border border-border/50 rounded-2xl shadow-2xl',
        className
      )}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
    >
      {children}
    </motion.div>
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

// Neumorphic card with enhanced effects
export function NeumorphicCard({ 
  children, 
  className,
  pressed = false,
  animated = true,
}: { 
  children: React.ReactNode; 
  className?: string;
  pressed?: boolean;
  animated?: boolean;
}) {
  const Wrapper = animated ? motion.div : 'div';
  const animationProps = animated ? {
    whileHover: pressed ? {} : { y: -2 },
    whileTap: { scale: 0.98 },
  } : {};

  return (
    <Wrapper
      className={cn(
        'rounded-xl bg-background transition-all duration-200',
        pressed 
          ? 'shadow-[inset_4px_4px_8px_rgba(0,0,0,0.1),inset_-4px_-4px_8px_rgba(255,255,255,0.05)]'
          : 'shadow-[8px_8px_16px_rgba(0,0,0,0.1),-8px_-8px_16px_rgba(255,255,255,0.05)]',
        'hover:shadow-[12px_12px_20px_rgba(0,0,0,0.15),-12px_-12px_20px_rgba(255,255,255,0.08)]',
        className
      )}
      {...animationProps}
    >
      {children}
    </Wrapper>
  );
}

// Gradient border card with animation
export function GradientBorderCard({ 
  children, 
  className,
  gradient = 'from-primary via-purple-500 to-pink-500',
  animate = false,
}: { 
  children: React.ReactNode; 
  className?: string;
  gradient?: string;
  animate?: boolean;
}) {
  return (
    <motion.div 
      className={cn('relative p-[2px] rounded-xl overflow-hidden', className)}
      whileHover={{ scale: 1.02 }}
    >
      <motion.div
        className={cn('absolute inset-0 bg-gradient-to-r', gradient)}
        animate={animate ? { 
          backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
        } : undefined}
        transition={animate ? { duration: 3, repeat: Infinity, ease: 'linear' } : undefined}
        style={animate ? { backgroundSize: '200% 200%' } : undefined}
      />
      <div className="relative rounded-[10px] bg-background p-4">
        {children}
      </div>
    </motion.div>
  );
}

// Floating card with depth effect
interface FloatingCardProps {
  children: ReactNode;
  className?: string;
  depth?: 'shallow' | 'medium' | 'deep';
}

export function FloatingCard({ children, className, depth = 'medium' }: FloatingCardProps) {
  const depthStyles = {
    shallow: 'shadow-lg hover:shadow-xl',
    medium: 'shadow-xl hover:shadow-2xl',
    deep: 'shadow-2xl hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)]',
  };

  return (
    <motion.div
      className={cn(
        'rounded-xl bg-card border transition-all duration-300',
        depthStyles[depth],
        className
      )}
      initial={{ y: 0 }}
      whileHover={{ y: -8 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      {children}
    </motion.div>
  );
}

// Spotlight card - follows cursor
interface SpotlightCardProps {
  children: ReactNode;
  className?: string;
}

export function SpotlightCard({ children, className }: SpotlightCardProps) {
  return (
    <motion.div
      className={cn(
        'relative rounded-xl bg-card border overflow-hidden group',
        className
      )}
      whileHover={{ scale: 1.02 }}
    >
      {/* Spotlight effect */}
      <div 
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          background: 'radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(var(--primary-rgb), 0.1), transparent 40%)',
        }}
      />
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}
