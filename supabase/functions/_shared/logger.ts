export enum LogLevel {
  DEBUG = "DEBUG",
  INFO = "INFO",
  WARN = "WARN",
  ERROR = "ERROR",
  CRITICAL = "CRITICAL"
}

/**
 * Logger estruturado com suporte a correlation-id (Sprint 3.2).
 *
 * Uso recomendado:
 *   const requestId = getRequestId(req);
 *   const logger = createLogger('minha-funcao', requestId);
 *   logger.info('processando pedido', { orderId });
 */
export class Logger {
  private functionName: string;
  private requestId?: string;

  constructor(functionName: string, requestId?: string) {
    this.functionName = functionName;
    this.requestId = requestId;
  }

  /** Cria um logger derivado com contexto adicional (ex.: userId, orderId). */
  child(extra: Record<string, unknown>): Logger {
    const child = new Logger(this.functionName, this.requestId);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (child as any).defaultContext = { ...(this as any).defaultContext, ...extra };
    return child;
  }

  private log(level: LogLevel, message: string, context?: Record<string, unknown>) {
    const payload = {
      timestamp: new Date().toISOString(),
      level,
      function: this.functionName,
      request_id: this.requestId,
      message,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...((this as any).defaultContext ?? {}),
      ...context
    };

    if (level === LogLevel.ERROR || level === LogLevel.CRITICAL) {
      console.error(JSON.stringify(payload));
    } else {
      console.log(JSON.stringify(payload));
    }
  }

  debug(message: string, context?: Record<string, unknown>) { this.log(LogLevel.DEBUG, message, context); }
  info(message: string, context?: Record<string, unknown>) { this.log(LogLevel.INFO, message, context); }
  warn(message: string, context?: Record<string, unknown>) { this.log(LogLevel.WARN, message, context); }
  error(message: string, context?: Record<string, unknown>) { this.log(LogLevel.ERROR, message, context); }
  critical(message: string, context?: Record<string, unknown>) { this.log(LogLevel.CRITICAL, message, context); }
}

export const createLogger = (name: string, requestId?: string) =>
  new Logger(name, requestId);
