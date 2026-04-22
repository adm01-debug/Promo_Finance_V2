/**
 * Cobertura focada na telemetria do `useSsoOnboardingAudit` no fluxo
 * `/auth/corporate`. Cada cenário garante que `event_type`, `domain` e
 * `providers_count` (quando aplicável) são registrados no payload correto.
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

describe('useSsoOnboardingAudit · payload por cenário em /auth/corporate', () => {
  it('domínio sem providers: registra domain_resolved com domain e providers_count=0', async () => {
    kit.setResolver({ providers: [], autoRedirectProvider: null, domain: 'desconhecido.com' });
    renderPage();
    await kit.submitEmail('foo@desconhecido.com');

    const [resolved] = kit.callsByEvent('domain_resolved');
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
    kit.setResolver({ providers: [], autoRedirectProvider: null, domain: 'desconhecido.com' });
    renderPage();
    await kit.submitEmail('foo@desconhecido.com');

    fireEvent.click(await screen.findByRole('button', { name: /Continuar com senha/i }));

    const [fallback] = kit.callsByEvent('password_fallback_used');
    expect(fallback).toBeDefined();
    expect(fallback.email).toBe('foo@desconhecido.com');
    expect(fallback.context).toMatchObject({
      domain: 'desconhecido.com',
      after_error: false,
      after_cancel: false,
    });
  });

  it('domínio com 1 provider sem force: domain_resolved tem providers_count=1 e force_sso=false', async () => {
    kit.setResolver({ providers: [baseProvider], domain: 'acme.com' });
    renderPage();
    await kit.submitEmail('alice@acme.com');

    const [resolved] = kit.callsByEvent('domain_resolved');
    expect(resolved.context).toMatchObject({
      domain: 'acme.com',
      providers_count: 1,
      force_sso: false,
      auto_redirect_provider: null,
    });
  });

  it('manual_provider_selected propaga domain, providerId e nome do provider', async () => {
    kit.mocks.invoke.mockResolvedValue({
      data: { redirect_url: 'https://idp.acme/login', verifier: 'v', state: 's' },
      error: null,
    });
    kit.setResolver({ providers: [baseProvider], domain: 'acme.com' });
    renderPage();
    await kit.submitEmail('alice@acme.com');

    await kit.clickProvider();
    await waitFor(() => expect(kit.getHref()).toBe('https://idp.acme/login'));

    const [manual] = kit.callsByEvent('manual_provider_selected');
    expect(manual.providerId).toBe('prov-1');
    expect(manual.context).toMatchObject({
      domain: 'acme.com',
      provider_nome: 'Acme SSO',
      provider_tipo: 'oidc',
    });

    const [dispatched] = kit.callsByEvent('redirect_dispatched');
    expect(dispatched.providerId).toBe('prov-1');
    expect(dispatched.context).toMatchObject({ domain: 'acme.com', provider_nome: 'Acme SSO' });
  });

  it('múltiplos providers: providers_count reflete o total e force_sso=true quando há autoRedirectProvider', async () => {
    const second = { ...baseProvider, id: 'prov-2', nome: 'Acme Backup', ordem: 1 };
    kit.setResolver({
      providers: [forceProvider, second],
      autoRedirectProvider: forceProvider,
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

    const [resolved] = kit.callsByEvent('domain_resolved');
    expect(resolved.context).toMatchObject({
      domain: 'acme.com',
      providers_count: 2,
      force_sso: true,
      auto_redirect_provider: 'Acme SSO',
    });

    const [auto] = kit.callsByEvent('auto_redirect_started');
    expect(auto).toBeDefined();
    expect(auto.providerId).toBe('prov-force');
    expect(auto.context).toMatchObject({ domain: 'acme.com', provider_nome: 'Acme SSO' });
  });

  it('auto_redirect_cancelled inclui domain e a fase do cancelamento', async () => {
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

      const [cancelled] = kit.callsByEvent('auto_redirect_cancelled');
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
    kit.mocks.invoke.mockResolvedValue({ data: null, error: new Error('IdP indisponível') });
    kit.setResolver({ providers: [baseProvider], domain: 'acme.com' });
    renderPage();
    await kit.submitEmail('dave@acme.com');
    await kit.clickProvider();

    const [failed] = kit.callsByEvent('redirect_failed');
    expect(failed).toBeDefined();
    expect(failed.success).toBe(false);
    expect(failed.errorMessage).toMatch(/IdP indisponível/);
    expect(failed.providerId).toBe('prov-1');
    expect(failed.context).toMatchObject({ domain: 'acme.com', provider_nome: 'Acme SSO' });

    fireEvent.click(screen.getByRole('button', { name: /Continuar com senha/i }));
    const [fallback] = kit.callsByEvent('password_fallback_used');
    expect(fallback.context).toMatchObject({
      domain: 'acme.com',
      after_error: true,
    });
  });
});
