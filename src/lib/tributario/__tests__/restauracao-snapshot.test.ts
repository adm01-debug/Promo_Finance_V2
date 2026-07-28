import { describe, it, expect } from 'vitest';
import {
  mesclarSnapshotParametros,
  normalizarParametrosSnapshot,
} from '../historico-simulacao';
import type { ParametrosSimulacao } from '../types';

/**
 * Simulação de restauração de snapshots do histórico.
 *
 * Regra auditada: restaurar um snapshot deve reproduzi-lo exatamente. Campos
 * avançados digitados APÓS o snapshot (lucro por trimestre, prejuízos,
 * periodicidade, presunções) não podem vazar para o cenário histórico.
 */

const atualRico: ParametrosSimulacao = {
  faturamentoAnual: 9_000_000,
  folhaAnual: 1_200_000,
  margemLucro: 22,
  percentualServicos: 70,
  prejuizoFiscalAcumulado: 3_000_000,
  baseNegativaCsllAcumulada: 3_000_000,
  periodicidadeApuracao: 'trimestral',
  lucroTrimestral: [500_000, -200_000, 700_000, 100_000],
  aliquotaICMS: 0.12,
  aliquotaISS: 0.02,
  comprasComCredito: 800_000,
  uf: 'SP',
};

function rng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1103515245 + 12345) >>> 0;
    return s / 0xffffffff;
  };
}

describe('restauração reprodutível de snapshots', () => {
  it('remove campos opcionais ausentes no snapshot', () => {
    const snapshot = normalizarParametrosSnapshot({
      faturamentoAnual: 2_000_000,
      folhaAnual: 300_000,
      margemLucro: 10,
      percentualServicos: 40,
    });
    expect(snapshot).not.toBeNull();
    const restaurado = mesclarSnapshotParametros(atualRico, snapshot!);
    expect(restaurado.lucroTrimestral).toBeUndefined();
    expect(restaurado.periodicidadeApuracao).toBeUndefined();
    expect(restaurado.prejuizoFiscalAcumulado).toBeUndefined();
    expect(restaurado.aliquotaICMS).toBeUndefined();
    expect(restaurado.uf).toBeUndefined();
    expect(restaurado.faturamentoAnual).toBe(2_000_000);
  });

  it('preserva os campos presentes no snapshot', () => {
    const snapshot = normalizarParametrosSnapshot({
      faturamentoAnual: 5_000_000,
      folhaAnual: 100_000,
      margemLucro: 12,
      percentualServicos: 20,
      lucroTrimestral: [10, 20, 30, 40],
      periodicidadeApuracao: 'anual',
      aliquotaISS: 0.05,
    });
    const restaurado = mesclarSnapshotParametros(atualRico, snapshot!);
    expect(restaurado.lucroTrimestral).toEqual([10, 20, 30, 40]);
    expect(restaurado.periodicidadeApuracao).toBe('anual');
    expect(restaurado.aliquotaISS).toBeCloseTo(0.05, 6);
  });

  it('não muta o objeto de parâmetros correntes', () => {
    const copia = JSON.parse(JSON.stringify(atualRico));
    const snapshot = normalizarParametrosSnapshot({ faturamentoAnual: 1_000 })!;
    mesclarSnapshotParametros(atualRico, snapshot);
    expect(atualRico).toEqual(copia);
  });

  it('é idempotente e determinístico em centenas de snapshots aleatórios', () => {
    const random = rng(424242);
    for (let i = 0; i < 300; i += 1) {
      const bruto: Record<string, unknown> = {
        faturamentoAnual: Math.round(random() * 50_000_000),
        folhaAnual: Math.round(random() * 5_000_000),
        margemLucro: Math.round(random() * 60),
        percentualServicos: Math.round(random() * 100),
      };
      if (random() > 0.5) bruto.periodicidadeApuracao = random() > 0.5 ? 'anual' : 'trimestral';
      if (random() > 0.5) {
        bruto.lucroTrimestral = Array.from({ length: 4 }, () => Math.round((random() - 0.3) * 800_000));
      }
      if (random() > 0.5) bruto.prejuizoFiscalAcumulado = Math.round(random() * 4_000_000);

      const snapshot = normalizarParametrosSnapshot(bruto);
      expect(snapshot).not.toBeNull();
      const um = mesclarSnapshotParametros(atualRico, snapshot!);
      const dois = mesclarSnapshotParametros(um, snapshot!);
      expect(dois).toEqual(um);
      // Todo campo opcional presente no resultado precisa existir no snapshot.
      if (um.lucroTrimestral) expect(snapshot!.lucroTrimestral).toBeDefined();
      if (um.periodicidadeApuracao) expect(snapshot!.periodicidadeApuracao).toBeDefined();
      if (um.prejuizoFiscalAcumulado !== undefined) {
        expect(snapshot!.prejuizoFiscalAcumulado).toBeDefined();
      }
    }
  });
});
