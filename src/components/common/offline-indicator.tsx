import { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OfflineIndicatorProps {
  className?: string;
  showReconnecting?: boolean;
}

export function OfflineIndicator({ className, showReconnecting = true }: OfflineIndicatorProps) {
  const [isOnline, setIsOnline] = useState(true);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check initial state
    setIsOnline(navigator.onLine);
    setShowBanner(!navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      setIsReconnecting(false);
      // Keep banner visible briefly to show "back online" message
      setTimeout(() => {
        setShowBanner(false);
        setDismissed(false);
      }, 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowBanner(true);
      setDismissed(false);
      
      if (showReconnecting) {
        // Start reconnection attempts
        setIsReconnecting(true);
        attemptReconnect();
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [showReconnecting]);

  const attemptReconnect = async () => {
    try {
      // Ping a small resource to check connectivity
      const response = await fetch('/api/health', { 
        method: 'HEAD',
        cache: 'no-cache',
      });
      if (response.ok) {
        setIsOnline(true);
        setIsReconnecting(false);
      }
    } catch {
      // Still offline, try again in 5 seconds
      setTimeout(attemptReconnect, 5000);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    setShowBanner(false);
  };

  const handleRetry = () => {
    setIsReconnecting(true);
    attemptReconnect();
  };

  if (!showBanner || dismissed) return null;

  return (
    <div
      className={cn(
        'fixed bottom-4 left-1/2 -translate-x-1/2 z-50',
        'flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg',
        'transition-all duration-300 ease-out',
        isOnline
          ? 'bg-green-500 text-white'
          : 'bg-yellow-500 text-yellow-900',
        className
      )}
    >
      {/* Icon */}
      <div className="flex-shrink-0">
        {isOnline ? (
          <Wifi className="w-5 h-5" />
        ) : isReconnecting ? (
          <RefreshCw className="w-5 h-5 animate-spin" />
        ) : (
          <WifiOff className="w-5 h-5" />
        )}
      </div>

      {/* Message */}
      <div className="flex-1">
        {isOnline ? (
          <p className="font-medium">Conexão restaurada!</p>
        ) : (
          <>
            <p className="font-medium">Você está offline</p>
            <p className="text-sm opacity-90">
              {isReconnecting
                ? 'Tentando reconectar...'
                : 'Algumas funcionalidades podem estar limitadas'}
            </p>
          </>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {!isOnline && !isReconnecting && (
          <button
            onClick={handleRetry}
            className="p-1.5 hover:bg-yellow-400 rounded transition-colors"
            title="Tentar reconectar"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        )}
        <button
          onClick={handleDismiss}
          className={cn(
            'p-1.5 rounded transition-colors',
            isOnline ? 'hover:bg-green-400' : 'hover:bg-yellow-400'
          )}
          title="Fechar"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// Hook to check online status
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

// Small status indicator for header/footer
export function OnlineStatusDot() {
  const isOnline = useOnlineStatus();

  return (
    <div
      className={cn(
        'w-2 h-2 rounded-full',
        isOnline ? 'bg-green-500' : 'bg-yellow-500'
      )}
      title={isOnline ? 'Online' : 'Offline'}
    />
  );
}

// Toast-style offline notification
export function OfflineToast() {
  const [isOnline, setIsOnline] = useState(true);
  const [show, setShow] = useState(false);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      setShow(true);
      setTimeout(() => setShow(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShow(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!show) return null;

  return (
    <div
      className={cn(
        'fixed top-4 right-4 z-50',
        'flex items-center gap-2 px-4 py-2 rounded-lg shadow-lg',
        'animate-in slide-in-from-right-full duration-300',
        isOnline ? 'bg-green-500 text-white' : 'bg-yellow-500 text-yellow-900'
      )}
    >
      {isOnline ? (
        <>
          <Wifi className="w-4 h-4" />
          <span className="text-sm font-medium">Conectado</span>
        </>
      ) : (
        <>
          <WifiOff className="w-4 h-4" />
          <span className="text-sm font-medium">Sem conexão</span>
        </>
      )}
    </div>
  );
}

export default OfflineIndicator;
