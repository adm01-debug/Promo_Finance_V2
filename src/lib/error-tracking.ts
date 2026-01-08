// Error tracking utilities
// Ready for Sentry integration when API key is provided

interface ErrorContext {
  userId?: string;
  email?: string;
  extra?: Record<string, any>;
  tags?: Record<string, string>;
}

interface ErrorTracker {
  captureException: (error: Error, context?: ErrorContext) => void;
  captureMessage: (message: string, level?: 'info' | 'warning' | 'error') => void;
  setUser: (user: { id: string; email?: string; name?: string } | null) => void;
  addBreadcrumb: (breadcrumb: { category: string; message: string; data?: Record<string, any> }) => void;
}

// Console-based fallback tracker for development
const consoleTracker: ErrorTracker = {
  captureException: (error, context) => {
    console.error('[ErrorTracker] Exception:', error);
    if (context) {
      console.error('[ErrorTracker] Context:', context);
    }
  },
  captureMessage: (message, level = 'info') => {
    const logFn = level === 'error' ? console.error : level === 'warning' ? console.warn : console.info;
    logFn(`[ErrorTracker] ${level.toUpperCase()}: ${message}`);
  },
  setUser: (user) => {
    if (user) {
      console.info('[ErrorTracker] User set:', user.id);
    } else {
      console.info('[ErrorTracker] User cleared');
    }
  },
  addBreadcrumb: (breadcrumb) => {
    console.debug('[ErrorTracker] Breadcrumb:', breadcrumb.category, '-', breadcrumb.message);
  },
};

// Sentry tracker (to be initialized when key is available)
const sentryTracker: ErrorTracker = {
  captureException: (error, context) => {
    if ((window as any).Sentry) {
      (window as any).Sentry.captureException(error, {
        user: context?.userId ? { id: context.userId, email: context.email } : undefined,
        extra: context?.extra,
        tags: context?.tags,
      });
    } else {
      consoleTracker.captureException(error, context);
    }
  },
  captureMessage: (message, level = 'info') => {
    if ((window as any).Sentry) {
      (window as any).Sentry.captureMessage(message, level);
    } else {
      consoleTracker.captureMessage(message, level);
    }
  },
  setUser: (user) => {
    if ((window as any).Sentry) {
      (window as any).Sentry.setUser(user);
    }
    consoleTracker.setUser(user);
  },
  addBreadcrumb: (breadcrumb) => {
    if ((window as any).Sentry) {
      (window as any).Sentry.addBreadcrumb({
        category: breadcrumb.category,
        message: breadcrumb.message,
        data: breadcrumb.data,
        level: 'info',
      });
    }
    consoleTracker.addBreadcrumb(breadcrumb);
  },
};

// Export the appropriate tracker
export const errorTracker: ErrorTracker = 
  typeof window !== 'undefined' && (window as any).Sentry 
    ? sentryTracker 
    : consoleTracker;

// Utility function to wrap async functions with error tracking
export function withErrorTracking<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  context?: Omit<ErrorContext, 'extra'>
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error: unknown) {
      errorTracker.captureException(error as Error, {
        ...context,
        extra: { args },
      });
      throw error;
    }
  }) as T;
}

// React error boundary integration helper
export function reportErrorToTracker(error: Error, componentStack?: string) {
  errorTracker.captureException(error, {
    extra: { componentStack },
    tags: { type: 'react-error-boundary' },
  });
}

// Initialize Sentry (call this when you have the DSN)
export function initSentry(dsn: string, environment: string = 'production') {
  // This would be called when Sentry is set up
  // The actual Sentry initialization script would need to be added to index.html
  console.info('[ErrorTracker] Ready for Sentry initialization with DSN');
}
