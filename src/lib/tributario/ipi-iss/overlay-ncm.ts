/**
 * OVERLAY DE NCM / TIPI — Camada defensiva entre o catálogo versionado no
 * banco (`ncms`) e o motor de cálculo do IPI.
 *
 * Racional: a TIPI embarcada em `tabelas.ts` é um recorte canônico, revisado a
 * cada decreto. O catálogo do banco é a fonte de verdade versionada e pode
 * cobrir mais posições (ou já refletir uma alteração de alíquota antes do
 * próximo deploy). Este módulo constrói a tabela EFETIVA combinando as duas,
 * mas jamais aceita um dado que produziria imposto materialmente errado:
 *
 *  - código deve ter exatamente 8 dígitos (NCM/SH — Decreto 11.158/2022);
 *  - alíquota de IPI deve ser finita, não negativa e ≤ 300% (teto observado na
 *    TIPI vigente é de 300% para cigarros — NCM 2402.20.00);
 *  - códigos duplicados são rejeitados (o primeiro válido prevalece), pois o
 *    índice de resolução por NCM é único por definição.
 *
 * Registros rejeitados NÃO derrubam o cálculo: o motor continua com a TIPI
 * embarcada e a rejeição é reportada ao painel administrativo de catálogos.
 *
 * Módulo puro: sem I/O, sem React, sem Supabase, sem mutação das entradas.
 */

import { TIPI, normalizarNcm } from './tabelas';
import type { ItemTipi, SituacaoIpi } from './types';

/** Recorte do registro de `ncms` relevante para o overlay de IPI. */
export interface RegistroNcmBanco {
  codigo: string | null;
  descricao?: string | null;
  aliquota_ipi: number | string | null;
  monofasico_pis_cofins?: boolean | null;
  sujeito_st?: boolean | null;
  mva_padrao?: number | string | null;
}

export type MotivoRejeicaoNcm =
  | 'codigo_invalido'
  | 'duplicado'
  | 'aliquota_invalida'
  | 'aliquota_fora_da_faixa';

export interface RejeicaoNcm {
  ncm: string;
  motivo: MotivoRejeicaoNcm;
  valor: number | string | null;
}

export interface AplicacaoNcm {
  ncm: string;
  campo: 'aliquota_ipi';
  valorCodigo: number;
  valorBanco: number;
}

export interface ResultadoOverlayNcm {
  /** Tabela efetiva a ser usada pelo motor (cópia; nunca muta a constante). */
  tabela: Record<string, ItemTipi>;
  /** Sobreposições sobre NCMs já conhecidos pela TIPI embarcada (banco ≠ código). */
  aplicadas: AplicacaoNcm[];
  /** NCMs presentes só no banco e incorporados à tabela efetiva. */
  adicionados: string[];
  /** Registros descartados por inconsistência, com o motivo. */
  rejeitadas: RejeicaoNcm[];
}

/**
 * Teto defensivo da alíquota de IPI. A maior alíquota ad valorem da TIPI
 * vigente é 300% (cigarros, NCM 2402.20.00); qualquer valor acima disso é
 * necessariamente erro de carga.
 */
export const IPI_ALIQUOTA_MAXIMA = 3;

const EPSILON = 1e-9;

function arredondar(v: number): number {
  return Math.round(v * 1e6) / 1e6;
}

/**
 * Normaliza a alíquota vinda como fração (0.0975), percentual (9.75) ou string
 * ('9,75'). Retorna `null` quando não numérica finita ou negativa.
 *
 * Heurística de escala: valores estritamente maiores que 1 são interpretados
 * como pontos percentuais. Isso é seguro porque nenhuma alíquota de IPI em
 * fração legítima ultrapassa 1 sem que 100% (=1) seja o próprio limite — e
 * 100% em fração e em percentual convergem para o mesmo caso de borda tratado
 * explicitamente aqui: `1` é lido como fração (100%), `100` como percentual.
 */
export function normalizarAliquotaIpi(valor: number | string | null | undefined): number | null {
  if (valor === null || valor === undefined) return null;
  // `Number('')` e `Number('   ')` são 0 — string vazia é ausência de dado, não zero.
  if (typeof valor === 'string' && valor.trim() === '') return null;
  const bruto = typeof valor === 'string' ? Number(valor.trim().replace(',', '.')) : valor;
  if (typeof bruto !== 'number' || !Number.isFinite(bruto) || bruto < 0) return null;
  return arredondar(bruto > 1 ? bruto / 100 : bruto);
}

