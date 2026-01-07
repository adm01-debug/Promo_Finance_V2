// ============================================
// ACCESSIBILITY UTILITIES: Ferramentas para acessibilidade
// Helpers e hooks para melhorar a acessibilidade
// ============================================

import React, { useCallback, useEffect, useRef, useState } from 'react';

// ============================================
// TIPOS
// ============================================

interface FocusTrapOptions {
  initialFocus?: HTMLElement | null;
  finalFocus?: HTMLElement | null;
  returnFocusOnDeactivate?: boolean;
}

interface AriaLiveOptions {
  politeness?: 'polite' | 'assertive' | 'off';
  timeout?: number;
}

// ============================================
// CONSTANTES
// ============================================

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  'audio[controls]',
  'video[controls]',
  '[contenteditable]:not([contenteditable="false"])',
  'details > summary:first-of-type',
].join(', ');

// ============================================
// FUNÇÕES UTILITÁRIAS
// ============================================

/**
 * Obtém todos os elementos focáveis dentro de um container
 */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
    .filter(el => {
      // Verifica se o elemento está visível
      const style = window.getComputedStyle(el);
      return (
        style.display !== 'none' &&
        style.visibility !== 'hidden' &&
        !el.hasAttribute('inert')
      );
    });
}

/**
 * Obtém o primeiro elemento focável
 */
export function getFirstFocusable(container: HTMLElement): HTMLElement | null {
  const elements = getFocusableElements(container);
  return elements[0] || null;
}

/**
 * Obtém o último elemento focável
 */
export function getLastFocusable(container: HTMLElement): HTMLElement | null {
  const elements = getFocusableElements(container);
  return elements[elements.length - 1] || null;
}

/**
 * Verifica se o elemento está focável
 */
export function isFocusable(element: HTMLElement): boolean {
  return element.matches(FOCUSABLE_SELECTOR);
}

/**
 * Move o foco para o próximo elemento focável
 */
export function focusNext(container: HTMLElement): void {
  const elements = getFocusableElements(container);
  const currentIndex = elements.indexOf(document.activeElement as HTMLElement);
  const nextIndex = (currentIndex + 1) % elements.length;
  elements[nextIndex]?.focus();
}

/**
 * Move o foco para o elemento anterior focável
 */
export function focusPrevious(container: HTMLElement): void {
  const elements = getFocusableElements(container);
  const currentIndex = elements.indexOf(document.activeElement as HTMLElement);
  const prevIndex = currentIndex <= 0 ? elements.length - 1 : currentIndex - 1;
  elements[prevIndex]?.focus();
}

// ============================================
// FOCUS TRAP
// ============================================

export class FocusTrap {
  private container: HTMLElement;
  private options: FocusTrapOptions;
  private previousActiveElement: Element | null = null;
  private isActive: boolean = false;

  constructor(container: HTMLElement, options: FocusTrapOptions = {}) {
    this.container = container;
    this.options = {
      returnFocusOnDeactivate: true,
      ...options,
    };
    this.handleKeyDown = this.handleKeyDown.bind(this);
  }

  activate(): void {
    if (this.isActive) return;
    
    this.isActive = true;
    this.previousActiveElement = document.activeElement;
    
    document.addEventListener('keydown', this.handleKeyDown);
    
    // Foca no elemento inicial ou primeiro focável
    const initialFocus = this.options.initialFocus || getFirstFocusable(this.container);
    if (initialFocus) {
      initialFocus.focus();
    }
  }

  deactivate(): void {
    if (!this.isActive) return;
    
    this.isActive = false;
    document.removeEventListener('keydown', this.handleKeyDown);
    
    // Retorna o foco ao elemento anterior
    if (
      this.options.returnFocusOnDeactivate &&
      this.previousActiveElement instanceof HTMLElement
    ) {
      const finalFocus = this.options.finalFocus || this.previousActiveElement;
      finalFocus.focus();
    }
  }

  private handleKeyDown(event: KeyboardEvent): void {
    if (event.key !== 'Tab') return;
    
    const focusable = getFocusableElements(this.container);
    if (focusable.length === 0) return;

    const firstFocusable = focusable[0];
    const lastFocusable = focusable[focusable.length - 1];

    if (event.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstFocusable) {
        event.preventDefault();
        lastFocusable.focus();
      }
    } else {
      // Tab
      if (document.activeElement === lastFocusable) {
        event.preventDefault();
        firstFocusable.focus();
      }
    }
  }
}

