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
    if (!geoData.ip) {
      return { allowed: true };
    }

    try {
      const { data: settings } = await supabase
        .from('security_settings')
        .select('restrict_by_ip, allowed_global_ips')
        .maybeSingle();

      if (!settings?.restrict_by_ip) {
        return { allowed: true };
      }

      const globalIps = settings.allowed_global_ips || [];
      if (globalIps.includes(geoData.ip)) {
        return { allowed: true };
      }

      const { data: allowedIps } = await supabase
        .from('allowed_ips')
        .select('ip_address')
        .eq('ativo', true);

      const isAllowed = allowedIps?.some(ip => ip.ip_address === geoData.ip);
      
      if (!isAllowed) {
        setIpBlocked(true);
        return { 
          allowed: false, 
          reason: `IP ${geoData.ip} não autorizado para acesso` 
        };
      }

      return { allowed: true };
    } catch (error: unknown) {
      logger.error('Erro ao validar IP:', error);
      return { allowed: true };
    }
  }, [geoData.ip]);

  const validateGeo = useCallback(async (): Promise<ValidationResult> => {
    if (!geoData.country) {
      return { allowed: true };
    }

    try {
      const { data: settings } = await supabase
        .from('security_settings')
        .select('enable_geo_restriction')
        .limit(1)
        .maybeSingle();

      if (!settings?.enable_geo_restriction) {
        return { allowed: true };
      }

      const { data: allowedCountries } = await supabase
        .from('allowed_countries')
        .select('country_code')
        .eq('ativo', true);

      const isAllowed = allowedCountries?.some(c => c.country_code === geoData.country);
      
      if (!isAllowed) {
        setGeoBlocked(true);
        return { 
          allowed: false, 
          reason: `Acesso não permitido do país: ${geoData.country}` 
        };
      }

      return { allowed: true };
    } catch (error: unknown) {
      logger.error('Erro ao validar localização:', error);
      return { allowed: true };
    }
  }, [geoData.country]);

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
        user_email: email,
        ip_address: geoData.ip,
        user_agent: navigator.userAgent,
        success,
        blocked_reason: blockedReason || null
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
