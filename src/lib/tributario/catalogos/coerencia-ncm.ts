// COERÊNCIA NCM — Guarda de drift entre as tabelas embarcadas no motor
// (TIPI do Decreto 11.158/2022 e catálogo monofásico de PIS/COFINS) e a
// tabela `ncms` do banco, que é a fonte de verdade versionada.
//
// Módulo puro: recebe os registros já lidos do banco e devolve as divergências.
// Nenhum I/O, nenhuma dependência de React ou Supabase — 100% testável.

import { TIPI, buscarTipiCanonica } from '../ipi-iss/tabelas';
import { classificarNcmMonofasico, normalizarNcm } from '../monofasico/classificar';

/** Recorte do registro de `ncms` relevante para a comparação. */
export interface NcmBanco {
  codigo: string;
  descricao: string;
  aliquota_ipi: number;
  monofasico_pis_cofins: boolean;
  sujeito_st: boolean;
  mva_padrao: number | null;
}

export type CampoDivergenteNcm =
  | 'ausente'
  | 'duplicado'
  | 'codigo_invalido'
  | 'aliquota_ipi'
  | 'monofasico'
  | 'mva_padrao';

export interface DivergenciaNcm {
  ncm: string;
  campo: CampoDivergenteNcm;
  /** Valor conhecido pelo motor (ou pela regra legal, no caso do MVA). */
  valorCodigo: string | number | boolean | null;
  /** Valor encontrado no banco. */
  valorBanco: string | number | boolean | null;
}

/** Teto defensivo para MVA: nenhum protocolo de ST brasileiro chega a 300%. */
export const MVA_MAXIMO = 3;

const EPSILON = 1e-9;
const difere = (a: number, b: number) => !Number.isFinite(a) || !Number.isFinite(b) || Math.abs(a - b) > EPSILON;

/**
 * Compara o catálogo `ncms` do banco com as tabelas embarcadas no motor.
 *
 * Regras verificadas, em ordem de gravidade:
 * 1. código fora do formato de 8 dígitos (quebra a resolução por NCM);
 * 2. duplicidade de código normalizado;
 * 3. NCM da TIPI ausente no banco (o motor calcularia IPI sem lastro versionado);
 * 4. divergência da alíquota de IPI frente à TIPI embarcada;
 * 5. divergência do marcador monofásico frente à classificação do motor;
 * 6. MVA ausente/negativo/absurdo em NCM marcado como sujeito à ST.
 *
 * NCMs presentes no banco e desconhecidos pela TIPI **não** são divergência:
 * o catálogo pode legitimamente cobrir mais posições que o recorte do motor.
 */
export function compararNcmsComCatalogo(
  registros: readonly NcmBanco[],
): DivergenciaNcm[] {
  const divergencias: DivergenciaNcm[] = [];
  const porCodigo = new Map<string, NcmBanco>();

  for (const r of registros) {
    const codigo = normalizarNcm(r?.codigo ?? '');
    if (codigo.length !== 8) {
      divergencias.push({
        ncm: (r?.codigo ?? '').toString(),
        campo: 'codigo_invalido',
        valorCodigo: 8,
        valorBanco: codigo.length,
      });
      continue;
    }
    if (porCodigo.has(codigo)) {
      divergencias.push({ ncm: codigo, campo: 'duplicado', valorCodigo: null, valorBanco: r.codigo });
      continue;
    }
    porCodigo.set(codigo, r);
  }

  // 1) Cobertura e paridade da TIPI embarcada.
  for (const item of TIPI) {
    const codigo = normalizarNcm(item.ncm);
    const atual = porCodigo.get(codigo);
    if (!atual) {
      divergencias.push({ ncm: codigo, campo: 'ausente', valorCodigo: item.descricao, valorBanco: null });
      continue;
    }
    const doBanco = Number(atual.aliquota_ipi);
    if (difere(doBanco, item.aliquota)) {
      divergencias.push({
        ncm: codigo,
        campo: 'aliquota_ipi',
        valorCodigo: item.aliquota,
        valorBanco: Number.isFinite(doBanco) ? doBanco : null,
      });
    }
  }

  // 2) Marcador monofásico e sanidade do MVA para todo o catálogo do banco.
  for (const [codigo, registro] of porCodigo) {
    const esperadoMono = classificarNcmMonofasico(codigo) !== null;
    const doBanco = Boolean(registro.monofasico_pis_cofins);
    if (esperadoMono !== doBanco) {
      divergencias.push({
        ncm: codigo,
        campo: 'monofasico',
        valorCodigo: esperadoMono,
        valorBanco: doBanco,
      });
    }

    if (registro.sujeito_st) {
      const mva = registro.mva_padrao === null ? null : Number(registro.mva_padrao);
      if (mva === null || !Number.isFinite(mva) || mva <= 0 || mva > MVA_MAXIMO) {
        divergencias.push({ ncm: codigo, campo: 'mva_padrao', valorCodigo: MVA_MAXIMO, valorBanco: mva });
      }
    }
  }

  return divergencias;
}

/** NCMs presentes no banco e ainda desconhecidos pela TIPI embarcada (informativo). */
export function ncmsForaDaTipi(registros: readonly NcmBanco[]): string[] {
  return registros
    .map((r) => normalizarNcm(r?.codigo ?? ''))
    .filter((c) => c.length === 8 && buscarTipiCanonica(c) === undefined)
    .sort();
}

/** Traduz as divergências em mensagens legíveis para o painel administrativo. */
export function descreverDivergenciasNcm(divergencias: readonly DivergenciaNcm[]): string[] {
  return divergencias.map((d) => {
    switch (d.campo) {
      case 'ausente':
        return `NCM ${d.ncm}: presente na TIPI do motor mas ausente no catálogo do banco`;
      case 'duplicado':
        return `NCM ${d.ncm}: código duplicado no catálogo do banco`;
      case 'codigo_invalido':
        return `NCM "${d.ncm}": código fora do formato de 8 dígitos`;
      case 'aliquota_ipi':
        return `NCM ${d.ncm} — alíquota de IPI: motor ${d.valorCodigo} ≠ banco ${d.valorBanco}`;
      case 'monofasico':
        return `NCM ${d.ncm} — monofásico PIS/COFINS: motor ${d.valorCodigo} ≠ banco ${d.valorBanco}`;
      case 'mva_padrao':
        return `NCM ${d.ncm}: sujeito à ST com MVA inválido (${d.valorBanco})`;
    }
  });
}
