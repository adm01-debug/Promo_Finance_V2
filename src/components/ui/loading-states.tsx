/**
 * Loading States - Estados de carregamento avançados
 */

import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

// Pulse loader with enhanced animation
interface PulseLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  className?: string;
}

export function PulseLoader({ size = 'md', color, className }: PulseLoaderProps) {
  const sizes = { sm: 'h-1.5 w-1.5', md: 'h-2.5 w-2.5', lg: 'h-3.5 w-3.5' };
  const gaps = { sm: 'gap-1', md: 'gap-1.5', lg: 'gap-2' };

  return (
    <div className={cn('flex items-center', gaps[size], className)}>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className={cn(sizes[size], 'rounded-full bg-primary', color)}
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.4, 1, 0.4],
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            delay: i * 0.15,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

// Spinner loader with gradient
interface SpinnerLoaderProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  variant?: 'default' | 'gradient';
}

export function SpinnerLoader({ size = 'md', className, variant = 'default' }: SpinnerLoaderProps) {
  const sizes = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-8 w-8', xl: 'h-12 w-12' };

  if (variant === 'gradient') {
    const sizeMap = { sm: 16, md: 24, lg: 32, xl: 48 };
    const s = sizeMap[size];
    
    return (
      <motion.svg
        width={s}
        height={s}
        viewBox="0 0 24 24"
        className={className}
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      >
        <defs>
          <linearGradient id="spinner-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0" />
            <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity="0.5" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="1" />
          </linearGradient>
        </defs>
        <circle
          cx="12"
          cy="12"
          r="10"
          fill="none"
          stroke="url(#spinner-gradient)"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </motion.svg>
    );
  }

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

// Bar loader with glow effect
interface BarLoaderProps {
  className?: string;
  variant?: 'default' | 'glow' | 'striped';
}

export function BarLoader({ className, variant = 'default' }: BarLoaderProps) {
  return (
    <div className={cn('h-1.5 w-full overflow-hidden rounded-full bg-muted', className)}>
      <motion.div
        className={cn(
          'h-full w-1/3 rounded-full',
          variant === 'glow' && 'bg-primary shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)]',
          variant === 'striped' && 'bg-gradient-to-r from-primary via-primary/50 to-primary',
          variant === 'default' && 'bg-primary'
        )}
        animate={{
          x: ['-100%', '400%'],
        }}
        transition={{
          duration: 1.2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </div>
  );
}

// Skeleton text loader with wave
interface SkeletonTextProps {
  lines?: number;
  className?: string;
  animated?: boolean;
}

export function SkeletonText({ lines = 3, className, animated = true }: SkeletonTextProps) {
  return (
    <div className={cn('space-y-2.5', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <motion.div
          key={i}
          className={cn(
            'h-4 rounded-md bg-gradient-to-r from-muted via-muted/70 to-muted',
            i === lines - 1 ? 'w-2/3' : 'w-full'
          )}
          animate={animated ? {
            backgroundPosition: ['200% 0', '-200% 0'],
          } : undefined}
          style={animated ? { backgroundSize: '200% 100%' } : undefined}
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

// Full page loader with branding
interface FullPageLoaderProps {
  message?: string;
  logo?: React.ReactNode;
}

export function FullPageLoader({ message = 'Carregando...', logo }: FullPageLoaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/95 backdrop-blur-md"
    >
      <motion.div
        className="relative"
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        {logo || (
          <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center shadow-xl">
            <SpinnerLoader size="lg" variant="gradient" />
          </div>
        )}
        
        {/* Decorative rings */}
        <motion.div
          className="absolute inset-0 rounded-2xl border-2 border-primary/20"
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <motion.div
          className="absolute inset-0 rounded-2xl border-2 border-primary/10"
          animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0, 0.3] }}
          transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
        />
      </motion.div>
      
      <motion.p
        className="mt-6 text-sm font-medium text-muted-foreground"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        {message}
      </motion.p>
    </motion.div>
  );
}

// Overlay loader with status
interface OverlayLoaderProps {
  isLoading: boolean;
  message?: string;
  children: React.ReactNode;
  status?: 'loading' | 'success' | 'error';
}

export function OverlayLoader({ isLoading, message, children, status = 'loading' }: OverlayLoaderProps) {
  const icons = {
    loading: <SpinnerLoader size="md" />,
    success: <CheckCircle2 className="h-6 w-6 text-green-500" />,
    error: <XCircle className="h-6 w-6 text-red-500" />,
  };

  return (
    <div className="relative">
      {children}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-xl bg-background/90 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
            >
              {icons[status]}
            </motion.div>
            {message && (
              <motion.p 
                className="mt-3 text-sm text-muted-foreground"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {message}
              </motion.p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Progress loader with steps
interface ProgressLoaderProps {
  progress: number;
  message?: string;
  className?: string;
  showPercentage?: boolean;
  variant?: 'default' | 'gradient' | 'striped';
}

export function ProgressLoader({ 
  progress, 
  message, 
  className, 
  showPercentage = true,
  variant = 'gradient'
}: ProgressLoaderProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground font-medium">{message || 'Carregando...'}</span>
        {showPercentage && (
          <motion.span 
            className="font-bold text-primary tabular-nums"
            key={Math.round(progress)}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
          >
            {Math.round(progress)}%
          </motion.span>
        )}
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
        <motion.div
          className={cn(
            'h-full rounded-full',
            variant === 'gradient' && 'bg-gradient-to-r from-primary via-purple-500 to-primary',
            variant === 'striped' && 'bg-primary bg-[length:20px_20px] bg-[linear-gradient(45deg,rgba(255,255,255,.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,.15)_50%,rgba(255,255,255,.15)_75%,transparent_75%,transparent)]',
            variant === 'default' && 'bg-primary'
          )}
          initial={{ width: 0 }}
          animate={{ 
            width: `${progress}%`,
            backgroundPosition: variant === 'striped' ? ['0 0', '40px 0'] : undefined,
          }}
          transition={{ 
            width: { type: 'spring', stiffness: 50, damping: 15 },
            backgroundPosition: { duration: 1, repeat: Infinity, ease: 'linear' }
          }}
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
    <div className={cn('relative overflow-hidden rounded-lg', className)}>
      {children}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
        animate={{ x: ['-100%', '100%'] }}
        transition={{
          duration: 1.2,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
    </div>
  );
}

// Skeleton card
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <motion.div
      className={cn('rounded-xl border bg-card p-4 space-y-3', className)}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
        <div className="space-y-2 flex-1">
          <div className="h-4 w-1/2 rounded bg-muted animate-pulse" />
          <div className="h-3 w-1/3 rounded bg-muted animate-pulse" />
        </div>
      </div>
      <div className="h-20 w-full rounded-lg bg-muted animate-pulse" />
      <div className="flex gap-2">
        <div className="h-8 w-20 rounded-md bg-muted animate-pulse" />
        <div className="h-8 w-20 rounded-md bg-muted animate-pulse" />
      </div>
    </motion.div>
  );
}

// Button loading state
interface ButtonLoadingProps {
  isLoading: boolean;
  children: React.ReactNode;
  loadingText?: string;
}

export function ButtonLoading({ isLoading, children, loadingText }: ButtonLoadingProps) {
  return (
    <AnimatePresence mode="wait">
      {isLoading ? (
        <motion.span
          key="loading"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="flex items-center gap-2"
        >
          <SpinnerLoader size="sm" />
          {loadingText || 'Carregando...'}
        </motion.span>
      ) : (
        <motion.span
          key="content"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {children}
        </motion.span>
      )}
    </AnimatePresence>
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
  SkeletonCard,
  ButtonLoading,
};
