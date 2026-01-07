// ============================================
// TESTING UTILITIES: Helpers para testes unitários
// Configurações e utilitários para testing-library
// ============================================

import React, { ReactElement, ReactNode } from 'react';
import { render, RenderOptions, RenderResult } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import userEvent from '@testing-library/user-event';

// ============================================
// TIPOS
// ============================================

interface WrapperProps {
  children: ReactNode;
}

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  route?: string;
  queryClient?: QueryClient;
  initialState?: Record<string, unknown>;
}

interface RenderWithUserResult extends RenderResult {
  user: ReturnType<typeof userEvent.setup>;
}

// ============================================
// QUERY CLIENT PARA TESTES
// ============================================

export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

// ============================================
// PROVIDERS WRAPPER
// ============================================

export function createWrapper(options: {
  queryClient?: QueryClient;
  route?: string;
} = {}) {
  const { queryClient = createTestQueryClient() } = options;

  return function Wrapper({ children }: WrapperProps) {
    return (
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          {children}
          <Toaster position="top-right" />
        </BrowserRouter>
      </QueryClientProvider>
    );
  };
}

// ============================================
// CUSTOM RENDER
// ============================================

export function customRender(
  ui: ReactElement,
  options: CustomRenderOptions = {}
): RenderResult {
  const { route = '/', queryClient, ...renderOptions } = options;

  // Set initial route
  window.history.pushState({}, 'Test page', route);

  const Wrapper = createWrapper({ queryClient, route });

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

// ============================================
// RENDER COM USER EVENTS
// ============================================

export function renderWithUser(
  ui: ReactElement,
  options: CustomRenderOptions = {}
): RenderWithUserResult {
  const user = userEvent.setup();
  const result = customRender(ui, options);

  return {
    ...result,
    user,
  };
}

// ============================================
// MOCKS ÚTEIS
// ============================================

// Mock do IntersectionObserver
export function mockIntersectionObserver(): void {
  const mockIntersectionObserver = jest.fn();
  mockIntersectionObserver.mockReturnValue({
    observe: () => null,
    unobserve: () => null,
    disconnect: () => null,
  });
  window.IntersectionObserver = mockIntersectionObserver;
}

// Mock do ResizeObserver
export function mockResizeObserver(): void {
  const mockResizeObserver = jest.fn();
  mockResizeObserver.mockReturnValue({
    observe: () => null,
    unobserve: () => null,
    disconnect: () => null,
  });
  window.ResizeObserver = mockResizeObserver;
}

// Mock do matchMedia
export function mockMatchMedia(matches: boolean = false): void {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
}

// Mock do localStorage
export function mockLocalStorage(): void {
  const store: Record<string, string> = {};
  
  const mockStorage = {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      Object.keys(store).forEach(key => delete store[key]);
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: jest.fn((index: number) => Object.keys(store)[index] || null),
  };

  Object.defineProperty(window, 'localStorage', {
    value: mockStorage,
    writable: true,
  });
}

// Mock do sessionStorage
export function mockSessionStorage(): void {
  const store: Record<string, string> = {};
  
  const mockStorage = {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      Object.keys(store).forEach(key => delete store[key]);
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: jest.fn((index: number) => Object.keys(store)[index] || null),
  };

  Object.defineProperty(window, 'sessionStorage', {
    value: mockStorage,
    writable: true,
  });
}

// ============================================
// ASYNC HELPERS
// ============================================

/**
 * Aguarda um tempo específico
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Aguarda condição ser verdadeira
 */
export async function waitForCondition(
  condition: () => boolean,
  options: { timeout?: number; interval?: number } = {}
): Promise<void> {
  const { timeout = 5000, interval = 100 } = options;
  const startTime = Date.now();

  while (!condition()) {
    if (Date.now() - startTime > timeout) {
      throw new Error('Timeout waiting for condition');
    }
    await sleep(interval);
  }
}

/**
 * Aguarda elemento aparecer
 */
export async function waitForElement(
  selector: string,
  options: { timeout?: number; container?: Element } = {}
): Promise<Element> {
  const { timeout = 5000, container = document } = options;
  const startTime = Date.now();

  while (true) {
    const element = container.querySelector(selector);
    if (element) return element;

    if (Date.now() - startTime > timeout) {
      throw new Error(`Element ${selector} not found within ${timeout}ms`);
    }

    await sleep(100);
  }
}

// ============================================
// FACTORY HELPERS
// ============================================

type FactoryFunction<T> = (overrides?: Partial<T>) => T;

/**
 * Cria uma factory para objetos de teste
 */
export function createFactory<T>(defaults: T): FactoryFunction<T> {
  return (overrides: Partial<T> = {}): T => ({
    ...defaults,
    ...overrides,
  });
}

/**
 * Cria múltiplos objetos de teste
 */
export function createMany<T>(
  factory: FactoryFunction<T>,
  count: number,
  overridesFn?: (index: number) => Partial<T>
): T[] {
  return Array.from({ length: count }, (_, i) => 
    factory(overridesFn?.(i))
  );
}

// ============================================
// ASSERTIONS CUSTOMIZADAS
// ============================================

/**
 * Verifica se elemento tem classes específicas
 */
export function hasClasses(element: Element, classes: string[]): boolean {
  return classes.every(cls => element.classList.contains(cls));
}

/**
 * Verifica se elemento está visível
 */
export function isVisible(element: Element): boolean {
  const style = window.getComputedStyle(element);
  return (
    style.display !== 'none' &&
    style.visibility !== 'hidden' &&
    style.opacity !== '0'
  );
}

/**
 * Verifica se elemento está focado
 */
export function isFocused(element: Element): boolean {
  return document.activeElement === element;
}

// ============================================
// SNAPSHOT HELPERS
// ============================================

/**
 * Limpa IDs dinâmicos para snapshots consistentes
 */
export function cleanDynamicIds(html: string): string {
  return html
    .replace(/id="[^"]*-\d+"/g, 'id="dynamic-id"')
    .replace(/aria-labelledby="[^"]*-\d+"/g, 'aria-labelledby="dynamic-id"')
    .replace(/aria-describedby="[^"]*-\d+"/g, 'aria-describedby="dynamic-id"');
}

/**
 * Remove atributos de data-testid para snapshots mais limpos
 */
export function cleanTestIds(html: string): string {
  return html.replace(/data-testid="[^"]*"/g, '');
}

// ============================================
// EVENT HELPERS
// ============================================

/**
 * Cria evento de teclado
 */
export function createKeyboardEvent(
  type: 'keydown' | 'keyup' | 'keypress',
  key: string,
  options: Partial<KeyboardEventInit> = {}
): KeyboardEvent {
  return new KeyboardEvent(type, {
    key,
    bubbles: true,
    cancelable: true,
    ...options,
  });
}

/**
 * Simula arrastar e soltar
 */
export function simulateDragAndDrop(
  source: Element,
  target: Element
): void {
  const dataTransfer = new DataTransfer();

  source.dispatchEvent(new DragEvent('dragstart', {
    bubbles: true,
    dataTransfer,
  }));

  target.dispatchEvent(new DragEvent('dragover', {
    bubbles: true,
    dataTransfer,
  }));

  target.dispatchEvent(new DragEvent('drop', {
    bubbles: true,
    dataTransfer,
  }));

  source.dispatchEvent(new DragEvent('dragend', {
    bubbles: true,
    dataTransfer,
  }));
}

// ============================================
// FORM HELPERS
// ============================================

/**
 * Preenche formulário
 */
export async function fillForm(
  container: Element,
  values: Record<string, string | boolean>,
  user: ReturnType<typeof userEvent.setup>
): Promise<void> {
  for (const [name, value] of Object.entries(values)) {
    const input = container.querySelector(`[name="${name}"]`) as HTMLInputElement;
    if (!input) continue;

    if (input.type === 'checkbox') {
      if (Boolean(value) !== input.checked) {
        await user.click(input);
      }
    } else if (input.type === 'radio') {
      if (value === input.value && !input.checked) {
        await user.click(input);
      }
    } else {
      await user.clear(input);
      if (value) {
        await user.type(input, String(value));
      }
    }
  }
}

/**
 * Submete formulário
 */
export async function submitForm(
  form: HTMLFormElement,
  user: ReturnType<typeof userEvent.setup>
): Promise<void> {
  const submitButton = form.querySelector('[type="submit"]');
  if (submitButton) {
    await user.click(submitButton);
  } else {
    form.dispatchEvent(new Event('submit', { bubbles: true }));
  }
}

// ============================================
// DEBUG HELPERS
// ============================================

/**
 * Log formatado do DOM
 */
export function logDOM(element: Element = document.body): void {
  console.log(element.innerHTML.replace(/></g, '>\n<'));
}

/**
 * Log de todos os elementos com role
 */
export function logRoles(element: Element = document.body): void {
  const roles: Record<string, Element[]> = {};
  
  element.querySelectorAll('[role]').forEach(el => {
    const role = el.getAttribute('role')!;
    if (!roles[role]) roles[role] = [];
    roles[role].push(el);
  });

  console.table(
    Object.entries(roles).map(([role, elements]) => ({
      role,
      count: elements.length,
      examples: elements.slice(0, 3).map(el => el.textContent?.slice(0, 30)),
    }))
  );
}

// ============================================
// ACCESSIBILITY HELPERS
// ============================================

/**
 * Verifica acessibilidade básica do elemento
 */
export function checkBasicA11y(element: Element): {
  hasRole: boolean;
  hasAriaLabel: boolean;
  hasFocusableChildren: boolean;
  issues: string[];
} {
  const issues: string[] = [];
  
  const hasRole = element.hasAttribute('role');
  const hasAriaLabel = element.hasAttribute('aria-label') || 
                       element.hasAttribute('aria-labelledby');
  
  const focusableSelectors = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
  const hasFocusableChildren = element.querySelector(focusableSelectors) !== null;

  // Check images
  element.querySelectorAll('img').forEach(img => {
    if (!img.hasAttribute('alt')) {
      issues.push(`Image missing alt: ${img.src.slice(-30)}`);
    }
  });

  // Check buttons without text
  element.querySelectorAll('button').forEach(button => {
    if (!button.textContent?.trim() && !button.hasAttribute('aria-label')) {
      issues.push('Button without accessible name');
    }
  });

  // Check form inputs
  element.querySelectorAll('input, select, textarea').forEach(input => {
    if (!input.hasAttribute('id') && !input.hasAttribute('aria-label')) {
      issues.push('Form input without accessible label');
    }
  });

  return { hasRole, hasAriaLabel, hasFocusableChildren, issues };
}

// Re-export testing-library utilities
export * from '@testing-library/react';
export { userEvent };
