/**
 * Test kit compartilhado para a suíte do `/auth/corporate`.
 *
 * Centraliza os mocks repetidos nos testes (supabase, sonner, react-router-dom,
 * useSsoDomainResolver, useSsoOnboardingAudit, framer-motion e IdpPresets) +
 * stub de `window.location.href` + helpers de render/interação.
 *
 * IMPORTANTE: chame `setupCorporateOnboardingMocks()` no TOP-LEVEL do arquivo
 * de teste (fora de `describe`/`beforeEach`). A função registra `vi.mock(...)`
 * que precisam rodar antes do `import` do componente sob teste.
 *
 * Exemplo de uso:
 * ```ts
 * import { setupCorporateOnboardingMocks } from './helpers/corporateOnboardingTestKit';
 * const kit = setupCorporateOnboardingMocks();
 * import CorporateOnboarding from '@/pages/auth/CorporateOnboarding';
 *
 * beforeEach(() => kit.reset());
 * afterEach(() => kit.restore());
 * ```
 */
import { vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, type RenderResult } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { ReactElement } from 'react';

export type SsoProvider = {
  id: string;
  nome: string;
  tipo: 'oidc' | 'saml';
  preset: string | null;
  allowed_domains: string[];
  force_sso_for_domains: boolean;
  ordem: number;
};

export type ResolverState = {
  providers: SsoProvider[];
  autoRedirectProvider: SsoProvider | null;
  loading: boolean;
  domain: string | null;
};

export type AuditCall = {
  eventType: string;
  email?: string | null;
  providerId?: string | null;
  context?: Record<string, unknown>;
  success?: boolean;
  errorCode?: string | null;
  errorMessage?: string | null;
};

export const baseProvider: SsoProvider = {
  id: 'prov-1',
  nome: 'Acme SSO',
  tipo: 'oidc',
  preset: null,
  allowed_domains: ['acme.com'],
  force_sso_for_domains: false,
  ordem: 0,
};

export const forceProvider: SsoProvider = {
  ...baseProvider,
  id: 'prov-force',
  force_sso_for_domains: true,
};

export interface CorporateOnboardingTestKit {
  /** Mocks expostos para asserts e configuração por teste. */
  mocks: {
    navigate: ReturnType<typeof vi.fn>;
    toastError: ReturnType<typeof vi.fn>;
    toastInfo: ReturnType<typeof vi.fn>;
    invoke: ReturnType<typeof vi.fn>;
    logEvent: ReturnType<typeof vi.fn>;
  };
  /** Define o estado retornado pelo `useSsoDomainResolver` mockado. */
  setResolver: (partial: Partial<ResolverState>) => void;
  /** Lê `window.location.href` capturado pelo stub. */
  getHref: () => string;
  /** Renderiza `CorporateOnboarding` dentro de `<MemoryRouter>`. */
  renderPage: (ui: ReactElement) => RenderResult;
  /** Helper: muda o input de e-mail e clica em "Continuar". */
  submitEmail: (value: string) => Promise<void>;
  /** Helper: clica no botão de SSO de um provider pelo nome. */
  clickProvider: (nome?: string) => Promise<void>;
  /** Filtra chamadas do `logEvent` por `eventType`. */
  callsByEvent: (eventType: string) => AuditCall[];
  /** Reseta mocks + resolver + href entre testes. Chame no `beforeEach`. */
  reset: () => void;
  /** Restaura `window.location` original. Chame no `afterEach`. */
  restore: () => void;
}

/**
 * Registra todos os `vi.mock` compartilhados e devolve um kit com os helpers.
 * Deve ser chamado no top-level do arquivo, ANTES de importar o componente.
 */
