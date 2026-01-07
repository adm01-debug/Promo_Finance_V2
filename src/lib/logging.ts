// ============================================
// LOGGING UTILITIES: Sistema de logs estruturados
// Níveis, formatação e persistência de logs
// ============================================

// ============================================
// TIPOS
// ============================================

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: string;
  data?: Record<string, unknown>;
  stack?: string;
}

export interface LoggerConfig {
  level: LogLevel;
  enabled: boolean;
  persist: boolean;
  maxEntries: number;
  context?: string;
}

// ============================================
// CONSTANTES
// ============================================

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  fatal: 4,
};

const LOG_COLORS: Record<LogLevel, string> = {
  debug: '#6B7280',
  info: '#3B82F6',
  warn: '#F59E0B',
  error: '#EF4444',
  fatal: '#DC2626',
};

const STORAGE_KEY = 'app_logs';
const DEFAULT_MAX_ENTRIES = 1000;

// ============================================
// LOGGER CLASS
// ============================================

class Logger {
  private config: LoggerConfig;
  private entries: LogEntry[] = [];
  private listeners: ((entry: LogEntry) => void)[] = [];

  constructor(config?: Partial<LoggerConfig>) {
    this.config = {
      level: 'info',
      enabled: true,
      persist: false,
      maxEntries: DEFAULT_MAX_ENTRIES,
      ...config,
    };

    if (this.config.persist) {
      this.loadFromStorage();
    }
  }

