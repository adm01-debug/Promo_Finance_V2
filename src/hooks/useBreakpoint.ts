import { useState, useEffect, useCallback, useMemo } from 'react';

// Default breakpoints (Tailwind CSS defaults)
const DEFAULT_BREAKPOINTS = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

type BreakpointKey = keyof typeof DEFAULT_BREAKPOINTS;

interface UseBreakpointOptions {
  breakpoints?: Record<string, number>;
  ssr?: boolean;
  defaultBreakpoint?: string;
}

interface UseBreakpointReturn {
  breakpoint: string;
  width: number;
  isXs: boolean;
  isSm: boolean;
  isMd: boolean;
  isLg: boolean;
  isXl: boolean;
  is2xl: boolean;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isAbove: (breakpoint: string) => boolean;
  isBelow: (breakpoint: string) => boolean;
  isBetween: (min: string, max: string) => boolean;
}

export function useBreakpoint(options: UseBreakpointOptions = {}): UseBreakpointReturn {
  const {
    breakpoints = DEFAULT_BREAKPOINTS,
    ssr = false,
    defaultBreakpoint = 'md',
  } = options;

  // Get initial width
  const getWidth = useCallback(() => {
    if (typeof window === 'undefined') return 0;
    return window.innerWidth;
  }, []);

  // Get breakpoint from width
  const getBreakpoint = useCallback((width: number): string => {
    const entries = Object.entries(breakpoints).sort(([, a], [, b]) => b - a);
    for (const [key, minWidth] of entries) {
      if (width >= minWidth) {
        return key;
      }
    }
    return entries[entries.length - 1][0];
  }, [breakpoints]);

  // Initial state
  const [width, setWidth] = useState(() => {
    if (ssr || typeof window === 'undefined') {
      return breakpoints[defaultBreakpoint as BreakpointKey] || 768;
    }
    return getWidth();
  });

  const breakpoint = useMemo(() => getBreakpoint(width), [width, getBreakpoint]);

  // Handle resize
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let timeoutId: ReturnType<typeof setTimeout>;

    const handleResize = () => {
      // Debounce resize events
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setWidth(getWidth());
      }, 100);
    };

    // Set initial width
    setWidth(getWidth());

    window.addEventListener('resize', handleResize);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', handleResize);
    };
  }, [getWidth]);

  // Check if above a breakpoint
  const isAbove = useCallback((bp: string): boolean => {
    const bpWidth = breakpoints[bp as BreakpointKey];
    if (bpWidth === undefined) return false;
    return width >= bpWidth;
  }, [width, breakpoints]);

  // Check if below a breakpoint
  const isBelow = useCallback((bp: string): boolean => {
    const bpWidth = breakpoints[bp as BreakpointKey];
    if (bpWidth === undefined) return false;
    return width < bpWidth;
  }, [width, breakpoints]);

  // Check if between two breakpoints
  const isBetween = useCallback((min: string, max: string): boolean => {
    const minWidth = breakpoints[min as BreakpointKey];
    const maxWidth = breakpoints[max as BreakpointKey];
    if (minWidth === undefined || maxWidth === undefined) return false;
    return width >= minWidth && width < maxWidth;
  }, [width, breakpoints]);

  return {
    breakpoint,
    width,
    isXs: breakpoint === 'xs',
    isSm: breakpoint === 'sm',
    isMd: breakpoint === 'md',
    isLg: breakpoint === 'lg',
    isXl: breakpoint === 'xl',
    is2xl: breakpoint === '2xl',
    isMobile: width < (breakpoints.md ?? 768),
    isTablet: width >= (breakpoints.md ?? 768) && width < (breakpoints.lg ?? 1024),
    isDesktop: width >= (breakpoints.lg ?? 1024),
    isAbove,
    isBelow,
    isBetween,
  };
}

// Hook for responsive values
type ResponsiveValue<T> = T | Partial<Record<BreakpointKey | 'default', T>>;

export function useResponsiveValue<T>(value: ResponsiveValue<T>): T {
  const { breakpoint } = useBreakpoint();

  return useMemo(() => {
    if (typeof value !== 'object' || value === null) {
      return value as T;
    }

    const obj = value as Partial<Record<BreakpointKey | 'default', T>>;
    const breakpointOrder: (BreakpointKey | 'default')[] = ['2xl', 'xl', 'lg', 'md', 'sm', 'xs', 'default'];
    
    // Find the current breakpoint index
    const currentIndex = breakpointOrder.indexOf(breakpoint as BreakpointKey);
    
    // Look for a matching value, starting from current breakpoint and going down
    for (let i = currentIndex; i < breakpointOrder.length; i++) {
      const key = breakpointOrder[i];
      if (obj[key] !== undefined) {
        return obj[key] as T;
      }
    }

    // Return default or first defined value
    return obj.default ?? Object.values(obj)[0] as T;
  }, [value, breakpoint]);
}

// Hook for media query
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);

    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

// Hook for prefers color scheme
export function usePrefersColorScheme(): 'light' | 'dark' | 'no-preference' {
  const prefersDark = useMediaQuery('(prefers-color-scheme: dark)');
  const prefersLight = useMediaQuery('(prefers-color-scheme: light)');

  if (prefersDark) return 'dark';
  if (prefersLight) return 'light';
  return 'no-preference';
}

// Hook for prefers reduced motion
export function usePrefersReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)');
}

// Hook for orientation
export function useOrientation(): 'portrait' | 'landscape' {
  const isPortrait = useMediaQuery('(orientation: portrait)');
  return isPortrait ? 'portrait' : 'landscape';
}

// Hook for touch device detection
export function useIsTouchDevice(): boolean {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    const checkTouch = () => {
      setIsTouch(
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        ((navigator as Record<string, unknown>).msMaxTouchPoints as number) > 0
      );
    };

    checkTouch();
  }, []);

  return isTouch;
}

// Utility to create responsive styles object
export function createResponsiveStyles<T extends Record<string, unknown>>(
  styles: Record<BreakpointKey | 'default', Partial<T>>
): (breakpoint: string) => Partial<T> {
  return (breakpoint: string) => {
    const result: Partial<T> = {};
    const breakpointOrder: (BreakpointKey | 'default')[] = ['default', 'xs', 'sm', 'md', 'lg', 'xl', '2xl'];
    const currentIndex = breakpointOrder.indexOf(breakpoint as BreakpointKey);

    // Accumulate styles from default up to current breakpoint
    for (let i = 0; i <= currentIndex; i++) {
      const key = breakpointOrder[i];
      if (styles[key]) {
        Object.assign(result, styles[key]);
      }
    }

    return result;
  };
}

export type { BreakpointKey, ResponsiveValue };
export default useBreakpoint;
