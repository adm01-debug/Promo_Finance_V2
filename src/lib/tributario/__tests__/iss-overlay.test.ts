import { beforeEach, describe, expect, it } from 'vitest';
import {
  aplicarOverlayIss,
  compararComSugestaoIss,
  definirTabelaIssEfetiva,
  normalizarAliquotaIss,
  normalizarMunicipio,
  resetarTabelaIssEfetiva,
  resolverAliquotaIss,
  sugerirAliquotaMunicipal,
  type RegistroIssMunicipalBanco,
} from '../ipi-iss/overlay-iss';

const SP = (over: Partial<RegistroIssMunicipalBanco> = {}): RegistroIssMunicipalBanco => ({
  codigo_ibge: 3550308,
  municipio: 'São Paulo',
  uf: 'SP',
  item_codigo: null,
  aliquota: 0.05,
  vigente_de: '2024-01-01',
  vigente_ate: null,
  base_legal: 'Lei 13.701/2003',
  ...over,
});

describe('normalização', () => {
  it('aceita fração, percentual e string com vírgula', () => {
    expect(normalizarAliquotaIss(0.05)).toBe(0.05);
    expect(normalizarAliquotaIss(5)).toBe(0.05);
    expect(normalizarAliquotaIss('2,50')).toBe(0.025);
  });

  it('rejeita valores não numéricos ou negativos', () => {
    expect(normalizarAliquotaIss('abc')).toBeNull();
    expect(normalizarAliquotaIss(-1)).toBeNull();
    expect(normalizarAliquotaIss(null)).toBeNull();
  });

  it('normaliza nomes de município para busca tolerante', () => {
    expect(normalizarMunicipio('São Paulo')).toBe('sao paulo');
    expect(normalizarMunicipio('  Belém  ')).toBe('belem');
  });
});

describe('aplicarOverlayIss — faixa legal LC 116', () => {
  it('aceita alíquotas entre 2% e 5%', () => {
    const r = aplicarOverlayIss([SP({ aliquota: 0.02 }), SP({ codigo_ibge: 3304557, municipio: 'Rio de Janeiro', uf: 'RJ', aliquota: 5 })]);
    expect(r.aceitas).toHaveLength(2);
    expect(r.rejeitadas).toHaveLength(0);
    expect(r.municipiosCobertos).toBe(2);
  });

  it('rejeita abaixo do piso de 2% (art. 8º-A)', () => {
    const r = aplicarOverlayIss([SP({ aliquota: 0.015 })]);
    expect(r.aceitas).toHaveLength(0);
    expect(r.rejeitadas[0].motivo).toBe('fora_da_faixa_legal');
  });

  it('rejeita acima do teto de 5% (art. 8º, II)', () => {
    const r = aplicarOverlayIss([SP({ aliquota: 0.07 })]);
    expect(r.rejeitadas[0].motivo).toBe('fora_da_faixa_legal');
  });

  it('rejeita código IBGE e município inválidos', () => {
    const r = aplicarOverlayIss([SP({ codigo_ibge: 'x' }), SP({ municipio: '   ' })]);
    expect(r.rejeitadas.map((x) => x.motivo)).toEqual(['codigo_ibge_invalido', 'municipio_invalido']);
  });

  it('rejeita duplicidade na mesma chave município+item', () => {
    const r = aplicarOverlayIss([SP(), SP({ aliquota: 0.03 })]);
    expect(r.aceitas).toHaveLength(1);
    expect(r.aceitas[0].aliquota).toBe(0.05);
    expect(r.rejeitadas[0].motivo).toBe('duplicado');
  });

  it('rejeita datas de vigência malformadas', () => {
    const r = aplicarOverlayIss([SP({ vigente_de: '01/2024' })]);
    expect(r.rejeitadas[0].motivo).toBe('vigencia_invalida');
  });

  it('descarta silenciosamente registros fora de vigência', () => {
    const r = aplicarOverlayIss([SP({ vigente_ate: '2024-12-31' })], '2026-07-27');
    expect(r.aceitas).toHaveLength(0);
    expect(r.rejeitadas).toHaveLength(0);
  });

  it('não muta os registros de entrada', () => {
    const entrada = [SP()];
    const copia = JSON.parse(JSON.stringify(entrada));
    aplicarOverlayIss(entrada);
    expect(entrada).toEqual(copia);
  });
});

describe('resolverAliquotaIss — precedência item > geral', () => {
  const { tabela } = aplicarOverlayIss([
    SP(),
    SP({ item_codigo: '1.01', aliquota: 0.02, base_legal: 'Lei 13.701/2003, art. 16, I' }),
  ]);

  it('usa a alíquota específica do item quando existir', () => {
    expect(resolverAliquotaIss(tabela, { codigoIbge: 3550308 }, '1.01')?.aliquota).toBe(0.02);
  });

  it('cai para a alíquota geral do município', () => {
    expect(resolverAliquotaIss(tabela, { codigoIbge: 3550308 }, '7.02')?.aliquota).toBe(0.05);
  });

  it('resolve por nome de município com acento/caixa divergentes', () => {
    expect(resolverAliquotaIss(tabela, { municipio: 'SAO PAULO' }, '1.01')?.aliquota).toBe(0.02);
  });

  it('retorna null para município desconhecido', () => {
    expect(resolverAliquotaIss(tabela, { municipio: 'Itaquaquecetuba' })).toBeNull();
    expect(resolverAliquotaIss(tabela, {})).toBeNull();
  });
});

describe('runtime', () => {
  beforeEach(() => resetarTabelaIssEfetiva());

  it('sem catálogo carregado não sugere alíquota', () => {
    expect(sugerirAliquotaMunicipal({ codigoIbge: 3550308 })).toBeNull();
  });

  it('sugere a alíquota após injeção da tabela validada e volta a null no reset', () => {
    definirTabelaIssEfetiva(aplicarOverlayIss([SP()]).tabela);
    expect(sugerirAliquotaMunicipal({ municipio: 'São Paulo' })?.aliquota).toBe(0.05);
    resetarTabelaIssEfetiva();
    expect(sugerirAliquotaMunicipal({ municipio: 'São Paulo' })).toBeNull();
  });
});

describe('compararComSugestaoIss', () => {
  const { tabela } = aplicarOverlayIss([SP(), SP({ item_codigo: '1.01', aliquota: 0.02 })]);
  const geral = resolverAliquotaIss(tabela, { codigoIbge: 3550308 }, '7.02');

  it('sem catálogo não emite divergência', () => {
    const c = compararComSugestaoIss(0.03, null);
    expect(c.status).toBe('sem_catalogo');
    expect(c.diferencaPp).toBe(0);
  });

  it('considera conforme dentro da tolerância de arredondamento', () => {
    expect(compararComSugestaoIss(0.05, geral).status).toBe('conforme');
    expect(compararComSugestaoIss(0.050001, geral).status).toBe('conforme');
  });

  it('reporta divergência em pontos percentuais com sinal', () => {
    const c = compararComSugestaoIss(0.03, geral);
    expect(c.status).toBe('divergente');
    expect(c.diferencaPp).toBeCloseTo(-2, 6);
  });

  it('trata alíquota informada não finita como divergente', () => {
    expect(compararComSugestaoIss(Number.NaN, geral).status).toBe('divergente');
  });
});
