import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

// Network Information API type (experimental browser API)
interface NetworkInformation extends EventTarget {
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  addEventListener(type: 'change', listener: () => void): void;
  removeEventListener(type: 'change', listener: () => void): void;
}

interface NavigatorWithConnection extends Navigator {
  connection?: NetworkInformation;
  mozConnection?: NetworkInformation;
  webkitConnection?: NetworkInformation;
}

interface NetworkStatus {
  isOnline: boolean;
  wasOffline: boolean;
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
}

export function useNetworkStatus() {
  const [status, setStatus] = useState<NetworkStatus>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    wasOffline: false,
  });

  const getConnection = useCallback((): NetworkInformation | undefined => {
    const nav = navigator as NavigatorWithConnection;
    return nav.connection || nav.mozConnection || nav.webkitConnection;
  }, []);

  const updateNetworkInfo = useCallback(() => {
    const connection = getConnection();
    
    if (connection) {
      setStatus(prev => ({
        ...prev,
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
      }));
    }
  }, [getConnection]);

  useEffect(() => {
    const handleOnline = () => {
      setStatus(prev => ({ ...prev, isOnline: true }));
      if (status.wasOffline) {
        toast.success('Conexão restaurada', {
          description: 'Você está online novamente.',
          duration: 3000,
        });
      }
      updateNetworkInfo();
    };

    const handleOffline = () => {
      setStatus(prev => ({ ...prev, isOnline: false, wasOffline: true }));
      toast.error('Sem conexão', {
        description: 'Você está offline. Algumas funcionalidades podem não estar disponíveis.',
        duration: 5000,
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Listen for connection changes
    const connection = getConnection();
    if (connection) {
      connection.addEventListener('change', updateNetworkInfo);
    }

    // Initial network info
    updateNetworkInfo();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      const conn = getConnection();
      if (conn) {
        conn.removeEventListener('change', updateNetworkInfo);
      }
    };
  }, [status.wasOffline, updateNetworkInfo, getConnection]);

  return status;
}
