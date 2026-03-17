import { forwardRef } from 'react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { Wifi, WifiOff, Signal, SignalLow, SignalMedium, SignalHigh, Zap, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from '@/components/ui/tooltip';

interface NetworkStatusIndicatorProps {
  showDetails?: boolean;
  showLabel?: boolean;
  variant?: 'minimal' | 'badge' | 'card';
  className?: string;
}

export const NetworkStatusIndicator = forwardRef<HTMLDivElement, NetworkStatusIndicatorProps>(function NetworkStatusIndicator({ 
  showDetails = false,
  showLabel = false,
  variant = 'badge',
  className 
}, ref) {
  const { isOnline, effectiveType, downlink, rtt } = useNetworkStatus();

  const getSignalIcon = () => {
    if (!isOnline) return WifiOff;
    
    switch (effectiveType) {
      case '4g': return SignalHigh;
      case '3g': return SignalMedium;
      case '2g':
      case 'slow-2g': return SignalLow;
      default: return Wifi;
    }
  };

  const getConnectionQuality = () => {
    if (!isOnline) return { label: 'Offline', color: 'destructive' as const };
    
    switch (effectiveType) {
      case '4g': return { label: 'Excelente', color: 'success' as const };
      case '3g': return { label: 'Boa', color: 'warning' as const };
      case '2g': return { label: 'Lenta', color: 'warning' as const };
      case 'slow-2g': return { label: 'Muito Lenta', color: 'destructive' as const };
      default: return { label: 'Online', color: 'success' as const };
    }
  };

  const SignalIcon = getSignalIcon();
  const quality = getConnectionQuality();

  const colorClasses = {
    success: 'text-success bg-success/10 border-success/20',
    warning: 'text-warning bg-warning/10 border-warning/20',
    destructive: 'text-destructive bg-destructive/10 border-destructive/20',
  };

  const tooltipContent = (
    <div className="text-xs space-y-1.5 min-w-[140px]">
      <div className="flex items-center gap-2 font-medium">
        <span className={cn(
          'h-2 w-2 rounded-full',
          quality.color === 'success' && 'bg-success',
          quality.color === 'warning' && 'bg-warning',
          quality.color === 'destructive' && 'bg-destructive'
        )} />
        {quality.label}
      </div>
      {isOnline && showDetails && (
        <div className="space-y-0.5 text-muted-foreground">
          {effectiveType && (
            <div className="flex justify-between">
              <span>Tipo:</span>
              <span className="font-medium">{effectiveType.toUpperCase()}</span>
            </div>
          )}
          {downlink && (
            <div className="flex justify-between">
              <span>Velocidade:</span>
              <span className="font-medium">~{downlink} Mbps</span>
            </div>
          )}
          {rtt && (
            <div className="flex justify-between">
              <span>Latência:</span>
              <span className="font-medium">~{rtt}ms</span>
            </div>
          )}
        </div>
      )}
    </div>
  );

  // Minimal variant - just icon
  if (variant === 'minimal') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.div
              className={cn('cursor-pointer', className)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <SignalIcon className={cn(
                'h-4 w-4',
                quality.color === 'success' && 'text-success',
                quality.color === 'warning' && 'text-warning',
                quality.color === 'destructive' && 'text-destructive'
              )} />
            </motion.div>
          </TooltipTrigger>
          <TooltipContent side="bottom" align="end">
            {tooltipContent}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Card variant - expanded view
  if (variant === 'card') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'p-3 rounded-xl border',
          colorClasses[quality.color],
          className
        )}
      >
        <div className="flex items-center gap-3">
          <motion.div
            className={cn(
              'p-2 rounded-lg',
              quality.color === 'success' && 'bg-success/20',
              quality.color === 'warning' && 'bg-warning/20',
              quality.color === 'destructive' && 'bg-destructive/20'
            )}
            animate={!isOnline ? { scale: [1, 1.1, 1] } : {}}
            transition={{ duration: 1, repeat: Infinity }}
          >
            <SignalIcon className="h-5 w-5" />
          </motion.div>
          <div className="flex-1">
            <p className="text-sm font-semibold">{quality.label}</p>
            {isOnline && effectiveType && (
              <p className="text-xs opacity-70">{effectiveType.toUpperCase()} • {downlink}Mbps</p>
            )}
          </div>
          {!isOnline && (
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 0.5, repeat: Infinity }}
            >
              <AlertTriangle className="h-4 w-4" />
            </motion.div>
          )}
        </div>
      </motion.div>
    );
  }

  // Default badge variant
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium border transition-all',
              colorClasses[quality.color],
              className
            )}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileHover={{ scale: 1.05 }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={isOnline ? 'online' : 'offline'}
                initial={{ rotate: -180, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 180, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <SignalIcon className="h-3.5 w-3.5" />
              </motion.div>
            </AnimatePresence>
            {(showLabel || !isOnline) && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                className="overflow-hidden"
              >
                {quality.label}
              </motion.span>
            )}
            {isOnline && effectiveType === '4g' && (
              <Zap className="h-3 w-3 text-success" />
            )}
          </motion.div>
        </TooltipTrigger>
        <TooltipContent side="bottom" align="end" className="p-2">
          {tooltipContent}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
});

// Compact connection status for headers
export function ConnectionDot({ className }: { className?: string }) {
  const { isOnline, effectiveType } = useNetworkStatus();
  
  const getColor = () => {
    if (!isOnline) return 'bg-destructive';
    switch (effectiveType) {
      case '4g': return 'bg-success';
      case '3g': return 'bg-warning';
      default: return 'bg-success';
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={cn("relative flex h-2.5 w-2.5", className)}>
            {!isOnline && (
              <span className={cn(
                "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                getColor()
              )} />
            )}
            <span className={cn(
              "relative inline-flex rounded-full h-full w-full",
              getColor()
            )} />
          </span>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p className="text-xs">{isOnline ? 'Conectado' : 'Sem conexão'}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
