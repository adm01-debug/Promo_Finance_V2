/**
 * Detecção de erro provável de CORS em `/auth/corporate`.
 *
 * Quando o navegador bloqueia a requisição ao endpoint da edge `sso-initiate`,
 * o SDK do Supabase tipicamente entrega:
 *   - `TypeError: Failed to fetch` (Chromium)
 *   - `TypeError: NetworkError when attempting to fetch resource` (Firefox)
 *   - `TypeError: Load failed` (Safari)
 *   - `FunctionsFetchError` (wrapper do supabase-js)
 * Em todos esses casos o componente deve mostrar uma mensagem específica
 * orientando o admin (em vez de propagar o `Failed to fetch` opaco).
 */
import { describe, it, expect } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import {
  setupCorporateOnboardingMocks,
  useCorporateOnboardingTestLifecycle,
  baseProvider,
} from './helpers/corporateOnboardingTestKit';

const kit = setupCorporateOnboardingMocks();

import CorporateOnboarding from '@/pages/auth/CorporateOnboarding';

useCorporateOnboardingTestLifecycle(kit);

const CORS_MESSAGE =
  /navegador bloqueou a requisição ao endpoint de SSO.*provável erro de CORS/i;

const renderPage = () => kit.renderPage(<CorporateOnboarding />);

async function triggerSsoWithError(error: unknown) {
  kit.setResolver({ providers: [baseProvider], domain: 'acme.com' });
  kit.mocks.invoke.mockResolvedValue({ data: null, error });
  renderPage();
  await kit.submitEmail('alice@acme.com');
  await kit.clickProvider();
  await screen.findByText(/Não foi possível iniciar o login SSO/i);
}

describe('/auth/corporate · detecção de erro provável de CORS', () => {
  it('TypeError "Failed to fetch" (Chromium) → mensagem específica de CORS', async () => {
    const err = new TypeError('Failed to fetch');
    await triggerSsoWithError(err);

    expect(screen.getByText(CORS_MESSAGE)).toBeInTheDocument();
    // A mensagem original NÃO deve vazar para o usuário final.
    expect(screen.queryByText(/^Failed to fetch$/)).not.toBeInTheDocument();
    expect(kit.mocks.toastError).toHaveBeenCalledWith(
      'Falha ao iniciar SSO',
      expect.objectContaining({ description: expect.stringMatching(CORS_MESSAGE) }),
    );
  });

  it('TypeError "NetworkError when attempting to fetch resource" (Firefox)', async () => {
    await triggerSsoWithError(
      new TypeError('NetworkError when attempting to fetch resource.'),
    );
    expect(screen.getByText(CORS_MESSAGE)).toBeInTheDocument();
  });

  it('TypeError "Load failed" (Safari)', async () => {
    await triggerSsoWithError(new TypeError('Load failed'));
    expect(screen.getByText(CORS_MESSAGE)).toBeInTheDocument();
  });

  it('FunctionsFetchError do supabase-js (name=FunctionsFetchError) → CORS', async () => {
    const err = new Error('Edge Function returned a non-2xx status code');
    err.name = 'FunctionsFetchError';
    await triggerSsoWithError(err);
    expect(screen.getByText(CORS_MESSAGE)).toBeInTheDocument();
  });

  it('mensagem que contém "CORS" explicitamente também é detectada', async () => {
    await triggerSsoWithError(new Error('Blocked by CORS policy'));
    expect(screen.getByText(CORS_MESSAGE)).toBeInTheDocument();
  });

  it('audita redirect_failed com a mensagem de CORS (não com a mensagem crua)', async () => {
    await triggerSsoWithError(new TypeError('Failed to fetch'));
    const failed = kit.mocks.logEvent.mock.calls
      .map((c) => c[0])
      .find((c) => c.eventType === 'redirect_failed');
    expect(failed).toBeDefined();
    expect(failed.success).toBe(false);
    expect(failed.errorMessage).toMatch(CORS_MESSAGE);
    expect(failed.errorMessage).not.toBe('Failed to fetch');
  });

  it('"Tentar novamente" após erro de CORS reusa o invoke e, se ok, navega ao IdP', async () => {
    kit.setResolver({ providers: [baseProvider], domain: 'acme.com' });
    // 1ª chamada: erro CORS. Demais: sucesso (tolerante ao double-invoke
    // conhecido em React 18 StrictMode + handlers).
    kit.mocks.invoke
      .mockResolvedValueOnce({ data: null, error: new TypeError('Failed to fetch') })
      .mockResolvedValue({
        data: { redirect_url: 'https://idp.acme/ok', verifier: 'v', state: 's' },
        error: null,
      });
    renderPage();
    await kit.submitEmail('bob@acme.com');
    await kit.clickProvider();

    expect(await screen.findByText(CORS_MESSAGE)).toBeInTheDocument();
    const callsBeforeRetry = kit.mocks.invoke.mock.calls.length;
    fireEvent.click(screen.getByRole('button', { name: /Tentar novamente/i }));

    await waitFor(() => expect(kit.getHref()).toBe('https://idp.acme/ok'));
    expect(kit.mocks.invoke.mock.calls.length).toBeGreaterThan(callsBeforeRetry);
    expect(screen.queryByText(CORS_MESSAGE)).not.toBeInTheDocument();
  });

  it('NÃO classifica como CORS um erro de aplicação genuíno (ex.: "provider_id inválido")', async () => {
    await triggerSsoWithError(new Error('provider_id inválido'));
    // Mensagem específica de CORS NÃO deve aparecer.
    expect(screen.queryByText(CORS_MESSAGE)).not.toBeInTheDocument();
    // A mensagem original deve ser preservada.
    expect(screen.getByText(/provider_id inválido/i)).toBeInTheDocument();
  });

  it('NÃO classifica "Resposta inválida do provedor" (200 sem redirect_url) como CORS', async () => {
    kit.setResolver({ providers: [baseProvider], domain: 'acme.com' });
    kit.mocks.invoke.mockResolvedValue({ data: { foo: 'bar' }, error: null });
    renderPage();
    await kit.submitEmail('carol@acme.com');
    await kit.clickProvider();

    await screen.findByText(/Não foi possível iniciar o login SSO/i);
    expect(screen.queryByText(CORS_MESSAGE)).not.toBeInTheDocument();
    expect(screen.getByText(/Resposta inválida do provedor/i)).toBeInTheDocument();
  });
});
