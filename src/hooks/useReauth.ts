import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

type ReauthAction = 
  | 'change_password' 
  | 'change_email' 
  | 'configure_mfa' 
  | 'admin_action' 
  | 'sensitive_action';

interface ReauthConfig {
  requiredFor: ReauthAction[];
  sessionTimeout: number; // in minutes
  lastReauthAt: Date | null;
}

const REAUTH_TIMEOUT_MINUTES = 15; // Require reauth every 15 minutes for sensitive actions

export function useReauth() {
  const { user } = useAuth();
  const [isReauthenticating, setIsReauthenticating] = useState(false);
  const [lastReauthAt, setLastReauthAt] = useState<Date | null>(null);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  const needsReauth = useCallback((action: ReauthAction): boolean => {
    if (!lastReauthAt) return true;
    
    const now = new Date();
    const diffMinutes = (now.getTime() - lastReauthAt.getTime()) / (1000 * 60);
    
    return diffMinutes > REAUTH_TIMEOUT_MINUTES;
  }, [lastReauthAt]);

  const reauthenticate = async (password: string): Promise<boolean> => {
    if (!user?.email) {
      toast.error('Usuário não autenticado');
      return false;
    }

    setIsReauthenticating(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: user.email,
        password,
      });

      if (error) {
        toast.error('Senha incorreta');
        return false;
      }

      setLastReauthAt(new Date());
      toast.success('Re-autenticação bem-sucedida');
      
      // Execute pending action if exists
      if (pendingAction) {
        pendingAction();
        setPendingAction(null);
      }
      
      return true;
    } catch (error: unknown) {
      logger.error('[useReauth] Erro na re-autenticação:', error);
      toast.error('Erro ao re-autenticar');
      return false;
    } finally {
      setIsReauthenticating(false);
    }
  };

  const requireReauth = (action: ReauthAction, callback: () => void): boolean => {
    if (!needsReauth(action)) {
      callback();
      return false; // No reauth needed, action executed
    }
    
    setPendingAction(() => callback);
    return true; // Reauth required
  };

  const cancelReauth = () => {
    setPendingAction(null);
    setIsReauthenticating(false);
  };

  return {
    needsReauth,
    reauthenticate,
    requireReauth,
    cancelReauth,
    isReauthenticating,
    hasPendingAction: pendingAction !== null,
  };
}
