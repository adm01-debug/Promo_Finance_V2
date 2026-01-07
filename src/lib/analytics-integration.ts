// ============================================
// ANALYTICS INTEGRATION: Sistema de analytics
// Integração com múltiplas plataformas de analytics
// ============================================

import { useCallback, useEffect, useRef } from 'react';

// ============================================
// TIPOS
// ============================================

interface AnalyticsEvent {
  name: string;
  properties?: Record<string, unknown>;
  timestamp?: string;
  userId?: string;
  sessionId?: string;
}

interface PageViewEvent {
  path: string;
  title?: string;
  referrer?: string;
  properties?: Record<string, unknown>;
}

interface UserProperties {
  id?: string;
  email?: string;
  name?: string;
  createdAt?: string;
  plan?: string;
  company?: string;
  [key: string]: unknown;
}

interface AnalyticsProvider {
  name: string;
  initialize: (config: Record<string, unknown>) => void;
  identify: (userId: string, properties?: UserProperties) => void;
  track: (event: AnalyticsEvent) => void;
  page: (event: PageViewEvent) => void;
  reset: () => void;
  isReady: () => boolean;
}

interface AnalyticsConfig {
  providers: AnalyticsProvider[];
  debug?: boolean;
  userId?: string;
  sessionId?: string;
  globalProperties?: Record<string, unknown>;
  enabled?: boolean;
  consent?: boolean;
  excludePaths?: RegExp[];
  sampleRate?: number;
}

// ============================================
// CONFIGURAÇÃO GLOBAL
// ============================================

let config: AnalyticsConfig = {
  providers: [],
  debug: false,
  enabled: true,
  consent: true,
  sampleRate: 1,
};

let sessionId = generateSessionId();
let eventQueue: AnalyticsEvent[] = [];
let isInitialized = false;

// ============================================
// FUNÇÕES UTILITÁRIAS
// ============================================

function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function shouldSample(): boolean {
  return Math.random() < (config.sampleRate || 1);
}

function shouldTrackPath(path: string): boolean {
  if (!config.excludePaths) return true;
  return !config.excludePaths.some(regex => regex.test(path));
}

function log(message: string, ...args: unknown[]): void {
  if (config.debug) {
    console.log(`[Analytics] ${message}`, ...args);
  }
}

// ============================================
// FUNÇÕES DE CONFIGURAÇÃO
// ============================================

/**
 * Configura o sistema de analytics
 */
export function configureAnalytics(newConfig: Partial<AnalyticsConfig>): void {
  config = { ...config, ...newConfig };
  
  if (config.providers.length > 0) {
    initializeProviders();
  }

  log('Analytics configured', config);
}

/**
 * Inicializa os providers
 */
function initializeProviders(): void {
  if (isInitialized) return;

  config.providers.forEach(provider => {
    try {
      provider.initialize({});
      log(`Provider initialized: ${provider.name}`);
    } catch (error) {
      console.error(`Failed to initialize provider ${provider.name}:`, error);
    }
  });

  // Processa fila de eventos pendentes
  processEventQueue();
  isInitialized = true;
}

/**
 * Processa eventos na fila
 */
function processEventQueue(): void {
  while (eventQueue.length > 0) {
    const event = eventQueue.shift();
    if (event) {
      sendToProviders('track', event);
    }
  }
}

/**
 * Envia evento para todos os providers
 */
function sendToProviders(
  method: 'track' | 'identify' | 'page' | 'reset',
  data?: unknown
): void {
  if (!config.enabled || !config.consent) {
    log(`Analytics disabled or no consent. Method: ${method}`);
    return;
  }

  config.providers.forEach(provider => {
    try {
      if (!provider.isReady()) {
        log(`Provider not ready: ${provider.name}`);
        return;
      }

      switch (method) {
        case 'track':
          provider.track(data as AnalyticsEvent);
          break;
        case 'identify':
          const { userId, ...props } = data as UserProperties & { userId: string };
          provider.identify(userId, props);
          break;
        case 'page':
          provider.page(data as PageViewEvent);
          break;
        case 'reset':
          provider.reset();
          break;
      }

      log(`Sent to ${provider.name}: ${method}`, data);
    } catch (error) {
      console.error(`Error in provider ${provider.name}:`, error);
    }
  });
}

// ============================================
// API PÚBLICA
// ============================================

/**
 * Identifica o usuário
 */
export function identify(userId: string, properties?: UserProperties): void {
  config.userId = userId;
  
  sendToProviders('identify', { userId, ...properties });
  
  log('User identified', userId, properties);
}

/**
 * Registra evento de tracking
 */
