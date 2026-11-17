/**
 * Testes do criterio de parada da paginacao. Extraido na revisao da PR #404,
 * onde a primeira versao da paginacao tinha dois defeitos apontados pela
 * revisao: assumir que a pagina devolvida tem o tamanho pedido, e avancar o
 * deslocamento pelo pedido em vez do recebido.
 */
import { describe, it, expect, vi } from 'vitest';
import { paginarTudo, PAGINA } from '../paginar-postgrest';

/** Consulta falsa: devolve fatias de `linhas`, com teto opcional do servidor. */
function consultaFalsa(linhas: number[], tetoServidor?: number) {
  const janelas: Array<[number, number]> = [];
  const range = vi.fn((de: number, ate: number) => {
    janelas.push([de, ate]);
    const fatia = linhas.slice(de, ate + 1);
    return Promise.resolve({
      data: tetoServidor ? fatia.slice(0, tetoServidor) : fatia,
      error: null,
      count: linhas.length,
    });
  });
  return { consulta: { range }, janelas };
}

describe('paginarTudo', () => {
  it('le tudo quando cabe numa pagina', async () => {
    const { consulta, janelas } = consultaFalsa([1, 2, 3]);
    expect(await paginarTudo<number>(consulta)).toEqual([1, 2, 3]);
    expect(janelas).toEqual([[0, PAGINA - 1]]);
  });

  it('le todas as paginas quando o total passa de uma', async () => {
    const linhas = Array.from({ length: PAGINA + 1 }, (_, i) => i);
    const { consulta, janelas } = consultaFalsa(linhas);
    expect((await paginarTudo<number>(consulta)).length).toBe(PAGINA + 1);
    expect(janelas.map(([de]) => de)).toEqual([0, PAGINA]);
  });

  it('servidor que devolve menos que a janela: avanca pelo RECEBIDO', async () => {
    // db-max-rows de 500 com janela de 1.000: somar 1.000 pularia 500 linhas.
    const linhas = Array.from({ length: 1200 }, (_, i) => i);
    const { consulta, janelas } = consultaFalsa(linhas, 500);
    const tudo = await paginarTudo<number>(consulta);
    expect(tudo.length).toBe(1200);
    expect(tudo).toEqual(linhas); // nada pulado, nada repetido
    expect(janelas.map(([de]) => de)).toEqual([0, 500, 1000]);
  });

  it('pagina vazia antes do total LANCA em vez de devolver parcial', async () => {
    const range = vi
      .fn()
      .mockResolvedValueOnce({ data: [1, 2], error: null, count: 10 })
      .mockResolvedValueOnce({ data: [], error: null, count: 10 });
    await expect(paginarTudo({ range })).rejects.toThrow(/Leitura incompleta/i);
  });

  it('erro de qualquer pagina e propagado', async () => {
    const range = vi
      .fn()
      .mockResolvedValueOnce({ data: [1], error: null, count: 5 })
      .mockResolvedValueOnce({ data: null, error: { message: 'falha de rede' } });
    await expect(paginarTudo({ range })).rejects.toMatchObject({ message: 'falha de rede' });
  });

  it('sem contagem do servidor, para quando a pagina vem incompleta', async () => {
    const range = vi.fn().mockResolvedValueOnce({ data: [1, 2, 3], error: null, count: null });
    expect(await paginarTudo<number>({ range })).toEqual([1, 2, 3]);
    expect(range).toHaveBeenCalledTimes(1);
  });
});
