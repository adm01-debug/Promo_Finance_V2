import { describe, it, expect } from 'vitest';
import { calcularLucroReal } from '../lucro-real';
import type { InputLucroReal } from '../types';

const base: InputLucroReal = {
  receitas: { receitaBrutaAnual: 5_000_000, percentualServicos: 30 },
  lucroContabil: 800_000,
  lalur: {},
  creditosPisCofins: { insumos: 1_500_000 },
  folha: { folhaAnual: 600_000 },
  estadualMunicipal: { aliquotaIcms: 0.18, aliquotaIss: 0.05 },
  modo: 'anual_estimativa',
};

describe('calcularLucroReal', () => {
  it('calcula IRPJ com adicional 10% acima de R$ 240k anual', () => {
    const r = calcularLucroReal(base);
    const irpj = r.tributos.find((t) => t.nome === 'IRPJ')!;
    // base 800k → 15% = 120k + adicional (800k-240k)*10% = 56k → 176k
    expect(irpj.valor).toBeCloseTo(176_000, 0);
  });

  it('CSLL padrão 9%', () => {
    const r = calcularLucroReal(base);
    expect(r.tributos.find((t) => t.nome === 'CSLL')!.valor).toBeCloseTo(72_000, 0);
  });

  it('CSLL 15% quando flag financeira', () => {
    const r = calcularLucroReal({ ...base, csllAliquotaFinanceira: true });
    expect(r.tributos.find((t) => t.nome === 'CSLL')!.valor).toBeCloseTo(120_000, 0);
  });

  it('compensa prejuízo limitado a 30% do lucro real', () => {
    const r = calcularLucroReal({ ...base, prejuizoAcumulado: 1_000_000 });
    // compensa 30% de 800k = 240k → lucro real 560k
    // IRPJ: 560k*15% + (560k-240k)*10% = 84k + 32k = 116k
    expect(r.tributos.find((t) => t.nome === 'IRPJ')!.valor).toBeCloseTo(116_000, 0);
  });

  it('não gera adicional IRPJ quando base ≤ 240k', () => {
    const r = calcularLucroReal({ ...base, lucroContabil: 200_000 });
    expect(r.tributos.find((t) => t.nome === 'IRPJ')!.valor).toBeCloseTo(30_000, 0);
  });

  it('aplica créditos PIS/COFINS', () => {
    const r = calcularLucroReal(base);
    // receita 5mi, créditos 1.5mi
    // PIS: 5mi*0.0165 - 1.5mi*0.0165 = 57.75k
    // COFINS: 5mi*0.076 - 1.5mi*0.076 = 266k
    expect(r.tributos.find((t) => t.nome === 'PIS')!.valor).toBeCloseTo(57_750, 0);
    expect(r.tributos.find((t) => t.nome === 'COFINS')!.valor).toBeCloseTo(266_000, 0);
  });

  it('PIS/COFINS não vira negativo com créditos > débitos', () => {
    const r = calcularLucroReal({
      ...base,
      creditosPisCofins: { insumos: 10_000_000 },
    });
    expect(r.tributos.find((t) => t.nome === 'PIS')!.valor).toBe(0);
    expect(r.tributos.find((t) => t.nome === 'COFINS')!.valor).toBe(0);
  });

  it('carga efetiva > 0 quando há tributos', () => {
    const r = calcularLucroReal(base);
    expect(r.cargaEfetiva).toBeGreaterThan(0);
    expect(r.totalAPagar).toBeGreaterThan(0);
  });

  it('desconta retenções do total a pagar', () => {
    const semRet = calcularLucroReal(base);
    const comRet = calcularLucroReal({ ...base, retencoes: { irrfSofrido: 10_000 } });
    expect(comRet.totalAPagar).toBeCloseTo(semRet.totalAPagar - 10_000, 0);
  });

  it('memória de cálculo é ordenada e não vazia', () => {
    const r = calcularLucroReal(base);
    expect(r.memoria.length).toBeGreaterThan(5);
    r.memoria.forEach((l, i) => expect(l.ordem).toBe(i + 1));
  });
});
