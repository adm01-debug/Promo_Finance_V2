type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
  private level: LogLevel = 'info';
  
  setLevel(level: LogLevel) {
    this.level = level;
  }
  
  debug(...args: any[]) {
    if (this.shouldLog('debug')) {
      console.log('[DEBUG]', ...args);
    }
  }
  
  info(...args: any[]) {
    if (this.shouldLog('info')) {
      console.info('[INFO]', ...args);
    }
  }
  
  warn(...args: any[]) {
    if (this.shouldLog('warn')) {
      console.warn('[WARN]', ...args);
    }
  }
  
  error(...args: any[]) {
    if (this.shouldLog('error')) {
      console.error('[ERROR]', ...args);
    }
  }
  
  private shouldLog(level: LogLevel): boolean {
    const levels = ['debug', 'info', 'warn', 'error'];
    return levels.indexOf(level) >= levels.indexOf(this.level);
  }
}

export const logger = new Logger();