export function track(
  eventName: string,
  properties?: Record<string, unknown>
): void {
  if (!shouldSample()) {
    log('Event sampled out', eventName);
    return;
  }

  const event: AnalyticsEvent = {
    name: eventName,
    properties: {
      ...config.globalProperties,
      ...properties,
    },
    timestamp: new Date().toISOString(),
    userId: config.userId,
    sessionId,
  };

  if (!isInitialized) {
    eventQueue.push(event);
    log('Event queued', event);
    return;
  }

  sendToProviders('track', event);
}

/**
 * Registra page view
 */
export function page(
  path?: string,
  properties?: Record<string, unknown>
): void {
  const currentPath = path || window.location.pathname;
  
  if (!shouldTrackPath(currentPath)) {
    log('Path excluded', currentPath);
    return;
  }

  const event: PageViewEvent = {
    path: currentPath,
    title: document.title,
    referrer: document.referrer,
    properties: {
      ...config.globalProperties,
      ...properties,
    },
  };

  sendToProviders('page', event);
}

/**
 * Reseta o estado do analytics
 */
export function reset(): void {
  config.userId = undefined;
  sessionId = generateSessionId();
  
  sendToProviders('reset');
  
  log('Analytics reset');
}

/**
 * Define propriedades globais
 */
export function setGlobalProperties(properties: Record<string, unknown>): void {
  config.globalProperties = {
    ...config.globalProperties,
    ...properties,
  };
}

/**
 * Habilita/desabilita analytics
 */
export function setEnabled(enabled: boolean): void {
  config.enabled = enabled;
  log(`Analytics ${enabled ? 'enabled' : 'disabled'}`);
}

/**
 * Define consentimento
 */
export function setConsent(consent: boolean): void {
  config.consent = consent;
  log(`Consent ${consent ? 'granted' : 'revoked'}`);
  
  if (consent && !isInitialized) {
    initializeProviders();
  }
}

// ============================================
// PROVIDERS PADRÃO
// ============================================

/**
 * Console Provider (para desenvolvimento)
 */
export const consoleProvider: AnalyticsProvider = {
  name: 'console',
  initialize: () => {},
  identify: (userId, properties) => {
    console.log('[Analytics:Console] Identify', { userId, properties });
  },
  track: (event) => {
    console.log('[Analytics:Console] Track', event);
  },
  page: (event) => {
    console.log('[Analytics:Console] Page', event);
  },
  reset: () => {
    console.log('[Analytics:Console] Reset');
  },
  isReady: () => true,
};

/**
 * LocalStorage Provider (para debug)
 */
export const localStorageProvider: AnalyticsProvider = {
  name: 'localStorage',
  initialize: () => {
    if (!localStorage.getItem('analytics_events')) {
      localStorage.setItem('analytics_events', JSON.stringify([]));
    }
  },
  identify: (userId, properties) => {
    localStorage.setItem('analytics_user', JSON.stringify({ userId, properties }));
  },
  track: (event) => {
    const events = JSON.parse(localStorage.getItem('analytics_events') || '[]');
    events.push(event);
    localStorage.setItem('analytics_events', JSON.stringify(events.slice(-100)));
  },
  page: (event) => {
    const pages = JSON.parse(localStorage.getItem('analytics_pages') || '[]');
    pages.push(event);
    localStorage.setItem('analytics_pages', JSON.stringify(pages.slice(-50)));
  },
  reset: () => {
    localStorage.removeItem('analytics_user');
    localStorage.removeItem('analytics_events');
    localStorage.removeItem('analytics_pages');
  },
  isReady: () => true,
};

/**
 * Beacon Provider (envia para endpoint customizado)
 */
export function createBeaconProvider(endpoint: string): AnalyticsProvider {
  const queue: unknown[] = [];
  let isReady = false;

  const flush = () => {
    if (queue.length === 0) return;
    
    const payload = JSON.stringify(queue);
    queue.length = 0;
    
    if (navigator.sendBeacon) {
      navigator.sendBeacon(endpoint, payload);
    } else {
      fetch(endpoint, {
        method: 'POST',
        body: payload,
        keepalive: true,
      }).catch(console.error);
    }
  };

  // Flush on page unload
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', flush);
    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        flush();
      }
    });
  }

  return {
    name: 'beacon',
    initialize: () => {
      isReady = true;
    },
    identify: (userId, properties) => {
      queue.push({ type: 'identify', userId, properties, timestamp: Date.now() });
    },
    track: (event) => {
      queue.push({ type: 'track', ...event });
      if (queue.length >= 10) flush();
    },
    page: (event) => {
      queue.push({ type: 'page', ...event, timestamp: Date.now() });
    },
    reset: () => {
      queue.length = 0;
    },
    isReady: () => isReady,
  };
}

// ============================================
// HOOKS
// ============================================

/**
 * Hook para tracking automático de page views
 */
export function usePageTracking(): void {
  const previousPath = useRef<string>('');

  useEffect(() => {
    const currentPath = window.location.pathname;
    
    if (currentPath !== previousPath.current) {
      page(currentPath);
      previousPath.current = currentPath;
    }
  });
}

