// COERÊNCIA MVA/ST — Guarda de drift entre o catálogo de protocolos de
// substituição tributária (`protocolos_st_ncms` / `protocolos_st_ufs`) e o
// catálogo de NCMs (`ncms`), que carrega o marcador `sujeito_st` e a
// `mva_padrao` usada como fallback pelo motor.
//
// Módulo puro: recebe os registros já lidos do banco e devolve divergências.
// Nenhum I/O, nenhuma dependência de React ou Supabase — 100% testável.
//
// Racional jurídico: a MVA só é exigível quando (a) o NCM está amparado por
// protocolo/convênio vigente e (b) a UF envolvida é signatária desse
// protocolo. Um NCM marcado como `sujeito_st` sem lastro de protocolo levaria
// o motor a reter ST sem base normativa — por isso é tratado como crítico.

import {
  MVA_MAXIMA,
  normalizarMva,
  type RegistroProtocoloNcmBanco,
  type RegistroProtocoloUfBanco,
} from '../icms/overlay-mva';
import { UFS } from '../icms/tabelas';
import type { UF } from '../icms/types';
import type { NcmBanco } from './coerencia-ncm';

export type CampoDivergenteMva =
  | 'sem_protocolo'
  | 'ncm_desconhecido'
  | 'mva_divergente'
  | 'mva_invalida'
  | 'vinculo_duplicado'
  | 'vigencia_invalida'
  | 'protocolo_sem_ufs'
  | 'uf_invalida'
  | 'cobertura_parcial';

export interface DivergenciaMva {
  /** Item divergente: `NCM 40111000` ou `Protocolo ICMS 41/2008`. */
  item: string;
  campo: CampoDivergenteMva;
  /** Valor esperado pela regra legal / pelo catálogo de NCMs. */
  valorCodigo: string | number | boolean | null;
  /** Valor encontrado no catálogo de protocolos. */
  valorBanco: string | number | boolean | null;
}

const RE_NCM = /^\d{8}$/;
const RE_DATA = /^\d{4}-\d{2}-\d{2}$/;
const EPSILON = 1e-6;
const UFS_VALIDAS = new Set<string>(UFS as readonly string[]);

function normalizarCodigoNcm(valor: string | null | undefined): string | null {
  if (valor === null || valor === undefined) return null;
  const limpo = String(valor).replace(/\D/g, '');
  return RE_NCM.test(limpo) ? limpo : null;
}

function rotuloProtocolo(registro: {
  protocolo_id: string;
  protocolo_codigo?: string | null;
}): string {
  return `Protocolo ${registro.protocolo_codigo ?? registro.protocolo_id}`;
}

export interface EntradaCoerenciaMva {
  /** Vínculos NCM × protocolo lidos de `protocolos_st_ncms`. */
  vinculos: readonly RegistroProtocoloNcmBanco[];
  /** UFs signatárias lidas de `protocolos_st_ufs`. */
  ufs: readonly RegistroProtocoloUfBanco[];
  /** Catálogo `ncms`, usado como contraparte do marcador `sujeito_st`. */
  ncms?: readonly NcmBanco[];
}

/**
 * Compara o catálogo de MVA/ST com o catálogo de NCMs e com as regras
 * estruturais do overlay.
 *
 * Regras verificadas, em ordem de gravidade:
 * 1. NCM marcado como `sujeito_st` sem nenhum vínculo de protocolo;
 * 2. vínculo apontando para NCM inexistente/ inválido no catálogo `ncms`;
 * 3. MVA ausente, negativa ou acima do teto defensivo (300%);
 * 4. MVA do protocolo divergente da `mva_padrao` registrada no NCM;
 * 5. vínculo duplicado para o mesmo par (protocolo, NCM);
 * 6. janela de vigência invertida ou com data fora do formato ISO;
 * 7. protocolo sem nenhuma UF signatária (overlay nunca produz efeito);
 * 8. UF signatária fora das 27 unidades federadas;
 * 9. protocolo com cobertura parcial das UFs (lacuna de carga).
 */
