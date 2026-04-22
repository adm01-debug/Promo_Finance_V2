/**
 * Erro genérico no `sso-initiate` em `/auth/corporate`.
 *
 * Garante para diferentes formatos de erro (Error com mensagem, Error vazio,
 * objeto sem .message, string crua) que:
 *   1. A tela de erro aparece com título correto;
 *   2. O CTA "Tentar novamente" reusa o invoke;
 *   3. O CTA "Continuar com senha" navega para /auth?email=<e-mail submetido>
 *      preservando o domínio (e o lower-case aplicado pelo handleSubmit).
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

const baseProvider: Provider = {
  id: 'prov-1',
  nome: 'Acme SSO',
  tipo: 'oidc',
  preset: null,
  allowed_domains: ['acme.com'],
  force_sso_for_domains: false,
  ordem: 0,
};

let resolverState = {
  providers: [baseProvider] as Provider[],
  autoRedirectProvider: null as Provider | null,
  loading: false,
  domain: 'acme.com' as string | null,
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

async function clickProvider() {
  await act(async () => {
    fireEvent.click(await screen.findByRole('button', { name: /Entrar com Acme SSO/i }));
  });
}

let hrefStore = '';
const originalLocation = window.location;
beforeEach(() => {
  vi.clearAllMocks();
  hrefStore = '';
  resolverState = {
    providers: [baseProvider],
    autoRedirectProvider: null,
    loading: false,
    domain: 'acme.com',
  };
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

describe('/auth/corporate · erro genérico do sso-initiate', () => {
  it('Error com mensagem: mostra título de erro, mensagem, retry e CTA de senha', async () => {
    hoisted.invokeMock.mockResolvedValue({ data: null, error: new Error('IdP indisponível') });
    renderPage();
    await submitEmail('alice@acme.com');
    await clickProvider();

    expect(
      await screen.findByText(/Não foi possível iniciar o login SSO/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/IdP indisponível/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Tentar novamente/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Continuar com senha/i })).toBeInTheDocument();
  });

  it('Error sem mensagem: exibe fallback "Erro desconhecido" e mantém os CTAs', async () => {
    hoisted.invokeMock.mockResolvedValue({ data: null, error: new Error('') });
    renderPage();
    await submitEmail('bob@acme.com');
    await clickProvider();

    expect(
      await screen.findByText(/Não foi possível iniciar o login SSO/i),
    ).toBeInTheDocument();
    // O componente faz `e.message || 'Erro desconhecido'`. Mensagem vazia → fallback.
    expect(screen.getByText(/Erro desconhecido/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Tentar novamente/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Continuar com senha/i })).toBeInTheDocument();
  });

  it('erro do supabase como objeto plano (sem .message): cai no fallback "Erro desconhecido"', async () => {
    hoisted.invokeMock.mockResolvedValue({
      data: null,
      error: { name: 'FunctionsHttpError', code: 500 } as unknown as Error,
    });
    renderPage();
    await submitEmail('carol@acme.com');
    await clickProvider();

    expect(
      await screen.findByText(/Não foi possível iniciar o login SSO/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Erro desconhecido/i)).toBeInTheDocument();
  });

  it('resposta 200 sem redirect_url: trata como erro e mostra a tela de erro/CTA', async () => {
    hoisted.invokeMock.mockResolvedValue({ data: { foo: 'bar' }, error: null });
    renderPage();
    await submitEmail('dan@acme.com');
    await clickProvider();

    expect(
      await screen.findByText(/Não foi possível iniciar o login SSO/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Resposta inválida do provedor/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Tentar novamente/i })).toBeInTheDocument();
  });

  it('"Tentar novamente" com sucesso: limpa a tela de erro e navega para o IdP', async () => {
    hoisted.invokeMock
      .mockResolvedValueOnce({ data: null, error: new Error('Falha transitória') })
      .mockResolvedValueOnce({
        data: { redirect_url: 'https://idp.acme/ok', verifier: 'v', state: 's' },
        error: null,
      });
    renderPage();
    await submitEmail('erin@acme.com');
    await clickProvider();

    const retry = await screen.findByRole('button', { name: /Tentar novamente/i });
    await act(async () => {
      fireEvent.click(retry);
    });

    await waitFor(() => expect(hrefStore).toBe('https://idp.acme/ok'));
    expect(hoisted.invokeMock).toHaveBeenCalledTimes(2);
    expect(
      screen.queryByText(/Não foi possível iniciar o login SSO/i),
    ).not.toBeInTheDocument();
  });

  it('"Tentar novamente" que falha de novo mantém a tela de erro com nova mensagem', async () => {
    hoisted.invokeMock
      .mockResolvedValueOnce({ data: null, error: new Error('Primeira falha') })
      .mockResolvedValueOnce({ data: null, error: new Error('Segunda falha') });
    renderPage();
    await submitEmail('frank@acme.com');
    await clickProvider();

    const retry = await screen.findByRole('button', { name: /Tentar novamente/i });
    await act(async () => {
      fireEvent.click(retry);
    });

    expect(await screen.findByText(/Segunda falha/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Tentar novamente/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Continuar com senha/i })).toBeInTheDocument();
    expect(hoisted.invokeMock).toHaveBeenCalledTimes(2);
  });

  it('"Continuar com senha" navega para /auth com o e-mail submetido (lower-case) URL-encoded', async () => {
    hoisted.invokeMock.mockResolvedValue({ data: null, error: new Error('IdP indisponível') });
    renderPage();
    // O componente faz toLowerCase + trim no submit; passamos com case misto e espaços.
    await submitEmail('  Grace.Hopper@Acme.com  ');
    await clickProvider();

    await screen.findByText(/Não foi possível iniciar o login SSO/i);
    fireEvent.click(screen.getByRole('button', { name: /Continuar com senha/i }));

    expect(hoisted.mockNavigate).toHaveBeenCalledTimes(1);
    expect(hoisted.mockNavigate).toHaveBeenCalledWith(
      `/auth?email=${encodeURIComponent('grace.hopper@acme.com')}`,
    );
  });

  it('e-mail com caracteres especiais é URL-encoded ao navegar para /auth', async () => {
    hoisted.invokeMock.mockResolvedValue({ data: null, error: new Error('IdP indisponível') });
    renderPage();
    await submitEmail('user+tag@acme.com');
    await clickProvider();

    await screen.findByText(/Não foi possível iniciar o login SSO/i);
    fireEvent.click(screen.getByRole('button', { name: /Continuar com senha/i }));

    expect(hoisted.mockNavigate).toHaveBeenCalledWith(
      `/auth?email=${encodeURIComponent('user+tag@acme.com')}`,
    );
    // sanity: o `+` deve estar escapado como %2B na querystring
    const arg = hoisted.mockNavigate.mock.calls[0][0] as string;
    expect(arg).toContain('user%2Btag%40acme.com');
  });

  it('toast.error é chamado uma vez com o título "Falha ao iniciar SSO" e a mensagem como description', async () => {
    hoisted.invokeMock.mockResolvedValue({ data: null, error: new Error('IdP indisponível') });
    renderPage();
    await submitEmail('helen@acme.com');
    await clickProvider();

    await screen.findByText(/Não foi possível iniciar o login SSO/i);
    expect(hoisted.toastErrorMock).toHaveBeenCalledTimes(1);
    expect(hoisted.toastErrorMock).toHaveBeenCalledWith(
      'Falha ao iniciar SSO',
      expect.objectContaining({ description: 'IdP indisponível' }),
    );
  });
});
