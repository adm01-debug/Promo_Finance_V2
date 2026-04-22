/**
 * Bordas do countdown de auto-redirect em `/auth/corporate`.
 *
 * O countdown usa setTimeout(1000) por tick e, ao chegar em 0, dispara
 * `supabase.functions.invoke('sso-initiate', ...)`. Estes testes garantem
 * de forma determinística (timers fake) que cancelar perto do limite —
 * inclusive nos últimos 200ms do último tick — impede o invoke.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

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

type Provider = {
  id: string;
  nome: string;
  tipo: 'oidc' | 'saml';
  preset: string | null;
  allowed_domains: string[];
  force_sso_for_domains: boolean;
  ordem: number;
};

type ResolverState = {
  providers: Provider[];
  autoRedirectProvider: Provider | null;
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

const force: Provider = {
  id: 'prov-force',
  nome: 'Acme SSO',
  tipo: 'oidc',
  preset: null,
  allowed_domains: ['acme.com'],
  force_sso_for_domains: true,
  ordem: 0,
};

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

async function startAutoRedirect(email = 'edge@acme.com') {
  setResolver({ providers: [force], autoRedirectProvider: force, domain: 'acme.com' });
  renderPage();
  fireEvent.change(screen.getByLabelText(/E-mail corporativo/i), { target: { value: email } });
  fireEvent.click(screen.getByRole('button', { name: /Continuar/i }));
  // Aguarda o countdown aparecer antes de qualquer manipulação de timer.
  await screen.findByRole('button', { name: /Cancelar redirecionamento e voltar/i });
}

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
  hoisted.invokeMock.mockResolvedValue({
    data: { redirect_url: 'https://idp.acme/done', verifier: 'v', state: 's' },
    error: null,
  });
  vi.useFakeTimers({ shouldAdvanceTime: true });
});

afterEach(() => {
  vi.useRealTimers();
  Object.defineProperty(window, 'location', { configurable: true, value: originalLocation });
});

describe('/auth/corporate · bordas determinísticas do countdown (3s, ticks de 1000ms)', () => {
  it('cancelar imediatamente (0ms decorridos) impede o invoke mesmo após o tempo total passar', async () => {
    await startAutoRedirect();
    fireEvent.click(
      screen.getByRole('button', { name: /Cancelar redirecionamento e voltar/i }),
    );
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10_000);
    });
    expect(hoisted.invokeMock).not.toHaveBeenCalled();
    expect(hrefStore).toBe('');
  });

  it('cancelar entre o 2º e 3º tick (~2.1s) impede o invoke quando o restante é avançado', async () => {
    await startAutoRedirect();
    // Avança 2s — dois ticks completos, falta o último.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2_000);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });
    fireEvent.click(
      screen.getByRole('button', { name: /Cancelar redirecionamento e voltar/i }),
    );
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5_000);
    });
    expect(hoisted.invokeMock).not.toHaveBeenCalled();
    expect(hrefStore).toBe('');
  });

  it('cancelar nos últimos 200ms do último tick (2800ms) ainda impede o invoke', async () => {
    await startAutoRedirect();
    // 2800ms = dentro da janela final antes do 3º tick fechar em 3000ms.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2_800);
    });
    fireEvent.click(
      screen.getByRole('button', { name: /Cancelar redirecionamento e voltar/i }),
    );
    // Avança o restante do tick + folga grande para garantir que nada agendado dispara.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2_000);
    });
    expect(hoisted.invokeMock).not.toHaveBeenCalled();
    expect(hrefStore).toBe('');
  });

  it('cancelar exatamente em 2999ms (1ms antes do disparo) impede o invoke', async () => {
    await startAutoRedirect();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2_999);
    });
    fireEvent.click(
      screen.getByRole('button', { name: /Cancelar redirecionamento e voltar/i }),
    );
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2_000);
    });
    expect(hoisted.invokeMock).not.toHaveBeenCalled();
    expect(hrefStore).toBe('');
  });

  it('SEM cancelar: avançar 3000ms exatos dispara o invoke uma única vez e navega', async () => {
    await startAutoRedirect();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3_000);
    });
    await waitFor(() => expect(hoisted.invokeMock).toHaveBeenCalledTimes(1));
    expect(hoisted.invokeMock).toHaveBeenCalledWith(
      'sso-initiate',
      expect.objectContaining({ body: expect.objectContaining({ provider_id: 'prov-force' }) }),
    );
    await waitFor(() => expect(hrefStore).toBe('https://idp.acme/done'));
  });

  it('cancelar enquanto o invoke já está in-flight: ignora a resposta e não navega', async () => {
    // Atrasa a resposta do invoke para simular cancelamento durante a chamada.
    let resolveInvoke!: (v: unknown) => void;
    hoisted.invokeMock.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveInvoke = resolve;
      }),
    );

    await startAutoRedirect();
    // Deixa o countdown chegar a 0 e iniciar o invoke (que fica pendente).
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3_000);
    });
    expect(hoisted.invokeMock).toHaveBeenCalledTimes(1);

    // Cancela enquanto a Promise do invoke ainda está pendente.
    fireEvent.click(
      screen.getByRole('button', { name: /Cancelar redirecionamento e voltar/i }),
    );

    // Resolve a chamada DEPOIS do cancelamento. cancelRef já está `true`,
    // então o componente NÃO deve navegar nem fazer setSsoError.
    await act(async () => {
      resolveInvoke({
        data: { redirect_url: 'https://idp.acme/late', verifier: 'v', state: 's' },
        error: null,
      });
      await Promise.resolve();
    });

    expect(hrefStore).toBe('');
  });

  it('múltiplos cliques de cancelar não causam efeitos colaterais', async () => {
    await startAutoRedirect();
    const cancel = screen.getByRole('button', {
      name: /Cancelar redirecionamento e voltar/i,
    });
    fireEvent.click(cancel);
    fireEvent.click(cancel);
    fireEvent.click(cancel);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5_000);
    });
    expect(hoisted.invokeMock).not.toHaveBeenCalled();
    // Apenas um evento de cancelamento foi registrado (deduplicação no segundo é tolerada,
    // mas garantimos que ao menos um foi enviado e nenhum invoke disparou).
    const cancelledEvents = hoisted.logEventMock.mock.calls.filter(
      (c) => (c[0] as { eventType: string }).eventType === 'auto_redirect_cancelled',
    );
    expect(cancelledEvents.length).toBeGreaterThanOrEqual(1);
  });
});