/**
 * Hook para tracking de eventos
 */
export function useTrack() {
  return useCallback((
    eventName: string,
    properties?: Record<string, unknown>
  ) => {
    track(eventName, properties);
  }, []);
}

/**
 * Hook para identificação de usuário
 */
export function useIdentify() {
  return useCallback((userId: string, properties?: UserProperties) => {
    identify(userId, properties);
  }, []);
}

/**
 * Hook para tracking de tempo em página
 */
export function useTimeOnPage(pageName: string): void {
  const startTime = useRef(Date.now());

  useEffect(() => {
    startTime.current = Date.now();

    return () => {
      const duration = Date.now() - startTime.current;
      track('time_on_page', {
        page: pageName,
        duration_ms: duration,
        duration_seconds: Math.round(duration / 1000),
      });
    };
  }, [pageName]);
}

/**
 * Hook para tracking de cliques
 */
export function useClickTracking(
  eventName: string,
  properties?: Record<string, unknown>
) {
  return useCallback(() => {
    track(eventName, properties);
  }, [eventName, properties]);
}

/**
 * Hook para tracking de scroll
 */
export function useScrollTracking(
  thresholds: number[] = [25, 50, 75, 100]
): void {
  const tracked = useRef(new Set<number>());

  useEffect(() => {
    const handleScroll = () => {
      const scrollPercentage = Math.round(
        (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
      );

      thresholds.forEach(threshold => {
        if (scrollPercentage >= threshold && !tracked.current.has(threshold)) {
          tracked.current.add(threshold);
          track('scroll_depth', {
            depth: threshold,
            page: window.location.pathname,
          });
        }
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [thresholds]);
}

/**
 * Hook para tracking de formulários
 */
export function useFormTracking(formName: string) {
  const startTime = useRef<number | null>(null);
  const fieldInteractions = useRef<Record<string, number>>({});

  const trackStart = useCallback(() => {
    startTime.current = Date.now();
    track('form_started', { form: formName });
  }, [formName]);

  const trackFieldInteraction = useCallback((fieldName: string) => {
    fieldInteractions.current[fieldName] = (fieldInteractions.current[fieldName] || 0) + 1;
  }, []);

  const trackSubmit = useCallback((success: boolean, errors?: string[]) => {
    const duration = startTime.current ? Date.now() - startTime.current : 0;
    
    track(success ? 'form_submitted' : 'form_error', {
      form: formName,
      duration_ms: duration,
      field_interactions: fieldInteractions.current,
      errors,
    });

    // Reset
    startTime.current = null;
    fieldInteractions.current = {};
  }, [formName]);

  const trackAbandonment = useCallback(() => {
    if (startTime.current) {
      const duration = Date.now() - startTime.current;
      track('form_abandoned', {
        form: formName,
        duration_ms: duration,
        field_interactions: fieldInteractions.current,
      });
    }
  }, [formName]);

  return {
    trackStart,
    trackFieldInteraction,
    trackSubmit,
    trackAbandonment,
  };
}

// ============================================
// EVENTOS PRÉ-DEFINIDOS
// ============================================

export const Events = {
  // Autenticação
  SIGN_UP: 'sign_up',
  LOGIN: 'login',
  LOGOUT: 'logout',
  PASSWORD_RESET: 'password_reset',
  
  // Navegação
  PAGE_VIEW: 'page_view',
  SEARCH: 'search',
  FILTER: 'filter',
  
  // Engajamento
  CLICK: 'click',
  SCROLL: 'scroll',
  VIDEO_PLAY: 'video_play',
  VIDEO_COMPLETE: 'video_complete',
  FILE_DOWNLOAD: 'file_download',
  SHARE: 'share',
  
  // E-commerce
  VIEW_ITEM: 'view_item',
  ADD_TO_CART: 'add_to_cart',
  REMOVE_FROM_CART: 'remove_from_cart',
  BEGIN_CHECKOUT: 'begin_checkout',
  PURCHASE: 'purchase',
  REFUND: 'refund',
  
  // Formulários
  FORM_START: 'form_start',
  FORM_SUBMIT: 'form_submit',
  FORM_ERROR: 'form_error',
  FORM_ABANDON: 'form_abandon',
  
  // Erros
  ERROR: 'error',
  EXCEPTION: 'exception',
  
  // Feature Usage
  FEATURE_USED: 'feature_used',
  FEATURE_ENABLED: 'feature_enabled',
  FEATURE_DISABLED: 'feature_disabled',
} as const;

// ============================================
// INICIALIZAÇÃO
// ============================================

// Inicializa com console provider em desenvolvimento
if (process.env.NODE_ENV === 'development') {
  configureAnalytics({
    providers: [consoleProvider],
    debug: true,
  });
}
