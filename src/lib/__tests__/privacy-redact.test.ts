import { describe, expect, it, vi } from 'vitest';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: { onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }) },
    from: () => ({ insert: async () => ({ error: null }) }),
    functions: { invoke: async () => ({ data: null, error: null }) },
  },
}));
vi.mock('@/config/env', () => ({ env: { VITE_SUPABASE_URL: 'https://x.test' } }));
vi.mock('web-vitals', () => ({
  onCLS: vi.fn(),
  onINP: vi.fn(),
  onLCP: vi.fn(),
  onFCP: vi.fn(),
  onTTFB: vi.fn(),
}));

import { redactPath } from '@/lib/error-tracking';
import { sanitizeBreadcrumbData } from '@/lib/telemetry';

describe('redactPath', () => {
  it('redige token de convite e contador no path', () => {
    expect(redactPath('/convite/TOK123_SECRET')).toBe('/convite/[redacted]');
    expect(redactPath('/contador/ABC-t0k3n')).toBe('/contador/[redacted]');
    expect(redactPath('/Convite/TOK/extra')).toBe('/Convite/[redacted]/extra');
  });

  it('decodifica URL-encoding antes de redigir (?redirect=%2Fconvite%2F)', () => {
    expect(redactPath('/auth?redirect=%2Fconvite%2FTOK123')).toBe('/auth');
  });

  it('remove query e hash por completo (busca, CPF, magic link)', () => {
    expect(redactPath('/clientes?busca=123.456.789-00')).toBe('/clientes');
    expect(redactPath('/pagina#ancora')).toBe('/pagina');
    expect(redactPath('https://app.promo-finance.com/convite/TOK?x=1#y')).toBe(
      'https://app.promo-finance.com/convite/[redacted]'
    );
  });

  it('preserva paths sem segredo', () => {
    expect(redactPath('/dashboard')).toBe('/dashboard');
    expect(redactPath('/convites')).toBe('/convites');
  });
});

describe('sanitizeBreadcrumbData', () => {
  it('redige chaves de URL incluindo valor absoluto, query e aninhado', () => {
    const out = sanitizeBreadcrumbData({
      url: 'https://app.promo-finance.com/convite/TOK?ok=1',
      pathname: '/convite/TOK',
      search: '?redirect=/convite/TOK',
      state: { to: '/convite/TOK', other: 1 },
      outra: 'sem toque',
    });
    expect(out?.url).toBe('https://app.promo-finance.com/convite/[redacted]');
    expect(out?.pathname).toBe('/convite/[redacted]');
    // search é chave de URL: query removida junto
    expect(out?.search).toBe('');
    const state = out?.state as Record<string, unknown>;
    expect(state.to).toBe('/convite/[redacted]');
    expect(state.other).toBe(1);
    expect(out?.outra).toBe('sem toque');
  });
});
