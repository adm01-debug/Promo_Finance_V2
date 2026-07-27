import { describe, it, expect } from 'vitest';
import {
  irpjPeriodoTrimestral,
  irpjPeriodoAnual,
  distribuirTrimestres,
  apurarRealTrimestral,
  simularPresumido,
  simularReal,
  type ParametrosSimulacao,
  type FaturamentoMes,
} from '../shared-logic';

const base: ParametrosSimulacao = {
  faturamentoAnual: 2_400_000,
  margemLucro: 12,
  percentualServicos: 100,
  folhaAnual: 0,
  comprasComCredito: 0,
  despesasOperacionais: 0,
};

function meses(valores: number[]): FaturamentoMes[] {
  return valores.map((v, i) => ({ ano: 2026, mes: i + 1, receita_bruta: v }));
}

describe('IRPJ por período de apuração', () => {
  it('não aplica adicional até R$ 60 mil no trimestre', () => {
    expect(irpjPeriodoTrimestral(60_000)).toBeCloseTo(9_000, 2);
  });

  it('aplica 10% sobre o excedente trimestral', () => {
    expect(irpjPeriodoTrimestral(100_000)).toBeCloseTo(15_000 + 4_000, 2);
  });

  it('usa limite de R$ 240 mil no período anual', () => {
    expect(irpjPeriodoAnual(240_000)).toBeCloseTo(36_000, 2);
    expect(irpjPeriodoAnual(400_000)).toBeCloseTo(60_000 + 16_000, 2);
  });

  it('é equivalente ao anual quando a base é uniforme', () => {
    const anual = irpjPeriodoAnual(400_000);
    const trimestral = [1, 2, 3, 4].reduce((a) => a + irpjPeriodoTrimestral(100_000), 0);
    expect(trimestral).toBeCloseTo(anual, 6);
  });

  it('rejeita entradas inválidas sem propagar NaN', () => {
    expect(irpjPeriodoTrimestral(Number.NaN)).toBe(0);
    expect(irpjPeriodoAnual(-500_000)).toBe(0);
  });
});

describe('distribuirTrimestres', () => {
  it('distribui uniformemente sem histórico mensal', () => {
    expect(distribuirTrimestres(base)).toEqual([600_000, 600_000, 600_000, 600_000]);
  });

  it('respeita a sazonalidade do histórico mensal', () => {
    const p = { ...base, faturamentoMensal: meses([0, 0, 0, 0, 0, 0, 0, 0, 0, 100, 100, 200]) };
    const t = distribuirTrimestres(p);
    expect(t[0]).toBe(0);
    expect(t[3]).toBeCloseTo(2_400_000, 6);
  });

  it('preserva o total distribuído', () => {
    const p = { ...base, faturamentoMensal: meses([5, 1, 9, 3, 7, 2, 8, 4, 6, 1, 3, 5]) };
    const soma = distribuirTrimestres(p).reduce((a, b) => a + b, 0);
    expect(soma).toBeCloseTo(2_400_000, 4);
  });

  it('ignora meses fora do intervalo 1..12', () => {
    const p = { ...base, faturamentoMensal: [{ ano: 2026, mes: 99, receita_bruta: 1000 }] };
    expect(distribuirTrimestres(p)).toEqual([600_000, 600_000, 600_000, 600_000]);
  });
});

describe('Lucro Presumido — apuração trimestral obrigatória', () => {
  it('marca a periodicidade e expõe as bases trimestrais', () => {
    const r = simularPresumido(base);
    expect(r.periodicidadeApuracao).toBe('trimestral');
    expect(r.irpjBasesTrimestrais).toHaveLength(4);
  });

  it('sazonalidade extrema aumenta o adicional frente ao anual equivalente', () => {
    const sazonal = simularPresumido({
      ...base,
      faturamentoMensal: meses([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 12]),
    });
    const uniforme = simularPresumido(base);
    expect(sazonal.irpj).toBeGreaterThan(uniforme.irpj);
    expect(sazonal.efeitoSazonalidadeIrpj ?? 0).toBeGreaterThan(0);
  });

  it('não cobra adicional extra quando a receita é uniforme', () => {
    const r = simularPresumido(base);
    expect(Math.abs(r.efeitoSazonalidadeIrpj ?? 0)).toBeLessThan(0.01);
  });
});

