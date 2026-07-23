import { describe, it, expect } from 'vitest';
import { validarConsistenciaNcmCst } from '../validador-ncm-cst';

describe('validarConsistenciaNcmCst', () => {
  it('retorna score 100 para NCM/CST consistentes (comércio comum)', () => {
    const r = validarConsistenciaNcmCst('61091000', '00');
    expect(r.score).toBe(100);
    expect(r.divergencias).toHaveLength(0);
  });

  it('penaliza NCM monofásico (medicamentos 3004) com CST divergente', () => {
    const r = validarConsistenciaNcmCst('30041000', '00');
    expect(r.score).toBe(75);
    expect(r.divergencias[0].campo).toBe('CST/CSOSN');
  });

  it('aceita CSTs válidos para monofásicos (04/06/60/060)', () => {
    for (const cst of ['04', '06', '60', '060']) {
      expect(validarConsistenciaNcmCst('30041000', cst).score).toBe(100);
    }
  });

  it('penaliza eletrônicos (8517) sem Substituição Tributária', () => {
    const r = validarConsistenciaNcmCst('85171100', '00');
    expect(r.score).toBe(85);
    expect(r.divergencias.some(d => d.mensagem.includes('Substituição Tributária'))).toBe(true);
  });

  it('aceita eletrônicos (8517) com CST de ST (60)', () => {
    expect(validarConsistenciaNcmCst('85171100', '60').score).toBe(100);
  });

  it('penaliza NCM com tamanho inválido', () => {
    const r = validarConsistenciaNcmCst('1234', '00');
    expect(r.score).toBe(90);
    expect(r.divergencias.some(d => d.campo === 'NCM')).toBe(true);
  });

  it('acumula múltiplas divergências (monofásico + tamanho inválido)', () => {
    const r = validarConsistenciaNcmCst('3004', '00');
    expect(r.score).toBe(65); // -25 (monofásico) -10 (tamanho)
    expect(r.divergencias).toHaveLength(2);
  });

  it('nunca retorna score negativo', () => {
    const r = validarConsistenciaNcmCst('300', '99');
    expect(r.score).toBeGreaterThanOrEqual(0);
  });

  it('normaliza pontuação no NCM (remove não dígitos)', () => {
    expect(validarConsistenciaNcmCst('6109.10.00', '00').score).toBe(100);
  });
});
