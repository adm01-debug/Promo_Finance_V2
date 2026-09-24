/* eslint-disable no-console -- fallback tracker usa console quando Sentry não está inicializado */
// Error tracking utilities — integração real com @sentry/react.
// Sentry só é inicializado se VITE_SENTRY_DSN estiver configurada (ver initSentry
// em src/main.tsx); sem DSN, cai no fallback de console sem quebrar nada.
import * as Sentry from '@sentry/react';

interface ErrorContext {
  userId?: string;
  email?: string;
  extra?: Record<string, unknown>;
  tags?: Record<string, string>;
}

let sentryInitialized = false;

interface ErrorTracker {
  captureException: (error: Error, context?: ErrorContext) => void;
  captureMessage: (message: string, level?: 'info' | 'warning' | 'error') => void;
  setUser: (user: { id: string; email?: string; name?: string } | null) => void;
  addBreadcrumb: (breadcrumb: {
    category: string;
    message: string;
    data?: Record<string, unknown>;
  }) => void;
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
    const logFn =
      level === 'error' ? console.error : level === 'warning' ? console.warn : console.info;
    logFn(`[ErrorTracker] ${level.toUpperCase()}: ${message}`);
  },
  setUser: (user) => {
    if (!import.meta.env.DEV) return;
    if (user) {
      console.info('[ErrorTracker] User set:', user.id);
    } else {
      console.info('[ErrorTracker] User cleared');
    }
  },
  addBreadcrumb: (breadcrumb) => {
    if (!import.meta.env.DEV) return;
    console.debug('[ErrorTracker] Breadcrumb:', breadcrumb.category, '-', breadcrumb.message);
  },
};

// Sentry tracker — delega para o SDK @sentry/react quando initSentry() já rodou.
const sentryTracker: ErrorTracker = {
  captureException: (error, context) => {
    if (sentryInitialized) {
      Sentry.captureException(error, {
        user: context?.userId ? { id: context.userId, email: context.email } : undefined,
        extra: context?.extra,
        tags: context?.tags,
      });
    } else {
      consoleTracker.captureException(error, context);
    }
  },
  captureMessage: (message, level = 'info') => {
    if (sentryInitialized) {
      Sentry.captureMessage(message, level);
    } else {
      consoleTracker.captureMessage(message, level);
    }
  },
  setUser: (user) => {
    if (sentryInitialized) {
      Sentry.setUser(user);
    }
    consoleTracker.setUser(user);
  },
  addBreadcrumb: (breadcrumb) => {
    if (sentryInitialized) {
      Sentry.addBreadcrumb({
        category: breadcrumb.category,
        message: breadcrumb.message,
        data: breadcrumb.data,
        level: 'info',
      });
    }
    consoleTracker.addBreadcrumb(breadcrumb);
  },
};

// errorTracker é uma indireção estável (objeto único, nunca reatribuído) que
// checa sentryInitialized a cada chamada — assim funciona corretamente mesmo
// que initSentry() rode depois do import (ordem de inicialização do app).
export const errorTracker: ErrorTracker = sentryTracker;

// Utility function to wrap async functions with error tracking
export function withErrorTracking<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  context?: Omit<ErrorContext, 'extra'>
): (...args: TArgs) => Promise<TResult> {
  return async (...args: TArgs) => {
    try {
      return await fn(...args);
    } catch (error: unknown) {
      errorTracker.captureException(error as Error, {
        ...context,
        extra: { args },
      });
      throw error;
    }
  };
}

// React error boundary integration helper
export function reportErrorToTracker(error: Error, componentStack?: string) {
  errorTracker.captureException(error, {
    extra: { componentStack },
    tags: { type: 'react-error-boundary' },
  });
}

/**
 * Inicializa o Sentry. Chamado em src/main.tsx no boot da aplicação.
 * Sem `dsn` (VITE_SENTRY_DSN não configurada no ambiente), não faz nada —
 * errorTracker continua caindo no fallback de console, sem quebrar a app.
 */
export function initSentry(dsn: string | undefined, environment: string) {
  if (!dsn) {
    if (import.meta.env.DEV)
      console.info('[ErrorTracker] VITE_SENTRY_DSN ausente — usando fallback de console.');
    return;
  }
  if (sentryInitialized) return;

  Sentry.init({
    dsn,
    environment,
    // Amostragem conservadora: captura 100% dos erros (não são muitos eventos
    // num SPA interno), mas só 10% das transações de performance para não
    // gerar volume/custo desnecessário no plano do Sentry.
    tracesSampleRate: 0.1,
    integrations: [Sentry.browserTracingIntegration()],
    beforeSend(event) {
      // Nunca deixa vazar payload de request/response completo (pode conter
      // dado financeiro) — só stack trace e mensagem.
      if (event.request) delete event.request.data;
      return event;
    },
  });

  sentryInitialized = true;
}
