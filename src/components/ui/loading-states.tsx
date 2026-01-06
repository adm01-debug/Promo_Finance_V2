/**
 * Loading States - Estados de carregamento diversos
 * 
 * Coleção de componentes de loading com animações
 */

import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// Pulse loader
interface PulseLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  className?: string;
}

export function PulseLoader({ size = 'md', color, className }: PulseLoaderProps) {
  const sizes = { sm: 'h-2 w-2', md: 'h-3 w-3', lg: 'h-4 w-4' };
  const gaps = { sm: 'gap-1', md: 'gap-1.5', lg: 'gap-2' };

  return (
    <div className={cn('flex items-center', gaps[size], className)}>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className={cn(sizes[size], 'rounded-full bg-primary', color)}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: i * 0.15,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

// Spinner loader
interface SpinnerLoaderProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function SpinnerLoader({ size = 'md', className }: SpinnerLoaderProps) {
  const sizes = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-8 w-8', xl: 'h-12 w-12' };

  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      className={className}
    >
      <Loader2 className={cn(sizes[size], 'text-primary')} />
    </motion.div>
  );
}

// Bar loader
interface BarLoaderProps {
  className?: string;
}

export function BarLoader({ className }: BarLoaderProps) {
  return (
    <div className={cn('h-1 w-full overflow-hidden rounded-full bg-muted', className)}>
      <motion.div
        className="h-full w-1/3 rounded-full bg-primary"
        animate={{
          x: ['0%', '200%', '0%'],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </div>
  );
}

// Skeleton text loader
interface SkeletonTextProps {
  lines?: number;
  className?: string;
}

export function SkeletonText({ lines = 3, className }: SkeletonTextProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <motion.div
          key={i}
          className={cn(
            'h-4 rounded bg-muted',
            i === lines - 1 ? 'w-2/3' : 'w-full'
          )}
          animate={{
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            delay: i * 0.1,
          }}
        />
      ))}
    </div>
  );
}

// Full page loader
interface FullPageLoaderProps {
  message?: string;
}

export function FullPageLoader({ message = 'Carregando...' }: FullPageLoaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm"
    >
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="mb-4"
      >
        <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
          <SpinnerLoader size="lg" />
        </div>
      </motion.div>
      <motion.p
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        className="text-sm text-muted-foreground"
      >
        {message}
      </motion.p>
    </motion.div>
  );
}

// Overlay loader
interface OverlayLoaderProps {
  isLoading: boolean;
  message?: string;
  children: React.ReactNode;
}

export function OverlayLoader({ isLoading, message, children }: OverlayLoaderProps) {
  return (
    <div className="relative">
      {children}
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-lg bg-background/80 backdrop-blur-sm"
        >
          <SpinnerLoader size="md" />
          {message && (
            <p className="mt-2 text-sm text-muted-foreground">{message}</p>
          )}
        </motion.div>
      )}
    </div>
  );
}

// Progress loader with percentage
interface ProgressLoaderProps {
  progress: number;
  message?: string;
  className?: string;
}

export function ProgressLoader({ progress, message, className }: ProgressLoaderProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{message || 'Carregando...'}</span>
        <span className="font-medium">{Math.round(progress)}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <motion.div
          className="h-full rounded-full bg-primary"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ type: 'spring', stiffness: 50, damping: 15 }}
        />
      </div>
    </div>
  );
}

// Shimmer effect wrapper
interface ShimmerProps {
  children: React.ReactNode;
  className?: string;
  isLoading?: boolean;
}

export function Shimmer({ children, className, isLoading = true }: ShimmerProps) {
  if (!isLoading) return <>{children}</>;

  return (
    <div className={cn('relative overflow-hidden', className)}>
      {children}
      <motion.div
        className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent"
        animate={{ x: ['0%', '200%'] }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
    </div>
  );
}

export default {
  PulseLoader,
  SpinnerLoader,
  BarLoader,
  SkeletonText,
  FullPageLoader,
  OverlayLoader,
  ProgressLoader,
  Shimmer,
};
