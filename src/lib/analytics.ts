// Analytics and event tracking utilities

// Types
type EventCategory = 
  | 'navigation'
  | 'interaction'
  | 'form'
  | 'error'
  | 'performance'
  | 'auth'
  | 'finance'
  | 'export'
  | 'search';

interface TrackingEvent {
  category: EventCategory;
  action: string;
  label?: string;
  value?: number;
  metadata?: Record<string, unknown>;
  timestamp: number;
}

interface UserProperties {
  userId?: string;
  role?: string;
  plan?: string;
  company?: string;
  [key: string]: unknown;
}

interface PageView {
  path: string;
  title: string;
  referrer: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

// Analytics provider interface
interface AnalyticsProvider {
  name: string;
  track: (event: TrackingEvent) => void;
  page: (pageView: PageView) => void;
  identify: (userId: string, properties?: UserProperties) => void;
  reset: () => void;
}

// Console provider for development
const consoleProvider: AnalyticsProvider = {
  name: 'console',
  track: (event) => {
    console.log('📊 Track:', event);
  },
  page: (pageView) => {
    console.log('📄 Page:', pageView);
  },
  identify: (userId, properties) => {
    console.log('👤 Identify:', { userId, properties });
  },
  reset: () => {
    console.log('🔄 Reset analytics');
  },
};

// Google Analytics provider
const googleAnalyticsProvider: AnalyticsProvider = {
  name: 'google-analytics',
  track: (event) => {
    if (typeof window !== 'undefined' && 'gtag' in window) {
      (window as unknown as { gtag: (...args: unknown[]) => void }).gtag('event', event.action, {
        event_category: event.category,
        event_label: event.label,
        value: event.value,
        ...event.metadata,
      });
    }
  },
  page: (pageView) => {
    if (typeof window !== 'undefined' && 'gtag' in window) {
      (window as unknown as { gtag: (...args: unknown[]) => void }).gtag('event', 'page_view', {
        page_path: pageView.path,
        page_title: pageView.title,
        page_referrer: pageView.referrer,
        ...pageView.metadata,
      });
    }
  },
  identify: (userId, properties) => {
    if (typeof window !== 'undefined' && 'gtag' in window) {
      (window as unknown as { gtag: (...args: unknown[]) => void }).gtag('set', 'user_properties', {
        user_id: userId,
        ...properties,
      });
    }
  },
  reset: () => {
    // GA doesn't have a built-in reset, handled by page refresh
  },
};

// Analytics class
class Analytics {
  private providers: AnalyticsProvider[] = [];
  private userProperties: UserProperties = {};
  private eventQueue: TrackingEvent[] = [];
  private pageViewQueue: PageView[] = [];
  private isInitialized: boolean = false;
  private debugMode: boolean = false;

  constructor() {
    // Add console provider in development
    if (import.meta.env.DEV) {
      this.providers.push(consoleProvider);
      this.debugMode = true;
    }
  }

  // Initialize with providers
  init(providers?: AnalyticsProvider[]): void {
    if (providers) {
      this.providers.push(...providers);
    }
    
    this.isInitialized = true;
    
    // Flush queued events
    this.flushQueue();
  }

  // Add provider
  addProvider(provider: AnalyticsProvider): void {
    this.providers.push(provider);
  }

  // Remove provider
  removeProvider(name: string): void {
    this.providers = this.providers.filter((p) => p.name !== name);
  }

  // Set debug mode
  setDebugMode(enabled: boolean): void {
    this.debugMode = enabled;
  }

  // Identify user
  identify(userId: string, properties?: UserProperties): void {
    this.userProperties = { userId, ...properties };
    
    this.providers.forEach((provider) => {
      try {
        provider.identify(userId, properties);
      } catch (error) {
        this.logError('identify', provider.name, error);
      }
    });
  }

  // Track event
  track(
    category: EventCategory,
    action: string,
    options?: {
      label?: string;
      value?: number;
      metadata?: Record<string, unknown>;
    }
  ): void {
    const event: TrackingEvent = {
      category,
      action,
      label: options?.label,
      value: options?.value,
      metadata: options?.metadata,
      timestamp: Date.now(),
    };

    if (!this.isInitialized) {
      this.eventQueue.push(event);
      return;
    }

    this.sendEvent(event);
  }

