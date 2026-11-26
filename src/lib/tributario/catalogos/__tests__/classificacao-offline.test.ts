import { describe, expect, it, vi } from 'vitest';
import {
  carregarClassificacaoTributaria,
  proximoVencimentoMs,
  type DepsClassificacaoTributaria,
} from '../classificacao-offline';
import type { CclasstribCatalogo } from '../cclasstrib';
import { fundamentosVazios, chaveFundamentoLegal } from '../fundamentacao-legal';
import type { EntradaCache } from '@/lib/offline/fiscal-cache';

const DIA = 24 * 60 * 60 * 1000;

const opcao = (
  over: Partial<CclasstribCatalogo> & Pick<CclasstribCatalogo, 'cclasstrib'>
): CclasstribCatalogo => ({
  cst: '000',
  descricao: 'Classificacao',
  exigeGibscbs: true,
  pRedCbs: 0,
  pRedIbsUf: 0,
  pRedIbsMun: 0,
  versaoIt: '1.71',
  inicioVigencia: '2026-01-01',
  fimVigencia: null,
  ...over,
});

const OPCOES: CclasstribCatalogo[] = [
  opcao({ cclasstrib: '200035' }),
  opcao({ cclasstrib: '200038', pRedCbs: 0.6, pRedIbsUf: 0.6, pRedIbsMun: 0.6 }),
];

/** Fundamentacao minima carregada, com o teto de vigencia que o teste precisa. */
const fundamentos = (fimVigencia: string | null = null) => {
  const base = fundamentosVazios('2026-11-27');
  base.carregado = true;
  base.fimVigencia = fimVigencia;
  base.porCst.set(
    chaveFundamentoLegal('200035', '000'),
    {
      cclasstrib: '200035',
      cst: '000',
      conjuntoTributo: 'CBS e IBS',
      descricaoCClasstrib: null as never,
      descricaoCST: null,
      texto: 'Art. 12 da LC 214/2025',
      textoCurto: 'LC 214/2025',
      referenciaNormativa: null,
    } as never
  );
  return base;
};

const pacote = (over: Partial<{ opcoes: CclasstribCatalogo[] }> = {}) => ({
  opcoes: over.opcoes ?? OPCOES,
  fundamentos: fundamentos(),
});

const deps = (
  over: Partial<DepsClassificacaoTributaria> = {}
): DepsClassificacaoTributaria & { salvarCache: ReturnType<typeof vi.fn> } => ({
  listarOpcoes: vi.fn(async () => OPCOES),
  buscarFundamentos: vi.fn(async () => fundamentos()),
  lerCache: vi.fn(async () => null),
  salvarCache: vi.fn(async () => undefined),
  ...over,
}) as never;

