import { describe, it, expect } from 'vitest';
import {
  normalizarParametrosSnapshot,
  normalizarAjustesAplicados,
  resumirAuditoriaHistorico,
  snapshotComPendencia,
  filtrarHistorico,
  montarLinhasAuditoriaCsv,
  paginarHistorico,
  ordenarHistorico,

} from '../historico-simulacao';
import type { AjusteParametro } from '../diagnostico-parametros';

const ajuste = (severidade: 'aviso' | 'critico'): AjusteParametro => ({
  campo: 'faturamentoAnual',
  rotulo: 'Faturamento anual',
  informado: '-1',
  aplicado: '0',
  motivo: 'Valor negativo',
  severidade,
});

describe('normalizarParametrosSnapshot', () => {
  it('aceita objeto com faturamentoAnual numérico finito', () => {
    expect(normalizarParametrosSnapshot({ faturamentoAnual: 1000 })).toEqual({
      faturamentoAnual: 1000,
    });
  });

  it.each([
    ['null', null],
    ['undefined', undefined],
    ['array', [] as unknown],
    ['string', 'x'],
    ['sem faturamento', { margemLucro: 10 }],
    ['faturamento não numérico', { faturamentoAnual: 'abc' }],
    ['faturamento NaN', { faturamentoAnual: Number.NaN }],
    ['faturamento Infinity', { faturamentoAnual: Number.POSITIVE_INFINITY }],
  ])('rejeita %s', (_label, entrada) => {
    expect(normalizarParametrosSnapshot(entrada)).toBeNull();
  });

  // jsonb legado gravou números como string em parte dos registros: coagir é
  // preferível a descartar o snapshot inteiro e perder a reprodutibilidade.
  it('coage faturamento persistido como string numérica', () => {
    expect(normalizarParametrosSnapshot({ faturamentoAnual: '1000' })).toEqual({
      faturamentoAnual: 1000,
    });
  });
});


describe('normalizarAjustesAplicados', () => {
  it('retorna lista vazia para entradas não-array (registros legados)', () => {
    for (const entrada of [null, undefined, {}, 'x', 42]) {
      expect(normalizarAjustesAplicados(entrada)).toEqual([]);
    }
  });

  it('descarta itens malformados e preserva os válidos', () => {
    const bruto = [
      ajuste('aviso'),
      { campo: 'x' },
      null,
      [],
      { ...ajuste('critico'), severidade: 'fatal' },
      ajuste('critico'),
    ];
    const resultado = normalizarAjustesAplicados(bruto);
    expect(resultado).toHaveLength(2);
    expect(resultado.map((a) => a.severidade)).toEqual(['aviso', 'critico']);
  });
});

describe('resumirAuditoriaHistorico', () => {
  it('considera histórico vazio como saudável', () => {
    expect(resumirAuditoriaHistorico([])).toMatchObject({ total: 0, saudavel: true });
  });

  it('agrega divergências, versões antigas e ajustes', () => {
    const resumo = resumirAuditoriaHistorico([
      { divergente: true, motorDesatualizado: true, ajustesAplicados: [ajuste('critico')] },
      { divergente: false, motorDesatualizado: true, ajustesAplicados: [ajuste('aviso')] },
      { divergente: false, motorDesatualizado: false, ajustesAplicados: [] },
    ]);
    expect(resumo).toEqual({
      total: 3,
      divergentes: 1,
      motorDesatualizado: 2,
      comAjustes: 2,
      comAjustesCriticos: 1,
      saudavel: false,
    });
  });

  it('marca saudável quando todos os snapshots estão limpos', () => {
    const resumo = resumirAuditoriaHistorico(
      Array.from({ length: 200 }, () => ({
        divergente: false,
        motorDesatualizado: false,
        ajustesAplicados: [],
      })),
    );
    expect(resumo.saudavel).toBe(true);
    expect(resumo.total).toBe(200);
  });
});

describe('filtrarHistorico / snapshotComPendencia', () => {
  const limpo = { id: 'a', divergente: false, motorDesatualizado: false, ajustesAplicados: [] };
  const divergente = { id: 'b', divergente: true, motorDesatualizado: false, ajustesAplicados: [] };
  const antigo = { id: 'c', divergente: false, motorDesatualizado: true, ajustesAplicados: [] };
  const comAjuste = {
    id: 'd',
    divergente: false,
    motorDesatualizado: false,
    ajustesAplicados: [ajuste('aviso')],
  };

  it('classifica pendências corretamente', () => {
    expect(snapshotComPendencia(limpo)).toBe(false);
    expect(snapshotComPendencia(divergente)).toBe(true);
    expect(snapshotComPendencia(antigo)).toBe(true);
    expect(snapshotComPendencia(comAjuste)).toBe(true);
  });

  it('retorna cópia integral quando o filtro está desligado', () => {
    const itens = [limpo, divergente];
    const resultado = filtrarHistorico(itens, false);
    expect(resultado).toEqual(itens);
    expect(resultado).not.toBe(itens);
  });

  it('mantém apenas pendências quando ligado, preservando a ordem', () => {
    const resultado = filtrarHistorico([limpo, divergente, antigo, comAjuste], true);
    expect(resultado.map((i) => i.id)).toEqual(['b', 'c', 'd']);
  });

  it('pode retornar lista vazia sem lançar', () => {
    expect(filtrarHistorico([limpo], true)).toEqual([]);
    expect(filtrarHistorico([], true)).toEqual([]);
  });
});