export function setupCorporateOnboardingMocks(): CorporateOnboardingTestKit {
  const hoisted = vi.hoisted(() => ({
    mockNavigate: vi.fn(),
    toastErrorMock: vi.fn(),
    toastInfoMock: vi.fn(),
    invokeMock: vi.fn(),
    logEventMock: vi.fn(),
    resolverState: {
      providers: [] as SsoProvider[],
      autoRedirectProvider: null as SsoProvider | null,
      loading: false,
      domain: null as string | null,
    } as ResolverState,
  }));

  vi.mock('react-router-dom', async () => {
    const actual =
      await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
    return { ...actual, useNavigate: () => hoisted.mockNavigate };
  });

  vi.mock('sonner', () => ({
    toast: {
      error: hoisted.toastErrorMock,
      info: hoisted.toastInfoMock,
      success: vi.fn(),
      warning: vi.fn(),
    },
  }));

  vi.mock('@/integrations/supabase/client', () => ({
    supabase: {
      functions: { invoke: (...args: unknown[]) => hoisted.invokeMock(...args) },
      rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    },
  }));

  vi.mock('@/hooks/useSsoDomainResolver', () => ({
    useSsoDomainResolver: (email: string) => {
      const dom = email.split('@')[1]?.toLowerCase().trim() ?? null;
      if (!dom) {
        return { providers: [], autoRedirectProvider: null, loading: false, domain: null };
      }
      return { ...hoisted.resolverState, domain: hoisted.resolverState.domain ?? dom };
    },
  }));

  vi.mock('@/hooks/useSsoOnboardingAudit', () => ({
    useSsoOnboardingAudit: () => ({ logEvent: hoisted.logEventMock }),
  }));

  vi.mock('@/components/admin/sso/IdpPresets', () => ({ IDP_PRESETS: [] }));

  vi.mock('framer-motion', () => ({
    motion: new Proxy(
      {},
      {
        get:
          () =>
          ({
            children,
            ...props
          }: { children?: React.ReactNode } & Record<string, unknown>) => {
            delete (props as Record<string, unknown>).initial;
            delete (props as Record<string, unknown>).animate;
            delete (props as Record<string, unknown>).exit;
            delete (props as Record<string, unknown>).transition;
            return <div {...props}>{children}</div>;
          },
      },
    ),
  }));

  // Stub de window.location.href entre testes.
  let hrefStore = '';
  const originalLocation = window.location;

  const setResolver = (partial: Partial<ResolverState>) => {
    hoisted.resolverState = {
      providers: [],
      autoRedirectProvider: null,
      loading: false,
      domain: null,
      ...partial,
    };
  };

  const renderPage = (ui: ReactElement) => render(<MemoryRouter>{ui}</MemoryRouter>);

  const submitEmail = async (value: string) => {
    fireEvent.change(screen.getByLabelText(/E-mail corporativo/i), { target: { value } });
    fireEvent.click(screen.getByRole('button', { name: /Continuar/i }));
    await act(async () => {
      await Promise.resolve();
    });
  };

  const clickProvider = async (nome = 'Acme SSO') => {
    await act(async () => {
      fireEvent.click(
        await screen.findByRole('button', { name: new RegExp(`Entrar com ${nome}`, 'i') }),
      );
    });
  };

  const callsByEvent = (eventType: string): AuditCall[] =>
    hoisted.logEventMock.mock.calls
      .map((c) => c[0] as AuditCall)
      .filter((c) => c.eventType === eventType);

  const reset = () => {
    vi.clearAllMocks();
    hrefStore = '';
    setResolver({});
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        ...originalLocation,
        origin: 'https://app.test',
        get href() {
          return hrefStore;
        },
        set href(v: string) {
          hrefStore = v;
        },
      },
    });
  };

  const restore = () => {
    Object.defineProperty(window, 'location', { configurable: true, value: originalLocation });
  };

  return {
    mocks: {
      navigate: hoisted.mockNavigate,
      toastError: hoisted.toastErrorMock,
      toastInfo: hoisted.toastInfoMock,
      invoke: hoisted.invokeMock,
      logEvent: hoisted.logEventMock,
    },
    setResolver,
    getHref: () => hrefStore,
    renderPage,
    submitEmail,
    clickProvider,
    callsByEvent,
    reset,
    restore,
  };
}

/**
 * Açúcar opcional: registra os hooks `beforeEach`/`afterEach` padrão.
 * Use quando o teste não precisar de setup extra além de reset/restore.
 */
export function useCorporateOnboardingTestLifecycle(kit: CorporateOnboardingTestKit) {
  beforeEach(() => kit.reset());
  afterEach(() => kit.restore());
}
