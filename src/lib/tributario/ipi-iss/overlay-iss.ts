/**
 * OVERLAY DE ISS MUNICIPAL — Camada defensiva entre o catálogo versionado no
 * banco (`aliquotas_iss_municipal`) e o motor de cálculo do ISS.
 *
 * Premissas normativas aplicadas na validação (todas de ordem constitucional/
 * complementar, portanto não configuráveis por dado de catálogo):
 *  - Piso de 2% — LC 116/2003, art. 8º-A (incluído pela LC 157/2016).
 *  - Teto de 5% — LC 116/2003, art. 8º, II.
 *  - Vigência: só entram registros vigentes na data de referência.
 *
 * Qualquer registro fora dessas faixas é REJEITADO e reportado; o motor
 * continua operando com a alíquota informada pelo usuário. Nunca silenciamos
 * um dado inválido, porque isso produziria imposto materialmente errado.
 *
 * Módulo puro: sem I/O, sem mutação das entradas.
 */

import { ISS_ALIQUOTA_MAXIMA, ISS_ALIQUOTA_MINIMA } from './tabelas';

/** Registro cru vindo do catálogo `aliquotas_iss_municipal`. */
export interface RegistroIssMunicipalBanco {
  codigo_ibge: number | string | null;
  municipio: string | null;
  uf: string | null;
  /** Item da lista da LC 116 (ex.: '1.01'); `null` = alíquota geral do município. */
  item_codigo?: string | null;
  aliquota: number | string | null;
  vigente_de?: string | null;
  vigente_ate?: string | null;
  base_legal?: string | null;
}

export type MotivoRejeicaoIss =
  | 'codigo_ibge_invalido'
  | 'municipio_invalido'
  | 'aliquota_invalida'
  | 'fora_da_faixa_legal'
  | 'vigencia_invalida'
  | 'duplicado';

export interface RejeicaoIss {
  codigoIbge: number | null;
  municipio: string | null;
  itemCodigo: string | null;
  motivo: MotivoRejeicaoIss;
  valor: number | string | null;
}

export interface AliquotaIssResolvida {
  codigoIbge: number;
  municipio: string;
  uf: string;
  /** `null` quando é a alíquota geral do município. */
  itemCodigo: string | null;
  aliquota: number;
  baseLegal: string | null;
}

export interface TabelaIssMunicipal {
  /** Chave: `${codigoIbge}|${itemCodigo ?? '*'}`. */
  porChave: Record<string, AliquotaIssResolvida>;
  /** Índice auxiliar por nome normalizado do município → código IBGE. */
  porNome: Record<string, number>;
}

export interface ResultadoOverlayIss {
  tabela: TabelaIssMunicipal;
  aceitas: AliquotaIssResolvida[];
  rejeitadas: RejeicaoIss[];
  /** Municípios distintos com ao menos uma alíquota válida. */
  municipiosCobertos: number;
}

const ISO_DATA = /^\d{4}-\d{2}-\d{2}$/;

