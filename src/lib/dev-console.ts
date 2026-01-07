/**
 * Production-safe console wrapper
 * Substitui console.log/warn/error com controle de ambiente
 */

import { logger } from './logging';

const isDev = import.meta.env.DEV;

/**
 * Console wrapper que usa o logger em produção
 * e console nativo em desenvolvimento
 */
export const devConsole = {
  log: (...args: unknown[]) => {
    if (isDev) {
      console.log(...args);
    } else {
      logger.debug(args.map(String).join(' '));
    }
  },
  
  warn: (...args: unknown[]) => {
    if (isDev) {
      console.warn(...args);
    }
    logger.warn(args.map(String).join(' '));
  },
  
  error: (...args: unknown[]) => {
    if (isDev) {
      console.error(...args);
    }
    logger.error(args.map(String).join(' '));
  },
  
  info: (...args: unknown[]) => {
    if (isDev) {
      console.info(...args);
    } else {
      logger.info(args.map(String).join(' '));
    }
  },
  
  debug: (...args: unknown[]) => {
    if (isDev) {
      console.debug(...args);
    }
  },
  
  group: (label?: string) => {
    if (isDev) {
      console.group(label);
    }
  },
  
  groupEnd: () => {
    if (isDev) {
      console.groupEnd();
    }
  },
  
  table: (data: unknown) => {
    if (isDev) {
      console.table(data);
    }
  },
  
  time: (label?: string) => {
    if (isDev) {
      console.time(label);
    }
  },
  
  timeEnd: (label?: string) => {
    if (isDev) {
      console.timeEnd(label);
    }
  },
};

export default devConsole;
