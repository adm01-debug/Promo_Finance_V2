/**
 * Testes — persistirOportunidades (achado F21)
 *
 * A persistência troca a leva de oportunidades "identificada" por uma nova, sem
 * transação entre o delete e o insert. Na ordem original (delete primeiro, erro
 * do delete descartado) um insert que falhasse deixava a empresa sem histórico
 * nenhum, e uma falha do delete passava como sucesso. Aqui o insert vem antes e
 * os dois erros são propagados.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

type Resultado = { data: unknown; error: unknown };
type Chamada = { metodo: string; args: unknown[]; contexto: string };

const { mockFrom } = vi.hoisted(() => ({ mockFrom: vi.fn() }));

vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: mockFrom } }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() } }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: { id: 'user-1' } }) }));
vi.mock('@/lib/tributario/elisao', () => ({
  analisarOportunidadesElisao: () => ({
    total_oportunidades: 1,
    total_aplicaveis: 1,
    economia_total_estimada: 1000,
    oportunidades: [
      {
        estrategia: 'jcp',
        nome: 'JCP',
        aplicavel: true,
        economia_estimada: 1000,
        economia_min: 800,
        economia_max: 1200,
        base_legal: 'Lei 9.249/95 art. 9º',
        risco: 'baixo',
        justificativa: 'Patrimônio líquido comporta a dedução.',
        proximos_passos: ['Deliberar em ata'],
      },
    ],
  }),
}));

import { useOportunidadesElisao } from '../useOportunidadesElisao';

const EMPRESA = 'empresa-1';
const ANTERIORES = [{ id: 'antiga-1' }, { id: 'antiga-2' }];

let chamadas: Chamada[] = [];
let respostaInsert: Resultado = { data: null, error: null };
let respostaDelete: Resultado = { data: null, error: null };

function criarChain(tabela: string) {
  let metodo = 'select';
  const chain: Record<string, unknown> = {};
  for (const m of ['select', 'insert', 'delete', 'update', 'eq', 'in', 'order', 'limit']) {
    chain[m] = vi.fn((...args: unknown[]) => {
      if (['select', 'insert', 'delete'].includes(m)) metodo = m;
      if (tabela === 'oportunidades_elisao' && ['insert', 'delete', 'in', 'eq'].includes(m)) {
        // `contexto` guarda a operação da cadeia no momento da chamada, para
        // separar os filtros do select dos filtros do delete.
        chamadas.push({ metodo: m, args, contexto: metodo });
      }
      return chain;
    });
  }
  chain.then = (resolver: (v: Resultado) => unknown) => {
    let resultado: Resultado = { data: [], error: null };
    if (tabela === 'oportunidades_elisao') {
      if (metodo === 'insert') resultado = respostaInsert;
      else if (metodo === 'delete') resultado = respostaDelete;
      else resultado = { data: ANTERIORES, error: null };
    }
    return Promise.resolve(resultado).then(resolver);
  };
  return chain;
}

let queryClient: QueryClient;
const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

beforeEach(() => {
  vi.clearAllMocks();
  chamadas = [];
  respostaInsert = { data: null, error: null };
  respostaDelete = { data: null, error: null };
  mockFrom.mockImplementation((tabela: string) => criarChain(tabela));
  queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
});

function montar() {
  return renderHook(() => useOportunidadesElisao({ empresaId: EMPRESA }), { wrapper });
}

describe('persistirOportunidades — substituição sem transação', () => {
  it('insere a nova leva antes de apagar a anterior, e apaga só os ids lidos', async () => {
    const { result } = montar();
    await result.current.persistirOportunidades.mutateAsync();

    const sequencia = chamadas
      .filter((c) => c.metodo === 'insert' || c.metodo === 'delete')
      .map((c) => c.metodo);
    expect(sequencia).toEqual(['insert', 'delete']);

    const filtro = chamadas.find((c) => c.metodo === 'in');
    expect(filtro?.args).toEqual(['id', ['antiga-1', 'antiga-2']]);
  });

  it('o delete revalida o status: oportunidade aprovada no meio do caminho nao e apagada', async () => {
    const { result } = montar();
    await result.current.persistirOportunidades.mutateAsync();

    // Devin/Codex na PR #416: apagar so por id levaria embora uma oportunidade
    // que outra sessao aprovou entre a leitura dos ids e o delete.
    const filtrosDoDelete = chamadas
      .filter((c) => c.contexto === 'delete' && c.metodo === 'eq')
      .map((c) => c.args);
    expect(filtrosDoDelete).toEqual([['status', 'identificada']]);
  });

  it('insert que falha não apaga o histórico anterior e propaga o erro', async () => {
    respostaInsert = { data: null, error: { message: 'violação de RLS' } };
    const { result } = montar();

    await expect(result.current.persistirOportunidades.mutateAsync()).rejects.toMatchObject({
      message: 'violação de RLS',
    });
    expect(chamadas.some((c) => c.metodo === 'delete')).toBe(false);
  });

  it('delete que falha propaga o erro em vez de reportar sucesso', async () => {
    respostaDelete = { data: null, error: { message: 'linha fora do escopo' } };
    const { result } = montar();

    await expect(result.current.persistirOportunidades.mutateAsync()).rejects.toMatchObject({
      message: 'linha fora do escopo',
    });
    await waitFor(() => expect(result.current.persistirOportunidades.isError).toBe(true));
  });
});
