/**
 * Harness compartilhado dos testes de useAcordosParcelamento: cliente Supabase falso
 * (fila de respostas por tabela + registro das escritas) e dados de pagamento.
 * Os vi.mock ficam em cada arquivo de teste (o Vitest os iça por arquivo).
 */
import { vi, type Mock } from 'vitest';
import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

export type Resultado = { data: unknown; error: unknown; count?: number | null };
export type Escrita = { tabela: string; metodo: string; payload: unknown };

export function criarChain(resultado: Resultado, registro: Escrita[], tabela: string) {
  const chain: Record<string, unknown> = {};
  for (const metodo of ['select', 'insert', 'update', 'delete', 'eq', 'in', 'order', 'single']) {
    chain[metodo] = vi.fn((...args: unknown[]) => {
      if (['insert', 'update', 'delete'].includes(metodo)) {
        registro.push({ tabela, metodo, payload: args[0] });
      }
      return chain;
    });
  }
  chain.then = (resolver: (v: Resultado) => unknown) => Promise.resolve(resultado).then(resolver);
  return chain;
}

/** Instala no mockFrom uma fila de respostas por tabela; devolve o registro das escritas. */
export function montaClienteCom(mockFrom: Mock, respostas: Record<string, Resultado[]>) {
  const escritas: Escrita[] = [];
  const consumidas: Record<string, number> = {};

  mockFrom.mockImplementation((tabela: string) => {
    const fila = respostas[tabela] ?? [{ data: [], error: null }];
    const i = Math.min(consumidas[tabela] ?? 0, fila.length - 1);
    consumidas[tabela] = (consumidas[tabela] ?? 0) + 1;
    return criarChain(fila[i], escritas, tabela);
  });

  return escritas;
}

export function criarQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
}

export function criarWrapper(getClient: () => QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={getClient()}>{children}</QueryClientProvider>;
  };
}

export const PAGAMENTO = { parcelaId: 'p-1', dataPagamento: '2026-04-10', valorPago: 500 };

/** Filas para `parcelas_acordo`: 1ª = update da parcela, 2ª = select do saldo. */
export function filaParcelas(statusRestantes: Resultado) {
  return [{ data: { acordo_id: 'ac-1' }, error: null }, statusRestantes];
}
