// COERÊNCIA ISS — Guarda de drift entre a lista LC 116/2003 embarcada no motor
// e a tabela `itens_lista_iss` do banco (fonte de verdade versionada).
//
// Módulo puro: recebe os registros já lidos do banco e devolve as divergências.
// Nenhum I/O, nenhuma dependência de React ou Supabase — 100% testável.

import { LISTA_LC116 } from '../ipi-iss/tabelas';

/** Recorte do registro de `itens_lista_iss` relevante para a comparação. */
export interface ItemIssBanco {
  codigo: string;
  descricao: string;
  retem_no_tomador: boolean;
  aliquota_minima: number;
  aliquota_maxima: number;
}

export type CampoDivergenteIss =
  | 'ausente'
  | 'excedente'
  | 'duplicado'
  | 'retencao'
  | 'aliquota_minima'
  | 'aliquota_maxima';

export interface DivergenciaIss {
  item: string;
  campo: CampoDivergenteIss;
  /** Valor conhecido pelo motor (ou pela lei, no caso das alíquotas). */
  valorCodigo: string | number | boolean | null;
  /** Valor encontrado no banco. */
  valorBanco: string | number | boolean | null;
}

/** Piso nacional do ISS — LC 116/2003, art. 8º-A (EC 37/2002, ADCT art. 88). */
export const ISS_PISO_LEGAL = 0.02;
/** Teto nacional do ISS — LC 116/2003, art. 8º, II. */
export const ISS_TETO_LEGAL = 0.05;

const EPSILON = 1e-9;
const iguais = (a: number, b: number) => Math.abs(a - b) <= EPSILON;

/** Normaliza o código do item (`07.02` e ` 7.2 ` → `7.02`). */
export function normalizarItemIss(codigo: string): string {
  const [grupo = '', sub = ''] = codigo.trim().split('.');
  const g = Number(grupo);
  const s = sub.trim();
  if (!Number.isFinite(g) || s === '') return codigo.trim();
  return `${g}.${s.padStart(2, '0')}`;
}

/**
 * Compara a lista embarcada no motor com o catálogo do banco.
 *
 * Regras verificadas, em ordem de gravidade:
 * 1. duplicidade de código no banco (quebra o índice de resolução);
 * 2. item do motor ausente no banco (o motor calcularia sem lastro versionado);
 * 3. item do banco desconhecido pelo motor (catálogo à frente do código);
 * 4. divergência de retenção no tomador (muda o sujeito passivo);
 * 5. piso/teto fora da faixa legal de 2% a 5%.
 */
export function compararItensIssComCatalogo(
  registros: readonly ItemIssBanco[],
): DivergenciaIss[] {
  const divergencias: DivergenciaIss[] = [];
  const porCodigo = new Map<string, ItemIssBanco>();

  for (const r of registros) {
    const codigo = normalizarItemIss(r.codigo);
    if (porCodigo.has(codigo)) {
      divergencias.push({ item: codigo, campo: 'duplicado', valorCodigo: null, valorBanco: r.codigo });
      continue;
    }
    porCodigo.set(codigo, r);
  }

  for (const esperado of LISTA_LC116) {
    const codigo = normalizarItemIss(esperado.item);
    const atual = porCodigo.get(codigo);
    if (!atual) {
      divergencias.push({ item: codigo, campo: 'ausente', valorCodigo: esperado.descricao, valorBanco: null });
      continue;
    }

    if (Boolean(atual.retem_no_tomador) !== esperado.retencaoIssPadrao) {
      divergencias.push({
        item: codigo,
        campo: 'retencao',
        valorCodigo: esperado.retencaoIssPadrao,
        valorBanco: Boolean(atual.retem_no_tomador),
      });
    }

    const min = Number(atual.aliquota_minima);
    const max = Number(atual.aliquota_maxima);

    if (!Number.isFinite(min) || min < ISS_PISO_LEGAL - EPSILON || min > ISS_TETO_LEGAL + EPSILON) {
      divergencias.push({ item: codigo, campo: 'aliquota_minima', valorCodigo: ISS_PISO_LEGAL, valorBanco: min });
    }
    if (
      !Number.isFinite(max) ||
      max > ISS_TETO_LEGAL + EPSILON ||
      max < ISS_PISO_LEGAL - EPSILON ||
      (Number.isFinite(min) && max < min && !iguais(max, min))
    ) {
      divergencias.push({ item: codigo, campo: 'aliquota_maxima', valorCodigo: ISS_TETO_LEGAL, valorBanco: max });
    }
  }

  const conhecidos = new Set(LISTA_LC116.map((i) => normalizarItemIss(i.item)));
  for (const codigo of porCodigo.keys()) {
    if (!conhecidos.has(codigo)) {
      divergencias.push({ item: codigo, campo: 'excedente', valorCodigo: null, valorBanco: codigo });
    }
  }

  return divergencias;
}

/** Traduz as divergências em mensagens legíveis para o painel administrativo. */
export function descreverDivergenciasIss(divergencias: readonly DivergenciaIss[]): string[] {
  return divergencias.map((d) => {
    switch (d.campo) {
      case 'ausente':
        return `Item ${d.item}: presente no motor mas ausente no catálogo do banco`;
      case 'excedente':
        return `Item ${d.item}: presente no banco mas desconhecido pelo motor`;
      case 'duplicado':
        return `Item ${d.item}: código duplicado no catálogo do banco`;
      case 'retencao':
        return `Item ${d.item} — retenção no tomador: motor ${d.valorCodigo} ≠ banco ${d.valorBanco}`;
      case 'aliquota_minima':
        return `Item ${d.item}: piso ${d.valorBanco} fora da faixa legal de 2% a 5%`;
      case 'aliquota_maxima':
        return `Item ${d.item}: teto ${d.valorBanco} fora da faixa legal de 2% a 5%`;
    }
  });
}
