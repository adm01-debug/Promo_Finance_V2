import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

interface MFAFactor {
  id: string;
  factor_type: 'totp';
  status: 'verified' | 'unverified';
  friendly_name?: string;
  created_at: string;
  updated_at: string;
}

export function useMFA() {
  const { user } = useAuth();
  const [factors, setFactors] = useState<MFAFactor[]>([]);
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [enrollmentData, setEnrollmentData] = useState<{
    qrCode: string;
    secret: string;
    factorId: string;
  } | null>(null);

  const fetchFactors = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.mfa.listFactors();
      
      if (error) {
        logger.error('[useMFA] Erro ao buscar fatores MFA:', error);
        return;
      }

      const verifiedFactors = data.totp.filter(f => f.status === 'verified');
      setFactors(data.totp);
      setIsEnabled(verifiedFactors.length > 0);
    } catch {
      // Silently fail - MFA state will remain default
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchFactors();
  }, [fetchFactors]);

  const startEnrollment = async (friendlyName?: string) => {
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: friendlyName || 'Authenticator App',
      });

      if (error) {
        toast.error('Erro ao iniciar configuração MFA');
        throw error;
      }

      setEnrollmentData({
        qrCode: data.totp.qr_code,
        secret: data.totp.secret,
        factorId: data.id,
      });

      return data;
    } catch (error) {
      logger.error('[useMFA] Erro no enrollment:', error);
      throw error;
    }
  };

  const verifyEnrollment = async (code: string) => {
    if (!enrollmentData) {
      throw new Error('Nenhum enrollment em andamento');
    }

    try {
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: enrollmentData.factorId,
      });

      if (challengeError) throw challengeError;

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: enrollmentData.factorId,
        challengeId: challengeData.id,
        code,
      });

      if (verifyError) {
        toast.error('Código inválido');
        throw verifyError;
      }

      toast.success('MFA ativado com sucesso!');
      setEnrollmentData(null);
      await fetchFactors();
      return true;
    } catch (error) {
      logger.error('[useMFA] Erro na verificação:', error);
      throw error;
    }
  };

  const unenroll = async (factorId: string) => {
    try {
      const { error } = await supabase.auth.mfa.unenroll({
        factorId,
      });

      if (error) {
        toast.error('Erro ao desativar MFA');
        throw error;
      }

      toast.success('MFA desativado');
      await fetchFactors();
      return true;
    } catch (error) {
      logger.error('[useMFA] Erro ao desativar MFA:', error);
      throw error;
    }
  };

  const verifyCode = async (code: string) => {
    const verifiedFactors = factors.filter(f => f.status === 'verified');
    
    if (verifiedFactors.length === 0) {
      throw new Error('Nenhum fator MFA verificado');
    }

    const factorId = verifiedFactors[0].id;

    try {
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId,
      });

      if (challengeError) throw challengeError;

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code,
      });

      if (verifyError) {
        toast.error('Código inválido');
        throw verifyError;
      }

      return true;
    } catch (error) {
      logger.error('[useMFA] Erro na verificação:', error);
      throw error;
    }
  };

  const cancelEnrollment = () => {
    setEnrollmentData(null);
  };

  return {
    factors,
    isEnabled,
    isLoading,
    enrollmentData,
    startEnrollment,
    verifyEnrollment,
    unenroll,
    verifyCode,
    cancelEnrollment,
    refresh: fetchFactors,
  };
}
