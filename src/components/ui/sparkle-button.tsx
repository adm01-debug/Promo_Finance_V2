import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useCallback } from 'react';
import { Button, ButtonProps } from './button';
import { Sparkles, Star, Zap, Heart, Flame } from 'lucide-react';

interface SparkleButtonProps extends ButtonProps {
  sparkleColor?: string;
  sparkleCount?: number;
  sparkleType?: 'sparkle' | 'star' | 'zap' | 'heart' | 'flame';
}

const sparkleIcons = {
  sparkle: Sparkles,
  star: Star,
  zap: Zap,
  heart: Heart,
  flame: Flame,
};

interface Sparkle {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
}

export function SparkleButton({
  children,
  className,
  sparkleColor = 'hsl(var(--primary))',
  sparkleCount = 6,
  sparkleType = 'sparkle',
  onClick,
  ...props
}: SparkleButtonProps) {
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);
  const Icon = sparkleIcons[sparkleType];

  const createSparkles = useCallback(() => {
    const newSparkles = Array.from({ length: sparkleCount }, (_, i) => ({
      id: Date.now() + i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 10 + 8,
      delay: Math.random() * 0.3,
    }));
    setSparkles(newSparkles);
    setTimeout(() => setSparkles([]), 1000);
  }, [sparkleCount]);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    createSparkles();
    onClick?.(e);
  };

  return (
    <Button
      className={cn('relative overflow-visible', className)}
      onClick={handleClick}
      {...props}
    >
      <span className="relative z-10">{children}</span>
      <AnimatePresence>
        {sparkles.map((sparkle) => (
          <motion.span
            key={sparkle.id}
            initial={{ 
              opacity: 0, 
              scale: 0,
              x: '50%',
              y: '50%',
            }}
            animate={{ 
              opacity: [0, 1, 0],
              scale: [0, 1.5, 0],
              x: `${sparkle.x}%`,
              y: `${sparkle.y - 50}%`,
            }}
            exit={{ opacity: 0 }}
            transition={{ 
              duration: 0.6, 
              delay: sparkle.delay,
              ease: 'easeOut'
            }}
            style={{ 
              position: 'absolute',
              width: sparkle.size,
              height: sparkle.size,
              color: sparkleColor,
              pointerEvents: 'none',
            }}
          >
            <Icon className="w-full h-full" />
          </motion.span>
        ))}
      </AnimatePresence>
    </Button>
  );
}

// Magnetic button that follows cursor
export function MagneticButton({ 
  children, 
  className,
  ...props 
}: ButtonProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    setPosition({ x: x * 0.2, y: y * 0.2 });
  };

  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 });
  };

  return (
    <motion.div
      animate={{ x: position.x, y: position.y }}
      transition={{ type: 'spring', stiffness: 150, damping: 15 }}
    >
      <Button
        className={className}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        {...props}
      >
        {children}
      </Button>
    </motion.div>
  );
}

// Shimmer button with shine effect
export function ShimmerButton({ 
  children, 
  className,
  shimmerColor = 'rgba(255,255,255,0.3)',
  ...props 
}: ButtonProps & { shimmerColor?: string }) {
  return (
    <Button
      className={cn(
        'relative overflow-hidden',
        'before:absolute before:inset-0 before:-translate-x-full',
        'before:animate-shimmer before:bg-gradient-to-r',
        'before:from-transparent before:via-white/10 before:to-transparent',
        className
      )}
      {...props}
    >
      {children}
    </Button>
  );
}

// Gradient animated button
export function GradientButton({ 
  children, 
  className,
  ...props 
}: ButtonProps) {
  return (
    <Button
      className={cn(
        'relative overflow-hidden bg-gradient-to-r from-primary via-accent to-primary',
        'bg-300% animate-gradient',
        'hover:shadow-lg hover:shadow-primary/25',
        'transition-shadow duration-300',
        className
      )}
      {...props}
    >
      {children}
    </Button>
  );
}

// Pulse button for CTAs
export function PulseButton({ 
  children, 
  className,
  pulseColor = 'primary',
  ...props 
}: ButtonProps & { pulseColor?: 'primary' | 'success' | 'warning' | 'destructive' }) {
  const colors = {
    primary: 'shadow-primary/50',
    success: 'shadow-success/50',
    warning: 'shadow-warning/50',
    destructive: 'shadow-destructive/50',
  };

  return (
    <Button
      className={cn(
        'animate-pulse-subtle',
        `shadow-lg ${colors[pulseColor]}`,
        className
      )}
      {...props}
    >
      {children}
    </Button>
  );
}
