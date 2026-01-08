import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

interface StoredCredential {
  id: string;
  user_id: string;
  credential_id: string;
  public_key: string;
  counter: number;
  device_name: string;
  created_at: string;
}

// Helper functions
function generateChallenge(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array));
}

function base64UrlEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function base64UrlDecode(str: string): ArrayBuffer {
  const padding = '='.repeat((4 - (str.length % 4)) % 4);
  const base64 = (str + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray.buffer;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function useWebAuthn() {
  const { user } = useAuth();
  const [isSupported] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.PublicKeyCredential !== undefined &&
      typeof window.PublicKeyCredential === 'function';
  });
  const [isLoading, setIsLoading] = useState(false);
  const [registeredCredentials, setRegisteredCredentials] = useState<StoredCredential[]>([]);

  // Check WebAuthn support
  const checkSupport = useCallback(() => {
    return window.PublicKeyCredential !== undefined &&
      typeof window.PublicKeyCredential === 'function';
  }, []);

  // Check if platform authenticator is available (Face ID, Touch ID, Windows Hello)
  const isPlatformAuthenticatorAvailable = useCallback(async (): Promise<boolean> => {
    if (!checkSupport()) return false;
    
    try {
      return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    } catch {
      return false;
    }
  }, [checkSupport]);

  // Fetch registered credentials for user
  const fetchCredentials = useCallback(async () => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('webauthn_credentials')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        logger.error('Error fetching credentials:', error);
        return [];
      }

      const credentials = (data || []) as unknown as StoredCredential[];
      setRegisteredCredentials(credentials);
      return credentials;
    } catch (error: unknown) {
      logger.error('Error fetching credentials:', error);
      return [];
    }
  }, [user]);

  // Register a new passkey/biometric credential
  const registerCredential = useCallback(async (deviceName?: string): Promise<boolean> => {
    if (!user) {
      toast.error('Você precisa estar logado para registrar biometria');
      return false;
    }

    if (!checkSupport()) {
      toast.error('WebAuthn não é suportado neste navegador');
      return false;
    }

    const platformAvailable = await isPlatformAuthenticatorAvailable();
    if (!platformAvailable) {
      toast.error('Autenticação biométrica não está disponível neste dispositivo');
      return false;
    }

    setIsLoading(true);

    try {
      const challenge = generateChallenge();
      const userId = new TextEncoder().encode(user.id);

      const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
        challenge: base64UrlDecode(challenge),
        rp: {
          name: 'Promo Brindes',
          id: window.location.hostname,
        },
        user: {
          id: userId,
          name: user.email || 'user',
          displayName: user.email || 'User',
        },
        pubKeyCredParams: [
          { type: 'public-key', alg: -7 },   // ES256
          { type: 'public-key', alg: -257 }, // RS256
        ],
        timeout: 60000,
        attestation: 'none',
        authenticatorSelection: {
          authenticatorAttachment: 'platform', // Forces Face ID, Touch ID, Windows Hello
          userVerification: 'required',
          residentKey: 'preferred',
        },
      };

      logger.debug('[WebAuthn] Starting credential registration...');

      const credential = await navigator.credentials.create({
        publicKey: publicKeyCredentialCreationOptions,
      }) as PublicKeyCredential;

      if (!credential) {
        throw new Error('Falha ao criar credencial');
      }

      const response = credential.response as AuthenticatorAttestationResponse;
      
      // Extract public key from attestation
      const credentialId = base64UrlEncode(credential.rawId);
      const publicKey = arrayBufferToBase64(response.getPublicKey?.() || response.attestationObject);

      // Store credential in database
      const { error } = await supabase
        .from('webauthn_credentials')
        .insert({
          user_id: user.id,
          credential_id: credentialId,
          public_key: publicKey,
          counter: 0,
          device_name: deviceName || detectDeviceName(),
        });

      if (error) {
        logger.error('[WebAuthn] Error storing credential:', error);
        throw new Error('Falha ao salvar credencial');
      }

      await fetchCredentials();
      toast.success('Biometria registrada com sucesso!');
      return true;
    } catch (error: unknown) {
      const err = error as Error & { name?: string };
      logger.error('[WebAuthn] Registration error:', err);
      
      if (err.name === 'NotAllowedError') {
        toast.error('Registro cancelado pelo usuário');
      } else if (err.name === 'SecurityError') {
        toast.error('Erro de segurança. Verifique se está usando HTTPS.');
      } else {
        toast.error(err.message || 'Erro ao registrar biometria');
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user, checkSupport, isPlatformAuthenticatorAvailable, fetchCredentials]);

  // Authenticate using passkey/biometric
  const authenticate = useCallback(async (userEmail: string): Promise<{ success: boolean; userId?: string }> => {
    if (!checkSupport()) {
      toast.error('WebAuthn não é suportado neste navegador');
      return { success: false };
    }

    setIsLoading(true);

    try {
      // Get user's registered credentials using RPC function
      const { data: credentials, error: fetchError } = await supabase
        .rpc('get_webauthn_credential_by_email', { p_email: userEmail });

      if (fetchError || !credentials || credentials.length === 0) {
        toast.error('Nenhuma biometria registrada para este email');
        return { success: false };
      }

      const challenge = generateChallenge();

      const allowCredentials: PublicKeyCredentialDescriptor[] = credentials.map((cred: any) => ({
        type: 'public-key' as const,
        id: base64UrlDecode(cred.credential_id),
        transports: ['internal'] as AuthenticatorTransport[],
      }));

      const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
        challenge: base64UrlDecode(challenge),
        timeout: 60000,
        rpId: window.location.hostname,
        allowCredentials,
        userVerification: 'required',
      };

      logger.debug('[WebAuthn] Starting authentication...');

      const assertion = await navigator.credentials.get({
        publicKey: publicKeyCredentialRequestOptions,
      }) as PublicKeyCredential;

      if (!assertion) {
        throw new Error('Falha na autenticação biométrica');
      }

      const response = assertion.response as AuthenticatorAssertionResponse;
      const assertionCredentialId = base64UrlEncode(assertion.rawId);

      // Verify credential exists
      const matchedCredential = credentials.find(
        (c: any) => c.credential_id === assertionCredentialId
      );

      if (!matchedCredential) {
        throw new Error('Credencial não reconhecida');
      }

      // Update counter for replay attack protection
      const authenticatorData = new Uint8Array(response.authenticatorData);
      const counter = new DataView(authenticatorData.buffer).getUint32(33, false);

      await supabase
        .from('webauthn_credentials')
        .update({ counter, last_used_at: new Date().toISOString() })
        .eq('credential_id', assertionCredentialId);

      logger.debug('[WebAuthn] Authentication successful');
      return { success: true, userId: matchedCredential.user_id };
    } catch (error: unknown) {
      const err = error as Error & { name?: string };
      logger.error('[WebAuthn] Authentication error:', err);
      
      if (err.name === 'NotAllowedError') {
        toast.error('Autenticação cancelada');
      } else if (err.name === 'SecurityError') {
        toast.error('Erro de segurança');
      } else {
        toast.error(err.message || 'Erro na autenticação biométrica');
      }
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  }, [checkSupport]);

  // Remove a registered credential
  const removeCredential = useCallback(async (credentialId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('webauthn_credentials')
        .delete()
        .eq('credential_id', credentialId)
        .eq('user_id', user.id);

      if (error) throw error;

      await fetchCredentials();
      toast.success('Biometria removida');
      return true;
    } catch (error: unknown) {
      logger.error('Error removing credential:', error);
      toast.error('Erro ao remover biometria');
      return false;
    }
  }, [user, fetchCredentials]);

  return {
    isSupported,
    isLoading,
    registeredCredentials,
    isPlatformAuthenticatorAvailable,
    registerCredential,
    authenticate,
    removeCredential,
    fetchCredentials,
  };
}

// Helper to detect device name
function detectDeviceName(): string {
  const ua = navigator.userAgent;
  
  if (/iPhone/.test(ua)) return 'iPhone (Face ID/Touch ID)';
  if (/iPad/.test(ua)) return 'iPad (Face ID/Touch ID)';
  if (/Macintosh/.test(ua) && 'ontouchend' in document) return 'Mac (Touch ID)';
  if (/Macintosh/.test(ua)) return 'Mac';
  if (/Windows/.test(ua)) return 'Windows (Windows Hello)';
  if (/Android/.test(ua)) return 'Android (Biometria)';
  if (/Linux/.test(ua)) return 'Linux';
  
  return 'Dispositivo desconhecido';
}
