
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

interface GeoData {
  ip: string | null;
  country: string | null;
}

interface ValidationResult {
  allowed: boolean;
  reason?: string;
}

export function useAuthValidation() {
  const [geoData, setGeoData] = useState<GeoData>({ ip: null, country: null });
  const [ipBlocked, setIpBlocked] = useState(false);
  const [geoBlocked, setGeoBlocked] = useState(false);

  // Fetch user IP and country on mount
  useEffect(() => {
    const fetchIpAndGeo = async () => {
      try {
        // Try primary geo API
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000);
        
        // Use HTTPS API since ip-api free tier only supports HTTP
        // which is blocked by mixed content policies on HTTPS sites
        const response = await fetch('https://ipapi.co/json/', {
          signal: controller.signal
        });
        clearTimeout(timeout);
        
        if (response.ok) {
          const data = await response.json();
          // ipapi.co returns 'ip' and 'country_code' fields
          setGeoData({ ip: data.ip, country: data.country_code });
          return;
        }
      } catch {
        // Silently fail and try fallback
      }
      
      // Fallback to IP-only service
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000);
        
        const fallback = await fetch('https://api.ipify.org?format=json', {
          signal: controller.signal
        });
        clearTimeout(timeout);
        
        if (fallback.ok) {
          const fallbackData = await fallback.json();
          setGeoData(prev => ({ ...prev, ip: fallbackData.ip }));
        }
      } catch {
        // Silently fail - IP/geo validation will be skipped
      }
    };
    fetchIpAndGeo();
  }, []);

  const validateIp = useCallback(async (): Promise<ValidationResult> => {
    // Validação IP/Geo agora é feita 100% no servidor pela edge function
    // `validate-ip-geo`, que resolve o IP real via headers do proxy e
    // aplica as regras de allowed_ips / allowed_countries / blocked_ips.
    // Este hook mantém a interface por compatibilidade com o fluxo de login.
    try {
      const { data, error } = await supabase.functions.invoke('validate-ip-geo', {
        body: {},
      });
      if (error) throw error;
      if (data && data.allowed === false) {
        if (data.reason === 'blocked_ip' || data.reason === 'ip_not_allowlisted') {
          setIpBlocked(true);
        }
        if (data.reason === 'country_not_allowlisted') {
          setGeoBlocked(true);
        }
        return {
          allowed: false,
          reason:
            data.reason === 'blocked_ip'
              ? 'IP bloqueado por atividade suspeita'
              : data.reason === 'ip_not_allowlisted'
              ? `IP ${data.ip ?? ''} não autorizado para acesso`
              : data.reason === 'country_not_allowlisted'
              ? `Acesso não permitido do país: ${data.country ?? ''}`
              : 'Acesso negado pela política de segurança',
        };
      }
      return { allowed: true };
    } catch (error: unknown) {
      logger.error('Erro ao validar IP/Geo (servidor):', error);
      // Fail-open para não travar login em caso de indisponibilidade da função.
      return { allowed: true };
    }
  }, []);

  const validateGeo = useCallback(async (): Promise<ValidationResult> => {
    // Coberto por validateIp (mesma edge function faz IP + Geo em uma chamada).
    return { allowed: true };
  }, []);


  const checkBlockedIp = useCallback(async (): Promise<boolean> => {
    if (!geoData.ip) return false;

    try {
      const { data: blockedIp } = await supabase
        .from('blocked_ips')
        .select('id')
        .eq('ip_address', geoData.ip)
        .is('unblocked_at', null)
        .maybeSingle();

      if (blockedIp) {
        setIpBlocked(true);
        return true;
      }
      return false;
    } catch (error: unknown) {
      logger.error('Erro ao verificar IP bloqueado:', error);
      return false;
    }
  }, [geoData.ip]);

  const logLoginAttempt = useCallback(async (
    email: string, 
    success: boolean, 
    blockedReason?: string
  ) => {
    try {
      await supabase.from('login_attempts').insert({
        email: email,
        ip_address: geoData.ip,
        user_agent: navigator.userAgent,
        success,
        blocked_reason: blockedReason || null,
      });
    } catch (error: unknown) {
      logger.error('Erro ao registrar tentativa de login:', error);
    }
  }, [geoData.ip]);

  const resetBlocks = useCallback(() => {
    setIpBlocked(false);
    setGeoBlocked(false);
  }, []);

  return {
    geoData,
    ipBlocked,
    geoBlocked,
    validateIp,
    validateGeo,
    checkBlockedIp,
    logLoginAttempt,
    resetBlocks,
  };
}
