import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { Wifi, WifiOff, Signal, SignalLow, SignalMedium, SignalHigh } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface NetworkStatusIndicatorProps {
  showDetails?: boolean;
  className?: string;
}

export function NetworkStatusIndicator({ 
  showDetails = false,
  className 
}: NetworkStatusIndicatorProps) {
  const { isOnline, effectiveType, downlink, rtt } = useNetworkStatus();

  const getSignalIcon = () => {
    if (!isOnline) return <WifiOff className="h-4 w-4" />;
    
    switch (effectiveType) {
      case '4g':
        return <SignalHigh className="h-4 w-4" />;
      case '3g':
        return <SignalMedium className="h-4 w-4" />;
      case '2g':
      case 'slow-2g':
        return <SignalLow className="h-4 w-4" />;
      default:
        return <Wifi className="h-4 w-4" />;
    }
  };

  const getConnectionQuality = () => {
    if (!isOnline) return 'Offline';
    
    switch (effectiveType) {
      case '4g':
        return 'Excelente';
      case '3g':
        return 'Boa';
      case '2g':
        return 'Lenta';
      case 'slow-2g':
        return 'Muito Lenta';
      default:
        return 'Online';
    }
  };

  const tooltipContent = (
    <div className="text-xs space-y-1">
      <div className="font-medium">{getConnectionQuality()}</div>
      {isOnline && showDetails && (
        <>
          {effectiveType && <div>Tipo: {effectiveType.toUpperCase()}</div>}
          {downlink && <div>Velocidade: ~{downlink} Mbps</div>}
          {rtt && <div>Latência: ~{rtt}ms</div>}
        </>
      )}
    </div>
  );

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={cn(
            'flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium transition-colors',
            isOnline 
              ? 'text-success bg-success/10' 
              : 'text-destructive bg-destructive/10 animate-pulse',
            className
          )}
        >
          {getSignalIcon()}
          {!isOnline && <span>Offline</span>}
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom" align="end">
        {tooltipContent}
      </TooltipContent>
    </Tooltip>
  );
}
