import { useState, useEffect, useRef } from 'react';

interface WindowSize {
  width: number;
  height: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
}

/**
 * Hook para obter tamanho da janela
 */
export function useWindowSize(): WindowSize {
  const [windowSize, setWindowSize] = useState<WindowSize>(() => {
    if (typeof window === 'undefined') {
      return {
        width: 0,
        height: 0,
        isMobile: false,
        isTablet: false,
        isDesktop: true,
      };
    }
    return getWindowSize();
  });

  useEffect(() => {
    function handleResize() {
      setWindowSize(getWindowSize());
    }

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowSize;
}

function getWindowSize(): WindowSize {
  const width = window.innerWidth;
  const height = window.innerHeight;
  return {
    width,
    height,
    isMobile: width < 640,
    isTablet: width >= 640 && width < 1024,
    isDesktop: width >= 1024,
  };
}

/**
 * Hook para obter valor anterior
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}

/**
 * Hook para comparar valor com anterior
 */
export function useValueChange<T>(
  value: T,
  onChange?: (current: T, previous: T | undefined) => void
): { current: T; previous: T | undefined; hasChanged: boolean } {
  const previous = usePrevious(value);
  const hasChanged = previous !== undefined && previous !== value;

  useEffect(() => {
    if (hasChanged && onChange) {
      onChange(value, previous);
    }
  }, [value, previous, hasChanged, onChange]);

  return { current: value, previous, hasChanged };
}

/**
 * Hook para detectar breakpoints
 */
export function useBreakpoint() {
  const { width } = useWindowSize();

  return {
    xs: width < 640,
    sm: width >= 640 && width < 768,
    md: width >= 768 && width < 1024,
    lg: width >= 1024 && width < 1280,
    xl: width >= 1280 && width < 1536,
    '2xl': width >= 1536,
    current: getBreakpointName(width),
  };
}

function getBreakpointName(width: number): string {
  if (width < 640) return 'xs';
  if (width < 768) return 'sm';
  if (width < 1024) return 'md';
  if (width < 1280) return 'lg';
  if (width < 1536) return 'xl';
  return '2xl';
}

/**
 * Hook para detectar orientação
 */
export function useOrientation() {
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>(() => {
    if (typeof window === 'undefined') return 'portrait';
    return window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
  });

  useEffect(() => {
    const handleResize = () => {
      setOrientation(
        window.innerHeight > window.innerWidth ? 'portrait' : 'landscape'
      );
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return orientation;
}

/**
 * Hook para scroll position
 */
export function useScrollPosition() {
  const [scrollPosition, setScrollPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleScroll = () => {
      setScrollPosition({
        x: window.scrollX,
        y: window.scrollY,
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return scrollPosition;
}

/**
 * Hook para verificar se passou de certo ponto no scroll
 */
export function useScrollPast(threshold: number): boolean {
  const { y } = useScrollPosition();
  return y > threshold;
}

export default useWindowSize;