  // Track page view
  page(path?: string, metadata?: Record<string, unknown>): void {
    const pageView: PageView = {
      path: path || window.location.pathname,
      title: document.title,
      referrer: document.referrer,
      timestamp: Date.now(),
      metadata,
    };

    if (!this.isInitialized) {
      this.pageViewQueue.push(pageView);
      return;
    }

    this.sendPageView(pageView);
  }

  // Reset (logout)
  reset(): void {
    this.userProperties = {};
    this.providers.forEach((provider) => {
      try {
        provider.reset();
      } catch (error) {
        this.logError('reset', provider.name, error);
      }
    });
  }

  // Helper: Track click
  trackClick(elementName: string, metadata?: Record<string, unknown>): void {
    this.track('interaction', 'click', {
      label: elementName,
      metadata,
    });
  }

  // Helper: Track form submission
  trackFormSubmit(formName: string, success: boolean, metadata?: Record<string, unknown>): void {
    this.track('form', success ? 'submit_success' : 'submit_error', {
      label: formName,
      metadata,
    });
  }

  // Helper: Track search
  trackSearch(query: string, resultsCount: number, metadata?: Record<string, unknown>): void {
    this.track('search', 'search', {
      label: query,
      value: resultsCount,
      metadata,
    });
  }

  // Helper: Track error
  trackError(errorMessage: string, errorCode?: string, metadata?: Record<string, unknown>): void {
    this.track('error', 'error', {
      label: errorMessage,
      metadata: { errorCode, ...metadata },
    });
  }

  // Helper: Track auth events
  trackAuth(action: 'login' | 'logout' | 'register' | 'password_reset', success: boolean): void {
    this.track('auth', action, {
      value: success ? 1 : 0,
    });
  }

  // Helper: Track finance events
  trackFinance(
    action: 'create_conta' | 'pay_conta' | 'export' | 'import',
    type: 'pagar' | 'receber',
    value?: number
  ): void {
    this.track('finance', action, {
      label: type,
      value,
    });
  }

  // Helper: Track export
  trackExport(format: 'csv' | 'excel' | 'pdf', itemCount: number): void {
    this.track('export', 'export', {
      label: format,
      value: itemCount,
    });
  }

  // Private: Send event to providers
  private sendEvent(event: TrackingEvent): void {
    if (this.debugMode) {
      console.debug('📊 Analytics event:', event);
    }

    this.providers.forEach((provider) => {
      try {
        provider.track(event);
      } catch (error) {
        this.logError('track', provider.name, error);
      }
    });
  }

  // Private: Send page view to providers
  private sendPageView(pageView: PageView): void {
    if (this.debugMode) {
      console.debug('📄 Analytics page view:', pageView);
    }

    this.providers.forEach((provider) => {
      try {
        provider.page(pageView);
      } catch (error) {
        this.logError('page', provider.name, error);
      }
    });
  }

  // Private: Flush queued events
  private flushQueue(): void {
    // Flush events
    while (this.eventQueue.length > 0) {
      const event = this.eventQueue.shift();
      if (event) {
        this.sendEvent(event);
      }
    }

    // Flush page views
    while (this.pageViewQueue.length > 0) {
      const pageView = this.pageViewQueue.shift();
      if (pageView) {
        this.sendPageView(pageView);
      }
    }
  }

  // Private: Log error
  private logError(method: string, providerName: string, error: unknown): void {
    console.error(`Analytics error (${providerName}.${method}):`, error);
  }
}

// Create singleton instance
export const analytics = new Analytics();

// Initialize with Google Analytics if available
if (import.meta.env.VITE_GA_MEASUREMENT_ID) {
  analytics.addProvider(googleAnalyticsProvider);
}

// Export types and utilities
export type { TrackingEvent, UserProperties, PageView, AnalyticsProvider, EventCategory };

// React hook for page tracking
export function usePageTracking(): void {
  // Track page view on mount
  if (typeof window !== 'undefined') {
    analytics.page();
  }
}

// Track with timeout (for debouncing)
let trackTimeout: ReturnType<typeof setTimeout> | null = null;
export function trackDebounced(
  category: EventCategory,
  action: string,
  options?: Parameters<typeof analytics.track>[2],
  delay: number = 300
): void {
  if (trackTimeout) {
    clearTimeout(trackTimeout);
  }
  
  trackTimeout = setTimeout(() => {
    analytics.track(category, action, options);
    trackTimeout = null;
  }, delay);
}

export default analytics;
