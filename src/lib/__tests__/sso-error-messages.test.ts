import { describe, it, expect } from 'vitest';
import {
  inferSsoErrorCode,
  SSO_ERROR_MESSAGES,
  type SsoErrorCode,
} from '../sso-error-messages';

describe('SSO_ERROR_MESSAGES', () => {
  it('possui título, descrição e hint para todos os códigos', () => {
    const codes: SsoErrorCode[] = [
      'provider_not_found',
      'provider_disabled',
      'endpoint_missing',
      'invalid_provider_config',
      'network_error',
      'timeout',
      'unauthorized',
      'rate_limited',
      'missing_provider_id',
      'edge_function_error',
      'unknown',
    ];
    for (const code of codes) {
      const m = SSO_ERROR_MESSAGES[code];
      expect(m.title.length).toBeGreaterThan(3);
      expect(m.description.length).toBeGreaterThan(10);
      expect(m.hint.length).toBeGreaterThan(10);
    }
  });
});

describe('inferSsoErrorCode', () => {
  it.each([
    [null, 'unknown'],
    [undefined, 'unknown'],
    ['', 'unknown'],
    ['provider_not_found: X', 'provider_not_found'],
    ['Provider not found', 'provider_not_found'],
    ['Provedor não encontrado', 'provider_not_found'],
    ['Provider is disabled', 'provider_disabled'],
    ['inactive provider', 'provider_disabled'],
    ['sem end_session', 'endpoint_missing'],
    ['no end_session_endpoint', 'endpoint_missing'],
    ['invalid client_id', 'invalid_provider_config'],
    ['Failed to fetch', 'network_error'],
    ['ECONNREFUSED remote', 'network_error'],
    ['erro de rede', 'network_error'],
    ['Request timeout', 'timeout'],
    ['Tempo esgotado', 'timeout'],
    ['401 unauthorized', 'unauthorized'],
    ['Não autorizado', 'unauthorized'],
    ['429 too many requests', 'rate_limited'],
    ['missing_provider_id detected', 'missing_provider_id'],
    ['edge function 500 error', 'edge_function_error'],
    ['algo totalmente diferente', 'unknown'],
  ] as Array<[string | null | undefined, SsoErrorCode]>)(
    'inferindo "%s" → %s',
    (input, expected) => {
      expect(inferSsoErrorCode(input)).toBe(expected);
    },
  );
});