describe('Lucro Real — trimestral vs anual', () => {
  it('default é apuração anual', () => {
    expect(simularReal(base).periodicidadeApuracao).toBe('anual');
  });

  it('trimestral com resultados irregulares custa mais que o anual', () => {
    const p: ParametrosSimulacao = {
      ...base,
      lucroTrimestral: [-300_000, 400_000, -100_000, 300_000],
    };
    const anual = simularReal({ ...p, periodicidadeApuracao: 'anual' });
    const trimestral = simularReal({ ...p, periodicidadeApuracao: 'trimestral' });
    expect(trimestral.irpj + trimestral.csll).toBeGreaterThan(anual.irpj + anual.csll);
    expect(anual.economiaPeriodicidade ?? 0).toBeGreaterThan(0);
  });

  it('respeita a trava de 30% em cada trimestre', () => {
    const r = apurarRealTrimestral([-100_000, 100_000, 0, 0], 0, 0);
    // 30% de 100k compensados; base de 70k tributada.
    expect(r.compensadoIrpj).toBeCloseTo(30_000, 2);
    expect(r.saldoIrpj).toBeCloseTo(70_000, 2);
    expect(r.irpj).toBeCloseTo(irpjPeriodoTrimestral(70_000), 6);
  });

  it('lucros uniformes tornam as periodicidades equivalentes', () => {
    const anual = simularReal({ ...base, periodicidadeApuracao: 'anual' });
    const trimestral = simularReal({ ...base, periodicidadeApuracao: 'trimestral' });
    expect(trimestral.totalTributos).toBeCloseTo(anual.totalTributos, 4);
  });

  it('sanitiza lucroTrimestral com tamanho inválido', () => {
    const r = simularReal({ ...base, lucroTrimestral: [1, 2] as number[], periodicidadeApuracao: 'trimestral' });
    expect(Number.isFinite(r.totalTributos)).toBe(true);
    expect(r.totalTributos).toBeGreaterThan(0);
  });
});

describe('Fuzzing de 500 cenários de periodicidade', () => {
  it('mantém invariantes numéricas em todos os cenários', () => {
    let rng = 987654321;
    const rand = () => ((rng = (rng * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
    for (let i = 0; i < 500; i += 1) {
      const p: ParametrosSimulacao = {
        faturamentoAnual: 10_000 + rand() * 60_000_000,
        margemLucro: -20 + rand() * 60,
        percentualServicos: rand() * 100,
        folhaAnual: rand() * 1_000_000,
        comprasComCredito: rand() * 1_000_000,
        despesasOperacionais: rand() * 1_000_000,
        periodicidadeApuracao: rand() > 0.5 ? 'trimestral' : 'anual',
        faturamentoMensal: meses(Array.from({ length: 12 }, () => rand() * 100)),
      };
      const real = simularReal(p);
      const pres = simularPresumido(p);
      for (const r of [real, pres]) {
        expect(Number.isFinite(r.totalTributos)).toBe(true);
        expect(r.irpj).toBeGreaterThanOrEqual(0);
        expect(r.csll).toBeGreaterThanOrEqual(0);
        expect(r.totalTributos).toBeGreaterThanOrEqual(0);
      }
      if (pres.elegivel) {
        // A apuração trimestral nunca pode ser mais barata que a anual equivalente.
        expect(pres.efeitoSazonalidadeIrpj ?? 0).toBeGreaterThan(-0.01);
      }
    }
  });
});
