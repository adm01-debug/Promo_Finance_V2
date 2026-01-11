type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
  private level: LogLevel = 'info';
  
  setLevel(level: LogLevel) {
    this.level = level;
  }
  
  debug(...args: unknown[]) {
    if (this.shouldLog('debug')) {
      console.log('[DEBUG]', ...args);
    }
  }
  
  info(...args: unknown[]) {
    if (this.shouldLog('info')) {
      console.info('[INFO]', ...args);
    }
  }
  
  warn(...args: unknown[]) {
    if (this.shouldLog('warn')) {
      console.warn('[WARN]', ...args);
    }
  }
  
  error(...args: unknown[]) {
    if (this.shouldLog('error')) {
      console.error('[ERROR]', ...args);
    }
  }
  
  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    return levels.indexOf(level) >= levels.indexOf(this.level);
  }
}

export const logger = new Logger();
