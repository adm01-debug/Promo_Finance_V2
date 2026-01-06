import React from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface GradientTextProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'primary' | 'success' | 'warning' | 'rainbow' | 'gold' | 'ocean';
  animate?: boolean;
}

const gradients = {
  primary: 'from-primary via-primary/80 to-accent',
  success: 'from-success via-emerald-400 to-teal-500',
  warning: 'from-warning via-orange-400 to-amber-500',
  rainbow: 'from-red-500 via-yellow-500 to-blue-500',
  gold: 'from-yellow-400 via-amber-500 to-orange-500',
  ocean: 'from-blue-400 via-cyan-500 to-teal-500',
};

export function GradientText({ 
  children, 
  className, 
  variant = 'primary',
  animate = false 
}: GradientTextProps) {
  if (animate) {
    return (
      <motion.span
        className={cn(
          'bg-gradient-to-r bg-clip-text text-transparent bg-300% animate-gradient',
          gradients[variant],
          className
        )}
        initial={{ backgroundPosition: '0% 50%' }}
        animate={{ backgroundPosition: '100% 50%' }}
        transition={{ duration: 3, repeat: Infinity, repeatType: 'reverse' }}
      >
        {children}
      </motion.span>
    );
  }

  return (
    <span
      className={cn(
        'bg-gradient-to-r bg-clip-text text-transparent',
        gradients[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

// Animated underline text
export function UnderlineText({ 
  children, 
  className 
}: { 
  children: React.ReactNode; 
  className?: string;
}) {
  return (
    <span className={cn('relative inline-block group', className)}>
      {children}
      <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
    </span>
  );
}

// Glowing text
export function GlowText({ 
  children, 
  className,
  color = 'primary'
}: { 
  children: React.ReactNode; 
  className?: string;
  color?: 'primary' | 'success' | 'warning' | 'destructive';
}) {
  const glowColors = {
    primary: 'text-primary drop-shadow-[0_0_10px_hsl(var(--primary)/0.5)]',
    success: 'text-success drop-shadow-[0_0_10px_hsl(var(--success)/0.5)]',
    warning: 'text-warning drop-shadow-[0_0_10px_hsl(var(--warning)/0.5)]',
    destructive: 'text-destructive drop-shadow-[0_0_10px_hsl(var(--destructive)/0.5)]',
  };

  return (
    <span className={cn(glowColors[color], className)}>
      {children}
    </span>
  );
}

// Typewriter effect
interface TypewriterProps {
  text: string;
  speed?: number;
  className?: string;
  onComplete?: () => void;
}

export function Typewriter({ text, speed = 50, className, onComplete }: TypewriterProps) {
  const [displayText, setDisplayText] = React.useState('');
  const [index, setIndex] = React.useState(0);

  React.useEffect(() => {
    if (index < text.length) {
      const timeout = setTimeout(() => {
        setDisplayText(prev => prev + text[index]);
        setIndex(i => i + 1);
      }, speed);
      return () => clearTimeout(timeout);
    } else if (onComplete) {
      onComplete();
    }
  }, [index, text, speed, onComplete]);

  return (
    <span className={className}>
      {displayText}
      <motion.span
        animate={{ opacity: [1, 0] }}
        transition={{ duration: 0.5, repeat: Infinity }}
        className="inline-block w-0.5 h-[1em] bg-primary ml-0.5 align-middle"
      />
    </span>
  );
}

// Number flip animation
interface FlipNumberProps {
  value: number;
  className?: string;
}

export function FlipNumber({ value, className }: FlipNumberProps) {
  const digits = String(value).split('');

  return (
    <span className={cn('inline-flex', className)}>
      {digits.map((digit, i) => (
        <motion.span
          key={`${i}-${digit}`}
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 20, opacity: 0 }}
          transition={{ duration: 0.3, delay: i * 0.05 }}
          className="inline-block"
        >
          {digit}
        </motion.span>
      ))}
    </span>
  );
}