// ============================================
// HOOKS
// ============================================

/**
 * Hook para focus trap
 */
export function useFocusTrap(
  isActive: boolean,
  options: FocusTrapOptions = {}
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const trapRef = useRef<FocusTrap | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    if (isActive) {
      trapRef.current = new FocusTrap(container, options);
      trapRef.current.activate();
    }

    return () => {
      trapRef.current?.deactivate();
      trapRef.current = null;
    };
  }, [isActive, options]);

  return containerRef;
}

/**
 * Hook para navegação por teclado em lista
 */
export function useRovingFocus<T extends HTMLElement = HTMLElement>(
  items: T[],
  options: {
    orientation?: 'horizontal' | 'vertical' | 'both';
    loop?: boolean;
    initialIndex?: number;
  } = {}
) {
  const { orientation = 'vertical', loop = true, initialIndex = 0 } = options;
  const [activeIndex, setActiveIndex] = useState(initialIndex);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      const { key } = event;
      let newIndex = activeIndex;

      const isHorizontal = orientation === 'horizontal' || orientation === 'both';
      const isVertical = orientation === 'vertical' || orientation === 'both';

      if (isVertical && key === 'ArrowDown') {
        event.preventDefault();
        newIndex = loop
          ? (activeIndex + 1) % items.length
          : Math.min(activeIndex + 1, items.length - 1);
      } else if (isVertical && key === 'ArrowUp') {
        event.preventDefault();
        newIndex = loop
          ? (activeIndex - 1 + items.length) % items.length
          : Math.max(activeIndex - 1, 0);
      } else if (isHorizontal && key === 'ArrowRight') {
        event.preventDefault();
        newIndex = loop
          ? (activeIndex + 1) % items.length
          : Math.min(activeIndex + 1, items.length - 1);
      } else if (isHorizontal && key === 'ArrowLeft') {
        event.preventDefault();
        newIndex = loop
          ? (activeIndex - 1 + items.length) % items.length
          : Math.max(activeIndex - 1, 0);
      } else if (key === 'Home') {
        event.preventDefault();
        newIndex = 0;
      } else if (key === 'End') {
        event.preventDefault();
        newIndex = items.length - 1;
      }

      if (newIndex !== activeIndex) {
        setActiveIndex(newIndex);
        items[newIndex]?.focus();
      }
    },
    [activeIndex, items, loop, orientation]
  );

  return {
    activeIndex,
    setActiveIndex,
    handleKeyDown,
    getItemProps: (index: number) => ({
      tabIndex: index === activeIndex ? 0 : -1,
      onFocus: () => setActiveIndex(index),
    }),
  };
}

/**
 * Hook para anúncios de acessibilidade
 */
export function useAriaLive(options: AriaLiveOptions = {}) {
  const { politeness = 'polite', timeout = 5000 } = options;
  const [message, setMessage] = useState('');
  const timeoutRef = useRef<NodeJS.Timeout>();

  const announce = useCallback(
    (newMessage: string) => {
      // Limpa mensagem anterior
      setMessage('');
      
      // Pequeno delay para garantir que o screen reader detecte a mudança
      requestAnimationFrame(() => {
        setMessage(newMessage);
      });

      // Limpa após timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        setMessage('');
      }, timeout);
    },
    [timeout]
  );

  const clear = useCallback(() => {
    setMessage('');
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    message,
    announce,
    clear,
    ariaLiveProps: {
      role: 'status',
      'aria-live': politeness,
      'aria-atomic': true,
      className: 'sr-only',
      children: message,
    } as const,
  };
}

/**
 * Hook para detectar preferência de movimento reduzido
 */
export function usePrefersReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
}

/**
 * Hook para detectar preferência de alto contraste
 */
export function usePrefersHighContrast(): boolean {
  const [prefersHighContrast, setPrefersHighContrast] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-contrast: more)').matches;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-contrast: more)');
    
    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersHighContrast(event.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersHighContrast;
}

/**
 * Hook para skip links
 */
