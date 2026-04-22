/**
 * Cobertura focada na telemetria do `useSsoOnboardingAudit` no fluxo
 * `/auth/corporate`. Cada cenário garante que `event_type`, `domain` e
 * `providers_count` (quando aplicável) são registrados no payload correto.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// ---------- Mocks ----------

const hoisted = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  toastErrorMock: vi.fn(),
  toastInfoMock: vi.fn(),
  invokeMock: vi.fn(),
  logEventMock: vi.fn(),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
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

type ResolverState = {
  providers: Array<{
    id: string;
    nome: string;
    tipo: 'oidc' | 'saml';
    preset: string | null;
    allowed_domains: string[];
    force_sso_for_domains: boolean;
    ordem: number;
  }>;
  autoRedirectProvider: ResolverState['providers'][number] | null;
  loading: boolean;
  domain: string | null;
};

let resolverState: ResolverState = {
  providers: [],
  autoRedirectProvider: null,
  loading: false,
  domain: null,
};

vi.mock('@/hooks/useSsoDomainResolver', () => ({
  useSsoDomainResolver: (email: string) => {
    const dom = email.split('@')[1]?.toLowerCase().trim() ?? null;
    if (!dom) return { providers: [], autoRedirectProvider: null, loading: false, domain: null };
    return { ...resolverState, domain: resolverState.domain ?? dom };
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
        ({ children, ...props }: { children?: React.ReactNode } & Record<string, unknown>) => {
          delete (props as Record<string, unknown>).initial;
          delete (props as Record<string, unknown>).animate;
          delete (props as Record<string, unknown>).exit;
          delete (props as Record<string, unknown>).transition;
          return <div {...props}>{children}</div>;
        },
    },
  ),
}));

import CorporateOnboarding from '@/pages/auth/CorporateOnboarding';

// ---------- Helpers ----------

function setResolver(partial: Partial<ResolverState>) {
  resolverState = {
    providers: [],
    autoRedirectProvider: null,
    loading: false,
    domain: null,
    ...partial,
  };
}

function renderPage() {
  return render(
    <MemoryRouter>
      <CorporateOnboarding />
    </MemoryRouter>,
  );
}

async function submitEmail(value: string) {
  fireEvent.change(screen.getByLabelText(/E-mail corporativo/i), { target: { value } });
  fireEvent.click(screen.getByRole('button', { name: /Continuar/i }));
  await act(async () => {
    await Promise.resolve();
  });
}

type AuditCall = {
  eventType: string;
  email?: string | null;
  providerId?: string | null;
  context?: Record<string, unknown>;
  success?: boolean;
  errorCode?: string | null;
  errorMessage?: string | null;
};

function callsByEvent(eventType: string): AuditCall[] {
  return hoisted.logEventMock.mock.calls
    .map((c) => c[0] as AuditCall)
    .filter((c) => c.eventType === eventType);
}

const baseProvider = {
  id: 'prov-1',
  nome: 'Acme SSO',
  tipo: 'oidc' as const,
  preset: null,
  allowed_domains: ['acme.com'],
  force_sso_for_domains: false,
  ordem: 0,
};

let hrefStore = '';
const originalLocation = window.location;
beforeEach(() => {
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
});

afterEach(() => {
  Object.defineProperty(window, 'location', { configurable: true, value: originalLocation });
});

// ---------- Testes ----------

describe('useSsoOnboardingAudit · payload por cenário em /auth/corporate', () => {
  it('domínio sem providers: registra domain_resolved com domain e providers_count=0', async () => {
    setResolver({ providers: [], autoRedirectProvider: null, domain: 'desconhecido.com' });
    renderPage();
    await submitEmail('foo@desconhecido.com');

    const [resolved] = callsByEvent('domain_resolved');
    expect(resolved).toBeDefined();
    expect(resolved.email).toBe('foo@desconhecido.com');
    expect(resolved.context).toMatchObject({
      domain: 'desconhecido.com',
      providers_count: 0,
      force_sso: false,
      auto_redirect_provider: null,
    });
  });

  it('password_fallback_used após domínio sem providers carrega o domain no contexto', async () => {
    setResolver({ providers: [], autoRedirectProvider: null, domain: 'desconhecido.com' });
    renderPage();
    await submitEmail('foo@desconhecido.com');

    fireEvent.click(await screen.findByRole('button', { name: /Continuar com senha/i }));

    const [fallback] = callsByEvent('password_fallback_used');
    expect(fallback).toBeDefined();
    expect(fallback.email).toBe('foo@desconhecido.com');
    expect(fallback.context).toMatchObject({
      domain: 'desconhecido.com',
      after_error: false,
      after_cancel: false,
    });
  });

  it('domínio com 1 provider sem force: domain_resolved tem providers_count=1 e force_sso=false', async () => {
    setResolver({ providers: [baseProvider], domain: 'acme.com' });
    renderPage();
    await submitEmail('alice@acme.com');

    const [resolved] = callsByEvent('domain_resolved');
    expect(resolved.context).toMatchObject({
      domain: 'acme.com',
      providers_count: 1,
      force_sso: false,
      auto_redirect_provider: null,
    });
  });

  it('manual_provider_selected propaga domain, providerId e nome do provider', async () => {
    hoisted.invokeMock.mockResolvedValue({
      data: { redirect_url: 'https://idp.acme/login', verifier: 'v', state: 's' },
      error: null,
    });
    setResolver({ providers: [baseProvider], domain: 'acme.com' });
    renderPage();
    await submitEmail('alice@acme.com');

    await act(async () => {
      fireEvent.click(await screen.findByRole('button', { name: /Entrar com Acme SSO/i }));
    });
    await waitFor(() => expect(hrefStore).toBe('https://idp.acme/login'));

    const [manual] = callsByEvent('manual_provider_selected');
    expect(manual.providerId).toBe('prov-1');
    expect(manual.context).toMatchObject({
      domain: 'acme.com',
      provider_nome: 'Acme SSO',
      provider_tipo: 'oidc',
    });

    const [dispatched] = callsByEvent('redirect_dispatched');
    expect(dispatched.providerId).toBe('prov-1');
    expect(dispatched.context).toMatchObject({ domain: 'acme.com', provider_nome: 'Acme SSO' });
  });

  it('múltiplos providers: providers_count reflete o total e force_sso=true quando há autoRedirectProvider', async () => {
    const second = { ...baseProvider, id: 'prov-2', nome: 'Acme Backup', ordem: 1 };
    const force = { ...baseProvider, id: 'prov-force', force_sso_for_domains: true };
    setResolver({
      providers: [force, second],
      autoRedirectProvider: force,
      domain: 'acme.com',
    });
    renderPage();
    fireEvent.change(screen.getByLabelText(/E-mail corporativo/i), {
      target: { value: 'bob@acme.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Continuar/i }));
    await act(async () => {
      await Promise.resolve();
    });

    const [resolved] = callsByEvent('domain_resolved');
    expect(resolved.context).toMatchObject({
      domain: 'acme.com',
      providers_count: 2,
      force_sso: true,
      auto_redirect_provider: 'Acme SSO',
    });

    const [auto] = callsByEvent('auto_redirect_started');
    expect(auto).toBeDefined();
    expect(auto.providerId).toBe('prov-force');
    expect(auto.context).toMatchObject({ domain: 'acme.com', provider_nome: 'Acme SSO' });
  });

  it('auto_redirect_cancelled inclui domain e a fase do cancelamento', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      const force = { ...baseProvider, id: 'prov-force', force_sso_for_domains: true };
      setResolver({ providers: [force], autoRedirectProvider: force, domain: 'acme.com' });
      renderPage();

      fireEvent.change(screen.getByLabelText(/E-mail corporativo/i), {
        target: { value: 'carol@acme.com' },
      });
      fireEvent.click(screen.getByRole('button', { name: /Continuar/i }));

      const cancelBtn = await screen.findByRole('button', {
        name: /Cancelar redirecionamento e voltar/i,
      });
      fireEvent.click(cancelBtn);

      const [cancelled] = callsByEvent('auto_redirect_cancelled');
      expect(cancelled).toBeDefined();
      expect(cancelled.providerId).toBe('prov-force');
      expect(cancelled.context).toMatchObject({
        domain: 'acme.com',
        provider_nome: 'Acme SSO',
        phase: 'countdown',
      });
    } finally {
      vi.useRealTimers();
    }
  });

  it('redirect_failed registra success=false, errorMessage e domain do contexto', async () => {
    hoisted.invokeMock.mockResolvedValue({ data: null, error: new Error('IdP indisponível') });
    setResolver({ providers: [baseProvider], domain: 'acme.com' });
    renderPage();
    await submitEmail('dave@acme.com');

    await act(async () => {
      fireEvent.click(await screen.findByRole('button', { name: /Entrar com Acme SSO/i }));
    });

    const [failed] = callsByEvent('redirect_failed');
    expect(failed).toBeDefined();
    expect(failed.success).toBe(false);
    expect(failed.errorMessage).toMatch(/IdP indisponível/);
    expect(failed.providerId).toBe('prov-1');
    expect(failed.context).toMatchObject({ domain: 'acme.com', provider_nome: 'Acme SSO' });

    fireEvent.click(screen.getByRole('button', { name: /Continuar com senha/i }));
    const [fallback] = callsByEvent('password_fallback_used');
    expect(fallback.context).toMatchObject({
      domain: 'acme.com',
      after_error: true,
    });
  });
});
