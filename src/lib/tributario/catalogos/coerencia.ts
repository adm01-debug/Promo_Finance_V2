// CATÁLOGOS FISCAIS — Comparação pura entre banco e constantes do motor.
// Objetivo: detectar drift entre a fonte de verdade versionada (banco)
// e as tabelas hard-coded usadas pelo cálculo em tempo real.

import { obterAnexo } from '../aliquotas-simples';
import type { AnexoSimples } from '../types';
import type { DivergenciaCatalogo, FaixaSimplesCatalogo } from './types';

const ANEXOS: AnexoSimples[] = ['I', 'II', 'III', 'IV', 'V'];

/** Tolerância absoluta para comparação de números em ponto flutuante. */
const EPSILON = 1e-9;

function difere(a: number, b: number): boolean {
  if (!Number.isFinite(a) || !Number.isFinite(b)) return true;
  return Math.abs(a - b) > EPSILON;
}

/**
 * Compara as faixas vindas do banco com as constantes do motor.
 * Retorna a lista de divergências (vazia quando há coerência total).
 */
export function compararFaixasComCatalogo(
  faixasBanco: readonly FaixaSimplesCatalogo[],
): DivergenciaCatalogo[] {
  const divergencias: DivergenciaCatalogo[] = [];

  for (const anexo of ANEXOS) {
    const faixasCodigo = obterAnexo(anexo);

    for (const faixaCodigo of faixasCodigo) {
      const doBanco = faixasBanco.find(
        (f) => f.anexo === anexo && Number(f.faixa) === faixaCodigo.faixa,
      );

      if (!doBanco) {
        divergencias.push({
          anexo,
          faixa: faixaCodigo.faixa,
          campo: 'ausente',
          valorCodigo: faixaCodigo.aliquota,
          valorBanco: null,
        });
        continue;
      }

      const pares: Array<[DivergenciaCatalogo['campo'], number, number]> = [
        ['rbt12_de', faixaCodigo.rbt12_de, Number(doBanco.rbt12_de)],
        ['rbt12_ate', faixaCodigo.rbt12_ate, Number(doBanco.rbt12_ate)],
        ['aliquota', faixaCodigo.aliquota, Number(doBanco.aliquota)],
        ['parcela_deduzir', faixaCodigo.pd, Number(doBanco.parcela_deduzir)],
      ];

      for (const [campo, valorCodigo, valorBanco] of pares) {
        if (difere(valorCodigo, valorBanco)) {
          divergencias.push({ anexo, faixa: faixaCodigo.faixa, campo, valorCodigo, valorBanco });
        }
      }
    }
  }

  return divergencias;
}

/** Resumo textual das divergências, apto para log e UI administrativa. */
export function descreverDivergencias(divergencias: readonly DivergenciaCatalogo[]): string[] {
  return divergencias.map((d) =>
    d.campo === 'ausente'
      ? `Anexo ${d.anexo} faixa ${d.faixa}: ausente no catálogo do banco`
      : `Anexo ${d.anexo} faixa ${d.faixa} — ${d.campo}: código ${d.valorCodigo} ≠ banco ${d.valorBanco}`,
  );
}
