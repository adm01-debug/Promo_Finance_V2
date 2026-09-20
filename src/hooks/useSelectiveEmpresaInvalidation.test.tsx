import { describe, expect, it } from 'vitest';
import type { ReactNode } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import {
  RAIZES_AGNOSTICAS_A_EMPRESA,
  deveRemoverNaTrocaDeEmpresa,
  useSelectiveEmpresaInvalidation,
} from './useSelectiveEmpresaInvalidation';

describe('deveRemoverNaTrocaDeEmpresa', () => {
  it('remove queries escopadas por empresa', () => {
    expect(deveRemoverNaTrocaDeEmpresa(['contas-pagar', 'list'])).toBe(true);
    expect(deveRemoverNaTrocaDeEmpresa(['views', 'fluxo-caixa', 'uuid'])).toBe(true);
  });

  it('remove chaves que a heurística antiga deixava passar', () => {
    // Nenhuma destas contém "empresa" nem o UUID trocado: eram justamente
    // os casos em que o cache servia dados do tenant anterior.
    expect(deveRemoverNaTrocaDeEmpresa(['centros_custo', 'all'])).toBe(true);
    expect(deveRemoverNaTrocaDeEmpresa(['auditoria-ia'])).toBe(true);
    expect(deveRemoverNaTrocaDeEmpresa(['categorias'])).toBe(true);
  });

  it('preserva identidade do usuário e catálogos nacionais', () => {
    expect(deveRemoverNaTrocaDeEmpresa(['user-empresas'])).toBe(false);
    expect(deveRemoverNaTrocaDeEmpresa(['empresas'])).toBe(false);
    expect(deveRemoverNaTrocaDeEmpresa(['bancos'])).toBe(false);
    expect(deveRemoverNaTrocaDeEmpresa(['glossario-tributario'])).toBe(false);
  });

  it('é fail-closed para chaves sem raiz string', () => {
    expect(deveRemoverNaTrocaDeEmpresa([{ empresa_id: 'x' }])).toBe(true);
    expect(deveRemoverNaTrocaDeEmpresa([])).toBe(true);
    expect(deveRemoverNaTrocaDeEmpresa([123])).toBe(true);
  });

  it('mantém user-empresas na allowlist (fonte da própria troca)', () => {
    // Guarda de regressão: removê-la derruba o EmpresaGuard para loading.
    expect(RAIZES_AGNOSTICAS_A_EMPRESA.has('user-empresas')).toBe(true);
  });
});

/**
 * Efeito da troca de empresa sobre queries montadas (Etapa 31).
 *
 * O hook usava `removeQueries`. Remover destrói a entrada do cache e o fetch em
 * voo junto; o observer montado continua apontando para a query destruída, não
 * é notificado e não refaz o fetch. A tela ficava presa no spinner até um
 * reload — reproduzido em `CertificadosDigitaisTab`, cuja resposta de
 * `empresas_certificados` chegava 200 com `[]` e não era aplicada.
 */
describe('useSelectiveEmpresaInvalidation — queries montadas', () => {
  function montar() {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: Infinity } },
    });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    return { queryClient, wrapper };
  }

  it('recarrega a query da tela aberta em vez de deixá-la órfã', async () => {
    const { queryClient, wrapper } = montar();
    let chamadas = 0;
    const { result } = renderHook(
      () => {
        useSelectiveEmpresaInvalidation();
        return useQuery({
          queryKey: ['contas-pagar'],
          queryFn: async () => `empresa-${++chamadas}`,
        });
      },
      { wrapper }
    );

    await waitFor(() => expect(result.current.data).toBe('empresa-1'));

    act(() => {
      window.dispatchEvent(new Event('current-empresa-changed'));
    });

    // Refaz o fetch sozinha: o usuário vê os dados da nova empresa sem navegar.
    await waitFor(() => expect(result.current.data).toBe('empresa-2'));
    expect(chamadas).toBe(2);
    expect(queryClient.getQueryData(['contas-pagar'])).toBe('empresa-2');
  });

  it('não deixa a tela presa no spinner quando a troca pega um fetch em voo', async () => {
    const { wrapper } = montar();
    let liberar!: (v: string) => void;
    let chamadas = 0;

    const { result } = renderHook(
      () => {
        useSelectiveEmpresaInvalidation();
        return useQuery({
          queryKey: ['certificados-digitais', 'all'],
          queryFn: () => {
            chamadas += 1;
            // Só a primeira chamada fica pendurada — é a requisição que a troca
            // de empresa interrompe no meio.
            if (chamadas > 1) return Promise.resolve('depois');
            return new Promise<string>((resolve) => {
              liberar = resolve;
            });
          },
        });
      },
      { wrapper }
    );

    await waitFor(() => expect(result.current.isLoading).toBe(true));

    act(() => {
      window.dispatchEvent(new Event('current-empresa-changed'));
    });
    // A resposta da requisição antiga chega depois da troca e é descartada:
    // pertence ao tenant anterior.
    act(() => liberar('antes'));

    await waitFor(() => expect(result.current.data).toBe('depois'));
    expect(result.current.isLoading).toBe(false);
  });

  it('preserva a query da allowlist, com dados e sem refetch', async () => {
    const { wrapper } = montar();
    let chamadas = 0;
    const { result } = renderHook(
      () => {
        useSelectiveEmpresaInvalidation();
        return useQuery({
          queryKey: ['user-empresas'],
          queryFn: async () => `vinculos-${++chamadas}`,
          staleTime: Infinity,
        });
      },
      { wrapper }
    );

    await waitFor(() => expect(result.current.data).toBe('vinculos-1'));

    act(() => {
      window.dispatchEvent(new Event('current-empresa-changed'));
    });

    await waitFor(() => expect(result.current.isFetching).toBe(false));
    expect(result.current.data).toBe('vinculos-1');
    expect(chamadas).toBe(1);
  });
});