export function useSkipLinks(targets: { id: string; label: string }[]) {
  const handleSkipTo = useCallback((id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.focus();
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  return {
    targets,
    handleSkipTo,
    SkipLinks: () => (
      <nav aria-label="Skip links" className="sr-only focus-within:not-sr-only">
        <ul className="fixed top-0 left-0 z-[9999] flex flex-col gap-1 p-2 bg-background border shadow-lg">
          {targets.map(({ id, label }) => (
            <li key={id}>
              <a
                href={`#${id}`}
                onClick={(e) => {
                  e.preventDefault();
                  handleSkipTo(id);
                }}
                className="block px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    ),
  };
}

/**
 * Hook para gerenciar foco em modais
 */
export function useModalFocus(isOpen: boolean) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Salva o elemento focado atual
      previousFocusRef.current = document.activeElement as HTMLElement;
      
      // Foca no primeiro elemento focável do modal
      const modal = modalRef.current;
      if (modal) {
        const firstFocusable = getFirstFocusable(modal);
        if (firstFocusable) {
          firstFocusable.focus();
        } else {
          // Se não houver elemento focável, foca no próprio modal
          modal.setAttribute('tabindex', '-1');
          modal.focus();
        }
      }
    } else {
      // Retorna o foco ao elemento anterior
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    }
  }, [isOpen]);

  return modalRef;
}

// ============================================
// ARIA HELPERS
// ============================================

/**
 * Gera ID único para conexões ARIA
 */
let idCounter = 0;
export function generateAriaId(prefix: string = 'aria'): string {
  return `${prefix}-${++idCounter}`;
}

/**
 * Props para elemento que descreve outro
 */
export function describeWith(describedById: string) {
  return { 'aria-describedby': describedById };
}

/**
 * Props para elemento que rotula outro
 */
export function labelWith(labelledById: string) {
  return { 'aria-labelledby': labelledById };
}

/**
 * Props para região expandível
 */
export function expandable(isExpanded: boolean, controlsId: string) {
  return {
    'aria-expanded': isExpanded,
    'aria-controls': controlsId,
  };
}

/**
 * Props para checkbox/switch
 */
export function checkable(isChecked: boolean | 'mixed') {
  return { 'aria-checked': isChecked };
}

/**
 * Props para elemento selecionável
 */
export function selectable(isSelected: boolean) {
  return { 'aria-selected': isSelected };
}

/**
 * Props para elemento pressionável
 */
export function pressable(isPressed: boolean) {
  return { 'aria-pressed': isPressed };
}

/**
 * Props para elemento com estado de loading
 */
export function busy(isBusy: boolean) {
  return { 'aria-busy': isBusy };
}

/**
 * Props para elemento desabilitado
 */
export function disabled(isDisabled: boolean) {
  return { 'aria-disabled': isDisabled };
}

/**
 * Props para elemento oculto
 */
export function hidden(isHidden: boolean) {
  return { 'aria-hidden': isHidden };
}

/**
 * Props para elemento inválido
 */
export function invalid(isInvalid: boolean, errorId?: string) {
  return {
    'aria-invalid': isInvalid,
    ...(isInvalid && errorId ? { 'aria-errormessage': errorId } : {}),
  };
}

/**
 * Props para campo obrigatório
 */
export function required(isRequired: boolean) {
  return { 'aria-required': isRequired };
}

/**
 * Props para valor atual
 */
export function currentValue(type: 'page' | 'step' | 'location' | 'date' | 'time' | 'true') {
  return { 'aria-current': type };
}

// ============================================
// SCREEN READER UTILITIES
// ============================================

/**
 * Elemento visualmente oculto mas acessível para screen readers
 */
export const srOnlyStyles = {
  position: 'absolute' as const,
  width: '1px',
  height: '1px',
  padding: '0',
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap' as const,
  border: '0',
};

/**
 * Cria texto para screen reader
 */
export function srOnly(text: string): string {
  return text;
}

/**
 * Formata data para anúncio de screen reader
 */
export function formatDateForSR(date: Date, locale: string = 'pt-BR'): string {
  return new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

/**
 * Formata número para anúncio de screen reader
 */
export function formatNumberForSR(
  number: number,
  options: Intl.NumberFormatOptions = {},
  locale: string = 'pt-BR'
): string {
  return new Intl.NumberFormat(locale, options).format(number);
}

/**
 * Formata moeda para anúncio de screen reader
 */
export function formatCurrencyForSR(
  amount: number,
  currency: string = 'BRL',
  locale: string = 'pt-BR'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount);
}
