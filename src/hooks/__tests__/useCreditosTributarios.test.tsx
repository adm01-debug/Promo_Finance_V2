/**
 * Testes ? useCreditosTributarios: split informativo x dispon?vel (Etapa 48)
 *
 * O resumo somava `saldo_disponivel` de qualquer cr?dito com status
 * `disponivel`. Isso misturava tr?s coisas num ?nico n?mero:
 *   - cr?dito real da reforma, destacado no XML (apropri?vel);
 *   - cr?dito de 2026, que ? ano de teste e n?o gera efeito tribut?rio;
 *   - cr?dito estimado, calculado antes de o XML existir.
 * O gestor via um saldo que n?o podia usar.
 *
 * Agora "dispon?vel" exige `efeito_tributario === true` E
 * `origem === 'xml_destacado'`. O resto vai para o KPI "informativo 2026",
 * que a tela mostra separado e que n?o ? saldo gast?vel.
 */
import { describe, it, expect, vi } from 'vitest';
import type { ReactNode } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const { mockFrom } = vi.hoisted(() => ({ mockFrom: vi.fn() }));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: mockFrom },
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { useCreditosTributarios } from '../useCreditosTributarios';

type Linha = {
  tipo_tributo: 'CBS' | 'IBS' | 'IS';
  status: string | null;
  valor_credito: number;
  valor_utilizado: number;
  saldo_disponivel: number;
  origem: string | null;
  efeito_tributario: boolean | null;
};

/** Cr?ditos detalhados vazios; o resumo responde com as linhas dadas. */
function montaCliente(linhas: Linha[]) {
  return () => ({
    select: () => ({
      order: () => Promise.resolve({ data: [], error: null }),
      then: (resolve: (v: unknown) => unknown) =>
        Promise.resolve({ data: linhas, error: null }).then(resolve),
    }),
  });
}

function render(linhas: Linha[]) {
  mockFrom.mockImplementation(montaCliente(linhas));
  const cliente = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={cliente}>{children}</QueryClientProvider>
  );
  return renderHook(() => useCreditosTributarios('all'), { wrapper });
}

describe('useCreditosTributarios ? informativo x dispon?vel (etapa 48)', () => {
  it('cr?dito destacado no XML conta como dispon?vel', async () => {
    const { result } = render([
      {
        tipo_tributo: 'CBS',
        status: 'disponivel',
        valor_credito: 1000,
        valor_utilizado: 0,
        saldo_disponivel: 1000,
        origem: 'xml_destacado',
        efeito_tributario: true,
      },
    ]);

    await waitFor(() => expect(result.current.resumoCreditos?.cbs.disponivel).toBe(1000));
    expect(result.current.resumoCreditos.cbs.informativo).toBe(0);
  });

  it('cr?dito estimado N?O conta como dispon?vel e vai para informativo', async () => {
    const { result } = render([
      {
        tipo_tributo: 'CBS',
        status: 'disponivel',
        valor_credito: 700,
        valor_utilizado: 0,
        saldo_disponivel: 700,
        origem: 'estimado',
        efeito_tributario: true,
      },
    ]);

    await waitFor(() => expect(result.current.resumoCreditos?.cbs.informativo).toBe(700));
    expect(result.current.resumoCreditos.cbs.disponivel).toBe(0);
  });

  it('cr?dito sem efeito tribut?rio (2026) N?O conta como dispon?vel', async () => {
    const { result } = render([
      {
        tipo_tributo: 'IBS',
        status: 'disponivel',
        valor_credito: 500,
        valor_utilizado: 0,
        saldo_disponivel: 500,
        origem: 'xml_destacado',
        efeito_tributario: false,
      },
    ]);

    await waitFor(() => expect(result.current.resumoCreditos?.ibs.informativo).toBe(500));
    expect(result.current.resumoCreditos.ibs.disponivel).toBe(0);
  });

  it('cr?dito j? utilizado ou estornado n?o infla o informativo', async () => {
    const { result } = render([
      {
        tipo_tributo: 'CBS',
        status: 'utilizado',
        valor_credito: 300,
        valor_utilizado: 300,
        saldo_disponivel: 0,
        origem: 'estimado',
        efeito_tributario: false,
      },
      {
        tipo_tributo: 'CBS',
        status: 'estornado',
        valor_credito: 200,
        valor_utilizado: 0,
        saldo_disponivel: 200,
        origem: 'estimado',
        efeito_tributario: false,
      },
    ]);

    await waitFor(() => expect(result.current.resumoCreditos).toBeTruthy());
    expect(result.current.resumoCreditos.cbs.informativo).toBe(0);
    expect(result.current.resumoCreditos.cbs.disponivel).toBe(0);
  });

  it('separa dispon?vel de informativo no mesmo lote', async () => {
    const { result } = render([
      {
        tipo_tributo: 'CBS',
        status: 'disponivel',
        valor_credito: 1000,
        valor_utilizado: 0,
        saldo_disponivel: 1000,
        origem: 'xml_destacado',
        efeito_tributario: true,
      },
      {
        tipo_tributo: 'CBS',
        status: 'disponivel',
        valor_credito: 250,
        valor_utilizado: 0,
        saldo_disponivel: 250,
        origem: 'estimado',
        efeito_tributario: true,
      },
    ]);

    await waitFor(() => expect(result.current.resumoCreditos?.cbs.disponivel).toBe(1000));
    expect(result.current.resumoCreditos.cbs.informativo).toBe(250);
    expect(result.current.resumoCreditos.cbs.total).toBe(1250);
  });
});
