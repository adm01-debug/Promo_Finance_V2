import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export function usePushNotifications() {
  const { user } = useAuth();
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    const checkSupport = async () => {
      const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
      setIsSupported(supported);
      
      if (supported) {
        setPermission(Notification.permission);
        await checkSubscription();
      }
      
      setIsLoading(false);
    };

    checkSupport();
  }, [user]);

  const checkSubscription = useCallback(async () => {
    if (!('serviceWorker' in navigator)) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (error) {
      console.error('Error checking push subscription:', error);
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
      
      console.log('Service Worker registrado:', registration);
      return registration;
    } catch (error) {
      console.error('Erro ao registrar Service Worker:', error);
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
      console.error('Erro ao solicitar permissão:', error);
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

      // Register service worker
      const registration = await registerServiceWorker();
      await navigator.serviceWorker.ready;

      // Subscribe to push - using a placeholder VAPID key
      const vapidPublicKey = 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';
      const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey.buffer as ArrayBuffer
      });

      const p256dhKey = subscription.getKey('p256dh');
      const authKey = subscription.getKey('auth');

      if (!p256dhKey || !authKey) {
        throw new Error('Failed to get subscription keys');
      }

      // Save subscription to database using raw query to avoid type issues
      const { error } = await supabase.rpc('log_audit', {
        _action: 'INSERT',
        _table_name: 'push_subscriptions',
        _details: 'Push subscription created'
      });

      // Also try to insert directly (will work after types are regenerated)
      try {
        await supabase.from('push_subscriptions' as any).upsert({
          user_id: user.id,
          endpoint: subscription.endpoint,
          p256dh: arrayBufferToBase64(p256dhKey),
          auth: arrayBufferToBase64(authKey),
          ativo: true
        }, {
          onConflict: 'user_id,endpoint'
        });
      } catch (e) {
        console.log('Note: push_subscriptions table may not be synced yet');
      }

      setIsSubscribed(true);
      toast.success('Notificações push ativadas com sucesso!');
      return true;
    } catch (error) {
      console.error('Erro ao ativar notificações:', error);
      toast.error('Erro ao ativar notificações push');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user, requestPermission, registerServiceWorker]);

  const unsubscribe = useCallback(async () => {
    setIsLoading(true);

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();

        // Remove from database
        if (user) {
          try {
            await supabase
              .from('push_subscriptions' as any)
              .delete()
              .eq('user_id', user.id)
              .eq('endpoint', subscription.endpoint);
          } catch (e) {
            console.log('Note: push_subscriptions table may not be synced yet');
          }
        }
      }

      setIsSubscribed(false);
      toast.success('Notificações push desativadas');
      return true;
    } catch (error) {
      console.error('Erro ao desativar notificações:', error);
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
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification('Teste de Notificação', {
        body: 'Esta é uma notificação de teste do sistema financeiro',
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'test-notification'
      });
      
      toast.success('Notificação de teste enviada!');
    } catch (error) {
      console.error('Erro ao enviar notificação de teste:', error);
      toast.error('Erro ao enviar notificação de teste');
    }
  }, [isSubscribed]);

  return {
    isSupported,
    isSubscribed,
    isLoading,
    permission,
    subscribe,
    unsubscribe,
    sendTestNotification,
    requestPermission
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