describe('montarLinhasAuditoriaCsv', () => {
  const base = {
    data_simulacao: '2026-01-10',
    regime_recomendado: 'simples_nacional',
    regimeRecalculado: 'simples_nacional',
    versao_motor: '3.4.0',
    rbt12: 1_000_000,
    folha_12m: 200_000,
    economia_anual_estimada: 50_000,
    divergente: false,
    motorDesatualizado: false,
    ajustesAplicados: [],
  };

  it('marca situação "ok" quando não há pendências', () => {
    const [linha] = montarLinhasAuditoriaCsv([base]);
    expect(linha.situacao).toBe('ok');
    expect(linha.qtdAjustes).toBe(0);
    expect(linha.ajustes).toBe('');
  });

  it('acumula marcas de divergência, motor antigo e ajuste crítico', () => {
    const [linha] = montarLinhasAuditoriaCsv([
      {
        ...base,
        divergente: true,
        motorDesatualizado: true,
        regimeRecalculado: 'lucro_presumido',
        ajustesAplicados: [
          {
            campo: 'margemLucro',
            rotulo: 'Margem de lucro',
            informado: '-5%',
            aplicado: '0%',
            severidade: 'critico',
            motivo: 'valor negativo',
          },
        ],
      },
    ]);
    expect(linha.situacao).toBe('divergente | motor antigo | ajuste crítico');
    expect(linha.ajustesCriticos).toBe(1);
    expect(linha.ajustes).toContain('Margem de lucro: -5% → 0%');
  });

  it('degrada valores não finitos e nulos para zero/legado', () => {
    const [linha] = montarLinhasAuditoriaCsv([
      {
        ...base,
        versao_motor: null,
        regimeRecalculado: null,
        rbt12: Number.NaN,
        folha_12m: Number.POSITIVE_INFINITY,
        economia_anual_estimada: null,
      },
    ]);
    expect(linha.versaoMotor).toBe('legado');
    expect(linha.regimeRecalculado).toBe('');
    expect(linha.faturamento12m).toBe(0);
    expect(linha.folha12m).toBe(0);
    expect(linha.economiaAnual).toBe(0);
  });
});

describe('paginarHistorico', () => {
  const lista = Array.from({ length: 12 }, (_, i) => i + 1);

  it('retorna a fatia correta e índices humanos', () => {
    const p = paginarHistorico(lista, 2, 5);
    expect(p.itens).toEqual([6, 7, 8, 9, 10]);
    expect(p).toMatchObject({ pagina: 2, totalPaginas: 3, total: 12, inicio: 6, fim: 10 });
  });

  it('faz clamp de páginas fora do intervalo', () => {
    expect(paginarHistorico(lista, 99, 5).pagina).toBe(3);
    expect(paginarHistorico(lista, 0, 5).pagina).toBe(1);
    expect(paginarHistorico(lista, Number.NaN, 5).pagina).toBe(1);
  });

  it('degrada tamanho inválido para 1 sem divisão por zero', () => {
    const p = paginarHistorico(lista, 1, 0);
    expect(p.totalPaginas).toBe(12);
    expect(p.itens).toEqual([1]);
  });

  it('lida com lista vazia', () => {
    const p = paginarHistorico([], 3, 5);
    expect(p).toMatchObject({ itens: [], pagina: 1, totalPaginas: 1, total: 0, inicio: 0, fim: 0 });
  });
});

describe('ordenarHistorico', () => {
  const item = (
    data: string,
    economia: number | null,
    extra: Partial<{ divergente: boolean; motorDesatualizado: boolean; ajustesAplicados: AjusteParametro[] }> = {},
  ) => ({
    data_simulacao: data,
    economia_anual_estimada: economia,
    divergente: false,
    motorDesatualizado: false,
    ajustesAplicados: [] as AjusteParametro[],
    ...extra,
  });

  const base = [
    item('2026-01-01', 100),
    item('2026-03-01', 900, { divergente: true }),
    item('2026-02-01', 500, { ajustesAplicados: [ajuste('critico')] }),
  ];

  it('não muta a lista original', () => {
    const copia = [...base];
    ordenarHistorico(base, 'data_asc');
    expect(base).toEqual(copia);
  });

  it('ordena por data decrescente por padrão', () => {
    expect(ordenarHistorico(base, 'data_desc').map((i) => i.data_simulacao)).toEqual([
      '2026-03-01',
      '2026-02-01',
      '2026-01-01',
    ]);
  });

  it('ordena por data crescente', () => {
    expect(ordenarHistorico(base, 'data_asc').map((i) => i.data_simulacao)).toEqual([
      '2026-01-01',
      '2026-02-01',
      '2026-03-01',
    ]);
  });

  it('ordena por maior economia, jogando nulos para o fim', () => {
    const comNulo = [...base, item('2026-04-01', null)];
    expect(ordenarHistorico(comNulo, 'economia_desc').map((i) => i.economia_anual_estimada)).toEqual([
      900, 500, 100, null,
    ]);
  });

  it('prioriza pendências: crítico > divergente > ajuste > ok', () => {
    expect(ordenarHistorico(base, 'pendencia').map((i) => i.data_simulacao)).toEqual([
      '2026-02-01',
      '2026-03-01',
      '2026-01-01',
    ]);
  });

  it('empurra datas inválidas para o fim na ordem decrescente', () => {
    const comInvalida = [item('nao-e-data', 10), ...base];
    expect(ordenarHistorico(comInvalida, 'data_desc').at(-1)?.data_simulacao).toBe('nao-e-data');
  });
});
