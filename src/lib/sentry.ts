import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';
import { Replay } from '@sentry/replay';

export function initSentry() {
  if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      
      integrations: [
        new BrowserTracing({
          tracePropagationTargets: [
            'localhost',
            /^https:\/\/.*\.supabase\.co/,
            /^https:\/\/finance-hub\.app/,
          ],
        }),
        new Replay({
          maskAllText: true,
          blockAllMedia: true,
        }),
      ],

      // Performance Monitoring
      tracesSampleRate: 1.0, // 100% in production
      
      // Session Replay
      replaysSessionSampleRate: 0.1, // 10% of sessions
      replaysOnErrorSampleRate: 1.0, // 100% of errors

      environment: import.meta.env.MODE,
      release: import.meta.env.VITE_APP_VERSION || 'dev',

      // Filter sensitive data
      beforeSend(event, hint) {
        // Remove sensitive data
        if (event.request) {
          delete event.request.cookies;
          
          if (event.request.headers) {
            delete event.request.headers.Authorization;
            delete event.request.headers.Cookie;
          }
        }

        // Don't send events with specific errors
        const error = hint.originalException;
        if (error instanceof Error) {
          if (error.message.includes('Non-Error promise rejection')) {
            return null;
          }
        }

        return event;
      },

      // Ignore specific errors
      ignoreErrors: [
        'Non-Error promise rejection',
        'ResizeObserver loop limit exceeded',
        'Network request failed',
        'cancelled',
        'AbortError',
      ],

      // Custom tags
      initialScope: (scope) => {
        scope.setTag('app.name', 'Finance-Hub');
        scope.setTag('app.version', import.meta.env.VITE_APP_VERSION || 'dev');
        return scope;
      },
    });
  }
}

// Helper to capture user context
export function setSentryUser(user: { id: string; email: string; name?: string }) {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.name,
  });
}

// Helper to clear user context
export function clearSentryUser() {
  Sentry.setUser(null);
}

// Helper to capture custom errors
export function captureError(error: Error, context?: Record<string, any>) {
  Sentry.captureException(error, {
    extra: context,
  });
}

// Helper to capture messages
export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info') {
  Sentry.captureMessage(message, level);
}

// Helper to add breadcrumb
export function addBreadcrumb(message: string, category: string, data?: Record<string, any>) {
  Sentry.addBreadcrumb({
    message,
    category,
    level: 'info',
    data,
  });
}

// Performance monitoring
export function startTransaction(name: string, op: string) {
  return Sentry.startTransaction({
    name,
    op,
  });
}
