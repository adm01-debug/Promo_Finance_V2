import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

interface UserSession {
  id: string;
  user_id: string;
  device_info: string | null;
  ip_address: string | null;
  user_agent: string | null;
  last_activity: string;
  created_at: string;
  is_current: boolean;
  revoked: boolean;
  revoked_at: string | null;
}

export function useSessions() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const parseUserAgent = (ua: string | null): string => {
    if (!ua) return 'Dispositivo desconhecido';
    
    const patterns = [
      { regex: /Windows NT 10/i, name: 'Windows 10' },
      { regex: /Windows NT 6.3/i, name: 'Windows 8.1' },
      { regex: /Windows NT 6.2/i, name: 'Windows 8' },
      { regex: /Mac OS X/i, name: 'macOS' },
      { regex: /Linux/i, name: 'Linux' },
      { regex: /Android/i, name: 'Android' },
      { regex: /iPhone|iPad/i, name: 'iOS' },
    ];

    const browsers = [
      { regex: /Chrome\/(\d+)/i, name: 'Chrome' },
      { regex: /Firefox\/(\d+)/i, name: 'Firefox' },
      { regex: /Safari\/(\d+)/i, name: 'Safari' },
      { regex: /Edge\/(\d+)/i, name: 'Edge' },
    ];

    let os = 'SO Desconhecido';
    let browser = 'Navegador Desconhecido';

    for (const pattern of patterns) {
      if (pattern.regex.test(ua)) {
        os = pattern.name;
        break;
      }
    }

    for (const b of browsers) {
      const match = ua.match(b.regex);
      if (match) {
        browser = `${b.name} ${match[1] || ''}`.trim();
        break;
      }
    }

    return `${browser} em ${os}`;
  };

  const fetchSessions = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('revoked', false)
        .order('last_activity', { ascending: false });

      if (error) {
        console.error('Erro ao buscar sessões:', error);
        return;
      }

      setSessions(data || []);
    } catch (error) {
      console.error('Erro ao buscar sessões:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const createSession = async () => {
    if (!user) return;

    try {
      // Get IP
      let ipAddress = null;
      try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        ipAddress = data.ip;
      } catch {
        logger.debug('Could not fetch IP');
      }

      const deviceInfo = parseUserAgent(navigator.userAgent);

      const { error } = await supabase
        .from('user_sessions')
        .insert({
          user_id: user.id,
          device_info: deviceInfo,
          ip_address: ipAddress,
          user_agent: navigator.userAgent,
          is_current: true,
          last_activity: new Date().toISOString(),
        });

      if (error) {
        console.error('Erro ao criar sessão:', error);
      }

      await fetchSessions();
    } catch (error) {
      console.error('Erro ao criar sessão:', error);
    }
  };

  const revokeSession = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from('user_sessions')
        .update({
          revoked: true,
          revoked_at: new Date().toISOString(),
        })
        .eq('id', sessionId);

      if (error) throw error;

      setSessions(prev => prev.filter(s => s.id !== sessionId));
      toast.success('Sessão encerrada');
    } catch (error) {
      console.error('Erro ao encerrar sessão:', error);
      toast.error('Erro ao encerrar sessão');
    }
  };

  const revokeAllOtherSessions = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_sessions')
        .update({
          revoked: true,
          revoked_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .eq('is_current', false);

      if (error) throw error;

      setSessions(prev => prev.filter(s => s.is_current));
      toast.success('Todas as outras sessões foram encerradas');
    } catch (error) {
      console.error('Erro ao encerrar sessões:', error);
      toast.error('Erro ao encerrar sessões');
    }
  };

  const updateLastActivity = async (sessionId: string) => {
    try {
      await supabase
        .from('user_sessions')
        .update({ last_activity: new Date().toISOString() })
        .eq('id', sessionId);
    } catch (error) {
      console.error('Erro ao atualizar atividade:', error);
    }
  };

  return {
    sessions,
    isLoading,
    parseUserAgent,
    createSession,
    revokeSession,
    revokeAllOtherSessions,
    updateLastActivity,
    refresh: fetchSessions,
  };
}
