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
// Redige tokens embutidos em path antes de qualquer saída (Sentry e
// telemetria persistida) — /convite/:token e /contador/:token são
// credenciais utilizáveis, não parâmetros de navegação. Decodifica
// URL-encoding (%2Fconvite%2F<token> em ?redirect=) e remove query/hash
// por completo: GETs carregam busca digitada, CPF/CNPJ e e-mail, e o SDK
// grava request.url cru mesmo com urlQueryParams:false.
export function redactPath(url: string): string {
  let u = url;
  try {
    u = decodeURIComponent(u);
  } catch {
    // URL parcialmente encodada — redige o que for possível no texto cru.
  }
  return u
    .split('#')[0]
    .split('?')[0]
    .replace(/(\/(?:convite|contador)\/)[^/\s]+/gi, '$1[redacted]');
}

// Campos de span do Sentry v11 que carregam URL crua (attributes semânticos):
// url.full/url.path nas pageload/navigation, http.request.header.referer
// nos spans http (httpcontext integration). A chave v8 'url' fica por
// segurança caso alguma integração ainda a emita.
const SPAN_URL_ATTRS = [
  'url.full',
  'url.path',
  'url.query',
  'url.fragment',
  'url',
  'http.request.header.referer',
];

function redactSpanData(data: Record<string, unknown> | undefined) {
  if (!data) return;
  for (const key of SPAN_URL_ATTRS) {
    const v = data[key];
    if (typeof v === 'string') data[key] = redactPath(v);
    else if (Array.isArray(v)) {
      data[key] = v.map((item) => (typeof item === 'string' ? redactPath(item) : item));
    }
  }
}

