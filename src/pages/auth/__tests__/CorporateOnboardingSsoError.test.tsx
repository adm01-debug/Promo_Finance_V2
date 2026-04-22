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
import { describe, it, expect, beforeEach } from 'vitest';
import { screen, fireEvent, act, waitFor } from '@testing-library/react';
import {
  setupCorporateOnboardingMocks,
  useCorporateOnboardingTestLifecycle,
  baseProvider,
} from './helpers/corporateOnboardingTestKit';

const kit = setupCorporateOnboardingMocks();

import CorporateOnboarding from '@/pages/auth/CorporateOnboarding';

useCorporateOnboardingTestLifecycle(kit);

// Resolver padrão deste arquivo: 1 provider em acme.com sem force_sso.
beforeEach(() => {
  kit.setResolver({ providers: [baseProvider], domain: 'acme.com' });
});

const renderPage = () => kit.renderPage(<CorporateOnboarding />);

describe('/auth/corporate · erro genérico do sso-initiate', () => {
  it('Error com mensagem: mostra título de erro, mensagem, retry e CTA de senha', async () => {
    kit.mocks.invoke.mockResolvedValue({ data: null, error: new Error('IdP indisponível') });
    renderPage();
    await kit.submitEmail('alice@acme.com');
    await kit.clickProvider();

    expect(
      await screen.findByText(/Não foi possível iniciar o login SSO/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/IdP indisponível/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Tentar novamente/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Continuar com senha/i })).toBeInTheDocument();
  });

  it('Error sem mensagem: exibe fallback "Erro desconhecido" e mantém os CTAs', async () => {
    kit.mocks.invoke.mockResolvedValue({ data: null, error: new Error('') });
    renderPage();
    await kit.submitEmail('bob@acme.com');
    await kit.clickProvider();

    expect(
      await screen.findByText(/Não foi possível iniciar o login SSO/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Erro desconhecido/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Tentar novamente/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Continuar com senha/i })).toBeInTheDocument();
  });

  it('erro do supabase como objeto plano (sem .message): cai no fallback "Erro desconhecido"', async () => {
    kit.mocks.invoke.mockResolvedValue({
      data: null,
      error: { name: 'FunctionsHttpError', code: 500 } as unknown as Error,
    });
    renderPage();
    await kit.submitEmail('carol@acme.com');
    await kit.clickProvider();

    expect(
      await screen.findByText(/Não foi possível iniciar o login SSO/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Erro desconhecido/i)).toBeInTheDocument();
  });

  it('resposta 200 sem redirect_url: trata como erro e mostra a tela de erro/CTA', async () => {
    kit.mocks.invoke.mockResolvedValue({ data: { foo: 'bar' }, error: null });
    renderPage();
    await kit.submitEmail('dan@acme.com');
    await kit.clickProvider();

    expect(
      await screen.findByText(/Não foi possível iniciar o login SSO/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Resposta inválida do provedor/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Tentar novamente/i })).toBeInTheDocument();
  });

  it('"Tentar novamente" com sucesso: limpa a tela de erro e navega para o IdP', async () => {
    kit.mocks.invoke
      .mockResolvedValueOnce({ data: null, error: new Error('Falha transitória') })
      .mockResolvedValueOnce({
        data: { redirect_url: 'https://idp.acme/ok', verifier: 'v', state: 's' },
        error: null,
      });
    renderPage();
    await kit.submitEmail('erin@acme.com');
    await kit.clickProvider();

    const retry = await screen.findByRole('button', { name: /Tentar novamente/i });
    await act(async () => {
      fireEvent.click(retry);
    });

    await waitFor(() => expect(kit.getHref()).toBe('https://idp.acme/ok'));
    expect(kit.mocks.invoke).toHaveBeenCalledTimes(2);
    expect(
      screen.queryByText(/Não foi possível iniciar o login SSO/i),
    ).not.toBeInTheDocument();
  });

  it('"Tentar novamente" que falha de novo mantém a tela de erro com nova mensagem', async () => {
    kit.mocks.invoke
      .mockResolvedValueOnce({ data: null, error: new Error('Primeira falha') })
      .mockResolvedValueOnce({ data: null, error: new Error('Segunda falha') });
    renderPage();
    await kit.submitEmail('frank@acme.com');
    await kit.clickProvider();

    const retry = await screen.findByRole('button', { name: /Tentar novamente/i });
    await act(async () => {
      fireEvent.click(retry);
    });

    expect(await screen.findByText(/Segunda falha/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Tentar novamente/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Continuar com senha/i })).toBeInTheDocument();
    expect(kit.mocks.invoke).toHaveBeenCalledTimes(2);
  });

  it('"Continuar com senha" navega para /auth com o e-mail submetido (lower-case) URL-encoded', async () => {
    kit.mocks.invoke.mockResolvedValue({ data: null, error: new Error('IdP indisponível') });
    renderPage();
    await kit.submitEmail('  Grace.Hopper@Acme.com  ');
    await kit.clickProvider();

    await screen.findByText(/Não foi possível iniciar o login SSO/i);
    fireEvent.click(screen.getByRole('button', { name: /Continuar com senha/i }));

    expect(kit.mocks.navigate).toHaveBeenCalledTimes(1);
    expect(kit.mocks.navigate).toHaveBeenCalledWith(
      `/auth?email=${encodeURIComponent('grace.hopper@acme.com')}`,
    );
  });

  it('e-mail com caracteres especiais é URL-encoded ao navegar para /auth', async () => {
    kit.mocks.invoke.mockResolvedValue({ data: null, error: new Error('IdP indisponível') });
    renderPage();
    await kit.submitEmail('user+tag@acme.com');
    await kit.clickProvider();

    await screen.findByText(/Não foi possível iniciar o login SSO/i);
    fireEvent.click(screen.getByRole('button', { name: /Continuar com senha/i }));

    expect(kit.mocks.navigate).toHaveBeenCalledWith(
      `/auth?email=${encodeURIComponent('user+tag@acme.com')}`,
    );
    const arg = kit.mocks.navigate.mock.calls[0][0] as string;
    expect(arg).toContain('user%2Btag%40acme.com');
  });

  it('toast.error é chamado uma vez com o título "Falha ao iniciar SSO" e a mensagem como description', async () => {
    kit.mocks.invoke.mockResolvedValue({ data: null, error: new Error('IdP indisponível') });
    renderPage();
    await kit.submitEmail('helen@acme.com');
    await kit.clickProvider();

    await screen.findByText(/Não foi possível iniciar o login SSO/i);
    expect(kit.mocks.toastError).toHaveBeenCalledTimes(1);
    expect(kit.mocks.toastError).toHaveBeenCalledWith(
      'Falha ao iniciar SSO',
      expect.objectContaining({ description: 'IdP indisponível' }),
    );
  });
});
