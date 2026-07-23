/**
 * Testes — edge-function-error
 * Cobre normalização de erros, EdgeFunctionError e toast handling.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FunctionsHttpError, FunctionsRelayError, FunctionsFetchError } from '@supabase/supabase-js';

const toastMocks = vi.hoisted(() => ({
  error: vi.fn(),
  warning: vi.fn(),
}));
const trackerMock = vi.hoisted(() => ({ captureException: vi.fn() }));
const loggerMock = vi.hoisted(() => ({ warn: vi.fn(), info: vi.fn(), error: vi.fn() }));

vi.mock('sonner', () => ({ toast: toastMocks }));
vi.mock('@/lib/error-tracking', () => ({ errorTracker: trackerMock }));
vi.mock('@/lib/logger', () => ({ logger: loggerMock }));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: { signOut: vi.fn().mockResolvedValue({ error: null }) },
    functions: { invoke: vi.fn() },
  },
}));

import {
  EdgeFunctionError,
  handleEdgeError,
  normalizeEdgeError,
} from '../edge-function-error';

beforeEach(() => {
  toastMocks.error.mockClear();
  toastMocks.warning.mockClear();
  trackerMock.captureException.mockClear();
});

function makeHttpError(status: number, body: unknown): FunctionsHttpError {
  const res = new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
  const err = new FunctionsHttpError(res);
  return err;
}

describe('EdgeFunctionError flags', () => {
  it('classifica status em auth/forbidden/client/server', () => {
    const e401 = new EdgeFunctionError({ functionName: 'x', status: 401, code: 'A', message: 'a' });
    const e403 = new EdgeFunctionError({ functionName: 'x', status: 403, code: 'A', message: 'a' });
    const e500 = new EdgeFunctionError({ functionName: 'x', status: 500, code: 'A', message: 'a' });
    expect(e401.isAuthError).toBe(true);
    expect(e403.isForbidden).toBe(true);
    expect(e500.isServerError).toBe(true);
    expect(e401.isClientError).toBe(true);
    expect(e500.isClientError).toBe(false);
  });
});

describe('normalizeEdgeError', () => {
  it('usa mensagem do body quando presente em FunctionsHttpError', async () => {
    const httpErr = makeHttpError(422, { error: 'CNPJ inválido', code: 'INVALID_CNPJ' });
    const n = await normalizeEdgeError('fn-x', httpErr);
    expect(n.status).toBe(422);
    expect(n.code).toBe('INVALID_CNPJ');
    expect(n.message).toBe('CNPJ inválido');
  });

  it('cai para mensagem padrão PT-BR quando body sem message', async () => {
    const httpErr = makeHttpError(429, {});
    const n = await normalizeEdgeError('fn-x', httpErr);
    expect(n.status).toBe(429);
    expect(n.message).toMatch(/Muitas requisições/);
  });

  it('mapeia FunctionsRelayError para 502/RELAY_ERROR', async () => {
    const err = new FunctionsRelayError(new Error('boom'));
    const n = await normalizeEdgeError('fn', err);
    expect(n.status).toBe(502);
    expect(n.code).toBe('RELAY_ERROR');
  });

  it('mapeia FunctionsFetchError para status 0/NETWORK_ERROR', async () => {
    const err = new FunctionsFetchError(new Error('offline'));
    const n = await normalizeEdgeError('fn', err);
    expect(n.status).toBe(0);
    expect(n.code).toBe('NETWORK_ERROR');
  });

  it('trata erro desconhecido genérico como 500/UNKNOWN', async () => {
    const n = await normalizeEdgeError('fn', new Error('explosão'));
    expect(n.status).toBe(500);
    expect(n.code).toBe('UNKNOWN');
    expect(n.message).toBe('explosão');
  });
});

describe('handleEdgeError toast', () => {
  it('dispara toast de sessão expirada em 401', () => {
    const err = new EdgeFunctionError({ functionName: 'fn', status: 401, code: 'X', message: 'auth' });
    handleEdgeError(err);
    expect(toastMocks.error).toHaveBeenCalledWith('Sessão expirada', expect.any(Object));
  });

  it('dispara toast de acesso negado em 403', () => {
    const err = new EdgeFunctionError({ functionName: 'fn', status: 403, code: 'X', message: 'nope' });
    handleEdgeError(err);
    expect(toastMocks.error).toHaveBeenCalledWith('Acesso negado', expect.any(Object));
  });

  it('dispara warning em 429', () => {
    const err = new EdgeFunctionError({ functionName: 'fn', status: 429, code: 'X', message: 'slow' });
    handleEdgeError(err);
    expect(toastMocks.warning).toHaveBeenCalledWith('Muitas requisições', expect.any(Object));
  });

  it('dispara serviço indisponível em 5xx', () => {
    const err = new EdgeFunctionError({ functionName: 'fn', status: 503, code: 'X', message: 'down' });
    handleEdgeError(err);
    expect(toastMocks.error).toHaveBeenCalledWith('Serviço indisponível', expect.any(Object));
  });

  it('usa titleFallback para erros genéricos', () => {
    handleEdgeError(new Error('qualquer'), 'Erro ao salvar');
    expect(toastMocks.error).toHaveBeenCalledWith('Erro ao salvar', expect.objectContaining({ description: 'qualquer' }));
  });
});
