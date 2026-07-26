import { describe, it, expect } from 'vitest';
import {
  VERSAO_MOTOR_TRIBUTARIO,
  compararVersaoMotor,
  versaoDesatualizada,
} from '../versao';

describe('versionamento do motor tributário', () => {
  it('expõe uma versão semântica válida', () => {
    expect(VERSAO_MOTOR_TRIBUTARIO).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it('compara versões corretamente', () => {
    expect(compararVersaoMotor('3.4.0', '3.4.0')).toBe(0);
    expect(compararVersaoMotor('3.3.9', '3.4.0')).toBe(-1);
    expect(compararVersaoMotor('4.0.0', '3.99.99')).toBe(1);
    expect(compararVersaoMotor('3.4', '3.4.0')).toBe(0);
  });

  it('é tolerante a entradas malformadas', () => {
    expect(compararVersaoMotor('abc', '0.0.0')).toBe(0);
    expect(compararVersaoMotor('1.x.3', '1.0.3')).toBe(0);
  });

  it('detecta snapshots desatualizados', () => {
    expect(versaoDesatualizada(null)).toBe(true);
    expect(versaoDesatualizada(undefined)).toBe(true);
    expect(versaoDesatualizada('0.0.1')).toBe(true);
    expect(versaoDesatualizada(VERSAO_MOTOR_TRIBUTARIO)).toBe(false);
  });

  it('não marca versões futuras como desatualizadas', () => {
    expect(versaoDesatualizada('99.0.0')).toBe(false);
  });

  it('mantém ordenação total em centenas de combinações', () => {
    const versoes: string[] = [];
    for (let major = 0; major < 8; major += 1) {
      for (let minor = 0; minor < 8; minor += 1) {
        for (let patch = 0; patch < 6; patch += 1) {
          versoes.push(`${major}.${minor}.${patch}`);
        }
      }
    }
    for (let i = 0; i < versoes.length; i += 1) {
      for (let j = i + 1; j < versoes.length; j += 1) {
        expect(compararVersaoMotor(versoes[i], versoes[j])).toBe(-1);
        expect(compararVersaoMotor(versoes[j], versoes[i])).toBe(1);
      }
    }
  });
});
