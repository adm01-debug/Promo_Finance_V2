import { useState, useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

interface PendingMutation {
  id: string;
  type: 'create' | 'update' | 'delete';
  table: string;
  data: Record<string, unknown>;
  timestamp: number;
}

interface OfflineState {
  isOnline: boolean;
  pendingMutations: PendingMutation[];
  lastSync: number | null;
  isSyncing: boolean;
}

const STORAGE_KEY = 'promo-financeiro-offline-queue';
const SYNC_DEBOUNCE = 2000;

// Salvar queue no localStorage
function saveQueue(mutations: PendingMutation[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mutations));
  } catch (error: unknown) {
    logger.error('Failed to save offline queue:', error);
  }
}

// Carregar queue do localStorage
function loadQueue(): PendingMutation[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function useOfflineSync() {
  const queryClient = useQueryClient();
  const [state, setState] = useState<OfflineState>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    pendingMutations: [],
    lastSync: null,
    isSyncing: false,
  });
  
  const syncTimeoutRef = useRef<NodeJS.Timeout>();

  // Carregar queue pendente ao iniciar
  useEffect(() => {
    const pending = loadQueue();
    if (pending.length > 0) {
      setState(prev => ({ ...prev, pendingMutations: pending }));
    }
  }, []);

  // Monitorar status de conexão
  useEffect(() => {
    const handleOnline = () => {
      setState(prev => ({ ...prev, isOnline: true }));
      toast.success('Conexão restaurada', {
        description: 'Sincronizando dados pendentes...',
      });
    };

    const handleOffline = () => {
      setState(prev => ({ ...prev, isOnline: false }));
      toast.warning('Você está offline', {
        description: 'As alterações serão salvas localmente.',
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Sincronizar quando voltar online
  useEffect(() => {
    if (state.isOnline && state.pendingMutations.length > 0 && !state.isSyncing) {
      syncPendingMutations();
    }
  }, [state.isOnline, state.pendingMutations.length]);

  // Adicionar mutação à queue
  const addToQueue = useCallback((mutation: Omit<PendingMutation, 'id' | 'timestamp'>) => {
    const newMutation: PendingMutation = {
      ...mutation,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    };

    setState(prev => {
      const updated = [...prev.pendingMutations, newMutation];
      saveQueue(updated);
      return { ...prev, pendingMutations: updated };
    });

    // Se online, agendar sync
    if (state.isOnline) {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
      syncTimeoutRef.current = setTimeout(() => {
        syncPendingMutations();
      }, SYNC_DEBOUNCE);
    }

    return newMutation.id;
  }, [state.isOnline]);

  // Sincronizar mutações pendentes
  const syncPendingMutations = useCallback(async () => {
    if (state.pendingMutations.length === 0 || state.isSyncing) return;

    setState(prev => ({ ...prev, isSyncing: true }));

    const { supabase } = await import('@/integrations/supabase/client');
    const successfulIds: string[] = [];
    const failedMutations: PendingMutation[] = [];

    for (const mutation of state.pendingMutations) {
      try {
        switch (mutation.type) {
          case 'create':
            await (supabase.from(mutation.table as any) as any).insert(mutation.data);
            break;
          case 'update':
            await (supabase.from(mutation.table as any) as any)
              .update(mutation.data.updates)
              .eq('id', mutation.data.id);
            break;
          case 'delete':
            await (supabase.from(mutation.table as any) as any)
              .delete()
              .eq('id', mutation.data.id);
            break;
        }
        successfulIds.push(mutation.id);
      } catch (error: unknown) {
        logger.error('Sync failed for mutation:', mutation, error);
        failedMutations.push(mutation);
      }
    }

    // Atualizar estado
    setState(prev => {
      const remaining = prev.pendingMutations.filter(
        m => !successfulIds.includes(m.id)
      );
      saveQueue(remaining);
      return {
        ...prev,
        pendingMutations: remaining,
        lastSync: Date.now(),
        isSyncing: false,
      };
    });

    // Invalidar queries para atualizar UI
    if (successfulIds.length > 0) {
      await queryClient.invalidateQueries();
      toast.success(`${successfulIds.length} alteração(ões) sincronizada(s)`);
    }

    if (failedMutations.length > 0) {
      toast.error(`${failedMutations.length} alteração(ões) falharam`, {
        description: 'Tentaremos novamente em breve.',
      });
    }
  }, [state.pendingMutations, state.isSyncing, queryClient]);

  // Limpar queue
  const clearQueue = useCallback(() => {
    setState(prev => ({ ...prev, pendingMutations: [] }));
    saveQueue([]);
  }, []);

  // Forçar sync
  const forceSync = useCallback(() => {
    if (state.isOnline) {
      syncPendingMutations();
    } else {
      toast.error('Sem conexão', {
        description: 'Conecte-se à internet para sincronizar.',
      });
    }
  }, [state.isOnline, syncPendingMutations]);

  return {
    isOnline: state.isOnline,
    pendingCount: state.pendingMutations.length,
    lastSync: state.lastSync,
    isSyncing: state.isSyncing,
    addToQueue,
    forceSync,
    clearQueue,
  };
}

// Componente indicador de status offline
import { Wifi, WifiOff, RefreshCw, Cloud, CloudOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export function OfflineIndicator({ className }: { className?: string }) {
  const { isOnline, pendingCount, isSyncing, forceSync, lastSync } = useOfflineSync();

  if (isOnline && pendingCount === 0) {
    return null; // Não mostrar quando tudo está ok
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "gap-2 h-8",
            !isOnline && "text-destructive",
            className
          )}
          onClick={forceSync}
          disabled={!isOnline || isSyncing}
        >
          {isSyncing ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : isOnline ? (
            <Cloud className="h-4 w-4 text-success" />
          ) : (
            <CloudOff className="h-4 w-4" />
          )}
          
          {pendingCount > 0 && (
            <Badge variant="secondary" className="h-5 px-1.5 text-xs">
              {pendingCount}
            </Badge>
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <div className="text-sm">
          {!isOnline ? (
            <p className="font-medium text-destructive">Sem conexão</p>
          ) : isSyncing ? (
            <p>Sincronizando...</p>
          ) : (
            <p className="text-success">Conectado</p>
          )}
          {pendingCount > 0 && (
            <p className="text-muted-foreground">
              {pendingCount} alteração(ões) pendente(s)
            </p>
          )}
          {lastSync && (
            <p className="text-xs text-muted-foreground mt-1">
              Última sync: {new Date(lastSync).toLocaleTimeString()}
            </p>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
