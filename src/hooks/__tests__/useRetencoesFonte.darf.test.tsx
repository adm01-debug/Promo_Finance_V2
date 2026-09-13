/**
 * Testes — useRetencoesFonte: DARF (Etapa 18)
 *
 * Dois no-ops silenciosos com efeito fiscal direto:
 *
 *  - `gerarDARF` emitia a guia e depois marcava `darf_gerado: true` num update
 *    cujo resultado era descartado. Retenção não marcada volta à lista de
 *    pendentes e entra no DARF seguinte — recolhimento em duplicidade.
 *  - `pagarDARF` lia `retencoes_ids` de `darfs.find(...)`, a lista **em cache**
 *    filtrada por empresa/competência. DARF fora do filtro ⇒ `undefined` ⇒ o
 *    bloco inteiro pulado ⇒ guia paga com as retenções ainda pendentes.
 *
 * O lote pede contagem exata, não "pelo menos uma": `.in('id', ids)` que atinge
 * parte do lote devolve `error: null` e deixa o resto para trás.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

type Resultado = { data: unknown; error: unknown; count?: number | null };

const { mockFrom, toastErro, toastSucesso } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
  toastErro: vi.fn(),
  toastSucesso: vi.fn(),
}));

vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: mockFrom } }));
vi.mock('sonner', () => ({ toast: { success: toastSucesso, error: toastErro } }));

import { useRetencoesFonte } from '../useRetencoesFonte';

const RETENCAO = {
  id: 'ret-1',
  empresa_id: 'emp-1',
  tipo_retencao: 'irrf',
  valor_retido: 150,
  status: 'pendente',
  darf_gerado: false,
  competencia: '2026-03',
};

/** Chain que responde a qualquer encadeamento e registra a escrita. */
function criarChain(resultado: Resultado, registro: string[], tabela: string) {
  const chain: Record<string, unknown> = {};
  for (const metodo of [
    'select',
    'insert',
    'update',
    'delete',
    'eq',
    'in',
    'order',
    'single',
    'maybeSingle',
  ]) {
    chain[metodo] = vi.fn((...args: unknown[]) => {
      if (['insert', 'update', 'delete'].includes(metodo)) {
        registro.push(`${tabela}.${metodo}`);
      }
      if (metodo === 'in') registro.push(`${tabela}.in(${(args[1] as string[]).join(',')})`);
      return chain;
    });
  }
  chain.then = (resolver: (v: Resultado) => unknown) => Promise.resolve(resultado).then(resolver);
  return chain;
}

/**
 * `respostas` é consumida por tabela, na ordem em que `from()` é chamado.
 * A última resposta de cada tabela se repete se faltarem entradas.
 */
function montaCliente(respostas: Record<string, Resultado[]>) {
  const ordem: string[] = [];
  const consumidas: Record<string, number> = {};

  mockFrom.mockImplementation((tabela: string) => {
    const fila = respostas[tabela] ?? [{ data: [], error: null }];
    const i = Math.min(consumidas[tabela] ?? 0, fila.length - 1);
    consumidas[tabela] = (consumidas[tabela] ?? 0) + 1;
    return criarChain(fila[i], ordem, tabela);
  });

  return ordem;
}

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

async function montaHook(respostas: Record<string, Resultado[]>) {
  const ordem = montaCliente(respostas);
  const { result } = renderHook(() => useRetencoesFonte('emp-1', '2026-03'), { wrapper });
  await waitFor(() => expect(result.current.isLoading).toBe(false));
  return { result, ordem };
}

