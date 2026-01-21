/**
 * Analytics Service - Integração com Google Analytics e outras plataformas
 */

interface AnalyticsEvent {
  name: string;
  category?: string;
  label?: string;
  value?: number;
  properties?: Record<string, unknown>;
}

interface PageView {
  path: string;
  title?: string;
  referrer?: string;
}

interface UserProperties {
  userId?: string;
  email?: string;
  name?: string;
  plan?: string;
  createdAt?: string;
  [key: string]: unknown;
}

class AnalyticsService {
  private initialized = false;
  private debug = import.meta.env.DEV;
  private gaId = import.meta.env.VITE_GA_MEASUREMENT_ID;

  /**
   * Initialize analytics
   */
  init(): void {
    if (this.initialized) return;

    // Google Analytics
    if (this.gaId && typeof window !== 'undefined') {
      this.initGoogleAnalytics();
    }

    this.initialized = true;
    this.log('Analytics initialized');
  }

  /**
   * Initialize Google Analytics
   */
  private initGoogleAnalytics(): void {
    // Load gtag script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${this.gaId}`;
    document.head.appendChild(script);

    // Initialize gtag
    window.dataLayer = window.dataLayer || [];
    function gtag(...args: unknown[]) {
      window.dataLayer.push(args);
    }
    gtag('js', new Date());
    gtag('config', this.gaId, {
      send_page_view: false, // We'll send manually
    });

    (window as any).gtag = gtag;
  }

  /**
   * Track page view
   */
  pageView(pageView: PageView): void {
    const { path, title } = pageView;
    
    this.log('Page view:', { path, title });

    // Google Analytics
    if ((window as any).gtag) {
      (window as any).gtag('event', 'page_view', {
        page_path: path,
        page_title: title,
      });
    }
  }

  /**
   * Track custom event
   */
  event(event: AnalyticsEvent): void {
    const { name, category, label, value, properties } = event;
    
    this.log('Event:', event);

    // Google Analytics
    if ((window as any).gtag) {
      (window as any).gtag('event', name, {
        event_category: category,
        event_label: label,
        value,
        ...properties,
      });
    }
  }

  /**
   * Identify user
   */
  identify(properties: UserProperties): void {
    const { userId, ...traits } = properties;
    
    this.log('Identify:', { userId, traits });

    // Google Analytics
    if ((window as any).gtag && userId) {
      (window as any).gtag('config', this.gaId, {
        user_id: userId,
      });
      (window as any).gtag('set', 'user_properties', traits);
    }
  }

  /**
   * Track timing
   */
  timing(category: string, variable: string, value: number, label?: string): void {
    this.log('Timing:', { category, variable, value, label });

    // Google Analytics
    if ((window as any).gtag) {
      (window as any).gtag('event', 'timing_complete', {
        event_category: category,
        name: variable,
        value,
        event_label: label,
      });
    }
  }

  /**
   * Track exception
   */
  exception(description: string, fatal = false): void {
    this.log('Exception:', { description, fatal });

    // Google Analytics
    if ((window as any).gtag) {
      (window as any).gtag('event', 'exception', {
        description,
        fatal,
      });
    }
  }

  /**
   * Set custom dimension
   */
  setDimension(name: string, value: string): void {
    this.log('Dimension:', { name, value });

    if ((window as any).gtag) {
      (window as any).gtag('set', { [name]: value });
    }
  }

  /**
   * Debug logging
   */
  private log(...args: unknown[]): void {
    if (this.debug) {
      console.log('[Analytics]', ...args);
    }
  }
}

// Pre-defined events
export const ANALYTICS_EVENTS = {
  // Auth
  LOGIN: 'login',
  LOGOUT: 'logout',
  SIGNUP: 'sign_up',
  PASSWORD_RESET: 'password_reset',

  // Navigation
  PAGE_VIEW: 'page_view',
  NAVIGATION: 'navigation',

  // Contas
  CONTA_CREATED: 'conta_created',
  CONTA_UPDATED: 'conta_updated',
  CONTA_DELETED: 'conta_deleted',
  CONTA_PAID: 'conta_paid',

  // Clientes
  CLIENTE_CREATED: 'cliente_created',
  CLIENTE_UPDATED: 'cliente_updated',
  CLIENTE_DELETED: 'cliente_deleted',

  // Fornecedores
  FORNECEDOR_CREATED: 'fornecedor_created',
  FORNECEDOR_UPDATED: 'fornecedor_updated',
  FORNECEDOR_DELETED: 'fornecedor_deleted',

  // Reports
  REPORT_GENERATED: 'report_generated',
  REPORT_EXPORTED: 'report_exported',

  // Features
  FILTER_APPLIED: 'filter_applied',
  SEARCH_PERFORMED: 'search_performed',
  EXPORT_CLICKED: 'export_clicked',
  IMPORT_COMPLETED: 'import_completed',
  BULK_ACTION: 'bulk_action',

  // Errors
  ERROR_OCCURRED: 'error_occurred',
  API_ERROR: 'api_error',

  // Engagement
  FEATURE_USED: 'feature_used',
  FEEDBACK_SUBMITTED: 'feedback_submitted',
};

// Singleton instance
export const analytics = new AnalyticsService();

// Helper functions
export function trackPageView(path: string, title?: string): void {
  analytics.pageView({ path, title });
}

export function trackEvent(
  name: string,
  properties?: Record<string, unknown>
): void {
  analytics.event({ name, properties });
}

export function identifyUser(
  userId: string,
  traits?: Record<string, unknown>
): void {
  analytics.identify({ userId, ...traits });
}

export function trackError(error: Error, fatal = false): void {
  analytics.exception(error.message, fatal);
}

export function trackTiming(
  category: string,
  variable: string,
  duration: number
): void {
  analytics.timing(category, variable, duration);
}

// Type augmentation for window
declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

export default analytics;
