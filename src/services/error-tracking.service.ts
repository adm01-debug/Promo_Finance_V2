/**
 * Error Tracking Service - Integração com Sentry
 */

interface ErrorContext {
  tags?: Record<string, string>;
  extra?: Record<string, unknown>;
  user?: {
    id?: string;
    email?: string;
    name?: string;
  };
  level?: 'fatal' | 'error' | 'warning' | 'info' | 'debug';
}

interface BreadcrumbData {
  category: string;
  message: string;
  level?: 'fatal' | 'error' | 'warning' | 'info' | 'debug';
  data?: Record<string, unknown>;
}

class ErrorTrackingService {
  private initialized = false;
  private debug = import.meta.env.DEV;
  private dsn = import.meta.env.VITE_SENTRY_DSN;
  private environment = import.meta.env.MODE;

  /**
   * Initialize error tracking
   */
  async init(): Promise<void> {
    if (this.initialized || !this.dsn) {
      this.log('Sentry DSN not configured or already initialized');
      return;
    }

    try {
      // Dynamic import to reduce bundle size
      const Sentry = await import('@sentry/react');
      
      Sentry.init({
        dsn: this.dsn,
        environment: this.environment,
        release: `finance-hub@${import.meta.env.VITE_APP_VERSION || '1.0.0'}`,
        tracesSampleRate: this.debug ? 1.0 : 0.2,
        replaysSessionSampleRate: 0.1,
        replaysOnErrorSampleRate: 1.0,
        integrations: [
          Sentry.browserTracingIntegration(),
          Sentry.replayIntegration(),
        ],
        beforeSend(event, hint) {
          // Filter out specific errors
          const error = hint?.originalException;
          if (error instanceof Error) {
            // Ignore network errors in development
            if (import.meta.env.DEV && error.message.includes('NetworkError')) {
              return null;
            }
          }
          return event;
        },
      });

      this.initialized = true;
      this.log('Error tracking initialized');
    } catch (error) {
      console.error('Failed to initialize Sentry:', error);
    }
  }

  /**
   * Capture an exception
   */
  async captureException(error: Error, context?: ErrorContext): Promise<string | undefined> {
    this.log('Capturing exception:', error.message);

    if (!this.initialized) {
      console.error('[ErrorTracking] Not initialized:', error);
      return undefined;
    }

    try {
      const Sentry = await import('@sentry/react');
      
      return Sentry.captureException(error, {
        tags: context?.tags,
        extra: context?.extra,
        user: context?.user,
        level: context?.level || 'error',
      });
    } catch (e) {
      console.error('Failed to capture exception:', e);
      return undefined;
    }
  }

  /**
   * Capture a message
   */
  async captureMessage(message: string, context?: ErrorContext): Promise<string | undefined> {
    this.log('Capturing message:', message);

    if (!this.initialized) {
      console.log('[ErrorTracking] Message:', message);
      return undefined;
    }

    try {
      const Sentry = await import('@sentry/react');
      
      return Sentry.captureMessage(message, {
        tags: context?.tags,
        extra: context?.extra,
        user: context?.user,
        level: context?.level || 'info',
      });
    } catch (e) {
      console.error('Failed to capture message:', e);
      return undefined;
    }
  }

  /**
   * Add breadcrumb for debugging
   */
  async addBreadcrumb(breadcrumb: BreadcrumbData): Promise<void> {
    this.log('Adding breadcrumb:', breadcrumb.message);

    if (!this.initialized) return;

    try {
      const Sentry = await import('@sentry/react');
      
      Sentry.addBreadcrumb({
        category: breadcrumb.category,
        message: breadcrumb.message,
        level: breadcrumb.level || 'info',
        data: breadcrumb.data,
      });
    } catch (e) {
      console.error('Failed to add breadcrumb:', e);
    }
  }

  /**
   * Set user context
   */
  async setUser(user: ErrorContext['user'] | null): Promise<void> {
    this.log('Setting user:', user?.id);

    if (!this.initialized) return;

    try {
      const Sentry = await import('@sentry/react');
      Sentry.setUser(user);
    } catch (e) {
      console.error('Failed to set user:', e);
    }
  }

  /**
   * Set extra context
   */
  async setExtra(key: string, value: unknown): Promise<void> {
    if (!this.initialized) return;

    try {
      const Sentry = await import('@sentry/react');
      Sentry.setExtra(key, value);
    } catch (e) {
      console.error('Failed to set extra:', e);
    }
  }

  /**
   * Set tag
   */
  async setTag(key: string, value: string): Promise<void> {
    if (!this.initialized) return;

    try {
      const Sentry = await import('@sentry/react');
      Sentry.setTag(key, value);
    } catch (e) {
      console.error('Failed to set tag:', e);
    }
  }

  /**
   * Start a transaction for performance monitoring
   */
  async startTransaction(name: string, op: string): Promise<unknown> {
    if (!this.initialized) return undefined;

    try {
      const Sentry = await import('@sentry/react');
      return Sentry.startSpan({ name, op }, () => {});
    } catch (e) {
      console.error('Failed to start transaction:', e);
      return undefined;
    }
  }

  /**
   * Debug logging
   */
  private log(...args: unknown[]): void {
    if (this.debug) {
      console.log('[ErrorTracking]', ...args);
    }
  }
}

// Singleton instance
export const errorTracking = new ErrorTrackingService();

// Helper functions
export function captureError(error: Error, context?: ErrorContext): void {
  errorTracking.captureException(error, context);
}

export function captureMessage(message: string, level?: ErrorContext['level']): void {
  errorTracking.captureMessage(message, { level });
}

export function logBreadcrumb(category: string, message: string, data?: Record<string, unknown>): void {
  errorTracking.addBreadcrumb({ category, message, data });
}

export function setErrorUser(user: ErrorContext['user'] | null): void {
  errorTracking.setUser(user);
}

// Error boundary component wrapper
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ReactNode
): React.ComponentType<P> {
  return function WrappedComponent(props: P) {
    // In a real implementation, this would use Sentry's ErrorBoundary
    // For now, return the component directly
    return <Component {...props} />;
  };
}

// Global error handler
export function setupGlobalErrorHandlers(): void {
  // Unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    captureError(new Error(`Unhandled Promise Rejection: ${event.reason}`), {
      tags: { type: 'unhandled_rejection' },
      extra: { reason: event.reason },
    });
  });

  // Global errors
  window.addEventListener('error', (event) => {
    captureError(event.error || new Error(event.message), {
      tags: { type: 'global_error' },
      extra: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      },
    });
  });
}

export default errorTracking;
