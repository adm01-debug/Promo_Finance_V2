import { useState, useEffect, useRef, RefObject } from 'react';

interface UseIntersectionObserverOptions extends IntersectionObserverInit {
  freezeOnceVisible?: boolean;
}

interface IntersectionResult {
  ref: RefObject<HTMLElement>;
  entry: IntersectionObserverEntry | null;
  isIntersecting: boolean;
  hasIntersected: boolean;
}

/**
 * Hook for observing element intersection with viewport
 */
export function useIntersectionObserver(
  options: UseIntersectionObserverOptions = {}
): IntersectionResult {
  const {
    threshold = 0,
    root = null,
    rootMargin = '0px',
    freezeOnceVisible = false,
  } = options;

  const ref = useRef<HTMLElement>(null);
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);
  const [hasIntersected, setHasIntersected] = useState(false);

  const frozen = freezeOnceVisible && hasIntersected;

  useEffect(() => {
    const element = ref.current;
    if (!element || frozen) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setEntry(entry);
        if (entry.isIntersecting) {
          setHasIntersected(true);
        }
      },
      { threshold, root, rootMargin }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [threshold, root, rootMargin, frozen]);

  return {
    ref: ref as RefObject<HTMLElement>,
    entry,
    isIntersecting: entry?.isIntersecting ?? false,
    hasIntersected,
  };
}

/**
 * Hook for lazy loading content when element is visible
 */
export function useLazyLoad<T>(
  loadFn: () => Promise<T>,
  options: UseIntersectionObserverOptions = {}
) {
  const { ref, isIntersecting, hasIntersected } = useIntersectionObserver({
    ...options,
    freezeOnceVisible: true,
  });

  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (hasIntersected && !data && !isLoading) {
      setIsLoading(true);
      loadFn()
        .then(setData)
        .catch(setError)
        .finally(() => setIsLoading(false));
    }
  }, [hasIntersected, data, isLoading, loadFn]);

  return { ref, data, isLoading, error, isIntersecting };
}

/**
 * Hook for infinite scroll
 */
export function useInfiniteScroll(
  loadMore: () => void,
  options: {
    hasMore: boolean;
    isLoading: boolean;
    threshold?: number;
    rootMargin?: string;
  }
) {
  const { hasMore, isLoading, threshold = 0, rootMargin = '100px' } = options;

  const { ref, isIntersecting } = useIntersectionObserver({
    threshold,
    rootMargin,
  });

  useEffect(() => {
    if (isIntersecting && hasMore && !isLoading) {
      loadMore();
    }
  }, [isIntersecting, hasMore, isLoading, loadMore]);

  return { ref };
}

/**
 * Hook for tracking scroll progress
 */
export function useScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollTop = window.scrollY;
      
      const scrollProgress = (scrollTop / (documentHeight - windowHeight)) * 100;
      setProgress(Math.min(100, Math.max(0, scrollProgress)));
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial calculation

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return progress;
}

/**
 * Hook for section visibility tracking
 */
export function useSectionVisibility(sectionIds: string[]) {
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set());
  const [activeSection, setActiveSection] = useState<string | null>(null);

  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    sectionIds.forEach((id) => {
      const element = document.getElementById(id);
      if (!element) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          setVisibleSections((prev) => {
            const next = new Set(prev);
            if (entry.isIntersecting) {
              next.add(id);
            } else {
              next.delete(id);
            }
            return next;
          });
        },
        { threshold: 0.5 }
      );

      observer.observe(element);
      observers.push(observer);
    });

    return () => {
      observers.forEach((observer) => observer.disconnect());
    };
  }, [sectionIds]);

  // Update active section based on visibility
  useEffect(() => {
    const visibleArray = Array.from(visibleSections);
    if (visibleArray.length > 0) {
      // Use the first visible section in the original order
      const firstVisible = sectionIds.find((id) => visibleSections.has(id));
      setActiveSection(firstVisible || null);
    } else {
      setActiveSection(null);
    }
  }, [visibleSections, sectionIds]);

  return {
    visibleSections,
    activeSection,
    isVisible: (id: string) => visibleSections.has(id),
  };
}

export default useIntersectionObserver;
