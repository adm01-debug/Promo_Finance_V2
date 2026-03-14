import { forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, RefreshCw, CloudOff, Database, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { sounds } from '@/lib/sound-feedback';
import { triggerHaptic } from '@/components/ui/micro-interactions';

interface OfflineBannerProps {
  className?: string;
  position?: 'top' | 'bottom';
  showPendingCount?: boolean;
  pendingChanges?: number;
}

export const OfflineBanner = forwardRef<HTMLDivElement, OfflineBannerProps>(function OfflineBanner({
  className,
  position = 'top',
  showPendingCount = true,
  pendingChanges = 0,
}: OfflineBannerProps, ref) {
  const { isOnline } = useNetworkStatus();
  const [wasOffline, setWasOffline] = useState(false);
  const [showReconnected, setShowReconnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  
  useEffect(() => {
    if (!isOnline) {
      setWasOffline(true);
      sounds.warning();
      triggerHaptic('error');
    } else if (wasOffline) {
      setShowReconnected(true);
      sounds.success();
      triggerHaptic('success');
      
      const timer = setTimeout(() => {
        setShowReconnected(false);
        setWasOffline(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline]);
  
  const handleSync = async () => {
    setIsSyncing(true);
    sounds.click();
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsSyncing(false);
    sounds.success();
    triggerHaptic('success');
  };
  
  if (isOnline && !showReconnected) {
    return null;
  }
  
  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ opacity: 0, y: position === 'top' ? -50 : 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: position === 'top' ? -50 : 50 }}
          className={cn(
            "fixed left-0 right-0 z-50 px-4",
            position === 'top' ? "top-0" : "bottom-20 md:bottom-0",
            className
          )}
        >
          <div className="max-w-4xl mx-auto">
            <div className="bg-warning text-warning-foreground rounded-b-lg shadow-lg px-4 py-3">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <motion.div
                    animate={{ 
                      scale: [1, 1.1, 1],
                      opacity: [1, 0.7, 1],
                    }}
                    transition={{ repeat: Infinity, duration: 2 }}
                  >
                    <WifiOff className="h-5 w-5" />
                  </motion.div>
                  
                  <div>
                    <p className="font-medium text-sm">Você está offline</p>
                    <p className="text-xs opacity-80">
                      Suas alterações serão sincronizadas quando a conexão for restaurada
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {showPendingCount && pendingChanges > 0 && (
                    <div className="flex items-center gap-1.5 bg-background/20 rounded-full px-3 py-1">
                      <Database className="h-3.5 w-3.5" />
                      <span className="text-xs font-medium">
                        {pendingChanges} pendente{pendingChanges > 1 ? 's' : ''}
                      </span>
                    </div>
                  )}
                  
                  <Button
                    variant="secondary"
                    size="sm"
                    className="bg-background/20 hover:bg-background/30 border-0"
                    onClick={handleSync}
                    disabled={isSyncing}
                  >
                    <RefreshCw className={cn("h-4 w-4 mr-1.5", isSyncing && "animate-spin")} />
                    {isSyncing ? 'Verificando...' : 'Verificar'}
                  </Button>
                </div>
              </div>
              
              <motion.div 
                className="absolute bottom-0 left-0 h-1 bg-background/30 rounded-full overflow-hidden"
                style={{ width: '100%' }}
              >
                <motion.div
                  className="h-full bg-background/50"
                  animate={{ x: ['0%', '100%'] }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                  style={{ width: '30%' }}
                />
              </motion.div>
            </div>
          </div>
        </motion.div>
      )}
      
      {showReconnected && (
        <motion.div
          initial={{ opacity: 0, y: position === 'top' ? -50 : 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: position === 'top' ? -50 : 50, scale: 0.9 }}
          className={cn(
            "fixed left-0 right-0 z-50 px-4",
            position === 'top' ? "top-0" : "bottom-20 md:bottom-0",
            className
          )}
        >
          <div className="max-w-md mx-auto">
            <div className="bg-success text-success-foreground rounded-b-lg shadow-lg px-4 py-3">
              <div className="flex items-center gap-3">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                >
                  <CheckCircle2 className="h-5 w-5" />
                </motion.div>
                
                <div className="flex-1">
                  <p className="font-medium text-sm">Conexão restaurada!</p>
                  <p className="text-xs opacity-80">
                    Sincronizando suas alterações...
                  </p>
                </div>
                
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                >
                  <RefreshCw className="h-4 w-4" />
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});
OfflineBanner.displayName = 'OfflineBanner';

export function OfflineIndicator({ className }: { className?: string }) {
  const { isOnline } = useNetworkStatus();
  
  if (isOnline) return null;
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "flex items-center gap-1.5 px-2 py-1 rounded-full",
        "bg-warning/10 text-warning",
        "border border-warning/20",
        className
      )}
    >
      <motion.div
        animate={{ opacity: [1, 0.5, 1] }}
        transition={{ repeat: Infinity, duration: 1.5 }}
      >
        <CloudOff className="h-3.5 w-3.5" />
      </motion.div>
      <span className="text-xs font-medium">Offline</span>
    </motion.div>
  );
}

export default OfflineBanner;