describe('pacote offline de classificacao tributaria (etapa 84)', () => {
  it('sem rede mas com cache: serve o pacote guardado e marca offline', async () => {
    const cache: EntradaCache<ReturnType<typeof pacote>> = {
      chave: 'k',
      payload: pacote({ opcoes: [opcao({ cclasstrib: '410001' })] }),
      gravadoEm: 1_700_000_000_000,
      fimVigencia: '2026-12-31',
    };
    const d = deps({ listarOpcoes: vi.fn(async () => []), lerCache: vi.fn(async () => cache) });

    const dados = await carregarClassificacaoTributaria(d);

    expect(dados.offline).toBe(true);
    expect(dados.gravadoEm).toBe(1_700_000_000_000);
    expect(dados.vigenciaAte).toBe('2026-12-31');
    expect(dados.opcoes.map((o) => o.cclasstrib)).toEqual(['410001']);
    expect(d.salvarCache).not.toHaveBeenCalled();
  });

  it('sem rede e sem cache: catalogo vazio, nada de cache e nada gravado', async () => {
    const d = deps({ listarOpcoes: vi.fn(async () => []) });

    const dados = await carregarClassificacaoTributaria(d);

    expect(dados.opcoes).toEqual([]);
    expect(dados.offline).toBe(false);
    expect(dados.vigenciaAte).toBeNull();
    expect(dados.fundamentos.carregado).toBe(false);
    expect(d.salvarCache).not.toHaveBeenCalled();
  });

  it('falha na fundamentacao nao regrava o cache e mantem o texto guardado', async () => {
    const guardado = fundamentos('2026-12-31');
    guardado.porCst.set(
      chaveFundamentoLegal('200038', '000'),
      { ...guardado.porCst.get(chaveFundamentoLegal('200035', '000'))!, cclasstrib: '200038' } as never
    );
    const cache: EntradaCache<ReturnType<typeof pacote>> = {
      chave: 'k',
      payload: { opcoes: OPCOES, fundamentos: guardado },
      gravadoEm: 1_700_000_000_000,
      fimVigencia: '2026-12-31',
    };
    const falho = fundamentosVazios('2026-11-27');
    falho.falhou = true;
    const d = deps({
      buscarFundamentos: vi.fn(async () => falho),
      lerCache: vi.fn(async () => cache),
    });

    const dados = await carregarClassificacaoTributaria(d);

    expect(d.salvarCache).not.toHaveBeenCalled();
    expect(dados.offline).toBe(true);
    expect(dados.opcoes).toHaveLength(2);
    expect(dados.fundamentos.carregado).toBe(true);
    expect(dados.fundamentos.porCst.get(chaveFundamentoLegal('200035', '000'))?.texto).toBe(
      'Art. 12 da LC 214/2025'
    );
  });

  it('falha na fundamentacao sem cache: mostra o catalogo e nao grava', async () => {
    const falho = fundamentosVazios('2026-11-27');
    falho.falhou = true;
    const d = deps({ buscarFundamentos: vi.fn(async () => falho) });

    const dados = await carregarClassificacaoTributaria(d);

    expect(d.salvarCache).not.toHaveBeenCalled();
    expect(dados.offline).toBe(false);
    expect(dados.opcoes).toHaveLength(2);
    expect(dados.fundamentos.carregado).toBe(false);
  });

  it('leitura ok grava com o menor teto entre catalogo e norma', async () => {
    const opcoes = [opcao({ cclasstrib: '200035', fimVigencia: '2027-06-30' })];
    const d = deps({
      listarOpcoes: vi.fn(async () => opcoes),
      buscarFundamentos: vi.fn(async () => fundamentos('2027-01-31')),
    });

    const dados = await carregarClassificacaoTributaria(d);

    expect(dados.vigenciaAte).toBe('2027-01-31');
    expect(d.salvarCache).toHaveBeenCalledWith(
      { opcoes, fundamentos: expect.anything() },
      { fimVigencia: '2027-01-31' }
    );
  });

  it('norma sem fim de vigencia usa o teto do catalogo', async () => {
    const opcoes = [opcao({ cclasstrib: '200035', fimVigencia: '2027-06-30' })];
    const d = deps({ listarOpcoes: vi.fn(async () => opcoes) });

    const dados = await carregarClassificacaoTributaria(d);

    expect(dados.vigenciaAte).toBe('2027-06-30');
  });

  it('fundamentacao vazia mas sem falha tambem e gravada (tabela ainda nao sincronizada)', async () => {
    const vazio = fundamentosVazios('2026-11-27');
    const d = deps({ buscarFundamentos: vi.fn(async () => vazio) });

    const dados = await carregarClassificacaoTributaria(d);

    expect(dados.offline).toBe(false);
    expect(d.salvarCache).toHaveBeenCalledTimes(1);
  });
});

describe('vencimento do pacote exibido', () => {
  it('usa o TTL quando nao ha vigencia declarada', () => {
    const gravadoEm = Date.parse('2026-11-20T00:00:00.000Z');
    expect(proximoVencimentoMs({ gravadoEm, vigenciaAte: null })).toBe(gravadoEm + 7 * DIA);
  });

  it('vence no fim do dia da vigencia, antes do TTL', () => {
    const gravadoEm = Date.parse('2026-11-27T12:00:00.000Z');
    const vencimento = proximoVencimentoMs({ gravadoEm, vigenciaAte: '2026-11-30' });
    expect(vencimento).toBe(Date.parse('2026-12-01T00:00:00.000Z'));
  });

  it('vence no TTL quando a vigencia do dado e maior', () => {
    const gravadoEm = Date.parse('2026-11-27T12:00:00.000Z');
    expect(proximoVencimentoMs({ gravadoEm, vigenciaAte: '2030-01-01' })).toBe(
      gravadoEm + 7 * DIA
    );
  });

  it('sem TTL (dado veio da rede) so a vigencia conta', () => {
    expect(proximoVencimentoMs({ gravadoEm: null, vigenciaAte: '2026-12-31' })).toBe(
      Date.parse('2027-01-01T00:00:00.000Z')
    );
  });

  it('sem gravacao e sem vigencia nao ha o que agendar', () => {
    expect(proximoVencimentoMs({})).toBeNull();
    expect(proximoVencimentoMs({ gravadoEm: null, vigenciaAte: '  ' })).toBeNull();
  });
});
