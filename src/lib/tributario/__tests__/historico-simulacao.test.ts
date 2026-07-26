import { describe, it, expect } from 'vitest';
import {
  normalizarParametrosSnapshot,
  normalizarAjustesAplicados,
  resumirAuditoriaHistorico,
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
    ['faturamento string', { faturamentoAnual: '1000' }],
    ['faturamento NaN', { faturamentoAnual: Number.NaN }],
    ['faturamento Infinity', { faturamentoAnual: Number.POSITIVE_INFINITY }],
  ])('rejeita %s', (_label, entrada) => {
    expect(normalizarParametrosSnapshot(entrada)).toBeNull();
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
