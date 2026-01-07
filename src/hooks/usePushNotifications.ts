import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

export function usePushNotifications() {
  const { user } = useAuth();
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [vapidPublicKey, setVapidPublicKey] = useState<string | null>(null);

  // Fetch VAPID public key from edge function
  const fetchVapidKey = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('get-vapid-key');
      
      if (error) {
        logger.error('Error fetching VAPID key:', error);
        return null;
      }
      
      if (data?.vapidPublicKey) {
        setVapidPublicKey(data.vapidPublicKey);
        return data.vapidPublicKey;
      }
      
      return null;
    } catch (error) {
      logger.error('Error fetching VAPID key:', error);
      return null;
    }
  }, []);

  useEffect(() => {
    const checkSupport = async () => {
      const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
      setIsSupported(supported);
      
      if (supported) {
        setPermission(Notification.permission);
        await fetchVapidKey();
        await checkSubscription();
      }
      
      setIsLoading(false);
    };

    checkSupport();
  }, [user, fetchVapidKey]);

  const checkSubscription = useCallback(async () => {
    if (!('serviceWorker' in navigator)) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (error) {
      logger.error('Error checking push subscription:', error);
    }
  }, []);

  const registerServiceWorker = useCallback(async () => {
    if (!('serviceWorker' in navigator)) {
      throw new Error('Service Worker não suportado');
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
      
      logger.debug('Service Worker registrado:', registration);
      return registration;
    } catch (error) {
      logger.error('Erro ao registrar Service Worker:', error);
      throw error;
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      toast.error('Notificações não são suportadas neste navegador');
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === 'granted') {
        toast.success('Permissão para notificações concedida!');
        return true;
      } else if (result === 'denied') {
        toast.error('Permissão para notificações negada');
        return false;
      }
      
      return false;
    } catch (error) {
      logger.error('Erro ao solicitar permissão:', error);
      toast.error('Erro ao solicitar permissão para notificações');
      return false;
    }
  }, []);

  const subscribe = useCallback(async () => {
    if (!user) {
      toast.error('Você precisa estar logado para ativar notificações');
      return false;
    }

    setIsLoading(true);

    try {
      // Request permission first
      if (Notification.permission !== 'granted') {
        const granted = await requestPermission();
        if (!granted) {
          setIsLoading(false);
          return false;
        }
      }

      // Get VAPID key if not already fetched
      let keyToUse = vapidPublicKey;
      if (!keyToUse) {
        keyToUse = await fetchVapidKey();
      }
      
      if (!keyToUse) {
        toast.error('Chave VAPID não configurada. Contate o administrador.');
        setIsLoading(false);
        return false;
      }

      // Register service worker
      const registration = await registerServiceWorker();
      await navigator.serviceWorker.ready;

      // Subscribe to push
      const applicationServerKey = urlBase64ToUint8Array(keyToUse);

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey.buffer as ArrayBuffer
      });

      const p256dhKey = subscription.getKey('p256dh');
      const authKey = subscription.getKey('auth');

      if (!p256dhKey || !authKey) {
        throw new Error('Failed to get subscription keys');
      }

      // Save subscription to database
      const { error } = await supabase.from('push_subscriptions' as any).upsert({
        user_id: user.id,
        endpoint: subscription.endpoint,
        p256dh: arrayBufferToBase64(p256dhKey),
        auth: arrayBufferToBase64(authKey),
        ativo: true,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,endpoint'
      });

      if (error) {
        logger.error('Error saving subscription:', error);
        // Try without onConflict
        await supabase.from('push_subscriptions' as any).insert({
          user_id: user.id,
          endpoint: subscription.endpoint,
          p256dh: arrayBufferToBase64(p256dhKey),
          auth: arrayBufferToBase64(authKey),
          ativo: true
        });
      }

      setIsSubscribed(true);
      toast.success('Notificações push ativadas com sucesso!');
      return true;
    } catch (error) {
      logger.error('Erro ao ativar notificações:', error);
      toast.error('Erro ao ativar notificações push');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user, vapidPublicKey, requestPermission, registerServiceWorker, fetchVapidKey]);

  const unsubscribe = useCallback(async () => {
    setIsLoading(true);

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();

        // Remove from database
        if (user) {
          await supabase
            .from('push_subscriptions' as any)
            .delete()
            .eq('user_id', user.id)
            .eq('endpoint', subscription.endpoint);
        }
      }

      setIsSubscribed(false);
      toast.success('Notificações push desativadas');
      return true;
    } catch (error) {
      logger.error('Erro ao desativar notificações:', error);
      toast.error('Erro ao desativar notificações push');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const sendTestNotification = useCallback(async () => {
    if (!isSubscribed) {
      toast.error('Ative as notificações primeiro');
      return;
    }

    try {
      // Send via edge function to test the full flow
      const { error } = await supabase.functions.invoke('send-push-notification', {
        body: {
          userId: user?.id,
          title: '🔔 Teste de Notificação',
          body: 'Esta é uma notificação de teste do sistema de segurança',
          tag: 'test-notification',
          prioridade: 'media',
          data: { url: '/configuracoes' }
        }
      });

      if (error) {
        throw error;
      }

      // Also show local notification as fallback
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification('🔔 Teste de Notificação', {
        body: 'Esta é uma notificação de teste do sistema de segurança',
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'test-notification',
        requireInteraction: false
      });
      
      toast.success('Notificação de teste enviada!');
    } catch (error) {
      logger.error('Erro ao enviar notificação de teste:', error);
      toast.error('Erro ao enviar notificação de teste');
    }
  }, [isSubscribed, user]);

  // Function to send security alert push notification
  const sendSecurityPushNotification = useCallback(async (
    title: string,
    body: string,
    prioridade: 'baixa' | 'media' | 'alta' | 'critica' = 'alta',
    data?: Record<string, unknown>
  ) => {
    try {
      const { error } = await supabase.functions.invoke('send-push-notification', {
        body: {
          userId: user?.id,
          title: `🔒 ${title}`,
          body,
          tag: 'security-alert',
          prioridade,
          data: data || { url: '/seguranca' }
        }
      });

      if (error) {
        logger.error('Error sending security push:', error);
        return false;
      }

      return true;
    } catch (error) {
      logger.error('Error sending security push notification:', error);
      return false;
    }
  }, [user]);

  return {
    isSupported,
    isSubscribed,
    isLoading,
    permission,
    subscribe,
    unsubscribe,
    sendTestNotification,
    sendSecurityPushNotification,
    requestPermission,
    vapidPublicKey
  };
}

// Helper functions
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}