describe('gerarDARF', () => {
  const argumentos = {
    empresaId: 'emp-1',
    competencia: '2026-03',
    tipoRetencao: 'irrf' as const,
    retencoesIds: ['ret-1'],
  };

  it('marca as retenções incluídas na guia', async () => {
    const { result, ordem } = await montaHook({
      retencoes_fonte: [
        { data: [RETENCAO], error: null },
        { data: [{ id: 'ret-1' }], error: null },
      ],
      darfs: [
        { data: [], error: null },
        { data: { id: 'darf-1' }, error: null },
      ],
    });

    await result.current.gerarDARF.mutateAsync(argumentos);

    expect(ordem).toContain('darfs.insert');
    expect(ordem).toContain('retencoes_fonte.update');
  });

  it('falha quando a marcação não atinge linha alguma', async () => {
    const { result } = await montaHook({
      retencoes_fonte: [
        { data: [RETENCAO], error: null },
        { data: [], error: null },
      ],
      darfs: [
        { data: [], error: null },
        { data: { id: 'darf-1' }, error: null },
      ],
    });

    await expect(result.current.gerarDARF.mutateAsync(argumentos)).rejects.toThrow(
      /marcar as retenções como incluídas no DARF/
    );
  });

  it('falha quando só parte do lote foi marcada', async () => {
    // Duas retenções selecionadas, uma única linha atingida: a que ficou
    // pendente entraria de novo no DARF do mês seguinte.
    const outra = { ...RETENCAO, id: 'ret-2' };
    const { result } = await montaHook({
      retencoes_fonte: [
        { data: [RETENCAO, outra], error: null },
        { data: [{ id: 'ret-1' }], error: null },
      ],
      darfs: [
        { data: [], error: null },
        { data: { id: 'darf-1' }, error: null },
      ],
    });

    await expect(
      result.current.gerarDARF.mutateAsync({ ...argumentos, retencoesIds: ['ret-1', 'ret-2'] })
    ).rejects.toThrow(/1 de 2 registros foram afetados/);
  });

  it('recusa id selecionado que sumiu da lista em vez de gravar guia órfã', async () => {
    const { result, ordem } = await montaHook({
      retencoes_fonte: [{ data: [RETENCAO], error: null }],
      darfs: [{ data: [], error: null }],
    });

    await expect(
      result.current.gerarDARF.mutateAsync({ ...argumentos, retencoesIds: ['ret-1', 'sumiu'] })
    ).rejects.toThrow(/não está mais disponível/);

    expect(ordem).not.toContain('darfs.insert');
  });

  it('id repetido não é lido como lote parcial', async () => {
    const { result } = await montaHook({
      retencoes_fonte: [
        { data: [RETENCAO], error: null },
        { data: [{ id: 'ret-1' }], error: null },
      ],
      darfs: [
        { data: [], error: null },
        { data: { id: 'darf-1' }, error: null },
      ],
    });

    await expect(
      result.current.gerarDARF.mutateAsync({ ...argumentos, retencoesIds: ['ret-1', 'ret-1'] })
    ).resolves.toBeTruthy();
  });
});

describe('pagarDARF', () => {
  it('usa os retencoes_ids da linha gravada, não da lista em cache', async () => {
    // A lista de DARFs em cache vem vazia — exatamente o caso em que o
    // `darfs.find(...)` antigo devolvia undefined e pulava tudo.
    const { result, ordem } = await montaHook({
      retencoes_fonte: [
        { data: [RETENCAO], error: null },
        { data: [{ id: 'ret-9' }], error: null },
      ],
      darfs: [
        { data: [], error: null },
        { data: { id: 'darf-1', retencoes_ids: ['ret-9'] }, error: null },
      ],
    });

    await result.current.pagarDARF.mutateAsync({
      darfId: 'darf-1',
      dataPagamento: '2026-04-20',
    });

    expect(ordem).toContain('retencoes_fonte.in(ret-9)');
    expect(ordem).toContain('retencoes_fonte.update');
  });

  it('falha quando parte das retenções do DARF não foi recolhida', async () => {
    const { result } = await montaHook({
      retencoes_fonte: [
        { data: [RETENCAO], error: null },
        { data: [{ id: 'ret-9' }], error: null },
      ],
      darfs: [
        { data: [], error: null },
        { data: { id: 'darf-1', retencoes_ids: ['ret-9', 'ret-10'] }, error: null },
      ],
    });

    await expect(
      result.current.pagarDARF.mutateAsync({ darfId: 'darf-1', dataPagamento: '2026-04-20' })
    ).rejects.toThrow(/marcar as retenções como recolhidas: 1 de 2/);
  });

  it('avisa o usuário quando a mutação falha', async () => {
    const { result } = await montaHook({
      retencoes_fonte: [{ data: [RETENCAO], error: null }],
      darfs: [
        { data: [], error: null },
        { data: null, error: { code: '42501', message: 'sem permissão' } },
      ],
    });

    await expect(
      result.current.pagarDARF.mutateAsync({ darfId: 'darf-1', dataPagamento: '2026-04-20' })
    ).rejects.toThrow(/registrar o pagamento do DARF/);

    await waitFor(() =>
      expect(toastErro).toHaveBeenCalledWith(expect.stringContaining('registrar o pagamento'))
    );
  });
});
