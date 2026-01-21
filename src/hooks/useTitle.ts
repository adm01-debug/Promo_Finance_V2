import { useEffect, useRef } from 'react';
import { APP_NAME } from '@/constants';

/**
 * Hook para gerenciar o título da página
 * @param title - Título da página
 * @param options - Opções de configuração
 */
export function useTitle(
  title: string,
  options: {
    suffix?: string;
    restoreOnUnmount?: boolean;
  } = {}
) {
  const { suffix = APP_NAME, restoreOnUnmount = true } = options;
  const previousTitle = useRef(document.title);

  useEffect(() => {
    const fullTitle = suffix ? `${title} | ${suffix}` : title;
    document.title = fullTitle;

    return () => {
      if (restoreOnUnmount) {
        document.title = previousTitle.current;
      }
    };
  }, [title, suffix, restoreOnUnmount]);
}

/**
 * Hook para gerenciar título com contador (ex: notificações)
 */
export function useTitleWithCount(
  baseTitle: string,
  count: number,
  options: {
    suffix?: string;
    showZero?: boolean;
  } = {}
) {
  const { suffix = APP_NAME, showZero = false } = options;
  
  useEffect(() => {
    let title = baseTitle;
    
    if (count > 0 || showZero) {
      title = `(${count}) ${baseTitle}`;
    }
    
    document.title = suffix ? `${title} | ${suffix}` : title;
  }, [baseTitle, count, suffix, showZero]);
}