export function compararMvaComCatalogo(entrada: EntradaCoerenciaMva): DivergenciaMva[] {
  const { vinculos, ufs, ncms } = entrada;
  const divergencias: DivergenciaMva[] = [];

  // Índice do catálogo de NCMs por código normalizado.
  const porNcm = new Map<string, NcmBanco>();
  for (const n of ncms ?? []) {
    const codigo = normalizarCodigoNcm(n.codigo);
    if (codigo) porNcm.set(codigo, n);
  }

  // --- Vínculos NCM × protocolo ---------------------------------------------
  const vistos = new Set<string>();
  const ncmsAmparados = new Set<string>();
  const protocolosComVinculo = new Map<string, string>();

  for (const v of vinculos) {
    const rotulo = rotuloProtocolo(v);
    protocolosComVinculo.set(v.protocolo_id, rotulo);

    const codigo = normalizarCodigoNcm(v.ncm_codigo);
    if (!codigo) {
      divergencias.push({
        item: rotulo,
        campo: 'ncm_desconhecido',
        valorCodigo: null,
        valorBanco: v.ncm_codigo ?? null,
      });
      continue;
    }
    ncmsAmparados.add(codigo);

    const chave = `${v.protocolo_id}:${codigo}`;
    if (vistos.has(chave)) {
      divergencias.push({
        item: `NCM ${codigo}`,
        campo: 'vinculo_duplicado',
        valorCodigo: 1,
        valorBanco: rotulo,
      });
      continue;
    }
    vistos.add(chave);

    // Vigência estruturalmente coerente.
    const de = v.vigente_de ?? null;
    const ate = v.vigente_ate ?? null;
    const formatoInvalido =
      (de !== null && !RE_DATA.test(de)) || (ate !== null && !RE_DATA.test(ate));
    if (formatoInvalido || (de !== null && ate !== null && ate < de)) {
      divergencias.push({
        item: `NCM ${codigo}`,
        campo: 'vigencia_invalida',
        valorCodigo: null,
        valorBanco: `${de ?? '—'} → ${ate ?? '—'}`,
      });
    }

    // MVA dentro dos limites defensivos.
    const mva = normalizarMva(v.mva_original);
    if (mva === null || mva <= 0 || mva > MVA_MAXIMA) {
      divergencias.push({
        item: `NCM ${codigo}`,
        campo: 'mva_invalida',
        valorCodigo: `0 < mva ≤ ${MVA_MAXIMA}`,
        valorBanco: v.mva_original ?? null,
      });
      continue;
    }

    // Coerência com o catálogo de NCMs.
    const doCatalogo = porNcm.get(codigo);
    if (ncms && !doCatalogo) {
      divergencias.push({
        item: `NCM ${codigo}`,
        campo: 'ncm_desconhecido',
        valorCodigo: null,
        valorBanco: rotulo,
      });
      continue;
    }

    const padrao = doCatalogo?.mva_padrao ?? null;
    if (padrao !== null) {
      const referencia = normalizarMva(padrao);
      if (referencia !== null && Math.abs(referencia - mva) > EPSILON) {
        divergencias.push({
          item: `NCM ${codigo}`,
          campo: 'mva_divergente',
          valorCodigo: referencia,
          valorBanco: mva,
        });
      }
    }
  }

  // --- NCMs sujeitos à ST sem lastro de protocolo ---------------------------
  for (const n of ncms ?? []) {
    if (!n.sujeito_st) continue;
    const codigo = normalizarCodigoNcm(n.codigo);
    if (!codigo || ncmsAmparados.has(codigo)) continue;
    divergencias.push({
      item: `NCM ${codigo}`,
      campo: 'sem_protocolo',
      valorCodigo: true,
      valorBanco: null,
    });
  }

  // --- UFs signatárias ------------------------------------------------------
  const porProtocolo = new Map<string, Set<UF>>();
  for (const u of ufs) {
    const sigla = (u.uf ?? '').toString().trim().toUpperCase();
    if (!UFS_VALIDAS.has(sigla)) {
      divergencias.push({
        item: rotuloProtocolo({ protocolo_id: u.protocolo_id }),
        campo: 'uf_invalida',
        valorCodigo: null,
        valorBanco: u.uf ?? null,
      });
      continue;
    }
    const set = porProtocolo.get(u.protocolo_id) ?? new Set<UF>();
    set.add(sigla as UF);
    porProtocolo.set(u.protocolo_id, set);
  }

  for (const [protocoloId, rotulo] of protocolosComVinculo) {
    const cobertura = porProtocolo.get(protocoloId);
    if (!cobertura || cobertura.size === 0) {
      divergencias.push({
        item: rotulo,
        campo: 'protocolo_sem_ufs',
        valorCodigo: UFS.length,
        valorBanco: 0,
      });
      continue;
    }
    if (cobertura.size < UFS.length) {
      divergencias.push({
        item: rotulo,
        campo: 'cobertura_parcial',
        valorCodigo: UFS.length,
        valorBanco: cobertura.size,
      });
    }
  }

  return divergencias;
}
