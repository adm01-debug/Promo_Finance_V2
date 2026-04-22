/**
 * Bordas do countdown de auto-redirect em `/auth/corporate`.
 *
 * O countdown usa setTimeout(1000) por tick e, ao chegar em 0, dispara
 * `supabase.functions.invoke('sso-initiate', ...)`. Estes testes garantem
 * de forma determinística (timers fake) que cancelar perto do limite —
 * inclusive nos últimos 200ms do último tick — impede o invoke.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { screen, fireEvent, act, waitFor } from '@testing-library/react';
import {
  setupCorporateOnboardingMocks,
  forceProvider,
} from './helpers/corporateOnboardingTestKit';

const kit = setupCorporateOnboardingMocks();

import CorporateOnboarding from '@/pages/auth/CorporateOnboarding';

const renderPage = () => kit.renderPage(<CorporateOnboarding />);

async function startAutoRedirect(email = 'edge@acme.com') {
  kit.setResolver({
    providers: [forceProvider],
    autoRedirectProvider: forceProvider,
    domain: 'acme.com',
  });
  renderPage();
  fireEvent.change(screen.getByLabelText(/E-mail corporativo/i), { target: { value: email } });
  fireEvent.click(screen.getByRole('button', { name: /Continuar/i }));
  await screen.findByRole('button', { name: /Cancelar redirecionamento e voltar/i });
}

beforeEach(() => {
  kit.reset();
  kit.mocks.invoke.mockResolvedValue({
    data: { redirect_url: 'https://idp.acme/done', verifier: 'v', state: 's' },
    error: null,
  });
  vi.useFakeTimers({ shouldAdvanceTime: true });
});

afterEach(() => {
  vi.useRealTimers();
  kit.restore();
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
    expect(kit.mocks.invoke).not.toHaveBeenCalled();
    expect(kit.getHref()).toBe('');
  });

  it('cancelar entre o 2º e 3º tick (~2.1s) impede o invoke quando o restante é avançado', async () => {
    await startAutoRedirect();
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
    expect(kit.mocks.invoke).not.toHaveBeenCalled();
    expect(kit.getHref()).toBe('');
  });

  it('cancelar nos últimos 200ms do último tick (2800ms) ainda impede o invoke', async () => {
    await startAutoRedirect();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2_800);
    });
    fireEvent.click(
      screen.getByRole('button', { name: /Cancelar redirecionamento e voltar/i }),
    );
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2_000);
    });
    expect(kit.mocks.invoke).not.toHaveBeenCalled();
    expect(kit.getHref()).toBe('');
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
    expect(kit.mocks.invoke).not.toHaveBeenCalled();
    expect(kit.getHref()).toBe('');
  });

  it('SEM cancelar: avançar 3000ms exatos dispara o invoke uma única vez e navega', async () => {
    await startAutoRedirect();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3_000);
    });
    await waitFor(() => expect(kit.mocks.invoke).toHaveBeenCalledTimes(1));
    expect(kit.mocks.invoke).toHaveBeenCalledWith(
      'sso-initiate',
      expect.objectContaining({ body: expect.objectContaining({ provider_id: 'prov-force' }) }),
    );
    await waitFor(() => expect(kit.getHref()).toBe('https://idp.acme/done'));
  });

  it('cancelar enquanto o invoke já está in-flight: ignora a resposta e não navega', async () => {
    let resolveInvoke!: (v: unknown) => void;
    kit.mocks.invoke.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveInvoke = resolve;
      }),
    );

    await startAutoRedirect();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3_000);
    });
    expect(kit.mocks.invoke).toHaveBeenCalledTimes(1);

    fireEvent.click(
      screen.getByRole('button', { name: /Cancelar redirecionamento e voltar/i }),
    );

    await act(async () => {
      resolveInvoke({
        data: { redirect_url: 'https://idp.acme/late', verifier: 'v', state: 's' },
        error: null,
      });
      await Promise.resolve();
    });

    expect(kit.getHref()).toBe('');
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
    expect(kit.mocks.invoke).not.toHaveBeenCalled();
    const cancelledEvents = kit.mocks.logEvent.mock.calls.filter(
      (c) => (c[0] as { eventType: string }).eventType === 'auto_redirect_cancelled',
    );
    expect(cancelledEvents.length).toBeGreaterThanOrEqual(1);
  });
});
