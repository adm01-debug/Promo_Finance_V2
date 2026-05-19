export enum LogLevel {
  DEBUG = "DEBUG",
  INFO = "INFO",
  WARN = "WARN",
  ERROR = "ERROR",
  CRITICAL = "CRITICAL"
}

export class Logger {
  private functionName: string;

  constructor(functionName: string) {
    this.functionName = functionName;
  }

  private log(level: LogLevel, message: string, context?: Record<string, any>) {
    const payload = {
      timestamp: new Date().toISOString(),
      level,
      function: this.functionName,
      message,
      ...context
    };

    if (level === LogLevel.ERROR || level === LogLevel.CRITICAL) {
      console.error(JSON.stringify(payload));
    } else {
      console.log(JSON.stringify(payload));
    }
  }

  debug(message: string, context?: Record<string, any>) { this.log(LogLevel.DEBUG, message, context); }
  info(message: string, context?: Record<string, any>) { this.log(LogLevel.INFO, message, context); }
  warn(message: string, context?: Record<string, any>) { this.log(LogLevel.WARN, message, context); }
  error(message: string, context?: Record<string, any>) { this.log(LogLevel.ERROR, message, context); }
  critical(message: string, context?: Record<string, any>) { this.log(LogLevel.CRITICAL, message, context); }
}

export const createLogger = (name: string) => new Logger(name);
