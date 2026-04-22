/**
 * Cobertura de testes do fluxo `/auth/corporate`.
 *
 * Foco: domínio sem match em `allowed_domains` (fallback para senha), domínio
 * com match (escolha manual + auto-redirect via force_sso), cancelamento e
 * tratamento de erro do `sso-initiate`.
 *
 * Mocks compartilhados vivem em `./helpers/corporateOnboardingTestKit`.
 */
import { describe, it, expect } from 'vitest';
import { screen, fireEvent, act, waitFor } from '@testing-library/react';
import {
  setupCorporateOnboardingMocks,
  useCorporateOnboardingTestLifecycle,
  baseProvider,
  forceProvider,
} from './helpers/corporateOnboardingTestKit';

const kit = setupCorporateOnboardingMocks();

import CorporateOnboarding from '@/pages/auth/CorporateOnboarding';

useCorporateOnboardingTestLifecycle(kit);

const renderPage = () => kit.renderPage(<CorporateOnboarding />);

describe('/auth/corporate — CorporateOnboarding', () => {
  it('renderiza o formulário inicial sem providers nem chamadas SSO', () => {
    renderPage();
    expect(screen.getByText(/Acesso corporativo/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/E-mail corporativo/i)).toBeInTheDocument();
    expect(kit.mocks.invoke).not.toHaveBeenCalled();
  });

  it('domínio SEM match em allowed_domains: mostra fallback e navega para /auth com o e-mail', async () => {
    kit.setResolver({ providers: [], autoRedirectProvider: null, domain: 'desconhecido.com' });
    renderPage();
    await kit.submitEmail('foo@desconhecido.com');

    expect(
      await screen.findByText(/Nenhum provedor SSO encontrado para/i),
    ).toBeInTheDocument();
    expect(kit.mocks.invoke).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /Continuar com senha/i }));
    expect(kit.mocks.navigate).toHaveBeenCalledWith(
      `/auth?email=${encodeURIComponent('foo@desconhecido.com')}`,
    );

    const events = kit.mocks.logEvent.mock.calls.map((c) => c[0].eventType);
    expect(events).toContain('domain_resolved');
    expect(events).toContain('password_fallback_used');
  });

  it('domínio COM match sem force_sso: lista providers e dispara invoke ao escolher manualmente', async () => {
    kit.mocks.invoke.mockResolvedValue({
      data: { redirect_url: 'https://idp.acme/login', verifier: 'v', state: 's' },
      error: null,
    });
    kit.setResolver({ providers: [baseProvider], domain: 'acme.com' });
    renderPage();
    await kit.submitEmail('alice@acme.com');

    expect(screen.queryByText(/Redirecionando para/i)).not.toBeInTheDocument();

    await kit.clickProvider();

    expect(kit.mocks.invoke).toHaveBeenCalledWith('sso-initiate', {
      body: { provider_id: 'prov-1', redirect_to: 'https://app.test' },
    });
    await waitFor(() => expect(kit.getHref()).toBe('https://idp.acme/login'));
    expect(window.sessionStorage.setItem).toHaveBeenCalledWith('pkce:s', 'v');

    const events = kit.mocks.logEvent.mock.calls.map((c) => c[0].eventType);
    expect(events).toContain('manual_provider_selected');
    expect(events).toContain('redirect_dispatched');
  });

  it('auto-redirect com force_sso: dispara invoke após countdown e navega para o IdP', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      kit.mocks.invoke.mockResolvedValue({
        data: { redirect_url: 'https://idp.acme/auto', verifier: 'v', state: 's' },
        error: null,
      });
      kit.setResolver({
        providers: [forceProvider],
        autoRedirectProvider: forceProvider,
        domain: 'acme.com',
      });
      renderPage();

      fireEvent.change(screen.getByLabelText(/E-mail corporativo/i), {
        target: { value: 'bob@acme.com' },
      });
      fireEvent.click(screen.getByRole('button', { name: /Continuar/i }));

      expect(await screen.findByText(/Redirecionando para Acme SSO/i)).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /Cancelar redirecionamento e voltar/i }),
      ).toBeInTheDocument();

      for (let i = 0; i < 5; i++) {
        await act(async () => {
          await vi.advanceTimersByTimeAsync(1000);
        });
      }

      await waitFor(() => expect(kit.mocks.invoke).toHaveBeenCalled());
      expect(kit.mocks.invoke).toHaveBeenCalledWith(
        'sso-initiate',
        expect.objectContaining({
          body: expect.objectContaining({ provider_id: 'prov-force' }),
        }),
      );
      await waitFor(() => expect(kit.getHref()).toBe('https://idp.acme/auto'));

      const events = kit.mocks.logEvent.mock.calls.map((c) => c[0].eventType);
      expect(events).toContain('auto_redirect_started');
      expect(events).toContain('redirect_dispatched');
    } finally {
      vi.useRealTimers();
    }
  });

  it('cancelar durante o countdown impede o invoke e volta para a escolha manual', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      kit.setResolver({
        providers: [forceProvider],
        autoRedirectProvider: forceProvider,
        domain: 'acme.com',
      });
      renderPage();

      fireEvent.change(screen.getByLabelText(/E-mail corporativo/i), {
        target: { value: 'carol@acme.com' },
      });
      fireEvent.click(screen.getByRole('button', { name: /Continuar/i }));

      const cancelBtn = await screen.findByRole('button', {
        name: /Cancelar redirecionamento e voltar/i,
      });
      fireEvent.click(cancelBtn);

      expect(
        await screen.findByText(/Redirecionamento automático cancelado/i),
      ).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Entrar com Acme SSO/i })).toBeInTheDocument();

      await act(async () => {
        await vi.advanceTimersByTimeAsync(5000);
      });
      expect(kit.mocks.invoke).not.toHaveBeenCalled();

      const events = kit.mocks.logEvent.mock.calls.map((c) => c[0].eventType);
      expect(events).toContain('auto_redirect_cancelled');
    } finally {
      vi.useRealTimers();
    }
  });

  it('falha no sso-initiate exibe tela de erro e permite fallback para /auth com senha', async () => {
    kit.mocks.invoke.mockResolvedValue({ data: null, error: new Error('IdP indisponível') });
    kit.setResolver({ providers: [baseProvider], domain: 'acme.com' });
    renderPage();
    await kit.submitEmail('dave@acme.com');
    await kit.clickProvider();

    expect(
      await screen.findByText(/Não foi possível iniciar o login SSO/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/IdP indisponível/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Tentar novamente/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Continuar com senha/i }));
    expect(kit.mocks.navigate).toHaveBeenCalledWith(
      `/auth?email=${encodeURIComponent('dave@acme.com')}`,
    );

    const events = kit.mocks.logEvent.mock.calls.map((c) => c[0].eventType);
    expect(events).toContain('redirect_failed');
    expect(events).toContain('password_fallback_used');
  });
});
