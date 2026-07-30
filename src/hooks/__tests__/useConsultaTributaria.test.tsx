import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

const invoke = vi.fn();
vi.mock('@/integrations/supabase/client', () => ({
  supabase: { functions: { invoke: (...a: unknown[]) => invoke(...a) } },
}));

import {
  consultarTributos,
  useConsultaCNAE,
  useConsultaNCM,
  useConsultaUF,
} from '@/hooks/useConsultaTributaria';

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

beforeEach(() => invoke.mockReset());

describe('consultarTributos', () => {
  it('propaga erro de transporte da edge function', async () => {
    invoke.mockResolvedValue({ data: null, error: { message: 'boom' } });
    await expect(consultarTributos({ recurso: 'uf', uf: 'SP' })).rejects.toThrow('boom');
  });

  it('propaga erro lógico devolvido no corpo (status 200 com { error })', async () => {
    invoke.mockResolvedValue({ data: { error: 'uf inválida' }, error: null });
    await expect(consultarTributos({ recurso: 'uf', uf: 'SP' })).rejects.toThrow('uf inválida');
  });

  it('encaminha os parâmetros no body da invocação', async () => {
    invoke.mockResolvedValue({ data: { recurso: 'cnae' }, error: null });
    await consultarTributos({ recurso: 'cnae', codigo: '6201-5/01' });
    expect(invoke).toHaveBeenCalledWith('consulta-tributaria', {
      body: { recurso: 'cnae', codigo: '6201-5/01' },
    });
  });
});

describe('hooks de consulta — fallback e habilitação', () => {
  it('useConsultaUF fica desabilitado sem UF', () => {
    const { result } = renderHook(() => useConsultaUF(undefined), { wrapper });
    expect(result.current.fetchStatus).toBe('idle');
    expect(invoke).not.toHaveBeenCalled();
  });

  it('useConsultaCNAE só dispara com ao menos 2 caracteres', async () => {
    const { rerender } = renderHook(({ c }: { c?: string }) => useConsultaCNAE(c), {
      wrapper,
      initialProps: { c: '6' },
    });
    expect(invoke).not.toHaveBeenCalled();
    invoke.mockResolvedValue({ data: { recurso: 'cnae' }, error: null });
    rerender({ c: '62' });
    await waitFor(() => expect(invoke).toHaveBeenCalled());
  });

  it('useConsultaCNAE expõe o fallback hierárquico sinalizado pelo backend', async () => {
    invoke.mockResolvedValue({
      data: {
        recurso: 'cnae',
        match: { estrategia: 'prefixo_4', exato: false, detalhe: 'CNAE 6201 usado como base' },
        cnae: { codigo: '6201-5/00', anexo_simples: 'V' },
        alternativas: [{ codigo: '6201-5/02' }],
      },
      error: null,
    });
    const { result } = renderHook(() => useConsultaCNAE('6201-5/99'), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.match.exato).toBe(false);
    expect(result.current.data?.match.estrategia).toBe('prefixo_4');
    expect(result.current.data?.alternativas).toHaveLength(1);
  });

  it('useConsultaNCM sem código entra em modo listagem com filtros', async () => {
    invoke.mockResolvedValue({
      data: { recurso: 'ncm', modo: 'listagem', ncms: [{ codigo: '22021000' }] },
      error: null,
    });
    const { result } = renderHook(
      () => useConsultaNCM(undefined, { monofasico: true, st: true, limite: 50 }),
      { wrapper },
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invoke).toHaveBeenCalledWith('consulta-tributaria', {
      body: { recurso: 'ncm', codigo: undefined, monofasico: true, st: true, limite: 50 },
    });
    expect(result.current.data?.modo).toBe('listagem');
  });
});
