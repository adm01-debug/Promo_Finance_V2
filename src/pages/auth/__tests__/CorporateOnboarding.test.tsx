/**
 * Cobertura de testes do fluxo `/auth/corporate`.
 *
 * Foco: domínio sem match em `allowed_domains` (fallback para senha), domínio
 * com match (escolha manual + auto-redirect via force_sso), cancelamento e
 * tratamento de erro do `sso-initiate`.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// ---------- Mocks ----------

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

const toastErrorMock = vi.fn();
const toastInfoMock = vi.fn();
vi.mock('sonner', () => ({
  toast: { error: toastErrorMock, info: toastInfoMock, success: vi.fn(), warning: vi.fn() },
}));

const invokeMock = vi.fn();
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: { invoke: (...args: unknown[]) => invokeMock(...args) },
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
  },
}));

// Resolver controlável por teste
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
    if (!dom) {
      return { providers: [], autoRedirectProvider: null, loading: false, domain: null };
    }
    return { ...resolverState, domain: resolverState.domain ?? dom };
  },
}));

const logEventMock = vi.fn();
vi.mock('@/hooks/useSsoOnboardingAudit', () => ({
  useSsoOnboardingAudit: () => ({ logEvent: logEventMock }),
}));

// IdP presets — não precisamos do conteúdo real
vi.mock('@/components/admin/sso/IdpPresets', () => ({ IDP_PRESETS: [] }));

// framer-motion: renderiza children direto, sem animação
vi.mock('framer-motion', () => ({
  motion: new Proxy(
    {},
    {
      get:
        () =>
        ({ children, ...props }: { children?: React.ReactNode } & Record<string, unknown>) => {
          // strip motion-only props
          delete (props as Record<string, unknown>).initial;
          delete (props as Record<string, unknown>).animate;
          delete (props as Record<string, unknown>).exit;
          delete (props as Record<string, unknown>).transition;
          return <div {...props}>{children}</div>;
        },
    },
  ),
}));

// ---------- Import depois dos mocks ----------
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
  const input = screen.getByLabelText(/E-mail corporativo/i) as HTMLInputElement;
  fireEvent.change(input, { target: { value } });
  fireEvent.click(screen.getByRole('button', { name: /Continuar/i }));
  // permite o useEffect de auditoria/auto-redirect rodar
  await act(async () => {
    await Promise.resolve();
  });
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

// `window.location.href` precisa ser observável sem navegar de fato
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

describe('/auth/corporate — CorporateOnboarding', () => {
  it('renderiza o formulário inicial sem providers nem chamadas SSO', () => {
    renderPage();
    expect(screen.getByText(/Acesso corporativo/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/E-mail corporativo/i)).toBeInTheDocument();
    expect(invokeMock).not.toHaveBeenCalled();
  });

  it('domínio SEM match em allowed_domains: mostra fallback e navega para /auth com o e-mail', async () => {
    setResolver({ providers: [], autoRedirectProvider: null, domain: 'desconhecido.com' });
    renderPage();
    await submitEmail('foo@desconhecido.com');

    expect(
      await screen.findByText(/Nenhum provedor SSO encontrado para/i),
    ).toBeInTheDocument();
    expect(invokeMock).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /Continuar com senha/i }));
    expect(mockNavigate).toHaveBeenCalledWith(
      `/auth?email=${encodeURIComponent('foo@desconhecido.com')}`,
    );

    const events = logEventMock.mock.calls.map((c) => c[0].eventType);
    expect(events).toContain('domain_resolved');
    expect(events).toContain('password_fallback_used');
  });

  it('domínio COM match sem force_sso: lista providers e dispara invoke ao escolher manualmente', async () => {
    invokeMock.mockResolvedValueOnce({
      data: { redirect_url: 'https://idp.acme/login', verifier: 'v', state: 's' },
      error: null,
    });
    setResolver({ providers: [baseProvider], domain: 'acme.com' });
    renderPage();
    await submitEmail('alice@acme.com');

    // Sem auto-redirect: nenhuma tela de "Redirecionando" apareceu antes do click
    expect(screen.queryByText(/Redirecionando para/i)).not.toBeInTheDocument();

    const btn = await screen.findByRole('button', { name: /Entrar com Acme SSO/i });
    fireEvent.click(btn);

    await waitFor(() => expect(invokeMock).toHaveBeenCalledTimes(1));
    expect(invokeMock).toHaveBeenCalledWith('sso-initiate', {
      body: { provider_id: 'prov-1', redirect_to: 'https://app.test' },
    });
    await waitFor(() => expect(hrefStore).toBe('https://idp.acme/login'));
    expect(window.sessionStorage.setItem).toHaveBeenCalledWith('pkce:s', 'v');

    const events = logEventMock.mock.calls.map((c) => c[0].eventType);
    expect(events).toContain('manual_provider_selected');
    expect(events).toContain('redirect_dispatched');
  });

  it('auto-redirect com force_sso: dispara invoke após countdown e navega para o IdP', async () => {
    vi.useFakeTimers();
    try {
      invokeMock.mockResolvedValueOnce({
        data: { redirect_url: 'https://idp.acme/auto', verifier: 'v', state: 's' },
        error: null,
      });
      const force = { ...baseProvider, id: 'prov-force', force_sso_for_domains: true };
      setResolver({
        providers: [force],
        autoRedirectProvider: force,
        domain: 'acme.com',
      });
      renderPage();

      const input = screen.getByLabelText(/E-mail corporativo/i) as HTMLInputElement;
      fireEvent.change(input, { target: { value: 'bob@acme.com' } });
      fireEvent.click(screen.getByRole('button', { name: /Continuar/i }));

      // Tela de redirecionamento aparece
      expect(await screen.findByText(/Redirecionando para Acme SSO/i)).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /Cancelar redirecionamento e voltar/i }),
      ).toBeInTheDocument();

      // Avança countdown (3s)
      await act(async () => {
        vi.advanceTimersByTime(3500);
      });
      // Drena microtasks da promise do invoke
      await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
      });

      expect(invokeMock).toHaveBeenCalledWith(
        'sso-initiate',
        expect.objectContaining({ body: expect.objectContaining({ provider_id: 'prov-force' }) }),
      );
      expect(hrefStore).toBe('https://idp.acme/auto');

      const events = logEventMock.mock.calls.map((c) => c[0].eventType);
      expect(events).toContain('auto_redirect_started');
      expect(events).toContain('redirect_dispatched');
    } finally {
      vi.useRealTimers();
    }
  });

  it('cancelar durante o countdown impede o invoke e volta para a escolha manual', async () => {
    vi.useFakeTimers();
    try {
      const force = { ...baseProvider, id: 'prov-force', force_sso_for_domains: true };
      setResolver({
        providers: [force],
        autoRedirectProvider: force,
        domain: 'acme.com',
      });
      renderPage();

      const input = screen.getByLabelText(/E-mail corporativo/i) as HTMLInputElement;
      fireEvent.change(input, { target: { value: 'carol@acme.com' } });
      fireEvent.click(screen.getByRole('button', { name: /Continuar/i }));

      const cancelBtn = await screen.findByRole('button', {
        name: /Cancelar redirecionamento e voltar/i,
      });
      fireEvent.click(cancelBtn);

      // Avisa que cancelou e volta a mostrar a escolha manual
      expect(
        await screen.findByText(/Redirecionamento automático cancelado/i),
      ).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Entrar com Acme SSO/i })).toBeInTheDocument();

      // Mesmo passando o tempo do countdown, nada é invocado
      await act(async () => {
        vi.advanceTimersByTime(5000);
      });
      expect(invokeMock).not.toHaveBeenCalled();

      const events = logEventMock.mock.calls.map((c) => c[0].eventType);
      expect(events).toContain('auto_redirect_cancelled');
    } finally {
      vi.useRealTimers();
    }
  });

  it('falha no sso-initiate exibe tela de erro com retry e fallback para /auth', async () => {
    invokeMock.mockResolvedValueOnce({
      data: null,
      error: { message: 'IdP indisponível' },
    });
    setResolver({ providers: [baseProvider], domain: 'acme.com' });
    renderPage();
    await submitEmail('dave@acme.com');

    fireEvent.click(await screen.findByRole('button', { name: /Entrar com Acme SSO/i }));

    expect(
      await screen.findByText(/Não foi possível iniciar o login SSO/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/IdP indisponível/i)).toBeInTheDocument();

    // Retry: nova invocação que agora resolve
    invokeMock.mockResolvedValueOnce({
      data: { redirect_url: 'https://idp.acme/retry' },
      error: null,
    });
    fireEvent.click(screen.getByRole('button', { name: /Tentar novamente/i }));
    await waitFor(() => expect(invokeMock).toHaveBeenCalledTimes(2));

    // Fallback "Continuar com senha" — primeiro re-renderiza a tela de erro forçando estado limpo
    invokeMock.mockResolvedValueOnce({
      data: null,
      error: { message: 'IdP indisponível' },
    });
    setResolver({ providers: [baseProvider], domain: 'acme.com' });
    renderPage();
    await submitEmail('dave@acme.com');
    fireEvent.click(await screen.findByRole('button', { name: /Entrar com Acme SSO/i }));
    await screen.findByText(/Não foi possível iniciar o login SSO/i);

    fireEvent.click(screen.getByRole('button', { name: /Continuar com senha/i }));
    expect(mockNavigate).toHaveBeenCalledWith(
      `/auth?email=${encodeURIComponent('dave@acme.com')}`,
    );

    const events = logEventMock.mock.calls.map((c) => c[0].eventType);
    expect(events).toContain('redirect_failed');
    expect(events).toContain('password_fallback_used');
  });
});
