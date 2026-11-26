/**
 * Testes — leitura do catálogo em lotes (etapa 46 / review da PR #561).
 *
 * O PostgREST corta a resposta em `db-max-rows` (1000 linhas no padrão) sem
 * avisar. `buscarReferenciasFiscais` consulta só os códigos do lote, mas um lote
 * grande (importação de muitas notas) pode passar desse corte — e o validador
 * trata código ausente do mapa como divergência (REG-012/REG-013). A leitura
 * agora vai em lotes de 300 códigos; estes testes provam que o lote é dividido e
 * que as linhas das duas respostas chegam ao mapa.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockFrom } = vi.hoisted(() => ({ mockFrom: vi.fn() }));

vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: mockFrom } }));

import { buscarReferenciasFiscais } from '@/lib/tributario/catalogos/cclasstrib';

type Resposta = { data: unknown; error: unknown };
type LinhaNcm = { ncm: string; descricao: string; inicio_vigencia: string; fim_vigencia: null };

/**
 * Cliente falso: devolve, para cada código pedido, uma linha vigente, e registra
 * os lotes que cada `.in()` recebeu. Também registra `limit` (a sonda de
 * cobertura) para o teste provar que ela não foi disparada.
 */
function montaCliente() {
  const lotesNcm: string[][] = [];
  const lotesTrib: string[][] = [];
  const lotesFundamentos: string[][] = [];
  const sondas: string[] = [];

  mockFrom.mockImplementation((tabela: string) => {
    const chain: Record<string, unknown> = {};
    let lote: string[] = [];
    chain.select = vi.fn(() => chain);
    chain.in = vi.fn((_coluna: string, codigos: string[]) => {
      lote = codigos;
      // Etapa 82: `catalogo_fundamentacao` e lida com os mesmos codigos de
      // cClassTrib. Contada junto, ela faria um lote de 301 parecer 602 - o
      // teste acusaria quebra de lote onde so ha uma consulta a mais.
      if (tabela === 'catalogo_ncm') lotesNcm.push(codigos);
      else if (tabela === 'catalogo_cclasstrib') lotesTrib.push(codigos);
      else lotesFundamentos.push(codigos);
      return chain;
    });
    chain.limit = vi.fn(() => {
      sondas.push(tabela);
      return chain;
    });
    chain.lte = vi.fn(() => chain);
    chain.or = vi.fn(() => chain);
    chain.then = (resolver: (v: Resposta) => unknown) => {
      let data: unknown[] = [];
      if (tabela === 'catalogo_ncm') {
        data = lote.map<LinhaNcm>((ncm) => ({
          ncm,
          descricao: `NCM ${ncm}`,
          inicio_vigencia: '2026-01-01',
          fim_vigencia: null,
        }));
      } else if (tabela === 'catalogo_cclasstrib') {
        data = lote.map((cclasstrib) => ({
          cclasstrib,
          cst: '000',
          descricao: `cClassTrib ${cclasstrib}`,
          exige_gibscbs: true,
          p_red_cbs: 0,
          p_red_ibs_uf: 0,
          p_red_ibs_mun: 0,
          versao_it: '1.00',
          inicio_vigencia: '2026-01-01',
          fim_vigencia: null,
        }));
      }
      return Promise.resolve({ data, error: null }).then(resolver);
    };
    return chain;
  });

  return { lotesNcm, lotesTrib, lotesFundamentos, sondas };
}

const codigos = (quantidade: number, prefixo: string, digitos: number): string[] =>
  Array.from({ length: quantidade }, (_, i) => prefixo + String(i).padStart(digitos, '0'));

describe('buscarReferenciasFiscais — leitura em lotes', () => {
  beforeEach(() => mockFrom.mockReset());

  it('divide 301 NCMs em dois lotes e soma as linhas dos dois', async () => {
    const { lotesNcm, sondas } = montaCliente();
    const ncms = codigos(301, '1000', 4); // 8 dígitos: 10000000..10000300

    const referencias = await buscarReferenciasFiscais([], ncms, '2026-06-01');

    expect(lotesNcm.map((l) => l.length)).toEqual([300, 1]);
    expect(referencias.ncm.size).toBe(301);
    expect(referencias.ncm.get('10000300')?.descricao).toBe('NCM 10000300');
    expect(referencias.ncmCarregado).toBe(true);
    // Cobertura provada pelas próprias linhas: a sonda não é necessária.
    expect(sondas).toEqual([]);
  });

  it('divide cClassTribs no mesmo tamanho de lote', async () => {
    const { lotesTrib } = montaCliente();
    const tributos = codigos(301, '200', 3); // 6 dígitos: 200000..200300

    const referencias = await buscarReferenciasFiscais(tributos, [], '2026-06-01');

    expect(lotesTrib.map((l) => l.length)).toEqual([300, 1]);
    expect(referencias.cclasstrib.size).toBe(301);
    expect(referencias.cclasstribCarregado).toBe(true);
  });

  it('le os fundamentos dos mesmos codigos sem contá-los como lote de catalogo', async () => {
    const { lotesTrib, lotesFundamentos } = montaCliente();

    await buscarReferenciasFiscais(codigos(301, '200', 3), [], '2026-06-01');

    expect(lotesTrib.map((l) => l.length)).toEqual([300, 1]);
    expect(lotesFundamentos.map((l) => l.length)).toEqual([300, 1]);
  });

  it('uma consulta só quando o lote cabe no limite', async () => {
    const { lotesNcm } = montaCliente();

    await buscarReferenciasFiscais([], codigos(300, '1000', 4), '2026-06-01');

    expect(lotesNcm.map((l) => l.length)).toEqual([300]);
  });
});
