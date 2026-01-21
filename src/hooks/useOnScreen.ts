import { useState, useEffect, useRef, RefObject } from 'react';

interface UseOnScreenOptions {
  root?: Element | null;
  rootMargin?: string;
  threshold?: number | number[];
  triggerOnce?: boolean;
}

/**
 * Hook para detectar se elemento está visível na tela
 * @param options - Opções do IntersectionObserver
 */
export function useOnScreen<T extends HTMLElement = HTMLElement>(
  options: UseOnScreenOptions = {}
): [RefObject<T>, boolean, IntersectionObserverEntry | null] {
  const {
    root = null,
    rootMargin = '0px',
    threshold = 0,
    triggerOnce = false,
  } = options;

  const ref = useRef<T>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([observerEntry]) => {
        setIsIntersecting(observerEntry.isIntersecting);
        setEntry(observerEntry);

        // Se triggerOnce e elemento está visível, desconectar
        if (triggerOnce && observerEntry.isIntersecting) {
          observer.unobserve(element);
        }
      },
      { root, rootMargin, threshold }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [root, rootMargin, threshold, triggerOnce]);

  return [ref, isIntersecting, entry];
}

/**
 * Hook para lazy loading de conteúdo
 */
export function useLazyLoad<T extends HTMLElement = HTMLElement>(
  callback: () => void,
  options: UseOnScreenOptions = {}
): RefObject<T> {
  const [ref, isIntersecting] = useOnScreen<T>({ ...options, triggerOnce: true });
  const hasLoaded = useRef(false);

  useEffect(() => {
    if (isIntersecting && !hasLoaded.current) {
      hasLoaded.current = true;
      callback();
    }
  }, [isIntersecting, callback]);

  return ref;
}

/**
 * Hook para infinite scroll
 */
export function useInfiniteScroll<T extends HTMLElement = HTMLElement>(
  callback: () => void,
  options: UseOnScreenOptions & {
    enabled?: boolean;
  } = {}
): RefObject<T> {
  const { enabled = true, ...observerOptions } = options;
  const [ref, isIntersecting] = useOnScreen<T>(observerOptions);
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (isIntersecting && enabled) {
      callbackRef.current();
    }
  }, [isIntersecting, enabled]);

  return ref;
}

/**
 * Hook para animar ao entrar na tela
 */
export function useAnimateOnScroll<T extends HTMLElement = HTMLElement>(
  options: UseOnScreenOptions = {}
): [RefObject<T>, boolean] {
  const [ref, isIntersecting] = useOnScreen<T>({
    ...options,
    threshold: options.threshold ?? 0.1,
  });
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    if (isIntersecting && !hasAnimated) {
      setHasAnimated(true);
    }
  }, [isIntersecting, hasAnimated]);

  return [ref, hasAnimated];
}

/**
 * Hook para tracking de visibilidade (analytics)
 */
export function useVisibilityTracking<T extends HTMLElement = HTMLElement>(
  onVisible: () => void,
  options: UseOnScreenOptions & {
    minVisibleTime?: number; // tempo mínimo em ms
  } = {}
): RefObject<T> {
  const { minVisibleTime = 1000, ...observerOptions } = options;
  const [ref, isIntersecting] = useOnScreen<T>(observerOptions);
  const hasTracked = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (isIntersecting && !hasTracked.current) {
      timerRef.current = setTimeout(() => {
        hasTracked.current = true;
        onVisible();
      }, minVisibleTime);
    } else {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [isIntersecting, minVisibleTime, onVisible]);

  return ref;
}

/**
 * Hook para parallax simples
 */
export function useParallax<T extends HTMLElement = HTMLElement>(
  speed: number = 0.5
): [RefObject<T>, { y: number }] {
  const ref = useRef<T>(null);
  const [offset, setOffset] = useState({ y: 0 });

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleScroll = () => {
      const rect = element.getBoundingClientRect();
      const scrolled = window.scrollY;
      const rate = scrolled * speed;
      
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        setOffset({ y: rate });
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [speed]);

  return [ref, offset];
}
