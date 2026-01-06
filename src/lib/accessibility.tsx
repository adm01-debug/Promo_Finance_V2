/**
 * Accessibility Improvements - ARIA and keyboard navigation utilities
 * 
 * Provides utilities for improving accessibility across the app
 */

import { useEffect, useRef, useCallback } from 'react';

// Focus trap for modals and dialogs
export function useFocusTrap(isActive: boolean) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Focus first element when trap activates
    firstElement?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [isActive]);

  return containerRef;
}

// Announce to screen readers
export function useAnnounce() {
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const announcer = document.createElement('div');
    announcer.setAttribute('aria-live', priority);
    announcer.setAttribute('aria-atomic', 'true');
    announcer.setAttribute('class', 'sr-only');
    announcer.textContent = message;
    
    document.body.appendChild(announcer);
    
    setTimeout(() => {
      document.body.removeChild(announcer);
    }, 1000);
  }, []);

  return announce;
}

// Roving tabindex for menu/toolbar navigation
export function useRovingTabindex<T extends HTMLElement>(
  itemCount: number,
  orientation: 'horizontal' | 'vertical' | 'both' = 'vertical'
) {
  const containerRef = useRef<T>(null);
  const currentIndex = useRef(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const items = container.querySelectorAll<HTMLElement>('[data-roving-item]');
    
    const handleKeyDown = (e: KeyboardEvent) => {
      const prevKey = orientation === 'horizontal' ? 'ArrowLeft' : 'ArrowUp';
      const nextKey = orientation === 'horizontal' ? 'ArrowRight' : 'ArrowDown';
      
      let newIndex = currentIndex.current;

      if (e.key === nextKey || (orientation === 'both' && (e.key === 'ArrowDown' || e.key === 'ArrowRight'))) {
        e.preventDefault();
        newIndex = (currentIndex.current + 1) % itemCount;
      } else if (e.key === prevKey || (orientation === 'both' && (e.key === 'ArrowUp' || e.key === 'ArrowLeft'))) {
        e.preventDefault();
        newIndex = (currentIndex.current - 1 + itemCount) % itemCount;
      } else if (e.key === 'Home') {
        e.preventDefault();
        newIndex = 0;
      } else if (e.key === 'End') {
        e.preventDefault();
        newIndex = itemCount - 1;
      }

      if (newIndex !== currentIndex.current) {
        items[currentIndex.current]?.setAttribute('tabindex', '-1');
        items[newIndex]?.setAttribute('tabindex', '0');
        items[newIndex]?.focus();
        currentIndex.current = newIndex;
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [itemCount, orientation]);

  return containerRef;
}

// Prefers reduced motion hook
export function usePrefersReducedMotion() {
  const query = typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-reduced-motion: reduce)') 
    : null;
  
  return query?.matches ?? false;
}

// High contrast mode hook
export function usePrefersHighContrast() {
  const query = typeof window !== 'undefined'
    ? window.matchMedia('(prefers-contrast: more)')
    : null;
    
  return query?.matches ?? false;
}

// Generate unique IDs for accessibility
let idCounter = 0;
export function useAccessibleId(prefix = 'accessible') {
  const idRef = useRef<string | null>(null);
  
  if (idRef.current === null) {
    idRef.current = `${prefix}-${++idCounter}`;
  }
  
  return idRef.current;
}

// Accessible label helpers
export function getAriaLabel(label: string, isRequired?: boolean, isInvalid?: boolean) {
  let ariaLabel = label;
  if (isRequired) ariaLabel += ', obrigatório';
  if (isInvalid) ariaLabel += ', inválido';
  return ariaLabel;
}

// Screen reader only text component
export function ScreenReaderOnly({ children }: { children: React.ReactNode }) {
  return (
    <span className="sr-only">
      {children}
    </span>
  );
}

// Live region for dynamic content announcements
export function LiveRegion({ 
  children, 
  priority = 'polite' 
}: { 
  children: React.ReactNode; 
  priority?: 'polite' | 'assertive';
}) {
  return (
    <div
      aria-live={priority}
      aria-atomic="true"
      className="sr-only"
    >
      {children}
    </div>
  );
}

// Keyboard shortcut display
export function KeyboardShortcut({ keys }: { keys: string[] }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`Atalho: ${keys.join(' + ')}`}>
      {keys.map((key, i) => (
        <kbd
          key={i}
          className="px-1.5 py-0.5 text-xs font-mono bg-muted border rounded"
        >
          {key}
        </kbd>
      ))}
    </span>
  );
}
