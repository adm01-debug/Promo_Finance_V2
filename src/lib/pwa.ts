/**
 * PWA Service Worker Registration
 */

interface PWAConfig {
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  onOffline?: () => void;
  onOnline?: () => void;
}

/**
 * Register service worker
 */
export async function registerServiceWorker(config: PWAConfig = {}): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    console.log('[PWA] Service workers are not supported');
    return null;
  }

  // Only register in production
  if (import.meta.env.DEV) {
    console.log('[PWA] Skipping SW registration in development');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });

    // Check for updates periodically
    setInterval(() => {
      registration.update();
    }, 60 * 60 * 1000); // Every hour

    // Handle updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (!newWorker) return;

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed') {
          if (navigator.serviceWorker.controller) {
            // New content available
            console.log('[PWA] New content available');
            config.onUpdate?.(registration);
          } else {
            // Content cached for offline
            console.log('[PWA] Content cached for offline use');
            config.onSuccess?.(registration);
          }
        }
      });
    });

    // Online/offline events
    window.addEventListener('online', () => {
      console.log('[PWA] Back online');
      config.onOnline?.();
    });

    window.addEventListener('offline', () => {
      console.log('[PWA] Gone offline');
      config.onOffline?.();
    });

    console.log('[PWA] Service worker registered');
    return registration;
  } catch (error) {
    console.error('[PWA] Service worker registration failed:', error);
    return null;
  }
}

/**
 * Unregister service worker
 */
export async function unregisterServiceWorker(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const result = await registration.unregister();
    console.log('[PWA] Service worker unregistered');
    return result;
  } catch (error) {
    console.error('[PWA] Error unregistering service worker:', error);
    return false;
  }
}

/**
 * Skip waiting and activate new service worker
 */
export async function skipWaiting(): Promise<void> {
  const registration = await navigator.serviceWorker.ready;
  
  if (registration.waiting) {
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
  }
}

/**
 * Clear all caches
 */
export async function clearCaches(): Promise<boolean> {
  try {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames.map((name) => caches.delete(name))
    );
    console.log('[PWA] All caches cleared');
    return true;
  } catch (error) {
    console.error('[PWA] Error clearing caches:', error);
    return false;
  }
}

/**
 * Get cache storage size
 */
export async function getCacheSize(): Promise<number> {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    const estimate = await navigator.storage.estimate();
    return estimate.usage || 0;
  }
  return 0;
}

/**
 * Format bytes to human readable
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Check if app is installed (standalone)
 */
export function isInstalled(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  );
}

/**
 * Check if app can be installed
 */
export function canInstall(): boolean {
  return 'BeforeInstallPromptEvent' in window;
}

// Deferred install prompt
let deferredPrompt: any = null;

/**
 * Handle install prompt
 */
export function setupInstallPrompt(
  onPromptAvailable: () => void,
  onInstalled: () => void
): void {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    onPromptAvailable();
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    onInstalled();
  });
}

/**
 * Show install prompt
 */
export async function showInstallPrompt(): Promise<boolean> {
  if (!deferredPrompt) {
    return false;
  }

  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  deferredPrompt = null;
  
  return outcome === 'accepted';
}

/**
 * Subscribe to push notifications
 */
export async function subscribeToPush(publicKey: string): Promise<PushSubscription | null> {
  try {
    const registration = await navigator.serviceWorker.ready;
    
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
    });

    console.log('[PWA] Push subscription:', subscription);
    return subscription;
  } catch (error) {
    console.error('[PWA] Push subscription failed:', error);
    return null;
  }
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPush(): Promise<boolean> {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      await subscription.unsubscribe();
      console.log('[PWA] Push unsubscribed');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('[PWA] Push unsubscribe failed:', error);
    return false;
  }
}

/**
 * Convert base64 to Uint8Array for push subscription
 */
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

export default registerServiceWorker;
