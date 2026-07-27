// CATÁLOGOS FISCAIS — Coerência das UFs entre banco e tabela ICMS do motor.

import { ALIQUOTAS_UF } from '../icms/tabelas';
import type { UF } from '../icms/types';
import type { UfCatalogo } from './types';

/** Divergência de UF entre o catálogo do banco e a tabela ICMS do motor. */
export interface DivergenciaUf {
  uf: string;
  campo: 'aliquota_interna' | 'aliquota_fcp' | 'ausente' | 'excedente';
  valorCodigo: number | null;
  valorBanco: number | null;
}

const EPSILON = 1e-9;

function difere(a: number, b: number): boolean {
  if (!Number.isFinite(a) || !Number.isFinite(b)) return true;
  return Math.abs(a - b) > EPSILON;
}

/**
 * Compara as UFs do catálogo com as alíquotas modais do motor.
 * Detecta ausências, excedentes e divergências de alíquota interna/FCP.
 */
export function compararUfsComCatalogo(
  ufsBanco: readonly UfCatalogo[],
): DivergenciaUf[] {
  const divergencias: DivergenciaUf[] = [];
  const siglasCodigo = Object.keys(ALIQUOTAS_UF) as UF[];

  for (const sigla of siglasCodigo) {
    const esperado = ALIQUOTAS_UF[sigla];
    const doBanco = ufsBanco.find((u) => u.sigla === sigla);

    if (!doBanco) {
      divergencias.push({
        uf: sigla,
        campo: 'ausente',
        valorCodigo: esperado.interna,
        valorBanco: null,
      });
      continue;
    }

    if (difere(esperado.interna, Number(doBanco.aliquota_interna_padrao))) {
      divergencias.push({
        uf: sigla,
        campo: 'aliquota_interna',
        valorCodigo: esperado.interna,
        valorBanco: Number(doBanco.aliquota_interna_padrao),
      });
    }

    if (difere(esperado.fcp, Number(doBanco.aliquota_fcp))) {
      divergencias.push({
        uf: sigla,
        campo: 'aliquota_fcp',
        valorCodigo: esperado.fcp,
        valorBanco: Number(doBanco.aliquota_fcp),
      });
    }
  }

  for (const uf of ufsBanco) {
    if (!siglasCodigo.includes(uf.sigla as UF)) {
      divergencias.push({
        uf: uf.sigla,
        campo: 'excedente',
        valorCodigo: null,
        valorBanco: Number(uf.aliquota_interna_padrao),
      });
    }
  }

  return divergencias;
}

/**
 * Consistência interna do catálogo: o marcador `possui_fcp` deve refletir
 * a existência de alíquota de FCP maior que zero.
 */
export function validarMarcadorFcp(ufsBanco: readonly UfCatalogo[]): string[] {
  return ufsBanco
    .filter((u) => u.possui_fcp !== Number(u.aliquota_fcp) > 0)
    .map((u) => `${u.sigla}: possui_fcp=${u.possui_fcp} mas aliquota_fcp=${u.aliquota_fcp}`);
}
