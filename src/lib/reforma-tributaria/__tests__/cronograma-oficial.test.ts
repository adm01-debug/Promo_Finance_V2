import { describe, it, expect } from 'vitest';
import { CRONOGRAMA_OFICIAL, obterLinhaCronograma } from '../cronograma-oficial';
import { REF_IBS, REF_CBS_2027 } from '@/config/reforma-tributaria';

describe('cronograma-oficial', () => {
  it('2029-2032: residual de ICMS/ISS + fração de IBS (sobre REF_IBS) fecham em 100%', () => {
    const anos2029a2032 = CRONOGRAMA_OFICIAL.filter((l) => l.ano >= 2029 && l.ano <= 2032);
    expect(anos2029a2032).toHaveLength(4);
    for (const linha of anos2029a2032) {
      const fracaoIbsPercentual = ((linha.ibsUf + linha.ibsMun) / REF_IBS) * 100;
      expect(linha.icmsResidual + fracaoIbsPercentual).toBeCloseTo(100, 0);
      expect(linha.issResidual + fracaoIbsPercentual).toBeCloseTo(100, 0);
    }
  });

  it('2029-2032: CBS sem o desconto de transição (REF_CBS_2027 pleno, art. 347 só vale 2027/2028)', () => {
    for (const ano of [2029, 2030, 2031, 2032]) {
      expect(obterLinhaCronograma(ano).cbs).toBe(REF_CBS_2027);
    }
  });

  it('2026 e 2027-2028: IBS total (UF+Mun) é 0,1%', () => {
    for (const ano of [2026, 2027, 2028]) {
      const linha = obterLinhaCronograma(ano);
      expect(linha.ibsUf + linha.ibsMun).toBeCloseTo(0.1, 5);
    }
  });

  it('2026: IBS é só estadual (art. 343 LC 214/2025), sem parcela municipal', () => {
    const linha2026 = obterLinhaCronograma(2026);
    expect(linha2026.ibsUf).toBeCloseTo(0.1, 5);
    expect(linha2026.ibsMun).toBe(0);
  });

  it('2027 em diante: IBS é partido 50/50 entre UF e Município', () => {
    for (const linha of CRONOGRAMA_OFICIAL.filter((l) => l.ano >= 2027)) {
      expect(linha.ibsUf).toBeCloseTo(linha.ibsMun, 10);
    }
  });

  it('2033: regime pleno, todos os residuais zerados', () => {
    const linha2033 = obterLinhaCronograma(2033);
    expect(linha2033.icmsResidual).toBe(0);
    expect(linha2033.issResidual).toBe(0);
    expect(linha2033.pisResidual).toBe(0);
    expect(linha2033.cofinsResidual).toBe(0);
  });

  it('antes de 2026: nenhum tributo novo, residuais 100%', () => {
    const linha = obterLinhaCronograma(2024);
    expect(linha.cbs).toBe(0);
    expect(linha.ibsUf + linha.ibsMun).toBe(0);
    expect(linha.icmsResidual).toBe(100);
  });

  it('após 2033: mantém o regime pleno (sem extrapolar residual negativo)', () => {
    const linha = obterLinhaCronograma(2040);
    expect(linha.icmsResidual).toBe(0);
    expect(linha.ibsUf).toBeCloseTo(obterLinhaCronograma(2033).ibsUf, 10);
  });

  it('todas as linhas declaram origem e fundamento', () => {
    for (const linha of CRONOGRAMA_OFICIAL) {
      expect(['lei', 'simulado']).toContain(linha.origem);
      expect(linha.fundamento.length).toBeGreaterThan(0);
    }
  });
});
