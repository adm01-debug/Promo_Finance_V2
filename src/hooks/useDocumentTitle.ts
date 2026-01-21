import { useEffect, useRef, useCallback } from 'react';

interface UseDocumentTitleOptions {
  suffix?: string;
  prefix?: string;
  restoreOnUnmount?: boolean;
}

/**
 * Hook to manage document title
 */
export function useDocumentTitle(
  title: string,
  options: UseDocumentTitleOptions = {}
): void {
  const { suffix = ' | Finance Hub', prefix = '', restoreOnUnmount = true } = options;
  const previousTitle = useRef(document.title);

  useEffect(() => {
    const fullTitle = `${prefix}${title}${suffix}`;
    document.title = fullTitle;

    return () => {
      if (restoreOnUnmount) {
        document.title = previousTitle.current;
      }
    };
  }, [title, suffix, prefix, restoreOnUnmount]);
}

/**
 * Hook for dynamic document title with template
 */
export function useDynamicTitle() {
  const setTitle = useCallback((title: string, suffix = ' | Finance Hub') => {
    document.title = `${title}${suffix}`;
  }, []);

  const setTitleWithCount = useCallback((title: string, count: number, suffix = ' | Finance Hub') => {
    const countStr = count > 0 ? `(${count}) ` : '';
    document.title = `${countStr}${title}${suffix}`;
  }, []);

  const resetTitle = useCallback(() => {
    document.title = 'Finance Hub';
  }, []);

  return { setTitle, setTitleWithCount, resetTitle };
}

/**
 * Hook for notification count in title
 */
export function useTitleNotification(
  baseTitle: string,
  notificationCount: number,
  options: UseDocumentTitleOptions = {}
): void {
  const { suffix = ' | Finance Hub', prefix = '', restoreOnUnmount = true } = options;
  const previousTitle = useRef(document.title);

  useEffect(() => {
    const countPrefix = notificationCount > 0 ? `(${notificationCount}) ` : '';
    const fullTitle = `${countPrefix}${prefix}${baseTitle}${suffix}`;
    document.title = fullTitle;

    return () => {
      if (restoreOnUnmount) {
        document.title = previousTitle.current;
      }
    };
  }, [baseTitle, notificationCount, suffix, prefix, restoreOnUnmount]);
}

/**
 * Hook for flashing title (attention grabber)
 */
export function useFlashingTitle(
  normalTitle: string,
  flashTitle: string,
  isFlashing: boolean,
  interval = 1000
): void {
  const previousTitle = useRef(document.title);

  useEffect(() => {
    if (!isFlashing) {
      document.title = normalTitle;
      return;
    }

    let showFlash = false;
    const timer = setInterval(() => {
      document.title = showFlash ? flashTitle : normalTitle;
      showFlash = !showFlash;
    }, interval);

    return () => {
      clearInterval(timer);
      document.title = previousTitle.current;
    };
  }, [normalTitle, flashTitle, isFlashing, interval]);
}

/**
 * Hook for typing animation in title
 */
export function useTypingTitle(
  text: string,
  isTyping: boolean,
  speed = 100
): void {
  useEffect(() => {
    if (!isTyping) {
      document.title = text;
      return;
    }

    let index = 0;
    const timer = setInterval(() => {
      document.title = text.substring(0, index + 1);
      index++;
      if (index >= text.length) {
        clearInterval(timer);
      }
    }, speed);

    return () => clearInterval(timer);
  }, [text, isTyping, speed]);
}

/**
 * Hook for loading state in title
 */
export function useLoadingTitle(
  baseTitle: string,
  isLoading: boolean
): void {
  useEffect(() => {
    if (!isLoading) {
      document.title = baseTitle;
      return;
    }

    const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    let frameIndex = 0;

    const timer = setInterval(() => {
      document.title = `${frames[frameIndex]} ${baseTitle}`;
      frameIndex = (frameIndex + 1) % frames.length;
    }, 100);

    return () => {
      clearInterval(timer);
      document.title = baseTitle;
    };
  }, [baseTitle, isLoading]);
}

/**
 * Hook for progress in title
 */
export function useProgressTitle(
  baseTitle: string,
  progress: number // 0-100
): void {
  useEffect(() => {
    const percentage = Math.round(progress);
    const progressBar = `[${'█'.repeat(Math.floor(percentage / 10))}${'░'.repeat(10 - Math.floor(percentage / 10))}]`;
    document.title = `${progressBar} ${percentage}% - ${baseTitle}`;
  }, [baseTitle, progress]);
}

/**
 * Hook for page visibility aware title
 */
export function useVisibilityTitle(
  visibleTitle: string,
  hiddenTitle?: string
): void {
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && hiddenTitle) {
        document.title = hiddenTitle;
      } else {
        document.title = visibleTitle;
      }
    };

    handleVisibilityChange();
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [visibleTitle, hiddenTitle]);
}

export default useDocumentTitle;
