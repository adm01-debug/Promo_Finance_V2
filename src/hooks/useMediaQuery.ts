import { useState, useEffect, useCallback } from 'react';

/**
 * Hook para detectar media queries
 * @param query - Media query CSS
 */
export function useMediaQuery(query: string): boolean {
  const getMatches = useCallback((q: string): boolean => {
    if (typeof window !== 'undefined') {
      return window.matchMedia(q).matches;
    }
    return false;
  }, []);

  const [matches, setMatches] = useState<boolean>(() => getMatches(query));

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    
    const handleChange = () => {
      setMatches(mediaQuery.matches);
    };

    // Set initial value
    handleChange();

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      // Legacy browsers
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, [query]);

  return matches;
}

// Breakpoints padrão do Tailwind
const BREAKPOINTS = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

type Breakpoint = keyof typeof BREAKPOINTS;

/**
 * Hook para breakpoints do Tailwind
 */
export function useBreakpoint(breakpoint: Breakpoint): boolean {
  return useMediaQuery(`(min-width: ${BREAKPOINTS[breakpoint]})`);
}

/**
 * Hook para breakpoint atual
 */
export function useCurrentBreakpoint(): Breakpoint | 'xs' {
  const isSm = useMediaQuery(`(min-width: ${BREAKPOINTS.sm})`);
  const isMd = useMediaQuery(`(min-width: ${BREAKPOINTS.md})`);
  const isLg = useMediaQuery(`(min-width: ${BREAKPOINTS.lg})`);
  const isXl = useMediaQuery(`(min-width: ${BREAKPOINTS.xl})`);
  const is2Xl = useMediaQuery(`(min-width: ${BREAKPOINTS['2xl']})`);

  if (is2Xl) return '2xl';
  if (isXl) return 'xl';
  if (isLg) return 'lg';
  if (isMd) return 'md';
  if (isSm) return 'sm';
  return 'xs';
}

/**
 * Hook para detectar dispositivo móvel
 */
export function useIsMobile(): boolean {
  return !useMediaQuery('(min-width: 768px)');
}

/**
 * Hook para detectar tablet
 */
export function useIsTablet(): boolean {
  const isMinMd = useMediaQuery('(min-width: 768px)');
  const isMaxLg = useMediaQuery('(max-width: 1023px)');
  return isMinMd && isMaxLg;
}

/**
 * Hook para detectar desktop
 */
export function useIsDesktop(): boolean {
  return useMediaQuery('(min-width: 1024px)');
}

/**
 * Hook para preferência de movimento reduzido
 */
export function usePrefersReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)');
}

/**
 * Hook para preferência de tema escuro do sistema
 */
export function usePrefersDarkMode(): boolean {
  return useMediaQuery('(prefers-color-scheme: dark)');
}

/**
 * Hook para orientação do dispositivo
 */
export function useOrientation(): 'portrait' | 'landscape' {
  const isPortrait = useMediaQuery('(orientation: portrait)');
  return isPortrait ? 'portrait' : 'landscape';
}
