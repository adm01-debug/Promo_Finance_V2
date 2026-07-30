import { describe, it, expect } from 'vitest';
import { derivarAtividadePresumido, normalizarCnae } from '../atividade-cnae';
import { calcularLucroPresumido } from '../lucro-presumido';
import type { AtividadePresumido } from '../types';

describe('normalizarCnae', () => {
  it.each([
    ['4930-2/02', '4930202'],
    ['49.30-2-02', '4930202'],
    ['4930202', '4930202'],
    ['86101', '8610100'],
  ])('normaliza %s para %s', (entrada, esperado) => {
    expect(normalizarCnae(entrada)).toBe(esperado);
  });

  it.each([null, undefined, '', 'abc', '123'])('rejeita entrada inválida %s', (v) => {
    expect(normalizarCnae(v as string | null)).toBeNull();
  });
});

describe('derivarAtividadePresumido', () => {
  const casos: Array<[string, AtividadePresumido, number, number]> = [
    ['4930-2/02', 'transporte_cargas', 0.08, 0.12],
    ['4922-1/01', 'transporte_passageiros', 0.16, 0.12],
    ['8610-1/01', 'servicos_hospitalares', 0.08, 0.12],
    ['4711-3/02', 'comercio', 0.08, 0.12],
    ['1091-1/02', 'industria', 0.08, 0.12],
    ['6920-6/01', 'servicos_profissionais', 0.32, 0.32],
    ['5611-2/01', 'servicos_geral', 0.32, 0.32],
    ['4120-4/00', 'industria', 0.08, 0.12],
    ['5112-9/01', 'transporte_cargas', 0.08, 0.12],
    ['5111-1/00', 'transporte_passageiros', 0.16, 0.12],
  ];

  it.each(casos)('%s → %s', (cnae, atividade, irpj, csll) => {
    const r = derivarAtividadePresumido(cnae);
    expect(r.atividade).toBe(atividade);
    expect(r.presuncaoIrpj).toBeCloseTo(irpj, 4);
    expect(r.presuncaoCsll).toBeCloseTo(csll, 4);
    expect(r.fundamento.length).toBeGreaterThan(0);
  });

  it('usa fallback conservador de 32% sem CNAE', () => {
    const r = derivarAtividadePresumido(null);
    expect(r.origem).toBe('fallback');
    expect(r.presuncaoIrpj).toBe(0.32);
  });

  it('prioriza a subclasse sobre a divisão', () => {
    // divisão 49 é transporte_cargas por padrão, mas 4922 é passageiros
    expect(derivarAtividadePresumido('4922100').origem).toBe('subclasse');
    expect(derivarAtividadePresumido('4940000').origem).toBe('divisao');
  });

  it('integra com o motor de Lucro Presumido reduzindo a carga de transportadora', () => {
    const receitas = { receitaBrutaAnual: 5_000_000, percentualServicos: 100 };
    const comum = { receitas, folha: { folhaAnual: 0 }, estadualMunicipal: {} };
    const derivado = derivarAtividadePresumido('4930-2/02');
    const cargas = calcularLucroPresumido({ ...comum, atividade: derivado.atividade });
    const geral = calcularLucroPresumido({ ...comum, atividade: 'servicos_geral' });
    expect(cargas.totalTributos).toBeLessThan(geral.totalTributos);
  });

  // ---- Varredura exaustiva: todas as divisões x subclasses ----
  it('nunca retorna resultado inválido em 900 CNAEs varridos', () => {
    const validas = new Set<AtividadePresumido>([
      'comercio', 'industria', 'servicos_geral', 'servicos_profissionais',
      'transporte_cargas', 'transporte_passageiros', 'servicos_hospitalares',
    ]);
    let checados = 0;
    for (let divisao = 1; divisao <= 99; divisao += 1) {
      for (let grupo = 0; grupo <= 8; grupo += 1) {
        const cnae = `${String(divisao).padStart(2, '0')}${grupo}0${grupo}00`;
        const r = derivarAtividadePresumido(cnae);
        expect(validas.has(r.atividade)).toBe(true);
        expect(r.presuncaoIrpj).toBeGreaterThan(0);
        expect(r.presuncaoIrpj).toBeLessThanOrEqual(0.32);
        expect(r.presuncaoCsll).toBeGreaterThanOrEqual(0.12);
        expect(r.presuncaoCsll).toBeLessThanOrEqual(0.32);
        checados += 1;
      }
    }
    expect(checados).toBeGreaterThanOrEqual(891);
  });

  it('é determinístico e idempotente frente a formatações distintas', () => {
    const variantes = ['4930-2/02', '49302 02', '49.30-2-02', '4930202'];
    const resultados = variantes.map((v) => derivarAtividadePresumido(v).atividade);
    expect(new Set(resultados).size).toBe(1);
  });
});
