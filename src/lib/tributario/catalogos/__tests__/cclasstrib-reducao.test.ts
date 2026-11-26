import { describe, expect, it } from 'vitest';
import { cstsDoCatalogo, montarLinhasCclasstrib } from '../cclasstrib-reducao';
import { horizonteVigencia, type CclasstribCatalogo } from '@/lib/tributario/catalogos/cclasstrib';
import {
  chaveFundamentoLegal,
  type FundamentoLegal,
  type FundamentosLegais,
} from '@/lib/tributario/catalogos/fundamentacao-legal';

const linha = (
  over: Partial<CclasstribCatalogo> & Pick<CclasstribCatalogo, 'cclasstrib' | 'cst'>
): CclasstribCatalogo => ({
  descricao: 'Classificação',
  exigeGibscbs: true,
  pRedCbs: 0,
  pRedIbsUf: 0,
  pRedIbsMun: 0,
  versaoIt: '1.71',
  inicioVigencia: '2026-01-01',
  fimVigencia: null,
  ...over,
});

const fundamento = (over: Partial<FundamentoLegal> = {}): FundamentoLegal => ({
  cclasstrib: '200035',
  cst: '000',
  conjuntoTributo: 'CBS e IBS',
  descricaoCClassTrib: null,
  descricaoCST: null,
  texto: 'Art. 12 da LC 214/2025',
  textoCurto: 'LC 214/2025',
  referenciaNormativa: null,
  ...over,
});

const catalogo = (linhas: FundamentoLegal[]): FundamentosLegais => {
  const porCst = new Map<string, FundamentoLegal>();
  const porCclasstrib = new Map<string, FundamentoLegal[]>();
  for (const l of linhas) {
    porCst.set(chaveFundamentoLegal(l.cclasstrib, l.cst), l);
    porCclasstrib.set(l.cclasstrib, [...(porCclasstrib.get(l.cclasstrib) ?? []), l]);
  }
  return {
    porCst,
    porCclasstrib,
    referencia: '2026-11-26',
    carregado: linhas.length > 0,
    fimVigencia: null,
    falhou: false,
  };
};

const VAZIO: FundamentosLegais = {
  porCst: new Map(),
  porCclasstrib: new Map(),
  referencia: '2026-11-26',
  carregado: false,
  fimVigencia: null,
  falhou: false,
};

const OPCOES: CclasstribCatalogo[] = [
  linha({ cclasstrib: '200035', cst: '000', descricao: 'Tributação integral' }),
  linha({
    cclasstrib: '200038',
    cst: '000',
    descricao: 'Redução de 60%',
    pRedCbs: 0.6,
    pRedIbsUf: 0.6,
    pRedIbsMun: 0.6,
  }),
  linha({
    cclasstrib: '410001',
    cst: '410',
    descricao: 'Isenção',
    exigeGibscbs: false,
    pRedCbs: 1,
    pRedIbsUf: 1,
    pRedIbsMun: 1,
    fimVigencia: '2026-12-31',
  }),
];

describe('consulta por NCM — classificação tributária (etapa 84)', () => {
  it('lista os CST do catálogo em ordem, sem repetir nem aceitar vazio', () => {
    const comVazio = [...OPCOES, linha({ cclasstrib: '999999', cst: '   ' })];
    expect(cstsDoCatalogo(comVazio)).toEqual(['000', '410']);
    expect(cstsDoCatalogo([])).toEqual([]);
  });

  it('filtra pelo CST escolhido mantendo o restante do catálogo', () => {
    const linhas = montarLinhasCclasstrib(OPCOES, VAZIO, { cst: '410' });
    expect(linhas.map((l) => l.cclasstrib)).toEqual(['410001']);
  });

  it('busca por trecho sem acento e sem caixa na descrição', () => {
    const semAcento = montarLinhasCclasstrib(OPCOES, VAZIO, { busca: 'isencao' });
    expect(semAcento.map((l) => l.cclasstrib)).toEqual(['410001']);
    const porCodigo = montarLinhasCclasstrib(OPCOES, VAZIO, { busca: '200038' });
    expect(porCodigo.map((l) => l.cclasstrib)).toEqual(['200038']);
  });

  it('combina CST e busca sem devolver linha de outro CST', () => {
    expect(montarLinhasCclasstrib(OPCOES, VAZIO, { cst: '000', busca: 'isencao' })).toEqual([]);
  });

  it('anexa redução e norma do par cClassTrib/CST', () => {
    const fundamentos = catalogo([fundamento({ cclasstrib: '200038' })]);
    const [reduzida] = montarLinhasCclasstrib(OPCOES, fundamentos, { busca: '200038' });
    expect(reduzida.pRedCbs).toBe(0.6);
    expect(reduzida.fundamento).toEqual({
      referencia: 'LC 214/2025',
      texto: 'Art. 12 da LC 214/2025',
    });
    expect(reduzida.exigeGibscbs).toBe(true);
  });

  it('cai para outra linha do mesmo cClassTrib quando o CST não bate', () => {
    const fundamentos = catalogo([fundamento({ cclasstrib: '410001', cst: '200' })]);
    const [linhaIsenta] = montarLinhasCclasstrib(OPCOES, fundamentos, { busca: '410001' });
    expect(linhaIsenta.fundamento?.referencia).toBe('LC 214/2025');
  });

  it('sem catálogo de fundamentação a linha sai sem norma, não sem redução', () => {
    const [primeira] = montarLinhasCclasstrib(OPCOES, VAZIO);
    expect(primeira.cclasstrib).toBe('200035');
    expect(primeira.fundamento).toBeUndefined();
    expect(primeira.pRedCbs).toBe(0);
  });

  it('horizonte de vigência devolve o menor fim declarado e ignora valor inválido', () => {
    expect(horizonteVigencia(OPCOES)).toBe('2026-12-31');
    expect(
      horizonteVigencia([linha({ cclasstrib: '1', cst: '000', fimVigencia: null })])
    ).toBeNull();
    expect(
      horizonteVigencia([
        linha({ cclasstrib: '1', cst: '000', fimVigencia: '2027-06-30' }),
        linha({ cclasstrib: '2', cst: '000', fimVigencia: 'sem data' }),
        linha({ cclasstrib: '3', cst: '000', fimVigencia: '2026-11-30' }),
      ])
    ).toBe('2026-11-30');
  });
});
