/**
 * Cobertura de UI do fluxo `/auth/corporate`: garante que os CTAs
 * "Continuar com senha", "Cancelar redirecionamento" e "Tentar novamente"
 * aparecem (e desaparecem) nos momentos corretos de cada cenário.
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

describe('/auth/corporate · CTAs aparecem nos momentos corretos', () => {
  it('estado inicial: não exibe nenhum dos CTAs contextuais', () => {
    renderPage();
    expect(screen.queryByRole('button', { name: /Continuar com senha/i })).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Cancelar redirecionamento/i }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Tentar novamente/i })).not.toBeInTheDocument();
  });

  it('domínio sem providers: exibe "Continuar com senha" e nenhum dos demais', async () => {
    setResolver({ providers: [], autoRedirectProvider: null, domain: 'desconhecido.com' });
    renderPage();
    await submitEmail('foo@desconhecido.com');

    expect(
      await screen.findByRole('button', { name: /Continuar com senha/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Cancelar redirecionamento/i }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Tentar novamente/i })).not.toBeInTheDocument();
  });

  it('domínio com provider sem force: NÃO mostra cancelar/tentar novamente, só lista o provider', async () => {
    setResolver({ providers: [baseProvider], domain: 'acme.com' });
    renderPage();
    await submitEmail('alice@acme.com');

    expect(
      await screen.findByRole('button', { name: /Entrar com Acme SSO/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Cancelar redirecionamento/i }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Tentar novamente/i })).not.toBeInTheDocument();
  });

  it('auto-redirect com force_sso: exibe "Cancelar redirecionamento" durante o countdown', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      const force = { ...baseProvider, id: 'prov-force', force_sso_for_domains: true };
      setResolver({ providers: [force], autoRedirectProvider: force, domain: 'acme.com' });
      renderPage();

      fireEvent.change(screen.getByLabelText(/E-mail corporativo/i), {
        target: { value: 'bob@acme.com' },
      });
      fireEvent.click(screen.getByRole('button', { name: /Continuar/i }));

      expect(
        await screen.findByRole('button', { name: /Cancelar redirecionamento e voltar/i }),
      ).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Tentar novamente/i })).not.toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it('cancelar countdown: remove "Cancelar redirecionamento" e revela escolha manual', async () => {
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

      await waitFor(() => {
        expect(
          screen.queryByRole('button', { name: /Cancelar redirecionamento/i }),
        ).not.toBeInTheDocument();
      });
      expect(
        screen.getByRole('button', { name: /Entrar com Acme SSO/i }),
      ).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it('falha no sso-initiate: exibe "Tentar novamente" e "Continuar com senha", oculta cancelar', async () => {
    hoisted.invokeMock.mockResolvedValue({ data: null, error: new Error('IdP indisponível') });
    setResolver({ providers: [baseProvider], domain: 'acme.com' });
    renderPage();
    await submitEmail('dave@acme.com');

    await act(async () => {
      fireEvent.click(await screen.findByRole('button', { name: /Entrar com Acme SSO/i }));
    });

    expect(
      await screen.findByText(/Não foi possível iniciar o login SSO/i),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Tentar novamente/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Continuar com senha/i })).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Cancelar redirecionamento/i }),
    ).not.toBeInTheDocument();
  });

  it('"Tentar novamente" reusa sso-initiate e remove a tela de erro em caso de sucesso', async () => {
    hoisted.invokeMock
      .mockResolvedValueOnce({ data: null, error: new Error('IdP indisponível') })
      .mockResolvedValueOnce({
        data: { redirect_url: 'https://idp.acme/retry', verifier: 'v', state: 's' },
        error: null,
      });
    setResolver({ providers: [baseProvider], domain: 'acme.com' });
    renderPage();
    await submitEmail('erin@acme.com');

    await act(async () => {
      fireEvent.click(await screen.findByRole('button', { name: /Entrar com Acme SSO/i }));
    });

    const retry = await screen.findByRole('button', { name: /Tentar novamente/i });
    await act(async () => {
      fireEvent.click(retry);
    });

    await waitFor(() => expect(hrefStore).toBe('https://idp.acme/retry'));
    expect(hoisted.invokeMock).toHaveBeenCalledTimes(2);
  });

  it('"Continuar com senha" no estado de erro navega para /auth com o e-mail submetido', async () => {
    hoisted.invokeMock.mockResolvedValue({ data: null, error: new Error('IdP indisponível') });
    setResolver({ providers: [baseProvider], domain: 'acme.com' });
    renderPage();
    await submitEmail('frank@acme.com');

    await act(async () => {
      fireEvent.click(await screen.findByRole('button', { name: /Entrar com Acme SSO/i }));
    });

    fireEvent.click(await screen.findByRole('button', { name: /Continuar com senha/i }));
    expect(hoisted.mockNavigate).toHaveBeenCalledWith(
      `/auth?email=${encodeURIComponent('frank@acme.com')}`,
    );
  });
});
