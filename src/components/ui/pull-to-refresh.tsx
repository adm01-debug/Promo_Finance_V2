import { useState, useRef, useCallback, ReactNode } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PullToRefreshProps {
  children: ReactNode;
  onRefresh: () => Promise<void>;
  className?: string;
  threshold?: number;
  disabled?: boolean;
}

type RefreshState = 'idle' | 'pulling' | 'ready' | 'refreshing';

export function PullToRefresh({
  children,
  onRefresh,
  className,
  threshold = 80,
  disabled = false,
}: PullToRefreshProps) {
  const [state, setState] = useState<RefreshState>('idle');
  const containerRef = useRef<HTMLDivElement>(null);
  const y = useMotionValue(0);
  
  // Transformações baseadas no pull
  const pullProgress = useTransform(y, [0, threshold], [0, 1]);
  const indicatorOpacity = useTransform(y, [0, threshold * 0.3, threshold], [0, 0.5, 1]);
  const indicatorScale = useTransform(y, [0, threshold], [0.5, 1]);
  const indicatorRotation = useTransform(y, [0, threshold * 2], [0, 360]);

  const handleDragEnd = useCallback(async (_: any, info: PanInfo) => {
    if (disabled) return;
    
    if (info.offset.y >= threshold && state === 'ready') {
      setState('refreshing');
      try {
        await onRefresh();
      } finally {
        setState('idle');
      }
    } else {
      setState('idle');
    }
  }, [disabled, threshold, state, onRefresh]);

  const handleDrag = useCallback((_: any, info: PanInfo) => {
    if (disabled) return;
    
    // Só permite pull quando estiver no topo
    const container = containerRef.current;
    if (container && container.scrollTop > 0) {
      y.set(0);
      return;
    }
    
    // Resistência ao pull
    const rawY = Math.max(0, info.offset.y);
    const dampedY = rawY * 0.5; // 50% de resistência
    y.set(dampedY);
    
    if (dampedY >= threshold) {
      setState('ready');
    } else if (dampedY > 0) {
      setState('pulling');
    }
  }, [disabled, threshold, y]);

  const handleDragStart = useCallback(() => {
    const container = containerRef.current;
    if (container && container.scrollTop > 0) {
      return false; // Cancela drag se não estiver no topo
    }
  }, []);

  return (
    <div 
      ref={containerRef}
      className={cn("relative overflow-auto", className)}
    >
      {/* Indicador de refresh */}
      <motion.div
        className="absolute left-1/2 -translate-x-1/2 z-50 pointer-events-none"
        style={{
          top: 10,
          opacity: indicatorOpacity,
          scale: indicatorScale,
        }}
      >
        <motion.div
          className={cn(
            "flex items-center justify-center w-10 h-10 rounded-full bg-background shadow-lg border",
            state === 'ready' && "bg-primary/10 border-primary",
            state === 'refreshing' && "bg-primary/20 border-primary"
          )}
          style={{
            rotate: state === 'refreshing' ? undefined : indicatorRotation,
          }}
          animate={state === 'refreshing' ? { rotate: 360 } : undefined}
          transition={state === 'refreshing' ? {
            rotate: { duration: 1, repeat: Infinity, ease: "linear" }
          } : undefined}
        >
          <RefreshCw 
            className={cn(
              "h-5 w-5 transition-colors",
              state === 'ready' || state === 'refreshing' 
                ? "text-primary" 
                : "text-muted-foreground"
            )}
          />
        </motion.div>
        
        {/* Texto de status */}
        <motion.p
          className="text-xs text-center text-muted-foreground mt-1 whitespace-nowrap"
          initial={{ opacity: 0 }}
          animate={{ opacity: state !== 'idle' ? 1 : 0 }}
        >
          {state === 'pulling' && 'Puxe para atualizar'}
          {state === 'ready' && 'Solte para atualizar'}
          {state === 'refreshing' && 'Atualizando...'}
        </motion.p>
      </motion.div>

      {/* Conteúdo arrastável */}
      <motion.div
        drag={!disabled && state !== 'refreshing' ? "y" : false}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0}
        onDragStart={handleDragStart}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        style={{ y: state === 'refreshing' ? threshold * 0.5 : y }}
        animate={state === 'idle' ? { y: 0 } : undefined}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className="min-h-full"
      >
        {children}
      </motion.div>
    </div>
  );
}

// Hook para usar pull-to-refresh com react-query
import { useQueryClient } from '@tanstack/react-query';

export function usePullToRefresh(queryKeys?: string[]) {
  const queryClient = useQueryClient();

  const handleRefresh = useCallback(async () => {
    if (queryKeys && queryKeys.length > 0) {
      await Promise.all(
        queryKeys.map(key => 
          queryClient.invalidateQueries({ queryKey: [key] })
        )
      );
    } else {
      await queryClient.invalidateQueries();
    }
  }, [queryClient, queryKeys]);

  return handleRefresh;
}