// Redige mensagens livres (breadcrumb.message, event.message, logentry,
// exception values) sem cortar pontuação: só tokens que parecem URL/path
// passam por redactPath (que remove query/hash — em texto livre um '?'
// normal é pontuação, não separador de query). O restante do texto só
// recebe a máscara de token embutido.
function redactText(text: string): string {
  let t = text;
  try {
    t = decodeURIComponent(t);
  } catch {
    // parcialmente encodado — redige no texto cru
  }
  return t
    .split(/(\s+)/)
    .map((tok) =>
      tok.startsWith('/') || /^(?:https?|wss?|ftp):\/\//i.test(tok) ? redactPath(tok) : tok
    )
    .join('')
    .replace(/(\/(?:convite|contador)\/)[^/\s]+/gi, '$1[redacted]');
}

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
    // Forma de função: acrescenta o tracing às integrações PADRÃO do SDK
    // (GlobalHandlers, Breadcrumbs, Dedupe, LinkedErrors etc.) em vez de
    // substituí-las — passar um array literal aqui desliga a autocaptura
    // padrão de erros não tratados (window.onerror/unhandledrejection).
    integrations: (defaultIntegrations) => [
      ...defaultIntegrations,
      Sentry.browserTracingIntegration(),
    ],
    // Nunca deixa a autocaptura padrão do SDK coletar query string de URL —
    // pode carregar CPF/CNPJ ou termo de busca digitado pelo usuário (ex.
    // busca de clientes/fornecedores). Aplica-se a spans de tracing,
    // breadcrumbs de fetch/XHR e request data uniformemente.
    dataCollection: {
      urlQueryParams: false,
    },
    beforeSend(event) {
      // Nunca deixa vazar payload de request/response completo (pode conter
      // dado financeiro) — só stack trace e mensagem.
      if (event.request) delete event.request.data;
      if (event.request?.url) event.request.url = redactPath(event.request.url);
      // Referer cru carrega a URL da página anterior — um reload saindo de
      // /convite/:token vazaria o token neste header.
      const headers = event.request?.headers;
      if (headers) {
        for (const k of Object.keys(headers)) {
          if (k.toLowerCase() === 'referer' && typeof headers[k] === 'string') {
            headers[k] = redactPath(headers[k]);
          }
        }
      }
      // Rota da transação no evento de erro também carrega o path cru.
      if (typeof event.transaction === 'string') {
        event.transaction = redactPath(event.transaction);
      }
      for (const b of event.breadcrumbs ?? []) {
        if (b.category === 'navigation' && b.data) {
          if (typeof b.data.from === 'string') b.data.from = redactPath(b.data.from);
          if (typeof b.data.to === 'string') b.data.to = redactPath(b.data.to);
        }
        // Breadcrumbs de fetch/XHR carregam data.url CRUA — urlQueryParams
        // não os cobre (GETs PostgREST embutem busca/CPF/e-mail no path+query).
        if (b.data && typeof b.data.url === 'string') {
          b.data.url = redactPath(b.data.url);
        }
        // Breadcrumbs de console carregam message + data.arguments crus —
        // qualquer console.error com location.pathname vaza o token.
        if (typeof b.message === 'string') b.message = redactText(b.message);
        if (b.data && Array.isArray(b.data.arguments)) {
          b.data.arguments = b.data.arguments.map((a) =>
            typeof a === 'string' ? redactText(a) : a
          );
        }
      }
      // Mensagem do evento e valores das exceptions também são texto livre.
      if (typeof event.message === 'string') event.message = redactText(event.message);
      if (event.logentry?.message) event.logentry.message = redactText(event.logentry.message);
      for (const ex of event.exception?.values ?? []) {
        if (typeof ex.value === 'string') ex.value = redactText(ex.value);
      }
      // contexts.trace.data replica os attributes do root span (url.full etc.).
      redactSpanData(event.contexts?.trace?.data as Record<string, unknown> | undefined);
      // `extra` é preenchido por call-sites (reportEdgeError, withErrorTracking
      // etc.) que podem incluir corpo de resposta HTTP ou argumentos de função
      // com dado de negócio (valores, CPF/CNPJ). Sem forma de sanitizar o
      // conteúdo genericamente aqui, a opção segura é não enviar `extra`
      // nenhum ao Sentry — só stack trace, mensagem e tags estruturadas.
      if (event.extra) delete event.extra;
      return event;
    },
    // Transactions NÃO passam por beforeSend. No @sentry/react v11 o
    // traceLifecycle default é 'stream': spans são enviados em stream e
    // passam APENAS por beforeSendSpan (beforeSendTransaction é ignorado
    // pelo SDK nesse modo). Mantemos os dois: se traceLifecycle mudar para
    // 'static', transactions voltam a passar por beforeSendTransaction.
    beforeSendSpan(span) {
      // StreamedSpanJSON: 'name' (não 'description') + 'attributes' com os
      // attributes semânticos crus (url.full etc.).
      if (typeof span.name === 'string') {
        span.name = redactPath(span.name);
      }
      redactSpanData(span.attributes as Record<string, unknown> | undefined);
      return span;
    },
    beforeSendTransaction(event) {
      if (typeof event.transaction === 'string') {
        event.transaction = redactPath(event.transaction);
      }
      if (event.request?.url) event.request.url = redactPath(event.request.url);
      for (const span of event.spans ?? []) {
        if (typeof span.description === 'string') {
          span.description = redactPath(span.description);
        }
        redactSpanData(span.data as Record<string, unknown> | undefined);
      }
      return event;
    },
  });

  // Sentry.init() nunca lança em DSN malformada — o SDK loga um aviso e
  // fica inerte (client não é criado). Sem essa checagem, sentryInitialized
  // ficaria true e o errorTracker pararia de cair no fallback de console,
  // fazendo os erros desaparecerem silenciosamente (nem console, nem Sentry).
  if (!Sentry.getClient()) {
    console.warn(
      '[ErrorTracker] Sentry.init() não criou um client (DSN provavelmente inválida) — mantendo fallback de console.'
    );
    return;
  }

  sentryInitialized = true;
}
