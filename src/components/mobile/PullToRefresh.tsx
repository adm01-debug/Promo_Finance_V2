/**
 * Pull to Refresh - Mobile-friendly pull to refresh component
 * 
 * Provides native-like pull to refresh functionality
 */

import { useState, useRef, useCallback, ReactNode } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { Loader2, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { haptic } from '@/lib/haptic-feedback';

interface PullToRefreshProps {
  children: ReactNode;
  onRefresh: () => Promise<void>;
  className?: string;
  threshold?: number;
  disabled?: boolean;
}

export function PullToRefresh({
  children,
  onRefresh,
  className,
  threshold = 80,
  disabled = false,
}: PullToRefreshProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [canRefresh, setCanRefresh] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const y = useMotionValue(0);
  
  const indicatorOpacity = useTransform(y, [0, threshold / 2, threshold], [0, 0.5, 1]);
  const indicatorRotation = useTransform(y, [0, threshold], [0, 180]);
  const indicatorScale = useTransform(y, [0, threshold], [0.8, 1]);

  const handleDrag = useCallback((_: any, info: PanInfo) => {
    // Only allow pull down when at top of scroll
    if (containerRef.current?.scrollTop !== 0) {
      y.set(0);
      return;
    }

    const newY = Math.max(0, Math.min(info.offset.y, threshold * 1.5));
    y.set(newY);

    if (newY >= threshold && !canRefresh) {
      setCanRefresh(true);
      haptic('medium');
    } else if (newY < threshold && canRefresh) {
      setCanRefresh(false);
    }
  }, [y, threshold, canRefresh]);

  const handleDragEnd = useCallback(async () => {
    if (canRefresh && !isRefreshing) {
      setIsRefreshing(true);
      haptic('success');
      
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        setCanRefresh(false);
        y.set(0);
      }
    } else {
      y.set(0);
      setCanRefresh(false);
    }
  }, [canRefresh, isRefreshing, onRefresh, y]);

  if (disabled) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div ref={containerRef} className={cn('relative overflow-hidden', className)}>
      {/* Pull indicator */}
      <motion.div
        style={{ opacity: indicatorOpacity }}
        className="absolute top-0 left-0 right-0 flex justify-center py-4 z-10"
      >
        <motion.div
          style={{ scale: indicatorScale }}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-full',
            'bg-background border shadow-lg',
            canRefresh && 'bg-primary/10 border-primary/30'
          )}
        >
          {isRefreshing ? (
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
          ) : (
            <motion.div style={{ rotate: indicatorRotation }}>
              <ArrowDown className={cn(
                'h-4 w-4 transition-colors',
                canRefresh ? 'text-primary' : 'text-muted-foreground'
              )} />
            </motion.div>
          )}
          <span className={cn(
            'text-sm font-medium transition-colors',
            canRefresh ? 'text-primary' : 'text-muted-foreground'
          )}>
            {isRefreshing 
              ? 'Atualizando...' 
              : canRefresh 
                ? 'Solte para atualizar' 
                : 'Puxe para atualizar'
            }
          </span>
        </motion.div>
      </motion.div>

      {/* Content */}
      <motion.div
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0.5, bottom: 0 }}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        style={{ y }}
        className="touch-pan-y"
      >
        {children}
      </motion.div>
    </div>
  );
}