function hojeIso(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Normaliza nome de município para busca (sem acentos, caixa baixa, sem UF). */
export function normalizarMunicipio(nome: string): string {
  return nome
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9 ]/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

/**
 * Normaliza alíquota vinda como fração (0.05), percentual (5) ou string ('5,00').
 * Retorna `null` quando não numérica finita ou negativa.
 */
export function normalizarAliquotaIss(valor: number | string | null | undefined): number | null {
  if (valor === null || valor === undefined) return null;
  const bruto = typeof valor === 'string' ? Number(valor.replace(',', '.')) : valor;
  if (!Number.isFinite(bruto) || bruto < 0) return null;
  // Heurística: acima de 1 o dado está em pontos percentuais.
  const fracao = bruto > 1 ? bruto / 100 : bruto;
  return Math.round(fracao * 1e6) / 1e6;
}

function chave(codigoIbge: number, itemCodigo: string | null): string {
  return `${codigoIbge}|${itemCodigo ?? '*'}`;
}

/** Constrói a tabela efetiva de ISS municipal a partir dos registros do banco. */
export function aplicarOverlayIss(
  registros: readonly RegistroIssMunicipalBanco[],
  referencia: string = hojeIso(),
): ResultadoOverlayIss {
  const porChave: Record<string, AliquotaIssResolvida> = {};
  const porNome: Record<string, number> = {};
  const aceitas: AliquotaIssResolvida[] = [];
  const rejeitadas: RejeicaoIss[] = [];
  const municipios = new Set<number>();

  for (const registro of registros ?? []) {
    const codigoIbge = Number(registro?.codigo_ibge);
    const itemCodigo = registro?.item_codigo?.toString().trim() || null;
    const municipio = registro?.municipio?.toString().trim() ?? null;

    if (!Number.isInteger(codigoIbge) || codigoIbge <= 0) {
      rejeitadas.push({ codigoIbge: null, municipio, itemCodigo, motivo: 'codigo_ibge_invalido', valor: registro?.codigo_ibge ?? null });
      continue;
    }
    if (!municipio) {
      rejeitadas.push({ codigoIbge, municipio, itemCodigo, motivo: 'municipio_invalido', valor: null });
      continue;
    }

    const de = registro.vigente_de ?? null;
    const ate = registro.vigente_ate ?? null;
    if ((de !== null && !ISO_DATA.test(de)) || (ate !== null && !ISO_DATA.test(ate))) {
      rejeitadas.push({ codigoIbge, municipio, itemCodigo, motivo: 'vigencia_invalida', valor: de ?? ate });
      continue;
    }
    const vigente = (de === null || de <= referencia) && (ate === null || ate >= referencia);
    if (!vigente) continue; // fora de vigência não é erro: apenas não se aplica hoje.

    const aliquota = normalizarAliquotaIss(registro.aliquota);
    if (aliquota === null) {
      rejeitadas.push({ codigoIbge, municipio, itemCodigo, motivo: 'aliquota_invalida', valor: registro.aliquota });
      continue;
    }
    if (aliquota < ISS_ALIQUOTA_MINIMA || aliquota > ISS_ALIQUOTA_MAXIMA) {
      rejeitadas.push({ codigoIbge, municipio, itemCodigo, motivo: 'fora_da_faixa_legal', valor: registro.aliquota });
      continue;
    }

    const k = chave(codigoIbge, itemCodigo);
    if (porChave[k]) {
      rejeitadas.push({ codigoIbge, municipio, itemCodigo, motivo: 'duplicado', valor: registro.aliquota });
      continue;
    }

    const resolvida: AliquotaIssResolvida = {
      codigoIbge,
      municipio,
      uf: (registro.uf ?? '').toString().trim().toUpperCase(),
      itemCodigo,
      aliquota,
      baseLegal: registro.base_legal?.toString().trim() || null,
    };

    porChave[k] = resolvida;
    porNome[normalizarMunicipio(municipio)] = codigoIbge;
    aceitas.push(resolvida);
    municipios.add(codigoIbge);
  }

  return {
    tabela: { porChave, porNome },
    aceitas,
    rejeitadas,
    municipiosCobertos: municipios.size,
  };
}

export const TABELA_ISS_VAZIA: TabelaIssMunicipal = { porChave: {}, porNome: {} };

/**
 * Resolve a alíquota do município para o item, com precedência:
 * 1. alíquota específica do item; 2. alíquota geral do município; 3. `null`.
 */
export function resolverAliquotaIss(
  tabela: TabelaIssMunicipal,
  identificacao: { codigoIbge?: number | null; municipio?: string | null },
  itemCodigo?: string | null,
): AliquotaIssResolvida | null {
  const codigoIbge =
    identificacao.codigoIbge && Number.isInteger(Number(identificacao.codigoIbge))
      ? Number(identificacao.codigoIbge)
      : identificacao.municipio
        ? (tabela.porNome[normalizarMunicipio(identificacao.municipio)] ?? null)
        : null;

  if (codigoIbge === null) return null;

  const item = itemCodigo?.toString().trim() || null;
  return tabela.porChave[chave(codigoIbge, item)] ?? tabela.porChave[chave(codigoIbge, null)] ?? null;
}

/* ------------------------------------------------------------------ */
/* Registro de runtime: o motor consome a tabela efetiva sem I/O.      */
/* ------------------------------------------------------------------ */

let tabelaEfetiva: TabelaIssMunicipal = TABELA_ISS_VAZIA;

/** Injeta a tabela validada (somente saída de `aplicarOverlayIss`). */
export function definirTabelaIssEfetiva(tabela: TabelaIssMunicipal): void {
  tabelaEfetiva = tabela ?? TABELA_ISS_VAZIA;
}

/** Restaura o estado inicial (sem catálogo) — usado em testes e no logout. */
export function resetarTabelaIssEfetiva(): void {
  tabelaEfetiva = TABELA_ISS_VAZIA;
}

export function obterTabelaIssEfetiva(): TabelaIssMunicipal {
  return tabelaEfetiva;
}

/** Atalho de runtime usado pelo motor/UI para sugerir a alíquota municipal. */
export function sugerirAliquotaMunicipal(
  identificacao: { codigoIbge?: number | null; municipio?: string | null },
  itemCodigo?: string | null,
): AliquotaIssResolvida | null {
  return resolverAliquotaIss(tabelaEfetiva, identificacao, itemCodigo);
}
