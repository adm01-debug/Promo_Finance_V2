/**
 * Testes — useUploadCertificado (Etapa 31)
 *
 * O hook montava a mensagem de erro à mão a partir de
 * `FunctionsHttpError.context`, mas o `throw` com o texto do corpo estava
 * DENTRO do `try` e o `catch { /* noop *\/ }` logo abaixo o engolia. O
 * resultado era sempre o fallback `error.message` do supabase-js — "Edge
 * Function returned a non-2xx status code" — e o motivo real devolvido pela
 * função (senha errada, PFX corrompido, CNPJ divergente) nunca chegava ao
 * toast. Foi o que o E2E `nfe-fluxo-falhas` flagrou.
 *
 * Os testes exercitam o `invokeEdge` real contra um `functions.invoke`
 * mockado: o que se garante é que o texto do corpo da resposta 4xx chega
 * literalmente ao `toast.error`.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FunctionsHttpError } from '@supabase/supabase-js';

const { mockInvoke, toastMocks } = vi.hoisted(() => ({
  mockInvoke: vi.fn(),
  toastMocks: { success: vi.fn(), error: vi.fn(), warning: vi.fn() },
}));

vi.mock('sonner', () => ({ toast: toastMocks }));
vi.mock('@/lib/logger', () => ({
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));
vi.mock('@/lib/error-tracking', () => ({ errorTracker: { captureException: vi.fn() } }));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: { signOut: vi.fn().mockResolvedValue({ error: null }) },
    functions: { invoke: mockInvoke },
    from: vi.fn(),
  },
}));

import { useUploadCertificado } from '../useCertificadosDigitais';

function respostaHttp(status: number, body: unknown) {
  return {
    data: null,
    error: new FunctionsHttpError(
      new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' },
      })
    ),
  };
}

/** `File` mínimo: `fileToBase64` só chama `arrayBuffer()`. */
function pfxFalso(): File {
  return {
    name: 'certificado.pfx',
    arrayBuffer: () => Promise.resolve(new Uint8Array([1, 2, 3, 4]).buffer),
  } as unknown as File;
}

const entrada = {
  empresa_id: 'emp-1',
  file: pfxFalso(),
  password: 'senha-errada',
  ambiente: 'homologacao' as const,
  uf: 'SP',
};

let queryClient: QueryClient;
const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

beforeEach(() => {
  vi.clearAllMocks();
  queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
});

describe('useUploadCertificado — erro da Edge Function', () => {
  it('leva o motivo devolvido pela função até o toast', async () => {
    mockInvoke.mockResolvedValue(
      respostaHttp(400, { error: 'Senha do certificado inválida ou PFX corrompido' })
    );

    const { result } = renderHook(() => useUploadCertificado(), { wrapper });
    result.current.mutate(entrada);

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('Senha do certificado inválida ou PFX corrompido');
    expect(toastMocks.error).toHaveBeenCalledWith(
      'Falha ao processar certificado: Senha do certificado inválida ou PFX corrompido'
    );
    // A mensagem genérica do supabase-js não pode sobrar no lugar do motivo.
    expect(toastMocks.error.mock.calls[0][0]).not.toMatch(/non-2xx/i);
  });

  it('aceita `message` quando a função não usa a chave `error`', async () => {
    mockInvoke.mockResolvedValue(respostaHttp(422, { message: 'CNPJ do PFX difere da empresa' }));

    const { result } = renderHook(() => useUploadCertificado(), { wrapper });
    result.current.mutate(entrada);

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('CNPJ do PFX difere da empresa');
  });

  it('cai para a mensagem PT-BR do status quando o corpo não traz motivo', async () => {
    mockInvoke.mockResolvedValue(respostaHttp(500, {}));

    const { result } = renderHook(() => useUploadCertificado(), { wrapper });
    result.current.mutate(entrada);

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toMatch(/Erro interno do servidor/);
  });

  it('propaga `{ error }` devolvido com status 200 pelo proxy', async () => {
    mockInvoke.mockResolvedValue({ data: { error: 'Certificado expirado' }, error: null });

    const { result } = renderHook(() => useUploadCertificado(), { wrapper });
    result.current.mutate(entrada);

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('Certificado expirado');
  });

  it('no sucesso, anuncia CNPJ e validade e invalida a lista', async () => {
    mockInvoke.mockResolvedValue({
      data: {
        ok: true,
        cert_id: 'cert-1',
        cnpj: '12345678000199',
        razao_social: 'Promo Brindes LTDA',
        valido_de: '2026-01-01',
        valido_ate: '2027-01-01',
        ambiente: 'homologacao',
      },
      error: null,
    });
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useUploadCertificado(), { wrapper });
    result.current.mutate({ ...entrada, password: 'senha-certa' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.cert_id).toBe('cert-1');
    expect(toastMocks.success).toHaveBeenCalledWith(expect.stringContaining('12345678000199'));
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['certificados-digitais'] });
  });
});