  /**
   * Configura o logger
   */
  configure(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Cria um logger com contexto
   */
  child(context: string): Logger {
    const childLogger = new Logger({ ...this.config, context });
    childLogger.entries = this.entries;
    childLogger.listeners = this.listeners;
    return childLogger;
  }

  /**
   * Adiciona listener para novos logs
   */
  onLog(callback: (entry: LogEntry) => void): () => void {
    this.listeners.push(callback);
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Log de debug
   */
  debug(message: string, data?: Record<string, unknown>): void {
    this.log('debug', message, data);
  }

  /**
   * Log de info
   */
  info(message: string, data?: Record<string, unknown>): void {
    this.log('info', message, data);
  }

  /**
   * Log de warning
   */
  warn(message: string, data?: Record<string, unknown>): void {
    this.log('warn', message, data);
  }

  /**
   * Log de erro
   */
  error(message: string, error?: Error | Record<string, unknown>): void {
    const data = error instanceof Error
      ? { name: error.name, message: error.message, stack: error.stack }
      : error;
    this.log('error', message, data);
  }

  /**
   * Log fatal
   */
  fatal(message: string, error?: Error | Record<string, unknown>): void {
    const data = error instanceof Error
      ? { name: error.name, message: error.message, stack: error.stack }
      : error;
    this.log('fatal', message, data);
  }

  /**
   * Log genérico
   */
  private log(level: LogLevel, message: string, data?: Record<string, unknown>): void {
    if (!this.config.enabled) return;
    if (LOG_LEVELS[level] < LOG_LEVELS[this.config.level]) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: this.config.context,
      data,
    };

    this.entries.push(entry);

    // Limita número de entradas
    if (this.entries.length > this.config.maxEntries) {
      this.entries = this.entries.slice(-this.config.maxEntries);
    }

    // Console output
    this.consoleOutput(entry);

    // Persistência
    if (this.config.persist) {
      this.saveToStorage();
    }

    // Notifica listeners
    this.listeners.forEach((listener) => listener(entry));
  }

  /**
   * Output no console
   */
  private consoleOutput(entry: LogEntry): void {
    const color = LOG_COLORS[entry.level];
    const prefix = entry.context ? `[${entry.context}]` : '';
    const style = `color: ${color}; font-weight: bold;`;

    const consoleFn = entry.level === 'error' || entry.level === 'fatal'
      ? console.error
      : entry.level === 'warn'
      ? console.warn
      : entry.level === 'debug'
      ? console.debug
      : console.log;

    consoleFn(
      `%c${entry.level.toUpperCase()}%c ${prefix} ${entry.message}`,
      style,
      'color: inherit;',
      entry.data || ''
    );
  }

  /**
   * Salva no localStorage
   */
  private saveToStorage(): void {
    try {
      const serialized = JSON.stringify(this.entries);
      localStorage.setItem(STORAGE_KEY, serialized);
    } catch (error) {
      console.error('Erro ao salvar logs:', error);
    }
  }

  /**
   * Carrega do localStorage
   */
  private loadFromStorage(): void {
    try {
      const serialized = localStorage.getItem(STORAGE_KEY);
      if (serialized) {
        this.entries = JSON.parse(serialized);
      }
    } catch (error) {
      console.error('Erro ao carregar logs:', error);
    }
  }

  /**
   * Retorna todos os logs
   */
  getEntries(filter?: { level?: LogLevel; context?: string; from?: Date; to?: Date }): LogEntry[] {
    let filtered = [...this.entries];

    if (filter?.level) {
      const minLevel = LOG_LEVELS[filter.level];
      filtered = filtered.filter((e) => LOG_LEVELS[e.level] >= minLevel);
    }

    if (filter?.context) {
      filtered = filtered.filter((e) => e.context === filter.context);
    }

    if (filter?.from) {
      filtered = filtered.filter((e) => new Date(e.timestamp) >= filter.from!);
    }

    if (filter?.to) {
      filtered = filtered.filter((e) => new Date(e.timestamp) <= filter.to!);
    }

    return filtered;
  }

  /**
   * Limpa todos os logs
   */
  clear(): void {
    this.entries = [];
    if (this.config.persist) {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  /**
   * Exporta logs como JSON
   */
  export(): string {
    return JSON.stringify(this.entries, null, 2);
  }

  /**
   * Exporta logs como CSV
   */
  exportCSV(): string {
    const headers = ['timestamp', 'level', 'context', 'message', 'data'];
    const rows = this.entries.map((e) => [
      e.timestamp,
      e.level,
      e.context || '',
      e.message,
      e.data ? JSON.stringify(e.data) : '',
    ]);

    return [
      headers.join(','),
      ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');
  }
}

// ============================================
// INSTÂNCIA GLOBAL
// ============================================

export const logger = new Logger({
  level: import.meta.env.DEV ? 'debug' : 'warn',
  enabled: true,
  persist: false,
});

// ============================================
// LOGGERS ESPECIALIZADOS
// ============================================

export const apiLogger = logger.child('API');
export const authLogger = logger.child('Auth');
export const uiLogger = logger.child('UI');
export const dbLogger = logger.child('Database');
export const perfLogger = logger.child('Performance');

// ============================================
// HOOKS
// ============================================

import { useCallback, useEffect, useState } from 'react';

/**
 * Hook para usar o logger
 */
export function useLogger(context?: string) {
  const contextLogger = context ? logger.child(context) : logger;

  return {
    debug: contextLogger.debug.bind(contextLogger),
    info: contextLogger.info.bind(contextLogger),
    warn: contextLogger.warn.bind(contextLogger),
    error: contextLogger.error.bind(contextLogger),
    fatal: contextLogger.fatal.bind(contextLogger),
  };
}

/**
 * Hook para observar logs
 */
export function useLogObserver(filter?: { level?: LogLevel; context?: string }) {
  const [entries, setEntries] = useState<LogEntry[]>([]);

  useEffect(() => {
    // Carrega logs existentes
    setEntries(logger.getEntries(filter));

    // Escuta novos logs
    const unsubscribe = logger.onLog((entry) => {
      if (filter?.level && LOG_LEVELS[entry.level] < LOG_LEVELS[filter.level]) {
        return;
      }
      if (filter?.context && entry.context !== filter.context) {
        return;
      }
      setEntries((prev) => [...prev, entry]);
    });

    return unsubscribe;
  }, [filter?.level, filter?.context]);

  const clear = useCallback(() => {
    setEntries([]);
    logger.clear();
  }, []);

  return { entries, clear };
}

/**
 * Hook para performance logging
 */
export function usePerformanceLogger(name: string) {
  const startTimeRef = { current: 0 };

  const start = useCallback(() => {
    startTimeRef.current = performance.now();
    perfLogger.debug(`${name}: started`);
  }, [name]);

  const end = useCallback(() => {
    const duration = performance.now() - startTimeRef.current;
    perfLogger.info(`${name}: completed`, { duration: `${duration.toFixed(2)}ms` });
    return duration;
  }, [name]);

  return { start, end };
}

// ============================================
// DECORATORS / HELPERS
// ============================================

/**
 * Wrapper para logging de funções
 */
export function withLogging<T extends (...args: unknown[]) => unknown>(
  fn: T,
  name: string,
  log = logger
): T {
  return ((...args: unknown[]) => {
    log.debug(`${name}: called`, { args });
    try {
      const result = fn(...args);
      if (result instanceof Promise) {
        return result
          .then((res) => {
            log.debug(`${name}: resolved`, { result: res });
            return res;
          })
          .catch((err) => {
            log.error(`${name}: rejected`, err);
            throw err;
          });
      }
      log.debug(`${name}: returned`, { result });
      return result;
    } catch (error) {
      log.error(`${name}: threw`, error as Error);
      throw error;
    }
  }) as T;
}

/**
 * Timer para logging de duração
 */
export function createTimer(name: string, log = logger) {
  const start = performance.now();
  log.debug(`${name}: timer started`);

  return {
    end: () => {
      const duration = performance.now() - start;
      log.info(`${name}: completed in ${duration.toFixed(2)}ms`);
      return duration;
    },
    lap: (label: string) => {
      const elapsed = performance.now() - start;
      log.debug(`${name}: ${label} at ${elapsed.toFixed(2)}ms`);
      return elapsed;
    },
  };
}

// ============================================
// ERROR BOUNDARY LOGGING
// ============================================

/**
 * Reporta erro para logging
 */
export function reportError(error: Error, context?: Record<string, unknown>): void {
  logger.error('Unhandled error', {
    name: error.name,
    message: error.message,
    stack: error.stack,
    ...context,
  });
}

/**
 * Configura handler global de erros
 */
export function setupGlobalErrorHandler(): void {
  window.onerror = (message, source, lineno, colno, error) => {
    logger.fatal('Global error', {
      message: String(message),
      source,
      lineno,
      colno,
      error: error?.stack,
    });
  };

  window.onunhandledrejection = (event) => {
    logger.fatal('Unhandled promise rejection', {
      reason: event.reason,
    });
  };
}

export { Logger };