/**
 * Deriva a situação do NCM na TIPI. Quando o NCM já é conhecido pelo motor,
 * preservamos a situação canônica (imune/NT/alíquota zero são qualificações
 * jurídicas distintas que o catálogo, hoje, não carrega). Para NCMs novos,
 * caímos na leitura conservadora: alíquota zero ⇒ `aliquota_zero`.
 */
function derivarSituacao(aliquota: number, base?: ItemTipi): SituacaoIpi {
  if (base) {
    // Se o banco passou a tributar um NCM antes NT/imune/zero, a situação vira tributada.
    if (aliquota > EPSILON) return 'tributada';
    return base.situacao === 'tributada' ? 'aliquota_zero' : base.situacao;
  }
  return aliquota > EPSILON ? 'tributada' : 'aliquota_zero';
}

/**
 * Constrói a tabela de IPI efetiva combinando a TIPI embarcada (base canônica)
 * com o catálogo `ncms` do banco. Função pura: não realiza I/O.
 */
export function aplicarOverlayNcm(
  registros: readonly RegistroNcmBanco[],
  base: readonly ItemTipi[] = TIPI,
): ResultadoOverlayNcm {
  const tabela: Record<string, ItemTipi> = {};
  for (const item of base) tabela[normalizarNcm(item.ncm)] = { ...item };

  const aplicadas: AplicacaoNcm[] = [];
  const adicionados: string[] = [];
  const rejeitadas: RejeicaoNcm[] = [];
  const vistos = new Set<string>();

  for (const registro of registros ?? []) {
    const bruto = (registro?.codigo ?? '').toString();
    const codigo = normalizarNcm(bruto);

    if (codigo.length !== 8) {
      rejeitadas.push({ ncm: bruto.trim(), motivo: 'codigo_invalido', valor: codigo.length });
      continue;
    }
    if (vistos.has(codigo)) {
      rejeitadas.push({ ncm: codigo, motivo: 'duplicado', valor: bruto.trim() });
      continue;
    }
    vistos.add(codigo);

    const aliquota = normalizarAliquotaIpi(registro.aliquota_ipi);
    if (aliquota === null) {
      rejeitadas.push({ ncm: codigo, motivo: 'aliquota_invalida', valor: registro.aliquota_ipi ?? null });
      continue;
    }
    if (aliquota > IPI_ALIQUOTA_MAXIMA + EPSILON) {
      rejeitadas.push({ ncm: codigo, motivo: 'aliquota_fora_da_faixa', valor: registro.aliquota_ipi ?? null });
      continue;
    }

    const atual = tabela[codigo];
    const descricao = (registro.descricao ?? '').toString().trim() || atual?.descricao || `NCM ${codigo}`;

    if (!atual) {
      tabela[codigo] = {
        ncm: codigo,
        descricao,
        aliquota,
        situacao: derivarSituacao(aliquota),
      };
      adicionados.push(codigo);
      continue;
    }

    if (Math.abs(arredondar(atual.aliquota) - aliquota) > EPSILON) {
      aplicadas.push({ ncm: codigo, campo: 'aliquota_ipi', valorCodigo: atual.aliquota, valorBanco: aliquota });
      tabela[codigo] = {
        ...atual,
        aliquota,
        situacao: derivarSituacao(aliquota, atual),
      };
    }
  }

  return { tabela, aplicadas, adicionados, rejeitadas };
}

/** Traduz as rejeições em mensagens legíveis para o painel administrativo. */
export function descreverRejeicoesNcm(rejeicoes: readonly RejeicaoNcm[]): string[] {
  return rejeicoes.map((r) => {
    switch (r.motivo) {
      case 'codigo_invalido':
        return `NCM "${r.ncm}": código fora do formato de 8 dígitos — registro ignorado pelo motor`;
      case 'duplicado':
        return `NCM ${r.ncm}: código duplicado no catálogo — prevaleceu a primeira ocorrência`;
      case 'aliquota_invalida':
        return `NCM ${r.ncm}: alíquota de IPI não numérica ou negativa (${r.valor})`;
      case 'aliquota_fora_da_faixa':
        return `NCM ${r.ncm}: alíquota de IPI ${r.valor} acima do teto de 300% da TIPI`;
    }
  });
}
